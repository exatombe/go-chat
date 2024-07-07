import { DiscordMessage } from "../message";

export function websocket(channelId: string) {
  const ws = new WebSocket(`ws://localhost:3000/channels/${channelId}/gateway`);
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

export async function getMessages(channelId: string): Promise<DiscordMessage[]>{
  const response = await fetch(`http://localhost:3000/channels/${channelId}/messages`);
  return response.json();
}

export async function getWebhook(channelId: string) {
  const response = await fetch(`http://localhost:3000/channels/${channelId}/webhook`, {
    method: "POST",
  });
  return response.text();
}
