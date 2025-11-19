// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// JWT payload 형태 (로그인/회원가입/구글 로그인에서 넣어준 필드)
interface AppJwtPayload extends Omit<jwt.JwtPayload, 'sub'> {
  sub?: number | string; // 이제 오류 없이 number와 string 모두 사용 가능합니다.
  email?: string;
  name?: string;
}

type MeResponse =
  | {
      authenticated: true;
      user: {
        id: number | string;
        email: string;
        name: string;
      };
    }
  | {
      authenticated: false;
      user: null;
      message: string;
    };

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    const body: MeResponse = {
      authenticated: false,
      user: null,
      message: "로그인이 필요합니다.",
    };
    return NextResponse.json(body, { status: 401 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET 환경변수가 설정되어 있지 않습니다.");
    const body: MeResponse = {
      authenticated: false,
      user: null,
      message:
        "서버 설정에 문제가 있습니다. 잠시 후 다시 시도해주세요.",
    };
    return NextResponse.json(body, { status: 500 });
  }

  try {
    const decoded = jwt.verify(token, secret) as AppJwtPayload;

    const idRaw = decoded.sub;
    const email = decoded.email;
    const name = decoded.name;

    if (!email || !name || typeof idRaw === "undefined") {
      console.error("JWT payload에 필요한 정보가 부족합니다:", decoded);
      const body: MeResponse = {
        authenticated: false,
        user: null,
        message: "세션 정보가 올바르지 않습니다. 다시 로그인해주세요.",
      };
      return NextResponse.json(body, { status: 401 });
    }

    const id =
      typeof idRaw === "string" && /^\d+$/.test(idRaw)
        ? Number(idRaw)
        : idRaw;

    const body: MeResponse = {
      authenticated: true,
      user: {
        id,
        email,
        name,
      },
    };

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    console.error("JWT 검증 중 오류:", error);
    const body: MeResponse = {
      authenticated: false,
      user: null,
      message: "로그인 정보가 만료되었거나 올바르지 않습니다.",
    };
    return NextResponse.json(body, { status: 401 });
  }
}
