import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME, canRoleAccessRoute } from "./lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // 0. Redireccionar la raíz (/) según estado de sesión
  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // 1. Redireccionar usuarios autenticados que visitan /login
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.next();
  }

  // 2. Proteger rutas que requieren autenticación
  const isProtectedRoute = [
    "/home",
    "/dashboard",
    "/active-stops",
    "/register-stop",
    "/history",
    "/catalogs",
    "/users",
  ].some((prefix) => pathname.startsWith(prefix));

  if (isProtectedRoute) {
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 3. Validar autorización basada en roles (RBAC en Servidor)
    const hasAccess = canRoleAccessRoute(session.role, pathname);
    if (!hasAccess) {
      // Redirigir a una ruta permitida según el rol si no tiene permiso
      const fallbackUrl = new URL("/home?unauthorized=1", req.url);
      return NextResponse.redirect(fallbackUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/home/:path*",
    "/dashboard/:path*",
    "/active-stops/:path*",
    "/register-stop/:path*",
    "/history/:path*",
    "/catalogs/:path*",
    "/users/:path*",
  ],
};
