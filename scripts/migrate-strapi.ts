/**
 * Strapi MySQL to GSM PostgreSQL Migration Script
 *
 * Migrates data from the Strapi MySQL database to the new PostgreSQL database.
 * IMPORTANT: Preserves original Strapi IDs as the primary article ID to maintain URL compatibility.
 *   URL format: /mag/news/{STRAPI_ID}/{slug}
 *
 * Usage:
 *   npx ts-node scripts/migrate-strapi.ts [--dry-run] [--limit N] [--offset N]
 *
 * Strapi Schema (from 1.sql dump):
 *   posts: id, titre (title), main_text (content), summary, type, reading_time, views, is_hot, source, related_brand, related_product, comment (json)
 *   tags: id, name (no slug!)
 *   categories: id, name (no slug!), rght, lft, depth
 *   comments_comment: id, content, author_name, author_email, blocked, is_admin_comment, approval_status, related
 *   admin_users: id, firstname, lastname, email, is_active
 *   files: id, name, url, alternative_text, caption, width, height, formats, ext, mime, provider
 *   brands: id, persian_name, english_name, description, priority, seo_box, views
 *   posts_publisher_links: post_id, admin_user_id
 *   posts_tags_links: post_id, tag_id
 *   posts_brands_links: post_id, brand_id
 *   comments_comment_thread_of_links: comment_id, inv_comment_id
 *   files_related_morphs: file_id, related_id, related_type, field, order
 *   categories_parent_id_links: category_id, inv_category_id
 */

import { PrismaClient } from '@prisma/client'
import mysql from 'mysql2/promise'

const prisma = new PrismaClient()

// Parse CLI arguments
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitIndex = args.indexOf('--limit')
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : 0
const offsetIndex = args.indexOf('--offset')
const OFFSET = offsetIndex !== -1 ? parseInt(args[offsetIndex + 1]) : 0

const S3_BASE_URL = process.env.S3_BASE_URL || 'https://s3.gsm.ir/gsmblog-production'

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

async function createMySQLConnection() {
  return mysql.createConnection({
    host: process.env.STRAPI_DB_HOST || '172.30.3.230',
    port: parseInt(process.env.STRAPI_DB_PORT || '3306'),
    user: process.env.STRAPI_DB_USER || 'p.mansouri',
    password: process.env.STRAPI_DB_PASSWORD || 'JFtrUKEmmccN',
    database: process.env.STRAPI_DB_NAME || 'blog_gsm_production',
    charset: 'utf8mb4',
  })
}

async function migrateTags(conn: mysql.Connection) {
  console.log('\n=== Migrating Tags ===')
  const [rows] = await conn.execute('SELECT id, name FROM tags WHERE name IS NOT NULL')
  const tags = rows as any[]
  console.log(`Found ${tags.length} tags`)

  if (DRY_RUN) return

  let count = 0
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
      count++
    } catch (err: any) {
      // Slug collision - append id
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
        count++
      } catch (e: any) {
        console.error(`  Error tag ${tag.id} (${tag.name}): ${e.message}`)
      }
    }
  }
  console.log(`Migrated ${count}/${tags.length} tags`)
}

async function migrateCategories(conn: mysql.Connection) {
  console.log('\n=== Migrating Categories ===')
  const [rows] = await conn.execute('SELECT id, name, rght, lft, depth FROM categories')
  const categories = rows as any[]
  console.log(`Found ${categories.length} categories`)

  if (DRY_RUN) return

  let count = 0
  for (const cat of categories) {
    const slug = slugify(cat.name || '') || `category-${cat.id}`
    try {
      await prisma.category.upsert({
        where: { strapiId: cat.id },
        update: { name: cat.name || `دسته ${cat.id}`, slug },
        create: {
          strapiId: cat.id,
          name: cat.name || `دسته ${cat.id}`,
          slug,
          order: cat.lft || 0,
        },
      })
      count++
    } catch (err: any) {
      console.error(`  Error category ${cat.id}: ${err.message}`)
    }
  }

  // Set parent relationships
  const [parentLinks] = await conn.execute(
    'SELECT category_id, inv_category_id FROM categories_parent_id_links'
  )
  for (const link of parentLinks as any[]) {
    try {
      const child = await prisma.category.findUnique({ where: { strapiId: link.category_id } })
      const parent = await prisma.category.findUnique({ where: { strapiId: link.inv_category_id } })
      if (child && parent) {
        await prisma.category.update({
          where: { id: child.id },
          data: { parentId: parent.id },
        })
      }
    } catch (err: any) {
      // Skip
    }
  }
  console.log(`Migrated ${count}/${categories.length} categories`)
}

