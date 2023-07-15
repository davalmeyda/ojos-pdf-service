import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PdfServiceModule } from './pdf-service.module';

export function generateDocumentacion(app) {
	/** Genera una documentacion para el modulo de PDF */
	const pdfMod = new DocumentBuilder()
		.setTitle('PDF')
		.setDescription('Modulo PDF')
		.setVersion(process.env.APP_VERSION)
		// .addTag('PDF')
		.build();
	const pdfDocument = SwaggerModule.createDocument(app, pdfMod, {
		include: [PdfServiceModule],
	});
	SwaggerModule.setup('docs/pdf', app, pdfDocument);
}
