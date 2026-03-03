/**
 * 📋 EXAMPLE: Tax Returns Module with RBAC Implementation
 * 
 * This example shows how to implement a complete new module with RBAC permissions
 */

// ═══════════════════════════════════════════════════════════
// 1. ADD MODULE TO CONSTANTS (src/constants/modulePermissions.ts)
// ═══════════════════════════════════════════════════════════

export const MODULE_CONFIGS = {
  // ... existing modules
  taxReturns: {
    name: 'taxReturns',
    displayName: 'Tax Returns Management',
    permissions: [
      PERMISSION_TYPES.CREATE,   // Create tax returns
      PERMISSION_TYPES.VIEW,     // View tax returns
      PERMISSION_TYPES.EDIT,     // Edit tax returns
      PERMISSION_TYPES.DELETE,   // Delete tax returns
      PERMISSION_TYPES.APPROVE,  // Approve tax returns
      PERMISSION_TYPES.EXPORT,   // Export tax returns
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// 2. CREATE ROUTES WITH RBAC (src/modules/taxReturns/routes.ts)
// ═══════════════════════════════════════════════════════════

import { Router } from 'express';
import { authorize } from '@/middleware/authorize';
import { 
  requirePermission, 
  requireAllPermissions, 
  requireAnyPermission 
} from '@/middleware/rbac';
import {
  getTaxReturnsController,
  createTaxReturnController,
  updateTaxReturnController,
  deleteTaxReturnController,
  approveTaxReturnController,
  exportTaxReturnsController,
  getTaxReturnDetailsController,
} from './services';

const router = Router();

// View all tax returns - requires taxReturns:view
router.get('/', 
  authorize('ADMIN', 'USER'),
  requirePermission('taxReturns', 'view'),
  getTaxReturnsController
);

// Get specific tax return details - requires taxReturns:view
router.get('/:id', 
  authorize('ADMIN', 'USER'),
  requirePermission('taxReturns', 'view'),
  getTaxReturnDetailsController
);

// Create new tax return - requires taxReturns:create
router.post('/', 
  authorize('ADMIN', 'USER'),
  requirePermission('taxReturns', 'create'),
  createTaxReturnController
);

// Update tax return - requires taxReturns:edit
router.put('/:id', 
  authorize('ADMIN', 'USER'),
  requirePermission('taxReturns', 'edit'),
  updateTaxReturnController
);

// Delete tax return - requires taxReturns:delete (high-level permission)
router.delete('/:id', 
  authorize('ADMIN'),
  requirePermission('taxReturns', 'delete'),
  deleteTaxReturnController
);

// Approve tax return - requires both view and approve permissions
router.post('/:id/approve', 
  authorize('ADMIN'),
  requireAllPermissions([
    ['taxReturns', 'view'],
    ['taxReturns', 'approve']
  ]),
  approveTaxReturnController
);

// Export tax returns - either export permission or view (for basic users)
router.get('/export/csv', 
  authorize('ADMIN', 'USER'),
  requireAnyPermission([
    ['taxReturns', 'export'],
    ['taxReturns', 'view']  // Fallback for users without export permission
  ]),
  exportTaxReturnsController
);

export default router;

// ═══════════════════════════════════════════════════════════
// 3. IMPLEMENT SERVICES WITH PERMISSION CHECKS (src/modules/taxReturns/services.ts)
// ═══════════════════════════════════════════════════════════

import { checkUserPermission } from '@/modules/rbac/services';
import { serviceHandler } from '@/utils/serviceHandler';
import { z } from 'zod';

// Get tax return details with ownership/permission checks
export const getTaxReturnDetailsController = serviceHandler(
  z.object({
    params: z.object({
      id: z.string().uuid(),
    }),
  }),
  async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the tax return
    const taxReturn = await db.query.taxReturns.findFirst({
      where: eq(models.taxReturns.id, id),
      with: {
        user: true,
      },
    });

    if (!taxReturn) {
      throw new ApiError('Tax return not found', 404);
    }

    // Check permissions: users can view their own returns, or admin can view any
    const isOwner = taxReturn.userId === userId;
    const canViewOthers = await checkUserPermission(userId, 'taxReturns', 'view');

    if (!isOwner && !canViewOthers) {
      throw new ApiError('Access denied. You can only view your own tax returns.', 403);
    }

    return res.success('Tax return details retrieved', { taxReturn });
  }
);

// Create tax return with permission validation
export const createTaxReturnController = serviceHandler(
  z.object({
    body: z.object({
      taxYear: z.number().min(2020).max(2030),
      income: z.number().min(0),
      deductions: z.number().min(0),
      // ... other fields
    }),
  }),
  async (req, res) => {
    const userId = req.user.id;
    const { taxYear, income, deductions } = req.body;

    // Permission already checked by middleware, but could add additional logic
    // For example, check if user can create returns for this tax year
    const canCreateForYear = await checkBusinessRule(userId, taxYear);
    if (!canCreateForYear) {
      throw new ApiError('Cannot create tax return for this year', 400);
    }

    const taxReturn = await db.insert(models.taxReturns).values({
      userId,
      taxYear,
      income,
      deductions,
      status: 'draft',
      createdAt: new Date(),
    }).returning();

    return res.success('Tax return created successfully', { taxReturn: taxReturn[0] });
  }
);

// Update with ownership and permission checks
export const updateTaxReturnController = serviceHandler(
  z.object({
    params: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      income: z.number().min(0).optional(),
      deductions: z.number().min(0).optional(),
      // ... other updateable fields
    }),
  }),
  async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Get existing tax return
    const existingReturn = await db.query.taxReturns.findFirst({
      where: eq(models.taxReturns.id, id),
    });

    if (!existingReturn) {
      throw new ApiError('Tax return not found', 404);
    }

    // Permission check: users can edit their own, admin can edit any
    const isOwner = existingReturn.userId === userId;
    const canEditOthers = await checkUserPermission(userId, 'taxReturns', 'edit');

    if (!isOwner && !canEditOthers) {
      throw new ApiError('Access denied. You can only edit your own tax returns.', 403);
    }

    // Additional business rule: only draft returns can be edited
    if (existingReturn.status !== 'draft') {
      // Check if user has special permission to edit submitted returns
      const canEditSubmitted = await checkUserPermission(userId, 'taxReturns', 'approve');
      if (!canEditSubmitted) {
        throw new ApiError('Cannot edit submitted tax returns', 400);
      }
    }

    const updatedReturn = await db
      .update(models.taxReturns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(models.taxReturns.id, id))
      .returning();

    return res.success('Tax return updated successfully', { taxReturn: updatedReturn[0] });
  }
);

