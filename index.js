// 引入 express
import express from 'express';
import session from 'express-session'; // express-session是一個middleware，需要把它寫在路由之前
import mysqlSession from 'express-mysql-session'; // 可以將登入資訊存入mysql資料庫
import db from './utils/mysql2-connect.js';
import cors from 'cors';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import accountRouter from './routes/account.js';

// 中介軟體，存取隱私會員資料用
import authenticate from './middlewares/authenticate.js';
// 存取`.env`設定檔案使用
import 'dotenv/config.js';

import {
    communityRouter,
    // tripRouter,
    // barRouter,
    // dateRouter,
} from './routes/index.js';

const MysqlStore = mysqlSession(session);
const sessionStore = new MysqlStore({}, db);

// 建立 web server 物件
const app = express();

//top-level middleWare
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//cor設定 (Shinder版)
const corsOption = {
    credentials: true,
    origin: (origin, callback) => {
        callback(null, true);
    },
};
app.use(cors(corsOption));

//cor設定 (Eddy版)
// cors設定，參數為必要，注意不要只寫`app.use(cors())`
// app.use(
//     cors({
//         origin: ['http://localhost:3000', 'https://localhost:9000'],
//         methods: ['GET', 'POST', 'PUT', 'DELETE'],
//         credentials: true,
//     })
// );

// 自訂的頂層的 middlewares
app.use((req, res, next) => {
    res.locals.title = 'Taipei Date的網站';
    res.locals.pageName = '';
    res.locals.session = req.session; // 讓 ejs 可以使用 session
    res.locals.originalUrl = req.originalUrl; // 頁面所在的路徑

    next(); // 這個一定要有
});

// 路由
app.get('/', (req, res) => {
    res.locals.title = '首頁 - ' + res.locals.title;
    res.locals.pageName = 'Taipei Date';

    res.render('home', { name: 'Taipei Date' });
});

//註冊樣版引擎
//"view engine" 是指用於處理和渲染視圖（View）的模板引擎。
app.set('view engine', 'ejs');

app.use(
    session({
        //強制將未初始化的session存回 session store，未初始化的意思是它是新的而且未被修改。
        saveUninitialized: true,
        //強制將session存回 session store, 即使它沒有被修改。預設是 true
        resave: true,
        secret: 'kdjfsk94859348JHGJK85743',
        store: sessionStore,
        //cookie: {
        //  maxAge: 1200_000,
        //}
    })
);

app.use('/account', accountRouter);

// bar branch
// app.use(
//     '/bar',
//     barRouter.barListRouter,
//     barRouter.barDetailRouter,
//     barRouter.barRatingRouter
// );

//loginCheck
// 檢查登入狀態用
app.get('/login-check/', authenticate, async (req, res) => {
    const sid = req.query?.sid;
    // console.log('when u login-check, JWT-ID:', req.my_jwt?.id);
    // console.log('when u login-check,  sid:', sid);

    // 1.確認收到my_jwt.id
    if (!req.my_jwt?.id) {
        return res.json({ success: false, code: 430, error: '沒授權TOKEN' });
    }
    const jid = req.my_jwt?.id;
    // 2.比對my_jwt.id 有沒有等於 動態路由來的sid
    if (jid.toString() !== sid.toString()) {
        return res.json({ success: false, code: 430, error: 'UserID不匹配' });
    }
    // 3.查詢資料庫目前的資料:確認此id有無存在資料庫
    const sql = `SELECT * FROM member_user WHERE user_id = ? `;
    const [rows] = await db.query(sql, [jid]);

    // console.log('when u login-check,rows:"', rows);
    if (rows.length === 0) {
        return res.json({
            result: false,
            error: '沒有此user_id',
            msg: '沒有此user_id',
        });
    }

    return res.json({ success: true, msg: '確認成功，有Token，UserID也符合' });
});

//JWT測試路由
// app.get('/jwt-data', authenticate, async (req, res) => {
//     // res.send(req.get('Authorization')); //token
//     if (!req.my_jwt) {
//         return res.json({
//             status: 'error',
//             message: '授權失敗，沒有存取令牌',
//         });
//     }
//     res.json(req.my_jwt);
//     // res.send(req.get('Authorization'));
// });

