# Genesis Protocol - Coding Standards

## TypeScript Best Practices

### Type Safety
- Use TypeScript strict mode
- Avoid `any` type - use proper typing or `unknown`
- Define interfaces for all data structures
- Use type guards for runtime type checking

### Naming Conventions
- **Classes/Interfaces**: PascalCase (`VoxelGrid`, `CARule`)
- **Functions/Methods**: camelCase (`countNeighbors`, `updateChunk`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_CHUNK_SIZE`, `DEFAULT_RULES`)
- **Files**: PascalCase for classes, camelCase for utilities

### Code Organization
- One class per file
- Group related functions in modules
- Keep functions small and focused (< 50 lines preferred)
- Use meaningful variable names

---

## Project Structure

```
src/
├── core/       # CA engine, voxel data structures
├── rendering/  # Three.js rendering, shaders
├── game/       # Game logic, player, progression
├── physics/    # Collision, movement
├── ui/         # HUD, inventory, menus
└── workers/    # Web Workers for parallel computation
```

---

## Testing Standards

### Test Coverage
- Write unit tests for all core logic
- Test edge cases and error conditions
- Target >80% coverage for core systems

### Test Organization
- Mirror source file structure in `tests/`
- Name test files `*.test.ts`
- Use descriptive test names

### Test Principles
- Tests should be deterministic
- Each test should be independent
- Mock external dependencies
- Test behavior, not implementation

---

## Performance Guidelines

### Memory Management
- Reuse objects where possible (object pooling)
- Use TypedArrays for large data (Uint8Array for voxels)
- Dispose Three.js objects properly

### Optimization Priorities
1. Greedy meshing for voxel rendering
2. Dirty region tracking for CA updates
3. Web Workers for parallel computation
4. Frustum/occlusion culling

---

## Code Quality

### ESLint
- Follow project ESLint configuration
- No disabled rules without justification

### Documentation
- Document public APIs with JSDoc
- Explain complex algorithms with comments
- Keep README and docs up-to-date

### Version Control
- Write clear commit messages
- Keep commits focused and atomic
- Reference issues in commits when applicable

---

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [AGENTS.md](../AGENTS.md) - Development guidelines
