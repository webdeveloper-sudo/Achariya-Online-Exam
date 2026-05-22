require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not defined in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@achariya.org';
  const password = '123';
  
  // Hash the password with bcrypt (10 rounds)
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { passwordHash },
    create: {
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'Admin',
    },
  });

  console.log('Successfully seeded super admin:', admin.email);

  const recruiterEmail = 'recruitement@achariya.org';
  const recruiterPassword = '123';
  const recruiterPasswordHash = await bcrypt.hash(recruiterPassword, 10);

  const recruiter = await prisma.recruiter.upsert({
    where: { email: recruiterEmail.toLowerCase().trim() },
    update: { passwordHash: recruiterPasswordHash },
    create: {
      email: recruiterEmail.toLowerCase().trim(),
      passwordHash: recruiterPasswordHash,
      name: 'Recruiter Admin',
    },
  });

  console.log('Successfully seeded recruiter:', recruiter.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
