import { db } from '../../utils/index.js'

export const getEvents = async () => {
    const [results] = await db.query('SELECT * FROM `comm_events`')
    return results
}
