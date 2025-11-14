// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest, AuthUser } from "@/lib/auth";

type MeResponse =
  | {
      user: AuthUser;
      authenticated: true;
    }
  | {
      user: null;
      authenticated: false;
      message: string;
    };

export async function GET(req: NextRequest) {
  const user = await getCurrentUserFromRequest(req);

  if (!user) {
    const body: MeResponse = {
      user: null,
      authenticated: false,
      message: "로그인이 필요합니다.",
    };

    return NextResponse.json(body, { status: 401 });
  }

  const body: MeResponse = {
    user,
    authenticated: true,
  };

  return NextResponse.json(body, { status: 200 });
}
