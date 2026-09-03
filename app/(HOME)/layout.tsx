/**
 * Navigation now lives in the root layout via LayoutChrome, so this group no
 * longer wraps anything of its own — keeping it here would double the navbar.
 */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
