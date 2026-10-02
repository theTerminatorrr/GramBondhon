---
name: firecrawl
description: >-
  Research third-party libraries, live API documentation, technical specs,
  and web references using search and deep web scraping.
  Use when exploring new SDKs, verifying API schemas, or researching external integrations.
---

# Firecrawl: External Research & Documentation Crawling

This skill automates live web research, API documentation scraping, and technical reference retrieval.

## When to Use
- Researching up-to-date documentation for libraries (e.g., Ethers.js, Viem, Vite, Chart.js, Leaflet, Tailwind).
- Checking official specifications (e.g., ERC standards, OpenZeppelin contracts, UN SDG definitions).
- Validating third-party API payloads and webhook configurations.

## Procedure

1. **Search Web Sources**:
   - Use `search_web` with targeted keywords (e.g., "Chart.js 4 streaming line chart documentation", "Leaflet GeoJSON polygon styling").
2. **Extract & Parse Markdown**:
   - Use `read_url_content` to fetch the clean markdown text from relevant documentation URLs without executing heavy client-side scripts.
3. **Synthesize Findings**:
   - Extract exact method signatures, parameters, and code examples.
   - Cross-reference with the active codebase to avoid version incompatibilities.
