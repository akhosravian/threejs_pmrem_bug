const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'none',
    module: {
        rules: [
            {
                use: "imports-loader?THREE=three"
            },
            {
                test: /\.(gltf|jpg|glb)$/,
                use: [
                    'file-loader'
                ]
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            {from:'src/index.html'},
            {from:'files/glazed_patio.exr'},
            {from:'files/table.glb'},
            {from:'files/favicon.ico'}
        ])
    ]
};
