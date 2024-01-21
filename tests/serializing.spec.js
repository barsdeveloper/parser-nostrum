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
    expect(P.str("|").toString()).toEqual('"|"')
    expect(P.str("+").toString()).toEqual('"+"')
    expect(P.str(".").toString()).toEqual('"."')
    expect(P.str('"').toString()).toEqual('"\\""')
    expect(P.str("alpha\nbeta").toString()).toEqual('"alpha\\nbeta"')
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
    const alpha = P.reg(/alpha/)
    const alphab = alpha.chain(() => P.str("b"))
    expect(alphab.toString()).toEqual('/alpha/ => chained<f()>')
    expect(alphab.toString(2, true, alpha)).toEqual(`
        /alpha/ => chained<f()>
        ^^^^^^^ ${Parser.highlight}`
    )
    expect(alphab.toString(2, true, alphab)).toEqual(`
        /alpha/ => chained<f()>
                   ^^^^^^^^^^^^ ${Parser.highlight}`
    )
})

test("Test Times", async ({ page }) => {
    const aString = P.str("a string")
    const moreStrings = aString.atLeast(1)
    expect(moreStrings.toString()).toEqual('"a string"+')
    expect(moreStrings.toString(2, true, aString)).toEqual(`
        "a string"+
        ^^^^^^^^^^ ${Parser.highlight}`
    )
    expect(moreStrings.toString(2, true, moreStrings)).toEqual(`
        "a string"+
                  ^ ${Parser.highlight}`
    )
    expect(P.reg(/\d+\ /).many().toString()).toEqual("/\\d+\\ /*")
    expect(P.str(" ").opt().toString()).toEqual('" "?')
    const word = P.str("word")
    const moreWord = word.atMost(5)
    expect(moreWord.toString()).toEqual('"word"{0,5}')
    expect(moreWord.toString(2, true, word)).toEqual(`
        "word"{0,5}
        ^^^^^^ ${Parser.highlight}`
    )
    expect(moreWord.toString(2, true, moreWord)).toEqual(`
        "word"{0,5}
              ^^^^^ ${Parser.highlight}`
    )
    expect(P.reg(/[abc]/).times(2).toString()).toEqual('/[abc]/{2}')
})

test("Test Map", async ({ page }) => {
    const value = P.str("value")
    const parser = value.map(v => 123)
    expect(parser.toString()).toEqual('"value" -> map<v => 123>')
    expect(parser.toString(2, true, value)).toEqual(`
        "value" -> map<v => 123>
        ^^^^^^^ ${Parser.highlight}`
    )
    expect(parser.toString(2, true, parser)).toEqual(`
        "value" -> map<v => 123>
        ^^^^^^^ ${Parser.highlight}`
    )
    expect(P.str("str").map(v => "Returns a very very very very very medium string").toString())
        .toEqual('"str" -> map<v => "Returns a very very very very very medium string">')
    expect(P.str("str").map(v => "Returns a very very very very very very very very string").toString())
        .toEqual('"str" -> map<(...) => { ... }>')
})

test("Test Alternative", async ({ page }) => {
    const b = P.str("b")
    const charlie = P.str("charlie")
    const charlieTimes = charlie.times(5)
    const parser = P.alt(P.str("apple"), P.lazy(() => b), charlieTimes)
    expect(parser.toString(2, true)).toEqual(`
        ALT<
            "apple"
            | b
            | "charlie"{5}
        >`
    )
    expect(parser.toString(2, true, parser)).toEqual(`
        ALT<
        ^^^ ${Parser.highlight}
            "apple"
            | b
            | "charlie"{5}
        >`
    )
    expect(parser.toString(2, true, b)).toEqual(`
        ALT<
            "apple"
            | b
              ^ ${Parser.highlight}
            | "charlie"{5}
        >`
    )
    expect(parser.toString(2, true, charlie)).toEqual(`
        ALT<
            "apple"
            | b
            | "charlie"{5}
              ^^^^^^^^^ ${Parser.highlight}
        >`
    )
    expect(parser.toString(2, true, charlieTimes)).toEqual(`
        ALT<
            "apple"
            | b
            | "charlie"{5}
                       ^^^ ${Parser.highlight}
        >`
    )
})

test("Test Sequence", async ({ page }) => {
    const bravo = P.lazy(() => P.str("bravo"))
    const parser = P.seq(P.str("a").opt(), bravo, P.str("c"))
    expect(parser.toString(2, true)).toEqual(`
        SEQ<
            a?
            "bravo"
            c
        >`
    )
    expect(parser.toString(2, true, parser)).toEqual(`
        SEQ<
        ^^^ ${Parser.highlight}
            a?
            "bravo"
            c
        >`
    )
    expect(parser.toString(2, true, bravo)).toEqual(`
        SEQ<
            a?
            "bravo"
            ^^^^^^^ ${Parser.highlight}
            c
        >`
    )
})

test("Test 1", async ({ page }) => {
    const gamma = P.str("gamma")
    const seq = P.seq(
        P.str("beta").map(v => v + 1).opt(),
        gamma.many()
    )
    const seqMany = seq.atLeast(1)
    const parser = P.alt(
        P.str("alpha"),
        seqMany,
    )
    expect(parser.toString(2, true, seq)).toEqual(`
        ALT<
            "alpha"
            | SEQ<
              ^^^ ${Parser.highlight}
                <"beta" -> map<v => v + 1>>?
                "gamma"*
            >+
        >`
    )
    expect(parser.toString(2, true, seqMany)).toEqual(`
        ALT<
            "alpha"
            | SEQ<
                <"beta" -> map<v => v + 1>>?
                "gamma"*
            >+
             ^ ${Parser.highlight}
        >`
    )
})

test("Test 2", async ({ page }) => {
    const belgium = P.str("Belgium")
    const g = P.lazy(() => P.lazy(() => P.seq(
        P.str("Italy"),
        P.lazy(() => P.reg(/Switzerland/).chain(v => P.whitespaceOpt)),
        P.alt(
            P.str("Austria").map(() => 123),
            P.alt(
                belgium.map(v => "abc"),
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
    expect(g.toString(2, true, belgium)).toEqual(`
        SEQ<
            "Italy"
            /Switzerland/ => chained<f()>
            ALT<
                "Austria" -> map<() => 123>
                | ALT<
                    "Belgium" -> map<v => "abc">
                    ^^^^^^^^^ ${Parser.highlight}
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
