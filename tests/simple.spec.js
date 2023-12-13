import { test, expect } from "@playwright/test"
import Regexer from "../src/Regexer.js"

const R = Regexer

test("String alpha", async ({ page }) => {
    const p = R.str("alpha")
    expect(p.parse("alpha")).toEqual("alpha")
    expect(() => p.parse("Alpha")).toThrowError()
    expect(() => p.parse("alphaa")).toThrowError()
    expect(() => p.parse("aalpha")).toThrowError()
    expect(() => p.parse("alpha ")).toThrowError()
    expect(() => p.parse(" alpha")).toThrowError()
    expect(() => p.parse("alphaalpha")).toThrowError()
    expect(() => p.parse("beta")).toThrowError()
})

test("String beta", async ({ page }) => {
    const p = R.str("beta")
    expect(p.parse("beta")).toEqual("beta")
    expect(() => p.parse("Beta")).toThrowError()
    expect(() => p.parse("betaa")).toThrowError()
    expect(() => p.parse("bbeta")).toThrowError()
    expect(() => p.parse("beta ")).toThrowError()
    expect(() => p.parse(" beta")).toThrowError()
    expect(() => p.parse("betabeta")).toThrowError()
    expect(() => p.parse("alpha")).toThrowError()
})

test("Number", async ({ page }) => {
    const p = R.number
    expect(p.parse("123")).toEqual(123)
    expect(p.parse("10.5")).toBeCloseTo(10.5)
    expect(p.parse("-99.0")).toEqual(-99)
    expect(p.parse("+5")).toEqual(5)
    expect(() => p.parse(" 5")).toThrowError()
    expect(() => p.parse("1 0")).toThrowError()
    expect(() => p.parse("+ 5")).toThrowError()
    expect(() => p.parse(" unrelated")).toThrowError()
    expect(() => p.parse("betabeta")).toThrowError()
    expect(() => p.parse("alpha")).toThrowError()
})

test("Number natural", async ({ page }) => {
    const p = R.numberNatural
    expect(p.parse("0")).toEqual(0)
    expect(p.parse("00")).toEqual(0)
    expect(p.parse("83664")).toEqual(83664)
    expect(p.parse("000012")).toEqual(12)
    expect(() => p.parse("+0")).toThrowError()
    expect(() => p.parse("+1")).toThrowError()
    expect(() => p.parse("-4")).toThrowError()
    expect(() => p.parse("1e2")).toThrowError()
    expect(() => p.parse(" 5")).toThrowError()
})

test("Number exponential", async ({ page }) => {
    const p = R.numberExponential
    expect(p.parse("7344")).toEqual(7344)
    expect(p.parse("2.25")).toBeCloseTo(2.25)
    expect(p.parse("-3.333")).toBeCloseTo(-3.333)
    expect(p.parse("400e40")).toBeCloseTo(400e40)
    expect(p.parse("-1E+100")).toBeCloseTo(-1E+100)
    expect(p.parse("1E-1")).toBeCloseTo(0.1)
    expect(() => p.parse(" 0 ")).toThrowError()
    expect(() => p.parse("unrelated")).toThrowError()
})

test("Number unit", async ({ page }) => {
    const p = R.numberUnit
    expect(p.parse("0")).toEqual(0)
    expect(p.parse("+0")).toEqual(+0)
    expect(p.parse("1")).toEqual(1)
    expect(p.parse("+1")).toEqual(1)
    expect(p.parse("0.1")).toBeCloseTo(0.1)
    expect(p.parse("+0.1")).toBeCloseTo(0.1)
    expect(p.parse("0.5")).toBeCloseTo(0.5)
    expect(p.parse("+0.5")).toBeCloseTo(0.5)
    expect(() => p.parse("1.1")).toThrowError()
    expect(() => p.parse("-0.1")).toThrowError()
    expect(() => p.parse("+ 0")).toThrowError()
    expect(() => p.parse(" unrelated")).toThrowError()
    expect(() => p.parse("betabeta")).toThrowError()
    expect(() => p.parse("alpha")).toThrowError()
})

