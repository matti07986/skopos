"""add_preregistration_emails

Revision ID: a1b2c3d4e5f6
Revises: d61fb8f86eea
Create Date: 2026-06-19 18:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'd61fb8f86eea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'preregistration_emails',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=256), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=True),
        sa.Column('use_case', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notified_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index(
        op.f('ix_preregistration_emails_email'),
        'preregistration_emails',
        ['email'],
        unique=True,
    )
    op.create_index(
        'ix_preregistration_emails_created_at',
        'preregistration_emails',
        ['created_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_preregistration_emails_created_at', table_name='preregistration_emails')
    op.drop_index(op.f('ix_preregistration_emails_email'), table_name='preregistration_emails')
    op.drop_table('preregistration_emails')
