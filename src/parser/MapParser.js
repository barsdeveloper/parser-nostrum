import Parser from "./Parser.js"
import RegExpParser from "./RegExpParser.js"

/**
 * @template {Parser} T
 * @template P
 */
export default class MapParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #mapper
    get mapper() {
        return this.#mapper
    }

    /**
     * @param {T} parser
     * @param {(v: ParserValue<P>) => P} mapper
     */
    constructor(parser, mapper) {
        super()
        this.#parser = parser
        this.#mapper = mapper
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @returns {Result<P>}
     */
    parse(context, position, path) {
        const result = this.#parser.parse(context, position, { parent: path, parser: this.#parser, index: 0 })
        if (result.status) {
            result.value = this.#mapper(result.value)
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
        const childrenPath = { parent: path, parser: this.#parser, index: 0 }
        if (this.isHighlighted(context, path)) {
            context.highlighted = context.highlighted instanceof Parser ? this.#parser : childrenPath
        }
        let result = this.#parser.toString(context, indent, childrenPath)
        if (this.#parser instanceof RegExpParser) {
            if (Object.values(RegExpParser.common).includes(this.#parser.regexp)) {
                if (
                    this.#parser.regexp === RegExpParser.common.numberInteger
                    && this.#mapper === /** @type {(v: any) => BigInt} */(BigInt)
                ) {
                    return "P.numberBigInteger"
                }
                return result
            }
        }
        let serializedMapper = this.#mapper.toString()
        if (serializedMapper.length > 60 || serializedMapper.includes("\n")) {
            serializedMapper = "(...) => { ... }"
        }
        serializedMapper = ` -> map<${serializedMapper}>`
        result = Parser.appendBeforeHighlight(result, serializedMapper)
        return result
    }
}
