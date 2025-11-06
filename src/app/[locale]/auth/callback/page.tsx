"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error);
        router.push(`/${locale}/sign-in`);
        return;
      }

      if (data.session) {
        router.push(`/${locale}/app`);
      } else {
        router.push(`/${locale}/sign-in`);
      }
    };

    handleAuthCallback();
  }, [router, locale]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Processing authentication...</p>
    </div>
  );
}

