# ግቢ ጉባኤ ሳምንታዊ ሪፖርት · Design

Clickable UI design for the **Gibi Gubae weekly report** mobile app (Android, Amharic-first).
These are HTML prototypes: they show how every screen looks and behaves before the real app is built.

## How to view

- **Online:** open the Netlify link. The first page is an overview of all screens.
- **On a phone:** open `onboarding.html` and tap through it like a real app:
  onboarding → login → home → weekly report → sections → review → sent.
- **On your computer:** run `python3 -m http.server 8080` in this folder, then open <http://localhost:8080>.

An internet connection is needed (fonts and styles load online).

## Screens

| # | Screen | File |
|---|---|---|
| 0a–0c | Onboarding (welcome, language, notifications) | `onboarding.html?step=0..2` |
| 0d–0f | Login, forgot password, first login (set own password) | `login.html`, `?state=forgot`, `?state=first` |
| 1 | Home | `home.html` |
| 2 | Reports (history, filters) | `reports.html`, `?state=new` |
| 3 | This week's report (sections list) | `weekly-report.html`, `?state=complete`, `?state=returned` |
| 4–12 | Report sections | `section-*.html` |
| 13 | Review and send | `review.html`, `?offline=1` |
| 14 | Sent | `submitted.html`, `?state=resent` |
| 15 | Notifications | `notifications.html` |
| 16 | Profile (read-only, set by admin) | `profile.html` |
| 17 | Report detail (approved, under review, returned) | `report-detail.html?state=…` |

The report sections follow the official weekly report form (Excel):
program and attendance, continuous courses, courses in other languages, weekly training,
Abinet and Ge'ez, hymn study, meeting agenda and decisions, problems and solutions, plus optional extra activities.

## Main rules

- **Accounts:** the office (ጽ/ቤት) or the coordination head creates the account and sends the email and a
  temporary password (valid 7 days). On first login the user sets their own password.
- **Offline:** the report can be filled in without internet (saved on the phone). Sending needs internet.
- **Workflow:** Draft → Sent → Under review → Approved, or Returned → Resent. Deadline: Monday night.
- **Empty sections:** if an activity did not happen that week, the user switches on "በዚህ ሳምንት አልነበረም".

## Design system

| Token | Value | Use |
|---|---|---|
| Primary | `#1D3A6B` | buttons, titles, active states |
| Primary tint | `#E8EEF8` | soft backgrounds, icons |
| Gold | `#C9962B` | small accents only (dots, badges) |
| Background | `#F6F8FB` | page |
| Border | `#E3E8EF` | cards, inputs |
| Green | — | only for "ጸድቋል" (approved) |
| Amber | — | returned, teacher absent |

- Font: Noto Sans Ethiopic. Icons: Material Symbols.
- Glassy cards, one main button per screen, bottom navigation with a wave notch.
- Text size (small / medium / large) can be changed in Profile.

## Files

- `assets/app.css`: colours, spacing and all shared components
- `assets/form.js`: shared form parts (date and time pickers, attendance, batch, teacher, repeatable cards)
- `assets/section.js`: saved / offline state and the "nothing this week" switch
- `assets/nav.js`: bottom navigation
- `assets/prefs.js`: text size setting

## Related repositories (planned)

`mobile-app` (Flutter) · `admin-web` · `backend`
