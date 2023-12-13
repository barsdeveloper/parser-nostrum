import LazyParser from "../parser/LazyParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"
import Parser from "../parser/Parser.js"

/** @extends {ParentChildTransformer<[LazyParser], [Parser]>} */
export default class RemoveLazyTransformer extends ParentChildTransformer {

    constructor() {
        super([LazyParser])
    }

    /**
     * @protected
     * @param {Context} context
     * @param {LazyParser<any>} parent
     * @returns {Parser<any>?}
     */
    doTransformParent(context, parent) {
        let children = parent.unwrap()
        return children[0]
    }
}
