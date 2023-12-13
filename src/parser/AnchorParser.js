import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @readonly
 * @enum {String}
 */
export const AnchorType = {
    LINE_START: "^",
    LINE_END: "$",
    WORD_BOUNDARY: "\\b",
}

/**
 * @template {AnchorType} T
 * @extends {Parser<"">}
 */
export default class AnchorParser extends Parser {

    static isTerminal = true

    #type

    /** @param {T} type */
    constructor(type) {
        super()
        this.#type = type
    }

    /** @protected */
    doMatchesEmpty() {
        return true
    }

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
        let status = false
        switch (this.#type) {
            case AnchorType.LINE_START:
                status = position === 0 || context.input[position - 1] === "\n"
                break
            case AnchorType.LINE_END:
                status = position === context.input.length || context.input[position] === "\n"
                break
        }
        return status ? Reply.makeSuccess(position, "") : Reply.makeFailure(position)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof AnchorParser && this.#type === other.#type
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return this.#type
    }
}
