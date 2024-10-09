import jwt from 'jsonwebtoken'

interface TokenPayload {
  uuid: string
  email: string
}
const secretKey = process.env.JWT_SECRET_KEY

function generateToken (
  payload: TokenPayload,
  expiresIn: string = '1h'
): string {
  if (!secretKey) {
    throw new Error('Missing JWT_SECRET_KEY environment variable')
  }
  return jwt.sign(payload, secretKey, { expiresIn })
}

function generateActivationToken (email: string): string {
  if (!secretKey) {
    throw new Error('Missing JWT_SECRET_KEY environment variable')
  }

  return jwt.sign({ email }, secretKey, { expiresIn: '15min' })
}

function verifyToken (token: string): string {
  if (!secretKey) {
    throw new Error('Missing JWT_SECRET_KEY environment variable')
  }
  const payload = jwt.verify(token, secretKey) as {
    email: string
  }
  return payload.email
}

export { generateToken, generateActivationToken, verifyToken }
