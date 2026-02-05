# Genesis Protocol - Development Guidelines

## Common Sense Rules

### Testing
- **Solve tests for real** - Fix the code to pass tests, don't modify tests to pass
- Tests are the source of truth for expected behavior
- Write new tests for new features before implementing them

### Communication
- **When something is ambiguous, ask the human** - Don't assume or guess
- Clarify requirements before making significant changes
- Document decisions and trade-offs

### Documentation
- **Don't duplicate** - Reference [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for technical details
- Keep documentation concise and up-to-date
- See [CODING_STANDARDS.md](./docs/CODING_STANDARDS.md) for best practices

---

## Game Agents Overview

For technical architecture details, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

### Agent Types

| Type | Examples | Behavior |
|------|----------|----------|
| **Player (Navigator)** | Human-controlled avatar | Exploration, resource gathering, time control |
| **CA Patterns** | Gliders, Oscillators, Still Life | Emergent autonomous behavior from CA rules |
| **Environmental** | Corruption, Temporal Storms | World hazards and events |
| **Automated** | Harvesters, Stabilizers | Player-built autonomous systems |

### Pattern Categories

- **Still Life** - Stable patterns (Block, Beehive) - safe zones
- **Oscillators** - Repeating patterns (Blinker, Pulsar) - defense
- **Spaceships** - Moving patterns (Glider, LWSS) - threats/tools
- **Guns** - Pattern generators (Gosper Gun) - offense/defense

### Agent Interactions

| Interaction | Result |
|-------------|--------|
| Player + Glider | Damage/collision |
| Player + Still Life | Safe zone/rest |
| Corruption + Pattern | Destruction |
| Gun + Empty space | Pattern generation |

---

## Related Documentation

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Technical implementation details
- [CODING_STANDARDS.md](./docs/CODING_STANDARDS.md) - Code style and best practices
