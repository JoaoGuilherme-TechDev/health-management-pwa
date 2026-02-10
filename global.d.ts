declare module "bcryptjs" {
  export function hash(
    data: string,
    saltOrRounds: number
  ): Promise<string>

  export function compare(
    data: string,
    encrypted: string
  ): Promise<boolean>
}

declare module "jose" {
  export class SignJWT {
    constructor(payload: any)
    setProtectedHeader(header: any): this
    setIssuedAt(): this
    setExpirationTime(time: string | number): this
    sign(key: Uint8Array): Promise<string>
  }

  export function jwtVerify(
    token: string,
    key: Uint8Array,
    options?: any
  ): Promise<{ payload: any }>
}

