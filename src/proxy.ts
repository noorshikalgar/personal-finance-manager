import { auth } from '@/lib/auth'

export const proxy = auth((_req) => {
  return
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/accounts/:path*', '/api/transactions/:path*', '/api/categories/:path*'],
}
