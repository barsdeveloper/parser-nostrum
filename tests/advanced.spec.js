import { test, expect } from "@playwright/test"
import httpServer from "http-server"
import JsonGrammar from "../src/grammars/JsonGrammar.js"
import MathGrammar from "../src/grammars/MathGrammar.js"
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
