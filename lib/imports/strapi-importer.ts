import { Prisma, PrismaClient } from '@prisma/client'
import mysql from 'mysql2/promise'

export interface StrapiConnectionConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  s3BaseUrl?: string
}

export interface StrapiImportOptions {
  dryRun?: boolean
  skipComments?: boolean
  limit?: number
  offset?: number
  commentLimit?: number
}

export interface StrapiSourceStats {
  posts: number
  tags: number
  comments: number
}

export interface StrapiTargetStats {
  articles: number
  tags: number
  categories: number
  authors: number
  comments: number
  articleTags: number
}

export interface StrapiImportSummary {
  mode: 'DRY_RUN' | 'LIVE'
  options: {
    dryRun: boolean
    skipComments: boolean
    limit?: number
    offset?: number
    commentLimit: number
  }
  source: StrapiSourceStats & {
    typeDistribution?: Record<string, number>
  }
  imported: {
    tags: number
    categories: number
    authors: number
    posts: number
    comments: number
    threadedComments: number
    articleTags: number
  }
  skipped: {
    commentsWithoutArticle: number
  }
  errors: {
    tags: number
    categories: number
    authors: number
    posts: number
    comments: number
    sequenceResets: number
  }
  target?: StrapiTargetStats
}

export interface StrapiImportProgressEvent {
  step: string
  message: string
  progressCurrent?: number
  progressTotal?: number
  summary?: Partial<StrapiImportSummary>
}

interface RunImportParams {
  prisma: PrismaClient
  connection: StrapiConnectionConfig
  options?: StrapiImportOptions
  onProgress?: (event: StrapiImportProgressEvent) => Promise<void> | void
}

type MysqlRow = Record<string, any>

const DEFAULT_COMMENT_LIMIT = 100000

function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

function normalizeOptions(options?: StrapiImportOptions) {
  return {
    dryRun: Boolean(options?.dryRun),
    skipComments: Boolean(options?.skipComments),
    limit: options?.limit && options.limit > 0 ? options.limit : undefined,
    offset: options?.offset && options.offset > 0 ? options.offset : undefined,
    commentLimit:
      options?.commentLimit && options.commentLimit > 0
        ? options.commentLimit
        : DEFAULT_COMMENT_LIMIT,
  }
}

function normalizeS3BaseUrl(url?: string) {
  if (!url) return ''
  return url.replace(/\/$/, '')
}

function createSummary(options: ReturnType<typeof normalizeOptions>): StrapiImportSummary {
  return {
    mode: options.dryRun ? 'DRY_RUN' : 'LIVE',
    options,
    source: {
      posts: 0,
      tags: 0,
      comments: 0,
    },
    imported: {
      tags: 0,
      categories: 0,
      authors: 0,
      posts: 0,
      comments: 0,
      threadedComments: 0,
      articleTags: 0,
    },
    skipped: {
      commentsWithoutArticle: 0,
    },
    errors: {
      tags: 0,
      categories: 0,
      authors: 0,
      posts: 0,
      comments: 0,
      sequenceResets: 0,
    },
  }
}

async function emit(
  onProgress: RunImportParams['onProgress'],
  event: StrapiImportProgressEvent
) {
  await onProgress?.(event)
}

async function createConnection(config: StrapiConnectionConfig) {
  return mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    charset: 'utf8mb4',
  })
}

async function safeCount(
  conn: mysql.Connection,
  query: string
): Promise<number> {
  const [rows] = await conn.execute(query)
  const firstRow = (rows as MysqlRow[])[0]

  return Number(firstRow?.c || 0)
}

