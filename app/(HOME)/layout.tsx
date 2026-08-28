import LayoutChrome from "@/components/LayoutChrome";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutChrome>{children}</LayoutChrome>;
}