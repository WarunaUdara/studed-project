package repository

import (
	"testing"
	"time"
)

func TestWeekBucket_RollsOverOnMonday(t *testing.T) {
	// 2026-08-16 is a Sunday; 2026-08-17 is the Monday that starts week 34.
	sunday := time.Date(2026, 8, 16, 23, 59, 59, 0, time.UTC)
	monday := time.Date(2026, 8, 17, 0, 0, 0, 0, time.UTC)

	if WeekBucket(sunday) == WeekBucket(monday) {
		t.Fatalf("a new week must open a new board: both sides gave %q", WeekBucket(sunday))
	}
	if got := WeekBucket(monday); got != "2026-W34" {
		t.Fatalf("expected 2026-W34, got %q", got)
	}
	// Same week, different days, must share a board.
	if WeekBucket(monday) != WeekBucket(monday.AddDate(0, 0, 5)) {
		t.Fatal("days inside one week must share a board")
	}
}

func TestLeaderboardKey_WeeklyCarriesItsWeek(t *testing.T) {
	at := time.Date(2026, 8, 17, 9, 0, 0, 0, time.UTC)

	if got := LeaderboardKey(ScopeWeekly, "", 0, at); got != "leaderboard:weekly:2026-W34" {
		t.Errorf("weekly key = %q; a key without its week never resets", got)
	}
	if got := LeaderboardKey(ScopeGlobal, "", 0, at); got != "leaderboard:global" {
		t.Errorf("global key = %q", got)
	}
	if got := LeaderboardKey(ScopeGrade, "", 11, at); got != "leaderboard:grade:11" {
		t.Errorf("grade key = %q", got)
	}
	if got := LeaderboardKey(ScopeCourse, "course-1", 0, at); got != "leaderboard:course:course-1" {
		t.Errorf("course key = %q", got)
	}
}

// The composite score has to survive a round trip exactly, or a board would
// report XP totals that drift from the ledger.
func TestCompositeScore_RoundTripsXpExactly(t *testing.T) {
	at := time.Date(2026, 8, 17, 9, 0, 0, 0, time.UTC)

	for _, xp := range []int32{0, 1, 7, 55, 100, 999, 12_345, 1_000_000, 16_000_000} {
		if got := xpFromScore(compositeScore(xp, at)); got != xp {
			t.Errorf("xp %d round-tripped to %d", xp, got)
		}
	}
}

func TestCompositeScore_NegativeXpClampsToZero(t *testing.T) {
	at := time.Date(2026, 8, 17, 9, 0, 0, 0, time.UTC)
	if got := xpFromScore(compositeScore(-500, at)); got != 0 {
		t.Errorf("negative xp should clamp to 0, got %d", got)
	}
}

// Higher XP always outranks lower XP, whenever it was reached.
func TestCompositeScore_MoreXpAlwaysWins(t *testing.T) {
	early := time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC)
	late := time.Date(2026, 12, 31, 23, 0, 0, 0, time.UTC)

	if compositeScore(100, late) <= compositeScore(99, early) {
		t.Fatal("100 XP reached late must still outrank 99 XP reached early")
	}
}

// Equal XP is broken by who got there first, per 05-Gamification/Leaderboards.md.
func TestCompositeScore_EarlierArrivalWinsATie(t *testing.T) {
	early := time.Date(2026, 8, 17, 9, 0, 0, 0, time.UTC)
	later := early.Add(time.Minute)

	if compositeScore(500, early) <= compositeScore(500, later) {
		t.Fatal("on equal XP the earlier arrival must score higher")
	}
	// One second of difference is enough to be a stable order.
	if compositeScore(500, early) == compositeScore(500, early.Add(time.Second)) {
		t.Fatal("one second apart must not collide")
	}
}

// minScoreForXp(n+1) is the boundary the rank query counts from: every member
// with more than n XP scores at or above it, and nobody with n XP does.
func TestMinScoreForXp_SeparatesAdjacentTotals(t *testing.T) {
	early := time.Date(2026, 1, 1, 0, 0, 1, 0, time.UTC)
	late := time.Date(2042, 1, 1, 0, 0, 0, 0, time.UTC)

	boundary := minScoreForXp(101)

	// The luckiest possible 100-XP member still falls below the boundary.
	if compositeScore(100, early) >= boundary {
		t.Fatal("a 100 XP member must never reach the 101 XP boundary")
	}
	// The unluckiest possible 101-XP member still reaches it.
	if compositeScore(101, late) < boundary {
		t.Fatal("a 101 XP member must always reach the 101 XP boundary")
	}
}

// A timestamp beyond the encodable window must degrade to "latest possible"
// rather than corrupting the XP bits above it.
func TestCompositeScore_ClampsOutOfRangeTimestamps(t *testing.T) {
	beyond := scoreEpoch.Add(time.Duration(scoreShift+1_000_000) * time.Second)
	before := scoreEpoch.AddDate(-5, 0, 0)

	if got := xpFromScore(compositeScore(250, beyond)); got != 250 {
		t.Errorf("a far-future timestamp corrupted the xp bits: got %d", got)
	}
	if got := xpFromScore(compositeScore(250, before)); got != 250 {
		t.Errorf("a pre-epoch timestamp corrupted the xp bits: got %d", got)
	}
}
