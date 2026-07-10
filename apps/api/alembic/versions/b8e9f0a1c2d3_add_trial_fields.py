"""add trial_ends_at and lemon_subscription_id to users

Revision ID: b8e9f0a1c2d3
Revises: a1b2c3d4e5f6
Create Date: 2026-06-21 22:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b8e9f0a1c2d3'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'users',
        sa.Column('lemon_subscription_id', sa.String(64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('users', 'lemon_subscription_id')
    op.drop_column('users', 'trial_ends_at')
