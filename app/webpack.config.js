const webpack = require('webpack');
const WebpackModules = require('webpack-modules');
const sveltePreprocess = require('svelte-preprocess');
const path = require('path');
const config = require('sapper/config/webpack.js');
const pkg = require('./package.json');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

const alias = { svelte: path.resolve('node_modules', 'svelte') };
const extensions = ['.mjs', '.js', '.ts', '.json', '.svelte', '.html'];
const mainFields = ['svelte', 'module', 'browser', 'main'];
const fileLoaderRule = {
  test: /\.(png|jpe?g|gif)$/i,
  use: ['file-loader'],
};

module.exports = {
  client: {
    entry: { main: config.client.entry().main.replace(/\.js$/, '.ts') },
    output: config.client.output(),
    resolve: { alias, extensions, mainFields },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
        },
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: 'svelte-loader',
            options: {
              dev,
              hydratable: true,
              preprocess: sveltePreprocess(),
              hotReload: false, // pending https://github.com/sveltejs/svelte/issues/2377
            },
          },
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            'style-loader',
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  includePaths: ['./src/theme', './node_modules'],
                },
              },
            },
          ],
        },
        fileLoaderRule,
      ],
    },
    mode,
    plugins: [
      // pending https://github.com/sveltejs/svelte/issues/2377
      // dev && new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[name].[id].css',
      }),
      new OptimizeCssAssetsPlugin({
        assetNameRegExp: /\.css$/g,
        cssProcessor: require('cssnano'),
        cssProcessorPluginOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
        canPrint: true,
      }),
    ].filter(Boolean),
    devtool: dev && 'inline-source-map',
  },

  server: {
    entry: { server: config.server.entry().server.replace(/\.js$/, '.ts') },
    output: config.server.output(),
    target: 'node',
    resolve: { alias, extensions, mainFields },
    externals: Object.keys(pkg.dependencies).concat('encoding'),
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
        },
        {
          test: /\.(svelte|html)$/,
          use: {
            loader: 'svelte-loader',
            options: {
              css: false,
              generate: 'ssr',
              hydratable: true,
              preprocess: sveltePreprocess(),
              dev,
            },
          },
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            'style-loader',
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  includePaths: ['./src/theme', './node_modules'],
                },
              },
            },
          ],
        },
        fileLoaderRule,
      ],
    },
    mode,
    plugins: [
      new WebpackModules(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[name].[id].css',
      }),
      new OptimizeCssAssetsPlugin({
        assetNameRegExp: /\.css$/g,
        cssProcessor: require('cssnano'),
        cssProcessorPluginOptions: {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
        canPrint: true,
      }),
    ],
    performance: {
      hints: false, // it doesn't matter if server.js is large
    },
  },

  serviceworker: {
    entry: {
      'service-worker': config.serviceworker.entry()['service-worker'].replace(/\.js$/, '.ts'),
    },
    output: config.serviceworker.output(),
    resolve: { extensions: ['.mjs', '.js', '.ts', '.json'] },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
        },
      ],
    },
    mode,
  },
};
