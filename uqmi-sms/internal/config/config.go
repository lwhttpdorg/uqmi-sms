package config

import (
	"fmt"
	"os/exec"
	"strings"
)

const (
	DefaultDevice  = "/dev/cdc-wdm0"
	DefaultStorage = "me"
)

type Config struct {
	Device  string
	Storage string
}

func Load() (*Config, error) {
	device, err := uciGet("uqmi_sms", "main", "device")
	if err != nil {
		device = DefaultDevice
	}

	storage, err := uciGet("uqmi_sms", "main", "storage")
	if err != nil {
		storage = DefaultStorage
	}

	return &Config{
		Device:  strings.TrimSpace(device),
		Storage: strings.TrimSpace(storage),
	}, nil
}

func uciGet(config, section, option string) (string, error) {
	cmd := exec.Command("uci", "-q", "get", fmt.Sprintf("%s.%s.%s", config, section, option))
	out, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(out)), nil
}
