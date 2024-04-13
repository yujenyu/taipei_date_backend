import express from 'express';
import fileUpload from 'express-fileupload';
import { community } from '../apiConfig.js';

const router = express.Router();

// 啟動檔案上傳
router.use(
    fileUpload({
        createParentPath: true,
    })
);

router.post(community.uploadPhoto, async (req, res) => {
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded',
            });
        } else {
            //使用輸入框的名稱來獲取上傳檔案 (例如 "photo")
            let photo = req.files.photo;

            // 檢查 photo 是否存在
            if (!photo) {
                res.status(400).send({
                    status: false,
                    message: 'No photo uploaded',
                });
                return;
            }

            //使用 mv() 方法來移動上傳檔案到要放置的目錄裡 (例如 "uploads")
            photo.mv('./uploads/' + photo.name);

            //送出回應
            res.json({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: photo.name,
                    mimetype: photo.mimetype,
                    size: photo.size,
                },
            });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
