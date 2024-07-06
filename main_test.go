package main

import (
	"log"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gorilla/websocket"
)

func BenchmarkHandleChannelMessages(b *testing.B) {
	app := &application{
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}
	app.init()

	server := httptest.NewServer(app.router)
	defer server.Close()

	channelID := "1258912186244268104"
	url := "ws" + server.URL[4:] + "/channels/" + channelID // convert http to ws

	// Define WebSocket dialer
	dialer := websocket.DefaultDialer

	for i := 0; i < b.N; i++ {
		// Establish WebSocket connection
		wsConn, _, err := dialer.Dial(url, nil)
		if err != nil {
			b.Fatalf("Failed to establish WebSocket connection: %v", err)
		}

		// Here you could send and receive messages to/from the WebSocket if needed
		// For example: wsConn.WriteMessage(websocket.TextMessage, []byte("test message"))

		wsConn.Close()
	}
}
