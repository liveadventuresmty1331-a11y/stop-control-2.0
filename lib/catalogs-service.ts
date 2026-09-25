import { db } from "./db";
import bcrypt from "bcryptjs";
import { INITIAL_AREAS, INITIAL_CAUSES, INITIAL_MACHINES, INITIAL_PRIORITIES, INITIAL_PROCESSES, INITIAL_STOP_TYPES, DEMO_USERS } from "./constants";
import { RoleName } from "./types";

// Almacén en memoria de respaldo para ejecución cuando PostgreSQL no esté activo localmente
const memoryStore = {
  roles: [
    { id: "role-1", name: "ADMINISTRADOR", description: "Control total" },
    { id: "role-2", name: "OPERADOR", description: "Registro de paros" },
    { id: "role-3", name: "SUPERVISOR", description: "Monitoreo y dashboard" },
    { id: "role-4", name: "MANTENIMIENTO", description: "Órdenes técnicas y MTTR" },
  ],
  areas: INITIAL_AREAS.map((name, i) => ({
    id: `area-${i + 1}`,
    name,
    description: `Área de ${name}`,
    active: true,
  })),
  processes: INITIAL_PROCESSES.map((name, i) => ({
    id: `proc-${i + 1}`,
    name,
    description: `Proceso de ${name}`,
    active: true,
  })),
  stopTypes: INITIAL_STOP_TYPES.map((name, i) => ({
    id: `type-${i + 1}`,
    name,
    description: `Paro ${name}`,
    active: true,
  })),
  stopCauses: INITIAL_CAUSES.map((name, i) => ({
    id: `cause-${i + 1}`,
    name,
    description: `Causa de ${name}`,
    isRepairable: name === "Falla mecánica" || name === "Falla eléctrica",
    active: true,
  })),
  priorities: INITIAL_PRIORITIES.map((p, i) => ({
    id: `priority-${i + 1}`,
    name: p.name,
    level: p.level,
    colorCode: p.color,
    active: true,
  })),
  machines: INITIAL_MACHINES.map((m, i) => ({
    id: `mach-${i + 1}`,
    code: m.code,
    name: m.name,
    areaName: m.areaName,
    areaId: `area-${INITIAL_AREAS.indexOf(m.areaName) + 1}`,
    status: i === 0 ? "STOPPED" : "OPERATING",
    active: true,
  })),
  users: DEMO_USERS.map((u, i) => ({
    id: `user-${i + 1}`,
    name: u.name,
    email: u.email,
    role: u.role,
    roleId: `role-${i + 1}`,
    status: "ACTIVE",
  })),
};

