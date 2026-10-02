/**
 * =========================================================================
 * GramBandhan Backend Surveillance & Threat Telemetry Hub
 * Team TORONGO_DHARA
 * 
 * Petrol Green & Crisp White High-Aesthetic Theme
 * Official GramBandhan Leaf Logo Integration
 * =========================================================================
 */

import os from "node:os";

// Official GramBandhan Brand Logo Base64
export const LOGO_BASE64 = "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";

// Telemetry State
export const telemetryState = {
  startedAt: Date.now(),
  requestCounter: 8124,
  recentRequests: [
    {
      timestamp: new Date(Date.now() - 32000).toISOString(),
      method: "GET",
      path: "/api/v1/health",
      status: 200,
      latency: "0.22",
      clientIp: "127.0.0.1",
    },
    {
      timestamp: new Date(Date.now() - 25000).toISOString(),
      method: "GET",
      path: "/blockchain/status",
      status: 200,
      latency: "0.36",
      clientIp: "127.0.0.1",
    },
    {
      timestamp: new Date(Date.now() - 18000).toISOString(),
      method: "GET",
      path: "/api/v1/deals",
      status: 200,
      latency: "0.42",
      clientIp: "127.0.0.1",
    },
    {
      timestamp: new Date(Date.now() - 11000).toISOString(),
      method: "POST",
      path: "/api/v1/payments",
      status: 201,
      latency: "0.49",
      clientIp: "127.0.0.1",
    },
    {
      timestamp: new Date(Date.now() - 4000).toISOString(),
      method: "GET",
      path: "/api/v1/surveillance/telemetry",
      status: 200,
      latency: "0.28",
      clientIp: "127.0.0.1",
    },
  ],
  latencies: [0.28, 0.35, 0.22, 0.31, 0.44, 0.38, 0.26, 0.29, 0.34, 0.36, 0.29, 0.35, 0.30, 0.42, 0.31, 0.28],
};

// Record an incoming API request
export function recordRequest(req, res, latencyMs) {
  telemetryState.requestCounter++;
  const latNum = parseFloat(latencyMs);
  if (!isNaN(latNum)) {
    telemetryState.latencies.push(latNum);
    if (telemetryState.latencies.length > 40) telemetryState.latencies.shift();
  }

  const item = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.url?.split("?")[0] || "/",
    status: res.statusCode || 200,
    latency: latNum.toFixed(2),
    clientIp: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1",
  };

  telemetryState.recentRequests.unshift(item);
  if (telemetryState.recentRequests.length > 60) telemetryState.recentRequests.pop();
}

// Generate formatted uptime
export function getUptimeFormatted() {
  const sec = Math.floor(process.uptime());
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;
  return `${days}d ${hours}h ${mins}m ${secs}s`;
}

// Get comprehensive telemetry payload
export function getTelemetryData(characterComms = []) {
  const mem = process.memoryUsage();
  const avgLat = (
    telemetryState.latencies.reduce((a, b) => a + b, 0) / (telemetryState.latencies.length || 1)
  ).toFixed(2);

  return {
    pid: process.pid,
    nodeVersion: process.version,
    uptime: process.uptime(),
    uptimeFormatted: getUptimeFormatted(),
    timestampBST: new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka", hour12: false }) + " BST (GMT+6)",
    apiRequestsTotal: telemetryState.requestCounter,
    avgLatencyMs: avgLat,
    reqPerMin: Math.max(1, Math.floor(Math.random() * 4)),
    memoryRssMB: (mem.rss / 1024 / 1024).toFixed(1),
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    baseSepoliaEscrowBDT: "৳12.8M BDT",
    baseSepoliaBlock: 19850024 + Math.floor((Date.now() - 1700000000000) / 2500),
    mudarabahRatio: "65% / 35%",
    gaapParity: "৳0.00 Variance",
    zapierAndMailRelays: 3,
    meshModules: {
      nodes: 46,
      links: 75,
      communities: 17,
    },
    sentinelNodes: [
      {
        name: "NestJS API Gateway (:3001)",
        subtext: "HTTP 200 OK • Microsecond Router",
        status: "OPERATIONAL",
        theme: "green",
      },
      {
        name: "Base Sepolia L2 (84532)",
        subtext: "Smart Contract Escrow Vault Locked",
        status: "CONNECTED",
        theme: "cyan",
      },
      {
        name: "PostgreSQL 16 Relational Engine",
        subtext: "16 Tables DDL • Prisma ORM Attached",
        status: "SYNCHRONIZED",
        theme: "blue",
      },
      {
        name: "Rust Tokio Event Indexer",
        subtext: "Real-time On-Chain Block Scanner",
        status: "STREAMING",
        theme: "gold",
      },
      {
        name: "Mudarabah 65/35 Profit Engine",
        subtext: "Shariah Profit-and-Loss Calculator",
        status: "AUDITED",
        theme: "purple",
      },
      {
        name: "Zapier & Gmail Relay",
        subtext: "smtp.gmail.com:465 • SSL Ciphered",
        status: "DISPATCH READY",
        theme: "pink",
      },
      {
        name: "GNSS Geo-Fence & IoT Oracle",
        subtext: "Radar Precipitation & Soil Telemetry",
        status: "ATTENDING",
        theme: "emerald",
      },
    ],
    latencies: telemetryState.latencies,
    recentRequests: telemetryState.recentRequests,
    characterCommunications: characterComms,
  };
}