//登入(JWT)
app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    const output = {
        success: false,
        error: '',
        code: 0,
        data: {
            id: '',
            email: '',
            password: '',
            username: '',
            token: '',
            getPointLogin: false,
        },
    };

    //若沒有填寫，會顯示"請填寫登入資訊"
    // console.log('Received email:', email);
    // console.log('Received password:', password);
    if (!email || !password) {
        output.error = '請填寫登入資訊';
        output.code = 400;
        return res.json(output);
    }

    //做驗證，頭尾去掉空白
    email = email.trim();
    password = password.trim();

    //對照資料庫，有無此筆email
    const sql = 'SELECT * FROM member_user WHERE email = ? ';
    const [rows] = await db.query(sql, [email]);
    if (!rows.length) {
        //rows沒有長度，代表沒此email，輸出420
        output.error = '無相關帳號';
        output.code = 420;
        return res.json(output);
    }

    //對照資料庫，有此筆email，但為google帳號
    if (rows[0].google_uid !== null) {
        output.error = '此電子郵件已使用Google登入註冊過，請更換Google帳號登入';
        return res.json(output);
    }

    // console.log(rows[0]);
    //驗證輸入密碼與資料庫密碼有無符合，符合為true並於session設置用戶資訊，不符和為false並輸出450
    const result = await bcrypt.compare(password, rows[0].password_hash);
    if (result) {
        output.success = result;
        let row = rows[0];

        const token = jwt.sign(
            {
                id: row.user_id,
                email: row.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '3d',
            }
        );

        output.data = {
            id: row.user_id,
            email: row.email,
            username: row.username,
            token,
            getPointLogin: false,
        };

        //登入獲得積分:
        const sqlGetFromLoginEveryday = `SELECT COUNT(*) AS count FROM member_points_inc WHERE user_id = ? AND reason = '登入獲得' AND DATE(created_at) = CURDATE() `;
        const [countGetFromLoginEveryday] = await db.query(
            sqlGetFromLoginEveryday,
            [row.user_id]
        );

        if (
            countGetFromLoginEveryday.length > 0 &&
            countGetFromLoginEveryday[0].count > 0
        ) {
            console.log(
                `User ${row.user_id} has already received points for login today.`
            );
        } else {
            //今天第一次登入，拿到積分
            const sqlSetPointFromLogin = `INSERT INTO member_points_inc (user_id, points_increase, reason, created_at)
            VALUES (?, 10, '登入獲得', NOW());`;
            const [setPoint] = await db.query(sqlSetPointFromLogin, [
                row.user_id,
            ]);
            output.data = {
                id: row.user_id,
                email: row.email,
                username: row.username,
                token,
                getPointLogin: true,
            };
            console.log(`User ${row.user_id} get points from login!!`);
        }
    } else {
        output.error = '密碼有錯誤';
        output.code = 450;
    }

    res.json(output);
});

//註冊
app.post('/register', async (req, res) => {
    let { username, email, password } = req.body;
    // console.log(req.body,username,email,password)
    const output = {
        success: false,
        bodyData: {
            username: ' ',
            email: ' ',
            password: ' ',
        },
        error: '', //錯誤消息存在這裡
        code: 0,
    };

    let isPass = true;
    if (!username || !email || !password) {
        output.error = '請填寫註冊資訊';
        output.code = 460;
        isPass = false;
        return res.json(output);
    }

    //做驗證，頭尾去掉空白
    email = email.trim();
    password = password.trim();

    //對照資料庫，有無此筆email
    const sql = 'SELECT * FROM member_user WHERE email = ? ';
    const [rows] = await db.query(sql, [email]);
    if (rows.length) {
        output.error = '已註冊過此電子郵件';
        output.code = 470;
        isPass = false;
        return res.json(output);
    }

    if (isPass) {
        // req.body.created_at = new Date();
        try {
            //密碼生成HASH
            const password_hash = await bcrypt.hash(password, 12);
            //帶入資料庫
            const sql2 = `INSERT INTO member_user(username, email, password_hash) VALUES (?, ?, ? ) `;
            const [result] = await db.query(sql2, [
                username,
                email,
                password_hash,
            ]);

            output.success = true;
            output.bodyData.username = req.body.username;
            output.bodyData.email = req.body.email;

            // console.log('final:' ,  output);
            return res.json(output);
        } catch (ex) {
            console.log('錯誤:' + ex);
            output.error = '註冊時發生錯誤';
            output.code = 500;
            output.success = false;
            return res.json(output);
        }
    }
});

