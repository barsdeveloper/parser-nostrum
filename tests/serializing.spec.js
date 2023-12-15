import { test, expect } from "@playwright/test"
import R from "../src/Regexer.js"

test("Test String", async ({ page }) => {
    expect(R.str("a").toString()).toEqual("a")
    expect(R.str("alpha").toString()).toEqual('"alpha"')
    expect(R.str(" ").toString()).toEqual('" "')
    expect(R.str("   beta ").toString()).toEqual('"   beta "')
})

test("Test Regexp", async ({ page }) => {
    let regexp = /^(?:[A-Z][a-z]+\ )+/
    expect(R.regexp(regexp).toString()).toEqual(`/${regexp.source}/`)
    regexp = /[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/
    expect(R.regexp(regexp).toString()).toEqual(`/${regexp.source}/`)
})

test("Test Chained", async ({ page }) => {
    expect(R.str("a").chain(() => R.str("b")).toString()).toEqual("a => chained<f()>")
    expect(R.str("alpha").chain(() => R.str("b")).toString()).toEqual('"alpha" => chained<f()>')
})

test("Test Times", async ({ page }) => {
    expect(R.str("a string").atLeast(1).toString()).toEqual('"a string"+')
    expect(R.regexp(/\d+\ /).many().toString()).toEqual("/\\d+\\ /*")
    expect(R.str(" ").opt().toString()).toEqual('" "?')
    expect(R.str("word").atMost(5).toString()).toEqual('"word"{0,5}')
    expect(R.regexp(/[abc]/).times(2).toString()).toEqual('/[abc]/{2}')
})

test("Test Map", async ({ page }) => {
    expect(R.str("value").map(v => 123).toString()).toEqual('"value" -> map<v => 123>')
    expect(R.str("str").map(v => "Returns a very very very very very medium string").toString())
        .toEqual('"str" -> map<v => "Returns a very very very very very medium string">')
    expect(R.str("str").map(v => "Returns a very very very very very very very very string").toString())
        .toEqual('"str" -> map<(...) => { ... }>')
})

test("Test Alternative", async ({ page }) => {
    expect(R.alt(R.str("apple"), R.lazy(() => R.str("b")), R.str("charlie").times(5)).toString(2, true)).toEqual(`
        ALT<
            "apple"
            | b
            | "charlie"{5}
        >`
    )
})

test("Test Sequence", async ({ page }) => {
    const g = R.seq(R.str("a").opt(), R.lazy(() => R.str("bravo")), R.str("c"))
    expect(g.toString(2, true)).toEqual(`
        SEQ<
            a?
            "bravo"
            c
        >`
    )
})

test("Test 1", async ({ page }) => {
    expect(R.alt(
        R.str("alpha"),
        R.seq(
            R.str("beta").map(v => v + 1).opt(),
            R.str("gamma").many()
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
    const g = R.lazy(() => R.lazy(() => R.seq(
        R.str("Italy"),
        R.lazy(() => R.regexp(/Switzerland/).chain(v => R.optWhitespace)),
        R.alt(
            R.str("Austria").map(() => 123),
            R.alt(
                R.str("Belgium").map(v => "abc"),
                R.lazy(() => R.regexpGroups(/Spain/)),
            ),
            R.str("Poland"),
            R.str("Portugal").map(() => { }),
        ),
        R.regexp(/(Romania)/, 1),
        R.str("Netherlands").map(() => "xyz")
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
