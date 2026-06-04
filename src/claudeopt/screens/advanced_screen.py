from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical, VerticalScroll
from textual.screen import Screen
from textual.widgets import Button, Footer, Header, Input, Label, Rule, Select, Switch

from claudeopt.settings_io import SettingsIO
from claudeopt.widgets.settings_preview import SettingsPreview

MODEL_OPTIONS = [
    ("🚀  Haiku — Fastest & cheapest", "claude-haiku-4-5-20251001"),
    ("⚡  Sonnet — Balanced (recommended)", "claude-sonnet-4-6"),
    ("💎  Opus — Most capable", "claude-opus-4-8"),
]

THEME_OPTIONS = [
    ("Dark", "dark"),
    ("Light", "light"),
]


class AdvancedScreen(Screen):
    """Fine-grained per-setting editor with live JSON preview."""

    CSS = """
    AdvancedScreen {
        layout: horizontal;
    }
    .controls-pane {
        width: 40;
        padding: 1 2;
        border-right: tall $panel;
    }
    .preview-pane {
        width: 1fr;
        padding: 1 2;
    }
    .section-title {
        text-style: bold;
        color: $primary;
        margin-top: 1;
        margin-bottom: 1;
    }
    .field-label {
        color: $foreground;
        margin-bottom: 0;
    }
    .field-desc {
        color: $text-muted;
        margin-bottom: 1;
        padding-left: 1;
    }
    .toggle-row {
        height: 3;
        align-vertical: middle;
        margin-bottom: 1;
    }
    .toggle-row Label {
        width: 1fr;
        content-align: left middle;
    }
    .action-row {
        margin-top: 2;
        height: auto;
        align-horizontal: right;
    }
    .action-row Button {
        margin-left: 1;
    }
    Rule {
        margin: 0 0 1 0;
        color: $panel;
    }
    """

    BINDINGS = [
        Binding("escape", "go_back", "Back"),
        Binding("ctrl+s", "save_settings", "Save"),
    ]

    def __init__(self) -> None:
        super().__init__()
        self._existing = SettingsIO.read()

    def compose(self) -> ComposeResult:
        ex = self._existing
        yield Header(show_clock=False)
        with Horizontal():
            with VerticalScroll(classes="controls-pane"):
                yield Label("Advanced Settings", classes="section-title")
                yield Rule()

                yield Label("Model", classes="section-title")
                yield Label("Default model for all sessions.", classes="field-desc")
                yield Select(
                    MODEL_OPTIONS,
                    value=ex.get("model", "claude-sonnet-4-6"),
                    id="model-select",
                )

                yield Label("Output", classes="section-title")
                yield Rule()

                with Horizontal(classes="toggle-row"):
                    yield Label("verbose")
                    yield Switch(value=ex.get("verbose", False), id="verbose-switch")
                yield Label("Show detailed tool output. Off = fewer tokens.", classes="field-desc")

                with Horizontal(classes="toggle-row"):
                    yield Label("includeCoAuthoredBy")
                    yield Switch(value=ex.get("includeCoAuthoredBy", False), id="coauthored-switch")
                yield Label("Add 'Co-authored-by: Claude' to git commits.", classes="field-desc")

                yield Label("Sessions", classes="section-title")
                yield Rule()
                yield Label("cleanupPeriodDays", classes="field-label")
                yield Input(
                    value=str(ex.get("cleanupPeriodDays", 30)),
                    placeholder="30",
                    type="integer",
                    id="cleanup-input",
                )
                yield Label("Days before old sessions are removed (1–365).", classes="field-desc")

                yield Label("Appearance", classes="section-title")
                yield Rule()
                yield Select(THEME_OPTIONS, value=ex.get("theme", "dark"), id="theme-select")

                with Horizontal(classes="action-row"):
                    yield Button("Back", variant="default", id="back-btn")
                    yield Button("Save  ✓", variant="success", id="save-btn")

            with Vertical(classes="preview-pane"):
                yield Label("Live Preview", classes="section-title")
                yield Rule()
                yield SettingsPreview({}, id="adv-preview")

        yield Footer()

    def on_mount(self) -> None:
        self._refresh_preview()

    def _build_dict(self) -> dict:
        try:
            model = self.query_one("#model-select", Select).value
            verbose = self.query_one("#verbose-switch", Switch).value
            coauthored = self.query_one("#coauthored-switch", Switch).value
            raw = self.query_one("#cleanup-input", Input).value
            cleanup = int(raw) if raw.strip().isdigit() else 30
            theme = self.query_one("#theme-select", Select).value
        except Exception:
            return {}
        return {
            "model": model,
            "verbose": verbose,
            "includeCoAuthoredBy": coauthored,
            "cleanupPeriodDays": cleanup,
            "theme": theme,
        }

    def _refresh_preview(self) -> None:
        try:
            self.query_one("#adv-preview", SettingsPreview).update_settings(self._build_dict())
        except Exception:
            pass

    def on_switch_changed(self) -> None:
        self._refresh_preview()

    def on_select_changed(self) -> None:
        self._refresh_preview()

    def on_input_changed(self) -> None:
        self._refresh_preview()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "save-btn":
            self.action_save_settings()
        elif event.button.id == "back-btn":
            self.action_go_back()

    def action_save_settings(self) -> None:
        settings = self._build_dict()
        if self._existing:
            SettingsIO.backup()
        SettingsIO.write(self._existing, settings)
        self.app.notify(
            "Written to ~/.claude/settings.json",
            title="✓  Settings saved",
            severity="information",
            timeout=4,
        )

    def action_go_back(self) -> None:
        self.app.pop_screen()
