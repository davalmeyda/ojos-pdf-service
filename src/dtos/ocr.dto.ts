import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class OCRDto {
	@IsArray()
	@ApiProperty()
	files: string[];

	@IsString()
	@ApiProperty()
	ruta: string;
}

export class ArchivoPDFDto {
	@IsNotEmpty()
	@ApiProperty({ type: 'string', format: 'binary' })
	archivo: any;
}
