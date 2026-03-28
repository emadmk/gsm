import assert from 'node:assert/strict'
import test from 'node:test'
import {
  strapiConnectionSchema,
  strapiImportRequestSchema,
} from '../lib/imports/strapi-schemas'

test('strapi connection schema accepts a valid connection payload', () => {
  const parsed = strapiConnectionSchema.parse({
    host: '172.30.3.230',
    port: '3306',
    user: 'db_user',
    password: 'secret-value',
    database: 'blog_gsm_production',
    s3BaseUrl: 'https://s3.example.com/bucket',
  })

  assert.deepEqual(parsed, {
    host: '172.30.3.230',
    port: 3306,
    user: 'db_user',
    password: 'secret-value',
    database: 'blog_gsm_production',
    s3BaseUrl: 'https://s3.example.com/bucket',
  })
})

test('strapi connection schema rejects empty secrets and required fields', () => {
  const result = strapiConnectionSchema.safeParse({
    host: '',
    port: 3306,
    user: '',
    password: '',
    database: '',
  })

  assert.equal(result.success, false)
})

test('strapi import request schema normalizes optional numeric fields', () => {
  const parsed = strapiImportRequestSchema.parse({
    connection: {
      host: 'db.internal',
      port: '3306',
      user: 'reader',
      password: 'pw',
      database: 'strapi',
      s3BaseUrl: '',
    },
    options: {
      dryRun: true,
      skipComments: false,
      limit: '100',
      offset: '',
      commentLimit: '2500',
    },
  })

  assert.equal(parsed.connection.port, 3306)
  assert.equal(parsed.options.limit, 100)
  assert.equal(parsed.options.offset, undefined)
  assert.equal(parsed.options.commentLimit, 2500)
})
