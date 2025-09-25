import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Se não há token, redireciona para login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Verificar acesso baseado no tipo de usuário
    if (pathname.startsWith('/admin') && token.type !== 'admin') {
      return NextResponse.redirect(new URL('/tecnico', req.url));
    }

    if (pathname.startsWith('/tecnico') && token.type !== 'tecnico') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Permitir acesso às páginas públicas
        if (pathname.startsWith('/auth') || pathname === '/') {
          return true;
        }

        // Verificar se há token para páginas protegidas
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/tecnico/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|auth|test-camera).*)',
  ],
}; 