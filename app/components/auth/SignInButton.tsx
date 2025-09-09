"use client"
import { signIn } from "next-auth/react"
 
export function SignIn() {
  return <button className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer" onClick={() => signIn()}>Sign In</button>
}