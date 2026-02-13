import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            // Protect the root route and any other routes except auth
            const isAuthRoute = nextUrl.pathname.startsWith('/auth');
            const isPublicRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/register';

            if (isAuthRoute || isPublicRoute) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/', nextUrl));
                }
                return true;
            }

            // Default protection for all other routes
            return isLoggedIn;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
