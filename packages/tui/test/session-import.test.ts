import { expect, test, mock } from "bun:test"
import { extractDeepSeekSessionId, importAndLinkDeepSeekSession } from "../src/util/session-link"

test("extractDeepSeekSessionId handles standard and nested URLs", () => {
  expect(extractDeepSeekSessionId("https://chat.deepseek.com/a/chat/s/72d4a956-8032-45ff-9caa-e5519d34e808")).toBe(
    "72d4a956-8032-45ff-9caa-e5519d34e808",
  )
  expect(extractDeepSeekSessionId("https://chat.deepseek.com/chat/72d4a956-8032-45ff-9caa-e5519d34e808")).toBe(
    "72d4a956-8032-45ff-9caa-e5519d34e808",
  )
  expect(extractDeepSeekSessionId("72d4a956-8032-45ff-9caa-e5519d34e808")).toBe(
    "72d4a956-8032-45ff-9caa-e5519d34e808",
  )
})

test("importAndLinkDeepSeekSession fetches history, imports into server, and links bridge", async () => {
  const deepseekId = "72d4a956-8032-45ff-9caa-e5519d34e808"
  const createdSessionId = "ses_imported_123"

  const mockHistory = {
    status: "ok",
    chat_session: {
      id: deepseekId,
      title: "Test Conversation Title",
      current_message_id: 105,
    },
    messages: [
      {
        message_id: 101,
        parent_id: null,
        role: "user",
        text: "Hello from user",
        time: 1740000000000,
      },
      {
        message_id: 102,
        parent_id: 101,
        role: "assistant",
        text: "Hello from assistant",
        reasoning: "Thinking hard",
        time: 1740000001000,
      },
    ],
    total: 2,
  }

  const calls: { url: string; method?: string; body?: any }[] = []

  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = input.toString()
    const method = init?.method || "GET"
    const body = init?.body ? JSON.parse(init.body as string) : undefined
    calls.push({ url: urlStr, method, body })

    if (urlStr.includes("/v1/session/history")) {
      return new Response(JSON.stringify(mockHistory), { status: 200, headers: { "Content-Type": "application/json" } })
    }

    if (urlStr.includes("/v1/session/link")) {
      return new Response(
        JSON.stringify({
          status: "ok",
          externalSessionId: body?.externalSessionId,
          deepseekSessionId: deepseekId,
          lastResponseMessageId: 105,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    return new Response(JSON.stringify({ status: "error" }), { status: 404 })
  }) as typeof fetch

  try {
    const fakeSdk = {
      url: "http://127.0.0.1:4096",
      directory: "C:/fake/dir",
      client: {
        session: {
          create: mock(async ({ title }: { title: string }) => ({
            data: { id: createdSessionId, title },
          })),
        },
      },
      fetch: mock(async (url: string, init?: RequestInit) => {
        const body = init?.body ? JSON.parse(init.body as string) : undefined
        calls.push({ url, method: init?.method, body })
        return new Response(
          JSON.stringify({
            status: "ok",
            session: { id: body.sessionID || createdSessionId, title: body.title },
            messageCount: body.messages?.length || 0,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      }) as unknown as typeof fetch,
    }

    const result = await importAndLinkDeepSeekSession({
      url: `https://chat.deepseek.com/a/chat/s/${deepseekId}`,
      sdk: fakeSdk,
      bridgeUrl: "http://127.0.0.1:5050",
    })

    expect(result.sessionId).toBe(createdSessionId)
    expect(result.deepseekSessionId).toBe(deepseekId)
    expect(result.title).toBe("Test Conversation Title")
    expect(result.messageCount).toBe(2)
    expect(result.lastResponseMessageId).toBe(105)

    // Verify history was requested
    expect(calls.some((c) => c.url.includes(`/v1/session/history?chat_session_id=${deepseekId}`))).toBe(true)
    // Verify server import was called with messages
    expect(calls.some((c) => c.url.includes("/session/import") && c.body?.messages?.length === 2)).toBe(true)
    // Verify bridge session link was called
    expect(calls.some((c) => c.url.includes("/v1/session/link") && c.body?.externalSessionId === createdSessionId)).toBe(true)
  } finally {
    globalThis.fetch = originalFetch
  }
})
