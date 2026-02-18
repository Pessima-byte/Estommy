import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "WXAusVguKEkhLqeon4cDx50CNoVcBfRG0nVaPPPVvDo=";

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
    name?: string;
}

export function signJwt(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyJwt(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error: any) {
        return null;
    }
}
