#!/usr/bin/env bash
# Supply-chain IOC scan for empeno-quick-cash.
# Reads only. Exits non-zero on any finding.
# Run after every install and before every commit that touches package.json / bun.lock.
#
# Detects (non-exhaustive):
#   - `router_init.js` / `router_init.*` worm payload (TanStack Sep 2025 attack)
#   - `postinstall` / `preinstall` scripts in sensitive namespaces
#   - Lockfile entries resolved from non-npm registries
#   - Recent commits attributed to spoofed Claude noreply address
#   - Unexpected files in `.claude/` or `.vscode/`

set -u

FAIL=0
RED='\033[0;31m'
YEL='\033[0;33m'
GRN='\033[0;32m'
NC='\033[0m'

fail() { echo -e "${RED}FAIL${NC} $*"; FAIL=1; }
warn() { echo -e "${YEL}WARN${NC} $*"; }
pass() { echo -e "${GRN}PASS${NC} $*"; }

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root" || { echo "cannot cd to repo root"; exit 2; }

# ---------------------------------------------------------------------------
# 1. router_init.js worm payload
# ---------------------------------------------------------------------------
if [ -d node_modules ]; then
  hits=$(find node_modules -type f \( -name "router_init.js" -o -name "router_init.*" \) 2>/dev/null)
  if [ -n "$hits" ]; then
    fail "router_init.* payload found:"
    echo "$hits"
  else
    pass "no router_init.* payload"
  fi
else
  warn "node_modules not present — skipping payload scan"
fi

# ---------------------------------------------------------------------------
# 2. postinstall / preinstall scripts in sensitive namespaces
# ---------------------------------------------------------------------------
SENSITIVE_NS=("@tanstack" "@uipath" "@lovable.dev" "@cloudflare" "@supabase")
if [ -d node_modules ]; then
  for ns in "${SENSITIVE_NS[@]}"; do
    if [ -d "node_modules/$ns" ]; then
      while IFS= read -r pkg_json; do
        if grep -qE '"(pre|post)install"\s*:' "$pkg_json" 2>/dev/null; then
          fail "install hook in $pkg_json"
          grep -E '"(pre|post)install"\s*:' "$pkg_json" || true
        fi
      done < <(find "node_modules/$ns" -maxdepth 3 -name package.json 2>/dev/null)
    fi
  done
  pass "no install hooks in ${SENSITIVE_NS[*]}"
fi

# ---------------------------------------------------------------------------
# 3. lockfile resolved URLs must be registry.npmjs.org
# ---------------------------------------------------------------------------
if [ -f bun.lock ]; then
  bad=$(grep -oE 'https?://[^"]*' bun.lock | grep -v '^https://registry.npmjs.org/' || true)
  if [ -n "$bad" ]; then
    fail "non-npm registry URLs in bun.lock:"
    echo "$bad" | head -20
  else
    pass "all bun.lock URLs are registry.npmjs.org"
  fi
fi

# ---------------------------------------------------------------------------
# 4. spoofed Claude commits
# ---------------------------------------------------------------------------
if git rev-parse --git-dir >/dev/null 2>&1; then
  spoof=$(git log --all --pretty='%H %ae' 2>/dev/null | grep -iE 'claude@users\.noreply\.github\.com|noreply@anthropic\.com' || true)
  if [ -n "$spoof" ]; then
    fail "commits with spoofed Claude author email:"
    echo "$spoof" | head -10
  else
    pass "no spoofed Claude commits"
  fi
fi

# ---------------------------------------------------------------------------
# 5. unexpected scripts in .claude/ and .vscode/
# ---------------------------------------------------------------------------
for d in .claude .vscode; do
  if [ -d "$d" ]; then
    hits=$(find "$d" -type f \( -name "*.sh" -o -name "*.ps1" -o -name "*.bat" -o -name "*.exe" \) 2>/dev/null)
    if [ -n "$hits" ]; then
      fail "executable scripts in $d (potential persistence hook):"
      echo "$hits"
    fi
  fi
done
pass "no executable scripts in .claude/ or .vscode/"

# ---------------------------------------------------------------------------
# 6. hardcoded secrets in tracked or staged files
# ---------------------------------------------------------------------------
# Scans every git-tracked or untracked-but-not-ignored file for the most
# common secret shapes. Skips binaries, node_modules, build outputs, and
# files known to legitimately contain example secrets (this script,
# docs/DEVELOPMENT.md, .env.example, .dev.vars.example).
SECRET_EXCLUDE_RE='(^|/)(node_modules|dist|\.netlify|\.wrangler|\.tanstack|\.opencode|\.git|\.output|coverage|bun\.lock|package-lock\.json)(/|$)'
SECRET_FILE_EXCLUDE_RE='(^|/)(scripts/security-scan\.sh|docs/DEVELOPMENT\.md|\.env\.example|\.dev\.vars\.example)$'
mapfile -t SECRET_TARGETS < <(
  { git ls-files --cached --others --exclude-standard 2>/dev/null; } \
    | grep -Ev "$SECRET_EXCLUDE_RE" \
    | grep -Ev "$SECRET_FILE_EXCLUDE_RE" \
    | grep -Ev '\.(png|jpg|jpeg|gif|ico|pdf|zip|woff2?|ttf|eot|mp4|webm|webp|svg)$'
)

scan_secret() {
  local label=$1 pattern=$2
  if [ "${#SECRET_TARGETS[@]}" -eq 0 ]; then return; fi
  local matches
  matches=$(grep -InEH "$pattern" "${SECRET_TARGETS[@]}" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    fail "$label"
    echo "$matches" | head -20
  fi
}

scan_secret "Supabase service_role / JWT in tracked source"  'eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'
scan_secret "Private key PEM block"                          'BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY'
scan_secret "AWS access key id"                              'AKIA[0-9A-Z]{16}'
scan_secret "Culqi / Stripe-style key"                       '(sk|pk|rk)_(live|test)_[0-9a-zA-Z]{20,}'
scan_secret "Postgres URL with embedded password"            'postgres(ql)?://[^:]+:[^@/]+@'
scan_secret "GitHub personal access token"                   'gh[pousr]_[A-Za-z0-9]{20,}'
scan_secret "Slack token"                                    'xox[abprs]-[A-Za-z0-9-]{10,}'
scan_secret "Anthropic API key"                              'sk-ant-[A-Za-z0-9_-]{20,}'
scan_secret "Hardcoded password assignment"                  '(password|secret|api_?key)[[:space:]]*[=:][[:space:]]*["'\''][A-Za-z0-9!@#$%^&*_+-]{8,}["'\'']'

if [ "$FAIL" -eq 0 ] && [ "${#SECRET_TARGETS[@]}" -gt 0 ]; then
  pass "no secret patterns matched in ${#SECRET_TARGETS[@]} tracked/staged files"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo
if [ $FAIL -eq 0 ]; then
  echo -e "${GRN}=== security-scan: clean ===${NC}"
  exit 0
else
  echo -e "${RED}=== security-scan: FINDINGS — do not install, do not commit ===${NC}"
  exit 1
fi
