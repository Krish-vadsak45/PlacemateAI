import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/profile"]

// Routes that require completed profile
const profileRequiredRoutes = ["/dashboard"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const session = req.auth

  // Allow public routes
  if (!protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Redirect to sign-in if not authenticated
  if (!isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Check profile completion for profile-required routes
  if (profileRequiredRoutes.some((route) => pathname.startsWith(route))) {
    const isProfileComplete = session?.user?.isProfileComplete ?? false
    
    if (!isProfileComplete) {
      // Redirect to profile page if profile is incomplete
      return NextResponse.redirect(new URL("/profile", req.url))
    }
  }

  // Redirect to dashboard if trying to access profile page but profile is already complete
  // if (pathname === "/profile" && session?.user?.isProfileComplete) {
  //   return NextResponse.redirect(new URL("/dashboard", req.url))
  // }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
