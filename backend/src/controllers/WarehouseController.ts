import { Request, Response, NextFunction } from 'express';
import { WarehouseService } from '../services/WarehouseService';

export class WarehouseController {
  /**
   * @route   POST /api/v1/erp/warehouses
   * @desc    Registers a new warehouse / branch / showroom with GPS coordinates
   * @access  Bearer JWT (warehouses:MANAGE / warehouse:CREATE)
   */
  public static async createWarehouse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const warehouse = await WarehouseService.createWarehouse(req.body);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Warehouse registered successfully',
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/warehouses
   * @desc    Lists warehouses with district and type filtering
   * @access  Bearer JWT (warehouses:READ)
   */
  public static async getWarehouses(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filter = {
        type: req.query.type as any,
        district: req.query.district ? String(req.query.district) : undefined,
        isCentralHub:
          req.query.isCentralHub !== undefined
            ? req.query.isCentralHub === 'true'
            : undefined,
        isActive:
          req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 50,
      };

      const result = await WarehouseService.listWarehouses(filter);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Warehouses retrieved successfully',
        data: result.warehouses,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/warehouses/:id
   * @desc    Gets detailed warehouse data by ID
   * @access  Bearer JWT (warehouses:READ)
   */
  public static async getWarehouseById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const warehouse = await WarehouseService.getWarehouseById(String(req.params.id));

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Warehouse details retrieved',
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/warehouses/:id
   * @desc    Updates warehouse coordinates, contact, or operational details
   * @access  Bearer JWT (warehouses:UPDATE)
   */
  public static async updateWarehouse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const warehouse = await WarehouseService.updateWarehouse(
        String(req.params.id),
        req.body
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Warehouse updated successfully',
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/warehouses/district/:district
   * @desc    Queries warehouses by district to verify regional coverage
   * @access  Bearer JWT (warehouses:READ)
   */
  public static async getByDistrict(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const warehouses = await WarehouseService.getWarehousesByDistrict(
        String(req.params.district)
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Warehouses in district '${req.params.district}' retrieved`,
        data: warehouses,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default WarehouseController;
