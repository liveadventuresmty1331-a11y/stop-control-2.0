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
  OPERADOR: [
    "dashboard:view",
    "active-stops:view",
    "stops:create",
    "stops:finish",
    "history:view:own",
  ],
  SUPERVISOR: [
    "dashboard:view",
    "active-stops:view",
    "history:view",
    "metrics:view",
  ],
  MANTENIMIENTO: [
    "dashboard:view",
    "active-stops:view",
    "history:view",
    "maintenance:action",
    "metrics:view",
  ],
  CALIDAD: [
    "dashboard:view",
    "active-stops:view",
    "history:view",
    "metrics:view",
  ],
};

/**
 * Validador de acceso a rutas por rol (Edge compatible)
 */
export function canRoleAccessRoute(role: RoleName, pathname: string): boolean {
  if (role === "ADMINISTRADOR") return true;

  if (pathname.startsWith("/catalogs") || pathname.startsWith("/users")) {
    return false;
  }

  if (pathname.startsWith("/dashboard")) {
    return true; // Todos los roles autenticados pueden ingresar al Dashboard según su alcance RBAC
  }

  if (pathname.startsWith("/register-stop")) {
    return role === "OPERADOR";
  }

  if (pathname.startsWith("/active-stops")) {
    return true; // Todos los roles pueden consultar paros activos
  }

  if (pathname.startsWith("/history")) {
    return true; // Todos pueden ver historial (operador filtrado a sus propios paros)
  }

  return true;
}
