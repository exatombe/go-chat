import { APIChannel, APIChannelMention, APIRole, APIUser } from "discord-api-types/v10";

export default function Mention({ user, channel, role }: {
    user?: APIUser,
    channel?: APIChannelMention,
    role?: APIRole
 }) {
    return (
        <span style={{ "color": "blue", "cursor": "pointer", background: "rgba(0, 0, 255, 0.1)", "padding": "2px", "border-radius": "4px" }}>
            {user ? "@" + user.username : !channel && !role ? "@Unknown User" : null}
            {channel ? "#" + channel.name : null}
            {role ? "@" + role.name : null}
      </span>
    )
}
