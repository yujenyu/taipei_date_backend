import express from 'express';
import dayjs from 'dayjs';
import db from '../utils/mysql2-connect.js';
import upload from '../utils/upload-imgs.js';
import bcrypt from 'bcryptjs';

// 中介軟體，存取隱私會員資料用
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

router.use((req, res, next) => {
    // console.log('MW body:',req.body);
    next();
});

// 首頁-讀取個人單筆資料 API
// http://localhost:3001/account/1
router.get('/:sid', authenticate, async (req, res) => {
    // authenticate : 授權後，!req.my_jwt?.id判斷有無授權成功
    const output = {
        success: false,
        action: '', // add, remove
        error: '',
        code: 0,
    };
    if (!req.my_jwt?.id) {
        output.success = false;
        output.code = 430;
        output.error = '沒授權';
        return res.json(output);
    }

    let sid = +req.params.sid || 0;
    // console.log(+req.params.sid)
    const sql = `SELECT 
    user.*, 
    bt.bar_type_name, 
    mt.movie_type, 
    COALESCE(SUM(pi.points_increase), 0) - COALESCE(SUM(DISTINCT pd.points_decrease), 0) AS total_points 
FROM 
    member_user AS user 
LEFT JOIN 
    bar_type AS bt ON user.bar_type_id = bt.bar_type_id 
LEFT JOIN 
    booking_movie_type AS mt ON user.movie_type_id = mt.movie_type_id 
LEFT JOIN 
    member_points_inc AS pi ON user.user_id = pi.user_id 
LEFT JOIN 
    booking_points_dec AS pd ON user.user_id = pd.user_id 
WHERE 
    user.user_id=?`;
    const [rows] = await db.query(sql, [sid]);
    // console.log([rows]);

    // 檢查有沒有該筆資料時, 直接跳轉
    const checkSql = `SELECT COUNT(*) AS count FROM member_user WHERE user_id = ?`;
    const [checkResult] = await db.query(checkSql, [sid]);
    if (checkResult[0].count === 0) {
        output.success = false;
        output.code = 440;
        output.error = '沒有該筆資料';
        return res.json(output);
    }

    //處裡時間格式
    if (rows[0].birthday) {
        rows[0].birthday = dayjs(rows[0].birthday).format('YYYY-MM-DD');
    }

    //查詢今天有無登入過後獲得積分
    let hasLogin = false;
    const sqlGetFromLoginEveryday = `SELECT COUNT(*) AS count FROM member_points_inc WHERE user_id = ? AND reason = '登入獲得' AND DATE(created_at) = CURDATE() `;
    const [countGetFromLoginEveryday] = await db.query(
        sqlGetFromLoginEveryday,
        [sid]
    );
    if (
        countGetFromLoginEveryday.length > 0 &&
        countGetFromLoginEveryday[0].count > 0
    ) {
        hasLogin = true;
        // console.log(`---User ${sid} receive points for login.`);
    } else {
        // console.log(`----User ${sid} not get points from login yet!!`);
    }

    //查詢今天有無遊戲過後獲得積分
    let hasPlay = false;
    const sqlGetFromPlayEveryday = `SELECT COUNT(*) AS count FROM member_points_inc WHERE user_id = ? AND reason = '遊玩遊戲' AND DATE(created_at) = CURDATE() `;
    const [countGetFromPlayEveryday] = await db.query(sqlGetFromPlayEveryday, [
        sid,
    ]);

    if (
        countGetFromPlayEveryday.length > 0 &&
        countGetFromPlayEveryday[0].count > 0
    ) {
        hasPlay = true;
        // console.log(`---User ${sid} receive points for from playing today.`);
    } else {
        // console.log(`----User ${sid} not get points from playing yet!!`);
    }

    //response DATA
    res.json({
        success: true,
        data: rows[0],
        hasPlay: hasPlay,
        hasLogin: hasLogin,
    });
});

