import Reply from "../Reply.js"

/** @template T */
export default class Parser {

    static indentation = "    "
    static highlight = "Last valid parser"

    /** @type {(new (...args: any) => Parser) & typeof Parser} */
    Self

    /**
     * @param {String} target
     * @param {String} value
     */
    static appendBeforeHighlight(target, value) {
        if (target.endsWith(Parser.highlight)) {
            target = target.replace(/(?=(?:\n|^).+$)/, value)
        } else {
            target += value
        }
        return target
    }

    /** @param {String} value */
    static lastRowLength(value, firstRowPadding = 0) {
        // This regex always matches and group 2 (content of the last row) is always there
        const match = value.match(/(?:\n|(^))([^\n]*)$/)
        // Group 1 tells wheter or not it matched the first row (last row is also first row)
        const additional = match[1] !== undefined ? firstRowPadding : 0
        return match[2].length + additional
    }

    /**
     * @param {Context} context
     * @param {PathNode} path
     */
    isHighlighted(context, path) {
        if (context.highlighted instanceof Parser) {
            return context.highlighted === this
        }
        if (!context.highlighted || !path) {
            return false
        }
        let a, prevA, b, prevB
        loop:
        for (
            a = path,
            b = /** @type {PathNode} */(context.highlighted);
            a && b;
            prevA = a, a = a.parent,
            prevB = b, b = b.parent
        ) {
            if (a.parser !== b.parser || a.index !== b.index) {
                if (!prevA || !prevB) {
                    return false // Starting nodes did not match
                }
                // Try to speculatevely walk the path in reverse to find matching nodes
                let nextA
                let nextB
                for (
                    nextA = a, nextB = b;
                    nextA || nextB;
                    nextA = nextA?.parent, nextB = nextB?.parent
                ) {
                    const aMatches = nextA?.parser === prevA.parser
                    const bMatches = nextB?.parser === prevB.parser
                    if (aMatches || bMatches) {
                        if (aMatches) {
                            prevA = nextA
                        }
                        if (bMatches) {
                            prevB = nextB
                        }
                        a = prevA
                        b = prevB
                        continue loop
                    }
                }
                return false
            }
        }
        return true
    }

    /** @param {PathNode?} path */
    isVisited(path) {
        if (!path) {
            return false
        }
        for (path = path.parent; path != null; path = path.parent) {
            if (path.parser === this) {
                return true
            }
        }
        return false
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @returns {Result<T>}
     */
    parse(context, position, path) {
        return null
    }

    /** @param {PathNode} path */
    toString(context = Reply.makeContext(null, ""), indent = 0, path = null) {
        if (this.isVisited(path)) {
            return "<...>" // Recursive parser
        }
        const result = this.doToString(context, indent, path)
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        return `${this.constructor.name} does not implement toString()`
    }
}
