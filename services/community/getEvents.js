import { db } from '../../utils/index.js';
import dayjs from 'dayjs';

export const getEvents = async () => {
    const [results] = await db.query('SELECT * FROM `comm_events`');

    const startDateFormat = 'YYYY[年] MM[月]DD[日] HH:mm';
    const endDateFormat = 'MM[月]DD[日] HH:mm';

    const formattedResults = results.map((event) => ({
        ...event,
        start_time: dayjs(event.start_time).format(startDateFormat),
        end_time: dayjs(event.end_time).format(endDateFormat),
    }));
    return formattedResults;
};
