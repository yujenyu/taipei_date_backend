import db from '../../utils/mysql2-connect.js';

export const isLikedPost = async (postId, userId) => {
    const query = `SELECT EXISTS (SELECT 1 FROM comm_likes WHERE post_id = ? AND user_id = ?) AS isLiked`;
    const [results] = await db.query(query, [postId, userId]);
    // 返回一個布林值表示是否已收藏, 如果已收藏(===1)回傳 true
    return results[0].isLiked === 1;
};
