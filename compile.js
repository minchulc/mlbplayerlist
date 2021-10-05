/*
mysql -u root -p
ssh -i /Users/minchulcho/Documents/Keys/mChoKey.cer ubuntu@mlbplayerlist.com
ALTER TABLE teamInfo ADD COLUMN leagueId INT AFTER name;

// col 새로 만들 그 col에 값 넣기 
INSERT INTO teamInfo (leagueId) VALUES (104) WHERE id = 108;
UPDATE teamInfo SET leagueId = 104 WHERE id = 143;

*/
const DivSeriesJuly2W_COL = require('./mymodule/datasort.js');

const promisify = require('util.promisify');
let express = require('express');
let shelljs = require('shelljs');
let fs = require('fs');
const app = express()
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', './views');
let scp = require("st-cookie-parser")
const bcrypt = require('bcrypt');
const query = require('st-mysql')({ host: 'localhost', user: 'root', password: '1234', database: 'MLBplayList', flat: true, encode: false });
let fetch = require('node-fetch');
const neatCsv = require('neat-csv');
const isLogin = require("./isLogin.js");

var HTMLParser = require('node-html-parser');

app.use(require('./birds'));
app.use(require('./admin'));


function today_() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    return today;
}

/* 
- 아래 함수에 첫번째 인자로 쓰인 정규식은 모든 주소가 아래의 함수로 들어 오게 한다. 
- next는 response를 해주지 않고 아래의 함수로 이동 하게 함. 
- 이를 이용하여 필요한 값을 선언 할 수 있다. constructor와 비슷한 기능  
*/
app.get(/^\/.*/, function (req, res, next) {
    req.abc = 'abcd';
    res.setHeader('ABC', '123');
    next();
});
// 0524 수업 내용
app.get('/zzz1', function (req, res, next) {
    res.send(req.abc);
});

/* 
원본 데이터를 한 게임으로 나누어 주는 코드 
*/
app.get('/loaddocument', async function (req, res) {
    let database = await promisify(fs.readFile)('data/2019/playByplay/july2.json');
    database = JSON.parse(database.toString());

    /* 
    ?gameID=565461
    2019-07-15 : 565430 1차전 
    2019-07-15 : 565461 2차전 
    2019-07-16 : 565462  
    2019-07-17 : 565463 
    */
    let newDocument = [];
    database.forEach(game => {
        if (game.game_pk === req.query.gameID) {
            newDocument.push(game);
        }
    })
    /* 
        // 새로운 데이터를 다른 파일로 저장해주는 코드.   
        */
    await promisify(fs.writeFile)('data/2019/playByplay/' + req.query.gameID + '.json', JSON.stringify(newDocument));
    res.send('newDocument')
})
app.get('/gameSearch', async function (req, res) {
    res.send(fs.readFileSync("mlbWEB/sfGameSearch.html").toString());
});


