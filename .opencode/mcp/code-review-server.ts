#!/usr/bin/env bun
/**
 * MCP Code Review Server for empeno-quick-cash
 * Provides tools: review_code, lint_project, typecheck_project, git_diff, security_scan, find_todos
 * Communicates via stdio using JSON-RPC 2.0 / MCP protocol
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ============================================================================
// JSON-RPC / MCP helpers
// ============================================================================

let requestId = 0;

function send(message: unknown) {
  const json = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}

function log(msg: string) {
  // MCP logs go to stderr
  console.error(`[code-review-mcp] ${msg}`);
}

// ============================================================================
// Tool implementations
// ============================================================================

const TOOLS = [
  {
    name: "review_code",
    description: "Read and analyze a source file for code quality issues, anti-patterns, and bugs.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Relative path to the file (e.g. src/routes/app.tsx)" },
      },
      required: ["filePath"],
    },
  },
  {
    name: "lint_project",
    description: "Run ESLint on the entire project and return errors/warnings.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "typecheck_project",
    description: "Run TypeScript compiler (noEmit) and return type errors.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "git_diff",
    description: "Show current uncommitted git changes (diff).",
    inputSchema: {
      type: "object",
      properties: {
        base: { type: "string", description: "Optional base branch/ref to diff against (default: HEAD)" },
      },
    },
  },
  {
    name: "security_scan",
    description: "Run the security scan script (checks for supply-chain IOCs, suspicious files, etc.).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "find_todos",
    description: "Find TODO, FIXME, HACK, and XXX comments in the codebase.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Optional custom pattern to search for" },
      },
    },
  },
];

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  const repoRoot = process.cwd();

  switch (name) {
    case "review_code": {
      const rel = String(args.filePath ?? "");
      const full = resolve(repoRoot, rel);
      if (!existsSync(full)) return `❌ File not found: ${rel}`;
      const content = readFileSync(full, "utf-8");
      const lines = content.split("\n");
      const issues: string[] = [];

      // Quick heuristics (not a full parser, just hints for the AI)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        if (/console\.(log|warn|error|debug)\(/.test(line) && !line.includes("//") && !line.includes("logger")) {
          issues.push(`Line ${i + 1}: console.log found — remove before production`);
        }
        if (/\bany\b/.test(line) && line.includes(":") && !line.includes("eslint-disable")) {
          issues.push(`Line ${i + 1}: explicit 'any' type — consider stricter typing`);
        }
        if (/TODO|FIXME|HACK|XXX/.test(line) && !line.includes("find_todos")) {
          issues.push(`Line ${i + 1}: ${line.trim()} — unresolved marker`);
        }
        if (/<img\s/.test(line) && !/alt=/.test(line)) {
          issues.push(`Line ${i + 1}: <img> without alt attribute`);
        }
      }

      return [
        `📄 **File**: ${rel} (${lines.length} lines)`,
        ``,
        issues.length > 0
          ? `⚠️ **Issues found** (${issues.length}):\n${issues.map((s) => `  - ${s}`).join("\n")}`
          : `✅ No obvious issues detected by heuristics.`,
        ``,
        `💡 **AI Review Prompt**: Review this ${lines.length}-line file for TypeScript/React best practices, security concerns, performance optimizations, and accessibility issues.`,
      ].join("\n");
    }

    case "lint_project": {
      try {
        const { execSync } = await import("child_process");
        const output = execSync("bun run lint", { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" });
        return `✅ ESLint passed with no errors.\n\n${output}`;
      } catch (err: any) {
        return `⚠️ ESLint found issues:\n\n\`\`\`\n${err.stdout || err.message}\n\`\`\``;
      }
    }

    case "typecheck_project": {
      try {
        const { execSync } = await import("child_process");
        const output = execSync("npx tsc --noEmit", { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" });
        return `✅ TypeScript type-check passed.\n\n${output}`;
      } catch (err: any) {
        return `⚠️ TypeScript errors:\n\n\`\`\`\n${err.stdout || err.message}\n\`\`\``;
      }
    }

    case "git_diff": {
      try {
        const { execSync } = await import("child_process");
        const base = args.base ? String(args.base) : "HEAD";
        const output = execSync(`git diff ${base}`, { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" });
        if (!output.trim()) return "✅ No uncommitted changes.";
        const summary = execSync("git diff --stat", { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" });
        return `📊 **Diff summary**:\n\`\`\`\n${summary}\n\`\`\`\n\n📄 **Full diff**:\n\`\`\`diff\n${output}\n\`\`\``;
      } catch (err: any) {
        return `❌ Error running git diff: ${err.message}`;
      }
    }

    case "security_scan": {
      try {
        const { execSync } = await import("child_process");
        const output = execSync("bash scripts/security-scan.sh", { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" });
        return `🔒 **Security Scan Results**:\n\n\`\`\`\n${output}\n\`\`\``;
      } catch (err: any) {
        return `⚠️ Security scan found issues:\n\n\`\`\`\n${err.stdout || err.message}\n\`\`\``;
      }
    }

    case "find_todos": {
      try {
        const { execSync } = await import("child_process");
        const pattern = args.pattern ? String(args.pattern) : "TODO|FIXME|HACK|XXX";
        const output = execSync(
          `git grep -nE "${pattern}" -- "src/" "supabase/" || echo "No matches found"`,
          { cwd: repoRoot, encoding: "utf-8", stdio: "pipe" },
        );
        if (output.includes("No matches")) return `✅ No ${pattern} markers found in src/ or supabase/.`;
        return `📝 **Markers found**:\n\n\`\`\`\n${output}\n\`\`\``;
      } catch (err: any) {
        return `❌ Error: ${err.message}`;
      }
    }

    default:
      return `❌ Unknown tool: ${name}`;
  }
}

// ============================================================================
// MCP Protocol handlers
// ============================================================================

async function handleRequest(req: any) {
  const { id, method, params } = req;

  switch (method) {
    case "initialize": {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "empenalo-code-review", version: "1.0.0" },
        },
      });
      break;
    }

    case "tools/list": {
      send({
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS },
      });
      break;
    }

    case "tools/call": {
      const { name, arguments: args } = params || {};
      try {
        const content = await handleToolCall(name, args || {});
        send({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: content }],
            isError: false,
          },
        });
      } catch (err: any) {
        send({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `❌ Tool error: ${err.message}` }],
            isError: true,
          },
        });
      }
      break;
    }

    default: {
      send({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
    }
  }
}

// ============================================================================
// Stdio reader (MCP uses length-prefixed messages)
// ============================================================================

let buffer = "";

process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk: string) => {
  buffer += chunk;
  while (true) {
    const headerMatch = buffer.match(/Content-Length:\s*(\d+)\r\n\r\n/);
    if (!headerMatch) break;
    const length = parseInt(headerMatch[1]!, 10);
    const headerEnd = headerMatch.index! + headerMatch[0].length;
    if (buffer.length < headerEnd + length) break;
    const json = buffer.slice(headerEnd, headerEnd + length);
    buffer = buffer.slice(headerEnd + length);
    try {
      const req = JSON.parse(json);
      handleRequest(req).catch((e) => log(`Handler error: ${e}`));
    } catch (e: any) {
      log(`JSON parse error: ${e.message}`);
    }
  }
});

process.stdin.on("end", () => {
  log("Stdio closed. Exiting.");
  process.exit(0);
});

log("Code Review MCP server started on stdio");