async function migrateAuthors(conn: mysql.Connection) {
  console.log('\n=== Migrating Authors (from admin_users) ===')
  const [rows] = await conn.execute(
    'SELECT id, firstname, lastname, email, username FROM admin_users WHERE is_active = 1'
  )
  const users = rows as any[]
  console.log(`Found ${users.length} active admin users`)

  if (DRY_RUN) return

  let count = 0
  for (const user of users) {
    const name = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username || 'نویسنده GSM'
    const slug = slugify(name) || `author-${user.id}`
    try {
      await prisma.author.upsert({
        where: { strapiId: user.id },
        update: { name, email: user.email },
        create: {
          strapiId: user.id,
          name,
          slug,
          email: user.email,
          label: 'نویسنده جی اس ام',
        },
      })
      count++
    } catch (err: any) {
      try {
        await prisma.author.upsert({
          where: { strapiId: user.id },
          update: { name, email: user.email },
          create: {
            strapiId: user.id,
            name,
            slug: `${slug}-${user.id}`,
            email: user.email,
            label: 'نویسنده جی اس ام',
          },
        })
        count++
      } catch (e: any) {
        console.error(`  Error author ${user.id}: ${e.message}`)
      }
    }
  }
  console.log(`Migrated ${count}/${users.length} authors`)
}

async function migratePosts(conn: mysql.Connection) {
  console.log('\n=== Migrating Posts ===')

  let query = `
    SELECT p.id, p.titre, p.main_text, p.summary, p.type,
           p.reading_time, p.is_hot, p.source,
           p.published_at, p.created_at, p.updated_at,
           COALESCE(p.views, 0) as views,
           p.related_brand, p.related_product, p.comment
    FROM posts p
    WHERE p.published_at IS NOT NULL
    ORDER BY p.id ASC
  `
  if (LIMIT > 0) query += ` LIMIT ${LIMIT}`
  if (OFFSET > 0) query += ` OFFSET ${OFFSET}`

  const [rows] = await conn.execute(query)
  const posts = rows as any[]
  console.log(`Found ${posts.length} published posts`)

  if (DRY_RUN) {
    // Show type distribution
    const types: Record<string, number> = {}
    for (const p of posts) { types[p.type || 'null'] = (types[p.type || 'null'] || 0) + 1 }
    console.log('Type distribution:', types)
    return
  }

  let count = 0
  let errors = 0

  for (const post of posts) {
    try {
      // Determine post type from Strapi 'type' field
      let postType = 'NEWS'
      const pType = (post.type || '').toLowerCase()
      if (pType === 'article' || pType === 'مقاله') postType = 'ARTICLE'
      else if (pType === 'review' || pType === 'بررسی') postType = 'REVIEW'
      else if (pType === 'story') postType = 'STORY'

      // Title is in 'titre' field (Persian), NOT 'title'
      const title = post.titre || `پست ${post.id}`
      // Slug from titre
      const slug = slugify(title) || `post-${post.id}`

      // Get publisher (author) from link table
      const [publisherRows] = await conn.execute(
        'SELECT admin_user_id FROM posts_publisher_links WHERE post_id = ?',
        [post.id]
      )
      let authorId: number | null = null
      if ((publisherRows as any[]).length > 0) {
        const author = await prisma.author.findUnique({
          where: { strapiId: (publisherRows as any[])[0].admin_user_id },
        })
        if (author) authorId = author.id
      }

      // Get featured image from files_related_morphs
      const [imageRows] = await conn.execute(
        `SELECT f.url FROM files f
         JOIN files_related_morphs frm ON f.id = frm.file_id
         WHERE frm.related_id = ? AND frm.related_type = 'api::post.post'
         AND frm.field = 'image'
         ORDER BY frm.\`order\` ASC
         LIMIT 1`,
        [post.id]
      )
      let image: string | null = null
      if ((imageRows as any[]).length > 0) {
        const url = (imageRows as any[])[0].url
        // Ensure full URL
        image = url?.startsWith('http') ? url : `${S3_BASE_URL}${url}`
      }

      // Get brand IDs
      const [brandRows] = await conn.execute(
        'SELECT brand_id FROM posts_brands_links WHERE post_id = ?',
        [post.id]
      )
      const brandIds = (brandRows as any[]).map((r: any) => r.brand_id)

      // Parse reading time (might be string like "5" or "5 دقیقه")
      let readingTime: number | null = null
      if (post.reading_time) {
        const parsed = parseInt(post.reading_time.toString().replace(/[^\d]/g, ''))
        if (!isNaN(parsed)) readingTime = parsed
      }

      // Create/update article - PRESERVE STRAPI ID AS PRIMARY ID!
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
          viewCount: parseInt(post.views) || 0,
          readingTime,
          featured: post.is_hot === 1,
          brands: brandIds.length > 0 ? brandIds : undefined,
        },
        create: {
          id: post.id, // *** PRESERVE STRAPI ID FOR URL COMPATIBILITY ***
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
          viewCount: parseInt(post.views) || 0,
          readingTime,
          featured: post.is_hot === 1,
          brands: brandIds.length > 0 ? brandIds : undefined,
          createdAt: post.created_at,
        },
      })

      // Migrate tag relationships
      const [tagRows] = await conn.execute(
        'SELECT tag_id FROM posts_tags_links WHERE post_id = ?',
        [post.id]
      )
      for (const tagRow of tagRows as any[]) {
        const tag = await prisma.tag.findUnique({ where: { strapiId: tagRow.tag_id } })
        if (tag) {
          try {
            await prisma.articleTag.upsert({
              where: { articleId_tagId: { articleId: post.id, tagId: tag.id } },
              update: {},
              create: { articleId: post.id, tagId: tag.id },
            })
          } catch {
            // Skip duplicate tag assignments
          }
        }
      }

      count++
      if (count % 500 === 0) console.log(`  Progress: ${count}/${posts.length}`)
    } catch (err: any) {
      errors++
      if (errors <= 20) console.error(`  Error post ${post.id}: ${err.message}`)
    }
  }
  console.log(`Migrated ${count}/${posts.length} posts (${errors} errors)`)
}

