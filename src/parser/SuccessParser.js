import Parser from "./Parser.js"
import Reply from "../Reply.js"
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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return strict ? other instanceof SuccessParser : super.doEquals(context, other, false)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "<SUCCESS>"
    }
}
