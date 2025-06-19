<script setup>
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import XYZ from 'ol/source/XYZ.js';

import Zoom from 'ol/control/Zoom.js';
import ZoomSlider from 'ol/control/ZoomSlider.js';
import ZoomToExtent from 'ol/control/ZoomToExtent.js';

import ScaleLine from 'ol/control/ScaleLine.js';
import OverviewMap from 'ol/control/OverviewMap.js';
import MousePosition from 'ol/control/MousePosition.js';

// 添加缺失的导入
import { createStringXY } from 'ol/coordinate';
import { onMounted, onUnmounted } from 'vue';

// 1-定义外部参数
const props = defineProps({
  viewConf: { type: Object, default: () => ({}) },
  defLyrs: { type: Array, default: () => ['vec_c'] }
});


// 2-定义地图创建完毕的事件
const emit = defineEmits(['created']);

// 地图实例变量
let map = null;

// 3-组件挂载后创建地图
onMounted(() => {
  // 用传入的view配置覆盖默认配置
  const viewOpts = Object.assign({
    projection: 'EPSG:3857',
    center: [12758612.973162018, 3562849.0216611675],
    zoom: 17.5
  }, props.viewConf);

  const layerOptions = [
    {key: 'img_c', title: '天地图影像', option: {projection: 'EPSG:4326', url: `http://t{0-7}.tianditu.gov.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=01270f58d46fa3e4e48c1a6a5d8625fb`}},
    {key: 'vec_c', title: '天地图', option: {projection: 'EPSG:4326', url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=01270f58d46fa3e4e48c1a6a5d8625fb`}},
    {key: 'cva_c', title: '天地图注记', option: {projection: 'EPSG:4326', url: `http://t{0-7}.tianditu.gov.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=01270f58d46fa3e4e48c1a6a5d8625fb`}},
    {key: 'gaode', title: '瓦片底图', option: {projection: 'EPSG:3857', url: 'http://mapcdn.lshida.com/maps/vt?lyrs=m@292000000&hl=zh-CN&gl=cn&src=app&x={x}&y={y}&z={z}&s='}}
  ];
  
  map = new Map({
    target: 'mapDom',
    view: new View(viewOpts),
    layers: layerOptions.filter(item => props.defLyrs.includes(item.key)).map(item => {
      return new TileLayer({
        properties: {
          name: item.key,
          title: item.title
        },
        source: new XYZ(item.option)
      });
    })
  });

  // 添加地图控件
  addMapControls(map);

  // 触发创建完毕的事件，传回地图实例对象
  emit('created', map);
});

// 组件卸载时清理地图资源
onUnmounted(() => {
  if (map) {
    map.setTarget(null); // 释放地图资源
    map = null;
  }
});

// 新增控件配置方法
function addMapControls(map) {
  // 缩放按钮控件
  map.addControl(new Zoom());

  // 缩放滑块控件
  map.addControl(new ZoomSlider());

  // 缩放到范围控件
  map.addControl(new ZoomToExtent());

  // 比例尺控件
  map.addControl(new ScaleLine({
    units: 'metric',
    bar: true,
    text: true
  }));

  // 鹰眼控件（修复投影和数据源）
  map.addControl(new OverviewMap({
    collapsed: true, // 默认折叠，点击可展开
    collapseLabel: '◀',
    label: '▶',
    layers: [new TileLayer({
      source: new XYZ({
        // 使用与主地图相同的投影和兼容的数据源
        url: 'http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=01270f58d46fa3e4e48c1a6a5d8625fb',
        projection: 'EPSG:4326' // 与主地图图层投影一致
      })
    })],
    size: [180, 120], // 设置鹰眼窗口大小
    // position: 'bottom-right' // 可选：明确位置
  }));
  
  // 鼠标坐标控件
  map.addControl(new MousePosition({
    coordinateFormat: createStringXY(4),
    projection: 'EPSG:4326',
    className: 'custom-mouse-position',
    placeholder: '鼠标移入地图显示坐标'
  }));
}
</script>

<template>
  <div id="mapDom" class="map"></div>
</template>

<style>
.map {width: 100%;height: 100%;}

/* 新增控件样式 */
.custom-mouse-position {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 8px;
  background: rgba(255,255,255,0.8);
  border-radius: 4px;
  font: 14px/1.5 "Microsoft YaHei";
  color: #333;
}

.ol-overviewmap {
  left: auto !important;
  right: 8px;
  bottom: 80px; /* 调整位置，避免与其他控件重叠 */
  width: 150px; /* 与 JS 中设置的 size 保持一致 */
  height: 120px;
}

.ol-scale-line {
  background: rgba(255,255,255,0.7);
  padding: 2px 8px;
  border-radius: 4px;
  left: 10px;
  bottom: 10px;
}
</style>