let cards = {
    1: { name: "1 Red", special: "no", img: "cards/UNO-CARD-1-RED.png" },
    2: { name: "2 Red", special: "no", img: "cards/UNO-CARD-2-RED.png" },
    3: { name: "3 Red", special: "no", img: "cards/UNO-CARD-3-RED.png" },
    4: { name: "4 Red", special: "no", img: "cards/UNO-CARD-4-RED.png" },
    5: { name: "5 Red", special: "no", img: "cards/UNO-CARD-5-RED.png" },

    6: { name: "1 Yellow", special: "no", img: "cards/UNO-CARD-1-YELLOW.png" },
    7: { name: "2 Yellow", special: "no", img: "cards/UNO-CARD-2-YELLOW.png" },
    8: { name: "3 Yellow", special: "no", img: "cards/UNO-CARD-3-YELLOW.png" },
    9: { name: "4 Yellow", special: "no", img: "cards/UNO-CARD-4-YELLOW.png" },
    10: { name: "5 Yellow", special: "no", img: "cards/UNO-CARD-5-YELLOW.png" },

    11: { name: "1 Green", special: "no", img: "cards/UNO-CARD-1-GREEN.png" },
    12: { name: "2 Green", special: "no", img: "cards/UNO-CARD-2-GREEN.png" },
    13: { name: "3 Green", special: "no", img: "cards/UNO-CARD-3-GREEN.png" },
    14: { name: "4 Green", special: "no", img: "cards/UNO-CARD-4-GREEN.png" },
    15: { name: "5 Green", special: "no", img: "cards/UNO-CARD-5-GREEN.png" },

    16: { name: "1 Blue", special: "no", img: "cards/UNO-CARD-1-BLUE.png" },
    17: { name: "2 Blue", special: "no", img: "cards/UNO-CARD-2-BLUE.png" },
    18: { name: "3 Blue", special: "no", img: "cards/UNO-CARD-3-BLUE.png" },
    19: { name: "4 Blue", special: "no", img: "cards/UNO-CARD-4-BLUE.png" },
    20: { name: "5 Blue", special: "no", img: "cards/UNO-CARD-5-BLUE.png" },

    21: { name: "Skip Red", special: "skip", img: "cards/UNO-CARD-SKIP-RED.png" },
    22: { name: "Reverse Red", special: "reverse", img: "cards/UNO-CARD-REVERSE-RED.png" },
    23: { name: "Draw2 Red", special: "draw2", img: "cards/UNO-CARD-DRAW2-RED.png" },
    24: { name: "Skip Yellow", special: "skip", img: "cards/UNO-CARD-SKIP-YELLOW.png" },
    25: { name: "Reverse Yellow", special: "reverse", img: "cards/UNO-CARD-REVERSE-YELLOW.png" },

    26: { name: "Reverse Blue", special: "reverse", img: "cards/UNO-CARD-REVERSE-BLUE.png" },
    27: { name: "Draw2 Blue", special: "draw2", img: "cards/UNO-CARD-DRAW2-BLUE.png" },
    28: { name: "Wild", special: "wild", img: "cards/UNO-CARD-WILD.png" },
    30: { name: "Wild Draw4", special: "wilddraw4", img: "cards/UNO-CARD-WILD-DRAW4.png" }
}
if (sessionStorage.getItem("inGame") == "true") {
    sessionStorage.setItem("inGame", "false");
    window.location.href = "index.html";
} else {
    sessionStorage.setItem("inGame", "true");
}
const roomCode = sessionStorage.getItem("roomCode");

const username = sessionStorage.getItem("username");

socket.emit("JoinRoom", username, roomCode);

socket.on("JoinedRoom", (code) => {
    socket.emit("RequestStarterData");
});

socket.on("ReturnToLobby", () => {
    window.location.href = "/index.html";
});

let unobtn = document.getElementById("unobtn");

unobtn.style.visibility = "hidden";

let cardselement = document.getElementById("cards")

let localPlayer

let cardplaceholder = document.getElementById("cardplayed");

let deck = document.getElementById("deck")

let gt = document.getElementById("gt")

let lastplayedcard = ""

let lt = document.getElementById("lt")

let offset = 200;

let index = 0;

let page = 0;

let cardinfo = document.getElementById("local-player-card-count");

let playerturn;

let cardcnt = 7;

let pagecardcnt = 0;

