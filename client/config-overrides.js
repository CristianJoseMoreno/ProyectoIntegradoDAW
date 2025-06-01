const webpack = require("webpack");
const { override, addWebpackPlugin } = require("customize-cra");

module.exports = override(
  addWebpackPlugin(
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser", // Para asegurar que process.env funcione
    })
  ),
  (config) => {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      assert: require.resolve("assert"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify"),
      url: require.resolve("url"),
      util: require.resolve("util"),
      zlib: require.resolve("browserify-zlib"),
      path: require.resolve("path-browserify"),
      fs: false, // `fs` casi nunca tiene un polyfill real de navegador, suele ser mejor marcarlo como false si no es crítico.
    });
    config.resolve.fallback = fallback;
    config.plugins = (config.plugins || []).concat([
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
    ]);
    return config;
  }
);
