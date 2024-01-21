import Parser from "./Parser.js"

/**
 * @template {Parser<any>} T
 * @template P
 * @extends Parser<P>
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
        let serializedMapper = this.#mapper.toString()
        if (serializedMapper.length > 60 || serializedMapper.includes("\n")) {
            serializedMapper = "(...) => { ... }"
        }
        const childrenPath = { parent: path, parser: this.#parser, index: 0 }
        if (this.isHighlighted(context, path)) {
            context.highlighted = context.highlighted instanceof Parser ? this.#parser : childrenPath
        }
        let result = this.#parser.toString(context, indent, childrenPath)
        result = Parser.appendBeforeHighlight(result, ` -> map<${serializedMapper}>`)
        return result
    }
}