let unoplayer
function moveUNOButton() {
    const padding = 20;

    const maxX = window.innerWidth - unobtn.offsetWidth - padding;
    const maxY = window.innerHeight - unobtn.offsetHeight - padding;

    const randomX = Math.random() * maxX + padding;
    const randomY = Math.random() * maxY + padding;

    unobtn.style.left = `${randomX}px`;
    unobtn.style.top = `${randomY}px`;
}
socket.on("UNOQTE", (data) => {

    unobtn.style.visibility = "visible";
    console.log(data.playerId)
    moveUNOButton()
    unoplayer = data.playerId
    setTimeout(() => {
        unobtn.style.visibility = "hidden";
    }, data.time);

});
unobtn.addEventListener("click", () => {
    if (unoplayer == socket.id) {
        socket.emit("UNOsafe", unoplayer);
        console.log(unoplayer)
        unobtn.style.visibility = "hidden";
    }
    else {
        socket.emit("UNO", unoplayer);
        console.log(unoplayer)
        unobtn.style.visibility = "hidden";
    }


});

socket.on("UNOsafe", (player) => {
    unobtn.style.visibility = "hidden";
});
socket.on("UpdatePlayers", (players) => {
    let playerSpots = [
        document.getElementById("player1"),
        document.getElementById("player2"),
        document.getElementById("player3")
    ];

    playerSpots.forEach(spot => {
        spot.innerHTML = "";
        spot.classList.remove("turn");
    });

    Object.values(players)
        .filter(player => player.id !== socket.id)
        .slice(0, 3)
        .forEach((player, i) => {

            let playerDiv = document.createElement("div");

            playerDiv.classList.add("player");

            // Glow if it's this player's turn
            if (player.turn) {
                playerDiv.classList.add("turn");
            }

            playerDiv.innerHTML = `
                <p>${player.name}</p>
                <p>${player.amtofCards} Cards</p>
            `;

            playerSpots[i].appendChild(playerDiv);
        });
});

function RenderPage() {
    cardinfo.innerHTML = curdeck.length + " Cards";
    let ismobile = window.innerWidth < 700
    let start = page * 7;
    let end = Math.min(start + 7, curdeck.length);
    if (ismobile) {
        start = page * 5
        end = Math.min(start + 5, curdeck.length);
    }
    // Hide all cards and clear hardcoded inline visibility flags
    curdeck.forEach((card) => {
        card.style.display = "none";
        card.style.visibility = "visible"; // Clears invisible state on page 2+
    });

    // Display only cards belonging to current page
    for (let i = start; i < end; i++) {
        if (curdeck[i]) {
            curdeck[i].style.display = "block";
        }
    }
}

// Recalculate card positioning when screen resizes or rotates
window.addEventListener("resize", RenderPage);


let YT = document.getElementById("YT");

YT.style.visibility = "hidden";

gt.addEventListener("click", () => {
    if ((page + 1) * 7 < curdeck.length) {
        page++;
        RenderPage()
    }

});

lt.addEventListener("click", () => {
    if (page > 0) {
        page--;
        RenderPage()
    }

});
let PW = document.getElementById("PW");
socket.on("winner", (playername) => {
    PW.innerHTML = playername + " Has Won!"
    PW.style.visibility = "visible"
});
deck.addEventListener("click", () => {
    if (socket.id !== playerturn) {
        console.log("Not your turn!");
        return;
    }
    drawcards(1);
});

socket.on("UpdateTurn", (player) => {
    playerturn = player;
    if (socket.id == player) {
        YT.style.visibility = "visible";
    }
    else {
        YT.style.visibility = "hidden";
    }
});

function drawcards(amt) {
    try {
        for (let i = 0; i < amt; i++) {
            socket.emit("gotcard", socket.id);

            let randomcardKey = Math.floor(Math.random() * Object.keys(cards).length) + 1;
            let carddata = cards[randomcardKey];

            let card = document.createElement("div");
            card.setAttribute("class", "card");
            card.setAttribute("id", carddata.img);

            let cardimg = document.createElement("img");
            cardimg.setAttribute("src", carddata.img);
            card.append(cardimg);

            cardselement.append(card);
            curdeck.push(card);

            card.addEventListener("click", () => {
                if (socket.id !== playerturn) return;
                playcard(carddata, card);
            });
        }
        RenderPage();
    } catch (err) {
        console.log("Error drawing cards:", err);
    }
}
socket.on("drawCards", (amt) => {
    drawcards(amt)
});


