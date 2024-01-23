import RegExpParser from "./RegExpParser.js"

/** @extends {RegExpParser<RegExpExecArray>} */
export default class RegExpArrayParser extends RegExpParser {

    /** @param {RegExpExecArray} match */
    static #mapper = match => match

    /** @param {RegExp} regexp */
    constructor(regexp) {
        super(regexp, RegExpArrayParser.#mapper)
    }
}
