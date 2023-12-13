import { R } from "../src/grammars/RegExpGrammar.js"
import { test, expect } from "@playwright/test"
import BasicR from "../src/Regexer.js"
import EscapedCharParser from "../src/parser/EscapedCharParser.js"

/** @param {String} v */
const f1 = v => v.repeat(2)

/** @param {String} v */
const f2 = v => v.trim()

/** @param {String} v */
const f3 = v => v.trimStart()

const fp = v => R.optWhitespace

test("Test 1", async ({ page }) => {
    expect(
        R.equals(
            R.str("a"),
            R.str("a"),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a").map(x => x.charAt(0)).map(x => x.trimEnd()),
            R.nonGrp(R.str("a")),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.nonGrp(/*******/R.str("a").map(x => x.charAt(0))).map(x => x.trimEnd()),
            R.nonGrp(R.nonGrp(R.str("a"))),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a"),
            R.str("a").map(x => x.concat("aaa")),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.grp(R.str("a")),
            R.str("a").map(x => x.concat("aaa")),
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.grp(R.str("a")),
            R.grp(R.str("a").map(x => x.concat("aaa"))),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.grp(R.str("a")),
            R.grp(R.str("a")).map(x => x.concat("aaa")),
        )
    ).toBeTruthy()
    expect(
        R.equals(
            /**********/R.str("a"),
            R.atomicGrp(R.str("a").map(x => x.concat("aaa"))),
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.str("a"),
            R.str("a"),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a").map(f1),
            R.str("a").map(f1),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.atomicGrp(R.str("a")).map(f1),
            /**********/R.str("a").map(f1),
            true,
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.atomicGrp(R.str("a")).map(f1),
            R.atomicGrp(R.str("a")).map(f1),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a").map(f1).map(f2),
            R.str("a").map(f1),
            true,
        )
    ).toBeFalsy()
    expect(
        R.equals(
            R.str("a").map(f1).map(f2),
            R.str("a").map(f1).map(f2),
            true,
        )
    ).toBeTruthy()
    expect(
        R.equals(
            R.str("a").map(f1).map(v => v.trim()),
            R.str("a").map(f1).map(f2),
            true,
        )
    ).toBeFalsy()
    expect(
        R.equals(R.str(""), R.success(),)
    ).toBeTruthy()
    expect(
        R.equals(R.success(), R.str(""))
    ).toBeTruthy()
    expect(
        R.equals(R.str(""), R.success(), true)
    ).toBeFalsy()
    expect(
        R.equals(R.success(), R.str(""), true)
    ).toBeFalsy()
})

test("Test 2", async ({ page }) => {
    expect(R.equals(R.str("a"), R.str("b"), false)).toBeFalsy()
    expect(R.equals(R.str("a"), R.str("b"), true)).toBeFalsy()
})

test("Test 3", async ({ page }) => {
    expect(R.equals(
        R.str("a").chain(fp),
        R.str("a").map(f1),
        true
    )).toBeFalsy()
    expect(R.equals(
        R.str("a").chain(fp),
        R.str("a").map(f1).chain(fp)
    )).toBeTruthy()
    expect(R.equals(
        R.str("a").chain(fp),
        R.str("a").chain(fp),
        true
    )).toBeTruthy()
})

test("Test 4", async ({ page }) => {
    expect(R.equals(
        R.regexpGroups(/a(b)c/),
        R.lazy(() => R.regexp(/a(b)c/))
    )).toBeTruthy()
    expect(R.equals(
        R.lazy(() => R.regexp(/a(b)c/)),
        R.regexpGroups(/a(b)c/),
    )).toBeTruthy()
    expect(R.equals(
        R.regexpGroups(/a(b)c/),
        R.lazy(() => R.regexp(/a(b)c/)),
        true
    )).toBeFalsy()
    expect(R.equals(
        R.lazy(() => R.regexp(/a(b)c/)),
        R.regexpGroups(/a(b)c/),
        true
    )).toBeFalsy()
    expect(R.equals(
        R.lazy(() => R.regexp(/a(b)c/, 1)).map(f2),
        R.lazy(() => R.regexp(/a(b)c/, 1)).map(f2),
        true
    )).toBeTruthy()
    expect(R.equals(
        R.lazy(() => R.regexp(/a(b)c/, 0)).map(f2),
        R.lazy(() => R.regexp(/a(b)c/, 1)).map(f2),
        true
    )).toBeFalsy()
})