async function fetchSourceStats(conn: mysql.Connection): Promise<StrapiSourceStats> {
  const [postRows] = await conn.execute(
    'SELECT COUNT(*) as c FROM posts WHERE published_at IS NOT NULL'
  )
  const [tagRows] = await conn.execute(
    'SELECT COUNT(*) as c FROM tags WHERE name IS NOT NULL'
  )

  let comments = 0
  try {
    comments = await safeCount(
      conn,
      'SELECT COUNT(*) as c FROM comments_comment WHERE content IS NOT NULL'
    )
  } catch {
    comments = 0
  }

  return {
    posts: Number((postRows as MysqlRow[])[0]?.c || 0),
    tags: Number((tagRows as MysqlRow[])[0]?.c || 0),
    comments,
  }
}

async function fetchTargetStats(prisma: PrismaClient): Promise<StrapiTargetStats> {
  const [articles, tags, categories, authors, comments, articleTags] =
    await Promise.all([
      prisma.article.count(),
      prisma.tag.count(),
      prisma.category.count(),
      prisma.author.count(),
      prisma.comment.count(),
      prisma.articleTag.count(),
    ])

  return {
    articles,
    tags,
    categories,
    authors,
    comments,
    articleTags,
  }
}

function resolvePostType(value: string | null | undefined) {
  const normalized = (value || '').toLowerCase()

  if (normalized === 'article' || normalized === 'مقاله') {
    return 'ARTICLE'
  }

  if (normalized === 'review' || normalized === 'بررسی') {
    return 'REVIEW'
  }

  if (normalized === 'story') {
    return 'STORY'
  }

  return 'NEWS'
}

async function migrateTags(params: {
  conn: mysql.Connection
  prisma: PrismaClient
  summary: StrapiImportSummary
  dryRun: boolean
  onProgress?: RunImportParams['onProgress']
}) {
  const { conn, prisma, summary, dryRun, onProgress } = params
  await emit(onProgress, {
    step: 'tags',
    message: 'در حال بررسی و انتقال تگ‌ها',
  })

  const [rows] = await conn.execute('SELECT id, name FROM tags WHERE name IS NOT NULL')
  const tags = rows as MysqlRow[]

  if (dryRun) {
    return
  }

  let migrated = 0

  for (const tag of tags) {
    const slug = slugify(tag.name) || `tag-${tag.id}`

    try {
      await prisma.tag.upsert({
        where: { strapiId: tag.id },
        update: { name: tag.name, slug },
        create: {
          strapiId: tag.id,
          name: tag.name,
          slug,
        },
      })
      migrated++
    } catch (error) {
      summary.errors.tags++

      try {
        await prisma.tag.upsert({
          where: { strapiId: tag.id },
          update: { name: tag.name },
          create: {
            strapiId: tag.id,
            name: tag.name,
            slug: `${slug}-${tag.id}`,
          },
        })
        migrated++
        summary.errors.tags--
      } catch {
        // Keep the error count.
      }
    }
  }

  summary.imported.tags = migrated

  await emit(onProgress, {
    step: 'tags',
    message: `${migrated} تگ منتقل شد`,
    progressCurrent: migrated,
    progressTotal: tags.length,
    summary: {
      imported: summary.imported,
      errors: summary.errors,
    },
  })
}

