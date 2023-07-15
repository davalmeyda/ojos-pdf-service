import { Module } from '@nestjs/common';
import { PdfServiceController } from './controllers/ocr.controller';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import config, { validation } from './config/config';

@Module({
	imports: [
		ConfigModule.forRoot({
			// * Definimos que es global
			isGlobal: true,
			// * Definimos el archivo de configuracion
			envFilePath: 'pdf-service.env',
			// * Definimos el esquema y la validacion
			load: [config],
			validationSchema: Joi.object(validation),
		}),
	],
	controllers: [PdfServiceController],
})
export class PdfServiceModule {}
