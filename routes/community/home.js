import express from 'express';
import { community } from '../apiConfig.js';
import {
    getPosts,
    getSuggestUsers,
    savePost,
    unsavePost,
    isSavedPost,
    likePost,
    unlikePost,
    isLikedPost,
} from '../../services/index.js';

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

router.post(community.savePost, async (req, res) => {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文ID和用戶ID',
        });
    }

    try {
        const results = await savePost(postId, userId);
        return res.status(201).json({
            status: true,
            message: '收藏貼文成功',
            data: results,
        });
    } catch (err) {
        console.error('收藏貼文錯誤:', err);
        res.status(500).json({
            status: false,
            message: '收藏貼文失敗',
            error: err.message,
        });
    }
});

router.delete(community.unsavePost, async (req, res) => {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文ID和用戶ID',
        });
    }

    try {
        const results = await unsavePost(postId, userId);
        return res.status(201).json({
            status: true,
            message: '移除收藏貼文成功',
            data: results,
        });
    } catch (err) {
        console.error('移除收藏貼文錯誤:', err);
        res.status(500).json({
            status: false,
            message: '移除收藏貼文失敗',
            error: err.message,
        });
    }
});

router.get(community.isSavedPost, async (req, res) => {
    const { postId, userId } = req.query;

    if (!postId || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文ID和用戶ID',
        });
    }

    const isSaved = await isSavedPost(postId, userId);
    res.json({ isSaved });
});

router.post(community.likePost, async (req, res) => {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文ID和用戶ID',
        });
    }

    try {
        const results = await likePost(postId, userId);
        return res.status(201).json({
            status: true,
            message: '喜愛貼文成功',
            data: results,
        });
    } catch (err) {
        console.error('喜愛貼文錯誤:', err);
        res.status(500).json({
            status: false,
            message: '喜愛貼文失敗',
            error: err.message,
        });
    }
});

router.delete(community.unlikePost, async (req, res) => {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文ID和用戶ID',
        });
    }

    try {
        const results = await unlikePost(postId, userId);
        return res.status(201).json({
            status: true,
            message: '移除喜愛貼文成功',
            data: results,
        });
    } catch (err) {
        console.error('移除喜愛貼文錯誤:', err);
        res.status(500).json({
            status: false,
            message: '移除喜愛貼文失敗',
            error: err.message,
        });
    }
});

router.get(community.isLikedPost, async (req, res) => {
    const { postId, userId } = req.query;

    if (!postId || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文ID和用戶ID',
        });
    }

    const isLiked = await isLikedPost(postId, userId);
    res.json({ isLiked });
});

export default router;
