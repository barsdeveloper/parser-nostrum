import { expect, test } from "@playwright/test"
import P from "../src/Parsernostrum.js"

test("String alpha", async ({ page }) => {
    const p = P.str("alpha")
    expect(p.parse("alpha")).toStrictEqual("alpha")
    expect(() => p.parse("Alpha")).toThrow("Could not parse")
    expect(() => p.parse("alphaa")).toThrow("Could not parse")
    expect(() => p.parse("aalpha")).toThrow("Could not parse")
    expect(() => p.parse("alpha ")).toThrow("Could not parse")
    expect(() => p.parse(" alpha")).toThrow("Could not parse")
    expect(() => p.parse("alphaalpha")).toThrow("Could not parse")
    expect(() => p.parse("beta")).toThrow("Could not parse")
})

test("String beta", async ({ page }) => {
    const p = P.str("beta")
    expect(p.parse("beta")).toStrictEqual("beta")
    expect(() => p.parse("Beta")).toThrow("Could not parse")
    expect(() => p.parse("betaa")).toThrow("Could not parse")
    expect(() => p.parse("bbeta")).toThrow("Could not parse")
    expect(() => p.parse("beta ")).toThrow("Could not parse")
    expect(() => p.parse(" beta")).toThrow("Could not parse")
    expect(() => p.parse("betabeta")).toThrow("Could not parse")
    expect(() => p.parse("alpha")).toThrow("Could not parse")
})

test("Number", async ({ page }) => {
    const p = P.number
    expect(p.parse("123")).toStrictEqual(123)
    expect(p.parse("10.5")).toBeCloseTo(10.5)
    expect(p.parse("-99.0")).toStrictEqual(-99)
    expect(p.parse("+5")).toStrictEqual(5)
    expect(() => p.parse(" 5")).toThrow("Could not parse")
    expect(() => p.parse("1 0")).toThrow("Could not parse")
    expect(() => p.parse("+ 5")).toThrow("Could not parse")
    expect(() => p.parse(" unrelated")).toThrow("Could not parse")
    expect(() => p.parse("betabeta")).toThrow("Could not parse")
    expect(() => p.parse("alpha")).toThrow("Could not parse")
})

test("Number integer", async ({ page }) => {
    const p = P.numberInteger
    expect(p.parse("0")).toStrictEqual(0)
    expect(p.parse("+0")).toStrictEqual(0)
    expect(p.parse("-0")).toStrictEqual(-0)
    expect(p.parse("00")).toStrictEqual(0)
    expect(p.parse("+6")).toStrictEqual(6)
    expect(p.parse("-99")).toStrictEqual(-99)
    expect(p.parse("5833")).toStrictEqual(5833)
    expect(p.parse("000077")).toStrictEqual(77)
    expect(() => p.parse("+0.5")).toThrow("Could not parse")
})

test("Number big integer", async ({ page }) => {
    const p = P.numberBigInteger
    expect(p.parse("0")).toStrictEqual(0n)
    expect(p.parse("+0")).toStrictEqual(0n)
    expect(p.parse("-0")).toStrictEqual(-0n)
    expect(p.parse("00")).toStrictEqual(0n)
    expect(p.parse("+6")).toStrictEqual(6n)
    expect(p.parse("-99")).toStrictEqual(-99n)
    expect(p.parse("5833")).toStrictEqual(5833n)
    expect(p.parse("000077")).toStrictEqual(77n)
    expect(() => p.parse("+0.5")).toThrow("Could not parse")
})

test("Number natural", async ({ page }) => {
    const p = P.numberNatural
    expect(p.parse("0")).toStrictEqual(0)
    expect(p.parse("00")).toStrictEqual(0)
    expect(p.parse("83664")).toStrictEqual(83664)
    expect(p.parse("000012")).toStrictEqual(12)
    expect(() => p.parse("+0")).toThrow("Could not parse")
    expect(() => p.parse("+1")).toThrow("Could not parse")
    expect(() => p.parse("-4")).toThrow("Could not parse")
    expect(() => p.parse("1e2")).toThrow("Could not parse")
    expect(() => p.parse(" 5")).toThrow("Could not parse")
})

