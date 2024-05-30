import RegExpParser from "./RegExpParser.js"

/** @extends {RegExpParser<String>} */
export default class RegExpValueParser extends RegExpParser {

    /** @param {RegExp} regexp */
    constructor(regexp, group = 0) {
        super(regexp, match => match[group])
    }
}
