const { merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.js');
const ExtensionReloader = require('webpack-extension-reloader');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  mode: 'development',
  plugins: [
    new ExtensionReloader({
      entries: { // The entries used for the content/background scripts or extension pages
        contentScript: 'content_script',
        background: 'background',
      }
    })
  ]
});
