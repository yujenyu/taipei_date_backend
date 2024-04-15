import db from '../../utils/mysql2-connect.js';

export const createPost = async (context, userId) => {
    const [results] = await db.query(
        `INSERT INTO comm_post(context, user_id) VALUES (?, ?)`,
        [context, userId]
    );
    return results;
};
