import { APIMessage, MessageType } from "../types/discord";
import ContentFormatted from "./ContentFormatted";
import { fixEncoding, getAvatar, getSticker } from "../utils/api";
import { Index } from "solid-js";
import Mention from "./Mentions";

export default function Message(props: APIMessage) {
    return (
      <div style={{ "display": "flex", "align-items": "center", "margin-top": "10px" }}>
        <img src={getAvatar(props.author)} alt="avatar" style={{ "width": "50px", "height": "50px", "border-radius": "50%" }} />
        <div style={{
          "margin-left": "10px",
          "display": "flex",
          "justify-content": "space-between",
          "flex-direction": "column",
          "align-items": "flex-start",
          "width": "100%",
        }}>
        {props.message_reference && props.referenced_message ? <div style={{
          "background": "rgba(0, 0, 0, 0.1)",
          "padding": "2px",
          "border-radius": "4px",
          "color": "black",
          "font-weight": "bold",
          "font-size": "0.8rem",
        }}>Réponse à <Mention user={props.referenced_message?.author} /> <ContentFormatted content={(props.referenced_message.sticker_items && props.referenced_message.sticker_items?.length > 1) ? "attachment" : props.referenced_message.content.slice(0,65)} message={props.referenced_message}/>
        </div> : null}
          <h3 style={{
            "margin": "0",
            "font-size": "1.2rem",
            "font-weight": "bold",
          }}>{props.author.username}</h3>
          {props.pinned ? <div style={{
            "background": "rgba(0, 0, 0, 0.1)",
            "padding": "2px",
            "border-radius": "4px",
            "color": "black",
            "font-weight": "bold",
            "font-size": "0.8rem",
          }}>Pinned Message</div> : null}
          {props.type === MessageType.ChannelPinnedMessage ? <div style={{
            "background": "rgba(0, 0, 0, 0.1)",
            "padding": "2px",
            "border-radius": "4px",
            "color": "black",
            "font-weight": "bold",
            "font-size": "0.8rem",
          }}>[SYSTEM] <Mention user={props.author} /> a épinglé un <code style={{
            "background": "rgba(0, 0, 0, 0.1)",
            "padding": "2px",
            "border-radius": "4px",
            "color": "black",
            "font-weight": "bold",
            "font-size": "0.8rem",
          }}>message</code> dans ce salon</div> : null}
          {props.sticker_items && props.sticker_items.length > 0 ? <div style={{
            "display": "flex",
            "gap": "10px",
            "flex-wrap": "wrap",
          }}>
            <Index each={props.sticker_items}>
              {(sticker, index) => (
                <img src={getSticker(sticker())} alt={sticker().name}
                 style={{
                  "width": "150px",
                  "height": "150px",
                  "border-radius": "10px",
                }} />
              )}
            </Index>
            </div> : null}
          {props.content ? <ContentFormatted content={fixEncoding(props.content)} message={props} /> : null}
          {props.attachments.length > 0 ? (<div style={{ "display": "flex", "flex-direction": "column", "gap": "10px" }}>
            <div style={{ "display": "flex", "gap": "10px", "flex-wrap": "wrap" }}>
              <Index each={props.attachments}>
                {(attachment, index) => {
                  if (attachment().content_type?.startsWith("image")) {
                    return (
                        <img src={attachment().url} style={{
                            "max-width": "100%",
                            "max-height": "300px",
                            "border-radius": "10px",
                        }} alt={attachment().filename} {...props} />
                    )
                  }

                  if (attachment().content_type?.startsWith("video")) {
                    return (
                        <video controls style={{ "max-width": "100%", "max-height": "300px", "border-radius": "10px" }}>
                          <source src={attachment().url} type={attachment().content_type} />
                        </video>
                    )
                  }

                  return (
                    <div style={{ "max-width": "100px", "max-height": "100px" }}>
                      <div style={{ "display": "flex", "align-items": "center", "gap": "5px" }}>
                        <svg xmlns="http://www.w3.org/2000/svg"
                          width={48}
                          height={48}
                          viewBox="0 0 24 24" fill="currentColor"><path d="M3 8L9.00319 2H19.9978C20.5513 2 21 2.45531 21 2.9918V21.0082C21 21.556 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5501 3 20.9932V8ZM10 3.5L4.5 9H10V3.5Z"></path></svg>

                        <a href={attachment().url} target="_blank" rel="noreferrer">{attachment().filename}</a>
                      </div>
                    </div>
                  )
                }}
              </Index>
            </div>
          </div>) : null}
        </div>
      </div>
    );
  }