let colors = ["red", "green", "blue", "yellow"];

let numbers = [1, 2, 3, 4, 5]

let curdeck = [];



generate_starting_deck(7);
function generate_starting_deck(SDA) {
    do {
        let randomnum = Math.floor(Math.random() * Object.keys(cards).length) + 1;

        console.log("random number:", randomnum);
        console.log("card:", cards[randomnum]);

        randomcard = cards[randomnum];

        console.log("randomcard:", randomcard);
        console.log("randomcard.img:", randomcard.img);
    } while (randomcard.special !== "no");

    let cardthatgotplayed = cardplaceholder.children[0];
    console.log(cardthatgotplayed)
    cardthatgotplayed.setAttribute("src", randomcard.img)
    console.log("image element:", cardthatgotplayed);
    socket.emit("StartGame", randomcard);
    lastplayedcard = randomcard.name
    for (let i = 1; i <= SDA; i++) {

        index++

        randomcard = Math.floor(Math.random() * Object.keys(cards).length) + 1;
        randomcard = cards[randomcard];

        const carddata = randomcard;
        let card = document.createElement("div");
        card.setAttribute("class", "card");
        card.setAttribute("id", randomcard.img)
        let cardimg = document.createElement("img");
        cardimg.setAttribute("src", randomcard.img);
        card.append(cardimg);
        cardselement.append(card);

        pagecardcnt++;

        curdeck.push(card);

        console.log(curdeck);

        RenderPage()
        card.addEventListener("click", () => {


            if (socket.id !== playerturn) {
                console.log("Not your turn!");
                return;
            }
            playcard(
                carddata,
                card
            );
        });
    }
}

socket.on("PlayedCard", (card, color) => {
    let cardthatgotplayed = cardplaceholder.children[0];
    if (color == "...") {
        cardthatgotplayed.setAttribute("src", card.img);
        lastplayedcard = card.name
    }
    else {
        cardthatgotplayed.setAttribute("src", "cards/UNO-CARD-BASE-" + color.toUpperCase() + ".png");
        lastplayedcard = color
    }




});


function playcard(card, element) {

    if (socket.id !== playerturn) {
        return;
    }
    console.log(card.special)

    let lastCard = lastplayedcard.toLowerCase();
    let newCard = card.name.toLowerCase();

    rmeovecardnum = curdeck.indexOf(element);

    let sameColor = colors.some(color =>
        lastCard.includes(color) && newCard.includes(color)
    );

    let sameNumber = numbers.some(number =>
        lastCard.includes(number.toString()) &&
        newCard.includes(number.toString())
    );
    let wild = card.special.toLowerCase().includes("wild")

    if (sameColor || sameNumber || wild || lastCard.toLowerCase().includes(card.special) && card.special != "no") {
        if (wild) {
            let newcolor = prompt("what color");

            if (newcolor == "wild") {
                newcolor = "red";
            }
            if (!colors.includes(newcolor.toLowerCase())) {
                newcolor = "red";
            }

            let cardthatgotplayed = cardplaceholder.children[0];

            cardthatgotplayed.setAttribute("src", "cards/UNO-CARD-BASE-" + newcolor.toUpperCase() + ".png");

            element.remove();
            curdeck.splice(rmeovecardnum, 1)
            // Recalculate how many pages we need
            let maxPage = Math.max(0, Math.ceil(curdeck.length / 7) - 1);

            // If current page no longer exists, go back
            if (page > maxPage) {
                page = maxPage;
            }

            // Recalculate page 1 card count
            pagecardcnt = Math.min(curdeck.length, 7);

            console.log(curdeck)

            socket.emit("PlayCard", card, newcolor, curdeck.length)
            RenderPage();
        }
        else {
            let cardthatgotplayed = cardplaceholder.children[0];

            cardthatgotplayed.setAttribute("src", card.img);

            element.remove();
            curdeck.splice(rmeovecardnum, 1)
            let maxPage = Math.max(0, Math.ceil(curdeck.length / 7) - 1);

            // If current page no longer exists, go back
            if (page > maxPage) {
                page = maxPage;
            }

            // Recalculate page 1 card count
            pagecardcnt = Math.min(curdeck.length, 7);

            console.log(curdeck)
            socket.emit("PlayCard", card, "...", curdeck.length)
            RenderPage();
        }


    }
    RenderPage();

}