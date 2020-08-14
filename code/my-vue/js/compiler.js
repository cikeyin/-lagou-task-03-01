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