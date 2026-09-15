const fs = require('fs');
const path = require('path');

// Persisted global settings for the library (e.g. whether members may also
// sign in with email & password when QR scanning is not available).
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'emailLogin.json');

const DEFAULT_EMAIL_LOGIN = false; // off by default — only the manager (librarian) grants access

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {
    // fall through to defaults
  }
  return { allowEmailLogin: DEFAULT_EMAIL_LOGIN };
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Public: tells the login page whether members may use email & password
exports.isEmailLoginAllowed = () => readConfig().allowEmailLogin === true;

exports.getEmailLogin = (req, res) => {
  res.json({ success: true, allowEmailLogin: exports.isEmailLoginAllowed() });
};

// Librarian-only: grant/revoke the email & password login option for members
exports.setEmailLogin = (req, res) => {
  const { allowEmailLogin } = req.body;
  writeConfig({ allowEmailLogin: allowEmailLogin === true });
  res.json({
    success: true,
    allowEmailLogin: allowEmailLogin === true,
    message: allowEmailLogin
      ? 'Members can now sign in with email & password.'
      : 'Email & password login for members has been disabled (QR scanning only).'
  });
};