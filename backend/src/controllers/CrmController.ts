import { Request, Response, NextFunction } from 'express';
import { CrmService } from '../services/CrmService';
import { NotFoundError } from '../errors/AppError';

export class CrmController {
  /**
   * @route   POST /api/v1/erp/crm/activities
   * @desc    Creates a new CRM activity (doctor visit log, enquiry, lead, complaint)
   * @access  Bearer JWT (crm:CREATE / crm:MANAGE)
   */
  public static async createActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const activity = await CrmService.createActivity(req.body);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'CRM activity recorded successfully',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/crm/activities
   * @desc    Lists CRM activities with filtering and pagination
   * @access  Bearer JWT (crm:READ)
   */
  public static async getActivities(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filter = {
        activityType: req.query.activityType as any,
        status: req.query.status as any,
        assignedStaffId: req.query.assignedStaffId ? String(req.query.assignedStaffId) : undefined,
        customerId: req.query.customerId ? String(req.query.customerId) : undefined,
        contactMobile: req.query.contactMobile ? String(req.query.contactMobile) : undefined,
        upcomingFollowUps: req.query.upcomingFollowUps === 'true',
        page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
      };

      const result = await CrmService.listActivities(filter);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'CRM activities retrieved successfully',
        data: result.activities,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/crm/activities/:id
   * @desc    Gets detailed CRM activity by ID
   * @access  Bearer JWT (crm:READ)
   */
  public static async getActivityById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const activity = await CrmService.getActivityById(String(req.params.id));

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'CRM activity details retrieved',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/crm/activities/:id
   * @desc    Updates notes, follow-up date, or resolution outcome of CRM activity
   * @access  Bearer JWT (crm:UPDATE)
   */
  public static async updateActivity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const activity = await CrmService.updateActivity(String(req.params.id), req.body);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'CRM activity updated successfully',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/crm/follow-ups
   * @desc    Retrieves upcoming scheduled follow-ups for sales dashboard
   * @access  Bearer JWT (crm:READ)
   */
  public static async getUpcomingFollowUps(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const daysAhead = req.query.daysAhead ? parseInt(String(req.query.daysAhead), 10) : 7;
      const staffId = req.query.staffId ? String(req.query.staffId) : undefined;

      const followUps = await CrmService.getUpcomingFollowUps(daysAhead, staffId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Upcoming follow-ups retrieved successfully',
        data: followUps,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CrmController;
