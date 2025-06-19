<template>
  <div class="map-control">
    <el-card class="full-width">
      <el-checkbox-group v-model="checks" @change="onCheckChange">
        <el-checkbox 
          v-for="layer in layers" 
          :key="layer.name" 
          :label="layer.name"
          :disabled="!layer.layer"
        >{{ layer.title }}</el-checkbox>
      </el-checkbox-group>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElCard, ElCheckboxGroup, ElCheckbox } from 'element-plus'
import TileLayer from 'ol/layer/Tile.js'
import XYZ from 'ol/source/XYZ.js'
import OSM from 'ol/source/OSM.js'
import BingMaps from 'ol/source/BingMaps.js'
import TileImage from 'ol/source/TileImage.js'
import TileGrid from 'ol/tilegrid/TileGrid.js'

const props = defineProps({
  map: {
    type: Object,
    required: true
  }
})

const checks = ref([])
let layers = []

// 1-创建天地图
const createLyrTian = () => {
  const key = '01270f58d46fa3e4e48c1a6a5d8625fb'
  return new TileLayer({
    properties: {
      name: 'tian',
      title: '天地图',
      owner: 'PublicMap' // 标记图层归属
    },
    visible: false,
    source: new XYZ({
      projection: 'EPSG:4326',
      url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${key}`
    })
  })
}

// 2-创建百度地图
const createLyrBd = () => {
  const url = 'http://online{0-3}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&udt=20191119&scaler=1&p=1'
  const resolutions = []
  for (let i = 0; i < 19; i++) {
    resolutions.push(Math.pow(2, 18 - i))
  }
  const tileGrid = new TileGrid({
    origin: [0, 0],
    resolutions
  })
  return new TileLayer({
    properties: {
      name: 'baidu',
      title: '百度地图',
      owner: 'PublicMap' // 标记图层归属
    },
    visible: false,
    source: new TileImage({
      projection: 'EPSG:3857',
      tileGrid: tileGrid,
      tileUrlFunction: function(tileCoord, pixelRatio, proj) {
        if (!tileCoord) return ''
        let tempUrl = url
        tempUrl = tempUrl.replace('{x}', tileCoord[1] < 0 ? `M${-tileCoord[1]}` : tileCoord[1])
        tempUrl = tempUrl.replace('{y}', tileCoord[2] < 0 ? `M${tileCoord[2] + 1}` : -(tileCoord[2] + 1))
        tempUrl = tempUrl.replace('{z}', tileCoord[0])
        const match = /\{(\d+)-(\d+)\}/.exec(tempUrl)
        if (match) {
          const delta = parseInt(match[2]) - parseInt(match[1])
          const num = Math.round(Math.random() * delta + parseInt(match[1]))
          tempUrl = tempUrl.replace(match[0], num.toString())
        }
        return tempUrl
      }
    })
  })
}

// 3-创建高德地图
const createLyrGd = () => {
   const apiKey = '105e84d5a48d3d3958e788725fdc7b99'
  return new TileLayer({
    properties: {
      name: 'gaode',
      title: '高德地图',
      owner: 'PublicMap' // 标记图层归属
    },
    visible: false,
    source: new XYZ({
      url: 'https://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&ltype=1&tk=105e84d5a48d3d3958e788725fdc7b99',
      projection: 'EPSG:3857', // 明确指定投影
      crossOrigin: 'anonymous' // 解决跨域问题
    })
  })
}

// 4-创建OpenStreetMap地图
const createLyrOSM = () => {
  return new TileLayer({
    properties: {
      name: 'osm',
      title: 'OpenStreetMap地图',
      owner: 'PublicMap' // 标记图层归属
    },
    visible: false,
    source: new OSM()
  })
}

// 5-创建Bing地图
const createLyrBing = () => {
  const key = 'AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_sj88ZYEBNNWxaufCSPGzecf-B'
  return new TileLayer({
    properties: {
      name: 'bing',
      title: 'Bing地图',
      owner: 'PublicMap' // 标记图层归属
    },
    visible: false,
    source: new BingMaps({
      key: key,
      imagerySet: 'RoadOnDemand'
    })
  })
}

// 6-创建Arcgis地图
const createLyrArc = () => {
  return new TileLayer({
    properties: {
      name: 'arc',
      title: 'Arcgis地图',
      owner: 'PublicMap' // 标记图层归属
    },
    visible: false,
    source: new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      projection: 'EPSG:3857'
    })
  })
}

// 初始化图层
const initLayers = () => {
  // 防御性检查：确保地图实例存在
  if (!props.map) {
    console.warn('地图实例未准备好，跳过图层初始化')
    return
  }
  
  // 清除现有图层（仅清除PublicMap创建的图层）
  const mapLayers = props.map.getLayers()
  if (!mapLayers) {
    console.warn('地图图层集合未定义')
    return
  }
  
  mapLayers.forEach(layer => {
    if (layer && layer.get('owner') === 'PublicMap') {
      props.map.removeLayer(layer)
    }
  })
  
  // 添加新图层
  props.map.addLayer(createLyrTian())
  props.map.addLayer(createLyrBd())
  props.map.addLayer(createLyrGd())
  props.map.addLayer(createLyrOSM())
  props.map.addLayer(createLyrBing())
  props.map.addLayer(createLyrArc())
  
  // 更新图层列表（仅保留PublicMap创建的图层）
  layers = mapLayers.getArray()
    .filter(layer => layer && layer.get('owner') === 'PublicMap')
    .map(layer => {
      const isVisible = layer.getVisible()
      if (isVisible && !checks.value.includes(layer.get('name'))) {
        checks.value.push(layer.get('name'))
      }
      return {
        name: layer.get('name'),
        title: layer.get('title'),
        layer
      }
    })
}

// 图层开关控制
const onCheckChange = () => {
  // 防御性检查：确保图层数组已初始化
  if (!layers || layers.length === 0) {
    console.warn('图层列表未初始化')
    return
  }
  
  layers.forEach(layer => {
    if (layer.layer) {
      layer.layer.setVisible(checks.value.includes(layer.name))
    }
  })
}

// 监听地图实例变化
watch(
  () => props.map,
  (newMap, oldMap) => {
    if (newMap) {
      console.log('地图实例已准备好，初始化图层')
      initLayers()
    } else {
      console.warn('地图实例为空，等待初始化')
    }
  },
  { immediate: true } // 立即执行一次，处理初始值
)
</script>

<style scoped>
.map-control {
  margin: 10px;
}

.full-width {
  width: 100%;
  box-sizing: border-box;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>