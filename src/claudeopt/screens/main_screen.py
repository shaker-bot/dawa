import dataclasses
import subprocess

from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical, VerticalScroll
from textual.screen import Screen
from textual.widgets import Button, Footer, Header, Label, Rule

from claudeopt.models import PROFILES, Profile
from claudeopt.screens.confirm_modal import ConfirmModal
from claudeopt.session_monitor import load_latest_session
from claudeopt.settings_io import SettingsIO
from claudeopt.widgets.profile_card import ProfileCard
from claudeopt.widgets.session_stats import SessionStatsWidget
from claudeopt.widgets.settings_preview import SettingsPreview


class MainScreen(Screen):
    """Home screen: profile selection, live JSON preview, and session stats."""

    CSS = """
    MainScreen {
        layout: horizontal;
    }
    .left-pane {
        width: 36;
        padding: 1 1;
        border-right: tall $panel;
    }
    .right-pane {
        width: 1fr;
        padding: 1 2;
        layout: vertical;
    }
    .section-title {
        text-style: bold;
        color: $primary;
        margin-bottom: 1;
    }
    .desc-box {
        background: $panel;
        border: tall $surface;
        padding: 1 2;
        height: auto;
        margin-bottom: 1;
        color: $text-muted;
    }
    .apply-button {
        width: 100%;
        margin-top: 1;
    }
    .run-button {
        width: 100%;
        margin-top: 1;
    }
    .status-label {
        margin-top: 1;
        text-align: center;
        height: 1;
    }
    Rule {
        margin: 0 0 1 0;
        color: $panel;
    }
    #settings-preview {
        height: 1fr;
    }
    #session-stats {
        height: 5;
        margin-top: 1;
    }
    """

    BINDINGS = [
        Binding("a", "apply_settings", "Apply"),
        Binding("r", "run_claude", "Run Claude"),
        Binding("e", "advanced", "Advanced"),
        Binding("?", "show_help", "Help"),
        Binding("1", "select_1", show=False),
        Binding("2", "select_2", show=False),
        Binding("3", "select_3", show=False),
        Binding("4", "select_4", show=False),
    ]

    def __init__(self) -> None:
        super().__init__()
        self._selected_id = "smart_default"

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Horizontal():
            with VerticalScroll(classes="left-pane"):
                yield Label("Profiles", classes="section-title")
                yield Rule()
                for profile in PROFILES:
                    yield ProfileCard(profile, id=f"card-{profile.id}")
                yield Rule()
                yield Button("⚡  Apply Profile", variant="success", id="apply-btn", classes="apply-button")
                yield Button("▶  Run Claude", variant="primary", id="run-btn", classes="run-button")
                yield Label("", id="status-label", classes="status-label")
            with Vertical(classes="right-pane"):
                yield Label("Settings Preview", classes="section-title")
                yield Rule()
                yield Label("", id="desc-label", classes="desc-box")
                yield SettingsPreview(self._profile_dict(), id="settings-preview")
                yield Label("Active Session", classes="section-title")
                yield SessionStatsWidget(id="session-stats")
        yield Footer()

    def on_mount(self) -> None:
        self._sync_selection()
        self.set_interval(2.0, self._poll_session)

    def _get_profile(self, pid: str) -> Profile:
        return next(p for p in PROFILES if p.id == pid)

    def _profile_dict(self) -> dict:
        s = self._get_profile(self._selected_id).settings
        return {k: v for k, v in dataclasses.asdict(s).items() if not k.startswith("_") and v != {}}

    def _sync_selection(self) -> None:
        for card in self.query(ProfileCard):
            card.is_selected = (card.profile.id == self._selected_id)
        profile = self._get_profile(self._selected_id)
        self.query_one("#desc-label", Label).update(profile.description)
        self.query_one("#settings-preview", SettingsPreview).update_settings(self._profile_dict())

    def _poll_session(self) -> None:
        stats = load_latest_session()
        self.query_one("#session-stats", SessionStatsWidget).refresh_stats(stats)

    def on_profile_card_selected(self, event: ProfileCard.Selected) -> None:
        self._selected_id = event.card.profile.id
        self._sync_selection()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "apply-btn":
            self.action_apply_settings()
        elif event.button.id == "run-btn":
            self.action_run_claude()

    def action_apply_settings(self) -> None:
        profile = self._get_profile(self._selected_id)
        preview = self._profile_dict()
        existing = SettingsIO.read()

        backup_note = "No existing settings to back up."
        if existing:
            backup_path = SettingsIO.backup()
            if backup_path:
                backup_note = f"Backup saved: backups/{backup_path.name}"

        def on_confirm(confirmed: bool) -> None:
            if not confirmed:
                self.app.notify("No changes made.", severity="warning", timeout=3)
                return
            SettingsIO.write(existing, preview)
            self.query_one("#status-label", Label).update(
                f"[green]✓  {profile.emoji} {profile.name} applied[/green]"
            )
            self.app.notify(
                "Written to ~/.claude/settings.json — takes effect next turn",
                title=f"{profile.emoji} {profile.name} active",
                severity="information",
                timeout=5,
            )

        self.app.push_screen(ConfirmModal(preview, backup_note), on_confirm)

    def action_run_claude(self) -> None:
        with self.app.suspend():
            subprocess.run(["claude"])
        # Refresh stats immediately after claude exits
        self._poll_session()

    def action_advanced(self) -> None:
        from claudeopt.screens.advanced_screen import AdvancedScreen
        self.app.push_screen(AdvancedScreen())

    def action_show_help(self) -> None:
        self.app.notify(
            "[b]1–4[/b] select profile   [b]a[/b] apply   [b]r[/b] run Claude   "
            "[b]e[/b] advanced   [b]q[/b] quit",
            title="⌨  Keyboard shortcuts",
            timeout=6,
        )

    def action_select_1(self) -> None:
        self._selected_id = "max_efficiency"
        self._sync_selection()

    def action_select_2(self) -> None:
        self._selected_id = "smart_default"
        self._sync_selection()

    def action_select_3(self) -> None:
        self._selected_id = "developer"
        self._sync_selection()

    def action_select_4(self) -> None:
        self._selected_id = "full_power"
        self._sync_selection()
