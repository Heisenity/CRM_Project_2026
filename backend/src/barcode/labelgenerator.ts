import * as bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';
import * as fs from 'fs-extra';
import * as path from 'path';
import { prisma } from '../lib/prisma';

interface LabelRenderItem {
  png: Buffer;
  barcodeString: string;
  sku: string;
  productName: string;
  boxQty: number;
}

const OUTPUT_DIR = path.join(process.cwd(), 'output');

function zeroPad(num: number, width = 6) {
  return String(num).padStart(width, '0');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function renderBarcodePng(text: string): Promise<Buffer> {
  try {
    const buffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text,
      scale: 3,
      height: 10,
      includetext: false,
      textxalign: 'center',
      parsefnc: true
    });
    return buffer;
  } catch (error) {
    try {
      const fallbackBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text,
        scale: 2,
        height: 8
      });
      return fallbackBuffer;
    } catch (fallbackError) {
      console.error('Barcode generation failed:', { text, error, fallbackError });
      throw fallbackError;
    }
  }
}

async function createPdfFromLabels(labels: LabelRenderItem[], fileName: string): Promise<string> {
  await fs.ensureDir(OUTPUT_DIR);
  const pdfPath = path.join(OUTPUT_DIR, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  const columns = 3;
  const gutter = 12;
  const labelHeight = 110;
  const pageWidth = doc.page.width - 72;
  const colWidth = (pageWidth - (columns - 1) * gutter) / columns;

  let x = 36;
  let y = 36;

  for (let i = 0; i < labels.length; i++) {
    const l = labels[i];

    doc.image(l.png, x + 6, y + 6, {
      fit: [colWidth - 12, 48]
    });

    const textY = y + 60;
    doc.fontSize(9).text(`SKU: ${l.sku}`, x + 6, textY);
    doc.text(`Product: ${l.productName}`);
    doc.text(`Box Qty: ${l.boxQty}`);
    doc.fontSize(10).text(`Serial: ${l.barcodeString}`);

    if ((i + 1) % columns === 0) {
      x = 36;
      y += labelHeight;

      if (y + labelHeight > doc.page.height - 36) {
        doc.addPage();
        y = 36;
      }
    } else {
      x += colWidth + gutter;
    }
  }

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    doc.on('error', reject);
  });

  const stat = await fs.stat(pdfPath);
  if (stat.size === 0) {
    throw new Error('Generated PDF is empty');
  }

  return pdfPath;
}

export async function generateLabelsForProduct(params: {
  productId: string;
  count: number;
  prefix?: string;
}) {
  const { productId, count, prefix = 'BX' } = params;
  const normalizedPrefix = String(prefix || 'BX').trim().toUpperCase();
  if (!/^[A-Z]{2,4}$/.test(normalizedPrefix)) {
    throw new Error('Invalid prefix format. Use 2-4 uppercase letters.');
  }

  const product = await prisma.product.findUnique({
    where: { id: BigInt(productId) }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const txResult = await prisma.$transaction(async (tx) => {
    const recent = await tx.barcode.findMany({
      where: { barcodeValue: { startsWith: normalizedPrefix } },
      select: { barcodeValue: true },
      orderBy: { id: 'desc' },
      take: 500
    });

    const serialRegex = new RegExp(`^${escapeRegExp(normalizedPrefix)}(\\d+)$`);
    let lastIndex = 0;
    for (const row of recent) {
      const match = row.barcodeValue.match(serialRegex);
      if (!match) continue;
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n) && n > lastIndex) {
        lastIndex = n;
      }
    }

    const created: any[] = [];
    const serials: string[] = [];

    for (let i = 0; i < count; i++) {
      lastIndex += 1;
      const serial = `${normalizedPrefix}${zeroPad(lastIndex)}`;

      const barcode = await tx.barcode.create({
        data: {
          barcodeValue: serial,
          serialNumber: serial,
          productId: product.id,
          unitsPerBox: product.unitsPerBox
        }
      });

      created.push(barcode);
      serials.push(serial);
    }

    return { created, serials };
  });

  try {
    const labels: LabelRenderItem[] = [];
    for (const serial of txResult.serials) {
      const png = await renderBarcodePng(serial);
      labels.push({
        png,
        barcodeString: serial,
        sku: product.sku,
        productName: product.productName,
        boxQty: product.boxQty
      });
    }

    const pdfName = `labels_${product.id}_${Date.now()}.pdf`;
    const pdfPath = await createPdfFromLabels(labels, pdfName);

    return {
      pdfPath,
      createdCount: txResult.created.length,
      barcodes: txResult.created
    };
  } catch (error) {
    try {
      const createdIds = txResult.created.map((b) => b.id);
      if (createdIds.length > 0) {
        await prisma.barcode.deleteMany({
          where: { id: { in: createdIds } }
        });
      }
    } catch (cleanupError) {
      console.error('Failed to cleanup barcodes after label generation failure:', cleanupError);
    }
    throw error;
  }
}
