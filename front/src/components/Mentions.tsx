import { APIChannel, APIChannelMention, APIUser } from "../types/discord";

export default function Mention({ user, channel, role }: {
    user?: APIUser,
    channel?: APIChannelMention,
    role?: string
 }) {
    return (
        <span style={{ "color": "blue", "cursor": "pointer", background: "rgba(0, 0, 255, 0.1)", "padding": "2px", "border-radius": "4px" }}>
            {user ? "@" + user.username : !channel && !role ? "@Unknown User" : null}
            {channel ? "#" + channel.name : null}
            {role ? "@" + role : null}
      </span>
    )
}
