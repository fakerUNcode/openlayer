<template>
  <div class="path-planning-container">
    <div class="center-text">路径规划</div>
    <div class="path-controls">
      <button @click="startSelectingStart" :class="{ active: selectingStart }" class="path-button">
        选择起点
      </button>
      <button @click="startSelectingEnd" :class="{ active: selectingEnd }" class="path-button">
        选择终点
      </button>
      <button @click="clearPath" class="path-button" :disabled="!pathLayer">
        清除路径
      </button>
    </div>
    <div v-if="distance" class="path-info">
      路径长度: {{ distance.toFixed(2) }} 米 | 预计时间: {{ duration }} 分钟
    </div>
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import { Style, Stroke, Circle, Fill } from 'ol/style'
import { fromLonLat, toLonLat } from 'ol/proj'

export default {
  name: 'PathPlanning',
  props: {
    map: {
      type: Object,
      required: true
    },
    apiKey: {
      type: String,
      required: true,
      default: '5b3ce3597851110001cf6248a711a7287e504e2a8ac09d63338f9ab7' // 替换为你的真实API密钥
    }
  },
  setup(props) {
    const selectingStart = ref(false)
    const selectingEnd = ref(false)
    const startPoint = ref(null)
    const endPoint = ref(null)
    const pathLayer = ref(null)
    const distance = ref(0)
    const duration = ref(0)
    const error = ref(null)
    let clickHandler = null

    // 样式定义
    const pointStyle = new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ color: 'rgba(255, 255, 255, 0.8)' }),
        stroke: new Stroke({
          color: '#3399CC',
          width: 2
        })
      })
    })

    const startPointStyle = new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ color: 'rgba(50, 205, 50, 0.8)' }),
        stroke: new Stroke({
          color: '#228B22',
          width: 2
        })
      })
    })

    const endPointStyle = new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({ color: 'rgba(255, 69, 0, 0.8)' }),
        stroke: new Stroke({
          color: '#FF4500',
          width: 2
        })
      })
    })

    const pathStyle = new Style({
      stroke: new Stroke({
        color: 'rgba(70, 130, 180, 0.8)',
        width: 4
      })
    })

    // 初始化路径图层
    const initPathLayer = () => {
      const source = new VectorSource()
      pathLayer.value = new VectorLayer({
        source: source,
        style: function(feature) {
          const type = feature.get('type')
          if (type === 'start') return startPointStyle
          if (type === 'end') return endPointStyle
          if (type === 'path') return pathStyle
          return pointStyle
        }
      })
      props.map.addLayer(pathLayer.value)
    }

    // 开始选择起点
    const startSelectingStart = () => {
      resetSelection()
      selectingStart.value = true
      setupClickHandler('start')
    }

    // 开始选择终点
    const startSelectingEnd = () => {
      resetSelection()
      selectingEnd.value = true
      setupClickHandler('end')
    }

    // 设置点击事件处理器
    const setupClickHandler = (pointType) => {
      if (clickHandler) {
        props.map.un('click', clickHandler)
      }
      
      clickHandler = (evt) => {
        const coordinate = evt.coordinate
        const lonLat = toLonLat(coordinate)
        
        if (pointType === 'start') {
          startPoint.value = lonLat
          addPointToLayer(coordinate, 'start')
        } else {
          endPoint.value = lonLat
          addPointToLayer(coordinate, 'end')
        }
        
        // 如果两个点都有了，计算路径
        if (startPoint.value && endPoint.value) {
          calculatePath()
        }
        
        resetSelection()
      }
      
      props.map.on('click', clickHandler)
    }

    // 添加点到图层
    const addPointToLayer = (coordinate, type) => {
      const feature = new Feature({
        geometry: new Point(coordinate),
        type: type
      })
      pathLayer.value.getSource().addFeature(feature)
    }

    // 计算真实路径
    const calculatePath = async () => {
      error.value = null
      
      try {
        // 调用OpenRouteService API
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${props.apiKey}&start=${startPoint.value[0]},${startPoint.value[1]}&end=${endPoint.value[0]},${endPoint.value[1]}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
          }
        })
        
        if (!response.ok) {
          throw new Error('路径规划请求失败')
        }
        
        const data = await response.json()
        
        // 解析返回的路径数据
        const coordinates = data.features[0].geometry.coordinates.map(coord => fromLonLat(coord))
        const line = new LineString(coordinates)
        const pathFeature = new Feature({
          geometry: line,
          type: 'path'
        })
        
        // 清除旧路径
        pathLayer.value.getSource().clear()
        
        // 重新添加起点和终点
        addPointToLayer(fromLonLat(startPoint.value), 'start')
        addPointToLayer(fromLonLat(endPoint.value), 'end')
        
        // 添加新路径
        pathLayer.value.getSource().addFeature(pathFeature)
        
        // 更新距离和时间
        distance.value = data.features[0].properties.summary.distance
        duration.value = Math.round(data.features[0].properties.summary.duration / 60) // 转换为分钟
      } catch (err) {
        console.error('路径规划错误:', err)
        error.value = '路径规划失败，请稍后再试'
        
        // 回退到直线路径
        fallbackToStraightLine()
      }
    }

    // 回退到直线路径
    const fallbackToStraightLine = () => {
      const startCoord = fromLonLat(startPoint.value)
      const endCoord = fromLonLat(endPoint.value)
      
      // 创建路径线
      const line = new LineString([startCoord, endCoord])
      const pathFeature = new Feature({
        geometry: line,
        type: 'path'
      })
      
      // 清除旧路径
      pathLayer.value.getSource().clear()
      
      // 重新添加起点和终点
      addPointToLayer(startCoord, 'start')
      addPointToLayer(endCoord, 'end')
      
      // 添加新路径
      pathLayer.value.getSource().addFeature(pathFeature)
      
      // 计算距离
      distance.value = calculateDistance(startPoint.value, endPoint.value)
      duration.value = Math.round(distance.value / 80) // 假设步行速度80米/分钟
    }

    // 计算两点间距离（Haversine公式）
    const calculateDistance = (point1, point2) => {
      const R = 6371000 // 地球半径(米)
      const dLat = (point2[1] - point1[1]) * Math.PI / 180
      const dLon = (point2[0] - point1[0]) * Math.PI / 180
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      return R * c
    }

    // 清除路径
    const clearPath = () => {
      if (pathLayer.value) {
        pathLayer.value.getSource().clear()
      }
      startPoint.value = null
      endPoint.value = null
      distance.value = 0
      duration.value = 0
      error.value = null
    }

    // 重置选择状态
    const resetSelection = () => {
      selectingStart.value = false
      selectingEnd.value = false
      if (clickHandler) {
        props.map.un('click', clickHandler)
        clickHandler = null
      }
    }

    onMounted(() => {
      initPathLayer()
    })

    onUnmounted(() => {
      if (pathLayer.value) {
        props.map.removeLayer(pathLayer.value)
      }
      resetSelection()
    })

    return {
      selectingStart,
      selectingEnd,
      startSelectingStart,
      startSelectingEnd,
      clearPath,
      pathLayer,
      distance,
      duration,
      error
    }
  }
}
</script>

<style scoped>
.path-planning-container {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.path-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
}

.path-button {
  padding: 8px 12px;
  background: linear-gradient(to right, rgba(70, 130, 180, 0.8), rgba(100, 149, 237, 0.8));
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  min-width: 100px;
}

.path-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.path-button:active {
  transform: translateY(0);
}

.path-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.path-button.active {
  background: linear-gradient(to right, rgba(50, 205, 50, 0.8), rgba(34, 139, 34, 0.8));
  box-shadow: 0 0 0 2px rgba(50, 205, 50, 0.5);
}

.path-info {
  margin-top: 15px;
  padding: 10px;
  background: rgba(70, 130, 180, 0.1);
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  color: #2c3e50;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  color: #d32f2f;
}
</style>