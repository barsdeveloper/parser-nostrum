import Parser from "./Parser.js"
import StringParser from "./StringParser.js"

/** @extends StringParser<""> */
export default class SuccessParser extends StringParser {

    static instance = new SuccessParser()

    static {
        StringParser.successParserInstance = this.instance
    }

    constructor() {
        super("")
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} highlight
     */
    doToString(context, indent, highlight) {
        return "<SUCCESS>"
            + (highlight === this ? `\n${Parser.indentation.repeat(indent)}^^^^^^^^^ ${Parser.highlight}` : "")
    }
}
