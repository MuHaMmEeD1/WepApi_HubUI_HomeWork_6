let connectedHub = false;

var CURRENT_ROOM = "";
var totalSeconds = 10;
var currentUser = "";
var room = document.querySelector("#room");
var rooms = document.querySelector("#rooms");
var element = document.querySelector("#offerValue");
var timeSection = document.querySelector("#time-section");
var time = document.querySelector("#time");
var button = document.querySelector("#offerBtn");

const url = "https://localhost:7091/";
const connection = new signalR.HubConnectionBuilder()
  .withUrl(url + "offers")
  .configureLogging(signalR.LogLevel.Information)
  .build();

function GetRoomsMethod() {
  $.get(url + "api/Offer/Rooms", function (data, status) {
    console.log();

    for (let i = 0; i < JSON.parse(data).rooms.length; i++) {
      rooms.innerHTML += `<button onclick="JoinRoom('${
        JSON.parse(data).rooms[i].name
      }')">Join ${JSON.parse(data).rooms[i].name}</button>`;
    }
  });
}

async function start() {
  try {
    await connection.start();
    connectedHub = true;
    $.get(url + "api/Offer/Room?room=" + CURRENT_ROOM, function (data, status) {
      element.innerHTML = "Begin price " + data + "$";
    });
  } catch (err) {
    console.dir(err);
    setTimeout(() => {
      start();
    }, 5000);
  }
}

async function JoinRoom(roomName) {
  try {
    console.log("ok join room");

    CURRENT_ROOM = roomName;
    room.style.display = "block";
    rooms.style.display = "none";

    if (!connectedHub) {
      await start();
    } else {
      $.get(
        url + "api/Offer/Room?room=" + CURRENT_ROOM,
        function (data, status) {
          element.innerHTML = "Begin price " + data + "$";
        }
      );
    }
    currentUser = document.querySelector("#user").value;
    await connection.invoke("JoinRoom", CURRENT_ROOM, currentUser);
  } catch (err) {
    console.log(err);
  }
}

connection.on("ReceiveJoinInfo", (message) => {
  let infoUser = document.querySelector("#info");
  infoUser.innerHTML = message + " connected to our room";
  infoUser.style.color = "springgreen";
});

connection.on("ReceiveInfoRoom", (user, data) => {
  const element2 = document.querySelector("#offerValue2");
  const closeBtn = document.querySelector("#closeBtn");

  element2.innerHTML = user + " offer this price " + data + "$";
  button.disabled = false;
  closeBtn.disabled = false;
  timeSection.style.display = "none";
  clearTimeout(myInterval);
  totalSeconds = 10;
});

connection.on("ReceiveWinInfoRoom", (message, data) => {
  const element2 = document.querySelector("#offerValue2");
  const closeBtn = document.querySelector("#closeBtn");

  element2.innerHTML = message + " Offer this price " + data + "$";
  button.disabled = true;
  closeBtn.disabled = false;
  timeSection.style.display = "none";
  clearTimeout(myInterval);
});

connection.on("ReceiveCloseInfo", (userName) => {
  let infoUser = document.querySelector("#info");
  infoUser.innerHTML = ` close ${userName} to our room`;
  infoUser.style.color = "red";
});

var myInterval;

async function IncreaseOffer() {
  clearTimeout(myInterval);
  timeSection.style.display = "block";
  totalSeconds = 10;

  const result = document.querySelector("#user");
  const closeBtn = document.querySelector("#closeBtn");

  $.get(
    url + `api/Offer/IncreaseRoom?room=${CURRENT_ROOM}&data=100`,
    function (data, status) {
      $.get(
        url + "api/Offer/Room?room=" + CURRENT_ROOM,
        async function (data, status) {
          var element2 = document.querySelector("#offerValue2");
          element2.innerHTML = data;

          await connection.invoke(
            "SendMessageRoom",
            CURRENT_ROOM,
            result.value
          );
          button.disabled = true;
          closeBtn.disabled = true;

          myInterval = setInterval(async () => {
            time.innerHTML = totalSeconds;

            if (totalSeconds == 0) {
              clearTimeout(myInterval);
              button.disabled = true;
              await connection.invoke(
                "SendWinnerMessageRoom",
                CURRENT_ROOM,
                "Game Over \n " + result.value + " is Winner!"
              );
            }
            --totalSeconds;
          }, 1000);
        }
      );
    }
  );
}

async function CloseOffer() {
  let infoUser = document.querySelector("#info");
  const element2 = document.querySelector("#offerValue2");
  const user = document.querySelector("#user");

  connection.invoke("CloseRoomUser", user.value, CURRENT_ROOM);

  room.style.display = "none";
  element2.innerHTML = "";
  rooms.innerHTML = "";
  rooms.style.display = "block";
  totalSeconds = 10;
  CURRENT_ROOM = "";
  element.innerHTML = "";
  button.disabled = false;

  GetRoomsMethod();
}

GetRoomsMethod();
