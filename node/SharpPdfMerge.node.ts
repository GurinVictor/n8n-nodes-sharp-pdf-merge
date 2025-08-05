import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
} from 'n8n-workflow';

import * as sharp from 'sharp';
import { execSync } from 'child_process';
import * as fs from 'fs';

export class SharpPdfMerge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Sharp PDF Merge',
		name: 'sharpPdfMerge',
		group: ['transform'],
		version: 1,
		description: 'Convert first page of PDF to PNG and overlay image on top',
		defaults: {
			name: 'Sharp PDF Merge',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'PDF File',
				name: 'pdfPropertyName',
				type: 'string',
				default: 'pdf',
				description: 'Name of the input PDF binary property',
			},
			{
				displayName: 'Overlay Image',
				name: 'overlayPropertyName',
				type: 'string',
				default: 'overlay',
				description: 'Name of the input PNG binary property',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < this.getInputData().length; i++) {
			const item = this.getInputData(i)[0];

			const pdfProp = this.getNodeParameter('pdfPropertyName', i) as string;
			const overlayProp = this.getNodeParameter('overlayPropertyName', i) as string;

			if (!item.binary?.[pdfProp] || !item.binary?.[overlayProp]) {
				throw new Error('Missing binary data');
			}

			const pdfBuffer = Buffer.from(item.binary[pdfProp].data, 'base64');
			const overlayBuffer = Buffer.from(item.binary[overlayProp].data, 'base64');

			// Временные пути
			const tmpPdf = '/tmp/input.pdf';
			const tmpOverlay = '/tmp/overlay.png';
			const tmpPng = '/tmp/converted.png';

			fs.writeFileSync(tmpPdf, pdfBuffer);
			fs.writeFileSync(tmpOverlay, overlayBuffer);

			// Конвертация PDF → PNG (одна страница, прозрачный фон)
			execSync(`pdftoppm -png -r 300 -singlefile -transparent ${tmpPdf} /tmp/converted`);

			// Объединение через sharp
			const resultBuffer = await sharp(tmpPng)
				.composite([{ input: tmpOverlay, top: 0, left: 0 }])
				.png()
				.toBuffer();

			returnData.push({
				json: {},
				binary: {
					data: await this.helpers.prepareBinaryData(resultBuffer, 'merged.png', 'image/png'),
				},
			});
		}

		return [returnData];
	}
}
