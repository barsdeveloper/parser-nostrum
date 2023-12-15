import terser from "@rollup/plugin-terser"

export default [
    {
        input: 'src/Parsernostrum.js',
        output: {
            file: 'dist/parsernostrum.js',
            format: 'es'
        }
    },
    {
        input: 'src/Parsernostrum.js',
        output: {
            file: 'dist/parsernostrum.min.js',
            format: 'es'
        },
        plugins: [
            terser()
        ]
    }
]
