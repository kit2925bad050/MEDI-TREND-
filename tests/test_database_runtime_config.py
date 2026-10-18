import os
import subprocess
import sys
import unittest
from pathlib import Path


SERVER_DIR = Path(__file__).resolve().parents[1] / "server"


class DatabaseRuntimeConfigTests(unittest.TestCase):
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
