/**
 * @template Value
 * @typedef {{
 *     status: Boolean,
 *     value: Value,
 *     position: Number,
 * }} Result
 */

import PairMap from "./utility/PairMap.js"

export default class Reply {

    /**
     * @template Value
     * @param {Number} position
     * @param {Value} value
     */
    static makeSuccess(position, value) {
        return /** @type {Result<Value>} */({
            status: true,
            value: value,
            position: position,
        })
    }

    /**
     * @template Value
     * @param {Number} position
     */
    static makeFailure(position) {
        return /** @type {Result<Value>} */({
            status: false,
            value: null,
            position: position,
        })
    }

    /** @param {Regexer<Parser<any>>} regexer */
    static makeContext(regexer = null, input = "") {
        return /** @type {Context} */({
            regexer: regexer,
            input: input,
            equals: new PairMap(),
            visited: new Map(),
        })
    }
}
