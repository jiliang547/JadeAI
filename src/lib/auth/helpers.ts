import { auth } from './config';
import { config } from '@/lib/config';
import { dbReady } from '@/lib/db';
import { userRepository } from '@/lib/db/repositories/user.repository';

export async function getCurrentUserId(): Promise<string | null> {
  if (config.auth.enabled) {
    const session = await auth();
    return session?.user?.id || null;
  }
  // In fingerprint mode, userId is resolved from the request header
  return null;
}

export async function resolveUser(fingerprint?: string | null) {
  // Ensure DB tables exist before any query
  await dbReady;

  if (config.auth.enabled) {
    const session = await auth();
    if (!session?.user?.id) return null;

    // User was created during sign-in (jwt callback), just look up
    let user = await userRepository.findById(session.user.id);

    // Fallback: ID may differ if token was issued before DB creation
    if (!user && session.user.email) {
      user = await userRepository.findByEmail(session.user.email);
    }

    return user;
  }

  if (!fingerprint) return null;
  return userRepository.upsertByFingerprint(fingerprint);
}

export function getUserIdFromRequest(request: Request): string | null {
  // Prefer the x-fingerprint header (used by the mini-program / fetch calls).
  // Fall back to the `fp` query param so the HTML preview can be opened
  // directly inside a <web-view>, which cannot set custom request headers.
  const header = request.headers.get('x-fingerprint');
  if (header) return header;
  const url = (request as any).nextUrl || (request as any).url;
  if (url && typeof url.searchParams?.get === 'function') {
    return url.searchParams.get('fp');
  }
  return null;
}
