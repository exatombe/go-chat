import MarkdownIt, { StateInline } from "markdown-it";
import Token from "markdown-it/lib/token.mjs";
import { APIMessage } from "../types/channel";

export function mentionString(type: "user" | "role" | "channel", name: string) {
  return `
    <span style="color: blue; cursor: pointer; background: rgba(0, 0, 255, 0.1); padding: 2px; border-radius: 4px;" class="discord-${type}">
        ${type === "user" ? "@" + name : ""}
        ${type === "channel" ? "#" + name : ""}
        ${type === "role" ? "@" + name : ""}
    </span>
  `;
}

const nameFinder = (type: "user" | "role" | "channel", id: string, message: APIMessage) => {
  switch (type) {
    case "user":
      console.log("ID", id, message.mentions);
      return message.mentions?.find((user) => id.includes(user.id))?.username ?? "Unknown User";
    case "role":
      return message.mention_roles?.find((role) => id.includes(role)) ?? "Unknown Role";
    case "channel":
      return message.mention_channels?.find((channel) => id.includes(channel.id))?.name ?? "Unknown Channel";
    default:
      return "Unknown";
  }
};

function replaceMatch(
  state: StateInline,
  match: RegExpMatchArray,
  type: "emoji" | "user" | "role" | "channel",
  id: string,
  startPosition: number,
  message: APIMessage
): boolean {
  if (!match || !match[0]) {
    console.error("Invalid match", match);
    return false;
  }

  let token: Token;
  if (type === "emoji") {
    const emojiId = id.split(":")[2].slice(0, -1);
    if (!emojiId) {
      console.error("Invalid emoji ID", id);
      return false;
    }
    token = state.push("discord_image", "img", 0);
    token.attrSet("src", `https://cdn.discordapp.com/emojis/${emojiId}.${id.startsWith("<a:") ? "gif" : "png"}`);
    token.attrSet("alt", "emoji");
    token.attrSet("width", "24");
    token.attrSet("height", "24");
    token.attrSet("style", "margin: 0; font-size: 1.2rem; font-weight: bold");
    token.children = [];
  } else {
    token = state.push("discord_mention", "span", 1);
    token.attrSet("data-type", `${type}`);
    token.attrSet("data-id", id);
    console.log("ID", id, type);
    token.children = [];
  }

  token.markup = match[0].charAt(0) || "<";
  token.map = [startPosition, startPosition + match[0].length];
  state.pos += match[0].length;

  console.log(state);
  return true;
}



export default function discordMentionPlugin(md: MarkdownIt, options: APIMessage) {
   const emojiRegex = /<a?:\w+:\d+>/g;
    const MentionUserRegex = /<@!?(\d+)>/g;
    const MentionsRolesRegex = /<@&(\d+)>/g;
    const MentionsChannelsRegex = /<#(\d+)>/g;

  md.inline.ruler.push("discord_mentions", (state, silent): boolean => {
    if (silent) return false;

    let pos = state.pos;
    const text = state.src.slice(pos);
    let match: RegExpMatchArray | null = null;

    while (pos < state.posMax) {
      let match: RegExpMatchArray | null = null;
      for(const regex of [emojiRegex, MentionUserRegex, MentionsRolesRegex, MentionsChannelsRegex]) {
        match = regex.exec(text);
        if (match) break;
      }

      if (match) {
        const emoji = emojiRegex.test(match[0]);
        console.log("Match", match, emoji);
        const type = emojiRegex.test(match[0])
          ? "emoji"
          : MentionUserRegex.test(match[0])
          ? "user"
          : MentionsRolesRegex.test(match[0])
          ? "role"
          : "channel";
        console.log("Match", match, type);
        const id = type === "emoji" ? match[0] : match[1];

        if (replaceMatch(state, match, type, id, pos, options)) {
          pos = state.pos + match[0].length;
          continue;
        }
      }
      break;
    }

    return false;
  });

  md.renderer.rules.discord_mention = (tokens, idx) => {
    const token = tokens[idx];
    const type = token.attrGet("data-type");
    const id = token.attrGet("data-id");
    return mentionString(type as "user" | "role" | "channel", id ?? "Unknown");
  };

  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx];
    const src = token.attrGet("src");
    const alt = token.attrGet("alt");
    const width = token.attrGet("width");
    const height = token.attrGet("height");
    const style = token.attrGet("style");
    return `<img src="${src}" alt="${alt}" width="${width}" height="${height}" style="${style}">`;
  };
}

