"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-07 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(256), nullable=False),
        sa.Column("hashed_password", sa.String(256), nullable=False),
        sa.Column("api_key", sa.String(64), nullable=False),
        sa.Column("plan", sa.String(16), nullable=False, server_default="starter"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.UniqueConstraint("api_key", name="uq_users_api_key"),
    )
    op.create_index("ix_users_api_key", "users", ["api_key"])

    # --------------------------------------------------------------- log_events
    op.create_table(
        "log_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("level", sa.String(10), nullable=False),
        sa.Column("message", sa.String(4096), nullable=False),
        sa.Column("service", sa.String(128), nullable=False),
        sa.Column("metadata", postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("fingerprint", sa.String(64), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_log_events"),
    )
    op.create_index("ix_log_events_project_timestamp", "log_events", ["project_id", "timestamp"])
    op.create_index("ix_log_events_fingerprint", "log_events", ["fingerprint"])

    # --------------------------------------------------------------- ai_insights
    op.create_table(
        "ai_insights",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pattern_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("root_cause", sa.String(2048), nullable=False),
        sa.Column("suggested_fix", sa.String(8192), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --------------------------------------------------------------- alert_rules
    op.create_table(
        "alert_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("level", sa.String(10), nullable=False, server_default="ERROR"),
        sa.Column("threshold", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("window_seconds", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("channel", sa.String(16), nullable=False, server_default="slack"),
        sa.Column("destination", sa.String(512), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # -------------------------------------------------------------- alert_events
    op.create_table(
        "alert_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("triggered_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("payload", postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("sent", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("error", sa.String(512), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("alert_events")
    op.drop_table("alert_rules")
    op.drop_table("ai_insights")
    op.drop_index("ix_log_events_fingerprint", table_name="log_events")
    op.drop_index("ix_log_events_project_timestamp", table_name="log_events")
    op.drop_table("log_events")
    op.drop_index("ix_users_api_key", table_name="users")
    op.drop_table("users")
