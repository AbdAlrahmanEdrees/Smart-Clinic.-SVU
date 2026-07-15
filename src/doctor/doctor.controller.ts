import { Controller, Get, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { Doctor, UserRole } from 'generated/prisma/client';
import { GetDoctorsDto } from './dto/get-doctors.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('Doctors')
@ApiBearerAuth() // Restored so Swagger requires the JWT token
@Controller('doctors')
export class DoctorController {
    constructor(private readonly doctorService: DoctorService) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieve a paginated list of doctors' })
    @ApiResponse({ status: 200, description: 'List of doctors retrieved successfully.' })
    @ApiResponse({ status: 403, description: 'Forbidden: Insufficient role or expired token.' })
    // @Roles(UserRole.PATIENT)
    // @UseGuards(RolesGuard) // RolesGuard runs AFTER the global AtGuard
    getDoctors(@Query() query: GetDoctorsDto): Promise<Doctor[]> {
        return this.doctorService.getDoctors(query.take, query.skip, query.specialtyId);
    }
    
    @Get('specialities')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Retrieves the types of specialties defined in the system'})
    getSpecialties(){
        return this.doctorService.getSpecialties();
    }
}