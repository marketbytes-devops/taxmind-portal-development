// Blogs API (new resource-oriented endpoints)
import http from '../http';
// import { uploadBlogImage } from './files';

// Normalize pagination shape coming from backend to { items, page, limit, total }
function normalizePage(resp) {
    const root = resp?.data || {};
    const payload = root.data;
    const meta = root.metadata || root.meta || {};

    // When payload is an array, that's the items list. Otherwise look for common containers.
    let items;
    if (Array.isArray(payload)) {
        items = payload;
    } else {
        const data = payload || {};
        items = data.blogs || data.items || data.data || [];
    }

    const page = meta.page || meta.currentPage || payload?.page || 1;
    const limit = meta.size || meta.limit || meta.pageSize || payload?.limit || items.length || 0;
    const total = meta.total || meta.totalItems || meta.count || payload?.total || items.length || 0;

    return { items, page, limit, total, raw: resp.data };
}

export function listBlogs(params) {
    return http.get('/blogs', { params }).then(normalizePage);
}

// Create blog (metadata only). Image upload occurs separately via files API then attachImage.
export function createBlog(payload) {
    const data = { ...payload };
    delete data.image; // ensure no File object is sent inadvertently
    return http.post('/blogs', data).then(r => r.data);
}

export function updateBlog(blogId, payload) {
    const data = { ...payload };
    delete data.image; // image updates should go through attachImage
    return http.put(`/blogs/${blogId}`, data).then(r => r.data);
}

export function deleteBlog(blogId) {
    return http.delete(`/blogs/${blogId}`).then(r => r.data);
}

export function publishBlog(blogId) {
    return http.patch(`/blogs/${blogId}/publish`).then(r => r.data);
}

// Helper to fetch a single blog if needed later
export function getBlog(blogId) {
    return http.get(`/blogs/${blogId}`).then(r => r.data);
}

// Attach/replace blog image after uploading via Files API (assumes endpoint exists)
// Assumption: PATCH /blogs/{blogId} with { imageKey } updates the image reference
export function attachImage(blogId, imageKey) {
    return http.patch(`/blogs/${blogId}`, { imageKey }).then(r => r.data);
}

