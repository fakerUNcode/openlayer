<script setup>
import MousePosition from 'ol/control/MousePosition.js'

import Map from '../Map.vue'

const createMousePosition = map =>
{
  // 创建鼠标位置控件
  const control = new MousePosition({className: 'mousPos'})

  // 控件添加到地图
  map.addControl(control)
}

</script>

<template>
  <Map @created="createMousePosition"></Map>
</template>

<style>
  .mousPos {position: absolute;top: 8px;right: 8px;color:red;}
</style>
