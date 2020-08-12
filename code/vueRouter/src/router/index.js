import Vue from "vue";
import VueRouter from "../index.js";

Vue.use(VueRouter);

const routes = [{
        path: "/a",
        name: "1",
        component: () => import("../components/1.vue"),
    },
    {
        path: "/b",
        name: "2",
        component: () => import("../components/2.vue"),
    },
];

const router = new VueRouter({
    routes,
});

export default router;