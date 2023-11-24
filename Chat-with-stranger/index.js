const express = require("express");
const cors = require("cors");

const app = express();

// app.use(cors());
// app.use(express.json());

app.use(function(req, res, next) {
  // Mọi domain
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (res, req) => {
  req.json({ message: "Welcome to Redi Chat App." });
})

// app.use((err, req, res, next) => {
//   // Middleware xử lý lỗi tập trung.
//   // Trong các đoạn code xử lý ở các route, gọi next(error)
//   // sẽ chuyển về middleware xử lý lỗi này
//   return res.status(err.statusCode || 500).json({
//     message: err.message || "Internal Server Error",
//   });
// });

function getTime() {
    var d = new Date();
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000); // UTC time
    var offset = 7; // UTC +7 hours
    var gmt7 = new Date(utc + (3600000 * (offset - d.getTimezoneOffset() / 60)));
    return gmt7;
    // let str = gmt7.toLocaleString('vi-VN', { timeZone: 'UTC' }).split(" ");
    // return str[0].substr(0,str[0].lastIndexOf(":")) + " " + str[1];
}

// Socket.io cho Chat với người lạ
const serverForChatWithStranger = require('http').createServer(app);
const ioChatWithStranger = require("socket.io")(serverForChatWithStranger, {
  cors: {
    origins: "*",
    credentials: true
  },
});
let countChatRoom = -1;

const getClientRoomStranger = (preRoom, id) => {
  let i = 0;
  let nameChatRoom = "";
  //console.log("id", id);
  for (i = 0; i <= countChatRoom; i++) {
    nameChatRoom = ('stranger-chat-room-' + i).toString();
    if (nameChatRoom === preRoom) continue;
    if (ioChatWithStranger.sockets.adapter.rooms.get(nameChatRoom) && ioChatWithStranger.sockets.adapter.rooms.get(nameChatRoom).size == 1) {
      const members = ioChatWithStranger.sockets.adapter.rooms.get(nameChatRoom);
      for (const member of members) {
        if (member === id) {
          break;
        }
        else return nameChatRoom;
      }
      continue;
    }
  }

  return ('stranger-chat-room-' + (++countChatRoom)).toString();
}

ioChatWithStranger.on('connection', (socket) => {
  let preRoom = "";
  let clientRoom = getClientRoomStranger(preRoom, socket.id);
  //console.log("clientRoom: " + clientRoom + ".....");
  socket.join(clientRoom);

  socket.on("nextRoomStranger", data => {
    preRoom = data;
    //console.log("preRoom: " + preRoom + "......");
    ioChatWithStranger.in(preRoom).emit('statusRoomStranger', {
      content: 'NextRoomNextRoomNgười lạ đã rời đi. Đang đợi người lạ ...',
      createAt: getTime()
    });
    socket.leave(preRoom);
    clientRoom = getClientRoomStranger(preRoom, socket.id);
    //console.log("clientRoomNew: " + clientRoom + ".....");
    socket.join(clientRoom);
    if (ioChatWithStranger.sockets.adapter.rooms.get(clientRoom).size < 2) {//.length < 2) {
      ioChatWithStranger.in(clientRoom).emit('statusRoomStranger', {
        content: 'Đang đợi người lạ ...',
        createAt: getTime()
      });
    } else {
      ioChatWithStranger.in(clientRoom).emit('statusRoomStranger', {
        content: 'Người lạ đã vào phòng|' + clientRoom,
        createAt: getTime()
      });
    }
  })

  if (ioChatWithStranger.sockets.adapter.rooms.get(clientRoom).size < 2) {//.length < 2) {
    ioChatWithStranger.in(clientRoom).emit('statusRoomStranger', {
      content: 'Đang đợi người lạ ...',
      createAt: getTime()
    });
  } else {
    ioChatWithStranger.in(clientRoom).emit('statusRoomStranger', {
      content: 'Người lạ đã vào phòng|' + clientRoom,
      createAt: getTime()
    });
  }

  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
    socket.to(clientRoom).emit('statusRoomStranger', {
      content: 'Người lạ đã rời đi. Đang đợi người lạ kế tiếp ...',
      createAt: getTime()
    });
  });

  socket.on('sendMessageStranger', function (message, callback) {
    socket.to(clientRoom).emit('receiveMessageStranger', {
      ...message,
      createAt: getTime()
    });

    //Tui thêm if vì callback typeError khi dùng postman để test
    if (typeof callback === 'function') {
      callback({
        "status": "ok",
        "createAt": getTime()
      });
    }
  })

  socket.on("disconnecting", (reason) => {
    console.log("[Socket Stranger] Bị ngắt kết nối đo: "+reason);
  });
});

serverForChatWithStranger.listen(3000, () => {
  console.log('listening on *:3000');
});
