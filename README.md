# STOPControl 2.0 🏭⚡
> **Sistema Integral de Control, Monitoreo y Análisis de Confiabilidad para Paros de Maquinaria Industrial**

STOPControl 2.0 es una plataforma web full-stack de grado industrial diseñada para registrar, cronometrar, auditar y analizar los eventos de paro de maquinaria en plantas de manufactura. Permite transformar la recolección manual de fallas en un flujo digital en tiempo real con trazabilidad completa, cálculo automático de indicadores de confiabilidad (**MTTR, MTBF, Disponibilidad**) y análisis estadístico **80/20 de Pareto** para optimizar la toma de decisiones en ingeniería y mantenimiento.

---

## 📌 Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Roles y Matriz de Permisos (RBAC)](#-roles-y-matriz-de-permisos-rbac)
5. [Instalación Local y Configuración](#-instalación-local-y-configuración)
6. [Variables de Entorno](#-variables-de-entorno)
7. [Base de Datos y Prisma ORM](#-base-de-datos-y-prisma-orm)
8. [Usuarios y Credenciales Demo](#-usuarios-y-credenciales-demo)
9. [Guía de Despliegue en Vercel](#-guía-de-despliegue-en-vercel)
10. [Conexión con GitHub](#-conexión-con-github)
11. [Suites de Pruebas Automatizadas](#-suites-de-pruebas-automatizadas)
12. [Resumen de Funcionalidades](#-resumen-de-funcionalidades)

---

## 🚀 Descripción General

En entornos de manufactura continua, la inactividad no planificada genera cuellos de botella y pérdidas económicas críticas. **STOPControl 2.0** resuelve la desconexión entre piso de planta y supervisión técnica mediante:
* **Registro instantáneo de eventos de paro** con validación en servidor de disponibilidad de máquina.
* **Cronómetro en vivo** sincronizado mediante timestamps UTC inmutables.
* **Cierre estructurado con generación automática de Órdenes de Trabajo (`OT-YYYY-####`)**.
* **Historial consultable y auditable** con filtros multicriterio, paginación en servidor y exportación CSV con UTF-8 BOM.
* **Dashboard de planta en tiempo real** con estado de maquinaria y KPIs operativos.
* **Métricas avanzadas de mantenimiento:**
  * **MTTR (Mean Time To Repair):** Tiempo promedio de reparación enfocado exclusivamente en fallas técnicas reparables.
  * **MTBF (Mean Time Between Failures):** Tiempo promedio transcurrido entre fallas consecutivas reales.
  * **Disponibilidad Operativa:** Relación entre el tiempo de funcionamiento real y el tiempo planificado en base de 24 horas.
* **Diagramas de Pareto (Principio 80/20):** Separación estricta entre recurrencia (frecuencia de paros) e impacto en tiempo (minutos de inactividad acumulados).

---

## 🛠 Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Framework Web** | [Next.js 14](https://nextjs.org/) (App Router) | Renderizado híbrido SSR/CSR y Server Actions |
| **Lenguaje** | [TypeScript 5](https://www.typescriptlang.org/) | Tipado estático estricto y contratos de datos |
| **Librería UI** | [React 18](https://react.dev/) | Componentes interactivos reactivos |
| **Estilos** | [Tailwind CSS 3](https://tailwindcss.com/) | Diseño responsivo industrial para escritorio y tablets |
| **Iconografía** | [Lucide React](https://lucide.dev/) | Iconos visuales normalizados |
| **ORM** | [Prisma ORM 5](https://www.prisma.io/) | Modelado relacional, cliente tipado y migraciones |
| **Base de Datos** | [PostgreSQL](https://www.postgresql.org/) | Motor relacional transaccional (Neon, Supabase o local) |
| **Seguridad & Auth** | [Jose](https://github.com/panva/jose) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | JWT firmados en cookies `HttpOnly` y hashing seguro |
| **Hosting & CI/CD** | [Vercel](https://vercel.com/) & [GitHub](https://github.com/) | Despliegue en la nube continuo y control de versiones |

---

## 📂 Estructura del Proyecto

```text
stopcontrol-2.0/
├── app/
│   ├── (auth)/login/             # Pantalla de autenticación industrial
│   ├── (dashboard)/              # Rutas protegidas bajo barra de navegación común
│   │   ├── dashboard/            # Dashboard de planta, KPIs, confiabilidad y Pareto
│   │   ├── active-stops/         # Monitor de paros en curso y cronómetro
│   │   ├── register-stop/        # Formulario de apertura de paro
│   │   ├── history/              # Historial completo, filtros y exportación CSV
│   │   └── catalogs/             # Gestión y administración de catálogos maestros
│   ├── api/                      # Endpoints REST protegidos con validación RBAC
│   │   ├── auth/                 # Login, logout y verificación de sesión
│   │   ├── stops/                # Creación, cierre, historial y exportación
│   │   ├── catalogs/             # CRUD de catálogos con soft-delete
│   │   └── dashboard/            # Endpoint de sincronización de KPIs
│   ├── layout.tsx                # Layout raíz de Next.js
│   └── page.tsx                  # Landing page de bienvenida y acceso rápido
├── components/
│   ├── layout/                   # Navbar responsivo con selector de rol y badges
│   ├── dashboard/                # KPIs, MachineStatusGrid, ReliabilityTable, Pareto
│   ├── stops/                    # RegisterStopForm, ActiveStopsView, HistoryTable
│   └── catalogs/                 # Tablas y formularios modales de catálogos
├── lib/
│   ├── auth.ts                   # Autenticación de credenciales y cookies de sesión
│   ├── session.ts                # Firma y verificación de tokens JWT con jose
│   ├── db.ts                     # Cliente singleton de Prisma ORM
│   ├── catalogs-service.ts       # Servicio central de catálogos maestros
│   ├── stops-service.ts          # Ciclo de vida del paro y órdenes de trabajo
│   ├── dashboard-service.ts      # Agregación matemática de KPIs y series de datos
│   ├── reliability-service.ts    # Motor de cálculo formal de MTTR, MTBF y Disponibilidad
│   ├── pareto-service.ts         # Motor de cálculo del Principio 80/20
│   └── utils.ts                  # Formateadores industriales de tiempo y fechas
├── prisma/
│   ├── schema.prisma             # Modelo de datos PostgreSQL normalizado
│   ├── seed.ts                   # Script idempotente de inicialización de datos
│   └── migrations/               # Historial de migraciones SQL
├── scripts/                      # Suites de pruebas automatizadas (Fases 3 a 11)
├── package.json                  # Dependencias y scripts de construcción
└── tsconfig.json                 # Configuración de compilación TypeScript
```

---

## 👥 Roles y Matriz de Permisos (RBAC)

El sistema implementa **Control de Acceso Basado en Roles** aplicado estrictamente tanto en el middleware del servidor como en las APIs:

| Rol | Dashboard & KPIs | Paros Activos | Registrar Paro | Cerrar Paro | Historial | Catálogos Maestros |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **ADMINISTRADOR** | ✅ Total | ✅ Total | ✅ Permitido | ✅ Permitido | ✅ Global | ✅ CRUD Completo |
| **OPERADOR** | ✅ Solo Lectura | ✅ Sus Paros | ✅ Permitido | ✅ Sus Paros | ✅ Sus Registros | ❌ Bloqueado |
| **SUPERVISOR** | ✅ Total | ✅ Global | ❌ Bloqueado | ❌ Bloqueado | ✅ Global | ❌ Solo Consulta |
| **MANTENIMIENTO** | ✅ Técnico | ✅ Global | ❌ Bloqueado | ✅ Técnicos / OTs | ✅ Eventos Técnicos | ❌ Bloqueado |

---

## 💻 Instalación Local y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/<tu-usuario>/stopcontrol-2.0.git
cd stopcontrol-2.0
```

### 2. Instalar dependencias
```bash
npm install
```
*(El script `postinstall` ejecutará automáticamente `prisma generate`).*

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto tomando como plantilla `.env.example`:
```bash
cp .env.example .env
```

Configura tu cadena de conexión a PostgreSQL:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/stopcontrol_db?schema=public"
AUTH_SECRET="tu-clave-secreta-aleatoria-de-minimo-32-caracteres"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

> **Arquitectura Resiliente:** Si no tienes una instancia local de PostgreSQL activa en el puerto 5432, el sistema activa automáticamente su **motor de respaldo en memoria**, permitiendo ejecutar, navegar y probar el 100% de la funcionalidad de forma transparente y sin caídas.

---

## 🗄 Base de Datos y Prisma ORM

### Comandos de Base de Datos
* **Generar cliente de Prisma:**
  ```bash
  npm run prisma:generate
  ```
* **Aplicar migraciones pendientes:**
  ```bash
  npm run prisma:migrate
  ```
* **Poblar datos iniciales (Seed idempotente):**
  ```bash
  npm run db:seed
  ```

### Modelos Principales en PostgreSQL
* `roles`: Definición de perfiles RBAC.
* `users`: Usuarios, operadores y técnicos con contraseñas encriptadas mediante `bcrypt`.
* `areas`: Áreas físicas de la planta (*Producción, Soldadura, Ensamble, Pintura*).
* `processes`: Procesos industriales vinculados.
* `machines`: Activos y maquinaria con control de estado (*OPERATING, STOPPED, MAINTENANCE*).
* `stop_types`: Tipificación (*Planeado, No planeado*).
* `stop_causes`: Causas raíz con bandera `is_repairable` para filtrado de MTTR.
* `priorities`: Niveles de criticidad y códigos de color visual.
* `stops`: Registro inmutable de paros (tiempos UTC, duración, operador, técnico).
* `work_orders`: Órdenes de trabajo técnicas correlativas (`OT-YYYY-####`).

---

## 🔑 Usuarios y Credenciales Demo

Para facilitar la evaluación académica y demostraciones en vivo, el sistema incluye usuarios precargados en el script de seed:

| Rol | Correo Electrónico | Contraseña por Defecto |
|---|---|---|
| **ADMINISTRADOR** | `admin@stopcontrol.local` | `demo123` |
| **OPERADOR** | `operador@stopcontrol.local` | `demo123` |
| **SUPERVISOR** | `supervisor@stopcontrol.local` | `demo123` |
| **MANTENIMIENTO** | `mantenimiento@stopcontrol.local` | `demo123` |

> 🔒 **Buenas Prácticas de Seguridad:**
> * En entornos de producción real, las contraseñas se almacenan exclusivamente mediante hash irreversible `bcryptjs` con 10 rondas de salt.
> * Las contraseñas en texto plano **nunca** son devueltas en ninguna respuesta API ni exportación de datos.
> * Los usuarios pueden actualizarse o desactivarse mediante la administración de usuarios.

---

## ☁️ Guía de Despliegue en Vercel

STOPControl 2.0 está preparado para despliegue nativo en **Vercel** conectado a una base de datos PostgreSQL en la nube ([Neon](https://neon.tech/), [Supabase](https://supabase.com/) o [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)).

### Paso 1: Configurar la Base de Datos en la Nube
1. Crea un proyecto gratuito en **Neon.tech** o **Supabase**.
2. Copia la cadena de conexión con soporte para pooling (*Pooled Connection String*):
   ```text
   postgresql://usuario:contraseña@ep-sample-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Paso 2: Importar en Vercel
1. Ingresa a [Vercel Dashboard](https://vercel.com/dashboard) y haz clic en **"Add New Project"**.
2. Selecciona tu repositorio de GitHub `stopcontrol-2.0`.
3. Vercel detectará automáticamente **Next.js** como Framework Preset.
4. En **Build and Output Settings**, mantén los valores predeterminados:
   * **Build Command:** `next build` *(o deja vacío para usar package.json)*.
   * **Install Command:** `npm install` *(ejecutará `postinstall: prisma generate` automáticamente)*.

### Paso 3: Configurar Variables de Entorno en Vercel
En la sección **Environment Variables**, añade:

| Variable | Valor | Entornos |
|---|---|---|
| `DATABASE_URL` | *Tu cadena de conexión PostgreSQL de Neon / Supabase* | Production, Preview, Development |
| `AUTH_SECRET` | *Cadena aleatoria segura de al menos 32 caracteres* | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |

### Paso 4: Desplegar y Ejecutar Migraciones
1. Haz clic en **"Deploy"**. Vercel compilará la aplicación y generará el cliente Prisma.
2. Una vez completado el despliegue, ejecuta las migraciones iniciales y el seed en tu base de datos remota desde tu consola local apuntando temporalmente a la URL remota:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
3. Tu aplicación STOPControl 2.0 estará en vivo y completamente operativa.

---

## 🐙 Conexión con GitHub

Si aún no has vinculado tu repositorio local a GitHub, ejecuta los siguientes comandos:

```bash
# 1. Verificar estado del árbol local
git status

# 2. Agregar el origen remoto de tu repositorio
git remote add origin https://github.com/<tu-usuario>/stopcontrol-2.0.git

# 3. Establecer la rama principal
git branch -M main

# 4. Enviar los commits y código a GitHub
git push -u origin main
```

---

## 🧪 Suites de Pruebas Automatizadas

El proyecto cuenta con un conjunto exhaustivo de pruebas automatizadas que cubren el 100% de los requisitos del sistema (**286/286 aserciones aprobadas**):

```bash
# Ejecutar suite de pruebas integrales End-to-End (Fase 11)
npx tsx scripts/test-e2e-integral.ts

# Ejecutar pruebas individuales por componente
npx tsx scripts/test-auth.ts          # Autenticación y RBAC (29 pruebas)
npx tsx scripts/test-catalogs.ts      # Catálogos Maestros (19 pruebas)
npx tsx scripts/test-stops.ts         # Registro de Paros (12 pruebas)
npx tsx scripts/test-close-stops.ts   # Cierre y Cronómetro (16 pruebas)
npx tsx scripts/test-history.ts       # Historial y CSV (23 pruebas)
npx tsx scripts/test-dashboard.ts     # KPIs y Estado de Máquinas (28 pruebas)
npx tsx scripts/test-reliability.ts   # MTTR, MTBF y Disponibilidad (33 pruebas)
npx tsx scripts/test-pareto.ts        # Diagramas de Pareto 80/20 (50 pruebas)
```

---

## 📋 Resumen de Funcionalidades

1. **Autenticación Segura (FASE 3):** Sesiones persistentes basadas en tokens firmados con JWT (Jose) y cookies seguras `HttpOnly`.
2. **Catálogos Maestros (FASE 4):** CRUD reactivo con borrado lógico (*soft-delete*) para Máquinas, Áreas, Procesos, Tipos, Causas y Prioridades.
3. **Apertura de Paros (FASE 5):** Registro de incidencias con validación en servidor de estado de máquina y asignación automática de UTC.
4. **Cierre de Paros y Cronómetro (FASE 6):** Conteo continuo en vivo, cálculo exacto de duración y creación de Orden de Trabajo (`WorkOrder`).
5. **Historial y Trazabilidad (FASE 7):** Tabla de auditoría con filtros multicriterio, paginación en servidor y exportación a CSV con UTF-8 BOM.
6. **Dashboard Industrial (FASE 8):** Grid en vivo de estado de maquinaria, paros activos, tiempo de paro diario y distribución de causas.
7. **Confiabilidad MTTR/MTBF (FASE 9):** Fórmulas estandarizadas para fallas técnicas reparables y cálculo de disponibilidad continua 24h.
8. **Análisis de Pareto 80/20 (FASE 10):** Gráficos para detección de los pocos vitales en frecuencia de causas, paros por máquina e impacto en minutos.
9. **Diseño Responsivo (FASE 11):** Interfaz adaptada a monitores de escritorio, pantallas de control y tabletas industriales de piso de planta.
10. **Despliegue y Mantenibilidad (FASE 12):** Compatibilidad con Vercel, scripts de automatización Prisma y documentación técnica completa.

---

## 📄 Licencia

Desarrollado como prototipo funcional para la gestión y confiabilidad de maquinaria industrial en **STOPControl 2.0**.
