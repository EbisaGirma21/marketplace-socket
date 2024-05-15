const http = require("http");
const express = require("express");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

let users = [];

const addUser = (user, socketId) => {
  if (!users.some((myUser) => myUser?.user?.id === user?.id)) {
    users.push({ user, socketId });
  }
};

const removeUser = (socketId) => {
  users = users.filter((user) => user?.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user?.user?.id === userId);
};

io.on("connection", (socket) => {
  // Add user
  console.log("User Connected");
  socket.on("addUser", (user) => {
    addUser(user, socket.id);
    io.emit("getUsers", users);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getUsers", users);
  });

  // Handle sending and receiving messages
  socket.on(
    "sendMessage",
    ({ senderId, receiverId, text, createdAt, image }) => {
      const user = getUser(receiverId);
      if (user) {
        io.to(user.socketId).emit("getMessage", {
          senderId,
          text,
          createdAt,
          image,
        });
      }
    }
  );

  // Handle sending and receiving notifications
  socket.on("sendMessageNotification", ({ receiverId, type, createdAt }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessageNotification", {
        receiverId,
        type,
        createdAt,
      });
    }
  });

  // Handle store approval requests
  socket.on("sendStoreApprovalRequest", ({ user, type, createdAt }) => {
    io.emit("getStoreApprovalRequest", { user, type, createdAt });
  });

  // Handle store approval notifications
  socket.on("sendStoreApproved", ({ seller, type, createdAt }) => {
    const user = getUser(seller);
    if (user) {
      io.to(user.socketId).emit("getStoreApproved", {
        seller,
        type,
        createdAt,
      });
    }
  });

  // Handle order status notifications
  socket.on("sendOrderStatus", ({ buyer, type, createdAt }) => {
    const user = getUser(buyer);
    if (user) {
      io.to(user.socketId).emit("getOrderStatus", { buyer, type, createdAt });
    }
  });
});

const PORT = process.env.PORT || 8900;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
