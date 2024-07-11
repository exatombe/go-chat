import { APIMessage } from "discord-api-types/v10";
import Mention from "./Mentions";
import Emoji from "./Emoji";
import { Component, createMemo, For, JSX, JSXElement } from "solid-js";

export default function ContentFormatted({ content, message }: { content: string, message: APIMessage }) {
    const emojiRegex = /<a?:\w+:\d+>/g;
    const MentionUserRegex = /<@!?(\d+)>/g;
    const MentionsRolesRegex = /<@&(\d+)>/g;
    const MentionsChannelsRegex = /<#(\d+)>/g;

    const formatContent = createMemo(() => {
        const parts:unknown[] = [];
        let lastIndex = 0;

        const addTextPart = (text: string) => {
            if (text) {
                parts.push(text);
            }
        };

        let textAlreadyProcessed = content;

        function replaceWithComponent<T>(text: string, regex:RegExp, Component: Component<T>, findFunc: Function, type: string = "emoji") {
            let match;
            while ((match = regex.exec(text)) !== null) {
                addTextPart(text.substring(lastIndex, match.index));
                const id = match.length > 1 ? match[1] : match[0];
                const data = findFunc(id);
                if (data) {
                    parts.push(<Component {...data} />);
                } else {
                    parts.push(match[0]); // In case data not found, keep the original text
                }
                lastIndex = regex.lastIndex;
            }
            textAlreadyProcessed = textAlreadyProcessed.replace(regex, "");
            if(type === "emoji") {
                replaceWithComponent(textAlreadyProcessed, MentionUserRegex, Mention, (id:string) => {
                    const user = message.mentions.find((mention) => mention.id === id);
                    return user ? { user } : null;
                }, "mention");
            }else if(type === "mention") {
                replaceWithComponent(textAlreadyProcessed, MentionsRolesRegex, Mention, (id:string) => {
                    const role = message.mention_roles?.find((role) => role === id);
                    return role ? { role } : null;
                }, "mention_channel");
            }else if(type === "mention_channel") {
                replaceWithComponent(textAlreadyProcessed, MentionsChannelsRegex, Mention, (id:string) => {
                    const channel = message.mention_channels?.find((channel) => channel.id === id);
                    return channel ? { channel } : null;
                }, "final");
            }
        };

        replaceWithComponent(textAlreadyProcessed, emojiRegex, Emoji, (id:string) => ({ id }));
        addTextPart(textAlreadyProcessed.substring(lastIndex));
        return parts.map((part: unknown, index: number) => {
            if (typeof part === "string") {
                return <span>{part.replace(emojiRegex, "").replace(MentionsChannelsRegex,"").replace(MentionUserRegex,"")}</span>;
            }
            return part;
        });
    });

    return (
        <div>
            <For each={formatContent()}>{(part: any) => part}</For>
        </div>
    );
}
