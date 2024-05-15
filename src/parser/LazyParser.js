import Parser from "./Parser.js"

/** @template {Parser} T */
export default class LazyParser extends Parser {

    #parser

    /** @type {T} */
    #resolvedPraser

    /** @param {() => Parsernostrum<T>} parser */
    constructor(parser) {
        super()
        this.#parser = parser
    }

    /** @returns {Parser} */
    getConcreteParser() {
        return this.resolve().getConcreteParser()
    }

    /**
     * @param {PathNode} path
     * @param {Number} index
     */
    makePath(path, index) {
        return path
    }

    /**
     * @param {Context} context
     * @param {PathNode} path
     */
    isHighlighted(context, path) {
        if (super.isHighlighted(context, path)) {
            // If LazyParser is highlighted, then highlight its child
            const childrenPath = { parent: path, parser: this.#resolvedPraser, index: 0 }
            context.highlighted = context.highlighted instanceof Parser ? this.#resolvedPraser : childrenPath
        }
        return false
    }

    resolve() {
        if (!this.#resolvedPraser) {
            this.#resolvedPraser = this.#parser().getParser()
        }
        return this.#resolvedPraser
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     */
    parse(context, position, path, index) {
        this.resolve()
        this.parse = this.#resolvedPraser.parse.bind(this.#resolvedPraser)
        return this.parse(context, position, path, index)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        this.resolve()
        this.doToString = this.#resolvedPraser.toString.bind(this.#resolvedPraser)
        return this.doToString(context, indentation, path, index)
    }
}
