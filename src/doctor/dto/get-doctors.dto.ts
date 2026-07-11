import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetDoctorsDto {
    @ApiPropertyOptional({ example: 10, description: 'Number of records to take' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    take?: number;

    @ApiPropertyOptional({ example: 0, description: 'Number of records to skip' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number;

    @ApiPropertyOptional({ example: 1, description: 'Filter by Specialty ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    specialtyId?: number;
}