async function migrateComments(conn: mysql.Connection) {
  console.log('\n=== Migrating Comments ===')

  // comments_comment.related field contains the related entity string like "api::post.post:12345"
  // First check which columns exist
  let query = `SELECT id, content, created_at, updated_at FROM comments_comment LIMIT 1`
  try {
    await conn.execute(query)
  } catch {
    console.log('  comments_comment table not found or empty, skipping')
    return
  }

  // Try to find all columns that exist
  const [cols] = await conn.execute(`SHOW COLUMNS FROM comments_comment`)
  const colNames = (cols as any[]).map((c: any) => c.Field)
  console.log(`  Available columns: ${colNames.join(', ')}`)

  const hasRemoved = colNames.includes('removed')
  const hasBlocked = colNames.includes('blocked')
  const hasApproval = colNames.includes('approval_status')
  const hasIsAdmin = colNames.includes('is_admin_comment')
  const hasAuthorName = colNames.includes('author_name') || colNames.includes('authorName')
  const hasAuthorEmail = colNames.includes('author_email') || colNames.includes('authorEmail')
  const hasRelated = colNames.includes('related')
  const authorNameCol = colNames.includes('author_name') ? 'author_name' : (colNames.includes('authorName') ? 'authorName' : null)
  const authorEmailCol = colNames.includes('author_email') ? 'author_email' : (colNames.includes('authorEmail') ? 'authorEmail' : null)

  const selectCols = ['id', 'content', 'created_at', 'updated_at']
  if (hasBlocked) selectCols.push('blocked')
  if (hasApproval) selectCols.push('approval_status')
  if (hasIsAdmin) selectCols.push('is_admin_comment')
  if (authorNameCol) selectCols.push(authorNameCol)
  if (authorEmailCol) selectCols.push(authorEmailCol)
  if (hasRelated) selectCols.push('related')

  let whereClause = 'WHERE content IS NOT NULL'
  if (hasRemoved) whereClause += ' AND (removed IS NULL OR removed != 1)'

  const [rows] = await conn.execute(
    `SELECT ${selectCols.join(', ')} FROM comments_comment ${whereClause} ORDER BY id ASC`
  )
  const comments = rows as any[]
  console.log(`Found ${comments.length} comments`)

  if (DRY_RUN) return

  let count = 0
  let skipped = 0
  for (const comment of comments) {
    // Parse related field to get post ID
    let postId: number | null = null
    if (comment.related) {
      // Format might be "api::post.post:12345" or just a number
      const match = comment.related.toString().match(/(\d+)$/)
      if (match) postId = parseInt(match[1])
    }

    if (!postId) { skipped++; continue }

    // Check if the article exists
    const article = await prisma.article.findFirst({ where: { id: postId } })
    if (!article) { skipped++; continue }

    const authorName = comment[authorNameCol || 'author_name'] || comment.authorName || 'ناشناس'
    const authorEmail = comment[authorEmailCol || 'author_email'] || comment.authorEmail || null

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
      count++
      if (count % 5000 === 0) console.log(`  Comment progress: ${count}`)
    } catch (err: any) {
      if (count < 10) console.error(`  Error comment ${comment.id}: ${err.message}`)
    }
  }
  console.log(`  Skipped ${skipped} comments (no matching post)`)

  // Set thread (parent) relationships
  console.log('  Setting comment thread relationships...')
  const [threadLinks] = await conn.execute(
    'SELECT comment_id, inv_comment_id FROM comments_comment_thread_of_links'
  )
  let threadCount = 0
  for (const link of threadLinks as any[]) {
    try {
      const child = await prisma.comment.findUnique({ where: { strapiId: link.comment_id } })
      const parent = await prisma.comment.findUnique({ where: { strapiId: link.inv_comment_id } })
      if (child && parent) {
        await prisma.comment.update({
          where: { id: child.id },
          data: { parentId: parent.id },
        })
        threadCount++
      }
    } catch {
      // Skip
    }
  }
  console.log(`Migrated ${count} comments (${threadCount} threaded)`)
}

