<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git Flow Guidelines

This repository follows the standard **Git Flow** branching model:

## Main Branches
- **`main`**: Contains production-ready code. Direct commits to `main` are strictly prohibited.
- **`develop`**: Primary integration branch for ongoing development. All feature branches merge here after code review.

## Supporting Branches
- **Feature Branches** (`feature/<feature-name>`):
  - Created from: `develop`
  - Merged into: `develop`
  - Naming: `feature/short-description` (e.g., `feature/survey-form-validation`)
- **Release Branches** (`release/<version>`):
  - Created from: `develop`
  - Merged into: `main` and `develop`
  - Naming: `release/vX.Y.Z`
- **Hotfix Branches** (`hotfix/<issue-name>`):
  - Created from: `main`
  - Merged into: `main` and `develop`
  - Naming: `hotfix/short-description`
- **Bugfix Branches** (`bugfix/<issue-name>`):
  - Created from: `develop`
  - Merged into: `develop`
  - Naming: `bugfix/short-description`

## Commit & Pull Request Standards
- Keep commits atomic and focused.
- Use clear, descriptive commit messages (e.g., `feat(survey): add real-time form validation`).
- Always open Pull Requests targeting `develop` for features and bugfixes.

