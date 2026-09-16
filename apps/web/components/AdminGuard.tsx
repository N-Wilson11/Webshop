"use client";

import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAdminToken, isTokenValid, clearAdminToken } from "@/lib/admin-api";

export function AdminGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ok" | "denied">("checking");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const token = getAdminToken();
      if (!token) {
        setStatus("denied");
        return;
      }
      try {
        const valid = await isTokenValid();
        setStatus(valid ? "ok" : "denied");
      } catch {
        setStatus("denied");
      }
    }
    check();
  }, [pathname]);

  if (status === "checking") {
    return <p className="text-center text-ink/60">Checking credentials…</p>;
  }

  if (status === "denied") {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4 text-ink/70">You need to sign in to access the CMS.</p>
        <Link href="/admin" className="text-primary underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-xl bg-white/60 px-4 py-2 text-sm">
        <nav className="flex gap-4">
          <Link href="/admin/products" className="hover:underline">
            Products
          </Link>
          <Link href="/admin/theme" className="hover:underline">
            Theme
          </Link>
        </nav>
        <button
          onClick={() => {
            clearAdminToken();
            router.push("/admin");
          }}
          className="text-accent hover:underline"
        >
          Log out
        </button>
      </div>
      {children}
    </div>
  );
}
