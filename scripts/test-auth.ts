import { authenticateCredentials, signSessionToken, verifySessionToken, canRoleAccessRoute, ROLE_PERMISSIONS } from "../lib/auth";
import { DEMO_USERS } from "../lib/constants";

async function runAuthTests() {
  console.log("🧪 Iniciando pruebas automatizadas de FASE 3 (Autenticación & Autorización)...\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. Probar Login Correcto para los 4 Roles Demo
  console.log("1. Probando Autenticación de los 4 Roles Demo:");
  for (const demo of DEMO_USERS) {
    const result = await authenticateCredentials(demo.email, "demo123");
    assert(
      !!result.user && result.user.email === demo.email && result.user.role === demo.role,
      `Login exitoso para rol ${demo.role} (${demo.email})`
    );
    // Verificar que nunca se exponga contraseña ni hash
    assert(
      !("password" in (result.user || {})),
      `Seguridad: La respuesta de ${demo.role} NO expone campo de contraseña`
    );
  }

  // 2. Probar Credenciales Incorrectas
  console.log("\n2. Probando Rechazo de Credenciales Incorrectas:");
  const badPasswordResult = await authenticateCredentials("admin@stopcontrol.local", "wrongpassword!");
  assert(
    !badPasswordResult.user && badPasswordResult.error === "Credenciales incorrectas",
    "Rechazo correcto de contraseña errónea"
  );

  const nonExistentUser = await authenticateCredentials("fake_user@stopcontrol.local", "demo123");
  assert(
    !nonExistentUser.user && nonExistentUser.error === "Credenciales incorrectas",
    "Rechazo correcto de usuario inexistente"
  );

  const emptyFields = await authenticateCredentials("", "");
  assert(
    !emptyFields.user && !!emptyFields.error,
    "Rechazo correcto de campos vacíos"
  );

  // 3. Probar Firma y Verificación de JWT
  console.log("\n3. Probando Firma y Verificación de Token JWT:");
  const testUser = {
    id: "test-user-1",
    name: "Operador de Prueba",
    email: "operador@stopcontrol.local",
    role: "OPERADOR" as const,
    status: "ACTIVE",
  };
  const token = await signSessionToken(testUser);
  assert(typeof token === "string" && token.length > 20, "Generación exitosa de JWT firmado");

  const verifiedPayload = await verifySessionToken(token);
  assert(
    !!verifiedPayload &&
      verifiedPayload.id === testUser.id &&
      verifiedPayload.role === testUser.role &&
      verifiedPayload.email === testUser.email,
    "Verificación y decodificación correcta del JWT"
  );

  const fakeTokenResult = await verifySessionToken("invalid.token.signature");
  assert(fakeTokenResult === null, "Rechazo de firma JWT adulterada/inválida");

  // 4. Probar Matriz de Permisos RBAC
  console.log("\n4. Probando Matriz de Permisos RBAC:");
  assert(
    ROLE_PERMISSIONS.ADMINISTRADOR.includes("catalogs:manage") &&
      ROLE_PERMISSIONS.ADMINISTRADOR.includes("users:manage"),
    "Administrador tiene permisos de gestión de catálogos y usuarios"
  );
  assert(
    ROLE_PERMISSIONS.OPERADOR.includes("stops:create") &&
      !ROLE_PERMISSIONS.OPERADOR.includes("catalogs:manage"),
    "Operador puede registrar paros pero NO administrar catálogos"
  );
  assert(
    ROLE_PERMISSIONS.SUPERVISOR.includes("dashboard:view") &&
      ROLE_PERMISSIONS.SUPERVISOR.includes("metrics:view"),
    "Supervisor tiene acceso a dashboard e indicadores"
  );
  assert(
    ROLE_PERMISSIONS.MANTENIMIENTO.includes("maintenance:action") &&
      ROLE_PERMISSIONS.MANTENIMIENTO.includes("metrics:view"),
    "Mantenimiento tiene acceso a acciones técnicas e indicadores"
  );

  // 5. Probar Validación de Rutas por Rol (canRoleAccessRoute)
  console.log("\n5. Probando Reglas de Control de Acceso a Rutas (RBAC en Servidor):");
  // Administrador accede a todo
  assert(canRoleAccessRoute("ADMINISTRADOR", "/catalogs"), "ADMINISTRADOR tiene acceso a /catalogs");
  assert(canRoleAccessRoute("ADMINISTRADOR", "/dashboard"), "ADMINISTRADOR tiene acceso a /dashboard");

  // Operador
  assert(!canRoleAccessRoute("OPERADOR", "/catalogs"), "OPERADOR tiene denegado el acceso a /catalogs");
  assert(canRoleAccessRoute("OPERADOR", "/active-stops"), "OPERADOR tiene acceso a /active-stops");
  assert(canRoleAccessRoute("OPERADOR", "/register-stop"), "OPERADOR tiene acceso a /register-stop");

  // Supervisor
  assert(!canRoleAccessRoute("SUPERVISOR", "/catalogs"), "SUPERVISOR tiene denegado el acceso a /catalogs");
  assert(!canRoleAccessRoute("SUPERVISOR", "/register-stop"), "SUPERVISOR tiene denegado /register-stop");
  assert(canRoleAccessRoute("SUPERVISOR", "/dashboard"), "SUPERVISOR tiene acceso a /dashboard");

  // Mantenimiento
  assert(!canRoleAccessRoute("MANTENIMIENTO", "/catalogs"), "MANTENIMIENTO tiene denegado el acceso a /catalogs");
  assert(canRoleAccessRoute("MANTENIMIENTO", "/active-stops"), "MANTENIMIENTO tiene acceso a /active-stops");
  assert(canRoleAccessRoute("MANTENIMIENTO", "/history"), "MANTENIMIENTO tiene acceso a /history");

  console.log(`\n==========================================`);
  console.log(`Resultados: ${passedTests} de ${totalTests} pruebas pasaron exitosamente.`);
  console.log(`==========================================\n`);
}

runAuthTests().catch((e) => {
  console.error("Fallo inesperado en pruebas:", e);
  process.exit(1);
});
