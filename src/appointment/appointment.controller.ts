import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, ParseIntPipe, ParseEnumPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { AppointmentService } from './appointment.service';
import { RequestAppointmentDto } from './dto/request-appointment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, AppointmentStatus } from 'generated/prisma/enums';
import { JwtPayload } from 'src/auth/types/jwtPayload.type';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(RolesGuard) // Enforces the @Roles() metadata across all endpoints
@Controller('appointments')
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) { }

    @Post()
    @Roles(UserRole.PATIENT)
    @ApiOperation({ summary: 'Request a new appointment' })
    @ApiResponse({ status: 201, description: 'Appointment successfully requested.' })
    @ApiResponse({ status: 404, description: 'Doctor not found.' })
    @ApiResponse({ status: 409, description: 'Scheduling conflict.' })
    requestAppointment(
        @Req() req: Request,
        @Body() dto: RequestAppointmentDto
    ) {
        // Securely extract the patient's User ID from the JWT payload
        const patientId = (req.user as JwtPayload).sub;
        return this.appointmentService.requestAppointment(patientId, dto);
    }

    @Patch(':id/status')
    @Roles(UserRole.DOCTOR) // Only doctors (or admins) should confirm/cancel
    @ApiOperation({ summary: 'Update the status of an appointment' })
    @ApiResponse({ status: 200, description: 'Status updated successfully.' })
    updateAppointmentStatus(
        @Param('id', ParseIntPipe) appointmentId: number,
        @Body('status', new ParseEnumPipe(AppointmentStatus)) status: AppointmentStatus
    ) {
        return this.appointmentService.updateAppointmentStatus(appointmentId, status);
    }

    @Get('patient')
    @Roles(UserRole.PATIENT)
    @ApiOperation({ summary: 'Get paginated appointments for the logged-in patient' })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiQuery({ name: 'take', required: false, type: Number })
    getPatientAppointments(
        @Req() req: Request,
        @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
        @Query('take', new ParseIntPipe({ optional: true })) take?: number
    ) {
        const patientId = (req.user as JwtPayload).sub;
        return this.appointmentService.getPatientAppointments(patientId, skip, take);
    }

    @Get('doctor')
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Get paginated appointments for a specific doctor' })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiQuery({ name: 'take', required: false, type: Number })
    getDoctorAppointments(
        @Req() req: Request,
        @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
        @Query('take', new ParseIntPipe({ optional: true })) take?: number
    ) {
        const doctorUserId = (req.user as JwtPayload).sub;
        return this.appointmentService.getDoctorAppointments(doctorUserId, skip, take);
    }
}