test("Number exponential", async ({ page }) => {
    const p = P.numberExponential
    expect(p.parse("7344")).toStrictEqual(7344)
    expect(p.parse("2.25")).toBeCloseTo(2.25)
    expect(p.parse("-3.333")).toBeCloseTo(-3.333)
    expect(p.parse("400e40")).toBeCloseTo(400e40)
    expect(p.parse("-1E+100")).toBeCloseTo(-1E+100)
    expect(p.parse("1E-1")).toBeCloseTo(0.1)
    expect(() => p.parse(" 0 ")).toThrow("Could not parse")
    expect(() => p.parse("unrelated")).toThrow("Could not parse")
})

test("Number unit", async ({ page }) => {
    const p = P.numberUnit
    expect(p.parse("0")).toStrictEqual(0)
    expect(p.parse("+0")).toStrictEqual(+0)
    expect(p.parse("1")).toStrictEqual(1)
    expect(p.parse("+1")).toStrictEqual(1)
    expect(p.parse("0.1")).toBeCloseTo(0.1)
    expect(p.parse("+0.1")).toBeCloseTo(0.1)
    expect(p.parse("0.5")).toBeCloseTo(0.5)
    expect(p.parse("+0.5")).toBeCloseTo(0.5)
    expect(() => p.parse("1.1")).toThrow("Could not parse")
    expect(() => p.parse("-0.1")).toThrow("Could not parse")
    expect(() => p.parse("+ 0")).toThrow("Could not parse")
    expect(() => p.parse(" unrelated")).toThrow("Could not parse")
    expect(() => p.parse("betabeta")).toThrow("Could not parse")
    expect(() => p.parse("alpha")).toThrow("Could not parse")
})

test("Number byte", async ({ page }) => {
    const p = P.numberByte
    expect(p.parse("0")).toStrictEqual(0)
    expect(p.parse("1")).toStrictEqual(1)
    expect(p.parse("250")).toStrictEqual(250)
    expect(p.parse("255")).toStrictEqual(255)
    expect(() => p.parse("256")).toThrow("Could not parse")
    expect(() => p.parse("+0")).toThrow("Could not parse")
    expect(() => p.parse("+1")).toThrow("Could not parse")
    expect(() => p.parse("1.1")).toThrow("Could not parse")
    expect(() => p.parse("-0.1")).toThrow("Could not parse")
    expect(() => p.parse("+ 0")).toThrow("Could not parse")
    expect(() => p.parse(" unrelated")).toThrow("Could not parse")
    expect(() => p.parse("betabeta")).toThrow("Could not parse")
    expect(() => p.parse("alpha")).toThrow("Could not parse")
})

test("Whitespace inline", async ({ page }) => {
    const p = P.whitespaceInline
    expect(p.parse("       ")).toStrictEqual("       ")
    expect(() => p.parse("  \n ")).toThrow("Could not parse")
})

test("Whitespace multiline", async ({ page }) => {
    const p = P.whitespaceMultiline
    expect(p.parse("   \n    ")).toStrictEqual("   \n    ")
    expect(() => p.parse("   ")).toThrow("Could not parse")
})

test("Double quoted string", async ({ page }) => {
    const p = P.doubleQuotedString
    expect(p.parse('"This is a \\"string\\""')).toStrictEqual('This is a \\"string\\"')
})

test("Sequence: alpha, beta", async ({ page }) => {
    const p = P.seq(P.str("alpha"), P.str("beta"))
    expect(p.parse("alphabeta")).toStrictEqual(["alpha", "beta"])
    expect(() => p.parse(" alphabeta")).toThrow("Could not parse")
    expect(() => p.parse("alpha beta")).toThrow("Could not parse")
    expect(() => p.parse("alphabeta ")).toThrow("Could not parse")
    expect(() => p.parse("alph")).toThrow("Could not parse")
})

test("Sequence regex and strings", async ({ page }) => {
    const p = P.seq(
        P.str("("),
        P.whitespaceOpt,
        P.number,
        P.whitespaceOpt,
        P.str(","),
        P.whitespaceOpt,
        P.number,
        P.whitespaceOpt,
        P.str(")")
    )
    expect(p.parse("(1,1)")).toStrictEqual(["(", "", 1, "", ",", "", 1, "", ")"])
    expect(p.parse("( +10.4, -9 )")).toStrictEqual(["(", " ", 10.4, "", ",", " ", -9, " ", ")"])
    expect(() => p.parse("(A, B)")).toThrow("Could not parse")
})

