<template>
  <div class="xian-container">
    <div class="xian-controls">
      <div class="button-group">
        <button @click="startDrawing" :class="{'active': isDrawing}">
          {{ isDrawing ? '正在绘制' : '创建线' }}
        </button>
        <button @click="finishDrawing" :disabled="!isDrawing || drawingPoints.length < 2">完成绘制</button>
        <button @click="cancelDrawing" :disabled="!isDrawing">取消创建</button>
      </div>
      <div class="button-group">
        <button @click="exportKml" :disabled="!lines.length">导出 KML</button>
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="isDrawing && drawingPoints.length > 1" class="measure-info">
        当前线段长度: {{ currentLength.toFixed(2) }} 米
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import { Stroke, Style, Circle, Fill } from 'ol/style'
import { fromLonLat, toLonLat } from 'ol/proj'
import { getLength } from 'ol/sphere'

export default {
  name: 'Xian',
  props: {
    map: {
      type: Object,
      required: true
    }
  },
  emits: ['lineCreated'],
  setup(props, { emit }) {
    // 状态管理
    const vectorSource = ref(new VectorSource())
    const drawingSource = ref(new VectorSource())
    const errorMessage = ref('')
    const lines = ref([])
    const isDrawing = ref(false)
    const drawingPoints = ref([])
    const vectorLayer = ref(null)
    const drawingLayer = ref(null)
    const currentLength = ref(0)

    // 线样式 - 修改为深蓝色
    const lineStyle = new Style({
      stroke: new Stroke({ color: 'rgba(0, 0, 139, 0.8)', width: 3 })
    })

    // 临时绘制样式
    const drawingStyle = new Style({
      stroke: new Stroke({ color: 'rgba(255, 0, 0, 0.8)', width: 2, lineDash: [5, 5] }),
      image: new Circle({
        radius: 5,
        fill: new Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
        stroke: new Stroke({ color: 'rgba(255, 255, 255, 1)', width: 1 })
      })
    })

    // 地图加载完成后初始化
    const initMap = () => {
      if (props.map) {
        console.log('地图投影:', props.map.getView().getProjection().getCode())
        
        // 创建并添加线图层
        vectorLayer.value = new VectorLayer({
          source: vectorSource.value,
          style: lineStyle,
          zIndex: 200
        })
        
        // 创建并添加临时绘制图层
        drawingLayer.value = new VectorLayer({
          source: drawingSource.value,
          style: drawingStyle,
          zIndex: 250
        })
        
        props.map.addLayer(vectorLayer.value)
        props.map.addLayer(drawingLayer.value)
        
        console.log('地图视图变化，当前中心坐标:', props.map.getView().getCenter())
      }
    }

    // 开始绘制线
    const startDrawing = () => {
      if (isDrawing.value) return
      
      isDrawing.value = true
      drawingPoints.value = []
      currentLength.value = 0
      errorMessage.value = ''
      
      // 清空临时图层
      drawingSource.value.clear()
      
      // 添加地图点击事件
      props.map.on('click', handleMapClick)
      
      // 添加鼠标移动事件，用于实时显示绘制中的线
      props.map.on('pointermove', handlePointerMove)
      
      // 更改鼠标样式为十字准星
      props.map.getViewport().style.cursor = 'crosshair'
    }

    // 处理地图点击
    const handleMapClick = (event) => {
      const coordinate = event.coordinate
      console.log('绘制线 - 点击获取的坐标:', coordinate)
      
      drawingPoints.value.push(coordinate)
      
      // 更新临时绘制图层
      updateDrawingLine()
      
      // 计算当前长度
      calculateCurrentLength()
    }

    // 处理鼠标移动
    const handlePointerMove = (event) => {
      if (!isDrawing.value || drawingPoints.value.length === 0) return
      
      // 更新临时绘制图层，显示正在绘制的线
      updateDrawingLine(event.coordinate)
    }

    // 更新绘制中的线
    const updateDrawingLine = (cursorPosition) => {
      drawingSource.value.clear()
      
      if (drawingPoints.value.length === 0) return
      
      // 添加已点击的点
      drawingPoints.value.forEach(point => {
        const pointFeature = new Feature({
          geometry: new Point(point)
        })
        drawingSource.value.addFeature(pointFeature)
      })
      
      // 添加线
      if (drawingPoints.value.length > 1) {
        let linePoints = [...drawingPoints.value]
        
        // 如果有鼠标位置，添加到线的末尾，形成动态效果
        if (cursorPosition) {
          linePoints.push(cursorPosition)
        }
        
        const lineFeature = new Feature({
          geometry: new LineString(linePoints)
        })
        drawingSource.value.addFeature(lineFeature)
      }
    }

    // 计算当前绘制线的长度
    const calculateCurrentLength = () => {
      if (drawingPoints.value.length < 2) {
        currentLength.value = 0
        return
      }
      
      try {
        const line = new LineString(drawingPoints.value)
        // 使用球体计算真实长度（米）
        currentLength.value = getLength(line, { projection: props.map.getView().getProjection() })
      } catch (error) {
        console.error('长度计算错误:', error)
        currentLength.value = 0
      }
    }

    // 完成绘制
    const finishDrawing = () => {
      if (drawingPoints.value.length < 2) {
        errorMessage.value = '至少需要两个点才能创建线'
        return
      }
      
      // 创建线要素
      const lineFeature = new Feature({
        geometry: new LineString(drawingPoints.value)
      })
      
      // 添加到图层
      vectorSource.value.addFeature(lineFeature)
      
      // 转换为经纬度坐标，用于导出KML
      const originalLonLat = drawingPoints.value.map(coord => {
        const lonLat = toLonLat(coord)
        return [lonLat[0], lonLat[1]]
      })
      
      // 保存线数据用于导出
      const newLine = {
        id: Date.now(),
        coordinates: [...drawingPoints.value],
        originalLonLat: originalLonLat
      }
      
      lines.value.push(newLine)
      
      // 触发事件通知父组件
      emit('lineCreated', newLine)
      
      // 重置绘制状态
      resetDrawing()
      
      console.log('线创建成功，点数:', drawingPoints.value.length)
    }

    // 取消绘制
    const cancelDrawing = () => {
      resetDrawing()
    }

    // 重置绘制状态
    const resetDrawing = () => {
      isDrawing.value = false
      drawingPoints.value = []
      currentLength.value = 0
      drawingSource.value.clear()
      
      // 移除事件监听
      props.map.un('click', handleMapClick)
      props.map.un('pointermove', handlePointerMove)
      
      // 恢复鼠标样式
      props.map.getViewport().style.cursor = ''
    }

    // 导出 KML
    const exportKml = () => {
      if (lines.value.length === 0) {
        errorMessage.value = '没有线可导出'
        return
      }

      // 创建 KML 内容
      let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>导出的线数据</name>`

      lines.value.forEach((line, index) => {
        // 使用原始经纬度坐标导出
        const lonLatCoords = line.originalLonLat.map(coord => {
          return `${coord[0]},${coord[1]},0`
        })

        kmlContent += `
    <Placemark>
      <name>线 ${index + 1}</name>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <coordinates>${lonLatCoords.join(' ')}</coordinates>
      </LineString>
    </Placemark>`
      })

      kmlContent += `
  </Document>
</kml>`

      // 创建下载链接
      const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lines_export_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.kml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    // 使用Vue 3的生命周期钩子
    onMounted(() => {
      initMap()
    })

    onUnmounted(() => {
      resetDrawing()
      
      if (props.map) {
        if (vectorLayer.value) props.map.removeLayer(vectorLayer.value)
        if (drawingLayer.value) props.map.removeLayer(drawingLayer.value)
      }
    })

    return {
      isDrawing,
      drawingPoints,
      errorMessage,
      lines,
      currentLength,
      startDrawing,
      finishDrawing,
      cancelDrawing,
      exportKml
    }
  }
}
</script>

<style scoped>
/* 适配 chuangjian 区域样式 */
.xian-container {
  position: relative;
  width: 100%;
}

.xian-controls {
  background-color: 30, 144, 255, 0.7;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 0px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.xian-controls button {
  padding: 6px 12px;
  background-color: 30, 144, 255, 0.7;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.xian-controls button.active {
  background-color: #ff7e5f;
}

.xian-controls button:hover:not(:disabled) {
  background-color: 30, 144, 255, 0.7;
}

.xian-controls button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 5px;
}

.measure-info {
  color: #fff;
  font-size: 14px;
  margin-top: 10px;
}
</style>  