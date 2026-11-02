import { Request, Response } from 'express';
import * as Dashboard from '../models/dashboard';

export async function getStats(req: Request, res: Response) {
    try {
        const range = (req.query.range as string) || '30d';
        const data = await Dashboard.getLiveDashboardMetrics(range);
        res.json(data);
    } catch (err: any) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ error: err.message });
    }
}

