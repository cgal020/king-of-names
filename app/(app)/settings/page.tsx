import { ScreenHeader } from "@/components/screen-header";
import { SettingsScreen } from "@/components/settings-screen";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader back={{ href: "/capture", label: "Back" }} showSettings={false} />
      <h1 className="type-heading mt-1 mb-8">Settings</h1>
      <SettingsScreen />
    </main>
  );
}
