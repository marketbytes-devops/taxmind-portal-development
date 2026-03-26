import axios from "axios";

const RAW_BASE = process.env.VUE_APP_API_BASE_URL;
const API_BASE_URL = RAW_BASE.replace(/\/$/, "");

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

async function requestUpload(payload) {
  return axios
    .post("/files/request-upload", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    })
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
export async function confirmUpload(keys = []) {
  if (!Array.isArray(keys) || keys.length === 0)
    throw new Error("keys array required");
  return axios
    .post("/files/confirm-upload", { keys }, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((r) => r.data?.data || r.data);
}

function buildFileUrl(key) {
  return `${API_BASE_URL}/file/get?key=${encodeURIComponent(key)}`;
}

export async function deleteFile(fileId, type) {
  if (!fileId) throw new Error("fileId required");
  if (!type) throw new Error("type required");

  try {
    const response = await axios.delete("/files", {
      data: {
        fileId,
        type
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    return {
      success: true,
      message: "File deleted successfully",
      data: response.data?.data || response.data
    };
  } catch (error) {
    console.error("File deletion failed:", error);
    throw error;
  }
}
