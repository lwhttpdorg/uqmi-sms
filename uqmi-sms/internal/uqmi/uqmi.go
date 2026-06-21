package uqmi

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os/exec"
	"regexp"
	"strings"

	"golang.org/x/text/encoding/unicode"

	"github.com/lwhttpdorg/uqmi-sms/internal/config"
)

type RawMessage struct {
	Smsc        string `json:"smsc"`
	From        string `json:"sender"`
	Timestamp   string `json:"timestamp"`
	ConcatRef   int    `json:"concat_ref"`
	ConcatPart  int    `json:"concat_part"`
	ConcatParts int    `json:"concat_parts"`
	Text        string `json:"ucs-2"`
}

type Message struct {
	ID          string `json:"id"`
	Smsc        string `json:"smsc,omitempty"`
	From        string `json:"sender"`
	Timestamp   string `json:"timestamp"`
	ConcatRef   int    `json:"concat_ref,omitempty"`
	ConcatPart  int    `json:"concat_part,omitempty"`
	ConcatParts int    `json:"concat_parts,omitempty"`
	Text        string `json:"text"`
}

type Client struct {
	cfg *config.Config
}

func NewClient(cfg *config.Config) *Client {
	return &Client{cfg: cfg}
}

func (c *Client) ReadMessage(id string) (Message, error) {
	out, err := c.run("--get-message", id, "--storage", c.cfg.Storage)
	if err != nil {
		return Message{}, fmt.Errorf("read message %s failed: %w: %s", id, err, out)
	}

	var raw RawMessage
	if err := json.Unmarshal([]byte(out), &raw); err != nil {
		return Message{}, fmt.Errorf("parse message %s JSON failed: %w", id, err)
	}

	text, err := decodeUCS2(raw.Text)
	if err != nil {
		return Message{}, fmt.Errorf("decode message %s text failed: %w", id, err)
	}

	return Message{
		ID:          id,
		Smsc:        raw.Smsc,
		From:        raw.From,
		Timestamp:   raw.Timestamp,
		ConcatRef:   raw.ConcatRef,
		ConcatPart:  raw.ConcatPart,
		ConcatParts: raw.ConcatParts,
		Text:        text,
	}, nil
}

func (c *Client) ReadAllMessages() ([]Message, error) {
	ids, err := c.ListMessages()
	if err != nil {
		return nil, err
	}
	return c.ReadMessages(ids)
}

func (c *Client) ReadMessages(ids []string) ([]Message, error) {
	if len(ids) == 0 {
		return []Message{}, nil
	}

	messages := make([]Message, 0, len(ids))
	for _, id := range ids {
		msg, err := c.ReadMessage(id)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, nil
}

func (c *Client) DeleteMessage(id string) error {
	out, err := c.run("--delete-message", id, "--storage", c.cfg.Storage)
	if err != nil {
		return fmt.Errorf("delete message %s failed: %w: %s", id, err, out)
	}
	return nil
}

func (c *Client) DeleteAllMessages() ([]string, error) {
	ids, err := c.ListMessages()
	if err != nil {
		return nil, err
	}
	return c.DeleteMessages(ids)
}

func (c *Client) DeleteMessages(ids []string) ([]string, error) {
	if len(ids) == 0 {
		return []string{}, nil
	}

	for _, id := range ids {
		if err := c.DeleteMessage(id); err != nil {
			return nil, err
		}
	}
	return ids, nil
}

func (c *Client) ListMessages() ([]string, error) {
	out, err := c.run("--list-messages", "--storage", c.cfg.Storage)
	if err != nil {
		return nil, fmt.Errorf("list messages failed: %w: %s", err, out)
	}

	re := regexp.MustCompile(`[0-9]+`)
	return re.FindAllString(out, -1), nil
}

func (c *Client) SendMessage(to, text string) error {
	out, err := c.run("--send-message", text, "--send-message-target", to)
	if err != nil {
		return fmt.Errorf("send message failed: %w: %s", err, out)
	}
	return nil
}

func (c *Client) run(args ...string) (string, error) {
	cmd := exec.Command("uqmi", append([]string{"-d", c.cfg.Device}, args...)...)
	out, err := cmd.CombinedOutput()
	return string(out), err
}

func decodeUCS2(hexText string) (string, error) {
	if hexText == "" {
		return "", nil
	}

	bs, err := hex.DecodeString(hexText)
	if err != nil {
		return "", fmt.Errorf("decode hex text failed: %w", err)
	}

	decoder := unicode.UTF16(unicode.BigEndian, unicode.IgnoreBOM).NewDecoder()
	decoded, err := decoder.Bytes(bs)
	if err != nil {
		return "", fmt.Errorf("convert UTF-16BE to UTF-8 failed: %w", err)
	}
	return string(decoded), nil
}

func IsAllDigit(s string) bool {
	for _, r := range s {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func ParseIDs(ids string) ([]string, error) {
	ids = strings.TrimSpace(ids)
	if ids == "" {
		return nil, nil
	}

	parts := strings.Split(ids, ",")
	parsed := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if !IsAllDigit(part) {
			return nil, fmt.Errorf("malformed message id %q", part)
		}
		parsed = append(parsed, part)
	}
	return parsed, nil
}

func ParseID(id string) (string, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return "", fmt.Errorf("message id is required")
	}
	if !IsAllDigit(id) {
		return "", fmt.Errorf("malformed message id %q", id)
	}
	return id, nil
}

