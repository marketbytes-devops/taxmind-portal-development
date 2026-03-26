import { and, desc, eq, ilike, isNull, ne, or } from 'drizzle-orm';

import { activityLogEntityNames } from '@/constants';
import { db, models } from '@/database';
import { getPresignedGetObjectUrl } from '@/integrations/awsS3';
import { activityLog } from '@/logger/activityLog';
import ApiError from '@/utils/apiError';
import {
  calculateReadingTime,
  generateCanonicalUrl,
  generateSeoDescription,
  generateSeoKeywords,
  generateSeoTitle,
  generateUniqueSlug,
} from '@/utils/blogUtils';
import { serviceHandler } from '@/utils/serviceHandler';

import {
  createBlogSchema,
  deleteBlogSchema,
  listBlogsSchema,
  publishBlogSchema,
  updateBlogSchema,
} from './validations';

// =======================
// Admin Blog Services
// =======================

export const listBlogs = serviceHandler(listBlogsSchema, async (req, res) => {
  const { status, isPublished, isFeatured, authorId, search } = req.query;
  const { limit: limitPaginated, offset, page, size } = req.pagination;

  // Check if user is admin
  const isAdmin = !!req.admin;

  const whereConditions = [isNull(models.blogs.deletedAt)];

  // For non-admin users, only show published and active blogs
  if (!isAdmin) {
    whereConditions.push(eq(models.blogs.isPublished, true));
    whereConditions.push(eq(models.blogs.status, true));
  } else {
    // For admin users, apply optional filters
    if (status !== undefined) {
      whereConditions.push(eq(models.blogs.status, status));
    }
    if (isPublished !== undefined) {
      whereConditions.push(eq(models.blogs.isPublished, isPublished));
    }
  }

  if (isFeatured !== undefined) {
    whereConditions.push(eq(models.blogs.isFeatured, isFeatured));
  }
  if (authorId) {
    whereConditions.push(eq(models.blogs.authorId, authorId));
  }
  if (search) {
    const searchConditions = [
      ilike(models.blogs.title, `%${search}%`),
      ilike(models.blogs.excerpt, `%${search}%`),
    ].filter(Boolean);

    if (searchConditions.length > 0) {
      whereConditions.push(or(...searchConditions)!);
    }
  }

  const blogs = await db.query.blogs.findMany({
    where: and(...whereConditions),
    orderBy: [desc(models.blogs.createdAt)],
    limit: limitPaginated,
    offset,
    columns: { content: false, authorId: false },
    with: {
      image: { columns: { id: true, key: true, fileName: true, mimeType: true, uploadedAt: true } },
      author: isAdmin
        ? {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          }
        : undefined,
    },
  });

  const totalCount = await db.$count(models.blogs, and(...whereConditions));

  // Attach presigned filePath for each blog's image (if present)
  const blogsWithUrls = await Promise.all(
    blogs.map(async (b) => {
      if (b.image?.key) {
        try {
          const filePath = await getPresignedGetObjectUrl(b.image.key);
          return { ...b, image: { ...b.image, filePath } };
        } catch (err) {
          console.warn('Failed to generate presigned image URL for blog:', b.id, err);
        }
      }
      return b;
    })
  );

  return res.data('Blogs retrieved successfully', blogsWithUrls, {
    page: page,
    size: size,
    total: totalCount,
  });
});

export const getBlog = serviceHandler(async (req, res) => {
  const { identifier } = req.params; // Can be blogId or slug

  // Check if user is admin
  const isAdmin = !!req.admin;

  // Determine if identifier is UUID (blogId) or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  const baseConditions = [isNull(models.blogs.deletedAt)];

  // Add identifier condition (ID or slug)
  if (isUUID) {
    baseConditions.push(eq(models.blogs.id, identifier));
  } else {
    baseConditions.push(eq(models.blogs.slug, identifier));
  }

  // For non-admin users, only show published and active blogs
  if (!isAdmin) {
    baseConditions.push(eq(models.blogs.isPublished, true));
    baseConditions.push(eq(models.blogs.status, true));
  }

  const blog = await db.query.blogs.findFirst({
    where: and(...baseConditions),
    with: {
      image: {
        columns: { id: true, key: true, fileName: true, mimeType: true, uploadedAt: true },
      },
      author: isAdmin
        ? {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          }
        : undefined,
    },
  });

  if (!blog) {
    throw new ApiError('Blog not found', 404);
  }

  // Generate a short-lived signed URL for the image if present
  let imageUrl: string | undefined;
  if (blog.image?.key) {
    try {
      imageUrl = await getPresignedGetObjectUrl(blog.image.key);
    } catch (err) {
      // Non-fatal: continue without image URL
      console.warn('Failed to generate presigned image URL for blog:', blog.id, err);
    }
  }

  // Increment view count for public access (not admin)
  if (!isAdmin) {
    await db
      .update(models.blogs)
      .set({
        viewCount: (parseInt(blog.viewCount || '0') + 1).toString(),
      })
      .where(eq(models.blogs.id, blog.id));

    // Return updated view count for public users
    return res.success('Blog retrieved successfully', {
      ...blog,
      image: blog.image ? { ...blog.image, filePath: imageUrl } : undefined,
      viewCount: (parseInt(blog.viewCount || '0') + 1).toString(),
    });
  }

  // For admin users, return blog without incrementing view count
  return res.success('Blog retrieved successfully', {
    ...blog,
    image: blog.image ? { ...blog.image, filePath: imageUrl } : undefined,
  });
});

