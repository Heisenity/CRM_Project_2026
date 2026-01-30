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

async function renderBarcodePng(text: string): Promise<Buffer> {
  console.log('🏷️  Generating barcode for text:', text);
  console.log('🏷️  Text length:', text.length);
  console.log('🏷️  Text type:', typeof text);

  try {
    // Try with different Code128 options to ensure proper encoding
    const buffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: text,
      scale: 3,
      height: 10,
      includetext: false,
      textxalign: 'center',
      // Force Code128 Auto mode for better compatibility
      parsefnc: true
    });

    console.log('✅ Barcode generated successfully for:', text);
    return buffer;
  } catch (error) {
    console.error('❌ Barcode generation failed for:', text, error);

    // Fallback: try with simpler options
    try {
      console.log('🔄 Trying fallback barcode generation...');
      const fallbackBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: text,
        scale: 2,
        height: 8
      });
      console.log('✅ Fallback barcode generated for:', text);
      return fallbackBuffer;
    } catch (fallbackError) {
      console.error('❌ Fallback barcode generation also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

async function createPdfFromLabels(
  labels: LabelRenderItem[],
  fileName: string
): Promise<string> {
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

    let textY = y + 60;
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

  // END PDF
  doc.end();

  // 🔒 CRITICAL FIX: wait until file is FULLY written
  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    doc.on('error', reject);
  });

  // Optional safety check
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

  const product = await prisma.product.findUnique({
    where: { id: BigInt(productId) }
  });
  if (!product) throw new Error('Product not found');

  return prisma.$transaction(async (tx) => {
    // 🔒 find last serial safely
    const last = await tx.barcode.findFirst({
      where: { barcodeValue: { startsWith: prefix } },
      orderBy: { barcodeValue: 'desc' }
    });

    let lastIndex = last
      ? parseInt(last.barcodeValue.replace(prefix, ''), 10)
      : 0;

    const created: any[] = [];
    const labels: LabelRenderItem[] = [];

    for (let i = 0; i < count; i++) {
      lastIndex++;
      const serial = `${prefix}${zeroPad(lastIndex)}`;

      console.log('🔢 Generated serial:', serial);
      console.log('🔢 Prefix:', prefix);
      console.log('🔢 LastIndex:', lastIndex);
      console.log('🔢 ZeroPad result:', zeroPad(lastIndex));

      const barcode = await tx.barcode.create({
        data: {
          barcodeValue: serial,
          serialNumber: serial, // Using same value for both fields
          productId: product.id,
          unitsPerBox: product.unitsPerBox
        }
      });

      const png = await renderBarcodePng(serial);

      created.push(barcode);
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
      createdCount: created.length,
      barcodes: created
    };
  });
}
