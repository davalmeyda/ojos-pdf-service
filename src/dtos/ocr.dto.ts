import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OCRDto {
	@IsArray()
	@ApiProperty()
	files: string[];

	@IsString()
	@ApiProperty()
	ruta: string;
}

export class PdfBase64Dto {
	@IsString()
	@ApiProperty()
	archivoBase64: string;

	@IsOptional()
	@IsString()
	@ApiProperty()
	pass?: string;
}

export class ArchivoPDFDto {
	@IsNotEmpty()
	@ApiProperty({ type: 'string', format: 'binary' })
	archivo: any;
}
