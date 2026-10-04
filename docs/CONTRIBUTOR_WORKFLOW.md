# Contributor workflow

The canonical project is one GitHub repository. Forks are temporary workspaces; accepted changes return to the canonical repository through pull requests. Do not start a separate “official” copy or merge code directly into the default branch.

## Track work

Create a GitHub Issue for each bug, feature, research question, or documentation task. Include the user need, scope, acceptance checks, and any data or partner dependency. Assign one person as the task owner; other people may help in the issue thread or review the pull request.

Use one GitHub Project board connected to the canonical repository, with these status columns:

| Status | Meaning |
|---|---|
| Triage | Report received; scope and acceptance checks need review |
| Ready | Clear, unblocked, and available to pick up |
| In progress | One owner is actively working on it |
| In review | Pull request is open and checks/review are pending |
| Done | Pull request is merged or the issue is otherwise resolved |

Track each item with an assignee, area label (`frontend`, `api`, `climate-data`, `docs`, `research`, or `governance`), priority, and linked pull request. Use GitHub Projects' built-in workflow to move closed issues and merged pull requests to **Done**.

## Make a contribution

1. Find a **Ready** issue and comment that you plan to take it. A maintainer assigns the issue so two people do not unknowingly build the same change.
2. Fork the canonical repository if you do not have write access. Create a focused branch from the canonical default branch, for example `feat/42-monthly-rainfall-chart` or `docs/51-data-import-guide`.
3. Make the change and run the checks in [`CONTRIBUTING.md`](../CONTRIBUTING.md). Keep private or restricted climate data, credentials, and personal information out of commits.
4. Open a pull request **against the canonical repository's default branch**. Link the issue with `Closes #42`, summarize the change, list tests, and note any data or scientific assumptions.
5. Wait for the automated checks and a maintainer review. Address review comments on the same branch. A maintainer merges the pull request; the linked issue and board item are then marked Done.

Contributors with repository write access may branch directly from the default branch; external contributors use forks. Both routes create a pull request into the same canonical default branch.

## Maintainer setup after publishing

- Pin the canonical repository URL in the organization/team workspace and link it from project announcements.
- Create one GitHub Project board and add the repository's issues and pull requests. Add saved views for **Ready**, **In progress**, **In review**, and **By area**.
- Protect the default branch: require pull requests, require the Python and frontend Actions checks, require at least one maintainer approval, and dismiss stale approvals when new commits are pushed.
- Give write access only to maintainers. Contributors can use forks and pull requests; do not share one account or personal access token.
- Review the board weekly. Track open issues, owned work, review queue, merged changes, and blocked partner/data dependencies. Use these to remove blockers and welcome contributors rather than rank people by commit count.

GitHub Projects can display issues and pull requests in board, table, and roadmap views, with fields and built-in workflows. Branch protection rules can require pull requests, approvals, and passing checks before merge. See [GitHub Projects best practices](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects) and [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches).
