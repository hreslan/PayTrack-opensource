import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect all pages; API routes verify the session in their handlers.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
