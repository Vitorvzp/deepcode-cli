import { describe, expect, test, mock } from "bun:test"
import { DEFAULT_INJECT_URL, fetchRawPrompt } from "../src/util/session-inject"

describe("session-inject", () => {
  test("uses DEFAULT_INJECT_URL when no URL is provided", async () => {
    let requestedUrl = ""
    const mockFetch = mock(async (url: string | URL | Request) => {
      requestedUrl = String(url)
      return new Response("Simulated prompt payload", { status: 200 })
    })

    const prompt = await fetchRawPrompt(undefined, mockFetch as unknown as typeof fetch)
    expect(requestedUrl).toBe(DEFAULT_INJECT_URL)
    expect(prompt).toBe("Simulated prompt payload")
  })

  test("uses custom URL when provided", async () => {
    let requestedUrl = ""
    const custom = "https://example.com/custom-prompt.md"
    const mockFetch = mock(async (url: string | URL | Request) => {
      requestedUrl = String(url)
      return new Response("Custom prompt payload", { status: 200 })
    })

    const prompt = await fetchRawPrompt(custom, mockFetch as unknown as typeof fetch)
    expect(requestedUrl).toBe(custom)
    expect(prompt).toBe("Custom prompt payload")
  })

  test("throws error when response is not ok", async () => {
    const mockFetch = mock(async () => {
      return new Response("Not found", { status: 404, statusText: "Not Found" })
    })

    await expect(fetchRawPrompt("https://example.com/fail", mockFetch as unknown as typeof fetch)).rejects.toThrow(
      "Falha HTTP ao baixar prompt (404 Not Found)",
    )
  })

  test("throws error when response is empty", async () => {
    const mockFetch = mock(async () => {
      return new Response("   ", { status: 200 })
    })

    await expect(fetchRawPrompt("https://example.com/empty", mockFetch as unknown as typeof fetch)).rejects.toThrow(
      "O prompt retornado da URL está vazio.",
    )
  })
})
