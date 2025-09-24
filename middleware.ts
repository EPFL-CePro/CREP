import { auth } from "@/auth"
import { NextRequest, NextResponse } from 'next/server';
 
export default async function middleware(req: NextRequest) {
	const session = await auth();

	if (!session?.user) {
		const authUrl = new URL('/api/auth', req.url);
		authUrl.searchParams.set('callbackUrl', req.url);
		return NextResponse.redirect(authUrl);
	}
}

// All routes require login, except /api/auth, that is used to login... (and some static Next.js things)
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}