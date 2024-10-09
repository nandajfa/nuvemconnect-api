import { Email } from '../../src/domain/entities/email'
import { Account } from '../../src/domain/entities/account'
import { IAccountRepository } from '../../src/domain/repositories/account-repository'
import { comparePassword } from '../../src/infra/lib/brcypt'
import { generateToken } from '../../src/infra/lib/jwt'

interface TokenPayload {
  uuid: string
  email: string
}

export class InMemoryAccountRepository implements IAccountRepository {
  public accounts: Account[] = []
  async save (account: Account): Promise<void> {
    this.accounts.push(account)
  }
  async findByEmail (email: string): Promise<Account | null> {
    const account = this.accounts.find(account => account.email.value === email)

    if (!account) {
      return null
    }

    return account
  }

  async findByEmailPassword (
    email: Email,
    password: string
  ): Promise<string | null> {
    const account = this.accounts.find(
      acc => acc.email === email && acc.password === password
    )

    if (!account) {
      return null
    }

    const isPasswordValid = await comparePassword(password, account.password)
    if (!isPasswordValid) {
      return null
    }

    const tokenPayload: TokenPayload = {
      uuid: account.uuid,
      email: email.value
    }

    const token = await generateToken(tokenPayload)
    if (!token) {
      return null
    }

    return token
  }

  async updatePassword (email: string, password: string): Promise<void> {
    const account = this.accounts.find(account => account.email.value === email)

    if (!account) {
      throw new Error('Account not found')
    }

    account.password = password
  }

  async activateAccount (email: string): Promise<void> {
    const account = this.accounts.find(account => account.email.value === email)

    if (!account) {
      throw new Error('Account not found')
    }

    account.active = true
  }
}