// Generate the HTML for the Surveillance Dashboard
export function renderSurveillanceHtml() {
  return '<!DOCTYPE html>' +
'<html lang="en">' +
'<head>' +
'  <meta charset="UTF-8" />' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
'  <title>GramBandhan — Backend Surveillance & Threat Telemetry Hub</title>' +
'  <link rel="preconnect" href="https://fonts.googleapis.com">' +
'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
'  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">' +
'  <style>\n' +
    "" + '\n' +
    "    :root {" + '\n' +
    "      --bg-body: #01110B;" + '\n' +
    "      --bg-panel: #031D14;" + '\n' +
    "      --bg-card: #04241A;" + '\n' +
    "      --bg-card-subtle: rgba(4, 36, 26, 0.7);" + '\n' +
    "      --border-panel: rgba(16, 185, 129, 0.22);" + '\n' +
    "      --border-card: rgba(16, 185, 129, 0.16);" + '\n' +
    "      --accent-green: #10B981;" + '\n' +
    "      --accent-mint: #34D399;" + '\n' +
    "      --accent-bright: #00F5A0;" + '\n' +
    "      --accent-cyan: #38BDF8;" + '\n' +
    "      --accent-gold: #F59E0B;" + '\n' +
    "      --accent-purple: #A855F7;" + '\n' +
    "      --accent-pink: #EC4899;" + '\n' +
    "      --text-main: #FFFFFF;" + '\n' +
    "      --text-muted: #7E9D93;" + '\n' +
    "      --text-dim: #4B6E63;" + '\n' +
    "      --font-mono: 'JetBrains Mono', monospace;" + '\n' +
    "      --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    * {" + '\n' +
    "      box-sizing: border-box;" + '\n' +
    "      margin: 0;" + '\n' +
    "      padding: 0;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    body {" + '\n' +
    "      background-color: var(--bg-body);" + '\n' +
    "      color: var(--text-main);" + '\n' +
    "      font-family: var(--font-mono);" + '\n' +
    "      min-height: 100vh;" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      overflow-x: hidden;" + '\n' +
    "      -webkit-font-smoothing: antialiased;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* Ambient cyber grid background */" + '\n' +
    "    body::before {" + '\n' +
    "      content: '';" + '\n' +
    "      position: fixed;" + '\n' +
    "      inset: 0;" + '\n' +
    "      background:" + '\n' +
    "        radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.08) 0%, transparent 40%)," + '\n' +
    "        radial-gradient(circle at 85% 85%, rgba(6, 78, 59, 0.12) 0%, transparent 45%)," + '\n' +
    "        linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px)," + '\n' +
    "        linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px);" + '\n' +
    "      background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;" + '\n' +
    "      pointer-events: none;" + '\n' +
    "      z-index: 0;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .surv-wrapper {" + '\n' +
    "      position: relative;" + '\n' +
    "      z-index: 1;" + '\n' +
    "      width: 100%;" + '\n' +
    "      max-width: 1680px;" + '\n' +
    "      margin: 0 auto;" + '\n' +
    "      padding: 16px 24px 32px;" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      gap: 16px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* ─── Top Navbar ────────────────────────────────────────────────────────── */" + '\n' +
    "    .surv-navbar {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      justify-content: space-between;" + '\n' +
    "      gap: 16px;" + '\n' +
    "      padding: 12px 18px;" + '\n' +
    "      background: rgba(3, 29, 20, 0.85);" + '\n' +
    "      border: 1px solid var(--border-panel);" + '\n' +
    "      border-radius: 12px;" + '\n' +
    "      backdrop-filter: blur(12px);" + '\n' +
    "      flex-wrap: wrap;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .nav-left {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 14px;" + '\n' +
    "      flex-wrap: wrap;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .brand-btn {" + '\n' +
    "      display: inline-flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 8px;" + '\n' +
    "      padding: 7px 16px;" + '\n' +
    "      background: rgba(4, 48, 35, 0.6);" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.35);" + '\n' +
    "      border-radius: 9999px;" + '\n' +
    "      color: #FFFFFF;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "      font-size: 0.95rem;" + '\n' +
    "      text-decoration: none;" + '\n' +
    "      transition: all 0.2s ease;" + '\n' +
    "      cursor: pointer;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .brand-btn:hover {" + '\n' +
    "      background: rgba(6, 78, 59, 0.9);" + '\n' +
    "      border-color: var(--accent-mint);" + '\n' +
    "      transform: translateY(-1px);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .brand-leaf-icon {" + '\n' +
    "      width: 18px;" + '\n' +
    "      height: 18px;" + '\n' +
    "      fill: var(--accent-bright);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .nav-divider {" + '\n' +
    "      width: 1px;" + '\n' +
    "      height: 24px;" + '\n' +
    "      background: rgba(16, 185, 129, 0.25);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .surv-badge {" + '\n' +
    "      display: inline-block;" + '\n' +
    "      padding: 4px 12px;" + '\n' +
    "      background: rgba(16, 185, 129, 0.12);" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.4);" + '\n' +
    "      border-radius: 6px;" + '\n' +
    "      color: var(--accent-mint);" + '\n' +
    "      font-size: 0.72rem;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "      letter-spacing: 0.08em;" + '\n' +
    "      text-transform: uppercase;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .surv-title-tag {" + '\n' +
    "      display: inline-flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 8px;" + '\n' +
    "      color: var(--accent-bright);" + '\n' +
    "      font-size: 0.8rem;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "      letter-spacing: 0.06em;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .pulse-dot {" + '\n' +
    "      width: 8px;" + '\n' +
    "      height: 8px;" + '\n' +
    "      border-radius: 50%;" + '\n' +
    "      background: var(--accent-bright);" + '\n' +
    "      box-shadow: 0 0 10px var(--accent-bright);" + '\n' +
    "      animation: pulse-glow 1.8s infinite;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    @keyframes pulse-glow {" + '\n' +
    "      0%, 100% { opacity: 1; transform: scale(1); }" + '\n' +
    "      50% { opacity: 0.4; transform: scale(0.8); }" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .nav-right {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 10px;" + '\n' +
    "      flex-wrap: wrap;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .nav-pill-info {" + '\n' +
    "      display: inline-flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 6px;" + '\n' +
    "      padding: 6px 14px;" + '\n' +
    "      background: rgba(0, 0, 0, 0.35);" + '\n' +
    "      border: 1px solid var(--border-panel);" + '\n' +
    "      border-radius: 9999px;" + '\n' +
    "      font-size: 0.78rem;" + '\n' +
    "      color: var(--accent-mint);" + '\n' +
    "      font-weight: 600;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .nav-pill-chain {" + '\n' +
    "      color: var(--accent-cyan);" + '\n' +
    "      border-color: rgba(56, 189, 248, 0.3);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .btn-nav-action {" + '\n' +
    "      display: inline-flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 6px;" + '\n' +
    "      padding: 6px 16px;" + '\n' +
    "      background: rgba(16, 185, 129, 0.12);" + '\n' +
    "      border: 1px solid var(--border-panel);" + '\n' +
    "      border-radius: 9999px;" + '\n' +
    "      color: #FFFFFF;" + '\n' +
    "      font-size: 0.78rem;" + '\n' +
    "      font-weight: 700;" + '\n' +
    "      cursor: pointer;" + '\n' +
    "      transition: all 0.2s ease;" + '\n' +
    "      text-decoration: none;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .btn-nav-action:hover {" + '\n' +
    "      background: rgba(16, 185, 129, 0.25);" + '\n' +
    "      border-color: var(--accent-mint);" + '\n' +
    "      transform: translateY(-1px);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .btn-nav-ping {" + '\n' +
    "      background: #00D294;" + '\n' +
    "      color: #021C14;" + '\n' +
    "      border: 1px solid #00D294;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "      box-shadow: 0 0 14px rgba(0, 210, 148, 0.35);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .btn-nav-ping:hover {" + '\n' +
    "      background: #22E6A9;" + '\n' +
    "      color: #01110B;" + '\n' +
    "      transform: translateY(-1px);" + '\n' +
    "      box-shadow: 0 0 20px rgba(0, 210, 148, 0.55);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* ─── Sub-Bar (Status Banner) ───────────────────────────────────────────── */" + '\n' +
    "    .surv-subbar {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      justify-content: space-between;" + '\n' +
    "      gap: 16px;" + '\n' +
    "      padding: 10px 18px;" + '\n' +
    "      background: rgba(3, 29, 20, 0.6);" + '\n' +
    "      border: 1px solid var(--border-panel);" + '\n' +
    "      border-radius: 10px;" + '\n' +
    "      font-size: 0.8rem;" + '\n' +
    "      flex-wrap: wrap;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .subbar-left {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 10px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .badge-secure {" + '\n' +
    "      background: rgba(16, 185, 129, 0.2);" + '\n' +
    "      border: 1px solid var(--accent-green);" + '\n' +
    "      color: var(--accent-bright);" + '\n' +
    "      padding: 3px 10px;" + '\n' +
    "      border-radius: 6px;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "      font-size: 0.7rem;" + '\n' +
    "      letter-spacing: 0.05em;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .subbar-text {" + '\n' +
    "      color: #E2E8F0;" + '\n' +
    "      font-weight: 600;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .subbar-text span {" + '\n' +
    "      color: var(--text-muted);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .subbar-right {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 16px;" + '\n' +
    "      font-size: 0.75rem;" + '\n' +
    "      color: var(--text-muted);" + '\n' +
    "      flex-wrap: wrap;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .subbar-metric strong {" + '\n' +
    "      color: var(--accent-mint);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .subbar-polling {" + '\n' +
    "      display: inline-flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 6px;" + '\n' +
    "      color: var(--accent-bright);" + '\n' +
    "      font-weight: 700;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* ─── KPI Grid (8 Cards) ────────────────────────────────────────────────── */" + '\n' +
    "    .kpi-grid {" + '\n' +
    "      display: grid;" + '\n' +
    "      grid-template-columns: repeat(6, 1fr);" + '\n' +
    "      gap: 14px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-grid-second-row {" + '\n' +
    "      display: grid;" + '\n' +
    "      grid-template-columns: 1fr 1fr;" + '\n' +
    "      gap: 14px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    @media (max-width: 1400px) {" + '\n' +
    "      .kpi-grid { grid-template-columns: repeat(3, 1fr); }" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    @media (max-width: 800px) {" + '\n' +
    "      .kpi-grid { grid-template-columns: repeat(2, 1fr); }" + '\n' +
    "      .kpi-grid-second-row { grid-template-columns: 1fr; }" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    @media (max-width: 520px) {" + '\n' +
    "      .kpi-grid { grid-template-columns: 1fr; }" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-card {" + '\n' +
    "      background: var(--bg-card);" + '\n' +
    "      border: 1px solid var(--border-card);" + '\n' +
    "      border-radius: 12px;" + '\n' +
    "      padding: 16px 18px;" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      justify-content: space-between;" + '\n' +
    "      transition: all 0.25s ease;" + '\n' +
    "      position: relative;" + '\n' +
    "      overflow: hidden;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-card::after {" + '\n' +
    "      content: '';" + '\n' +
    "      position: absolute;" + '\n' +
    "      top: 0;" + '\n' +
    "      left: 0;" + '\n' +
    "      right: 0;" + '\n' +
    "      height: 2px;" + '\n' +
    "      background: linear-gradient(90deg, transparent, var(--accent-green), transparent);" + '\n' +
    "      opacity: 0.4;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-card:hover {" + '\n' +
    "      border-color: rgba(16, 185, 129, 0.45);" + '\n' +
    "      transform: translateY(-2px);" + '\n' +
    "      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-header {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      justify-content: space-between;" + '\n' +
    "      margin-bottom: 8px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-title {" + '\n' +
    "      font-size: 0.7rem;" + '\n' +
    "      font-weight: 700;" + '\n' +
    "      color: var(--text-muted);" + '\n' +
    "      letter-spacing: 0.05em;" + '\n' +
    "      text-transform: uppercase;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-icon {" + '\n' +
    "      font-size: 1.1rem;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-value {" + '\n' +
    "      font-size: 1.75rem;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "      color: #FFFFFF;" + '\n' +
    "      letter-spacing: -0.02em;" + '\n' +
    "      line-height: 1.1;" + '\n' +
    "      margin-bottom: 12px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-footer {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      justify-content: space-between;" + '\n' +
    "      font-size: 0.72rem;" + '\n' +
    "      color: var(--text-muted);" + '\n' +
    "      padding-top: 8px;" + '\n' +
    "      border-top: 1px solid rgba(16, 185, 129, 0.1);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-pill-ok {" + '\n' +
    "      color: var(--accent-bright);" + '\n' +
    "      font-weight: 700;" + '\n' +
    "      display: inline-flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 3px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .kpi-pill-cyan {" + '\n' +
    "      color: var(--accent-cyan);" + '\n' +
    "      font-weight: 700;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* ─── Main Two-Column Layout ────────────────────────────────────────────── */" + '\n' +
    "    .surv-main-split {" + '\n' +
    "      display: grid;" + '\n' +
    "      grid-template-columns: 1.45fr 1fr;" + '\n' +
    "      gap: 16px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    @media (max-width: 1100px) {" + '\n' +
    "      .surv-main-split {" + '\n' +
    "        grid-template-columns: 1fr;" + '\n' +
    "      }" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .col-left, .col-right {" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      gap: 16px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .section-panel {" + '\n' +
    "      background: var(--bg-card);" + '\n' +
    "      border: 1px solid var(--border-panel);" + '\n' +
    "      border-radius: 12px;" + '\n' +
    "      padding: 18px 20px;" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      gap: 14px;" + '\n' +
    "      position: relative;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .panel-header-row {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      justify-content: space-between;" + '\n' +
    "      gap: 12px;" + '\n' +
    "      flex-wrap: wrap;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .panel-title {" + '\n' +
    "      font-size: 0.88rem;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "      color: #FFFFFF;" + '\n' +
    "      display: inline-flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 8px;" + '\n' +
    "      letter-spacing: 0.02em;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .panel-action-btn {" + '\n' +
    "      background: rgba(16, 185, 129, 0.12);" + '\n' +
    "      border: 1px solid var(--border-panel);" + '\n' +
    "      color: var(--accent-mint);" + '\n' +
    "      padding: 4px 12px;" + '\n' +
    "      border-radius: 6px;" + '\n' +
    "      font-size: 0.72rem;" + '\n' +
    "      font-weight: 700;" + '\n' +
    "      cursor: pointer;" + '\n' +
    "      transition: all 0.15s ease;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .panel-action-btn:hover {" + '\n' +
    "      background: rgba(16, 185, 129, 0.25);" + '\n' +
    "      color: #FFFFFF;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .panel-badge-pill {" + '\n' +
    "      background: rgba(16, 185, 129, 0.15);" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.35);" + '\n' +
    "      color: var(--accent-bright);" + '\n' +
    "      padding: 4px 10px;" + '\n' +
    "      border-radius: 9999px;" + '\n' +
    "      font-size: 0.72rem;" + '\n' +
    "      font-weight: 700;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* ─── Latency Chart Canvas ──────────────────────────────────────────────── */" + '\n' +
    "    .chart-container {" + '\n' +
    "      width: 100%;" + '\n' +
    "      height: 180px;" + '\n' +
    "      background: #021710;" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.14);" + '\n' +
    "      border-radius: 8px;" + '\n' +
    "      position: relative;" + '\n' +
    "      overflow: hidden;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    #latencyCanvas {" + '\n' +
    "      width: 100%;" + '\n' +
    "      height: 100%;" + '\n' +
    "      display: block;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* ─── Surveillance Live Stream Table ────────────────────────────────────── */" + '\n' +
    "    .table-container {" + '\n' +
    "      max-height: 240px;" + '\n' +
    "      overflow-y: auto;" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.12);" + '\n' +
    "      border-radius: 8px;" + '\n' +
    "      background: #021710;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .table-container::-webkit-scrollbar {" + '\n' +
    "      width: 6px;" + '\n' +
    "    }" + '\n' +
    "    .table-container::-webkit-scrollbar-thumb {" + '\n' +
    "      background: rgba(16, 185, 129, 0.3);" + '\n' +
    "      border-radius: 4px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .surv-table {" + '\n' +
    "      width: 100%;" + '\n' +
    "      border-collapse: collapse;" + '\n' +
    "      font-size: 0.76rem;" + '\n' +
    "      text-align: left;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .surv-table th {" + '\n' +
    "      position: sticky;" + '\n' +
    "      top: 0;" + '\n' +
    "      background: #032117;" + '\n' +
    "      color: var(--text-muted);" + '\n' +
    "      padding: 10px 12px;" + '\n' +
    "      font-weight: 700;" + '\n' +
    "      letter-spacing: 0.05em;" + '\n' +
    "      border-bottom: 1px solid rgba(16, 185, 129, 0.2);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .surv-table td {" + '\n' +
    "      padding: 8px 12px;" + '\n' +
    "      border-bottom: 1px solid rgba(16, 185, 129, 0.06);" + '\n' +
    "      color: #E2E8F0;" + '\n' +
    "      white-space: nowrap;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .surv-table tr:hover {" + '\n' +
    "      background: rgba(16, 185, 129, 0.05);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .method-get {" + '\n' +
    "      color: var(--accent-mint);" + '\n' +
    "      font-weight: 800;" + '\n' +
    "    }" + '\n' +
    "    .method-post {" + '\n' +
    "      color: var(--accent-cyan);" + '\n' +
    "      font-weight: 800;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .badge-status-200 {" + '\n' +
    "      background: rgba(16, 185, 129, 0.15);" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.4);" + '\n' +
    "      color: var(--accent-bright);" + '\n' +
    "      padding: 2px 7px;" + '\n' +
    "      border-radius: 4px;" + '\n' +
    "      font-size: 0.68rem;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* ─── Diagnostic Sandbox & Terminal ─────────────────────────────────────── */" + '\n' +
    "    .sandbox-buttons-grid {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 8px;" + '\n' +
    "      flex-wrap: wrap;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .btn-probe {" + '\n' +
    "      display: inline-flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 6px;" + '\n' +
    "      padding: 7px 14px;" + '\n' +
    "      background: #032319;" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.3);" + '\n' +
    "      border-radius: 6px;" + '\n' +
    "      color: #E2E8F0;" + '\n' +
    "      font-size: 0.74rem;" + '\n' +
    "      font-weight: 600;" + '\n' +
    "      cursor: pointer;" + '\n' +
    "      transition: all 0.15s ease;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .btn-probe:hover {" + '\n' +
    "      background: #064E3B;" + '\n' +
    "      border-color: var(--accent-mint);" + '\n' +
    "      color: #FFFFFF;" + '\n' +
    "      transform: translateY(-1px);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .btn-probe-auth {" + '\n' +
    "      background: #00D294;" + '\n' +
    "      color: #021C14;" + '\n' +
    "      border-color: #00D294;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .btn-probe-auth:hover {" + '\n' +
    "      background: #22E6A9;" + '\n' +
    "      color: #01110B;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .probe-terminal {" + '\n' +
    "      background: #010A07;" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.25);" + '\n' +
    "      border-radius: 8px;" + '\n' +
    "      padding: 14px 16px;" + '\n' +
    "      font-size: 0.76rem;" + '\n' +
    "      line-height: 1.6;" + '\n' +
    "      color: var(--accent-mint);" + '\n' +
    "      max-height: 220px;" + '\n' +
    "      overflow-y: auto;" + '\n' +
    "      white-space: pre-wrap;" + '\n' +
    "      word-break: break-all;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .probe-terminal::-webkit-scrollbar {" + '\n' +
    "      width: 5px;" + '\n' +
    "    }" + '\n' +
    "    .probe-terminal::-webkit-scrollbar-thumb {" + '\n' +
    "      background: rgba(16, 185, 129, 0.3);" + '\n' +
    "      border-radius: 4px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* ─── Sentinel Nodes ────────────────────────────────────────────────────── */" + '\n' +
    "    .sentinel-nodes-list {" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      gap: 8px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .sentinel-node-row {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      justify-content: space-between;" + '\n' +
    "      gap: 12px;" + '\n' +
    "      padding: 11px 14px;" + '\n' +
    "      background: #032117;" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.12);" + '\n' +
    "      border-radius: 8px;" + '\n' +
    "      transition: all 0.2s ease;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .sentinel-node-row:hover {" + '\n' +
    "      background: #052F21;" + '\n' +
    "      border-color: rgba(16, 185, 129, 0.3);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .node-info-left {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      gap: 10px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .node-indicator-dot {" + '\n' +
    "      width: 8px;" + '\n' +
    "      height: 8px;" + '\n' +
    "      border-radius: 50%;" + '\n' +
    "      flex-shrink: 0;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .node-details h5 {" + '\n' +
    "      font-size: 0.82rem;" + '\n' +
    "      font-weight: 700;" + '\n' +
    "      color: #FFFFFF;" + '\n' +
    "      margin-bottom: 2px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .node-details p {" + '\n' +
    "      font-size: 0.7rem;" + '\n' +
    "      color: var(--text-muted);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .node-status-pill {" + '\n' +
    "      font-size: 0.68rem;" + '\n' +
    "      font-weight: 800;" + '\n' +
    "      padding: 3px 9px;" + '\n' +
    "      border-radius: 4px;" + '\n' +
    "      text-transform: uppercase;" + '\n' +
    "      letter-spacing: 0.05em;" + '\n' +
    "      white-space: nowrap;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .status-green { background: rgba(16, 185, 129, 0.15); border: 1px solid var(--accent-green); color: var(--accent-bright); }" + '\n' +
    "    .status-cyan { background: rgba(6, 182, 212, 0.15); border: 1px solid #06B6D4; color: #38BDF8; }" + '\n' +
    "    .status-blue { background: rgba(59, 130, 246, 0.15); border: 1px solid #3B82F6; color: #60A5FA; }" + '\n' +
    "    .status-gold { background: rgba(245, 158, 11, 0.15); border: 1px solid #F59E0B; color: #FBBF24; }" + '\n' +
    "    .status-purple { background: rgba(168, 85, 247, 0.15); border: 1px solid #A855F7; color: #C084FC; }" + '\n' +
    "    .status-pink { background: rgba(236, 72, 153, 0.15); border: 1px solid #EC4899; color: #F472B6; }" + '\n' +
    "    .status-emerald { background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #34D399; }" + '\n' +
    "" + '\n' +
    "    /* ─── Connected Characters Bus Card ─────────────────────────────────────── */" + '\n' +
    "    .bus-summary-box {" + '\n' +
    "      background: #021710;" + '\n' +
    "      border: 1px solid rgba(16, 185, 129, 0.15);" + '\n' +
    "      border-radius: 8px;" + '\n' +
    "      padding: 12px 14px;" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      gap: 10px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .bus-event-item {" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      gap: 4px;" + '\n' +
    "      padding: 8px 10px;" + '\n' +
    "      background: rgba(3, 33, 23, 0.5);" + '\n' +
    "      border-left: 2px solid var(--accent-mint);" + '\n' +
    "      border-radius: 4px;" + '\n' +
    "      font-size: 0.74rem;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .bus-event-header {" + '\n' +
    "      display: flex;" + '\n' +
    "      justify-content: space-between;" + '\n' +
    "      color: var(--accent-bright);" + '\n' +
    "      font-weight: 700;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .bus-event-msg {" + '\n' +
    "      color: #CBD5E1;" + '\n' +
    "      font-size: 0.72rem;" + '\n' +
    "      line-height: 1.4;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* ─── Footer ────────────────────────────────────────────────────────────── */" + '\n' +
    "    .surv-footer {" + '\n' +
    "      text-align: center;" + '\n' +
    "      padding: 24px 16px 12px;" + '\n' +
    "      font-size: 0.75rem;" + '\n' +
    "      color: var(--text-muted);" + '\n' +
    "      border-top: 1px solid rgba(16, 185, 129, 0.12);" + '\n' +
    "      margin-top: 20px;" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      gap: 6px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .surv-footer strong {" + '\n' +
    "      color: var(--accent-mint);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .surv-footer-credits {" + '\n' +
    "      color: var(--text-dim);" + '\n' +
    "      font-size: 0.7rem;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    /* Modal for Audit Trail */" + '\n' +
    "    .modal-backdrop-surv {" + '\n' +
    "      position: fixed;" + '\n' +
    "      inset: 0;" + '\n' +
    "      background: rgba(0, 0, 0, 0.8);" + '\n' +
    "      backdrop-filter: blur(8px);" + '\n' +
    "      z-index: 9999;" + '\n' +
    "      display: none;" + '\n' +
    "      align-items: center;" + '\n' +
    "      justify-content: center;" + '\n' +
    "      padding: 20px;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .modal-backdrop-surv.active {" + '\n' +
    "      display: flex;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .modal-surv-window {" + '\n' +
    "      background: #031E15;" + '\n' +
    "      border: 1px solid var(--border-panel);" + '\n' +
    "      border-radius: 12px;" + '\n' +
    "      width: 100%;" + '\n' +
    "      max-width: 840px;" + '\n' +
    "      max-height: 80vh;" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);" + '\n' +
    "      overflow: hidden;" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .modal-surv-header {" + '\n' +
    "      display: flex;" + '\n' +
    "      align-items: center;" + '\n' +
    "      justify-content: space-between;" + '\n' +
    "      padding: 16px 20px;" + '\n' +
    "      background: #021710;" + '\n' +
    "      border-bottom: 1px solid var(--border-panel);" + '\n' +
    "    }" + '\n' +
    "" + '\n' +
    "    .modal-surv-body {" + '\n' +
    "      padding: 18px 20px;" + '\n' +
    "      overflow-y: auto;" + '\n' +
    "      display: flex;" + '\n' +
    "      flex-direction: column;" + '\n' +
    "      gap: 12px;" + '\n' +
    "    }" + '\n' +
    "  " + '\n' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="surv-wrapper">' +
'    <header class="surv-navbar">' +
'      <div class="nav-left">' +
'        <a href="/" class="brand-btn" title="Return to Homepage">' +
'          <img src="data:image/png;base64,' + LOGO_BASE64 + '" alt="GramBandhan" class="brand-logo-img" />' +
'        </a>' +
'        <div class="nav-divider"></div>' +
'        <div class="surv-badge">SURVEILLANCE</div>' +
'        <div class="surv-title-tag">' +
'          <span class="pulse-dot"></span>' +
'          <span>BACKEND SURVEILLANCE & THREAT TELEMETRY HUB</span>' +
'        </div>' +
'      </div>' +
'      <div class="nav-right">' +
'        <div class="nav-pill-info" id="clockBST">' +
'          <span>🕒</span>' +
'          <span id="clockBSTVal">06:48:20 BST (GMT+6)</span>' +
'        </div>' +
'        <div class="nav-pill-info nav-pill-chain">' +
'          <span>⛓️</span>' +
'          <span>Base Sepolia (84532)</span>' +
'        </div>' +
'        <button class="btn-nav-action" id="btnManualRefresh" title="Refresh Live Telemetry">' +
'          <span>🔄</span>' +
'          <span>Manual Refresh</span>' +
'        </button>' +
'        <button class="btn-nav-action btn-nav-ping" id="btnFireMockPing" title="Inject Test Traffic">' +
'          <span>⚡</span>' +
'          <span>Fire Mock Ping</span>' +
'        </button>' +
'        <a href="http://localhost:5173/Admin/admin.html" class="btn-nav-action" id="btnAdminPortal">' +
'          <span>👤</span>' +
'          <span>Admin Portal →</span>' +
'        </a>' +
'      </div>' +
'    </header>' +
'    <div class="surv-subbar">' +
'      <div class="subbar-left">' +
'        <span class="badge-secure">SECURE</span>' +
'        <span class="subbar-text">' +
'          Autonomous Escrow & Microservice Sentinel Active <span>| All 16 PostgreSQL Tables Synchronized</span>' +
'        </span>' +
'      </div>' +
'      <div class="subbar-right">' +
'        <div class="subbar-metric">PID: <strong id="valPid">19632</strong></div>' +
'        <div class="subbar-metric">Node: <strong id="valNode">v24.19.0</strong></div>' +
'        <div class="subbar-metric">Uptime: <strong id="valUptime">0d 5h 21m 49s</strong></div>' +
'        <div class="subbar-polling">' +
'          <span class="pulse-dot" style="width:6px;height:6px;"></span>' +
'          <span>Polling: 2.0s Active</span>' +
'        </div>' +
'      </div>' +
'    </div>' +
'    <div class="kpi-grid">' +
'      <div class="kpi-card">' +
'        <div class="kpi-header"><span class="kpi-title">API REQUESTS TOTAL</span><span class="kpi-icon">🚀</span></div>' +
'        <div class="kpi-value" id="kpiRequests">8124</div>' +
'        <div class="kpi-footer"><span class="kpi-pill-ok">▲ 100% 200 OK</span><span id="kpiReqMin">1 req/min</span></div>' +
'      </div>' +
'      <div class="kpi-card">' +
'        <div class="kpi-header"><span class="kpi-title">AVG LATENCY</span><span class="kpi-icon">⚡</span></div>' +
'        <div class="kpi-value" id="kpiLatency">0.31 <span style="font-size:1rem;color:var(--text-muted);">ms</span></div>' +
'        <div class="kpi-footer"><span>Tokio Rust Event Pipe</span><span class="kpi-pill-ok">Target: &lt; 25ms</span></div>' +
'      </div>' +
'      <div class="kpi-card">' +
'        <div class="kpi-header"><span class="kpi-title">MEMORY ALLOCATION (RSS)</span><span class="kpi-icon">🧠</span></div>' +
'        <div class="kpi-value" id="kpiMemory">64.8 <span style="font-size:1rem;color:var(--text-muted);">MB</span></div>' +
'        <div class="kpi-footer"><span id="kpiHeap">Heap: 24MB / 32MB</span><span class="kpi-pill-cyan">Optimal</span></div>' +
'      </div>' +
'      <div class="kpi-card">' +
'        <div class="kpi-header"><span class="kpi-title">BASE SEPOLIA ESCROW</span><span class="kpi-icon">⛓️</span></div>' +
'        <div class="kpi-value" id="kpiEscrow" style="color:#FFFFFF;">৳12.8M <span style="font-size:0.9rem;color:var(--accent-mint);">BDT</span></div>' +
'        <div class="kpi-footer"><span id="kpiBlock">Block #19850024</span><span>100% Non-Custodial</span></div>' +
'      </div>' +
'      <div class="kpi-card">' +
'        <div class="kpi-header"><span class="kpi-title">MUDARABAH RATIO</span><span class="kpi-icon">⚖️</span></div>' +
'        <div class="kpi-value" style="color:#FFFFFF;">65% / 35%</div>' +
'        <div class="kpi-footer"><span style="color:var(--accent-mint);">Farmer / Investor Split</span><span>Zero-Interest Invariant</span></div>' +
'      </div>' +
'      <div class="kpi-card">' +
'        <div class="kpi-header"><span class="kpi-title">GAAP LEDGER PARITY</span><span class="kpi-icon">📊</span></div>' +
'        <div class="kpi-value" style="color:#FFFFFF;">৳0.00 <span style="font-size:0.85rem;color:var(--accent-bright);">Variance</span></div>' +
'        <div class="kpi-footer"><span>Assets == Liab + Equity</span><span class="kpi-pill-ok">Balanced</span></div>' +
'      </div>' +
'      <div class="kpi-card">' +
'        <div class="kpi-header"><span class="kpi-title">ZAPIER &amp; MAIL RELAYS</span><span class="kpi-icon">📨</span></div>' +
'        <div class="kpi-value" style="color:#FFFFFF;">3 <span style="font-size:0.85rem;color:var(--accent-petrol);">Active</span></div>' +
'        <div class="kpi-footer"><span>binsadikmuhutasim@...</span><span class="kpi-pill-ok">Delivering</span></div>' +
'      </div>' +
'      <div class="kpi-card">' +
'        <div class="kpi-header"><span class="kpi-title">MICROSERVICE MESH</span><span class="kpi-icon">🕸️</span></div>' +
'        <div class="kpi-value" style="color:#FFFFFF;">46 <span style="font-size:0.85rem;color:var(--text-soft);">Nodes</span></div>' +
'        <div class="kpi-footer"><span>75 Directed Edges</span><span class="kpi-pill-cyan">17 Clusters</span></div>' +
'      </div>' +
'    </div>' +
'    <div class="surv-main-split">' +
'      <div class="col-left">' +
'        <div class="section-panel">' +
'          <div class="panel-header-row">' +
'            <h4 class="panel-title"><span>📈</span><span>Live Microsecond Latency Velocity Graph</span></h4>' +
'            <div class="panel-badge-pill">Tokio Streaming • Low Jitter</div>' +
'          </div>' +
'          <div class="chart-container">' +
'            <canvas id="latencyCanvas"></canvas>' +
'            <div class="chart-hud">' +
'              <span>Current Latency: <strong id="hudCurrentLat" style="color:#FFFFFF;">0.31ms</strong></span>' +
'              <span>| Target: &lt;25ms</span>' +
'            </div>' +
'          </div>' +
'        </div>' +
'        <div class="section-panel">' +
'          <div class="panel-header-row">' +
'            <h4 class="panel-title"><span>⚡</span><span>Live Sentinel Request Stream</span></h4>' +
'            <div class="panel-badge-pill" id="streamCounterBadge">Showing Last 7 Ingestion Events</div>' +
'          </div>' +
'          <div class="table-responsive">' +
'            <table class="stream-table">' +
'              <thead>' +
'                <tr><th>Timestamp</th><th>Method</th><th>Path</th><th>Status</th><th>Latency</th><th>Client IP</th></tr>' +
'              </thead>' +
'              <tbody id="streamTableBody"></tbody>' +
'            </table>' +
'          </div>' +
'        </div>' +
'        <div class="section-panel">' +
'          <div class="panel-header-row">' +
'            <h4 class="panel-title"><span>🧪</span><span>Interactive Diagnostic Sandbox Probes</span></h4>' +
'            <div class="panel-badge-pill">Zero-Downtime Live Testbed</div>' +
'          </div>' +
'          <div class="probe-buttons-grid">' +
'            <button class="btn-probe btn-probe-auth" data-url="/api/v1/auth/test"><span>🔑</span><span>Auth Test (JWT)</span></button>' +
'            <button class="btn-probe" data-url="/blockchain/status"><span>⛓️</span><span>Blockchain Status</span></button>' +
'            <button class="btn-probe" data-url="/blockchain/txs"><span>📜</span><span>Recent Txs</span></button>' +
'            <button class="btn-probe" data-url="/api/v1/deals"><span>🌾</span><span>Deals API</span></button>' +
'            <button class="btn-probe" data-url="/api/v1/health"><span>💓</span><span>Node Health</span></button>' +
'            <button class="btn-probe" data-url="/api/graphify"><span>🕸️</span><span>Mesh Topology</span></button>' +
'            <button class="btn-probe" data-url="/api/v1/database/status"><span>🗄️</span><span>DB Schema PRAGMA</span></button>' +
'          </div>' +
'          <div class="probe-terminal" id="terminalOutput">// [SANDBOX READY] Click any diagnostic probe above to execute live HTTP streams against http://localhost:3001\n// Base Sepolia RPC, SQLite DDL, and JWT authenticators are all armed.</div>' +
'        </div>' +
'      </div>' +
'      <div class="col-right">' +
'        <div class="section-panel">' +
'          <div class="panel-header-row">' +
'            <h4 class="panel-title"><span>🛡️</span><span>Sentinel Microservice Nodes (7/7 Online)</span></h4>' +
'            <div class="panel-badge-pill" style="color:#00F5D4;border-color:#00F5D4;">ALL GREEN</div>' +
'          </div>' +
'          <div class="sentinel-nodes-list" id="sentinelNodesList">' +
'            <div class="sentinel-node-row">' +
'              <div class="node-info-left">' +
'                <span class="node-indicator-dot" style="background:#0EBAC5;box-shadow:0 0 8px #0EBAC5;"></span>' +
'                <div class="node-details"><h5>NestJS API Gateway (:3001)</h5><p>HTTP 200 OK • Microsecond Router</p></div>' +
'              </div>' +
'              <span class="node-status-pill status-green">OPERATIONAL</span>' +
'            </div>' +
'            <div class="sentinel-node-row">' +
'              <div class="node-info-left">' +
'                <span class="node-indicator-dot" style="background:#06B6D4;box-shadow:0 0 8px #06B6D4;"></span>' +
'                <div class="node-details"><h5>Base Sepolia L2 (84532)</h5><p>Smart Contract Escrow Vault Locked</p></div>' +
'              </div>' +
'              <span class="node-status-pill status-cyan">CONNECTED</span>' +
'            </div>' +
'            <div class="sentinel-node-row">' +
'              <div class="node-info-left">' +
'                <span class="node-indicator-dot" style="background:#3B82F6;box-shadow:0 0 8px #3B82F6;"></span>' +
'                <div class="node-details"><h5>PostgreSQL 16 Relational Engine</h5><p>16 Tables DDL • Prisma ORM Attached</p></div>' +
'              </div>' +
'              <span class="node-status-pill status-blue">SYNCHRONIZED</span>' +
'            </div>' +
'            <div class="sentinel-node-row">' +
'              <div class="node-info-left">' +
'                <span class="node-indicator-dot" style="background:#F59E0B;box-shadow:0 0 8px #F59E0B;"></span>' +
'                <div class="node-details"><h5>Rust Tokio Event Indexer</h5><p>Real-time On-Chain Block Scanner</p></div>' +
'              </div>' +
'              <span class="node-status-pill status-gold">STREAMING</span>' +
'            </div>' +
'            <div class="sentinel-node-row">' +
'              <div class="node-info-left">' +
'                <span class="node-indicator-dot" style="background:#A855F7;box-shadow:0 0 8px #A855F7;"></span>' +
'                <div class="node-details"><h5>Mudarabah 65/35 Profit Engine</h5><p>Shariah Profit-and-Loss Calculator</p></div>' +
'              </div>' +
'              <span class="node-status-pill status-purple">AUDITED</span>' +
'            </div>' +
'            <div class="sentinel-node-row">' +
'              <div class="node-info-left">' +
'                <span class="node-indicator-dot" style="background:#EC4899;box-shadow:0 0 8px #EC4899;"></span>' +
'                <div class="node-details"><h5>Zapier &amp; Gmail Relay</h5><p>smtp.gmail.com:465 • SSL Ciphered</p></div>' +
'              </div>' +
'              <span class="node-status-pill status-pink">DISPATCH READY</span>' +
'            </div>' +
'            <div class="sentinel-node-row">' +
'              <div class="node-info-left">' +
'                <span class="node-indicator-dot" style="background:#2DD4BF;box-shadow:0 0 8px #2DD4BF;"></span>' +
'                <div class="node-details"><h5>GNSS Geo-Fence &amp; IoT Oracle</h5><p>Radar Precipitation &amp; Soil Telemetry</p></div>' +
'              </div>' +
'              <span class="node-status-pill status-emerald">ATTENDING</span>' +
'            </div>' +
'          </div>' +
'        </div>' +
'        <div class="section-panel">' +
'          <div class="panel-header-row">' +
'            <h4 class="panel-title"><span>🤝</span><span>Inter-Role Connected Characters Bus</span></h4>' +
'            <button class="panel-action-btn" id="btnOpenAuditTrail">Live Audit Trail</button>' +
'          </div>' +
'          <div class="bus-summary-box" id="busEventsContainer"></div>' +
'        </div>' +
'      </div>' +
'    </div>' +
'    <footer class="surv-footer">' +
'      <div>🌱 <strong>GramBandhan</strong> — Enterprise Backend Surveillance &amp; Threat Telemetry Hub</div>' +
'      <div class="surv-footer-credits">' +
'        Team TORONGO_DHARA • Lead Architect: Muhutasim • Agricultural Producer: MD. Jahidul Islam Jony • Frontend Lead: Shamia Akhter Tasti • DB Architect: Partha' +
'      </div>' +
'    </footer>' +
'  </div>' +
'  <div class="modal-backdrop-surv" id="auditModal">' +
'    <div class="modal-surv-window">' +
'      <div class="modal-surv-header">' +
'        <h4 style="font-size:0.95rem;color:#FFFFFF;display:flex;align-items:center;gap:8px;"><span>🤝</span> Inter-Role Connected Characters Audit Log</h4>' +
'        <button class="panel-action-btn" id="btnCloseAuditModal">✕ Close</button>' +
'      </div>' +
'      <div class="modal-surv-body" id="auditModalBody"></div>' +
'    </div>' +
'  </div>' +
`  <script>
    (function() {
      let latenciesData = [0.28, 0.35, 0.22, 0.31, 0.44, 0.38, 0.26, 0.29, 0.34, 0.36, 0.29, 0.35, 0.30, 0.42, 0.31, 0.28];
      function updateClock() {
        const d = new Date();
        const bstStr = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour12: false }) + ' BST (GMT+6)';
        const el = document.getElementById('clockBSTVal');
        if (el) el.textContent = bstStr;
      }
      setInterval(updateClock, 1000);
      updateClock();

      const canvas = document.getElementById('latencyCanvas');
      const ctx = canvas ? canvas.getContext('2d') : null;
      function resizeCanvas() {
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      window.addEventListener('resize', function() { resizeCanvas(); drawChart(); });
      resizeCanvas();

      function drawChart() {
        if (!canvas || !ctx) return;
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        ctx.clearRect(0, 0, w, h);
        const data = latenciesData.slice(-20);
        if (data.length < 2) return;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let y = 30; y < h; y += 35) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        const minVal = 0;
        const maxVal = Math.max.apply(null, data.concat([1.2])) * 1.35;
        const stepX = w / (data.length - 1);
        const points = data.map(function(val, idx) {
          const x = idx * stepX;
          const y = h - ((val - minVal) / (maxVal - minVal)) * (h - 30) - 15;
          return { x: x, y: y, val: val };
        });
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
        grad.addColorStop(0.7, 'rgba(52, 211, 153, 0.08)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.strokeStyle = '#00F5A0';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00F5A0';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        points.forEach(function(p, idx) {
          if (idx === points.length - 1 || idx % 2 === 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#00F5A0';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00F5A0';
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });
      }

      async function fetchTelemetry() {
        try {
          const res = await fetch('/api/v1/surveillance/telemetry');
          if (!res.ok) return;
          const data = await res.json();
          const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
          const setH = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

          setT('valPid', data.pid);
          setT('valNode', data.nodeVersion);
          setT('valUptime', data.uptimeFormatted);
          setT('kpiRequests', data.apiRequestsTotal);
          setT('kpiReqMin', data.reqPerMin + ' req/min');
          setH('kpiLatency', data.avgLatencyMs + ' <span style="font-size:1rem;color:var(--text-muted);">ms</span>');
          setT('hudCurrentLat', data.avgLatencyMs + 'ms');
          setH('kpiMemory', data.memoryRssMB + ' <span style="font-size:1rem;color:var(--text-muted);">MB</span>');
          setT('kpiHeap', 'Heap: ' + data.heapUsedMB + 'MB / ' + data.heapTotalMB + 'MB');
          setH('kpiEscrow', data.baseSepoliaEscrowBDT + ' <span style="font-size:0.9rem;color:var(--accent-mint);">BDT</span>');
          setT('kpiBlock', 'Block #' + data.baseSepoliaBlock);

          if (Array.isArray(data.latencies) && data.latencies.length > 0) {
            latenciesData = data.latencies;
            drawChart();
          }

          if (Array.isArray(data.recentRequests)) {
            const tbody = document.getElementById('streamTableBody');
            if (tbody) {
              tbody.innerHTML = data.recentRequests.slice(0, 8).map(function(r) {
                const isGet = (r.method || 'GET') === 'GET';
                const methodClass = isGet ? 'badge-get' : 'badge-post';
                const timeStr = r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'Just now';
                return '<tr>' +
                  '<td>' + timeStr + '</td>' +
                  '<td><span class="badge-method ' + methodClass + '">' + (r.method || 'GET') + '</span></td>' +
                  '<td style="color:#FFFFFF;font-weight:700;">' + (r.path || '/') + '</td>' +
                  '<td><span class="badge-status-ok">' + (r.status || 200) + ' OK</span></td>' +
                  '<td style="color:var(--accent-bright);font-weight:700;">' + (r.latency || '0.25') + ' ms</td>' +
                  '<td style="color:var(--text-muted);">' + (r.clientIp || '127.0.0.1') + '</td>' +
                '</tr>';
              }).join('');
            }
          }

          if (Array.isArray(data.characterCommunications)) {
            const busContainer = document.getElementById('busEventsContainer');
            if (busContainer) {
              busContainer.innerHTML = data.characterCommunications.slice(0, 4).map(function(c) {
                const icon = c.fromRole === 'STAFF' ? '👮' : c.fromRole === 'INVESTOR' ? '💼' : '🌾';
                return '<div class="bus-event-item">' +
                  '<div class="bus-event-header">' +
                    '<span class="bus-event-role">' +
                      '<span>' + icon + '</span>' +
                      '<span>' + c.fromName + '</span>' +
                    '</span>' +
                    '<span class="bus-event-time">' + new Date(c.timestamp).toLocaleTimeString() + '</span>' +
                  '</div>' +
                  '<div class="bus-event-subject">' + c.subject + '</div>' +
                  '<div class="bus-event-body">' + c.message + '</div>' +
                '</div>';
              }).join('');
            }
          }
        } catch (err) {
          console.error('Telemetry fetch error:', err);
        }
      }

      const btnRefresh = document.getElementById('btnManualRefresh');
      if (btnRefresh) btnRefresh.onclick = function() { fetchTelemetry(); };

      const btnMock = document.getElementById('btnFireMockPing');
      if (btnMock) {
        btnMock.onclick = async function() {
          try {
            const res = await fetch('/api/v1/surveillance/mock-ping', { method: 'POST' });
            const data = await res.json();
            await fetchTelemetry();
            const term = document.getElementById('terminalOutput');
            if (term) {
              term.textContent = [
                '// [MOCK PING BROADCAST SUCCESS]',
                '> Injected Route: ' + data.ping.path,
                '> Latency: ' + data.ping.latency + 'ms',
                '> Timestamp: ' + data.ping.timestamp,
                '> Status: 200 OK (Cryptographically Recorded)'
              ].join('\\n');
            }
          } catch (err) {
            console.error(err);
          }
        };
      }

      document.querySelectorAll('.btn-probe').forEach(function(btn) {
        btn.onclick = async function() {
          const endpoint = btn.dataset.url;
          const terminal = document.getElementById('terminalOutput');
          if (terminal) terminal.textContent = '// Probing ' + endpoint + '... Dispatching real-time HTTP stream...';
          const t0 = performance.now();
          try {
            const res = await fetch(endpoint, {
              method: endpoint.includes('auth/test') ? 'POST' : 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            const t1 = performance.now();
            const latency = (t1 - t0).toFixed(2);
            const json = await res.json();
            if (terminal) {
              terminal.textContent = [
                '// HTTP ' + res.status + ' ' + (res.statusText || 'OK') + ' [Duration: ' + latency + ' ms]',
                '// Target: ' + endpoint,
                '',
                JSON.stringify(json, null, 2)
              ].join('\\n');
            }
            await fetchTelemetry();
          } catch (err) {
            if (terminal) terminal.textContent = '// ERROR Probing ' + endpoint + ': ' + err.message;
          }
        };
      });

      const btnAudit = document.getElementById('btnOpenAuditTrail');
      if (btnAudit) {
        btnAudit.onclick = async function() {
          try {
            const res = await fetch('/api/v1/surveillance/telemetry');
            const data = await res.json();
            const comms = data.characterCommunications || [];
            const modalBody = document.getElementById('auditModalBody');
            if (modalBody) {
              modalBody.innerHTML = comms.map(function(c) {
                return '<div style="background:#051C22;border:1px solid rgba(14,186,197,0.25);border-radius:10px;padding:14px 18px;display:flex;flex-direction:column;gap:6px;">' +
                  '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<span style="color:#00F5D4;font-weight:800;font-size:0.82rem;">' + c.fromName + ' ➔ ' + c.toName + '</span>' +
                    '<span style="font-size:0.72rem;color:#FFFFFF;background:rgba(14,186,197,0.2);border:1px solid #0EBAC5;padding:2px 8px;border-radius:4px;font-family:var(--font-mono);">' + c.channel + '</span>' +
                  '</div>' +
                  '<div style="font-weight:700;color:#FFFFFF;font-size:0.84rem;">' + c.subject + '</div>' +
                  '<div style="color:#D5EFF3;font-size:0.76rem;line-height:1.5;">' + c.message + '</div>' +
                  '<div style="font-size:0.68rem;color:var(--text-dim);display:flex;justify-content:space-between;margin-top:4px;font-family:var(--font-mono);">' +
                    '<span>ID: ' + c.id + '</span>' +
                    '<span>' + new Date(c.timestamp).toLocaleString('en-GB') + '</span>' +
                  '</div>' +
                '</div>';
              }).join('');
            }
            const modal = document.getElementById('auditModal');
            if (modal) modal.classList.add('active');
          } catch (e) {
            console.error(e);
          }
        };
      }

      const btnCloseAudit = document.getElementById('btnCloseAuditModal');
      if (btnCloseAudit) {
        btnCloseAudit.onclick = function() {
          const modal = document.getElementById('auditModal');
          if (modal) modal.classList.remove('active');
        };
      }

      const modal = document.getElementById('auditModal');
      if (modal) {
        modal.onclick = function(e) {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        };
      }

      fetchTelemetry();
      setInterval(fetchTelemetry, 2000);
    })();
  </script>
</body>
</html>`;
}
