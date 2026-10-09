import "server-only";
// Opens a card's link on the server, carefully: only http(s) on the default
// port, only public addresses (checked on what DNS returns, at connect time,
// so a name can't switch to a private address in between), at most four
// redirects each checked the same way, eight seconds and 1.5 MB at most.
import { lookup, type LookupAddress, type LookupOptions } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import zlib from "node:zlib";
import { safeWebUrl } from "@/lib/cards/links";
import { isPublicAddress } from "@/lib/cards/public-address";

export class LinkFetchError extends Error {}

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 4;
const USER_AGENT = "Mozilla/5.0 (compatible; KingOfNames/1.0; +https://kingofnames.app)";

export type FetchedLink = { url: string; contentType: string; body: string };

const publicLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { ...(options as LookupOptions), all: true }, (error, addresses: LookupAddress[]) => {
    if (error) return callback(error, "", 0);
    const allowed = addresses.filter((a) => isPublicAddress(a.address));
    if (!allowed.length) return callback(Object.assign(new Error("Not a public address"), { code: "EBLOCKED" }), "", 0);
    if ((options as LookupOptions).all) return (callback as (e: null, a: LookupAddress[]) => void)(null, allowed);
    callback(null, allowed[0].address, allowed[0].family);
  });
};

type Response = { status: number; headers: http.IncomingHttpHeaders; body: Buffer };

function get(url: URL, signal: AbortSignal): Promise<Response> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.get(
      url,
      {
        lookup: publicLookup,
        signal,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml,text/vcard,text/x-vcard;q=0.9,*/*;q=0.5",
          "accept-encoding": "gzip, deflate, br",
          "accept-language": "en",
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          response.resume();
          return resolve({ status, headers: response.headers, body: Buffer.alloc(0) });
        }
        const encoding = String(response.headers["content-encoding"] ?? "").toLowerCase();
        const stream =
          encoding === "gzip"
            ? response.pipe(zlib.createGunzip())
            : encoding === "br"
              ? response.pipe(zlib.createBrotliDecompress())
              : encoding === "deflate"
                ? response.pipe(zlib.createInflate())
                : response;
        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (chunk: Buffer) => {
          if (size >= MAX_BYTES) return;
          size += chunk.length;
          chunks.push(chunk);
          // The start of a long page is enough to read a card from.
          if (size >= MAX_BYTES) {
            resolve({ status, headers: response.headers, body: Buffer.concat(chunks).subarray(0, MAX_BYTES) });
            request.destroy();
          }
        });
        stream.on("end", () => resolve({ status, headers: response.headers, body: Buffer.concat(chunks) }));
        stream.on("error", reject);
      },
    );
    request.on("error", reject);
  });
}

function decode(body: Buffer, contentType: string) {
  const declared = /charset=([\w-]+)/i.exec(contentType)?.[1] ?? /<meta[^>]+charset=["']?([\w-]+)/i.exec(body.subarray(0, 2048).toString("latin1"))?.[1];
  try {
    return new TextDecoder(declared ?? "utf-8").decode(body);
  } catch {
    return new TextDecoder("utf-8").decode(body);
  }
}

export async function fetchCardLink(start: string): Promise<FetchedLink> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let url = safeWebUrl(start);
  for (let hop = 0; url && hop <= MAX_REDIRECTS; hop++) {
    const response = await get(url, signal);
    const location = response.headers.location;
    if (response.status >= 300 && response.status < 400 && location) {
      url = safeWebUrl(new URL(location, url).toString());
      continue;
    }
    if (response.status !== 200) throw new LinkFetchError(`HTTP ${response.status}`);
    const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
    return { url: url.toString(), contentType, body: decode(response.body, contentType) };
  }
  throw new LinkFetchError(url ? "Too many redirects" : "Not a link we open");
}
