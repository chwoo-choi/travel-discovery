"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  session?: Session | null;
}

// 1. 컴포넌트 정의
function AuthSessionProvider({ children, session }: Props) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}


export { AuthSessionProvider };

export default AuthSessionProvider;
