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

    let finalSku = sku;
    
    // Generate unique SKU if not provided
    if (!finalSku) {
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        // Use a more unique timestamp-based approach
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substr(2, 8).toUpperCase();
        finalSku = `PRD-${timestamp}-${randomSuffix}`;
        
        // Check if this SKU already exists
        const existingProduct = await prisma.product.findUnique({
          where: { sku: finalSku }
        });
        
        if (!existingProduct) {
          break; // SKU is unique, we can use it
        }
        
        attempts++;
        // Add a small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({
          error: 'Failed to generate unique SKU after multiple attempts'
        });
      }
    } else {
      // Check if provided SKU already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: finalSku }
      });

      if (existingProduct) {
        return res.status(409).json({
          error: 'Product with this SKU already exists',
          message: `SKU "${finalSku}" is already in use`
        });
      }
    }

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

    // Convert BigInt to string for JSON serialization
    const serializedProduct = {
      id: product.id.toString(),
      sku: product.sku,
      productName: product.productName,
      description: product.description,
      boxQty: product.boxQty,
      totalUnits: product.totalUnits,
      reorderThreshold: product.reorderThreshold,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    return res.status(201).json({
      success: true,
      data: serializedProduct,
      message: 'Product created successfully'
    });

  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Product with this SKU already exists',
        message: 'Please try again or provide a different SKU'
      });
    }

    return res.status(500).json({
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

    // Convert BigInt to string for JSON serialization
    const serializedProducts = products.map(product => ({
      id: product.id.toString(),
      sku: product.sku,
      productName: product.productName,
      description: product.description,
      boxQty: product.boxQty,
      totalUnits: product.totalUnits,
      reorderThreshold: product.reorderThreshold,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    return res.json({
      success: true,
      data: serializedProducts
    });

  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: BigInt(id)
      },
      include: {
        barcodes: true,
        transactions: {
          orderBy: {
            id: 'desc'
          },
          take: 10
        },
        allocations: {
          orderBy: {
            id: 'desc'
          },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Convert BigInt to string for JSON serialization
    const serializedProduct = {
      id: product.id.toString(),
      sku: product.sku,
      productName: product.productName,
      description: product.description,
      boxQty: product.boxQty,
      totalUnits: product.totalUnits,
      reorderThreshold: product.reorderThreshold,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      barcodes: product.barcodes.map((barcode: any) => ({
        id: barcode.id.toString(),
        barcodeValue: barcode.barcodeValue,
        serialNumber: barcode.serialNumber,
        productId: barcode.productId.toString(),
        createdAt: barcode.createdAt,
        updatedAt: barcode.updatedAt
      })),
      transactions: product.transactions.map((transaction: any) => ({
        id: transaction.id.toString(),
        productId: transaction.productId.toString(),
        type: transaction.type,
        quantity: transaction.quantity,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      })),
      allocations: product.allocations.map((allocation: any) => ({
        id: allocation.id.toString(),
        productId: allocation.productId.toString(),
        employeeId: allocation.employeeId,
        quantity: allocation.quantity,
        createdAt: allocation.createdAt,
        updatedAt: allocation.updatedAt
      }))
    };

    return res.json({
      success: true,
      data: serializedProduct
    });

  } catch (error: any) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      error: 'Failed to fetch product',
      message: error.message
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sku, productName, description, boxQty, totalUnits, reorderThreshold } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Update the product
    const product = await prisma.product.update({
      where: {
        id: BigInt(id)
      },
      data: {
        ...(sku && { sku }),
        ...(productName && { productName }),
        ...(description !== undefined && { description }),
        ...(boxQty !== undefined && { boxQty: parseInt(boxQty) }),
        ...(totalUnits !== undefined && { totalUnits: parseInt(totalUnits) }),
        ...(reorderThreshold !== undefined && { reorderThreshold: parseInt(reorderThreshold) })
      }
    });

    // Convert BigInt to string for JSON serialization
    const serializedProduct = {
      id: product.id.toString(),
      sku: product.sku,
      productName: product.productName,
      description: product.description,
      boxQty: product.boxQty,
      totalUnits: product.totalUnits,
      reorderThreshold: product.reorderThreshold,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    return res.json({
      success: true,
      data: serializedProduct,
      message: 'Product updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating product:', error);
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Product with this SKU already exists',
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to update product',
      message: error.message
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    // Soft delete by setting isActive to false
    const product = await prisma.product.update({
      where: {
        id: BigInt(id)
      },
      data: {
        isActive: false
      }
    });

    return res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      error: 'Failed to delete product',
      message: error.message
    });
  }
};

export const getBarcodeHistory = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Get barcode generation history for the product
    const [barcodes, total] = await Promise.all([
      prisma.barcode.findMany({
        where: {
          productId: BigInt(productId)
        },
        include: {
          product: {
            select: {
              productName: true,
              sku: true
            }
          },
          transactions: {
            include: {
              employee: {
                select: {
                  name: true,
                  employeeId: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: Number(limit)
      }),
      prisma.barcode.count({
        where: {
          productId: BigInt(productId)
        }
      })
    ]);

    // Convert BigInt to string for JSON serialization
    const serializedBarcodes = barcodes.map(barcode => ({
      id: barcode.id.toString(),
      barcodeValue: barcode.barcodeValue,
      serialNumber: barcode.serialNumber,
      boxQty: barcode.boxQty,
      status: barcode.status,
      createdAt: barcode.createdAt,
      product: barcode.product,
      lastTransaction: barcode.transactions.length > 0 ? {
        type: barcode.transactions[0].transactionType,
        createdAt: barcode.transactions[0].createdAt,
        employee: barcode.transactions[0].employee
      } : null
    }));

    return res.json({
      success: true,
      data: {
        barcodes: serializedBarcodes,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching barcode history:', error);
    return res.status(500).json({
      error: 'Failed to fetch barcode history',
      message: error.message
    });
  }
};

export const getBarcodePrefixes = async (req: Request, res: Response) => {
  try {
    // Get saved barcode prefixes from system configuration
    const config = await prisma.systemConfiguration.findUnique({
      where: { key: 'barcode_prefixes' }
    });

    const defaultPrefixes = ['BX', 'PKG', 'ITM', 'PRD', 'BOX'];
    let customPrefixes: string[] = [];

    if (config && config.value) {
      try {
        customPrefixes = JSON.parse(config.value);
      } catch (error) {
        console.error('Error parsing barcode prefixes:', error);
      }
    }

    return res.json({
      success: true,
      data: {
        defaultPrefixes,
        customPrefixes,
        allPrefixes: [...defaultPrefixes, ...customPrefixes]
      }
    });

  } catch (error: any) {
    console.error('Error fetching barcode prefixes:', error);
    return res.status(500).json({
      error: 'Failed to fetch barcode prefixes',
      message: error.message
    });
  }
};

export const addBarcodePrefix = async (req: Request, res: Response) => {
  try {
    const { prefix } = req.body;

    if (!prefix || typeof prefix !== 'string') {
      return res.status(400).json({
        error: 'Prefix is required and must be a string'
      });
    }

    const normalizedPrefix = prefix.trim().toUpperCase();

    // Validate prefix format
    if (!/^[A-Z]{2,4}$/.test(normalizedPrefix)) {
      return res.status(400).json({
        error: 'Prefix must be 2-4 uppercase letters only'
      });
    }

    // Check if prefix already exists in defaults
    const defaultPrefixes = ['BX', 'PKG', 'ITM', 'PRD', 'BOX'];
    if (defaultPrefixes.includes(normalizedPrefix)) {
      return res.status(400).json({
        error: 'This prefix already exists as a default prefix'
      });
    }

    // Get existing custom prefixes
    const config = await prisma.systemConfiguration.findUnique({
      where: { key: 'barcode_prefixes' }
    });

    let customPrefixes: string[] = [];
    if (config && config.value) {
      try {
        customPrefixes = JSON.parse(config.value);
      } catch (error) {
        console.error('Error parsing existing prefixes:', error);
      }
    }

    // Check if prefix already exists in custom prefixes
    if (customPrefixes.includes(normalizedPrefix)) {
      return res.status(400).json({
        error: 'This prefix already exists'
      });
    }

    // Add new prefix
    customPrefixes.push(normalizedPrefix);

    // Save to database
    await prisma.systemConfiguration.upsert({
      where: { key: 'barcode_prefixes' },
      update: { value: JSON.stringify(customPrefixes) },
      create: {
        key: 'barcode_prefixes',
        value: JSON.stringify(customPrefixes)
      }
    });

    return res.json({
      success: true,
      message: `Barcode prefix "${normalizedPrefix}" added successfully`,
      data: {
        prefix: normalizedPrefix,
        customPrefixes
      }
    });

  } catch (error: any) {
    console.error('Error adding barcode prefix:', error);
    return res.status(500).json({
      error: 'Failed to add barcode prefix',
      message: error.message
    });
  }
};

export const generateLabels = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { count, prefix } = req.body;

    if (!productId || !count) {
      return res.status(400).json({
        error: 'Missing required fields: productId and count'
      });
    }

    // Validate count
    const labelCount = parseInt(count);
    if (isNaN(labelCount) || labelCount < 1 || labelCount > 100) {
      return res.status(400).json({
        error: 'Count must be a number between 1 and 100'
      });
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const result = await generateLabelsForProduct({
      productId,
      count: labelCount,
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
      // Clean up the file after sending (optional)
      setTimeout(() => {
        fs.unlink(pdfPath).catch(console.error);
      }, 5000); // Delete after 5 seconds
    });

    fileStream.on('error', (error) => {
      console.error('Error streaming PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to stream PDF file',
          message: error.message
        });
      }
    });

  } catch (error: any) {
    console.error('Error generating labels:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to generate labels',
        message: error.message
      });
    }
  }
};