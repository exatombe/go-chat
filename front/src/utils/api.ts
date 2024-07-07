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
