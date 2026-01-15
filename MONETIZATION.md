# Monetization Architecture

This game is built with future revenue in mind while keeping the core gameplay intact.

## Score System

### Base Scoring

- **Serve patron**: Base score = fill level (0-100) + 50 bonus
- **Catch mug**: +20 points
- **Poor serve** (fill < 70%): +10 points only

### Combo Multiplier

Consecutive successful serves increase score multiplier:

- Each combo adds 20% multiplier (combo 1 = 1.0x, combo 2 = 1.2x, combo 5 = 1.8x, combo 10 = 2.8x)
- Combo bonuses: 50% of base score per combo level
- **Combo resets on:**
  - Missed catch (returning mug)
  - Patron timeout (patience runs out)
  - Mug falls off bar
  - 8-second timeout (no serves for 8 seconds = combo ends)

### Miss Penalties

- **Missed catch**: -15 health + lose (20 × current combo) points
- **Mug falls**: -5 health
- **Patron timeout**: -25 health + -10 points + lose combo

## Monetization Hooks

The game exposes callback hooks for ad integration. Implement these in `main.ts`:

### Available Callbacks

```typescript
interface GameCallbacks {
  onLevelComplete?: (level: number, score: number) => void;
  onGameOver?: (finalScore: number, level: number) => void;
  onComboMilestone?: (comboCount: number) => void;
  onPause?: () => void;
  onResumeAfterAd?: () => void;
}
```

### Recommended Ad Placements

1. **`onLevelComplete`** (Level Complete Screen)
   - Show interstitial ad or celebratory popup
   - ~5-10 seconds optimal for level transition
   - High engagement moment

2. **`onGameOver`** (Game Over Screen)
   - Interstitial or rewarded video
   - Option to continue with reward (extra life, score multiplier)
   - High monetization moment

3. **`onComboMilestone`** (5x, 10x, 20x Combos)
   - Short reward/celebration notification
   - Optional: Special ad for premium rewards
   - Encourages engagement with combo system

4. **`onPause`** (Pause Menu)
   - Banner ads or small interstitials
   - Continue game button
   - Optional: Rewarded video to extend time

5. **`onResumeAfterAd`** (After Ad Completion)
   - Give player bonuses (points, multiplier, health)
   - Creates positive association with ads
   - Increases willingness to watch ads

## Integration Example

See `src/app/main.ts` for a template implementation.

## Future Features

- **Leaderboards**: Track max combo, highest score per level
- **Achievements**: First 5x combo, 20x combo, etc.
- **Seasonal events**: Limited-time multipliers
- **Battle Pass**: Cosmetic rewards, ad-free pass
- **Prestige system**: Reset with permanent bonuses

## Data to Track

For analytics and revenue optimization:

- Total combos per session
- Combo breakdown (how many 3x, 5x, 10x+)
- Ad completion rate per placement
- Time between ads watched
- Level-up patterns and difficulty tuning

## No Ads Policy

The game works perfectly without ads. All hooks are optional.
