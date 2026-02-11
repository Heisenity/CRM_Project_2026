import { Request, Response } from 'express'
import { prisma } from '../../../lib/prisma'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { uploadPayslipToS3 } from '../../../services/s3.service'
import { payslipIdGeneratorService } from '../../../services/payslipIdGenerator.service'

export const getPayrollRecords = async (req: Request, res: Response) => {
  try {
    const records = await prisma.payrollRecord.findMany({
      include: {
        employee: {
          select: {
            name: true,
            employeeId: true,
            email: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    res.json({
      success: true,
      data: records
    })
  } catch (error) {
    console.error('Error fetching payroll records:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll records'
    })
  }
}

export const updatePayrollRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      basicSalary,
      allowances,
      deductions,
      overtime,
      netSalary,
      payslipDetails
    } = req.body

    console.log('=== PAYROLL UPDATE START ===')
    console.log('Payroll ID:', id)

    // Check if payroll record exists
    const existingRecord = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            team: true
          }
        }
      }
    })

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      })
    }

    // Update payroll record
    const updatedRecord = await prisma.payrollRecord.update({
      where: { id },
      data: {
        basicSalary: parseFloat(basicSalary.toString()),
        allowances: parseFloat(allowances.toString()),
        deductions: parseFloat(deductions.toString()),
        overtime: parseFloat(overtime.toString()) || 0,
        netSalary: parseFloat(netSalary.toString()),
        updatedAt: new Date(),
        // Update detailed breakdown if provided
        ...(payslipDetails && {
          daysPaid: payslipDetails.daysPaid || 30,
          uanNumber: payslipDetails.uanNumber || existingRecord.employee.uanNumber || '',
          esiNumber: payslipDetails.esiNumber || existingRecord.employee.esiNumber || '',
          bankAccountNumber: payslipDetails.bankAccountNumber || existingRecord.employee.bankAccountNumber || '',
          houseRentAllowance: parseFloat(payslipDetails.houseRentAllowance?.toString() || '0'),
          skillAllowance: parseFloat(payslipDetails.skillAllowance?.toString() || '0'),
          conveyanceAllowance: parseFloat(payslipDetails.conveyanceAllowance?.toString() || '0'),
          medicalAllowance: parseFloat(payslipDetails.medicalAllowance?.toString() || '0'),
          professionalTax: parseFloat(payslipDetails.professionalTax?.toString() || '0'),
          providentFund: parseFloat(payslipDetails.providentFund?.toString() || '0'),
          esi: parseFloat(payslipDetails.esi?.toString() || '0'),
          incomeTax: parseFloat(payslipDetails.incomeTax?.toString() || '0'),
          personalLoan: parseFloat(payslipDetails.personalLoan?.toString() || '0'),
          otherAdvance: parseFloat(payslipDetails.otherAdvance?.toString() || '0'),
          medicalExp: parseFloat(payslipDetails.medicalExp?.toString() || '0'),
          lta: parseFloat(payslipDetails.lta?.toString() || '0'),
          repairMaintenance: parseFloat(payslipDetails.repairMaintenance?.toString() || '0'),
          fuelExp: parseFloat(payslipDetails.fuelExp?.toString() || '0')
        })
      },
      include: {
        employee: {
          select: {
            name: true,
            employeeId: true
          }
        }
      }
    })

    // If payslipDetails are provided, regenerate the PDF
    if (payslipDetails) {
      console.log('Regenerating PDF with updated details...')
      const enhancedPayslipDetails = {
        ...payslipDetails,
        daysPaid: payslipDetails.daysPaid || 30,
        uanNumber: payslipDetails.uanNumber || existingRecord.employee.uanNumber || 'N/A',
        esiNumber: payslipDetails.esiNumber || existingRecord.employee.esiNumber || 'N/A',
        bankAccountNumber: payslipDetails.bankAccountNumber || existingRecord.employee.bankAccountNumber || 'N/A'
      }
      
      const pdfBuffer = await generatePayslipPDF(existingRecord.employee, updatedRecord, enhancedPayslipDetails)
      
      // Upload updated PDF to S3
      const fileName = `${existingRecord.employee.employeeId}_payslip_${updatedRecord.month}_${updatedRecord.year}.pdf`
      const s3Key = await uploadPayslipToS3(pdfBuffer, fileName, existingRecord.employee.employeeId)
      
      // Update the existing document record with new S3 key
      const existingDocument = await prisma.employeeDocument.findFirst({
        where: {
          employeeId: existingRecord.employeeId,
          fileName: fileName
        }
      })
      
      if (existingDocument) {
        await prisma.employeeDocument.update({
          where: { id: existingDocument.id },
          data: {
            filePath: s3Key, // Update with new S3 key
            fileSize: pdfBuffer.length,
            updatedAt: new Date()
          }
        })
      }
      
      console.log('PDF updated and uploaded to S3:', s3Key)
    }

    console.log('=== PAYROLL UPDATE SUCCESS ===')

    res.json({
      success: true,
      message: 'Payroll record updated successfully',
      data: updatedRecord
    })

  } catch (error) {
    console.error('=== PAYROLL UPDATE ERROR ===')
    console.error('Error updating payroll record:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update payroll record'
    })
  }
}

