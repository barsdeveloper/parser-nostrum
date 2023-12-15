# Parsernostrum

Parsernostrum is a small LL parsing combinator library for JavaScript, designed to be very simple leveraging modern JavaScript features and keeping code size to a minimum, particularly usefull in frontend contexts. It offers a set of tools to create robust and maintainable parsers with very little code.

## Getting started

```sh
npm install parsernostrum
```

Import Parsernostrum and use it to create custom parsers tailored to your specific parsing needs.

```JavaScript
import P from "parsernostrum"
```

Then you have access to the following tools:

### `str(string)`
Parses exact string literals.
```JavaScript
regexp(regexp, group)
```

### `regexp(regexp)`
Parses a regular expression and possibly returns a captured group.
```JavaScript
P.regexp(/\d+/)
```

### `regexpGroups(regexp)`
Parses a regular expression returns all its captured groups exactly as returned by the `RegExp.exec()` method.
```JavaScript
P.regexpGroups(/begin\s*(\w*)\s*(\w*)\s*end/)
```

### `seq(...parsers)`
Combines parsers sequentially.
```JavaScript
P.seq(P.str("hello"), P.str("world"))
```

### `alt(...parsers)`
Offers alternative parsers succeeds if any parser matches.
```JavaScript
P.alt(P.str("yes"), P.str("no"))
```

### `lookahead(parser)`
Checks what's ahead in the string without consuming it.
```JavaScript
P.lookahead(P.str("hello"))
```

### `lazy(parser)`
Delays parser evaluation, useful for recursive parsers.
```JavaScript
const matcheParentheses = P.seq(
    P.str("("),
    P.alt(
        P.lazy(() => matcheParentheses),
        P.regexp(/\w*/),
    ),
    P.str(")"),
)
```
[!WARNING]
LL parsers do not generally support left recursion. It is therefore important that your recursive parsers always have an actual parser as the first element (in this case P.str("("))). Otherwise the code will result in a runtime infinite recursion exception.
In general it is always possible to rewrite a grammar to remove left recursion.

### `.times(min, max)`
Matches a parser a specified number of times.
```JavaScript
myParser.times(3) // expect to have exactly three occurrences
myParser.times(1, 2) // expect to have one or two occurrences
```

### `.many()`
Matches a parser zero or more times.
```JavaScript
myParser.many()
```

### `.atLeast(n)`
Ensures a parser matches at least `n` times.
```JavaScript
myParser.atLeast(2)
```

### `.atMost(n)`
Limits a parser match to at most `n` times.
```JavaScript
myParser.atMost(5)
```

### `.opt()`
Makes a parser optional.
```JavaScript
myParser.opt()
```

### `.sepBy(separator)`
Parses a list of elements separated by a given separator.
```JavaScript
myParser.sepBy(P.regexp(/\s*,\s*/))
```

### `.skipSpace()`
Consumes whitespace following the match of myParser and returns what myParser produced.
```JavaScript
myParser.skipSpace()
```

### `.map(fn)`
Applies a function to transform the parser's result.
```JavaScript
myParser.map(n => `Number: ${n}`)
```

### `.chain(fn)`
Chains the output of one parser to another.
```JavaScript
const p = P.regexp(/[([{]/).chain(v => (
    {
        "(": P.str(")"),
        "[": P.str("]"),
        "{": P.str("}"),
    }[v].map(closingParenthesis => v + closingParenthesis)
))
```

### `.assert(fn)`
Asserts a condition on the parsed result. If the method returns false, the parser is considered failed even though the actual parser matched the input.
```JavaScript
P.numberNatural.assert(n => n % 2 == 0) // Will even numbers only
```

### `.join(value)`
Joins the results of a parser into a single string.
```JavaScript
myParser.join(", ")
```
