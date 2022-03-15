const express = require('express');
const fs = require("fs");
const app = express();

app.use(express.json());

let userInfo = require("./UserInfo.json");
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
        return true;
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
    if (login(req)){
        res.status(200).json({"result": "success"});
    }else{
        res.status(401).json({'result': 'fail'});
    }
});

// Generate a new unique meeting id and send to the client for creating a new meeting
app.get("/createNewMeeting", function(req, res){
    console.log("generating new ID...");
    do{
        newMeetingId = generateMeetingId(6);
    }while(meetingInfo[newMeetingId]!=undefined)

    newMeeting = {
        "MeetingName": "",
        "RequireAuthentication": "True",
        "HostAccount": "",
        "GuestAccounts": [],
        "AccessCode": "1234"
    }
    meetingInfo[newMeetingId] = newMeeting; // update meetingInfo
    meetingInfoJson = JSON.stringify(meetingInfo);
    updateInfo("update_MeetingInfo.json", meetingInfoJson); // update the json file that store meetingInfo
    console.log("new ID is", newMeetingId, "\n");
    res.status(200).json({"MeetingId": newMeetingId}); 
});


app.get("/ShowUserInfo", function(req, res){
    res.end(JSON.stringify(userInfo)); 
});

function add_User(req){
    const ID = req.body.UserID;
    const username = req.body.Username
    const password = req.body.Password;
    if(UserInfo[ID]==undefined){
        let newUser = {
            "UserID": ID,
            "Username":username,
            "Password":password
        };
        UserInfo[ID] = newUser;  // add new client information to clientInfo
        UserInfoJson = JSON.stringify(clientInfo); 
        updateInfo("update_UserInfo.json", UserInfoJson); // update the json file that store clientInfo
        console.log("New user account created:",ID);
        return true;
    }else{
        console.log(ID,"existed. Registration failed.")
        return false;
    }
    
}

app.post("/AddUser", function(req, res){
    if (add_User(req)){
        res.status(200).json({"result": "success"});
    }else{
        res.status(401).json({'result': 'fail'});
    } 
});

function delete_User(req){
    const account = req.body.account
    
}


app.post("/DeleteUser", function(req, res){
    if (delete_User(req)){
        res.status(200).json({"result": "success"});
    }else{
        res.status(401).json({'result': 'fail'});
    }  
});

app.listen(50550)

