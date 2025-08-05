import {
  IExecuteSingleFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

import fs from 'fs';
import sharp from 'sharp';
import { execSync } from 'child_process';

export class SharpPdfMerge implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sharp PDF Merge',
    name: 'sharpPdfMerge',
    group: ['transform'],
    version: 1,
    description: 'Merge PDF and PNG using sharp',
    defaults: {
      name: 'Sharp PDF Merge',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [],
  };

  async execute(this: IExecuteSingleFunctions): Promise<INodeExecutionData[]> {
    const pdfBinary = this.getInputData(0).binary?.['pdf'];
    const overlayBinary = this.getInputData(0).binary?.['overlay'];

    if (!pdfBinary || !overlayBinary) {
      throw new Error('Missing binary data for PDF or overlay image');
    }

    const pdfBuffer = Buffer.from(pdfBinary.data, 'base64');
    const overlayBuffer = Buffer.from(overlayBinary.data, 'base64');

    const tmpPdfPath = '/tmp/input.pdf';
    const tmpPngPath = '/tmp/output.png';
    const tmpOverlayPath = '/tmp/overlay.png';

    fs.writeFileSync(tmpPdfPath, pdfBuffer);
    fs.writeFileSync(tmpOverlayPath, overlayBuffer);

    execSync(`pdftoppm -png -r 300 -singlefile -transparent ${tmpPdfPath} /tmp/output`);

    const finalImageBuffer = await sharp(tmpPngPath)
      .composite([{ input: tmpOverlayPath, top: 0, left: 0 }])
      .png()
      .toBuffer();

    return [
      {
        binary: {
          data: {
            data: finalImageBuffer.toString('base64'),
            mimeType: 'image/png',
            fileName: 'combined.png',
          },
        },
      },
    ];
  }
}
