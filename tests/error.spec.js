import { expect, test } from "@playwright/test"
import P from "../src/Parsernostrum.js"
import JsonGrammar from "../src/grammars/JsonGrammar.js"
import MathGrammar from "../src/grammars/MathGrammar.js"

test("Test 1", async ({ page }) => {
    const p = P.seq(P.str("alpha"), P.str("beta"))
    let error = ""
    try {
        p.parse("alphaUnrelated")
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual([
        String.raw`Could not parse: alphaUnrelated`,
        String.raw``,
        String.raw`Input: alphaUnrelated`,
        String.raw`            ^ From here (line: 1, column: 6, offset: 5)`,
        String.raw``,
        String.raw`Last valid parser matched:`,
        String.raw`    SEQ<`,
        String.raw`        ┌─[ Last valid parser ]─┐`,
        String.raw`        | "alpha"               |`,
        String.raw`        └───────────────────────┘`,
        String.raw`        "beta"`,
        String.raw`    >`,
        String.raw``,
    ].join("\n"))
})

test("Test 1 - no parser print", async ({ page }) => {
    const p = P.seq(P.str("alpha"), P.str("beta"))
    let error = ""
    try {
        p.parse("alphaUnrelated", false)
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual([
        String.raw`Could not parse: alphaUnrelated`,
        String.raw``,
        String.raw`Input: alphaUnrelated`,
        String.raw`            ^ From here (line: 1, column: 6, offset: 5)`,
        String.raw``,
    ].join("\n"))
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
    expect(error).toEqual([
        String.raw`Could not parse: aaaa`,
        String.raw``,
        String.raw`Input: aaaa`,
        String.raw`           ^ From here (line: 1, column: 5, offset: 4), end of string`,
        String.raw``,
        String.raw`Last valid parser matched:`,
        String.raw`    ALT<`,
        String.raw`        SEQ<`,
        String.raw`            "aaa"`,
        String.raw`            "alpha"`,
        String.raw`        >`,
        String.raw`        | SEQ<`,
        String.raw`              ┌─[ Last valid parser ]─┐`,
        String.raw`              | "aaaa"                |`,
        String.raw`              └───────────────────────┘`,
        String.raw`              "bc"`,
        String.raw`          >`,
        String.raw`        | SEQ<`,
        String.raw`              "aaaaa"`,
        String.raw`              "xyz"`,
        String.raw`          >`,
        String.raw`        | SEQ<`,
        String.raw`              "aa"`,
        String.raw`              "b"`,
        String.raw`          >`,
        String.raw`    >`,
        String.raw``,
    ].join("\n"))
})

test("Test 2 - noparser print", async ({ page }) => {
    const p = P.alt(
        P.seq(P.str("aaa"), P.str("alpha")),
        P.seq(P.str("aaaa"), P.str("bc")),
        P.seq(P.str("aaaaa"), P.str("xyz")),
        P.seq(P.str("aa"), P.str("b")),
    )
    let error = ""
    try {
        p.parse("aaaa", false)
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual([
        String.raw`Could not parse: aaaa`,
        String.raw``,
        String.raw`Input: aaaa`,
        String.raw`           ^ From here (line: 1, column: 5, offset: 4), end of string`,
        String.raw``,
    ].join("\n"))
})

test("Test JsonGrammar 1", async ({ page }) => {
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
    expect(error).toEqual([
        String.raw`Could not parse: { ... "glossary": { ... "title": "example glossary", ... "Gl`,
        String.raw``,
        String.raw`Input: ..."Abbrev": [ISO 8879:1986", ... "GlossDef": { ... "para": "A ...`,
        String.raw`                     ^ From here (line: 12, column: 44, offset: 511)`,
        String.raw``,
        String.raw`Last valid parser matched:`,
        String.raw`    ┌─[ Json ]─────────────────────────────────────────────────────────────────────────────┐`,
        String.raw`    | ALT<                                                                                 |`,
        String.raw`    |     P.doubleQuotedString                                                             |`,
        String.raw`    |     | P.numberExponential                                                            |`,
        String.raw`    |     | ┌─[ Object ]─────────────────────────────────────────────────────────────────┐ |`,
        String.raw`    |       | SEQ<                                                                       | |`,
        String.raw`    |       |     /\{\s*/                                                                | |`,
        String.raw`    |       |     SEQ<                                                                   | |`,
        String.raw`    |       |         SEQ<                                                               | |`,
        String.raw`    |       |             P.doubleQuotedString                                           | |`,
        String.raw`    |       |             /\s*:\s*/                                                      | |`,
        String.raw`    |       |             ┌─[ Json ]─┐                                                   | |`,
        String.raw`    |       |             | <...>    |                                                   | |`,
        String.raw`    |       |             └──────────┘                                                   | |`,
        String.raw`    |       |         > -> map<(...) => { ... }>                                         | |`,
        String.raw`    |       |         SEQ<                                                               | |`,
        String.raw`    |       |             /\s*,\s*/                                                      | |`,
        String.raw`    |       |             SEQ<                                                           | |`,
        String.raw`    |       |                 P.doubleQuotedString                                       | |`,
        String.raw`    |       |                 /\s*:\s*/                                                  | |`,
        String.raw`    |       |                 ┌─[ Json ]─┐                                               | |`,
        String.raw`    |       |                 | <...>    |                                               | |`,
        String.raw`    |       |                 └──────────┘                                               | |`,
        String.raw`    |       |             > -> map<(...) => { ... }>                                     | |`,
        String.raw`    |       |         > -> map<([_, v]) => v>*                                           | |`,
        String.raw`    |       |     > -> map<([first, rest]) => [first, ...rest]> -> map<(...) => { ... }> | |`,
        String.raw`    |       |     /\s*}/                                                                 | |`,
        String.raw`    |       | > -> map<([_0, object, _2]) => object>                                     | |`,
        String.raw`    |       └────────────────────────────────────────────────────────────────────────────┘ |`,
        String.raw`    |     | ┌─[ Array ]─────────────────────────────────────────┐                          |`,
        String.raw`    |       | SEQ<                                              |                          |`,
        String.raw`    |       |     ┌─[ Last valid parser ]─┐                     |                          |`,
        String.raw`    |       |     | /\[\s*/               |                     |                          |`,
        String.raw`    |       |     └───────────────────────┘                     |                          |`,
        String.raw`    |       |     SEQ<                                          |                          |`,
        String.raw`    |       |         ┌─[ Json ]─┐                              |                          |`,
        String.raw`    |       |         | <...>    |                              |                          |`,
        String.raw`    |       |         └──────────┘                              |                          |`,
        String.raw`    |       |         SEQ<                                      |                          |`,
        String.raw`    |       |             /\s*,\s*/                             |                          |`,
        String.raw`    |       |             ┌─[ Json ]─┐                          |                          |`,
        String.raw`    |       |             | <...>    |                          |                          |`,
        String.raw`    |       |             └──────────┘                          |                          |`,
        String.raw`    |       |         > -> map<([_, v]) => v>*                  |                          |`,
        String.raw`    |       |     > -> map<([first, rest]) => [first, ...rest]> |                          |`,
        String.raw`    |       |     /\s*\]/                                       |                          |`,
        String.raw`    |       | > -> map<([_0, values, _2]) => values>            |                          |`,
        String.raw`    |       └───────────────────────────────────────────────────┘                          |`,
        String.raw`    |     | "true" -> map<() => true>                                                      |`,
        String.raw`    |     | "false" -> map<() => false>                                                    |`,
        String.raw`    |     | "null" -> map<() => null>                                                      |`,
        String.raw`    | >                                                                                    |`,
        String.raw`    └──────────────────────────────────────────────────────────────────────────────────────┘`,
        String.raw``,
    ].join("\n"))
})

test("Test JsonGrammar 2", async ({ page }) => {
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
                                "Abbrev": "ISO 8879:1986",
                                "GlossDef": {
                                    "para": "A meta-markup language, used to create markup languages such as DocBook.",
                                    "GlossSeeAlso": ["GML", "XML"
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
    expect(error).toEqual([
        String.raw`Could not parse: { ... "glossary": { ... "title": "example glossary", ... "Gl`,
        String.raw``,
        String.raw`Input: ..."GlossSeeAlso": ["GML", "XML" ... }, ... "GlossSee": "markup...`,
        String.raw`                                       ^ From here (line: 15, column: 66, offset: 758)`,
        String.raw``,
        String.raw`Last valid parser matched:`,
        String.raw`    ┌─[ Json ]─────────────────────────────────────────────────────────────────────────────┐`,
        String.raw`    | ALT<                                                                                 |`,
        String.raw`    |     ┌─[ Last valid parser ]─┐                                                        |`,
        String.raw`    |     | P.doubleQuotedString  |                                                        |`,
        String.raw`    |     └───────────────────────┘                                                        |`,
        String.raw`    |     | P.numberExponential                                                            |`,
        String.raw`    |     | ┌─[ Object ]─────────────────────────────────────────────────────────────────┐ |`,
        String.raw`    |       | SEQ<                                                                       | |`,
        String.raw`    |       |     /\{\s*/                                                                | |`,
        String.raw`    |       |     SEQ<                                                                   | |`,
        String.raw`    |       |         SEQ<                                                               | |`,
        String.raw`    |       |             P.doubleQuotedString                                           | |`,
        String.raw`    |       |             /\s*:\s*/                                                      | |`,
        String.raw`    |       |             ┌─[ Json ]─┐                                                   | |`,
        String.raw`    |       |             | <...>    |                                                   | |`,
        String.raw`    |       |             └──────────┘                                                   | |`,
        String.raw`    |       |         > -> map<(...) => { ... }>                                         | |`,
        String.raw`    |       |         SEQ<                                                               | |`,
        String.raw`    |       |             /\s*,\s*/                                                      | |`,
        String.raw`    |       |             SEQ<                                                           | |`,
        String.raw`    |       |                 P.doubleQuotedString                                       | |`,
        String.raw`    |       |                 /\s*:\s*/                                                  | |`,
        String.raw`    |       |                 ┌─[ Json ]─┐                                               | |`,
        String.raw`    |       |                 | <...>    |                                               | |`,
        String.raw`    |       |                 └──────────┘                                               | |`,
        String.raw`    |       |             > -> map<(...) => { ... }>                                     | |`,
        String.raw`    |       |         > -> map<([_, v]) => v>*                                           | |`,
        String.raw`    |       |     > -> map<([first, rest]) => [first, ...rest]> -> map<(...) => { ... }> | |`,
        String.raw`    |       |     /\s*}/                                                                 | |`,
        String.raw`    |       | > -> map<([_0, object, _2]) => object>                                     | |`,
        String.raw`    |       └────────────────────────────────────────────────────────────────────────────┘ |`,
        String.raw`    |     | ┌─[ Array ]─────────────────────────────────────────┐                          |`,
        String.raw`    |       | SEQ<                                              |                          |`,
        String.raw`    |       |     /\[\s*/                                       |                          |`,
        String.raw`    |       |     SEQ<                                          |                          |`,
        String.raw`    |       |         ┌─[ Json ]─┐                              |                          |`,
        String.raw`    |       |         | <...>    |                              |                          |`,
        String.raw`    |       |         └──────────┘                              |                          |`,
        String.raw`    |       |         SEQ<                                      |                          |`,
        String.raw`    |       |             /\s*,\s*/                             |                          |`,
        String.raw`    |       |             ┌─[ Json ]─┐                          |                          |`,
        String.raw`    |       |             | <...>    |                          |                          |`,
        String.raw`    |       |             └──────────┘                          |                          |`,
        String.raw`    |       |         > -> map<([_, v]) => v>*                  |                          |`,
        String.raw`    |       |     > -> map<([first, rest]) => [first, ...rest]> |                          |`,
        String.raw`    |       |     /\s*\]/                                       |                          |`,
        String.raw`    |       | > -> map<([_0, values, _2]) => values>            |                          |`,
        String.raw`    |       └───────────────────────────────────────────────────┘                          |`,
        String.raw`    |     | "true" -> map<() => true>                                                      |`,
        String.raw`    |     | "false" -> map<() => false>                                                    |`,
        String.raw`    |     | "null" -> map<() => null>                                                      |`,
        String.raw`    | >                                                                                    |`,
        String.raw`    └──────────────────────────────────────────────────────────────────────────────────────┘`,
        String.raw``,
    ].join("\n"))
})

test("Test JsonGrammar 3", async ({ page }) => {
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
                                "Abbrev": "ISO 8879:1986",
                                "GlossDef": {
                                    "para": "A meta-markup language, used to create markup languages such as DocBook.",
                                    "GlossSeeAlso": ["GML", "XML"]
                                },
                                "GlossSee": "markup"
                            }
                        }
                    }
                }
        `.trim()) // top brace is not closed
    } catch (e) {
        error = /** @type {Error} */(e).message
    } expect(error).toEqual([
        String.raw`Could not parse: { ... "glossary": { ... "title": "example glossary", ... "Gl`,
        String.raw``,
        String.raw`Input: ...} ... } ... } ... }`,
        String.raw`                             ^ From here (line: 21, column: 18, offset: 943), end of string`,
        String.raw``,
        String.raw`Last valid parser matched:`,
        String.raw`    ┌─[ Json ]─────────────────────────────────────────────────────────────────────────────┐`,
        String.raw`    | ALT<                                                                                 |`,
        String.raw`    |     P.doubleQuotedString                                                             |`,
        String.raw`    |     | P.numberExponential                                                            |`,
        String.raw`    |     | ┌─[ Object ]─────────────────────────────────────────────────────────────────┐ |`,
        String.raw`    |       | SEQ<                                                                       | |`,
        String.raw`    |       |     /\{\s*/                                                                | |`,
        String.raw`    |       |     SEQ<                                                                   | |`,
        String.raw`    |       |         SEQ<                                                               | |`,
        String.raw`    |       |             P.doubleQuotedString                                           | |`,
        String.raw`    |       |             /\s*:\s*/                                                      | |`,
        String.raw`    |       |             ┌─[ Json ]─┐                                                   | |`,
        String.raw`    |       |             | <...>    |                                                   | |`,
        String.raw`    |       |             └──────────┘                                                   | |`,
        String.raw`    |       |         > -> map<(...) => { ... }>                                         | |`,
        String.raw`    |       |         SEQ<                                                               | |`,
        String.raw`    |       |             /\s*,\s*/                                                      | |`,
        String.raw`    |       |             SEQ<                                                           | |`,
        String.raw`    |       |                 P.doubleQuotedString                                       | |`,
        String.raw`    |       |                 /\s*:\s*/                                                  | |`,
        String.raw`    |       |                 ┌─[ Json ]─┐                                               | |`,
        String.raw`    |       |                 | <...>    |                                               | |`,
        String.raw`    |       |                 └──────────┘                                               | |`,
        String.raw`    |       |             > -> map<(...) => { ... }>                                     | |`,
        String.raw`    |       |         > -> map<([_, v]) => v>*                                           | |`,
        String.raw`    |       |     > -> map<([first, rest]) => [first, ...rest]> -> map<(...) => { ... }> | |`,
        String.raw`    |       |     ┌─[ Last valid parser ]─┐                                              | |`,
        String.raw`    |       |     | /\s*}/                |                                              | |`,
        String.raw`    |       |     └───────────────────────┘                                              | |`,
        String.raw`    |       | > -> map<([_0, object, _2]) => object>                                     | |`,
        String.raw`    |       └────────────────────────────────────────────────────────────────────────────┘ |`,
        String.raw`    |     | ┌─[ Array ]─────────────────────────────────────────┐                          |`,
        String.raw`    |       | SEQ<                                              |                          |`,
        String.raw`    |       |     /\[\s*/                                       |                          |`,
        String.raw`    |       |     SEQ<                                          |                          |`,
        String.raw`    |       |         ┌─[ Json ]─┐                              |                          |`,
        String.raw`    |       |         | <...>    |                              |                          |`,
        String.raw`    |       |         └──────────┘                              |                          |`,
        String.raw`    |       |         SEQ<                                      |                          |`,
        String.raw`    |       |             /\s*,\s*/                             |                          |`,
        String.raw`    |       |             ┌─[ Json ]─┐                          |                          |`,
        String.raw`    |       |             | <...>    |                          |                          |`,
        String.raw`    |       |             └──────────┘                          |                          |`,
        String.raw`    |       |         > -> map<([_, v]) => v>*                  |                          |`,
        String.raw`    |       |     > -> map<([first, rest]) => [first, ...rest]> |                          |`,
        String.raw`    |       |     /\s*\]/                                       |                          |`,
        String.raw`    |       | > -> map<([_0, values, _2]) => values>            |                          |`,
        String.raw`    |       └───────────────────────────────────────────────────┘                          |`,
        String.raw`    |     | "true" -> map<() => true>                                                      |`,
        String.raw`    |     | "false" -> map<() => false>                                                    |`,
        String.raw`    |     | "null" -> map<() => null>                                                      |`,
        String.raw`    | >                                                                                    |`,
        String.raw`    └──────────────────────────────────────────────────────────────────────────────────────┘`,
        String.raw``,
    ].join("\n"))
})

test("Test MathGrammar 1", async ({ page }) => {
    let error = ""
    try {
        MathGrammar.expression.parse(`5 + 10 - )30`)
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual([
        String.raw`Could not parse: 5 + 10 - )30`,
        String.raw``,
        String.raw`Input: 5 + 10 - )30`,
        String.raw`                ^ From here (line: 1, column: 10, offset: 9)`,
        String.raw``,
        String.raw`Last valid parser matched:`,
        String.raw`    ALT<`,
        String.raw`        SEQ<`,
        String.raw`            ALT<`,
        String.raw`                P.number -> map<v => Number(v)> -> map<v => [v]>`,
        String.raw`                | SEQ<`,
        String.raw`                      "("`,
        String.raw`                      P.whitespaceOpt`,
        String.raw`                      <...>`,
        String.raw`                      P.whitespaceOpt`,
        String.raw`                      ")"`,
        String.raw`                  > -> map<([_0, _1, entries]) => [this.#evaluate(entries)]>`,
        String.raw`            >`,
        String.raw`            SEQ<`,
        String.raw`                P.whitespaceOpt`,
        String.raw`                ALT<`,
        String.raw`                    "^" -> map<(...) => { ... }>`,
        String.raw`                    | "*" -> map<(...) => { ... }>`,
        String.raw`                    | "/" -> map<(...) => { ... }>`,
        String.raw`                    | "+" -> map<(...) => { ... }>`,
        String.raw`                    | "-" -> map<(...) => { ... }>`,
        String.raw`                > -> map<v => v>`,
        String.raw`                ┌─[ Last valid parser ]─┐`,
        String.raw`                | P.whitespaceOpt       |`,
        String.raw`                └───────────────────────┘`,
        String.raw`                <...>`,
        String.raw`            > -> map<(...) => { ... }>+ -> map<values => values.flatMap(v => v)>`,
        String.raw`        > -> map<([term, fragment]) => [...term, ...fragment]>`,
        String.raw`        | P.number -> map<v => Number(v)> -> map<v => [v]>`,
        String.raw`    > -> map<v => this.#evaluate(v)>`,
        String.raw``,
    ].join("\n"))
})

test("Test MathGrammar 2", async ({ page }) => {
    let error = ""
    try {
        MathGrammar.expression.parse(`-30 + (2 ^ (1 + 1) * 5))`)
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual([
        String.raw`Could not parse: -30 + (2 ^ (1 + 1) * 5))`,
        String.raw``,
        String.raw`Input: -30 + (2 ^ (1 + 1) * 5))`,
        String.raw`                              ^ From here (line: 1, column: 24, offset: 23)`,
        String.raw``,
        String.raw`Last valid parser matched:`,
        String.raw`    ALT<`,
        String.raw`        SEQ<`,
        String.raw`            ALT<`,
        String.raw`                P.number -> map<v => Number(v)> -> map<v => [v]>`,
        String.raw`                | SEQ<`,
        String.raw`                      "("`,
        String.raw`                      P.whitespaceOpt`,
        String.raw`                      <...>`,
        String.raw`                      P.whitespaceOpt`,
        String.raw`                      ┌─[ Last valid parser ]─┐`,
        String.raw`                      | ")"                   |`,
        String.raw`                      └───────────────────────┘`,
        String.raw`                  > -> map<([_0, _1, entries]) => [this.#evaluate(entries)]>`,
        String.raw`            >`,
        String.raw`            SEQ<`,
        String.raw`                P.whitespaceOpt`,
        String.raw`                ALT<`,
        String.raw`                    "^" -> map<(...) => { ... }>`,
        String.raw`                    | "*" -> map<(...) => { ... }>`,
        String.raw`                    | "/" -> map<(...) => { ... }>`,
        String.raw`                    | "+" -> map<(...) => { ... }>`,
        String.raw`                    | "-" -> map<(...) => { ... }>`,
        String.raw`                > -> map<v => v>`,
        String.raw`                P.whitespaceOpt`,
        String.raw`                <...>`,
        String.raw`            > -> map<(...) => { ... }>+ -> map<values => values.flatMap(v => v)>`,
        String.raw`        > -> map<([term, fragment]) => [...term, ...fragment]>`,
        String.raw`        | P.number -> map<v => Number(v)> -> map<v => [v]>`,
        String.raw`    > -> map<v => this.#evaluate(v)>`,
        String.raw``,
    ].join("\n"))
})

test("Test MathGrammar 3", async ({ page }) => {
    let error = ""
    try {
        MathGrammar.expression.parse(`9 + (2 ^ x * 4)`)
    } catch (e) {
        error = /** @type {Error} */(e).message
    }
    expect(error).toEqual([
        String.raw`Could not parse: 9 + (2 ^ x * 4)`,
        String.raw``,
        String.raw`Input: 9 + (2 ^ x * 4)`,
        String.raw`                ^ From here (line: 1, column: 10, offset: 9)`,
        String.raw``,
        String.raw`Last valid parser matched:`,
        String.raw`    ALT<`,
        String.raw`        SEQ<`,
        String.raw`            ALT<`,
        String.raw`                P.number -> map<v => Number(v)> -> map<v => [v]>`,
        String.raw`                | SEQ<`,
        String.raw`                      "("`,
        String.raw`                      P.whitespaceOpt`,
        String.raw`                      <...>`,
        String.raw`                      P.whitespaceOpt`,
        String.raw`                      ")"`,
        String.raw`                  > -> map<([_0, _1, entries]) => [this.#evaluate(entries)]>`,
        String.raw`            >`,
        String.raw`            SEQ<`,
        String.raw`                P.whitespaceOpt`,
        String.raw`                ALT<`,
        String.raw`                    "^" -> map<(...) => { ... }>`,
        String.raw`                    | "*" -> map<(...) => { ... }>`,
        String.raw`                    | "/" -> map<(...) => { ... }>`,
        String.raw`                    | "+" -> map<(...) => { ... }>`,
        String.raw`                    | "-" -> map<(...) => { ... }>`,
        String.raw`                > -> map<v => v>`,
        String.raw`                ┌─[ Last valid parser ]─┐`,
        String.raw`                | P.whitespaceOpt       |`,
        String.raw`                └───────────────────────┘`,
        String.raw`                <...>`,
        String.raw`            > -> map<(...) => { ... }>+ -> map<values => values.flatMap(v => v)>`,
        String.raw`        > -> map<([term, fragment]) => [...term, ...fragment]>`,
        String.raw`        | P.number -> map<v => Number(v)> -> map<v => [v]>`,
        String.raw`    > -> map<v => this.#evaluate(v)>`,
        String.raw``,
    ].join("\n"))
})
