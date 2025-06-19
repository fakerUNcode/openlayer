<script setup>
import logo from '@/assets/favicon.ico'

const title = 'WebGIS OpenLayers实例'
const buttons = [
  { text: 'ol官网API', url: 'https://openlayers.org/en/latest/apidoc/' },
  { text: 'ol官网Demo', url: 'https://openlayers.org/en/latest/examples/' }
]

const onClick = button =>
{
  window.open(button.url)
}
</script>

<template>
  <header class="header">
    <div class="title">
      <img class="logo" :src="logo" alt="暂无图片"/>
      <span>{{title}}</span>
    </div>
    <div class="title">
      <el-button v-for="button in buttons"
        :key="button.text"
        type="primary"
        text
        @click="onClick(button)"
      >{{ button.text }}
      </el-button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {display:flex;flex-direction:row;justify-content:space-between;align-items: center;height:100%;background:#333333;padding: 0 30px;}
.logo {height:90%;margin-right: 5px;}
.title {display:flex;flex-direction:row;justify-content:space-between;align-items: center;height:100%;font-size: 22px;}

.el-button.is-text:not(.is-disabled):focus, .el-button.is-text:not(.is-disabled):hover {
  background-color: #4e4e4e;
}
</style>