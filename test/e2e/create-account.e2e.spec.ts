import request from 'supertest'
import { App } from '../../src/app'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

const app = new App().server
let mongoServer: MongoMemoryServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
  await app.ready()
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
  await app.close()
})

describe('[e2e] POST /account - Create Account', () => {
  it('should create an account and activate account', async () => {
    const response = await request(app.server).post('/account').send({
      name: 'Unicloud e2e',
      email: 'user_test_e2e@gmail.com',
      password: 'Password123@',
      passwordConfirmation: 'Password123@'
    })

    expect(response.statusCode).toBe(200)

    expect(response.body).toHaveProperty('uuid')

    const activate = await request(app.server).get(
      `/account/activate/${response.body.uuid}`
    )
    expect(activate.statusCode).toBe(200)
  })

  it('should fail if password confirmation does not match', async () => {
    const response = await request(app.server).post('/account').send({
      name: 'Unicloud e2e',
      email: 'user_test_e2e@gmail.com',
      password: 'Password123@',
      passwordConfirmation: 'Password123'
    })

    expect(response.statusCode).toBe(422)
    expect(response.body.message).toBe(
      'password confirmation different from password'
    )
  })

  it('should fail if email already exists', async () => {
    await request(app.server).post('/account').send({
      name: 'Unicloud e2e',
      email: 'user_test_e2e@gmail.com',
      password: 'Password123@',
      passwordConfirmation: 'Password123@'
    })

    const response = await request(app.server).post('/account').send({
      name: 'Unicloud e2e',
      email: 'user_test_e2e@gmail.com',
      password: 'Password123@',
      passwordConfirmation: 'Password123@'
    })

    expect(response.statusCode).toBe(422)
    expect(response.body.message).toBe('Account already exist')
  })
})
