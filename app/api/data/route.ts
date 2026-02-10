import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { authAdapter } from '@/lib/auth-local';

const ALLOWED_TABLES = [
  'profiles',
  'appointments',
  'medications',
  'medication_schedules',
  'medical_prescriptions',
  'patient_diet_recipes',
  'patient_supplements',
  'physical_evolution',
  'notifications',
  'recipes',
  'supplement_catalog',
  'notification_settings',
  'medication_adherence'
];

const PUBLIC_TABLES = ['recipes', 'supplement_catalog'];

// Map tables to their "owner" column for RLS-like enforcement
const TABLE_OWNER_COLS: Record<string, string> = {
    'profiles': 'id',
    'appointments': 'patient_id',
    'medical_prescriptions': 'patient_id',
    'patient_diet_recipes': 'patient_id',
    'patient_supplements': 'patient_id',
    'medications': 'user_id',
    'medication_reminders': 'user_id',
    'physical_evolution': 'user_id',
    'notifications': 'user_id',
    'health_metrics': 'user_id',
    'medication_adherence': 'user_id',
    'medication_schedules': 'user_id',
    'notification_settings': 'user_id'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const match_key = searchParams.get('match_key');
  const match_value = searchParams.get('match_value');
  const limit = searchParams.get('limit');

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid or missing table' }, { status: 400 });
  }

  try {
    const { data: userData } = await authAdapter.getUser();
    const user = userData?.user;
    
    // Prepare Limit Clause
    let limitClause = '';
    if (limit) {
        const limitNum = parseInt(limit);
        if (!isNaN(limitNum) && limitNum > 0) {
            limitClause = ` LIMIT ${limitNum}`;
        }
    }

    // Check public access
    if (PUBLIC_TABLES.includes(table)) {
        let query = `SELECT * FROM ${table}`;
        const params: any[] = [];
        
        if (match_key && match_value) {
            query += ` WHERE ${match_key} = $1`;
            params.push(match_value);
        }
        
        query += ` ORDER BY created_at DESC${limitClause}`;
        
        const result = await pool.query(query, params);
        return NextResponse.json(result.rows);
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Secure access
    let query = `SELECT * FROM ${table}`;
    const params: any[] = [];
    
    const isAdmin = user.role === 'admin';
    const ownerCol = TABLE_OWNER_COLS[table] || 'user_id';

    if (match_key && match_value) {
        query += ` WHERE ${match_key} = $1`;
        params.push(match_value);
        
        // Enforce ownership for non-admins
        if (!isAdmin) {
             if (table === 'profiles') {
                 if (match_key === 'id' && match_value !== user.id) {
                     return NextResponse.json({ error: 'Unauthorized access to other profile' }, { status: 401 });
                 }
                 if (match_key !== 'id') {
                     // If searching by email or role, ensure it's their own
                     query += ` AND id = $${params.length + 1}`;
                     params.push(user.id);
                 }
             } else {
                 // For other tables, ensure the owner column matches user.id
                 // Unless the match_key IS the owner column, then we just checked it above (implied by match_value !== user.id check?)
                 // Actually, if match_key is ownerCol, we need to check if match_value is user.id
                 
                 if (match_key === ownerCol) {
                     if (match_value !== user.id) {
                         return NextResponse.json({ error: 'Unauthorized access to other user data' }, { status: 401 });
                     }
                 } else {
                     // If matching by something else (e.g. id), enforce owner column
                     query += ` AND ${ownerCol} = $${params.length + 1}`;
                     params.push(user.id);
                 }
             }
        }
    } else {
        // No filter provided
        if (!isAdmin) {
            if (table === 'profiles') {
                 query += ` WHERE id = $1`;
                 params.push(user.id);
            } else {
                 query += ` WHERE ${ownerCol} = $1`;
                 params.push(user.id);
            }
        }
    }
    
    // Add ordering if created_at exists (it does in most)
    try {
        const result = await pool.query(query + ` ORDER BY created_at DESC${limitClause}`, params);
        return NextResponse.json(result.rows);
    } catch (e) {
        // Fallback without order by if created_at fails
        const result = await pool.query(query + limitClause, params);
        return NextResponse.json(result.rows);
    }

  } catch (error: any) {
    console.error('Data fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    if (!table || !ALLOWED_TABLES.includes(table)) {
        return NextResponse.json({ error: 'Invalid or missing table' }, { status: 400 });
    }

    try {
        const { data: userData } = await authAdapter.getUser();
        const user = userData?.user;

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const body = await request.json();
        const data = Array.isArray(body) ? body[0] : body;
        
        if (!data) return NextResponse.json({ error: 'No data' }, { status: 400 });

        const isAdmin = user.role === 'admin';
        const ownerCol = TABLE_OWNER_COLS[table] || 'user_id';

        if (!isAdmin) {
             if (data[ownerCol] && data[ownerCol] !== user.id) {
                 return NextResponse.json({ error: 'Unauthorized: Cannot create data for another user' }, { status: 401 });
             }
             // Ensure it is set to current user if not present (and not admin)
             if (!data[ownerCol]) {
                 data[ownerCol] = user.id;
             }
        }

        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);
        
        const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
        
        const result = await pool.query(query, values);
        
        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const match_key = searchParams.get('match_key') || 'id';
    const match_value = searchParams.get('match_value');

    if (!table || !ALLOWED_TABLES.includes(table)) {
        return NextResponse.json({ error: 'Invalid or missing table' }, { status: 400 });
    }

    if (!match_value) {
        return NextResponse.json({ error: 'Missing match_value' }, { status: 400 });
    }

    try {
        const { data: userData } = await authAdapter.getUser();
        const user = userData?.user;

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const keys = Object.keys(body);
        const values = Object.values(body);
        
        // Construct SET clause
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        
        // Add match_value to params
        const params = [...values, match_value];
        
        let query = `UPDATE ${table} SET ${setClause} WHERE ${match_key} = $${values.length + 1}`;

        // Enforce ownership for non-admins
        const isAdmin = user.role === 'admin';
        if (!isAdmin) {
            const ownerCol = TABLE_OWNER_COLS[table] || 'user_id';
            // If updating profile, ensure id matches
            if (table === 'profiles') {
                 query += ` AND id = $${params.length + 1}`;
                 params.push(user.id);
            } else {
                 query += ` AND ${ownerCol} = $${params.length + 1}`;
                 params.push(user.id);
            }
        }
        
        query += ` RETURNING *`;
        
        const result = await pool.query(query, params);
        
        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const match_key = searchParams.get('match_key') || 'id';
    const match_value = searchParams.get('match_value');

    if (!table || !ALLOWED_TABLES.includes(table)) {
        return NextResponse.json({ error: 'Invalid or missing table' }, { status: 400 });
    }

    if (!match_value) {
        return NextResponse.json({ error: 'Missing match_value' }, { status: 400 });
    }

    try {
        const { data: userData } = await authAdapter.getUser();
        const user = userData?.user;

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let query = `DELETE FROM ${table} WHERE ${match_key} = $1`;
        const params = [match_value];

        // Enforce ownership for non-admins
        const isAdmin = user.role === 'admin';
        if (!isAdmin) {
            const ownerCol = TABLE_OWNER_COLS[table] || 'user_id';
            if (table === 'profiles') {
                 query += ` AND id = $2`;
                 params.push(user.id);
            } else {
                 query += ` AND ${ownerCol} = $2`;
                 params.push(user.id);
            }
        }
        
        query += ` RETURNING *`;
        
        const result = await pool.query(query, params);
        
        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
