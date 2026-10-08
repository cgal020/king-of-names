// The King of Names connector for Claude and ChatGPT (MCP over HTTP).
// Mockup: serves the sample data without sign-in, in development only.
// Real build: wrap with withMcpAuth, verify Supabase OAuth 2.1 access tokens,
// and read through a Supabase client carrying the user's token.
import { createMcpHandler } from "mcp-handler";
import { registerPeopleTools, SERVER_INSTRUCTIONS } from "@/lib/mcp/people-tools";
import { getMockMeetings, mockPeople } from "@/lib/mock/people";

const handler = createMcpHandler(
  (server) => {
    registerPeopleTools(server, {
      people: async () => mockPeople,
      meetings: async (id) => getMockMeetings(id),
    });
  },
  {
    serverInfo: { name: "king-of-names", version: "0.1.0" },
    instructions: SERVER_INSTRUCTIONS,
  },
);

// Never expose people data without sign-in outside local development.
function devOnly(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  return handler(request);
}

export { devOnly as GET, devOnly as POST, devOnly as DELETE };
