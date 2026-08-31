const e = require('express');
const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

let players = {};


let rooms = {

}
function getPlayersInRoom(code) {
    return Object.values(players).filter(
        player => player.room === code
    );
}

io.on("connection", (socket) => {

    socket.on("JoinRoom", (name, code) => {
        if(getPlayersInRoom(code).length >= 3){
              io.to(socket.id).emit("ReturnToLobby");
            return;
        }

        socket.join(code)
        console.log(code)
        socket.emit("JoinedRoom", code);
        if (!rooms[code]) {
            rooms[code] = {
                turnIndex: 0,
                direction: 1,
                startingCard: null,
                PIR: 0
            };
        }
        players[socket.id] = {
            id: socket.id,
            name: name,
            room: code,
            amtofCards: 7,
            turn: false
        };
        rooms[code].PIR++;
        io.to(code).emit(
            "UpdatePlayers",
            getPlayersInRoom(code)
        );
    });
    socket.on("UNOsafe", (player)=>{
        socket.emit("UNOsafe", player);
    });
    socket.on("gotcard", (id) => {

        const player = players[id];

        if (!player) return;

        player.amtofCards++;

        io.to(player.room).emit(
            "UpdatePlayers",
            getPlayersInRoom(player.room)
        );
    });
    //this starts the game it sets the starting card
    socket.on("StartGame", (cardData) => {

        const player = players[socket.id];

        if (!player) return;

        const roomCode = player.room;

        const room = rooms[roomCode];

        if (room.startingCard !== null) {
            return;
        }

        room.startingCard = cardData;

        const playerList =
            getPlayersInRoom(roomCode);

        room.turnIndex = 0;

        playerList.forEach(player => {
            player.turn = false;
        });

        if (playerList.length > 0) {
            playerList[0].turn = true;
        }

        io.to(roomCode).emit(
            "PlayedCard",
            cardData,
            "..."
        );

        io.to(roomCode).emit(
            "UpdateTurn",
            playerList[0].id
        );

        io.to(roomCode).emit(
            "UpdatePlayers",
            playerList
        );
    });
    socket.on("RequestStarterData", () => {

        const player = players[socket.id];

        if (!player) return;

        const roomCode = player.room;
        const room = rooms[roomCode];

        if (!room || room.startingCard === null) {
            return;
        }
        console.log(room.startingCard)
        io.to(socket.id).emit(
            "PlayedCard",
            room.startingCard,
            "..."
        );

        io.to(socket.id).emit(
            "UpdatePlayers",
            getPlayersInRoom(roomCode)
        );
    });

    socket.on("UNO", (id) => {
        console.log("Target ID:", id);
        io.to(id).emit("drawCards", 1);
    });


    socket.on("PlayCard", (card, color, cardsamt) => {

        const player = players[socket.id];

        player.amtofCards = cardsamt;
        if (!player) return;

        const roomCode = player.room;
        const room = rooms[roomCode];

        const playerList =
            getPlayersInRoom(roomCode);
        if (color !== "...") {
            io.to(roomCode).emit("PlayedCard", card, color)
        }
        else {
            io.to(roomCode).emit("PlayedCard", card, "...")
        }

        if (card.special == "reverse") {
            room.direction *= -1;
        }

        const numPlayers = playerList.length;
        room.turnIndex = (room.turnIndex + room.direction + numPlayers) % numPlayers;

        playerList.forEach((player) => {
            player.turn = false;
        });

        let nextplayer = playerList[room.turnIndex]

        nextplayer.turn = true
        console.log(nextplayer);
        if (card.special == "wilddraw4") {
            io.to(nextplayer.id).emit("drawCards", 4);
        }
        if (card.special == "draw2") {
            io.to(nextplayer.id).emit("drawCards", 2);
        }
        if (card.special == "skip") {
            // Skip the next player
            room.turnIndex = (room.turnIndex + room.direction + numPlayers) % numPlayers;

            nextplayer = playerList[room.turnIndex];

            if (!nextplayer) {
                console.log("Skip: next player doesn't exist");
                return;
            }

            playerList.forEach((player) => {
                player.turn = false;
            });

            nextplayer.turn = true;

        }
        if (player.amtofCards === 1) {

            io.to(roomCode).emit("UNOQTE", {
                playerId: player.id,
                playerName: player.name,
                time: 1000
            });

        }
        if (player.amtofCards === 0) {

            io.to(roomCode).emit("winner", player.name);

            setTimeout(() => {
                // Reset game
                room.startingCard = null;
                room.turnIndex = 0;
                room.direction = 1;

                // Reset every player's cards/turn
                playerList.forEach(p => {
                    p.amtofCards = 7;
                    p.turn = false;
                });

                // Tell everyone to go back to lobby
                io.to(roomCode).emit("ReturnToLobby");

                return;
            }, 5000);

        }
        io.to(roomCode).emit("UpdateTurn", nextplayer.id)
        io.to(roomCode).emit("UpdatePlayers", playerList);


    });
    console.log("A user connected:", socket.id);




    socket.on("disconnect", () => {

        const leavingPlayer = players[socket.id];

        if (!leavingPlayer) {
            return;
        }

        const roomCode = leavingPlayer.room;

        const room = rooms[roomCode];

        const wasTheirTurn =
            leavingPlayer.turn === true;

        delete players[socket.id];

        const playerList =
            getPlayersInRoom(roomCode);

        console.log(
            leavingPlayer.name,
            "left room",
            roomCode
        );

        // Room is now empty
        if (playerList.length === 0) {

            delete rooms[roomCode];

            return;
        }

        // Someone else needs the turn
        if (wasTheirTurn) {

            room.turnIndex =
                room.turnIndex % playerList.length;

            playerList.forEach(player => {
                player.turn = false;
            });

            playerList[room.turnIndex].turn = true;
        }

        else {

            const currentTurnIndex =
                playerList.findIndex(
                    player => player.turn === true
                );

            if (currentTurnIndex === -1) {

                room.turnIndex =
                    room.turnIndex % playerList.length;

                playerList[room.turnIndex].turn = true;

            } else {

                room.turnIndex = currentTurnIndex;
            }
        }

        const nextPlayer =
            playerList[room.turnIndex];

        if (!nextPlayer) {
            return;
        }

        io.to(roomCode).emit(
            "UpdateTurn",
            nextPlayer.id
        );

        io.to(roomCode).emit(
            "UpdatePlayers",
            playerList
        );
    });



});

server.listen(3000, () => {
    console.log("listening on https://larpno.onrender.com/");
});