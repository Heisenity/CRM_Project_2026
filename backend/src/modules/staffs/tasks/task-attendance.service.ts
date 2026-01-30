import { prisma } from "@/lib/prisma";
import { getTodayDate } from "@/utils/date";
import { NotificationService } from "../../notifications/notification.service";

/**
 * =============================================================================
 * TASK CHECK-IN/CHECKOUT SERVICE
 * =============================================================================
 * This service handles ONLY task-level check-in/checkout operations.
 * It is completely separate from day-level clock-in/clock-out functionality.
 * 
 * Purpose: Track when employees start and complete specific tasks
 * Scope: Task management only
 * =============================================================================
 */

export interface TaskCheckInData {
  employeeId: string;
  taskId: string;
  ipAddress: string;
  userAgent: string;
  photo?: string;
  location?: string;
}

export interface TaskCheckOutData {
  employeeId: string;
  taskId: string;
}

export interface TaskAttendanceResult {
  success: boolean;
  message: string;
  data?: {
    taskId: string;
    taskStartTime?: string;
    taskEndTime?: string;
    taskStatus: string;
  };
}

/**
 * TASK CHECK-IN: Employee starts working on a specific task
 * - Updates task status to IN_PROGRESS
 * - Records task check-in time in Task table
 * - Does NOT affect daily clock-in/clock-out in Attendance table
 */
export async function taskCheckIn(data: TaskCheckInData): Promise<TaskAttendanceResult> {
  try {
    const now = new Date();

    // Find employee
    const employee = await prisma.employee.findUnique({
      where: { employeeId: data.employeeId }
    });

    if (!employee) {
      return { success: false, message: 'Employee not found' };
    }

    // Verify task exists and belongs to employee
    const task = await prisma.task.findUnique({
      where: { id: data.taskId }
    });

    if (!task || task.employeeId !== employee.id) {
      return { success: false, message: 'Task not found or not assigned to you' };
    }

    if (task.status === 'COMPLETED') {
      return { success: false, message: 'Task is already completed' };
    }

    if (task.status === 'IN_PROGRESS') {
      return { success: false, message: 'Task is already in progress' };
    }

    // For field engineers, ensure they have daily attendance approval first
    if (employee.role === 'FIELD_ENGINEER') {
      const today = getTodayDate();
      const attendance = await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: employee.id, date: today } }
      });

      if (!attendance) {
        return { 
          success: false, 
          message: 'No attendance record found. Please clock in for the day first.' 
        };
      }

      if (!attendance.clockIn || attendance.approvalStatus !== 'APPROVED') {
        return { 
          success: false, 
          message: 'Please wait for admin approval of your daily clock-in before starting tasks.' 
        };
      }
    }

    // Check if employee is already working on another task
    const activeTask = await prisma.task.findFirst({
      where: {
        employeeId: employee.id,
        status: 'IN_PROGRESS',
        id: { not: data.taskId }
      }
    });

    if (activeTask) {
      return { 
        success: false, 
        message: `Please check out from current task "${activeTask.title}" first` 
      };
    }

    // Update task: set checkIn time and status to IN_PROGRESS
    const updatedTask = await prisma.task.update({
      where: { id: data.taskId },
      data: {
        checkIn: now,
        status: 'IN_PROGRESS',
        updatedAt: now
      }
    });

    // For in-office employees, create attendance record if it doesn't exist
    if (employee.role === 'IN_OFFICE') {
      const today = getTodayDate();
      const attendance = await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: employee.id, date: today } }
      });

      if (!attendance) {
        await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            date: today,
            clockIn: now, // Auto clock-in for in-office staff
            clockOut: null,
            approvalStatus: 'NOT_REQUIRED',
            status: 'PRESENT',
            location: data.location || task.location || 'Office',
            ipAddress: data.ipAddress,
            photo: data.photo,
            source: 'SELF'
          }
        });
      }
    }

    return {
      success: true,
      message: `Successfully checked in to task: ${task.title}`,
      data: {
        taskId: data.taskId,
        taskStartTime: updatedTask.checkIn!.toISOString(),
        taskStatus: 'IN_PROGRESS'
      }
    };

  } catch (error) {
    console.error('Task check-in error:', error);
    return { 
      success: false, 
      message: 'Failed to check in to task. Please try again.' 
    };
  }
}

/**
 * TASK CHECK-OUT: Employee completes a specific task
 * - Updates task status to COMPLETED
 * - Records task check-out time in Task table
 * - Does NOT affect daily clock-in/clock-out in Attendance table
 */
