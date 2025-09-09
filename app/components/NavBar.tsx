"use client"
import { SignIn } from "./auth/SignInButton";
import { SignOut } from "./auth/SignOutButton";
 
export function NavBar(user: any) {
  console.log(user);
  return (
    <nav className="navbar">
        <div className="flex w-full justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">CREP</h1>
            </div>
            <div>
                {user.user ? (
                    <div>
                        <span className="mr-4">Welcome, {user.user.name} !</span>
                       <SignOut />
                    </div>
                ) : (
                    <SignIn />
                )}
            </div>
        </div>
    </nav>
  );
}