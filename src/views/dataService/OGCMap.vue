<template>
  <div class="ogc-map-container">
    <el-card class="full-width">
      <!-- <template #header>
        <div class="header-content">
          <span>OGC服务切换</span>
        </div>
      </template> -->
      <el-checkbox-group v-model="checks" @change="onCheckChange">
        <el-checkbox 
          v-for="layer in layers" 
          :key="layer.name" 
          :label="layer.name"
        >{{ layer.title }}</el-checkbox>
      </el-checkbox-group>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { ElCard, ElCheckboxGroup, ElCheckbox } from 'element-plus'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import TileWMS from 'ol/source/TileWMS.js'
import WMTS from 'ol/source/WMTS.js'
import VectorSource from 'ol/source/Vector.js'
import WMTSTileGrid from 'ol/tilegrid/WMTS.js'
import { bbox as bboxStrategy } from 'ol/loadingstrategy.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import { get as getProj } from 'ol/proj'
import { getWidth } from 'ol/extent'

const props = defineProps({
  map: { type: Object, required: true },
  tianKey: { type: String, default: '' },
  wmsUrl: { type: String, default: 'http://localhost:8080/geoserver/nurc/wms' },
  wfsUrl: { type: String, default: 'http://localhost:8080/geoserver/sf/ows' }
})

const checks = ref([])
let layers = []

// 1-创建WMS图层
const createLyrWMS = () => {
  return new TileLayer({
    properties: {
      name: 'wms',
      title: 'WMS服务',
      locate: [-11853698.36373101, 4522979.57274383, 4],
      owner: 'OGCMap' // 标记图层归属
    },
    visible: false,
    source: new TileWMS({
      url: props.wmsUrl,
      params: { LAYERS: 'nurc:Img_Sample' },
      projection: 'EPSG:3857',
      serverType: 'geoserver',
      crossOrigin: 'anonymous'
    })
  })
}

// 2-创建WMTS图层（以天地图为例）
const createLyrWMTS = () => {
  const size = getWidth(getProj('EPSG:4326').getExtent()) / 256
  const resolutions = []
  const matrixIds = []
  for (let i = 0; i < 19; i++) {
    resolutions.push(size / Math.pow(2, i))
    matrixIds.push(i)
  }
  const tileGrid = new WMTSTileGrid({
    origin: [-180, 90],
    resolutions,
    matrixIds
  })
  return new TileLayer({
    properties: {
      name: 'wmts',
      title: '天地图WMTS',
      owner: 'OGCMap' // 标记图层归属
    },
    visible: false,
    source: new WMTS({
      url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?tk=${props.tianKey}`,
      projection: 'EPSG:4326',
      tileGrid,
      crossOrigin: 'anonymous',
      format: 'image/png',
      layer: 'vec',
      matrixSet: 'c',
      style: 'default'
    })
  })
}

// 3-创建WFS图层
const createLyrWFS = () => {
  return new VectorLayer({
    properties: {
      name: 'wfs',
      title: 'WFS服务',
      locate: [-11534858.696299767, 5493787.393992992, 7],
      owner: 'OGCMap' // 标记图层归属
    },
    visible: false,
    source: new VectorSource({
      format: new GeoJSON(),
      url: (extent) => {
        return `${props.wfsUrl}?service=WFS&` +
          `version=1.0.0&request=GetFeature&typename=sf:roads&` +
          `outputFormat=application/json&srsname=EPSG:3857&` +
          `bbox=${extent.join(',')},EPSG:3857`
      },
      strategy: bboxStrategy
    }),
    style: {
      'stroke-width': 2,
      'stroke-color': 'red',
      'fill-color': 'rgba(100,100,100,0.25)'
    }
  })
}

// 初始化图层
const initLayers = () => {
  if (!props.map) return

  // 清理现有OGC图层（仅清理OGCMap创建的图层）
  props.map.getLayers().forEach(layer => {
    if (layer.get('owner') === 'OGCMap') {
      props.map.removeLayer(layer)
    }
  })

  // 添加新图层
  const lyrWMS = createLyrWMS()
  const lyrWMTS = createLyrWMTS()
  const lyrWFS = createLyrWFS()
  props.map.addLayer(lyrWMS)
  props.map.addLayer(lyrWMTS)
  props.map.addLayer(lyrWFS)

  // 更新图层列表（仅保留OGCMap创建的图层）
  layers = props.map.getLayers().getArray()
    .filter(layer => layer.get('owner') === 'OGCMap')
    .map(layer => {
      return {
        name: layer.get('name'),
        title: layer.get('title'),
        locate: layer.get('locate'),
        layer: layer
      }
    })
}

// 图层切换逻辑
const onCheckChange = () => {
  layers.forEach(layer => {
    layer.layer.setVisible(checks.value.includes(layer.name))
  })

  // 定位到最后激活的图层位置
  const lastLayer = layers.find(layer => 
    checks.value.includes(layer.name)
  )
  if (lastLayer && lastLayer.locate) {
    const [x, y, z] = lastLayer.locate
    props.map.getView().setCenter([x, y])
    props.map.getView().setZoom(z)
  }
}

// 监听地图实例变化
watchEffect(() => {
  initLayers()
})
</script>

<style scoped>
.ogc-map-container {
  width: 100%;
  box-sizing: border-box;
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