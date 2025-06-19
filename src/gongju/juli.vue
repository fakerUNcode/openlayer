<template>
  <div class="distance-measure-container">
    <div class="measure-controls">
      <div class="control-title">距离测量</div>
      <div class="control-buttons">
        <button @click="toggleMeasure" :class="{ 'active': isMeasuring }">
          {{ isMeasuring ? '结束测量' : '开始测量' }}
        </button>
        <button @click="clearMeasure">清除测量</button>
      </div>
      
      <!-- 测量结果显示区域 -->
      <div class="measure-results">
        <div v-if="currentDistance > 0" class="result-item">
          <span class="result-label">当前段:</span>
          <span class="result-value">{{ currentDistance.toFixed(2) }} 米</span>
        </div>
        <div v-if="totalDistance > 0" class="result-item">
          <span class="result-label">总距离:</span>
          <span class="result-value">{{ totalDistance.toFixed(2) }} 米</span>
        </div>
        <div v-if="segmentCount > 0" class="result-item">
          <span class="result-label">线段数:</span>
          <span class="result-value">{{ segmentCount }}</span>
        </div>
      </div>
      
      <div class="error-tip" v-if="errorMessage">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { defineProps } from 'vue'
import { LineString, Point } from 'ol/geom'
import { Style, Stroke, Circle, Fill } from 'ol/style'
import { Vector as VectorLayer } from 'ol/layer'
import VectorSource from 'ol/source/Vector'
import { Feature } from 'ol'
import { getDistance } from 'ol/sphere'
import { toLonLat } from 'ol/proj'

const props = defineProps({
  map: {
    type: Object,
    required: true
  }
})

// 组件状态
const isMeasuring = ref(false)
const measurePoints = ref([])
const currentDistance = ref(0)
const totalDistance = ref(0)
const segmentCount = ref(0)
const errorMessage = ref('')
const vectorSource = ref(new VectorSource())
const vectorLayer = ref(null)

// 测量样式
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

// 处理键盘事件
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isMeasuring.value) {
    endMeasuring()
  }
}

// 结束测量
const endMeasuring = () => {
  props.map.un('click', handleMapClick)
  props.map.getViewport().style.cursor = ''
  isMeasuring.value = false
}

// 切换测量状态
const toggleMeasure = () => {
  isMeasuring.value = !isMeasuring.value
  if (isMeasuring.value) {
    // 开始测量
    measurePoints.value = []
    currentDistance.value = 0
    errorMessage.value = ''
    initMeasureLayer()
    props.map.un('click', handleMapClick)
    props.map.on('click', handleMapClick)
    props.map.getViewport().style.cursor = 'crosshair'
  } else {
    // 结束测量
    endMeasuring()
  }
}

// 处理地图点击
const handleMapClick = (event) => {
  const coordinate = event.coordinate
  measurePoints.value.push(coordinate)
  
  // 更新测量线显示
  vectorSource.value.clear()
  measurePoints.value.forEach(point => {
    const pointFeature = new Feature({
      geometry: new Point(point)
    })
    vectorSource.value.addFeature(pointFeature)
  })
  
  if (measurePoints.value.length > 1) {
    const lineFeature = new Feature({
      geometry: new LineString(measurePoints.value)
    })
    vectorSource.value.addFeature(lineFeature)
    calculateDistance()
  }
}

// 计算距离
const calculateDistance = () => {
  try {
    const mapProjection = props.map.getView().getProjection()
    const pointsCount = measurePoints.value.length
    
    // 计算最后一段距离
    const lastSegmentStart = toLonLat(measurePoints.value[pointsCount-2], mapProjection)
    const lastSegmentEnd = toLonLat(measurePoints.value[pointsCount-1], mapProjection)
    currentDistance.value = getDistance(lastSegmentStart, lastSegmentEnd)
    
    // 计算总距离
    totalDistance.value = 0
    for (let i = 0; i < pointsCount - 1; i++) {
      const start = toLonLat(measurePoints.value[i], mapProjection)
      const end = toLonLat(measurePoints.value[i+1], mapProjection)
      totalDistance.value += getDistance(start, end)
    }
    
    segmentCount.value = pointsCount - 1
    errorMessage.value = ''
  } catch (error) {
    console.error('距离计算失败:', error)
    errorMessage.value = '距离计算出错，请重试'
    currentDistance.value = 0
  }
}

// 清除测量结果
const clearMeasure = () => {
  isMeasuring.value = false
  measurePoints.value = []
  currentDistance.value = 0
  totalDistance.value = 0
  segmentCount.value = 0
  errorMessage.value = ''
  
  if (vectorSource.value) {
    vectorSource.value.clear()
  }
  if (vectorLayer.value && props.map) {
    props.map.removeLayer(vectorLayer.value)
    vectorLayer.value = null
  }
  
  if (props.map) {
    props.map.un('click', handleMapClick)
    props.map.getViewport().style.cursor = ''
  }
}

// 组件生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  clearMeasure()
})

// 监听地图变化
watch(() => props.map, (newMap) => {
  if (newMap && isMeasuring.value) {
    initMeasureLayer()
  }
}, { immediate: true })
</script>

<style scoped>
.distance-measure-container {
  position: relative;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.measure-controls {
  padding: 15px;
}

.control-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.control-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.measure-controls button {
  padding: 8px 12px;
  background-color: #1e90ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.measure-controls button.active {
  background-color: #ff4757;
}

.measure-controls button:hover {
  opacity: 0.9;
}

.measure-results {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.result-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.result-label {
  color: #666;
}

.result-value {
  font-weight: bold;
  color: #333;
}

.error-tip {
  color: #ff4757;
  font-size: 12px;
  margin-top: 10px;
}
</style>