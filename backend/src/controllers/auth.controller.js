import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { PUBLIC_REGISTER_ROLES, ROLES } from '../config/constants.js';
import { signToken } from '../utils/jwt.js';

const BCRYPT_ROUNDS = 12;

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered', code: 'CONFLICT' });
    }

    const assignedRole = PUBLIC_REGISTER_ROLES.includes(role) ? role : ROLES.ANALYST;

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ name, email, passwordHash, role: assignedRole });
    const token = signToken(user);

    res.status(201).json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password', code: 'UNAUTHORIZED' });
    }

    if (!user.passwordHash || typeof user.passwordHash !== 'string') {
      return res.status(401).json({
        error: 'Account is missing a password. Please register again or contact support.',
        code: 'UNAUTHORIZED',
      });
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.passwordHash);
    } catch {
      return res.status(401).json({ error: 'Invalid email or password', code: 'UNAUTHORIZED' });
    }
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password', code: 'UNAUTHORIZED' });
    }

    const token = signToken(user);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: req.user.toPublicJSON() });
}