app.get('/loadGameRecord', async function (req, res) {
    if (false) {
        let fs = require('fs');
        const promisify = require('util.promisify');
        const DivSeriesJuly2W_COL = require('./mymodule/datasort.js');
        (async () => {
            let data = await promisify(fs.readFile)('data/2019/playByplay/july2.json');
            let list = JSON.parse(data.toString());
            let pks = {};
            list.forEach(gu => { pks[gu.game_pk] = true; });
            let pkt = {};
            list.forEach(gu => { pkt[gu.pitcher_team] = true; });
            pkt = Object.keys(pkt);
            pks = Object.keys(pks);
            let promises = [];
            pkt.forEach(team => {
                pks.forEach(pk => {
                    let filename = `${pk}.${team}.json`;
                    let data = JSON.stringify(list.filter(gu => gu.game_pk === pk && gu.pitcher_team === team));
                    let promise = promisify(fs.writeFile)('data/2019/playByplay/' + filename, data);
                    promises.push(promise);
                });
            });
            let result = await Promise.all(promises);
            console.log(result);
            console.log('end');
        })();

    }
    if (false) {
        /*
        형식 --> 데이터를 분리 해서 사용 할 수 있는 
        */
        let result = {};
        // [req.query.team1, req.query.team2]

        {
            let withCOL = new DivSeriesJuly2W_COL();
            await withCOL.loadData('data/2019/playByplay/' + req.query.pk + '.' + req.query.team1 + '.json');
            let ebh = await withCOL.extraBaseHits_(null, 10);
            let hp = await withCOL.hardestPitches(null, 10);
            result[req.query.team1] = { ebh, hp };
        }
        {
            let withCOL = new DivSeriesJuly2W_COL();
            await withCOL.loadData('data/2019/playByplay/' + req.query.pk + '.' + req.query.team2 + '.json');
            let ebh = await withCOL.extraBaseHits_(null, 10);
            let hp = await withCOL.hardestPitches(null, 10);
            result[req.query.team2] = { ebh, hp };

        }
    }
    if (false) {
        /*
        2019-07-15 : 565430 1차전 
        2019-07-15 : 565461 2차전 
        2019-07-16 : 565462  
        2019-07-17 : 565463 
        */
    }




    let withCOL = new DivSeriesJuly2W_COL();
    /* 
    나중에 사용자가 입력한 gameID로 JSON파일 search하기 "req.query.gameID"
    'data/2019/playByplay/july2.json' --> 'data/2019/playByplay/'+ req.query.gameID + 'json'
    await withCOL.loadData('data/2019/playByplay/july2.json');
    */

    await withCOL.loadData('data/2019/playByplay/' + req.query.gameID + '.json');
    await withCOL.pichingInfo();
    res.send({
        scoreBox: await withCOL.scoreBoard(),
        players: await withCOL.battinfInfo(),
        teamlist: await withCOL.teamInfo(),
        ops: await withCOL.OPSatScoring()
    });
});

app.get('/gamesbydate', async function (req, res) {
    /*
        https://mlbplayerlist.com/gamebydate?date=2021-JUN-06
        */
    let aaa = new GamesByDate();
    console.log(await aaa.hello());
    res.end();
});

app.get('/getTeamOPS', async function (req, res) {
    let withCOL = new DivSeriesJuly2W_COL();
    await withCOL.loadData('data/2019/playByplay/july2.json');
    let totalBattingRecord = await withCOL.OPSatScoring();
    res.send(totalBattingRecord);
});

/*
********************************************************************************
DATABASE  
*********************************************************************************
*/
app.get('/sortServer', async function (req, res) {
    /* 
        - Synctax for query 
            Ori : await query ( 'SELECT * FROM 21season ORDER BY abv DESC');
            Regular expression : let order = await query(`SELECT * FROM 21season_1 order by ${req.query.orderkey} ${orderkey[req.query.ordermode]}`);
    */

    if (req.query.orderkey === '') {
        let order = await query('SELECT * FROM 21season_1 order by desc abv ');
        res.send(order);
    } else {
        let orderkey = {
            d: 'desc',
            a: 'asc'
        };
        let order = await query(`SELECT * FROM 21season_1 order by ${req.query.orderkey} ${orderkey[req.query.ordermode]}`);
        res.send(order);
    }
});

app.get('/search', async function (req, res) {
    /*
    - See the REQ VALUE In QUERY 
    req.query.pid 
    */
    let order = await query(`SELECT * FROM 21season_1 WHERE pid =  ${req.query.pid} `);
    console.log(order);
    res.send(order);
});

async function pIDCheck(pid) {
    let test = await query('SELECT pid FROM 21season_1 ');
    let found = false;
    for (let i = 0; i < test.length; i++) {
        if (test[i]["pid"] === pid) {
            found = true;
        }
    }
    return found;
}


