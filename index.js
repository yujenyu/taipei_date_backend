import express from 'express';
import cors from 'cors';
import { communityRouter } from './routes/index.js';

// 建立 web server 物件
const app = express();

// 使用 CORS 允許跨域請求
app.use(cors());

// 這行碼使 express 能夠解析 JSON 格式的請求體
app.use(express.json());

app.use(
    '/community',
    communityRouter.eventsRouter,
    communityRouter.postRouter,
    communityRouter.profileRouter,
    communityRouter.createRouter,
    communityRouter.exploreRouter
);
// app.use('/community', communityRouter.postRouter);

// app.app // 自訂的頂層的 middlewares
//     .use((req, res, next) => {
//         res.locals.title = 'Taipei-Date'
//         res.locals.pageName = 'Community'
//         res.locals.session = req.session // 讓 ejs 可以使用 session
//         res.locals.originalUrl = req.originalUrl

//         // 處理 JWT token
//         const auth = req.get('Authorization')

//         // ***** 只用在測試用戶 *****
//         req.my_jwt = {
//             id: 3,
//             account: 'yujenyu@yujenyu.com',
//         }

//         next()
//     })

// 路由
app.get('/', function (req, res) {
    res.send('Taipie Date');
});

// 這個路由只接受 GET 方法, 路徑要為/
// app.get('/', (req, res) => {
//   res.locals.title = 'Home - ' + res.locals.title
//   res.render('home', { name: 'yujenyu' })
// })

// Server 偵聽
const port = process.env.WEB_PORT || 3002;
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
