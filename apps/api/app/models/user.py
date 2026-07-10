from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from app.database import Base


class User(Base):
    """
    User model.
    
    Email preferences:
    - `notify_email`: Controls lifecycle/marketing emails
      (reminders, tips, product updates, weekly digests).
      Disabling does NOT affect transactional emails.
    - `notify_alerts`: Controls emails triggered by user-configured
      alert rules, anomaly detection, and uptime monitors.
    
    ALWAYS sent regardless of these flags (transactional):
    - Email verification (OTP code)
    - Welcome email (post-verification)
    - Password reset
    - Team invitations
    - Payment receipts and billing events
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    api_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    plan: Mapped[str] = mapped_column(String(16), nullable=False, default="starter")
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    lemon_subscription_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_token: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    verification_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="en")
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    notify_email: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
