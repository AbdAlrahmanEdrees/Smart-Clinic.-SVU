import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service'; // Adjust path as needed
import { RequestAppointmentDto } from './dto/request-appointment.dto';
import { AppointmentStatus } from 'generated/prisma/enums';
import { Appointment } from 'generated/prisma/client';

@Injectable()
export class AppointmentService {
    constructor(private readonly prisma: PrismaService) { }

    async requestAppointment(patientId: string, dto: RequestAppointmentDto) {
        const appointmentDate = new Date(dto.appointmentDate);

        // Verify the doctor exists
        const doctor = await this.prisma.doctor.findUnique({
            where: { id: dto.doctorId },
        });

        if (!doctor) {
            throw new NotFoundException('Doctor profile not found.');
        }

        const schedulingConflict = await this.prisma.appointment.findFirst({
            where: {
                doctorId: dto.doctorId,
                appointmentDate: appointmentDate,
                // Only care about conflicts if the appointment is CONFIRMED
                status: AppointmentStatus.CONFIRMED
            },
        });

        if (schedulingConflict) {
            throw new ConflictException('The doctor already has an appointment scheduled at this time.');
        }

        const appointment = await this.prisma.appointment.create({
            data: {
                patientId: patientId, // Extracted securely from the JWT in the controller
                doctorId: dto.doctorId,
                appointmentDate: appointmentDate,
            },
        });

        return appointment;
    }

    async updateAppointmentStatus(appointmentId: number, status: AppointmentStatus): Promise<Appointment> {
        const existingAppointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!existingAppointment) {
            throw new NotFoundException('Appointment not found.');
        }

        // Optimization: If the status is already what the user wants, return immediately to save a DB call
        if (existingAppointment.status === status) {
            return existingAppointment;
        }

        if (status === AppointmentStatus.CONFIRMED) {
            const schedulingConflict = await this.prisma.appointment.findFirst({
                where: {
                    doctorId: existingAppointment.doctorId,
                    appointmentDate: existingAppointment.appointmentDate,
                    status: AppointmentStatus.CONFIRMED,
                    id: { not: appointmentId }, // CRUCIAL: Exclude the current appointment from the search
                },
            });

            if (schedulingConflict) {
                throw new ConflictException('The doctor already has an appointment scheduled at this time.');
            }
        }

        return this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { status },
        });
    }

    async getPatientAppointments(patientId: string, skip?: number, take?: number): Promise<Appointment[]> {
        return this.prisma.appointment.findMany({
            where: {
                patientId: patientId
            },
            skip: skip || 0,
            take: take || 10,
            orderBy: {
                appointmentDate: 'desc', // Sort by date, newest first
            },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                fullName: true, // Only fetch the doctor's name, not their secure data
                            }
                        },
                        specialty: true,
                    }
                }
            }
        });
    }

    async getDoctorAppointments(doctorUserId: string, skip?: number, take?: number): Promise<Appointment[]> {
        return this.prisma.appointment.findMany({
            where: {
                doctor: {
                    userId: doctorUserId
                }
            },
            skip: skip || 0,
            take: take || 10,
            orderBy: {
                appointmentDate: 'asc', 
            },
            include: {
                patient: {
                    select: {
                        fullName: true,
                        phone: true,
                        email: true,
                    }
                }
            }
        });
    }
}