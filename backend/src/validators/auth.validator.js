import { body } from 'express-validator';
import { PUBLIC_REGISTER_ROLES, ROLES } from '../config/constants.js';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(PUBLIC_REGISTER_ROLES)
    .withMessage(`Role must be one of: ${PUBLIC_REGISTER_ROLES.join(', ')}`),
];

export const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
