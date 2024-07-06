package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"go-chat.com/m/ws"

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
	if err := godotenv.Load(); err != nil {
		app.logger.Fatalf("Error loading .env file: %v", err)
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
	app.router.HandleFunc("/channels/{channelID}", app.handleChannelMessages).Methods("GET")
}

func (app *application) handleChannelMessages(w http.ResponseWriter, r *http.Request) {
	hub := ws.NewHub(app.discord)
	vars := mux.Vars(r)
	channelID := vars["channelID"]

	app.discord.AddHandler(func(s *discordgo.Session, m *discordgo.MessageCreate) {
		if m.Author.ID == s.State.User.ID || m.Author.Bot || m.ChannelID != channelID {
			return
		}

		message, err := json.Marshal(map[string]interface{}{
			"author":    m.Author.Username,
			"content":   m.Content,
			"channelID": m.ChannelID,
		})
		if err != nil {
			app.logger.Printf("Error marshalling message: %v", err)
			return
		}

		hub.Broadcast <- message
	})

	go hub.Run(channelID)
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
