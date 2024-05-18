import Reply from "../Reply.js"
import Parser from "./Parser.js"

export default class FailureParser extends Parser {

    static instance = new FailureParser()

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     */
    parse(context, position, path, index) {
        return Reply.makeFailure()
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        return "<FAILURE>"
    }
}
