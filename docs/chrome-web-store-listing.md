# Chrome Web Store — listing copy & submission guide

Everything needed to publish Solstice. Copy/paste the listing fields, upload
the prepared assets, and follow the submission steps. Items marked **(you)**
require Sean's developer account and can't be automated.

## Package

Upload artifact: `solstice-<version>.zip` (repo root, git-ignored — rebuild
any time; the version is read from `manifest.json`, which must be bumped
before each upload):

```bash
V=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
rm -f solstice-*.zip
zip -rq "solstice-$V.zip" \
  manifest.json newtab.html newtab.css newtab.js config.js cities.js \
  src assets/icons -x '*.DS_Store'
```

Contains only runtime files + icons — no docs, tests, screenshots, or README.

## Listing fields

- **Name:** `Solstice`
- **Summary** (short description, ≤132 chars) — NOT editable in the dashboard;
  it is read from `manifest.json`'s `description`, so changing it means a new
  package upload:
  `A calm new tab that visualizes daylight and working hours across all your time zones, at a glance.`
- **Category:** Functionality & UI _(alternate: Workflow & Planning)_ — new-tab
  overrides cluster here, which helps the "similar extensions" rail surface
  Solstice alongside peers. Reversible post-launch.
- **Language:** English

### Detailed description

```
Solstice turns your new tab into a calm map of time: a big local clock up top,
a card for every place you care about, and a 24-hour timeline below.

Day and night bands follow each city's actual sunrise and sunset. Warm is
daytime, gray is night, and a teal band marks 9-to-5. Night fades into day
through twilight. You can tell who's asleep, who's mid-morning, and who's
already into their evening.

• Jump to any time: drag any timeline marker and every clock moves to that
  time, so you can find an hour that works for the whole group.
• Daylight saving warnings: a zone shows "−1h in 4d" the week before daylight
  saving starts or ends.
• Six color schemes (Teal, Midnight, Ember, Forest, Dusk, Graphite), each in
  light and dark: follow your system or pick a theme.
• Yours in seconds: add or remove cities, drag to reorder, rename a zone to a
  person's name, and switch between 12h and 24h.
• Local weather: temperature, conditions, wind, humidity, and cloud cover for
  your local zone, beside the big clock.
• Quiet by design: muted palette, monospace numerals, nothing blinking for
  your attention.

Solstice has no accounts, feeds, analytics, or tracking. Your settings are
stored in your browser. Open a tab, get your bearings, move on.
```

## Assets (all prepared in `assets/store/`)

- **Store icon:** `assets/icons/icon-128.png` (128×128).
- **Screenshots** (1280×800, upload all 4; the store allows up to 5). Captured
  from the 1.2.0 package at Wed, Oct 21, 2026, 10:00 in San Francisco, so
  London shows the daylight saving chip:
  - `assets/store/store-hero.png`: the default dark view.
  - `assets/store/store-light.png`: the light theme.
  - `assets/store/store-scrub.png`: scrubbed to 4:30 PM.
  - `assets/store/store-edit.png`: Edit panel with theme and city search. This
    capture still shows the retired accent row; recapture it before uploading.
- **Small promo tile** (440×280, required): `assets/store/store-promo.jpg`
  (JPEG — the dashboard rejects PNGs with an alpha channel).
  Minimal icon-on-dark tile.

## Privacy tab (required before submission)

- **Single purpose:** "A new-tab page that displays the current time across
  multiple time zones, with sunrise/sunset-based day-night shading."
- **Permission justifications:**
  - `geolocation` — Optional. Used to label the user's local card with a
    nearby city name and calculate accurate sunrise/sunset bands for that
    location. The user is never forced to grant it; the card falls back to IP
    location or the browser's time-zone name. The detected city and coordinates
    are cached locally for 24 hours; coordinates are sent only to the
    reverse-geocoding endpoint to resolve the city name.
  - **No host permissions.** The extension requests none. Its page calls these
    services directly, and they allow that (CORS): `api.bigdatacloud.net`
    (reverse-geocode granted coordinates → city name), `ipwho.is`, `ipapi.co`,
    `get.geojs.io` (IP-based city fallback when geolocation is denied or
    unavailable, tried in order), `geocoding-api.open-meteo.com` (city search
    for zones not in the bundled dataset), and `api.open-meteo.com` (current
    weather for the local zone, rounded coordinates, cached 30 minutes).
- **Data usage disclosures:** Does NOT collect or transmit personal or usage
  data. No analytics, no remote logging. A detected city and coordinates are
  cached locally for 24 hours to label the local card and calculate daylight.
- **Privacy policy URL:** `https://solstice.seanoliver.dev/privacy`
- **Website (Store listing → Additional fields → Official URL / Homepage URL):** `https://solstice.seanoliver.dev`

## Submission steps **(you)**

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
   If this is the first publish, pay the one-time **$5** developer registration.
2. **New item** → upload `solstice-1.0.0.zip`.
3. Fill the **Store listing** tab with the fields above; upload the icon and
   2–3 screenshots (and the promo tile if you want).
4. Fill the **Privacy practices** tab with the single-purpose statement, the
   per-permission justifications, the data-usage disclosures, and the policy URL.
5. Set **Distribution** (Public) and visibility.
6. **Submit for review.** New-tab overrides get extra scrutiny — review can take
   a few days. If rejected, the reason is usually a permission justification;
   tighten the wording above and resubmit.

## Notes

- The extension declares no `host_permissions` on purpose: a host permission
  triggers an in-depth review warning, and none of the services need one
  because they all send `access-control-allow-origin: *`. If a service stops
  sending that header, its requests will fail (the app degrades quietly) and the
  fix is to add that one host back.
- Version stays `1.0.0` for the first publish; bump on each subsequent upload.
```
