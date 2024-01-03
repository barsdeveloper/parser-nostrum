import { test, expect } from "@playwright/test"
import P from "../src/Parsernostrum.js"

test("Test String", async ({ page }) => {
    expect(P.str("a").toString()).toEqual("a")
    expect(P.str("alpha").toString()).toEqual('"alpha"')
    expect(P.str(" ").toString()).toEqual('" "')
    expect(P.str("   beta ").toString()).toEqual('"   beta "')
})

test("Test Regexp", async ({ page }) => {
    let regexp = /^(?:[A-Z][a-z]+\ )+/
    expect(P.reg(regexp).toString()).toEqual(`/${regexp.source}/`)
    regexp = /[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/
    expect(P.reg(regexp).toString()).toEqual(`/${regexp.source}/`)
})

test("Test Chained", async ({ page }) => {
    expect(P.str("a").chain(() => P.str("b")).toString()).toEqual("a => chained<f()>")
    expect(P.str("alpha").chain(() => P.str("b")).toString()).toEqual('"alpha" => chained<f()>')
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
                P.lazy(() => P.regexpGroups(/Spain/)),
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
