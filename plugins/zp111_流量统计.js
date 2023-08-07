import React from "react"
import css from "../css/zp111_流量统计.css"

const YMD = ["小时", "日", "月", "年"]
const TAB = {
    概要: ["访问量", "浏览量", "API调用量", "CDN流量", "OSS容量", "DB流量", "DB容量", "短信发送量"],
    详细: ["入口页", "受访页", "API", "IP", "短信"],
    地域分布: ["各地占比", "中国地图"],
    页面流量: ["页面流量"],
    访问来源: ["访问来源"]
}
const TYPES = Object.keys(TAB)
let exc, rd, id, ymd, type, slot, subtype, date, O, pop

function init(ref) {
    exc = ref.exc
    rd = ref.render
    id = ref.id
    exc('load("https://z.zccdn.cn/vendor/highcharts/highcharts_11.1.js")', null, () => { // https://code.hcharts.cn/
        Highcharts.setOptions({ global: { useUTC: false }, accessibility: { enabled: false } })
        $("#" + id + " .YMD").children[0].click()
        $("#" + id + " .TYPES").children[1].click()
    })
}

function render() {
    return <React.Fragment>
        <ul className="YMD">{YMD.map((a, i) => 
            <li onClick={() => selectYMD(a, i)} className={ymd === a ? "ztab zcur" : "ztab"} key={a}>{a}</li>
        )}</ul>
        <ul className="TYPES">{TYPES.map((a, i) => 
            <li onClick={() => selectType(a)} className={"ztab " + ((a === "概要" && ymd === "小时") || (a === "详细" && ymd !== "小时") ? " disable" : (type === a ? "zcur" : ""))} key={a}>{a}</li>
        )}</ul>
        {!!slot && <div className="slot">
            <svg onClick={() => addSlot()} viewBox="0 0 1024 1024"><path d="M253.39 112.082l559.886 399.918-559.886 399.918z"></path></svg>
            <div>{slot.all.map((a, i) => 
                <span onClick={() => toggleSlot(a)} className={slot.sel.includes(a) ? "cur" : ""} key={a}>{ymd === "小时" ? a.substr(8) : (ymd === "日" ? a.substr(6, 2) : (ymd === "月" ? a.substr(4, 2) : a))}</span>
            )}</div>
        </div>}
        {!!type && <ul className="subtype" key={type + subtype}>{TAB[type].map((a, i) =>
            <li onClick={() => selectSubType(a)} className={"ztab " + (ymd === "日" && (a === "CDN流量" || a === "OSS容量" || a === "DB容量") ? " disable" : (subtype === a ? "zcur" : ""))} key={a}>{a}</li>
        )}</ul>}
        <div className="details" key={subtype}>{!!subtype && O && details[subtype]()}</div>
        <div className="pop">{!!pop && renderPop()}</div>
    </React.Fragment>
}

function renderPop() {
    return <div className="页面PV">
        <svg onClick={() => {pop = undefined; rd()}} viewBox="64 64 896 896" className="zsvg"><path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 0 0 203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path></svg>
        <h3>{pop.name}</h3>
        <div className="日"/><div className="月"/><div className="年"/>
    </div>
}

function selectYMD(_ymd, i) {
    ymd = _ymd
    slot = undefined
    type = undefined
    O = undefined
    rd()
}

function selectType(_type, i) {
    if ((type === "概要" && ymd === "小时") || (type === "详细" && ymd !== "小时")) return
    type = _type
    date = new Date()
    let _slot = type === "访问来源" || type === "地域分布" || type === "页面流量" ? prevSlot() : date.format(DateFormat[ymd]).replaceAll("/", "")
    slot = { all: [_slot], sel: [_slot] }
    rd()
    setTimeout(() => $("#" + id + " .subtype").children[0].click(), 9)
}

function selectSubType(_subtype) {
    subtype = _subtype
    rd()
    const f = loadData[type] || loadData[subtype]
    f(() => setTimeout(() => {
        transformData[subtype]()
        rd()
    }, 9))
}

function calls(arr, fn, next) {
    let cb = {
        [arr.length]: () => next()
    }
    for (let i = arr.length - 1; i > 0; i--) {
        cb[i] = () => fn(arr[i], cb[i + 1])
    }
    fn(arr[0], cb[1])
}

function addSlot() {
    const pre = prevSlot()
    slot.all.splice(0, 0, pre)
    slot.sel.splice(0, 0, pre)
    $("#" + id + " .subtype .zcur").click()
}

