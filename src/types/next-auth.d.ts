import "next-auth";
import "next-auth/jwt";
import { UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      phone?: string;
      image?: string;
      provider?: string;
      role?: UserRole;
      notifications?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    image?: string;
    role?: UserRole;
    notifications?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    provider?: string;
    role?: UserRole;
    image?: string | null;
    notifications?: boolean;
  }
}

