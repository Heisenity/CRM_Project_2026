// task.service.ts
import { prisma } from "@/lib/prisma";
import { getTodayDate } from "@/utils/date";

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CreateTaskData {
  employeeId: string;
  title: string;
  description: string;
  category?: string;
  location?: string;
  assignedBy: string;
  relatedTicketId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  relatedTicketId?: string;
}

export interface TaskRecord {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  category?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  assignedBy: string;
  assignedAt: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * =============================================================================
 * RULES ENFORCED:
 * - Task assignment never touches attendance
 * - Task times (checkIn/checkOut) are only set through explicit APIs:
 *     startTask(taskId) and completeTask(taskId)
 * - We add raw-SQL helpers for start/complete to avoid accidental middleware interference.
 * =============================================================================
 */

export async function createTask(data: CreateTaskData): Promise<TaskRecord> {
  try {
    // Find employee by employeeId
    const employee = await prisma.employee.findUnique({
      where: { employeeId: data.employeeId }
    });

    if (!employee) {
      throw new Error(`Employee with employee ID ${data.employeeId} not found`);
    }

    const createdTask = await prisma.task.create({
      data: {
        employeeId: employee.id,
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        assignedBy: data.assignedBy,
        relatedTicketId: data.relatedTicketId,
        status: 'PENDING'
        // NOTE: we intentionally do NOT set checkIn/checkOut here
      }
    });

    return mapTaskToRecord(createdTask, data.employeeId);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function getEmployeeTasks(employeeId: string, status?: TaskStatus): Promise<TaskRecord[]> {
  try {
    const employee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (!employee) {
      throw new Error(`Employee with employee ID ${employeeId} not found`);
    }

    const whereClause: any = {
      employeeId: employee.id
    };

    if (status) whereClause.status = status;

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { assignedAt: 'desc' }
    });

    return tasks.map(task => mapTaskToRecord(task, employeeId));
  } catch (error) {
    console.error('Error getting employee tasks:', error);
    throw error;
  }
}

/**
 * updateTaskStatus
 * - Updates status.
 * - If setting COMPLETED => also sets checkOut timestamp using a safe path below (completeTask).
 * - This function does not implicitly set checkIn.
 */
export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<TaskRecord> {
  try {
    // Defensive: don't allow status IN_PROGRESS set here to auto-create checkIn.
    // Use startTask(taskId) to begin a task (sets checkIn + in-progress).
    if (status === 'IN_PROGRESS') {
      throw new Error('Use startTask(taskId) to mark task as IN_PROGRESS and set start time');
    }

    // If trying to set COMPLETED, user should call completeTask to set checkOut (endTime)
    if (status === 'COMPLETED') {
      throw new Error('Use completeTask(taskId) to complete task and set end time');
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        employee: true
      }
    });

    return mapTaskToRecord(task, task.employee.employeeId);
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

/**
 * startTask(taskId)
 * - Explicit API to mark a task IN_PROGRESS and set task.checkIn
 * - Uses parameterized raw SQL to update checkIn atomically (bypasses accidental middleware)
 */
export async function startTask(taskId: string): Promise<TaskRecord> {
  try {
    const now = new Date();

    // Ensure task exists and is PENDING
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { employee: true }
    });

    if (!existing) throw new Error('Task not found');
    if (existing.status !== 'PENDING') throw new Error('Only PENDING tasks can be started');

    // Use raw query to set checkIn and status atomically (so accidental Prisma middleware that strips fields won't interfere).
    // Parameterized query to avoid SQL injection.
    const rows: any = await prisma.$queryRaw`
      UPDATE "tasks"
      SET "checkIn" = ${now}, "status" = 'IN_PROGRESS', "updatedAt" = ${now}
      WHERE id = ${taskId}
      RETURNING *;
    `;

    const updatedRow = Array.isArray(rows) ? rows[0] : rows;
    if (!updatedRow) throw new Error('Failed to start task');

    // Map the returned row to TaskRecord - the returned row fields follow schema naming
    return {
      id: updatedRow.id,
      employeeId: existing.employee.employeeId,
      title: updatedRow.title,
      description: updatedRow.description,
      category: updatedRow.category || undefined,
      location: updatedRow.location || undefined,
      startTime: updatedRow.checkIn ? new Date(updatedRow.checkIn).toISOString() : undefined,
      endTime: updatedRow.checkOut ? new Date(updatedRow.checkOut).toISOString() : undefined,
      assignedBy: updatedRow.assignedBy,
      assignedAt: updatedRow.assignedAt ? new Date(updatedRow.assignedAt).toISOString() : new Date().toISOString(),
      status: updatedRow.status as TaskStatus,
      createdAt: updatedRow.createdAt ? new Date(updatedRow.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: updatedRow.updatedAt ? new Date(updatedRow.updatedAt).toISOString() : new Date().toISOString()
    };
  } catch (error) {
    console.error('Error starting task:', error);
    throw error;
  }
}

