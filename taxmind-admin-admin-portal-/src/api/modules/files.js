// Files API
// Assumptions (to confirm with backend):
// - Upload endpoint: POST /file/upload (multipart/form-data)
// - Response: { data: { key: string, url?: string } } OR { key }
// - Blog image association is performed by updating the blog with returned key
// - Retrieval uses /file/get?key=<key> via buildFileUrl
import http from "../http";
import { buildFileUrl } from "@/config/api";

// New presigned upload workflow
// Endpoint: POST /files/request-upload with body { id: <RESOURCE_ID>, type: 'blog', filename }
// Expected response shape (example):
// {
//   status: 200,
//   success: true,
//   message: 'Pre-signed URL generated successfully',
//   data: {
//     key: 'local/<...>.png',
//     presignedUrl: 'https://bucket.s3...&X-Amz-Expires=600...',
//     expiresIn: 600,
//     maxFileSize: 5242880,
//     allowedMimeTypes: ['image/jpeg','image/png']
//   }
// }
async function requestUpload(payload) {
  return http
    .post("/files/request-upload", payload)
    .then((r) => r.data?.data || r.data);
}

// Perform actual upload to presigned URL (PUT preferred). Returns { key, url }
async function uploadToPresigned(url, file, extraHeaders = {}) {
  const headers = {
    "Content-Type": file.type || "application/octet-stream",
    ...extraHeaders,
  };
  await fetch(url, { method: "PUT", body: file, headers });
}

// Confirm uploaded keys with backend (idempotent)
export async function confirmUpload(keys = []) {
  if (!Array.isArray(keys) || keys.length === 0)
    throw new Error("keys array required");
  return http
    .post("/files/confirm-upload", { keys })
    .then((r) => r.data?.data || r.data);
}

// High-level helper for blog banner/image upload.
// Returns { key, url }
export async function uploadBlogImage(blogId, file) {
  if (!blogId) throw new Error("blogId required");
  if (!file) throw new Error("file required");
  const filename = file.name || "image";
  const meta = await requestUpload({
    entityId: blogId,
    type: "blog_image",
    filename,
  });

  const uploadUrl =
    meta.presignedUrl || meta.uploadUrl || meta.url || meta.upload_url;
  const fileKey = meta.key || meta.fileKey || meta.file_key;
  if (!uploadUrl || !fileKey)
    throw new Error("Invalid upload spec from request-upload");

  // Optional client-side validations based on provided contract
  if (meta.allowedMimeTypes && Array.isArray(meta.allowedMimeTypes)) {
    if (!meta.allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }
  }
  if (meta.maxFileSize && file.size > meta.maxFileSize) {
    throw new Error(`File exceeds max size of ${meta.maxFileSize} bytes`);
  }

  await uploadToPresigned(uploadUrl, file, meta.headers || {});
  // confirm
  try {
    await confirmUpload([fileKey]);
  } catch (e) {
    /* swallow to not block UI; caller may decide */
  }
  return {
    key: fileKey,
    url: buildFileUrl(fileKey),
    presignedExpiresIn: meta.expiresIn,
  };
}

// Common Upload Function
export async function uploadFile(entityOrConfig, file, type) {
  // --- Handle flexible first argument ---
  let entityId, metadata, resolvedType;

  if (typeof entityOrConfig === "object" && entityOrConfig !== null) {
    // When first arg is a config object
    entityId = entityOrConfig.entityId;
    metadata = entityOrConfig.metadata;
    resolvedType = entityOrConfig.type || type;
  } else {
    // When first arg is a simple entityId
    entityId = entityOrConfig;
    resolvedType = type;
  }

  if (!entityId) throw new Error("entityId required");
  if (!file) throw new Error("file required");
  if (!resolvedType) throw new Error("type required");

  const filename = file.name || "file";

  // Step 1: Ask backend for presigned URL & metadata
  const meta = await requestUpload({
    entityId,
    type: resolvedType,
    filename,
    ...(metadata ? { metadata } : {}), // include metadata only if provided
  });

  const uploadUrl =
    meta.presignedUrl || meta.uploadUrl || meta.url || meta.upload_url;
  const fileKey = meta.key || meta.fileKey || meta.file_key;

  if (!uploadUrl || !fileKey) {
    throw new Error("Invalid upload spec from request-upload");
  }

  // Step 2: Optional validations
  if (
    meta.allowedMimeTypes?.length &&
    !meta.allowedMimeTypes.includes(file.type)
  ) {
    throw new Error(`File type ${file.type} not allowed`);
  }
  if (meta.maxFileSize && file.size > meta.maxFileSize) {
    throw new Error(`File exceeds max size of ${meta.maxFileSize} bytes`);
  }

  // Step 3: Upload file to presigned URL
  await uploadToPresigned(uploadUrl, file, meta.headers || {});

  // Step 4: Confirm upload (non-blocking)
  try {
    await confirmUpload([fileKey]);
  } catch (e) {
    console.warn("Upload confirm failed (ignored):", e);
  }

  // Step 5: Return success
  return {
    success: true,
    message: "File uploaded successfully",
    key: fileKey,
    url: buildFileUrl(fileKey),
    presignedExpiresIn: meta.expiresIn,
    fileId: meta.id,
    type: resolvedType,
  };
}

