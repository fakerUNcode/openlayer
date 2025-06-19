# 缓存清除与环境搭建

项目移植到不同的机器环境后，请确保使用正确Node版本，可尝试:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

# 启动命令

开发模式启动命令：

```bash
npm run dev
```

生产构建命令：

```bash
npm run build
```

# 关键代码实现

## 地图初始化核心代码

在Map.vue组件中实现地图实例创建与配置：

```javascript
// 使用Composition API初始化地图
const setupMap = () => {
  const map = ref(null)
  const viewConfig = {
    center: fromLonLat([116.404, 39.915]), // 默认北京坐标
    zoom: 15,
    projection: 'EPSG:3857'
  }

  onMounted(() => {
    map.value = new OlMap({
      target: mapContainer.value,
      layers: [
        new TileLayer({
          source: new OSM() // 默认OSM底图
        })
      ],
      view: new View(viewConfig)
    })
    emit('created', map.value) // 向父组件传递地图实例
  })

  onUnmounted(() => {
    map.value?.setTarget(undefined) // 清理地图实例
  })

  return { map }
}
```

## 点要素绘制实现

在dian.vue中实现交互式点要素创建：

```javascript
// 地图点击事件处理
const handleMapClick = (event) => {
  if (!isInteractiveMode.value) return
  
  const coordinates = toLonLat(event.coordinate)
  const newPoint = {
    id: `point_${Date.now()}`,
    coordinates,
    info: pointInfo.value || `点${customPoints.value.length + 1}`
  }

  // 创建OpenLayers要素
  const feature = new Feature({
    geometry: new Point(event.coordinate),
    info: newPoint.info
  })
  feature.setStyle(createPointStyle())
  vectorSource.value.addFeature(feature)

  emit('pointCreated', newPoint) // 触发创建事件
}
```

## 路径规划核心算法

PathPlanning.vue中实现路径计算逻辑：

```javascript
// 调用OpenRouteService API
const calculatePath = async () => {
  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${apiKey}
      &start=${startPoint.value[0]},${startPoint.value[1]}
      &end=${endPoint.value[0]},${endPoint.value[1]}`
    )
    
    const data = await response.json()
    const coordinates = data.features[0].geometry.coordinates
      .map(coord => fromLonLat(coord))
    
    // 创建路径线要素
    const line = new LineString(coordinates)
    const feature = new Feature({
      geometry: line,
      type: 'path'
    })
    
    // 更新路径图层
    pathLayer.value.getSource().clear()
    pathLayer.value.getSource().addFeature(feature)
    
    // 计算距离和时间
    distance.value = data.features[0].properties.summary.distance
    duration.value = Math.round(data.features[0].properties.summary.duration / 60)
    
  } catch (error) {
    console.error('路径规划失败:', error)
    fallbackToStraightLine() // 降级处理
  }
}
```

## KML导出功能实现

Kml.vue中实现点数据导出：

```javascript
const exportKML = () => {
  if (!props.points?.length) {
    errorMessage.value = '没有点可导出'
    return
  }

  const kmlFormat = new KML()
  const features = props.points.map(point => {
    const feature = new Feature({
      geometry: new Point(fromLonLat(point.coordinates)),
      name: `点 ${point.id}`,
      description: `坐标: ${point.coordinates[0].toFixed(6)}, ${point.coordinates[1].toFixed(6)}`
    })
    return feature
  })

  const kmlString = kmlFormat.writeFeatures(features, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  })

  // 触发文件下载
  const blob = new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `地图点_${new Date().toISOString().slice(0,19)}.kml`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

## 热力图数据生成

在App.vue中实现热力图数据转换：

```javascript
// 转换模拟数据为热力图特征
const generateHeatmapData = () => {
  const source = new VectorSource()
  
  mockPoints.forEach(point => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([point.lon, point.lat])),
      weight: point.value / 10 // 标准化权重值
    })
    source.addFeature(feature)
  })

  return new Heatmap({
    source,
    blur: 15,
    radius: 10,
    weight: feature => feature.get('weight') || 0.5
  })
}
```

##  测量工具核心逻辑

juli.vue中实现距离计算：

```javascript
// 实时计算测量距离
const calculateDistance = () => {
  if (measurePoints.value.length < 2) {
    currentDistance.value = 0
    return
  }

  try {
    const line = new LineString(measurePoints.value)
    currentDistance.value = getDistance(line, {
      projection: map.value.getView().getProjection()
    })
    
    // 计算总距离
    totalDistance.value = 0
    for (let i = 0; i < measurePoints.value.length - 1; i++) {
      const segment = new LineString([
        measurePoints.value[i], 
        measurePoints.value[i+1]
      ])
      totalDistance.value += getDistance(segment, {
        projection: map.value.getView().getProjection()
      })
    }
  } catch (error) {
    console.error('距离计算错误:', error)
  }
}
```



所有关键代码实现均遵循Vue 3的Composition API规范，通过ref和reactive管理组件状态，使用watch和computed处理响应式数据变化。