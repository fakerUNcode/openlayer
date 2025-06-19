<script setup>
import { onMounted, ref } from 'vue'
import * as monaco from 'monaco-editor'

import Header from './Header.vue'
import SideMenu from './SideMenu.vue'


// 定义元素句柄
const codeEdit = ref()
onMounted(() =>
{
  window.codeEditor = monaco.editor.create(codeEdit.value, {
    value: '',
    language: 'html',
    contextmenu: false,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    }
  })
})
</script>

<template>
  <el-container class="home">
    <el-header class="elHeader">
      <Header/>
    </el-header>
    <el-container class="center">
      <el-aside class="leftAside">
        <SideMenu/>
      </el-aside>
      <div ref="codeEdit" class="codeEdit"></div>
      <el-main class="mainReion">
        <router-view/>
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.home {display: flex;flex-direction: column;width: 100vw;height: 100vh;background-color: #ffffff;overflow: hidden;
  .elHeader {padding: 0;}
  .center {overflow: hidden;}
  .leftAside {width: 230px;background-color: #f3eeee;}
  .codeEdit {width: 600px;height: 100%;}
  .mainReion {padding: 0;}
}
</style>
