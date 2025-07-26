import { Router, Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { openDb } from '../db';
import { BadRequestError, AppError } from '../errors';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send('API is running');
});

router.post('/email-signup', expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  if (!email) {
    return next(new BadRequestError('Email is required'));
  }
  const db = await openDb();
  try {
    await db.run('INSERT INTO email_signups (email) VALUES (?)', email);
    res.status(201).json({ message: 'Signed up' });
  } catch (err: any) {
    if (err && err.code === 'SQLITE_CONSTRAINT') {
      return next(new BadRequestError('Email already signed up'));
    } else {
      return next(new AppError('Server error', 500));
    }
  } finally {
    await db.close();
  }
}));

export default router; 