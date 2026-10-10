/**
 * Servicio Oficial de Integración con Google Sheets API v4
 * Utiliza Cuenta de Servicio de Google Cloud (archivo credentials.json)
 * STOPControl 2.0
 */

import { google } from "googleapis";
import path from "path";
import fs from "fs";

export interface GoogleSheetsResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "169qoevd-WcdH93ynEVOy1lIN5M7TwMCHmbNS7LtPpTg";

/**
 * Obtener cliente autenticado de Google Sheets API
 */
function getSheetsClient() {
  const possiblePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(process.cwd(), "google-credentials.json"),
    path.join(process.cwd(), "credentials.json"),
    path.join(process.cwd(), "service-account.json"),
  ].filter(Boolean) as string[];

  let keyFilePath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      keyFilePath = p;
      break;
    }
  }

  // Opción 1: Archivo de clave JSON descargado de Google Cloud
  if (keyFilePath) {
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  }

  // Opción 2: Variables de entorno directas
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  }

  return null;
}

/**
 * 1. Registrar Apertura de Paro en Google Sheets (pestaña 'Paros')
 */
export async function syncStopCreated(stop: {
  id: string;
  startTime: string | Date;
  status: string;
  shift?: string | null;
  machine?: { code?: string; name?: string };
  area?: { name?: string };
  process?: { name?: string };
  stopType?: { name?: string };
  cause?: { name?: string; isRepairable?: boolean };
  priority?: { name?: string };
  operator?: { id?: string; name?: string; email?: string };
  observations?: string | null;
}): Promise<GoogleSheetsResponse> {
  const sheets = getSheetsClient();
  if (!sheets) {
    return { success: false, message: "google-credentials.json no encontrado aún en el proyecto" };
  }

  try {
    const startDate = new Date(stop.startTime);
    const rowValues = [
      stop.id,                                              // A: id_paro
      startDate.toISOString().slice(0, 10),                 // B: fecha
      startDate.toISOString(),                              // C: hora_inicio
      "",                                                   // D: hora_fin
      "",                                                   // E: duracion_segundos
      "",                                                   // F: duracion_minutos
      stop.status,                                          // G: estado
      stop.shift || "Matutino",                             // H: turno
      stop.machine?.code || "",                             // I: codigo_maquina
      stop.machine?.name || "",                             // J: nombre_maquina
      stop.area?.name || "",                                // K: area
      stop.process?.name || "",                             // L: proceso
      stop.stopType?.name || "",                            // M: tipo_paro
      stop.cause?.name || "",                               // N: causa_raiz
      stop.cause?.isRepairable !== false ? "TRUE" : "FALSE",// O: es_reparable
      stop.priority?.name || "",                            // P: prioridad
      stop.operator?.id || "",                              // Q: operador_id
      stop.operator?.name || "",                            // R: operador_nombre
      "",                                                   // S: tecnico_id
      "",                                                   // T: tecnico_nombre
      "",                                                   // U: codigo_ot
      stop.observations || "",                              // V: observaciones_iniciales
      "",                                                   // W: accion_tomada
      new Date().toISOString(),                             // X: created_at
      new Date().toISOString(),                             // Y: updated_at
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Paros!A:Y",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowValues],
      },
    });

    return { success: true, message: "Paro registrado exitosamente en Google Sheets" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al escribir en Google Sheets";
    console.warn("[GoogleSheets API] Error al registrar paro:", msg);
    return { success: false, error: msg };
  }
}

/**
 * 2. Actualizar Cierre de Paro en Google Sheets (pestaña 'Paros')
 */
export async function syncStopCompleted(stop: {
  id: string;
  endTime: string | Date | null;
  duration?: number | null;
  status: string;
  actionTaken?: string | null;
  technician?: { id?: string; name?: string; email?: string } | null;
  workOrder?: { code?: string } | null;
}): Promise<GoogleSheetsResponse> {
  const sheets = getSheetsClient();
  if (!sheets) {
    return { success: false, message: "google-credentials.json no encontrado aún en el proyecto" };
  }

  try {
    // 1. Buscar la fila correspondiente al ID de paro
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Paros!A:A",
    });

    const rows = res.data.values || [];
    let targetRow = -1;
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === stop.id) {
        targetRow = i + 1; // Fila en base 1
        break;
      }
    }

    const endDate = stop.endTime ? new Date(stop.endTime) : new Date();
    const durationMin = stop.duration || 0;
    const durationSec = durationMin * 60;

    if (targetRow !== -1) {
      // Actualizar campos de cierre en la fila existente
      const updates = [
        { range: `Paros!D${targetRow}`, values: [[endDate.toISOString()]] },
        { range: `Paros!E${targetRow}`, values: [[durationSec]] },
        { range: `Paros!F${targetRow}`, values: [[durationMin]] },
        { range: `Paros!G${targetRow}`, values: [[stop.status]] },
        { range: `Paros!S${targetRow}`, values: [[stop.technician?.id || ""]] },
        { range: `Paros!T${targetRow}`, values: [[stop.technician?.name || ""]] },
        { range: `Paros!U${targetRow}`, values: [[stop.workOrder?.code || ""]] },
        { range: `Paros!W${targetRow}`, values: [[stop.actionTaken || ""]] },
        { range: `Paros!Y${targetRow}`, values: [[new Date().toISOString()]] },
      ];

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data: updates,
        },
      });

      return { success: true, message: `Fila ${targetRow} de Paros actualizada en Google Sheets` };
    }

    return { success: false, message: "No se encontró la fila correspondiente en Google Sheets" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al actualizar en Google Sheets";
    console.warn("[GoogleSheets API] Error al actualizar paro:", msg);
    return { success: false, error: msg };
  }
}

