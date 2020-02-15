import Vue from 'vue';
import Router from 'vue-router';
import auth from './store/modules/AuthModule';
import Home from './views/Home.vue';

Vue.use(Router);

// tslint:disable-next-line:no-any
const ifAuthenticated = (to: any, from: any, next: any): void => {
    if (auth.isAuthenticated) {
        next();
        return;
    }
    next('/login');
};

export default new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home,
            beforeEnter: ifAuthenticated,
        },
        {
            path: '/about',
            name: 'about',
            // route level code-splitting
            // this generates a separate chunk (about.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: (): Promise<typeof import('*.vue')> =>
                import(/* webpackChunkName: "about" */ './views/About.vue'),

            beforeEnter: ifAuthenticated,
        },
        {
            path: '/articles',
            name: 'articles',
            component: (): Promise<typeof import('*.vue')> =>
                import(/* webpackChunkName: "articles" */ './views/Articles.vue'),

            beforeEnter: ifAuthenticated,
        },
        {
            path: '/article/:id',
            name: 'article',
            component: (): Promise<typeof import('*.vue')> =>
                import(/* webpackChunkName: "articles" */ './views/ArticleView.vue'),

            beforeEnter: ifAuthenticated,
        },
        {
            path: '/login',
            name: 'login',
            component: (): Promise<typeof import('*.vue')> =>
                import(/* webpackChunkName: "login" */ './views/Login.vue'),
        },
        { path: '*', redirect: '/' },
    ],
});
