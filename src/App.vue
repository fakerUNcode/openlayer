<template>
  <div class="app-container">
    <!-- 顶部区域 -->
    <div class="top-bar">
      <h1 class="header-title">Openlayers地图管理系统</h1> <!-- 新增标题 -->
    </div>
    <!-- 中间内容区域，包含三列 -->
    <div class="content-row">
      <div class="left-col">
        <!-- 给 PublicMap 套容器 -->
        <div v-if="mainMap" class="public-map-wrapper">
          <div class="center-text">数据图层选择</div>
          <PublicMap :map="mainMap" />
        </div>
        <!-- 给 OpenMap 套容器，放在 PublicMap 下方 -->
        <div v-if="mainMap" class="open-map-wrapper">
          <div class="center-text">矢量数据图层选择</div>
          <OpenMap :map="mainMap" />
        </div>
        <div v-if="mainMap" class="ogc-map-wrapper">
          <div class="center-text">其他图层服务</div>
          <OGCMap 
            :map="mainMap" 
            tianKey="01270f58d46fa3e4e48c1a6a5d8625fb" 
            wmsUrl="http://localhost:8080/geoserver/nurc/wms" 
            wfsUrl="http://localhost:8080/geoserver/sf/ows" 
          />
        </div>
      </div>
      <!-- 引入 Map 组件 -->
      <div class="middle-col">
        <Map 
          :view-conf="{
            center: [12758612.973162018, 3562849.0216611675],
            zoom: 17.5
          }" 
          :def-lyrs="['vec_c']" 
          @created="handleMapCreated" 
        />
      </div>
      <div class="right-col">
        <div class="center-text">数据管理</div>
        <div class="chuangjian-container">
          <div class="center-text">创建要素</div>
          <!-- 重构后直接使用Dian组件 -->
          <Dian 
            v-if="mainMap" 
            :map="mainMap" 
            :customPoints="customPoints" 
            @pointCreated="handlePointCreated"
          />
          <!-- 新增：使用 xian.vue 组件 -->
          <Xian 
            v-if="mainMap" 
            :map="mainMap" 
            @lineCreated="handleLineCreated"
          />
        </div>
        <div class="gongju-container">
          <div class="center-text">工具</div>
          <!-- 新增距离测量组件 -->
          <Juli 
            v-if="mainMap" 
            :map="mainMap" 
            @distanceMeasured="handleDistanceMeasured"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import Map from './views/Map.vue'
import PublicMap from './views/dataService/PublicMap.vue' 
import OpenMap from './views/dataService/OpenMap.vue' 
import OGCMap from './views/dataService/OGCMap.vue' 
import Dian from './huitu/dian.vue'
import Xian from './huitu/xian.vue' 
import Juli from './gongju/juli.vue'
import { nextTick } from 'vue';

export default {
  name: 'App',
  components: {
    Map,
    PublicMap,
    OpenMap,
    OGCMap,
    Dian,
    Xian,
    Juli 
  },
  setup() {
    const mainMap = ref(null)
    const customPoints = ref([])
    const customLines = ref([]) 
    const measureHistory = ref([]) // 新增：定义 measureHistory
    const errorMessage = ref('')
    
    const handleMapCreated = (map) => {
      console.log('主地图创建完成', map)
      mainMap.value = map 
    }
    
    const handlePointCreated = (newPoint) => {
      customPoints.value.push(newPoint)
      console.log('创建点成功:', newPoint.coordinates)
    }
    
    const handleLineCreated = (newLine) => {
      customLines.value.push(newLine)
      console.log('创建线成功:', newLine.coordinates)
    }

    const handleDistanceMeasured = (measureData) => {
  console.log('测量数据:', measureData);
  // 验证距离是否为有效数值
  if (isNaN(measureData.distance)) {
    console.error('接收到无效距离数据');
    return;
  }
  measureHistory.value.push({
    id: Date.now(),
    points: measureData.points,
    distance: measureData.distance,
    timestamp: new Date()
  });
  console.log('距离测量完成:', measureData.distance, '米');
  nextTick(() => {
    window.alert(`距离测量完成：${measureData.distance.toFixed(2)} 米`);
  });
}
    
    return {
      mainMap,
      handleMapCreated,
      customPoints,
      handlePointCreated,
      customLines,
      handleLineCreated,
      measureHistory,
      handleDistanceMeasured,
      errorMessage
    }
  }
}
</script>

<style scoped>
/* ===== 全局变量与基础样式 ===== */
:root {
  --primary-color: rgba(70, 130, 180, 0.8);       /* 主蓝 */
  --secondary-color: rgba(100, 149, 237, 0.6);    /* 中蓝 */
  --accent-color: rgba(30, 144, 255, 0.7);       /* 亮蓝 */
  --bg-light: rgba(255, 255, 255, 0.85);         /* 亮背景 */
  --bg-lighter: rgba(255, 255, 255, 0.7);        /* 更亮背景 */
  --text-primary: #2c3e50;                       /* 深灰蓝文字 */
  --text-secondary: #34495e;                     /* 中灰蓝文字 */
  --border-light: rgba(255, 255, 255, 0.2);      /* 亮边框 */
  --border-dark: rgba(70, 130, 180, 0.2);        /* 蓝灰边框 */
  --shadow-light: rgba(0, 0, 0, 0.1);            /* 柔和阴影 */
}

/* ===== 整体布局 ===== */
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f0fa 100%);
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 顶部导航栏 ===== */
.top-bar {
  width: 100%;
  height: 80px;
  background: linear-gradient(to right, 
    var(--primary-color), 
    var(--accent-color));
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 10px var(--shadow-light);
  z-index: 10;
}

.top-bar .header-title {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ===== 主内容区 ===== */
.content-row {
  display: flex;
  width: 100%;
  height: calc(100vh - 80px);
  overflow: hidden;
}

/* ===== 左侧面板 ===== */
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

/* ===== 中间地图区 ===== */
.middle-col {
  flex: 1;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;
}

/* ===== 右侧面板 ===== */
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

/* ===== 通用卡片样式 ===== */
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

/* ===== 标题样式 ===== */
.center-text {
  text-align: center;
  padding: 12px 0;
  margin: -15px -15px 15px -15px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
  background: linear-gradient(to right, 
    rgba(70, 130, 180, 0.1), 
    rgba(70, 130, 180, 0.3), 
    rgba(70, 130, 180, 0.1));
  border-bottom: 1px solid var(--border-dark);
  position: relative;
  border-radius: 8px 8px 0 0;
}

/* 标题装饰线 */
.center-text:after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 25%;
  width: 50%;
  height: 1px;
  background: linear-gradient(to right, 
    transparent, 
    var(--accent-color), 
    transparent);
}

/* ===== 滚动条美化 ===== */
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

/* ===== 响应式设计 ===== */
@media (max-width: 1200px) {
  .left-col {
    width: 240px;
  }
  .right-col {
    width: 280px;
  }
}

/* ===== 穿透样式 ===== */
:deep(.open-map-wrapper .control-wrapper) {
  position: static;
  margin: 0;
}

:deep(.open-map-wrapper .control) {
  position: static;
  width: 100%;
}
</style>