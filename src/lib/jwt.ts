import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-me';

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
    name?: string;
}

export function signJwt(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); // Long expiry for mobile
}

export function verifyJwt(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        return null;
    }
}
