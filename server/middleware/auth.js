const User = require("../models/User");
const { verifyAccessToken } = require("../utils/tokens");

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("_id name email").lean();
    if (!user) return res.status(401).json({ message: "Invalid session" });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: error.name === "TokenExpiredError" ? "jwt expired" : "Invalid token" });
  }
}

module.exports = { requireAuth };
