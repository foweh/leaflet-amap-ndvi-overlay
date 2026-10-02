/**
 * WGS84 -> GCJ02（把 WGS84 的经纬度/bbox 转成高德底图用的 GCJ02，叠加才不偏）
 *
 * 浏览器：<script src="coord.js"></script> 后 window.Coord
 * Node  ：const Coord = require('./coord.js')
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Coord = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const PI = 3.1415926535897932384626;
  const A = 6378245.0;
  const EE = 0.00669342162296594323;

  function tLat(x, y) {
    let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    r += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
    r += (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3;
    r += (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3;
    return r;
  }
  function tLng(x, y) {
    let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    r += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
    r += (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3;
    r += (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3;
    return r;
  }

  function outOfChina(lng, lat) {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
  }

  /** WGS84 经纬度 -> GCJ02 [lng, lat] */
  function wgs84ToGcj02(lng, lat) {
    if (outOfChina(lng, lat)) return [lng, lat];
    let dLat = tLat(lng - 105, lat - 35);
    let dLng = tLng(lng - 105, lat - 35);
    const radLat = lat / 180 * PI;
    let magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
    dLng = (dLng * 180) / (A / sqrtMagic * Math.cos(radLat) * PI);
    return [lng + dLng, lat + dLat];
  }

  /**
   * bbox WGS84 -> Leaflet 用的 GCJ02 bounds
   * @param {{minLng,minLat,maxLng,maxLat}} b WGS84 bbox
   * @returns [[minLat,minLng],[maxLat,maxLng]]（GCJ02，South-West / North-East）
   */
  function wgs84BoundsToGcj02Leaflet(b) {
    const sw = wgs84ToGcj02(b.minLng, b.minLat);
    const ne = wgs84ToGcj02(b.maxLng, b.maxLat);
    return [[sw[1], sw[0]], [ne[1], ne[0]]];
  }
  /** bbox WGS84 -> Leaflet bounds（不转换，用于对比偏移） */
  function wgs84BoundsToLeaflet(b) {
    return [[b.minLat, b.minLng], [b.maxLat, b.maxLng]];
  }

  return { wgs84ToGcj02, outOfChina, wgs84BoundsToGcj02Leaflet, wgs84BoundsToLeaflet };
});