test("Test 5", async ({ page }) => {
    const lhs = R.seq(R.number, R.nonGrp(R.whitespaceInline), R.alt(R.str("a").map(v => 123), R.str("b")))
    const rhs = R.seq(R.number, /******/ R.whitespaceInline, R.alt(R.str("a"), /************/ R.str("b")))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 6", async ({ page }) => {
    const lhs = R.seq(R.number, R.number, R.alt(R.str("a"), R.str("b")))
    const rhs = R.seq(R.number, R.number, R.alt(R.str("b"), R.str("a")))
    expect(R.equals(lhs, rhs)).toBeFalsy()
    expect(R.equals(rhs, lhs)).toBeFalsy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 7", async ({ page }) => {
    const lhs = R.alt(
        R.str("a").map(() => "alpha").many(),
        R.lazy(() => R.seq(
            R.str("b").map(v => 123).opt(),
            R.lookahead(R.str("c")),
            R.str("c")
        )),
    )
        .many()
    const rhs = R.alt(
        R.str("a").many(),
        R.seq(
            R.str("b").map(v => v).opt(),
            R.lookahead(R.str("c")),
            R.str("c")
        ),
    )
        .many()
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 8", async ({ page }) => {
    const lhs = R.alt(R.regexp(/\s*[a-z]/).skipSpace(), R.grp(R.str("alpha").map(f2).opt().map(f1))).sepBy(R.str(","))
    const rhs = R.alt(R.regexp(/\s*[a-z]/).skipSpace(), R.grp(R.str("alpha").map(f2).opt().map(f1))).sepBy(R.str(","))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeTruthy()
    expect(R.equals(rhs, lhs, true)).toBeTruthy()
})

test("Test 9", async ({ page }) => {
    const lhs = R.seq(
        R.grp(R.class(
            R.escapedChar("\b"),
            R.range(R.str("a"), R.escapedChar("\0"))
        )),
        R.nonGrp(R.escapedChar("\x48", EscapedCharParser.Type.HEX)),
    )
    const rhs = R.seq(
        R.grp(R.alt(
            R.str("\b"),
            R.range(R.str("a"), R.str("\0"))
        )),
        R.str("\x48"),
    )
    const rhs2 = R.seq(
        R.grp(R.negClass(
            R.str("\b"),
            R.range(R.str("a"), R.str("\0"))
        )),
        R.str("\x48"),
    )
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs2)).toBeFalsy()
    expect(R.equals(rhs2, lhs)).toBeFalsy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 10", async ({ page }) => {
    const lhs = R.seq(
        R.regexp(/(Paris|Milan|Amsterdam)/),
        R.alt(
            R.lazy(() => R.str("City")),
            R.str("Town"),
        )
    )
    const rhs = R.seq(
        R.regexp(/(Paris|Milan|Amsterdam)/),
        R.alt(
            R.lazy(() => R.str("City").map(() => "")),
            R.str("Town"),
        )
    )
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 11", async ({ page }) => {
    /** @type {Regexer<Parser<any>>} */
    let lhs = R.alt(R.str("0"), R.str("1"), R.str("2"))
    /** @type {Regexer<Parser<any>>} */
    let rhs = R.alt(R.str("0"), R.str("1"), R.str("2"))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeTruthy()
    expect(R.equals(rhs, lhs, true)).toBeTruthy()

    lhs = R.class(R.str("0"), R.str("1"), R.str("2"))
    rhs = R.alt(R.str("0"), R.str("1"), R.str("2"))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()

    lhs = R.class(R.str("0"), R.str("1"), R.str("2"))
    rhs = R.class(R.str("0"), R.str("1"), R.str("2"))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeTruthy()
    expect(R.equals(rhs, lhs, true)).toBeTruthy()

    lhs = R.negClass(R.str("0"), R.str("1"), R.str("2"))
    rhs = R.class(R.str("0"), R.str("1"), R.str("2"))
    expect(R.equals(lhs, rhs)).toBeFalsy()
    expect(R.equals(rhs, lhs)).toBeFalsy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()

    lhs = R.negClass(R.str("0"), R.str("1"), R.str("2"))
    rhs = R.alt(R.str("0"), R.str("1"), R.str("2"))
    expect(R.equals(lhs, rhs)).toBeFalsy()
    expect(R.equals(rhs, lhs)).toBeFalsy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()

    lhs = R.lazy(() => R.class(R.str("0"), R.str("1"), R.str("2"))).map(f3).map(f1)
    rhs = R.alt(R.str("0"), R.nonGrp(R.lazy(() => R.str("1"))), R.str("2"))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeFalsy()
    expect(R.equals(rhs, lhs, true)).toBeFalsy()
})

