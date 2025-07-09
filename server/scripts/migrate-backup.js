// Migration script: Copy users and projects from dev-backup.db to dev.db
const { PrismaClient } = require("@prisma/client");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const prisma = new PrismaClient();
const BACKUP_DB = path.join(__dirname, "../prisma/dev-backup.db");

async function getAllFromBackup(table) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(BACKUP_DB);
    db.all(`SELECT * FROM ${table}`, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrateUsers() {
  const users = await getAllFromBackup("User");
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
      },
    });
  }
  console.log(`Migrated ${users.length} users.`);
}

async function migrateProjects() {
  const projects = await getAllFromBackup("Project");
  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {},
      create: {
        id: project.id,
        userId: project.userId,
        name: project.name,
        createdAt: project.createdAt,
      },
    });
  }
  console.log(`Migrated ${projects.length} projects.`);
}

async function main() {
  await migrateUsers();
  await migrateProjects();
  // Add more migration functions for other tables as needed
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
