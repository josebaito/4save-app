import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      type: 'admin' | 'tecnico';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    type: 'admin' | 'tecnico';
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    type: 'admin' | 'tecnico';
  }
} 