import { APIMessage } from "../types/discord";
import MarkdownIt from "markdown-it";
import discordMentionPlugin from "../utils/mentions-plugin";
import { full as MarkdownItEmoji } from "markdown-it-emoji";

export default function ContentFormatted({ content, message }: { content: string, message: APIMessage }) {
const md = MarkdownIt({ html: false }).use(discordMentionPlugin, message).use(MarkdownItEmoji);
    return (
            <div innerHTML={md.render(content)}></div>
    );
}
