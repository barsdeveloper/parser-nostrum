import Reply from "../Reply.js"
import Parser from "./Parser.js"
import StringParser from "./StringParser.js"
import SuccessParser from "./SuccessParser.js"

/** @template {Parser[]} T */
export default class AlternativeParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {T} parsers */
    constructor(...parsers) {
        super()
        this.#parsers = parsers
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index)
        const result = Reply.makeSuccess(0, /** @type {ParserValue<T>} */(""))
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, position, path, i)
            if (outcome.bestPosition > result.bestPosition) {
                result.bestParser = outcome.bestParser
                result.bestPosition = outcome.bestPosition
            }
            if (outcome.status) {
                result.value = outcome.value
                result.position = outcome.position
                return result
            }
        }
        result.status = false
        result.value = null
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        // Short syntax for optional parser
        if (this.#parsers.length === 2 && this.#parsers[1] instanceof SuccessParser) {
            let result = this.#parsers[0].toString(context, indentation, path, 0)
            if (!(this.#parsers[0] instanceof StringParser)) {
                result = "<" + result + ">"
            }
            result += "?"
            return result
        }
        const deeperIndentation = indentation + Parser.indentation
        let result = "ALT<\n"
            + deeperIndentation
            + this.#parsers
                .map((parser, i) => parser.toString(
                    context,
                    deeperIndentation + " ".repeat(i === 0 ? 0 : Parser.indentation.length - 2),
                    path,
                    i,
                ))
                .join("\n" + deeperIndentation + "| ")
            + "\n" + indentation + ">"
        return result
    }
}
