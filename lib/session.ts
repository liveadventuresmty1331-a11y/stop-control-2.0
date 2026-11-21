import { SignJWT, jwtVerify } from "jose";
import { RoleName } from "./types";

export const SESSION_COOKIE_NAME = "stopcontrol_session";
const DEFAULT_SECRET = "stopcontrol-super-secure-jwt-secret-key-32chars";

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status: string;
}

export interface SessionPayload extends SessionUser {
  iat: number;
  exp: number;
}

/**
 * Firmar un token JWT con la información de la sesión (Edge compatible)
 */
export async function signSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getJwtSecretKey());
}

/**
 * Verificar y decodificar el token de sesión JWT (Edge compatible)
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Rutas permitidas por rol según política RBAC solicitada:
 * - Administrador: Paros Activos, Registrar Paro, Dashboard, Historial, Catálogos (+ Users)
 * - Supervisor: Paros Activos, Registrar Paro, Dashboard, Historial
 * - Operador: Registrar Paro
 * - Mantenimiento: Dashboard, Paros Activos, Historial
 * - Calidad: Paros Activos, Dashboard
 */
export const ROLE_ALLOWED_ROUTES: Record<RoleName, string[]> = {
  ADMINISTRADOR: [
    "/home",
    "/active-stops",
    "/register-stop",
    "/dashboard",
    "/history",
    "/catalogs",
    "/users",
  ],
  SUPERVISOR: [
    "/home",
    "/active-stops",
    "/register-stop",
    "/dashboard",
    "/history",
  ],
  OPERADOR: [
    "/home",
    "/register-stop",
  ],
  MANTENIMIENTO: [
    "/home",
    "/dashboard",
    "/active-stops",
    "/history",
  ],
  CALIDAD: [
    "/home",
    "/active-stops",
    "/dashboard",
  ],
};

/**
 * Matriz de Permisos por Rol
 */
export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ADMINISTRADOR: [
    "dashboard:view",
    "active-stops:view",
    "stops:create",
    "stops:finish",
    "history:view",
    "catalogs:view",
    "catalogs:manage",
    "users:manage",
    "metrics:view",
  ],
  SUPERVISOR: [
    "active-stops:view",
    "stops:create",
    "stops:finish",
    "dashboard:view",
    "history:view",
    "metrics:view",
  ],
  OPERADOR: [
    "stops:create",
  ],
  MANTENIMIENTO: [
    "dashboard:view",
    "active-stops:view",
    "history:view",
    "maintenance:action",
    "metrics:view",
  ],
  CALIDAD: [
    "active-stops:view",
    "dashboard:view",
    "metrics:view",
  ],
};

/**
 * Validador de acceso a rutas por rol (Edge compatible)
 */
export function canRoleAccessRoute(role: RoleName, pathname: string): boolean {
  if (role === "ADMINISTRADOR") return true;

  // El Home y la API de autenticación siempre están disponibles para cualquier usuario autenticado
  if (pathname === "/home" || pathname.startsWith("/home/")) return true;

  const allowedRoutes = ROLE_ALLOWED_ROUTES[role] || ["/home"];
  return allowedRoutes.some(
    (allowed) => pathname === allowed || pathname.startsWith(allowed + "/")
  );
}
