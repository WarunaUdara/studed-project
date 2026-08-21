package client

import "testing"

// Masking is applied once, here, on the way out. It used to run at write time
// (baking the rule into Redis) and again twice in the frontend, so the three
// copies could and did disagree.
func TestMaskDisplayName(t *testing.T) {
	cases := []struct {
		name     string
		in       string
		expected string
	}{
		{"first name and initial", "Nimal Perera", "Nimal P."},
		{"middle names use the last name's initial", "Ama Sanduni Kumari Silva", "Ama S."},
		{"a single name is left alone", "Nimal", "Nimal"},
		{"surrounding whitespace is ignored", "  Nimal   Perera  ", "Nimal P."},
		{"an empty name falls back", "", "Student Scholar"},
		{"whitespace only falls back", "   ", "Student Scholar"},
		{"a raw uuid never leaks as a name", "3f2504e0-4f89-11d3-9a0c-0305e82c3301", "Student Scholar"},
		{"non-latin names keep their own initial", "නිමල් පෙරේරා", "නිමල් ප."},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := MaskDisplayName(tc.in); got != tc.expected {
				t.Errorf("MaskDisplayName(%q) = %q; expected %q", tc.in, got, tc.expected)
			}
		})
	}
}

// A masked name must never contain the full surname, which is the whole point.
func TestMaskDisplayName_DropsTheSurname(t *testing.T) {
	if got := MaskDisplayName("Nimal Perera"); got == "Nimal Perera" {
		t.Fatal("the surname survived masking")
	}
}