async function migrateCategories(params: {
  conn: mysql.Connection
  prisma: PrismaClient
  summary: StrapiImportSummary
  dryRun: boolean
  onProgress?: RunImportParams['onProgress']
}) {
  const { conn, prisma, summary, dryRun, onProgress } = params
  await emit(onProgress, {
    step: 'categories',
    message: 'در حال انتقال دسته‌بندی‌ها',
  })

  const [rows] = await conn.execute('SELECT id, name, lft FROM categories')
  const categories = rows as MysqlRow[]

  if (dryRun) {
    return
  }

  let migrated = 0

  for (const category of categories) {
    const slug = slugify(category.name || '') || `category-${category.id}`

    try {
      await prisma.category.upsert({
        where: { strapiId: category.id },
        update: {
          name: category.name || `دسته ${category.id}`,
          slug,
        },
        create: {
          strapiId: category.id,
          name: category.name || `دسته ${category.id}`,
          slug,
          order: category.lft || 0,
        },
      })
      migrated++
    } catch {
      summary.errors.categories++
    }
  }

  try {
    const [parentLinks] = await conn.execute(
      'SELECT category_id, inv_category_id FROM categories_parent_id_links'
    )

    for (const link of parentLinks as MysqlRow[]) {
      const child = await prisma.category.findUnique({
        where: { strapiId: link.category_id },
      })
      const parent = await prisma.category.findUnique({
        where: { strapiId: link.inv_category_id },
      })

      if (child && parent) {
        await prisma.category.update({
          where: { id: child.id },
          data: { parentId: parent.id },
        })
      }
    }
  } catch {
    // Some datasets may not include the parent links table.
  }

  summary.imported.categories = migrated

  await emit(onProgress, {
    step: 'categories',
    message: `${migrated} دسته‌بندی منتقل شد`,
    progressCurrent: migrated,
    progressTotal: categories.length,
    summary: {
      imported: summary.imported,
      errors: summary.errors,
    },
  })
}

async function migrateAuthors(params: {
  conn: mysql.Connection
  prisma: PrismaClient
  summary: StrapiImportSummary
  dryRun: boolean
  onProgress?: RunImportParams['onProgress']
}) {
  const { conn, prisma, summary, dryRun, onProgress } = params
  await emit(onProgress, {
    step: 'authors',
    message: 'در حال انتقال نویسندگان',
  })

  const [adminRows] = await conn.execute(
    'SELECT id, firstname, lastname, email, username FROM admin_users WHERE is_active = 1'
  )

  let upUsers: MysqlRow[] = []

  try {
    const [upRows] = await conn.execute(
      `SELECT DISTINCT u.id, u.username, u.email
       FROM up_users u
       INNER JOIN posts_publisher_links pl ON pl.user_id = u.id`
    )
    upUsers = upRows as MysqlRow[]
  } catch {
    upUsers = []
  }

  const users = [
    ...(adminRows as MysqlRow[]).map((user) => ({
      id: user.id,
      name:
        `${user.firstname || ''} ${user.lastname || ''}`.trim() ||
        user.username ||
        'GSM',
      email: user.email,
    })),
    ...upUsers.map((user) => ({
      id: user.id + 100000,
      name: (user.username || 'GSM').replace(/\x00/g, ''),
      email: user.email,
    })),
  ]

  if (dryRun) {
    return
  }

  let migrated = 0

  for (const user of users) {
    const normalizedName =
      (user.name || 'GSM').replace(/\x00/g, '').trim() || `نویسنده ${user.id}`
    const slug = slugify(normalizedName) || `author-${user.id}`

    try {
      await prisma.author.upsert({
        where: { strapiId: user.id },
        update: { name: normalizedName, email: user.email },
        create: {
          strapiId: user.id,
          name: normalizedName,
          slug,
          email: user.email,
          label: 'نویسنده جی اس ام',
        },
      })
      migrated++
    } catch {
      summary.errors.authors++

      try {
        await prisma.author.upsert({
          where: { strapiId: user.id },
          update: { name: normalizedName, email: user.email },
          create: {
            strapiId: user.id,
            name: normalizedName,
            slug: `${slug}-${user.id}`,
            email: user.email,
            label: 'نویسنده جی اس ام',
          },
        })
        migrated++
        summary.errors.authors--
      } catch {
        // Keep the error count.
      }
    }
  }

  summary.imported.authors = migrated

  await emit(onProgress, {
    step: 'authors',
    message: `${migrated} نویسنده منتقل شد`,
    progressCurrent: migrated,
    progressTotal: users.length,
    summary: {
      imported: summary.imported,
      errors: summary.errors,
    },
  })
}

