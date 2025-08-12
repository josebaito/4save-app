import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    console.log("Middleware - Pathname:", pathname);
    console.log("Middleware - Token:", !!token);
    console.log("Middleware - User type:", token?.type);

    // Se não há token, redireciona para login
    if (!token) {
      console.log("Middleware - Redirecionando para login (sem token)");
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Verificar acesso baseado no tipo de usuário
    if (pathname.startsWith('/admin') && token.type !== 'admin') {
      console.log("Middleware - Redirecionando técnico para /tecnico");
      return NextResponse.redirect(new URL('/tecnico', req.url));
    }

    if (pathname.startsWith('/tecnico') && token.type !== 'tecnico') {
      console.log("Middleware - Redirecionando admin para /admin");
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    console.log("Middleware - Acesso permitido");
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        console.log("Middleware authorized - Pathname:", pathname);
        console.log("Middleware authorized - Token:", !!token);
        
        // Permitir acesso às páginas públicas
        if (pathname.startsWith('/auth') || pathname === '/') {
          console.log("Middleware authorized - Página pública permitida");
          return true;
        }

        // Verificar se há token para páginas protegidas
        const hasToken = !!token;
        console.log("Middleware authorized - Página protegida, token:", hasToken);
        return hasToken;
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