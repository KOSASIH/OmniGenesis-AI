# Contributing to OmniGenesis AI

Thank you for your interest in contributing to OmniGenesis AI!

## Development Setup

```bash
git clone https://github.com/KOSASIH/OmniGenesis-AI.git
cd OmniGenesis-AI
npm install
cd agents && pip install -r requirements.txt && cd ..
cd backend && pip install -r requirements.txt && cd ..
cp .env.example .env
```

## Branch Naming

- `feat/your-feature` — New features
- `fix/your-fix` — Bug fixes
- `docs/your-docs` — Documentation
- `refactor/your-refactor` — Code refactoring

## Smart Contract Contributions

1. Write the contract in `contracts/`
2. Write tests in `test/`
3. Run `npx hardhat test`
4. Run `npx solhint 'contracts/**/*.sol'`
5. Submit PR

## Agent Framework Contributions

1. Inherit from `BaseAgent` in `agents/core/base_agent.py`
2. Implement `initialize()`, `run_cycle()`, and task handlers
3. Write tests in `agents/tests/`
4. Run `pytest agents/tests/`

## Code Style

- Solidity: follow OpenZeppelin style, NatSpec docs on all public functions
- Python: Black formatter, type hints, docstrings
- TypeScript: Prettier, strict mode

## Commit Convention

```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: improve code structure
test: add or update tests
chore: maintenance tasks
```

## Pull Request Checklist

- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] CHANGELOG updated

## Code of Conduct

Be excellent to each other. 🚀
