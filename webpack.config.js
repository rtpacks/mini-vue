const path = require('path');

module.exports = {
  mode: 'development',
  devtool: false,
  // devtool: 'inline-cheap-source-map',
  entry: './src/index.js', /* 入口文件 */
  output: {
    filename: 'mini-vue.js', /* 输出的文件名 */
    path: path.resolve(__dirname, 'dist'), /* 输出的路径 */
    clean: true,
    // library: 'MiniVue',
    // libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['.js'] /* 配置文件后缀 */
  },
  devServer: {
    hot: true,  // 打开热更新开关
    contentBase:path.resolve(__dirname,'src'),
    publicPath: '/dist',
    watchContentBase: true,
    historyApiFallback: true,
    compress: true
  },
};