import Vue from 'vue'
import Router from 'vue-router'
import auth from './store/modules/AuthModule'
import Home from './views/Home.vue'

Vue.use(Router)

// tslint:disable-next-line:no-any
const ifAuthenticated = (to: any, from: any, next: any): void => {
  return auth.isAuthenticated ? next() : next('/login')
}

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      beforeEnter: ifAuthenticated
    },
    {
      path: '/login',
      name: 'login',
      component: (): Promise<typeof import('*.vue')> =>
        import(/* webpackChunkName: "login" */ './views/Login.vue')
    },
    {
      path: '/:worker/:view/control',
      name: 'control',
      component: (): Promise<typeof import('*.vue')> =>
        import(/* webpackChunkName: "control" */ './views/ControlView.vue')
    },
    { path: '*', redirect: '/' }
  ]
})
