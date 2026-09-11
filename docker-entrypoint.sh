#!/usr/bin/env bash
# Configure git at container startup from runtime env vars.
# Keeping this out of the image means the GH_TOKEN never lands in an
# image layer, and identity/token can change without a rebuild.
set -e

if [ -n "${GIT_USER_NAME}" ]; then
  git config --global user.name "${GIT_USER_NAME}"
fi

if [ -n "${GIT_USER_EMAIL}" ]; then
  git config --global user.email "${GIT_USER_EMAIL}"
fi

# Authenticate HTTPS git operations with a GitHub token when provided.
if [ -n "${GH_TOKEN}" ]; then
  git config --global \
    url."https://${GH_USER}:${GH_TOKEN}@github.com/".insteadOf "https://github.com/"
fi

exec "$@"
