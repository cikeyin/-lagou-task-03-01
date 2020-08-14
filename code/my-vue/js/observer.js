// 负责把data中的属性转换成响应式数据
// data中某个属性也是对象时，把该对象转换成响应式数据
// 数据变化发送通知
class Observer {
    constructor(data) {
        this.walk(data)
    }
    // 遍历data
    walk(data) {
        // 1. 判断data是否为对象
        if (!data || typeof data !== 'object') {
            return
        }
        Object.keys(data).forEach(key => {
            this.defineReactive(data, key, data[key])
        })
    }
    // 为什么有了obj和key还要传val？
    // 因为vue.js中已经把data中的值进行了get处理，此处再获取data[key]会引起死循环
    defineReactive(obj, key, val) {
        let that = this;
        // 负责收集依赖，并发送通知
        let dep = new Dep();
        // 如果val是对象，将val设置为响应式数据
        this.walk(val);
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                // 收集依赖
                Dep.target && dep.addSub(Dep.target)
                return val
            },
            set(newValue) {
                if (newValue === val) {
                    return
                }
                val = newValue

                // 如果newValue是对象，将newValue设置为响应式数据
                that.walk(newValue)

                // 发送通知
                dep.notify()
            }
        })


    }
}