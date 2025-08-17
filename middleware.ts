import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Route matchers for different protection levels
const isPublicRoute = createRouteMatcher(["/", "/join", "/sign-in(.*)", "/sign-up(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks/(.*)"]);
const isAPIRoute = createRouteMatcher(["/api(.*)"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/create(.*)"]);

// Performance monitoring
const routePerformance = new Map<string, { count: number; totalTime: number }>();

// Log authentication events for monitoring
function logAuthEvent(eventType: 'SUCCESS' | 'FAILURE' | 'ERROR', route: string, details?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH ${eventType}] ${route}`, details || '');
  }
  
  // In production, you could send to logging service like DataDog, etc.
  // Example: await sendToLoggingService({ eventType, route, details, timestamp: new Date() });
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const startTime = Date.now();
  const { pathname } = req.nextUrl;
  const userAgent = req.headers.get('user-agent') || '';
  
  try {
    // Skip auth checks for public routes
    if (isPublicRoute(req)) {
      logAuthEvent('SUCCESS', pathname, 'Public route accessed');
      return NextResponse.next();
    }

    // Skip auth checks for webhook routes (they authenticate via webhook signatures)
    if (isWebhookRoute(req)) {
      logAuthEvent('SUCCESS', pathname, 'Webhook route accessed');
      return NextResponse.next();
    }

    // Enhanced auth protection for protected routes
    if (isProtectedRoute(req)) {
      try {
        const { userId, sessionId } = await auth.protect();
        
        // Log successful authentication
        logAuthEvent('SUCCESS', pathname, { userId, sessionId });

        // Add security headers for protected routes
        const response = NextResponse.next();
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Add user context to headers for downstream processing
        if (userId) {
          response.headers.set('X-User-ID', userId);
        }
        
        return response;
      } catch (authError) {
        logAuthEvent('FAILURE', pathname, { 
          error: authError instanceof Error ? authError.message : 'Unknown auth error',
          userAgent: userAgent.substring(0, 100) // Truncate for privacy
        });
        
        // Enhanced redirect with state preservation
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirectTo', pathname);
        
        return NextResponse.redirect(signInUrl);
      }
    }

    // API route protection with additional validation
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
        
        // Add rate limiting headers
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

    // Default: allow request to proceed
    return NextResponse.next();

  } catch (error) {
    // Global error handling
    logAuthEvent('ERROR', pathname, { 
      error: error instanceof Error ? error.message : 'Unknown middleware error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // For API routes, return JSON error
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

    // For regular routes, redirect to error page or sign-in
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('error', 'auth_service_error');
    signInUrl.searchParams.set('redirectTo', pathname);
    
    return NextResponse.redirect(signInUrl);
  } finally {
    // Performance monitoring
    const duration = Date.now() - startTime;
    const existing = routePerformance.get(pathname) || { count: 0, totalTime: 0 };
    routePerformance.set(pathname, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration
    });

    // Log slow requests
    if (duration > 100) { // Log requests slower than 100ms
      console.warn(`[SLOW AUTH] ${pathname} took ${duration}ms`);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}; 