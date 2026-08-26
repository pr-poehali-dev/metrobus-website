import func2url from '../../backend/func2url.json';

export type Role = 'carrier' | 'regulator';

function tokenKey(role: Role) {
  return role === 'carrier' ? 'mb_carrier_token' : 'mb_regulator_token';
}

export function getRoleToken(role: Role): string | null {
  return sessionStorage.getItem(tokenKey(role));
}

export function setRoleToken(role: Role, token: string) {
  sessionStorage.setItem(tokenKey(role), token);
}

export function clearRoleToken(role: Role) {
  sessionStorage.removeItem(tokenKey(role));
}

export interface RoleLoginResult {
  ok: boolean;
  orgName?: string;
  error?: 'invalid_credentials' | 'invalid_request' | 'network_error';
}

export async function loginWithCredentials(role: Role, login: string, password: string): Promise<RoleLoginResult> {
  try {
    const res = await fetch(func2url['role-auth'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, login, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error ?? 'invalid_credentials' };
    }
    setRoleToken(role, data.token);
    return { ok: true, orgName: data.orgName };
  } catch {
    return { ok: false, error: 'network_error' };
  }
}

export interface RoleSession {
  role: Role;
  login: string;
  orgName: string;
}

export async function verifyRoleSession(role: Role): Promise<RoleSession | null> {
  const token = getRoleToken(role);
  if (!token) return null;
  try {
    const res = await fetch(func2url['role-auth'], {
      headers: { 'X-Role-Token': token },
    });
    if (!res.ok) {
      clearRoleToken(role);
      return null;
    }
    const data = await res.json();
    return { role: data.role, login: data.login, orgName: data.orgName };
  } catch {
    return null;
  }
}
