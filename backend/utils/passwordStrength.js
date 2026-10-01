// Password policy: minimum length only (kept simple so accounts are easy to create).
const STRONG_PASSWORD_RE = /.{4,}/;

// Returns an error message string when the password is invalid, or null when valid.
function passwordStrengthError(password) {
  if (!password || password.length < 4) {
    return 'Password must be at least 4 characters';
  }
  return null;
}

module.exports = { STRONG_PASSWORD_RE, passwordStrengthError };