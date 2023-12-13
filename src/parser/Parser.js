import Reply from "../Reply.js"

/** @template T */
export default class Parser {

    static indentation = "    "

    /** @protected */
    predicate = v => this === v || v instanceof Function && this instanceof v

    /** Calling parse() can make it change the overall parsing outcome */
    isActualParser = true

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


    unwrap(target = /** @type {Parser<any>} */(null)) {
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
     * @returns {Result<T>}
     */
    parse(context, position) {
        return null
    }

    /**
     * @param {ConstructorType<Parser<any>>[]} traverse List of types to ignore and traverse even though they have isActualParser = true
     * @param {ConstructorType<Parser<any>>[]} opaque List of types to consider actual parser even though they have isActualParser = false
     * @returns {Parser<any>}
     */
    actualParser(traverse = [], opaque = []) {
        let isTraversable = (!this.isActualParser || traverse.some(this.predicate)) && !opaque.some(this.predicate)
        let unwrapped = isTraversable ? this.unwrap() : undefined
        isTraversable &&= unwrapped?.length === 1
        return isTraversable ? unwrapped[0].actualParser(traverse, opaque) : this
    }

    /**
     * @param {Parser<any>?} other
     * @param {(Parser<any> | ConstructorType<Parser<any>>)[]} traverse List of types to ignore and traverse even though they have isActualParser = true
     * @param {(Parser<any> | ConstructorType<Parser<any>>)[]} opaque List of types to consider actual parser even though they have isActualParser = false
     * @returns {Parser<any>}
     */
    withActualParser(other, traverse = [], opaque = []) {
        let isTraversable = (!this.isActualParser || traverse.some(this.predicate)) && !opaque.some(this.predicate)
        let unwrapped = isTraversable ? this.unwrap() : undefined
        isTraversable &&= unwrapped?.length === 1
        return isTraversable ? this.wrap(unwrapped[0].withActualParser(other, traverse, opaque)) : other
    }

    /**
     * @param {Context} context
     * @param {Parser<any>} rhs
     * @param {Boolean} strict
     */
    equals(context, rhs, strict) {
        let lhs = /** @type {Parser<any>} */(this)
        if (lhs === rhs) {
            return true
        }
        if (!strict) {
            lhs = this.actualParser()
            rhs = rhs.actualParser()
        }
        if (
            rhs instanceof lhs.constructor && !(lhs instanceof rhs.constructor)
            // @ts-expect-error
            || rhs.resolve && !lhs.resolve
        ) {
            // Take advantage of polymorphism or compare a lazy against a non lazy (not the other way around)
            const temp = lhs
            lhs = rhs
            rhs = temp
        }
        let memoized = context.equals.get(lhs, rhs)
        if (memoized !== undefined) {
            return memoized
        } else if (memoized === undefined) {
            context.equals.set(lhs, rhs, true)
            memoized = lhs.doEquals(context, rhs, strict)
            context.equals.set(lhs, rhs, memoized)
        }
        return memoized
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return false
    }

    toString(context = Reply.makeContext(null, ""), indent = 0) {
        if (context.visited.has(this)) {
            return "<...>" // Recursive parser
        }
        context.visited.set(this, null)
        return this.doToString(context, indent)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return `${this.constructor.name} does not implement toString()`
    }
}
