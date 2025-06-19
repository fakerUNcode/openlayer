<script setup>
import ScaleLine from 'ol/control/ScaleLine.js'

import Map from '../Map.vue'

let olmap = null
let scale = null
const createScale = map =>
{
  olmap = map

  // 创建默认比例尺
  onScaleChange()
}

const onScaleChange = type =>
{
  if (!olmap)
    return

  // 移除旧比例尺
  scale && olmap.removeControl(scale)
  // 创建新比例尺
  scale = new ScaleLine({ bar: type === 'bar' })
  // 添加到地图
  olmap.addControl(scale)
}
</script>

<template>
  <Map @created="createScale"></Map>
  <div class="control">
    <el-button @click="onScaleChange('line')">比例尺线</el-button>
    <el-button @click="onScaleChange('bar')">比例尺条</el-button>
  </div>
</template>

<style>
.control {position: absolute;left:80px;top:10px;}
</style>
