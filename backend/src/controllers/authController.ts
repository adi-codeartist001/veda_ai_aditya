import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  });

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, schoolName } = req.body;

    if (!name || name.trim().length < 2) { res.status(400).json({ success: false, error: 'Name must be at least 2 characters' }); return; }
    if (!email || !email.includes('@')) { res.status(400).json({ success: false, error: 'Valid email is required' }); return; }
    if (!password || password.length < 6) { res.status(400).json({ success: false, error: 'Password must be at least 6 characters' }); return; }
    if (!schoolName || schoolName.trim().length < 2) { res.status(400).json({ success: false, error: 'School name is required' }); return; }

    const exists = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (exists) { res.status(400).json({ success: false, error: 'Email already registered. Please login.' }); return; }

    const user = await UserModel.create({ name: name.trim(), email: email.toLowerCase().trim(), password, schoolName: schoolName.trim() });
    const token = signToken(user._id.toString());
    res.status(201).json({ success: true, data: { token, user } });
  } catch (err: any) {
    console.error('Register error:', err);
    if (err.code === 11000) { res.status(400).json({ success: false, error: 'Email already registered.' }); return; }
    res.status(400).json({ success: false, error: err.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ success: false, error: 'Email and password required' }); return; }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) { res.status(401).json({ success: false, error: 'Invalid email or password' }); return; }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) { res.status(401).json({ success: false, error: 'Invalid email or password' }); return; }

    const token = signToken(user._id.toString());
    res.json({ success: true, data: { token, user } });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(400).json({ success: false, error: err.message || 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, data: { user: req.user } });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, schoolName } = req.body;
    const user = await UserModel.findByIdAndUpdate(req.user._id, { name, schoolName }, { new: true });
    res.json({ success: true, data: { user } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};