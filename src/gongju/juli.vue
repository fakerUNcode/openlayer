<template>
  <div class="distance-measure-container">
    <!-- 测量控制区域 -->
    <div class="measure-controls">
      <div class="control-title">距离测量</div>
      <div class="control-buttons">
        <button 
          @click="toggleMeasure" 
          :class="{'active': isMeasuring}"
        >
          {{ isMeasuring ? '结束测量' : '开始测量' }}
        </button>
        <button @click="clearMeasure">清除测量</button>
      </div>
      <div class="measure-result" v-if="isMeasuring && measurePoints.length > 1">
        当前测量距离：{{ distance.toFixed(2) }} 米
      </div>
      <div class="error-tip" v-if="errorMessage">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { defineProps, defineEmits } from 'vue'
import { LineString, Point } from 'ol/geom'
import { Style, Stroke, Circle, Fill } from 'ol/style'
import { Vector as VectorLayer } from 'ol/layer'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { getDistance } from 'ol/sphere'
import { toLonLat } from 'ol/proj' // 修改导入路径
import { get } from 'ol/proj' // 新增导入

// 接收父组件传递的地图实例
const props = defineProps({
  map: {
    type: Object,
    required: true
  }
})

// 向父组件发送测量结果
const emits = defineEmits(['distanceMeasured'])

// 组件状态
const isMeasuring = ref(false)
const measurePoints = ref([])
const distance = ref(0)
const errorMessage = ref('')
const vectorSource = ref(new VectorSource())
const vectorLayer = ref(null)

// 测量样式配置
const measureStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(0, 0, 139, 0.8)',
    width: 3,
    lineDash: [5, 5]
  }),
  image: new Circle({
    radius: 5,
    fill: new Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
    stroke: new Stroke({ 
      color: 'rgba(255, 255, 255, 1)', 
      width: 1 
    })
  })
})

// 初始化测量图层
const initMeasureLayer = () => {
  if (vectorLayer.value) {
    props.map.removeLayer(vectorLayer.value)
  }
  vectorLayer.value = new VectorLayer({
    source: vectorSource.value,
    style: measureStyle,
    zIndex: 300
  })
  props.map.addLayer(vectorLayer.value)
}

// 切换测量状态
const toggleMeasure = () => {
  isMeasuring.value = !isMeasuring.value
  if (isMeasuring.value) {
    measurePoints.value = []
    distance.value = 0
    errorMessage.value = ''
    initMeasureLayer()
    props.map.on('click', handleMapClick)
    props.map.getViewport().style.cursor = 'crosshair'
  } else {
    props.map.un('click', handleMapClick)
    clearMeasure()
    props.map.getViewport().style.cursor = ''
  }
}

// 处理地图点击
const handleMapClick = (event) => {
  const coordinate = event.coordinate
  measurePoints.value.push(coordinate)
  updateMeasureLine()
  calculateDistance()
}

// 更新测量线显示
const updateMeasureLine = () => {
  vectorSource.value.clear()
  
  // 添加测量点
  measurePoints.value.forEach(point => {
    const pointFeature = new Feature({
      geometry: new Point(point)
    })
    vectorSource.value.addFeature(pointFeature)
  })
  
  // 添加测量线
  if (measurePoints.value.length > 1) {
    const lineFeature = new Feature({
      geometry: new LineString(measurePoints.value)
    })
    vectorSource.value.addFeature(lineFeature)
  }
}

// 计算距离（关键修改点）
const calculateDistance = () => {
  if (measurePoints.value.length < 2) {
    distance.value = 0
    return
  }
  
  distance.value = 0
  try {
    const mapProjection = props.map.getView().getProjection()
    
    for (let i = 0; i < measurePoints.value.length - 1; i++) {
      // 使用 toLonLat 转换坐标（自动处理为 EPSG:4326）
      const start = toLonLat(measurePoints.value[i], mapProjection)
      const end = toLonLat(measurePoints.value[i + 1], mapProjection)
      
      // 计算球面距离（单位：米）
      const dist = getDistance(start, end)
      distance.value += dist
    }
    
    emits('distanceMeasured', {
      points: measurePoints.value,
      distance: distance.value
    })
    errorMessage.value = ''
  } catch (error) {
    console.error('距离计算失败:', error)
    errorMessage.value = '距离计算出错，请重试'
    distance.value = 0
  }
}

// 清除测量结果
const clearMeasure = () => {
  isMeasuring.value = false
  measurePoints.value = []
  distance.value = 0
  errorMessage.value = ''
  vectorSource.value.clear()
  if (vectorLayer.value && props.map) {
    props.map.removeLayer(vectorLayer.value)
    vectorLayer.value = null
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  clearMeasure()
  if (props.map) {
    props.map.un('click', handleMapClick)
    props.map.getViewport().style.cursor = ''
  }
})

// 监听地图变化
watch(() => props.map, (newMap) => {
  if (newMap && isMeasuring.value) {
    initMeasureLayer()
    updateMeasureLine()
  }
}, { immediate: true })
</script>

<style scoped>

.distance-measure-container {
  position: relative;
  width: 100%;
}

.measure-controls {
  background-color: 30, 144, 255, 0.7;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
}

.control-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #2c3e50;
  border-bottom: 1px solid #2c3e50;
  padding-bottom: 8px;
}

.control-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.measure-controls button {
  padding: 6px 12px;
  background-color: 30, 144, 255, 0.7;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.measure-controls button.active {
  background-color: #ff7e5f;
}

.measure-controls button:hover {
  background-color: 30, 144, 255, 0.7;
}

.measure-result {
  color: #fff;
  font-size: 14px;
  margin-top: 8px;
}

.error-tip {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 4px;
}
</style>