module.exports = {
  entry: [
    './index.js'
  ],
  output: {
    filename: 'inline.db.js',
    path: __dirname + '/dist',
    library: 'inlinedb',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  target: 'node'
};
