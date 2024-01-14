import Parser from "../parser/Parser.js"
import Parsernostrum from "../Parsernostrum.js"

const P = Parsernostrum

export default class JsonGrammar {

    static #null = P.str("null").map(() => null)
    static #true = P.str("true").map(() => true)
    static #false = P.str("false").map(() => false)
    static #string = P.doubleQuotedString
    static #number = P.numberExponential
    /** @type {Parsernostrum<Parser<any[]>>} */
    static #array = P.seq(
        P.reg(/\[\s*/),
        P.lazy(() => this.json).sepBy(P.reg(/\s*,\s*/)),
        P.reg(/\s*\]/)
    ).map(([_0, values, _2]) => values)
    /** @type {Parsernostrum<Parser<Object>>} */
    static #object = P.seq(
        P.reg(/\{\s*/),
        P.seq(
            this.#string,
            P.reg(/\s*:\s*/),
            P.lazy(() => this.json),
        )
            .map(([k, _1, v]) => ({ [k]: v }))
            .sepBy(P.reg(/\s*,\s*/))
            .map(v => v.reduce((acc, cur) => ({ ...acc, ...cur }), ({}))),
        P.reg(/\s*}/)
    ).map(([_0, object, _2]) => object)

    static json = P.alt(
        this.#string,
        this.#number,
        this.#object,
        this.#array,
        this.#true,
        this.#false,
        this.#null,
    )

}
