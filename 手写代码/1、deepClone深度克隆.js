// 1、深度克隆 没有解决循环引用的

function clone (obj) {
  
  if (!typeof obj === 'object') {
    // 这里除了基本类型还会有一个function & symbol
    if (obj instanceof Function) {
      return new Function(`return ${obj.apply(this, arguments)}`)
    }
    if (obj instanceof Symbol) {
      // .............
    }
    return obj
  }

  if(obj instanceof Date) {
    return new Date(obj)
  }
  
  if(obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags)
  }

  //Set 类数组，key、value一致，通过add添加
  if(obj instanceof Set) {
    let res = new Set()
    for(let i of obj.keys()) {
      res.add(clone(i))
    }
    return res
  }

  //Map 类对象，key/value分开，通过set添加
  if(obj instanceof Map) {
    let res = new Map()
    for(let [k, v] of obj.entries()) {
      res.set(clone(k), clone(v))
    }
    return res
  }

  let res = Array.isArray(obj) ? [] : {};
  for (let i in obj.keys()) {
    // 这里包括所有的引用类型
    if (obj[i] instanceof Object) {
      res[i] = clone(obj[i])
    } else {
      res[i] = obj[i]
    }
  }

  return res
}


// 2、解决循环引用的，思路：

// ⼆参 weakmap 当 cache 
// 不是对象直接返 
// cache ⾥有返 cache 
// 函数包⼀层，⾥⾯ apply 
// ⽇期重新new 
// 正则重新new，传 source 和 flags 
// Map 展开遍历递归 set 展开遍历递归 
// 其余判断数组决定 result 是 数组还是对象 
// 缓存
// 按 Object keys 遍历，是对象的递归，不是的直接赋值 
// 返回 result


function deepClone(obj, cache = new WeakMap) {
  
}