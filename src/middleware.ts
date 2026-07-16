import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect all pages; API routes verify the session in their handlers.
  // Public static assets (e.g. /brand/*, favicons) must stay reachable
  // pre-login — they're used on the login/register pages themselves.
  matcher: ["/((?!api|_next/static|_next/image|brand|favicon.ico).*)"],
};
