var express = require('express');
var router = express.Router();
var fs = require('fs');
var cheerio = require('cheerio');
var https = require('https');
let requests = require('requests') // 请求包
let path = require('path') // 定义文件路径
var dataUrl = "https://llh911001.gitbooks.io/mostly-adequate-guide-chinese/content/";
// 引入html-pdf 中间件，用户处理html文件转pdf文件
var pdf = require('html-pdf');

const htmlFile = "JS函数式编程.html"
const pdfFile = 'JS函数式编程.pdf'

/* GET home page. */
router.get('/', function (req, res, next) {
    getMainPart(dataUrl, true)
    res.render('index', { title: 'Express' });
});

// router.get('/test', function (req, res) {
//   requests('https://react.iamkasong.com/') // 请求路径
//     .on('data', function (chunk) {
//       fs.writeFile(path.resolve(__dirname, 'index.html'), chunk, () => { //将请求得到的资源文件写入本地项目文件夹下的index.html（名字可改）中
//         console.log("保存成功") // 数据爬取成功，输出“保存成功”
//       })
//     })
//     .on('end', function (err) {
//       if (err) return console.log('connection closed due to errors', err);
//       res.render('index', { title: 'Express' });
//       console.log('end');
//     });
// })

function getMainPart(url, isClear) {
    //准备抓取的网站链接
    https.get(url, function (res) {
        var str = "";
        //绑定方法，获取网页数据
        res.on("data", function (chunk) {
            str += chunk;
        })
        //数据获取完毕
        res.on("end", function () {
            // 获取main部分
            const data = getData(str, ".page-inner", true)
            if (isClear) {
                fs.writeFile(path.resolve(__dirname, htmlFile), initStyle() + data, () => { //将请求得到的资源文件写入本地项目文件夹下的index.html（名字可改）中
                    console.log("保存成功0", new Date().getTime()) // 数据爬取成功，输出“保存成功”
                    // 获取下一页
                    getNextMainPart(str)
                })
            } else {
                fs.appendFile(path.resolve(__dirname, htmlFile), data, () => { //将请求得到的资源文件写入本地项目文件夹下的index.html（名字可改）中
                    console.log("保存成功", new Date().getTime()) // 数据爬取成功，输出“保存成功”
                    // 获取下一页
                    const hasFinished = getNextMainPart(str)
                    if (hasFinished) {
                        const endHTML = `</body></html>`
                        fs.appendFile(path.resolve(__dirname, htmlFile), endHTML, () => { //将请求得到的资源文件写入本地项目文件夹下的index.html（名字可改）中
                            console.log("保存成功1", new Date().getTime()) // 数据爬取成功，输出“保存成功”
                            // 把html转pdf
                            htmlTopdf()
                        })
                    }
                })
            }
        })
    })
}

function initStyle() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>另一个主题</title>
    <link rel="stylesheet" href="https://llh911001.gitbooks.io/mostly-adequate-guide-chinese/content/gitbook/style.css">
</head>
<body>
`
}
//根据得到的数据，处理得到自己想要的
function getData(str, className, isToStr) {
    //沿用JQuery风格，定义$
    var $ = cheerio.load(str);
    //获取的数据数组
    var arr = $(className);
    if (arr && arr.length > 0) {
        main = arr[0]
        // 如果有图片，需要处理一下。补全url
        if (isToStr) {
            main = $.html(main)
            // 替换图片的url链接
            main = main.replace(/src=\"images/g, "src=\"" + dataUrl + "images")
        }
    }
    //遍历得到数据的src，并放入以上定义的数组中
    //返回出去
    return main;
}

let index = 1;
function getNextMainPart(str) {
    if (index <= 10) {
        console.log("下一页", dataUrl + "ch" + index + ".html")
        getMainPart(dataUrl + "ch" + index + ".html", false)
        index++;
        return false
    } else {
        return true
    }
}

function htmlTopdf() {
    var html = fs.readFileSync(path.resolve(__dirname, htmlFile), 'utf8');
    var options = { format: 'A4' };
    pdf.create(html, options).toFile(path.resolve(__dirname, pdfFile), function (err, res) {
        if (err) return console.log("???", err);
        console.log(res); // { filename: '/app/businesscard.pdf' }
    });
}

module.exports = router;
