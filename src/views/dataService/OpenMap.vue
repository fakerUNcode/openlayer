<template>
  <div class="open-map-container">
    <el-card class="full-width">
      <!-- <template #header>
        <div class="header-content">
          <span>数据图层</span>
        </div>
      </template> -->
      <el-checkbox-group v-model="checks" @change="onCheckChange">
        <el-checkbox v-for="layer in layers" :key="layer.name" :label="layer.name">{{layer.title}}</el-checkbox>
      </el-checkbox-group>
    </el-card>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import VectorLayer from 'ol/layer/Vector.js'
import VectorTileLayer from 'ol/layer/VectorTile.js'
import VectorSource from 'ol/source/Vector.js'
import VectorTileSource from 'ol/source/VectorTile.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import KML from 'ol/format/KML.js'
import GPX from 'ol/format/GPX.js'
import MVT from 'ol/format/MVT.js'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js'

const props = defineProps({
  map: {
    type: Object,
    required: true
  }
})

// 创建图层函数（保持不变）
const createLyrGeoJSON = () => {
  return new VectorLayer({
    properties: {
      name: 'geojson',
      title: 'GeoJSON数据',
      locate: [12758643.216901623, 3562584.420464834, 16],
      owner: 'OpenMap'
    },
    visible: false,
    source: new VectorSource({
      url: 'data/lines.json',
      format: new GeoJSON({
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
    }),
    style: new Style({
      stroke: new Stroke({
        color: '#3672af',
        width: 1
      })
    })
  })
}

const createLyrKML = () => {
  return new VectorLayer({
    properties: {
      name: 'kml',
      title: 'KML数据',
      locate: [864510.0253082548, 5862753.416073311, 10],
      owner: 'OpenMap'
    },
    visible: false,
    source: new VectorSource({
      url: 'data/lines.kml',
      format: new KML(),
    })
  })
}

const createLyrGPX = () => {
  const style = {
    'Point': new Style({
      image: new CircleStyle({
        fill: new Fill({
          color: 'rgba(255,255,0,0.4)',
        }),
        radius: 5,
        stroke: new Stroke({
          color: '#ff0',
          width: 1,
        }),
      }),
    }),
    'LineString': new Style({
      stroke: new Stroke({
        color: '#f00',
        width: 3,
      }),
    }),
    'MultiLineString': new Style({
      stroke: new Stroke({
        color: '#0f0',
        width: 3,
      }),
    }),
  }

  return new VectorLayer({
    properties: {
      name: 'gpx',
      title: 'GPX数据',
      locate: [-7916212.305874971, 5228516.283875127, 14],
      owner: 'OpenMap'
    },
    visible: false,
    source: new VectorSource({
      url: 'data/fells_loop.gpx',
      format: new GPX(),
    }),
    style: function(feature) {
      return style[feature.getGeometry().getType()]
    }
  })
}

const createLyrVecTile = () => {
  return new VectorTileLayer({
    properties: {
      name: 'vectortile',
      title: '矢量瓦片数据',
      locate: [864510.0253082548, 5862753.416073311, 10],
      owner: 'OpenMap'
    },
    visible: false,
    source: new VectorTileSource({
      format: new MVT(),
      url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf',
    })
  })
}

let layers = []
const checks = ref([])

// 初始化图层（保持不变）
const initLayers = () => {
  if (!props.map) return
  
  props.map.getLayers().forEach(layer => {
    if (layer.get('owner') === 'OpenMap') {
      props.map.removeLayer(layer)
    }
  })

  props.map.addLayer(createLyrGeoJSON())
  props.map.addLayer(createLyrKML())
  props.map.addLayer(createLyrGPX())
  props.map.addLayer(createLyrVecTile())

  layers = props.map.getLayers().getArray()
    .filter(layer => layer.get('owner') === 'OpenMap')
    .map(layer => {
      layer.getVisible() && checks.value.push(layer.get('name'))
      return {
        name: layer.get('name'),
        title: layer.get('title'),
        locate: layer.get('locate'),
        layer
      }
    })
}

// 图层开关控制（保持不变）
const onCheckChange = () => {
  if (!props.map) return
  
  let lastLocate = null
  layers.forEach(layer => {
    layer.layer.setVisible(checks.value.includes(layer.name))
    if (layer.name === checks.value[checks.value.length - 1])
      lastLocate = layer.locate
  })

  if (lastLocate) {
    props.map.getView().setZoom(lastLocate[2])
    props.map.getView().setCenter([lastLocate[0], lastLocate[1]])
  }
}

// 组件挂载后初始化图层（保持不变）
initLayers()

// 移除 isExpanded 和 toggleExpanded 相关逻辑
</script>

<style scoped>
.open-map-container {
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

/* 移除原有的折叠按钮样式 */
.collapsed-button {
  display: none;
}
</style>