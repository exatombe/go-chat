package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"time"

	"github.com/exatombe/go-chat/ws"

	"github.com/bwmarrin/discordgo"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

type application struct {
	logger  *log.Logger
	discord *discordgo.Session
	router  *mux.Router
	server  *http.Server
}

func main() {
	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime)

	app := &application{
		logger: logger,
	}

	app.init()
	app.startServer()
	app.waitForShutdown()
}

func (app *application) init() {
	if os.Getenv("DISCORD_BOT_TOKEN") == "" {
		if err := godotenv.Load(); err != nil {
			app.logger.Fatal("Error loading .env file: %v", err)
		}
	}

	token := os.Getenv("DISCORD_BOT_TOKEN")
	if token == "" {
		app.logger.Fatal("No token provided")
	}

	discord, err := discordgo.New("Bot " + token)
	if err != nil {
		app.logger.Fatalf("Error creating Discord session: %v", err)
	}

	discord.Identify.Intents = discordgo.MakeIntent(discordgo.IntentsAllWithoutPrivileged | discordgo.IntentsMessageContent)
	discord.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		app.logger.Println(r.User.Username + " is connected!")
	})

	app.discord = discord
	app.router = mux.NewRouter()
	app.router.HandleFunc("/channels/{channelID}/gateway", app.handleChannelMessages).Methods("GET")

	app.router.HandleFunc("/channels/{channelID}/messages", app.handleChannelGetMessages).Methods("GET")

	app.router.HandleFunc("/channels/{channelID}/webhook", app.handleChannelWebhook).Methods("POST")
}

// handleChannelGetMessages fetches messages from a channel in Discord
func (app *application) handleChannelGetMessages(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	channelID := vars["channelID"]
	// get any queryStrings from the request
	query := r.URL.Query()
	// get the limit query string
	limit := query.Get("limit")
	// get the before query string
	before := query.Get("before")
	// get the after query string
	after := query.Get("after")

	// If those query strings are empty, we fetch the last 100 messages
	if limit == "" {
		limit = "100"
	}

	log.Printf("limit: %v, before: %v, after: %v", limit, before, after)
	// we pass limit as an int
	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		app.logger.Printf("Error converting limit to int: %v", err)
		http.Error(w, "Error converting limit to int", http.StatusInternalServerError)
		return
	}

	messages, err := app.discord.ChannelMessages(channelID, limitInt, before, after, "")
	if err != nil {
		app.logger.Printf("Error fetching messages: %v", err)
		http.Error(w, "Error fetching messages", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

// handleChannelWebhook creates a webhook for a channel in Discord
func (app *application) handleChannelWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	channelID := vars["channelID"]

	// this route intend to return a webhook URL for the channel
	webhooks, err := app.discord.ChannelWebhooks(channelID)
	if err != nil {
		app.logger.Printf("Error fetching webhooks: %v", err)
		http.Error(w, "Error fetching webhooks", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if len(webhooks) == 0 {
		webhook, err := app.discord.WebhookCreate(channelID, "Webhook", "")
		if err != nil {
			app.logger.Printf("Error creating webhook: %v", err)
			http.Error(w, "Error creating webhook", http.StatusInternalServerError)
			return
		}

		webhookUrl := "https://discord.com/api/webhooks/" + webhook.ID + "/" + webhook.Token + "?wait=true"

		w.Write([]byte(webhookUrl))
	}

	for _, webhook := range webhooks {
		if webhook.Type == discordgo.WebhookTypeIncoming {
			webhookUrl := "https://discord.com/api/webhooks/" + webhook.ID + "/" + webhook.Token + "?wait=true"
			w.Write([]byte(webhookUrl))
			break
		}
	}
}

// handleChannelMessages handles messages from a channel in Discord
// It takes a http.ResponseWriter, a http.Request as arguments
// It returns nothing
// It creates a new hub and a new websocket connection to the hub
func (app *application) handleChannelMessages(w http.ResponseWriter, r *http.Request) {
	hub := ws.NewHub(app.discord)
	vars := mux.Vars(r)
	channelID := vars["channelID"]

	app.discord.AddHandler(func(s *discordgo.Session, m *discordgo.MessageCreate) {
		if m.Author.ID == s.State.User.ID || m.ChannelID != channelID {
			return
		}

		message, err := json.Marshal(m)
		if err != nil {
			app.logger.Printf("Error marshalling message: %v", err)
			return
		}
		// we then encode in base64 the message
		base64Message := base64.StdEncoding.EncodeToString(message)
		hub.Broadcast <- []byte(base64Message)
	})

	app.discord.AddHandler(func(s *discordgo.Session, m *discordgo.MessageUpdate) {
		if m.Author.ID == s.State.User.ID || m.ChannelID != channelID {
			return
		}

		message, err := json.Marshal(m)
		if err != nil {
			app.logger.Printf("Error marshalling message: %v", err)
			return
		}
		// we then encode in base64 the message
		base64Message := base64.StdEncoding.EncodeToString(message)
		hub.Broadcast <- []byte(base64Message)
	})

	app.discord.AddHandler(func(s *discordgo.Session, m *discordgo.MessageDelete) {
		if m.ChannelID != channelID {
			return
		}

		message, err := json.Marshal(m)
		if err != nil {
			app.logger.Printf("Error marshalling message: %v", err)
			return
		}
		// we then encode in base64 the message
		base64Message := base64.StdEncoding.EncodeToString(message)
		hub.Broadcast <- []byte(base64Message)
	})
	go hub.Run()
	ws.ServeWs(hub, w, r)
}

func (app *application) startServer() {
	app.server = &http.Server{
		Addr:    ":3000",
		Handler: app.router,
	}

	go func() {
		if err := app.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			app.logger.Fatalf("ListenAndServe error: %v", err)
		}
	}()

	if err := app.discord.Open(); err != nil {
		app.logger.Fatalf("Error opening Discord session: %v", err)
	}
}

func (app *application) waitForShutdown() {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	app.logger.Println("Shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := app.discord.Close(); err != nil {
		app.logger.Fatalf("Error closing Discord session: %v", err)
	}

	if err := app.server.Shutdown(ctx); err != nil {
		app.logger.Fatalf("Server Shutdown Failed: %v", err)
	}

	app.logger.Println("Server exited")
}
