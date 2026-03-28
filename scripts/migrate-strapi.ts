/**
 * Strapi MySQL to GSM PostgreSQL Migration Script
 *
 * Usage:
 *   npx tsx scripts/migrate-strapi.ts [--dry-run] [--skip-comments] [--limit N] [--offset N] [--comment-limit N]
 */

import { PrismaClient } from '@prisma/client'
import {
  runStrapiImport,
  type StrapiConnectionConfig,
  type StrapiImportOptions,
} from '../lib/imports/strapi-importer'

const prisma = new PrismaClient()

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

function parseOptionalInteger(args: string[], flag: string) {
  const index = args.indexOf(flag)

  if (index === -1) {
    return undefined
  }

  const value = Number.parseInt(args[index + 1] || '', 10)

  return Number.isNaN(value) ? undefined : value
}

async function main() {
  const args = process.argv.slice(2)
  const options: StrapiImportOptions = {
    dryRun: args.includes('--dry-run'),
    skipComments: args.includes('--skip-comments'),
    limit: parseOptionalInteger(args, '--limit'),
    offset: parseOptionalInteger(args, '--offset'),
    commentLimit: parseOptionalInteger(args, '--comment-limit'),
  }

  const connection: StrapiConnectionConfig = {
    host: getRequiredEnv('STRAPI_DB_HOST'),
    port: Number.parseInt(process.env.STRAPI_DB_PORT || '3306', 10),
    user: getRequiredEnv('STRAPI_DB_USER'),
    password: getRequiredEnv('STRAPI_DB_PASSWORD'),
    database: getRequiredEnv('STRAPI_DB_NAME'),
    s3BaseUrl: process.env.S3_BASE_URL || '',
  }

  console.log('============================================')
  console.log('  GSM Strapi MySQL -> PostgreSQL Migration')
  console.log('============================================')
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`)
  if (options.limit) console.log(`Limit: ${options.limit}`)
  if (options.offset) console.log(`Offset: ${options.offset}`)
  if (options.commentLimit) console.log(`Comment limit: ${options.commentLimit}`)
  if (options.skipComments) console.log('Comments: skipped')

  const summary = await runStrapiImport({
    prisma,
    connection,
    options,
    onProgress(event) {
      console.log(`[${event.step}] ${event.message}`)
    },
  })

  console.log('\n============================================')
  console.log('  Migration completed successfully!')
  console.log('============================================')
  console.log(JSON.stringify(summary, null, 2))
}

main()
  .catch((error) => {
    console.error('\nMigration failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
