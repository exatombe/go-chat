import { DiscordMessage } from "../message";

export function websocket(channelId: string) {
  const ws = new WebSocket(`wss://tchat.ketsuna.com/channels/${channelId}/gateway`);
  return ws;
}

export async function sendMessage(url: string, message: string, username: string) {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      content: message,
      username,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export async function getMessages(channelId: string): Promise<DiscordMessage[]|false>{
  const response = await fetch(`https://tchat.ketsuna.com/channels/${channelId}/messages`);
  if(response.ok){
  return response.json();
  }else return false;
}

export async function getWebhook(channelId: string) {
  const response = await fetch(`https://tchat.ketsuna.com/channels/${channelId}/webhook`, {
    method: "POST",
  });
  return response.text();
}


export function fixEncoding(str:string) {
  // Step 1: Convert from Latin-1 bytes to a UTF-8 string
  let bytes = new Uint8Array(str.split('').map(char => char.charCodeAt(0)));
  let latin1String = new TextDecoder('latin1').decode(bytes);

  // Step 2: Convert the UTF-8 string back to the correct format
  let correctString = new TextDecoder('utf-8').decode(new TextEncoder().encode(latin1String));
  return correctString;
}

export function processMessage(data: string) {
  // Decode the base64 string
  const decoded = atob(data);

  // Encode the decoded string as Latin-1 bytes
  const latin1Bytes = new Uint8Array(decoded.split('').map(char => char.charCodeAt(0)));

  // Decode the bytes as UTF-8
  const utf8Text = new TextDecoder('utf-8').decode(latin1Bytes);

  return JSON.parse(utf8Text);
}
