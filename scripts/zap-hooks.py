"""Narrow reviewed exception for the browser-readable double-submit CSRF cookie."""
from urllib.parse import urlparse


def zap_get_alerts_wrap(alerts):
    findings = alerts.get("10010", [])
    remaining = [
        alert for alert in findings
        if not (
            alert.get("param") == "XSRF-TOKEN"
            and urlparse(alert.get("url", "")).netloc == "quizzle:8080"
        )
    ]
    if remaining:
        alerts["10010"] = remaining
    else:
        alerts.pop("10010", None)
    return alerts
