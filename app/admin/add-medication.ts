// pages/api/admin/add-medication.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  // Proteja este endpoint (verifique sessão admin, token, etc.)
  const { user_id, name, dose } = req.body;
  const { data, error } = await supabaseAdmin.from('medications').insert([{ user_id, name, dose }]);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
}