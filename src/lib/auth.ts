import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export function signToken(payload: { id: string; email: string; role: string; name?: string }) {
  // Signs a token with long expiration for ease of use, matching the reference project's design.
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "10d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name?: string };
  } catch (error) {
    return null;
  }
}
