import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { syncUserPassword } from "@/lib/google-sheets";
import { DEMO_USERS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !newPassword) {
      return NextResponse.json(
        { error: "Correo electrónico y nueva contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: "La contraseña debe contener al menos 4 caracteres" },
        { status: 400 }
      );
    }

    // 1. Verificar si el usuario existe en base de datos o en lista demo
    let dbUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true },
    });

    const demoFound = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (!dbUser && !demoFound) {
      return NextResponse.json(
        { error: "No se encontró ningún usuario registrado con ese correo" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 2. Si no estaba en DB pero es usuario demo, crearlo en DB
    if (!dbUser && demoFound) {
      let role = await db.role.findUnique({ where: { name: demoFound.role } });
      if (!role) {
        role = await db.role.create({
          data: { name: demoFound.role, description: `Rol ${demoFound.role}` },
        });
      }
      dbUser = await db.user.create({
        data: {
          name: demoFound.name,
          email: normalizedEmail,
          password: hashedPassword,
          roleId: role.id,
          status: "ACTIVE",
        },
        include: { role: true },
      });
    } else if (dbUser) {
      // 3. Actualizar contraseña en base de datos
      await db.user.update({
        where: { id: dbUser.id },
        data: { password: hashedPassword },
      });
    }

    // 4. Guardar y sincronizar la nueva contraseña y su hash en Google Sheets (Pestaña Usuarios, Columnas G y H)
    const sheetSync = await syncUserPassword(normalizedEmail, newPassword, hashedPassword);

    return NextResponse.json({
      success: true,
      message: "Tu contraseña y hash criptográfico han sido actualizados con éxito y guardados en Google Sheets.",
      sheetSyncSuccess: sheetSync.success,
      sheetMessage: sheetSync.message,
    });
  } catch (error) {
    console.error("Error en POST /api/auth/recover:", error);
    return NextResponse.json(
      { error: "Error en el servidor al recuperar contraseña" },
      { status: 500 }
    );
  }
}
