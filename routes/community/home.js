import express from 'express';
import { community } from '../apiConfig.js';
import { getPosts } from '../../services/index.js';

const router = express.Router();

router.get(community.getPosts, async (_req, res) => {
    const results = await getPosts();
    res.json(results);
});

export default router;
