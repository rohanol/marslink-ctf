# MarsLink CTF Frontend Architecture

```text
Scenario controls ──> in-browser simulation state ──> mission workspace
                              │                              │
                              └──> modelAdapter.ts ───────────┘
                                         │
                                         ├── no endpoint: deterministic simulator decision
                                         └── endpoint supplied: trained model decision
```

The app intentionally keeps the simulator state, attack catalog, message queue, and audit evidence in the frontend so it can be demonstrated offline. The only intended replacement is the response source inside `modelAdapter.ts`.