// 編輯-讀取編輯頁面的個人資料API
router.get('/edit/:sid', authenticate, async (req, res) => {
    // authenticate : 授權後，!req.my_jwt?.id判斷有無授權成功
    const output = {
        success: false,
        action: '', // add, remove
        error: '',
        code: 0,
    };
    if (!req.my_jwt?.id) {
        output.success = false;
        output.code = 430;
        output.error = '沒授權';
        return res.json(output);
    }

    let sid = +req.params.sid || 0;
    // console.log(+req.params.sid)
    const sql = `SELECT user.*,bt.bar_type_name,mt.movie_type,SUM(pi.points_increase) - SUM(DISTINCT pd.points_decrease) AS total_points
    FROM member_user AS user
    LEFT JOIN bar_type AS bt ON user.bar_type_id = bt.bar_type_id
    LEFT JOIN booking_movie_type AS mt ON user.movie_type_id = mt.movie_type_id
    LEFT JOIN member_points_inc AS pi ON user.user_id = pi.user_id
    LEFT JOIN booking_points_dec AS pd ON user.user_id = pd.user_id
    WHERE user.user_id=? `;
    const [rows] = await db.query(sql, [sid]);
    // console.log('編輯讀取: 使用者資料為:=>', rows);

    // 檢查有沒有該筆資料時, 直接跳轉
    const checkSql = `SELECT COUNT(*) AS count FROM member_user WHERE user_id = ?`;
    const [checkResult] = await db.query(checkSql, [sid]);
    if (checkResult[0].count === 0) {
        output.success = false;
        output.code = 440;
        output.error = '沒有該筆資料';
        return res.json(output);
    }

    //處裡時間格式
    if (rows[0].birthday) {
        rows[0].birthday = dayjs(rows[0].birthday).format('YYYY-MM-DD');
    }

    const sqlBarType = `SELECT bar_type_name FROM bar_type `;
    const [rows2] = await db.query(sqlBarType);
    const sqlMovieType = `SELECT movie_type FROM booking_movie_type `;
    const [rows3] = await db.query(sqlMovieType);

    //response DATA
    res.json({
        success: true,
        data: rows[0],
        barType: [rows2],
        movieType: [rows3],
    });
});

// 編輯-編輯個人資料API
router.put(`/edit/:sid`, async (req, res) => {
    let output = {
        success: false,
        bodyData: req.body,
        msg: '',
        errors: '',
    };

    // 查詢類型對照ID - 查詢酒吧類型
    const barTypeQuery = `SELECT bar_type_id FROM bar_type WHERE bar_type_name = '${req.body.fav1}'`;
    const [rows1] = await db.query(barTypeQuery);
    let barTypeId;
    if (rows1 && rows1.length > 0 && rows1[0].bar_type_id) {
        barTypeId = rows1[0].bar_type_id;
    } else {
        barTypeId = 0;
    }
    // 查詢類型對照ID - 查詢酒吧類型
    const movieTypeQuery = `SELECT movie_type_id FROM booking_movie_type WHERE movie_type = '${req.body.fav2}'`;
    const [rows2] = await db.query(movieTypeQuery);
    let movieTypeId;
    if (rows2 && rows2.length > 0 && rows2[0].movie_type_id) {
        movieTypeId = rows2[0].movie_type_id;
    } else {
        movieTypeId = 0;
    }

    //更新資料
    let sid = +req.params.sid || 0;
    const sql = `UPDATE member_user SET email = '${req.body.email}' , username = '${req.body.username}' , gender = '${req.body.gender}' , birthday = '${req.body.birthday}' , mobile = '${req.body.mobile}' , profile_content = '${req.body.profile}' , bar_type_id = '${barTypeId}' , movie_type_id = '${movieTypeId}' WHERE user_id=? `;

    try {
        const [result] = await db.query(sql, [sid]);
        output.success = !!result.changedRows;
        if (result.changedRows) {
            output.msg = '編輯成功';
        } else {
            output.msg = '沒有編輯';
        }
    } catch (error) {
        // console.log('error:', error);
    }

    res.json(output);
});

