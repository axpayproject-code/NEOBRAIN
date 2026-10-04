# Publishing this project on GitHub

## Before the first push

1. Create a **public** repository named `elnino-impact-intelligence` under the project owner's GitHub account. Do not initialize it with a README, license, or `.gitignore`; this local repository already has those files.
2. Review `DATA_SOURCES.md` and confirm the linked reference data may be redistributed under its listed terms.
3. Confirm that `data/iloilo_city_daily.csv`, raw NASA POWER downloads, and restricted CliMap exports are absent from Git. The `.gitignore` excludes these local files.
4. Add the GitHub repository URL as `origin`, then push the current branch:

   ```bash
   git remote add origin https://github.com/OWNER/elnino-impact-intelligence.git
   git push -u origin HEAD
   ```

5. Confirm the Actions workflow passes. Add maintainers and protect the default branch with required status checks before accepting outside contributions.

The repository includes an MIT license for code, issue and pull-request templates, a Code of Conduct, a security policy, contribution instructions, and GitHub Actions checks for Python tests and the frontend build. Dataset terms remain separate from the software license.

After the first push, create one GitHub Project board and protect the default branch using the setup in [`CONTRIBUTOR_WORKFLOW.md`](CONTRIBUTOR_WORKFLOW.md). The board and issue/PR history become the shared contributor tracker.
