import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import { z } from 'zod';

import { MODULE_CONFIGS } from '@/constants/modulePermissions';
import { db, models } from '@/database';
import { deleteFile, getPresignedGetObjectUrl } from '@/integrations/awsS3';
import ApiError from '@/utils/apiError';
import { generateUniqueSlug } from '@/utils/blogUtils';
import { getNextVersion } from '@/utils/getNextVersion';
import { serviceHandler } from '@/utils/serviceHandler';

import {
  createCarouselImageSchema,
  createDocumentCategorySchema,
  createDocumentTemplateSchema,
  createFaqSchema,
  createPolicySchema,
  createQueryCategorySchema,
  createSocialMediaSchema,
  createTaxCreditSchema,
  deleteCarouselImageSchema,
  deleteDocumentCategorySchema,
  deleteDocumentTemplateSchema,
  deleteFaqSchema,
  deletePolicySchema,
  deleteQueryCategorySchema,
  deleteSocialMediaSchema,
  deleteTaxCreditSchema,
  getActivePolicySchema,
  idParamSchema,
  updateDocumentCategorySchema,
  updateDocumentTemplateSchema,
  updateFaqSchema,
  updatePolicySchema,
  updateQueryCategorySchema,
  updateSiteContentsSchema,
  updateSocialMediaSchema,
  updateTaxCreditSchema,
} from './validations';

// =======================
// FAQ Services
// =======================

export const listFaqs = serviceHandler(z.object({}), async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const faqs = await db.query.faqs.findMany({
    where: isNull(models.faqs.deletedAt),
    orderBy: desc(models.faqs.createdAt),
    limit,
    offset,
  });

  const totalCount = await db.$count(models.faqs, isNull(models.faqs.deletedAt));

  return res.data('FAQs retrieved successfully', faqs, {
    page,
    size,
    total: totalCount,
  });
});

export const createFaq = serviceHandler(createFaqSchema, async (req, res) => {
  const { question, answer, status = true } = req.body;

  const [faq] = await db
    .insert(models.faqs)
    .values({
      question,
      answer,
      status,
    })
    .returning();

  return res.success('FAQ created successfully', faq);
});

export const updateFaq = serviceHandler(updateFaqSchema, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if FAQ exists
  const existingFaq = await db.query.faqs.findFirst({
    where: and(eq(models.faqs.id, id), isNull(models.faqs.deletedAt)),
  });

  if (!existingFaq) {
    throw new ApiError('FAQ not found', 404);
  }

  const [updatedFaq] = await db
    .update(models.faqs)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(models.faqs.id, id))
    .returning();

  return res.success('FAQ updated successfully', updatedFaq);
});

export const deleteFaq = serviceHandler(deleteFaqSchema, async (req, res) => {
  const { id } = req.params;

  // Check if FAQ exists
  const existingFaq = await db.query.faqs.findFirst({
    where: and(eq(models.faqs.id, id), isNull(models.faqs.deletedAt)),
  });

  if (!existingFaq) {
    throw new ApiError('FAQ not found', 404);
  }

  await db.update(models.faqs).set({ deletedAt: new Date() }).where(eq(models.faqs.id, id));

  return res.success('FAQ deleted successfully');
});

export const getSingleFaq = serviceHandler(idParamSchema, async (req, res) => {
  const { id } = req.params;

  const faq = await db.query.faqs.findFirst({
    where: and(eq(models.faqs.id, id), isNull(models.faqs.deletedAt)),
  });

  if (!faq) {
    throw new ApiError('FAQ not found', 404);
  }

  return res.success('FAQ retrieved successfully', faq);
});

// =======================
// Social Media Services
// =======================

export const listSocialMedias = serviceHandler(z.object({}), async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const [socialMedias, totalCount] = await Promise.all([
    db.query.socialMedias.findMany({
      columns: { iconId: false },
      orderBy: desc(models.socialMedias.createdAt),
      limit,
      offset,
      with: {
        icon: { columns: { id: true, key: true, mimeType: true, createdAt: true } },
      },
    }),
    db.$count(models.socialMedias),
  ]);

  // Attach presigned filePath for each icon (if present)
  const socialMediasWithUrls = await Promise.all(
    socialMedias.map(async (sm) => {
      if (sm.icon?.key) {
        try {
          const filePath = await getPresignedGetObjectUrl(sm.icon.key);
          return { ...sm, icon: { ...sm.icon, filePath } };
        } catch (err) {
          console.warn('Failed to generate presigned icon URL for social media:', sm.id, err);
        }
      }
      return sm;
    })
  );

  return res.data('Social media links retrieved successfully', socialMediasWithUrls, {
    page,
    size,
    total: totalCount,
  });
});

