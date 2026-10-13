# 07. MCP Server

## Scope Decision

No MCP server is required for the Thikana application runtime in v1.

The product does not require an external service that needs an MCP interface.

## Why

Thikana's academic functionality can be implemented directly through:

- React
- Laravel
- MySQL
- Leaflet/OpenStreetMap-compatible map data
- Render
- Railway

Adding an MCP server would introduce complexity without satisfying a stated product requirement.

## If MCP Becomes Necessary

Before adding an MCP server:

1. Check for an official or well-maintained existing server.
2. Identify the source.
3. Confirm the exact jobs-to-be-done.
4. Add only required tools.
5. Store secrets in environment variables.
6. Define typed inputs and outputs.
7. Define authentication and error handling.
8. Verify one end-to-end tool call.
9. Document each tool.

## Non-goal

Do not add MCP merely because the development methodology contains an MCP prompt.

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
