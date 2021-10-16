const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
//   .BundleAnalyzerPlugin

let config = {
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'ts-loader',
        },
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(ttf|woff|woff2|eot|svg)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
    ],
  },
}

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    console.log('development')
    config = {
      ...config,
      entry: './src/dev.ts',
      plugins: [
        new HtmlWebpackPlugin({
          title: 'MindElixir',
          template: 'src/index.html',
        }),
      ],
    }
  }
  if (argv.mode === 'production' && !env.lite) {
    console.log('production')
    config = {
      ...config,
      entry: {
        MindElixir: './src/index.ts',
        MindElixirLite: './src/index.lite.ts',
        painter: './painter/index.js',
        example1: './src/exampleData/1.js',
        example2: './src/exampleData/2.js',
      },
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: '[name]',
        libraryTarget: 'umd',
        libraryExport: 'default',
      },
      // plugins: [
      //   new BundleAnalyzerPlugin()
      // ],
      optimization: {
        minimizer: [new UglifyJsPlugin({
          uglifyOptions: {
            compress: {
              drop_console: true,
            },
          },
        })],
      },
    }
  }
  if (argv.mode === 'production' && env.lite) {
    console.log('lite')
    config = {
      ...config,
      entry: './src/core-lite.js',
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'mind-elixir-lite.js',
        library: 'MindElixir',
        libraryTarget: 'umd',
      },
      plugins: [new webpack.optimize.ModuleConcatenationPlugin()], // scope hoist
    }
  }

  return config
}
