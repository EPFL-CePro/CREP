"use client"
import { signOut } from "next-auth/react"

export function SignOut() {
  return <button className="btn bg-red-500 text-white px-4 py-2 rounded cursor-pointer" onClick={() => signOut()}>Sign Out</button>
}