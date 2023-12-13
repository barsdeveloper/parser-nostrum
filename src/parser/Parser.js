import Reply from "../Reply.js"

/** @template T */
export default class Parser {

    /**
     * @readonly
     * @enum {Number}
     */
    static TerminalType = {
        STARTING: -1,
        ONLY: 0,
        ENDING: 1,
    }

    static isTerminal = false
    static indentation = "    "

    /** @type {Boolean?} */
    #matchesEmptyFlag

    /** @type {{[k: TerminalType]: Parser<any>[]}} */
    #starterList = {}

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

    matchesEmpty() {
        if (this.#matchesEmptyFlag === undefined) {
            return this.#matchesEmptyFlag = this.doMatchesEmpty()
        }
        return this.#matchesEmptyFlag
    }

    /**
     * @protected
     * @returns {Boolean}
     */
    doMatchesEmpty() {
        const children = this.unwrap()
        if (children.length === 1) {
            return children[0].doMatchesEmpty()
        }
        return false
    }

    /**
     * List of starting terminal parsers
     * @param {TerminalType} type
     * @param {Parser<any>[]} additionalTerminals Additional non terminal parsers that will be considered part of the starter list when encounter even though non terminals
     */
    terminalList(type, additionalTerminals = [], context = Reply.makeContext(null, "")) {
        if (context.visited.has(this)) {
            return [] // Break the infinite recursion, this.#starterList[type] will be set elsewhere in the call stack
        }
        const hasNonTerminals = additionalTerminals.some(v => !/** @type {typeof Parser} */(v.constructor).isTerminal)
        if (this.#starterList[type] && !hasNonTerminals) {
            // Memoized version
            return this.#starterList[type]
        }
        context.visited.set(this, null)
        if (additionalTerminals.includes(this) && !this.matchesEmpty()) {
            return [this]
        }
        this.#starterList[type] = this.doTerminalList(type, additionalTerminals, context)
        let result = this.#starterList[type]
        if (hasNonTerminals) {
            // Clear from the memoized starter list values that would not find their way in otherwise
            this.#starterList[type] = this.#starterList[type]
                .filter(v => /** @type {typeof Parser} */(v.constructor).isTerminal)
        }
        if (additionalTerminals.includes(this) && !/** @type {typeof Parser} */(this.constructor).isTerminal) {
            result.unshift(this)
        }
        return result
    }

    /**
     * @protected
     * @param {TerminalType} type
     * @param {Parser<any>[]} additionalTerminals
     * @param {Context} context
     */
    doTerminalList(type, additionalTerminals, context) {
        let unwrapped = this.unwrap()
        return unwrapped?.length === 1
            ? unwrapped[0].terminalList(type, additionalTerminals, context)
            : []
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
     * @param {Parser<any>?} target Unwrap the Alternative's branch containing this parser
     * @returns {Parser<any>}
     */
    actualParser(traverse = [], opaque = [], target = null) {
        let isTraversable = (!this.isActualParser || traverse.some(this.predicate)) && !opaque.some(this.predicate)
        let unwrapped = isTraversable ? this.unwrap(target) : undefined
        isTraversable &&= unwrapped?.length === 1
        return isTraversable ? unwrapped[0].actualParser(traverse, opaque, target) : this
    }

    /**
     * @param {Parser<any>?} other
     * @param {(Parser<any> | ConstructorType<Parser<any>>)[]} traverse List of types to ignore and traverse even though they have isActualParser = true
     * @param {(Parser<any> | ConstructorType<Parser<any>>)[]} opaque List of types to consider actual parser even though they have isActualParser = false
     * @param {Parser<any>?} target Unwrap the Alternative's branch containing this parser
     * @returns {Parser<any>}
     */
    withActualParser(other, traverse = [], opaque = [], target = null) {
        let isTraversable = (!this.isActualParser || traverse.some(this.predicate)) && !opaque.some(this.predicate)
        let unwrapped = isTraversable ? this.unwrap(target) : undefined
        isTraversable &&= unwrapped?.length === 1
        return isTraversable ? this.wrap(unwrapped[0].withActualParser(other, traverse, opaque, target)) : other
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
