import { expect, test } from "@playwright/test"
import P from "../src/Parsernostrum.js"

const indentation = "        "

test("Test String", async ({ page }) => {
    const a = P.str("a")
    expect(a.toString()).toEqual('"a"')
    expect(a.label("String a").toString(indentation, true)).toEqual(`
        ┌─[ String a ]─┐
        | "a"          |
        └──────────────┘`
    )
    expect(P.str("01234567").label("Numbers").toString(indentation, true)).toEqual(`
        ┌─[ Numbers ]─┐
        | "01234567"  |
        └─────────────┘`
    )
    expect(P.str("012345678").label("Numbers").toString(indentation, true)).toEqual(`
        ┌─[ Numbers ]─┐
        | "012345678" |
        └─────────────┘`
    )
    expect(P.str("0123456789").label("Numbers").toString(indentation, true)).toEqual(`
        ┌─[ Numbers ]──┐
        | "0123456789" |
        └──────────────┘`
    )
    expect(P.str("0123456789A").label("Numbers").toString(indentation, true)).toEqual(`
        ┌─[ Numbers ]───┐
        | "0123456789A" |
        └───────────────┘`
    )
    expect(P.str("0123456789AB").label("Numbers").toString(indentation, true)).toEqual(`
        ┌─[ Numbers ]────┐
        | "0123456789AB" |
        └────────────────┘`
    )
    expect(P.str("0123456789ABC").label("Numbers").toString(indentation, true)).toEqual(`
        ┌─[ Numbers ]─────┐
        | "0123456789ABC" |
        └─────────────────┘`
    )
    expect(P.str("0123456789ABCD").label("Numbers").toString(indentation, true)).toEqual(`
        ┌─[ Numbers ]──────┐
        | "0123456789ABCD" |
        └──────────────────┘`
    )
    expect(P.str("0123456789ABCDE").label("Numbers").toString(indentation, true)).toEqual(`
        ┌─[ Numbers ]───────┐
        | "0123456789ABCDE" |
        └───────────────────┘`
    )
    expect(P.str("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ").label("Label 1").label("Label 2").label("Label 3").toString(indentation, true)).toEqual(`
        ┌─[ Label 3 ]────────────────────────────────────┐
        | ┌─[ Label 2 ]────────────────────────────────┐ |
        | | ┌─[ Label 1 ]────────────────────────────┐ | |
        | | | "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" | | |
        | | └────────────────────────────────────────┘ | |
        | └────────────────────────────────────────────┘ |
        └────────────────────────────────────────────────┘`
    )
    expect(a.toString(indentation, true, a)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "a"                   |
        └───────────────────────┘`
    )
    expect(a.label("The string").toString(indentation, true, a)).toEqual(`
        ┌─[ The string ]────────────┐
        | ┌─[ Last valid parser ]─┐ |
        | | "a"                   | |
        | └───────────────────────┘ |
        └───────────────────────────┘`
    )
    expect(P.str("|").toString()).toEqual('"|"')
    expect(P.str("+").toString()).toEqual('"+"')
    expect(P.str(".").toString()).toEqual('"."')
    expect(P.str('"').toString()).toEqual('"\\""')
    expect(P.str("alpha\nbeta").toString()).toEqual('"alpha\\nbeta"')
    const alpha = P.str("alpha")
    expect(alpha.toString()).toEqual('"alpha"')
    expect(alpha.toString(indentation, true, alpha)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "alpha"               |
        └───────────────────────┘`
    )
    const space = P.str(" ")
    expect(space.toString()).toEqual('" "')
    expect(space.toString(indentation, true, space)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | " "                   |
        └───────────────────────┘`
    )
    const beta = P.str("   beta ")
    expect(beta.toString()).toEqual('"   beta "')
    expect(beta.toString(indentation, true, beta)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "   beta "            |
        └───────────────────────┘`
    )
})

