# DeepCode CLI

> 🟦 `deepcode-cli` · fork independente do OpenCode

Este repositório mantém uma versão personalizada do [OpenCode](https://github.com/anomalyco/opencode), agente de programação com IA de código aberto. O projeto original e seus colaboradores são responsáveis pela base do código. Este fork é mantido em `Vitorvzp/deepcode-cli` e não é um produto oficial nem afiliado à equipe OpenCode.

A [licença MIT original](LICENSE), com o aviso de copyright do OpenCode, permanece aplicável. Os nomes de pacotes, variáveis `OPENCODE_*` e partes da documentação ainda usam a identidade upstream.

## Personalizações presentes neste checkout

Estas funções foram identificadas no código da TUI; a lista descreve este checkout, sem afirmar exclusividade em relação às versões atuais do upstream:

| Recurso | Fonte |
| --- | --- |
| Identidade `deepcode` no CLI e alias de executável | [`packages/opencode/package.json`](packages/opencode/package.json), [`src/index.ts`](packages/opencode/src/index.ts) |
| Importação e vínculo de conversa DeepSeek com um bridge | [`session-link.ts`](packages/tui/src/util/session-link.ts), comando `/session` em [`app.tsx`](packages/tui/src/app.tsx) |
| Carregamento de texto de uma URL e envio como prompt à sessão | [`session-inject.ts`](packages/tui/src/util/session-inject.ts), comando `/inject` em [`app.tsx`](packages/tui/src/app.tsx) |
| Apresentação de retomada de sessão com o nome DeepCode | [`presentation.ts`](packages/tui/src/util/presentation.ts) |

A integração de sessões depende de um bridge separado; o helper usa `http://127.0.0.1:5050` como padrão. Nenhum bridge ou conta externa é configurado automaticamente por estas instruções. O comando `/inject` baixa conteúdo externo e o envia ao modelo selecionado; revise a URL e o texto antes de usá-lo. A compatibilidade e a disponibilidade dessas integrações não foram validadas em serviços reais nesta revisão documental.

## Trabalhar neste fork

Use o código deste repositório para desenvolver as personalizações. O gerenciador declarado em `package.json` é `bun@1.3.14` e a branch padrão é `dev`.

```sh
git clone https://github.com/Vitorvzp/deepcode-cli.git
cd deepcode-cli
bun install --frozen-lockfile
bun run dev
```

O script `dev` inicia o CLI em `packages/opencode`. Outros scripts de interface incluem `dev:web` e `dev:desktop`; consulte [`package.json`](package.json) e os respectivos pacotes para requisitos específicos.

O script de compilação está em [`script/build.ts`](packages/opencode/script/build.ts) e aceita `--single` para a plataforma atual. Ele ainda usa nomes `opencode` nos caminhos de saída e possui uma etapa condicional de publicação de releases. Revise o script e a configuração de release antes de empacotar uma distribuição.

Os testes devem ser executados dentro do pacote correspondente, conforme [`AGENTS.md`](AGENTS.md). Exemplos de verificações disponíveis, após instalar as dependências:

```sh
cd packages/tui
bun test test/session-inject.test.ts
bun typecheck
```

Não execute o script de testes da raiz: ele contém uma guarda que encerra com erro.

## Documentação herdada do OpenCode

O conteúdo abaixo foi preservado do upstream como referência. Os instaladores, pacotes publicados, releases, badges e canais de comunidade abaixo pertencem ao **OpenCode original**; não demonstram a compilação nem instalam as personalizações deste fork. A [tradução brasileira herdada](README.br.md) também descreve o upstream. Para desenvolvimento do DeepCode, use as instruções acima.

---

<p align="center">
  <a href="https://opencode.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="OpenCode logo">
    </picture>
  </a>
</p>
<p align="center">The open source AI coding agent.</p>
<p align="center">
  <a href="https://opencode.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/opencode-ai"><img alt="npm" src="https://img.shields.io/npm/v/opencode-ai?style=flat-square" /></a>
  <a href="https://github.com/anomalyco/opencode/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/anomalyco/opencode/publish.yml?style=flat-square&branch=dev" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![OpenCode Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://opencode.ai)

---

### Installation

```bash
# YOLO
curl -fsSL https://opencode.ai/install | bash

# Package managers
npm i -g opencode-ai@latest        # or bun/pnpm/yarn
scoop install opencode             # Windows
choco install opencode             # Windows
brew install anomalyco/tap/opencode # macOS and Linux (recommended, always up to date)
brew install opencode              # macOS and Linux (official brew formula, updated less)
sudo pacman -S opencode            # Arch Linux (Stable)
paru -S opencode-bin               # Arch Linux (Latest from AUR)
mise use -g opencode               # Any OS
nix run nixpkgs#opencode           # or github:anomalyco/opencode for latest dev branch
```

> [!TIP]
> Remove versions older than 0.1.x before installing.

### Desktop App (BETA)

OpenCode is also available as a desktop application. Download directly from the [releases page](https://github.com/anomalyco/opencode/releases) or [opencode.ai/download](https://opencode.ai/download).

| Platform              | Download                           |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `opencode-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `opencode-desktop-mac-x64.dmg`     |
| Windows               | `opencode-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm`, or `.AppImage`     |

```bash
# macOS (Homebrew)
brew install --cask opencode-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/opencode-desktop
```

#### Installation Directory

The install script respects the following priority order for the installation path:

1. `$OPENCODE_INSTALL_DIR` - Custom installation directory
2. `$XDG_BIN_DIR` - XDG Base Directory Specification compliant path
3. `$HOME/bin` - Standard user binary directory (if it exists or can be created)
4. `$HOME/.opencode/bin` - Default fallback

```bash
# Examples
OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://opencode.ai/install | bash
```

### Agents

OpenCode includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about [agents](https://opencode.ai/docs/agents).

### Documentation

For more info on how to configure OpenCode, [**head over to our docs**](https://opencode.ai/docs).

### Contributing

If you're interested in contributing to OpenCode, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Building on OpenCode

If you are working on a project that's related to OpenCode and is using "opencode" as part of its name, for example "opencode-dashboard" or "opencode-mobile", please add a note to your README to clarify that it is not built by the OpenCode team and is not affiliated with us in any way.

---

**Join our community** [Discord](https://discord.gg/opencode) | [X.com](https://x.com/opencode)
