const express = require('express');
const fs = require("fs");
const app = express();

app.use(express.json());

let clientInfo = require("./clientInfo.json"); // read client information from file 
let meetingInfo = require("./meetingInfo.json"); // read meeting information from file

// store updated information into a json file
function updateInfo(dst, clientInfoJson){
    fs.writeFile(dst, clientInfoJson, 'utf8', function(err){
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("JSON file has been saved.");
    })
}


// randomly generate a string from A-Z a-z 0-9
function generateMeetingId(length){
    charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    charSetLen = charSet.length;
    result = "";
    for(let i=0; i<length; i++){
        result += charSet.charAt(Math.floor(Math.random()*charSetLen));
    }
    return result;
}


function login(req){
    const account = req.body.account;
    const password = req.body.password;
    if (clientInfo[account]!=undefined && clientInfo[account]["Password"]==password){
        console.log(account, "login detail correct")
        return clientInfo[account];
    }else{
        console.log(account, "login detail false")
        return false;
    }
}

function register(req){
    const account = req.body.account;
    const password = req.body.password;
    const username = req.body.username;
    if(clientInfo[account]==undefined){
        let newClient = {
            "Username":username,
            "Password":password,
            "Rank":"User",
            "Meetings":[]
        };
        clientInfo[account] = newClient;  // add new client information to clientInfo
        clientInfoJson = JSON.stringify(clientInfo); 
        updateInfo("update_clientInfo.json", clientInfoJson); // update the json file that store clientInfo
        console.log("New user account created:",account);
        return true;
    }else{
        console.log(account,"existed. Registration failed.")
        return false;
    }
}

app.post("/register", function(req, res){
    if (register(req)){
        res.status(200).json({"result": "success"});
    }else{
        res.status(401).json({'result': 'fail'});
    }
});

app.post('/login', function (req, res){
    const user = login(req);
    if (user!=false){
        const username = user["Username"];
        const rank = user["Rank"];
        res.status(200).json({"result": "success", "username":username, "Rank":rank });
    }else{
        res.status(401).json({'result': 'fail'});
    }
});

// Generate a new unique meeting id and send to the client for creating a new meeting
app.get("/createNewMeetingTest", function(req, res){
    res.status(200).json({"MeetingId": "000000"}); 
});

// Generate a new unique meeting id and send to the client for creating a new meeting
app.post("/createNewMeeting", function(req, res){
    const account = req.body.account;
    const meetingName = req.body.meetingName;
    const guests = req.body.guests.split("\r\n");
    const map = req.body.map;
    console.log("guests:",guests);
    console.log("account:", account);
    console.log("generating new ID...");
    do{
        newMeetingId = generateMeetingId(6);
    }while(meetingInfo[newMeetingId]!=undefined)

    newMeeting = {
        "MeetingName": meetingName,
        "RequireAuthentication": "True",
        "HostAccount": account,
        "GuestAccounts": guests,
        "AccessCode": "1234",
        "Map": map
    }
    meetingInfo[newMeetingId] = newMeeting; // update meetingInfo
    clientInfo[account]["Meetings"].push({"MeetingId":newMeetingId, "MeetingName":meetingName, "Ownership":"Host", "Map":map});
    for(i=0; i<guests.length; i++){
        try{
            clientInfo[guests[i]]["Meetings"].push({"MeetingId":newMeetingId, "MeetingName":meetingName, "Ownership":"Guest", "Map":map});
        }catch{
            continue;
        }
    }
    meetingInfoJson = JSON.stringify(meetingInfo);
    clientInfoJson = JSON.stringify(clientInfo);
    updateInfo("update_MeetingInfo.json", meetingInfoJson); // update the json file that store meetingInfo
    updateInfo("update_clientInfo.json", clientInfoJson); // update the json file that store clientInfo
    console.log("new ID is", newMeetingId, "\n");
    res.status(200).json({"MeetingId": newMeetingId}); 
});


app.post("/findMeetings", function(req, res){
    const account = req.body.account;
    console.log("account:", account);
    const meetings = {"meetings":clientInfo[account]["Meetings"]};
    console.log(meetings);
    res.status(200).json(meetings);
});

app.listen(8080)