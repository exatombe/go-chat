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
}

func main() {
	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime)

	app := &application{
		logger: logger,
	}

	app.init()

	err := app.startServer(":3000")
	app.checkErr(err, "Error starting server")

	app.waitForShutdown()
}

func (app *application) init() {
	err := godotenv.Load()
	app.checkErr(err, "Error loading .env file")

	token := os.Getenv("DISCORD_BOT_TOKEN")
	if token == "" {
		app.logger.Fatal("No token provided")
	}

	discord, err := discordgo.New("Bot " + token)
	app.checkErr(err, "Error creating Discord session")

	discord.Identify.Intents = discordgo.MakeIntent(discordgo.IntentsAllWithoutPrivileged | discordgo.IntentsMessageContent)
	discord.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		app.logger.Println(r.User.Username + " is connected!")
	})

	app.discord = discord

	app.router = app.setupRouter()
}

func (app *application) setupRouter() *mux.Router {
	muxer := mux.NewRouter()
	muxer.HandleFunc("/channels/{channelID}", app.handleChannelMessages).Methods("GET")
	return muxer
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

func (app *application) startServer(addr string) error {
	server := &http.Server{
		Addr:    addr,
		Handler: app.router,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			app.logger.Fatalf("ListenAndServe error: %v", err)
		}
	}()

	err := app.discord.Open()
	if err != nil {
		return err
	}

	return nil
}

func (app *application) waitForShutdown() {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop

	app.logger.Println("Shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := app.discord.Close()
	app.checkErr(err, "Error closing Discord session")

	server := &http.Server{
		Addr:    ":3000",
		Handler: app.router,
	}
	err = server.Shutdown(ctx)
	app.checkErr(err, "Server Shutdown Failed")

	app.logger.Println("Server exited")
}

func (app *application) checkErr(err error, message string) {
	if err != nil {
		app.logger.Fatalf("%s: %v", message, err)
	}
}
