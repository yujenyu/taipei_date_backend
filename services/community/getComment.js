import db from '../../utils/mysql2-connect.js';

export const getComment = async (postId) => {
    const qeury = `
    SELECT 
        comment.context, 
        comment.post_id, 
        comment.user_id,
        users.email,
        users.username
    FROM 
        comm_comment AS comment
    LEFT JOIN 
        member_user AS users 
    ON 
        comment.user_id = users.user_id
    WHERE 
        post_id = ?`;
    const [results] = await db.query(qeury, [postId]);
    return results;
};
