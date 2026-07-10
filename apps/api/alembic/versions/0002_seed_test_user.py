"""seed test user

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
_TEST_API_KEY = "test-key"


def upgrade() -> None:
    import bcrypt
    hashed = bcrypt.hashpw(b"test123", bcrypt.gensalt()).decode()

    op.execute(f"""
        INSERT INTO users (id, email, hashed_password, api_key, plan, is_active, created_at)
        VALUES (
            '{_TEST_USER_ID}',
            'test@logtail.dev',
            '{hashed}',
            '{_TEST_API_KEY}',
            'starter',
            true,
            NOW()
        )
        ON CONFLICT (api_key) DO NOTHING
    """)


def downgrade() -> None:
    op.execute(f"DELETE FROM users WHERE api_key = '{_TEST_API_KEY}'")
