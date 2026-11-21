# Contributing to Astro Static Studio

Contributions to code, tests, and documentation are welcome. Start with the [setup instructions](README.md#run-from-source) and the [development guide](docs/DEVELOPMENT.md).

## Report a bug or propose a change

Search [GitHub Issues](https://github.com/arashashrafii/astro-static-studio/issues) for an existing discussion. For a bug report, include your platform, Studio version or commit, steps to reproduce, and what you expected to happen. Use sample data in screenshots, logs, and backups.

For changes to content formats, the theme contract, or publishing, describe the proposed behavior in an issue before starting implementation. Include how existing projects or backups would be affected.

## Submit a change

1. Fork the repository and clone your fork. Add the canonical repository as `upstream`, then create a topic branch from its current `main`.

   ```sh
   git remote add upstream https://github.com/arashashrafii/astro-static-studio.git
   git fetch upstream main
   git switch -c fix/short-description upstream/main
   ```

2. Keep the change scoped. Run the relevant [checks](docs/DEVELOPMENT.md#verification) and review your diff for local content, credentials, and incidental generated files.
3. Commit your changes and push your topic branch to your fork.

   ```sh
   git push -u origin HEAD
   ```

4. Open a pull request from your fork into `arashashrafii/astro-static-studio:main`. Describe what changed, list the checks you ran and their results, and link the relevant issue if there is one. Include screenshots for visible changes and identify any platform behavior you could not verify.

[@arashashrafii](https://github.com/arashashrafii) coordinates issues and reviews pull requests. The protected `main` branch requires a pull request and code-owner approval before merging. Push review revisions to the same topic branch.
