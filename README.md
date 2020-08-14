##### 一、简答题
###### 1、当我们点击按钮的时候动态给 data 增加的成员是否是响应式数据，如果不是的话，如何把新增成员设置成响应式数据，它的内部原理是什么。
```javascript
        let vm = new Vue({
            el: "#el",
            data: {
                o: "object",
                dog: {}
            },
            method: {
                clickHandler() {
                    // 该 name 属性是否是响应式的
                    this.dog.name = "Trump";
                }
            }
        });
```
答：
（1）点击按钮动态给 data 增加的成员不是响应式数据，因为vue在初始化的时候通过Object.defineProperty()的getter、setter方法实现了数据的监听，直接动态加载成员vue不会监听数据变化。
（2）使用vue中的this.$set(target,key,value)方法可实现把新增成员设置成响应式数据，该方法会重新调用Object.defineProperty()，监听新增加的成员。
 

###### 2、请简述 Diff 算法的执行过程

答：Diff算法对新旧虚拟DOM进行比较，但只会进行同层级比较，不会跨层级比较，执行过程如下：
（1）使用sameVnode方法比较 oldVnode和vnode，如果 vnode.key===oldVnode.key  &&  vnode.sel === oldVnode.sel，则继续向下比较，否则删除老的DOM节点,插入新的DOM节点。
（2）当在第一步中确定两个节点值得比较后使用patchVnode方法进行比较：
 -   找到对应的真实DOM，称为el
 - 判断Vnode和oldVnode是否指向同一对象，如果是，那么直接return
 - 判断他们是否都有文本节点，如果有文本节点且不相同，那么将el的文本节点设置为Vnode的文本节点
 - 如果oldVnode有子节点而Vnode没有，那么删除el的子节点
 - 如果oldVnode没有子节点而Vnode有，那么将Vnode的子节点的真实DOM添加到el
 - 如果两者都有子节点，则执行updateChildren方法比较子节点
（3）updateChildren方法获取新老节点各自的头尾索引值oldStartIndex、oldEndIndex、newStartIndex、newEndIndex,对新老节点的头尾节点进行两两比较，具体执行过程如下：
 -  oldStartIndex vs newStartIndex，若相同，则执行一次patchVnode过程，递归对比相应子节点。oldStartIndex 、oldStartIndex 都向右移动一位。
 -  oldEndIndex vs newEndIndex，若相同，则执行一次patchVnode过程，递归对比相应子节点。oldEndIndex 、newEndIndex都向左移动一位。
 -  oldStartIndex vs newEndIndex，若相同，则执行一次patchVnode过程，递归对比相应子节点。并将oldStartVnode移动到尾部，oldStartIndex 右移一位，newEndIndex左移一位
 - oldEndIndex vs newStartIndex，若相同，则执行一次patchVnode过程，递归对比相应子节点。并将oldEndIndex 移动到头部，oldEndIndex 左移一位，newStartIndex右移一位。
 - 循环以上过程，直至oldStartIndex>=oldEndIndex后者 newStartIndex>=newEndIndex。当老节点先遍历完时，批量增加剩余的新节点；当新节点先遍历完时，批量删除尚未遍历的老节点。
 
 

#####  二、编程题
###### 1、模拟 VueRouter 的 hash 模式的实现，实现思路和 History 模式类似，把 URL 中的 # 后面的内容作为路由的地址，可以通过 hashchange 事件监听路由地址的变化。

```javascript
let _Vue = null;
export default class VueRouter {
    static install(Vue) {
        // 1.判断当前插件是否已经被安装
        if (VueRouter.install.installed) {
            return;
        }
        VueRouter.install.installed = true;
        // 2.把Vue构造函数记录到全局变量
        _Vue = Vue;
        // 3.把创建Vue实例时传入的router对象注入到Vue实例上
        _Vue.mixin({
            beforeCreate() {
                if (this.$options.router) {
                    _Vue.prototype.$router = this.$options.router;
                    this.$options.router.init();
                }
            },
        });
    }
    constructor(options) {
        this.$options = options;
        this.routeMap = {};
        this.data = _Vue.observable({
            current: "/",
        });
    }

    init() {
        this.createRouteMap();
        this.initComponents(_Vue);
        this.initEvent();
    }
    createRouteMap() {
        // 遍历所有路由规则，把路由规则解析成键值对的形式存储到routeMap中
        this.$options.routes.forEach((route) => {
            this.routeMap[route.path] = route.component;
        });
    }

    initComponents(Vue) {
        Vue.component("router-link", {
            props: {
                to: String,
            },
            // template: '<a :href="to"><slot></slot></a>'
            render(h) {
                return h(
                    "a",
                    {
                        attrs: {
                            href: "#" + this.to,
                        },
                        on: {
                            click: this.clickHanlder,
                        },
                    },
                    [this.$slots.default]
                );
            },
            methods: {
                clickHanlder(e) {
                    history.pushState({}, "", "#" + this.to);
                    this.$router.data.current = this.to;
                    e.preventDefault();
                },
            },
        });
        const self = this;
        Vue.component("router-view", {
            render(h) {
                const component = self.routeMap[self.data.current];
                return h(component);
            },
        });
    }

    initEvent() {
        // 实现浏览器前进后退时刷新页面的功能
        window.addEventListener("hashchange", () => {
            this.data.current = window.location.hash.slice(1);
        });
    }
}

```