test("Whitespace inline", async ({ page }) => {
    const p = R.whitespaceInline
    expect(p.parse("       ")).toEqual("       ")
    expect(() => p.parse("  \n ")).toThrowError()
})

test("Whitespace multiline", async ({ page }) => {
    const p = R.whitespaceMultiline
    expect(p.parse("   \n    ")).toEqual("   \n    ")
    expect(() => p.parse("   ")).toThrowError()
})

test("Double quoted string", async ({ page }) => {
    const p = R.doubleQuotedString
    expect(p.parse('"This is a \\"string\\""')).toEqual('This is a \\"string\\"')
})

test("Sequence: alpha, beta", async ({ page }) => {
    const p = R.seq(R.str("alpha"), R.str("beta"))
    expect(p.parse("alphabeta")).toEqual(["alpha", "beta"])
    expect(() => p.parse(" alphabeta")).toThrowError()
    expect(() => p.parse("alpha beta")).toThrowError()
    expect(() => p.parse("alphabeta ")).toThrowError()
    expect(() => p.parse("alph")).toThrowError()
})

test("Sequence regex and strings", async ({ page }) => {
    const p = R.seq(
        R.str("("),
        R.optWhitespace,
        R.number,
        R.optWhitespace,
        R.str(","),
        R.optWhitespace,
        R.number,
        R.optWhitespace,
        R.str(")")
    )
    expect(p.parse("(1,1)")).toEqual(["(", "", 1, "", ",", "", 1, "", ")"])
    expect(p.parse("( +10.4, -9 )")).toEqual(["(", " ", 10.4, "", ",", " ", -9, " ", ")"])
    expect(() => p.parse("(A, B)")).toThrowError()
})

test("Alternative", async ({ page }) => {
    const p = R.alt(R.str("first"), R.str("second"), R.str("third"))
    expect(p.parse("first")).toEqual("first")
    expect(p.parse("second")).toEqual("second")
    expect(p.parse("third")).toEqual("third")
    expect(() => p.parse("alpha ")).toThrowError()
})

test("Optional", async ({ page }) => {
    const p = R.seq(R.str("a"), R.str("b").opt(), R.str("c")).join()
    expect(p.parse("abc")).toEqual("abc")
    expect(p.parse("ac")).toEqual("ac")
    expect(() => p.parse("acd")).toThrowError()
})

test("Many", async ({ page }) => {
    const p = R.str("a").many()
    expect(p.parse("")).toEqual([])
    expect(p.parse("a")).toEqual(["a"])
    expect(p.parse("aa")).toEqual(["a", "a"])
    expect(p.parse("aaa")).toEqual(["a", "a", "a"])
    expect(p.parse("aaaaaaaaaa")).toEqual(["a", "a", "a", "a", "a", "a", "a", "a", "a", "a"])
    expect(() => p.parse("aaaab")).toThrowError()
    expect(() => p.parse(" aa")).toThrowError()
    expect(() => p.parse("aaaa aaa")).toThrowError()
})

test("Times", async ({ page }) => {
    const p = R.str("alpha").times(2)
    expect(p.parse("alphaalpha")).toEqual(["alpha", "alpha"])
    expect(() => p.parse("alpha")).toThrowError()
    expect(() => p.parse("alphaalphaalpha")).toThrowError()
    expect(() => p.parse("alphabeta")).toThrowError()
})

test("At least", async ({ page }) => {
    const p = R.seq(R.number, R.str(", ")).atLeast(2)
    expect(p.parse("1, 2, 3, 4, 5, ")).toEqual([[1, ", "], [2, ", "], [3, ", "], [4, ", "], [5, ", "]])
    expect(p.parse("-100, 2.5, ")).toEqual([[-100, ", "], [2.5, ", "]])
    expect(() => p.parse("-100, ")).toThrowError()
    expect(() => p.parse(" -100, 2.5, ")).toThrowError()
})

