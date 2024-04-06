import express from 'express'
import mysql from 'mysql2/promise'
import cors from 'cors'

// 建立 web server 物件
const app = express()

// 使用 CORS 允許跨域請求
app.use(cors())

// comm_events
app.get('/api/comm-events', async (req, res) => {
    try {
        // Create the connection to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'taipei_date',
        })

        // A simple SELECT query
        const [results] = await connection.query('SELECT * FROM `comm_events`')

        // console.log(results) // results contains rows returned by server

        // Send the results back to the client
        res.json(results)
    } catch (err) {
        console.log(err)
        res.status(500).send('Error fetching data from the database')
    }
})

// 自訂的頂層的 middlewares
app.use((req, res, next) => {
    res.locals.title = 'Taipei-Date'
    res.locals.pageName = 'Community'
    res.locals.session = req.session // 讓 ejs 可以使用 session
    res.locals.originalUrl = req.originalUrl

    // 處理 JWT token
    const auth = req.get('Authorization')

    // ***** 只用在測試用戶 *****
    req.my_jwt = {
        id: 3,
        account: 'yujenyu@yujenyu.com',
    }

    next()
})

// 路由
app.get('/', function (req, res) {
    res.send('Taipie Date')
})

// 這個路由只接受 GET 方法, 路徑要為/
// app.get('/', (req, res) => {
//   res.locals.title = 'Home - ' + res.locals.title
//   res.render('home', { name: 'yujenyu' })
// })

// Server 偵聽
const port = process.env.WEB_PORT || 3002
app.listen(port, () => {
    console.log(`伺服器啟動 使用通訊埠 ${port}`)
})
