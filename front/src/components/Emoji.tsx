export default function Emoji({id}: {id: string}) {
    return (
        <img src={`https://cdn.discordapp.com/emojis/${id?.split(":")[2].slice(0, -1)}.png`} alt="emoji" width={24} height={24}
        style={{ "margin": "0", "font-size": "1.2rem", "font-weight": "bold" }}
        />
    );
}
