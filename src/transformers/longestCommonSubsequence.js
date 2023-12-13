/**
 * @typedef {{
*     equals: (value: any) => Boolean
* }} EqualityComparable
*/

/**
* @param {EqualityComparable[]} a
* @param {EqualityComparable[]} b
*/
export default function longestCommonSubsequence(a, b) {
    const table = new Int16Array((a.length + 1) * (b.length + 1))
    const index = (i, j) => i * (b.length + 1) + j
    let i, j
    for (i = a.length - 1; i >= 0; --i) {
        for (j = b.length - 1; j >= 0; --j) {
            table[index(i, j)] = a[i].equals(b[j])
                ? -(Math.abs(table[index(i + 1, j + 1)]) + 1)
                : Math.max(
                    Math.abs(table[index(i + 1, j)]),
                    Math.abs(table[index(i, j + 1)]),
                )
        }
    }
    i = 0
    j = 0
    let x = 0
    const longest = Math.abs(table[index(i, j)])
    const result = [new Array(longest), new Array(longest)]
    while (i < a.length && j < b.length) {
        const equals = table[index(i, j)] < 0
        if (equals) {
            result[0][x] = i
            result[1][x] = j
            ++x
            ++i
            ++j
        } else {
            let value = Math.abs(table[index(i, j)])
            if (value === Math.abs(table[index(i + 1, j)])) {
                ++i
            }
            if (value === Math.abs(table[index(i, j + 1)])) {
                ++j
            }
        }
    }
    return result
}