function toggleSlot(a) {
    let { sel } = slot
    sel.includes(a) ? sel.splice(sel.indexOf(a), 1) : sel.push(a)
    sel.length ? $("#" + id + " .subtype .zcur").click() : rd()
}

function prevSlot() { // 时间段
    if (ymd === "小时") {
        date.setHours(date.getHours() - 1)
    } else if (ymd === "日") {
        date.setDate(date.getDate() - 1)
    } else if (ymd === "月") {
        date = new Date(date.getFullYear(), date.getMonth() - 1, 1)
    } else {
        date.setFullYear(date.getFullYear() - 1)
    }
    return date.format(DateFormat[ymd]).replaceAll("/", "")
}

const details = {
    // 概要
    访问量: () => {
        return <React.Fragment><div className="访问量"/><div className="访问量pie"/></React.Fragment>
    },
    浏览量: () => {
        return <div className="浏览量"/>
    },
    API调用量: () => {
        return <div className="API调用量"/>
    },
    CDN流量: () => {
        return <div className="CDN流量"/>
    },
    OSS容量: () => {
        return <div className="OSS容量"/>
    },
    DB流量: () => {
        return <div className="DB流量"/>
    },
    DB容量: () => {
        return <div className="DB容量"/>
    },
    短信发送量: () => {
        return <div className="短信发送量"/>
    },
    // 详细
    入口页: () => {
        if (!Array.isArray(O.入口页)) return <div/>
        return <table className="入口页 ztable">
            <caption>页面数: <strong>{O.入口页.length}</strong>, 访问量: <strong>{O.访问量}</strong>, 数据量: <strong>{O.数据量}</strong>K</caption>
            <thead><tr>
                <th>入口页</th><th>访问量</th><th>占比</th><th></th>
            </tr></thead>
            <tbody>{O.入口页.map((a, i) => <tr key={i}>
                <td className="zellipsis" key={i}><a href={a[0] || "/"}>{a[0] || "/"}</a></td>
                <td>{a[1]}</td>
                <td>{(parseInt((a[1]) / O.访问量 * 10000) / 100).toFixed(2)}</td>
                <td><svg onClick={() => popPagePV(a[0])} viewBox="64 64 896 896">{BARCHART}</svg></td>
            </tr>)}</tbody>
        </table>
    },
    受访页: () => {
        if (!Array.isArray(O.受访页)) return <div/>
        return <table className="受访页 ztable">
            <caption>页面数: <strong>{O.受访页.length}</strong>, 浏览量: <strong>{O.访问量}</strong>, 数据量: <strong>{O.数据量}</strong>K</caption>
            <thead><tr>
                <th>受访页</th><th>访问量</th><th>占比</th><th></th>
            </tr></thead>
            <tbody>{O.受访页.map((a, i) => <tr key={i}>
                <td className="zellipsis" key={i}><a href={a[0] || "/"}>{a[0] || "/"}</a></td>
                <td>{a[1]}</td>
                <td>{(parseInt((a[1]) / O.访问量 * 10000) / 100).toFixed(2)}</td>
                <td><svg onClick={() => popPagePV(a[0])} viewBox="64 64 896 896">{BARCHART}</svg></td>
            </tr>)}</tbody>
        </table>
    },
    IP: () => {
        if (!Array.isArray(O.IP)) return <div/>
        return <table className="IP ztable">
            <caption>IP数: <strong>{O.IP.length}</strong>, 访问量: <strong>{O.访问量}</strong></caption>
            <thead><tr>
                <th>IP</th><th>访问量</th><th>占比</th>
            </tr></thead>
            <tbody>{O.IP.map((a, i) => <tr key={i}>
                <td>{exc('$c.IP[a[0]] || a[0]', {a})}</td>
                <td>{a[1]}</td>
                <td>{(parseInt((a[1]) / O.访问量 * 10000) / 100).toFixed(2)}</td>
            </tr>)}</tbody>
        </table>
    },
    API: () => {
        if (!Array.isArray(O.API)) return <div/>
        return <table className="API ztable">
            <caption>API数: <strong>{O.API.length}</strong>, 调用量: <strong>{O.调用量}</strong>, 数据量: <strong>{O.数据量}</strong>K</caption>
            <thead><tr>
                <th>API</th><th>调用量</th><th>占比</th>
            </tr></thead>
            <tbody>{O.API.map((a, i) => <tr key={i}>
                <td className="zellipsis">{a[0]}</td>
                <td>{a[1]}</td>
                <td>{(parseInt((a[1]) / O.调用量 * 10000) / 100).toFixed(2)}</td>
            </tr>)}</tbody>
        </table>
    },
    短信: () => {
        if (!Array.isArray(O.短信)) return <div/>
        return <table className="短信 ztable">
            <caption>短信数: <strong>{O.短信.length}</strong>, 发送量: <strong>{O.发送量}</strong></caption>
            <thead><tr>
                <th>短信</th><th>发送量</th><th>占比</th>
            </tr></thead>
            <tbody>{O.短信.map((a, i) => <tr key={i}>
                <td className="zellipsis">{a[0]}</td>
                <td>{a[1]}</td>
                <td>{(parseInt((a[1]) / O.发送量 * 10000) / 100).toFixed(2)}</td>
            </tr>)}</tbody>
        </table>
    },
    // 地域分布
    各地占比: () => {
        if (!Array.isArray(O.全国)) return <div/>
        return <React.Fragment>
            <div className="各地占比"/>
            <table className="各省列表 ztable">
                <caption>全国访问量: <strong>{O.全国总量}</strong>, 占比: <strong>{(parseInt(O.全国总量 / O.总量 * 10000) / 100).toFixed(2)}%</strong></caption>
                <thead><tr>
                    <th>地域</th><th>访问量</th><th>占比(%)</th><th></th>
                </tr></thead>
                {O.全国.map((a, i) => <tbody key={i}>
                    <tr onClick={() => loadData.展开省份(a[0])}>
                        <td>{a[0]}</td>
                        <td>{a[1]}</td>
                        <td>{(parseInt((a[1]) / O.总量 * 10000) / 100).toFixed(2)}</td>
                        <td style={{cursor: "pointer"}}>{O.展开 === a[0] ? "-" : "+"}</td>
                    </tr>
                    {O.展开 === a[0] && (O.省份 || []).map((a, i) => <tr className="more" key={i}>
                        <td>{a[0]}</td>
                        <td>{a[1]}</td>
                        <td>{(parseInt((a[1]) / O.总量 * 10000) / 100).toFixed(2)}</td>
                    </tr>)}
                </tbody>)}
            </table>
            <table className="外国列表 ztable">
                <caption>外国访问量: <strong>{O.外国总量}</strong>, 占比: <strong>{(parseInt(O.外国总量 / O.总量 * 10000) / 100).toFixed(2)}%</strong></caption>
                <thead><tr>
                    <th>地域</th><th>访问量</th><th>占比(%)</th>
                </tr></thead>
                <tbody>
                    {O.外国.map((a, i) => <tr className="more" key={i}>
                        <td>{a[0]}</td>
                        <td>{a[1]}</td>
                        <td>{(parseInt((a[1]) / O.总量 * 10000) / 100).toFixed(2)}</td>
                    </tr>)}
                </tbody>
            </table>
        </React.Fragment>
    },
    中国地图: () => {
        return <div className="中国地图"/>
    },
    //
    页面流量: () => {
        if (!Array.isArray(O.页面)) return <div/>
        return <React.Fragment>
            <div className="页面流量chart"/>
            <table className="页面流量 ztable">
                <caption>页面数: <strong>{O.页面数}</strong>访问量: <strong>{O.访问量}</strong></caption>
                <thead><tr>
                    <th>页面</th><th>访问量</th><th>占比</th><th></th>
                </tr></thead>
                {O.页面.map((a, i) => <tbody key={i}>
                    <tr onClick={() => {if (a[2].length) {O.展开 === i ? delete O.展开 : O.展开 = i; rd()}}}>
                        <td>{a[0]}</td>
                        <td>{a[1]}</td>
                        <td>{(parseInt((a[1]) / O.访问量 * 10000) / 100).toFixed(2)}</td>
                        {a[2].length ? <td style={{cursor: "pointer"}}>{O.展开 === i ? "-" : "+"}</td> : <td></td>}
                    </tr>
                    {O.展开 === i && a[2].length && a[2].map((a, i) => <tr className="more" key={i}>
                        <td>{a[0]}</td>
                        <td>{a[1]}</td>
                        <td>{(parseInt((a[1]) / O.访问量 * 10000) / 100).toFixed(2)}</td>
                    </tr>)}
                </tbody>)}
            </table>
        </React.Fragment>
    },
    访问来源: () => {
        if (!Array.isArray(O.来源)) return <div/>
        return <React.Fragment>
            <div className="访问来源chart"/>
            <table className="访问来源 ztable">
                <caption>访问量: <strong>{O.访问量}</strong></caption>
                <thead><tr>
                    <th>来源</th><th>访问量</th><th>占比</th>
                </tr></thead>
                <tbody>{O.来源.map((a, i) => <tr key={i}>
                    <td>{a[0]}</td>
                    <td>{a[1]}</td>
                    <td>{(parseInt((a[1]) / O.访问量 * 10000) / 100).toFixed(2)}</td>
                </tr>)}</tbody>
            </table>
        </React.Fragment>
    },
}

