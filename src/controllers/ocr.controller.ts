import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { readPdfText } from 'pdf-text-reader';
import { FileInterceptor } from '@nestjs/platform-express';
import { customResponse } from '../common/response';
import { ArchivoPDFDto, OCRDto } from '../dtos/ocr.dto';
import * as fs from 'fs';

@Controller('OCR')
@ApiTags('OCR')
export class PdfServiceController {
	@Post('convertPDF')
	@ApiOperation({ summary: 'convert PDF to Text' })
	async pdfToText(@Body() body: OCRDto) {
		if (body.ruta.includes('public')) {
			body.ruta = body.ruta.split('public/')[1];
		}

		const url = process.env.LARAVEL_URL + '/' + body.ruta;

		const promises = [];
		body.files.forEach(element => {
			const fileUrl = url + '/' + element;
			promises.push({ fileName: element, promise: readPdfText(fileUrl) });
		});

		const response = await Promise.all(promises.map(p => p.promise));

		const dataDepurada = promises.map((element, index) => {
			try {
				const data = response[index][0]['lines'];

				const ruc = data.find((line: string) => line.includes('RUC:'));
				const serie = data.find((line: string) => line.includes('E001-'));
				// buscar cualquiera con esta coincidencia exacta dd/mm/yyyy usando regex
				const fecha = data.find((line: string) => /\d{2}\/\d{2}\/\d{4}/.test(line));
				const importeTotal = data.find((line: string) => line.includes('Importe Total :'));

				return {
					fileName: element.fileName,
					ruc: ruc.split(':')[1].trim(),
					serie: serie.split('-')[1].trim(),
					fecha,
					importeTotal: importeTotal
						.split(':')[1]
						.trim()
						.replaceAll(',', '')
						.replace('S/', '')
						.trim(),
				};
			} catch (error) {
				return {
					fileName: element.fileName,
					ruc: '',
					serie: '',
					fecha: '',
					importeTotal: '',
				};
			}
		});

		return customResponse('pdf', dataDepurada);
	}

	@Post('test')
	@ApiOperation({ summary: 'Subir un archivo pdf para testear el resultado' })
	@ApiConsumes('multipart/form-data')
	@UseInterceptors(FileInterceptor('archivo', { dest: __dirname + '/temp' }))
	@ApiBody({ type: ArchivoPDFDto })
	async pdfTest(@UploadedFile() archivo: Express.Multer.File) {
		const pathArchivo = archivo.path;
		const response = await readPdfText(pathArchivo);

		const data = response[0]['lines'];

		const ruc = data.find((line: string) => line.includes('RUC:'));
		const serie = data.find((line: string) => line.includes('E001-'));
		// buscar cualquiera con esta coincidencia exacta dd/mm/yyyy usando regex
		const fecha = data.find((line: string) => /\d{2}\/\d{2}\/\d{4}/.test(line));
		const importeTotal = data.find((line: string) => line.includes('Importe Total :'));

		// eliminar el archivo
		fs.unlinkSync(pathArchivo);

		return customResponse('pdf', {
			response,
			dd: {
				ruc: ruc.split(':')[1].trim(),
				serie: serie.split('-')[1].trim(),
				fecha,
				importeTotal: importeTotal
					.split(':')[1]
					.trim()
					.replaceAll(',', '')
					.replace('S/', '')
					.trim(),
			},
		});
	}
}