export const createSocialMedia = serviceHandler(createSocialMediaSchema, async (req, res) => {
  const { platform, url } = req.body;

  // Create social media entity without icon initially
  // Icon will be associated through the files API after creation
  const [socialMedia] = await db
    .insert(models.socialMedias)
    .values({
      platform,
      url,
      // iconId will be set when file is uploaded via files API
    })
    .returning();

  return res.success('Social media link created successfully', socialMedia);
});

export const updateSocialMedia = serviceHandler(updateSocialMediaSchema, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if social media exists
  const existingSocialMedia = await db.query.socialMedias.findFirst({
    where: eq(models.socialMedias.id, id),
  });

  if (!existingSocialMedia) {
    throw new ApiError('Social media link not found', 404);
  }

  const [updatedSocialMedia] = await db
    .update(models.socialMedias)
    .set(updateData)
    .where(eq(models.socialMedias.id, id))
    .returning();

  return res.success('Social media link updated successfully', updatedSocialMedia);
});

export const deleteSocialMedia = serviceHandler(deleteSocialMediaSchema, async (req, res) => {
  const { id } = req.params;

  // Check if social media exists
  const existingSocialMedia = await db.query.socialMedias.findFirst({
    where: eq(models.socialMedias.id, id),
  });

  if (!existingSocialMedia) {
    throw new ApiError('Social media link not found', 404);
  }

  await db.delete(models.socialMedias).where(eq(models.socialMedias.id, id));

  return res.success('Social media link deleted successfully');
});

// =======================
// Tax Credits Services
// =======================

export const listTaxCredits = serviceHandler(z.object({}), async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  // convert db calls to promise.all
  const [taxCredits, totalCount] = await Promise.all([
    db.query.tax_credits.findMany({
      where: isNull(models.tax_credits.deletedAt),
      orderBy: desc(models.tax_credits.createdAt),
      limit,
      offset,
      with: {
        icon: { columns: { id: true, key: true, mimeType: true, createdAt: true } },
      },
    }),
    db.$count(models.tax_credits, isNull(models.tax_credits.deletedAt)),
  ]);

  // Attach presigned filePath for each icon (if present)
  const taxCreditsWithUrls = await Promise.all(
    taxCredits.map(async (tc) => {
      if (tc.icon?.key) {
        try {
          const filePath = await getPresignedGetObjectUrl(tc.icon.key);
          return { ...tc, icon: { ...tc.icon, filePath } };
        } catch (err) {
          console.warn('Failed to generate presigned icon URL for tax credit:', tc.id, err);
        }
      }
      return tc;
    })
  );

  return res.data('Tax credits retrieved successfully', taxCreditsWithUrls, {
    page,
    size,
    total: totalCount,
  });
});

export const createTaxCredit = serviceHandler(createTaxCreditSchema, async (req, res) => {
  const { name, description, details, status = true } = req.body;

  // Generate unique slug from name
  const checkSlugExists = async (slug: string): Promise<boolean> => {
    const existing = await db.query.tax_credits.findFirst({
      where: eq(models.tax_credits.slug, slug),
    });
    return !!existing;
  };

  const slug = await generateUniqueSlug(name, checkSlugExists);

  // Create tax credit entity without icon initially
  // Icon will be associated through the files API after creation
  const [taxCredit] = await db
    .insert(models.tax_credits)
    .values({
      name,
      slug,
      description,
      details,
      status,
    })
    .returning();

  return res.success('Tax credit created successfully', taxCredit);
});

