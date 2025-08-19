import { Router, Request, Response } from 'express';
import { openDb } from '../db';
import { requireAuth } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string; role: string };
}

const router = Router();

// Get all users with their activity stats
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await openDb();
    
    // Check if user is admin
    const user = await db.get('SELECT role FROM users WHERE id = ?', req.user?.userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Admin only.' });
      return;
    }

    // Get all users with their stats
    const users = await db.all(`
      SELECT 
        u.id,
        u.email,
        u.firstName,
        u.lastName,
        u.role,
        u.createdAt as registrationDate,
        COUNT(DISTINCT o.id) as totalOrders,
        COALESCE(SUM(o.total), 0) as totalSpent,
        MAX(o.createdAt) as lastOrderDate,
        COUNT(DISTINCT a.id) as totalAddresses
      FROM users u
      LEFT JOIN orders o ON u.id = o.userId
      LEFT JOIN addresses a ON u.id = a.userId
      WHERE u.role != 'admin' OR u.id = ?
      GROUP BY u.id
      ORDER BY u.createdAt DESC
    `, req.user?.userId);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      // Get recent orders (last 30 days)
      const recentOrders = await db.get(`
        SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount
        FROM orders 
        WHERE userId = ? AND createdAt >= datetime('now', '-30 days')
      `, user.id);

      // Get average order value
      const avgOrder = await db.get(`
        SELECT COALESCE(AVG(total), 0) as average
        FROM orders 
        WHERE userId = ?
      `, user.id);

      // Get order status distribution
      const statusStats = await db.all(`
        SELECT status, COUNT(*) as count
        FROM orders 
        WHERE userId = ?
        GROUP BY status
      `, user.id);

      return {
        ...user,
        recentOrders: recentOrders.count,
        recentSpent: recentOrders.amount,
        averageOrderValue: avgOrder.average,
        statusDistribution: statusStats,
        totalSpent: parseFloat(user.totalSpent || 0),
        totalOrders: parseInt(user.totalOrders || 0)
      };
    }));

    res.json({ users: usersWithStats });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get detailed stats for a specific user
router.get('/:id/stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await openDb();
    
    // Check if user is admin
    const user = await db.get('SELECT role FROM users WHERE id = ?', req.user?.userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Admin only.' });
      return;
    }

    const userId = parseInt(req.params.id);
    
    // Get user details
    const userDetails = await db.get('SELECT * FROM users WHERE id = ?', userId);
    if (!userDetails) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get order history
    const orders = await db.all(`
      SELECT o.*, 
             COUNT(oi.id) as itemCount,
             GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.orderId
      LEFT JOIN products p ON oi.productId = p.id
      WHERE o.userId = ?
      GROUP BY o.id
      ORDER BY o.createdAt DESC
    `, userId);

    // Get addresses
    const addresses = await db.all('SELECT * FROM addresses WHERE userId = ?', userId);

    // Get monthly spending for the last 12 months
    const monthlySpending = await db.all(`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as orderCount,
        SUM(total) as totalSpent
      FROM orders 
      WHERE userId = ? 
        AND createdAt >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month DESC
    `, userId);

    // Get top products purchased
    const topProducts = await db.all(`
      SELECT 
        p.name,
        p.imageUrl,
        SUM(oi.quantity) as totalQuantity,
        SUM(oi.quantity * oi.price) as totalSpent
      FROM order_items oi
      JOIN products p ON oi.productId = p.id
      JOIN orders o ON oi.orderId = o.id
      WHERE o.userId = ?
      GROUP BY p.id
      ORDER BY totalQuantity DESC
      LIMIT 5
    `, userId);

    res.json({
      user: userDetails,
      orders,
      addresses,
      monthlySpending,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

export default router; 