// 編輯-大頭照上傳，使用multer
router.post('/try-upload/:sid', upload.single('avatar'), async (req, res) => {
    let output = {
        success: false,
        bodyData: { body: req.body, file: req.file },
        msg: '',
    };
    // console.log();

    try {
        if (req.file) {
            let sid = +req.params.sid || 0;
            const data = { avatar: req.file.filename };
            const sql = `UPDATE member_user SET avatar = ? WHERE user_id = ?`;
            const result = await db.query(sql, [
                `http://localhost:${process.env.WEB_PORT}/avatar/${data.avatar}`,
                sid,
            ]);
            output.success = !!result[0].affectedRows;
            output.msg = output.success ? '照片上傳成功' : '照片上傳失敗';
        } else {
            output.msg = '未上傳照片';
        }

        res.json(output);
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, msg: '伺服器錯誤' });
    }
});

// 更改密碼API
router.put(`/change-password/:sid`, authenticate, async (req, res) => {
    // console.log('req:', req, 'req.jwt:', req.my_jwt);
    // console.log('req.jwt:', req.my_jwt);
    let output = {
        success: false,
        action: '', // add, remove
        data: {
            password: '',
            newPassword: '',
            confirmNewPassword: '',
        },
        msg: '',
        error: '',
        code: 0,
    };

    if (!req.my_jwt?.id) {
        output.success = false;
        output.code = 430;
        output.error = '沒授權';
        return res.json(output);
    }

    let { password, newPassword, confirmNewPassword } = req.body;

    if (!password || !newPassword || !confirmNewPassword) {
        output.error = '請填入資訊';
        output.code = 400;
        return res.json(output);
    }

    //做驗證，頭尾去掉空白
    password = password.trim();
    newPassword = newPassword.trim();
    confirmNewPassword = confirmNewPassword.trim();

    // 新舊密碼對照確認
    const sql = 'SELECT * FROM member_user WHERE user_id = ? ';
    const [rows] = await db.query(sql, [req.my_jwt.id]);
    if (!rows.length) {
        //rows沒有長度，代表沒此email，輸出420
        output.error = '無此使用者ID';
        output.code = 420;
        return res.json(output);
    }

    //判斷舊密碼輸入正確與否
    const result = await bcrypt.compare(password, rows[0].password_hash);
    if (!result) {
        output.error = '舊密碼有誤';
        output.code = 450;
        return res.json(output);
    }

    //判斷新舊密碼是否一樣
    if (password === newPassword) {
        output.error = '新密碼不可與舊密碼相同';
        output.code = 455;
        return res.json(output);
    }

    // 更新密碼
    if (newPassword === confirmNewPassword) {
        //新密碼生成HASH
        const newPassword_hash = await bcrypt.hash(newPassword, 12);

        const sql2 = `UPDATE member_user SET password_hash = '${newPassword_hash}' WHERE user_id=? `;
        try {
            const [result] = await db.query(sql2, [req.my_jwt.id]);
            console.log('db.query.result:', [result]);
            output.success = !!result.changedRows;
            if (result.changedRows) {
                output.msg = '密碼更改成功';
            } else {
                output.msg = '密碼未更改';
            }
        } catch (error) {
            console.log('error:', error);
        }
    }

    res.json(output);
});