test("Test Regexp", async ({ page }) => {
    const regexp1 = P.reg(/^(?:[A-Z][a-z]+\ )+/)
    // @ts-expect-error
    expect(regexp1.toString()).toEqual(`/${regexp1.getParser().regexp.source}/`)
    expect(regexp1.toString(indentation, true, regexp1)).toEqual(String.raw`
        ┌─[ Last valid parser ]─┐
        | /^(?:[A-Z][a-z]+\ )+/ |
        └───────────────────────┘`
    )
    const regexp2 = P.reg(/[\!@#$%^&*()\\[\]{}\-_+=~|:;"'<>,./?]/)
    // @ts-expect-error
    expect(regexp2.toString()).toEqual(`/${regexp2.getParser().regexp.source}/`)
    expect(regexp2.toString(indentation, true, regexp2)).toEqual(String.raw`
        ┌─[ Last valid parser ]───────────────────┐
        | /[\!@#$%^&*()\\[\]{}\-_+=~|:;"'<>,./?]/ |
        └─────────────────────────────────────────┘`
    )
    expect(regexp1.label("Label").toString(indentation, true)).toEqual(String.raw`
        ┌─[ Label ]─────────────┐
        | /^(?:[A-Z][a-z]+\ )+/ |
        └───────────────────────┘`
    )
    expect(regexp1.label("regexp1").toString(indentation, true, regexp1)).toEqual(String.raw`
        ┌─[ regexp1 ]───────────────┐
        | ┌─[ Last valid parser ]─┐ |
        | | /^(?:[A-Z][a-z]+\ )+/ | |
        | └───────────────────────┘ |
        └───────────────────────────┘`
    )
})

test("Test Chained", async ({ page }) => {
    const a = P.str("a")
    const ab = a.chain(() => P.str("b"))
    const ab2 = a.label("A").chain(() => P.str("b"))
    const ab3 = ab.label("Chain")
    const ab4 = a.label("A").chain(() => P.str("b")).label("Chain")
    expect(a.toString()).toEqual('"a"')
    expect(ab.toString()).toEqual('"a" => chained<f()>')
    expect(ab2.toString(indentation, true)).toEqual(`
        ┌─[ A ]─┐
        | "a"   |
        └───────┘ => chained<f()>`
    )
    expect(ab3.toString(indentation, true)).toEqual(`
        ┌─[ Chain ]───────────┐
        | "a" => chained<f()> |
        └─────────────────────┘`
    )
    expect(ab4.toString(indentation, true)).toEqual(`
        ┌─[ Chain ]─────────────────┐
        | ┌─[ A ]─┐                 |
        | | "a"   |                 |
        | └───────┘ => chained<f()> |
        └───────────────────────────┘`
    )
    expect(ab.toString(indentation, true, a)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "a"                   |
        └───────────────────────┘ => chained<f()>`
    )
    expect(ab.label("A").toString(indentation, true)).toEqual(`
        ┌─[ A ]───────────────┐
        | "a" => chained<f()> |
        └─────────────────────┘`
    )
    expect(ab2.toString(indentation, true, a)).toEqual(`
        ┌─[ A ]─────────────────────┐
        | ┌─[ Last valid parser ]─┐ |
        | | "a"                   | |
        | └───────────────────────┘ |
        └───────────────────────────┘ => chained<f()>`
    )
    expect(ab3.toString(indentation, true, a)).toEqual(`
        ┌─[ Chain ]─────────────────────────────────┐
        | ┌─[ Last valid parser ]─┐                 |
        | | "a"                   |                 |
        | └───────────────────────┘ => chained<f()> |
        └───────────────────────────────────────────┘`
    )
    expect(ab4.toString(indentation, true, a)).toEqual(`
        ┌─[ Chain ]─────────────────────────────────────┐
        | ┌─[ A ]─────────────────────┐                 |
        | | ┌─[ Last valid parser ]─┐ |                 |
        | | | "a"                   | |                 |
        | | └───────────────────────┘ |                 |
        | └───────────────────────────┘ => chained<f()> |
        └───────────────────────────────────────────────┘`
    )
    expect(ab.toString(indentation, true, ab)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "a" => chained<f()>   |
        └───────────────────────┘`
    )
    expect(ab2.toString(indentation, true, ab2)).toEqual(`
        ┌─[ Last valid parser ]─────┐
        | ┌─[ A ]─┐                 |
        | | "a"   |                 |
        | └───────┘ => chained<f()> |
        └───────────────────────────┘`
    )
    expect(ab3.toString(indentation, true, ab)).toEqual(`
        ┌─[ Chain ]─────────────────┐
        | ┌─[ Last valid parser ]─┐ |
        | | "a" => chained<f()>   | |
        | └───────────────────────┘ |
        └───────────────────────────┘`
    )
    expect(ab4.toString(indentation, true, ab4)).toEqual(`
        ┌─[ Last valid parser ]─────────┐
        | ┌─[ Chain ]─────────────────┐ |
        | | ┌─[ A ]─┐                 | |
        | | | "a"   |                 | |
        | | └───────┘ => chained<f()> | |
        | └───────────────────────────┘ |
        └───────────────────────────────┘`
    )
    const alpha = P.reg(/alpha/)
    const alphab = alpha.chain(() => P.str("b"))
    expect(alphab.toString()).toEqual('/alpha/ => chained<f()>')
    expect(alphab.toString(indentation, true, alpha)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | /alpha/               |
        └───────────────────────┘ => chained<f()>`
    )
    expect(alphab.toString(indentation, true, alphab)).toEqual(`
        ┌─[ Last valid parser ]───┐
        | /alpha/ => chained<f()> |
        └─────────────────────────┘`
    )
})

test("Test Times", async ({ page }) => {
    const aString = P.str("a string")
    const moreStrings = aString.atLeast(1)
    expect(moreStrings.toString()).toEqual('"a string"+')
    expect(moreStrings.toString(indentation, true, aString)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "a string"            |
        └───────────────────────┘+`
    )
    expect(moreStrings.toString(indentation, true, moreStrings)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "a string"+           |
        └───────────────────────┘`
    )
    expect(P.reg(/\d+\ /).many().toString()).toEqual("/\\d+\\ /*")
    expect(P.str(" ").opt().toString()).toEqual('" "?')
    const word = P.str("word")
    const moreWord = word.atMost(5)
    expect(moreWord.toString()).toEqual('"word"{0,5}')
    expect(moreWord.toString(indentation, true, word)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "word"                |
        └───────────────────────┘{0,5}`
    )
    expect(moreWord.toString(indentation, true, moreWord)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "word"{0,5}           |
        └───────────────────────┘`
    )
    expect(P.reg(/[abc]/).times(2).toString()).toEqual('/[abc]/{2}')
})

test("Test Map", async ({ page }) => {
    const value = P.str("value")
    const parser = value.map(v => 123)
    expect(parser.toString()).toEqual('"value" -> map<v => 123>')
    expect(parser.toString(indentation, true, value)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "value"               |
        └───────────────────────┘ -> map<v => 123>`
    )
    expect(parser.toString(indentation, true, parser)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | "value"               |
        └───────────────────────┘ -> map<v => 123>`
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
    expect(parser.toString(indentation, true)).toEqual(`
        ALT<
            "apple"
            | "b"
            | "charlie"{5}
        >`
    )
    expect(parser.toString(indentation, true, parser)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | ALT<                  |
        |     "apple"           |
        |     | "b"             |
        |     | "charlie"{5}    |
        | >                     |
        └───────────────────────┘`
    )
    expect(parser.toString(indentation, true, b)).toEqual(`
        ALT<
            "apple"
            | ┌─[ Last valid parser ]─┐
              | "b"                   |
              └───────────────────────┘
            | "charlie"{5}
        >`
    )
    expect(parser.toString(indentation, true, charlie)).toEqual(`
        ALT<
            "apple"
            | "b"
            | ┌─[ Last valid parser ]─┐
              | "charlie"             |
              └───────────────────────┘{5}
        >`
    )
    expect(parser.toString(indentation, true, charlieTimes)).toEqual(`
        ALT<
            "apple"
            | "b"
            | ┌─[ Last valid parser ]─┐
              | "charlie"{5}          |
              └───────────────────────┘
        >`
    )
})

test("Test Sequence", async ({ page }) => {
    const bravo = P.lazy(() => P.str("bravo"))
    const parser = P.seq(P.str("a").opt(), bravo, P.str("c"))
    expect(parser.toString(indentation, true)).toEqual(`
        SEQ<
            "a"?
            "bravo"
            "c"
        >`
    )
    expect(parser.toString(indentation, true, parser)).toEqual(`
        ┌─[ Last valid parser ]─┐
        | SEQ<                  |
        |     "a"?              |
        |     "bravo"           |
        |     "c"               |
        | >                     |
        └───────────────────────┘`
    )
    expect(parser.toString(indentation, true, bravo)).toEqual(`
        SEQ<
            "a"?
            ┌─[ Last valid parser ]─┐
            | "bravo"               |
            └───────────────────────┘
            "c"
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
    expect(parser.toString(indentation, true, seq)).toEqual(`
        ALT<
            "alpha"
            | ┌─[ Last valid parser ]────────────┐
              | SEQ<                             |
              |     <"beta" -> map<v => v + 1>>? |
              |     "gamma"*                     |
              | >                                |
              └──────────────────────────────────┘+
        >`
    )
    expect(parser.toString(indentation, true, seqMany)).toEqual(`
        ALT<
            "alpha"
            | ┌─[ Last valid parser ]────────────┐
              | SEQ<                             |
              |     <"beta" -> map<v => v + 1>>? |
              |     "gamma"*                     |
              | >+                               |
              └──────────────────────────────────┘
        >`
    )
    expect(parser.label("Root").toString(indentation, true, seq)).toEqual(`
        ┌─[ Root ]────────────────────────────────────┐
        | ALT<                                        |
        |     "alpha"                                 |
        |     | ┌─[ Last valid parser ]────────────┐  |
        |       | SEQ<                             |  |
        |       |     <"beta" -> map<v => v + 1>>? |  |
        |       |     "gamma"*                     |  |
        |       | >                                |  |
        |       └──────────────────────────────────┘+ |
        | >                                           |
        └─────────────────────────────────────────────┘`
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
    expect(g.toString(indentation, true)).toEqual(`
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
    expect(g.toString(indentation, true, belgium)).toEqual(`
        SEQ<
            "Italy"
            /Switzerland/ => chained<f()>
            ALT<
                "Austria" -> map<() => 123>
                | ALT<
                      ┌─[ Last valid parser ]─┐
                      | "Belgium"             |
                      └───────────────────────┘ -> map<v => "abc">
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

test("Test predefined parsers", async ({ page }) => {
    expect(P.number.toString()).toEqual("P.number")
    expect(P.numberInteger.toString()).toEqual("P.numberInteger")
    expect(P.numberBigInteger.toString()).toEqual("P.numberBigInteger")
    expect(P.numberNatural.toString()).toEqual("P.numberNatural")
    expect(P.numberExponential.toString()).toEqual("P.numberExponential")
    expect(P.numberUnit.toString()).toEqual("P.numberUnit")
    expect(P.numberByte.toString()).toEqual("P.numberByte")
    expect(P.whitespace.toString()).toEqual("P.whitespace")
    expect(P.whitespaceOpt.toString()).toEqual("P.whitespaceOpt")
    expect(P.whitespaceInline.toString()).toEqual("P.whitespaceInline")
    expect(P.whitespaceInlineOpt.toString()).toEqual("P.whitespaceInlineOpt")
    expect(P.whitespaceMultiline.toString()).toEqual("P.whitespaceMultiline")
    expect(P.doubleQuotedString.toString()).toEqual("P.doubleQuotedString")
    expect(P.singleQuotedString.toString()).toEqual("P.singleQuotedString")
    expect(P.backtickQuotedString.toString()).toEqual("P.backtickQuotedString")
})
