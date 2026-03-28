/**
 * Fix article images - updates image field from Strapi files_related_morphs
 * Run after migration if images are missing.
 * Usage: npx tsx scripts/fix-images.ts
 */
import { PrismaClient } from '@prisma/client'
import mysql from 'mysql2/promise'

const prisma = new PrismaClient()
const S3_BASE_URL = process.env.S3_BASE_URL?.replace(/\/$/, '') || ''

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

async function main() {
  const conn = await mysql.createConnection({
    host: getRequiredEnv('STRAPI_DB_HOST'),
    port: parseInt(process.env.STRAPI_DB_PORT || '3306'),
    user: getRequiredEnv('STRAPI_DB_USER'),
    password: getRequiredEnv('STRAPI_DB_PASSWORD'),
    database: getRequiredEnv('STRAPI_DB_NAME'),
    charset: 'utf8mb4',
  })

  console.log('Connected to MySQL. Fetching image mappings...')

  const [rows] = await conn.execute(
    `SELECT frm.related_id as post_id, f.url 
     FROM files_related_morphs frm 
     JOIN files f ON f.id = frm.file_id 
     WHERE frm.related_type = 'api::post.post' 
     AND frm.field = 'main_image'
     ORDER BY frm.related_id, frm.\`order\` ASC`
  )

  const imageMap = new Map<number, string>()
  for (const row of rows as any[]) {
    if (!imageMap.has(row.post_id)) {
      let url = row.url
      if (url && !url.startsWith('http')) {
        url = `${S3_BASE_URL}${url.startsWith('/') ? url : '/' + url}`
      }
      imageMap.set(row.post_id, url)
    }
  }

  console.log(`Found ${imageMap.size} post-image mappings`)

  let updated = 0
  let batch: { id: number; url: string }[] = []

  const entries = Array.from(imageMap.entries())
  for (const [postId, url] of entries) {
    batch.push({ id: postId, url })
    if (batch.length >= 500) {
      await Promise.all(
        batch.map(({ id, url }) =>
          prisma.article.updateMany({
            where: { id, image: null },
            data: { image: url },
          })
        )
      )
      updated += batch.length
      console.log(`Updated ${updated}/${imageMap.size}`)
      batch = []
    }
  }

  // Remaining batch
  if (batch.length > 0) {
    await Promise.all(
      batch.map(({ id, url }) =>
        prisma.article.updateMany({
          where: { id },
          data: { image: url },
        })
      )
    )
    updated += batch.length
  }

  const withImage = await prisma.article.count({ where: { image: { not: null } } })
  console.log(`\nDone! ${withImage} articles now have images.`)

  await conn.end()
  await prisma.$disconnect()
}

main().catch(console.error)
