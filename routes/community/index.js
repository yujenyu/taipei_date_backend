import eventsRouter from './events.js';
import postRouter from './home.js';
import profileRouter from './profile.js';
import createRouter from './create.js';

const communityRouter = {
    eventsRouter,
    postRouter,
    profileRouter,
    createRouter,
};

export default communityRouter;
