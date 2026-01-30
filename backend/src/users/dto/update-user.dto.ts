import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsBoolean()
    @IsOptional()
    is_online?: boolean;

    @IsDateString()
    @IsOptional()
    last_seen?: string;

    @IsString()
    @IsOptional()
    localizacao_gps?: string;
}
