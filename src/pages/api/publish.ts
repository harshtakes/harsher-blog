// src/pages/api/publish.ts
// Not actively used — the admin panel uses client-side markdown generation.
// Kept as a placeholder for future server-side publishing.

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({ message: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
};
