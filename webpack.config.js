module.exports = {
  entry: [
    'babel-polyfill',
    './index.js'
  ],
  module: {
    rules: [
      {
        exclude: /node_modules/,
        loader: 'babel-loader',
        test: /\.js$/
      }
    ]
  },
  output: {
    filename: 'inline.db.js',
    library: 'inlinedb',
    libraryTarget: 'umd',
    path: `${__dirname}/dist`
  },
  target: 'node'
};
