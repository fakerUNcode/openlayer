<template>
  <div class="dian">
    <div class="chuangjiandian">
      <input 
        v-model="pointInput" 
        type="text" 
        placeholder="输入坐标，格式：x,y" 
      >
      <input 
        v-model="pointInfo" 
        type="text" 
        placeholder="输入点的信息" 
      >
      <button @click="createPoint">创建点</button>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </div>
    <!-- 引入 KML 导出组件 -->
    <Kmldian :points="customPoints" />
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onUnmounted, onMounted, nextTick } from 'vue'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import {Fill, Stroke, Circle, Style, Text} from 'ol/style'
import { fromLonLat } from 'ol/proj' // 导入坐标转换函数
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

// 点样式 - 增加大小和透明度以便更明显
const defaultStyle = new Style({
  image: new Circle({
    radius: 12,                             // 增加半径
    fill: new Fill({color: 'rgba(255, 0, 0, 0.8)'}), // 半透明红色
    stroke: new Stroke({color: 'yellow', width: 2})  // 黄色边框
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
      offsetY: -18, // 文字在点上方
      textAlign: 'center'
    })
  })
}

// 创建矢量图层
const vectorSource = ref(new VectorSource({ features: [] }))
const vectorLayer = ref(new VectorLayer({
  source: vectorSource.value,
  style: defaultStyle,
  zIndex: 350 // 设置较高的z-index，确保图层在最上方
}))

// 输入状态
const pointInput = ref('')
const pointInfo = ref('')
const errorMessage = ref('')

// 当前悬停的要素
const hoveredFeature = ref(null)

// 地图事件处理函数
let pointerMoveHandler = null

// 处理鼠标移动事件
const handlePointerMove = (e) => {
  if (e.dragging) return
  
  // 恢复之前悬停要素的样式
  if (hoveredFeature.value) {
    hoveredFeature.value.setStyle(defaultStyle)
    hoveredFeature.value = null
  }
  
  // 检查当前鼠标位置下是否有要素
  if (props.map) {
    props.map.forEachFeatureAtPixel(e.pixel, (feature) => {
      const info = feature.get('info')
      if (info) {
        // 设置带标注的样式
        feature.setStyle(createStyleWithText(info))
        hoveredFeature.value = feature
        // 找到要素后停止遍历
        return true
      }
    })
  }
}

// 更新点函数
const updatePoints = () => {
  // 清除现有要素
  if (vectorSource.value) {
    vectorSource.value.clear()
    
    // 添加自定义点
    props.customPoints.forEach(point => {
      // 假设输入的坐标是EPSG:4326 (WGS84)，转换为EPSG:3857
      // 如果你的坐标已经是EPSG:3857，请注释掉下面这行
      const coordinates = fromLonLat(point.coordinates)
      
      const feature = new Feature({
        geometry: new Point(coordinates),
        info: point.info || ''
      })
      
      // 设置默认样式
      feature.setStyle(defaultStyle)
      
      // 设置ID以便后续查找
      feature.setId(point.id)
      
      vectorSource.value.addFeature(feature)
    })
  }
}

// 监听地图属性
watch(() => props.map, (newMap) => {
  if (newMap) {
    // 使用nextTick确保DOM已更新
    nextTick(() => {
      // 将图层添加到地图上
      newMap.addLayer(vectorLayer.value)
      
      // 确保点图层在最上方
      vectorLayer.value.setZIndex(100)
      
      // 添加鼠标移动事件监听
      pointerMoveHandler = handlePointerMove
      newMap.on('pointermove', pointerMoveHandler)
      
      updatePoints()
    })
  }
}, { immediate: true })

// 监听自定义点数组的变化
watch(() => props.customPoints, () => {
  updatePoints()
}, { deep: true })

// 组件卸载时移除图层和事件监听
onUnmounted(() => {
  if (props.map) {
    props.map.removeLayer(vectorLayer.value)
    if (pointerMoveHandler) {
      props.map.un('pointermove', pointerMoveHandler)
    }
  }
})

// 创建新点
const createPoint = () => {
  // 验证输入格式
  const input = pointInput.value.trim()
  if (!input) {
    errorMessage.value = '请输入坐标'
    return
  }
  
  const parts = input.split(',')
  if (parts.length !== 2) {
    errorMessage.value = '坐标格式错误，应为x,y'
    return
  }
  
  const x = parseFloat(parts[0].trim())
  const y = parseFloat(parts[1].trim())
  
  if (isNaN(x) || isNaN(y)) {
    errorMessage.value = '坐标值必须是数字'
    return
  }
  
  // 创建新点对象，包含信息字段
  const newPoint = {
    id: Date.now(),
    coordinates: [x, y],
    info: pointInfo.value.trim() || '未命名点'
  }
  
  // 清空输入框和错误信息
  pointInput.value = ''
  pointInfo.value = ''
  errorMessage.value = ''
  
  // 通知父组件
  emits('pointCreated', newPoint)
}
</script>

<style scoped>
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
  padding: 10px 14px;
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
/* ===== 按钮样式 ===== */
.chuangjiandian button {
  padding: 10px 18px;
  background: var(--primary-blue);
  color: white; /* 修正后的颜色 */
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
}
</style>