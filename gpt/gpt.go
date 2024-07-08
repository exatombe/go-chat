package gpt

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type GPT struct {
	APIKey string
}

func NewGPT() *GPT {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Println("No API key provided")
		os.Exit(1)
	}

	return &GPT{
		APIKey: apiKey,
	}
}

func (g *GPT) CreateCompletion(prompt string, imagesUrls []string) (string, error) {
	type Response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
				Role    string `json:"role"`
			} `json:"message"`
		} `json:"choices"`
	}

	type Content struct {
		Type     string `json:"type"`
		Text     string `json:"text"`
		ImageUrl struct {
			Url string `json:"url"`
		} `json:"image_url"`
	}

	type Message struct {
		Role    string    `json:"role"`
		Content []Content `json:"content"`
	}

	MessageContent := []Content{
		{
			Type: "text",
			Text: prompt,
		},
	}

	if len(imagesUrls) != 0 {
		for _, imageUrl := range imagesUrls {
			MessageContent = append(MessageContent, Content{
				Type: "image",
				ImageUrl: struct {
					Url string `json:"url"`
				}{Url: imageUrl},
			})
		}
	}

	jsonRequest, err := json.Marshal(map[string]interface{}{
		"model": "gpt-4o",
		"messages": []Message{
			{
				Role:    "user",
				Content: MessageContent,
			},
		},
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonRequest))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.APIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	var response Response
	err = json.Unmarshal(body, &response)
	if err != nil {
		return "", err
	}
	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no response from GPT")
	}
	return response.Choices[0].Message.Content, nil
}
