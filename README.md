# Leaflet + 高德卫星图 + NDVI 叠加完整方案

## 解决什么问题
- Leaflet默认用OSM瓦片，国内要换成高德卫星图
- Sentinel-2 NDVI GeoTIFF是WGS84坐标系，高德是GCJ02火星坐标系，直接叠上去偏移500米
- 大图（1024px PNG）直接imageOverlay缩放卡顿

## 核心代码
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
</head>
<body>
  <div id="map" style="height: 100vh"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // WGS84 -> GCJ02 坐标转换（对齐高德底图必须）
    function wgs84ToGcj02(lng, lat) {
      const PI = 3.1415926535897932384626;
      const a = 6378245.0;
      const ee = 0.00669342162296594323;
      function tLat(x, y) {
        let r = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x));
        r += (20*Math.sin(6*x*PI) + 20*Math.sin(2*x*PI)) * 2/3;
        r += (20*Math.sin(y*PI) + 40*Math.sin(y/3*PI)) * 2/3;
        r += (160*Math.sin(y/12*PI) + 320*Math.sin(y*PI/30)) * 2/3;
        return r;
      }
      function tLng(x, y) {
        let r = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x));
        r += (20*Math.sin(6*x*PI) + 20*Math.sin(2*x*PI)) * 2/3;
        r += (20*Math.sin(x*PI) + 40*Math.sin(x/3*PI)) * 2/3;
        r += (150*Math.sin(x/12*PI) + 300*Math.sin(x/30*PI)) * 2/3;
        return r;
      }
      let dLat = tLat(lng-105, lat-35);
      let dLng = tLng(lng-105, lat-35);
      const radLat = lat/180*PI;
      let magic = Math.sin(radLat);
      magic = 1 - ee*magic*magic;
      const sqrtMagic = Math.sqrt(magic);
      dLat = (dLat*180) / ((a*(1-ee))/(magic*sqrtMagic)*PI);
      dLng = (dLng*180) / (a/sqrtMagic*Math.cos(radLat)*PI);
      return [lng+dLng, lat+dLat];
    }

    // 初始化地图
    const map = L.map('map').setView([43.95, 126.48], 15);

    // 高德卫星瓦片（GCJ02坐标系）
    L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
      subdomains: ['1','2','3','4'],
      maxZoom: 19
    }).addTo(map);

    // NDVI图（WGS84 bbox）
    const ndviBboxWgs84 = [43.93, 126.46, 43.97, 126.50]; // [minLat, minLng, maxLat, maxLng]
    // 转GCJ02再叠加
    const sw = wgs84ToGcj02(ndviBboxWgs84[1], ndviBboxWgs84[0]);
    const ne = wgs84ToGcj02(ndviBboxWgs84[3], ndviBboxWgs84[2]);
    L.imageOverlay('ndvi_color.png', [[sw[1], sw[0]], [ne[1], ne[0]]], {
      opacity: 0.75
    }).addTo(map);
  </script>
</body>
</html>
```

## 踩过的坑
1. **坐标系不对齐**：Sentinel-2是WGS84，高德是GCJ02，不转直接叠偏移500米
2. **bbox顺序**：GeoTIFF是[minLon, minLat, maxLon, maxLat]，Leaflet是[[minLat, minLng], [maxLat, maxLng]]，别搞反
3. **瓦片域名**：高德卫星是webst01-4，街道是webrd01-4，别搞混
4. **大图卡顿**：1024px PNG直接imageOverlay缩放会卡，切成256瓦片用L.tileLayer就丝滑了

## 许可证
MIT
