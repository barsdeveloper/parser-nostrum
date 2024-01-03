import { test, expect } from "@playwright/test"
import httpServer from "http-server"
import JsonGrammar from "../src/grammars/JsonGrammar.js"
import MathGrammar from "../src/grammars/MathGrammar.js"
import P from "../src/Parsernostrum.js"
import sample1 from "./sample1.js"
import sample2 from "./sample2.js"

let webserver

test.beforeAll(async () => {
    webserver = httpServer.createServer({
        "root": "./tests",
        "cors": true,
    })
    webserver.listen(3000)
})

test.afterAll(async () => {
    webserver.close()
})

test("Readme code", async ({ page }) => {
    // Create a parser
    /** @type {P<any>} */
    const palindromeParser = P.alt(
        P.reg(/[a-z]/).chain(c =>
            P.seq(
                P.lazy(() => palindromeParser).opt(),
                P.str(c)
            ).map(([recursion, _]) => c + recursion + c)
        ),
        P.reg(/([a-z])\1?/)
    ).opt()

    // Use the parsing methods to check the text
    try {
        // This method throws in case it doesn't parse
        palindromeParser.parse("Not a palindrome!")
    } catch (e) {
        console.log(e.message) // Could not parse "Not a palindrome!"
    }
    // This method returns an object with status (can be used as a boolean to check if success) and value keys
    let result = palindromeParser.run("Also not a palindrome")
    console.log(result.value) // null
    console.log(palindromeParser.parse("asantalivedasadevilatnasa")) // asantalivedasadevilatnasa
})

test("Matched parentheses", async ({ page }) => {
    /** @type {P<any>} */
    const matcheParentheses = P.seq(
        P.str("("),
        P.alt(
            P.lazy(() => matcheParentheses),
            P.reg(/\w*/),
        ),
        P.str(")"),
    )
    expect(matcheParentheses.parse("()")).toBeTruthy()
    expect(matcheParentheses.parse("(a)")).toBeTruthy()
    expect(matcheParentheses.parse("(((((b)))))")).toBeTruthy()
    expect(() => matcheParentheses.parse("(()")).toThrow()
})

test("Palindrome", async ({ page }) => {
    const palindromeParser = P.alt(
        P.reg(/[a-z]/).chain(c =>
            P.seq(
                P.lazy(() => palindromeParser).opt(),
                P.str(c)
            ).map(([recursion, _]) => c + recursion + c)
        ),
        P.reg(/([a-z])\1?/)
    ).opt()
    expect(palindromeParser.parse("")).toEqual("")
    expect(palindromeParser.parse("a")).toEqual("a")
    expect(palindromeParser.parse("aa")).toEqual("aa")
    expect(palindromeParser.parse("aba")).toEqual("aba")
    expect(palindromeParser.parse("abba")).toEqual("abba")
    expect(palindromeParser.parse("racecar")).toEqual("racecar")
    expect(palindromeParser.parse("asantalivedasadevilatnasa")).toEqual("asantalivedasadevilatnasa")
})

test("Arithmetic", async ({ page }) => {
    const expression = MathGrammar.expression
    expect(expression.parse("1")).toEqual(1)
    expect(expression.parse("1 + 2")).toEqual(3)
    expect(expression.parse("2^3+4")).toEqual(12)
    expect(expression.parse("(500 * 2 - (600 + 100 / 20)  - 95) / 3")).toEqual(100)
    expect(expression.parse("(((-100 * 2 - 50 * 2 + 300) + 9 + 1 + 10) - 5) * 2")).toEqual(30)
    expect(() => expression.parse("Alpha")).toThrowError()
})

test("Json", async ({ page, browser }) => {
    expect(JsonGrammar.json.parse("123")).toEqual(123)
    expect(JsonGrammar.json.parse("[1, 2 ,  3]")).toEqual([1, 2, 3])
    expect(JsonGrammar.json.parse('["alpha", 1e4, "beta"]')).toEqual(["alpha", 10000, "beta"])
    expect(JsonGrammar.json.parse('{"a": 1}')).toEqual({ a: 1 })
    expect(JsonGrammar.json.parse('{"a": 1, "b": 2}')).toEqual({ a: 1, b: 2 })
    expect(JsonGrammar.json.parse('{"a": 1, "b": 2, "c":["c", 3, null]}')).toEqual({ a: 1, b: 2, c: ["c", 3, null] })
    expect(JsonGrammar.json.parse('{"c": [+1e2,  "str", null, -6]}')).toEqual({ c: [100, "str", null, -6] })
    expect(JsonGrammar.json.parse(`{  "a"   :  20,   "b" : true,"c": [+1e2,  "str", null, -6]  }`))
        .toEqual({ "a": 20, "b": true, "c": [100, "str", null, -6] })
    expect(() => JsonGrammar.json.parse(`{ "alpha": true "beta": false }`)).toThrowError()
    expect(JsonGrammar.json.parse(sample1)).toEqual({
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
                            "GlossSeeAlso": [
                                "GML",
                                "XML"
                            ]
                        },
                        "GlossSee": "markup"
                    }
                }
            }
        }
    })
    let sample2Object
    expect(sample2Object = JsonGrammar.json.parse(sample2)).toBeDefined()
    expect(sample2Object[0]).toMatchObject({
        gender: "male",
        email: "gomezrocha@verbus.com"
    })
    expect(sample2Object[2]).toMatchObject({
        isActive: true,
        age: 30
    })
    expect(sample2Object[sample2Object.length - 1]).toMatchObject({
        name: "Soto Chase",
        company: "MONDICIL"
    })
})

test("Json large", async ({ page, browser }) => {
    const obj = await page.evaluate(async () => {
        // The following file must be available, otherwise the test will fail
        const response = await fetch("http://127.0.0.1:3000/sample3.json")
        const result = await response.json()
        return result
    })
    expect(obj["abc"][0]["_id"]).toEqual("5573629c585502b20ad43643")
    expect(obj["abc"][obj["abc"].length - 1]["_id"]).toEqual("5573629dab3dfaad7b3e10cd")
})
