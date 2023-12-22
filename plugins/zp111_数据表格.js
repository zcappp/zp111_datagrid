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
        language: 'zh-CN',
        locale: 'zh-CN',
        startRows: 2,
        startCols: 9,
        height: 'auto',
        search: true,
        rowHeaders: true,
        colHeaders: P.colHeaders, // ?
        columns: P.columns,
        multiColumnSorting: true, // columnSorting: true,
        manualColumnFreeze: true,
        manualColumnResize: true,
        readOnly: P.readOnly,
        nestedRows: P.nestedRows,
        hiddenColumns: { columns: [], indicators: true },
        copyPaste: {
            copyColumnHeaders: true,
            copyColumnGroupHeaders: true,
            copyColumnHeadersOnly: true,
        },
        comments: true
    }
    let changes = {}
    let x, k, data, oData
    if (P.fixedColumnsStart) O.fixedColumnsStart = parseInt(P.fixedColumnsStart)
    if (typeof P.minSpareRows == "number") O.minSpareRows = P.minSpareRows
    if (P.data) {
        if (Array.isArray(P.data)) {
            data = P.data
        } else if (P.data.all && P.data.model) {
            data = P.data.all
            oData = P.data
        }
        if (data) O.data = P.readOnly ? data : JSON.parse(JSON.stringify(data))
    }
    if (!P.columns && data && ref.isDev) {
        O.columns = getColumns(data[0])
        ref.updateMeta("p.P.columns", O.columns)
    }
    if (P.filter) {
        O.filters = true
        O.dropdownMenu = ["filter_by_condition", "filter_by_condition2", "filter_operators", "filter_by_value", "filter_action_bar"]
        if (P.serverFilter && oData && O.columns) O.beforeFilter = stack => {
            let Q = JSON.parse(oData.query)
            let Opt = JSON.parse(oData.option || {})
            Opt.skip = 0
            stack.forEach(o => {
                const cfg = O.columns[o.column]
                const field = cfg.data
                log(field, JSON.stringify(o.conditions))
                if (o.operation.startsWith("disjunction")) { // conjunction disjunction disjunctionWithExtraCondition
                    if (o.operation.includes("Extra")) {
                        let c = o.conditions.pop()
                        Q[field] = Condition[c.name](c.args, cfg)
                    }
                    Q.$or = o.conditions.map(c => {
                        return {
                            [field]: Condition[c.name](c.args, cfg)
                        }
                    }).concat(Q.$or || [])
                } else {
                    Q[field] = Object.assign(...o.conditions.map(c => Condition[c.name](c.args, cfg)))
                    // Q.$and = o.conditions.map(c => {return {[field]: Condition[c.name](c.args, cfg)}}).concat(JSON.parse(oData.query))
                    // o.conditions.forEach(c => {
                    //     Q[field] = Condition[c.name](c.args, cfg)
                    // })
                }
            })
            exc('$' + oData.model + '.search(path, Q, Opt)', { Q, Opt }, r => {
                log(r)
                r && r.all ? H.updateData(P.readOnly ? r.all : JSON.parse(JSON.stringify(r.all))) : exc('warn("出错了")')
            })
            return false // to disable filtering on the client side
        }
    }
    const H = container.datagrid = new Handsontable(container, O)

    function afterUndoStackChange(actionsBefore, actionsAfter) {
        changes = {}
        actionsAfter.forEach(a => {
            if (a.changes) a.changes.forEach(b => {
                k = b[0] + "_" + b[1]
                changes[k] = { row: b[0], col: b[1], comment: { value: (changes[k] ? changes[k].comment.value : b[2]) + " -> " + b[3], readOnly: true } }
            })
        })
        H.updateSettings({ cell: Object.values(changes) })
    }
    container.getData = () => H.getData()
    container.updateSettings = () => H.updateSettings()
    container.render = () => H.render()
    container.export = name => exc('table2Excel(container, name)', { container, name })
    container.query = txt => {
        H.getPlugin('search').query(txt)
        H.render()
    }
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
                Object.values(meta[row]).forEach(m => {
                    d[m.col] === null || d[m.col] === "" ? o.$unset[m.prop] = "" : o.$set[m.prop] = d[m.col]
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
        prop: "minSpareRows",
        type: "number",
        label: "自动添加新行数"
    }, {
        prop: "readOnly",
        type: "switch",
        label: "只读"
    }, {
        prop: "filter",
        type: "switch",
        label: "可过滤"
    }, {
        prop: "serverFilter",
        type: "switch",
        label: "服务器端过滤",
        show: 'p.P.filter'
    }, {
        prop: "nestedRows",
        type: "switch",
        label: "树形数据"
    }, {
        prop: "columns",
        type: "array",
        label: "列配置",
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
            items: ["text", "numeric", "checkbox", "select", "dropdown", "autocomplete", "date", "time", "handsontable"]
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
            ph: "yyyy-MM-dd",
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
            label: "选项列表",
            ph: "([])",
            show: 'type == "dropdown" || type == "autocomplete"'
        }, {
            prop: "selectOptions",
            type: "text",
            label: "选项列表",
            ph: "([])",
            show: 'type == "select"'
        }, {
            prop: "className",
            type: "select",
            filter: 1,
            insertEmpty: 1,
            filter: 1,
            allowDIY: 1,
            label: "单元格类名",
            items: ["htLeft", "htCenter", "htRight", "htJustify", "htTop", "htMiddle", "htBottom"]
        }, {
            prop: "width",
            type: "number",
            label: "宽度",
            ph: "px, 默认自适应"
        }, {
            prop: "readOnly",
            type: "switch",
            label: "只读",
            show: '!p.P.readOnly'
        }]
    }, ],
    css,
    init
})


