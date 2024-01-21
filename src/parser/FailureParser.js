import Parser from "./Parser.js"
import Reply from "../Reply.js"

/** @extends Parser<any> */
export default class FailureParser extends Parser {

    static instance = new FailureParser()

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        return Reply.makeFailure()
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const result = "<FAILURE>" + (
            this.isHighlighted(context, path)
                ? `\n${Parser.indentation.repeat(indent)}^^^^^^^^^ ${Parser.highlight}`
                : ""
        )
        return result
    }
}
