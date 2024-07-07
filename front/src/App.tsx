import { createEffect, createSignal } from "solid-js";
import { getMessages, getWebhook, sendMessage, websocket } from "./utils/api";
import { DiscordMessage, Mention } from "./message";

function ContentWithEmoji({ content, mentioned }: { content: string, mentioned: Mention[]}) {
  const emojiRegex = /<a?:\w+:\d+>/g;
  const emoji = content.match(emojiRegex);

  // we need to replace mentions in the message also by username
// many emoji can be present in a single message so we need to manage every single emoji in the message

  if (emoji) {
    const parts = content.split(emojiRegex);
    return (
      <div class="flex items-center">
        {parts.map((part, index) => (
          <>
            {part}
            {emoji[index] ? (
              <img
                src={`https://cdn.discordapp.com/emojis/${emoji[index].split(":")[2].slice(0, -1)}.${
                  emoji[index].split(":")[0] === "<a" ? "gif" : "png"
                }`}
                class="w-6 h-6"
                alt="emoji"
              />
            ) : null}
          </>
        ))}
      </div>
    );
  }
// a mention look like this : <@859737433675399180>
// we need to replace it by the username of the user or by "Unknown User" if the user is not found
  const mentionRegex = /<@!*&*[0-9]+>/g;
  const mentions = content.match(mentionRegex);
  if (mentions) {
    const parts = content.split(mentionRegex);
    return (
      <div class="flex items-center">
        {parts.map((part, index) => (
          <>
            {part}
            {mentions[index] ? (
              <span class="bg-blue-100 text-blue-500 p-1 rounded-lg">
                @{mentioned.find((mention) => mentions[index].includes(mention.id))?.username || "Unknown User"}
              </span>
            ) : null}
          </>
        ))}
      </div>
    );
  }

  return <div>{content}</div>;
}


function Message(props: DiscordMessage) {

  let avatarUrl = `https://cdn.discordapp.com/avatars/${props.author.id}/${props.author.avatar}.png`;

  // we need to handle the case where the props.avatar.avatar is empty
  if (props.author.avatar === "") {
    avatarUrl = `https://cdn.discordapp.com/embed/avatars/1.png`
  }

  return (
    <div class="flex items-center mt-4">
      <img src={avatarUrl} class="w-10 h-10 rounded-full" alt="avatar" />
      <div class="ml-2">
        <h3 class="font-semibold">{props.author.username}</h3>
        {props.content ? <ContentWithEmoji content={props.content} mentioned={props.mentions}/> : null}
        {props.attachments.length > 0 ? props.attachments.map((attachment) => {
          if(attachment.content_type.startsWith("image")) {
            return (
              <img src={attachment.url} class="aspect-auto" alt={attachment.filename} />
            )
          }

          if(attachment.content_type.startsWith("video")) {
            return (
              <video controls class="aspect-auto">
                <source src={attachment.url} type={attachment.content_type} />
              </video>
            )
          }

          if(attachment.content_type.startsWith("text")) {
            return (
              <iframe src={
                attachment.url
              } class="aspect-auto" />
            )
          }

          return (
            <a href
            ={attachment.url} target="_blank" rel="noreferrer">{attachment.filename}</a>
          )
        }): null}
      </div>
    </div>
  );
}


function App({ script }: { script: string }) {
  // this element will be a rounded rectangle with a shadow, that will display a chat Box when clicked
  const [chatBox, setChatBox] = createSignal(false);
  const [messages, setMessages] = createSignal<DiscordMessage[]>([]);
  const [username, setUsername] = createSignal("");
  const parsedUrl = new URL(script);
  const [message, setMessage] = createSignal("");
  const channelId = parsedUrl.searchParams.get("channel_id") || "";
  const [webhook, setWebhook] = createSignal("");
  const [errored, setErrored] = createSignal(false);
  function scrollToBottom() {
    const chatBox = document.getElementById("chat-box") as HTMLElement;
    chatBox.scrollTop = chatBox.scrollHeight;
  }


  createEffect(() => {
    if(channelId === "") return setErrored(true);

    getWebhook(channelId).then((data) => {
      setWebhook(data);
    });
    getMessages(channelId).then((data) => {
      if(data){
              setMessages(data.reverse())
      }else setErrored(true)
    });
  }, [channelId, username()]);

  setTimeout(() => {
    scrollToBottom();
  }, 1000);
  function send() {
    if (username() == "") {
      setUsername(message());
      setMessage("");
      return;
    }
    sendMessage(webhook(), message(), username());
    setMessage("");
  }

  createEffect(() => {
    if(errored()) return;
    // first we need to get last messages
    // when i click on enter my message need to be send
    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        send();
      }
    });
    const ws = websocket(channelId);
    ws.onmessage = (event) => {
      try {
        const decode = atob(event.data);

        // Decode as Latin-1 (ISO-8859-1)
        const latin1Bytes = new TextEncoder().encode(decode);

        // Re-encode as UTF-8
        const utf8Text = new TextDecoder("utf-8").decode(latin1Bytes);
        const data = JSON.parse(utf8Text) as DiscordMessage;
        // We need to update the message if the id is already in the list
        const index = messages().findIndex((message) => message.id === data.id);
        if (index !== -1) {
          setMessages((prev) => {
            prev[index] = data;
            return prev;
          });
          return;
        }
        setMessages((prev) => [...prev, data]);
        scrollToBottom();
      } catch (err) {
        console.error(err);
      }
    };
  }, [channelId]);
  return (
    <div>
      <div class="rounded-full shadow-md p-4 fixed bottom-4 right-4 cursor-pointer" onclick={() => setChatBox(true)}>
      <svg
      class="w-8 h-8 text-black"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3H14C18.4183 3 22 6.58172 22 11C22 15.4183 18.4183 19 14 19V22.5C9 20.5 2 17.5 2 11C2 6.58172 5.58172 3 10 3Z"></path></svg>
      </div>
      <div class="fixed bottom-4 right-4 bg-white rounded-lg shadow-md p-4
      h-auto w-96" style={{ display: chatBox() ? 'block' : 'none' }}>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Chat</h2>
          <div class="text-2xl cursor-pointer
            hover:bg-gray-100 rounded-full p-2"
            onclick={() => setChatBox(false)}
          >
          <svg
          class="w-8 h-8 text-black"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path></svg>
          </div>
        </div>
        {errored() ? <div class="text-red-500">An error occured</div> : null}
       <div class="mt-4 h-3/4 overflow-y-auto" id="chat-box">
          {messages().map((message) => (
            <Message {...message} />
          ))}
        </div>

        <div class="mt-4">
          <input type="text" placeholder={username() ? "Send message" : "Set  Username"} class="w-full border-2 border-gray-200 p-2 rounded-lg" onInput={(e) => setMessage(e.currentTarget.value)} value={message()} />
        </div>
        <br />
        <br />
      </div>
    </div>
  );
}

export default App;