// Approve with strict permission requirements
export const approveTaxReturnController = serviceHandler(
  z.object({
    params: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      approvalNotes: z.string().optional(),
    }),
  }),
  async (req, res) => {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    const userId = req.user.id;

    // Permissions already checked by middleware (requireAllPermissions)
    
    const taxReturn = await db.query.taxReturns.findFirst({
      where: eq(models.taxReturns.id, id),
    });

    if (!taxReturn) {
      throw new ApiError('Tax return not found', 404);
    }

    if (taxReturn.status !== 'submitted') {
      throw new ApiError('Only submitted tax returns can be approved', 400);
    }

    // Update status and record approval
    const updatedReturn = await db
      .update(models.taxReturns)
      .set({
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        approvalNotes,
        updatedAt: new Date(),
      })
      .where(eq(models.taxReturns.id, id))
      .returning();

    // Log the approval action
    await logAuditAction({
      userId,
      action: 'APPROVE_TAX_RETURN',
      resourceId: id,
      details: { approvalNotes },
    });

    return res.success('Tax return approved successfully', { taxReturn: updatedReturn[0] });
  }
);

// ═══════════════════════════════════════════════════════════
// 4. USER DASHBOARD WITH CONDITIONAL FEATURES
// ═══════════════════════════════════════════════════════════