/**
 * completeTask(taskId)
 * - Explicit API to mark a task COMPLETED and set checkOut
 */
export async function completeTask(taskId: string): Promise<TaskRecord> {
  try {
    const now = new Date();

    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { employee: true }
    });

    if (!existing) throw new Error('Task not found');
    if (existing.status === 'COMPLETED') throw new Error('Task already completed');

    // Use raw query to set checkOut atomically
    const rows: any = await prisma.$queryRaw`
      UPDATE "tasks"
      SET "checkOut" = ${now}, "status" = 'COMPLETED', "updatedAt" = ${now}
      WHERE id = ${taskId}
      RETURNING *;
    `;

    const updatedRow = Array.isArray(rows) ? rows[0] : rows;
    if (!updatedRow) throw new Error('Failed to complete task');

    return {
      id: updatedRow.id,
      employeeId: existing.employee.employeeId,
      title: updatedRow.title,
      description: updatedRow.description,
      category: updatedRow.category || undefined,
      location: updatedRow.location || undefined,
      startTime: updatedRow.checkIn ? new Date(updatedRow.checkIn).toISOString() : undefined,
      endTime: updatedRow.checkOut ? new Date(updatedRow.checkOut).toISOString() : undefined,
      assignedBy: updatedRow.assignedBy,
      assignedAt: updatedRow.assignedAt ? new Date(updatedRow.assignedAt).toISOString() : new Date().toISOString(),
      status: updatedRow.status as TaskStatus,
      createdAt: updatedRow.createdAt ? new Date(updatedRow.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: updatedRow.updatedAt ? new Date(updatedRow.updatedAt).toISOString() : new Date().toISOString()
    };
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}

/**
 * getAllTasks - unchanged except clear mapping for startTime/endTime from DB values.
 * NOTE: returns checkIn/checkOut values if present (they should only appear after explicit startTask/completeTask).
 */
export async function getAllTasks(page: number = 1, limit: number = 50, status?: TaskStatus) {
  const skip = (page - 1) * limit;

  try {
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          assignedAt: 'desc'
        },
        include: {
          employee: {
            select: {
              employeeId: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.task.count({ where: whereClause })
    ]);

    return {
      tasks: tasks.map(task => ({
        id: task.id,
        employeeId: task.employee.employeeId,
        employeeName: task.employee.name,
        employeeEmail: task.employee.email,
        title: task.title,
        description: task.description,
        category: task.category,
        location: task.location,
        startTime: task.checkIn ? task.checkIn.toISOString() : undefined,
        endTime: task.checkOut ? task.checkOut.toISOString() : undefined,
        assignedBy: task.assignedBy,
        assignedAt: task.assignedAt.toISOString(),
        status: task.status,
        relatedTicketId: task.relatedTicketId,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting all tasks:', error);
    throw error;
  }
}

/**
 * updateTaskDetails
 * - Updates task details like title, description, category, location, relatedTicketId
 * - Does not affect task status or timing
 */
export async function updateTaskDetails(taskId: string, data: UpdateTaskData): Promise<TaskRecord> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { employee: true }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        employee: true
      }
    });

    return mapTaskToRecord(updatedTask, updatedTask.employee.employeeId);
  } catch (error) {
    console.error('Error updating task details:', error);
    throw error;
  }
}

/**
 * Reset attendance attempts (admin function)
 */
export async function resetAttendanceAttempts(employeeId: string): Promise<void> {
  try {
    const employee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (!employee) {
      throw new Error(`Employee with employee ID ${employeeId} not found`);
    }

    const today = getTodayDate();

    await prisma.attendance.updateMany({
      where: {
        employeeId: employee.id,
        date: today
      },
      data: {
        attemptCount: 'ZERO',
        locked: false,
        lockedReason: null,
        updatedAt: new Date()
      }
    });

    console.log(`Reset attendance attempts for employee ${employeeId}`);
  } catch (error) {
    console.error('Error resetting attendance attempts:', error);
    throw error;
  }
}

/* ----------------------
   Helper mapping
   ---------------------- */
function mapTaskToRecord(task: any, employeeDisplayId: string): TaskRecord {
  return {
    id: task.id,
    employeeId: employeeDisplayId,
    title: task.title,
    description: task.description,
    category: task.category || undefined,
    location: task.location || undefined,
    startTime: task.checkIn ? task.checkIn.toISOString() : undefined,
    endTime: task.checkOut ? task.checkOut.toISOString() : undefined,
    assignedBy: task.assignedBy,
    assignedAt: task.assignedAt ? task.assignedAt.toISOString() : new Date().toISOString(),
    status: task.status,
    createdAt: task.createdAt ? task.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: task.updatedAt ? task.updatedAt.toISOString() : new Date().toISOString()
  };
}