const loadData = {
    概要: cb => {
        O = { "dat": [], "vv": [], "pv": [], "vvm": [], "vvd": [], "vvb": [], "pvm": [], "pvd": [], "api": [], "cdn": [], "sms": [], "db": [], "oss": [] }
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.summary("${slot}")`, null, R => {
                const 前 = slot.substr(0, 4) + "/" + (ymd === "日" ? slot.substr(4, 2) + "/" + slot.substr(6, 2) + " " : (ymd === "月" ? slot.substr(4, 2) + "/" : ""))
                const 后 = (ymd === "日" ? ":00" : (ymd === "月" ? "" : "/01"))
                const summary = ["dat", "vvm", "vvd", "vvb", "pvm", "pvd", "api", "cdn", "sms", "db", "oss"]
                Object.keys(R).forEach(a => {
                    summary.forEach(b => {
                        O[b].push([new Date(前 + a + 后).getTime(), R[a][b] || 0])
                    })
                })
                next()
            })
        }, cb)
    },
    //详细
    入口页: cb => {
        O = { 数据量: 0, 入口页: {} }
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.vv("${slot}")`, null, arr => {
                arr.forEach(a => {
                    O.入口页[a.u] = (O.入口页[a.u] || 0) + 1
                    O.数据量 = O.数据量 + a.s
                })
                next()
            })
        }, cb)
    },
    受访页: cb => {
        O = { 数据量: 0, 受访页: {} }
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.pv("${slot}")`, null, arr => {
                arr.forEach(a => {
                    O.受访页[a.u] = (O.受访页[a.u] || 0) + 1
                    O.数据量 = O.数据量 + a.s
                })
                next()
            })
        }, cb)
    },
    IP: cb => {
        O = { IP: {} }
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.vv("${slot}")`, null, arr => {
                arr.forEach(a => {
                    O.IP[a.ip] = (O.IP[a.ip] || 0) + 1
                })
                next()
            })
        }, cb)
    },
    API: cb => {
        O = { 数据量: 0, API: {} }
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.api("${slot}")`, null, arr => {
                arr.forEach(a => {
                    O.API[a.u] = (O.API[a.u] || 0) + 1
                    O.数据量 = O.数据量 + a.s
                })
                next()
            })
        }, cb)
    },
    短信: cb => {
        let o = {}
        O = { 发送量: 0, 短信: [], o }
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.sms("${slot}")`, null, arr => {
                arr.forEach(a => {
                    o[a] = (o[a] || 0) + 1
                })
                next()
            })
        }, cb)
    },
    // 地域分布
    各地占比: cb => {
        O = { 各省: {}, 全国: [], 各国: {}, 外国: [] }
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.china("${slot}")`, null, R => {
                Object.keys(R).forEach(k => {
                    O.各省[k] = R[k] + (O.各省[k] || 0)
                })
                exc(`$traffic.foreign("${slot}")`, null, R => {
                    Object.keys(R).forEach(k => {
                        O.各国[k] = R[k] + (O.各国[k] || 0)
                    })
                    next()
                })
            })
        }, cb)
    },
    展开省份: (省份) => {
        if (O.展开 === 省份) {
            delete O.展开
            return rd()
        }
        O.展开 = 省份
        O.省份 = []
        O.各市 = {}
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.province("${省份}", "${slot}")`, null, R => {
                Object.keys(R).forEach(k => {
                    O.各市[k] = R[k] + (O.各市[k] || 0)
                })
                next()
            })
        }, () => {
            transformData.展开省份()
            rd()
        })
    },
    中国地图: cb => {
        loadData.各地占比(() => {
            Object.keys(O.各省).forEach(a => O.全国.push([a, O.各省[a]]))
            O.全国.sort((a, b) => b[1] - a[1])
            O.全国总量 = O.全国.reduce((acc, x) => acc + x[1], 0)
            exc('load(["https://cdn.highcharts.com.cn/highmaps/modules/map.js", "https://code.highcharts.com.cn/highcharts/modules/drilldown.js","https://data.jianshukeji.com/geochina/china.js"])', null, cb)
        })
    },
    //
    页面流量: cb => {
        let o = {}
        O = { 页面: [], o }
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.pages("${slot}")`, null, R => {
                Object.keys(R).forEach(k => {
                    const x = k.split("/")
                    const a = x[0]
                    const b = x[1]
                    if (!o[a]) o[a] = { x: {}, cnt: 0 }
                    if (b) {
                        o[a].x[b] = (o[a].x[b] || 0) + R[k]
                    } else {
                        o[a].cnt = o[a].cnt + R[k]
                    }
                })
                next()
            })
        }, cb)
    },
    访问来源: cb => {
        let o = {}
        O = { 来源: [], o }
        calls(slot.sel, (slot, next) => {
            exc(`$traffic.referers("${slot}")`, null, R => {
                Object.keys(R).forEach(k => {
                    o[k] = R[k] + (o[k] || 0)
                })
                next()
            })
        }, cb)
    },
}

const transformData = {
    访问量: () => {
        O.vvm.forEach((a, i) => {
            O.vv.push([O.vvm[i][0], O.vvm[i][1] + O.vvd[i][1] + O.vvb[i][1]])
        })
        O.vv.sort((a, b) => a[0] - b[0])
        const total = O.vv.reduce((acc, x) => acc + x[1], 0)
        let chart = clone(Option)
        chart.title = { text: "访问量 (" + total.toLocaleString("en-US") + ")" }
        chart.series = [{ type: "area", name: "访问量", data: O.vv }]
        Highcharts.chart($("#" + id + " .访问量"), chart)
        Highcharts.chart($("#" + id + " .访问量pie"), {
            chart: { type: "pie" },
            title: { text: "访问量类别占比" },
            plotOptions: { pie: { "allowPointSelect": true, cursor: "pointer" } },
            series: [{
                name: "占比(%)",
                data: [
                    { name: "移动端", y: parseInt(O.vvm.reduce((acc, x) => acc + x[1], 0) / total * 10000) / 100 },
                    { name: "电脑端", y: parseInt(O.vvd.reduce((acc, x) => acc + x[1], 0) / total * 10000) / 100 },
                    { name: "其他", y: parseInt(O.vvb.reduce((acc, x) => acc + x[1], 0) / total * 10000) / 100 }
                ]
            }]
        })
    },
    浏览量: () => {
        O.vvm.forEach((a, i) => {
            O.vv.push([O.vvm[i][0], O.vvm[i][1] + O.vvd[i][1] + O.vvb[i][1]])
        })
        O.vv.forEach((a, i) => {
            O.pv.push([O.vv[i][0], O.pvm[i][1] + O.pvd[i][1] + O.vv[i][1]])
        })
        O.pv.sort((a, b) => a[0] - b[0])
        let chart = clone(Option)
        chart.title = { text: "浏览量 (" + O.pv.reduce((acc, x) => acc + x[1], 0).toLocaleString("en-US") + ")" }
        chart.series = [{ type: "area", name: "浏览量", data: O.pv }]
        Highcharts.chart($("#" + id + " .浏览量"), chart)
    },
    API调用量: () => {
        O.api.sort((a, b) => a[0] - b[0])
        let chart = clone(Option)
        chart.title = { text: "API调用量 (" + O.api.reduce((acc, x) => acc + x[1], 0).toLocaleString("en-US") + ")" }
        chart.series = [{ type: "area", name: "API调用量", data: O.api }]
        Highcharts.chart($("#" + id + " .API调用量"), chart)
    },
    CDN流量: () => {
        O.cdn.sort((a, b) => a[0] - b[0])
        let chart = clone(Option)
        chart.title = { text: "CDN流量 (" + (O.cdn.reduce((acc, x) => acc + x[1], 0) / 1000).toLocaleString("en-US") + "GB)" }
        chart.series = [{ type: "area", name: "CDN流量(MB)", data: O.cdn }]
        Highcharts.chart($("#" + id + " .CDN流量"), chart)
    },
    OSS容量: () => {
        O.oss.sort((a, b) => a[0] - b[0])
        let chart = clone(Option)
        chart.title = { text: "OSS容量 (" + (O.oss.reduce((acc, x) => acc + x[1], 0) / 1000 / O.oss.filter(a => a[1]).length).toLocaleString("en-US") + "GB)" }
        chart.series = [{ type: "area", name: "OSS容量(MB)", data: O.oss }]
        Highcharts.chart($("#" + id + " .OSS容量"), chart)
    },
    DB流量: () => {
        O.dat.sort((a, b) => a[0] - b[0])
        let chart = clone(Option)
        chart.title = { text: "DB流量 (" + (O.dat.reduce((acc, x) => acc + x[1], 0) / 1000).toLocaleString("en-US") + "MB)" }
        chart.series = [{ type: "area", name: "DB流量(KB)", data: O.dat }]
        Highcharts.chart($("#" + id + " .DB流量"), chart)
    },
    DB容量: () => {
        O.db.sort((a, b) => a[0] - b[0])
        let chart = clone(Option)
        chart.title = { text: "DB容量 (" + (O.db.reduce((acc, x) => acc + x[1], 0) / O.db.filter(a => a[1]).length / 1000).toLocaleString("en-US") + "MB)" }
        chart.series = [{ type: "area", name: "DB容量(KB)", data: O.db }]
        Highcharts.chart($("#" + id + " .DB容量"), chart)
    },
    短信发送量: () => {
        O.sms.sort((a, b) => a[0] - b[0])
        let chart = clone(Option)
        chart.title = { text: "短信发送量 (" + O.sms.reduce((acc, x) => acc + x[1], 0).toLocaleString("en-US") + "条)" }
        chart.series = [{ type: "area", name: "短信发送量(条)", data: O.sms }]
        Highcharts.chart($("#" + id + " .短信发送量"), chart)
    },
    //详细
    入口页: () => {
        let arr = []
        Object.keys(O.入口页).forEach(a => arr.push([a, O.入口页[a]]))
        arr.sort((a, b) => b[1] - a[1])
        O.入口页 = arr
        O.访问量 = arr.reduce((acc, x) => acc + x[1], 0)
    },
    受访页: () => {
        let arr = []
        Object.keys(O.受访页).forEach(a => arr.push([a, O.受访页[a]]))
        arr.sort((a, b) => b[1] - a[1])
        O.受访页 = arr
        O.访问量 = arr.reduce((acc, x) => acc + x[1], 0)
    },
    IP: () => {
        let arr = []
        Object.keys(O.IP).forEach(a => arr.push([a, O.IP[a]]))
        arr.sort((a, b) => b[1] - a[1])
        O.IP = arr
        O.访问量 = arr.reduce((acc, x) => acc + x[1], 0)
        exc('$traffic.ips(arr)', { arr: arr.map(a => a[0]) }, () => rd())
    },
    API: () => {
        let arr = []
        Object.keys(O.API).forEach(a => arr.push([a, O.API[a]]))
        arr.sort((a, b) => b[1] - a[1])
        O.API = arr
        O.调用量 = arr.reduce((acc, x) => acc + x[1], 0)
    },
    短信: () => {
        Object.keys(O.o).forEach(a => O.短信.push([a, O.o[a]]))
        O.短信.sort((a, b) => b[1] - a[1])
        O.发送量 = O.短信.reduce((acc, x) => acc + x[1], 0)
    },
    // 地域分布
    各地占比: () => {
        Object.keys(O.各省).forEach(a => O.全国.push([a, O.各省[a]]))
        O.全国.sort((a, b) => b[1] - a[1])
        O.全国总量 = O.全国.reduce((acc, x) => acc + x[1], 0)
        Object.keys(O.各国).forEach(a => O.外国.push([a, O.各国[a]]))
        O.外国.sort((a, b) => b[1] - a[1])
        O.外国总量 = O.外国.reduce((acc, x) => acc + x[1], 0) || 0
        O.总量 = O.全国总量 + O.外国总量
        let data = []
        O.全国.forEach(a => {
            data.push({ name: a[0], y: a[1], drilldown: true })
        })
        data.push({ name: "外国", y: O.外国总量 })
        Highcharts.chart($("#" + id + " .各地占比"), {
            title: { text: "各地访问量比例图 (总量: " + O.总量 + ")" },
            series: [{ name: "访问量", data }],
            drilldown: { series: [] },
            chart: {
                type: "pie",
                events: {
                    drilldown: function(e) {
                        this.showLoading("正在加载数据...")
                        calls(slot.sel, (slot, next) => {
                            exc(`$traffic.province("${e.point.name}", "${slot}")`, null, R => {
                                O.各市 = {}
                                Object.keys(R).forEach(k => {
                                    O.各市[k] = R[k] + (O.各市[k] || 0)
                                })
                                next()
                            })
                        }, () => {
                            let data = []
                            Object.keys(O.各市).forEach(a => {
                                data.push([a, O.各市[a]])
                            })
                            data.sort((a, b) => b[1] - a[1])
                            this.hideLoading()
                            this.addSeriesAsDrilldown(e.point, { "name": "访问量", data })
                        })
                    }
                }
            }
        })
    },
    展开省份: () => {
        Object.keys(O.各市).forEach(a => O.省份.push([a, O.各市[a]]))
        O.省份.sort((a, b) => b[1] - a[1])
        // delete O.各市
    },
    中国地图: () => {
        const data = Highcharts.geojson(Highcharts.maps["cn/china"])
        data.forEach(a => {
            a.name = a.properties.fullname
            a.drilldown = a.properties.drilldown
            a.value = O.各省[a.properties.fullname] || 0
        })
        Highcharts.mapChart($("#" + id + " .中国地图"), {
            title: { text: "各省访问量分布图" },
            colorAxis: { tickPixelInterval: 100 },
            series: [{ name: "访问量", data }],
            chart: {
                events: {
                    drilldown: function(e) {
                        this.showLoading("正在加载数据...")
                        exc('load("https://data.jianshukeji.com/geochina/' + e.point.drilldown + '.js")', null, () => {
                            calls(slot.sel, (slot, next) => {
                                exc(`$traffic.province("${e.point.name}", "${slot}")`, null, R => {
                                    O.各市 = {}
                                    Object.keys(R).forEach(k => {
                                        O.各市[k] = R[k] + (O.各市[k] || 0)
                                    })
                                    next()
                                })
                            }, () => {
                                const data = Highcharts.geojson(Highcharts.maps["cn/" + e.point.drilldown + ""])
                                data.forEach(a => {
                                    a.value = O.各市[a.properties.fullname] || 0
                                })
                                this.hideLoading()
                                this.addSeriesAsDrilldown(e.point, { "name": "访问量", data })
                            })
                        })
                    }
                }
            }
        })
    },
    //
    页面流量: () => {
        const { o } = O
        Object.keys(o).forEach(k => {
            if (o[k].x) {
                let arr = []
                let 其他 = 0
                Object.keys(o[k].x).forEach(u => {
                    arr.push([u, o[k].x[u]])
                })
                arr.sort((a, b) => b[1] - a[1])
                o[k].arr = arr.splice(0, 20)
                arr.forEach(a => {
                    其他 = 其他 + a[1]
                })
                if (其他) o[k].arr.push(["其他", 其他])
                o[k].arr.forEach(a => {
                    o[k].cnt = o[k].cnt + a[1]
                })
            }
        })
        let arr = []
        Object.keys(o).forEach(k => {
            arr.push([k, o[k].cnt, o[k].arr])
        })
        arr.sort((a, b) => b[1] - a[1])
        O.页面数 = arr.length
        O.页面 = arr.splice(0, 20)
        let 其他 = { cnt: 0, arr: [] }
        arr.forEach(a => {
            其他.cnt = 其他.cnt + a[1]
            其他.arr.push([a[0], a[1]])
        })
        if (其他.cnt) O.页面.push(["其他", 其他.cnt, 其他.arr])
        O.页面数 = O.页面数 + 其他.cnt
        O.访问量 = O.页面.reduce((acc, x) => acc + x[1], 0)

        exc('load("https://code.highcharts.com.cn/highcharts/modules/drilldown.js")', null, () => {
            let data = []
            let drilldown = []
            O.页面.forEach(a => {
                let o = { name: a[0], y: a[1] }
                if (a[2].length) {
                    o.drilldown = a[0]
                    drilldown.push({ name: "访问量", id: a[0], data: a[2] })
                }
                data.push(o)
            })
            Highcharts.chart($("#" + id + " .页面流量chart"), { chart: { type: "pie" }, title: { text: "页面流量比例图" }, series: [{ name: "访问量", data }], drilldown: { series: drilldown } })
        })
    },
    访问来源: () => {
        Object.keys(O.o).forEach(a => O.来源.push([a.replaceAll("_", "."), O.o[a]]))
        O.来源.sort((a, b) => b[1] - a[1])
        O.访问量 = O.来源.reduce((acc, x) => acc + x[1], 0)
        exc('load("https://code.highcharts.com.cn/highcharts/modules/drilldown.js")', null, () => {
            let data = []
            O.来源.forEach(a => {
                data.push({ name: a[0], y: a[1] })
            })
            Highcharts.chart($("#" + id + " .访问来源chart"), { chart: { type: "pie" }, title: { text: "各来源访问量比例图" }, series: [{ name: "访问量", data }] })
        })
    },
}

function popPagePV(name) {
    pop = { name, 日: [], 月: [], 年: [] }
    rd()
    setTimeout(() => {
        exc(`$traffic.page3("${name}")`, null, R => {
            if (!R) return
            let x
            let data = []
            Object.keys(R.date).forEach(K => {
                x = K.substr(0, 4) + "/" + K.substr(4, 2) + "/" + K.substr(-2) + " "
                Object.keys(R.date[K]).forEach(k => {
                    data.push([new Date(x + k + ":00").getTime(), R.date[K][k]])
                })
            })
            data.sort((a, b) => b[0] - a[0])
            let chart = clone(Option)
            chart.title = { text: "最近3天浏览量 (" + data.reduce((acc, x) => acc + x[1], 0).toLocaleString("en-US") + ")" }
            chart.series = [{ type: "area", name: "浏览量", data }]
            Highcharts.chart($("#" + id + " .页面PV .日"), chart)

            data = []
            Object.keys(R.month).forEach(K => {
                x = K.substr(0, 4) + "/" + K.substr(-2) + "/"
                Object.keys(R.month[K]).forEach(k => {
                    data.push([new Date(x + k + " 01:00").getTime(), R.month[K][k]])
                })
            })
            data.sort((a, b) => b[0] - a[0])
            chart = clone(Option)
            chart.title = { text: "最近3个月浏览量 (" + data.reduce((acc, x) => acc + x[1], 0).toLocaleString("en-US") + ")" }
            chart.series = [{ type: "area", name: "浏览量", data }]
            Highcharts.chart($("#" + id + " .页面PV .月"), chart)

            data = []
            Object.keys(R.year).forEach(K => {
                Object.keys(R.year[K]).forEach(k => {
                    data.push([new Date(K + "/" + k + "/01").getTime(), R.year[K][k]])
                })
            })
            data.sort((a, b) => b[0] - a[0])
            chart = clone(Option)
            chart.title = { text: "各月浏览量 (" + data.reduce((acc, x) => acc + x[1], 0).toLocaleString("en-US") + ")" }
            chart.series = [{ type: "area", name: "浏览量", data }]
            Highcharts.chart($("#" + id + " .页面PV .年"), chart)
        })
    }, 9)
}

function clone(o) {
    return JSON.parse(JSON.stringify(o))
}

$plugin({
    id: "zp111",
    render,
    init,
    css
})

const BARCHART = <path d="M888 792H200V168c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v688c0 4.4 3.6 8 8 8h752c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm-600-80h56c4.4 0 8-3.6 8-8V560c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v144c0 4.4 3.6 8 8 8zm152 0h56c4.4 0 8-3.6 8-8V384c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v320c0 4.4 3.6 8 8 8zm152 0h56c4.4 0 8-3.6 8-8V462c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v242c0 4.4 3.6 8 8 8zm152 0h56c4.4 0 8-3.6 8-8V304c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v400c0 4.4 3.6 8 8 8z"></path>
const DateFormat = { "小时": "yyyy/MM/dd/HH", "日": "yyyy/MM/dd", "月": "yyyy/MM", "年": "yyyy" }
const dateTime = { "minute": "%H:%M", "hour": "%H:%M", "day": "%m-%d" }
const Option = {
    xAxis: { type: "datetime", dateTimeLabelFormats: dateTime },
    yAxis: { title: "" },
    tooltip: { dateTimeLabelFormats: dateTime },
    plotOptions: {
        series: {
            fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, "#7cb5ec"],
                    [1, "rgba(124,181,236,0)"]
                ]
            }
        }
    }
}