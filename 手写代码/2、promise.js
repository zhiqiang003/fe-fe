// 方法1
class Promise {
  constructor(executor) {
    this.status = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];
    let resolve = (value) => {
      if (this.status === 'pending') {
        this.status = 'resolved';
        this.value = value;
        this.onResolvedCallbacks.forEach(fn => fn());
      }
    };
    let reject = (reason) => {
      if (this.status === 'pending') {
        this.status = 'rejected';
        this.reason = reason;
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    };
    try {
      executor(resolve, reject);
    }
    catch (e) {
      reject(e);
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason; };
    if (this.status === 'resolved') {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(x, resolve, reject);
          }
          catch (e) {
            reject(e);
          }
        }, 0);
      });
    }
    if (this.status === 'rejected') {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(x, resolve, reject);
          }
          catch (e) {
            reject(e);
          }
        }, 0);
      });
    }
    if (this.status === 'pending') {
      return new Promise((resolve, reject) => {
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(x, resolve, reject);
            }
            catch (e) {
              reject(e);
            }
          }, 0);
        });
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(x, resolve, reject);
            }
            catch (e) {
              reject(e);
            }
          }, 0);
        });
      });
    }
  }
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
  static resolve(value) {
    return new Promise(resolve => {
      resolve(value);
    });
  }
  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }
  static all(promises) {
    return new Promise((resolve, reject) => {
      let result = [];
      let count = 0;
      if (promises.length === 0) {
        resolve(result);
      }
      else {
        promises.forEach((promise, index) => {
          promise.then(value => {
            result[index] = value;
            count++;
            if (count === promises.length) {
              resolve(result);
            }
          }, reason => {
            reject(reason);
          });
        });
      }
    });
  }
}
function resolvePromise(x, resolve, reject) {
  if (x instanceof Promise) {
    x.then(resolve, reject);
  }
  else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let then = x.then;
    if (typeof then === 'function') {
      then.call(x, y => {
        resolvePromise(y, resolve, reject);
      }, reject);
    }
    else {
      resolve(x);
    }
  }
  else {
    resolve(x);
  }
}

// 方法2
const EStatus = { pending: 1, fulfilled: 2, rejected: 3 }
class Promise {
  // 重点：
  // 属性：state、value、reason、onResolvedCallbacks、onRejectCallbacks
  // resolve 函数：判断状态，是 pending，就改状态、赋值value，执⾏回调
  // reject 函数：判断状态，是 pending 就改状态、赋值 reason，执⾏回调
  // 执⾏ executor, 捕获错误 reject
  constructor (executor) {
    this.state = EStatus.pending
    this.value = undefined
    this.reason = undefined
    this.onResolvedCallbacks = []
    this.onRejectedCallbacks = []
    const resolve = value => {
      if (this.state === EStatus.pending) {
        this.state = EStatus.fulfilled
        this.value = value
        this.onResolvedCallbacks.forEach(fn => fn())
      }
    }
    const reject = reason => {
      if (this.state === EStatus.pending) {
        this.state = EStatus.rejected
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }
    // 兜底，如果 executor 就执⾏错误了，直接 reject
    try {
      executor(resolve, reject)
    } catch (err) { reject(err) }
  }
  // 重点：
  // 判断类型初始化 onFulfilled 和 onRejected
  // 创建并返回 promise2 // executor 判断三个状态
  // 有结果的，就 nextTick 调对应函数传⼊ this.value / reason，并获取返回值，然后 resolvePromise
  // 注意捕获错误 reject // pending 状态就把上述放⼊回调
  then (onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err }
    const promise2 = new Promise((resolve, reject) => {
      if (this.state === EStatus.fulfilled) {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      if (this.state === EStatus.rejected) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }
      if (this.state === EStatus.pending) {
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value)
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason)
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
      }
    })
    return promise2
  }

  catch (fn) {
    return this.then(null, fn)
  }
}
// 重点：
// x = promise2 => 循环引⽤ TypeError
// called 标 // 判断x，不是对象或函数就 resolve x
// try catch, 出错就判断 called，reject(error)
// 判断x.then, 不是函数就 resolve x
// then.call, 两个参数都是函数，第⼀个参数⼊参 xy，判断called，然后递归传 y
// 第⼆个参数⼊参error，判断 called，直接 reject error
function resolvePromise (promise2, x, resolve, reject) {
  if (x === promise2) {
    return reject(new TypeError('Chaining cycle detected for promise'))
  }
  let called
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      const then = x.then
      if (typeof then === 'function') {
        then.call((x, y) => {
          if (called) return
          called = true
          resolvePromise(promise2, y, resolve, reject)
        }, err => {
          if (called) return
          called = true
          reject(err)
        })
      } else { resolve(x) }
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
  } else {
    resolve(x)
  }
}
// resolve⽅法
Promise.resolve = function (val) {
  return new Promise(resolve => { resolve(val) })
}
// reject⽅法
Promise.reject = function (val) {
  return new Promise((resolve, reject) => { reject(val) })
}
// race⽅法
Promise.race = function (promises) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < promises.length; i++) {
      promises[i].then(resolve, reject)
    }
  })
}
// all⽅法(获取所有的promise，都执⾏then，把结果放到数组，⼀起返回)
Promise.all = function (promises, resolve) {
  const arr = []
  let i = 0
  function processData (index, data) {
    arr[index] = data
    i++
    if (i === promises.length) {
      resolve(arr)
    }
  }
  return new Promise((resolve, reject) => {
    for (let i = 0; i < promises.length; i++) {
      promises[i].then(data => {
        processData(i, data, resolve)
      }, reject)
    }
  })
}

// ⽬前是通过他测试 他会测试⼀个对象
// 语法糖
Promise.defer = Promise.deferred = function () {
  const dfd = {}
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve; dfd.reject = reject
  })
  return dfd
}

module.exports = Promise

