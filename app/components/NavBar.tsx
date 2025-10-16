"use client"
import { User } from "next-auth";
import { SignIn } from "./auth/SignInButton";
import { SignOut } from "./auth/SignOutButton";

interface NavBarProps {
    user: AppUser
}

interface AppUser extends User {
    isAdmin?: boolean;
}

export function NavBar({ user }: NavBarProps) {
    console.log(user);
    const isDevMode = process.env.NODE_ENV === "development" ? true : false;
    console.log(process.env.NODE_ENV);
    console.log(isDevMode);
    return (
        <nav className="navbar">
            <div className="flex w-full justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">CREP{isDevMode ? <span className='text-red-500  hover:animate-pulse'>!DEV</span> : ""} </h1>
                </div>
                <div className="flex items-center flex-nowrap">
                    {user ? (
                        <>
                            <span className="mr-4">Welcome, {user.name} !</span>
                            <SignOut />
                        </>
                    ) : (
                        <SignIn />
                    )}
                </div>
            </div>
        </nav>
    );
}