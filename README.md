# env-vault

> CLI tool to securely manage and sync environment variables across teams using encrypted vaults

## Installation

```bash
npm install -g env-vault
```

## Usage

Initialize a new vault in your project:

```bash
env-vault init
```

Add and encrypt environment variables:

```bash
env-vault set API_KEY=my-secret-key DATABASE_URL=postgres://...
```

Pull the latest variables from the shared vault:

```bash
env-vault pull --env production
```

Push local changes to sync with your team:

```bash
env-vault push --env staging
```

Export variables to a `.env` file:

```bash
env-vault export > .env
```

List all stored variable keys (without revealing values):

```bash
env-vault list --env production
```

## How It Works

env-vault encrypts your environment variables using AES-256 and stores them in a versioned vault. Team members authenticate with their personal keys, ensuring secrets are never stored in plaintext or committed to source control.

## Requirements

- Node.js >= 16
- npm or yarn

## License

[MIT](./LICENSE)
