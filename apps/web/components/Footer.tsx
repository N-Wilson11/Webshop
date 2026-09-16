export function Footer({ shopName, tagline }: { shopName: string; tagline: string }) {
  return (
    <footer className="mt-16 border-t border-black/10 bg-white/50 py-8 text-center text-sm text-ink/70">
      <p className="font-display text-lg text-ink">{shopName}</p>
      <p>{tagline}</p>
      <p className="mt-2">&copy; {new Date().getFullYear()} {shopName}. All rights reserved.</p>
    </footer>
  );
}
