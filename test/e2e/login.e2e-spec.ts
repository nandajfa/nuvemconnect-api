import request from 'supertest'
import { App } from '../../src/app'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
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

beforeEach(async () => {
  const response = await request(app.server).post('/account').send({
    name: 'Unicloud e2e',
    email: 'user_e2e@gmail.com',
    password: 'Password123@',
    passwordConfirmation: 'Password123@'
  })
  console.log(response.body)
  expect(response.statusCode).toBe(200)

  const { uuid } = response.body
  const activationResponse = await request(app.server).get(
    `/account/activate/${uuid}`
  )
  expect(activationResponse.statusCode).toBe(200)
})

describe('[e2e] POST /account/login - Login', () => {
  it('should login successfully', async () => {
    const response = await request(app.server).post('/account').send({
      name: 'Unicloud e2e',
      email: 'user_e2e@gmail.com',
      password: 'Password123@',
      passwordConfirmation: 'Password123@'
    })

    expect(response.statusCode).toBe(200)

    const { uuid } = response.body
    const activationResponse = await request(app.server).get(
      `/account/activate/${uuid}`
    )
    expect(activationResponse.statusCode).toBe(200)

    const res = await request(app.server).post('/account/login').send({
      email: 'user_e2e@gmail.com',
      password: 'Password123@'
    })

    expect(res.statusCode).toBe(201)
    expect(res.body).toHaveProperty('token')
  })

  it('should return error if account is not activated', async () => {
    await request(app.server).post('/account').send({
      name: 'Unicloud e2e not activated',
      email: 'not_activated_user@gmail.com',
      password: 'Password123@',
      passwordConfirmation: 'Password123@'
    })

    const response = await request(app.server).post('/account/login').send({
      email: 'not_activated_user@gmail.com',
      password: 'Password123@'
    })

    expect(response.statusCode).toBe(422)
    expect(response.body.message).toBe('Account not activated')
  })

  it('should return error if wrong password', async () => {
    const response = await request(app.server).post('/account/login').send({
      email: 'user_e2e@gmail.com',
      password: 'Password'
    })

    expect(response.statusCode).toBe(404)
    expect(response.body.message).toBe('Invalid email or password')
  })

  it('should return error if wrong email', async () => {
    const response = await request(app.server).post('/account/login').send({
      email: 'user_test_e2e',
      password: 'Password123@'
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual({
      message: 'Invalid input',
      errors: {
        email: ['Invalid email']
      }
    })
  })
})
