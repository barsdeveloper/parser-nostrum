import Parser from "./Parser.js"
import Reply from "../Reply.js"

/** @extends Parser<any> */
export default class FailureParser extends Parser {

    static instance = new FailureParser()

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        return Reply.makeFailure(position)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} highlight
     */
    doToString(context, indent, highlight) {
        return "<FAILURE>"
            + (highlight === this ? `\n${Parser.indentation.repeat(indent)}^^^^^^^^^ ${Parser.highlight}` : "")
    }
}