async function migratePosts(params: {
  conn: mysql.Connection
  prisma: PrismaClient
  summary: StrapiImportSummary
  options: ReturnType<typeof normalizeOptions>
  s3BaseUrl: string
  onProgress?: RunImportParams['onProgress']
}) {
  const { conn, prisma, summary, options, s3BaseUrl, onProgress } = params
  await emit(onProgress, {
    step: 'posts',
    message: 'در حال انتقال مطالب',
  })

  // Get total count for progress tracking
  const countQuery = `
    SELECT COUNT(*) as total
    FROM posts p
    WHERE p.published_at IS NOT NULL
  `
  const [countRows] = await conn.execute(countQuery)
  const totalPosts = Number((countRows as MysqlRow[])[0]?.total || 0)
  
  // Apply user limits
  const effectiveLimit = options.limit || totalPosts
  const effectiveOffset = options.offset || 0
  const actualTotal = Math.min(effectiveLimit, totalPosts - effectiveOffset)

  if (options.dryRun) {
    const typeQuery = `
      SELECT p.type, COUNT(*) as count
      FROM posts p
      WHERE p.published_at IS NOT NULL
      ${options.offset ? `AND p.id >= (SELECT id FROM posts WHERE published_at IS NOT NULL ORDER BY id LIMIT 1 OFFSET ${options.offset})` : ''}
      GROUP BY p.type
      ${options.limit ? `LIMIT ${options.limit}` : ''}
    `
    const [typeRows] = await conn.execute(typeQuery)
    const types: Record<string, number> = {}

    for (const row of typeRows as MysqlRow[]) {
      types[row.type || 'unknown'] = Number(row.count || 0)
    }

    summary.source.typeDistribution = types

    await emit(onProgress, {
      step: 'posts',
      message: `Dry run: ${actualTotal} مطلب آماده انتقال است`,
      progressCurrent: actualTotal,
      progressTotal: actualTotal,
      summary: {
        source: summary.source,
      },
    })

    return
  }

  let migrated = 0
  const BATCH_SIZE = 100
  let currentOffset = effectiveOffset

  while (migrated < actualTotal) {
    const batchQuery = `
      SELECT p.id, p.titre, p.main_text, p.summary, p.type,
             p.reading_time, p.is_hot, p.source,
             p.published_at, p.created_at, p.updated_at,
             COALESCE(p.views, 0) as views,
             p.related_brand, p.related_product, p.comment
      FROM posts p
      WHERE p.published_at IS NOT NULL
      ORDER BY p.id ASC
      LIMIT ${BATCH_SIZE} OFFSET ${currentOffset}
    `

    const [rows] = await conn.execute(batchQuery)
    const posts = rows as MysqlRow[]

    if (posts.length === 0) break

    for (const post of posts) {
      if (migrated >= actualTotal) break

      if (migrated % 50 === 0) {
        await emit(onProgress, {
          step: 'posts',
          message: `${migrated} از ${actualTotal} مطلب منتقل شد`,
          progressCurrent: migrated,
          progressTotal: actualTotal,
          summary: {
            imported: summary.imported,
            errors: summary.errors,
          },
        })
      }

      try {
      const postType = resolvePostType(post.type)
      const title = post.titre || `پست ${post.id}`
      const slug = slugify(title) || `post-${post.id}`

      let authorId: number | null = null

      try {
        const [publisherRows] = await conn.execute(
          'SELECT * FROM posts_publisher_links WHERE post_id = ? LIMIT 1',
          [post.id]
        )

        const publisherRow = (publisherRows as MysqlRow[])[0]
        if (publisherRow) {
          const sourceAuthorId =
            publisherRow.admin_user_id ||
            publisherRow.user_id ||
            publisherRow.inv_admin_user_id

          if (sourceAuthorId) {
            const author = await prisma.author.findUnique({
              where: { strapiId: sourceAuthorId },
            })

            if (author) {
              authorId = author.id
            }
          }
        }
      } catch {
        // Ignore missing publisher links.
      }

      const [imageRows] = await conn.execute(
        `SELECT f.url FROM files f
         JOIN files_related_morphs frm ON f.id = frm.file_id
         WHERE frm.related_id = ? AND frm.related_type = 'api::post.post'
         AND frm.field = 'main_image'
         ORDER BY frm.\`order\` ASC
         LIMIT 1`,
        [post.id]
      )

      let image: string | null = null
      if ((imageRows as MysqlRow[]).length > 0) {
        const url = (imageRows as MysqlRow[])[0].url
        image = url?.startsWith('http') ? url : `${s3BaseUrl}${url}`
      }

      const [brandRows] = await conn.execute(
        'SELECT brand_id FROM posts_brands_links WHERE post_id = ?',
        [post.id]
      )

      const brandIds = (brandRows as MysqlRow[]).map((row) => row.brand_id)

      let readingTime: number | null = null
      if (post.reading_time) {
        const parsed = parseInt(post.reading_time.toString().replace(/[^\d]/g, ''), 10)
        if (!Number.isNaN(parsed)) {
          readingTime = parsed
        }
      }

      await prisma.article.upsert({
        where: { strapiId: post.id },
        update: {
          title,
          slug,
          excerpt: post.summary,
          content: post.main_text,
          image,
          postType: postType as any,
          status: 'PUBLISHED',
          publishedAt: post.published_at,
          modifiedAt: post.updated_at,
          authorId,
          viewCount: parseInt(String(post.views || 0), 10) || 0,
          readingTime,
          featured: post.is_hot === 1,
          brands:
            brandIds.length > 0 ? (brandIds as Prisma.InputJsonValue) : Prisma.JsonNull,
        } as any,
        create: {
          id: post.id,
          strapiId: post.id,
          title,
          slug,
          excerpt: post.summary,
          content: post.main_text,
          image,
          postType: postType as any,
          status: 'PUBLISHED',
          publishedAt: post.published_at,
          modifiedAt: post.updated_at,
          authorId,
          viewCount: parseInt(String(post.views || 0), 10) || 0,
          readingTime,
          featured: post.is_hot === 1,
          brands:
            brandIds.length > 0 ? (brandIds as Prisma.InputJsonValue) : Prisma.JsonNull,
          createdAt: post.created_at,
        } as any,
      })

      const [tagRows] = await conn.execute(
        'SELECT tag_id FROM posts_tags_links WHERE post_id = ?',
        [post.id]
      )

      for (const tagRow of tagRows as MysqlRow[]) {
        const tag = await prisma.tag.findUnique({
          where: { strapiId: tagRow.tag_id },
        })

        if (!tag) {
          continue
        }

        try {
          await prisma.articleTag.upsert({
            where: {
              articleId_tagId: {
                articleId: post.id,
                tagId: tag.id,
              },
            },
            update: {},
            create: {
              articleId: post.id,
              tagId: tag.id,
            },
          })
          summary.imported.articleTags++
        } catch {
          // Duplicate link, skip.
        }
      }

      migrated++
      summary.imported.posts = migrated

      } catch {
        summary.errors.posts++
      }
    }

    currentOffset += BATCH_SIZE

    // Emit progress after each batch
    await emit(onProgress, {
      step: 'posts',
      message: `${migrated} از ${actualTotal} مطلب منتقل شد`,
      progressCurrent: migrated,
      progressTotal: actualTotal,
      summary: {
        imported: summary.imported,
        errors: summary.errors,
      },
    })
  }
}

