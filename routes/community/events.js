import express from 'express';
import { community } from '../apiConfig.js';
import {
    getEvents,
    attendEvent,
    notAttendEvent,
    isAttendedEvent,
} from '../../services/index.js';

const router = express.Router();

router.get(community.getEvents, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // 默認每頁12個貼文
    const results = await getEvents(page, limit);
    res.json(results);
});

router.post(community.attendEvent, async (req, res) => {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文ID和用戶ID',
        });
    }

    try {
        const results = await attendEvent(eventId, userId);
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

router.delete(community.notAttendEvent, async (req, res) => {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文ID和用戶ID',
        });
    }

    try {
        const results = await notAttendEvent(eventId, userId);
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

router.get(community.isAttendedEvent, async (req, res) => {
    const { eventId, userId } = req.query;

    if (!eventId || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文ID和用戶ID',
        });
    }

    const isAttended = await isAttendedEvent(eventId, userId);
    res.json({ isAttended });
});

export default router;
