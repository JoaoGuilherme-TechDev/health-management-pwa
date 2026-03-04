/**
 * scripts/create_local_admin.js
 * Robust Windows-friendly script to load .env and create/update a local admin user.
 *
 * Usage (from anywhere):
 *   node C:\inetpub\wwwroot\health-management-pwa\scripts\create_local_admin.js
 *
 * Requires:
 *   npm i pg bcryptjs
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// -------------------- Robust .env loader --------------------
function loadEnvFile(envFilePath) {
  if (!fs.existsSync(envFilePath)) return { loaded: false, path: envFilePath };

  let content = fs.readFileSync(envFilePath, 'utf8');

  // Remove UTF-8 BOM if present
  content = content.replace(/^\uFEFF/, '');

  content.split(/\r?\n/).forEach((rawLine) => {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    // Support: export KEY=value
    if (line.startsWith('export ')) line = line.slice(7).trim();

    const eq = line.indexOf('=');
    if (eq === -1) return;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    // Strip surrounding quotes
    value = value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

    // Do not overwrite already-set env vars
    if (process.env[key] === undefined) process.env[key] = value;
  });

  return { loaded: true, path: envFilePath };
}

// Always locate repo root as the parent of /scripts
const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
const envLocalPath = path.join(repoRoot, '.env.local');

// Load .env first, then .env.local as override (optional)
const r1 = loadEnvFile(envPath);
const r2 = loadEnvFile(envLocalPath);

// -------------------- Diagnostics --------------------
console.log('[debug] repoRoot:', repoRoot);
console.log('[debug] .env path:', envPath, 'exists:', fs.existsSync(envPath), 'loaded:', r1.loaded);
console.log('[debug] .env.local path:', envLocalPath, 'exists:', fs.existsSync(envLocalPath), 'loaded:', r2.loaded);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    '❌ DATABASE_URL is not set. Put DATABASE_URL=... in the .env at:\n' +
      `   ${envPath}\n` +
      'Or set it in the shell:\n' +
      '   $env:DATABASE_URL="postgresql://user:pass@host:5432/db"\n'
  );
  process.exit(1);
}
console.log('[debug] DATABASE_URL detected (length):', String(connectionString).length);

// -------------------- Admin creation --------------------
async function main() {
  const email = 'admin@draestefania.com';
  const password = '123456';

  const hashedPassword = await bcrypt.hash(password, 10);

  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query('BEGIN');

    // Ensure auth schema/table exists
    // (If this fails, your DB isn't Supabase-style and we'll need the correct tables.)
    const checkUser = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);

    let userId;
    if (checkUser.rows.length > 0) {
      userId = checkUser.rows[0].id;
      await client.query('UPDATE auth.users SET encrypted_password = $1 WHERE id = $2', [
        hashedPassword,
        userId,
      ]);
      console.log('✅ Updated password for existing auth user:', email);
    } else {
      const insertUser = await client.query(
        `
        INSERT INTO auth.users (
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          aud,
          role
        ) VALUES (
          $1,
          $2,
          NOW(),
          '{"provider":"email","providers":["email"]}',
          '{"role":"admin"}',
          NOW(),
          NOW(),
          'authenticated',
          'authenticated'
        )
        RETURNING id
        `,
        [email, hashedPassword]
      );

      userId = insertUser.rows[0].id;
      console.log('✅ Created new auth user:', email);
    }

    // Upsert profile as admin
    await client.query(
      `
      INSERT INTO public.profiles (id, email, role, first_name, last_name)
      VALUES ($1, $2, 'admin', 'Admin', 'Draestefania')
      ON CONFLICT (id) DO UPDATE
      SET role = 'admin',
          email = EXCLUDED.email
      `,
      [userId, email]
    );

    await client.query('COMMIT');
    console.log('🎉 Admin ready:', email);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    console.error('❌ Failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();