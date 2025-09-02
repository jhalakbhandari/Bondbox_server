const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Ensure Chrome is downloaded
  chrome: {
    skipDownload: false, // Puppeteer will download Chrome
  },
  // Optional: also download Firefox if needed
  firefox: {
    skipDownload: true,
  },
  // Custom cache directory to avoid Render cache issues
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
