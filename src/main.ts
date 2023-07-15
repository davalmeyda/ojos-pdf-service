import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { generateDocumentacion } from './documentacion';
import * as bodyParser from 'body-parser';
import { PdfServiceModule } from './pdf-service.module';

async function bootstrap() {
	const app = await NestFactory.create(PdfServiceModule);

	const logger = new Logger('Main');

	// CONFIGURAMOS LA VALIDACION DE LOS DATOS ENVIADOS POR EL CLIENTE
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			// ESTE CAMPO ES OPCIONAL SI DESEAMOS QUE SOLO SE VALIDE LOS
			// CAMPOS QUE SEAN REQUERIDOS E IGNORAR LOS SOBRANTES
			forbidNonWhitelisted: false,
			transformOptions: {
				// COMBIERTE LOS VALORES DEL QUERY DE MANERA IMPLICITA
				// POR EJEMPLO: ?nombre=juan&apellido=perez
				// CONVIERTE LOS DATOS CON SUS RESPECTIVOS TIPOS SI ES ENTERO O STRING
				enableImplicitConversion: true,
			},
		}),
	);

	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

	// HABILITAMOS LOS CORS PARA PODER VISUALIZAR DESDE OTRO DOMINIO
	app.enableCors();

	// INTERSEPTOR PARA MANEJAR LOS ERRORES
	// app.useGlobalInterceptors(new ErroresInterceptor());

	// * CONFIGURACION PARA DOCUMENTACION
	generateDocumentacion(app);
	// FIN CONFIGURACION PARA DOCUMENTACION

	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

	await app.listen(process.env.PORT || 3000, () => {
		logger.log(`Server running on port ${process.env.PORT || 3000}`);
		logger.log(`Modo ${process.env.NODE_ENV ? process.env.NODE_ENV : 'Desarrollo'}`);
		logger.log(__dirname);
	});
}
bootstrap();
