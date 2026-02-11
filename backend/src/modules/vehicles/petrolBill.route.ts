import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware";
import {
  createPetrolBill,
  getAllPetrolBills,
  getPetrolBillsByEmployee,
  getPetrolBillsByVehicle,
  approvePetrolBill,
} from "./petrolBill.controller";

const router = Router();

router.get("/", authenticateToken, getAllPetrolBills);
router.post("/", authenticateToken, createPetrolBill);
router.get("/employee/:employeeId", authenticateToken, getPetrolBillsByEmployee);
router.get("/vehicle/:vehicleId", authenticateToken, getPetrolBillsByVehicle);
router.patch("/:billId/approve", authenticateToken, approvePetrolBill);

export default router;
