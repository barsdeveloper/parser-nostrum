import { test, expect } from "@playwright/test"
import P from "../src/Parsernostrum.js"
import Parser from "../src/parser/Parser.js"

test("Test String", async ({ page }) => {
    const a = P.str("a")
    expect(a.toString()).toEqual("a")
    expect(a.toString(2, true, a)).toEqual(`
        a
        ^ ${Parser.highlight}`
    )
    const alpha = P.str("alpha")
    expect(alpha.toString()).toEqual('"alpha"')
    expect(alpha.toString(2, true, alpha)).toEqual(`
        "alpha"
        ^^^^^^^ ${Parser.highlight}`
    )
    const space = P.str(" ")
    expect(space.toString()).toEqual('" "')
    expect(space.toString(2, true, space)).toEqual(`
        " "
        ^^^ ${Parser.highlight}`
    )
    const beta = P.str("   beta ")
    expect(beta.toString()).toEqual('"   beta "')
    expect(beta.toString(2, true, beta)).toEqual(`
        "   beta "
        ^^^^^^^^^^ ${Parser.highlight}`
    )
})

test("Test Regexp", async ({ page }) => {
    const regexp1 = P.reg(/^(?:[A-Z][a-z]+\ )+/)
    expect(regexp1.toString()).toEqual(`/${regexp1.getParser().regexp.source}/`)
    expect(regexp1.toString(2, true, regexp1)).toEqual(`
        /${regexp1.getParser().regexp.source}/
        ^^^^^^^^^^^^^^^^^^^^^ ${Parser.highlight}`
    )
    const regexp2 = P.reg(/[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/)
    expect(regexp2.toString()).toEqual(`/${regexp2.getParser().regexp.source}/`)
    expect(regexp2.toString(2, true, regexp2)).toEqual(`
        /${regexp2.getParser().regexp.source}/
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ${Parser.highlight}`
    )
})

test("Test Chained", async ({ page }) => {
    const a = P.str("a")
    const ab = a.chain(() => P.str("b"))
    expect(ab.toString()).toEqual("a => chained<f()>")
    expect(ab.toString(2, true, a)).toEqual(`
        a => chained<f()>
        ^ ${Parser.highlight}`
    )
    expect(ab.toString(2, true, ab)).toEqual(`
        a => chained<f()>
             ^^^^^^^^^^^^ ${Parser.highlight}`
    )
    const alphab = P.str("alpha").chain(() => P.str("b"))
    expect(alphab.toString()).toEqual('"alpha" => chained<f()>')
    expect(alphab.toString(2, true, alphab)).toEqual(`
        "alpha" => chained<f()>
                   ^^^^^^^^^^^^ ${Parser.highlight}`
    )
})

test("Test Times", async ({ page }) => {
    expect(P.str("a string").atLeast(1).toString()).toEqual('"a string"+')
    expect(P.reg(/\d+\ /).many().toString()).toEqual("/\\d+\\ /*")
    expect(P.str(" ").opt().toString()).toEqual('" "?')
    expect(P.str("word").atMost(5).toString()).toEqual('"word"{0,5}')
    expect(P.reg(/[abc]/).times(2).toString()).toEqual('/[abc]/{2}')
})

test("Test Map", async ({ page }) => {
    expect(P.str("value").map(v => 123).toString()).toEqual('"value" -> map<v => 123>')
    expect(P.str("str").map(v => "Returns a very very very very very medium string").toString())
        .toEqual('"str" -> map<v => "Returns a very very very very very medium string">')
    expect(P.str("str").map(v => "Returns a very very very very very very very very string").toString())
        .toEqual('"str" -> map<(...) => { ... }>')
})

test("Test Alternative", async ({ page }) => {
    expect(P.alt(P.str("apple"), P.lazy(() => P.str("b")), P.str("charlie").times(5)).toString(2, true)).toEqual(`
        ALT<
            "apple"
            | b
            | "charlie"{5}
        >`
    )
})

test("Test Sequence", async ({ page }) => {
    const g = P.seq(P.str("a").opt(), P.lazy(() => P.str("bravo")), P.str("c"))
    expect(g.toString(2, true)).toEqual(`
        SEQ<
            a?
            "bravo"
            c
        >`
    )
})

test("Test 1", async ({ page }) => {
    expect(P.alt(
        P.str("alpha"),
        P.seq(
            P.str("beta").map(v => v + 1).opt(),
            P.str("gamma").many()
        ).atLeast(1)
    ).toString(2, true)).toEqual(`
        ALT<
            "alpha"
            | SEQ<
                "beta" -> map<v => v + 1>?
                "gamma"*
            >+
        >`
    )
})

test("Test 2", async ({ page }) => {
    const g = P.lazy(() => P.lazy(() => P.seq(
        P.str("Italy"),
        P.lazy(() => P.reg(/Switzerland/).chain(v => P.whitespaceOpt)),
        P.alt(
            P.str("Austria").map(() => 123),
            P.alt(
                P.str("Belgium").map(v => "abc"),
                P.lazy(() => P.regArray(/Spain/)),
            ),
            P.str("Poland"),
            P.str("Portugal").map(() => { }),
        ),
        P.reg(/(Romania)/, 1),
        P.str("Netherlands").map(() => "xyz")
    )))
    expect(g.toString(2, true)).toEqual(`
        SEQ<
            "Italy"
            /Switzerland/ => chained<f()>
            ALT<
                "Austria" -> map<() => 123>
                | ALT<
                    "Belgium" -> map<v => "abc">
                    | /Spain/
                >
                | "Poland"
                | "Portugal" -> map<() => {}>
            >
            /(Romania)/
            "Netherlands" -> map<() => "xyz">
        >`
    )
})
