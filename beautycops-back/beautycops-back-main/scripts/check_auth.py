import json
import sys
import urllib.error
import urllib.request


def post_json(url: str, payload: dict) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, json.loads(body) if body else {}


def get_json(url: str, access_token: str) -> tuple[int, dict]:
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {access_token}"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = resp.read().decode("utf-8")
        return resp.status, json.loads(body) if body else {}


def main() -> int:
    base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    email = sys.argv[2] if len(sys.argv) > 2 else "testuser_cursor_1@example.com"
    password = sys.argv[3] if len(sys.argv) > 3 else "Testpass1"

    login_url = f"{base}/api/auth/login/"
    user_url = f"{base}/api/auth/user/"

    try:
        login_status, login_data = post_json(login_url, {"email": email, "password": password})
        access = login_data.get("access")
        print("login_status", login_status)
        print("has_access", bool(access))
        if not access:
            print("login_response", json.dumps(login_data, ensure_ascii=False))
            return 2

        user_status, user_data = get_json(user_url, access)
        print("user_status", user_status)
        print("user_response", json.dumps(user_data, ensure_ascii=False))
        return 0
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print("http_error", e.code)
        print(body)
        return 1
    except Exception as e:
        print("error", str(e))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

