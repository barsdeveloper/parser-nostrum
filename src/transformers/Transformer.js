import CapturingGroupParser from "../parser/CapturingGroupParser.js"
import Regexer from "../Regexer.js"
import Reply from "../Reply.js"

export default class Transformer {

    #next = null

    /** @type {ConstructorType<Parser<any>>[]} */
    traverse = [CapturingGroupParser]

    /** @type {ConstructorType<Parser<any>>[]} */
    opaque = []

    constructor() {
    }

    chain(transformer) {
        this.#next = transformer
        return transformer
    }

    /**
     * @template {Parser<any>} T
     * @param {Regexer<T> | T} grammar
     * @return {Regexer<T>}
     */
    run(grammar, context = Reply.makeContext(grammar instanceof Regexer ? grammar : undefined)) {
        const regexer = grammar instanceof Regexer ? grammar : context.regexer
        const RegexerType = /** @type {typeof Regexer} */(regexer.constructor)
        const parser = grammar instanceof Regexer ? grammar.getParser() : grammar
        let transformed = this.transform(context, parser)
        if (transformed === parser) {
            return grammar instanceof Regexer ? grammar : new RegexerType(grammar)
        }
        return new RegexerType(/** @type {T} */(transformed))
    }

    /**
     * @protected
     * @template {Parser<any>} T
     * @param {Context} context
     * @param {T} parser
     * @return {T}
     */
    transform(context, parser) {
        const p = parser.actualParser(this.traverse, this.opaque)
        let result = /** @type {T} */(context.visited.get(p))
        if (result !== undefined) {
            return result !== p
                ? /** @type {T} */(parser.withActualParser(result, this.traverse, this.opaque))
                : parser
        }
        context.visited.set(p, p)
        result = /** @type {T} */(this.doTransform(context, p))
        if (result === p) {
            // Transformed did not change the parser
            let changed = false
            const children = p.unwrap().map(child => {
                const transformed = this.transform(context, child)
                changed ||= transformed !== child
                return transformed
            })
            if (changed) {
                result = /** @type {T} */(result.wrap(...children))
            }
        }
        if (result !== p) {
            context.visited.set(p, result)
            return /** @type {T} */(parser.withActualParser(result, this.traverse, this.opaque))
        }
        return parser
    }

    /**
     * @protected
     * @template {Parser<any>} T
     * @param {Context} context
     * @param {T} parser
     * @return {T}
     */
    doTransform(context, parser) {
        return parser
    }
}