export async function taskCheckOut(data: TaskCheckOutData): Promise<TaskAttendanceResult> {
  try {
    const now = new Date();

    // Find employee
    const employee = await prisma.employee.findUnique({
      where: { employeeId: data.employeeId }
    });

    if (!employee) {
      return { success: false, message: 'Employee not found' };
    }

    // Verify task exists and belongs to employee
    const task = await prisma.task.findUnique({
      where: { id: data.taskId }
    });

    if (!task || task.employeeId !== employee.id) {
      return { success: false, message: 'Task not found or not assigned to you' };
    }

    if (task.status === 'COMPLETED') {
      return { success: false, message: 'Task is already completed' };
    }

    if (task.status !== 'IN_PROGRESS') {
      return { success: false, message: 'Task is not in progress. Please check in first.' };
    }

    if (!task.checkIn) {
      return { success: false, message: 'Task has no check-in time. Please check in first.' };
    }

    // Update task: set checkOut time and status to COMPLETED
    const updatedTask = await prisma.task.update({
      where: { id: data.taskId },
      data: {
        checkOut: now,
        status: 'COMPLETED',
        updatedAt: now
      }
    });

    // Create admin notification for task completion and unassign any vehicles
    try {
      const notificationService = new NotificationService();

      // Task completed notification
      try {
        await notificationService.createAdminNotification({
          type: 'TASK_COMPLETED',
          title: 'Task Completed',
          message: `${employee.name} completed task: ${task.title}`,
          data: {
            taskId: task.id,
            taskTitle: task.title,
            employeeId: employee.employeeId,
            employeeName: employee.name,
            completedAt: now.toISOString()
          }
        })
      } catch (err) {
        console.error('Failed to create TASK_COMPLETED notification:', err)
      }

      // Unassign any vehicle individually assigned to this employee
      try {
        const individualVehicle = await prisma.vehicle.findFirst({
          where: { assignedTo: employee.id, status: 'ASSIGNED' }
        })

        if (individualVehicle) {
          await prisma.vehicle.update({
            where: { id: individualVehicle.id },
            data: { assignedTo: null, assignedAt: null, status: 'AVAILABLE' }
          })

          try {
            await notificationService.createAdminNotification({
              type: 'VEHICLE_UNASSIGNED',
              title: 'Vehicle Unassigned',
              message: `Vehicle ${individualVehicle.vehicleNumber} has been unassigned from ${employee.name} after task completion.`,
              data: {
                vehicleId: individualVehicle.id,
                vehicleNumber: individualVehicle.vehicleNumber,
                employeeId: employee.employeeId,
                employeeName: employee.name,
                unassignedAt: new Date().toISOString(),
                reason: 'task-complete',
                taskId: task.id
              }
            })
          } catch (err) {
            console.error('Failed to create VEHICLE_UNASSIGNED notification (individual):', err)
          }
        }
      } catch (err) {
        console.error('Error while unassigning individual vehicle on task completion:', err)
      }

      // If employee belongs to a team, unassign vehicle assigned to the team leader as well
      try {
        if (employee.teamId) {
          const teamLeader = await prisma.employee.findFirst({
            where: { teamId: employee.teamId, isTeamLeader: true }
          })

          if (teamLeader && teamLeader.id !== employee.id) {
            const teamVehicle = await prisma.vehicle.findFirst({
              where: { assignedTo: teamLeader.id, status: 'ASSIGNED' }
            })

            if (teamVehicle) {
              await prisma.vehicle.update({
                where: { id: teamVehicle.id },
                data: { assignedTo: null, assignedAt: null, status: 'AVAILABLE' }
              })

              try {
                await notificationService.createAdminNotification({
                  type: 'VEHICLE_UNASSIGNED',
                  title: 'Team Vehicle Unassigned',
                  message: `Team vehicle ${teamVehicle.vehicleNumber} assigned to ${teamLeader.name} has been unassigned after ${employee.name} completed a task.`,
                  data: {
                    vehicleId: teamVehicle.id,
                    vehicleNumber: teamVehicle.vehicleNumber,
                    teamLeaderId: teamLeader.employeeId,
                    teamLeaderName: teamLeader.name,
                    affectedEmployeeId: employee.employeeId,
                    affectedEmployeeName: employee.name,
                    unassignedAt: new Date().toISOString(),
                    reason: 'task-complete',
                    taskId: task.id
                  }
                })
              } catch (err) {
                console.error('Failed to create VEHICLE_UNASSIGNED notification (team):', err)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error while unassigning team vehicle on task completion:', err)
      }

    } catch (err) {
      console.error('Error during post-task-completion notifications/unassign logic:', err)
    }

    return {
      success: true,
      message: `Successfully checked out from task: ${task.title}`,
      data: {
        taskId: data.taskId,
        taskEndTime: updatedTask.checkOut!.toISOString(),
        taskStatus: 'COMPLETED'
      }
    };

  } catch (error) {
    console.error('Task check-out error:', error);
    return { 
      success: false, 
      message: 'Failed to check out from task. Please try again.' 
    };
  }
}

/**
 * Get current task status for employee
 */
export async function getCurrentTaskStatus(employeeId: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (!employee) {
      return { success: false, message: 'Employee not found' };
    }

    // Find current active task (IN_PROGRESS)
    const activeTask = await prisma.task.findFirst({
      where: {
        employeeId: employee.id,
        status: 'IN_PROGRESS'
      }
    });

    return {
      success: true,
      data: {
        hasActiveTask: !!activeTask,
        currentTask: activeTask || null,
        taskStartTime: activeTask?.checkIn?.toISOString() || null,
        taskEndTime: activeTask?.checkOut?.toISOString() || null
      }
    };

  } catch (error) {
    console.error('Get task status error:', error);
    return { success: false, message: 'Failed to get task status' };
  }
}