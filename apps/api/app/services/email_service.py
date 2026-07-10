import resend
import os
import logging

logger = logging.getLogger(__name__)

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "noreply@skopos.ink")

LOGO_SVG = """<svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="sq"><rect x="10" y="10" width="44" height="44" rx="12" transform="rotate(45 32 32)"/></clipPath></defs><rect x="10" y="10" width="44" height="44" rx="12" transform="rotate(45 32 32)" fill="#4ade80"/><g clip-path="url(#sq)"><path d="M2 26 Q14 16 26 26 T50 26 T74 26" stroke="#0a0a0a" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M2 36 Q14 26 26 36 T50 36 T74 36" stroke="#0a0a0a" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M2 46 Q14 36 26 46 T50 46 T74 46" stroke="#0a0a0a" stroke-width="6" stroke-linecap="round" fill="none"/></g></svg>"""


def _base_template(content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;">
  <tr>
    <td align="center" style="padding:48px 24px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:460px;">
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">{LOGO_SVG}</td>
              </tr>
              <tr>
                <td align="center" style="padding-top:10px;">
                  <span style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-0.2px;">skopos</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#0a0a0a;border:1px solid #1e1e1e;border-radius:12px;padding:36px 36px 32px 36px;">
            {content}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 8px 0 8px;">
            <p style="margin:0 0 6px 0;color:#555555;font-size:12px;line-height:1.6;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <a href="https://skopos.ink/legal/privacy" style="color:#555555;text-decoration:none;">Privacy</a>
              &nbsp;&middot;&nbsp;
              <a href="https://skopos.ink/legal/terms" style="color:#555555;text-decoration:none;">Terms</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:support@skopos.ink" style="color:#555555;text-decoration:none;">Contact</a>
            </p>
            <p style="margin:0;color:#444444;font-size:11px;line-height:1.6;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              &copy; Skopos &middot; You received this email because you signed up for Skopos.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>"""


def _verification_content(otp_code: str) -> str:
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding-top:4px;padding-bottom:10px;"><h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.4px;line-height:1.3;">Your verification code</h1></td></tr>
  <tr><td style="padding-bottom:32px;"><p style="margin:0;color:#888888;font-size:12px;line-height:1.7;">Enter this code on Skopos to verify your email and activate your account.</p></td></tr>
  <tr><td align="center" style="padding-bottom:36px;"><div style="display:inline-block;background-color:#0f0f0f;border:1px solid #1e1e1e;border-radius:10px;padding:14px 22px;min-width:200px;"><p style="margin:0;color:#4ade80;font-size:20px;font-weight:700;letter-spacing:6px;font-family:'SF Mono','Monaco','Menlo','Consolas',monospace;">{otp_code}</p></div></td></tr>
  <tr><td style="border-top:1px solid #1e1e1e;padding-top:24px;"><p style="margin:0;color:#444444;font-size:12px;line-height:1.7;">This code expires in 15 minutes. If you didn't create a Skopos account, you can safely ignore this email.</p></td></tr>
</table>"""


def _alert_content(rule_name: str, level: str, count: int, triggered_at: str) -> str:
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding-bottom:24px;border-bottom:1px solid #1e1e1e;"><p style="margin:0;color:#f87171;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:500;">&#9888; Alert Triggered</p></td></tr>
  <tr><td style="padding-top:28px;padding-bottom:10px;"><h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.4px;line-height:1.3;">{rule_name}</h1></td></tr>
  <tr><td style="padding-bottom:28px;"><p style="margin:0;color:#888888;font-size:14px;line-height:1.7;">An alert rule has been triggered in your Skopos project.</p></td></tr>
  <tr><td style="padding-bottom:32px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d0d0d;border:1px solid #1e1e1e;border-radius:8px;">
    <tr><td style="padding:16px 20px;border-bottom:1px solid #1e1e1e;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color:#555555;font-size:12px;">Level</td><td align="right" style="color:#f87171;font-size:12px;font-weight:700;">{level}</td></tr></table></td></tr>
    <tr><td style="padding:16px 20px;border-bottom:1px solid #1e1e1e;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color:#555555;font-size:12px;">Events</td><td align="right" style="color:#e6edf3;font-size:12px;font-weight:700;">{count}</td></tr></table></td></tr>
    <tr><td style="padding:16px 20px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color:#555555;font-size:12px;">Triggered at</td><td align="right" style="color:#e6edf3;font-size:12px;">{triggered_at}</td></tr></table></td></tr>
  </table></td></tr>
  <tr><td style="padding-bottom:36px;"><a href="https://skopos.ink/projects" style="display:inline-block;background-color:#4ade80;color:#000000;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:7px;letter-spacing:0.1px;">View Dashboard &rarr;</a></td></tr>
  <tr><td style="border-top:1px solid #1e1e1e;padding-top:24px;"><p style="margin:0;color:#444444;font-size:12px;line-height:1.7;">You are receiving this because you set up alert rules in Skopos.</p></td></tr>
</table>"""


def _password_reset_content(reset_link: str) -> str:
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding-top:4px;padding-bottom:10px;"><h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.4px;line-height:1.3;">Reset your password</h1></td></tr>
  <tr><td style="padding-bottom:32px;"><p style="margin:0;color:#b0b0b0;font-size:13px;line-height:1.7;">Click the button below to set a new password for your Skopos account. This link expires in 1 hour.</p></td></tr>
  <tr><td style="padding-bottom:36px;"><a href="{reset_link}" style="display:inline-block;background-color:#4ade80;color:#000000;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:7px;letter-spacing:0.1px;">Reset Password &rarr;</a></td></tr>
  <tr><td style="border-top:1px solid #1e1e1e;padding-top:24px;"><p style="margin:0;color:#b0b0b0;font-size:12px;line-height:1.7;">If you didn't request a password reset, you can safely ignore this email. This link expires in 1 hour.</p></td></tr>
</table>"""


def _welcome_content() -> str:
    return """
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding-top:4px;padding-bottom:14px;"><h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.4px;line-height:1.3;">Welcome to Skopos &#128075;</h1></td></tr>
  <tr><td style="padding-bottom:28px;"><p style="margin:0;color:#b0b0b0;font-size:13px;line-height:1.7;">Your account is live. Skopos is <strong style="color:#ffffff;">boring log infrastructure with a smart AI layer on top</strong> &mdash; designed so you can actually understand what's happening in production, without grep-ing through 10k lines.</p></td></tr>
  <tr><td style="padding-bottom:8px;"><p style="margin:0;color:#4ade80;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Step 1 &mdash; Ship a log</p></td></tr>
  <tr><td style="padding-bottom:14px;"><p style="margin:0;color:#888888;font-size:13px;line-height:1.7;">Install the SDK and send your first event in under a minute.</p></td></tr>
  <tr><td style="padding-bottom:28px;"><div style="background-color:#0d0d0d;border:1px solid #1e1e1e;border-radius:8px;padding:14px 18px;font-family:'SF Mono','Monaco','Menlo','Consolas',monospace;font-size:12px;color:#e6edf3;line-height:1.7;"><span style="color:#666666;">// JavaScript</span><br><span style="color:#888888;">$</span> npm install @skopos/sdk<br><br><span style="color:#666666;">// Python</span><br><span style="color:#888888;">$</span> pip install skopos-sdk</div></td></tr>
  <tr><td style="padding-bottom:8px;"><p style="margin:0;color:#4ade80;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Step 2 &mdash; Ask your logs anything</p></td></tr>
  <tr><td style="padding-bottom:28px;"><p style="margin:0;color:#888888;font-size:13px;line-height:1.7;">Once events are flowing, open the chat box in your project and try: <em style="color:#e6edf3;">"how many errors today?"</em> or <em style="color:#e6edf3;">"what's our most frequent 500?"</em> &mdash; Skopos answers using your actual logs.</p></td></tr>
  <tr><td style="padding-bottom:32px;"><a href="https://skopos.ink/projects" style="display:inline-block;background-color:#4ade80;color:#000000;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:7px;letter-spacing:0.1px;">Open Dashboard &rarr;</a></td></tr>
  <tr><td style="border-top:1px solid #1e1e1e;padding-top:24px;padding-bottom:20px;"><p style="margin:0 0 8px 0;color:#888888;font-size:12px;line-height:1.8;">Stuck? Reply to this email or write to <a href="mailto:support@skopos.ink" style="color:#4ade80;text-decoration:none;">support@skopos.ink</a> &mdash; it goes straight to me.</p><p style="margin:0;color:#666666;font-size:12px;line-height:1.7;">Docs: <a href="https://docs.skopos.ink" style="color:#4ade80;text-decoration:none;">docs.skopos.ink</a> &nbsp;&middot;&nbsp; Status: <a href="https://status.skopos.ink" style="color:#4ade80;text-decoration:none;">status.skopos.ink</a></p></td></tr>
  <tr><td><p style="margin:0;color:#888888;font-size:12px;line-height:1.7;">Welcome aboard,<br>Mattia</p></td></tr>
</table>"""


def _launch_content(name: str | None = None) -> str:
    greeting = f"Hey {name}," if name else "Hey,"
    return f"""
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding-top:4px;padding-bottom:14px;"><h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.4px;line-height:1.3;">Skopos is live &#127881;</h1></td></tr>
  <tr><td style="padding-bottom:24px;"><p style="margin:0;color:#b0b0b0;font-size:13px;line-height:1.7;">{greeting}</p></td></tr>
  <tr><td style="padding-bottom:28px;"><p style="margin:0;color:#b0b0b0;font-size:13px;line-height:1.7;">You signed up to be notified when Skopos launched. That day is today. The platform is live and your spot is waiting.</p></td></tr>
  <tr><td style="padding-bottom:8px;"><p style="margin:0;color:#4ade80;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">What you get</p></td></tr>
  <tr><td style="padding-bottom:28px;"><p style="margin:0;color:#888888;font-size:13px;line-height:1.7;">Every new account starts on the <strong style="color:#ffffff;">Indie plan</strong> &mdash; 100k logs/hour, 3 projects, 21-day retention, unlimited AI insights, alert rules &mdash; <strong style="color:#ffffff;">free for 3 days</strong>. Keep it active by subscribing, or it gracefully downgrades to the always-free Starter plan.</p></td></tr>
  <tr><td style="padding-bottom:8px;"><p style="margin:0;color:#4ade80;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Get started in 30 seconds</p></td></tr>
  <tr><td style="padding-bottom:14px;"><p style="margin:0;color:#888888;font-size:13px;line-height:1.7;">Create your account, drop in the SDK, ship your first log.</p></td></tr>
  <tr><td style="padding-bottom:32px;"><a href="https://skopos.ink/landing" style="display:inline-block;background-color:#4ade80;color:#000000;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:7px;letter-spacing:0.1px;">Open Skopos &rarr;</a></td></tr>
  <tr><td style="border-top:1px solid #1e1e1e;padding-top:24px;padding-bottom:16px;"><p style="margin:0;color:#888888;font-size:12px;line-height:1.8;">Questions? Just reply to this email &mdash; it goes straight to me.</p></td></tr>
  <tr><td><p style="margin:0;color:#888888;font-size:12px;line-height:1.7;">Thanks for waiting,<br>Mattia</p></td></tr>
</table>"""


async def send_launch_email(email: str, name: str | None = None) -> bool:
    """Sent one-shot to all preregistered users on launch day."""
    try:
        params = {
            "from": f"Skopos <{FROM_EMAIL}>",
            "to": [email],
            "subject": "Skopos is live",
            "html": _base_template(_launch_content(name)),
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.error("Failed to send launch email to %s: %s", email, e)
        return False



async def send_verification_email(email: str, token: str) -> bool:
    try:
        params = {
            "from": f"Skopos <{FROM_EMAIL}>",
            "to": [email],
            "subject": f"Your Skopos code: {token}",
            "html": _base_template(_verification_content(token)),
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.error("Failed to send verification email to %s: %s", email, e)
        return False


async def send_alert_email(to: str, rule_name: str, level: str, count: int, triggered_at: str) -> bool:
    try:
        params = {
            "from": f"Skopos <{FROM_EMAIL}>",
            "to": [to],
            "subject": f"[Skopos] Alert: {rule_name}",
            "html": _base_template(_alert_content(rule_name, level, count, triggered_at)),
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.error("Failed to send alert email to %s: %s", to, e)
        return False


async def send_password_reset_email(email: str, reset_link: str) -> bool:
    try:
        params = {
            "from": f"Skopos <{FROM_EMAIL}>",
            "to": [email],
            "subject": "Reset your Skopos password",
            "html": _base_template(_password_reset_content(reset_link)),
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.error("Failed to send password reset email to %s: %s", email, e)
        return False


async def send_welcome_email(email: str) -> bool:
    """Sent after a new user verifies their email via OTP. Best-effort."""
    try:
        params = {
            "from": f"Skopos <{FROM_EMAIL}>",
            "to": [email],
            "subject": "Welcome to Skopos \u2014 ship your first log in 30s",
            "html": _base_template(_welcome_content()),
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        logger.error("Failed to send welcome email to %s: %s", email, e)
        return False


# ============================================================
# Email preference helpers
# ============================================================
# Centralize logic for checking user email preferences.
# Use these in workers and lifecycle email senders.

def should_send_alert_email(user) -> bool:
    """
    Returns True if the user should receive alert emails.

    Alert emails are triggered by user-configured rules (alert_worker,
    anomaly_worker, uptime_worker). They respect the `notify_alerts`
    flag on the User model.
    """
    return getattr(user, "notify_alerts", True) is not False


def should_send_lifecycle_email(user) -> bool:
    """
    Returns True if the user should receive lifecycle/marketing emails.

    Lifecycle emails include onboarding reminders, product updates, tips,
    weekly digests, etc. They respect the `notify_email` flag on the User model.

    Note: Transactional emails (verification OTP, welcome, password reset,
    team invites, payment receipts) are ALWAYS sent regardless of this flag,
    for account security and required communications.
    """
    return getattr(user, "notify_email", True) is not False