test("Test 12", async ({ page }) => {
    const lhs = R.lazy(() => R.lazy(() => R.seq(
        R.str("Italy"),
        R.lazy(() => R.regexp(/Switzerland/).chain(fp)),
        R.alt(
            R.nonGrp(R.str("Austria")).map(f1),
            R.alt(
                R.grp(R.str("Belgium").map(f2), "a"),
                R.nonGrp(R.lazy(() => R.regexpGroups(/Spain/))),
            ),
            R.str("Poland"),
            R.str("Portugal").map(f2),
        ),
        R.range(R.str("a"), R.str("z")),
        R.regexp(/(Romania)/, 1),
        R.str("Netherlands").map(f3)
    )))
    // It's lhs copy pasted
    const rhs = R.lazy(() => R.lazy(() => R.seq(
        R.str("Italy"),
        R.lazy(() => R.regexp(/Switzerland/).chain(fp)),
        R.alt(
            R.nonGrp(R.str("Austria")).map(f1),
            R.alt(
                R.grp(R.str("Belgium").map(f2), "a"),
                R.nonGrp(R.lazy(() => R.regexpGroups(/Spain/))),
            ),
            R.str("Poland"),
            R.str("Portugal").map(f2),
        ),
        R.range(R.str("a"), R.str("z")),
        R.regexp(/(Romania)/, 1),
        R.str("Netherlands").map(f3)
    )))
    expect(R.equals(lhs, rhs)).toBeTruthy()
    expect(R.equals(rhs, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs, true)).toBeTruthy()
    expect(R.equals(rhs, lhs, true)).toBeTruthy()

    // It's similar to rhs but with some omissions that still make it functionally equal
    const rhs2 = R.nonGrp(R.seq(
        R.str("Italy"),
        R.regexp(/Switzerland/).chain(fp),
        R.lazy(() => R.alt(
            R.nonGrp(R.str("Austria")).map(f1),
            R.alt(
                R.grp(R.str("Belgium"), "a"),
                R.regexpGroups(/Spain/),
            ),
            R.lazy(() => R.str("Poland").map(f3)),
            R.str("Portugal"),
        )),
        R.range(R.str("a"), R.str("z")),
        R.regexp(/(Romania)/).map(f2),
        R.str("Netherlands")
    ))
    expect(R.equals(lhs, rhs2)).toBeTruthy()
    expect(R.equals(rhs2, lhs)).toBeTruthy()
    expect(R.equals(lhs, rhs2, true)).toBeFalsy()
    expect(R.equals(rhs2, lhs, true)).toBeFalsy()
    expect(R.equals(lhs, rhs2, true)).toBeFalsy()
    expect(R.equals(rhs2, lhs, true)).toBeFalsy()
})

test("Test 13", async ({ page }) => {
    class Grammar {
        /** @type {Regexer<Parser<any>>} */
        static a = R.seq(R.str("a"), R.str("a"), R.lazy(() => this.a))
    }
    const other =
        R.seq(R.str("a"), R.str("a"), R.seq(R.str("a"), R.str("a"), R.seq(R.str("a"), R.str("a"), Grammar.a)))
    expect(R.equals(Grammar.a, other)).toBeTruthy()
    expect(R.equals(other, Grammar.a)).toBeTruthy()
    expect(R.equals(Grammar.a, other)).toBeTruthy()
    expect(R.equals(other, Grammar.a)).toBeTruthy()
})

test("Test 14", async ({ page }) => {
    class Grammar {
        static a = R.regexp(/a/).map(f3)
        static b = R.grp(R.str("b"))
        static c = R.alt(Grammar.a, Grammar.b, R.lazy(() => Grammar.d))
        /** @type {Regexer<Parser<any>>} */
        static d = R.seq(Grammar.c, R.str("d"))
        static root = this.d
    }
    const other = R.seq(R.alt(R.regexp(/a/).map(f3), Grammar.b, R.seq(Grammar.c, R.str("d"))), R.str("d"))
    expect(R.equals(Grammar.root, other)).toBeTruthy()
    expect(R.equals(other, Grammar.root)).toBeTruthy()
    expect(R.equals(Grammar.root, other)).toBeTruthy()
    expect(R.equals(other, Grammar.root)).toBeTruthy()
})

test("Test 15", async ({ page }) => {
    class Grammar {
        /** @type {Regexer<Parser<any>>} */
        static a = R.seq(R.str("a"), R.str("a"), R.lazy(() => this.a))
        static b = R.seq(R.str("a"), R.str("a"), R.lazy(() => this.b))
    }
    expect(R.equals(Grammar.a, Grammar.b)).toBeTruthy()
    expect(R.equals(Grammar.b, Grammar.a)).toBeTruthy()
    expect(R.equals(Grammar.a, Grammar.b, true)).toBeTruthy()
    expect(R.equals(Grammar.b, Grammar.a, true)).toBeTruthy()
})

test("Test 16", async ({ page }) => {
    class Grammar {
        /** @type {Regexer<Parser<any>>} */
        static a = R.seq(R.str("a"), R.str("a"), R.lazy(() => this.a))
        static b = R.seq(R.str("a"), R.lazy(() => this.b))
    }
    expect(R.equals(Grammar.a, Grammar.b)).toBeFalsy()
    expect(R.equals(Grammar.b, Grammar.a)).toBeFalsy()
    expect(R.equals(Grammar.a, Grammar.b, true)).toBeFalsy()
    expect(R.equals(Grammar.b, Grammar.a, true)).toBeFalsy()
})

