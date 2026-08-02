import { CommandCenterView } from "@/features/command-center/command-center-view";

export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>;
}) {
  const { screen } = await searchParams;
  return <CommandCenterView screenLabel={screen === "b" ? "B" : "A"} />;
}
