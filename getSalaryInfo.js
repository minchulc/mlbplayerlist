const puppeteer = require('puppeteer');
const fs = require('fs');


function practice() {
    let data = {};
    let aa = [...document.querySelectorAll('.player-item')].filter(elem => { return elem.classList.length === 1 });
    aa.forEach(elem => { data[elem.querySelector('strong').innerText.replace(":", "")] = elem.querySelector('span').innerText })
    data["name"] = document.querySelector(".player-name>h1").innerText;
    return data;
}

let getSalaryList = (async (team, name) => {
    let urlteam = team.toLowerCase().split(" ").join("-");
    let urlname = name.toLowerCase().split(" ").join("-").split(".").join("").split("'").join("").split(",").join("");
    const browser = await puppeteer.launch({ headless: !false });
    const page = await browser.newPage();
    await page.goto('https://www.spotrac.com/mlb/' + urlteam + '/' + urlname);
    let salaryDic = await page.evaluate(function (x) {
        function getSalary() {
            function getColumnName(idx) {
                let rows = [...document.querySelectorAll(".salaryRow")][0];
                return rows.querySelectorAll('th')[idx].innerText.trim();
            }
            function format(data) {
                if (data === undefined) return 0;
                data = data.trim();
                data = data.replace("$", "");
                while (true) {
                    data = data.replace(",", "");
                    if (data.indexOf(',') === -1) break;
                }
                if (!data || data === "-") {
                    data = 0;
                }
                data = Number(data)
                return isNaN(data) ? 0 : data;
            }
            let returnJSON = {};
            let rows = [...document.querySelectorAll(".salaryRow")];
            rows.splice(0, 1)
            rows.every((elem, index) => {
                let nnl = [...elem.querySelectorAll('td')];
                let newList = nnl.map((elem, index) => {
                    let key = getColumnName(index);
                    return { [key]: elem.innerText };
                });
                let obj2 = {};
                newList.forEach(elem => {
                    let keyname = Object.keys(elem)[0];
                    obj2[keyname] = elem[keyname];
                })
                if (obj2.YEAR) {
                    returnJSON[obj2.YEAR] = obj2;
                }
                if (nnl.length !== 0) return true;
            })
            let data = returnJSON;
            Object.keys(data).forEach(elem => {
                delete data[elem].YEAR;
                delete data[elem][''];
                data[elem]["AGE"] = Number(data[elem]["AGE"]);
                data[elem]["YEARLY CASH"] = (data[elem]["YEARLY CASH"]?.split("\n")[0])
                data[elem]["BASE SALARY"] = format(data[elem]["BASE SALARY"]);
                data[elem]["LUXURY TAX SALARY"] = format(data[elem]["LUXURY TAX SALARY"]);
                data[elem]["PAYROLL SALARY"] = format(data[elem]["PAYROLL SALARY"]);
                data[elem]["ADJUSTED SALARY"] = format(data[elem]["ADJUSTED SALARY"]);
                data[elem]["YEARLY CASH"] = format(data[elem]["YEARLY CASH"]);
            })
            return (data);
        }

        return getSalary();
    }, 100);
    await browser.close();
    console.log(salaryDic);
    return salaryDic;
});

let crawlInfo = (async (team, name) => {
    let urlteam = team.toLowerCase().split(" ").join("-");
    let urlname = name.toLowerCase().split(" ").join("-").split(".").join("").split("'").join("").split(",").join("");
    const browser = await puppeteer.launch({ headless: !false });
    const page = await browser.newPage();
    await page.goto('https://www.spotrac.com/mlb/' + urlteam + '/' + urlname);
    let rrr = await page.evaluate(function (x) {
        function getPlayerInfo() {
            let data = {};
            let aa = [...document.querySelectorAll('.player-item')].filter(elem => { return elem.classList.length === 1 });
            aa.forEach(elem => {
                data[elem.querySelector('strong').innerText.replace(":", "")] = elem.querySelector('span').innerText

            })
            data["name"] = document.querySelector(".player-name>h1").innerText;
            return data;
        }

        return {
            pathname: location.pathname,
            playerinfo: getPlayerInfo()
        };
    }, 100);
    await browser.close();
    return rrr;
});

let getPlayerList = (async (team) => {
    let urlteam = team.toLowerCase().split(" ").join("-");
    const browser = await puppeteer.launch({ headless: !false });
    const page = await browser.newPage();
    await page.goto('https://www.spotrac.com/mlb/' + urlteam + '/payroll');
    let rrr = await page.evaluate(function (x) {
        [...document.querySelectorAll('table.datatable.captotal')].forEach(el => el.remove());
        return [...new Set([...document.querySelectorAll('tbody td.player')].map(e => e.innerText.split('\n')[0].trim()))]
    }, 100);
    await browser.close();
    return rrr;
});

