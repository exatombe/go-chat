package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"

	"go-chat.com/m/ws"

	"github.com/bwmarrin/discordgo"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	if os.Getenv("DISCORD_BOT_TOKEN") == "" {
		log.Fatal("No token provided")
	}
}

func main() {

	discord, err := discordgo.New("Bot " + os.Getenv("DISCORD_BOT_TOKEN"))
	if err != nil {
		log.Fatal("Error creating Discord session: ", err)
	}
	discord.Identify.Intents = discordgo.MakeIntent(discordgo.IntentsAllWithoutPrivileged | discordgo.IntentsMessageContent)
	discord.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		log.Println(r.User.Username + " is connected!")
	})
	muxer := mux.NewRouter()
	muxer.HandleFunc("/channels/{channelID}", func(w http.ResponseWriter, r *http.Request) {
		hub := ws.NewHub(discord)
		vars := mux.Vars(r)
		discord.AddHandler(func(s *discordgo.Session, m *discordgo.MessageCreate) {
			if m.Author.ID == s.State.User.ID {
				return
			}
			// ignore any message from bot / or webhook
			if m.Author.Bot {
				return
			}
			if m.ChannelID != vars["channelID"] {
				return
			}
			message, _ := json.Marshal(map[string]interface{}{
				"author":    m.Author.Username,
				"content":   m.Content,
				"channelID": m.ChannelID,
			})
			hub.Broadcast <- message
		})
		channelID := vars["channelID"]
		go hub.Run(channelID)
		ws.ServeWs(hub, w, r)
	})
	err = discord.Open()

	if err != nil {
		log.Fatal("Error opening connection: ", err)
	}

	defer discord.Close()
	err = http.ListenAndServe(":3000", muxer)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop
	log.Println("Graceful shutdown")

}
