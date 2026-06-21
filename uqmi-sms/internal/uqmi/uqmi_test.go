package uqmi

import (
	"reflect"
	"testing"
)

func TestIsAllDigit(t *testing.T) {
	cases := []struct {
		input string
		want  bool
	}{
		{"123", true},
		{"0", true},
		{"", true},
		{"12a", false},
		{"+123", false},
		{"12 3", false},
	}

	for _, c := range cases {
		got := IsAllDigit(c.input)
		if got != c.want {
			t.Errorf("IsAllDigit(%q) = %v, want %v", c.input, got, c.want)
		}
	}
}

func TestParseID(t *testing.T) {
	cases := []struct {
		input   string
		want    string
		wantErr bool
	}{
		{"123", "123", false},
		{" 456 ", "456", false},
		{"", "", true},
		{"12a", "", true},
	}

	for _, c := range cases {
		got, err := ParseID(c.input)
		if (err != nil) != c.wantErr {
			t.Errorf("ParseID(%q) error = %v, wantErr %v", c.input, err, c.wantErr)
			continue
		}
		if got != c.want {
			t.Errorf("ParseID(%q) = %q, want %q", c.input, got, c.want)
		}
	}
}

func TestParseIDs(t *testing.T) {
	cases := []struct {
		input   string
		want    []string
		wantErr bool
	}{
		{"", nil, false},
		{"1,2,3", []string{"1", "2", "3"}, false},
		{" 1 , 2 ", []string{"1", "2"}, false},
		{"1,a,3", nil, true},
	}

	for _, c := range cases {
		got, err := ParseIDs(c.input)
		if (err != nil) != c.wantErr {
			t.Errorf("ParseIDs(%q) error = %v, wantErr %v", c.input, err, c.wantErr)
			continue
		}
		if !reflect.DeepEqual(got, c.want) {
			t.Errorf("ParseIDs(%q) = %v, want %v", c.input, got, c.want)
		}
	}
}
