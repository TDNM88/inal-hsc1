import NextAuth, { AuthOptions, Session, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { comparePassword } from '@/lib/auth';
import { getMongoDb } from '@/lib/db';
import { JWT } from 'next-auth/jwt';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Tên đăng nhập", type: "text" },
        password: {  label: "Mật khẩu", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Vui lòng nhập đầy đủ thông tin đăng nhập');
        }

        try {
          const db = await getMongoDb();
          if (!db) {
            throw new Error('Không thể kết nối đến cơ sở dữ liệu');
          }

          const user = await db.collection('users').findOne({ 
            username: credentials.username 
          });

          if (!user) {
            throw new Error('Tên đăng nhập không tồn tại');
          }

          const isPasswordValid = await comparePassword(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Mật khẩu không chính xác');
          }

          return {
            id: user._id.toString(),
            username: user.username,
            role: user.role,
            email: user.email
          } as User;
        } catch (error) {
          console.error('Authorization error:', error);
          throw new Error('Đã xảy ra lỗi khi xác thực');
        }
      },
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
