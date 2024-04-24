import eventsRouter from './events.js';
import postRouter from './home.js';
import profileRouter from './profile.js';
import createRouter from './create.js';
import exploreRouter from './explore.js';
import searchRouter from './search.js';

const communityRouter = {
    eventsRouter,
    postRouter,
    profileRouter,
    createRouter,
    exploreRouter,
    searchRouter,
};

export default communityRouter;
