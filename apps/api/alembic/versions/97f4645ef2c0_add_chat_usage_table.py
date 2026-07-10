"""add chat_usage table

Revision ID: 97f4645ef2c0
Revises: 9b2c3d4e5f6a
Create Date: 2026-06-01 18:46:43.443257

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '97f4645ef2c0'
down_revision: Union[str, None] = '9b2c3d4e5f6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('chat_usage',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('day', sa.Date(), nullable=False),
        sa.Column('month', sa.String(length=7), nullable=False),
        sa.Column('input_tokens', sa.Integer(), nullable=False),
        sa.Column('output_tokens', sa.Integer(), nullable=False),
        sa.Column('message_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chat_usage_user_day', 'chat_usage', ['user_id', 'day'], unique=False)
    op.create_index('ix_chat_usage_user_month', 'chat_usage', ['user_id', 'month'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_chat_usage_user_month', table_name='chat_usage')
    op.drop_index('ix_chat_usage_user_day', table_name='chat_usage')
    op.drop_table('chat_usage')
