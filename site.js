
var username = document.querySelector("#username")
var xp = document.querySelector("#xp")
var audits = document.querySelector("#audits")
var ratio = document.querySelector("#ratio")
var name = "Rasmushytt"

var xpchart = document.getElementById("xpchart")
var attemptchart = document.getElementById("attemptchart")

let XPArray
let XPDateArray
let upArray
let downArray
let pathArray

let condition = true

const url = "https://01.kood.tech/api/graphql-engine/v1/graphql"
startSearch()

async function startSearch() {
    if (condition) { // so that quick, repetitive calls won't be a problem
        condition = false
        XPDateArray = []
        XPArray = []
        upArray = []
        downArray = []
        pathArray = []
        
        getUsername()
        await getTransactions()
        await getProgress()
        console.log(upArray)
        if (username.innerHTML != "No user found.") {
            buildCharts()
        }
        condition = true
    }
}
function getUsername() {
    fetch(url, {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({query: "{user(where:{login:{_eq:" + this.name + "}}){login}}"})
    })
    .then(res => res.json())
    .then((r) => username.innerHTML = r.data["user"][0]["login"] + " kood/Jõhvi stats with grapghQL")
    .catch((r) => {username.innerHTML = "No user found."; xp.innerHTML = ""; ratio.innerHTML = ""; audits.innerHTML = "", xpchart.innerHTML = "", attemptchart.innerHTML = ""})
}

async function getTransactions() {
    let offset = 0
    let loop = true

    // since pulling more than 50 entries at once is impossible...
    while (loop) {
        await fetch(url, {
            method: "POST",
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({query: "{user(where:{login:{_eq:" + this.name + "}}){transactions(where:{type:{_in:[up, down, xp]}} offset:" + offset + "){type amount createdAt}}}"})
        })
        .then(res => res.json())
        .then((r) => r.data["user"][0]["transactions"].length != 0 ?
            (r.data["user"][0]["transactions"].forEach((e) => e["type"] == "up" ? upArray.push(e["amount"]) : 
                (e["type"] == "down" ? downArray.push(e["amount"]) : (XPDateArray.push(Date.parse(e["createdAt"])), XPArray.push(e["amount"])))))
                    : r.reject())
        .then((r) => offset += 50)
        .catch((r) => loop = false)
    }
    if (upArray.length > 0 || downArray.length > 0 || XPArray.length > 0) {
        let XP = XPArray.reduce((v1, v2) => v1 + v2)
        xp.innerHTML = "Total XP: " + XP

        audits.innerHTML = "Audits done: " + upArray.length

        let upAmount = upArray.reduce((v1, v2) => v1 + v2, 0)
        let downAmount = downArray.reduce((v1, v2) => v1 + v2, 0)
        ratio.innerHTML = "Audit ratio: " + Math.round(upAmount / downAmount * 10) / 10
    }
}

async function getProgress() {
    let offset = 0
    let loop = true

    while (loop) {
        await fetch(url, {
            method: "POST",
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({query: "{user(where:{login:{_eq:" + this.name + "}}){progresses(offset:" + offset + ") {path}}}"})
        })
        .then(res => res.json())
        .then((r) => r.data["user"][0]["progresses"].length != 0 ?
            r.data["user"][0]["progresses"].forEach((e) => pathArray.push(e["path"]))
                : r.reject())
        .then((r) => offset += 50)
        .catch((r) => loop = false)
    }
}

function buildCharts() {
    let XPGainArray = Array.from(XPArray)
    XPGainArray.reduce((v1, v2, i) => XPGainArray[i] = v1 + v2)

    let occurrences = {}
    for (const path of pathArray) {
        occurrences[path] = (occurrences[path] || 0) + 1
    }
    let occurrenceCount = Object.values(occurrences)
    let projects = Object.keys(occurrences)
    console.log(projects)

    google.charts.load('current', {packages: ['corechart', 'bar']})
    google.charts.setOnLoadCallback(drawCharts)

    function drawCharts() {
        var data1 = new google.visualization.DataTable()
        var data2 = new google.visualization.DataTable()

        data1.addColumn('datetime', 'Time')
        data1.addColumn('number', 'XP')
        
        data2.addColumn('string', 'Projects')
        data2.addColumn('number', 'Attempts')
        
        for (var i = 0; i < XPDateArray.length; i++) {
            var row = [new Date(XPDateArray[i]), XPGainArray[i]]
            data1.addRow(row)
        }
        
        for (var i = 0; i < projects.length; i++) {
            var row = [projects[i], occurrenceCount[i]]
            data2.addRow(row)
        }
        data2.sort([{column:1}])

        var chart1 = new google.visualization.LineChart(xpchart)
        var chart2 = new google.visualization.ColumnChart(attemptchart)

        var optionsXP = {
            hAxis: {
                title:'Time',
                format:'MM YYYY',
                colors: ['red'],
            },
            vAxis: {
                title: 'XP',
                colors: ['red'],
            },
            fontSize: 20,
            height: 300,
            colors: ['red'],
            backgroundColor: 'powderblue',
        
        };
        var optionsAttempts = {
            hAxis: {
                title:'Sorted Chart of Attempts',
                textPosition: 'none',
            },
            
            fontSize: 18,
            height: 700,
            colors: ['red'],
            backgroundColor: 'powderblue'
        };
        chart1.draw(data1, optionsXP)
        chart2.draw(data2, optionsAttempts)
    }
}