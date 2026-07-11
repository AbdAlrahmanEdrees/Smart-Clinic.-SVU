import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service'; // Adjust path if necessary
import { Doctor } from 'generated/prisma/client';

@Injectable()
export class DoctorService {
    constructor(private readonly prisma: PrismaService) { }

    async getDoctors(take?: number, skip?: number, specialtyId?: number): Promise<Doctor[]> {
        return this.prisma.doctor.findMany({
            skip: skip || 0,             // Default to 0 if undefined
            take: take || 10,            // Default to 10 records per page if undefined
            where: {
                ...(specialtyId ? { specialtyId } : {}),
            },
            include: {
                // Attach the user's profile details
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        phone: true,
                    }
                },
                specialty: true,
            },
        });
    }
}