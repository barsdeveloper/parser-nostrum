import { test, expect } from "@playwright/test"
import P from "../src/Parsernostrum.js"

test("Test 1", async ({ page }) => {
    const p = P.seq(P.str("alpha"), P.str("beta"))
    let error = ""
    try {
        p.parse("alphaUnrelated")
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual(
        'Could not parse "alphaUnrelated"\n'
        + '\n'
        + 'Input: alphaUnrelated\n'
        + '            ^ From here (line: 1, column: 7, offset: 5)\n'
        + '\n'
        + 'Last valid parser matched:\n'
        + '    SEQ<\n'
        + '        "alpha"\n'
        + '        ^^^^^^^ Last valid parser\n'
        + '        "beta"\n'
        + '    >\n'
    )
})

test("Test 2", async ({ page }) => {
    const p = P.alt(P.str("aaalpha"), P.str("a").atLeast(4).join().chain(v => v))
    let error = ""
    try {
        p.parse("alphaUnrelated")
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual(
        'Could not parse "alphaUnrelated"\n'
        + '\n'
        + 'Input: alphaUnrelated\n'
        + '            ^ From here (line: 1, column: 7, offset: 5)\n'
        + '\n'
        + 'Last valid parser matched:\n'
        + '    SEQ<\n'
        + '        "alpha"\n'
        + '        ^^^^^^^ Last valid parser\n'
        + '        "beta"\n'
        + '    >\n'
    )
})