export const sendPayslip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    console.log('=== SEND PAYSLIP START ===')
    console.log('Payroll ID:', id)

    // Get payroll record with employee details
    const payrollRecord = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            name: true,
            employeeId: true,
            email: true
          }
        }
      }
    })

    if (!payrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      })
    }

    // Update status to PAID (indicating it has been sent)
    await prisma.payrollRecord.update({
      where: { id },
      data: {
        status: 'PAID',
        updatedAt: new Date()
      }
    })

    console.log(`Payslip sent to ${payrollRecord.employee.email}`)
    console.log('=== SEND PAYSLIP SUCCESS ===')

    res.json({
      success: true,
      message: `Payslip sent successfully to ${payrollRecord.employee.name}`,
      data: {
        employeeName: payrollRecord.employee.name,
        employeeEmail: payrollRecord.employee.email
      }
    })

  } catch (error) {
    console.error('=== SEND PAYSLIP ERROR ===')
    console.error('Error sending payslip:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send payslip'
    })
  }
}

export const generatePayslip = async (req: Request, res: Response) => {
  try {
    console.log('=== PAYSLIP GENERATION START ===')
    
    const {
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      overtime,
      netSalary,
      processedBy,
      payslipDetails
    } = req.body

    // Check if payroll record already exists
    const existingRecord = await prisma.payrollRecord.findUnique({
      where: {
        employeeId_month_year: {
          employeeId,
          month,
          year
        }
      }
    })

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Payroll record already exists for this employee and month'
      })
    }

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        team: true
      }
    })

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      })
    }

    // Generate payslip ID
    const payslipId = await payslipIdGeneratorService.generatePayslipId()

    // Create payroll record
    const payrollRecord = await prisma.payrollRecord.create({
      data: {
        payslipId,
        employeeId,
        month,
        year,
        basicSalary: parseFloat(basicSalary.toString()),
        allowances: parseFloat(allowances.toString()),
        deductions: parseFloat(deductions.toString()),
        overtime: parseFloat(overtime.toString()) || 0,
        netSalary: parseFloat(netSalary.toString()),
        status: 'PROCESSED',
        processedBy,
        processedAt: new Date(),
        // Save detailed breakdown
        daysPaid: payslipDetails.daysPaid || 30,
        uanNumber: payslipDetails.uanNumber || employee.uanNumber || '',
        esiNumber: payslipDetails.esiNumber || employee.esiNumber || '',
        bankAccountNumber: payslipDetails.bankAccountNumber || employee.bankAccountNumber || '',
        houseRentAllowance: parseFloat(payslipDetails.houseRentAllowance?.toString() || '0'),
        skillAllowance: parseFloat(payslipDetails.skillAllowance?.toString() || '0'),
        conveyanceAllowance: parseFloat(payslipDetails.conveyanceAllowance?.toString() || '0'),
        medicalAllowance: parseFloat(payslipDetails.medicalAllowance?.toString() || '0'),
        professionalTax: parseFloat(payslipDetails.professionalTax?.toString() || '0'),
        providentFund: parseFloat(payslipDetails.providentFund?.toString() || '0'),
        esi: parseFloat(payslipDetails.esi?.toString() || '0'),
        incomeTax: parseFloat(payslipDetails.incomeTax?.toString() || '0'),
        personalLoan: parseFloat(payslipDetails.personalLoan?.toString() || '0'),
        otherAdvance: parseFloat(payslipDetails.otherAdvance?.toString() || '0'),
        medicalExp: parseFloat(payslipDetails.medicalExp?.toString() || '0'),
        lta: parseFloat(payslipDetails.lta?.toString() || '0'),
        repairMaintenance: parseFloat(payslipDetails.repairMaintenance?.toString() || '0'),
        fuelExp: parseFloat(payslipDetails.fuelExp?.toString() || '0')
      }
    })

    // Generate PDF payslip
    const enhancedPayslipDetails = {
      ...payslipDetails,
      daysPaid: payslipDetails.daysPaid || 30,
      uanNumber: payslipDetails.uanNumber || employee.uanNumber || 'N/A',
      esiNumber: payslipDetails.esiNumber || employee.esiNumber || 'N/A',
      bankAccountNumber: payslipDetails.bankAccountNumber || employee.bankAccountNumber || 'N/A'
    }
    const pdfBuffer = await generatePayslipPDF(employee, payrollRecord, enhancedPayslipDetails)
    
    // Upload PDF to S3
    const fileName = `${employee.employeeId}_payslip_${month}_${year}.pdf`
    const s3Key = await uploadPayslipToS3(pdfBuffer, fileName, employee.employeeId)

    // Create document record with S3 key
    await prisma.employeeDocument.create({
      data: {
        employeeId,
        title: `Payslip - ${getMonthName(month)} ${year}`,
        description: `Payslip for ${employee.name} for ${getMonthName(month)} ${year}`,
        fileName,
        filePath: s3Key, // Store S3 key instead of local path
        fileSize: pdfBuffer.length,
        mimeType: 'application/pdf',
        uploadedBy: processedBy
      }
    })

    console.log('=== PAYSLIP GENERATION SUCCESS ===')

    res.json({
      success: true,
      message: 'Payslip generated successfully',
      data: payrollRecord
    })

  } catch (error) {
    console.error('=== PAYSLIP GENERATION ERROR ===')
    console.error('Error generating payslip:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate payslip'
    })
  }
}

