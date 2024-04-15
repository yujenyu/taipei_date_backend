import express from 'express';
import fileUpload from 'express-fileupload';
import { community } from '../apiConfig.js';
import { uploadPhoto, createPost } from '../../services/index.js';

const router = express.Router();

// 啟動檔案上傳
router.use(
    fileUpload({
        createParentPath: true,
    })
);

router.post(community.createPost, async (req, res) => {
    const { context, userId } = req.body;

    // 檢查 context 和 userId 是否存在
    if (!context || !userId) {
        return res.status(400).json({
            status: false,
            message: '必須提供貼文內容和用戶ID',
        });
    }

    try {
        const postId = await createPost(context, userId);
        res.status(201).json({
            status: true,
            message: '貼文新增成功',
            postId: postId,
        });
    } catch (err) {
        console.error('新增貼文錯誤:', err);
        res.status(500).json({
            status: false,
            message: '貼文新增失敗',
            error: err.message,
        });
    }
});

router.post(community.uploadPhoto, async (req, res) => {
    try {
        if (!req.files || !req.body.postId) {
            return res.status(400).send({
                status: false,
                message: '必須提供照片和貼文ID',
            });
        }

        // 使用輸入框的名稱來獲取上傳檔案 (例如 "photo")
        let photo = req.files.photo;
        let postId = req.body.postId; // 從請求中獲取 postId

        // 檢查 photo 是否存在
        if (!photo) {
            return res.status(400).send({
                status: false,
                message: '未上傳照片',
            });
        }

        try {
            // 讀取文件內容
            const photoName = photo.name;
            const imageData = photo.data;

            // 模擬將文件信息和內容儲存到數據庫中的函數（需自行實現該函數）
            const result = await uploadPhoto(photoName, postId, imageData);

            res.json({
                status: true,
                message: '檔案已上傳並儲存到數據庫',
                data: {
                    name: photo.name,
                    mimetype: photo.mimetype,
                    size: photo.size,
                },
            });
        } catch (err) {
            console.error('檔案上傳到數據庫過程中出錯:', err);
            res.status(500).json({
                status: false,
                message: 'Server error',
                error: err.message,
            });
        }
    } catch (err) {
        console.error('處理請求過程中出錯:', err);
        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message,
        });
    }
});

export default router;
