const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

let io;

const allowedOrigins = [
  'https://broo.email',
  'https://www.broo.email',
  'https://broo-email.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return (
    allowedOrigins.includes(origin) ||
    /^https:\/\/broo-email.*\.vercel\.app$/.test(origin) ||
    /^https:\/\/(.*\.)?broo\.email$/.test(origin)
  );
};

// Initialize socket.io
const initSocket = (httpServer) => {
  io = require('socket.io')(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      // Get token from handshake
      const token = socket.handshake.auth.token ||
                   socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: Invalid user'));
      }

      // Attach user to socket
      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Token expired'));
      }
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user-specific room for targeted emissions
    socket.join(socket.userId);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    // Example: Join a specific email thread/room
    socket.joinEmailThread = (emailId) => {
      socket.join(`email_${emailId}`);
    };

    // Example: Leave an email thread/room
    socket.leaveEmailThread = (emailId) => {
      socket.leave(`email_${emailId}`);
    };
  });

  return io;
};

// Get the IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit new email notification to user
const emitNewEmail = (userId, email) => {
  try {
    const ioInstance = getIO();
    // Emit to user's room
    ioInstance.to(userId).emit('new-email', email);
    // Also emit to any specific email room if needed
    ioInstance.to(`email_${email._id}`).emit('new-email', email);
  } catch (err) {
    console.error('Error emitting new email:', err);
  }
};

// Emit email update (e.g., read status, star status) to user
const emitEmailUpdate = (userId, email) => {
  try {
    const ioInstance = getIO();
    ioInstance.to(userId).emit('email-update', email);
    ioInstance.to(`email_${email._id}`).emit('email-update', email);
  } catch (err) {
    console.error('Error emitting email update:', err);
  }
};

// Emit email deletion to user
const emitEmailDeleted = (userId, emailId) => {
  try {
    const ioInstance = getIO();
    ioInstance.to(userId).emit('email-deleted', { emailId });
    ioInstance.to(`email_${emailId}`).emit('email-deleted', { emailId });
  } catch (err) {
    console.error('Error emitting email deletion:', err);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitNewEmail,
  emitEmailUpdate,
  emitEmailDeleted
};