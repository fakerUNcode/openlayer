<script setup>
import { ref } from 'vue'

import TileLayer from 'ol/layer/Tile.js'
import XYZ from 'ol/source/XYZ.js'
import OSM from 'ol/source/OSM.js'
import BingMaps from 'ol/source/BingMaps.js'
import TileImage from 'ol/source/TileImage.js'
import TileGrid from 'ol/tilegrid/TileGrid.js'

import Map from '../Map.vue'

// 1-创建天地图
const createLyrTian = () =>
{
  // 你的key
  const key = '569737ea36171685d686b54ce079a49d'
  return new TileLayer({
    properties: {
      name: 'tian',
      title: '天地图',
    },
    visible:false,
    source: new XYZ({
      projection: 'EPSG:4326',
      url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${key}`,
    })
  })
}

// 2-创建百度地图
const createLyrBd = () =>
{
  let url = 'http://online{0-3}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&udt=20191119&scaler=1&p=1'

  // 构造分辨率序列
  const resolutions = []
  for (let i = 0; i < 19; i++)
    resolutions.push(Math.pow(2, 18 - i))

  // 创建切片规则对象
  const tileGrid = new TileGrid({
    origin: [0, 0],
    resolutions
  })

  return new TileLayer({
    properties: {
      name: 'baidu',
      title: '百度地图',
    },
    visible:false,
    source: new TileImage({
      projection: 'EPSG:3857',
      tileGrid: tileGrid,
      tileUrlFunction: function(tileCoord, pixelRatio, proj)
      {
        if (!tileCoord)
          return ''

        let tempUrl = url
        tempUrl = tempUrl.replace('{x}', tileCoord[1] < 0 ? `M${-tileCoord[1]}` : tileCoord[1])
        tempUrl = tempUrl.replace('{y}', tileCoord[2] < 0 ? `M${tileCoord[2] + 1}` : -(tileCoord[2] + 1))
        tempUrl = tempUrl.replace('{z}', tileCoord[0])

        // 范围替换
        var match = /\{(\d+)-(\d+)\}/.exec(tempUrl)
        if (match)
        {
          var delta = parseInt(match[2]) - parseInt(match[1])
          var num = Math.round(Math.random() * delta + parseInt(match[1]))
          tempUrl = tempUrl.replace(match[0], num.toString())
        }
        return tempUrl
      }
    })
  })
}

// 3-创建高德地图
const createLyrGd = () =>
{
  return new TileLayer({
    properties: {
      name: 'gaode',
      title: '高德地图',
    },
    visible:false,
    source: new XYZ({
      url: 'http://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=8&lstyle=7&x={x}&y={y}&z={z}',
    })
  })
}


// 4-创建OpenStreetMap地图
const createLyrOSM = () =>
{
  return new TileLayer({
    properties: {
      name: 'osm',
      title: 'OpenStreetMap地图',
    },
    visible:false,
    source: new OSM()
  })
}

// 5-创建Bing地图
const createLyrBing = () =>
{
  // 你的key, 如AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_xxxxxxx
  const key = 'AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_sj88ZYEBNNWxaufCSPGzecf-B'
  return new TileLayer({
    properties: {
      name: 'bing',
      title: 'Bing地图',
    },
    visible:false,
    source: new BingMaps({
      key: key,
      imagerySet: 'RoadOnDemand'
    })
  })
}

// 5-创建Arcgis地图
const createLyrArc = () =>
{
  return new TileLayer({
    properties: {
      name: 'arc',
      title: 'Arcgis地图',
    },
    visible:false,
    source: new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      projection: 'EPSG:3857'
    })
  })
}

let olmap = null
let layers = []
const checks = ref([])
const onMapCreate = map =>
{
  olmap = map
  // map.addLayer(createLyrTian())
  map.addLayer(createLyrBd())
  map.addLayer(createLyrGd())
  map.addLayer(createLyrOSM())
  map.addLayer(createLyrBing())
  map.addLayer(createLyrArc())

  layers = map.getLayers().getArray().map(layer =>
  {
    layer.getVisible() && checks.value.push(layer.get('name'))
    return {
      name: layer.get('name'),
      title: layer.get('title'),
      layer
    }
  })
}

// 图层开关控制
const onCheckChange = () =>
{
  if (!olmap)
    return
  
  layers.forEach(layer =>
  {
    layer.layer.setVisible(checks.value.includes(layer.name))
  })
}
</script>

<template>
  <Map @created="onMapCreate"></Map>
  <el-card class="control">
    <el-checkbox-group v-model="checks" @change="onCheckChange">
      <el-checkbox v-for="layer in layers" :key="layer.name" :label="layer.name">{{layer.title}}</el-checkbox>
    </el-checkbox-group>
  </el-card>
</template>

<style>
.control {position: absolute;right:5px;top:10px;width: 400px;}
</style>