export const updateTaxCredit = serviceHandler(updateTaxCreditSchema, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if tax credit exists
  const existingTaxCredit = await db.query.tax_credits.findFirst({
    where: and(eq(models.tax_credits.id, id), isNull(models.tax_credits.deletedAt)),
  });

  if (!existingTaxCredit) {
    throw new ApiError('Tax credit not found', 404);
  }

  let processedUpdateData: Record<string, string | boolean | Date | undefined> = {
    ...updateData,
    updatedAt: new Date(),
  };

  // If name is being updated, regenerate slug
  if (updateData.name) {
    const checkSlugExists = async (slug: string): Promise<boolean> => {
      const existing = await db.query.tax_credits.findFirst({
        where: and(
          eq(models.tax_credits.slug, slug),
          // isNull(models.tax_credits.deletedAt),
          ne(models.tax_credits.id, id) // Exclude current tax credit
        ),
      });
      return !!existing;
    };

    const newSlug = await generateUniqueSlug(updateData.name, checkSlugExists);
    processedUpdateData = { ...processedUpdateData, slug: newSlug };
  }

  const [updatedTaxCredit] = await db
    .update(models.tax_credits)
    .set(processedUpdateData)
    .where(eq(models.tax_credits.id, id))
    .returning();

  return res.success('Tax credit updated successfully', updatedTaxCredit);
});

export const deleteTaxCredit = serviceHandler(deleteTaxCreditSchema, async (req, res) => {
  const { id } = req.params;

  // Check if tax credit exists
  const existingTaxCredit = await db.query.tax_credits.findFirst({
    where: and(eq(models.tax_credits.id, id), isNull(models.tax_credits.deletedAt)),
  });

  if (!existingTaxCredit) {
    throw new ApiError('Tax credit not found', 404);
  }

  await db
    .update(models.tax_credits)
    .set({ deletedAt: new Date() })
    .where(eq(models.tax_credits.id, id));

  return res.success('Tax credit deleted successfully');
});

export const getSingleTaxCredit = serviceHandler(idParamSchema, async (req, res) => {
  const { id } = req.params;

  const taxCredit = await db.query.tax_credits.findFirst({
    where: and(eq(models.tax_credits.id, id), isNull(models.tax_credits.deletedAt)),
  });

  if (!taxCredit) {
    throw new ApiError('Tax credit not found', 404);
  }

  return res.success('Tax credit retrieved successfully', taxCredit);
});

// =======================
// Carousel Images Services
// =======================

export const listCarouselImages = serviceHandler(z.object({}), async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const [carouselImages, totalCount] = await Promise.all([
    db.query.carouselImages.findMany({
      orderBy: desc(models.carouselImages.createdAt),
      limit,
      offset,
      with: {
        image: { columns: { id: true, key: true, mimeType: true, createdAt: true } },
      },
    }),
    db.$count(models.carouselImages),
  ]);

  // Attach presigned filePath for each carousel image (if present)
  const carouselImagesWithUrls = await Promise.all(
    carouselImages.map(async (ci) => {
      if (ci.image?.key) {
        try {
          const filePath = await getPresignedGetObjectUrl(ci.image.key);
          return { ...ci, image: { ...ci.image, filePath } };
        } catch (err) {
          console.warn('Failed to generate presigned image URL for carousel image:', ci.id, err);
        }
      }
      return ci;
    })
  );

  return res.data('Carousel images retrieved successfully', carouselImagesWithUrls, {
    page,
    size,
    total: totalCount,
  });
});

export const createCarouselImage = serviceHandler(createCarouselImageSchema, async () => {
  // For carousel images, we create the entity AFTER the file is uploaded
  // This service should not be called directly - instead use the files API
  // with uploadType: "carousel" which will create both the file and the carousel entity

  throw new ApiError(
    'Carousel images must be created through the files upload API. Use POST /api/v1/files/request-presigned-url with uploadType: "carousel"',
    400
  );
});

export const deleteCarouselImage = serviceHandler(deleteCarouselImageSchema, async (req, res) => {
  const { id } = req.params;

  const existingCarouselImage = await db.query.carouselImages.findFirst({
    where: eq(models.carouselImages.id, id),
    with: { image: true },
  });

  if (!existingCarouselImage) {
    throw new ApiError('Carousel image not found', 404);
  }

  await db.delete(models.carouselImages).where(eq(models.carouselImages.id, id));
  // delete carousel image from s3
  if (existingCarouselImage.image?.key) {
    await deleteFile(existingCarouselImage.image.key);
  }

  return res.success('Carousel image deleted successfully');
});

// =======================
// Document Templates Services
// =======================

