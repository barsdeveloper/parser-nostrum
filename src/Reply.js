export default class Reply {

    /**
     * @template T
     * @param {Number} position
     * @param {T} value
     * @returns {Result<T>}
     */
    static makeSuccess(position, value, parser) {
        return {
            status: true,
            value: value,
            position: position,
            parser: parser,
        }
    }

    /**
     * @param {Parser<any>} parser
     * @returns {Result<Parser<any>>}
     */
    static makeFailure(position = 0, parser = null) {
        return {
            status: false,
            value: null,
            position: position,
            parser: parser,
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
