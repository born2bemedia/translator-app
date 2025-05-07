import { sql } from '@vercel/postgres';
import { hash } from 'bcrypt';

async function seed() {
  try {
    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await hash(adminPassword, 10);

    await sql`
      INSERT INTO users (email, password, name, role)
      VALUES (${adminEmail}, ${hashedPassword}, 'Admin User', 'admin')
      ON CONFLICT (email) DO NOTHING
    `;

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed(); 