export const listDocumentTemplates = serviceHandler(z.object({}), async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const [documentTemplates, totalCount] = await Promise.all([
    db.query.documentTemplates.findMany({
      where: isNull(models.documentTemplates.deletedAt),
      orderBy: desc(models.documentTemplates.createdAt),
      limit,
      offset,
      with: {
        templateFile: true,
      },
    }),
    db.$count(models.documentTemplates, isNull(models.documentTemplates.deletedAt)),
  ]);

  // Attach presigned filePath for each document template (if present)
  const documentTemplatesWithUrls = await Promise.all(
    documentTemplates.map(async (dt) => {
      if (dt.templateFile?.key) {
        try {
          const filePath = await getPresignedGetObjectUrl(dt.templateFile.key);
          return { ...dt, templateFile: { ...dt.templateFile, filePath } };
        } catch (err) {
          console.warn('Failed to generate presigned URL for document template:', dt.id, err);
        }
      }
      return dt;
    })
  );

  return res.data('Document templates retrieved successfully', documentTemplatesWithUrls, {
    page,
    size,
    total: totalCount,
  });
});

export const createDocumentTemplate = serviceHandler(createDocumentTemplateSchema, async () => {
  // For document templates, we create the entity AFTER the file is uploaded
  // This service should not be called directly - instead use the files API
  // with uploadType: "document-template" which will create both the file and the template entity

  throw new ApiError(
    'Document templates must be created through the files upload API. Use POST /api/v1/files/request-presigned-url with uploadType: "document-template"',
    400
  );
});

export const updateDocumentTemplate = serviceHandler(
  updateDocumentTemplateSchema,
  async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingTemplate = await db.query.documentTemplates.findFirst({
      where: and(eq(models.documentTemplates.id, id), isNull(models.documentTemplates.deletedAt)),
    });

    if (!existingTemplate) {
      throw new ApiError('Document template not found', 404);
    }

    if (updateData.name && updateData.name !== existingTemplate.name) {
      const nameExists = await db.query.documentTemplates.findFirst({
        where: and(
          eq(models.documentTemplates.name, updateData.name),
          isNull(models.documentTemplates.deletedAt)
        ),
      });

      if (nameExists) {
        throw new ApiError('Document template with this name already exists', 400);
      }
    }

    const [updatedTemplate] = await db
      .update(models.documentTemplates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(models.documentTemplates.id, id))
      .returning();

    return res.success('Document template updated successfully', updatedTemplate);
  }
);

export const deleteDocumentTemplate = serviceHandler(
  deleteDocumentTemplateSchema,
  async (req, res) => {
    const { id } = req.params;

    const existingTemplate = await db.query.documentTemplates.findFirst({
      where: and(eq(models.documentTemplates.id, id), isNull(models.documentTemplates.deletedAt)),
    });

    if (!existingTemplate) {
      throw new ApiError('Document template not found', 404);
    }

    await db
      .update(models.documentTemplates)
      .set({ deletedAt: new Date() })
      .where(eq(models.documentTemplates.id, id));

    return res.success('Document template deleted successfully');
  }
);

// =======================
// Policies Services
// =======================

export const listPolicies = serviceHandler(z.object({}), async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const policies = await db.query.policies.findMany({
    where: isNull(models.policies.deletedAt),
    orderBy: [desc(models.policies.isActive), desc(models.policies.effectiveDate)],
    limit,
    offset,
  });

  const totalCount = await db.$count(models.policies, isNull(models.policies.deletedAt));

  return res.data('Policies retrieved successfully', policies, {
    page,
    size,
    total: totalCount,
  });
});

export const createPolicy = serviceHandler(createPolicySchema, async (req, res) => {
  const { type, content } = req.body;

  // Get the latest policy of this type to determine next policy number and version
  const latestPolicy = await db.query.policies.findFirst({
    where: and(eq(models.policies.type, type)),
    orderBy: [desc(models.policies.policyNo), desc(models.policies.createdAt)],
    columns: { policyNo: true, version: true },
  });

  // Generate policyNo: start from 1 or increment from latest
  const policyNo = latestPolicy ? latestPolicy.policyNo + 1 : 1;

  // Generate version: start from "1.0" or bump minor version
  const version = latestPolicy ? getNextVersion(latestPolicy.version, 'minor') : '1.0';

  // Use transaction to ensure data consistency
  const policy = await db.transaction(async (tx) => {
    const currentDate = new Date();

    // Deactivate all other policies of this type
    await tx.update(models.policies).set({ isActive: false }).where(eq(models.policies.type, type));

    // Create the new policy
    const [newPolicy] = await tx
      .insert(models.policies)
      .values({
        policyNo,
        type,
        content,
        version,
        effectiveDate: currentDate, // Same as createdAt
        isActive: true,
        createdAt: currentDate,
      })
      .returning();

    return newPolicy;
  });

  return res.success('Policy created successfully', policy);
});

