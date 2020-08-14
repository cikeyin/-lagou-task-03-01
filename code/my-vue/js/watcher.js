class Watcher {
    constructor(vm, key, cb) {
        this.vm = vm;
        // data中的属性名称
        this.key = key;
        // 回调函数，负责更新视图
        this.cb = cb;

        // 把watcher对象记录到Dep类的静态属性target上，Observer中会用到
        Dep.target = this;
        // 触发get方法，在get方法中会调用addSub
        this.oldValue = vm[key];
        Dep.target = null;
    }
    update() {
        let newValue = this.vm[this.key];
        if (this.newValue === this.oldValue) {
            return
        }
        this.cb(newValue)
    }
}