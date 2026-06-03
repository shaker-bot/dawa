import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

SETTINGS_PATH = Path.home() / ".claude" / "settings.json"
BACKUP_DIR = Path.home() / ".claude" / "backups"

MANAGED_KEYS = {"model", "verbose", "includeCoAuthoredBy", "cleanupPeriodDays", "theme", "env"}


class SettingsIO:

    @staticmethod
    def read() -> dict:
        if not SETTINGS_PATH.exists():
            return {}
        text = SETTINGS_PATH.read_text(encoding="utf-8")
        return json.loads(text)

    @staticmethod
    def backup() -> Optional[Path]:
        if not SETTINGS_PATH.exists():
            return None
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        dest = BACKUP_DIR / f"settings_{ts}.json"
        shutil.copy2(SETTINGS_PATH, dest)
        return dest

    @staticmethod
    def write(raw_existing: dict, managed_values: dict) -> None:
        merged = {**raw_existing}
        for key in MANAGED_KEYS:
            if key in managed_values:
                merged[key] = managed_values[key]
        if "$schema" not in merged:
            merged["$schema"] = "https://json.schemastore.org/claude-code-settings.json"
        ordered = {"$schema": merged.pop("$schema"), **merged}
        SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
        tmp = SETTINGS_PATH.with_suffix(".tmp")
        tmp.write_text(json.dumps(ordered, indent=4), encoding="utf-8")
        tmp.replace(SETTINGS_PATH)

    @staticmethod
    def list_backups() -> list[Path]:
        if not BACKUP_DIR.exists():
            return []
        return sorted(BACKUP_DIR.glob("settings_*.json"), reverse=True)
