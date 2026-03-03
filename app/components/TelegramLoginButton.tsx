"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function TelegramLoginButton({ botUsername }: { botUsername: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onTelegramAuth = (user: Record<string, string>) => {
      signIn("telegram", {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
        auth_date: user.auth_date,
        hash: user.hash,
        callbackUrl,
      });
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).onTelegramAuth;
    };
  }, [callbackUrl]);

  return <div ref={containerRef} />;
}
