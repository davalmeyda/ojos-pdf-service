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
import { ArchivoPDFDto, Base64FacturaDto, OCRDto, PdfBase64Dto } from '../dtos/ocr.dto';
import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import AdmZip from 'adm-zip';

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

				// const rucCliente = data.find((line: string) => line.startsWith(': '));
				const ruc = data.find((line: string) => line.includes('RUC:'));
				const serie = data.find((line: string) => line.includes('E001-'));
				// buscar cualquiera con esta coincidencia exacta dd/mm/yyyy usando regex
				const fecha = data.find((line: string) => /\d{2}\/\d{2}\/\d{4}/.test(line));
				const importeTotal = data.find((line: string) => line.includes('Importe Total :'));

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

	@Post('convertPDFDEV')
	@ApiOperation({ summary: 'convert PDF DEV to Text' })
	async pdfToTextDev(@Body() body: OCRDto) {
		if (body.ruta.includes('public')) {
			body.ruta = body.ruta.split('public/')[1];
		}

		const url = "http://dev.manoturqueza.com" + '/' + body.ruta;

		const promises = [];
		body.files.forEach(element => {
			const fileUrl = url + '/' + element;
			promises.push({ fileName: element, promise: readPdfText(fileUrl) });
		});

		const response = await Promise.all(promises.map(p => p.promise));

		const dataDepurada = promises.map((element, index) => {
			try {
				const data = response[index][0]['lines'];

				// const rucCliente = data.find((line: string) => line.startsWith(': '));
				const ruc = data.find((line: string) => line.includes('RUC:'));
				const serie = data.find((line: string) => line.includes('E001-'));
				// buscar cualquiera con esta coincidencia exacta dd/mm/yyyy usando regex
				const fecha = data.find((line: string) => /\d{2}\/\d{2}\/\d{4}/.test(line));
				const importeTotal = data.find((line: string) => line.includes('Importe Total :'));

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

	@Post('base64Factura')
	@ApiOperation({ summary: 'convert PDF to Text' })
	async base64Factura(@Body() body: Base64FacturaDto) {
		const tiempo = Date.now();
		const pathArchivo = __dirname + '/temp/' + tiempo + '.zip';
		const pathDescomprimir = __dirname + '/temp/' + tiempo + '/';
		const base64Data = body.archivoBase64.replace(/^data:application\/zip;base64,/, '');

		fs.writeFileSync(pathArchivo, base64Data, 'base64');

		const zip = new AdmZip(pathArchivo);

		zip.extractAllTo(pathDescomprimir, true);

		const files = fs.readdirSync(pathDescomprimir);

		const promises = [];

		files.forEach(element => {
			const fileUrl = pathDescomprimir + element;
			promises.push({ fileName: element, promise: readPdfText(fileUrl) });
		});

		const response = await Promise.all(promises.map(p => p.promise));

		const dataDepurada = promises.map((element, index) => {
			try {
				const data = response[index][0]['lines'];

				// const rucCliente = data.find((line: string) => line.startsWith(': '));
				const ruc = data.find((line: string) => line.includes('RUC:'));
				const serie = data.find((line: string) => line.includes('E001-'));
				// buscar cualquiera con esta coincidencia exacta dd/mm/yyyy usando regex
				const fecha = data.find((line: string) => /\d{2}\/\d{2}\/\d{4}/.test(line));
				const importeTotal = data.find((line: string) => line.includes('Importe Total :'));

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

		fs.unlinkSync(pathArchivo);
		setTimeout(() => {
			fs.rmSync(pathDescomprimir, { recursive: true, force: true });
		}, 1000);

		return customResponse('pdf', dataDepurada);
	}

	@Post('convertPDFBase64')
	@ApiOperation({ summary: 'convert PDF to Text' })
	async pdfToTextBase64(@Body() body: PdfBase64Dto) {
		const pathArchivo = __dirname + '/temp/' + Date.now() + '.pdf';
		const base64Data = body.archivoBase64.replace(/^data:application\/pdf;base64,/, '');

		fs.writeFileSync(pathArchivo, base64Data, 'base64');

		try {
			const response = await readPdfText(pathArchivo);

			fs.unlinkSync(pathArchivo);
			return response;
		} catch (error) {
			throw new BadRequestException('Contraseña incorrecta');
		}
	}

	@Post('convertPDFBase64BCP')
	@ApiOperation({ summary: 'convert PDF to Text' })
	async pdfToTextBase64BCP(@Body() body: PdfBase64Dto) {
		const pathArchivo = __dirname + '/temp/' + Date.now() + '.pdf';
		const base64Data = body.archivoBase64.replace(/^data:application\/pdf;base64,/, '');

		fs.writeFileSync(pathArchivo, base64Data, 'base64');

		const fileOut = __dirname + '/temp/results-' + Date.now() + '.pdf';
		await this.cropPdf(pathArchivo, fileOut, {
			x: 0,
			y: 0,
			width: 450,
			height: 800,
		});
		try {
			const regex = /\d{1,3}(,\d{3})*\.\d{2}/;

			const salidas = await readPdfText(fileOut);

			const respSalida = [];
			salidas.forEach(element => {
				const linesWithCurrency = element.lines.filter(line => regex.test(line));
				respSalida.push(...linesWithCurrency);
			});

			const total = await readPdfText(pathArchivo);
			const respTotal = [];
			total.forEach(element => {
				const linesWithCurrency = element.lines.filter(line => regex.test(line));
				respTotal.push(...linesWithCurrency);
			});

			fs.unlinkSync(pathArchivo);
			fs.unlinkSync(fileOut);

			// al array total le quito los elementos que estan en el array salida
			const respTotalFiltrado = respTotal.filter(element => !respSalida.includes(element));

			return {
				salidas: respSalida.filter(element => {
					const spaceCount = (element.match(/ /g) || []).length;
					return spaceCount >= 3;
				}),
				ingresos: respTotalFiltrado.filter(element => {
					const spaceCount = (element.match(/ /g) || []).length;
					return spaceCount >= 3;
				}),
				total: respTotal.filter(element => {
					const spaceCount = (element.match(/ /g) || []).length;
					return spaceCount >= 3;
				}),
			};
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

	@Post('test2')
	@ApiOperation({ summary: 'Subir un archivo pdf para testear el resultado' })
	@ApiConsumes('multipart/form-data')
	@UseInterceptors(FileInterceptor('archivo', { dest: __dirname + '/temp' }))
	@ApiBody({ type: ArchivoPDFDto })
	async pdfTest2(@UploadedFile() archivo: Express.Multer.File) {
		const pathArchivo = archivo.path;

		const fileOut = __dirname + '/temp/results-' + Date.now() + '.pdf';
		await this.cropPdf(pathArchivo, fileOut, {
			x: 0,
			y: 0,
			width: 450,
			height: 800,
		});

		const salidas = await readPdfText(fileOut);
		const regex = /\d{1,3}(,\d{3})*\.\d{2}/;

		const respSalida = [];
		salidas.forEach(element => {
			const linesWithCurrency = element.lines.filter(line => regex.test(line));
			respSalida.push(...linesWithCurrency);
		});

		const total = await readPdfText(pathArchivo);
		const respTotal = [];
		total.forEach(element => {
			const linesWithCurrency = element.lines.filter(line => regex.test(line));
			respTotal.push(...linesWithCurrency);
		});

		// al array total le quito los elementos que estan en el array salida
		const respTotalFiltrado = respTotal.filter(element => !respSalida.includes(element));

		return {
			salidas: respSalida.filter(element => {
				const spaceCount = (element.match(/ /g) || []).length;
				return spaceCount >= 3;
			}),
			ingresos: respTotalFiltrado.filter(element => {
				const spaceCount = (element.match(/ /g) || []).length;
				return spaceCount >= 3;
			}),
			total: respTotal.filter(element => {
				const spaceCount = (element.match(/ /g) || []).length;
				return spaceCount >= 3;
			}),
		};
	}

	async cropPdf(inputFilePath, outputFilePath, cropRect) {
		// Load your PDFDocument
		const existingPdfBytes = fs.readFileSync(inputFilePath);
		const pdfDoc = await PDFDocument.load(existingPdfBytes);

		// Define the crop rectangle
		const { x, y, width, height } = cropRect;

		// Get the pages of the document
		const pages = pdfDoc.getPages();
		pages.forEach(page => {
			const { width: pageWidth, height: pageHeight } = page.getSize();
			// Define the position y from the bottom of the page
			const yPosition = pageHeight - (y + height);

			page.setCropBox(
				x, // x-coordinate of the bottom-left corner of the cropping area
				yPosition, // y-coordinate of the bottom-left corner of the cropping area
				width, // width of the cropping area
				height, // height of the cropping area
			);
		});

		// Serialize the PDFDocument to bytes (a Uint8Array)
		const pdfBytes = await pdfDoc.save();
		fs.writeFileSync(outputFilePath, pdfBytes);
	}

	funcPass(fn, reason, body) {
		const maxIntentos = 3;
		let intentos = 0;

		const pass = body.pass ? body.pass : '123456789';

		if (intentos >= maxIntentos) {
			throw new Error('Maximo de intentos alcanzado');
		}

		intentos++;

		fn(pass);
		return '';
	}
}
