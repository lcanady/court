/**
* @vue/shared v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
const W = process.env.NODE_ENV !== "production" ? Object.freeze({}) : {};
process.env.NODE_ENV !== "production" && Object.freeze([]);
const se = () => {
}, Oe = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Se = (e) => e.startsWith("onUpdate:"), I = Object.assign, d = Array.isArray, b = (e) => typeof e == "function", N = (e) => typeof e == "string", Ve = (e) => typeof e == "symbol", E = (e) => e !== null && typeof e == "object";
let ne;
const z = () => ne || (ne = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Q(e) {
  if (d(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const o = e[n], s = N(o) ? De(o) : Q(o);
      if (s)
        for (const r in s)
          t[r] = s[r];
    }
    return t;
  } else if (N(e) || E(e))
    return e;
}
const ke = /;(?![^(]*\))/g, Ce = /:([^]+)/, Re = /\/\*[^]*?\*\//g;
function De(e) {
  const t = {};
  return e.replace(Re, "").split(ke).forEach((n) => {
    if (n) {
      const o = n.split(Ce);
      o.length > 1 && (t[o[0].trim()] = o[1].trim());
    }
  }), t;
}
function X(e) {
  let t = "";
  if (N(e))
    t = e;
  else if (d(e))
    for (let n = 0; n < e.length; n++) {
      const o = X(e[n]);
      o && (t += o + " ");
    }
  else if (E(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
/**
* @vue/reactivity v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
process.env.NODE_ENV;
process.env.NODE_ENV;
process.env.NODE_ENV;
new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Ve)
);
// @__NO_SIDE_EFFECTS__
function ie(e) {
  return /* @__PURE__ */ q(e) ? /* @__PURE__ */ ie(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function q(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function L(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function B(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function O(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ O(t) : e;
}
// @__NO_SIDE_EFFECTS__
function Z(e) {
  return e ? e.__v_isRef === !0 : !1;
}
/**
* @vue/runtime-core v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
const S = [];
function Te(e) {
  S.push(e);
}
function xe() {
  S.pop();
}
let j = !1;
function D(e, ...t) {
  if (j) return;
  j = !0;
  const n = S.length ? S[S.length - 1].component : null, o = n && n.appContext.config.warnHandler, s = Fe();
  if (o)
    ee(
      o,
      n,
      11,
      [
        // eslint-disable-next-line no-restricted-syntax
        e + t.map((r) => {
          var l, c;
          return (c = (l = r.toString) == null ? void 0 : l.call(r)) != null ? c : JSON.stringify(r);
        }).join(""),
        n && n.proxy,
        s.map(
          ({ vnode: r }) => `at <${be(n, r.type)}>`
        ).join(`
`),
        s
      ]
    );
  else {
    const r = [`[Vue warn]: ${e}`, ...t];
    s.length && r.push(`
`, ...Ie(s)), console.warn(...r);
  }
  j = !1;
}
function Fe() {
  let e = S[S.length - 1];
  if (!e)
    return [];
  const t = [];
  for (; e; ) {
    const n = t[0];
    n && n.vnode === e ? n.recurseCount++ : t.push({
      vnode: e,
      recurseCount: 0
    });
    const o = e.component && e.component.parent;
    e = o && o.vnode;
  }
  return t;
}
function Ie(e) {
  const t = [];
  return e.forEach((n, o) => {
    t.push(...o === 0 ? [] : [`
`], ...$e(n));
  }), t;
}
function $e({ vnode: e, recurseCount: t }) {
  const n = t > 0 ? `... (${t} recursive calls)` : "", o = e.component ? e.component.parent == null : !1, s = ` at <${be(
    e.component,
    e.type,
    o
  )}`, r = ">" + n;
  return e.props ? [s, ...Pe(e.props), r] : [s + r];
}
function Pe(e) {
  const t = [], n = Object.keys(e);
  return n.slice(0, 3).forEach((o) => {
    t.push(...le(o, e[o]));
  }), n.length > 3 && t.push(" ..."), t;
}
function le(e, t, n) {
  return N(t) ? (t = JSON.stringify(t), n ? t : [`${e}=${t}`]) : typeof t == "number" || typeof t == "boolean" || t == null ? n ? t : [`${e}=${t}`] : /* @__PURE__ */ Z(t) ? (t = le(e, /* @__PURE__ */ O(t.value), !0), n ? t : [`${e}=Ref<`, t, ">"]) : b(t) ? [`${e}=fn${t.name ? `<${t.name}>` : ""}`] : (t = /* @__PURE__ */ O(t), n ? t : [`${e}=`, t]);
}
const ce = {
  sp: "serverPrefetch hook",
  bc: "beforeCreate hook",
  c: "created hook",
  bm: "beforeMount hook",
  m: "mounted hook",
  bu: "beforeUpdate hook",
  u: "updated",
  bum: "beforeUnmount hook",
  um: "unmounted hook",
  a: "activated hook",
  da: "deactivated hook",
  ec: "errorCaptured hook",
  rtc: "renderTracked hook",
  rtg: "renderTriggered hook",
  0: "setup function",
  1: "render function",
  2: "watcher getter",
  3: "watcher callback",
  4: "watcher cleanup function",
  5: "native event handler",
  6: "component event handler",
  7: "vnode hook",
  8: "directive hook",
  9: "transition hook",
  10: "app errorHandler",
  11: "app warnHandler",
  12: "ref function",
  13: "async component loader",
  14: "scheduler flush",
  15: "component update",
  16: "app unmount cleanup function"
};
function ee(e, t, n, o) {
  try {
    return o ? e(...o) : e();
  } catch (s) {
    ae(s, t, n);
  }
}
function ae(e, t, n, o = !0) {
  const s = t ? t.vnode : null, { errorHandler: r, throwUnhandledErrorInProduction: l } = t && t.appContext.config || W;
  if (t) {
    let c = t.parent;
    const a = t.proxy, m = process.env.NODE_ENV !== "production" ? ce[n] : `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; c; ) {
      const _ = c.ec;
      if (_) {
        for (let i = 0; i < _.length; i++)
          if (_[i](e, a, m) === !1)
            return;
      }
      c = c.parent;
    }
    if (r) {
      ee(r, null, 10, [
        e,
        a,
        m
      ]);
      return;
    }
  }
  Ae(e, n, s, o, l);
}
function Ae(e, t, n, o = !0, s = !1) {
  if (process.env.NODE_ENV !== "production") {
    const r = ce[t];
    if (n && Te(n), D(`Unhandled error${r ? ` during execution of ${r}` : ""}`), n && xe(), o)
      throw e;
    console.error(e);
  } else {
    if (s)
      throw e;
    console.error(e);
  }
}
const p = [];
let g = -1;
const R = [];
let y = null, V = 0;
const He = /* @__PURE__ */ Promise.resolve();
let Y = null;
const Me = 100;
function ve(e) {
  let t = g + 1, n = p.length;
  for (; t < n; ) {
    const o = t + n >>> 1, s = p[o], r = F(s);
    r < e || r === e && s.flags & 2 ? t = o + 1 : n = o;
  }
  return t;
}
function Ue(e) {
  if (!(e.flags & 1)) {
    const t = F(e), n = p[p.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= F(n) ? p.push(e) : p.splice(ve(t), 0, e), e.flags |= 1, ue();
  }
}
function ue() {
  Y || (Y = He.then(fe));
}
function ze(e) {
  d(e) ? R.push(...e) : y && e.id === -1 ? y.splice(V + 1, 0, e) : e.flags & 1 || (R.push(e), e.flags |= 1), ue();
}
function Le(e) {
  if (R.length) {
    const t = [...new Set(R)].sort(
      (n, o) => F(n) - F(o)
    );
    if (R.length = 0, y) {
      y.push(...t);
      return;
    }
    for (y = t, process.env.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map()), V = 0; V < y.length; V++) {
      const n = y[V];
      process.env.NODE_ENV !== "production" && pe(e, n) || (n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2);
    }
    y = null, V = 0;
  }
}
const F = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function fe(e) {
  process.env.NODE_ENV !== "production" && (e = e || /* @__PURE__ */ new Map());
  const t = process.env.NODE_ENV !== "production" ? (n) => pe(e, n) : se;
  try {
    for (g = 0; g < p.length; g++) {
      const n = p[g];
      if (n && !(n.flags & 8)) {
        if (process.env.NODE_ENV !== "production" && t(n))
          continue;
        n.flags & 4 && (n.flags &= -2), ee(
          n,
          n.i,
          n.i ? 15 : 14
        ), n.flags & 4 || (n.flags &= -2);
      }
    }
  } finally {
    for (; g < p.length; g++) {
      const n = p[g];
      n && (n.flags &= -2);
    }
    g = -1, p.length = 0, Le(e), Y = null, (p.length || R.length) && fe(e);
  }
}
function pe(e, t) {
  const n = e.get(t) || 0;
  if (n > Me) {
    const o = t.i, s = o && Ne(o.type);
    return ae(
      `Maximum recursive updates exceeded${s ? ` in component <${s}>` : ""}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`,
      null,
      10
    ), !0;
  }
  return e.set(t, n + 1), !1;
}
const J = /* @__PURE__ */ new Map();
process.env.NODE_ENV !== "production" && (z().__VUE_HMR_RUNTIME__ = {
  createRecord: K(je),
  rerender: K(Je),
  reload: K(Ke)
});
const A = /* @__PURE__ */ new Map();
function je(e, t) {
  return A.has(e) ? !1 : (A.set(e, {
    initialDef: H(t),
    instances: /* @__PURE__ */ new Set()
  }), !0);
}
function H(e) {
  return we(e) ? e.__vccOpts : e;
}
function Je(e, t) {
  const n = A.get(e);
  n && (n.initialDef.render = t, [...n.instances].forEach((o) => {
    t && (o.render = t, H(o.type).render = t), o.renderCache = [], o.job.flags & 8 || o.update();
  }));
}
function Ke(e, t) {
  const n = A.get(e);
  if (!n) return;
  t = H(t), oe(n.initialDef, t);
  const o = [...n.instances];
  for (let s = 0; s < o.length; s++) {
    const r = o[s], l = H(r.type);
    let c = J.get(l);
    c || (l !== n.initialDef && oe(l, t), J.set(l, c = /* @__PURE__ */ new Set())), c.add(r), r.appContext.propsCache.delete(r.type), r.appContext.emitsCache.delete(r.type), r.appContext.optionsCache.delete(r.type), r.ceReload ? (c.add(r), r.ceReload(t.styles), c.delete(r)) : r.parent ? Ue(() => {
      r.job.flags & 8 || (r.parent.update(), c.delete(r));
    }) : r.appContext.reload ? r.appContext.reload() : typeof window < "u" ? window.location.reload() : console.warn(
      "[HMR] Root or manually mounted instance modified. Full reload required."
    ), r.root.ce && r !== r.root && r.root.ce._removeChildStyle(l);
  }
  ze(() => {
    J.clear();
  });
}
function oe(e, t) {
  I(e, t);
  for (const n in e)
    n !== "__file" && !(n in t) && delete e[n];
}
function K(e) {
  return (t, n) => {
    try {
      return e(t, n);
    } catch (o) {
      console.error(o), console.warn(
        "[HMR] Something went wrong during Vue component hot-reload. Full reload required."
      );
    }
  };
}
let k, $ = [];
function de(e, t) {
  var n, o;
  k = e, k ? (k.enabled = !0, $.forEach(({ event: s, args: r }) => k.emit(s, ...r)), $ = []) : /* handle late devtools injection - only do this if we are in an actual */ /* browser environment to avoid the timer handle stalling test runner exit */ /* (#4815) */ typeof window < "u" && // some envs mock window but not fully
  window.HTMLElement && // also exclude jsdom
  // eslint-disable-next-line no-restricted-syntax
  !((o = (n = window.navigator) == null ? void 0 : n.userAgent) != null && o.includes("jsdom")) ? ((t.__VUE_DEVTOOLS_HOOK_REPLAY__ = t.__VUE_DEVTOOLS_HOOK_REPLAY__ || []).push((r) => {
    de(r, t);
  }), setTimeout(() => {
    k || (t.__VUE_DEVTOOLS_HOOK_REPLAY__ = null, $ = []);
  }, 3e3)) : $ = [];
}
let M = null, We = null;
const qe = (e) => e.__isTeleport;
function me(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, me(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Be(e, t) {
  return b(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    I({ name: e.name }, t, { setup: e })
  ) : e;
}
z().requestIdleCallback;
z().cancelIdleCallback;
const Ye = /* @__PURE__ */ Symbol.for("v-ndc"), Ge = {};
process.env.NODE_ENV !== "production" && (Ge.ownKeys = (e) => (D(
  "Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead."
), Reflect.ownKeys(e)));
const Qe = {}, he = (e) => Object.getPrototypeOf(e) === Qe, Xe = (e) => e.__isSuspense, _e = /* @__PURE__ */ Symbol.for("v-fgt"), Ze = /* @__PURE__ */ Symbol.for("v-txt"), et = /* @__PURE__ */ Symbol.for("v-cmt");
let C = null, te = 1;
function re(e, t = !1) {
  te += e;
}
function G(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
const tt = (...e) => ye(
  ...e
), ge = ({ key: e }) => e ?? null, P = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? N(e) || /* @__PURE__ */ Z(e) || b(e) ? { i: M, r: e, k: t, f: !!n } : e : null);
function nt(e, t = null, n = null, o = 0, s = null, r = e === _e ? 0 : 1, l = !1, c = !1) {
  const a = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && ge(t),
    ref: t && P(t),
    scopeId: We,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: r,
    patchFlag: o,
    dynamicProps: s,
    dynamicChildren: null,
    appContext: null,
    ctx: M
  };
  return c ? (U(a, n), r & 128 && e.normalize(a)) : n && (a.shapeFlag |= N(n) ? 8 : 16), process.env.NODE_ENV !== "production" && a.key !== a.key && D("VNode created with invalid key (NaN). VNode type:", a.type), te > 0 && // avoid a block node from tracking itself
  !l && // has current parent block
  C && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (a.patchFlag > 0 || r & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  a.patchFlag !== 32 && C.push(a), a;
}
const x = process.env.NODE_ENV !== "production" ? tt : ye;
function ye(e, t = null, n = null, o = 0, s = null, r = !1) {
  if ((!e || e === Ye) && (process.env.NODE_ENV !== "production" && !e && D(`Invalid vnode type when creating vnode: ${e}.`), e = et), G(e)) {
    const c = v(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && U(c, n), te > 0 && !r && C && (c.shapeFlag & 6 ? C[C.indexOf(e)] = c : C.push(c)), c.patchFlag = -2, c;
  }
  if (we(e) && (e = e.__vccOpts), t) {
    t = ot(t);
    let { class: c, style: a } = t;
    c && !N(c) && (t.class = X(c)), E(a) && (/* @__PURE__ */ B(a) && !d(a) && (a = I({}, a)), t.style = Q(a));
  }
  const l = N(e) ? 1 : Xe(e) ? 128 : qe(e) ? 64 : E(e) ? 4 : b(e) ? 2 : 0;
  return process.env.NODE_ENV !== "production" && l & 4 && /* @__PURE__ */ B(e) && (e = /* @__PURE__ */ O(e), D(
    "Vue received a Component that was made a reactive object. This can lead to unnecessary performance overhead and should be avoided by marking the component with `markRaw` or using `shallowRef` instead of `ref`.",
    `
Component that was made reactive: `,
    e
  )), nt(
    e,
    t,
    n,
    o,
    s,
    l,
    r,
    !0
  );
}
function ot(e) {
  return e ? /* @__PURE__ */ B(e) || he(e) ? I({}, e) : e : null;
}
function v(e, t, n = !1, o = !1) {
  const { props: s, ref: r, patchFlag: l, children: c, transition: a } = e, m = t ? st(s || {}, t) : s, _ = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: m,
    key: m && ge(m),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && r ? d(r) ? r.concat(P(t)) : [r, P(t)] : P(t)
    ) : r,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: process.env.NODE_ENV !== "production" && l === -1 && d(c) ? c.map(Ee) : c,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== _e ? l === -1 ? 16 : l | 16 : l,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: a,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && v(e.ssContent),
    ssFallback: e.ssFallback && v(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return a && o && me(
    _,
    a.clone(_)
  ), _;
}
function Ee(e) {
  const t = v(e);
  return d(e.children) && (t.children = e.children.map(Ee)), t;
}
function rt(e = " ", t = 0) {
  return x(Ze, null, e, t);
}
function U(e, t) {
  let n = 0;
  const { shapeFlag: o } = e;
  if (t == null)
    t = null;
  else if (d(t))
    n = 16;
  else if (typeof t == "object")
    if (o & 65) {
      const s = t.default;
      s && (s._c && (s._d = !1), U(e, s()), s._c && (s._d = !0));
      return;
    } else
      n = 32, !t._ && !he(t) && (t._ctx = M);
  else if (b(t)) {
    if (o & 65) {
      U(e, { default: t });
      return;
    }
    t = { default: t, _ctx: M }, n = 32;
  } else
    t = String(t), o & 64 ? (n = 16, t = [rt(t)]) : n = 8;
  e.children = t, e.shapeFlag |= n;
}
function st(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const o = e[n];
    for (const s in o)
      if (s === "class")
        t.class !== o.class && (t.class = X([t.class, o.class]));
      else if (s === "style")
        t.style = Q([t.style, o.style]);
      else if (Oe(s)) {
        const r = t[s], l = o[s];
        l && r !== l && !(d(r) && r.includes(l)) ? t[s] = r ? [].concat(r, l) : l : l == null && r == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !Se(s) && (t[s] = l);
      } else s !== "" && (t[s] = o[s]);
  }
  return t;
}
{
  const e = z(), t = (n, o) => {
    let s;
    return (s = e[n]) || (s = e[n] = []), s.push(o), (r) => {
      s.length > 1 ? s.forEach((l) => l(r)) : s[0](r);
    };
  };
  t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => n
  ), t(
    "__VUE_SSR_SETTERS__",
    (n) => n
  );
}
process.env.NODE_ENV;
const it = /(?:^|[-_])\w/g, lt = (e) => e.replace(it, (t) => t.toUpperCase()).replace(/[-_]/g, "");
function Ne(e, t = !0) {
  return b(e) ? e.displayName || e.name : e.name || t && e.__name;
}
function be(e, t, n = !1) {
  let o = Ne(t);
  if (!o && t.__file) {
    const s = t.__file.match(/([^/\\]+)\.\w+$/);
    s && (o = s[1]);
  }
  if (!o && e) {
    const s = (r) => {
      for (const l in r)
        if (r[l] === t)
          return l;
    };
    o = s(e.components) || e.parent && s(
      e.parent.type.components
    ) || s(e.appContext.components);
  }
  return o ? lt(o) : n ? "App" : "Anonymous";
}
function we(e) {
  return b(e) && "__vccOpts" in e;
}
function w(e, t, n) {
  try {
    re(-1);
    const o = arguments.length;
    return o === 2 ? E(t) && !d(t) ? G(t) ? x(e, null, [t]) : x(e, t) : x(e, null, t) : (o > 3 ? n = Array.prototype.slice.call(arguments, 2) : o === 3 && G(n) && (n = [n]), x(e, t, n));
  } finally {
    re(1);
  }
}
function ct() {
  if (process.env.NODE_ENV === "production" || typeof window > "u")
    return;
  const e = { style: "color:#3ba776" }, t = { style: "color:#1677ff" }, n = { style: "color:#f5222d" }, o = { style: "color:#eb2f96" }, s = {
    __vue_custom_formatter: !0,
    header(i) {
      if (!E(i))
        return null;
      if (i.__isVue)
        return ["div", e, "VueInstance"];
      if (/* @__PURE__ */ Z(i)) {
        const u = i.value;
        return [
          "div",
          {},
          ["span", e, _(i)],
          "<",
          c(u),
          ">"
        ];
      } else {
        if (/* @__PURE__ */ ie(i))
          return [
            "div",
            {},
            ["span", e, /* @__PURE__ */ L(i) ? "ShallowReactive" : "Reactive"],
            "<",
            c(i),
            `>${/* @__PURE__ */ q(i) ? " (readonly)" : ""}`
          ];
        if (/* @__PURE__ */ q(i))
          return [
            "div",
            {},
            ["span", e, /* @__PURE__ */ L(i) ? "ShallowReadonly" : "Readonly"],
            "<",
            c(i),
            ">"
          ];
      }
      return null;
    },
    hasBody(i) {
      return i && i.__isVue;
    },
    body(i) {
      if (i && i.__isVue)
        return [
          "div",
          {},
          ...r(i.$)
        ];
    }
  };
  function r(i) {
    const u = [];
    i.type.props && i.props && u.push(l("props", /* @__PURE__ */ O(i.props))), i.setupState !== W && u.push(l("setup", i.setupState)), i.data !== W && u.push(l("data", /* @__PURE__ */ O(i.data)));
    const f = a(i, "computed");
    f && u.push(l("computed", f));
    const h = a(i, "inject");
    return h && u.push(l("injected", h)), u.push([
      "div",
      {},
      [
        "span",
        {
          style: o.style + ";opacity:0.66"
        },
        "$ (internal): "
      ],
      ["object", { object: i }]
    ]), u;
  }
  function l(i, u) {
    return u = I({}, u), Object.keys(u).length ? [
      "div",
      { style: "line-height:1.25em;margin-bottom:0.6em" },
      [
        "div",
        {
          style: "color:#476582"
        },
        i
      ],
      [
        "div",
        {
          style: "padding-left:1.25em"
        },
        ...Object.keys(u).map((f) => [
          "div",
          {},
          ["span", o, f + ": "],
          c(u[f], !1)
        ])
      ]
    ] : ["span", {}];
  }
  function c(i, u = !0) {
    return typeof i == "number" ? ["span", t, i] : typeof i == "string" ? ["span", n, JSON.stringify(i)] : typeof i == "boolean" ? ["span", o, i] : E(i) ? ["object", { object: u ? /* @__PURE__ */ O(i) : i }] : ["span", n, String(i)];
  }
  function a(i, u) {
    const f = i.type;
    if (b(f))
      return;
    const h = {};
    for (const T in i.ctx)
      m(f, T, u) && (h[T] = i.ctx[T]);
    return h;
  }
  function m(i, u, f) {
    const h = i[f];
    if (d(h) && h.includes(u) || E(h) && u in h || i.extends && m(i.extends, u, f) || i.mixins && i.mixins.some((T) => m(T, u, f)))
      return !0;
  }
  function _(i) {
    return /* @__PURE__ */ L(i) ? "ShallowRef" : i.effect ? "ComputedRef" : "Ref";
  }
  window.devtoolsFormatters ? window.devtoolsFormatters.push(s) : window.devtoolsFormatters = [s];
}
process.env.NODE_ENV;
process.env.NODE_ENV;
process.env.NODE_ENV;
/**
* vue v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function at() {
  ct();
}
process.env.NODE_ENV !== "production" && at();
const ut = /* @__PURE__ */ Be({
  name: "HostEntryDemo",
  setup() {
    return () => w(
      "article",
      { class: "dash-browser", id: "main-plugin-module" },
      [
        w("header", { class: "dash-header" }, [
          w("div", [
            w("p", { class: "muted dash-kicker" }, "Plugin module"),
            w("h1", { class: "page-title" }, "Host ESM demo"),
            w(
              "p",
              { class: "muted" },
              "Loaded via registerStaffPage({ module }). Vue is bundled in this file."
            )
          ])
        ]),
        w(
          "p",
          { class: "muted" },
          [
            "Peer major: vue@3 · same-origin only · ",
            "fallback to embed if import fails."
          ]
        )
      ]
    );
  }
});
export {
  ut as default
};
