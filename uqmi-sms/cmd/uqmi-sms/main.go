package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"github.com/lwhttpdorg/uqmi-sms/internal/config"
	"github.com/lwhttpdorg/uqmi-sms/internal/uqmi"
)

type response struct {
	Success  bool           `json:"success"`
	Action   string         `json:"action,omitempty"`
	ID       string         `json:"id,omitempty"`
	IDs      []string       `json:"ids,omitempty"`
	Target   string         `json:"target,omitempty"`
	Messages []uqmi.Message `json:"messages,omitempty"`
	Error    string         `json:"error,omitempty"`
}

func writeJSON(resp response) {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(resp); err != nil {
		fmt.Fprintf(os.Stderr, "write JSON response failed: %s\n", err)
		os.Exit(1)
	}
}

func fail(action string, err error) {
	writeJSON(response{
		Success: false,
		Action:  action,
		Error:   err.Error(),
	})
	os.Exit(1)
}

func flagProvided(args []string, name string) bool {
	for _, arg := range args {
		if arg == name || strings.HasPrefix(arg, name+"=") {
			return true
		}
	}
	return false
}

func main() {
	fs := flag.NewFlagSet(os.Args[0], flag.ContinueOnError)
	fs.SetOutput(io.Discard)

	del := fs.Bool("delete", false, "Delete messages")
	read := fs.Bool("read", false, "Read messages")
	send := fs.Bool("send", false, "Send a message")
	msgID := fs.Int("id", -1, "Single message id")
	msgIDs := fs.String("ids", "", "Comma-separated message ids")
	target := fs.String("target", "", "Target phone number")
	text := fs.String("text", "", "SMS body")

	if err := fs.Parse(os.Args[1:]); err != nil {
		fail("parse", err)
	}
	idsProvided := flagProvided(os.Args[1:], "-ids")

	actionCount := 0
	for _, enabled := range []bool{*del, *read, *send} {
		if enabled {
			actionCount++
		}
	}
	if actionCount != 1 {
		fail("parse", fmt.Errorf("exactly one action is required: -read, -delete, or -send"))
	}
	if *msgID != -1 && idsProvided {
		fail("parse", fmt.Errorf("-id and -ids cannot be used together"))
	}

	cfg, err := config.Load()
	if err != nil {
		fail("config", err)
	}
	client := uqmi.NewClient(cfg)

	switch {
	case *read:
		handleRead(client, *msgID, *msgIDs, idsProvided)
	case *del:
		handleDelete(client, *msgID, *msgIDs, idsProvided)
	case *send:
		handleSend(client, *target, *text)
	}
}

func handleRead(client *uqmi.Client, msgID int, msgIDs string, idsProvided bool) {
	if msgID != -1 {
		id := strconv.Itoa(msgID)
		message, err := client.ReadMessage(id)
		if err != nil {
			fail("read", err)
		}
		writeJSON(response{
			Success:  true,
			Action:   "read",
			ID:       id,
			Messages: []uqmi.Message{message},
		})
		return
	}

	ids, err := uqmi.ParseIDs(msgIDs)
	if err != nil {
		fail("read", err)
	}
	if idsProvided {
		messages, err := client.ReadMessages(ids)
		if err != nil {
			fail("read", err)
		}
		writeJSON(response{
			Success:  true,
			Action:   "read",
			IDs:      ids,
			Messages: messages,
		})
		return
	}

	messages, err := client.ReadAllMessages()
	if err != nil {
		fail("read", err)
	}
	writeJSON(response{
		Success:  true,
		Action:   "read",
		Messages: messages,
	})
}

func handleDelete(client *uqmi.Client, msgID int, msgIDs string, idsProvided bool) {
	if msgID != -1 {
		id := strconv.Itoa(msgID)
		if err := client.DeleteMessage(id); err != nil {
			fail("delete", err)
		}
		writeJSON(response{
			Success: true,
			Action:  "delete",
			ID:      id,
		})
		return
	}

	ids, err := uqmi.ParseIDs(msgIDs)
	if err != nil {
		fail("delete", err)
	}
	if idsProvided {
		deletedIds, err := client.DeleteMessages(ids)
		if err != nil {
			fail("delete", err)
		}
		writeJSON(response{
			Success: true,
			Action:  "delete",
			IDs:     deletedIds,
		})
		return
	}

	deletedIds, err := client.DeleteAllMessages()
	if err != nil {
		fail("delete", err)
	}
	writeJSON(response{
		Success: true,
		Action:  "delete",
		IDs:     deletedIds,
	})
}

func handleSend(client *uqmi.Client, target, text string) {
	if target == "" || text == "" {
		fail("send", fmt.Errorf("target phone number and SMS body are required"))
	}
	if !uqmi.IsAllDigit(target) {
		fail("send", fmt.Errorf("malformed target phone number"))
	}
	if err := client.SendMessage(target, text); err != nil {
		fail("send", err)
	}
	writeJSON(response{
		Success: true,
		Action:  "send",
		Target:  target,
	})
}
