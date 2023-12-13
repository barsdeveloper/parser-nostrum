import RegExpParser from "./RegExpParser.js"

/** @extends RegExpParser<0> */
export default class AnyCharParser extends RegExpParser {

    static isTerminal = true

    #dotAll

    /** @param {Boolean} dotAll */
    constructor(dotAll) {
        super(/./, 0)
        this.#dotAll = dotAll
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "."
    }
}
