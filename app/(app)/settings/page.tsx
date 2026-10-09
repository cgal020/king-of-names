import { ScreenHeader } from "@/components/screen-header";
import { SettingsScreen } from "@/components/settings-screen";
import { getAccount, listInvites } from "@/lib/data/account";
import { listPeople } from "@/lib/data/people";

export default async function SettingsPage() {
  const [account, invites, people] = await Promise.all([getAccount(), listInvites(), listPeople()]);
  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader back={{ href: "/capture", label: "Back" }} showSettings={false} />
      <h1 className="type-heading mt-1 mb-8">Settings</h1>
      <SettingsScreen account={account} invites={invites} people={people} />
    </main>
  );
}
