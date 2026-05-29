# HealthKit setup for the Fitness tab

The Fitness tab works on every build out of the box — when HealthKit isn't
wired up it just renders empty-state cards alongside the real workout /
volume / consistency numbers from Supabase. To turn on the heart-rate,
calorie-burn, and Apple-Watch-sourced cards you need three things:

## 1. Install the native module

```sh
npx expo install @kingstinct/react-native-healthkit
```

The hook (`hooks/useHealthKit.ts`) `require`s this lazily — if the module
isn't installed yet the screen falls back to `status: 'unavailable'`, so
shipping without the module is safe.

## 2. Add the HealthKit capability + Info.plist strings

Because this app uses `newArchEnabled` + the Expo prebuild flow, the cleanest
path is a config plugin. Add to `app.json` under `expo.plugins`:

```json
"plugins": [
  …
  [
    "@kingstinct/react-native-healthkit",
    {
      "NSHealthShareUsageDescription": "MacroVault uses your Apple Health and Apple Watch data to show your workout intensity, heart rate, and calorie burn alongside the data you log in MacroVault.",
      "NSHealthUpdateUsageDescription": "MacroVault saves your workouts and meals to Apple Health so they're available in Fitness, Activity, and other connected apps."
    }
  ]
]
```

Both strings must be the exact copy above — vague phrasing gets rejected in
App Review.

If you prefer raw Xcode (no plugin):

1. Open `ios/macrovaultmobile.xcworkspace`
2. Select the target → Signing & Capabilities → `+ Capability` → HealthKit
3. Open `ios/macrovaultmobile/Info.plist` → add both strings above

## 3. Rebuild with the dev client

```sh
npx expo prebuild --clean
eas build --profile development --platform ios
# or, locally:
npx expo run:ios
```

After installing the new build, opening the Fitness tab triggers the
permission sheet on first visit (not on app launch). Approve everything to
see real Apple Watch data.

## What gets written back to Apple Health

When the user finishes a workout in MacroVault, `useHealthKit` saves an
`HKWorkout` sample tagged with `MacroVaultWorkoutID` metadata.

When a meal lands in `food_logs`, four `HKQuantitySample` rows are written
(kcal / protein / carbs / fat) under the same metadata tag.

The metadata lets MacroVault filter its own writes out on read-back so the
"From Apple Health" cards never double-count.

## Read predicates per card

| Card               | HealthKit type                                          | Query                              |
| ------------------ | ------------------------------------------------------- | ---------------------------------- |
| Workouts count     | `HKWorkoutType`                                         | sample count this month            |
| Avg HR             | `HKQuantityTypeIdentifier.heartRate` during workouts    | `.discreteAverage`                 |
| Resting HR         | `HKQuantityTypeIdentifier.restingHeartRate`             | latest sample + 30-day-prior delta |
| Total time         | sum `duration` across workouts                          |                                    |
| Calories (active)  | `HKQuantityTypeIdentifier.activeEnergyBurned`           | `.cumulativeSum` month             |
| Calories (total)   | `activeEnergyBurned + basalEnergyBurned`                | `.cumulativeSum` month             |
| Daily burn chart   | `activeEnergyBurned + basalEnergyBurned` per day        | `.cumulativeSum` 7d/14d/30d        |
| HR range / zones   | `heartRate` during workout windows                      | min / avg / max + zone buckets     |

## Background sync

`useHealthKit` does not yet enable `HKObserverQuery` with background
delivery. To turn that on, add this in `requestPermissions`:

```ts
await HealthKit.enableBackgroundDelivery(
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'immediate'
);
await HealthKit.enableBackgroundDelivery('HKWorkoutTypeIdentifier', 'immediate');
```

The hook already exposes `refetch` so any observer firing can just call it.

## Privacy stance

HealthKit data stays on the device. The hook never writes Apple Health values
back to Supabase. The only Supabase columns that touch this feature are the
existing `workouts` rows (used to compute the muscle-split bars + heatmap),
which already belong to the user.
