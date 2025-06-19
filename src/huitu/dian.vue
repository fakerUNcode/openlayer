<template>
  <div class="dian">
    <div style="text-align: center; margin-bottom: 20px; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
      <h2 style="
        margin: 0;
        font-size: 16px;
        color: #1a2b3c;
        font-weight: 600;
        letter-spacing: 0.5px;
      ">点要素管理</h2>
    </div>
      <div class="chuangjiandian">
      <!-- 传统坐标输入方式 -->
      <div class="input-mode">
        <input 
          v-model="pointInput" 
          type="text" 
          placeholder="输入坐标，格式：经度,纬度" 
        >
        <input 
          v-model="pointInfo" 
          type="text" 
          placeholder="输入点的信息" 
        >
        <button @click="createPoint">创建点</button>
      </div>

      <!-- 地图交互模式 -->
      <div class="interactive-mode">
        <button 
          @click="toggleInteractiveMode"
          :class="{ active: isInteractiveMode }"
        >
          {{ isInteractiveMode ? '正在地图选点...' : '地图选点' }}
        </button>
        <input 
          v-model="pointInfo" 
          type="text" 
          placeholder="输入点的信息（可选）" 
          v-if="isInteractiveMode"
        >
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </div>
    <!-- 引入 KML 导出组件 -->
    <Kmldian :points="customPoints" />
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onUnmounted } from 'vue'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import {Fill, Stroke, Circle, Style, Text} from 'ol/style'
import { fromLonLat, toLonLat } from 'ol/proj'
import Kmldian from '@/xiazai/Kml.vue'

const props = defineProps({
  map: {
    type: Object,
    required: true
  },
  customPoints: {
    type: Array,
    default: () => []
  }
})

const emits = defineEmits(['pointCreated'])

// 点样式
const defaultStyle = new Style({
  image: new Circle({
    radius: 12,
    fill: new Fill({color: 'rgba(255, 0, 0, 0.8)'}),
    stroke: new Stroke({color: 'yellow', width: 2})
  })
})

// 创建带标注的样式
const createStyleWithText = (text) => {
  return new Style({
    image: new Circle({
      radius: 12,
      fill: new Fill({color: 'rgba(255, 0, 0, 0.8)'}),
      stroke: new Stroke({color: 'yellow', width: 2})
    }),
    text: new Text({
      text: text,
      font: '14px Arial',
      fill: new Fill({color: '#000'}),
      stroke: new Stroke({color: '#fff', width: 2}),
      offsetY: -18,
      textAlign: 'center'
    })
  })
}

// 创建矢量图层
const vectorSource = ref(new VectorSource({ features: [] }))
const vectorLayer = ref(new VectorLayer({
  source: vectorSource.value,
  style: defaultStyle,
  zIndex: 350
}))

// 输入状态
const pointInput = ref('')
const pointInfo = ref('')
const errorMessage = ref('')
const isInteractiveMode = ref(false)

// 当前悬停的要素
const hoveredFeature = ref(null)

// 地图事件处理函数
let pointerMoveHandler = null
let clickHandler = null

// 处理鼠标移动事件
const handlePointerMove = (e) => {
  if (e.dragging) return
  
  if (hoveredFeature.value) {
    hoveredFeature.value.setStyle(defaultStyle)
    hoveredFeature.value = null
  }
  
  if (props.map) {
    props.map.forEachFeatureAtPixel(e.pixel, (feature) => {
      const info = feature.get('info')
      if (info) {
        feature.setStyle(createStyleWithText(info))
        hoveredFeature.value = feature
        return true
      }
    })
  }
}

// 处理地图点击事件（交互模式）
const handleMapClick = (e) => {
  if (!isInteractiveMode.value) return
  
  // 获取点击位置的坐标并转换为经纬度
  const coordinates = toLonLat(e.coordinate)
  
  // 自动创建点
  const newPoint = {
    id: Date.now().toString(),
    coordinates: coordinates,
    info: pointInfo.value.trim() || `点 ${props.customPoints.length + 1}`
  }
  
  // 在本地显示
  const feature = new Feature({
    geometry: new Point(e.coordinate),
    info: newPoint.info
  })
  feature.setId(newPoint.id)
  feature.setStyle(defaultStyle)
  vectorSource.value.addFeature(feature)
  
  // 通知父组件
  emits('pointCreated', newPoint)
  
  // 清空信息输入框（可选）
  pointInfo.value = ''
}

// 切换交互模式
const toggleInteractiveMode = () => {
  isInteractiveMode.value = !isInteractiveMode.value
  
  // 更新地图交互状态
  if (props.map) {
    if (isInteractiveMode.value) {
      // 进入交互模式时，可以添加一些视觉反馈
      props.map.getTargetElement().style.cursor = 'crosshair'
    } else {
      // 退出交互模式时恢复默认光标
      props.map.getTargetElement().style.cursor = ''
    }
  }
}

// 更新点函数
const updatePoints = () => {
  vectorSource.value.clear()
  
  props.customPoints.forEach(point => {
    const coordinates = fromLonLat(point.coordinates)
    const feature = new Feature({
      geometry: new Point(coordinates),
      info: point.info || ''
    })
    feature.setId(point.id)
    feature.setStyle(defaultStyle)
    vectorSource.value.addFeature(feature)
  })
}

