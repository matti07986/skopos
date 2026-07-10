"""
Pre-registration email model.

Used during pre-launch phase to collect email addresses of users
interested in the product. These are NOT user accounts — they are
leads to notify when the SaaS launches publicly.

After launch, these emails are sent the launch announcement and
optionally converted to real accounts.
"""
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from app.database import Base


class PreregistrationEmail(Base):
    __tablename__ = "preregistration_emails"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(256), unique=True, nullable=False, index=True
    )
    name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    use_case: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    notified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
