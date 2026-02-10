const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^"|"$/g, '');
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
}

const client = new Client({ connectionString });

async function createAdmin() {
    const email = 'admin@example.com';
    const password = 'admin'; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await client.connect();
        console.log('Connected to database.');

        // Insert into auth.users
        // We use a transaction to ensure both user and profile are consistent
        await client.query('BEGIN');

        // Check if user exists
        const checkRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
        
        let userId;
        
        if (checkRes.rows.length > 0) {
            userId = checkRes.rows[0].id;
            console.log(`User ${email} already exists (ID: ${userId}). Updating password and role...`);
            
            // Update password
            await client.query('UPDATE auth.users SET encrypted_password = $1 WHERE id = $2', [hashedPassword, userId]);
        } else {
            console.log(`Creating new user ${email}...`);
            const userRes = await client.query(`
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
                ) VALUES ($1, $2, NOW(), '{"provider":"email","providers":["email"]}', '{"role":"admin"}', NOW(), NOW(), 'authenticated', 'authenticated')
                RETURNING id
            `, [email, hashedPassword]);
            userId = userRes.rows[0].id;
            console.log(`Created user with ID: ${userId}`);
        }

        // Upsert profile to ensure it has admin role
        await client.query(`
            INSERT INTO public.profiles (id, email, role, first_name, last_name)
            VALUES ($1, $2, 'admin', 'Admin', 'User')
            ON CONFLICT (id) DO UPDATE SET role = 'admin'
        `, [userId, email]);
        
        console.log('Admin profile verified.');

        await client.query('COMMIT');
        console.log(`\nAdmin user configured successfully!`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`\nYou can now log in at /login`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error configuring admin user:', e);
    } finally {
        await client.end();
    }
}

createAdmin();
