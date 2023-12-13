import LookaroundParser from "../parser/LookaroundParser.js"
import MapParser from "../parser/MapParser.js"
import ParentChildTransformer from "./ParentChildTransformer.js"

/** @extends {ParentChildTransformer<[LookaroundParser, MapParser], [LookaroundParser, MapParser]>} */
export default class RemoveDiscardedMapTransformer extends ParentChildTransformer {

    constructor() {
        super([LookaroundParser, MapParser], [LookaroundParser, MapParser])
    }

    /**
     * @protected
     * @param {Context} context
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} parent
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>}
     */
    doTransformParent(context, parent, child, index, previousChild) {
        if (parent instanceof MapParser && child instanceof LookaroundParser) {
            return parent.parser.withActualParser(child, this.traverse, this.opaque)
        }
    }

    /**
     * @param {Context} context
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} parent
     * @param {LookaroundParser<Parser<any>> | MapParser<Parser<any>>} child
     * @param {Number} index
     * @param {Parser<any>} previousChild
     * @returns {Parser<any>[]}
     */
    doTransformChild(context, parent, child, index, previousChild) {
        if (parent instanceof LookaroundParser && child instanceof MapParser) {
            return [child.parser]
        }
    }
}
