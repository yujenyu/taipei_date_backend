import express from 'express';
import { community } from '../apiConfig.js';
import {
    getPosts,
    getComments,
    getSuggestUsers,
    savePost,
    unsavePost,
    likePost,
    unlikePost,
    checkPostStatus,
} from '../../services/index.js';

const router = express.Router();

router.get(community.getPosts, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 默認每頁12個貼文
    const results = await getPosts(page, limit);
    res.json(results);
});

router.get(community.getComments, async (req, res) => {
    const { postIds } = req.query;
    if (!postIds) {
        return res.status(400).json({
            status: false,
            message: '需要提供 postIds',
        });
    }
    const postIdArray = postIds.split(',').map((id) => parseInt(id.trim()));
    const results = await getComments(postIdArray);
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

router.get(community.checkPostStatus, async (req, res) => {
    const { userId, postIds } = req.query;
    if (!userId || !postIds) {
        return res.status(400).json({
            status: false,
            message: '需要提供 userId 和 postIds',
        });
    }
    const postIdArray = postIds.split(',').map((id) => parseInt(id.trim()));
    const results = await checkPostStatus(userId, postIdArray);
    res.json(results);
});

export default router;
