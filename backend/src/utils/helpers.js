// Helper function to generate a random username based on a string
exports.generateRandomUsername = (base) => {
  // Clean the base string (remove special characters, etc.)
  const cleanBase = base.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // If the cleaned base is empty or too short, use a default
  if (!cleanBase || cleanBase.length < 3) {
    return `user${Math.floor(Math.random() * 10000)}`;
  }

  // Limit length and add random numbers if needed
  if (cleanBase.length > 15) {
    return cleanBase.substring(0, 12) + Math.floor(Math.random() * 1000);
  }

  return cleanBase;
};

// Helper function to format file size in human readable format
exports.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to delay execution (for rate limiting, etc.)
exports.delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper function to generate random string
exports.generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};