test("Test 17", async ({ page }) => {
    class Grammar {
        /** @type {Regexer<Parser<any>>} */
        static a = R.seq(R.str("a"), R.lazy(() => this.a), R.success())
        static b = R.seq(R.str("a"), R.seq(R.str("a"), R.seq(R.str("a"), R.lazy(() => this.b), R.str("")), R.success()), R.success())
    }
    expect(R.equals(Grammar.a, Grammar.b)).toBeTruthy()
    expect(R.equals(Grammar.b, Grammar.a)).toBeTruthy()
    expect(R.equals(Grammar.a, Grammar.b)).toBeTruthy()
    expect(R.equals(Grammar.b, Grammar.a)).toBeTruthy()
})

test("Test 18", async ({ page }) => {
    class Grammar {
        /** @type {Regexer<Parser<any>>} */
        static a1 = R.seq(R.grp(R.str("a").many()), R.lazy(() => this.a1), R.str("x"))
        /** @type {Regexer<Parser<any>>} */
        static a2 = R.seq(R.grp(R.str("a").many()), R.lazy(() => this.a2), R.str("y"))
        static b = R.seq(R.grp(R.str("a").many()), R.lazy(() => R.seq(R.grp(R.str("a").many()), R.lazy(() => this.b), R.str("y"))), R.str("y"))
    }
    expect(R.equals(Grammar.a2, Grammar.b)).toBeTruthy()
    expect(R.equals(Grammar.b, Grammar.a2)).toBeTruthy()
    expect(R.equals(Grammar.a2, Grammar.b, true)).toBeTruthy()
    expect(R.equals(Grammar.b, Grammar.a2, true)).toBeTruthy()
    expect(R.equals(Grammar.a1, Grammar.b)).toBeFalsy()
    expect(R.equals(Grammar.b, Grammar.a1)).toBeFalsy()
    expect(R.equals(Grammar.a1, Grammar.b, true)).toBeFalsy()
    expect(R.equals(Grammar.b, Grammar.a1, true)).toBeFalsy()
})

test("Test 19", async ({ page }) => {
    const RegexpR = R
    expect(R.equals(BasicR.str("str"), RegexpR.str("str"), true)).toBeTruthy()
    expect(R.equals(RegexpR.regexp(/regexp/), BasicR.regexp(/regexp/), true)).toBeTruthy()
    // Alt are not equal because alt originating from a regex is backtracking
    expect(R.equals(
        RegexpR.alt(RegexpR.str("alpha"), BasicR.str("beta")),
        BasicR.alt(BasicR.str("alpha"), RegexpR.str("beta")),
        true
    )).toBeFalsy()
    {
        // Alt are not equal because alt originating from a regex is backtracking
        const a = BasicR.alt(RegexpR.str("alpha"), BasicR.str("beta"))
        const b = RegexpR.alt(BasicR.str("alpha"), RegexpR.str("beta"))
        expect(R.equals(a, b)).toBeFalsy()
        expect(R.equals(b, a)).toBeFalsy()
        expect(R.equals(a, b, true)).toBeFalsy()
        expect(R.equals(b, a, true)).toBeFalsy()
    }
    expect(R.equals(
        BasicR.seq(RegexpR.str("alpha"), BasicR.str("beta")),
        RegexpR.seq(BasicR.str("alpha"), RegexpR.str("beta")),
        true
    )).toBeTruthy()
    {
        // Times are not equal because times originating from a regex is backtracking
        const a = RegexpR.str("").map(f2).atLeast(2)
        const b = BasicR.str("").map(f1).atLeast(2)
        expect(R.equals(a, b)).toBeFalsy()
        expect(R.equals(b, a)).toBeFalsy()
        expect(R.equals(a, b, true)).toBeFalsy()
        expect(R.equals(b, a, true)).toBeFalsy()
    }
    {
        // Class are not equal because class originating from a regex is backtracking
        const a = RegexpR.class(RegexpR.str("a"), RegexpR.str("b"))
        const b = RegexpR.alt(RegexpR.str("a"), RegexpR.str("b"))
        expect(R.equals(a, b)).toBeTruthy()
        expect(R.equals(b, a)).toBeTruthy()
        expect(R.equals(a, b, true)).toBeFalsy()
        expect(R.equals(b, a, true)).toBeFalsy()
    }
})

test("Test 20", async ({ page }) => {
    expect(R.equals(
        R.lazy(() => R.str("abc")),
        // @ts-expect-error
        R.alt(R.seq(R.str("abc")).map(f2)).map(f3),
        false
    )).toBeTruthy()
})