app.get('/upload', async function (req, res) {
    let idList = await query('SELECT * FROM 21PListTEST;');
    let urlAddress = 'https://statsapi.mlb.com/api/v1/people/';
    let urlDetail = '?hydrate=currentTeam,team,stats(type=[yearByYear,yearByYearAdvanced,careerRegularSeason,careerAdvanced,availableStats](team(league)),leagueListId=mlb_hist)&site=en';

    for (let i = 0; i < idList.length; i++) {
        let pID = idList[i]["pid"];
        if (!await pIDCheck(pID)) {
            url = (urlAddress + pID + urlDetail);
            let aa = await fetch(url);
            aa = await aa.json()

            let player = aa["people"][0]
            let id = player["id"];

            let simpleStat = player["stats"][0]["splits"];
            let hitOrPit = player["stats"][0]["group"];

            let lastSeaon = (player["stats"][0]["splits"]).length - 1;
            let s2021 = player["stats"][0]["splits"][lastSeaon];
            let getSeason = s2021["season"];
            let s21Stats = s2021["stat"];

            let game = (s21Stats["gamesPlayed"]);
            let pName = player["fullName"];
            let team = player["currentTeam"]["abbreviation"];
            let atBats = s21Stats["atBats"];

            let qres = await query('insert into 21season_1 (pid, pName, team, atBats, hits,homeRuns, rbi, bb, abv, ops ) value (?, ?, ?, ?,?, ?, ?, ? , ?,?   )', [pID, player["fullName"], player["currentTeam"]["abbreviation"], s21Stats["atBats"], (s21Stats["hits"]), (s21Stats["homeRuns"]), (s21Stats["rbi"]), (s21Stats["baseOnBalls"]), (s21Stats["avg"]), (s21Stats["ops"])]);
            console.log(pID, Math.round((i / idList.length) * 100));

        } else {
            console.log(pID, 'exists');
        }
    }
    res.end();
});

app.get('/create', async function (req, res) {
    //CREATE MySQL TALBE
    await query('CREATE TABLE 21season ( pid INT(10) UNSIGNED  PRIMARY KEY,team VARCHAR(30) ,atBats INT(7),hits FLOAT(7),homeRuns INT(7), rbi INT(7), bb INT(7), abv FLOAT(7), ops FLOAT(7) );');
});


app.get('/authtest', async function (req, res) {
    if (await isLogin(req)) {
        //sdfgdsfg
        res.send({ result: true });
    } else {
        res.send({ error: true });
    }
});


app.get('/name2id', function (req, res) {
    // let conext; 
    let iter = 0;
    fs.readFile('./data.json', function (err, data) {
        if (data) {
            function valuedFormat(inputValue) {
                inputValue = inputValue.toLowerCase();
                inputValue = inputValue.replace(" ", "");
                return inputValue;
            }
            function getID(playerName, _data) {
                if (playerName === "") {
                    return -3;
                }
                let _id;

                for (let i = 0; i < _data.length; i++) {
                    if (valuedFormat(_data[i]["name"]) === playerName) {
                        _id = _data[i]["id"]
                        return _id;
                    }
                }
                return -1;
            }
            let playerName = valuedFormat(req.query.name);
            let _data = JSON.parse(data.toString())

            if (getID(playerName, _data) === -1) {
                for (let iter = 1; iter < 2; iter++) {
                    path_ = './data_' + iter.toString() + '.json';
                    reCheck(path_);
                }
            }
            res.send({ id: getID(playerName, _data) });
        }
    });

    function reCheck(path_) {
        fs.readFile(path_, function (err, data) {
            if (data) {
                function valuedFormat(inputValue) {
                    inputValue = inputValue.toLowerCase();
                    inputValue = inputValue.replace(" ", "");
                    return inputValue;
                }
                function getID(playerName, _data) {
                    if (playerName === "") {
                        return -3;
                    }
                    let _id;
                    for (let i = 0; i < _data.length; i++) {
                        if (valuedFormat(_data[i]["name"]) === playerName) {
                            _id = _data[i]["id"]
                            return _id;
                        }
                    }
                    return -1;
                }
                let playerName = valuedFormat(req.query.name);

                let _data = JSON.parse(data.toString())
                res.send({ id: getID(playerName, _data) })
            }
        });
    }
})

app.get('/listTotal', function (req, res) {
    fs.readFile('./data.json', function (err, data) {
        if (data) {
            let _data = JSON.parse(data.toString())
            let totalLength = _data.length
            res.send({ totalLength: totalLength })
        }
    });

})

app.get('/index.js', function (req, res) {
    res.setHeader('Content-Type', 'application/js');
    fs.readFile("./mlbWEB/index.js", function (aa, bb) {
        if (aa === null) {
            res.send(bb.toString())
        }
    });
});

app.get('/index.css', async function (req, res) {
    res.setHeader('Content-Type', 'text/css');
    let data = await new Promise(function (resolve, reject) {
        fs.readFile("mlbWEB/index.css", function (error, _data) {
            resolve(_data);
        });
    });
    res.send((data).toString())
});

