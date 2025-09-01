import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/join", "/sign-in(.*)", "/sign-up(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks/(.*)"]);
const isPublicAPIRoute = createRouteMatcher(["/api/geofences/join/(.*)", "/api/location-update"]);
const isAPIRoute = createRouteMatcher(["/api(.*)"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/create(.*)"]);

const routePerformance = new Map<string, { count: number; totalTime: number }>();

function logAuthEvent(eventType: 'SUCCESS' | 'FAILURE' | 'ERROR', route: string, details?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH ${eventType}] ${route}`, details || '');
  }
  
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const startTime = Date.now();
  const { pathname } = req.nextUrl;
  const userAgent = req.headers.get('user-agent') || '';
  const method = req.method;
  
  try {
    if (method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    if (isPublicRoute(req)) {
      logAuthEvent('SUCCESS', pathname, 'Public route accessed');
      return NextResponse.next();
    }

    if (isWebhookRoute(req)) {
      logAuthEvent('SUCCESS', pathname, 'Webhook route accessed');
      return NextResponse.next();
    }

    if (isPublicAPIRoute(req)) {
      logAuthEvent('SUCCESS', pathname, 'Public API route accessed');
      return NextResponse.next();
    }

    if (isProtectedRoute(req)) {
      const { userId, sessionId } = await auth();
      
      if (!userId) {
        const isPageRequest = req.headers.get('accept')?.includes('text/html');
        const hasClerkSession = req.cookies.get('__session') || req.cookies.get('__clerk_session');
        
        
        if (isPageRequest && hasClerkSession) {
          logAuthEvent('SUCCESS', pathname, 'Allowing page request with potential session');
          const response = NextResponse.next();
          response.headers.set('X-Frame-Options', 'DENY');
          response.headers.set('X-Content-Type-Options', 'nosniff');
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          return response;
        }
        
        logAuthEvent('FAILURE', pathname, { 
          reason: 'No valid session found',
          userAgent: userAgent.substring(0, 100)
        });
        
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirectTo', pathname);
        
        return NextResponse.redirect(signInUrl);
      }
      
      logAuthEvent('SUCCESS', pathname, { userId, sessionId });

      const response = NextResponse.next();
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      if (userId) {
        response.headers.set('X-User-ID', userId);
      }
      
      return response;
    }

    if (isAPIRoute(req)) {
      try {
        const { userId } = await auth.protect();
        
        if (!userId) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Unauthorized', 
              message: 'Authentication required',
              code: 'AUTH_REQUIRED'
            }), 
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        logAuthEvent('SUCCESS', pathname, { userId, apiCall: true });
        
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', '100');
        response.headers.set('X-RateLimit-Window', '3600');
        
        return response;
      } catch (apiAuthError) {
        logAuthEvent('FAILURE', pathname, { 
          error: apiAuthError instanceof Error ? apiAuthError.message : 'API auth error',
          apiCall: true
        });
        
        return new NextResponse(
          JSON.stringify({ 
            error: 'Authentication Failed', 
            message: 'Invalid or expired session',
            code: 'AUTH_EXPIRED'
          }), 
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    return NextResponse.next();

  } catch (error) {
    logAuthEvent('ERROR', pathname, { 
      error: error instanceof Error ? error.message : 'Unknown middleware error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (isAPIRoute(req)) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Internal Server Error', 
          message: 'Authentication service temporarily unavailable',
          code: 'AUTH_SERVICE_ERROR'
        }), 
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('error', 'auth_service_error');
    signInUrl.searchParams.set('redirectTo', pathname);
    
    return NextResponse.redirect(signInUrl);
  } finally {
    const duration = Date.now() - startTime;
    const existing = routePerformance.get(pathname) || { count: 0, totalTime: 0 };
    routePerformance.set(pathname, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration
    });

    if (duration > 100) {
      console.warn(`[SLOW AUTH] ${pathname} took ${duration}ms`);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}; 