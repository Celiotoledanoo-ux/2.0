import usersService from './users.service.js';
import logger from '../../core/logger/logger.js';
import { catchAsync } from '../../shared/utils/async.utils.js'; 
import AppError from '../../core/errors/AppError.js';

/**
 * 👥 USERS CONTROLLER - GESTIÓN DE PERSONAL (ESM)
 * El puente inteligente entre la validación (Schema) y la lógica (Service).
 * 
 * 🎯 MISION DE BLINDAJE: Transmisión transparente de payloads exactos.
 */
const usersController = {
  /**
   * 1. CREAR USUARIO (EMPLEADO)
   */
  create: catchAsync(async (req, res, next) => {
    // El validationMiddleware ya limpió el objeto y lo dejó directo en req.body
    const userData = req.body; 
    
    if (!userData || Object.keys(userData).length === 0) {
      return next(new AppError('No se recibieron datos para crear el usuario, bro.', 400));
    }

    const newUser = await usersService.registerUser(userData);

    logger.info({ event: 'USER_CREATED', adminId: req.user?.id, newUserId: newUser.id });

    return res.status(201).json({
      status: 'success',
      message: `Usuario ${newUser.name} creado correctamente en el sistema.`,
      data: newUser 
    });
  }),

  /**
   * 2. LISTAR TODO EL PERSONAL (Tabla de Gestión de Empleados)
   */
  getAll: catchAsync(async (req, res) => {
    const users = await usersService.getAllUsers();

    return res.status(200).json({
      status: 'success',
      results: users.length,
      data: users 
    });
  }),

  /**
   * 3. OBTENER USUARIO POR ID
   */
  getById: catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await usersService.getUserById(id);

    return res.status(200).json({
      status: 'success',
      data: user
    });
  }),

  /**
   * 4. ACTIVAR/DESACTIVAR USUARIO (Baja Lógica de Cajeros)
   */
  toggleStatus: catchAsync(async (req, res, next) => {
    // Parsea los datos limpios de la raíz gracias al validationMiddleware
    const { id } = req.params;
    const { active } = req.body;

    if (active === undefined) {
      return next(new AppError('Debes indicar si el estado de activación es true o false.', 400));
    }

    const updatedUser = await usersService.toggleUserStatus(id, Boolean(active));

    logger.warn({ event: 'USER_STATUS_TOGGLE', targetId: id, status: updatedUser.active });

    return res.status(200).json({
      status: 'success',
      message: `Acceso del empleado ${updatedUser.active ? 'habilitado ✅' : 'restringido 🚫'} de forma exitosa.`,
      data: updatedUser
    });
  })
};

// 🎯 EXPORTACIÓN ESM POR DEFECTO
export default usersController;
