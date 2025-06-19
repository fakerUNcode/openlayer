import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'

import Home from '../App.vue'
import menuData from './menus'

// 构造路由表
const routes = [{
  path: '/',
  name: 'home',
  component: Home,
  redirect: '/Map',
  children: []
}]
const makeRecord = data =>
{
  return {
    path: `/${data.name}`,
    name: data.name,
    meta: { url: data.url },
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* @vite-ignore */data.url)
  }
}

menuData.data.forEach(item =>
{
  if (item.url)
    routes[0].children.push(makeRecord(item))

  item.children?.forEach(data =>
  {
    if (data.url)
      routes[0].children.push(makeRecord(data))
  })
})

// 构造路由对象
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})


router.afterEach(to =>
{
  if (to.meta.url)
  {
    axios.get(to.meta.url.replace('../', ''), { encoding: 'utf8' }).then(ret =>
    {
      if (window.codeEditor)
        window.codeEditor.setValue(ret.data)
    })
  }
})

export default router
