<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <h1 class="header-title">Openlayers地图管理与分析系统</h1>
    </div>

    <!-- 主内容区（三栏布局） -->
    <div class="content-row">
      <!-- 左侧面板：数据图层控制 -->
      <div class="left-col">
        <div v-if="mainMap" class="public-map-wrapper">
          <div class="center-text">数据图层选择</div>
          <PublicMap :map="mainMap" />
        </div>
        
        <div v-if="mainMap" class="open-map-wrapper">
          <div class="center-text">矢量数据图层选择</div>
          <OpenMap :map="mainMap" />
        </div>
        
        <div v-if="mainMap" class="ogc-map-wrapper">
          <div class="center-text">其他图层服务</div>
          <OGCMap :map="mainMap" 
            tianKey="01270f58d46fa3e4e48c1a6a5d8625fb"
            wmsUrl="http://localhost:8080/geoserver/nurc/wms" 
            wfsUrl="http://localhost:8080/geoserver/sf/ows" />
        </div>
      </div>

      <!-- 中间面板：地图显示 -->
      <div class="middle-col">
        <Map :view-conf="{
          center: [12758612.973162018, 3562849.0216611675],
          zoom: 17.5
        }" :def-lyrs="['vec_c']" @created="handleMapCreated" />
        
        <!-- 地图控制按钮组 -->
        <div class="map-controls-center">
          <button @click="showHeatmapWithZoom" class="control-button">
            {{ showHeatmap ? '隐藏热力图' : '显示热力图' }}
          </button>
          <button @click="showClustersWithZoom" class="control-button">
            {{ showClusters ? '隐藏聚类' : '显示聚类' }}
          </button>
        </div>
        
        <FloatingFullScreen v-if="mainMap" :map="mainMap" />
      </div>

      <!-- 右侧面板：工具集 -->
      <div class="right-col">
        <div class="center-text">数据管理</div>
        
        <!-- 要素创建工具 -->
        <div class="chuangjian-container">
          <div class="center-text">要素创建工具</div>
          <Dian v-if="mainMap" :map="mainMap" :customPoints="customPoints" @pointCreated="handlePointCreated" />
          <Xian v-if="mainMap" :map="mainMap" @lineCreated="handleLineCreated" />
          <Duobianxing v-if="mainMap" :map="mainMap" @polygonCreated="handlePolygonCreated" />
        </div>
        
        <!-- 测量工具 -->
        <div class="gongju-container">
          <div class="center-text">路径规划和测量工具</div>
          <PathPlanning v-if="mainMap" :map="mainMap" />
          <Juli v-if="mainMap" :map="mainMap" @distanceMeasured="handleDistanceMeasured" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue'
import Map from './views/Map.vue'
import PublicMap from './views/dataService/PublicMap.vue'
import OpenMap from './views/dataService/OpenMap.vue'
import OGCMap from './views/dataService/OGCMap.vue'
import Dian from './huitu/dian.vue'
import Xian from './huitu/xian.vue'
import Duobianxing from './huitu/duobianxing.vue'
import Juli from './gongju/juli.vue'
import FloatingFullScreen from './components/FloatingFullScreen.vue'
import PathPlanning from './components/PathPlanning.vue'

// OpenLayers核心模块
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import ClusterSource from 'ol/source/Cluster'
import HeatmapLayer from 'ol/layer/Heatmap'
import Style from 'ol/style/Style'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Text from 'ol/style/Text'

// 模拟数据点
const mockPoints = [
  { lon: 116.404, lat: 39.915, value: 5 },  // 天安门坐标
  { lon: 116.408, lat: 39.918, value: 3 },
  { lon: 116.402, lat: 39.913, value: 7 }
]

