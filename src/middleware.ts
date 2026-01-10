import { auth } from '@/lib/auth'

export default auth((req) => {
  // Add any custom middleware logic here if needed
  return
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/accounts/:path*', '/api/transactions/:path*', '/api/categories/:path*'],
  runtime: 'nodejs',
}
