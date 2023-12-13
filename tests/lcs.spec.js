import { test, expect } from "@playwright/test"
import longestCommonSubsequence from "../src/transformers/longestCommonSubsequence.js"

class EqualityString {
    #value

    constructor(value) {
        this.#value = value
    }
    equals(other) {
        return this.#value === other.#value
    }
}

test("LCS 1", ({ page }) => {
    expect(longestCommonSubsequence(
        "".split("").map(c => new EqualityString(c)),
        "".split("").map(c => new EqualityString(c))
    ))
        .toEqual([[], []])
})

test("LCS 2", ({ page }) => {
    expect(longestCommonSubsequence(
        "alpha".split("").map(c => new EqualityString(c)),
        "".split("").map(c => new EqualityString(c))
    ))
        .toEqual([[], []])
})

test("LCS 3", ({ page }) => {
    expect(longestCommonSubsequence(
        "".split("").map(c => new EqualityString(c)),
        "beta".split("").map(c => new EqualityString(c))
    ))
        .toEqual([[], []])
})

test("LCS 4", ({ page }) => {
    expect(longestCommonSubsequence(
        "aabcccc".split("").map(c => new EqualityString(c)),
        "aba".split("").map(c => new EqualityString(c))
    ))
        .toEqual([[0, 2], [0, 1]])
})

test("LCS 5", ({ page }) => {
    expect(longestCommonSubsequence(
        "aabccca".split("").map(c => new EqualityString(c)),
        "abc".split("").map(c => new EqualityString(c))
    ))
        .toEqual([[0, 2, 3], [0, 1, 2]])
})

test("LCS 6", ({ page }) => {
    expect(longestCommonSubsequence(
        "xxaaabbaaaa".split("").map(c => new EqualityString(c)),
        "aaaaa".split("").map(c => new EqualityString(c))
    ))
        .toEqual([[2, 3, 4, 7, 8], [0, 1, 2, 3, 4]])
})

test("LCS 7", ({ page }) => {
    expect(longestCommonSubsequence(
        "stone".split("").map(c => new EqualityString(c)),
        "longest".split("").map(c => new EqualityString(c))
    ))
        .toEqual([[2, 3, 4], [1, 2, 4]])
})