app.use('/sres', express.static(__dirname + '/static'));
/* 
__dirname = 환경 변수
*/
app.get('/admin.js', function (req, res) {
    res.setHeader('Content-Type', 'application/js');
    fs.readFile("./mlbWEB/admin.js", function (aa, bb) {
        if (aa === null) {
            res.send(bb.toString())
        }
    });
});






/*
Check tables in MySQL 
*/
app.get(['/list/:ordermode/:column/:type', '/list/:ordermode/:column/'], function (req, res) {

    console.log(req.params.type);
    /* 
    // 테스트용 코드 
    (async () => {
        console.log(await query('show tables'));
        console.log(await query('select * from 21season'))
        })();
    */

    res.send(fs.readFileSync("mlbWEB/index.html").toString());
});
app.get(['/admin/:ordermode/:column/:type', '/admin/:ordermode/:column/'], function (req, res) {

    res.send(fs.readFileSync("mlbWEB/admin.html").toString());
});


false && ['/list/:ordermode/:column/:type', '/list/:ordermode/:column/'].forEach(path => app.get(path, function (req, res) {
    console.log(req.params.type);
    (async () => {
        // console.log(await query('show tables'));
        // console.log(await query('select * from 21season'))
    })();
    res.send(fs.readFileSync("mlbWEB/index.html").toString());
}));


app.get('/', function (req, res) {
    res.send(fs.readFileSync("mlbWEB/index.html").toString());
});
/* 
    특정한 값을, <%=user%>와 같은, 입력하고 치환 해서 화면에 뿌려 줄 수 있다. 
*/
app.get('/ejs', function (req, res) {
    res.render('index', { user: 'ABC' });
});
// 0524 수업 내용
app.use('/abc', express.static('mlbWEB/index.html'));

app.get('/send', function (req, res) {
    res.sendFile(__dirname + '/mlbWEB/index.html');
});



/*
    Add new player with id in table "pList1"
    await query('insert into pList1 (pid, name) value (?, ?)', [572041, 'AJ Pollock']);
*/
app.get('/addPlayers', async function (req, res) {
    let newPlayerList;
    try {
        let result = await promisify(fs.readFile)('mlbWEB/2020player.json');
        newPlayerList = JSON.parse(result.toString());
        // let part1 = 800;
        // let part2 = newPlayerList.length - 800;
        for (let i = 0; i < newPlayerList.length; i++) {
            newPlayerList[i]["num"] = parseInt(newPlayerList[i]["num"]);
        }
        for (let i = 0; i < newPlayerList.length; i++) {
            await query('INSERT INTO 21PListTEST (pid, name) value (?, ?)', [newPlayerList[i]["num"], newPlayerList[i]["name"]]);
        }
    } catch (e) {
    }
})


app.get('/makeCSV', async function (req, res) {
    let data = await promisify(fs.readFile)('mlbWEB/2008.csv');
    data = await neatCsv(data);
    res.end()
});



app.get('/gameResult', function (req, res) {
    let gameID = req.query.gameID;
    let code = fs.readFileSync("mlbWEB/sfGameSearch.html").toString();
    code = code.replace("9999", gameID);
    res.send(code);
});

app.get('/scorepage', function (req, res) {

    res.send(fs.readFileSync("mlbWEB/scorePage.html").toString());
});

app.get('/bringData', async function (req, res) {
    let data = await promisify(fs.readFile)('data/2019/playByplay/july2.json');
    data = (JSON.parse(data.toString()));
    res.end(); l
});
// 0524 수업 내용
app.get('/err', function (req, res) {
    asdfasfd.asdfas;
});