export const getTaxDashboardController = serviceHandler(
  z.object({}),
  async (req, res) => {
    const userId = req.user.id;
    
    // Get user's permissions for this module
    const { modulePermissions } = await getUserPermissionsByModule(userId);
    const taxPermissions = modulePermissions.taxReturns || [];

    const dashboardData = {
      // Basic data everyone can see (if they have module access)
      userTaxReturns: [],
      currentTaxYear: new Date().getFullYear(),
    };

    // Get user's own tax returns (always allowed)
    dashboardData.userTaxReturns = await db.query.taxReturns.findMany({
      where: eq(models.taxReturns.userId, userId),
    });

    // Add admin features based on permissions
    if (taxPermissions.includes('view')) {
      // Can view all tax returns
      dashboardData.allTaxReturns = await db.query.taxReturns.findMany({
        with: { user: true },
      });
    }

    if (taxPermissions.includes('approve')) {
      // Show pending approvals
      dashboardData.pendingApprovals = await db.query.taxReturns.findMany({
        where: eq(models.taxReturns.status, 'submitted'),
      });
    }

    if (taxPermissions.includes('export')) {
      // Show export options
      dashboardData.exportOptions = [
        { type: 'csv', label: 'Export to CSV' },
        { type: 'pdf', label: 'Export to PDF' },
      ];
    }

    return res.success('Dashboard data retrieved', { 
      dashboardData,
      permissions: taxPermissions,  // Send permissions to frontend
    });
  }
);

// ═══════════════════════════════════════════════════════════
// 5. HELPER FUNCTIONS FOR COMPLEX PERMISSION LOGIC
// ═══════════════════════════════════════════════════════════

// Check if user can perform action on specific resource
export const canUserAccessTaxReturn = async (
  userId: string, 
  taxReturnId: string, 
  action: string
): Promise<boolean> => {
  // Get the tax return
  const taxReturn = await db.query.taxReturns.findFirst({
    where: eq(models.taxReturns.id, taxReturnId),
  });

  if (!taxReturn) {
    return false;
  }

  // Owner always has access (except for some restricted actions)
  const isOwner = taxReturn.userId === userId;
  
  // Check RBAC permission
  const hasPermission = await checkUserPermission(userId, 'taxReturns', action);

  // Different logic for different actions
  switch (action) {
    case 'view':
    case 'edit':
      return isOwner || hasPermission;
    
    case 'delete':
    case 'approve':
      return hasPermission; // Only admins with specific permissions
    
    default:
      return hasPermission;
  }
};

// ═══════════════════════════════════════════════════════════
// 6. FRONTEND INTEGRATION EXAMPLE
// ═══════════════════════════════════════════════════════════

/*
// Frontend component would receive permissions and conditionally render UI

const TaxReturnsList = ({ taxReturns, permissions }) => {
  const canCreate = permissions.includes('create');
  const canEdit = permissions.includes('edit');
  const canDelete = permissions.includes('delete');
  const canApprove = permissions.includes('approve');

  return (
    <div>
      {canCreate && (
        <Button onClick={createNewTaxReturn}>
          Create New Tax Return
        </Button>
      )}
      
      {taxReturns.map(taxReturn => (
        <TaxReturnCard 
          key={taxReturn.id}
          taxReturn={taxReturn}
          canEdit={canEdit}
          canDelete={canDelete}
          canApprove={canApprove && taxReturn.status === 'submitted'}
        />
      ))}
    </div>
  );
};
*/

// ═══════════════════════════════════════════════════════════
// 7. TESTING RBAC IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

/*
// Test cases for RBAC implementation

describe('Tax Returns RBAC', () => {
  it('should allow users to view their own tax returns', async () => {
    const user = await createTestUser({ roleId: userRoleId });
    const taxReturn = await createTestTaxReturn({ userId: user.id });
    
    const response = await request(app)
      .get(`/api/tax-returns/${taxReturn.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);
      
    expect(response.body.data.taxReturn.id).toBe(taxReturn.id);
  });
  
  it('should deny users access to other users tax returns', async () => {
    const user1 = await createTestUser({ roleId: userRoleId });
    const user2 = await createTestUser({ roleId: userRoleId });
    const taxReturn = await createTestTaxReturn({ userId: user2.id });
    
    await request(app)
      .get(`/api/tax-returns/${taxReturn.id}`)
      .set('Authorization', `Bearer ${user1.token}`)
      .expect(403);
  });
  
  it('should allow admins to approve tax returns', async () => {
    const admin = await createTestUser({ roleId: adminRoleId });
    const taxReturn = await createTestTaxReturn({ status: 'submitted' });
    
    await request(app)
      .post(`/api/tax-returns/${taxReturn.id}/approve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ approvalNotes: 'Approved by admin' })
      .expect(200);
  });
});
*/
