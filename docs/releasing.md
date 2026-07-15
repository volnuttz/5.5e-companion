# Releasing

Production deployments are created from GitHub Releases, not from every push to `main`. The release workflow verifies the static site, gives the service worker the release tag as its cache version, then deploys the artifact to GitHub Pages.

## One-time repository setup

In **Settings → Pages**, change **Build and deployment → Source** from **Deploy from a branch** to **GitHub Actions**. Keep the custom-domain/HTTPS settings as they are. This switches the existing URL to the release workflow without changing its path.

Optionally protect `main` and require the `Verify static site` check before merging.

## Release checklist

1. Merge the intended changes to `main` and wait for the `Verify static site` workflow.
2. Run `npm run verify` locally and test the DM/player flow.
3. Create a GitHub Release from the intended `main` commit with a semver tag such as `v1.2.0`. Publish it (do not leave it as a draft or prerelease).
4. Watch **Release to GitHub Pages**. Its deployment environment provides the live URL.
5. Verify the live DM dashboard, a player join link, and PWA installation/update.

Use **Run workflow** only for a controlled redeploy. Supply a cache version such as `v1.2.0-rebuild.1`; otherwise installed clients may continue using the previous cache namespace.

## Rollback

Publish a new release pointing to the last known-good commit, using a new tag (for example, `v1.1.1-rollback.1`). Do not force-move an existing release tag: clients need a distinct service-worker cache version.