export const updatePolicy = serviceHandler(updatePolicySchema, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const existingPolicy = await db.query.policies.findFirst({
    where: and(eq(models.policies.id, id), isNull(models.policies.deletedAt)),
  });

  if (!existingPolicy) {
    throw new ApiError('Policy not found', 404);
  }

  const policyType = existingPolicy.type;

  // Generate policyNo: Increment from latest
  const policyNo = existingPolicy.policyNo + 1;

  // Generate version: Bump minor version
  const version = getNextVersion(existingPolicy.version, 'minor');

  // Use transaction to ensure data consistency
  const updatedPolicy = await db.transaction(async (tx) => {
    // First, deactivate all other policies of this type
    await tx
      .update(models.policies)
      .set({ isActive: false })
      .where(and(eq(models.policies.type, policyType), isNull(models.policies.deletedAt)));

    // Then, insert the new policy as active
    const [newPolicy] = await tx
      .insert(models.policies)
      .values({
        content,
        policyNo,
        version,
        type: policyType,
        isActive: true,
        effectiveDate: new Date(),
      })
      .returning();

    return newPolicy;
  });

  return res.success('Policy updated successfully', updatedPolicy);
});

export const deletePolicy = serviceHandler(deletePolicySchema, async (req, res) => {
  const { id } = req.params;

  const existingPolicy = await db.query.policies.findFirst({
    where: and(eq(models.policies.id, id), isNull(models.policies.deletedAt)),
  });

  if (!existingPolicy) {
    throw new ApiError('Policy not found', 404);
  }

  await db.update(models.policies).set({ deletedAt: new Date() }).where(eq(models.policies.id, id));

  return res.success('Policy deleted successfully');
});

export const getActivePolicyByType = serviceHandler(getActivePolicySchema, async (req, res) => {
  const { type } = req.query;

  // Type assertion since we know it's validated by the schema
  const policyType = type as
    | 'privacy_policy'
    | 'cookies_policy'
    | 'fee_structure'
    | 'terms_and_condition';

  const activePolicy = await db.query.policies.findFirst({
    where: and(
      eq(models.policies.type, policyType),
      eq(models.policies.isActive, true),
      isNull(models.policies.deletedAt)
    ),
    orderBy: desc(models.policies.effectiveDate),
  });

  if (!activePolicy) {
    throw new ApiError(`No active ${policyType} policy found`, 404);
  }

  return res.success('Active policy retrieved successfully', activePolicy);
});

// =======================
// Query Categories Services
// =======================

export const listQueryCategories = serviceHandler(z.object({}), async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const queryCategories = await db.query.queryCategories.findMany({
    where: isNull(models.queryCategories.deletedAt),
    orderBy: desc(models.queryCategories.createdAt),
    limit,
    offset,
  });

  const totalCount = await db.$count(
    models.queryCategories,
    isNull(models.queryCategories.deletedAt)
  );

  return res.data('Query categories retrieved successfully', queryCategories, {
    page,
    size,
    total: totalCount,
  });
});

export const createQueryCategory = serviceHandler(createQueryCategorySchema, async (req, res) => {
  const { name, description } = req.body;

  const [queryCategory] = await db
    .insert(models.queryCategories)
    .values({ name, description })
    .returning();

  return res.success('Query category created successfully', queryCategory);
});

export const updateQueryCategory = serviceHandler(updateQueryCategorySchema, async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const existingCategory = await db.query.queryCategories.findFirst({
    where: and(eq(models.queryCategories.id, id), isNull(models.queryCategories.deletedAt)),
  });

  if (!existingCategory) {
    throw new ApiError('Query category not found', 404);
  }

  const [updatedCategory] = await db
    .update(models.queryCategories)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(models.queryCategories.id, id))
    .returning();

  return res.success('Query category updated successfully', updatedCategory);
});