const generatePayslipPDF = async (employee: any, payrollRecord: any, payslipDetails: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      // Add logo
      const logoPath = path.join(process.cwd(), 'logo', 'Media_Infotech.png')
      console.log('=== LOGO DEBUG ===')
      console.log('Current working directory:', process.cwd())
      console.log('Logo path:', logoPath)
      console.log('Logo file exists:', fs.existsSync(logoPath))
      
      if (fs.existsSync(logoPath)) {
        try {
          console.log('Attempting to add logo to PDF...')
          doc.image(logoPath, 50, 50, { width: 100 })
          console.log('Logo added successfully!')
        } catch (logoError) {
          console.error('Error adding logo to PDF:', logoError)
          // Add a placeholder for logo space if logo fails to load
          doc.rect(50, 50, 100, 60).stroke()
          doc.fontSize(8).text('LOGO', 85, 75)
        }
      } else {
        console.log('Logo file not found, using placeholder')
        // Add a placeholder for logo space if logo not found
        doc.rect(50, 50, 100, 60).stroke()
        doc.fontSize(8).text('LOGO', 85, 75)
      }
      console.log('=== END LOGO DEBUG ===')

      // Company header
      doc.fontSize(20).font('Helvetica-Bold')
      doc.text('MEDIAINFOTECH', 170, 70)
      
      doc.fontSize(14).font('Helvetica')
      doc.text(`Pay Slip for the month Of ${getMonthName(payrollRecord.month)}' ${payrollRecord.year}`, 50, 135)

      // Employee details table
      let yPos = 175
      const tableWidth = 500
      const colWidth = tableWidth / 2

      // Employee info section
      const employeeLocation = employee.address || 'Office Location'
      const employeeDesignation = employee.designation || employee.role || 'N/A'
      const employeeInfo = [
        ['Employee No.', employee.employeeId],
        ['Employee Name', employee.name],
        ['Designation', employeeDesignation],
        ['Location', employeeLocation],
        ['UAN no.', payslipDetails.uanNumber || 'N/A'],
        ['ESI No.', payslipDetails.esiNumber || 'N/A'],
        ['Bank A/c No.', payslipDetails.bankAccountNumber || 'N/A'],
        ['Days Paid', payslipDetails.daysPaid?.toString() || '30']
      ]

      employeeInfo.forEach(([label, value]) => {
        doc.rect(50, yPos, colWidth, 25).stroke()
        doc.rect(50 + colWidth, yPos, colWidth, 25).stroke()
        
        doc.fontSize(10).font('Helvetica-Bold')
        doc.text(label, 55, yPos + 8)
        doc.font('Helvetica')
        doc.text(value, 55 + colWidth, yPos + 8)
        
        yPos += 25
      })

      // Income and Deductions table
      yPos += 20
      
      // Headers
      doc.rect(50, yPos, colWidth / 2, 25).stroke()
      doc.rect(50 + colWidth / 2, yPos, colWidth / 2, 25).stroke()
      doc.rect(50 + colWidth, yPos, colWidth / 2, 25).stroke()
      doc.rect(50 + colWidth + colWidth / 2, yPos, colWidth / 2, 25).stroke()

      doc.fontSize(10).font('Helvetica-Bold')
      doc.text('Income', 55, yPos + 8)
      doc.text('(Rs.)', 55 + colWidth / 2, yPos + 8)
      doc.text('Deductions', 55 + colWidth, yPos + 8)
      doc.text('(Rs.)', 55 + colWidth + colWidth / 2, yPos + 8)

      yPos += 25

      // Income and deduction rows
      const incomeItems = [
        ['Basic', payslipDetails.basicSalary || 0],
        ['House Rent Allowances', payslipDetails.houseRentAllowance || 0],
        ['Skill Allowances', payslipDetails.skillAllowance || 0],
        ['Conveyance Allowances', payslipDetails.conveyanceAllowance || 0],
        ['Medical Allowances', payslipDetails.medicalAllowance || 0],
        ['Reimbursements', (payslipDetails.medicalExp || 0) + (payslipDetails.lta || 0) + (payslipDetails.repairMaintenance || 0) + (payslipDetails.fuelExp || 0)]
      ]

      const deductionItems = [
        ['Professional Tax', payslipDetails.professionalTax || 0],
        ['Provident Fund', payslipDetails.providentFund || 0],
        ['ESI', payslipDetails.esi || 0],
        ['Income Tax', payslipDetails.incomeTax || 0],
        ['Personal Loan', payslipDetails.personalLoan || 0],
        ['Other Advance', payslipDetails.otherAdvance || 0]
      ]

      const maxRows = Math.max(incomeItems.length, deductionItems.length)

      for (let i = 0; i < maxRows; i++) {
        doc.rect(50, yPos, colWidth / 2, 25).stroke()
        doc.rect(50 + colWidth / 2, yPos, colWidth / 2, 25).stroke()
        doc.rect(50 + colWidth, yPos, colWidth / 2, 25).stroke()
        doc.rect(50 + colWidth + colWidth / 2, yPos, colWidth / 2, 25).stroke()

        doc.fontSize(9).font('Helvetica')
        
        if (i < incomeItems.length) {
          doc.text(incomeItems[i][0], 55, yPos + 8)
          doc.text(incomeItems[i][1].toString(), 55 + colWidth / 2, yPos + 8)
        }
        
        if (i < deductionItems.length) {
          doc.text(deductionItems[i][0], 55 + colWidth, yPos + 8)
          doc.text(deductionItems[i][1].toString(), 55 + colWidth + colWidth / 2, yPos + 8)
        }

        yPos += 25
      }

      // Totals row
      doc.rect(50, yPos, colWidth / 2, 25).stroke()
      doc.rect(50 + colWidth / 2, yPos, colWidth / 2, 25).stroke()
      doc.rect(50 + colWidth, yPos, colWidth / 2, 25).stroke()
      doc.rect(50 + colWidth + colWidth / 2, yPos, colWidth / 2, 25).stroke()

      const totalIncome = (payslipDetails.basicSalary || 0) + (payslipDetails.houseRentAllowance || 0) + 
                         (payslipDetails.skillAllowance || 0) + (payslipDetails.conveyanceAllowance || 0) + 
                         (payslipDetails.medicalAllowance || 0) + (payslipDetails.medicalExp || 0) + 
                         (payslipDetails.lta || 0) + (payslipDetails.repairMaintenance || 0) + (payslipDetails.fuelExp || 0)

      const totalDeductions = (payslipDetails.professionalTax || 0) + (payslipDetails.providentFund || 0) + 
                             (payslipDetails.esi || 0) + (payslipDetails.incomeTax || 0) + 
                             (payslipDetails.personalLoan || 0) + (payslipDetails.otherAdvance || 0)

      doc.fontSize(10).font('Helvetica-Bold')
      doc.text('Total Earning', 55, yPos + 8)
      doc.text(totalIncome.toString(), 55 + colWidth / 2, yPos + 8)
      doc.text('Total Deduction:', 55 + colWidth, yPos + 8)
      doc.text(totalDeductions.toString(), 55 + colWidth + colWidth / 2, yPos + 8)

      yPos += 25

      // Net Pay
      yPos += 10
      doc.rect(50, yPos, colWidth / 2, 25).stroke()
      doc.rect(50 + colWidth / 2, yPos, colWidth / 2, 25).stroke()
      doc.rect(50 + colWidth, yPos, colWidth, 25).stroke()

      doc.fontSize(10).font('Helvetica-Bold')
      doc.text('Net Pay', 55, yPos + 8)
      doc.text(`₹${payrollRecord.netSalary.toFixed(2)}`, 55 + colWidth / 2, yPos + 8)
      doc.text(`Bank A/c: ${payslipDetails.bankAccountNumber || 'N/A'}`, 55 + colWidth, yPos + 8)

      yPos += 25
      doc.rect(50, yPos, colWidth, 25).stroke()
      doc.rect(50 + colWidth, yPos, colWidth, 25).stroke()

      doc.text('Amount Transferred to Bank Account', 55, yPos + 8)
      doc.text('Signature', 55 + colWidth, yPos + 8)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

const getMonthName = (month: number): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  return months[month - 1] || 'Jan'
}