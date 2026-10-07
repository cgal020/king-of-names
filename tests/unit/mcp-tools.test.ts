import { createMcpHandler } from "mcp-handler";
import { describe, expect, it } from "vitest";
import { registerPeopleTools } from "@/lib/mcp/people-tools";
import { getMockMeetings, mockPeople } from "@/lib/mock/people";

const handler = createMcpHandler((server) =>
  registerPeopleTools(server, { people: async () => mockPeople, meetings: async (id) => getMockMeetings(id) }),
);

// Sends one JSON-RPC request the way an MCP client does and returns the result.
async function rpc(method: string, params: object = {}) {
  const response = await handler(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
  );
  const body = await response.text();
  const data = body.includes("data:") ? body.split("data:")[1].trim() : body;
  return JSON.parse(data).result;
}

async function call(name: string, args: object) {
  const result = await rpc("tools/call", { name, arguments: args });
  return { isError: result.isError ?? false, data: JSON.parse(result.content[0].text) };
}

describe("PeopleMap MCP connector", () => {
  it("offers four read-only tools", async () => {
    const { tools } = await rpc("tools/list");
    expect(tools.map((t: { name: string }) => t.name).sort()).toEqual([
      "coming_up",
      "get_person",
      "people_near",
      "search_people",
    ]);
  });

  it("filters by tag, city and relationship together", async () => {
    const { data } = await call("search_people", { tag: "investor", city: "dubai" });
    expect(data.people.map((p: { name: string }) => p.name)).toEqual(["Omar Al-Mansouri"]);
    const personal = await call("search_people", { relationship: "personal", city: "Phuket" });
    expect(personal.data.count).toBe(2);
  });

  it("searches notes and tags, accent-insensitively", async () => {
    const { data } = await call("search_people", { query: "logistics" });
    expect(data.people.map((p: { name: string }) => p.name)).toContain("Thanakorn Wongsakul");
  });

  it("returns a full profile with every meeting", async () => {
    const { data } = await call("get_person", { id: "omar-al-mansouri" });
    expect(data.name).toBe("Omar Al-Mansouri");
    expect(data.meetings).toHaveLength(2);
    expect(data.birthday).toBe("14 November");
  });

  it("says plainly when an id doesn't exist", async () => {
    const { isError, data } = await call("get_person", { id: "nobody" });
    expect(isError).toBe(true);
    expect(data.error).toMatch(/No person/);
  });

  it("finds people near a point, nearest first", async () => {
    const { data } = await call("people_near", { latitude: 25.085, longitude: 55.145, radius_km: 25 });
    expect(data[0].name).toBe("Priya Raman");
    expect(data.every((p: { distance_km: number }) => p.distance_km <= 25)).toBe(true);
  });
});