export const createBlog = serviceHandler(createBlogSchema, async (req, res) => {
  const { featuredOrder, ...blogData } = req.body;
  const authorId = req.admin.id;

  // Generate unique slug from title
  const checkSlugExists = async (slug: string): Promise<boolean> => {
    const existing = await db.query.blogs.findFirst({
      where: and(eq(models.blogs.slug, slug)),
    });
    return !!existing;
  };

  const slug = await generateUniqueSlug(blogData.title, checkSlugExists);

  // Generate SEO fields
  const seoTitle = generateSeoTitle(blogData.title);
  const seoDescription = generateSeoDescription(blogData.content, blogData.excerpt);
  const seoKeywords = generateSeoKeywords(blogData.title, blogData.content);
  const canonicalUrl = generateCanonicalUrl(slug);

  // Calculate reading time
  const readingTimeMinutes = calculateReadingTime(blogData.content);

  const processedBlogData = {
    ...blogData,
    slug,
    seoTitle,
    seoDescription,
    seoKeywords,
    canonicalUrl,
    authorId,
    readingTimeMinutes: readingTimeMinutes.toString(),
    viewCount: '0',
    featuredOrder: featuredOrder?.toString() || '0',
    publishedAt: blogData.status ? new Date() : undefined,
    isPublished: blogData.status,
  };

  const [blog] = await db.insert(models.blogs).values(processedBlogData).returning();
  const activityLogData = {
    entityName: activityLogEntityNames.blog,
    entityId: blog.id,
    action: 'insert' as const,
    modifiedUserId: req.admin.id,
    oldData: null,
    newData: blog,
  };
  await activityLog(activityLogData);

  return res.success('Blog created successfully', blog);
});

export const updateBlog = serviceHandler(updateBlogSchema, async (req, res) => {
  const { blogId } = req.params;
  const { featuredOrder, ...updateData } = req.body;

  // Check if blog exists
  const existingBlog = await db.query.blogs.findFirst({
    where: and(eq(models.blogs.id, blogId), isNull(models.blogs.deletedAt)),
  });

  if (!existingBlog) {
    throw new ApiError('Blog not found', 404);
  }

  let processedUpdateData: Record<string, string | number | Date | boolean | undefined> = {
    ...updateData,
    featuredOrder: featuredOrder?.toString(),
    updatedAt: new Date(),
  };

  // If title is being updated, regenerate slug and SEO fields
  if (updateData.title) {
    const checkSlugExists = async (slug: string): Promise<boolean> => {
      const existing = await db.query.blogs.findFirst({
        where: and(
          eq(models.blogs.slug, slug),
          isNull(models.blogs.deletedAt),
          ne(models.blogs.id, blogId) // Exclude current blog
        ),
      });
      return !!existing;
    };

    const newSlug = await generateUniqueSlug(updateData.title, checkSlugExists);
    const newSeoTitle = generateSeoTitle(updateData.title);

    // For SEO description and keywords, use updated content if provided, otherwise existing content
    const contentForSeo = updateData.content || existingBlog.content;
    const excerptForSeo =
      updateData.excerpt !== undefined ? updateData.excerpt : existingBlog.excerpt || undefined;

    const newSeoDescription = generateSeoDescription(contentForSeo, excerptForSeo);
    const newSeoKeywords = generateSeoKeywords(updateData.title, contentForSeo);
    const newCanonicalUrl = generateCanonicalUrl(newSlug);

    processedUpdateData = {
      ...processedUpdateData,
      slug: newSlug,
      seoTitle: newSeoTitle,
      seoDescription: newSeoDescription,
      seoKeywords: newSeoKeywords,
      canonicalUrl: newCanonicalUrl,
    };
  }

  // Calculate reading time if content is updated
  if (updateData.content) {
    const readingTimeMinutes = calculateReadingTime(updateData.content);
    processedUpdateData.readingTimeMinutes = readingTimeMinutes.toString();
  }

  const [updatedBlog] = await db
    .update(models.blogs)
    .set(processedUpdateData)
    .where(eq(models.blogs.id, blogId))
    .returning();

  const activityLogData = {
    entityName: activityLogEntityNames.blog,
    entityId: existingBlog.id,
    action: 'update' as const,
    modifiedUserId: req.admin.id,
    oldData: existingBlog,
    newData: updatedBlog,
  };
  await activityLog(activityLogData);

  return res.success('Blog updated successfully', updatedBlog);
});

export const publishBlog = serviceHandler(publishBlogSchema, async (req, res) => {
  const { blogId } = req.params;

  // Check if blog exists
  const existingBlog = await db.query.blogs.findFirst({
    where: and(eq(models.blogs.id, blogId), isNull(models.blogs.deletedAt)),
    columns: { authorId: false },
  });

  if (!existingBlog) {
    throw new ApiError('Blog not found', 404);
  }

  if (existingBlog.isPublished) {
    throw new ApiError('Blog is already published', 400);
  }

  const [publishedBlog] = await db
    .update(models.blogs)
    .set({
      status: true,
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(models.blogs.id, blogId))
    .returning();

  return res.success('Blog published successfully', publishedBlog);
});

export const deleteBlog = serviceHandler(deleteBlogSchema, async (req, res) => {
  const { blogId } = req.params;

  // Check if blog exists
  const existingBlog = await db.query.blogs.findFirst({
    where: and(eq(models.blogs.id, blogId), isNull(models.blogs.deletedAt)),
  });

  if (!existingBlog) {
    throw new ApiError('Blog not found', 404);
  }

  // Soft delete the blog
  await db.update(models.blogs).set({ deletedAt: new Date() }).where(eq(models.blogs.id, blogId));
  const activityLogData = {
    entityName: activityLogEntityNames.blog,
    entityId: existingBlog.id,
    action: 'delete' as const,
    modifiedUserId: req.admin.id,
    oldData: existingBlog,
    newData: null,
  };
  await activityLog(activityLogData);
  return res.success('Blog deleted successfully');
});