######  2、在模拟 Vue.js 响应式源码的基础上实现 v-html 指令，以及 v-on 指令。

答：在compiler文件中实现v-html和v-on指令。
```javascript
// 负责编译模板，解析指令和插值表达式
// 负责页面的首次渲染
// 当数据变化时重新渲染视图
class Compliler {
    constructor(vm) {
        this.el = vm.$el;
        this.vm = vm;

        this.compile(this.el)
    }

    // 编译模板，处理文本节点和yuansujiedian
    compile(el) {
        let childNodes = el.childNodes;
        Array.from(childNodes).forEach(node => {
            if (this.isTextNode(node)) {
                this.compileText(node)
            } else if (this.isElementNode(node)) {
                this.compileElement(node)
            }

            // node节点是否有子节点
            if (node.childNodes && node.childNodes.length) {
                this.compile(node)
            }
        })
    }

    // 编译元素节点，处理指令
    compileElement(node) {
        // 遍历所有的属性节点
        Array.from(node.attributes).forEach(attr => {
            let attrName = attr.name;
            console.log(attrName)
            if (this.isDerective(attrName)) {
                if (attrName.startsWith('v-on:')) {
                    let eventName = attrName.substr(5);
                    let methodName = attr.value;
                    this.addEvents(node, eventName, methodName)
                } else {
                    attrName = attrName.substr(2);
                    let key = attr.value;
                    this.updater(node, key, attrName)
                }
            }
        })
    }

    updater(node, key, attrName) {
        let updateFn = this[attrName + 'Updater'];
        updateFn && updateFn.call(this, node, this.vm[key], key)
    }
    // 处理 v-text 指令
    textUpdater(node, value, key) {
        node.textContent = value
        new Watcher(this.vm, key, (newValue) => {
            node.textContent = newValue
        })
    }
    // 处理 v-model 指令
    modelUpdater(node, value, key) {
        node.value = value
        new Watcher(this.vm, key, (newValue) => {
            node.value = newValue
        })

        // 实现双向绑定
        node.addEventListener('input', () => {
            this.vm[key] = node.value;
        })
    }

    // 处理 v-html 指令
    htmlUpdater(node, value, key) {
        node.innerHTML = value;
        new Watcher(this.vm, key, (newValue) => {
            node.innerHTML = newValue
        })
    }

    // 处理 v-on 指令
    addEvents(node, eventName, methodName) {
        node.addEventListener(eventName, () => {
            if (this.vm.$options.method && this.vm.$options.method[methodName]) {
                this.vm.$options.method[methodName]();
            }
        })

    }

    // 编译文本节点，处理插值表达式
    compileText(node) {
        // {{ msg }}
        let reg = /\{\{(.+?)\}\}/;
        let value = node.textContent;
        if (reg.test(value)) {
            let key = RegExp.$1.trim();
            node.textContent = value.replace(reg, this.vm[key])

            // 创建watcher对象，当数据改变时更新视图
            new Watcher(this.vm, key, (newValue) => {
                node.textContent = newValue
            })
        }
    }

    // 判断元素属性是否为指令
    isDerective(attrName) {
        return attrName.startsWith('v-')
    }

    // 判断节点是否是元素节点
    isElementNode(node) {
        return node.nodeType === 1
    }

    // 判断节点是否是文本节点
    isTextNode(node) {
        return node.nodeType === 3
    }
}
```

 

######  3、参考 Snabbdom 提供的电影列表的示例，利用Snabbdom 实现类似的效果，如图：

