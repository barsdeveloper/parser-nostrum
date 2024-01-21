import Parser from "./Parser.js"
import Reply from "../Reply.js"
import StringParser from "./StringParser.js"
import SuccessParser from "./SuccessParser.js"

/**
 * @template {Parser<any>[]} T
 * @extends Parser<ParserValue<T>>
 */
export default class AlternativeParser extends Parser {

    static highlightRegexp = new RegExp(
        // Matches the beginning of a row containing Parser.highlight only when after the first row of an alternative
        String.raw`(?<=[^\S\n]*\| .*\n)^(?=[^\S\n]*\^+ ${Parser.highlight}(?:\n|$))`,
        "m"
    )

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
     */
    parse(context, position, path) {
        const result = Reply.makeSuccess(0, /** @type {ParserValue<T>} */(""))
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(
                context,
                position,
                { parent: path, parser: this.#parsers[i], index: i }
            )
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
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const indentation = Parser.indentation.repeat(indent)
        const deeperIndentation = Parser.indentation.repeat(indent + 1)
        if (this.#parsers.length === 2 && this.#parsers[1] instanceof SuccessParser) {
            let result = this.#parsers[0].toString(
                context,
                indent,
                { parent: path, parser: this.#parsers[0], index: 0 }
            )
            if (!(this.#parsers[0] instanceof StringParser)) {
                result = "<" + result + ">"
            }
            result += "?"
            return result
        }
        let serialized = this.#parsers
            .map((parser, index) => parser.toString(context, indent + 1, { parent: path, parser, index }))
            .join("\n" + deeperIndentation + "| ")
        if (context.highlighted) {
            serialized = serialized.replace(AlternativeParser.highlightRegexp, "  ")
        }
        let result = "ALT<\n"
            + (this.isHighlighted(context, path) ? `${indentation}^^^ ${Parser.highlight}\n` : "")
            + deeperIndentation + serialized
            + "\n" + indentation + ">"
        return result
    }
}
