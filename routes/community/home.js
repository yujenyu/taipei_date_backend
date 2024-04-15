import express from 'express';
import { community } from '../apiConfig.js';
import { getPosts, getSuggestUsers } from '../../services/index.js';

const router = express.Router();

router.get(community.getPosts, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 默認每頁12個貼文
    const results = await getPosts(page, limit);
    res.json(results);
});

router.get(community.getSuggestUsers, async (req, res) => {
    const results = await getSuggestUsers();
    res.json(results);
});

export default router;
