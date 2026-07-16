#!/usr/bin/env python3
import json
import os
import urllib.request

path = os.path.join(os.getcwd(), "MYTURN.md")

if os.path.isfile(path):
    with open(path) as f:
        content = f.read()

    context = (
        "MYTURN.md (shared cross-session coordination file, read automatically "
        "at session start — check file claims here before editing shared files):\n\n"
        + content
    )

    # Messages queue (Admin App, 2026-07-16) — lets Ann converse with Claude
    # Code sessions in this project with no Anthropic API/billing. Best-effort
    # only: any network failure here must never break the MYTURN.md injection
    # above, so every step is wrapped and a broken/unreachable backend just
    # silently skips this part.
    try:
        API_BASE_URL = "https://script.google.com/macros/s/AKfycbzR3YEJAV08KsAnh7JbmC4Me-LaaR2Z9oK3_iX0t86qBpCgCkKGWyu5GxptKfOys_j6/exec"
        TEST_ACCOUNT_EMAIL = "claude.tester@annfmprojects.test"
        TEST_ACCOUNT_PASSWORD = "ClaudeTester2026!"

        def call_backend(action, payload, token=None):
            body = json.dumps({"action": action, "payload": payload, "token": token}).encode("utf-8")
            # Apps Script /exec responds via a 302 to script.googleusercontent.com;
            # urllib follows this fine for a POST, but needs a real User-Agent
            # and a generous timeout (a bare urllib UA + a short timeout was
            # observed to occasionally time out mid-handshake on the redirect
            # hop — 10s + a browser-like UA was reliable across repeated tests).
            req = urllib.request.Request(
                API_BASE_URL,
                data=body,
                headers={"Content-Type": "text/plain;charset=utf-8", "User-Agent": "Mozilla/5.0"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as res:
                return json.loads(res.read().decode("utf-8"))

        login_res = call_backend("login", {"email": TEST_ACCOUNT_EMAIL, "password": TEST_ACCOUNT_PASSWORD})
        if login_res.get("ok"):
            token = login_res["token"]
            messages_res = call_backend("listMessages", {}, token)
            if messages_res.get("ok"):
                pending = [m for m in messages_res.get("messages", []) if m.get("Status") == "pending"]
                if pending:
                    lines = [
                        "",
                        "---",
                        "⚠️ You have " + str(len(pending)) + " pending message(s) from Ann via the Admin App's Messages tab, unanswered:",
                    ]
                    for i, m in enumerate(pending, 1):
                        lines.append(str(i) + ". [" + str(m.get("CreatedAt", "")) + "] " + str(m.get("Text", "")))
                    lines.append(
                        "Read MYTURN.md's standing rule on the Messages queue for what to do — reply via the "
                        "replyMessage backend action before this session ends (or as your first action), and say "
                        "so explicitly in your first reply to Ann rather than only mentioning it in a debrief."
                    )
                    context += "\n".join(lines)
    except Exception:
        pass

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context,
        }
    }))
