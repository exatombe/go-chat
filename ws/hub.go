package ws

import (
	"encoding/json"
	"log"

	"github.com/bwmarrin/discordgo"
)

type MessageWs struct {
	Author  string `json:"author"`
	Content string `json:"content"`

	ChannelID string `json:"channelID"`
}

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	Broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	discord *discordgo.Session

	channelId string
}

func NewHub(discord *discordgo.Session) *Hub {
	return &Hub{
		Broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		discord:    discord,
	}
}

func (h *Hub) Run(channelId string) {

	h.channelId = channelId
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.Broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
					msg := MessageWs{}
					err := json.Unmarshal(message, &msg)
					if err != nil {
						log.Println("Error unmarshalling message:", err)
						return
					}

					if msg.ChannelID != "" {
						continue
					}

					log.Println("Message:", msg)

					// Check if the channel already has a webhook
					webhooks, err := h.discord.ChannelWebhooks(channelId)
					if err != nil {
						log.Println("Error getting webhooks:", err)
						return
					}

					var webhook *discordgo.Webhook
					if len(webhooks) == 0 {
						// Create a new webhook to use
						webhook, err = h.discord.WebhookCreate(channelId, "Transmuter", "")
						if err != nil {
							log.Println("Error creating webhook:", err)
							return
						}
					} else {
						webhook = webhooks[0]
					}

					// Execute the webhook
					_, err = h.discord.WebhookExecute(webhook.ID, webhook.Token, false, &discordgo.WebhookParams{
						Content:  msg.Content,
						Username: msg.Author,
					})
					if err != nil {
						log.Println("Error executing webhook:", err)
					}

				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
