from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    redis_url: str
    resend_api_key: str = ""
    resend_from_email: str = "noreply@skopos.ink"
    jwt_secret_key: str
    anthropic_api_key: str

    # Limiti per piano - eventi/ora
    plan_limits: dict[str, int] = {
        "starter": 10_000,
        "indie":   100_000,
        "pro":     500_000,
        "business": 5_000_000,
    }

    # Limiti progetti per piano
    plan_project_limits: dict[str, int] = {
        "starter": 1,
        "indie":   3,
        "pro":     10,
        "business": 999,
    }

    # Limiti alert rules per piano
    plan_alert_limits: dict[str, int] = {
        "starter": 0,
        "indie":   5,
        "pro":     20,
        "business": 999,
    }

    # Limiti AI insights per mese per piano
    plan_insight_limits: dict[str, int] = {
        "starter": 20,
        "indie":   50,
        "pro":     999999,
        "business": 999999,
    }

    # Limiti chatbot AI - messaggi per giorno per piano
    plan_chat_msg_per_day: dict[str, int] = {
        "starter":  3,
        "indie":    15,
        "pro":      60,
        "business": 200,
        "demo":     100,
    }

    # Limiti chatbot AI - token totali per mese per piano (anti-abuse)
    plan_chat_tokens_per_month: dict[str, int] = {
        "starter":   50_000,
        "indie":    300_000,
        "pro":    1_200_000,
        "business": 4_000_000,
        "demo":   99_999_999,
    }

    # Cap hard per ogni singola richiesta (prevenzione prompt bombing)
    chat_max_input_tokens: int = 4_000
    chat_max_output_tokens: int = 1_000

    # Retention giorni per piano
    plan_retention_days: dict[str, int] = {
        "starter": 7,
        "indie":   21,
        "pro":     60,
        "business": 90,
    }


    github_client_id: str = ""
    github_client_secret: str = ""
    lemonsqueezy_webhook_secret: str = ""

settings = Settings()