export async function getAllCatalogs() {
  try {
    const [roles, areas, processes, stopTypes, stopCauses, priorities, machines, users] = await Promise.all([
      db.role.findMany({ orderBy: { name: "asc" } }),
      db.area.findMany({ orderBy: { name: "asc" } }),
      db.process.findMany({ orderBy: { name: "asc" } }),
      db.stopType.findMany({ orderBy: { name: "asc" } }),
      db.stopCause.findMany({ orderBy: { name: "asc" } }),
      db.priority.findMany({ orderBy: { level: "asc" } }),
      db.machine.findMany({ include: { area: true }, orderBy: { code: "asc" } }),
      db.user.findMany({
        select: { id: true, name: true, email: true, status: true, roleId: true, role: true, createdAt: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return { roles, areas, processes, stopTypes, stopCauses, priorities, machines, users };
  } catch {
    // Retornar almacén en memoria
    return {
      roles: memoryStore.roles,
      areas: memoryStore.areas,
      processes: memoryStore.processes,
      stopTypes: memoryStore.stopTypes,
      stopCauses: memoryStore.stopCauses,
      priorities: memoryStore.priorities,
      machines: memoryStore.machines.map((m) => ({
        ...m,
        area: memoryStore.areas.find((a) => a.id === m.areaId || a.name === m.areaName),
      })),
      users: memoryStore.users,
    };
  }
}

// ---------------------------------------------
// CREACIÓN DE REGISTROS DE CATÁLOGOS
// ---------------------------------------------
export async function createCatalogItem(type: string, data: Record<string, unknown>) {
  switch (type) {
    case "machines": {
      const code = String(data.code || "").trim().toUpperCase();
      const name = String(data.name || "").trim();
      const areaId = String(data.areaId || "");
      const status = String(data.status || "OPERATING");

      if (!code || !name || !areaId) throw new Error("Código, nombre y área son obligatorios");

      try {
        return await db.machine.create({
          data: { code, name, areaId, status, active: true },
          include: { area: true },
        });
      } catch (err: unknown) {
        const isPrismaUnique = typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
        if (isPrismaUnique || memoryStore.machines.some((m) => m.code === code)) {
          throw new Error("Ya existe una máquina con el código " + code);
        }
        const area = memoryStore.areas.find((a) => a.id === areaId);
        const newMach = {
          id: `mach-${Date.now()}`,
          code,
          name,
          areaId,
          areaName: area?.name || "",
          status,
          active: true,
          area,
        };
        memoryStore.machines.push(newMach);
        return newMach;
      }
    }

    case "areas": {
      const name = String(data.name || "").trim();
      const description = String(data.description || "").trim();
      if (!name) throw new Error("El nombre del área es obligatorio");

      try {
        return await db.area.create({ data: { name, description, active: true } });
      } catch (err: unknown) {
        const isPrismaUnique = typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
        if (isPrismaUnique || memoryStore.areas.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
          throw new Error("Ya existe un área con el nombre " + name);
        }
        const newArea = { id: `area-${Date.now()}`, name, description, active: true };
        memoryStore.areas.push(newArea);
        return newArea;
      }
    }

    case "processes": {
      const name = String(data.name || "").trim();
      const description = String(data.description || "").trim();
      if (!name) throw new Error("El nombre del proceso es obligatorio");

      try {
        return await db.process.create({ data: { name, description, active: true } });
      } catch (err: unknown) {
        const isPrismaUnique = typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
        if (isPrismaUnique || memoryStore.processes.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
          throw new Error("Ya existe un proceso con el nombre " + name);
        }
        const newProc = { id: `proc-${Date.now()}`, name, description, active: true };
        memoryStore.processes.push(newProc);
        return newProc;
      }
    }

    case "stop-causes": {
      const name = String(data.name || "").trim();
      const description = String(data.description || "").trim();
      const isRepairable = Boolean(data.isRepairable);
      if (!name) throw new Error("El nombre de la causa es obligatorio");

      try {
        return await db.stopCause.create({ data: { name, description, isRepairable, active: true } });
      } catch (err: unknown) {
        const isPrismaUnique = typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
        if (isPrismaUnique || memoryStore.stopCauses.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
          throw new Error("Ya existe una causa con el nombre " + name);
        }
        const newCause = { id: `cause-${Date.now()}`, name, description, isRepairable, active: true };
        memoryStore.stopCauses.push(newCause);
        return newCause;
      }
    }

    case "stop-types": {
      const name = String(data.name || "").trim();
      const description = String(data.description || "").trim();
      if (!name) throw new Error("El nombre del tipo de paro es obligatorio");

      try {
        return await db.stopType.create({ data: { name, description, active: true } });
      } catch (err: unknown) {
        const isPrismaUnique = typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
        if (isPrismaUnique || memoryStore.stopTypes.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
          throw new Error("Ya existe un tipo de paro con el nombre " + name);
        }
        const newType = { id: `type-${Date.now()}`, name, description, active: true };
        memoryStore.stopTypes.push(newType);
        return newType;
      }
    }

    case "priorities": {
      const name = String(data.name || "").trim();
      const level = Number(data.level) || 1;
      const colorCode = String(data.colorCode || "#3b82f6");
      if (!name) throw new Error("El nombre de la prioridad es obligatorio");

      try {
        return await db.priority.create({ data: { name, level, colorCode, active: true } });
      } catch (err: unknown) {
        const isPrismaUnique = typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
        if (isPrismaUnique || memoryStore.priorities.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
          throw new Error("Ya existe una prioridad con el nombre " + name);
        }
        const newPri = { id: `priority-${Date.now()}`, name, level, colorCode, active: true };
        memoryStore.priorities.push(newPri);
        return newPri;
      }
    }

    case "users": {
      const name = String(data.name || "").trim();
      const email = String(data.email || "").trim().toLowerCase();
      const plainPassword = String(data.password || "demo123");
      const roleName = String(data.role || "");
      const roleId = String(data.roleId || "");

      if (!name || !email) throw new Error("Nombre y correo son obligatorios");

      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      try {
        const foundRole = roleId 
          ? await db.role.findUnique({ where: { id: roleId } })
          : await db.role.findUnique({ where: { name: roleName } });
        
        if (!foundRole) throw new Error("El rol especificado no existe");

        const user = await db.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            roleId: foundRole.id,
            status: "ACTIVE",
          },
          select: { id: true, name: true, email: true, status: true, role: true, createdAt: true },
        });
        return user;
      } catch (err: unknown) {
        const isPrismaUnique = typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
        if (isPrismaUnique || memoryStore.users.some((u) => u.email === email)) {
          throw new Error("Ya existe un usuario con el correo " + email);
        }
        const newUser = {
          id: `user-${Date.now()}`,
          name,
          email,
          role: (roleName as RoleName) || "OPERADOR",
          roleId: roleId || "role-2",
          status: "ACTIVE",
        };
        memoryStore.users.push(newUser);
        return newUser;
      }
    }

    default:
      throw new Error("Catálogo no reconocido");
  }
}

// ---------------------------------------------
// ACTUALIZACIÓN DE REGISTROS DE CATÁLOGOS
// ---------------------------------------------
export async function updateCatalogItem(type: string, id: string, data: Record<string, unknown>) {
  switch (type) {
    case "machines": {
      const name = data.name ? String(data.name).trim() : undefined;
      const code = data.code ? String(data.code).trim().toUpperCase() : undefined;
      const areaId = data.areaId ? String(data.areaId) : undefined;
      const status = data.status ? String(data.status) : undefined;

      try {
        return await db.machine.update({
          where: { id },
          data: { ...(name && { name }), ...(code && { code }), ...(areaId && { areaId }), ...(status && { status }) },
          include: { area: true },
        });
      } catch {
        const index = memoryStore.machines.findIndex((m) => m.id === id);
        if (index === -1) throw new Error("Máquina no encontrada");
        if (name) memoryStore.machines[index].name = name;
        if (code) memoryStore.machines[index].code = code;
        if (areaId) {
          memoryStore.machines[index].areaId = areaId;
          const area = memoryStore.areas.find((a) => a.id === areaId);
          if (area) memoryStore.machines[index].areaName = area.name;
        }
        if (status) memoryStore.machines[index].status = status;
        return memoryStore.machines[index];
      }
    }

    case "areas": {
      const name = data.name ? String(data.name).trim() : undefined;
      const description = data.description !== undefined ? String(data.description).trim() : undefined;
      try {
        return await db.area.update({ where: { id }, data: { ...(name && { name }), ...(description !== undefined && { description }) } });
      } catch {
        const index = memoryStore.areas.findIndex((a) => a.id === id);
        if (index === -1) throw new Error("Área no encontrada");
        if (name) memoryStore.areas[index].name = name;
        if (description !== undefined) memoryStore.areas[index].description = description;
        return memoryStore.areas[index];
      }
    }

    case "processes": {
      const name = data.name ? String(data.name).trim() : undefined;
      const description = data.description !== undefined ? String(data.description).trim() : undefined;
      try {
        return await db.process.update({ where: { id }, data: { ...(name && { name }), ...(description !== undefined && { description }) } });
      } catch {
        const index = memoryStore.processes.findIndex((p) => p.id === id);
        if (index === -1) throw new Error("Proceso no encontrado");
        if (name) memoryStore.processes[index].name = name;
        if (description !== undefined) memoryStore.processes[index].description = description;
        return memoryStore.processes[index];
      }
    }

    case "stop-causes": {
      const name = data.name ? String(data.name).trim() : undefined;
      const isRepairable = data.isRepairable !== undefined ? Boolean(data.isRepairable) : undefined;
      try {
        return await db.stopCause.update({ where: { id }, data: { ...(name && { name }), ...(isRepairable !== undefined && { isRepairable }) } });
      } catch {
        const index = memoryStore.stopCauses.findIndex((c) => c.id === id);
        if (index === -1) throw new Error("Causa no encontrada");
        if (name) memoryStore.stopCauses[index].name = name;
        if (isRepairable !== undefined) memoryStore.stopCauses[index].isRepairable = isRepairable;
        return memoryStore.stopCauses[index];
      }
    }

    case "stop-types": {
      const name = data.name ? String(data.name).trim() : undefined;
      const description = data.description !== undefined ? String(data.description).trim() : undefined;
      try {
        return await db.stopType.update({ where: { id }, data: { ...(name && { name }), ...(description !== undefined && { description }) } });
      } catch {
        const index = memoryStore.stopTypes.findIndex((t) => t.id === id);
        if (index === -1) throw new Error("Tipo de paro no encontrado");
        if (name) memoryStore.stopTypes[index].name = name;
        if (description !== undefined) memoryStore.stopTypes[index].description = description;
        return memoryStore.stopTypes[index];
      }
    }

    case "priorities": {
      const name = data.name ? String(data.name).trim() : undefined;
      const level = data.level !== undefined ? Number(data.level) : undefined;
      const colorCode = data.colorCode ? String(data.colorCode) : undefined;
      try {
        return await db.priority.update({ where: { id }, data: { ...(name && { name }), ...(level !== undefined && { level }), ...(colorCode && { colorCode }) } });
      } catch {
        const index = memoryStore.priorities.findIndex((p) => p.id === id);
        if (index === -1) throw new Error("Prioridad no encontrada");
        if (name) memoryStore.priorities[index].name = name;
        if (level !== undefined) memoryStore.priorities[index].level = level;
        if (colorCode) memoryStore.priorities[index].colorCode = colorCode;
        return memoryStore.priorities[index];
      }
    }

    case "users": {
      const name = data.name ? String(data.name).trim() : undefined;
      const roleName = data.role ? String(data.role) : undefined;
      const status = data.status ? String(data.status) : undefined;
      const newPassword = data.password ? await bcrypt.hash(String(data.password), 10) : undefined;

      try {
        let roleId = undefined;
        if (roleName) {
          const r = await db.role.findUnique({ where: { name: roleName } });
          if (r) roleId = r.id;
        }

        return await db.user.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(roleId && { roleId }),
            ...(status && { status }),
            ...(newPassword && { password: newPassword }),
          },
          select: { id: true, name: true, email: true, status: true, role: true, createdAt: true },
        });
      } catch {
        const index = memoryStore.users.findIndex((u) => u.id === id);
        if (index === -1) throw new Error("Usuario no encontrado");
        if (name) memoryStore.users[index].name = name;
        if (roleName) memoryStore.users[index].role = roleName as RoleName;
        if (status) memoryStore.users[index].status = status;
        return memoryStore.users[index];
      }
    }

    default:
      throw new Error("Catálogo no reconocido");
  }
}

