import Reply from "../Reply.js"
import Parser from "./Parser.js"

export default class SuccessParser extends Parser {

    static instance = new SuccessParser()

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        return Reply.makeSuccess(position, "", path, 0)
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
