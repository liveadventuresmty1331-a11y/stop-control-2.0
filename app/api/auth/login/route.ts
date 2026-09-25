import { NextRequest, NextResponse } from "next/server";
import { authenticateCredentials, signSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo electrónico y contraseña requeridos" },
        { status: 400 }
      );
    }

    const authResult = await authenticateCredentials(email, password);

    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const token = await signSessionToken(authResult.user);

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return response;
  } catch (error) {
    console.error("Error en POST /api/auth/login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
