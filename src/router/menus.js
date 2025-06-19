export default {
  data: [
    { title: '地图控件', name: 'control', children: [
      { title: '地图', name: 'Map', url: '../views/Map.vue', params: null },
      { title: '地图操作', name: 'MapOper', url: '../views/control/MapOper.vue', params: null },
      { title: '缩放控件', name: 'Zoom', url: '../views/control/Zoom.vue', params: null },
      { title: '比例尺', name: 'ScaleLine', url: '../views/control/ScaleLine.vue', params: null },
      { title: '地图鹰眼', name: 'OverviewMap', url: '../views/control/OverviewMap.vue', params: null },
      { title: '鼠标位置', name: 'MousePosition', url: '../views/control/MousePosition.vue', params: null },
      { title: '图层控件', name: 'LayerManage', url: '../views/control/LayerManage.vue', params: null }
    ]},
    { title: '多元数据', name: 'dataService', children: [
      { title: '公开地图', name: 'PublicMap', url: '../views/dataService/PublicMap.vue', params: null },
      { title: 'OGC地图', name: 'OGCMap', url: '../views/dataService/OGCMap.vue', params: null },
      { title: '开放地图', name: 'OpenMap', url: '../views/dataService/OpenMap.vue', params: null }
    ]},
    { title: '图形绘制', name: 'GraDraw', children: [
      { title: '绘制点', name: 'DrawPoint', url: '../views/graDraw/DrawPoint.vue', params: null },
      { title: '绘制线', name: 'DrawLine', url: '../views/graDraw/DrawLine.vue', params: null },
      { title: '绘制面', name: 'DrawPolygon', url: '../views/graDraw/DrawPolygon.vue', params: null },
      { title: '绘制贝赛尔曲线', name: 'DrawBezier', url: '../views/graDraw/DrawBezier.vue', params: null },
      { title: '图形样式定制', name: 'CustomStyle', url: '../views/graDraw/CustomStyle.vue', params: null }
    ]},
    { title: '图形编辑', name: 'GraEdit', children: [
      { title: '图形选中', name: 'GraSelect', url: '../views/graEdit/GraSelect.vue', params: null },
      { title: '图形平移', name: 'GraMove', url: '../views/graEdit/GraMove.vue', params: null },
      { title: '图形旋转', name: 'GraRotate', url: '../views/graEdit/GraRotate.vue', params: null }
    ]},
    { title: '标注功能', name: 'Label', children: [
      { title: '文本标注', name: 'TextLabel', url: '../views/label/TextLabel.vue', params: null },
      { title: '气泡标注', name: 'PopupLabel', url: '../views/label/PopupLabel.vue', params: null },
      { title: '聚合标注', name: 'ClusterLabel', url: '../views/label/ClusterLabel.vue', params: null }
    ]},
    { title: '地图制图', name: 'MakeMap', children: [
      { title: '热力图', name: 'HeatMap', url: '../views/makeMap/HeatMap.vue', params: null },
      { title: '统计图', name: 'StatMap', url: '../views/makeMap/StatMap.vue', params: null },
      { title: '分级着色专题图', name: 'ColorMap', url: '../views/makeMap/ColorMap.vue', params: null },
      { title: '自定义瓦片图颜色', name: 'ColorTileMap', url: '../views/makeMap/ColorTileMap.vue', params: null }
    ]},
    { title: '地图特效', name: 'MapEffect', children: [
      { title: '分屏效果', name: 'SplitScreen', url: '../views/mapEffect/SplitScreen.vue', params: null },
      { title: '卷帘效果', name: 'RollerMap', url: '../views/mapEffect/RollerMap.vue', params: null },
      { title: '动画特效', name: 'Animation', url: '../views/mapEffect/Animation.vue', params: null },
      { title: 'WebGl渲染海量数据', name: 'WebglRender', url: '../views/mapEffect/WebglRender.vue', params: null }
    ]},
  ]
}
