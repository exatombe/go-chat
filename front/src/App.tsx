import { createEffect, createSignal, Index, JSX, onMount } from "solid-js";
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
import { Portal } from "solid-js/web";

function ContentWithEmoji({ content, mentioned }: { content: string, mentioned: Mention[] }) {
  const emojiRegex = /<a?:\w+:\d+>/g;
  const emoji = content.match(emojiRegex);

  // we need to replace mentions in the message also by username
  // many emoji can be present in a single message so we need to manage every single emoji in the message

  if (emoji) {
    const parts = content.split(emojiRegex);
    return (
      <div class="gochat-flex gochat-items-center">
        {parts.map((part, index) => (
          <>
            {part}
            {emoji[index] ? (
              <img src={`https://cdn.discordapp.com/emojis/${emoji[index].split(":")[2].slice(0, -1)}.png`} alt="emoji" width={24} height={24} class="gochat-mx-1" />
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
              <span class="gochat-bg-blue-100 gochat-text-blue-500 gochat-p-1 gochat-rounded-lg">
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
    <div class="gochat-flex gochat-items-center gochat-bg-gray-100 gochat-shadow-md gochat-space-x-2 gochat-p-2">
      <img src={avatarUrl} alt="avatar" class="gochat-w-10 gochat-h-10 gochat-rounded-full" />
      <div class="gochat-flex gochat-flex-col gochat-space-y-2 gochat-p-2 gochat-w-full" style={{
        "margin-left": "10px",
      }}>
        <h3 class="gochat-font-semibold">{props.author.username}</h3>
        {props.pinned ? <div class="gochat-bg-yellow-200 gochat-p-1 gochat-rounded-lg">Pinned Message</div> : null}
        {props.content ? <ContentWithEmoji content={fixEncoding(props.content)} mentioned={props.mentions} /> : null}
        {props.attachments.length > 0 ? (<Carousel class="gochat-w-full gochat-max-w-xs">
          <CarouselContent>
            <Index each={props.attachments}>
              {(attachment, index) => {
                if (attachment().content_type.startsWith("image")) {
                  return (
                    <CarouselItem data-index={index}>
                      <Dialog>
                        <DialogTrigger as={(props: DialogTriggerProps<HTMLImageElement>) => <img src={attachment().url} class="gochat-rounded-lg gochat-object-cover gochat-aspect-[16/9]" alt={attachment().filename} height={300} width={200} {...props} />} />
                        <DialogContent>
                          <DialogTitle>{attachment().filename}</DialogTitle>
                          <DialogDescription>
                            <img src={attachment().url} class="gochat-rounded-lg gochat-object-cover gochat-aspect-auto" alt={attachment().filename} style={{ "max-width": "80%" }} />
                          </DialogDescription>
                        </DialogContent>
                      </Dialog>
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
                    <div class="gochat-bg-gray-200 gochat-p-2 gochat-rounded-lg gochat-flex gochat-items-center gochat-space-x-2" style={{ "max-width": "100px" }}>
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
    if (message() !== "") {
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
    <Portal useShadow={true}>
      <Dialog preventScroll={true} modal={true}>
        <DialogTrigger onClick={scrollToBottom}
          as={(props: DialogTriggerProps<HTMLDivElement>) => (
            <div {...props} style={{
              bottom: "50px",
              background: "white",
              position: "fixed",
              right: "10px",
              padding: "5px",
              "border-radius": "50%",
              border: "1px solid black",
            }}>
              <svg
                width={48}
                color="black"
                height={48}
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 3H14C18.4183 3 22 6.58172 22 11C22 15.4183 18.4183 19 14 19V22.5C9 20.5 2 17.5 2 11C2 6.58172 5.58172 3 10 3Z">
                </path>
              </svg>
            </div>
          )}>
        </DialogTrigger>
        <DialogContent>
          <Portal useShadow={true}>
          <DialogHeader class="gochat-flex gochat-items-center gochat-justify-between">
            <DialogTitle class="gochat-text-lg gochat-font-semibold">Chat</DialogTitle>
          </DialogHeader>
          <DialogDescription class="gochat-text-sm gochat-container gochat-mx-auto gochat-p-4 gochat-max-w-lg">
            {errored() ? <div class="gochat-text-red-500">An error occured</div> : null}
            {username() !== "" ? <div id="chat-box" style={{ "max-height": "800px", overflow: "auto" }}>
              <Index each={messages()}>
                {(message) => (
                  <Message {...message()} data-index={message().id} />
                )}
              </Index>
            </div> : null}
            <div class="gochat-mt-4">
              <TextFieldRoot class="gochat-flex gochat-items-center gochat-space-x-2">
                <TextField type="text" placeholder={username() ? "Send message" : "Set  Username"} onInput={(e) => setMessage(e.currentTarget.value)} value={message()} /> <Button onClick={send}>Send</Button>
              </TextFieldRoot>
            </div>
          </DialogDescription>
          </Portal>
        </DialogContent>
      </Dialog>
    </Portal>
  );
}

export default App;