async function createTable() {
    if (false) {
        let name = "teamsInfo";
        let createTalbe = `
        create table teamInfo(
            id int(8) NOT NULL,
            name TEXT NOT NULL,
            fileCode VARCHAR(255) NOT NULL,
            locationName VARCHAR(255) NOT NULL,
            color LONGTEXT,
            logo LONGTEXT,
            PRIMARY KEY ( id )
         );
        `;
        await query(createTalbe);
    }
    else {
        await new Promise((resolve, reject) => {
            let command = "python3 teaminfo.py";
            shelljs.exec(command, async function (code, stdout, stderr) {
                let teamInfo = JSON.parse(stdout);

                for (let i = 0; i < teamInfo.length; i++) {
                    let team = teamInfo[i];
                    let id = team.id;
                    let name = team.name;
                    let fileCode = team.fileCode;
                    let locationName = team.locationName;
                    let color = JSON.stringify(team.color);
                    let logo = team.logo;
                    console.log([id, name, fileCode, locationName, color, logo]);
                    let result = await query('INSERT INTO teamInfo(id, name, fileCode,locationName, color, logo) value (?, ?, ?, ?, ?, ? )', [id, name, fileCode, locationName, color, logo]);
                    console.log(result);

                }
                resolve();
            });
        })
    }


}
async function getTeamInfo(keyword) {
    let result
    if (isNaN(keyword)) {
        result = await query(`select * from teamInfo where name=?`, [keyword]);
    } else {
        result = await query(`select * from teamInfo where id=?`, [keyword]);
    }
    return result[0]
}


if (false) {
    app.get('/teamRoster', async function (req, res) {
        let command = "python3 mlb.py " + req.query.playerNames;
        shelljs.exec(command, async function (code, stdout, stderr) {
            let jsonPlayerList = JSON.parse(stdout)
            for (let i = 0; i < jsonPlayerList.length; i++) {
                let teamInfo = await getTeamInfo(jsonPlayerList[i].teamId);
                jsonPlayerList[i].teamInfo = teamInfo;
            }

            res.render('playerSearch', { jsonPlayerList });
        });
    });
}

app.get('/playersearch', async function (req, res) {
    // createTable();
    let teamInfoList = await query(`select * from teamInfo`);
    res.render('playersearchBar', { teamInfoList });
});

app.get('/playersearch1', async function (req, res) {
    // createTable();
    let teamInfoList = await query(`select * from teamInfo`);
    res.render('playersearchpage', { teamInfoList });
});


app.get('/pirates', async function (req, res) {
    let teamInfoList = await query(`select * from teamInfo`);
    let teamid = 134;
    let command = `python3 ranksLink.py ${teamid}`;
    shelljs.exec(command, async function (code, stdout, stderr) {
        let ranksLink = JSON.parse(stdout)
        res.render('pirates', { teamInfoList, ranksLink });
    });
});

app.get('/cardinals', async function (req, res) {
    let teamInfoList = await query(`select * from teamInfo`);
    let teamid = 138;
    let command = `python3 ranksLink.py ${teamid}`;
    shelljs.exec(command, async function (code, stdout, stderr) {
        let ranksLink = JSON.parse(stdout)
        res.render('cardinals', { teamInfoList, ranksLink });
    });
});

app.get('/redsox', async function (req, res) {
    let teamInfoList = await query(`select * from teamInfo`);
    let teamid = 111;
    let command = `python3 ranksLink.py ${teamid}`;
    shelljs.exec(command, async function (code, stdout, stderr) {
        let ranksLink = JSON.parse(stdout)
        res.render('redsox', { teamInfoList, ranksLink });
    });
});

app.get('/teamSearch', async function (req, res) {
    console.log(req.query.teamId);
    let command = "python3 getRpster.py " + req.query.teamId;
    shelljs.exec(command, async function (code, stdout, stderr) {
        let jsonPlayerList = JSON.parse(stdout)
        for (let i = 0; i < jsonPlayerList.length; i++) {
            let teamInfo = await getTeamInfo(jsonPlayerList[i].teamId);
            jsonPlayerList[i].teamInfo = teamInfo;
        }

        res.render('playerSearch', { jsonPlayerList, today: today_() });
    });
});




app.get('/test', async function (req, res) {
    res.send(req.query.playerid)

});



app.get('/teamPage', async function (req, res) {
    // console.log(req.query.teamId);
    let teamid = req.query.teamId;
    let data = await query(`select * from teamInfo where id = ${teamid}`);
    let teamInfo = data[0];

    let command = `python3 ranksLink.py ${req.query.teamId}`;

    shelljs.exec(command, async function (code, stdout, stderr) {
        let ranksLink = JSON.parse(stdout)

        console.log("------------------------------------------------------------------");
        (ranksLink.hrs).forEach(x => {
            // console.log ( x["playerInfo"][0]["id"] )
            console.log('***************');
            console.log(x);
            console.log( Object.keys(x["playerInfo"][0]));
        })

        res.render('teamPage', { teamInfo, ranksLink });
    });
});

