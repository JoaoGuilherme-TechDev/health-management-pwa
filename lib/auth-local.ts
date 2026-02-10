
import { pool } from './db';
import { hash, compare } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key-at-least-32-chars-long';
const key = new TextEncoder().encode(SECRET_KEY);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days session
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string, role: string = 'patient') {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ sub: userId, role, expires });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export const authAdapter = {
  // Sign up a new user
  async signUp(email: string, password: string, metadata: any = {}, shouldCreateSession: boolean = true) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user exists
      const userCheck = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
      if (userCheck.rows.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await hash(password, 10);

      // Insert into auth.users
      const userRes = await client.query(
        `INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, email, raw_user_meta_data`,
        [email, hashedPassword, JSON.stringify(metadata)]
      );

      const user = userRes.rows[0];

      // Insert into public.profiles (trigger usually does this, but for robustness we can do it here if trigger fails/is missing)
      // For now, we rely on the trigger we fixed earlier (099_fix_signup_trigger.sql)
      
      await client.query('COMMIT');
      
      // Create session immediately after signup if requested
      if (shouldCreateSession) {
        await createSession(user.id, metadata.role || 'patient');
      }
      
      return { user, error: null };
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error("Signup error:", error);
      return { user: null, error: { message: error.message } };
    } finally {
      client.release();
    }
  },

  // Create user without session (for admin use)
  async createUser(email: string, password: string, metadata: any = {}) {
    return this.signUp(email, password, metadata, false);
  },

  // Sign in
  async signIn(email: string, password: string) {
    try {
      const res = await pool.query('SELECT * FROM auth.users WHERE email = $1', [email]);
      if (res.rows.length === 0) {
        return { user: null, error: { message: 'Invalid credentials' } };
      }

      const user = res.rows[0];
      const valid = await compare(password, user.encrypted_password || '');

      if (!valid) {
        return { user: null, error: { message: 'Invalid credentials' } };
      }

      // Get role from metadata or profile
      let role = 'patient';
      if (user.raw_user_meta_data && user.raw_user_meta_data.role) {
        role = user.raw_user_meta_data.role;
      } else {
         const profileRes = await pool.query('SELECT role FROM public.profiles WHERE id = $1', [user.id]);
         if (profileRes.rows.length > 0) {
             role = profileRes.rows[0].role;
         }
      }

      await createSession(user.id, role);

      return { user, error: null };
    } catch (error: any) {
      console.error("Signin error:", error);
      return { user: null, error: { message: error.message } };
    }
  },
  
  async signOut() {
      await deleteSession();
      return { error: null };
  },
  
  async getUser() {
      const session = await getSession();
      if (!session) return { data: { user: null }, error: null };
      
      // Fetch full user details if needed, or just return session info
      // Returning minimal info to match Supabase structure roughly
      return { 
          data: { 
              user: { 
                  id: session.sub, 
                  role: session.role,
                  email: session.email // We might want to store email in session or fetch it
              } 
          }, 
          error: null 
      };
  }
};