test("Alternative", async ({ page }) => {
    const p = P.alt(P.str("first"), P.str("second"), P.str("third"))
    expect(p.parse("first")).toStrictEqual("first")
    expect(p.parse("second")).toStrictEqual("second")
    expect(p.parse("third")).toStrictEqual("third")
    expect(() => p.parse("alpha ")).toThrow("Could not parse")
})

test("Optional", async ({ page }) => {
    const p = P.seq(P.str("a"), P.str("b").opt("x"), P.str("c")).join()
    expect(p.parse("abc")).toStrictEqual("abc")
    expect(p.parse("ac")).toStrictEqual("axc")
    expect(() => p.parse("acd")).toThrow("Could not parse")
})

test("Many", async ({ page }) => {
    const p = P.str("a").many()
    expect(p.parse("")).toStrictEqual([])
    expect(p.parse("a")).toStrictEqual(["a"])
    expect(p.parse("aa")).toStrictEqual(["a", "a"])
    expect(p.parse("aaa")).toStrictEqual(["a", "a", "a"])
    expect(p.parse("aaaaaaaaaa")).toStrictEqual(["a", "a", "a", "a", "a", "a", "a", "a", "a", "a"])
    expect(() => p.parse("aaaab")).toThrow("Could not parse")
    expect(() => p.parse(" aa")).toThrow("Could not parse")
    expect(() => p.parse("aaaa aaa")).toThrow("Could not parse")
})

test("Times", async ({ page }) => {
    const p = P.str("alpha").times(2)
    expect(p.parse("alphaalpha")).toStrictEqual(["alpha", "alpha"])
    expect(() => p.parse("alpha")).toThrow("Could not parse")
    expect(() => p.parse("alphaalphaalpha")).toThrow("Could not parse")
    expect(() => p.parse("alphabeta")).toThrow("Could not parse")
})

test("At least", async ({ page }) => {
    const p = P.seq(P.number, P.str(", ")).atLeast(2)
    expect(p.parse("1, 2, 3, 4, 5, ")).toStrictEqual([[1, ", "], [2, ", "], [3, ", "], [4, ", "], [5, ", "]])
    expect(p.parse("-100, 2.5, ")).toStrictEqual([[-100, ", "], [2.5, ", "]])
    expect(() => p.parse("-100, ")).toThrow("Could not parse")
    expect(() => p.parse(" -100, 2.5, ")).toThrow("Could not parse")
})

test("At most", async ({ page }) => {
    const p = P.seq(P.number, P.str(", ")).atMost(2)
    expect(p.parse("")).toStrictEqual([])
    expect(p.parse("10, ")).toStrictEqual([[10, ", "]])
    expect(p.parse("10, 20, ")).toStrictEqual([[10, ", "], [20, ", "]])
    expect(() => p.parse("10, 20, 30, ")).toThrow("Could not parse")
})

test("Map", async ({ page }) => {
    const p = P.str("Hello").map(v => "World")
    expect(p.parse("Hello")).toStrictEqual("World")
    expect(() => p.parse("hello")).toThrow("Could not parse")
})

test("Number regex mapped", async ({ page }) => {
    const p = P.number.map(v => Number(v))
    expect(p.parse("400")).toStrictEqual(400)
    expect(p.parse("-0.01")).toStrictEqual(-0.01)
    expect(p.parse("+888.88")).toStrictEqual(+888.88)
    expect(p.parse("+1")).toStrictEqual(1)
    expect(() => p.parse(" 5")).toThrow("Could not parse")
    expect(() => p.parse("1 0")).toThrow("Could not parse")
    expect(() => p.parse("+ 5")).toThrow("Could not parse")
    expect(() => p.parse(" unrelated")).toThrow("Could not parse")
    expect(() => p.parse("betabeta")).toThrow("Could not parse")
    expect(() => p.parse("alpha")).toThrow("Could not parse")
})

