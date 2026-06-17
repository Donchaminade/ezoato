# Git workflow

Repository: [Donchaminade/ezoato](https://github.com/Donchaminade/ezoato)

## Branches

- **master** — production (protected; no direct pushes)
- **dev** — integration branch for all feature work
- **feature/**, **fix/**, **chore/** — short-lived branches

## Daily workflow

1. Update integration: `git checkout dev && git pull origin dev`
2. Create branch: `git checkout -b feature/my-change`
3. Commit with conventional messages (`feat:`, `fix:`, etc.)
4. Push and open a PR targeting **dev**
5. After validation on dev, release by merging **dev → master** (PR recommended)

## Security

Never commit:

- `.env` (use `.env.example` only)
- `config.local.php` or other local secret overrides
- API keys, passwords, or upload directories with user data

## GitHub branch protection (recommended)

On GitHub → Settings → Branches:

- Protect **master**: require PR, no direct push, optional required checks
- Protect **dev**: require PR for consistency (optional but recommended)

`gh` CLI was not available in the setup environment; configure protection in the GitHub UI.

## Cursor rules

- Project: `.cursor/rules/git-workflow.mdc`
- Global (all projects): `~/.cursor/rules/git-workflow-enterprise.mdc`
