import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export async function createPetrolBill(req: Request, res: Response) {
  try {
    const { vehicleId, employeeId, amount, date, imageUrl, description } = req.body;

    if (!vehicleId || !employeeId || !amount || !date) {
      return res.status(400).json({
        success: false,
        error: "vehicleId, employeeId, amount, and date are required",
      });
    }

    const petrolBill = await prisma.petrolBill.create({
      data: {
        vehicleId,
        employeeId,
        amount: parseFloat(amount),
        date: new Date(date),
        imageUrl,
        description,
        status: "PENDING",
      },
      include: {
        vehicle: true,
        employee: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Petrol bill submitted successfully",
      data: petrolBill,
    });
  } catch (error: any) {
    console.error("Create petrol bill error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create petrol bill",
    });
  }
}

export async function getAllPetrolBills(req: Request, res: Response) {
  try {
    const { status, employeeId, vehicleId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (vehicleId) where.vehicleId = vehicleId;

    const petrolBills = await prisma.petrolBill.findMany({
      where,
      include: {
        vehicle: {
          select: {
            vehicleNumber: true,
            make: true,
            model: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Format the response to match the expected structure
    const formattedBills = petrolBills.map((bill) => ({
      id: bill.id,
      vehicleId: bill.vehicleId,
      vehicleNumber: bill.vehicle.vehicleNumber,
      employeeId: bill.employeeId,
      employeeName: bill.employee.name,
      amount: bill.amount,
      date: bill.date,
      imageUrl: bill.imageUrl,
      description: bill.description,
      status: bill.status,
      approvedBy: bill.approvedBy,
      approvedAt: bill.approvedAt,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
    }));

    res.json({
      success: true,
      data: formattedBills,
    });
  } catch (error: any) {
    console.error("Get all petrol bills error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch petrol bills",
    });
  }
}

export async function getPetrolBillsByEmployee(req: Request, res: Response) {
  try {
    const { employeeId } = req.params;

    const petrolBills = await prisma.petrolBill.findMany({
      where: { employeeId },
      include: {
        vehicle: true,
      },
      orderBy: { date: "desc" },
    });

    res.json({
      success: true,
      data: petrolBills,
    });
  } catch (error: any) {
    console.error("Get petrol bills error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch petrol bills",
    });
  }
}

export async function getPetrolBillsByVehicle(req: Request, res: Response) {
  try {
    const { vehicleId } = req.params;

    const petrolBills = await prisma.petrolBill.findMany({
      where: { vehicleId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    res.json({
      success: true,
      data: petrolBills,
    });
  } catch (error: any) {
    console.error("Get petrol bills by vehicle error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch petrol bills",
    });
  }
}

export async function approvePetrolBill(req: Request, res: Response) {
  try {
    const { billId } = req.params;
    const { status, reason } = req.body;
    const adminId = (req as any).user?.id;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Valid status (APPROVED or REJECTED) is required",
      });
    }

    const petrolBill = await prisma.petrolBill.update({
      where: { id: billId },
      data: {
        status,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      include: {
        vehicle: {
          select: {
            vehicleNumber: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Petrol bill ${status.toLowerCase()} successfully`,
      data: petrolBill,
    });
  } catch (error: any) {
    console.error("Approve petrol bill error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to approve petrol bill",
    });
  }
}