// ---------------------------------------------
// TOGGLE ACTIVACIÓN / DESACTIVACIÓN (SOFT-DELETE)
// ---------------------------------------------
export async function toggleItemStatus(type: string, id: string) {
  switch (type) {
    case "machines": {
      try {
        const current = await db.machine.findUnique({ where: { id }, include: { stops: { where: { status: "ACTIVE" } } } });
        if (!current) throw new Error("Máquina no encontrada");
        if (current.stops.length > 0 && current.active) {
          throw new Error("No se puede desactivar la máquina porque tiene un paro activo en curso");
        }
        return await db.machine.update({ where: { id }, data: { active: !current.active } });
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes("paro activo")) throw err;
        const item = memoryStore.machines.find((m) => m.id === id);
        if (!item) throw new Error("Máquina no encontrada");
        item.active = !item.active;
        return item;
      }
    }

    case "areas": {
      try {
        const current = await db.area.findUnique({ where: { id } });
        if (!current) throw new Error("Área no encontrada");
        return await db.area.update({ where: { id }, data: { active: !current.active } });
      } catch {
        const item = memoryStore.areas.find((a) => a.id === id);
        if (!item) throw new Error("Área no encontrada");
        item.active = !item.active;
        return item;
      }
    }

    case "processes": {
      try {
        const current = await db.process.findUnique({ where: { id } });
        if (!current) throw new Error("Proceso no encontrado");
        return await db.process.update({ where: { id }, data: { active: !current.active } });
      } catch {
        const item = memoryStore.processes.find((p) => p.id === id);
        if (!item) throw new Error("Proceso no encontrado");
        item.active = !item.active;
        return item;
      }
    }

    case "stop-causes": {
      try {
        const current = await db.stopCause.findUnique({ where: { id } });
        if (!current) throw new Error("Causa no encontrada");
        return await db.stopCause.update({ where: { id }, data: { active: !current.active } });
      } catch {
        const item = memoryStore.stopCauses.find((c) => c.id === id);
        if (!item) throw new Error("Causa no encontrada");
        item.active = !item.active;
        return item;
      }
    }

    case "stop-types": {
      try {
        const current = await db.stopType.findUnique({ where: { id } });
        if (!current) throw new Error("Tipo de paro no encontrado");
        return await db.stopType.update({ where: { id }, data: { active: !current.active } });
      } catch {
        const item = memoryStore.stopTypes.find((t) => t.id === id);
        if (!item) throw new Error("Tipo de paro no encontrado");
        item.active = !item.active;
        return item;
      }
    }

    case "priorities": {
      try {
        const current = await db.priority.findUnique({ where: { id } });
        if (!current) throw new Error("Prioridad no encontrada");
        return await db.priority.update({ where: { id }, data: { active: !current.active } });
      } catch {
        const item = memoryStore.priorities.find((p) => p.id === id);
        if (!item) throw new Error("Prioridad no encontrada");
        item.active = !item.active;
        return item;
      }
    }

    case "users": {
      try {
        const current = await db.user.findUnique({ where: { id } });
        if (!current) throw new Error("Usuario no encontrado");
        const newStatus = current.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return await db.user.update({
          where: { id },
          data: { status: newStatus },
          select: { id: true, name: true, email: true, status: true, role: true },
        });
      } catch {
        const item = memoryStore.users.find((u) => u.id === id);
        if (!item) throw new Error("Usuario no encontrado");
        item.status = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return item;
      }
    }

    default:
      throw new Error("Catálogo no reconocido");
  }
}
