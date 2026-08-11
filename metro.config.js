// Metro yapilandirmasi.
// WAV ses dosyalari varsayilan varlik listesinde yok, ekleniyor.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, 'wav'])];
module.exports = config;
