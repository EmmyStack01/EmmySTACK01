export const prerender = false;

export async function GET() {
  const keys = [
    'KEYSTATIC_GITHUB_CLIENT_ID',
    'KEYSTATIC_GITHUB_CLIENT_SECRET',
    'KEYSTATIC_SECRET',
    'GITHUB_TOKEN',
    'NODE_ENV'
  ];

  const result: Record<string, string> = {};
  for (const key of keys) {
    const val = process.env[key];
    result[key] = val ? `SET (length: ${val.length})` : 'MISSING';
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
