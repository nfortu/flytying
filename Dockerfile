FROM node:20-bookworm-slim

# Basic tools a real project usually needs (git for version control,
# curl/ca-certificates for network calls, ripgrep speeds up Claude's search)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    ripgrep \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

    # GitHub CLI (gh) — not in Debian's default repos, so add GitHub's apt source first
RUN mkdir -p -m 755 /etc/apt/keyrings \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends gh \
    && rm -rf /var/lib/apt/lists/*

# Install the Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /workspace

# Drop into an interactive Claude Code session by default
CMD ["claude"]