export default {
  name: 'App',
  components: {
    Map, PublicMap, OpenMap, OGCMap,
    Dian, Xian, Duobianxing, Juli,
    FloatingFullScreen,PathPlanning
  },
  setup() {
    // 地图实例和状态管理
    const mainMap = ref(null)
    const viewConfig = ref({
      center: fromLonLat([116.404, 39.915]),
      zoom: 15
    })

    // 数据存储
    const customPoints = ref([])
    const customLines = ref([])
    const customPolygons = ref([])
    const measureHistory = ref([])

    // 图层控制状态
    const showHeatmap = ref(false)
    const showClusters = ref(false)
    const heatmapLayer = ref(null)
    const clusterLayer = ref(null)

    // 地图初始化回调
    const handleMapCreated = (map) => {
      mainMap.value = map
      initHeatmapLayer(map)
      initClusterLayer(map)
    }

    // 要素创建回调
    const handlePointCreated = (newPoint) => {
      customPoints.value.push(newPoint)
      console.log('点要素创建成功:', newPoint.coordinates)
    }

    const handleLineCreated = (newLine) => {
      customLines.value.push(newLine)
      console.log('线要素创建成功:', newLine.coordinates)
    }

    const handlePolygonCreated = (newPolygon) => {
      customPolygons.value.push(newPolygon)
      console.log('面要素创建成功:', newPolygon.coordinates)
    }

    // 测量工具回调
    const handleDistanceMeasured = (measureData) => {
      if (isNaN(measureData.distance)) {
        console.error('无效的测量数据')
        return
      }
      measureHistory.value.push({
        id: Date.now(),
        points: measureData.points,
        distance: measureData.distance,
        timestamp: new Date()
      })
      nextTick(() => {
        window.alert(`距离测量完成：${measureData.distance.toFixed(2)} 米`)
      })
    }

    // 热力图图层初始化
    const initHeatmapLayer = (map) => {
      const vectorSource = new VectorSource()
      mockPoints.forEach(point => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([point.lon, point.lat])),
          weight: point.value
        })
        vectorSource.addFeature(feature)
      })

      heatmapLayer.value = new HeatmapLayer({
        source: vectorSource,
        blur: 15,
        radius: 10,
        weight: feature => feature.get('weight') || 1
      })
      heatmapLayer.value.setVisible(false)
      map.addLayer(heatmapLayer.value)
    }

    // 聚类图层初始化
    const initClusterLayer = (map) => {
      const vectorSource = new VectorSource()
      mockPoints.forEach(point => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([point.lon, point.lat]))
        })
        vectorSource.addFeature(feature)
      })

      const clusterSource = new ClusterSource({
        distance: 40,
        source: vectorSource
      })

      clusterLayer.value = new VectorLayer({
        source: clusterSource,
        style: feature => {
          const size = feature.get('features').length
          return new Style({
            image: new CircleStyle({
              radius: 10 + Math.min(size, 10) * 2,
              fill: new Fill({
                color: `rgba(255, 0, 0, ${0.6 + Math.min(size, 10) * 0.05})`
              })
            }),
            text: new Text({
              text: size.toString(),
              fill: new Fill({ color: '#fff' })
            })
          })
        }
      })
      clusterLayer.value.setVisible(false)
      map.addLayer(clusterLayer.value)
    }

    // 热力图显示控制
    const showHeatmapWithZoom = () => {
      showHeatmap.value = !showHeatmap.value
      heatmapLayer.value.setVisible(showHeatmap.value)
      if (showHeatmap.value && mainMap.value) {
        mainMap.value.getView().animate({
          center: fromLonLat([116.404, 39.915]),
          zoom: 15,
          duration: 1000
        })
      }
    }

    // 聚类显示控制
    const showClustersWithZoom = () => {
      showClusters.value = !showClusters.value
      clusterLayer.value.setVisible(showClusters.value)
      if (showClusters.value && mainMap.value) {
        mainMap.value.getView().animate({
          center: fromLonLat([116.41, 39.92]),
          zoom: 14,
          duration: 1000
        })
      }
    }

    return {
      mainMap,
      viewConfig,
      customPoints,
      customLines,
      customPolygons,
      measureHistory,
      showHeatmap,
      showClusters,
      handleMapCreated,
      handlePointCreated,
      handleLineCreated,
      handlePolygonCreated,
      handleDistanceMeasured,
      showHeatmapWithZoom,
      showClustersWithZoom
    }
  }
}
</script>

<style scoped>
/* 全局样式变量 */
:root {
  --primary-color: rgba(70, 130, 180, 0.8);
  --secondary-color: rgba(100, 149, 237, 0.6);
  --accent-color: rgba(30, 144, 255, 0.7);
  --bg-light: rgba(255, 255, 255, 0.85);
  --bg-lighter: rgba(255, 255, 255, 0.7);
  --text-primary: #2c3e50;
  --text-secondary: #34495e;
  --border-light: rgba(255, 255, 255, 0.2);
  --border-dark: rgba(70, 130, 180, 0.2);
  --shadow-light: rgba(0, 0, 0, 0.1);
}

/* 基础布局 */
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f0fa 100%);
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.top-bar {
  width: 100%;
  height: 80px;
  background: linear-gradient(to right, var(--primary-color), var(--accent-color));
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 10px var(--shadow-light);
  z-index: 10;
}

.header-title {
  margin: 0;
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.content-row {
  display: flex;
  width: 100%;
  height: calc(100vh - 80px);
  overflow: hidden;
}

/* 左侧面板样式 */
.left-col {
  width: 280px;
  background: var(--bg-lighter);
  backdrop-filter: blur(8px);
  border-right: 1px solid var(--border-light);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 15px;
  box-shadow: 2px 0 5px var(--shadow-light);
}

/* 中间地图区域 */
.middle-col {
  flex: 1;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;
}

/* 右侧面板样式 */
.right-col {
  width: 320px;
  background: var(--bg-lighter);
  backdrop-filter: blur(8px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 15px;
  box-shadow: -2px 0 5px var(--shadow-light);
}

/* 通用卡片样式 */
.public-map-wrapper,
.open-map-wrapper,
.ogc-map-wrapper,
.chuangjian-container,
.gongju-container {
  background: var(--bg-light);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px var(--shadow-light);
  transition: all 0.3s ease;
}

/* 卡片悬停效果 */
.public-map-wrapper:hover,
.open-map-wrapper:hover,
.ogc-map-wrapper:hover,
.chuangjian-container:hover,
.gongju-container:hover {
  transform: translateY(-10px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
  border-color: var(--border-dark);
}

/* 标题样式 */
.center-text {
  text-align: center;
  padding: 12px 0;
  margin: -15px -15px 15px -15px;
  font-weight: 600;
  color:var(--primary-color);
  font-size: 16px;
  background: linear-gradient(to right,
    rgba(70, 130, 180, 0.1),
    rgba(70, 130, 180, 0.3),
    rgba(70, 130, 180, 0.1));
  border-bottom: 1px solid var(--border-dark);
  position: relative;
  border-radius: 8px 8px 0 0;
}

.center-text:after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 25%;
  width: 50%;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--accent-color), transparent);
}

/* 控制按钮样式 */
.map-controls-center {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  gap: 10px;
  background: rgba(255, 255, 255, 0.7);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.control-button {
  padding: 8px 16px;
  background: linear-gradient(to right, var(--primary-color), var(--accent-color));
  color: var(--primary-color);
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  min-width: 100px;
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.control-button:active {
  transform: translateY(0);
}

/* 要素创建工具容器 */
.chuangjian-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .left-col {
    width: 240px;
  }
  .right-col {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .control-button {
    padding: 6px 12px;
    font-size: 13px;
    min-width: 80px;
  }
}
</style>