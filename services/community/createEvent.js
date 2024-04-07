import { db } from '../../utils/index.js'

export const createEvents = async () => {
    const [results] = await db.query(
        'INSERT INTO `comm_events` (`title`, `description`, `status`, `location`, `user_id`, `start_time`, `end_time`) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    return results
}
