import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from 'generated/prisma/enums';

export class UpdateAppointmentStatusDto {
    @IsEnum(AppointmentStatus)
    status: AppointmentStatus;

    @IsOptional()
    @IsString()
    doctorNote?: string; 
}