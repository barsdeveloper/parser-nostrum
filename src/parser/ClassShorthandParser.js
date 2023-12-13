import Parser from "./Parser.js"
import RegExpParser from "./RegExpParser.js"

/**
 * @readonly
 * @enum {RegExp}
 */
export const ClassMetacharacter = {
    d: /\d/,
    D: /\D/,
    s: /\s/,
    S: /\S/,
    w: /\w/,
    W: /\W/,
}

/**
 * @template {keyof typeof ClassMetacharacter} T
 * @extends RegExpParser<0>
 */
export default class ClassShorthandParser extends RegExpParser {

    #char

    /** @param {T} char */
    constructor(char) {
        if (!ClassMetacharacter[char]) {
            throw new Error("Unexpected metacharacter")
        }
        super(ClassMetacharacter[char], 0)
        this.#char = char
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof ClassShorthandParser && this.#char == other.#char
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "\\" + this.#char
    }
}
