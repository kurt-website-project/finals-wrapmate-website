import { verifyToken } from "./auth.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function errorHandler(err, _req, res, _next) {
  console.error("[wrapmate] error:", err?.message || err);
  res.status(500).json({ error: "Server error." });
}
