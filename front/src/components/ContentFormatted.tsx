import { APIMessage } from "../types/discord";
import MarkdownIt from "markdown-it";

const md = MarkdownIt({
    html: false,
    langPrefix: 'language-',
    linkify: true,
});

md.options.highlight = (str, lang) => {
    if (lang && md.utils.escapeHtml(lang) !== lang) {
        return `<pre class="language-${lang}"><code class="language-${lang}">${md.utils.escapeHtml(str)}</code></pre>`;
    }else{
        return `<pre class="language-"><code class="language-">${md.utils.escapeHtml(str)}</code></pre>`;
    }
};

md.linkify.set({ fuzzyEmail: false });

md.renderer.renderAttrs = (token) => {
    if (token.type === "link_open") {
        return ` target="_blank" style="color: #7289da; text-decoration: none; cursor: pointer;" href="${token.attrGet("href")}"`;
    }
    // for any other token type return the default renderer
    return ` ${token.attrs?.map(([key, value]) => `${key}="${value}"`).join(" ") ?? ""}`;
};


export default function ContentFormatted({ content, message }: { content: string, message: APIMessage }) {
    const emojiRegex = /<a?:\w+:\d+>/g;
    const MentionUserRegex = /<@!?(\d+)>/g;
    const MentionsRolesRegex = /<@&(\d+)>/g;
    const MentionsChannelsRegex = /<#(\d+)>/g;
    const textFormattedWithMentionsAndEmojis = content.replace(emojiRegex, (match) => {
        return `![emoji](https://cdn.discordapp.com/emojis/${match.split(":")[2].slice(0, -1)}.${match.startsWith("<a:") ? "gif" : "png"}?size=32)`;
    }).replace(MentionUserRegex, (match, id) => {
        const name = message.mentions.find(user => user.id === id)?.username;
        return `[@${name}](https://discord.com/users/${id})`;
    }).replace(MentionsRolesRegex, (match, id) => {
        return `[@${id}:role](https://discord.com/channels/${message.author.id})`
    }).replace(MentionsChannelsRegex, (match, id) => {
        return `[#${id}:channel](https://discord.com/channels/${message.author.id})`
    });

    const text = md.render(textFormattedWithMentionsAndEmojis);

    return (
            <div innerHTML={text}></div>
    );
}
