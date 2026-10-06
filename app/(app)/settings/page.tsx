import { ScreenHeader } from "@/components/screen-header";
import { SettingsScreen } from "@/components/settings-screen";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader back={{ href: "/capture", label: "Back" }} showSettings={false} />
      <h1 className="mt-1 mb-8 text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsScreen />
    </main>
  );
}