async function resetSequences() {
  console.log('\n=== Resetting PostgreSQL auto-increment sequences ===')
  const tables = [
    { model: 'Article', table: 'Article' },
    { model: 'Author', table: 'Author' },
    { model: 'Category', table: 'Category' },
    { model: 'Tag', table: 'Tag' },
    { model: 'Comment', table: 'Comment' },
  ]
  for (const { model, table } of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`
      )
      console.log(`  Reset sequence for ${model}`)
    } catch (err: any) {
      console.error(`  Error resetting ${model}: ${err.message}`)
    }
  }
}

async function printStats() {
  console.log('\n=== Migration Statistics ===')
  const articleCount = await prisma.article.count()
  const tagCount = await prisma.tag.count()
  const categoryCount = await prisma.category.count()
  const authorCount = await prisma.author.count()
  const commentCount = await prisma.comment.count()
  const articleTagCount = await prisma.articleTag.count()

  console.log(`  Articles:    ${articleCount}`)
  console.log(`  Tags:        ${tagCount}`)
  console.log(`  Categories:  ${categoryCount}`)
  console.log(`  Authors:     ${authorCount}`)
  console.log(`  Comments:    ${commentCount}`)
  console.log(`  Article-Tag: ${articleTagCount}`)
}

async function main() {
  console.log('============================================')
  console.log('  GSM Strapi MySQL -> PostgreSQL Migration')
  console.log('============================================')
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  if (LIMIT) console.log(`Limit: ${LIMIT}`)
  if (OFFSET) console.log(`Offset: ${OFFSET}`)

  const conn = await createMySQLConnection()
  console.log('Connected to Strapi MySQL database')

  // Show source stats
  const [[postCount]] = await conn.execute('SELECT COUNT(*) as c FROM posts WHERE published_at IS NOT NULL') as any
  const [[tagCount]] = await conn.execute('SELECT COUNT(*) as c FROM tags WHERE name IS NOT NULL') as any
  const [[commentCount]] = await conn.execute('SELECT COUNT(*) as c FROM comments_comment WHERE content IS NOT NULL') as any
  console.log(`\nSource: ${postCount.c} posts, ${tagCount.c} tags, ${commentCount.c} comments`)

  try {
    await migrateTags(conn)
    await migrateCategories(conn)
    await migrateAuthors(conn)
    await migratePosts(conn)
    await migrateComments(conn)

    if (!DRY_RUN) {
      await resetSequences()
      await printStats()
    }

    console.log('\n============================================')
    console.log('  Migration completed successfully!')
    console.log('============================================')
  } catch (err) {
    console.error('\nMigration failed:', err)
    process.exit(1)
  } finally {
    await conn.end()
    await prisma.$disconnect()
  }
}

main()