function getshortName(awayTeamInfo) {
    let teamName = awayTeamInfo["name"].split(' ')
    return teamName[teamName.length - 1];
}

app.get('/schedule', async function (req, res) {
    let teamid = req.query.teamId;
    if (!teamid) {
        teamid = 000;
    }
    let teamInfo = await getTeamInfo(teamid);
    let command = `python3 schedule.py ${teamid}`;
    shelljs.exec(command, async function (code, stdout, stderr) {
        let gamesInfo = JSON.parse(stdout)
        for (let i = 0; i < gamesInfo.length; i++) {
            let awayTeamInfo = await getTeamInfo(gamesInfo[i].away_id);
            awayTeamInfo["shortName"] = getshortName(awayTeamInfo)
            gamesInfo[i].awayTeamInfo = awayTeamInfo;

            let homeTeamInfo = await getTeamInfo(gamesInfo[i].home_id);
            homeTeamInfo["shortName"] = getshortName(homeTeamInfo)
            gamesInfo[i].homeTeamInfo = homeTeamInfo;
        }
        if (teamid === 000) {
            res.render('schedule', { gamesInfo, teamInfo });
        } else {
            res.render('teamSchedule', { gamesInfo, teamInfo });
        }

    });
});

app.get('/teamSchedule', async function (req, res) {
    //req.query.teamId
    let command = "python3 teamSchedule.py";
    shelljs.exec(command, async function (code, stdout, stderr) {
        let gamesInfo = JSON.parse(stdout)
        console.log(gamesInfo);
        for (let i = 0; i < gamesInfo.length; i++) {
            let awayTeamInfo = await getTeamInfo(gamesInfo[i].away_id);
            awayTeamInfo["shortName"] = getshortName(awayTeamInfo)
            gamesInfo[i].awayTeamInfo = awayTeamInfo;

            let homeTeamInfo = await getTeamInfo(gamesInfo[i].home_id);
            homeTeamInfo["shortName"] = getshortName(homeTeamInfo)
            gamesInfo[i].homeTeamInfo = homeTeamInfo;
            // console.log( gamesInfo[i]["winning_pitcher"] )
        }
        res.render('schedule', { gamesInfo });
    });
});


//let qres = await query('insert into 21season_1 (pid, pName, team, atBats, hits,homeRuns, rbi, bb, abv, ops ) value (?, ?, ?, ?,?, ?, ?, ? , ?,?   )', [pID, player["fullName"], player["currentTeam"]["abbreviation"], s21Stats["atBats"], (s21Stats["hits"]), (s21Stats["homeRuns"]), (s21Stats["rbi"]), (s21Stats["baseOnBalls"]), (s21Stats["avg"]), (s21Stats["ops"])]);
//searchResult
app.get('/searchResult', async function (req, res) {
    if (req.query.playerInfo === undefined) {
        let command = "python3 getPlayerInfo.py " + req.query.playerName;
        shelljs.exec(command, async function (code, stdout, stderr) {
            let jsonPlayerList = JSON.parse(stdout)
            for (let i = 0; i < jsonPlayerList.length; i++) {
                let teamInfo = await getTeamInfo(jsonPlayerList[i].teamId);
                jsonPlayerList[i].teamInfo = teamInfo;
            }
            res.render('playerSearch', { jsonPlayerList, today: today_() });
        });
    } else {
        let playerID = req.query.playerInfo;
        let command = "python3 pDetail.py " + playerID;
        shelljs.exec(command, async function (code, stdout, stderr) {
            let yearByYearStats = JSON.parse(stdout)
            for (let i = 0; i < yearByYearStats.length; i++) {
                let teamInfo = await getTeamInfo(yearByYearStats[i].teamId);
                yearByYearStats[i].teamInfo = teamInfo;
            }
            res.render('pDetail', { yearByYearStats });
        });
    }
});





// 0524 수업 내용
app.use(function (req, res, next) {
    res.status(404).send('not found');
});
// 0524 수업 내용
app.use(function (err, req, res, next) {
    console.log(err);
    console.log(err.stack);
    res.status(500).send('server error!!!');
});


app.listen(3000)



