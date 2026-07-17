package service

import "testing"

func TestAnswersEquivalent_FractionsAndDecimals(t *testing.T) {
	cases := []struct {
		given, expected string
		want            bool
	}{
		{"0.5", "1/2", true},
		{".5", "1/2", true},
		{"1/2", "2/4", true},
		{"1 1/2", "1.5", true},
		{"-2 3/4", "-2.75", true},
		{"50%", "0.5", true},
		{`\frac{1}{2}`, "0.5", true},
		{`\dfrac{3}{4}`, "0.75", true},
		{"1,000", "1000", true},
		{"3/4", "0.5", false},
		{"1/0", "0.5", false},
		{"blue whale", "Blue Whale", true},
		{"cat", "dog", false},
		{"", "0.5", false},
	}
	for _, tc := range cases {
		if got := answersEquivalent(tc.given, tc.expected); got != tc.want {
			t.Errorf("answersEquivalent(%q, %q) = %v, want %v", tc.given, tc.expected, got, tc.want)
		}
	}
}
