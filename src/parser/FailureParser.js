import Parser from "./Parser.js"
import Reply from "../Reply.js"

/** @extends Parser<String> */
export default class FailureParser extends Parser {

    static isTerminal = true
    static instance = new FailureParser()

    /**
     * @protected
     * @param {Parser<any>[]} additionalTerminals
     * @param {Context} context
     */
    doTerminalList(type, additionalTerminals, context) {
        return [this]
    }

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
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof FailureParser
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "<FAILURE>"
    }
}
