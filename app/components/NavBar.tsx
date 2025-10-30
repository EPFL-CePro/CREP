"use client"
import { User } from "next-auth";
import { SignIn } from "./auth/SignInButton";
import { SignOut } from "./auth/SignOutButton";
import { Export } from "./exportData/Export";

interface NavBarProps {
    user: AppUser
}

interface AppUser extends User {
    isAdmin?: boolean;
}

export function NavBar({ user }: NavBarProps) {
    const isDevMode = process.env.NODE_ENV === "development" ? true : false;
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
                            <div className="flex gap-2">
                                <SignOut />
                                <Export user={user} />
                            </div>
                        </>
                    ) : (
                        <SignIn />
                    )}
                </div>
            </div>
        </nav>
    );
}