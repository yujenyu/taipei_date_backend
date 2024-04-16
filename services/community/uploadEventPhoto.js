import db from '../../utils/mysql2-connect.js';

export const uploadEventPhoto = async (photoName, eventId, imageData) => {
    const [results] = await db.query(
        'INSERT INTO comm_events_photo (photo_name, comm_event_id, img) VALUES (?, ?, ?)',
        [photoName, eventId, imageData]
    );
    return results;
};
