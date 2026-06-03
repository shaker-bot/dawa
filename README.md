# claudeopt ⚡

A terminal UI for applying Claude Code settings optimized for **token efficiency and lower cost**. Select a profile, preview the JSON, and apply it to `~/.claude/settings.json` in seconds.

![claudeopt screenshot placeholder — run `uv run claudeopt` to see it live]

---

## What it does

`claudeopt` presents four pre-tuned optimization profiles for [Claude Code](https://claude.ai/code). Each profile sets the default model, verbosity, commit attribution, and session cleanup to different cost/capability trade-offs. Settings are written to `~/.claude/settings.json` (your existing hooks, permissions, and other keys are always preserved).

---

## Requirements

- **Python 3.11+**
- **uv** — fast Python package manager

Install `uv` if you don't have it:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## Quick start

```bash
git clone <this-repo> claudeopt
cd claudeopt
uv sync          # installs textual, rich, and hatchling into .venv
uv run claudeopt # launches the TUI
```

---

## Optimization profiles

| Profile | Emoji | Model | verbose | includeCoAuthoredBy | Cost |
|---|---|---|---|---|---|
| Max Efficiency | 🚀 | claude-haiku-4-5-20251001 | false | false | ░░░░ (lowest) |
| Smart Default | ⚡ | claude-sonnet-4-6 | false | false | ██░░ |
| Developer Mode | 🔧 | claude-sonnet-4-6 | true | true | ███░ |
| Full Power | 💎 | claude-opus-4-8 | true | true | ████ (highest) |

**Token savings of note:**
- `verbose: false` — suppresses detailed tool-call output in Claude's context window
- `includeCoAuthoredBy: false` — removes the trailing `Co-authored-by:` line from every git commit message Claude writes
- Haiku vs Opus — roughly 20× cheaper per token at the API level

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `1` – `4` | Select profile |
| `a` | Apply selected profile |
| `e` | Open advanced per-field editor |
| `?` | Show help toast |
| `q` / `Ctrl+Q` | Quit |
| `Escape` | Cancel / go back |
| `Ctrl+S` | Save (in advanced mode) |

---

## How settings are applied

1. Reads your current `~/.claude/settings.json` (or creates it if absent).
2. **Backs up** the existing file to `~/.claude/backups/settings_<timestamp>.json`.
3. Merges the profile's managed keys (`model`, `verbose`, `includeCoAuthoredBy`, `cleanupPeriodDays`, `theme`) into the existing JSON — all other keys (hooks, permissions, env vars, etc.) are **preserved untouched**.
4. Writes atomically via a `.tmp` rename so a mid-write crash can't corrupt the file.

---

## Advanced mode

Press `e` from the main screen to open the per-field editor. You can independently set each setting — live JSON preview updates as you type. Press `Ctrl+S` or click **Save** to write, or `Escape` to go back without saving.

---

## Project layout

```
src/claudeopt/
  app.py                  Entry point (ClaudeOptApp)
  theme.py                Teal/cyan color theme (no purple)
  models.py               Profile definitions and ClaudeSettings dataclass
  settings_io.py          Read / backup / atomic-write ~/.claude/settings.json
  screens/
    main_screen.py        Profile cards + live preview
    advanced_screen.py    Per-field editor
    confirm_modal.py      Apply confirmation dialog
  widgets/
    profile_card.py       Clickable profile card with cost bar
    settings_preview.py   Syntax-highlighted JSON preview
```

---

## License

MIT
