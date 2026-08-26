import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

export const registerOrganizer = async (req: Request, res: Response) => {
  try {
    const { name, email, password, org_name } = req.body;
    
    const existing = await prisma.organizer.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const organizer = await prisma.organizer.create({
      data: { name, email, password_hash, org_name }
    });

    res.status(201).json({ message: 'Organizer created successfully', organizerId: organizer.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginOrganizer = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const organizer = await prisma.organizer.findUnique({ where: { email } });
    if (!organizer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, organizer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'supersecret_for_local_dev';
    const token = jwt.sign({ id: organizer.id }, secret, { expiresIn: '1d' });

    res.json({ token, organizer: { id: organizer.id, name: organizer.name, org_name: organizer.org_name } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
