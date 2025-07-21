// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el seeding...');

  // Crear roles
  const rolesToCreate = [
    { nombre_rol: 'Administrador', descripcion: 'Acceso completo al sistema' },
    { nombre_rol: 'Vendedor', descripcion: 'Puede realizar ventas y consultar productos' },
    { nombre_rol: 'Almacenero', descripcion: 'Puede gestionar inventario y realizar compras' },
    { nombre_rol: 'Cajero', descripcion: 'Solo puede realizar ventas' },
  ];

  for (const roleData of rolesToCreate) {
    const role = await prisma.role.upsert({
      where: { nombre_rol: roleData.nombre_rol },
      update: {},
      create: roleData,
    });
    console.log(`Rol creado/actualizado: ${role.nombre_rol} (ID: ${role.id_rol})`);
  }

  // Crear usuario administrador por defecto si no existe
  const existingAdmin = await prisma.user.findUnique({
    where: { nombre_usuario: 'admin' },
  });

  if (!existingAdmin) {
    const adminRole = await prisma.role.findUnique({ where: { nombre_rol: 'Administrador' } });
    if (!adminRole) {
      console.error('El rol "Administrador" no se encontró. No se pudo crear el usuario admin.');
      return;
    }

    const password_hash = await bcrypt.hash('adminpassword', await bcrypt.genSalt());
    const adminUser = await prisma.user.create({
      data: {
        id_rol: adminRole.id_rol,
        nombre_usuario: 'admin',
        email: 'admin@sistema.com',
        password_hash: password_hash,
        nombre_completo: 'Administrador del Sistema',
        telefono: '123456789',
        activo: true,
      },
    });
    console.log('Usuario administrador por defecto creado:', adminUser);
  } else {
    console.log('El usuario administrador ya existe.');
  }

  console.log('Seeding completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });