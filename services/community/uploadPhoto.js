import db from '../../utils/mysql2-connect.js';

export const uploadPhoto = async (photoName, postId, imageData) => {
    const [results] = await db.query(
        'INSERT INTO comm_photo (photo_name, post_id, img) VALUES (?, ?, ?)',
        [photoName, postId, imageData]
    );
    return results;
};
