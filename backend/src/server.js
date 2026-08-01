require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const app = require('./api-server');
const { smtpServer, startSMTPServer } = require('./smtp-server');
const { initSocket } = require('./socket');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const PORT = process.env.PORT || 3000;
const SMTP_PORT = process.env.SMTP_PORT || 25;

// HTTP server
const httpServer = http.createServer(app);
const io = initSocket(httpServer);

// HTTPS setup (if certificates are provided)
const httpsOptions = {
  key: process.env.SSL_KEY_PATH && fs.existsSync(process.env.SSL_KEY_PATH) ? fs.readFileSync(process.env.SSL_KEY_PATH) : null,
  cert: process.env.SSL_CERT_PATH && fs.existsSync(process.env.SSL_CERT_PATH) ? fs.readFileSync(process.env.SSL_CERT_PATH) : null
};

let httpsServer = null;
if (httpsOptions.key && httpsOptions.cert) {
  httpsServer = https.createServer(httpsOptions, app);
  initSocket(httpsServer);
}

// Start HTTP server
httpServer.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// Start HTTPS server if configured
if (httpsServer) {
  const HTTPS_PORT = process.env.HTTPS_PORT || 443;
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`HTTPS server running on port ${HTTPS_PORT}`);
  });
}

// Start SMTP server
startSMTPServer(SMTP_PORT, '0.0.0.0');

module.exports = { httpServer, httpsServer, smtpServer };