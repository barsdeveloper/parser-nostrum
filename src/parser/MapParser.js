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

    unwrap() {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     */
    wrap(...parsers) {
        return new MapParser(parsers[0], this.#mapper)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @returns {Result<P>}
     */
    parse(context, position) {
        const result = this.#parser.parse(context, position)
        if (result.status) {
            result.value = this.#mapper(result.value)
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        let serializedMapper = this.#mapper.toString()
        if (serializedMapper.length > 60 || serializedMapper.includes("\n")) {
            serializedMapper = "(...) => { ... }"
        }
        return this.#parser.toString(context, indent) + ` -> map<${serializedMapper}>`
    }
}
