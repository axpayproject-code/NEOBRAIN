# GitHub repository

The canonical public repository for this project is [`axpayproject-code/NEOBRAIN`](https://github.com/axpayproject-code/NEOBRAIN). Its default branch is currently named `Neobrain`. Keep contributions in this repository; do not create a second official copy.

## Clone the project

```bash
git clone --branch Neobrain https://github.com/axpayproject-code/NEOBRAIN.git
cd NEOBRAIN
```

The repository contains the El Niño Impact Intelligence project on its default branch. The former NEOBRAIN source snapshot is preserved on `backup/neobrain-before-elnino-20261004` for recovery.

## Maintainer setup

Create one GitHub Project board connected to this repository and follow [`CONTRIBUTOR_WORKFLOW.md`](CONTRIBUTOR_WORKFLOW.md) to manage issues, owners, reviews, and status. Protect the default branch so changes require pull requests, passing Python and frontend checks, and maintainer review. Add maintainers with individual GitHub accounts; do not share a personal access token.

The repository contains an MIT license for code, contribution and security guidance, issue and pull-request templates, Dependabot updates, and GitHub Actions checks. Dataset terms remain separate from the software license; review `DATA_SOURCES.md` before redistributing data.
