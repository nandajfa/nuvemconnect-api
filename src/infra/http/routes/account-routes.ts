import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateAccountUseCase } from '../../../use-cases/user/create-account-use-cases'
import { AccountRepositoryMongoose } from '../../database/mongoose/repositories/account-repository-mongoose'
import { BadRequestError } from '../../../domain/utils/error-handle'
import { LoginUseCase } from '../../../use-cases/user/login-use-case'
import { resetPasswordUseCase } from '../../../use-cases/user/reset-password-use-case'
import { ActivateAccountUseCase } from '../../../use-cases/user/activate-account-use-case'

export async function accountRoute (fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/account',
    {
      schema: {
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string(),
          passwordConfirmation: z.string()
        })
      }
    },
    async (req, res) => {
      const { name, email, password, passwordConfirmation } = req.body
      if (password != passwordConfirmation) {
        throw new BadRequestError(
          'password confirmation different from password'
        )
      }
      const accountRepository = new AccountRepositoryMongoose()
      const createAccountUseCase = new CreateAccountUseCase(accountRepository)
      const account = await createAccountUseCase.execute({
        name,
        email,
        password
      })
      res.send({ uuid: account.uuid })
    }
  )

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/login',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string()
        })
      }
    },
    async (req, res) => {
      const { email, password } = req.body
      const accountRepository = new AccountRepositoryMongoose()
      const loginUseCase = new LoginUseCase(accountRepository)
      const token = await loginUseCase.execute({ email, password })
      res.send({ token })
    }
  )

  // fastify.withTypeProvider<ZodTypeProvider>().post(
  //   '/forgot-password',
  //   {
  //     schema: {
  //       body: z.object({
  //         email: z.string().email()
  //       })
  //     }
  //   },
  //   async (req, res) => {
  //     const { email } = req.body

  //     const accountRepository = new AccountRepositoryMongoose()
  //     const account = await accountRepository.findByEmail(email)
  //     if (!account) {
  //       throw new BadRequestError('E-mail not found')
  //     }
  //     sendEmail = new sendEmailUseCase(accountRepository)
  //     const verificationCode = await sendEmail.execute(email)

  //     res.send({ verificationCode })
  //   }
  // )

  fastify.withTypeProvider<ZodTypeProvider>().put(
    '/reset-password',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string(),
          passwordConfirmation: z.string()
        })
      }
    },
    async (req, res) => {
      const { email, password, passwordConfirmation } = req.body
      if (password != passwordConfirmation) {
        throw new BadRequestError(
          'password confirmation different from password'
        )
      }
      const accountRepository = new AccountRepositoryMongoose()
      const resetPassword = new resetPasswordUseCase(accountRepository)
      const result = await resetPassword.execute({ email, password })
      return res.send({ message: result })
    }
  )

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/activate-account',
    {
      schema: {
        querystring: z.object({
          token: z.string()
        })
      }
    },
    async (req, res) => {
      const { token } = req.query

      const accountRepository = new AccountRepositoryMongoose()
      const activateAccountUseCase = new ActivateAccountUseCase(
        accountRepository
      )

      const result = await activateAccountUseCase.execute(token)
      return res.send({ message: result })
    }
  )
}
