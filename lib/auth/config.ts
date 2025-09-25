import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

// Usar service role key para auth (diferente da instância pública)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credenciais ausentes");
          return null;
        }

        try {
          console.log("Tentando autenticar:", credentials.email);
          
          // Verificar credenciais no Supabase
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error) {
            console.error("Erro Supabase:", error);
            return null;
          }

          if (!user) {
            console.log("Usuário não encontrado");
            return null;
          }

          console.log("Usuário encontrado:", user.email, "Tipo:", user.type);

          // Em um cenário real, você faria hash da senha
          // Para este exemplo, vamos usar uma verificação simples
          if (user.password !== credentials.password) {
            console.log("Senha incorreta");
            return null;
          }

          console.log("Autenticação bem-sucedida para:", user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            type: user.type,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("JWT callback - user:", user);
        token.id = user.id;
        token.type = user.type as 'admin' | 'tecnico';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        console.log("Session callback - token:", token);
        session.user = {
          ...session.user,
          id: token.id as string,
          type: token.type as 'admin' | 'tecnico',
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Configurações para funcionar em rede externa
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}; 