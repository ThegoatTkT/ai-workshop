import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequestVerified } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequestVerified(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.userId,
      username: user.username,
      role: user.role,
    },
  });
}