// 创建新点（传统方式）
const createPoint = () => {
  const input = pointInput.value.trim()
  if (!input) {
    errorMessage.value = '请输入坐标'
    return
  }
  
  const parts = input.split(',')
  if (parts.length !== 2) {
    errorMessage.value = '坐标格式错误，应为经度,纬度'
    return
  }
  
  const lon = parseFloat(parts[0].trim())
  const lat = parseFloat(parts[1].trim())
  
  if (isNaN(lon) || isNaN(lat)) {
    errorMessage.value = '坐标值必须是数字'
    return
  }
  
  // 创建新点对象
  const newPoint = {
    id: Date.now().toString(),
    coordinates: [lon, lat],
    info: pointInfo.value.trim() || '未命名点'
  }
  
  // 在本地显示
  const feature = new Feature({
    geometry: new Point(fromLonLat([lon, lat])),
    info: newPoint.info
  })
  feature.setId(newPoint.id)
  feature.setStyle(defaultStyle)
  vectorSource.value.addFeature(feature)
  
  // 清空输入
  pointInput.value = ''
  pointInfo.value = ''
  errorMessage.value = ''
  
  // 通知父组件
  emits('pointCreated', newPoint)
}

// 监听地图属性
watch(() => props.map, (newMap) => {
  if (newMap) {
    newMap.addLayer(vectorLayer.value)
    vectorLayer.value.setZIndex(100)
    
    // 添加事件监听
    pointerMoveHandler = handlePointerMove
    newMap.on('pointermove', pointerMoveHandler)
    
    clickHandler = handleMapClick
    newMap.on('click', clickHandler)
    
    updatePoints()
  }
}, { immediate: true })

// 监听自定义点数组的变化
watch(() => props.customPoints, () => {
  updatePoints()
}, { deep: true })

// 组件卸载时清理
onUnmounted(() => {
  if (props.map) {
    props.map.removeLayer(vectorLayer.value)
    if (pointerMoveHandler) {
      props.map.un('pointermove', pointerMoveHandler)
    }
    if (clickHandler) {
      props.map.un('click', clickHandler)
    }
    // 恢复光标样式
    props.map.getTargetElement().style.cursor = ''
  }
})
</script>

<style scoped>
/* 原有样式保持不变，只添加交互模式按钮的样式 */
.interactive-mode {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
}

.interactive-mode button {
  width: 100%;
  margin-bottom: 10px;
}

.interactive-mode button.active {
  background: #4CAF50;
  color: white;
}

.input-mode {
  margin-bottom: 15px;
}
/* ===== 全局配色变量 ===== */
:root {
  --primary-blue: #1E5FCC;       /* 主蓝色 */
  --dark-blue: #0F3D7A;         /* 深蓝色 */
  --light-blue: #4A90E2;        /* 浅蓝色 */
  --bg-light: rgba(255, 255, 255, 0.92);  /* 更不透明的背景 */
  --border-light: #D1E0F7;       /* 浅蓝色边框 */
  --border-dark: #A0B9D9;       /* 中蓝色边框 */
  --shadow-light: rgba(16, 42, 92, 0.12); /* 蓝色系阴影 */
  --text-primary: #1A2B3C;      /* 深蓝黑色 */
  --text-secondary: #3D4D5E;    /* 中灰色 */
  --error-red: #C42D1A;         /* 深红色 */
}

/* ===== 点组件容器 ===== */
.dian {
  background: var(--bg-light);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 3px 10px var(--shadow-light);
  transition: all 0.3s ease;
  color: var(--text-primary); /* 统一文字颜色 */
}

.dian:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(16, 42, 92, 0.2);
  border-color: var(--border-dark);
}

/* ===== 创建点控制区域 ===== */
.chuangjiandian {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== 输入框样式 ===== */
.chuangjiandian input {
  width: 100%;
  padding: 14px 14px;
  margin-bottom: 12px; /* 增加底部外边距 */
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  background: white;
  font-size: 15px;
  color: var(--text-primary);
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
}

.chuangjiandian input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(30, 95, 204, 0.15);
}

.chuangjiandian input::placeholder {
  color: #7A8BA6;
  font-weight: 400;
}

/* ===== 按钮样式 ===== */
.chuangjiandian button {
  padding: 10px 18px;
  background: var(--primary-blue);
  color: rgb(59, 122, 165); /* 修正后的颜色 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); /* 可选阴影 */
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  align-self: flex-start;
  box-shadow: 0 2px 5px rgba(16, 42, 92, 0.2);
  -webkit-font-smoothing: antialiased; /* 改善字体渲染 */
}

.chuangjiandian button:hover {
  background: var(--dark-blue);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 42, 92, 0.25);
}

.chuangjiandian button:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(16, 42, 92, 0.3);
}

/* 按钮组样式 */
.button-group {
  display: flex;
  gap: 10px;
}

/* 清除按钮样式 */
.clear-btn {
  background: var(--error-red) !important;
}

/* ===== 错误信息 ===== */
.error-message {
  color: var(--error-red);
  font-size: 13px;
  margin-top: -6px;
  padding: 6px 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.error-message::before {
  content: "!";
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: var(--error-red);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

/* 提示文本 */
.hint {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  margin-top: 8px;
}

/* ===== 响应式调整 ===== */
@media (max-width: 768px) {
  .dian {
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .chuangjiandian {
    padding: 14px;
    gap: 12px;
  }
  
  .chuangjiandian input {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .chuangjiandian button {
    padding: 8px 14px;
    font-size: 14px;
  }
  
  .button-group {
    flex-direction: column;
    gap: 8px;
  }
}
</style>