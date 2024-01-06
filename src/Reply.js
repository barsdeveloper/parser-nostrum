export default class Reply {

    /**
     * @template T
     * @param {Number} position
     * @param {T} value
     * @returns {Result<T>}
     */
    static makeSuccess(position, value) {
        return {
            status: true,
            value: value,
            position: position,
        }
    }

    /**
     * @param {Number} position
     * @param {Parser<any>} parser
     * @returns {Result<Parser<any>>}
     */
    static makeFailure(position, parser = null) {
        return {
            status: false,
            value: parser,
            position: position,
        }
    }

    /** @param {Parsernostrum<Parser<any>>} parsernostrum */
    static makeContext(parsernostrum = null, input = "") {
        return /** @type {Context} */({
            parsernostrum: parsernostrum,
            input: input,
            visited: new Map(),
        })
    }
}
