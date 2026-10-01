const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true); // dev mode: allow all origins
      },
      credentials: true
    },
    pingTimeout: 60000
  });

  io.on('connection', (socket) => {
    const role = socket.handshake.query.role || 'guest';
    const userId = socket.handshake.query.userId;

    if (role === 'LIBRARIAN') {
      socket.join('librarians');
    }
    if (userId) {
      socket.join(`user-${userId}`);
    }

    socket.on('disconnect', () => {});
  });

  return io;
}

// Emit an event to the librarian room (real-time updates)
function emitToLibrarians(event, payload) {
  if (io) {
    io.to('librarians').emit(event, payload);
  }
}

// Emit to a specific user room
function emitToUser(userId, event, payload) {
  if (io) {
    io.to(`user-${userId}`).emit(event, payload);
  }
}

function getUserSocket(io) {
  return io;
}

module.exports = { initSocket, emitToLibrarians, emitToUser, getUserSocket };
