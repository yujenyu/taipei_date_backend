import db from '../../utils/mysql2-connect.js';

export const createEvent = async (
    title,
    description,
    status,
    location,
    userId,
    startDate,
    startTime,
    endDate,
    endTime
) => {
    const [results] = await db.query(
        `INSERT INTO comm_events(title ,description, status, location, user_id, start_date, start_time, end_date, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            title,
            description,
            status,
            location,
            userId,
            startDate,
            startTime,
            endDate,
            endTime,
        ]
    );
    return results;
};
