<script setup>
import menuData from '../../router/menus'

import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'

const activeIndex = ''
const $router = useRouter()

/**
 * 处理菜单点击
 * @method
 * @param   {Object}       data           菜单数据对象
 */
const onClick = data =>
{
  if (data.url)
    $router.push(data.name)
  else
    ElNotification({message: '无效菜单！', type: 'warning', 'show-close': false})
}
</script>

<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-demo"
    mode="vertical"
  >
    <el-sub-menu v-for="menu in menuData.data"
      :key="menu.name"
      :index="menu.name"
    >
      <template #title>{{menu.title}}</template>
      <el-menu-item v-for="cmenu in menu.children"
        :key="cmenu.name"
        :index="cmenu.name"
        @click="onClick(cmenu)"
      >{{cmenu.title}}
      </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<style lang="scss" scoped>
.el-menu{
  --el-menu-bg-color: #f3eeee;
}
</style>