// Reanimated eklentisi listenin EN SONUNDA olmali, aksi halde
// worklet donusumu calismaz.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
