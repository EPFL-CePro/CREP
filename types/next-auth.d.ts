import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    groups?: string[];
    sciper: string;
  }

  interface Session {
    user: {
      sciper: string
      isAdmin?: boolean
    } & DefaultSession["user"]
  }
}
