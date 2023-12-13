import { test, expect } from "@playwright/test"
import Trie from "../src/Trie.js"

test("Test 1", async ({ page }) => {
    const trie = new Trie()
    trie.insert("understate")
    trie.insert("understand")
    trie.insert("undertake")
    expect(trie.find("under")).toEqual(["understate", "understand", "undertake"])
    expect(trie.find("unders")).toEqual(["understate", "understand"])
})
