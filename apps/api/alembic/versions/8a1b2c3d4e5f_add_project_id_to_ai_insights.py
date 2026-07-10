"""add project_id to ai_insights

Revision ID: 8a1b2c3d4e5f
Revises: 7464d63c99bd
Create Date: 2026-05-19 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "8a1b2c3d4e5f"
down_revision: Union[str, None] = "7464d63c99bd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ai_insights",
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_ai_insights_project_id", "ai_insights", ["project_id"])


def downgrade() -> None:
    op.drop_index("ix_ai_insights_project_id", table_name="ai_insights")
    op.drop_column("ai_insights", "project_id")