export function getFileUrl(key) {
  return buildFileUrl(key);
}

// High-level helper for document template upload (file-first flow)
// Returns { key, url }
export async function uploadDocumentTemplate(file, templateName = "") {
  if (!file) throw new Error("file required");
  const filename = file.name || "template";
  // Step 1: Request upload URL
  const meta = await requestUpload({
    id: null,
    type: "document_template",
    filename,
    metadata: templateName ? { templateName } : undefined,
  });

  const uploadUrl =
    meta.presignedUrl || meta.uploadUrl || meta.url || meta.upload_url;
  const fileKey = meta.key || meta.fileKey || meta.file_key;
  if (!uploadUrl || !fileKey)
    throw new Error("Invalid upload spec from request-upload");

  // Optional validations
  if (meta.allowedMimeTypes && Array.isArray(meta.allowedMimeTypes)) {
    if (!meta.allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }
  }
  if (meta.maxFileSize && file.size > meta.maxFileSize) {
    throw new Error(`File exceeds max size of ${meta.maxFileSize} bytes`);
  }

  // Step 2: Upload to presigned URL (PUT by default)
  await uploadToPresigned(uploadUrl, file, meta.headers || {});

  // Step 3: Confirm upload
  try {
    await confirmUpload([fileKey]);
  } catch (_) {
    /* non-blocking */
  }

  return {
    key: fileKey,
    url: buildFileUrl(fileKey),
    presignedExpiresIn: meta.expiresIn,
  };
}

// Upload a document template file for an existing template entity
// Mirrors blogs flow: use entityId to bind file to resource on backend
// Returns { key, url }
export async function uploadDocumentTemplateForEntity(
  templateId,
  file,
  templateName = ""
) {
  if (!templateId) throw new Error("templateId required");
  if (!file) throw new Error("file required");
  const filename = file.name || "template";
  const meta = await requestUpload({
    entityId: templateId,
    type: "document_template",
    filename,
    metadata: templateName ? { templateName } : undefined,
  });

  const uploadUrl =
    meta.presignedUrl || meta.uploadUrl || meta.url || meta.upload_url;
  const fileKey = meta.key || meta.fileKey || meta.file_key;
  if (!uploadUrl || !fileKey)
    throw new Error("Invalid upload spec from request-upload");

  if (meta.allowedMimeTypes && Array.isArray(meta.allowedMimeTypes)) {
    if (!meta.allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }
  }
  if (meta.maxFileSize && file.size > meta.maxFileSize) {
    throw new Error(`File exceeds max size of ${meta.maxFileSize} bytes`);
  }

  await uploadToPresigned(uploadUrl, file, meta.headers || {});
  try {
    await confirmUpload([fileKey]);
  } catch (_) {
    /* non-blocking */
  }
  return {
    key: fileKey,
    url: buildFileUrl(fileKey),
    presignedExpiresIn: meta.expiresIn,
  };
}

// High-level helper for category icon upload
// Returns { key, url }
export async function uploadCategoryIcon(categoryId, file) {
  if (!categoryId) throw new Error("categoryId required");
  if (!file) throw new Error("file required");
  const filename = file.name || "icon";
  const meta = await requestUpload({
    entityId: categoryId,
    type: "question_category_icon",
    filename,
  });

  const uploadUrl =
    meta.presignedUrl || meta.uploadUrl || meta.url || meta.upload_url;
  const fileKey = meta.key || meta.fileKey || meta.file_key;
  if (!uploadUrl || !fileKey)
    throw new Error("Invalid upload spec from request-upload");

  // Optional client-side validations based on provided contract
  if (meta.allowedMimeTypes && Array.isArray(meta.allowedMimeTypes)) {
    if (!meta.allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }
  }
  if (meta.maxFileSize && file.size > meta.maxFileSize) {
    throw new Error(`File exceeds max size of ${meta.maxFileSize} bytes`);
  }

  await uploadToPresigned(uploadUrl, file, meta.headers || {});
  // confirm
  try {
    await confirmUpload([fileKey]);
  } catch (e) {
    /* swallow to not block UI; caller may decide */
  }
  return {
    key: fileKey,
    url: buildFileUrl(fileKey),
    presignedExpiresIn: meta.expiresIn,
  };
}

/**
 * Delete a file
 * @param {string} fileId - The file ID to delete
 * @param {string} type - The file type (e.g., 'chat_attachment')
 * @returns {Promise} - Promise resolving to the deletion result
 */
export async function deleteFile(fileId, type) {
  if (!fileId) throw new Error("fileId required");
  if (!type) throw new Error("type required");

  return http.delete("/files", {
    data: {
      fileId,
      type,
    },
    headers: {
      Accept: "application/json",
    },
  });
}
