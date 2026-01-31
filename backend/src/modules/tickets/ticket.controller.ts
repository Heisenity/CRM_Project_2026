import { Request, Response } from 'express';
import { ticketService } from './ticket.service';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { getDownloadUrl } from '@/services/s3.service'

export class TicketController {
  async createTicket(req: Request, res: Response) {
    try {
      const {
        description,
        categoryId,
        priority,
        assigneeId,
        reporterId,
        dueDate,
        estimatedHours,
        tags,
        customerName,
        customerId,
        customerPhone,
        attachments
      } = req.body;

      // Use authenticated user as reporter if not provided
      const authenticatedUser = (req as any).user;
      let finalReporterId = reporterId;
      
      if (!finalReporterId && authenticatedUser) {
        // For admin users, we need to look up their adminId from the database
        if (authenticatedUser.userType === 'ADMIN') {
          const admin = await ticketService.prisma.admin.findUnique({
            where: { id: authenticatedUser.id },
            select: { adminId: true }
          });
          finalReporterId = admin?.adminId;
        } else if (authenticatedUser.userType === 'EMPLOYEE') {
          const employee = await ticketService.prisma.employee.findUnique({
            where: { id: authenticatedUser.id },
            select: { employeeId: true }
          });
          finalReporterId = employee?.employeeId;
        } else {
          // Fallback to the internal ID
          finalReporterId = authenticatedUser.id;
        }
      }

      console.log('Controller - finalReporterId:', finalReporterId);
      console.log('Controller - authenticatedUser:', authenticatedUser);

      // Validate required fields
      if (!description || !categoryId || !priority || !finalReporterId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: description, categoryId, priority, reporterId'
        });
      }

      const ticket = await ticketService.createTicket({
        description,
        categoryId,
        priority: priority as TicketPriority,
        assigneeId,
        reporterId: finalReporterId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        tags: tags || [],
        customerName,
        customerId,
        customerPhone,
        attachments: attachments || []
      }, finalReporterId); // Use the same finalReporterId for changedBy

      return res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create ticket',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTickets(req: Request, res: Response) {
    try {
      const { status, priority, categoryId, reporterId, assigneeId, search } = req.query;

      const tickets = await ticketService.getTickets({
        status: status as TicketStatus,
        priority: priority as TicketPriority,
        categoryId: categoryId as string,
        reporterId: reporterId as string,
        assigneeId: assigneeId as string,
        search: search as string,
      });

      return res.status(200).json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMyTickets(req: Request, res: Response) {
    try {
      const { employeeId } = req.query;
      const authenticatedUserId = (req as any).user?.id;

      // Use employeeId from query or fall back to authenticated user
      let targetEmployeeId = employeeId as string;
      
      if (!targetEmployeeId && authenticatedUserId) {
        // If no employeeId provided, try to find the employee by internal ID
        const employee = await ticketService.prisma.employee.findUnique({
          where: { id: authenticatedUserId },
          select: { employeeId: true }
        });
        targetEmployeeId = employee?.employeeId || '';
      }

      if (!targetEmployeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        });
      }

      // Find employee by employeeId to get the internal ID
      const employee = await ticketService.prisma.employee.findUnique({
        where: { employeeId: targetEmployeeId },
        select: { id: true }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      const tickets = await ticketService.getTickets({
        reporterId: employee.id
      });

      return res.status(200).json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Error fetching my tickets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTicketById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const ticket = await ticketService.getTicketById(id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch ticket',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        description,
        categoryId,
        priority,
        status,
        assigneeId,
        dueDate,
        estimatedHours,
        tags,
        changedBy
      } = req.body;

      if (!changedBy) {
        return res.status(400).json({
          success: false,
          message: 'changedBy (employee ID) is required'
        });
      }

      const ticket = await ticketService.updateTicket(id, {
        description,
        categoryId,
        priority: priority as TicketPriority,
        status: status as TicketStatus,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        tags: tags || []
      }, changedBy);

      return res.status(200).json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update ticket',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await ticketService.deleteTicket(id);

      return res.status(200).json({
        success: true,
        message: 'Ticket deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete ticket',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content, isInternal, authorId } = req.body;

      if (!authorId) {
        return res.status(400).json({
          success: false,
          message: 'authorId (employee ID) is required'
        });
      }

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      const comment = await ticketService.addComment(id, authorId, content, isInternal || false);

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async downloadAttachment(req: Request<{ attachmentId: string }>, res: Response) {
  try {
    const { attachmentId } = req.params

    const attachment = await ticketService.prisma.ticketAttachment.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      })
    }

    const bucket = process.env.AWS_S3_MISCELLANEOUS_BUCKET
    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'S3 bucket not configured'
      })
    }

    // attachment.filePath = S3 key
    const url = await getDownloadUrl(
      bucket,
      attachment.filePath,
      60 // expires in 60 seconds
    )

    return res.status(200).json({
      success: true,
      url
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to generate download link'
    })
  }
}

  async getTicketCount(req: Request, res: Response) {
    try {
      const { status, priority, categoryId } = req.query;

      const count = await ticketService.getTicketCount({
        status: status as TicketStatus,
        priority: priority as TicketPriority,
        categoryId: categoryId as string,
      });

      return res.status(200).json({
        success: true,
        data: {
          total: count
        }
      });
    } catch (error) {
      console.error('Error fetching ticket count:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch ticket count',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async fixAdminTickets(req: Request, res: Response) {
    try {
      const result = await ticketService.fixExistingAdminTickets();

      return res.status(200).json({
        success: true,
        message: 'Admin tickets fix completed',
        data: result
      });
    } catch (error) {
      console.error('Error fixing admin tickets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fix admin tickets',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const ticketController = new TicketController();