//遊戲 - 紀錄上傳 - 新增 POST
router.post('/game-record-upload/:sid', authenticate, async (req, res) => {
    // authenticate : 授權後，!req.my_jwt?.id判斷有無授權成功
    let { gameScore, gameTime } = req.body;

    const output = {
        success: false,
        action: '', // add, remove
        error: '',
        code: 0,
        getPointPlay: false,
    };
    if (!req.my_jwt?.id) {
        output.success = false;
        output.code = 430;
        output.error = '沒授權';
        return res.json(output);
    }

    let sid = +req.my_jwt.id || 0;

    try {
        const sql = `INSERT INTO member_game_record (user_id, game_score, game_time) VALUES (?, ?, ?) `;
        const [result] = await db.query(sql, [sid, gameScore, gameTime]);
        console.log(!!result.affectedRows);
        if (!result.affectedRows) {
            output.error = '新增記錄失敗';
            return res.json(output);
        } else {
            //今天第一次玩獲得積分:
            const sqlGetFromPlayEveryday = `SELECT COUNT(*) AS count FROM member_points_inc WHERE user_id = ? AND reason = '遊玩遊戲' AND DATE(created_at) = CURDATE() `;
            const [countGetFromPlayEveryday] = await db.query(
                sqlGetFromPlayEveryday,
                [sid]
            );

            if (
                countGetFromPlayEveryday.length > 0 &&
                countGetFromPlayEveryday[0].count > 0
            ) {
                console.log(
                    `User ${sid} has already received points from playing today.`
                );
            } else {
                //今天第一次遊玩，拿到積分
                const sqlSetPointFromLogin = `INSERT INTO member_points_inc (user_id, points_increase, reason, created_at)
                VALUES (?, 10, '遊玩遊戲', NOW());`;
                const [setPoint] = await db.query(sqlSetPointFromLogin, [sid]);
                output.getPointPlay = true;
                console.log(`User ${sid} get points from playing!!`);
            }
        }

        output.code = 200;
        output.success = !!result.affectedRows;
        res.json(output);
    } catch (error) {
        console.log('game-record-error:', error);
    }
});

