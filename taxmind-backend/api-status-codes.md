Here's a comprehensive list of HTTP status codes commonly used in REST APIs, organized by category:

## 🟢 **2xx Success Status Codes**

### **200 OK**

- **Use**: Successful GET, PUT, PATCH, DELETE requests
- **Example**: User profile retrieved, user updated, user deleted

```typescript
return res.status(200).json({
  success: true,
  message: "User retrieved successfully",
  data: user
});
```

### **201 Created**

- **Use**: Successful resource creation (POST requests)
- **Example**: User created, blog post created, payment initiated

```typescript
return res.status(201).json({
  success: true,
  message: "User created successfully",
  data: newUser
});
```

### **202 Accepted**

- **Use**: Request accepted for processing but not completed
- **Example**: Email queued for sending, file upload started

```typescript
return res.status(202).json({
  success: true,
  message: "Email queued for delivery"
});
```

### **204 No Content**

- **Use**: Successful request with no response body
- **Example**: DELETE operations, successful logout

```typescript
return res.status(204).send();
```

---

## 🟡 **4xx Client Error Status Codes**

### **400 Bad Request**

- **Use**: Invalid request data, validation errors
- **Example**: Missing required fields, invalid email format

```typescript
return res.status(400).json({
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid request data",
    details: [
      { field: "email", message: "Invalid email format" }
    ]
  }
});
```

### **401 Unauthorized**

- **Use**: Authentication required or failed
- **Example**: Missing token, invalid credentials, expired token

```typescript
return res.status(401).json({
  success: false,
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required"
  }
});
```

### **403 Forbidden**

- **Use**: User authenticated but lacks permission
- **Example**: Insufficient role, blocked account, permission denied

```typescript
return res.status(403).json({
  success: false,
  error: {
    code: "FORBIDDEN",
    message: "Insufficient permissions to access this resource"
  }
});
```

### **404 Not Found**

- **Use**: Resource doesn't exist
- **Example**: User not found, blog post not found, endpoint not found

```typescript
return res.status(404).json({
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "User not found"
  }
});
```

### **405 Method Not Allowed**

- **Use**: HTTP method not supported for this endpoint
- **Example**: POST request to GET-only endpoint

```typescript
return res.status(405).json({
  success: false,
  error: {
    code: "METHOD_NOT_ALLOWED",
    message: "POST method not allowed for this endpoint"
  }
});
```

### **406 Not Acceptable**

- **Use**: Server cannot produce content matching Accept headers
- **Example**: Client requests XML but server only provides JSON

```typescript
return res.status(406).json({
  success: false,
  error: {
    code: "NOT_ACCEPTABLE",
    message: "Only JSON format is supported"
  }
});
```

### **409 Conflict**

- **Use**: Resource already exists, conflicting state
- **Example**: Email already registered, duplicate entry

```typescript
return res.status(409).json({
  success: false,
  error: {
    code: "CONFLICT",
    message: "Email already exists"
  }
});
```

### **410 Gone**

- **Use**: Resource permanently deleted
- **Example**: Deleted user account, removed content

```typescript
return res.status(410).json({
  success: false,
  error: {
    code: "GONE",
    message: "This resource has been permanently removed"
  }
});
```

### **422 Unprocessable Entity**

- **Use**: Valid syntax but semantic errors
- **Example**: Business rule violations, logic errors

```typescript
return res.status(422).json({
  success: false,
  error: {
    code: "UNPROCESSABLE_ENTITY",
    message: "Cannot delete user with active applications"
  }
});
```

### **429 Too Many Requests**

- **Use**: Rate limiting exceeded
- **Example**: Too many login attempts, API rate limit hit

```typescript
return res.status(429).json({
  success: false,
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later.",
    retryAfter: 60
  }
});
```

---

## 🔴 **5xx Server Error Status Codes**

### **500 Internal Server Error**

- **Use**: Unexpected server errors
- **Example**: Database connection failed, unhandled exceptions

```typescript
return res.status(500).json({
  success: false,
  error: {
    code: "INTERNAL_ERROR",
    message: "An internal server error occurred"
  }
});
```

### **502 Bad Gateway**

- **Use**: Invalid response from upstream server
- **Example**: Payment gateway error, third-party service down

```typescript
return res.status(502).json({
  success: false,
  error: {
    code: "BAD_GATEWAY",
    message: "Payment service is currently unavailable"
  }
});
```

### **503 Service Unavailable**

- **Use**: Server temporarily unavailable
- **Example**: Maintenance mode, overloaded server

```typescript
return res.status(503).json({
  success: false,
  error: {
    code: "SERVICE_UNAVAILABLE",
    message: "Service temporarily unavailable"
  }
});
```

### **504 Gateway Timeout**

- **Use**: Upstream server timeout
- **Example**: Database query timeout, third-party API timeout

```typescript
return res.status(504).json({
  success: false,
  error: {
    code: "GATEWAY_TIMEOUT",
    message: "Request timeout. Please try again."
  }
});
```

---

## 🎯 **Tax Filing Application Specific Examples**

### **User Authentication**

```typescript
// 200 - Successful login
POST /api/v1/auth/signin → 200 OK

// 401 - Invalid credentials
POST /api/v1/auth/signin → 401 Unauthorized

// 403 - Account blocked
POST /api/v1/auth/signin → 403 Forbidden
```

### **User Management**

```typescript
// 201 - User created
POST /api/v1/users → 201 Created

// 200 - User retrieved
GET /api/v1/users/123 → 200 OK

// 404 - User not found
GET /api/v1/users/999 → 404 Not Found

// 409 - Email already exists
POST /api/v1/users → 409 Conflict
```

### **Tax Applications**

```typescript
// 201 - Application created
POST /api/v1/applications → 201 Created

// 200 - Application updated
PUT /api/v1/applications/123 → 200 OK

// 422 - Cannot submit incomplete application
POST /api/v1/applications/123/submit → 422 Unprocessable Entity

// 403 - Cannot view other user's application
GET /api/v1/applications/123 → 403 Forbidden
```

### **Payment Processing**

```typescript
// 201 - Payment intent created
POST /api/v1/payments → 201 Created

// 200 - Payment status retrieved
GET /api/v1/payments/123 → 200 OK

// 422 - Payment already completed
POST /api/v1/payments/123/process → 422 Unprocessable Entity

// 502 - Stripe service error
POST /api/v1/payments → 502 Bad Gateway
```

### **Document Management**

```typescript
// 201 - Document uploaded
POST /api/v1/documents → 201 Created

// 200 - Document retrieved
GET /api/v1/documents/123 → 200 OK

// 404 - Document not found
GET /api/v1/documents/999 → 404 Not Found

// 413 - File too large (if you implement this)
POST /api/v1/documents → 413 Payload Too Large
```

---

## 📋 **Quick Reference for Your Tax Filing API**

### **Common Patterns:**

- **GET requests**: 200 (success), 404 (not found), 403 (no permission)
- **POST requests**: 201 (created), 400 (validation), 409 (conflict)
- **PUT/PATCH requests**: 200 (updated), 404 (not found), 422 (business rule)
- **DELETE requests**: 204 (deleted), 404 (not found), 422 (cannot delete)

### **Error Handling in Services:**

```typescript
export const getUserById = serviceHandler(schema, async (req, res) => {
  const { userId } = req.params;

  const user = await db.query.users.findFirst({
    where: eq(models.users.id, userId),
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: 'User retrieved successfully',
    data: user,
  });
});
```

This comprehensive status code guide ensures your REST API provides clear, consistent, and meaningful responses for all client interactions in your GDPR-compliant tax filing system.
