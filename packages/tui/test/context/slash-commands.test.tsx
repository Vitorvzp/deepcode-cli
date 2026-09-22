/** @jsxImportSource @opentui/solid */
import { expect, test } from "bun:test"
import { testRender, useRenderer } from "@opentui/solid"
import { createDefaultOpenTuiKeymap } from "@opentui/keymap/opentui"
import { nextThinkingMode, type ThinkingMode } from "../../src/context/thinking"
import { extractDeepSeekSessionId } from "../../src/util/session-link"

test("slash commands include reasoning, searching, thinking, and session", async () => {
  let slashesList: { display: string; aliases?: string[]; name: string }[] = []
  let reasoningEnabled = false
  let searchEnabled = false
  let thinkingMode: ThinkingMode = "hide"
  let sessionLinked = ""
  let keymapRef: any

  function Harness() {
    const renderer = useRenderer()
    const keymap = createDefaultOpenTuiKeymap(renderer)
    keymapRef = keymap

    const commands = [
      {
        name: "session.toggle.reasoning",
        title: "Force reasoning for this session",
        category: "Session",
        namespace: "palette" as const,
        slashName: "reasoning",
        slashAliases: ["toggle-reasoning"],
        run: () => {
          reasoningEnabled = !reasoningEnabled
        },
      },
      {
        name: "session.toggle.searching",
        title: "Enable native search for this session",
        category: "Session",
        namespace: "palette" as const,
        slashName: "searching",
        slashAliases: ["toggle-searching"],
        run: () => {
          searchEnabled = !searchEnabled
        },
      },
      {
        name: "session.toggle.thinking",
        title: "Expand thinking",
        category: "Session",
        namespace: "palette" as const,
        slashName: "thinking",
        slashAliases: ["toggle-thinking"],
        run: () => {
          thinkingMode = nextThinkingMode(thinkingMode)
        },
      },
      {
        name: "session.link",
        title: "Link DeepSeek chat URL to bridge",
        category: "Session",
        namespace: "palette" as const,
        slashName: "session",
        slashAliases: ["link-session"],
        run: () => {
          sessionLinked = "linked"
        },
      },
    ]

    keymap.registerLayer({ commands })

    const entries = keymap.getCommandEntries({
      visibility: "reachable",
      namespace: "palette",
    })

    slashesList = entries.flatMap((entry) => {
      const slashName =
        "slashName" in entry.command && typeof entry.command.slashName === "string" ? entry.command.slashName : undefined
      if (!slashName) return []
      const slashAliases =
        "slashAliases" in entry.command && Array.isArray(entry.command.slashAliases)
          ? (entry.command.slashAliases as string[])
          : undefined
      return {
        display: `/${slashName}`,
        aliases: slashAliases?.map((a) => `/${a}`),
        name: entry.command.name,
      }
    })

    return <box />
  }

  const app = await testRender(() => <Harness />, { kittyKeyboard: true })
  try {
    const reasoningSlash = slashesList.find((s) => s.display === "/reasoning")
    expect(reasoningSlash).toBeDefined()
    expect(reasoningSlash?.aliases).toContain("/toggle-reasoning")

    const searchingSlash = slashesList.find((s) => s.display === "/searching")
    expect(searchingSlash).toBeDefined()
    expect(searchingSlash?.aliases).toContain("/toggle-searching")

    const thinkingSlash = slashesList.find((s) => s.display === "/thinking")
    expect(thinkingSlash).toBeDefined()
    expect(thinkingSlash?.aliases).toContain("/toggle-thinking")

    const sessionSlash = slashesList.find((s) => s.display === "/session")
    expect(sessionSlash).toBeDefined()
    expect(sessionSlash?.aliases).toContain("/link-session")

    keymapRef.dispatchCommand("session.toggle.reasoning")
    expect(reasoningEnabled).toBe(true)

    keymapRef.dispatchCommand("session.toggle.searching")
    expect(searchEnabled).toBe(true)

    keymapRef.dispatchCommand("session.toggle.thinking")
    expect(thinkingMode as string).toBe("show")

    keymapRef.dispatchCommand("session.link")
    expect(sessionLinked).toBe("linked")

    // Test autocomplete fuzzysort matching
    const fuzzysort = (await import("fuzzysort")).default
    const testOptions = slashesList.map((s) => ({
      display: s.display,
      description: s.name,
      aliases: s.aliases,
    }))

    const matchReasoning = fuzzysort.go("reasoning", testOptions, {
      keys: [(obj) => obj.display, "description", (obj) => obj.aliases?.join(" ") ?? ""],
    })
    expect(matchReasoning.length).toBeGreaterThan(0)
    expect(matchReasoning[0].obj.display).toBe("/reasoning")

    const matchSearching = fuzzysort.go("searching", testOptions, {
      keys: [(obj) => obj.display, "description", (obj) => obj.aliases?.join(" ") ?? ""],
    })
    expect(matchSearching.length).toBeGreaterThan(0)
    expect(matchSearching[0].obj.display).toBe("/searching")

    const matchThinking = fuzzysort.go("thinking", testOptions, {
      keys: [(obj) => obj.display, "description", (obj) => obj.aliases?.join(" ") ?? ""],
    })
    expect(matchThinking.length).toBeGreaterThan(0)
    expect(matchThinking[0].obj.display).toBe("/thinking")

    const matchSession = fuzzysort.go("session", testOptions, {
      keys: [(obj) => obj.display, "description", (obj) => obj.aliases?.join(" ") ?? ""],
    })
    expect(matchSession.length).toBeGreaterThan(0)
    expect(matchSession[0].obj.display).toBe("/session")
  } finally {
    app.renderer.destroy()
  }
})

test("extractDeepSeekSessionId parses diverse URL shapes and IDs", () => {
  // Web chat URL format 1: /a/chat/s/<uuid>
  expect(extractDeepSeekSessionId("https://chat.deepseek.com/a/chat/s/3db2f414-e86a-4ee1-a584-758bca096dd9")).toBe(
    "3db2f414-e86a-4ee1-a584-758bca096dd9",
  )
  // Web chat URL format 2: /chat/s/<uuid>
  expect(extractDeepSeekSessionId("https://chat.deepseek.com/chat/s/3db2f414-e86a-4ee1-a584-758bca096dd9")).toBe(
    "3db2f414-e86a-4ee1-a584-758bca096dd9",
  )
  // Web chat URL format 3: with trailing query params
  expect(
    extractDeepSeekSessionId("https://chat.deepseek.com/a/chat/s/3db2f414-e86a-4ee1-a584-758bca096dd9?from=sidebar#top"),
  ).toBe("3db2f414-e86a-4ee1-a584-758bca096dd9")
  // Quoted string
  expect(extractDeepSeekSessionId('"https://chat.deepseek.com/a/chat/s/3db2f414-e86a-4ee1-a584-758bca096dd9"')).toBe(
    "3db2f414-e86a-4ee1-a584-758bca096dd9",
  )
  // Bare UUID
  expect(extractDeepSeekSessionId("3db2f414-e86a-4ee1-a584-758bca096dd9")).toBe(
    "3db2f414-e86a-4ee1-a584-758bca096dd9",
  )
})
