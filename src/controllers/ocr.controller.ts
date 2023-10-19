import {
	BadRequestException,
	Body,
	Controller,
	Post,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { readPdfText } from 'pdf-text-reader';
import { FileInterceptor } from '@nestjs/platform-express';
import { customResponse } from '../common/response';
import { ArchivoPDFDto, OCRDto, PdfBase64Dto } from '../dtos/ocr.dto';
import * as fs from 'fs';

@Controller('OCR')
@ApiTags('OCR')
export class PdfServiceController {
	@Post('convertPDF')
	@ApiOperation({ summary: 'convert PDF to Text' })
	async pdfToText(@Body() body: OCRDto) {
		console.log(body);

		if (body.ruta.includes('public')) {
			body.ruta = body.ruta.split('public/')[1];
		}

		console.log(body.ruta);

		const url = process.env.LARAVEL_URL + '/' + body.ruta;

		console.log(url);

		const promises = [];
		body.files.forEach(element => {
			const fileUrl = url + '/' + element;
			promises.push({ fileName: element, promise: readPdfText(fileUrl) });
		});

		const response = await Promise.all(promises.map(p => p.promise));

		const dataDepurada = promises.map((element, index) => {
			try {
				const data = response[index][0]['lines'];

				console.log(data);

				// const rucCliente = data.find((line: string) => line.startsWith(': '));
				const ruc = data.find((line: string) => line.includes('RUC:'));
				const serie = data.find((line: string) => line.includes('E001-'));
				// buscar cualquiera con esta coincidencia exacta dd/mm/yyyy usando regex
				const fecha = data.find((line: string) => /\d{2}\/\d{2}\/\d{4}/.test(line));
				const importeTotal = data.find((line: string) => line.includes('Importe Total :'));

				console.log({
					// rucCliente,
					ruc,
					serie,
					fecha,
					importeTotal,
				});

				return {
					// rucCliente: rucCliente.split(':')[1].trim(),
					rucCliente: '',
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
				console.log(error);
				return {
					fileName: element.fileName,
					rucCliente: '',
					ruc: '',
					serie: '',
					fecha: '',
					importeTotal: '',
				};
			}
		});

		return customResponse('pdf', dataDepurada);
	}

	@Post('convertPDFBase64')
	@ApiOperation({ summary: 'convert PDF to Text' })
	async pdfToTextBase64(@Body() body: PdfBase64Dto) {
		const pathArchivo = __dirname + '/temp/' + Date.now() + '.pdf';
		const base64Data = body.archivoBase64.replace(/^data:application\/pdf;base64,/, '');

		fs.writeFileSync(pathArchivo, base64Data, 'base64');

		const maxIntentos = 3;
		let intentos = 0;

		try {
			const response = await readPdfText(pathArchivo, false, (fn, reason) => {
				const pass = body.pass ? body.pass : '123456789';

				if (intentos >= maxIntentos) {
					throw new Error('Maximo de intentos alcanzado');
				}

				intentos++;

				fn(pass);
				return '';
			});

			fs.unlinkSync(pathArchivo);
			return response;
		} catch (error) {
			throw new BadRequestException('Contraseña incorrecta');
		}
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
		let dd;
		try {
			dd = {
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
			dd = error.message;
		}

		return customResponse('pdf', {
			response,
			dd,
		});
	}
}