test("Join", async ({ page }) => {
    const p = P.seq(
        P.str("a").join(), // Joining this has no effect
        P.str("b")
    )
        .join() // Seq returns an array, joining it means concatenating the string it contains
        .many().join() // many returns an array, joining it means concatenating the string it contains
    expect(p.parse("")).toStrictEqual("")
    expect(p.parse("ab")).toStrictEqual("ab")
    expect(p.parse("abab")).toStrictEqual("abab")
    expect(p.parse("abababab")).toStrictEqual("abababab")
    expect(() => p.parse("a")).toThrow("Could not parse")
    expect(() => p.parse("aba")).toThrow("Could not parse")
})

test("Chain", async ({ page }) => {
    const p = P.reg(/[([{]/).chain(v => (
        {
            "(": P.str(")"),
            "[": P.str("]"),
            "{": P.str("}"),
        }[v].map(closingParenthesis => v + closingParenthesis)
    ))
    expect(p.parse("()")).toStrictEqual("()")
    expect(p.parse("[]")).toStrictEqual("[]")
    expect(p.parse("{}")).toStrictEqual("{}")
    expect(() => p.parse("hello")).toThrow("Could not parse")
})

test("Assert", async ({ page }) => {
    const p = P.numberNatural.assert(n => n % 2 == 0)
    expect(p.parse("2")).toStrictEqual(2)
    expect(p.parse("54")).toStrictEqual(54)
    expect(() => p.parse("3")).toThrow("Could not parse")
    expect(() => p.parse("non number")).toThrow("Could not parse")
})

test("Lookahead", async ({ page }) => {
    const p = P.seq(P.number, P.lookahead(P.str(" end")), P.str(" end")).map(([number, end]) => number)
    expect(p.parse("123 end")).toStrictEqual(123)
    expect(p.parse("-10 end")).toStrictEqual(-10)
    expect(() => p.parse("begin word")).toThrow("Could not parse")
})

test("Lazy", async ({ page }) => {
    const p = P.lazy(() => P.str("alpha"))
    expect(p.parse("alpha")).toStrictEqual("alpha")
    expect(() => p.parse("beta")).toThrow("Could not parse")
})

test("Skip space", async ({ page }) => {
    const p = P.seq(P.str("a").skipSpace(), P.str("b"))
    expect(p.parse("ab")).toStrictEqual(["a", "b"])
    expect(p.parse("a    b")).toStrictEqual(["a", "b"])
    expect(() => p.parse("aba")).toThrow("Could not parse")
})

test("Separated by", async ({ page }) => {
    {
        const p = P.str("a").sepBy(P.reg(/\s*,\s*/))
        expect(p.parse("a,  a  ,  a")).toStrictEqual(["a", "a", "a"])
        expect(p.parse("a  ,  a")).toStrictEqual(["a", "a"])
        expect(p.parse("a")).toStrictEqual(["a"])
        expect(() => p.parse("a,")).toThrow("Could not parse")
        expect(() => p.parse("aba")).toThrow("Could not parse")
    }
    {
        const p = P.reg(/a+/).sepBy(P.str(","), 0, true)
        expect(p.parse("")).toStrictEqual([])
        expect(p.parse("aaa")).toStrictEqual(["aaa"])
        expect(p.parse("aaa,")).toStrictEqual(["aaa"])
        expect(p.parse("aaa,aa")).toStrictEqual(["aaa", "aa"])
        expect(p.parse("aaa,aa,")).toStrictEqual(["aaa", "aa"])
        expect(p.parse("aaa,aa,a")).toStrictEqual(["aaa", "aa", "a"])
        expect(p.parse("aaa,aa,a,")).toStrictEqual(["aaa", "aa", "a"])
        expect(() => p.parse(",")).toThrow("Could not parse")
    }
    {
        const p = P.reg(/b+/).sepBy(P.str(","), 2)
        expect(p.parse("bbb,bb")).toStrictEqual(["bbb", "bb"])
        expect(p.parse("bbb,bb,b")).toStrictEqual(["bbb", "bb", "b"])
        expect(() => p.parse("bbb")).toThrow("Could not parse")
        expect(() => p.parse("bbb,bb,")).toThrow("Could not parse")
        expect(() => p.parse(",")).toThrow("Could not parse")
    }
})