//google-login
app.post('/google-login', async (req, res, next) => {
    // 回傳給前端的資料

    const output = {
        success: false,
        error: '',
        code: 0,
        data: null,
    };

    try {
        const { displayName, email, uid, photoURL } = req.body;
        const google_uid = uid;

        if (!google_uid) {
            return res.status(400).json({ error: '缺少Google登入資料' });
        }

        // // 以下流程:
        // // 1. 先查詢資料庫是否有同google_uid的資料
        // // 2-1. 有存在 -> 執行登入工作
        // // 2-2. 不存在 -> 建立一個新會員資料(無帳號與密碼)，只有google來的資料 -> 執行登入工作

        // 1. 先查詢資料庫是否有同google_uid的資料
        const [rows] = await db.query(
            'SELECT * FROM member_user WHERE google_uid = ?',
            [google_uid]
        );

        let userData;

        // // 2-1. 有存在 -> 執行登入工作
        if (rows.length > 0) {
            userData = rows[0];
        } else {
            // 2-2-1. 如果用戶不存在，則創建新用戶
            const insertUserQuery =
                'INSERT INTO member_user(google_uid ,username, email, avatar) VALUES (?, ?, ?, ?)';
            const [insertUserResult] = await db.query(insertUserQuery, [
                google_uid,
                displayName,
                email,
                photoURL,
            ]);

            //2-2-2. 重新從資料庫獲取剛創建的用戶
            const [newUserRows] = await db.query(
                'SELECT * FROM member_user WHERE user_id = ?',
                [insertUserResult.insertId]
            );
            userData = newUserRows[0];
        }

        //3. 檢查今日是否已經登錄過，如果沒有，則添加積分
        const [loginCountRows] = await db.query(
            'SELECT COUNT(*) AS count FROM member_points_inc WHERE user_id = ? AND reason = "登入獲得" AND DATE(created_at) = CURDATE()',
            [userData.user_id]
        );

        if (loginCountRows[0].count === 0) {
            const insertPointsQuery =
                'INSERT INTO member_points_inc (user_id, points_increase, reason, created_at) VALUES (?, 10, "登入獲得", NOW())';
            await db.query(insertPointsQuery, [userData.user_id]);
            userData.getPointLogin = true;
        } else {
            userData.getPointLogin = false;
        }

        //4. 要加到access token中回傳給前端的資料
        //存取令牌(access token)只需要id和username就足夠，其它資料可以再向資料庫查詢
        const token = jwt.sign(
            { id: userData.user_id, email: userData.email },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        output.success = true;
        output.code = 200;
        output.data = {
            id: userData.user_id,
            username: userData.username,
            google_uid: userData.google_uid,
            email: userData.email,
            avatar: userData.avatar,
            token: token,
            getPointLogin: userData.getPointLogin,
        };

        return res.json(output);
    } catch (error) {
        console.error('Google登入時發生錯誤:', error);
        output.error = 'Google登入時發生錯誤';
        output.code = 500;
        return res.status(500).json(output);
    }
});

// For Community Page
app.use(
    '/community',
    communityRouter.eventsRouter,
    communityRouter.postRouter,
    communityRouter.profileRouter,
    communityRouter.createRouter,
    communityRouter.exploreRouter,
    communityRouter.searchRouter,
    communityRouter.postPageRouter
);

// For Trip plans page
// app.use(
//     '/trip',
//     tripRouter.tripPlansRouter,
//     tripRouter.myDetailsRouter,
//     tripRouter.otherTripRouter,
//     tripRouter.contentMorningRouter,
//     tripRouter.contentNoonRouter,
//     tripRouter.contentNightRouter,
//     tripRouter.myBarPhotoRouter,
//     tripRouter.myMoviePhotoRouter,
//     tripRouter.barNameRouter,
//     tripRouter.editShareRouter,
//     tripRouter.editUnshareRouter
// );

// For Date page
// app.use(
//     '/date',
//     dateRouter.barTypeRouter,
//     dateRouter.bookingMovieTypeRouter,
//     dateRouter.friendListRouter,
//     dateRouter.friendshipsMessageRouter,
//     dateRouter.userInterestRouter
// );

// For Bar Branch
// app.use(
//     '/bar',
//     barRouter.barListRouter,
//     barRouter.barListAuthRouter,
//     barRouter.barAreaRouter,
//     barRouter.barTypeRouter,
//     barRouter.barDetailRouter,
//     barRouter.barRatingRouter
// );

/* ************** 其他的路, 放在這行之前 *********** */
// 靜態內容的資料夾

app.use('/', express.static('public'));

// server 偵聽
const port = process.env.WEB_PORT || 3002;
app.listen(port, () => {
    console.log(`Server Started at http://localhost:${port}`);
});

/* 404 頁面 */
app.use((req, res) => {
    res.status(404).send(`<h2>404 走錯路了</h2>`);
});
