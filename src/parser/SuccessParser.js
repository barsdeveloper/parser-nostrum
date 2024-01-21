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
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        return "<SUCCESS>"
            + (this.isHighlighted(context, path)
                ? `\n${Parser.indentation.repeat(indent)}^^^^^^^^^ ${Parser.highlight}`
                : ""
            )
    }
}
