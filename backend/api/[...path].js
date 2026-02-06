// Catch-all API route for Vercel serverless functions
// This handles all /api/* routes
const app = require('../server');

module.exports = async (req, res) => {
  // Remove /api prefix for Express routes
  const originalUrl = req.url;
  req.url = originalUrl.replace(/^\/api/, '') || '/';
  
  // Handle the request with Express app
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
