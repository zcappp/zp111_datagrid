// https://handsontable.com/docs/javascript-data-grid/ https://github.com/handsontable/handsontable/issues/10647
let exc

function init(ref) {
    exc = ref.exc
    exc('load(["https://z.zccdn.cn/vendor/handsontable/handsontable.full.min.css", "https://z.zccdn.cn/vendor/handsontable/handsontable.full.min.js", "https://z.zccdn.cn/vendor/handsontable/handsontable.zh-CN.min.js"])', {}, () => ini(ref))
}

function ini(ref) {
    let { container } = ref
    const P = ref.props
    let O = {
        licenseKey: 'non-commercial-and-evaluation',
        afterUndoStackChange,
        minSpareRows: 1,
        language: 'zh-CN',
        locale: 'zh-CN',
        contextMenu: true,
        startRows: 2,
        startCols: 9,
        rowHeaders: true,
        colHeaders: P.colHeaders,
        customBorders: true,
        dropdownMenu: P.dropdownMenu,
        multiColumnSorting: true,
        filters: true,
        manualRowMove: true,
        manualColumnMove: true,
        bindRowsWithHeaders: true,
        height: 'auto',
        manualColumnFreeze: true,
        readOnly: P.readOnly,
        nestedRows: P.nestedRows,
        columns: P.columns,
        hiddenColumns: { columns: [], indicators: true },
        colWidths: P.colWidths,
        manualColumnResize: true,
        // beforeFilter,
        copyPaste: {
            copyColumnHeaders: true,
            copyColumnGroupHeaders: true,
            copyColumnHeadersOnly: true,
        },
        comments: true,
        beforeAutofill,
    }
    let changes = {}
    let x, k, data, oData
    if (P.data) {
        if (Array.isArray(P.data)) {
            data = P.data
        } else if (P.data.all && P.data.model) {
            data = P.data.all
            oData = P.data
        }
        if (data) O.data = P.readOnly ? data : JSON.parse(JSON.stringify(data))
    }
    if (P.fixedColumnsStart) O.fixedColumnsStart = P.fixedColumnsStart
    const H = container.hot = new Handsontable(container, O)
    exc('$v.zp111[ref.id] = v', { ref, v: [1, 2, 3, 4] })


    function afterUndoStackChange(actionsBefore, actionsAfter) {
        changes = {}
        actionsAfter.forEach(a => {
            a.changes.forEach(b => {
                k = b[0] + "_" + b[1]
                changes[k] = { row: b[0], col: b[1], comment: { value: (changes[k] ? changes[k].comment.value : b[2]) + " -> " + b[3] } }
            })
        })
        H.updateSettings({ cell: Object.values(changes) })
    }
    container.export = name => exc('table2Excel(container, name)', { container, name })
    container.saveToDB = exp => {
        if (!oData) return log("需要把整个搜索返回的结果作为数据集传进来才能保存")
        let meta = {}
        Object.values(changes).forEach(o => {
            if (!meta[o.row]) meta[o.row] = {}
            if (!meta[o.row][o.col]) meta[o.row][o.col] = H.getCellMeta(o.row, o.col)
        })
        let U = {}
        H.getData().forEach((d, row) => {
            if (meta[row]) {
                let o = { $set: {}, $unset: {} }
                Object.values(meta[row]).forEach((m, col) => {
                    d[col] === null || d[col] === "" ? o.$unset[m.prop] = "" : o.$set[m.prop] = d[col]
                    U[data[row]._id] = o
                })
            }
        })
        let str = ""
        let R = []
        Object.keys(U).forEach(_id => {
            str += 'R.push($' + oData.model + '.modify("' + _id + '", U["' + _id + '"])); '
        })
        exc(str, { U, R }, () => {
            changes = {}
            H.updateSettings({ cell: [] })
            H.clearUndo()
            exc(exp || 'success("已保存")', { ...ref.ctx, changes: R })
        })
    }
}
const css = `

.handsontable .htCommentCell:after {
    border-top-color: red !important;
}
`

