# Tier Intervention System - Quick Reference

## Capture & Aggregation
- **Frame Capture**: Every 4 seconds (15 frames/minute)
- **20s Window**: 5 frames → Short-term emotion
- **60s Window**: 15 frames → Long-term trend

## Tier Interventions

| Tier | Emotion | Duration | Attention | Message | Actions |
|------|---------|----------|-----------|---------|---------|
| **1** | Confused | 1.5-2 min | Any | "Looks like this is getting tough…" | Simplify, Explain, Continue |
| **2** | Bored | 3-4 min | Low/Medium | "Feeling bored?" | Quiz, Flashcards, Interactive |
| **3** | Tired | 4-5 min | Low/Inactive | "You look tired…" | Break, Water, Exercise |
| **4** | Away | 1 min idle | Away | "You've been away…" | Continue, End Session |

## Cooldown System
- **Global Cooldown**: 120 seconds (2 minutes)
- **Applies To**: ALL tiers
- **Effect**: Minimum 2 minutes between ANY interventions

## Timeline Example

```
Time    Emotion    Duration    Action
────────────────────────────────────────────────
0:00    Focused    -           No intervention
0:30    Confused   30s         No intervention (too short)
1:00    Confused   60s         No intervention (too short)
1:30    Confused   90s         ✅ TIER 1 TRIGGERED
                               (Cooldown starts)
2:00    Bored      30s         ⏸️ Blocked (cooldown)
2:30    Bored      60s         ⏸️ Blocked (cooldown)
3:00    Bored      90s         ⏸️ Blocked (cooldown)
3:30    Bored      120s        ⏸️ Blocked (cooldown ends at 3:30)
3:40    Bored      130s        ⏸️ Blocked (not in tier range yet)
5:00    Bored      210s        ✅ TIER 2 TRIGGERED
                               (Cooldown starts)
7:00    Tired      120s        ⏸️ Blocked (cooldown)
7:30    Tired      150s        ✅ Cooldown ended, but duration too short
9:00    Tired      270s        ✅ TIER 3 TRIGGERED
```

## Key Points

### ✅ DO:
- Wait for minimum duration before triggering
- Respect global cooldown (2 minutes)
- Check attention state for Tiers 2 & 3
- Track emotion duration accurately

### ❌ DON'T:
- Trigger interventions too early
- Bypass cooldown for different tiers
- Ignore attention state requirements
- Show multiple alerts in quick succession

## Code Locations

| Component | File | Purpose |
|-----------|------|---------|
| Tier Config | `kiro.config.ts` | Timing & messages |
| Tier Logic | `TierEvaluator.ts` | Evaluation & cooldown |
| Frame Capture | `EmotionDetector.tsx` | 4-second captures |
| Integration | `EmotionDetectorWithKiro.tsx` | Connects everything |
| Windows | `SlidingWindowManager.ts` | 20s & 60s aggregation |

## Debugging

### Console Logs to Watch:
```
✅ Tier X intervention: action (duration: Xs)  ← Intervention triggered
⏸️ Global cooldown active (Xs / 120s)         ← Cooldown blocking
🎯 Focused (85.3%) | Attention: high          ← Normal operation
```

### Check These:
1. Emotion duration tracking
2. Global cooldown enforcement
3. Attention state matching
4. Tier timing ranges

---

**Quick Tip**: If alerts are still flooding, check that `canTriggerGlobal()` is being called in `TierEvaluator.ts` for ALL tier checks.
