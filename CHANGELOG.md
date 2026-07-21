# @wolbarg/mastra

## [1.0.0] — 2026-07-20

### Added

- Official Mastra **Processor** for Wolbarg shared semantic memory
- `createWolbargProcessor` / `wolbargProcessor` — recall on `processInput`, remember on `processOutputResult`
- Soft-fail recall/remember (never crash the agent path)
- Injection modes: `system` (append to `systemMessages`) and `message` (prepend MastraDBMessage)
- Telemetry + error hooks (`onTelemetry`, `onError`)
- Example under `examples/adapters/mastra/`