test("At most", async ({ page }) => {
    const p = R.seq(R.number, R.str(", ")).atMost(2)
    expect(p.parse("")).toEqual([])
    expect(p.parse("10, ")).toEqual([[10, ", "]])
    expect(p.parse("10, 20, ")).toEqual([[10, ", "], [20, ", "]])
    expect(() => p.parse("10, 20, 30, ")).toThrowError()
})

test("Map", async ({ page }) => {
    const p = R.str("Hello").map(v => "World")
    expect(p.parse("Hello")).toEqual("World")
    expect(() => p.parse("hello")).toThrowError()
})

test("Number regex mapped", async ({ page }) => {
    const p = R.number.map(v => Number(v))
    expect(p.parse("400")).toEqual(400)
    expect(p.parse("-0.01")).toEqual(-0.01)
    expect(p.parse("+888.88")).toEqual(+888.88)
    expect(p.parse("+1")).toEqual(1)
    expect(() => p.parse(" 5")).toThrowError()
    expect(() => p.parse("1 0")).toThrowError()
    expect(() => p.parse("+ 5")).toThrowError()
    expect(() => p.parse(" unrelated")).toThrowError()
    expect(() => p.parse("betabeta")).toThrowError()
    expect(() => p.parse("alpha")).toThrowError()
})

test("Join", async ({ page }) => {
    const p = R.seq(
        R.str("a").join(), // Joining this has no effect
        R.str("b")
    )
        .join() // Seq returns an array, joining it means concatenating the string it contains
        .many().join() // many returns an array, joining it means concatenating the string it contains
    expect(p.parse("")).toEqual("")
    expect(p.parse("ab")).toEqual("ab")
    expect(p.parse("abab")).toEqual("abab")
    expect(p.parse("abababab")).toEqual("abababab")
    expect(() => p.parse("a")).toThrowError()
    expect(() => p.parse("aba")).toThrowError()
})

test("Chain", async ({ page }) => {
    const p = R.regexp(/\w+ /).chain(v => {
        switch (v) {
            case "first ": return R.str("second")
            case "alpha ": return R.str("beta")
            case "a ": return R.str("b")
        }
    })
    expect(p.parse("first second")).toEqual("second")
    expect(p.parse("alpha beta")).toEqual("beta")
    expect(p.parse("a b")).toEqual("b")
    expect(() => p.parse("hello")).toThrowError()
})

test("Assert", async ({ page }) => {
    const p = R.numberNatural.assert(n => n % 2 == 0)
    expect(p.parse("2")).toEqual(2)
    expect(p.parse("54")).toEqual(54)
    expect(() => p.parse("3")).toThrowError()
    expect(() => p.parse("non number")).toThrowError()
})

test("Lookahead", async ({ page }) => {
    const p = R.seq(R.number, R.lookahead(R.str(" end")), R.str(" end")).map(([number, end]) => number)
    expect(p.parse("123 end")).toEqual(123)
    expect(p.parse("-10 end")).toEqual(-10)
    expect(() => p.parse("begin word")).toThrowError()
})

test("Lazy", async ({ page }) => {
    const p = R.lazy(() => R.str("alpha"))
    expect(p.parse("alpha")).toEqual("alpha")
    expect(() => p.parse("beta")).toThrowError()
})

test("Skip space", async ({ page }) => {
    const p = R.seq(R.str("a").skipSpace(), R.str("b"))
    expect(p.parse("ab")).toEqual(["a", "b"])
    expect(p.parse("a    b")).toEqual(["a", "b"])
    expect(() => p.parse("aba")).toThrowError()
})

test("Separated by", async ({ page }) => {
    const p = R.str("a").sepBy(R.regexp(/\s*,\s*/))
    expect(p.parse("a,  a  ,  a")).toEqual(["a", "a", "a"])
    expect(p.parse("a  ,  a")).toEqual(["a", "a"])
    expect(p.parse("a")).toEqual(["a"])
    expect(() => p.parse("aba")).toThrowError()
})
