import { createEffect, createSignal, Index, onMount } from "solid-js";
import { fixEncoding, getMessages, getWebhook, processMessage, sendMessage, websocket } from "./utils/api";
import { DiscordMessage, Mention } from "./message";
import {
  Dialog,
  DialogContent,
  DialogDescription, DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./components/ui/dialog";
import {
  Image,
  ImageFallback,
  ImageRoot
} from "./components/ui/image";
import {
  Button
} from "./components/ui/button";
import {
  TextField,
  TextFieldRoot
} from "./components/ui/textfield";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "./components/ui/carousel";
import { DialogTriggerProps } from "@kobalte/core/dialog";

function ContentWithEmoji({ content, mentioned }: { content: string, mentioned: Mention[] }) {
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
              <ImageRoot>
                <Image
                  src={`https://cdn.discordapp.com/emojis/${emoji[index].split(":")[2].slice(0, -1)}.${emoji[index].split(":")[0] === "<a" ? "gif" : "png"
                    }`}
                  class="w-6 h-6"
                  alt="emoji"
                />
                <ImageFallback>
                  <span>Emoji</span>
                </ImageFallback>
              </ImageRoot>
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
    <div class="flex items-center bg-gray-100 shadow-md" style={{ margin: "5px" }}>
      <ImageRoot>
        <Image src={avatarUrl} class="w-10 h-10" alt="avatar" />
        <ImageFallback>
          <span>{props.author.username}</span>
        </ImageFallback>
      </ImageRoot>
      <div style={{ "margin-left": "10px" }}>
        <h3 class="font-semibold">{props.author.username}</h3>
        {props.content ? <ContentWithEmoji content={fixEncoding(props.content)} mentioned={props.mentions} /> : null}
        {props.attachments.length > 0 ? (<Carousel class="w-full max-w-xs">
          <CarouselContent>
            <Index each={props.attachments}>
              {(attachment, index) => {
                  if (attachment().content_type.startsWith("image")) {
                    return (
                      <CarouselItem data-index={index}>
                        <img src={attachment().url} class="aspect-auto" alt={attachment().filename} />
                      </CarouselItem>
                    )
                  }

                  if (attachment().content_type.startsWith("video")) {
                    return (
                      <CarouselItem data-index={index}>
                        <video controls class="aspect-auto">
                          <source src={attachment().url} type={attachment().content_type} />
                        </video>
                      </CarouselItem>
                    )
                  }

                  return (
                    <CarouselItem data-index={index}>
                      <div class="bg-gray-200 p-2 rounded-lg flex items-center space-x-2" style={{ "max-width": "100px" }}>
                      <svg xmlns="http://www.w3.org/2000/svg"
                      width={24}
                      height={24}
                      viewBox="0 0 24 24" fill="currentColor"><path d="M3 8L9.00319 2H19.9978C20.5513 2 21 2.45531 21 2.9918V21.0082C21 21.556 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5501 3 20.9932V8ZM10 3.5L4.5 9H10V3.5Z"></path></svg>

                        <a href={attachment().url} target="_blank" rel="noreferrer">{attachment().filename}</a>
                      </div>
                    </CarouselItem>
                  )
              }}
            </Index>
          </CarouselContent>
        </Carousel>) : null}
      </div>
    </div>
  );
}


function App({ script }: { script: string }) {
  // this element will be a rounded rectangle with a shadow, that will display a chat Box when clicked
  const [messages, setMessages] = createSignal<DiscordMessage[]>([]);
  const [username, setUsername] = createSignal("");
  const parsedUrl = new URL(script);
  const [message, setMessage] = createSignal("");
  const channelId = parsedUrl.searchParams.get("channel_id") || "";
  const [webhook, setWebhook] = createSignal("");
  const [errored, setErrored] = createSignal(false);
  function scrollToBottom() {
    const chatBox = document.getElementById("chat-box") as HTMLElement;
    if (!chatBox) return;
    chatBox.scrollTop = chatBox.scrollHeight;
  }


  createEffect(() => {
    if (channelId === "") return setErrored(true);

    getWebhook(channelId).then((data) => {
      setWebhook(data);
    });
    getMessages(channelId).then((data) => {
      if (data) {
        setMessages(data.reverse())
      } else setErrored(true)
    });
  }, [channelId, username()]);

  function send() {
    if (username() == "") {
      setUsername(message());
      setMessage("");
      scrollToBottom();
      return;
    }
    if(message() !== ""){
      sendMessage(webhook(), message(), username());
    }
    setMessage("");
  }

  createEffect(() => {
    if (errored()) return;
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
       const data = processMessage(event.data) as DiscordMessage;
        console.log(data);
        // We need to update the message if the id is already in the list
        const list = messages();
        const index = list.findIndex((message) => message.id === data.id);
        list[index] = data;

        if (index !== -1) {
          setMessages(list);
          scrollToBottom();
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
    <Dialog preventScroll={true} modal={false}>
      <DialogTrigger onClick={scrollToBottom}
        as={(props: DialogTriggerProps) => (
          <div class="rounded-full shadow-md p-4 fixed right-4 cursor-pointer h-2" {...props} style={{
            bottom: "0px",
            margin: "5px",
          }}>
            <svg
              width={48}
              height={48}
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 3H14C18.4183 3 22 6.58172 22 11C22 15.4183 18.4183 19 14 19V22.5C9 20.5 2 17.5 2 11C2 6.58172 5.58172 3 10 3Z">
              </path>
            </svg>
          </div>
        )}>
      </DialogTrigger>
      <DialogContent style={{ background: "white", "max-width": "800px" }}>
        <DialogHeader class="flex items-center justify-between">
          <DialogTitle class="text-lg font-semibold">Chat</DialogTitle>
        </DialogHeader>
        <DialogDescription class="text-sm">
          {errored() ? <div class="text-red-500">An error occured</div> : null}
          {username() !== "" ? <div id="chat-box" style={{ height: "400px", overflow: "auto" }}>
            <Index each={messages()}>
              {(message) => (
                <Message {...message()} data-index={message().id} />
              )}
            </Index>
          </div> : null}
          <div class="mt-4">
            <TextFieldRoot class="flex items-center space-x-2">
              <TextField type="text" placeholder={username() ? "Send message" : "Set  Username"} onInput={(e) => setMessage(e.currentTarget.value)} value={message()} /> <Button onClick={send}>Send</Button>
            </TextFieldRoot>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

export default App;