let getTeamList = (async (team) => {
    const browser = await puppeteer.launch({ headless: !false });
    const page = await browser.newPage();
    await page.goto('https://www.spotrac.com/mlb/');
    let rrr = await page.evaluate(function (x) {
        return [...document.querySelectorAll(".teamname.col-xs-10.col-md-4>h3>a")].map(elem => elem.innerText);
    }, 100);
    await browser.close()

    return rrr;
});




let careerEarning = (async (team, name) => {
    let urlteam = team.toLowerCase().split(" ").join("-");
    let urlname = name.toLowerCase().split(" ").join("-").split(".").join("").split("'").join("").split(",").join("");
    const browser = await puppeteer.launch({ headless: !false });
    const page = await browser.newPage();
    await page.goto('https://www.spotrac.com/mlb/' + urlteam + '/' + urlname + '/cash-earnings/');
    let salaryDic = await page.evaluate(function (x) {
        function format(data) {
            if (data === undefined) return 0;
            data = data.trim();
            data = data.replace("$", "");
            while (true) {
                data = data.replace(",", "");
                if (data.indexOf(',') === -1) break;
            }
            if (!data || data === "-") {
                data = 0;
            }
            data = Number(data)
            return isNaN(data) ? 0 : data;
        }

        function getColumnName() {
            let headRow = [...document.querySelectorAll(".earningstable>thead>tr")][0];
            let headName = [...headRow.querySelectorAll("th")];
            let returnList = headName.map(elem => { return (elem.innerText) });
            return returnList;
        }

        function getSalary() {
            let rows = [...document.querySelectorAll(".earningstable>tbody")][0];
            let yearByYearRows = [...rows.querySelectorAll("tr")];
            let obj = {};
            let headList = getColumnName();
            yearByYearRows.forEach((elem, index) => {
                let data = [...elem.querySelectorAll('td')].map(td => {

                    let logo = td.querySelector('img');
                    if (!logo) {
                        return td.innerText;
                    } else {
                        let addr = logo.getAttribute('src');
                        let split1 = addr.split('/');
                        return split1[split1.length - 1].split("_")[1].split(".")[0];
                    }
                });
                let innerObj = {};
                if (headList.length === data.length) {
                    headList.forEach((head, index) => {
                        innerObj[head] = data[index];
                    })
                    innerObj['YEAR'] = format(innerObj['YEAR']);
                    innerObj['SALARY'] = format(innerObj['SALARY']);
                    innerObj['SIGNING BONUS'] = format(innerObj['SIGNING BONUS']);
                    innerObj['INCENTIVE'] = format(innerObj['INCENTIVE']);
                    innerObj['TOTAL CASH'] = format(innerObj['TOTAL CASH']);
                    delete innerObj["Total Cash(Inflation Adj)"];

                    obj[data[0]] = innerObj;
                }
            });


            return obj
        }
        return getSalary();


    }, 100);
    await browser.close();

    return salaryDic;
});

let getTeamInfo = (async (teamname) => {
    let nameList = await getPlayerList(teamname);
    let list = nameList.map(name => {
        return {
            team: teamname,
            name
        };
    });
    for (let i = 0; i < list.length; i++) {
        let ob = list[i];
        let info = await crawlInfo(ob.team, ob.name);
        info["salaryInfo"] = await getSalaryList(ob.team, ob.name);
        info["salaryInfo1"] = await careerEarning(ob.team, ob.name);
        let filename = './data2/' + (info.pathname.split('/').join('_') + '.json')
        fs.writeFileSync(filename, JSON.stringify(info));
    }
    console.log('done');
});
// if (false) {
// 실제사용  
(async () => {
    let teamList = await getTeamList();
    for (let i = 0; i < teamList.length; i++) {
        let teamName = teamList[i].toLowerCase().split(" ").join("-");
        await getTeamInfo(teamName);
    }
})()
// }


//중복되는 데이터들 건너 뛰기 
if (false) {
    function aa() {
        let filesList = [];
        fs.readdir("/Users/minchulcho/Desktop/pp/data1", (err, files) => {
            if (err)
                console.log(err);
            else {
                // console.log("\nCurrent directory filenames:");
                files.forEach(file => {
                    // let name = ((file.split("_")[3]).split("-"))[0] + " &&" + ((file.split("_")[3]).split("-"))[0]
                    let name = ((file.split("_")[3]).split("-"));
                    name.pop()
                    filesList.push(name.join(" "));
                })
            }
            console.log(filesList);
        })

    }
    aa();
}

// (async () => {
//     console.log(await careerEarning('toronto-blue-jays', 'hyun-jin-ryu'));

// })()
