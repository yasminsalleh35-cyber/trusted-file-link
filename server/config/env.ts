import 'dotenv/config';

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 8787,
  supabaseUrl: process.env.SUPABASE_URL || 'https://snplwgyewoljrprqpdrm.supabase.co',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
};

if (!config.serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.warn('[server] SUPABASE_SERVICE_ROLE_KEY is not set. Admin routes will fail.');
}