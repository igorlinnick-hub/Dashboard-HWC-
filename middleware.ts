import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // TODO: check Supabase Auth session cookie
  // If no session and trying to access dashboard, redirect to login
  // const session = request.cookies.get('sb-access-token');

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isDashboardPage = !isAuthPage && !request.nextUrl.pathname.startsWith('/api');

  // TODO: implement actual session check
  // if (isDashboardPage && !session) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
