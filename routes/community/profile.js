import express from 'express';
import { community } from '../apiConfig.js';
import {
    getPosts,
    getUserPosts,
    getFollows,
    getCountPosts,
    getUserInfo,
} from '../../services/index.js';

const router = express.Router();

router.get(community.getPosts, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 默認每頁12個貼文
    const results = await getPosts(page, limit);
    res.json(results);
});

router.get(community.getUserPosts, async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 默認每頁12個貼文
    const results = await getUserPosts(userId, page, limit);
    res.json(results);
});

router.get(community.getFollows, async (req, res) => {
    const { userId } = req.params;
    const results = await getFollows(userId, userId);
    res.json(results);
});

router.get(community.getCountPosts, async (req, res) => {
    const { userId } = req.params;
    const results = await getCountPosts(userId);
    res.json(results);
});

router.get(community.getUserInfo, async (req, res) => {
    const { userId } = req.params;
    const results = await getUserInfo(userId);
    res.json(results);
});

export default router;
