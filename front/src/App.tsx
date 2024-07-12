import { createEffect, createSignal, Index } from "solid-js";
import { getMessages, getWebhook, processMessage, sendMessage, websocket } from "./utils/api";
import ChatSVG from "./svgs/chat";
import CloseSVG from "./svgs/close";
import { APIMessage } from "./types/channel";
import Message from "./components/Message";






function App({ script }: { script: string }) {
  // this element will be a rounded rectangle with a shadow, that will display a chat Box when clicked
  const [messages, setMessages] = createSignal<APIMessage[]>([]);
  const [username, setUsername] = createSignal("");
  const parsedUrl = new URL(script);
  const [message, setMessage] = createSignal("");
  const [popupOpen, setPopupOpen] = createSignal(false);
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
        const data = processMessage(event.data) as APIMessage;
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
    <div>
      <div style={{ display: popupOpen() ? "none" : "block",
        "position": "fixed",
        "bottom": "20px",
        "right": "20px",
        "background": "white",
        "border-radius": "50%",
        "width": "50px",
        "height": "50px",
        "align-items": "center",
        "justify-content": "center",
        "cursor": "pointer",
        "box-shadow": "0 0 10px rgba(0, 0, 0, 0.2)",
       }} onClick={() => setPopupOpen(true)}>
       <ChatSVG />
      </div>
      <div style={{ display: popupOpen() ? "block" : "none", "position": "fixed", "top": "0", "left": "0", "right": "0", "bottom": "0", "background": "rgba(0, 0, 0, 0.5)", "z-index": "1000" }}>
        <div style={{
          "background": "white",
          "border-radius": "10px",
          "position": "absolute",
          "top": "50%",
          "left": "50%",
          "transform": "translate(-50%, -50%)",
          "width": "80%",
          "max-width": "800px",
          height: username() == "" ? "200px" : "80vh",
          "box-shadow": "0 0 10px rgba(0, 0, 0, 0.2)",
          "display": "flex",
          "flex-direction": "column",
        }}>
          <div style={{
            "display": "flex",
            "justify-content": "space-between",
            "align-items": "center",
            "padding": "20px",
            "border-bottom": "1px solid rgba(0, 0, 0, 0.1)",
          }}>
            <h2 style={{
              "margin": "0",
              "font-size": "1.5rem",
              "font-weight": "bold",
            }}>Chat</h2>
            <div
            style={{
              "cursor": "pointer",
              "padding": "10px",
              "border-radius": "50%",
              "background": "rgba(0, 0, 0, 0.1)",
            }}
            onClick={() => setPopupOpen(false)}>
              <CloseSVG />
            </div>
          </div>
          {errored() ? <div style={{
            "padding": "20px",
            "font-size": "1.2rem",
            "font-weight": "bold",
            "color": "red",
          }}>An error occured</div> : null}
          {username() !== "" ? <div id="chat-box" style={{ "max-height": "800px", "overflow": "auto", "padding": "20px", "flex": "1" }}>
            <Index each={messages()}>
              {(message) => (
                <Message {...message()} data-index={message().id} />
              )}
            </Index>
          </div> : null}
          {username() == "" ? <div style={{"max-height": "200px", "overflow": "auto", "padding": "20px"}}>
            <div style={{ "display": "flex", "justify-content": "center", "align-items": "center", "height": "100%" }}>
              <input type="text" placeholder="Set Username" style={{ "width": "100%", "padding": "10px" }} value={message()} onInput={(e) => setMessage(e.currentTarget.value)} />
              <button style={{ "padding": "10px", "background": "blue", "color": "white", "border": "none" }}
              onClick={send}
              >Set</button>
            </div>
          </div> : null}
          {username() !== "" ? <div style={{ "padding": "20px", "border-top": "1px solid rgba(0, 0, 0, 0.1)" }}>
            <div style={{ "display": "flex", "justify-content": "center", "align-items": "center" }}>
              <input type="text" placeholder="Send message" onInput={(e) => setMessage(e.currentTarget.value)} value={message()} style={{ "width": "100%", "padding": "10px" }} />
              <button style={{ "padding": "10px", "background": "blue", "color": "white", "border": "none" }} onClick={send}>Send</button>
            </div>
          </div> : null}
        </div>
      </div>
    </div>
  );
}

export default App;
