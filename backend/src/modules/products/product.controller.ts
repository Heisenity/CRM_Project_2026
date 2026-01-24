import { Request, Response } from 'express';
import { generateLabelsForProduct } from '../../barcode/labelgenerator';
import { prisma } from '../../lib/prisma';
import * as path from 'path';
import * as fs from 'fs-extra';

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { sku, productName, description, boxQty, totalUnits, reorderThreshold } = req.body;

    // Validate required fields
    if (!productName || boxQty === undefined || totalUnits === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: productName, boxQty, totalUnits'
      });
    }

    // Generate SKU if not provided
    const finalSku = sku || `PRD-${Date.now()}`;

    // Create the product
    const product = await prisma.product.create({
      data: {
        sku: finalSku,
        productName,
        description: description || null,
        boxQty: parseInt(boxQty),
        totalUnits: parseInt(totalUnits),
        reorderThreshold: reorderThreshold ? parseInt(reorderThreshold) : 0,
      }
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Product with this SKU already exists',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to create product',
      message: error.message
    });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: products
    });

  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    });
  }
};

export const generateLabels = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { sku, name, boxQty, count, prefix } = req.body;

    if (!productId || !count) {
      return res.status(400).json({
        error: 'Missing required fields: productId and count'
      });
    }

    const result = await generateLabelsForProduct({
      productId,
      count: parseInt(count),
      prefix: prefix || 'BX'
    });

    // Return the PDF file
    const pdfPath = result.pdfPath;
    const fileName = path.basename(pdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      // Optionally delete the file after sending
      // fs.unlink(pdfPath).catch(console.error);
    });

  } catch (error: any) {
    console.error('Error generating labels:', error);
    res.status(500).json({
      error: 'Failed to generate labels',
      message: error.message
    });
  }
};