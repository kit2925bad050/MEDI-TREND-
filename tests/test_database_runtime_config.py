import os
import sqlite3
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


SERVER_DIR = Path(__file__).resolve().parents[1] / "server"
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))


class DatabaseRuntimeConfigTests(unittest.TestCase):
    def test_schema_migrations_skip_missing_tables_and_existing_columns(self):
        from app.data.db import DatabaseManager

        manager = DatabaseManager.__new__(DatabaseManager)
        manager._use_postgres = False
        connection = sqlite3.connect(":memory:")
        connection.row_factory = sqlite3.Row
        cursor = connection.cursor()
        cursor.execute("CREATE TABLE existing_table (id TEXT PRIMARY KEY, existing_column TEXT)")

        migrations = [
            ("existing_table", "existing_column TEXT"),
            ("existing_table", "new_column TEXT"),
            ("not_created_yet", "later_column TEXT"),
        ]
        manager._apply_schema_migrations(cursor, migrations)
        manager._apply_schema_migrations(cursor, migrations)

        columns = {row["name"] for row in cursor.execute("PRAGMA table_info(existing_table)")}
        self.assertEqual(columns, {"id", "existing_column", "new_column"})
        self.assertIsNone(cursor.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'not_created_yet'"
        ).fetchone())
        connection.close()

    def test_postgres_schema_migrations_skip_missing_tables_and_existing_columns(self):
        from app.data.db import DatabaseManager

        manager = DatabaseManager.__new__(DatabaseManager)
        manager._use_postgres = True
        cursor = Mock()
        table_exists = {"admin_users": True, "medical_reports": False, "audit_logs": True}
        column_exists = {("admin_users", "status"): True}

        with patch.object(manager, "_table_exists", side_effect=lambda _cursor, table: table_exists[table]), \
             patch.object(manager, "_column_exists", side_effect=lambda _cursor, table, column: column_exists.get((table, column), False)):
            manager._apply_schema_migrations(cursor, [
                ("admin_users", "status TEXT"),
                ("medical_reports", "identity_status TEXT"),
                ("audit_logs", "actor_user_id TEXT"),
            ])

        cursor.execute.assert_called_once_with("ALTER TABLE audit_logs ADD COLUMN actor_user_id TEXT")

    def test_vercel_requires_a_persistent_database(self):
        env = os.environ.copy()
        env["VERCEL"] = "1"
        env.pop("DATABASE_URL", None)

        result = subprocess.run(
            [
                sys.executable,
                "-c",
                "import app.data.db",
            ],
            cwd=SERVER_DIR,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("DATABASE_URL must point to the existing persistent PostgreSQL database", result.stderr)
        self.assertNotIn("no such table", result.stderr.lower())


if __name__ == "__main__":
    unittest.main()
