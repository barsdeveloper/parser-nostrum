import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {Parser<any>} T
 * @template {(v: ParserValue<T>, input: String, position: Number) => Parsernostrum<Parser<any>>} C
 * @extends Parser<ReturnType<C>>
 */
export default class ChainedParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #fn

    /**
     * @param {T} parser
     * @param {C} chained
     */
    constructor(parser, chained) {
        super()
        this.#parser = parser
        this.#fn = chained
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        const outcome = this.#parser.parse(context, position, { parent: path, parser: this.#parser, index: 0 })
        if (!outcome.status) {
            return outcome
        }
        const result = this.#fn(outcome.value, context.input, outcome.position)
            .getParser()
            .parse(context, outcome.position)
        if (outcome.bestPosition > result.bestPosition) {
            result.bestParser = outcome.bestParser
            result.bestPosition = outcome.bestPosition
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const serialized = "chained<f()>"
        let result = this.#parser.toString(context, indent, { parent: path, parser: this.#parser, index: 0 })
        if (this.isHighlighted(context, path)) {
            result +=
                " => "
                + serialized
                + "\n"
                // Group 1 is the portion between the last newline and end or the whole text
                + Parser.indentation.repeat(indent)
                + " ".repeat(result.match(/(?:\n|^)([^\n]+)$/)?.[1].length + 4)
                + "^".repeat(serialized.length)
                + " "
                + Parser.highlight
        } else {
            result = Parser.appendBeforeHighlight(result, " => " + serialized)
        }
        return result
    }
}