async function migrateComments(params: {
  conn: mysql.Connection
  prisma: PrismaClient
  summary: StrapiImportSummary
  options: ReturnType<typeof normalizeOptions>
  onProgress?: RunImportParams['onProgress']
}) {
  const { conn, prisma, summary, options, onProgress } = params
  await emit(onProgress, {
    step: 'comments',
    message: 'در حال انتقال نظرات',
  })

  try {
    await conn.execute('SELECT id FROM comments_comment LIMIT 1')
  } catch {
    await emit(onProgress, {
      step: 'comments',
      message: 'جدول نظرات در Strapi پیدا نشد و این مرحله رد شد',
    })
    return
  }

  const [columns] = await conn.execute('SHOW COLUMNS FROM comments_comment')
  const columnNames = (columns as MysqlRow[]).map((column) => column.Field)

  const hasRemoved = columnNames.includes('removed')
  const hasBlocked = columnNames.includes('blocked')
  const hasApproval = columnNames.includes('approval_status')
  const hasIsAdmin = columnNames.includes('is_admin_comment')
  const authorNameColumn = columnNames.includes('author_name')
    ? 'author_name'
    : columnNames.includes('authorName')
      ? 'authorName'
      : null
  const authorEmailColumn = columnNames.includes('author_email')
    ? 'author_email'
    : columnNames.includes('authorEmail')
      ? 'authorEmail'
      : null

  const selectColumns = ['id', 'content', 'created_at', 'updated_at', 'related']
  if (hasBlocked) selectColumns.push('blocked')
  if (hasApproval) selectColumns.push('approval_status')
  if (hasIsAdmin) selectColumns.push('is_admin_comment')
  if (authorNameColumn) selectColumns.push(authorNameColumn)
  if (authorEmailColumn) selectColumns.push(authorEmailColumn)

  let whereClause = 'WHERE content IS NOT NULL'
  if (hasRemoved) {
    whereClause += ' AND (removed IS NULL OR removed != 1)'
  }

  // Get count for progress tracking
  const [commentCountRows] = await conn.execute(
    `SELECT COUNT(*) as c FROM comments_comment ${whereClause}`
  )
  const totalComments = Math.min(
    Number((commentCountRows as MysqlRow[])[0]?.c || 0),
    options.commentLimit
  )

  if (options.dryRun) {
    return
  }

  let migrated = 0
  const COMMENT_BATCH_SIZE = 500
  let commentOffset = 0

  while (commentOffset < totalComments) {
    const [rows] = await conn.execute(
      `SELECT ${selectColumns.join(', ')}
       FROM comments_comment
       ${whereClause}
       ORDER BY id ASC
       LIMIT ${COMMENT_BATCH_SIZE} OFFSET ${commentOffset}`
    )

    const comments = rows as MysqlRow[]
    if (comments.length === 0) break

    for (const comment of comments) {
      let postId: number | null = null

      if (comment.related) {
        const match = String(comment.related).match(/(\d+)$/)
        if (match) {
          postId = Number(match[1])
        }
      }

      if (!postId) {
        summary.skipped.commentsWithoutArticle++
        continue
      }

      const article = await prisma.article.findFirst({
        where: { id: postId },
      })

      if (!article) {
        summary.skipped.commentsWithoutArticle++
        continue
      }

      const authorName =
        (authorNameColumn ? comment[authorNameColumn] : null) || 'ناشناس'
      const authorEmail = authorEmailColumn ? comment[authorEmailColumn] : null

      try {
        await prisma.comment.upsert({
          where: { strapiId: comment.id },
          update: {
            content: comment.content,
            authorName,
            authorEmail,
            isApproved: hasApproval ? comment.approval_status === 'APPROVED' : !comment.blocked,
            isAdmin: hasIsAdmin ? comment.is_admin_comment === 1 : false,
          },
          create: {
            strapiId: comment.id,
            articleId: article.id,
            content: comment.content,
            authorName,
            authorEmail,
            isApproved: hasApproval ? comment.approval_status === 'APPROVED' : !comment.blocked,
            isAdmin: hasIsAdmin ? comment.is_admin_comment === 1 : false,
            createdAt: comment.created_at || new Date(),
          },
        })

        migrated++
        summary.imported.comments = migrated
      } catch {
        summary.errors.comments++
      }
    }

    commentOffset += COMMENT_BATCH_SIZE

    await emit(onProgress, {
      step: 'comments',
      message: `${migrated} از ${totalComments} نظر منتقل شد`,
      progressCurrent: migrated,
      progressTotal: totalComments,
      summary: {
        imported: summary.imported,
        skipped: summary.skipped,
        errors: summary.errors,
      },
    })
  }

  try {
    const [threadLinks] = await conn.execute(
      'SELECT comment_id, inv_comment_id FROM comments_comment_thread_of_links'
    )

    for (const link of threadLinks as MysqlRow[]) {
      try {
        const child = await prisma.comment.findUnique({
          where: { strapiId: link.comment_id },
        })
        const parent = await prisma.comment.findUnique({
          where: { strapiId: link.inv_comment_id },
        })

        if (child && parent) {
          await prisma.comment.update({
            where: { id: child.id },
            data: { parentId: parent.id },
          })
          summary.imported.threadedComments++
        }
      } catch {
        // Skip invalid thread links.
      }
    }
  } catch {
    // The thread links table may not exist on all datasets.
  }
}

