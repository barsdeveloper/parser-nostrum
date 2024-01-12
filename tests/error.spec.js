import { test, expect } from "@playwright/test"
import JsonGrammar from "../src/grammars/JsonGrammar.js"
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
        + 'Input: "alphaUnrelated"\n'
        + '             ^ From here (line: 1, column: 6, offset: 5)\n'
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
    const p = P.alt(
        P.seq(P.str("aaa"), P.str("alpha")),
        P.seq(P.str("aaaa"), P.str("bc")),
        P.seq(P.str("aaaaa"), P.str("xyz")),
        P.seq(P.str("aa"), P.str("b")),
    )
    let error = ""
    try {
        p.parse("aaaa")
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual(
        'Could not parse "aaaa"\n'
        + '\n'
        + 'Input: "aaaa"\n'
        + '            ^ From here (line: 1, column: 5, offset: 4), parsing reached end of string\n'
        + '\n'
        + 'Last valid parser matched:\n'
        + '    ALT<\n'
        + '        SEQ<\n'
        + '            "aaa"\n'
        + '            "alpha"\n'
        + '        >\n'
        + '        | SEQ<\n'
        + '            "aaaa"\n'
        + '            ^^^^^^ Last valid parser\n'
        + '            "bc"\n'
        + '        >\n'
        + '        | SEQ<\n'
        + '            "aaaaa"\n'
        + '            "xyz"\n'
        + '        >\n'
        + '        | SEQ<\n'
        + '            "aa"\n'
        + '            b\n'
        + '        >\n'
        + '    >\n'
    )
})

test("Test 3", async ({ page }) => {
    const p = P.alt(
        P.seq(P.str("a"), P.str(":"), P.str("1")),
        P.seq(P.str("b"), P.str(":"), P.str("2")),
    )
    let error = ""
    try {
        p.parse("aaaa")
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual(
        ``
    )
})

test("Test JsonGrammar", async ({ page }) => {
    let error = ""
    try {
        JsonGrammar.json.parse(`
            {
                "glossary": {
                    "title": "example glossary",
                    "GlossDiv": {
                        "title": "S",
                        "GlossList": {
                            "GlossEntry": {
                                "ID": "SGML",
                                "SortAs": "SGML",
                                "GlossTerm": "Standard Generalized Markup Language",
                                "Acronym": "SGML",
                                "Abbrev": [ISO 8879:1986",
                                "GlossDef": {
                                    "para": "A meta-markup language, used to create markup languages such as DocBook.",
                                    "GlossSeeAlso": ["GML", "XML"]
                                },
                                "GlossSee": "markup"
                            }
                        }
                    }
                }
            }
        `.trim())
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error). toEqual(

    )
})
