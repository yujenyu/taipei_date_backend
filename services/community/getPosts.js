import { db } from '../../utils/index.js';

export const getPosts = async () => {
    const query = `
    SELECT posts.*, photos.photo_name, photos.img 
    FROM comm_post AS posts
    LEFT JOIN comm_photo AS photos ON posts.post_id = photos.post_id
    ORDER BY post_id DESC`;
    const [results] = await db.query(query);
    // 將 BLOB 數據轉換為 Base64 字符串

    const posts = results.map((post) => {
        if (post.img) {
            const imageBase64 = Buffer.from(post.img).toString('base64');
            return {
                ...post,
                img: `data:image/jpeg;base64,${imageBase64}`,
            };
        }
        return post;
    });
    return posts;
};
