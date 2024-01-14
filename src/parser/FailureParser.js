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
        context.path.push(this)
        const result = Reply.makeFailure()
        context.path.pop()
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     */
    doToString(context, indent) {
        const result = "<FAILURE>" + (
            this.isHighlighted(context)
                ? `\n${Parser.indentation.repeat(indent)}^^^^^^^^^ ${Parser.highlight}`
                : ""
        )
        return result
    }
}
