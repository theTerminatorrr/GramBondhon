---
name: coderabbit
description: >-
  Automated code review, security audit, and quality assurance.
  Audit git diffs for vulnerabilities, memory leaks, unnecessary re-renders, and code quality before completing tasks.
---

# CodeRabbit: Code Review & Security Audit

This skill performs rigorous static analysis, security vetting, and code quality audits on changes before they are finalized.

## When to Use
- **Mandatory before completing any task or pull request**.
- Inspecting git diffs for security vulnerabilities (OWASP Top 10, XSS, CSRF, Reentrancy in smart contracts).
- Identifying memory leaks, unclosed listeners, and inefficient loops.

## Audit Checklist

1. **Security & Input Sanitization**:
   - Are user inputs sanitized before injection into the DOM (`innerHTML` vs `textContent`)?
   - Are API endpoints protected against unauthorized access, CORS misuse, and injection?
   - Are smart contracts protected against reentrancy, integer overflow, and unauthorized administrative calls?
2. **Resource Management**:
   - Are `setInterval`, `setTimeout`, and event listeners properly cleaned up when elements or pages unmount?
   - Are memory-heavy canvas contexts, WebSocket connections, or SSE streams appropriately terminated?
3. **Diff Inspection**:
   - Run `git diff` or review modified lines.
   - Verify that no debug artifacts, private keys, or console logs leak into production code.
