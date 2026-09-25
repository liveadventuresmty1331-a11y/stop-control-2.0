import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { RoleName } from "./types";
import { DEMO_USERS } from "./constants";
import {
  SESSION_COOKIE_NAME,
  SessionUser,
  SessionPayload,
  signSessionToken,
  verifySessionToken,
  ROLE_PERMISSIONS,
  canRoleAccessRoute,
} from "./session";

export {
  SESSION_COOKIE_NAME,
  type SessionUser,
  type SessionPayload,
  signSessionToken,
  verifySessionToken,
  ROLE_PERMISSIONS,
  canRoleAccessRoute,
};

/**
 * Obtener la sesión actual desde las cookies del servidor (Next.js App Router)
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const verified = await verifySessionToken(token);
  if (!verified) return null;
  return {
    id: verified.id,
    name: verified.name,
    email: verified.email,
    role: verified.role,
    status: verified.status,
  };
}

// Hash estándar de demostración para "demo123" generado con bcryptjs
const DEMO_PASSWORD_HASH = "$2a$10$o63jVw9Uvh2d6qD7yB2t7.C7QvVl/uKx1p0U3aD6A2gN.O.R9h0aK";

/**
 * Validador de credenciales de usuario en servidor
 */
export async function authenticateCredentials(
  email: string,
  plainPassword: string
): Promise<{ user?: SessionUser; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !plainPassword) {
    return { error: "El correo y la contraseña son requeridos" };
  }

  try {
    // Intentar buscar el usuario en la base de datos PostgreSQL
    let dbUser = null;
    try {
      dbUser = await db.user.findUnique({
        where: { email: normalizedEmail },
        include: { role: true },
      });
    } catch {
      // Base de datos no disponible localmente, usando fallback de usuarios demo
    }

    if (dbUser) {
      if (dbUser.status !== "ACTIVE") {
        return { error: "El usuario se encuentra inactivo. Contacte al administrador." };
      }

      const isMatch = await bcrypt.compare(plainPassword, dbUser.password);
      if (!isMatch) {
        return { error: "Credenciales incorrectas" };
      }

      return {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role.name as RoleName,
          status: dbUser.status,
        },
      };
    }

    // Fallback de demostración académica: Si la DB aún no ha sido migrada o conectada
    const demoFound = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (demoFound) {
      const isDemoMatch = plainPassword === "demo123" || (await bcrypt.compare(plainPassword, DEMO_PASSWORD_HASH));
      if (!isDemoMatch) {
        return { error: "Credenciales incorrectas" };
      }

      return {
        user: {
          id: `demo-${demoFound.role.toLowerCase()}`,
          name: demoFound.name,
          email: demoFound.email,
          role: demoFound.role,
          status: "ACTIVE",
        },
      };
    }

    return { error: "Credenciales incorrectas" };
  } catch (error) {
    console.error("Error en authenticateCredentials:", error);
    return { error: "Error en el servidor de autenticación" };
  }
}
