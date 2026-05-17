import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Returns the raw JWT token so the client can authenticate the Socket.IO connection
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value ?? null;
  if (!token) {
    return NextResponse.json({ token: null }, { status: 401 });
  }
  return NextResponse.json({ token });
}
