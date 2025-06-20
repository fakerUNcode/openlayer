<script setup>
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import XYZ from 'ol/source/XYZ.js'

import { onMounted } from 'vue'

// 1-定义外部参数
const props = defineProps({
  viewConf: { type: Object, default: () => ({}) },
  defLyrs: { type: Array, default: () => ['vec_c'] }
})

// 2-定义地图创建完毕的事件
const emit = defineEmits(['created'])

// 3-组件挂载后创建地图
onMounted(() =>
{
  // 用传入的view配置覆盖默认配置
  const viewOpts = Object.assign({
    projection: 'EPSG:3857',

    // 地大全貌
    // center: [12758417.315499168, 3562866.9013162893],
    // zoom: 16.5,

    // 地大中心
    center: [12758612.973162018, 3562849.0216611675],
    zoom: 17.5
  }, props.viewConf)

  const layerOptions =
  [
    {key: 'img_c', title: '天地图影像', option: {projection: 'EPSG:4326', url: `http://t{0-7}.tianditu.gov.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${cxApp.tianKey}`}},
    {key: 'vec_c', title: '天地图', option: {projection: 'EPSG:4326', url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${cxApp.tianKey}`}},
    {key: 'cva_c', title: '天地图注记', option: {projection: 'EPSG:4326', url: `http://t{0-7}.tianditu.gov.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${cxApp.tianKey}`}},
    {key: 'gaode', title: '瓦片底图', option: {projection: 'EPSG:3857', url: 'http://mapcdn.lshida.com/maps/vt?lyrs=m@292000000&hl=zh-CN&gl=cn&src=app&x={x}&y={y}&z={z}&s='}}
  ]
  const map = new Map({
    // 3.1-设置地图的dom容器
    target: 'mapDom',

    // 3.2-设置地图的视图配置，projection默认是EPSG:3857（Web墨卡托平面坐标系）
    view: new View(viewOpts),

    // 3.3-创建显示的图层序列
    layers: layerOptions.filter(item => props.defLyrs.includes(item.key)).map(item =>
    {
      return new TileLayer({
        properties: {
          name: item.key,
          title: item.title
        },
        source: new XYZ(item.option)})
    })
  })
  window.map = map
  // 3.4-触发创建完毕的事件，传回地图实例对象
  emit('created', map)
})
</script>

<template>
  <div id="mapDom" class="map"></div>
</template>

<style>
  .map {width: 100%;height: 100%;}
</style>