$plugin({
    id: "zp111",
    props: [{
        prop: "data",
        type: "text",
        label: "数据集",
        ph: "(用小括号)"
    }, {
        prop: "columns",
        type: "array",
        label: "列配置",
        dftExp: '$v.zp111[z]',
        struct: [{
            prop: "title",
            type: "text",
            label: "表头"
        }, {
            prop: "data",
            type: "text",
            label: "数据路径"
        }, {
            prop: "type",
            type: "select",
            label: "数据类型",
            filter: 1,
            items: ["text", "numeric", "select", "checkbox", "dropdown", "password", "date", "time", "autocomplete", "handsontable"]
        }, {
            prop: "numericFormat.pattern",
            type: "text",
            label: "数字格式",
            ph: "0,0.00",
            show: 'type == "numeric"'
        }, {
            prop: "dateFormat",
            type: "text",
            label: "日期格式",
            ph: "YYYY-MM-DD",
            show: 'type == "date"'
        }, {
            prop: "timeFormat",
            type: "text",
            label: "时间格式",
            ph: "h:mm:ss a",
            show: 'type == "time"'
        }, {
            prop: "source",
            type: "text",
            label: "选项",
            ph: "([])",
            show: 'type == "dropdown" || type == "autocomplete"'
        }, {
            prop: "className",
            type: "select",
            filter: 1,
            label: "单元格类名",
            items: ["htLeft", "htCenter", "htRight", "htJustify", "htTop", "htMiddle", "htBottom"]
        }, {
            prop: "readOnly",
            type: "switch",
            label: "只读"
        }]
    }, {
        prop: "colHeaders",
        type: "text",
        label: "表头",
        ph: "(['_id', 'Name', 'Address'])"
    }, {
        prop: "colWidths",
        type: "text",
        label: "列宽度",
        ph: "([50, 100, 200, 400])"
    }, {
        prop: "fixedColumnsStart",
        type: "text",
        label: "固定列"
    }, {
        prop: "readOnly",
        type: "switch",
        label: "只读"
    }, {
        prop: "dropdownMenu",
        type: "switch",
        label: "下拉菜单"
    }, {
        prop: "nestedRows",
        type: "switch",
        label: "树形数据"
    }, ],
    css,
    init
})


function beforeFilter(conditionsStack) {
    log(conditionsStack)
    return false // return `false` to disable filtering on the client side
}

function beforeAutofill(selectionData, sourceRange, targetRange, direction) {
    log(selectionData, sourceRange, targetRange, direction)
    // https://handsontable.com/docs/javascript-data-grid/api/hooks/#beforeautofill
}

/*
hot.getData()
hot.loadData(newDataset)
hot.updateData(newDataset)
hot.updateSettings({ data: newDataset})
hot.setDataAtCell(0, 1, 'Ford')
const changes = [
  [0, 2, 'New Value'],
  [1, 2, 'Different Value'],
  [2, 2, 'Third Replaced Value'],
];
hot.setDataAtCell(changes)
hot.setDataAtRowProp(0, 'title', 'New Value');
const changes = [
  [0, 'id', '22'],
  [0, 'firstName', 'John'],
  [0, 'lastName', 'Doe'],
];
hot.setDataAtRowProp(changes);
hot.setSourceDataAtCell(0, 2, 'New Value');
hot.setSourceDataAtCell(0, 'title', 'New Value');
const changes = [
  [0, 'id', '22'],
  [0, 'firstName', 'John'],
  [0, 'lastName', 'Doe'],
];
hot.setSourceDataAtCell(changes)

hot.getCellMeta(0, 0)

https://handsontable.com/docs/javascript-data-grid/column-groups/
nestedHeaders: [
  ['A', { label: 'B', colspan: 8 }, 'C'],
  ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
  ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
],
collapsibleColumns: [
  { row: -4, col: 1, collapsible: true },
  { row: -3, col: 1, collapsible: true },
  { row: -2, col: 1, collapsible: true },
  { row: -2, col: 3, collapsible: true },
],

  hiddenColumns: {
    columns: [2, 4, 6],
    indicators: true,
  },
hot.getPlugin('hiddenColumns').hideColumns([0, 4, 6]) // .showColumns([0, 4, 6])
hot.render()



*/