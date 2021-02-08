const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const distPath = path.resolve(__dirname, 'dist');
const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
    entry: './src/index.tsx',
    mode: isDev ? 'development' : 'production',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['ts-loader'],
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader?url=false'],
            },
            {
                test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
                loader: "url-loader",
                options: {
                    limit: 8192,
                },
            },
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyPlugin([
            { from: 'src/index.html' },
            { from: 'src/css/style.css', to: 'css/' },
            { from: 'src/assets/', to: 'assets/' },
            { from: 'src/scripts/', to: 'scripts/' },
        ]),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: distPath
    },
    devServer: {
        contentBase: distPath,
        compress: true,
        port: 8080,
        hot: true,
        proxy: {
            '/api': {
                target: 'http://localhost:19689',
                cookieDomainRewrite: "localhost:8080",
                changeOrigin: true
            },
            '/hub': {
                target: 'http://localhost:19689',
                cookieDomainRewrite: "localhost:8080",
                ws: true,
                changeOrigin: true
            }
        }
    },
    optimization: {
        minimize: !isDev
    }
};