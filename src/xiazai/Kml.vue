<template>
    <div class="kml-export">
      <button @click="exportKML" class="mt-2">导出点</button>
      <div v-if="exportMessage" class="success-message">{{ exportMessage }}</div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </div>
  </template>
  
  <script setup>
  import { ref, defineProps } from 'vue'
  import KML from 'ol/format/KML'
  import Feature from 'ol/Feature'
  import Point from 'ol/geom/Point'
  import { fromLonLat } from 'ol/proj'
  
  const props = defineProps({
    points: {
      type: Array,
      required: true
    }
  })
  
  const errorMessage = ref('')
  const exportMessage = ref('')
  
  const exportKML = () => {
    if (!props.points || props.points.length === 0) {
      errorMessage.value = '没有点可导出'
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
      return
    }
    
    try {
      // 创建 KML 格式实例
      const kmlFormat = new KML({
        extractStyles: false // 不导出样式，简化 KML
      })
      
      // 创建特征数组
      const features = props.points.map(point => {
        // 将坐标从 EPSG:3857 转回 EPSG:4326 (WGS84)
        const lonLat = fromLonLat(point.coordinates, 'EPSG:3857')
        
        const feature = new Feature({
          geometry: new Point(lonLat),
          name: `点 ${point.id}`,
          description: `坐标: ${lonLat[0].toFixed(6)}, ${lonLat[1].toFixed(6)}`
        })
        
        return feature
      })
      
      // 生成 KML 字符串
      const kmlString = kmlFormat.writeFeatures(features, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
      
      // 创建下载链接
      const blob = new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `地图点_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.kml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // 显示成功消息
      exportMessage.value = 'KML 文件导出成功！'
      setTimeout(() => {
        exportMessage.value = ''
      }, 3000)
      
    } catch (error) {
      console.error('导出 KML 失败:', error)
      errorMessage.value = '导出 KML 失败，请重试'
      setTimeout(() => {
        errorMessage.value = ''
      }, 3000)
    }
  }
  </script>
  
<style scoped>
/* ===== KML导出容器 ===== */
.kml-export {
  background: var(--bg-light);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  box-shadow: 0 2px 6px var(--shadow-light);
  transition: all 0.3s ease;
}

.kml-export:hover {
  border-color: var(--border-dark);
  box-shadow: 0 4px 10px rgba(16, 42, 92, 0.15);
}

/* ===== 导出按钮 ===== */
.kml-export button {
  width: 100%;
  padding: 10px 16px;
  background: var(--primary-blue);
  color: 255, 255, 255, 0.85;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(16, 42, 92, 0.1);
}

.kml-export button:hover {
  background: var(--dark-blue);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(16, 42, 92, 0.2);
}

.kml-export button:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(16, 42, 92, 0.2);
}

/* ===== 消息提示 ===== */
.success-message,
.error-message {
  font-size: 13px;
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.success-message {
  background: rgba(46, 160, 67, 0.1);
  color: #2EA043;
  border-left: 3px solid #2EA043;
}

.error-message {
  background: rgba(210, 43, 43, 0.1);
  color: var(--error-red);
  border-left: 3px solid var(--error-red);
}

.success-message::before,
.error-message::before {
  font-family: 'Material Icons';
  font-size: 16px;
}

.success-message::before {
  content: "check_circle";
  color: #2EA043;
}

.error-message::before {
  content: "error";
  color: var(--error-red);
}

/* ===== 响应式调整 ===== */
@media (max-width: 768px) {
  .kml-export {
    padding: 12px;
  }
  
  .kml-export button {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>