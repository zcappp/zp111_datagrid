import React from "react"
// https://handsontable.com/docs/javascript-data-grid/

function init(ref) {
    ref.exc('load(["https://z.zccdn.cn/vendor/handsontable/handsontable.full.min.css", "https://z.zccdn.cn/vendor/handsontable/handsontable.full.min.js", "https://z.zccdn.cn/vendor/handsontable/handsontable.zh-CN.min.js"])', {}, () => {
        const hot = new Handsontable(ref.container, {
            data: [
                { id: 1, name: 'Ted Right', address: 'da' },
                { id: 2, name: 'Frank Honest', address: '' },
                { id: 3, name: 'Joan Well', address: '' },
                { id: 4, name: 'Gail Polite', address: '' },
                { id: 5, name: 'Michael Fair', address: '' },
            ],
            rowHeaders: true,
            colHeaders: true,
            height: 'auto',
            licenseKey: 'non-commercial-and-evaluation',
            language: 'zh-CN',
            locale: 'zh-CN',
            contextMenu: true,
            afterChange: (change, source) => {
                if (!change) return
                log(source)
                change.forEach(([row, prop, oldVal, newVal]) => {
                    log(row, prop, oldVal == newVal)
                })
            }
        });
    })
}

$plugin({
    id: "zp111",
    props: [{
        prop: "cfg",
        type: "text",
        label: "数据配置",
        ph: "(用小括号)"
    }, {
        prop: "opt",
        type: "text",
        label: "选项",
        ph: "(用小括号)"
    }],
    init
})