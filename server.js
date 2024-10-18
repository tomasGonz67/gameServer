const express = require('express');
const app = express();

const http = require('http');
var server = http.createServer(app);
const { Server } = require("socket.io");
const path = require('path');


const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true

    }
});

const _dirname = path.dirname("")
const buildPath = path.join(_dirname, "../Phoneside/phoneside/build");

app.use(express.static(buildPath))

app.get('/*', (req, res) => {

});

var hosts = {};
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const charactersLength = characters.length;

const makeRoomCode = () => {
    let result = '';
    let counter = 0;
    while (counter < 4) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;

}





io.on('connection', (socket) => {
    console.log('a user connected');
    console.log(socket.id);



    socket.on("checkId", (code, id, currId) => {
        if (Object.values(hosts).includes(code)) {
            console.log("checking");
            io.to(code).emit("check", ({ id, currId }));
        }
        if (!Object.values(hosts).includes(code)) {
            console.log("resetting")
            io.to(currId).emit("reset");
        }

    });

    socket.on("update", (player) => {
        io.to(player.Id).emit("Update");
    })

    socket.on("Rejoin", (id) => {
        io.to(id).emit('rejoining')
    })

    // emit session details
    socket.emit("session", {
        sessionID: socket.sessionID,
    });


    socket.on('disconnect', () => {
        const id = socket.id
        const room = hosts[id];
        console.log(id + 'd/ceed');
        if (id in hosts) {
            delete hosts[id];
            io.to(room).emit('kickedOut');
            io.in(room).socketsLeave(room);
            console.log(hosts);
        }
    });

    socket.on('createRoom', () => {
        var tempCode = makeRoomCode();

        while (Object.values(hosts).includes(tempCode)) {
            tempCode = makeRoomCode();
        }

        hosts[socket.id] = tempCode;
        console.log(hosts);
        console.log(tempCode);
        socket.join(tempCode);
        socket.emit('roomCreated', tempCode);

    })


    socket.on("startGame", (code) => {
        io.to(code).emit('gameStart', (code));
    })

    socket.on('joinRoom', (roomName, player) => {
        roomName = roomName.toUpperCase();
        if (!(Object.values(hosts).includes(roomName))) {
            io.to(socket.id).emit('noJoin');
        }
        if (Object.values(hosts).includes(roomName)) {
            socket.join(roomName);
            player.id = socket.id;
            io.to(roomName).emit('hasJoined', player);
        }
    })

    socket.on("StartPhoneSide", (code) => {
        io.to(code).emit("ToGameScreen");
    })

    socket.on("WhoDoYouThink", (selectedPlayer, playerOne, playerTwo) => {
        io.to(selectedPlayer.Id).emit("showOptions", playerOne.Name, playerTwo.Name, playerOne.Id, playerTwo.Id);
    });

    socket.on("ShowEveryone", (selectedPlayer, players) => {

        io.to(selectedPlayer.Id).emit("ShowEveryone", players);
    });

    socket.on("SendSipsTaken", (id, damage) => {
        io.to(id).emit("showDrinksTaken", damage);
    });

    socket.on("SendSipsGiven", (id, damage) => {
        io.to(id).emit("showDrinksGiven", damage);
    });

    socket.on("resetSips", (code) => {
        io.to(code).emit("resetPhoneSips");
    })

    socket.on("resetBoxes", (code) => {
        io.to(code).emit("clearBoxes");
    })

    socket.on("sendResult", (code, id) => {
        io.to(code).emit("GetResult", (id));
    })

    socket.on("okay", (id) => {
        io.to(id).emit("pressOk");
    })

    socket.on("continue", (code) => {
        io.to(code).emit("continued", ("nothing"));
    })

    socket.on("showSpinButton", (id) => {
        io.to(id).emit("showSpinButtonPhone");
    })

    socket.on("spinWheel", (code) => {
        io.to(code).emit("spinningWheel", ("nothing"));
    })

    socket.on("chooseBox", (id, boxes) => {
        io.to(id).emit("showBoxes", id, boxes);
    })

    socket.on("SendButtons", (player) => {
        io.to(player.Id).emit("showButtons", player);
    })

    socket.on("returnButton", (player, code) => {
        io.to(code).emit("buttonChosen", player);
    });

    socket.on("returnBox", (data, code) => {
        io.to(code).emit("boxChosen", data);
    });

    socket.on("Vote", (player, list) => {
        io.to(player.Id).emit("showVoteOptions", player, list);
    });

    socket.on("sendVote", (name, code) => {
        io.to(code).emit("hasVoted", name);
    });

    socket.on("Sacrafice", (id) => {
        io.to(id).emit("SacraficeCounter");
    });

    socket.on("SacraficeHim", (code) => {
        io.to(code).emit("Sacraficed", "johnier");
    });

    socket.on("SendMurderTools", (player, targetList) => {
        io.to(player.Id).emit("GetMurderTools", player, targetList);
    });

    socket.on("SendGhostTools", (player, targetList) => {
        io.to(player.Id).emit("GetGhostTools", player, targetList);
    });

    socket.on("ReturnWeapon", (code, player) => {
        io.to(code).emit("ReturnMurderWeapon", (player));
    });

});





io.listen(5001);