const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
const jwtExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "7d";

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { signAccessToken, verifyAccessToken };
