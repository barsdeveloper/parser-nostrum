import Reply from "../Reply.js"

/** @template T */
export default class Parser {

    static indentation = "    "
    static highlight = "Last valid parser"

    /** @protected */
    predicate = v => this === v || v instanceof Function && this instanceof v

    /** @type {(new (...args: any) => Parser) & typeof Parser} */
    Self

    /**
     * @param {Result<any>} a
     * @param {Result<any>} b
     */
    static mergeResults(a, b) {
        if (!b) {
            return a
        }
        return /** @type {typeof a} */({
            status: a.status,
            position: a.position,
            value: a.value,
        })
    }

    constructor() {
        // @ts-expect-error
        this.Self = this.constructor
    }


    unwrap() {
        return /** @type {Parser<T>[]} */([])
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     * @returns {Parser<any>}
     */
    wrap(...parsers) {
        return null
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @returns {Result<T> | Result<Parser>}
     */
    parse(context, position) {
        return null
    }

    /** @param {Parser<any>} highlight */
    toString(context = Reply.makeContext(null, ""), indent = 0, highlight = null) {
        if (context.visited.has(this)) {
            return "<...>" // Recursive parser
        }
        context.visited.set(this, null)
        return this.doToString(context, indent, highlight)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} highlight
     */
    doToString(context, indent, highlight) {
        return `${this.constructor.name} does not implement toString()`
    }
}
