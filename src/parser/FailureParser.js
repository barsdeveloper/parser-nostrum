import Parser from "./Parser.js"
import Reply from "../Reply.js"

/** @extends Parser<String> */
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
     */
    doToString(context, indent = 0) {
        return "<FAILURE>"
    }
}
