import Reply from "../Reply.js"
import Parser from "./Parser.js"

export default class SuccessParser extends Parser {

    static instance = new SuccessParser()

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index)
        return Reply.makeSuccess(position, "", path, 0)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        return "<SUCCESS>"
    }
}