export const deleteQueryCategory = serviceHandler(deleteQueryCategorySchema, async (req, res) => {
  const { id } = req.params;

  const existingCategory = await db.query.queryCategories.findFirst({
    where: and(eq(models.queryCategories.id, id), isNull(models.queryCategories.deletedAt)),
  });

  if (!existingCategory) {
    throw new ApiError('Query category not found', 404);
  }

  await db
    .update(models.queryCategories)
    .set({ deletedAt: new Date() })
    .where(eq(models.queryCategories.id, id));

  return res.success('Query category deleted successfully');
});

// =======================
// Document Categories Services
// =======================

export const listDocumentCategories = serviceHandler(z.object({}), async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const documentCategories = await db.query.documentCategories.findMany({
    where: isNull(models.documentCategories.deletedAt),
    orderBy: desc(models.documentCategories.createdAt),
    limit,
    offset,
  });

  const totalCount = await db.$count(
    models.documentCategories,
    isNull(models.documentCategories.deletedAt)
  );

  return res.data('Document categories retrieved successfully', documentCategories, {
    page,
    size,
    total: totalCount,
  });
});

export const createDocumentCategory = serviceHandler(
  createDocumentCategorySchema,
  async (req, res) => {
    const { name, description } = req.body;

    const [documentCategory] = await db
      .insert(models.documentCategories)
      .values({ name, description })
      .returning();

    return res.success('Document category created successfully', documentCategory);
  }
);

export const updateDocumentCategory = serviceHandler(
  updateDocumentCategorySchema,
  async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existingCategory = await db.query.documentCategories.findFirst({
      where: and(eq(models.documentCategories.id, id), isNull(models.documentCategories.deletedAt)),
    });

    if (!existingCategory) {
      throw new ApiError('Document category not found', 404);
    }

    const [updatedCategory] = await db
      .update(models.documentCategories)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(models.documentCategories.id, id))
      .returning();

    return res.success('Document category updated successfully', updatedCategory);
  }
);

export const deleteDocumentCategory = serviceHandler(
  deleteDocumentCategorySchema,
  async (req, res) => {
    const { id } = req.params;

    const existingCategory = await db.query.documentCategories.findFirst({
      where: and(eq(models.documentCategories.id, id), isNull(models.documentCategories.deletedAt)),
    });

    if (!existingCategory) {
      throw new ApiError('Document category not found', 404);
    }

    await db
      .update(models.documentCategories)
      .set({ deletedAt: new Date() })
      .where(eq(models.documentCategories.id, id));

    return res.success('Document category deleted successfully');
  }
);

// =======================
// Site Contents Services (Global Configuration)
// =======================

export const getSiteContents = serviceHandler(z.object({}), async (req, res) => {
  // Site contents is a single row configuration table
  const siteContents = await db.query.siteContents.findFirst();

  if (!siteContents) {
    throw new ApiError('Site contents not found. Please initialize the site configuration.', 404);
  }

  return res.success('Site contents retrieved successfully', siteContents);
});

export const updateSiteContents = serviceHandler(updateSiteContentsSchema, async (req, res) => {
  const updateData = req.body;
  const modules = req.admin.role.modules;

  // Check if there's any data to update
  if (Object.keys(updateData).length === 0) {
    throw new ApiError('No update data provided', 400);
  }

  // Check permissions for contact info updates (headerEmail or headerPhone)
  if (updateData.headerEmail || updateData.headerPhone) {
    const hasTopHeaderPermission = modules.some(
      (module) =>
        module.name === MODULE_CONFIGS.topHeader.name &&
        module.permissions.some((permission) => permission.permissionName === 'edit')
    );

    if (!hasTopHeaderPermission) {
      throw new ApiError('You do not have permission to update contact information', 403);
    }
  }

  // Check if site contents exist
  const existingSiteContents = await db.query.siteContents.findFirst();

  if (!existingSiteContents) {
    throw new ApiError(
      'Site contents not initialized. Please contact administrator to initialize site configuration.',
      404
    );
  }

  // Update existing site contents
  const [updatedSiteContents] = await db
    .update(models.siteContents)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .returning();

  return res.success('Site contents updated successfully', updatedSiteContents);
});
