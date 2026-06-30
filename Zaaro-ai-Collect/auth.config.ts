import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/record') || nextUrl.pathname.startsWith('/profile') || nextUrl.pathname.startsWith('/admin')
      const isAuthRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/register'

      if (isAuthRoute) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
        return true;
      }

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect to login page
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        ;(session.user as any).role = token.role as string
      }
      return session
    }
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
