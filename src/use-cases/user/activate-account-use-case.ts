import { IAccountRepository } from '../../domain/repositories/account-repository'
import { BadRequestError } from '../../domain/utils/error-handle'
import { verifyToken } from '../../infra/lib/jwt'

export class ActivateAccountUseCase {
  constructor (private accountRepository: IAccountRepository) {}

  async execute (token: string): Promise<string> {
    let email: string
    try {
      email = verifyToken(token)
    } catch {
      throw new BadRequestError('Token is expired or invalid')
    }

    const account = await this.accountRepository.findByEmail(email)
    if (!account) {
      throw new BadRequestError('Account not found')
    }

    if (account.active) {
      throw new BadRequestError('Account is already active')
    }

    await this.accountRepository.activateAccount(email)
    return 'Account activated successfully'
  }
}
