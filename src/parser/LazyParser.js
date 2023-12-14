import Parser from "./Parser.js"

/**
 * @template {Parser<any>} T
 * @extends Parser<ParserValue<T>>
 */
export default class LazyParser extends Parser {

    #parser
    isActualParser = false

    /** @type {T} */
    #resolvedPraser

    /** @param {() => Regexer<T>} parser */
    constructor(parser) {
        super()
        this.#parser = parser
    }

    resolve() {
        if (!this.#resolvedPraser) {
            this.#resolvedPraser = this.#parser().getParser()
        }
        return this.#resolvedPraser
    }

    unwrap(target = /** @type {Parser<any>} */(null)) {
        return [this.resolve()]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        const regexerConstructor = /** @type {ConstructorType<Regexer<typeof parsers[0]>>} */(
            this.#parser().constructor
        )
        return new LazyParser(() => new regexerConstructor(parsers[0]))
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        this.resolve()
        return this.#resolvedPraser.parse(context, position)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return this.resolve().toString(context, indent)
    }
}
