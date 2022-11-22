const path = require('path')
// const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
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
      { test: /\.svg/, type: 'asset/inline' },
      // {
      //   test: /\.(ttf|woff|woff2|eot|svg)$/i,
      //   use: [
      //     {
      //       loader: 'url-loader',
      //       options: {
      //         limit: false,
      //       },
      //     },
      //   ],
      // },
    ],
  },
}

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    console.log('development', env)
    config = {
      ...config,
      entry: env.dist !== '0' ? './src/dev.dist.js' : './src/dev.ts',
      plugins: [
        new HtmlWebpackPlugin({
          title: 'MindElixir',
          template: 'src/index.html',
        }),
      ],
    }
  }
  if (argv.mode === 'production') {
    console.log('production')
    config = {
      ...config,
      entry: {
        MindElixir: './src/index.ts',
        MindElixirLite: './src/index.lite.ts',
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
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
              },
            },
          }),
        ],
      },
    }
  }

  // plugins: [new webpack.optimize.ModuleConcatenationPlugin()], // scope hoist

  return config
}
