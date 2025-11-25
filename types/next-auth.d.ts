import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    groups?: string[];
  }

  interface Session {
    user: User;
  }
}
