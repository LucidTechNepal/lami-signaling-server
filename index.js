let port = process.env.PORT || 5000;

let IO = require("socket.io")(port, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

IO.use((socket, next) => {
  if (socket.handshake.query) {
    console.log(socket.handshake.query.callerId, 'from ui')
    let callerId = socket.handshake.query.callerId;
    socket.user = callerId;
    next();
  }
});

IO.on("connection", (socket) => {
  console.log(socket.user, "Connected");
  socket.join(socket.user);

  socket.on("makeCall", (data) => {
    console.log(data.calleeId)
    let calleeId = data.calleeId;
    let sdpOffer = data.sdpOffer;

    socket.to(calleeId).emit("newCall", {
      callerId: socket.user,
      sdpOffer: sdpOffer,
    });
  });

  socket.on("answerCall", (data) => {
    console.log(data, "from uii accept call")
    let callerId = data.callerId;
    let sdpAnswer = data.sdpAnswer;

    socket.to(callerId).emit("callAnswered", {
      callee: socket.user,
      sdpAnswer: sdpAnswer,
    });
  });

  socket.on("IceCandidate", (data) => {
    console.log(data, "from data  ")
    let calleeId = data.calleeId;
    let iceCandidate = data.iceCandidate;

    socket.to(calleeId).emit("IceCandidate", {
      sender: socket.user,
      iceCandidate: iceCandidate,
    });
  });

  socket.on("rejectCall", (data) => {
    console.log(data, "from ui - reject call");
    let callerId = data.callerId;

    // Notify the caller that the call has been rejected
    socket.to(callerId).emit("callRejected", {
      callee: socket.user,
    });
  });

   socket.on("callEnded", (data) => {
    console.log(data, "from ui - call ended");
    let calleeId = data.calleeId;
    let callerId = data.callerId;

    // Notify both the caller and callee that the call has ended
    socket.to(calleeId).emit("callEnded", {
      caller: callerId,
    });

    socket.to(callerId).emit("callEnded", {
      callee: calleeId,
    });
  });
});
