import express from 'express';
import { community } from '../apiConfig.js';
import { getEvents } from '../../services/index.js';

const router = express.Router();

router.get(community.getEvents, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 默認每頁12個貼文
    const results = await getEvents(page, limit);
    res.json(results);
});

export default router;