async function resetSequences(prisma: PrismaClient, summary: StrapiImportSummary) {
  const tables = ['Article', 'Author', 'Category', 'Tag', 'Comment']

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`
      )
    } catch {
      summary.errors.sequenceResets++
    }
  }
}

export async function inspectStrapiConnection(config: StrapiConnectionConfig) {
  const conn = await createConnection(config)

  try {
    const [versionRows] = await conn.query('SELECT VERSION() as version')
    const source = await fetchSourceStats(conn)

    return {
      version: String((versionRows as MysqlRow[])[0]?.version || ''),
      source,
    }
  } finally {
    await conn.end()
  }
}

export async function runStrapiImport({
  prisma,
  connection,
  options,
  onProgress,
}: RunImportParams): Promise<StrapiImportSummary> {
  const normalizedOptions = normalizeOptions(options)
  const summary = createSummary(normalizedOptions)
  const conn = await createConnection(connection)
  const s3BaseUrl = normalizeS3BaseUrl(connection.s3BaseUrl)

  await emit(onProgress, {
    step: 'connect',
    message: 'اتصال به دیتابیس Strapi برقرار شد',
  })

  try {
    summary.source = {
      ...summary.source,
      ...(await fetchSourceStats(conn)),
    }

    await emit(onProgress, {
      step: 'connect',
      message: `منبع شناسایی شد: ${summary.source.posts} مطلب، ${summary.source.tags} تگ، ${summary.source.comments} نظر`,
      summary: {
        source: summary.source,
      },
    })

    await migrateTags({
      conn,
      prisma,
      summary,
      dryRun: normalizedOptions.dryRun,
      onProgress,
    })

    await migrateCategories({
      conn,
      prisma,
      summary,
      dryRun: normalizedOptions.dryRun,
      onProgress,
    })

    await migrateAuthors({
      conn,
      prisma,
      summary,
      dryRun: normalizedOptions.dryRun,
      onProgress,
    })

    await migratePosts({
      conn,
      prisma,
      summary,
      options: normalizedOptions,
      s3BaseUrl,
      onProgress,
    })

    if (!normalizedOptions.skipComments) {
      await migrateComments({
        conn,
        prisma,
        summary,
        options: normalizedOptions,
        onProgress,
      })
    } else {
      await emit(onProgress, {
        step: 'comments',
        message: 'مرحله انتقال نظرات بر اساس تنظیمات رد شد',
      })
    }

    if (!normalizedOptions.dryRun) {
      await resetSequences(prisma, summary)
      summary.target = await fetchTargetStats(prisma)
    }

    await emit(onProgress, {
      step: 'done',
      message: normalizedOptions.dryRun
        ? 'Dry run با موفقیت تکمیل شد'
        : 'درون‌ریزی با موفقیت تکمیل شد',
      summary,
    })

    return summary
  } finally {
    await conn.end()
  }
}
