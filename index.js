// 1. 引入 express
import express from "express";
// 2. 建立 web server 物件
const app = express();
// 3. 路由
app.get('/', function (req, res) {
res.send('Hello World!');
});
// 4. Server 偵聽
app.listen(3001, function () {
console.log('啟動 server 偵聽埠號 3001');
});