import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { hasSupabaseCreds } from '@/lib/supabase/mockDb';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected paths
  const isAdminPath = pathname.startsWith('/admin');
  const isResidentPath = pathname.startsWith('/resident');
  const isGuardPath = pathname.startsWith('/guard');

  const isProtectedPath = isAdminPath || isResidentPath || isGuardPath;

  // Let public assets and api routes go through
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // 1. MOCK MODE AUTHENTICATION
  if (!hasSupabaseCreds()) {
    if (isProtectedPath) {
      const mockSessionCookie = request.cookies.get('mock_session');
      
      if (!mockSessionCookie?.value) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      try {
        const session = JSON.parse(mockSessionCookie.value);
        const role = session.role;

        if (isAdminPath && role !== 'ADMIN') {
          return NextResponse.redirect(new URL('/login?error=Unauthorized_Admin', request.url));
        }
        if (isResidentPath && role !== 'RESIDENT') {
          return NextResponse.redirect(new URL('/login?error=Unauthorized_Resident', request.url));
        }
        if (isGuardPath && role !== 'GUARD') {
          return NextResponse.redirect(new URL('/login?error=Unauthorized_Guard', request.url));
        }
      } catch (e) {
        // Corrupted session cookie
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('mock_session');
        return response;
      }
    }
    return NextResponse.next();
  }

  // 2. REAL SUPABASE MODE AUTHENTICATION
  // Refresh the session in cookies
  let response = await updateSession(request);

  if (isProtectedPath) {
    // We import dynamically or create server client to avoid next/headers issues in edge runtime if not supported
    // But since Next.js 15 supports it, we create client:
    try {
      const { createServerClient } = await import('@supabase/ssr');
      const cookieStore = request.cookies;
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              response = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check metadata or query profile role
      const userRole = (user as any).user_metadata?.role || (user as any).raw_user_meta_data?.role;

      if (isAdminPath && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login?error=Unauthorized_Admin', request.url));
      }
      if (isResidentPath && userRole !== 'RESIDENT') {
        return NextResponse.redirect(new URL('/login?error=Unauthorized_Resident', request.url));
      }
      if (isGuardPath && userRole !== 'GUARD') {
        return NextResponse.redirect(new URL('/login?error=Unauthorized_Guard', request.url));
      }
    } catch (err) {
      console.error('Supabase middleware error:', err);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/resident/:path*',
    '/guard/:path*',
  ],
};
