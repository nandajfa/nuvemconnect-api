import { Email } from '../../../../domain/entities/email'
import { Account } from '../../../../domain/entities/account'
import { IAccountRepository } from '../../../../domain/repositories/account-repository'
import { hashPassword, comparePassword } from '../../../lib/brcypt'
import { generateToken } from '../../../lib/jwt'
import { accountModel } from '../model/account-model'

interface TokenPayload {
  uuid: string
  email: string
}

export class AccountRepositoryMongoose implements IAccountRepository {
  async save (account: Account): Promise<void> {
    const hashedPassword = hashPassword(account.password)
    const acc = new accountModel({
      uuid: account.uuid,
      name: account.name,
      email: account.email.value,
      password: hashedPassword,
      active: false
    })
    acc.save()
  }
  async findByEmail (email: string): Promise<Account | null> {
    const data = await accountModel.findOne({ email })

    if (!data) {
      return null
    }
    const acc = Account.reconstitute(
      data.uuid,
      data.name,
      data.email,
      data.password
    )
    return acc
  }

  async activateAccount (email: string): Promise<void> {
    await accountModel.updateOne({ email: email }, { $set: { active: true } })
  }

  async findByEmailPassword (
    email: Email,
    password: string
  ): Promise<string | null> {
    const data = await accountModel.findOne({ email: email.value })
    if (!data) {
      return null
    }
    if (!data.active) {
      throw new Error('Account not activated')
    }

    const isPasswordValid = await comparePassword(password, data.password)
    if (!isPasswordValid) {
      return null
    }

    const tokenPayload: TokenPayload = {
      uuid: data.uuid,
      email: data.email
    }

    const token = await generateToken(tokenPayload)
    if (!token) {
      return null
    }

    return token
  }

  async updatePassword (email: string, password: string): Promise<void> {
    const hashedPassword = hashPassword(password)
    await accountModel.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    )
  }
}
