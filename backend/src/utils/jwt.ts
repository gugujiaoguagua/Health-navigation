import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'

export type AuthTokenPayload = {
  sub: string
}

export function signAccessToken(userId: string) {
  const secret = process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me'
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '30m'
  return jwt.sign({ sub: userId } satisfies AuthTokenPayload, secret, {
    expiresIn: expiresIn as SignOptions['expiresIn']
  })
}

export function verifyAccessToken(token: string) {
  const secret = process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me'
  const payload = jwt.verify(token, secret) as AuthTokenPayload
  if (!payload?.sub) throw new Error('invalid token payload')
  return payload
}