```javascript
import { init } from "./libs/snabbdom/build/package/init.js";
import { classModule } from "./libs/snabbdom/build/package/modules/class.js";
import { propsModule } from "./libs/snabbdom/build/package/modules/props.js";
import { styleModule } from "./libs/snabbdom/build/package/modules/style.js";
import { eventListenersModule } from "./libs/snabbdom/build/package/modules/eventlisteners.js";
import { h } from "./libs/snabbdom/build/package/h.js";

const patch = init([
    classModule,
    propsModule,
    styleModule,
    eventListenersModule,
]);

var vnode;

var nextKey = 11;
var margin = 8;
var sortBy = "rank";
var totalHeight = 0;

var originalData = [
    {
        rank: 1,
        title: "The Shawshank Redemption",
        desc:
            "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        elmHeight: 0,
    },
    {
        rank: 2,
        title: "The Godfather",
        desc:
            "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
        elmHeight: 0,
    },
    {
        rank: 3,
        title: "The Godfather: Part II",
        desc:
            "The early life and career of Vito Corleone in 1920s New York is portrayed while his son, Michael, expands and tightens his grip on his crime syndicate stretching from Lake Tahoe, Nevada to pre-revolution 1958 Cuba.",
        elmHeight: 0,
    },
    {
        rank: 4,
        title: "The Dark Knight",
        desc:
            "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, the caped crusader must come to terms with one of the greatest psychological tests of his ability to fight injustice.",
        elmHeight: 0,
    },
    {
        rank: 5,
        title: "Pulp Fiction",
        desc:
            "The lives of two mob hit men, a boxer, a gangster's wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
        elmHeight: 0,
    },
    {
        rank: 6,
        title: "Schindler's List",
        desc:
            "In Poland during World War II, Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.",
        elmHeight: 0,
    },
    {
        rank: 7,
        title: "12 Angry Men",
        desc:
            "A dissenting juror in a murder trial slowly manages to convince the others that the case is not as obviously clear as it seemed in court.",
        elmHeight: 0,
    },
    {
        rank: 8,
        title: "The Good, the Bad and the Ugly",
        desc:
            "A bounty hunting scam joins two men in an uneasy alliance against a third in a race to find a fortune in gold buried in a remote cemetery.",
        elmHeight: 0,
    },
    {
        rank: 9,
        title: "The Lord of the Rings: The Return of the King",
        desc:
            "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.",
        elmHeight: 0,
    },
    {
        rank: 10,
        title: "Fight Club",
        desc:
            "An insomniac office worker looking for a way to change his life crosses paths with a devil-may-care soap maker and they form an underground fight club that evolves into something much, much more...",
        elmHeight: 0,
    },
];
var data = [
    originalData[0],
    originalData[1],
    originalData[2],
    originalData[3],
    originalData[4],
    originalData[5],
    originalData[6],
    originalData[7],
    originalData[8],
    originalData[9],
];
function changeSort(prop) {
    sortBy = prop;
    data.sort((a, b) => {
        if (a[prop] > b[prop]) {
            return 1;
        }
        if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    });
    render();
}

function view(data) {
    return h("div", [
        h("h1", "Top 10 movies"),
        h("div", [
            h("a.btn.add", { on: { click: add } }, "Add"),
            "Sort by: ",
            h("span.btn-group", [
                h(
                    "a.btn.rank",
                    {
                        class: { active: sortBy === "rank" },
                        on: { click: [changeSort, "rank"] },
                    },
                    "Rank"
                ),
                h(
                    "a.btn.title",
                    {
                        class: { active: sortBy === "title" },
                        on: { click: [changeSort, "title"] },
                    },
                    "Title"
                ),
                h(
                    "a.btn.desc",
                    {
                        class: { active: sortBy === "desc" },
                        on: { click: [changeSort, "desc"] },
                    },
                    "Description"
                ),
            ]),
        ]),
        h(
            "div.list",
            { style: { height: totalHeight + "px" } },
            data.map(movieView)
        ),
    ]);
}

function add() {
    var n = originalData[Math.floor(Math.random() * 10)];
    data = [
        { rank: nextKey++, title: n.title, desc: n.desc, elmHeight: 0 },
    ].concat(data);
    render();
    render();
}

function remove(movie) {
    data = data.filter((m) => {
        return m !== movie;
    });
    render();
}

function movieView(movie) {
    return h(
        "div.row",
        {
            key: movie.rank,
            style: {
                opacity: "0",
                transform: "translate(-200px)",
                delayed: {
                    transform: `translateY(${movie.offset}px)`,
                    opacity: "1",
                },
                remove: {
                    opacity: "0",
                    transform: `translateY(${movie.offset}px) translateX(200px)`,
                },
            },
            hook: {
                insert: (vnode) => {
                    movie.elmHeight = vnode.elm.offsetHeight;
                },
            },
        },
        [
            h("div", { style: { fontWeight: "bold" } }, movie.rank),
            h("div", movie.title),
            h("div", movie.desc),
            h("div.btn.rm-btn", { on: { click: [remove, movie] } }, "x"),
        ]
    );
}

function render() {
    data = data.reduce((acc, m) => {
        var last = acc[acc.length - 1];
        m.offset = last ? last.offset + last.elmHeight + margin : margin;
        return acc.concat(m);
    }, []);
    totalHeight =
        data.length === 0
            ? 0
            : data[data.length - 1].offset + data[data.length - 1].elmHeight;
    vnode = patch(vnode, view(data));
}
window.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("container");
    vnode = patch(container, view(data));
    render();
});

```
