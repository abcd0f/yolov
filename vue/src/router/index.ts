import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/model'
    },
    {
      path: '/model',
      name: 'model',
      component: () => import('@/views/model/index.vue')
    },
    {
      path: '/img',
      name: 'img',
      component: () => import('@/views/model/img.vue')
    }
  ]
});

export default router;
