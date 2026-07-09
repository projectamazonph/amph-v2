'use server';

import { requireAdmin } from '@/lib/auth';

// Tool scenarios are defined in TypeScript code (src/engine/*/scenarios.ts).
// Admin view uses TOOL_REGISTRY directly. No DB mutations needed.

// Guard ensures any future action added here is admin-only from the start.
async function adminGuard() {
  await requireAdmin();
}
