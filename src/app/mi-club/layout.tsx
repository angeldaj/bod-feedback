import { MiClubShell } from "@/components/mi-club/shell";

export default function MiClubLayout({ children }: LayoutProps<"/mi-club">) {
  return <MiClubShell>{children}</MiClubShell>;
}
