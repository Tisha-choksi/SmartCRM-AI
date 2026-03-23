// frontend/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: n => request.cookies.get(n)?.value,
                 set: (n,v,o) => response.cookies.set(n,v,o),
                 remove: (n,o) => response.cookies.delete({name:n,...o}) }}
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session && request.nextUrl.pathname.startsWith('/dashboard'))
    return NextResponse.redirect(new URL('/login', request.url))
  return response
}

export const config = { matcher: ['/dashboard/:path*'] }