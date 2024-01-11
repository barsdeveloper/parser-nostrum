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

    unwrap() {
        return [...this.#parsers]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     * @returns {AlternativeParser<T>}
     */
    wrap(...parsers) {
        // @ts-expect-error
        const result = /** @type {AlternativeParser<T>} */(new this.Self(...parsers))
        return result
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let furthest = Reply.makeFailure()
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, position)
            if (outcome.status) {
                return outcome
            }
            if (outcome.position > furthest.position) {
                furthest = outcome
            }
        }
        return furthest
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} highlight
     */
    doToString(context, indent, highlight) {
        const indentation = Parser.indentation.repeat(indent)
        const deeperIndentation = Parser.indentation.repeat(indent + 1)
        if (this.#parsers.length === 2 && this.#parsers[1] instanceof SuccessParser) {
            let result = this.#parsers[0].toString(context, indent, highlight)
            if (!(this.#parsers[0] instanceof StringParser) && !context.visited.has(this.#parsers[0])) {
                result = "<" + result + ">"
            }
            result += "?"
            return result
        }
        let serialized = this.#parsers
            .map(p => p.toString(context, indent + 1, highlight))
            .join("\n" + deeperIndentation + "| ")
        if (highlight) {
            serialized = serialized.replace(AlternativeParser.highlightRegexp, "  ")
        }
        let result = "ALT<\n"
            + (highlight === this ? `${indentation}^^^ ${Parser.highlight}\n` : "")
            + deeperIndentation + serialized
            + "\n" + indentation + ">"
        return result
    }
}
