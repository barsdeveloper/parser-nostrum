import Parser from "./Parser.js"
import RegExpParser from "./RegExpParser.js"

/**
 * @template S
 * @template T
 * @extends Parser<T>
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
     * @param {Parser<S>} parser
     * @param {(v: S) => T} mapper
     */
    constructor(parser, mapper) {
        super()
        this.#parser = parser
        this.#mapper = mapper
    }

    /**
     * @param {Context} context
     * @param {PathNode} path
     */
    isHighlighted(context, path) {
        if (super.isHighlighted(context, path)) {
            // If MapParser is highlighted, then highlight its child
            const childrenPath = { parent: path, parser: this.#parser, index: 0 }
            context.highlighted = context.highlighted instanceof Parser ? this.#parser : childrenPath
        }
        return false
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index)
        // @ts-expect-error
        const result = /** @type {Result<T>} */(this.#parser.parse(context, position, path, 0))
        if (result.status) {
            // @ts-expect-error
            result.value = this.#mapper(result.value)
        }
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
        let result = this.#parser.toString(context, indentation, path, 0)
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
        result += ` -> map<${serializedMapper}>`
        return result
    }
}
