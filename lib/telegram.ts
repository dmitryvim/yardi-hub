interface TelegramLoginData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyTelegramHash(
  data: TelegramLoginData,
  botToken: string
): Promise<boolean> {
  const { hash, ...rest } = data;

  const dataCheckString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .filter((entry) => !entry.endsWith("=undefined"))
    .join("\n");

  // SHA-256 of bot token as the secret key
  const encoder = new TextEncoder();
  const tokenData = encoder.encode(botToken);
  const secretKeyBuffer = await crypto.subtle.digest("SHA-256", tokenData);

  // HMAC-SHA256 of data check string
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secretKeyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(dataCheckString)
  );

  const computedHash = bytesToHex(new Uint8Array(signature));
  return computedHash === hash;
}

export function isTelegramAuthRecent(authDate: string): boolean {
  const authTimestamp = parseInt(authDate, 10);
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 24 * 60 * 60; // 24 hours
  return now - authTimestamp < maxAge;
}