/**
 * 3. Registrar / Actualizar Orden de Trabajo en pestaña 'Ordenes_Trabajo'
 */
export async function syncWorkOrder(wo: {
  id: string;
  code: string;
  stopId?: string | null;
  machineCode?: string;
  status: string;
  notes?: string | null;
  technicianName?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}): Promise<GoogleSheetsResponse> {
  const sheets = getSheetsClient();
  if (!sheets) {
    return { success: false, message: "google-credentials.json no encontrado" };
  }

  try {
    const rowValues = [
      wo.id,                                                                         // A: id_ot
      wo.code,                                                                       // B: codigo_ot
      wo.stopId || "",                                                               // C: id_paro
      wo.machineCode || "",                                                          // D: codigo_maquina
      wo.status,                                                                     // E: estado
      wo.notes || "",                                                                // F: notas_tecnicas
      wo.technicianName || "",                                                       // G: tecnico_asignado
      wo.createdAt ? new Date(wo.createdAt).toISOString() : new Date().toISOString(), // H: created_at
      wo.updatedAt ? new Date(wo.updatedAt).toISOString() : new Date().toISOString(), // I: updated_at
    ];

    const sheetRange = "Orden de trabajo!A:I";
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetRange,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [rowValues] },
      });
    } catch {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Ordenes_Trabajo!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [rowValues] },
      });
    }

    return { success: true, message: "OT guardada exitosamente en Google Sheets" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al guardar OT";
    console.warn("[GoogleSheets API] Error al guardar OT:", msg);
    return { success: false, error: msg };
  }
}

/**
 * 4. Prueba de conexión y lectura de metadatos de la hoja
 */
export async function testGoogleSheetsConnection(): Promise<GoogleSheetsResponse> {
  const sheets = getSheetsClient();
  if (!sheets) {
    return {
      success: false,
      error: "Falta el archivo de credenciales de Google Cloud (google-credentials.json)",
    };
  }

  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetTitles = (res.data.sheets || []).map((s) => s.properties?.title || "");
    return {
      success: true,
      message: "Conexión exitosa a Google Sheets vía Service Account",
      data: {
        title: res.data.properties?.title,
        sheets: sheetTitles,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al conectar con Google Sheets";
    return { success: false, error: msg };
  }
}

/**
 * 5. Actualizar o Guardar la Contraseña y su Hash Encriptado en la pestaña 'Usuarios' de Google Sheets (Columnas G y H)
 */
export async function syncUserPassword(
  email: string,
  newPassword: string,
  passwordHash?: string
): Promise<GoogleSheetsResponse> {
  const sheets = getSheetsClient();
  if (!sheets) {
    return { success: false, message: "google-credentials.json no encontrado" };
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Si no se proporciona el hash, calcularlo con bcryptjs
    let computedHash = passwordHash;
    if (!computedHash) {
      const bcrypt = (await import("bcryptjs")).default;
      computedHash = await bcrypt.hash(newPassword, 10);
    }

    // 1. Obtener los valores existentes de la pestaña Usuarios
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Usuarios!A:H",
    });

    const rows = res.data.values || [];
    let targetRow = -1;

    for (let i = 0; i < rows.length; i++) {
      const rowEmail = (rows[i][2] || "").toString().trim().toLowerCase();
      if (rowEmail === normalizedEmail) {
        targetRow = i + 1; // Base 1
        break;
      }
    }

    if (targetRow !== -1) {
      // Actualizar columna G (contraseña) y columna H (hash_contraseña)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Usuarios!G${targetRow}:H${targetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[newPassword, computedHash]],
        },
      });

      return {
        success: true,
        message: `Contraseña y hash encriptado actualizados en Google Sheets para ${normalizedEmail} (Fila ${targetRow})`,
      };
    } else {
      // Si el usuario no estaba en la hoja, agregar una nueva fila con la contraseña y el hash
      const newRow = [
        `user-${Date.now().toString().slice(-4)}`,
        normalizedEmail.split("@")[0],
        normalizedEmail,
        "OPERADOR",
        "ACTIVE",
        new Date().toISOString(),
        newPassword,
        computedHash,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Usuarios!A:H",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [newRow],
        },
      });

      return {
        success: true,
        message: `Usuario, contraseña y hash encriptado agregados en Google Sheets para ${normalizedEmail}`,
      };
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al guardar contraseña y hash en Google Sheets";
    console.warn("[GoogleSheets API] Error al sincronizar contraseña:", msg);
    return { success: false, error: msg };
  }
}

/**
 * 6. Leer la contraseña y el hash guardados en Google Sheets para un usuario (Soporte bidireccional)
 */
export async function getGoogleSheetUserCredentials(
  email: string
): Promise<{ password?: string; hash?: string } | null> {
  const sheets = getSheetsClient();
  if (!sheets) return null;

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Usuarios!A:H",
    });

    const rows = res.data.values || [];
    for (let i = 1; i < rows.length; i++) {
      const rowEmail = (rows[i][2] || "").toString().trim().toLowerCase();
      if (rowEmail === normalizedEmail) {
        return {
          password: rows[i][6] ? String(rows[i][6]) : undefined,
          hash: rows[i][7] ? String(rows[i][7]) : undefined,
        };
      }
    }
  } catch (error) {
    console.warn("[GoogleSheets API] Error al leer credenciales desde Google Sheets:", error);
  }

  return null;
}

export async function getGoogleSheetUserPassword(email: string): Promise<string | null> {
  const creds = await getGoogleSheetUserCredentials(email);
  return creds?.password || null;
}

