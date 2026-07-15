import { PrismaClient } from '../generated/prisma/client';
import * as dotenv from 'dotenv';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';

dotenv.config();

async function seedDb() {
    console.log('========== Seed Started ==========');

    console.log('Creating database adapter...');

    const adapter = new PrismaMariaDb({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: Number(process.env.DB_PORT),
        ssl: {
            rejectUnauthorized: false,
        },
        connectTimeout: 10000,
    });

    console.log('Creating Prisma client...');

    const prisma = new PrismaClient({
        adapter,
    });

    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('✅ Connected successfully.');

        console.log('Hashing password...');
        const hashedPass = await bcrypt.hash('123456', 10);
        console.log('Password hashed.');

        // Uncomment if needed
        /*
        console.log('Creating super admin...');
        await prisma.user.create({
          data: {
            email: 'abdo.1628888@gmail.com',
            hashedPassword: hashedPass,
            fullName: 'Abd',
            phone: '0982381873',
            role: UserRole.SUPER_ADMIN,
          },
        });
        */

        console.log('Creating specialties...');

        const specialties = [
            'داخلية',
            'أسنان',
            'أطفال',
            'جلدية',
            'قلب',
            'أعصاب',
        ];
        await prisma.specialty.deleteMany();

        for (const name of specialties) {
            console.log(`Creating specialty: ${name}`);

            await prisma.specialty.create({
                data: {
                    name,
                },
            });

            console.log(`✅ ${name} created.`);
        }

        console.log('========== Seeding Finished Successfully ==========');
    } catch (error) {
        console.error('========== Seeding Failed ==========');
        console.error(error);
        process.exitCode = 1;
    } finally {
        console.log('Disconnecting Prisma...');
        await prisma.$disconnect();
        console.log('Disconnected.');
    }
}

seedDb();