import NextAuth from "next-auth";
import { authOptions } from "./authOptions";
import { headers } from "next/headers";
import { verifyJwt } from "./jwt";

const { auth: originalAuth } = NextAuth(authOptions);

export const auth = async () => {
  // 1. Check for Mobile Authorization header
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');

    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.split(' ')[1];
      const decoded = verifyJwt(token);
      if (decoded) {
        return {
          user: {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name,
          }
        };
      }
    }
  } catch (e) {
    // Headers might not be available or other error, ignore
  }

  // 2. Fallback to standard cookie-based auth
  return originalAuth();
}

export async function getSession() {
  return await auth();
}