//紀錄列表
router.get('/record-point/:sid', authenticate, async (req, res) => {
    const output = {
        success: false,
        error: '',
        code: 0,
        data: [],
    };

    try {
        // console.log('myjwt record point:', req.my_jwt);
        console.log('req.query:', req.query);
        // req.query: { page: '3', sid: '1', pointSource: '遊戲獲得' }
        console.log('req.params:', req.params);
        // req.params: { sid: '1' }

        if (!req.my_jwt?.id) {
            output.success = false;
            output.code = 430;
            output.error = '沒授權';
            return res.json(output);
        }

        if (req.my_jwt?.id != req.params.sid) {
            output.success = false;
            output.code = 430;
            output.error = 'UserID不匹配';
            // console.log('發生:UserID不匹配');
            return res.json(output);
        }
        console.log('UserID匹配成功');

        let sid = req.my_jwt?.id || 0;

        let page = +req.query.page || 1;
        console.log('+req.query.page:', page);

        let where = ' WHERE 1 ';
        console.log('where:', where);

        let source = req.query.pointSource || '';

        if (source === '登入獲得' || source === '遊玩遊戲') {
            const sourceEsc = db.escape(source);
            where += ` AND ( \`reason\` LIKE ${sourceEsc}  )`;
        }
        console.log('where after source:', where);

        // let keyword = req.query.keyword || '';

        // if (keyword) {
        //     const keywordEsc = db.escape('%' + keyword + '%');
        //     where += ` AND ( \`reason\` LIKE ${keywordEsc}  )`;
        // }

        // if (keyword) {
        //     // where += ` AND ab. \`name\` LIKE '%${keyword}%' `; // 錯誤的寫法會有 SQL injection 的問題
        //     const keywordEsc = db.escape('%' + keyword + '%');
        //     // where += ` AND \`name\` LIKE ${keywordEsc} `; //單一SEARCH
        //     where += ` AND ( \`reason\` LIKE ${keywordEsc}  )`;
        // }

        //日期篩選
        const dateFormat = 'YYYY/MM/DD';
        let date_begin = req.query.date_begin || '';
        let date_end = req.query.date_end || '';

        if (dayjs(date_begin, dateFormat, true).isValid()) {
            date_begin = dayjs(date_begin).format(dateFormat);
        } else {
            date_begin = '';
        }
        if (dayjs(date_end, dateFormat, true).isValid()) {
            date_end = dayjs(date_end).format(dateFormat);
        } else {
            date_end = '';
        }

        //日期SQL語法新增到where
        if (date_begin) {
            where += ` AND \`created_at\` >=  '${date_begin}' `;
        }
        if (date_end) {
            where += ` AND \`created_at\` <=  '${date_end}' `;
        }

        //判斷頁面是否低於第一頁，有的話跳回第一頁
        if (page < 1) {
            const newQuery = { ...req.query, page: 1 };
            const qp = new URLSearchParams(newQuery).toString();
            const redirectUrl = `${req.originalUrl.split('?')[0]}?${qp}`; // 構建完整的重定向 URL
            console.log('輸入頁面小於1，qp:', qp);
            return res.redirect(redirectUrl); // 執行重定向
        }

        const perPage = 10;
        //當每頁10個，判斷總筆數
        const total_sql_point = `SELECT COUNT(1) totalRows FROM member_points_inc ${where} AND user_id = ${sid}`;
        console.log('total_sql_point 是:', total_sql_point);
        const [[{ totalRows }]] = await db.query(total_sql_point);
        console.log('總筆數是:', totalRows);

        let rows = [];
        let totalPages = 0;
        if (totalRows > 0) {
            //計算總頁數，並且判斷當前頁面有無超過總頁數，有的話跳轉到最後一頁
            totalPages = Math.ceil(totalRows / perPage);

            // console.log('totalPages:', totalPages);
            if (page > totalPages) {
                const newQuery = { ...req.query, page: totalPages };
                const qp = new URLSearchParams(newQuery).toString();
                const redirectUrl = `${req.originalUrl.split('?')[0]}?${qp}`; // 構建完整的重定向 URL
                console.log('輸入頁面超過總頁數了，qp:', qp);
                console.log('Redirecting to:', redirectUrl);
                return res.redirect(redirectUrl); // 執行重定向
            }
            console.log('頁面判斷過在正常範圍:', page);
            console.log('總頁數為:', totalPages);

            let sort = req.query.sortDate || 'DESC';
            console.log('日期排序方向:', sort);

            //放入SQL
            const sqlPoint = `SELECT * 
            FROM member_points_inc 
            ${where} AND user_id=${sid} 
            ORDER BY created_at ${sort} 
            LIMIT ${(page - 1) * perPage} , ${perPage}`;
            console.log('最後執行的要得SQL:', sqlPoint);
            console.log('準備好SQL，要跟DB要的位於第幾頁:', page);
            [rows] = await db.query(sqlPoint);
        }
        // console.log('跟DB要的數據:', [rows]);

        // const sqlPoint = `SELECT * FROM member_points_inc WHERE user_id=?`;
        // const [rowsPoint] = await db.query(sqlPoint, [sid]);
        // console.log([rowsPoint]);

        //沒筆數的話 輸出error 無相關紀錄
        if (rows.length === 0) {
            output.code = 440;
            output.error = '無相關紀錄';
            output.data = [];
            return res.json({ success: false, output });
        }

        //將日期轉成YYYY/MM/DD
        const formattedRowsPoint = rows.map((row, i) => ({
            ...row,
            created_at: dayjs(row.created_at).format(dateFormat),
        }));
        // console.log(formattedRowsPoint);

        output.success = true;
        output.data = formattedRowsPoint;
        output.code = 200;
        res.json({
            success: true,
            sid,
            totalRows,
            page,
            totalPages,
            perPage,
            query: req.query,
            output,
        });
    } catch (error) {
        console.error('Error in /record-point/:sid:', error);
        output.success = false;
        output.code = 500;
        output.error = '伺服器錯誤';
        res.status(500).json({ success: false, output });
    }
});

export default router;