function getColumns(d) {
    let columns = []
    Object.keys(d).forEach(k => {
        let v = d[k]
        if (typeof v == "object") {
            Array.isArray(v) ? v.forEach((a, i) => recur(columns, a, k + "." + i + ".")) : recur(columns, v, k + ".")
        } else if (k != "_id") {
            columns.push(Object.assign({ title: k, data: k }, TYPE[typeof v] || {}))
        }
    })
    if (columns.length > 100) columns = columns.slice(0, 100)
    return columns
}

function recur(columns, x, prefix) {
    if (!x || typeof x !== "object") return
    Object.keys(x).forEach(k => {
        const p = prefix + k
        let o = { title: p, data: p }
        let v = x[k]
        if (Array.isArray(v)) {
            if (v[0] && typeof v[0] === "object" && !Array.isArray(v[0])) return v.forEach((a, i) => recur(columns, a, p + "." + i + "."))
            columns.push(o)
        } else if (v && typeof v === "object") {
            recur(columns, v, p + ".")
        } else {
            Object.assign(o, TYPE[typeof v] || {})
            columns.push(o)
        }
    })
}

const TYPE = {
    "number": { type: "numeric", className: "htRight" },
    "boolean": { type: "checkbox", className: "htCenter" },
}

const Condition = {
    none: "",
    by_value: args => {
        return { $in: args[0] }
    },
    empty: args => {
        return { $eq: "" }
    },
    not_empty: args => {
        return { $ne: "" }
    },
    eq: args => {
        return { $eq: args[0] }
    },
    neq: args => {
        return { $ne: args[0] }
    },
    contains: args => {
        return { $regex: args[0], $options: "i" }
    },
    not_contains: args => {
        return { $nin: args }
    },
    begins_with: args => {
        return { $regex: "^" + args[0], $options: "i" }
    },
    ends_with: args => {
        return { $regex: args[0] + "$", $options: "i" }
    },
    gt: args => {
        return { $gt: parseFloat(args[0]) }
    },
    gte: args => {
        return { $gte: parseFloat(args[0]) }
    },
    lt: args => {
        return { $lt: parseFloat(args[0]) }
    },
    lte: args => {
        return { lte: parseFloat(args[0]) }
    },
    between: args => {
        return { $gte: parseFloat(args[0]), $lte: parseFloat(args[1]) }
    },
    not_between: args => {
        return { $or: [{ $lt: parseFloat(args[0]), $gt: parseFloat(args[1]) }] }
    },
    date_after: "",
    date_before: "",
    date_today: (args, cfg) => {
        return { $eq: new Date().format(cfg.dateFormat) }
    },
    date_tomorrow: "",
    date_yesterday: "",
}

/*
自定义单元格、按钮
搜索框 指定搜索哪些列
级联过滤

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