    // Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const isProduction = process.env.NODE_ENV == 'production';

const config = {
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'app.js',
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        open: true,
        host: 'localhost',
        historyApiFallback: true,
        hot: true, 
        compress: true,
        port: 8080,       
    },
    plugins: [       
        new MiniCssExtractPlugin({
            filename: 'app.css',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/'],
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader,'css-loader'],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            },

            // Add your rules for custom modules here
            // Learn more about loaders from https://webpack.js.org/loaders/
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
        
        
    } else {
        config.mode = 'development';
    }
    return config;
};
