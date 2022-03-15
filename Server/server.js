const express = require('express');
const fs = require("fs");
const app = express();

app.use(express.json());

let clientInfo = require("./clientInfo.json"); // read client information from file 
let meetingInfo = require("./meetingInfo.json"); // read meeting information from file

// the destinations where updated client & meeting info will be stored
let update_clientInfo_dst = "update_clientInfo.json";
let update_meetingInfo_dst = "update_meetingInfo.json";

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
        updateInfo(update_clientInfo_dst, clientInfoJson); // update the json file that store clientInfo
        console.log("New user account created:",account);
        return true;
    }else{
        console.log(account,"existed. Registration failed.")
        return false;
    }
}

// admin register
app.post("/adminAddUser", function(req,res){
    const account = req.body.account;
    const password = req.body.password;
    const username = req.body.username;
    const isAdmin = req.body.isAdmin;
    let rank = "";
    let newClient = {};
    if(clientInfo[account]==undefined){
        if(isAdmin){
            rank = "Admin";
        }else{
            rank = "User";
        }
        newClient = {
            "Username":username,
            "Password":password,
            "Rank":rank,
            "Meetings":[]
        };
        clientInfo[account] = newClient;  // add new client information to clientInfo
        clientInfoJson = JSON.stringify(clientInfo); 
        updateInfo(update_clientInfo_dst, clientInfoJson); // update the json file that store clientInfo
        console.log("New user added:",account);
        res.status(200).json({"result":"success"})
    }else{
        console.log(account,"existed. Registration failed.")
        res.status(401).json({"result":"fail"});
    }
});

// user register
app.post("/register", function(req, res){
    if (register(req)){
        res.status(200).json({"result": "success"});
    }else{
        res.status(401).json({'result': 'fail'});
    }
});

// log in a user
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

// generate a fixed meeting id for testing
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
    console.log(account);
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
    updateInfo(update_meetingInfo_dst, meetingInfoJson); // update the json file that store meetingInfo
    updateInfo(update_clientInfo_dst, clientInfoJson); // update the json file that store clientInfo
    console.log("new ID is", newMeetingId, "\n");
    res.status(200).json({"MeetingId": newMeetingId}); 
});

// return all meetings relevant to the user
app.post("/findMeetings", function(req, res){
    const account = req.body.account;
    console.log("account:", account);
    const meetings = {"meetings":clientInfo[account]["Meetings"]};
    console.log(meetings);
    res.status(200).json(meetings);
});

// return all user ids and usernames
app.get("/adminShowClients", function(req,res){
    let result = [];
    for(let client in clientInfo){
        const userid = client;
        const username = clientInfo[client]["Username"];
        result.push({"UserId":userid, "Username":username});
    }
    console.log(result);
    res.status(200).json({"Result":result});
});


//delete a user and relevant meetings information
app.post("/adminDeleteClient", function(req,res){
    const account = req.body.account;
    const meetinglist = clientInfo[account]["Meetings"];
    console.log("user account to be deleted:", account);
    for(i=0; i<meetinglist.length; i++){
        const meetingId = meetinglist[i]["MeetingId"];
        const ownership = meetinglist[i]["Ownership"];
        if(ownership=="Host"){
            const clientlist = meetingInfo[meetingId]["GuestAccounts"];
            for(j=0; j<clientlist.length; j++){
                const client = clientlist[j];
                const meetings = clientInfo[client]["Meetings"];
                let index;
                for(k=0; k<meetings.length; k++){
                    if(meetings[k]["MeetingId"]==meetingId){
                        index = k;
                    }
                }
                delete clientInfo[client]["Meetings"].splice(index,1);
            }
            delete meetingInfo[meetingId];
        }else{
            const guestlist = meetingInfo[meetingId]["GuestAccounts"];
            const index = guestlist.indexOf(account);
            meetingInfo[meetingId]["GuestAccounts"].splice(index,1);
        }
    }
    delete clientInfo[account];
    updateInfo(update_clientInfo_dst, JSON.stringify(clientInfo));
    updateInfo(update_meetingInfo_dst, JSON.stringify(meetingInfo));
    console.log("user has been deleted.\n");
    res.status(200).json({"Result":"success"})
})

app.listen(8080)
