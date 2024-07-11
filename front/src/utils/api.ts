import { APIMessage, APIStickerItem, APIUser, StickerFormatType } from "discord-api-types/v10"
export function websocket(channelId: string) {
  const ws = new WebSocket(`wss://tchat.ketsuna.com/channels/${channelId}/gateway`);
  return ws;
}

const discordCDN = "https://cdn.discordapp.com";

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

export function getAvatar(userAPI: APIUser) {
  if (!userAPI.avatar) return `${discordCDN}/embed/avatars/${Number(userAPI.discriminator) % 5}.png`;
  return `${discordCDN}/avatars/${userAPI.id}/${userAPI.avatar}.${userAPI.avatar?.startsWith("a_") ? "gif" : "png"}`;
}

export function getSticker(sticker: APIStickerItem){
  if(sticker.format_type === StickerFormatType.Lottie) return `${discordCDN}/stickers/${sticker.id}.png`;
  if(sticker.format_type === StickerFormatType.GIF) return `https://media.discordapp.net/stickers/${sticker.id}.gif`;
  return `${discordCDN}/stickers/${sticker.id}.${sticker.format_type === StickerFormatType.PNG ? "png" : "apng"}`;
}

export async function getMessages(channelId: string): Promise<APIMessage[]|false>{
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
