/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports) {
	'use strict';

	var __originalExports__ = exports;

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	function t(t, ...e) {
		const n = new URL("https://lexical.dev/docs/error"),
			o = new URLSearchParams();
		o.append("code", t);
		for (const t of e) o.append("v", t);
		throw n.search = o.toString(), Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	function e(t, ...e) {
		const n = new URL("https://lexical.dev/docs/error"),
			o = new URLSearchParams();
		o.append("code", t);
		for (const t of e) o.append("v", t);
		n.search = o.toString(), console.warn(`Minified Lexical warning #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	const n = "undefined" != typeof window && void 0 !== window.document && void 0 !== window.document.createElement,
		o = n && "documentMode" in document ? document.documentMode : null,
		r = n && /Mac|iPod|iPhone|iPad/.test(navigator.platform),
		i = n && /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent),
		s$1 = !(!n || !("InputEvent" in window) || o) && "getTargetRanges" in new window.InputEvent("input"),
		l = n && !window.MSStream && (/iPad|iPhone|iPod/.test(navigator.userAgent) || /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1),
		c$1 = n && /Android/.test(navigator.userAgent),
		a$1 = n && /Version\/[\d.]+.*Safari/.test(navigator.userAgent) && !c$1,
		u$2 = n && /^(?=.*Chrome).*/i.test(navigator.userAgent),
		f$2 = n && c$1 && u$2,
		d$2 = n && /AppleWebKit\/[\d.]+/.test(navigator.userAgent) && r && !u$2,
		h = 0,
		g$2 = 1,
		_$1 = 2,
		p$1 = 1,
		y$1 = 2,
		m$1 = 4,
		x$1 = 8,
		C$1 = 16,
		S = 32,
		v$1 = 64,
		T = 128,
		k = 2047,
		b$3 = 1,
		N = 2,
		w$1 = 3,
		E$1 = 4,
		M$2 = 5,
		O$2 = 6,
		A$1 = a$1 || l || d$2 ? "\xa0" : "\u200b",
		D$2 = "\n\n",
		F$1 = i ? "\xa0" : A$1,
		P = "\u0591-\u07ff\ufb1d-\ufdfd\ufe70-\ufefc",
		I = "A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02b8\u0300-\u0590\u0800-\u1fff\u200e\u2c00-\ufb1c\ufe00-\ufe6f\ufefd-\uffff",
		L$1 = new RegExp("^[^" + I + "]*[" + P + "]"),
		z$2 = new RegExp("^[^" + P + "]*[" + I + "]"),
		K$1 = {
			bold: 1,
			capitalize: 1024,
			code: 16,
			highlight: T,
			italic: 2,
			lowercase: 256,
			strikethrough: 4,
			subscript: 32,
			superscript: 64,
			underline: 8,
			uppercase: 512
		},
		B$1 = {
			directionless: 1,
			unmergeable: 2
		},
		R$1 = {
			center: 2,
			end: 6,
			justify: 4,
			left: 1,
			right: 3,
			start: 5
		},
		W$1 = {
			[N]: "center",
			[O$2]: "end",
			[E$1]: "justify",
			[b$3]: "left",
			[w$1]: "right",
			[M$2]: "start"
		},
		$$1 = {
			normal: 0,
			segmented: 2,
			token: 1
		},
		U$1 = {
			[h]: "normal",
			[_$1]: "segmented",
			[g$2]: "token"
		},
		H$3 = "$",
		j$2 = Symbol.for("@lexical/ctrlOrOtherKey"),
		J$3 = "$config";
	function V$2() {
		return ua()._blockCursorElement;
	}
	function q$2(t) {
		return null !== t && 1 === t.nodeType && t.hasAttribute("data-lexical-slot");
	}
	const Y$2 = d$2 || l || a$1;
	function G$2() {
		const t = Wc().createElement("img");
		t.setAttribute("data-lexical-decorator-boundary", "true"), t.alt = "";
		for (const [e, n] of [["position", "absolute"], ["width", "0px"], ["height", "0px"], ["border", "0px"], ["margin", "0px"], ["padding", "0px"]]) t.style.setProperty(e, n, "important");
		return t;
	}
	function X$2(t) {
		return null !== t && 1 === t.nodeType && t.hasAttribute("data-lexical-decorator-boundary");
	}
	let Q$3 = class Q {
		constructor(t, e, n) {
			this.element = t, this.before = e || null, this.after = n || null;
		}
		withBefore(t) {
			return new Q(this.element, t, this.after);
		}
		withAfter(t) {
			return new Q(this.element, this.before, t);
		}
		withElement(t) {
			return this.element === t ? this : new Q(t, this.before, this.after);
		}
		insertChild(e) {
			const n = this.getInsertionAnchor();
			return null !== n && n.parentElement !== this.element && t(357), this.element.insertBefore(e, n), this;
		}
		removeChild(e) {
			return e.parentElement !== this.element && t(358), this.element.removeChild(e), this;
		}
		replaceChild(e, n) {
			return n.parentElement !== this.element && t(359), this.element.replaceChild(e, n), this;
		}
		getFirstChild() {
			const t = this.getFirstChildAnchor(),
				e = t ? t.nextSibling : this.element.firstChild;
			return e === this.getInsertionAnchor() ? null : e;
		}
		getFirstChildAnchor() {
			return this.after;
		}
		resolveLeafPosition(t, e, n) {
			if (this.element === t) return e === t && 0 === n ? "before" : "after";
			const o = Z$4(t, this.element);
			if (null === o) return "after";
			const r = Array.prototype.indexOf.call(t.childNodes, o);
			if (r < 0) return "after";
			if (e === t) return n <= r ? "before" : "after";
			const i = Z$4(t, e);
			if (null === i) return "after";
			const s = Array.prototype.indexOf.call(t.childNodes, i);
			return s >= 0 && s <= r ? "before" : "after";
		}
		getInsertionAnchor() {
			return this.before;
		}
	};
	function Z$4(t, e) {
		let n = e;
		for (; null !== n && n.parentNode !== t;) n = n.parentNode;
		return n;
	}
	let tt$4 = class tt extends Q$3 {
		withBefore(t) {
			return new tt(this.element, t, this.after);
		}
		withAfter(t) {
			return new tt(this.element, this.before, t);
		}
		withElement(t) {
			return this.element === t ? this : new tt(t, this.before, this.after);
		}
		getInsertionAnchor() {
			return super.getInsertionAnchor() || this.getManagedLineBreak() || this.getDecoratorBoundaryAnchor("trailing");
		}
		getFirstChildAnchor() {
			let t = super.getFirstChildAnchor(),
				e = t ? t.nextSibling : this.element.firstChild;
			for (; q$2(e);) t = e, e = e.nextSibling;
			X$2(e) && (t = e, e = e.nextSibling);
			const n = t ? t.nextSibling : this.element.firstChild;
			return null !== n && n === V$2() ? n : t;
		}
		getDecoratorBoundaryAnchor(t) {
			let e;
			if ("leading" === t) {
				const t = super.getFirstChildAnchor();
				for (e = t ? t.nextSibling : this.element.firstChild; q$2(e);) e = e.nextSibling;
			} else e = this.before ? this.before.previousSibling : this.element.lastChild, null !== e && e === V$2() && (e = e.previousSibling);
			return X$2(e) ? e : null;
		}
		setDecoratorBoundaryAnchor(t, e) {
			const n = this.getDecoratorBoundaryAnchor(t);
			if (e !== (null !== n)) if (null !== n) this.element.removeChild(n);else if ("leading" === t) {
				const t = this.getFirstChildAnchor();
				this.element.insertBefore(G$2(), t ? t.nextSibling : this.element.firstChild);
			} else this.element.insertBefore(G$2(), this.before);
		}
		getManagedLineBreak() {
			return this.element.__lexicalLineBreak || null;
		}
		setManagedLineBreak(t) {
			const e = this.element,
				n = null === this.after ? e.firstChild : this.after.nextSibling,
				o = "empty" === t && q$2(n) ? null : t;
			if (e.__lexicalLastChildKind !== o) if (e.__lexicalLastChildKind = o, null === o) this.removeManagedLineBreak();else {
				const t = "decorator" === o && Y$2;
				this.insertManagedLineBreak(t);
			}
		}
		removeManagedLineBreak() {
			const t = this.getManagedLineBreak();
			if (t) {
				const e = this.element,
					n = "IMG" === t.nodeName ? t.nextSibling : null;
				n && e.removeChild(n), e.removeChild(t), e.__lexicalLineBreak = void 0;
			}
		}
		insertManagedLineBreak(t) {
			const e = this.getManagedLineBreak();
			if (e) {
				if (t === ("IMG" === e.nodeName)) return;
				this.removeManagedLineBreak();
			}
			const n = this.element,
				o = this.before || this.getDecoratorBoundaryAnchor("trailing"),
				r = Wc().createElement("br");
			if (r.setAttribute("data-lexical-managed-linebreak", "true"), n.insertBefore(r, o), t) {
				const t = Wc().createElement("img");
				t.setAttribute("data-lexical-managed-linebreak", "true"), t.style.setProperty("display", "inline", "important"), t.style.setProperty("border", "0px", "important"), t.style.setProperty("margin", "0px", "important"), t.alt = "", n.insertBefore(t, r), n.__lexicalLineBreak = t;
			} else n.__lexicalLineBreak = r;
		}
		getFirstChildOffset() {
			const t = this.getFirstChild(),
				e = this.getInsertionAnchor();
			let n = 0;
			for (let o = this.element.firstChild; null !== o && o !== t && o !== e; o = o.nextSibling) n++;
			return n;
		}
		resolveChildIndex(t, e, n, o) {
			if (n === this.element) {
				const e = this.getFirstChildOffset(),
					n = V$2(),
					r = this.element.childNodes,
					i = Math.min(o, r.length);
				let s = 0;
				for (let t = e; t < i; t++) r[t] !== n && s++;
				return [t, Math.min(s, t.getChildrenSize())];
			}
			const r = et$4(e, n);
			r.push(o);
			const i = et$4(e, this.element);
			let s = t.getIndexWithinParent();
			for (let t = 0; t < i.length; t++) {
				const e = r[t],
					n = i[t];
				if (void 0 === e || e < n) break;
				if (e > n) {
					s += 1;
					break;
				}
			}
			return [t.getParentOrThrow(), s];
		}
	};
	function et$4(e, n) {
		const o = [];
		let r = n;
		for (; r !== e && null !== r; r = r.parentNode) {
			let t = 0;
			for (let e = r.previousSibling; null !== e; e = e.previousSibling) t++;
			o.push(t);
		}
		return r !== e && t(225), o.reverse();
	}
	let nt$4;
	try {
		nt$4 = "0.50.0+prod.esm";
	} catch (t) {}
	const ot$5 = nt$4 ?? '"<unknown>+source"';
	let rt$5 = class rt {
		_front = new Set();
		_back = new Set();
		get size() {
			return this._front.size + this._back.size;
		}
		addBack(t) {
			return delete this._cache, this._front.has(t) || this._back.add(t), this;
		}
		addFront(t) {
			return delete this._cache, this._back.has(t) || this._front.add(t), this;
		}
		delete(t) {
			return delete this._cache, this._front.delete(t) || this._back.delete(t);
		}
		toArray() {
			const t = Array.from(this._front).reverse();
			for (const e of this._back) t.push(e);
			return t;
		}
		toReadonlyArray() {
			return this._cache = this._cache || this.toArray(), this._cache;
		}
		[Symbol.iterator]() {
			return this.toReadonlyArray()[Symbol.iterator]();
		}
	};
	const it$5 = null;
	function st$5(t, e = 1e3) {
		return t instanceof lt$5 ? t.clone() : t.size < e ? new Map(t) : new lt$5().init(new Map(t), void 0, t.size);
	}
	let lt$5 = class lt {
		_mutable = false;
		_old = void 0;
		_nursery = void 0;
		_size = 0;
		clone() {
			return this._mutable = false, new lt().init(this._old, this._nursery, this._size);
		}
		init(t, e, n) {
			return this._old = t, this._nursery = e, this._size = n, this;
		}
		get size() {
			return this._size;
		}
		has(t) {
			return void 0 !== this.get(t);
		}
		getWithTombstone(t) {
			const e = this._nursery && this._nursery.get(t);
			return void 0 !== e ? e : this._old && this._old.get(t);
		}
		get(t) {
			const e = this.getWithTombstone(t);
			return e === it$5 ? void 0 : e;
		}
		shouldCompact() {
			return void 0 !== this._nursery && 2 * this._nursery.size > this._size;
		}
		getNursery() {
			return this._mutable && this._nursery || (this.compact(), this._nursery = new Map(this._nursery), this._mutable = true), this._nursery;
		}
		compact(t = false) {
			if (this._nursery && this._nursery.size > 0 && (t || this.shouldCompact())) {
				const t = new Map(this._old);
				for (const [e, n] of this._nursery) n !== it$5 ? t.set(e, n) : t.delete(e);
				this._old = t, this._nursery = void 0;
			}
			return this._mutable = false, this;
		}
		set(t, e) {
			const n = this.getWithTombstone(t);
			if (n === e) return this;
			const o = this.getNursery();
			return n !== it$5 && void 0 !== n || (this._size++, n === it$5 && o.delete(t)), o.set(t, e), this;
		}
		delete(t) {
			const e = this.has(t);
			return e && (this.getNursery().set(t, it$5), this._size--), e;
		}
		getOrInsert(t, e) {
			const n = this.get(t);
			return void 0 !== n ? n : (this.set(t, e), e);
		}
		getOrInsertComputed(t, e) {
			const n = this.get(t);
			if (void 0 !== n) return n;
			const o = e(t);
			return this.set(t, o), o;
		}
		clear() {
			this._mutable = false, this._old = void 0, this._nursery = void 0, this._size = 0;
		}
		*keys() {
			for (const t of this.entries()) yield t[0];
		}
		*values() {
			for (const t of this.entries()) yield t[1];
		}
		*entries() {
			const t = this._nursery,
				e = this._old;
			if (e) for (const n of e) {
				const e = n[0],
					o = t ? t.get(e) : void 0;
				o !== it$5 && (void 0 !== o && (n[1] = o), yield n);
			}
			if (t) for (const n of t) n[1] === it$5 || e && e.has(n[0]) || (yield n);
		}
		forEach(t, e) {
			void 0 !== e && (t = t.bind(e));
			for (const [e, n] of this.entries()) t(n, e, this);
		}
		get [Symbol.toStringTag]() {
			return "GenMap";
		}
		[Symbol.iterator]() {
			return this.entries();
		}
	};
	function ct$5(t, e, n, o, r, i) {
		if (es(t)) {
			let s = t.getFirstChild();
			for (; null !== s;) {
				const t = s.__key;
				s.__parent === e && ((es(s) || Ra(s) && null !== s.__slots) && ct$5(s, t, n, o, r, i), n.has(t) || i.delete(t), r.push(t)), s = s.getNextSibling();
			}
		}
		for (const s of Ra(t) && null !== t.__slots ? t.__slots.values() : []) {
			const t = o.get(s);
			void 0 !== t && Wa(t) && t.__slotHost === e && ((es(t) || Ra(t) && null !== t.__slots) && ct$5(t, s, n, o, r, i), n.has(s) || i.delete(s), r.push(s));
		}
	}
	let at$5 = false,
		ut$5 = 0;
	function ft$6(t) {
		ut$5 = t.timeStamp;
	}
	function dt$6(t, e, n) {
		const o = "BR" === t.nodeName,
			r = e.__lexicalLineBreak;
		return r && (t === r || o && t.previousSibling === r) || o && void 0 !== Kl(t, n);
	}
	function ht$7(t, e, n) {
		const o = Pc(Tc(n)),
			r = o && Hc(o, n._rootElement);
		let i = null,
			s = null;
		null !== r && r.anchorNode === t && (i = r.anchorOffset, s = r.focusOffset);
		const l = t.nodeValue;
		null !== l && Ql(e, l, i, s, false);
	}
	function gt$5(t, e, n) {
		if (Er(t)) {
			const e = t.anchor.getNode();
			if (e.is(n) && t.format !== e.getFormat()) return false;
		}
		return kl(e) && n.isAttached();
	}
	function _t$6(t, e, n) {
		for (let o = t; o && !Na(o); o = pc(o)) {
			const t = Kl(o, e);
			if (void 0 !== t) {
				const e = Il(t, n);
				if (e) return rs(e) || !na(o) ? void 0 : [o, e];
			}
		}
	}
	function pt$6(t, e, n) {
		at$5 = true;
		const o = performance.now() - ut$5 > 100;
		try {
			Qi(t, () => {
				const r = ni() || function (t) {
						return t.read("latest", () => {
							const t = ni();
							return null !== t ? t.clone() : null;
						});
					}(t),
					s = new Map(),
					l = t._editorState,
					c = t._blockCursorElement;
				let a = !1,
					u = "";
				for (let n = 0; n < e.length; n++) {
					const f = e[n],
						d = f.type,
						h = f.target,
						g = _t$6(h, t, l);
					if (!g) continue;
					const [_, p] = g;
					if ("characterData" === d) o && gr(p) && kl(h) && gt$5(r, h, p) && ht$7(h, p, t);else if ("childList" === d) {
						a = !0;
						const e = f.addedNodes;
						for (let n = 0; n < e.length; n++) {
							const o = e[n],
								r = Ll(o),
								s = o.parentNode;
							if (!(null == s || o === c || null !== r || dt$6(o, s, t) || X$2(o) || t._slotsUsed && na(o) && o.hasAttribute("data-lexical-slot") || Na(o))) {
								if (i) {
									const t = (na(o) ? o.innerText : null) || o.nodeValue;
									t && (u += t);
								}
								s.removeChild(o);
							}
						}
						const n = f.removedNodes,
							o = n.length;
						if (o > 0) {
							let e = 0;
							for (let r = 0; r < o; r++) {
								const o = n[r];
								dt$6(o, h, t) || c === o ? (h.appendChild(o), e++) : X$2(o) && e++;
							}
							o !== e && s.set(_, p);
						}
					}
				}
				if (s.size > 0) for (const [e, n] of s) n.reconcileObservedMutation(e, t);
				const f = n.takeRecords();
				if (f.length > 0) {
					for (let e = 0; e < f.length; e++) {
						const n = f[e],
							o = n.addedNodes,
							r = n.target;
						for (let e = 0; e < o.length; e++) {
							const n = o[e],
								i = n.parentNode;
							null == i || "BR" !== n.nodeName || dt$6(n, r, t) || i.removeChild(n);
						}
					}
					n.takeRecords();
				}
				null !== r && (a && Hl(r), i && hc(t) && r.insertRawText(u));
			});
		} finally {
			at$5 = false;
		}
	}
	function yt$7(t) {
		const e = t._observer;
		if (null !== e) {
			pt$6(t, e.takeRecords(), e);
		}
	}
	function mt$7(t) {
		!function (t) {
			0 === ut$5 && Tc(t).addEventListener("textInput", ft$6, true);
		}(t), t._observer = new MutationObserver((e, n) => {
			pt$6(t, e, n);
		});
	}
	const xt$7 = "direct",
		Ct$7 = "latest";
	let St$7 = class St {
		constructor(t, e) {
			this.key = t, this.parse = e.parse.bind(e), this.unparse = (e.unparse || Dt$6).bind(e), this.isEqual = (e.isEqual || Object.is).bind(e), this.defaultValue = this.parse(void 0), this.resetOnCopyNode = e.resetOnCopyNode || false;
		}
	};
	function vt$7(t, e) {
		return new St$7(t, e);
	}
	function Tt$7(t, e, n = Ct$7) {
		const o = (n === Ct$7 ? t.getLatest() : t).__state;
		return o ? o.getValue(e) : e.defaultValue;
	}
	function kt$6(t, e, n) {
		const o = Tt$7(t, n, xt$7),
			r = Tt$7(e, n, xt$7);
		return n.isEqual(o, r) ? null : [o, r];
	}
	function bt$7(t, e, n) {
		let o;
		if (Ai(), "function" == typeof n) {
			const r = t.getLatest(),
				i = Tt$7(r, e);
			if (o = n(i), e.isEqual(i, o)) return r;
		} else o = n;
		const r = t.getWritable();
		return Mt$6(r).updateFromKnown(e, o), r;
	}
	function Nt$6(t) {
		const e = new Map(),
			n = new Set();
		for (const {
			ownNodeConfig: o
		} of Fa("function" == typeof t ? t : t.replace)) if (o && o.stateConfigs) for (const t of o.stateConfigs) {
			let o;
			"stateConfig" in t ? (o = t.stateConfig, t.flat && n.add(o.key)) : o = t, e.set(o.key, o);
		}
		return {
			flatKeys: n,
			sharedConfigMap: e
		};
	}
	const wt$6 = new Set(["__proto__", "constructor", "prototype"]);
	let Et$6 = class Et {
		constructor(t, e, n = void 0, o = new Map(), r = void 0) {
			this.node = t, this.sharedNodeState = e, this.unknownState = n, this.knownState = o;
			const {
					sharedConfigMap: i
				} = this.sharedNodeState,
				s = void 0 !== r ? r : function (t, e, n) {
					let o = n.size;
					if (e) for (const r in e) {
						const e = t.get(r);
						e && n.has(e) || o++;
					}
					return o;
				}(i, n, o);
			this.size = s;
		}
		getValue(t) {
			const e = this.knownState.get(t);
			if (void 0 !== e) return e;
			this.sharedNodeState.sharedConfigMap.set(t.key, t);
			let n = t.defaultValue;
			if (this.unknownState && t.key in this.unknownState) {
				const e = this.unknownState[t.key];
				void 0 !== e && (n = t.parse(e)), this.updateFromKnown(t, n);
			}
			return n;
		}
		getInternalState() {
			return [this.unknownState, this.knownState];
		}
		toJSON() {
			const t = {
					...this.unknownState
				},
				e = {};
			for (const [e, n] of this.knownState) e.isEqual(n, e.defaultValue) ? delete t[e.key] : t[e.key] = e.unparse(n);
			for (const n of this.sharedNodeState.flatKeys) n in t && (e[n] = t[n], delete t[n]);
			return At$6(t) && (e.$ = t), e;
		}
		getWritable(t) {
			if (this.node === t) return this;
			const {
					sharedNodeState: e,
					unknownState: n
				} = this,
				o = new Map(this.knownState);
			return new Et(t, e, function (t, e, n) {
				let o;
				if (n) for (const [r, i] of Object.entries(n)) {
					if (wt$6.has(r)) continue;
					const n = t.get(r);
					n ? e.has(n) || e.set(n, n.parse(i)) : (o = o || {}, o[r] = i);
				}
				return o;
			}(e.sharedConfigMap, o, n), o, this.size);
		}
		resetOnCopyNode() {
			for (const t of this.knownState.keys()) t.resetOnCopyNode && this.knownState.set(t, t.defaultValue);
			return this;
		}
		updateFromKnown(t, e) {
			const n = t.key;
			this.sharedNodeState.sharedConfigMap.set(n, t);
			const {
				knownState: o,
				unknownState: r
			} = this;
			o.has(t) || r && n in r || (r && (delete r[n], this.unknownState = At$6(r)), this.size++), o.set(t, e);
		}
		updateFromUnknown(t, e) {
			if (wt$6.has(t)) return;
			const n = this.sharedNodeState.sharedConfigMap.get(t);
			n ? this.updateFromKnown(n, n.parse(e)) : (this.unknownState = this.unknownState || {}, t in this.unknownState || this.size++, this.unknownState[t] = e);
		}
		updateFromJSON(t) {
			const {
				knownState: e
			} = this;
			for (const t of e.keys()) e.set(t, t.defaultValue);
			if (this.size = e.size, this.unknownState = void 0, t) for (const [e, n] of Object.entries(t)) this.updateFromUnknown(e, n);
		}
	};
	function Mt$6(t) {
		const e = t.getWritable(),
			n = e.__state ? e.__state.getWritable(e) : new Et$6(e, Ot$6(e));
		return e.__state = n, n;
	}
	function Ot$6(t) {
		return t.__state ? t.__state.sharedNodeState : dl(ua(), t.getType()).sharedNodeState;
	}
	function At$6(t) {
		if (t) for (const e in t) return t;
	}
	function Dt$6(t) {
		return t;
	}
	function Ft$6(t, e, n) {
		for (const [o, r] of e.knownState) {
			if (t.has(o.key)) continue;
			t.add(o.key);
			const e = n ? n.getValue(o) : o.defaultValue;
			if (e !== r && !o.isEqual(e, r)) return true;
		}
		return false;
	}
	function Pt$6(t, e, n) {
		const {
				unknownState: o
			} = e,
			r = n ? n.unknownState : void 0;
		if (o) for (const [e, n] of Object.entries(o)) {
			if (t.has(e)) continue;
			t.add(e);
			if (n !== (r ? r[e] : void 0)) return true;
		}
		return false;
	}
	function It$5(t, e) {
		const n = t.__state;
		return n && n.node === t ? n.getWritable(e) : n;
	}
	function Lt$6(t, e) {
		const n = t.__mode,
			o = t.__format,
			r = t.__style,
			i = e.__mode,
			s = e.__format,
			l = e.__style,
			c = t.__state,
			a = e.__state;
		return (null === n || n === i) && (null === o || o === s) && (null === r || r === l) && (null === t.__state || c === a || function (t, e) {
			if (t === e) return true;
			const n = new Set();
			return !(t && Ft$6(n, t, e) || e && Ft$6(n, e, t) || t && Pt$6(n, t, e) || e && Pt$6(n, e, t));
		}(c, a));
	}
	function zt$6(t, e) {
		const n = t.mergeWithSibling(e),
			o = Ii()._normalizedNodes;
		return o.add(t.__key), o.add(e.__key), n;
	}
	function Kt$5(t) {
		let e,
			n,
			o = t;
		if ("" !== o.__text || !o.isSimpleText() || o.isUnmergeable()) {
			for (; null !== (e = o.getPreviousSibling()) && gr(e) && e.isSimpleText() && !e.isUnmergeable();) {
				if ("" !== e.__text) {
					if (Lt$6(e, o)) {
						o = zt$6(e, o);
						break;
					}
					break;
				}
				e.remove();
			}
			for (; null !== (n = o.getNextSibling()) && gr(n) && n.isSimpleText() && !n.isUnmergeable();) {
				if ("" !== n.__text) {
					if (Lt$6(o, n)) {
						o = zt$6(o, n);
						break;
					}
					break;
				}
				n.remove();
			}
		} else o.remove();
	}
	function Bt$6(t) {
		return Rt$7(t.anchor), Rt$7(t.focus), t;
	}
	function Rt$7(t) {
		for (; "element" === t.type;) {
			const e = t.getNode(),
				n = t.offset;
			let o, r;
			if (n === e.getChildrenSize() ? (o = e.getChildAtIndex(n - 1), r = true) : (o = e.getChildAtIndex(n), r = false), gr(o)) {
				t.set(o.__key, r ? o.getTextContentSize() : 0, "text", true);
				break;
			}
			if (!es(o)) break;
			t.set(o.__key, r ? o.getChildrenSize() : 0, "element", true);
		}
	}
	const Wt$6 = Symbol.for("@lexical/CachedTextSize");
	function $t$6(e, n) {
		return ie$4.read(() => {
			let o = 0,
				r = e;
			for (let e = 0; e < n && null !== r; e++) {
				const i = re$4.get(r);
				if (void 0 === i && t(345, r), es(i)) {
					const s = se$4.get(r);
					if (void 0 !== s && es(s) && s.__parent !== i.__parent) o += i.getTextContentSize();else {
						const e = le$4.get(r),
							n = e && e.__lexicalTextContent;
						"string" != typeof n && t(346, i.getType()), o += n.length;
					}
					e < n - 1 && !i.isInline() && (o += 2);
				} else {
					const e = i[Wt$6];
					void 0 === e && t(347, i.getType(), r), o += e;
				}
				r = i.__next;
			}
			return o;
		}, {
			editor: Jt$6
		});
	}
	function Ut$6(t) {
		es(t) || void 0 === t[Wt$6] && (t[Wt$6] = gr(t) ? t.__text.length : t.getTextContentSize());
	}
	const Ht$6 = 4;
	let jt$5,
		Jt$6,
		Vt$6,
		qt$6 = "",
		Yt$6 = null,
		Gt$6 = null,
		Xt$6 = null;
	function Qt$6() {
		return {
			firstTextKey: Xt$6,
			format: Yt$6,
			style: Gt$6
		};
	}
	function Zt$4(t) {
		null !== t.firstTextKey && (Yt$6 = t.format, Gt$6 = t.style, Xt$6 = t.firstTextKey);
	}
	function te$4(e) {
		if (null !== Xt$6) return;
		const n = e.__lexicalFirstTextKey;
		if (void 0 === n && t(348), null === n) return;
		const o = se$4.get(n);
		gr(o) && (Yt$6 = o.getFormat(), Gt$6 = o.getStyle(), Xt$6 = n);
	}
	let ee$4,
		ne$4,
		oe$4,
		re$4,
		ie$4,
		se$4,
		le$4,
		ce$4,
		ae$3,
		ue$4,
		fe$4 = false,
		de$3 = false;
	function he$3(t, e) {
		const n = re$4.get(t),
			o = se$4.has(t);
		if (null !== e) {
			const n = Be$2(t);
			n.parentNode === e && e.removeChild(n);
		}
		if (!o) {
			if (Jt$6._keyToDOMMap.delete(t), es(n)) {
				const t = za(n, re$4);
				ge$3(t, 0, t.length - 1, null);
			}
			if (void 0 !== n) {
				for (const t of Te$3(n).values()) {
					const e = be$3(t);
					he$3(t, null), null !== e && e.remove();
				}
				ac(ae$3, Vt$6, ee$4, n, "destroyed");
			}
		}
	}
	function ge$3(t, e, n, o) {
		for (let r = e; r <= n; ++r) {
			const e = t[r];
			void 0 !== e && he$3(e, o);
		}
	}
	function _e$3(t, e) {
		t.setProperty("text-align", e);
	}
	const pe$3 = "40px";
	function ye$3(t, e) {
		const n = jt$5.theme.indent;
		if ("string" == typeof n) {
			const o = t.classList.contains(n);
			e > 0 && !o ? t.classList.add(n) : e < 1 && o && t.classList.remove(n);
		}
		t.style.setProperty("padding-inline-start", 0 === e ? "" : `calc(${e} * var(--lexical-indent-base-value, ${pe$3}))`), lc(t, "class"), lc(t, "style");
	}
	function me$3(t, e) {
		const n = t.style;
		0 === e ? _e$3(n, "") : 1 === e ? _e$3(n, "left") : 2 === e ? _e$3(n, "center") : 3 === e ? _e$3(n, "right") : 4 === e ? _e$3(n, "justify") : 5 === e ? _e$3(n, "start") : 6 === e && _e$3(n, "end"), lc(t, "style");
	}
	function xe$3(t, e) {
		const n = function (t) {
			const e = t.__dir;
			if (null !== e) return e;
			if (ss(t)) return null;
			const n = t.getParent();
			return null === n || wc(n) && null === n.__dir ? "auto" : null;
		}(e);
		null !== n ? t.dir = n : t.removeAttribute("dir");
	}
	function Ce$3(t) {
		const e = Wc().createElement("div");
		return e.setAttribute("data-lexical-slot", t), e.style.display = "none", e;
	}
	function Se$3(t, e, n) {
		e || "false" === t.contentEditable ? wa(n, Jt$6) : n.removeAttribute("contenteditable");
	}
	function ve$3(t, e, n) {
		const o = qt$6,
			r = Qt$6();
		qt$6 = "";
		let i = "";
		const s = rs(t);
		for (const [o, r] of n) {
			const n = Ce$3(o);
			Se$3(e, s, n), e.appendChild(n), qt$6 = "";
			const l = Qt$6();
			we$2(r, da(t, n, Jt$6)), Zt$4(l), ke$3(t, o, e, n), i += qt$6;
		}
		return Zt$4(r), qt$6 = o, i;
	}
	function Te$3(t) {
		return Ra(t) && null !== t.__slots ? t.__slots : Ba;
	}
	function ke$3(t, e, n, o) {
		const r = ue$4.$getSlotTargetElement(t, e, n, Jt$6);
		null !== r && (o.parentElement !== r && r.appendChild(o), o.style.display = "");
	}
	function be$3(t) {
		const e = le$4.get(t);
		return void 0 !== e ? e.parentElement : null;
	}
	function Ne$3(t, e, n) {
		const o = Te$3(t),
			r = Te$3(e);
		for (const [t, e] of o) if (!r.has(t)) {
			const t = be$3(e);
			he$3(e, null), null !== t && t.remove();
		}
		const i = qt$6,
			s = Qt$6();
		let l = "",
			c = null;
		const a = rs(e);
		for (const [t, i] of r) {
			const r = o.get(t);
			let s = void 0 !== r ? be$3(r) : null;
			qt$6 = "";
			const u = Qt$6();
			if (null === s) {
				s = Ce$3(t);
				let o = null;
				for (const t of n.children) if (!t.hasAttribute("data-lexical-slot")) {
					o = t;
					break;
				}
				n.insertBefore(s, o), we$2(i, da(e, s, Jt$6));
			} else r === i ? Pe$2(i, s) : (void 0 !== r && he$3(r, s), we$2(i, da(e, s, Jt$6)));
			if (Zt$4(u), Se$3(n, a, s), ke$3(e, t, n, s), l += qt$6, s.parentElement === n) {
				const t = null === c ? n.firstChild : c.nextSibling;
				t !== s && n.insertBefore(s, t), c = s;
			}
		}
		return Zt$4(s), qt$6 = i, l;
	}
	function we$2(e, n) {
		const o = se$4.get(e);
		if (void 0 === o && t(60), null !== n) {
			const t = re$4.get(e);
			if (void 0 !== t) {
				const r = le$4.get(e);
				if (void 0 !== r) {
					const i = Wa(t) ? t.__slotHost : null,
						s = Wa(o) ? o.__slotHost : null,
						l = t.__parent !== o.__parent || i !== s,
						c = null !== s && r.parentElement !== n.element;
					if (l || c) return n.insertChild(r), Pe$2(e, n.element);
				}
			}
		}
		const r = ue$4.$createDOM(o, Jt$6);
		if (function (t, e, n) {
			const o = n._keyToDOMMap;
			zl(e, n, t), o.set(t, e);
		}(e, r, Jt$6), gr(o) ? r.setAttribute("data-lexical-text", "true") : rs(o) && (r.setAttribute("data-lexical-decorator", "true"), ba(r, {
			captureSelection: true
		})), es(o)) {
			const t = o.__indent,
				e = o.__size;
			xe$3(r, o), 0 !== t && ye$3(r, t);
			const n = Te$3(o),
				i = n.size > 0 ? ve$3(o, r, n) : "";
			if (0 === e) r.__lexicalTextContent = i, r.__lexicalFirstTextKey = null, qt$6 += i, n.size > 0 && (r.__lexicalSlotTextLength = i.length);else {
				const t = qt$6,
					s = e - 1;
				if (Ee$2(za(o, se$4), o, 0, s, da(o, r, Jt$6)), "" !== i) {
					const e = r.__lexicalTextContent || "";
					r.__lexicalTextContent = i + e, qt$6 = t + i + e;
				}
				n.size > 0 && (r.__lexicalSlotTextLength = i.length);
			}
			const s = o.__format;
			0 !== s && me$3(r, s), o.isInline() || (Ae$2(null, o, r), Oe$2(o, r));
		} else {
			const t = o.getTextContent();
			if (rs(o)) {
				const t = o.decorate(Jt$6, jt$5);
				null !== t && Ie$2(e, t), r.contentEditable = "false";
				const n = Te$3(o);
				n.size > 0 && ve$3(o, r, n);
			}
			qt$6 += t;
		}
		return null !== n && n.insertChild(r), ue$4.$decorateDOM(o, null, r, Jt$6), Ut$6(o), ac(ae$3, Vt$6, ee$4, o, "created"), r;
	}
	function Ee$2(e, n, o, r, i) {
		const s = qt$6,
			l = Qt$6();
		qt$6 = "", Yt$6 = null, Gt$6 = null, Xt$6 = null;
		let c = o;
		for (; c <= r; ++c) {
			const t = Qt$6();
			we$2(e[c], i);
			const n = se$4.get(e[c]);
			null !== n && gr(n) ? null === Yt$6 && (Yt$6 = n.getFormat(), Gt$6 = n.getStyle(), Xt$6 = n.__key) : es(n) && c < r && !n.isInline() && (qt$6 += D$2), Zt$4(t);
		}
		const a = Jt$6._keyToDOMMap.get(n.__key);
		void 0 === a && t(349, n.__key), a.__lexicalTextContent = qt$6, a.__lexicalFirstTextKey = Xt$6, qt$6 = s + qt$6, Zt$4(l);
	}
	function Me$2(t, e) {
		if (!t) return false;
		const n = e.get(t);
		return rs(n) && !n.isInline();
	}
	function Oe$2(t, e) {
		const n = da(t, e, Jt$6);
		n.setDecoratorBoundaryAnchor("leading", Me$2(t.__first, se$4)), n.setDecoratorBoundaryAnchor("trailing", Me$2(t.__last, se$4));
	}
	function Ae$2(t, e, n) {
		const o = da(e, n, Jt$6),
			r = function (t, e) {
				if (t) {
					const n = t.__last;
					if (n) {
						const t = e.get(n);
						if (t) return ps(t) ? "line-break" : rs(t) && t.isInline() ? "decorator" : null;
					}
					return "empty";
				}
				return null;
			}(e, se$4);
		o.setManagedLineBreak(r);
	}
	function De$2(e, n, o) {
		var r;
		Yt$6 = null, Gt$6 = null, Xt$6 = null, function (e, n, o) {
			const r = qt$6,
				i = e.__size,
				s = n.__size;
			qt$6 = "";
			const l = o.element,
				c = Jt$6._keyToDOMMap.get(n.__key);
			void 0 === c && t(351, n.__key);
			const a = s - i;
			if (!fe$4 && Math.abs(a) <= 1 && i >= Ht$6 && e.__first === n.__first && (0 !== a || !Jt$6._cloneNotNeeded.has(e.__key))) {
				const i = c.__lexicalTextContent,
					u = ce$4.get(e.__key);
				if (!fe$4 && "string" == typeof i && void 0 !== u) {
					const s = function (t, e) {
						const n = e.size;
						if (0 === n || n >= t.__size) return null;
						let o = t.__last,
							r = null,
							i = 0;
						for (; null !== o && i < n;) {
							if (!e.has(o)) return null;
							r = o;
							const t = se$4.get(o);
							if (void 0 === t) return null;
							o = t.__prev, i++;
						}
						if (i !== n) return null;
						if (null !== o && e.has(o)) return null;
						return r;
					}(n, u);
					if (null !== s) {
						const f = u.size;
						if (0 === a) {
							const e = $t$6(s, f);
							let o = s,
								a = 0;
							for (; null !== o && a < f;) {
								const t = se$4.get(o);
								if (void 0 === t) break;
								const e = Qt$6();
								Pe$2(o, l), gr(t) && null === Yt$6 && (Yt$6 = t.getFormat(), Gt$6 = t.getStyle(), Xt$6 = t.__key), Zt$4(e), o = t.__next, a++;
							}
							let d = "";
							for (o = s, a = 0; null !== o && a < f;) {
								const e = se$4.get(o);
								if (void 0 === e) break;
								let n;
								if (es(e)) {
									const r = Jt$6._keyToDOMMap.get(o),
										i = r && r.__lexicalTextContent;
									"string" != typeof i && t(352, e.getType()), n = i;
								} else n = e.getTextContent();
								d += n, a < f - 1 && es(e) && !e.isInline() && (d += D$2), o = e.__next, a++;
							}
							const h = c.__lexicalSlotTextLength || 0,
								g = h > 0 ? i.slice(h) : i,
								_ = g.slice(0, g.length - e) + d;
							return c.__lexicalTextContent = _, qt$6 = r + _, void Fe$2(n, c, u);
						}
						if (function (e, n, o, r, i, s, l, c) {
							if (1 !== c && -1 !== c) return false;
							const a = 1 === c ? 2 : 1;
							if (l !== a) return false;
							const u = l - c;
							let f = e.__last;
							for (let t = 0; t < u - 1; t++) {
								if (null === f) return false;
								const t = re$4.get(f);
								if (void 0 === t) return false;
								f = t.__prev;
							}
							if (null === f) return false;
							const d = se$4.get(s),
								h = re$4.get(f);
							if (void 0 === d || void 0 === h) return false;
							if (d.__prev !== h.__prev) return false;
							const g = [];
							let _ = s;
							for (let t = 0; t < l; t++) {
								if (null === _) return false;
								g.push(_);
								const t = se$4.get(_);
								_ = t ? t.__next : null;
							}
							const p = [];
							_ = f;
							for (let t = 0; t < u; t++) {
								if (null === _) return false;
								p.push(_);
								const t = re$4.get(_);
								_ = t ? t.__next : null;
							}
							const y = new Set(p),
								m = new Set(g),
								x = [];
							let C = 0,
								S = 0;
							for (; C < u && S < l;) if (g[S] === p[C]) x.push({
								key: g[S],
								kind: "reconcile"
							}), C++, S++;else if (m.has(p[C])) {
								if (y.has(g[S])) return false;
								x.push({
									key: g[S],
									kind: "create",
									nextIndex: S
								}), S++;
							} else x.push({
								key: p[C],
								kind: "destroy"
							}), C++;
							for (; C < u;) x.push({
								key: p[C++],
								kind: "destroy"
							});
							for (; S < l;) x.push({
								key: g[S],
								kind: "create",
								nextIndex: S
							}), S++;
							const v = $t$6(f, u);
							for (const t of x) {
								const e = Qt$6();
								if ("reconcile" === t.kind) Pe$2(t.key, o.element);else if ("destroy" === t.kind) he$3(t.key, o.element);else {
									let e = null;
									for (let n = t.nextIndex + 1; n < l; n++) {
										const t = Jt$6._keyToDOMMap.get(g[n]);
										if (void 0 !== t) {
											e = t;
											break;
										}
									}
									we$2(t.key, o.withBefore(e ?? o.before));
								}
								if ("destroy" !== t.kind) {
									const e = se$4.get(t.key);
									e && gr(e) && null === Yt$6 && (Yt$6 = e.getFormat(), Gt$6 = e.getStyle(), Xt$6 = e.__key);
								}
								Zt$4(e);
							}
							let T = "";
							for (let e = 0; e < l; e++) {
								const n = se$4.get(g[e]);
								if (void 0 === n) return false;
								let o;
								if (es(n)) {
									const r = Jt$6._keyToDOMMap.get(g[e]),
										i = r && r.__lexicalTextContent;
									"string" != typeof i && t(350, n.getType()), o = i;
								} else o = n.getTextContent();
								T += o, e < l - 1 && es(n) && !n.isInline() && (T += D$2);
							}
							const k = r.__lexicalSlotTextLength || 0,
								b = k > 0 ? i.slice(k) : i;
							return r.__lexicalTextContent = b.slice(0, b.length - v) + T, true;
						}(e, 0, o, c, i, s, f, a)) {
							const e = c.__lexicalTextContent;
							return "string" != typeof e && t(353), qt$6 = r + e, void Fe$2(n, c, u);
						}
					}
				}
				if (0 === a) {
					let n = e.__first,
						o = 0;
					for (; null !== n;) {
						const e = se$4.get(n);
						if (void 0 === e) break;
						const r = fe$4 || oe$4.has(n) || ne$4.has(n),
							i = Qt$6();
						if (r) Pe$2(n, l);else {
							let o, r;
							if (es(e)) {
								r = le$4.get(n);
								const i = r && r.__lexicalTextContent;
								"string" != typeof i && t(354, e.getType()), o = i;
							} else o = e.getTextContent();
							qt$6 += o, void 0 !== r && te$4(r);
						}
						gr(e) ? null === Yt$6 && (Yt$6 = e.getFormat(), Gt$6 = e.getStyle(), Xt$6 = e.__key) : es(e) && o < s - 1 && !e.isInline() && (qt$6 += D$2), Zt$4(i), n = e.__next, o++;
					}
					return c.__lexicalTextContent = qt$6, c.__lexicalFirstTextKey = Xt$6, void (qt$6 = r + qt$6);
				}
			}
			if (1 === i && 1 === s) {
				const t = e.__first,
					r = n.__first;
				if (t === r) Pe$2(t, l);else {
					const e = Be$2(t),
						n = we$2(r, null);
					try {
						e.parentNode === l ? l.replaceChild(n, e) : o.insertChild(n);
					} catch (o) {
						if ("object" == typeof o && null != o) {
							const i = `${o.toString()} Parent: ${l.tagName}, new child: {tag: ${n.tagName} key: ${r}}, old child: {tag: ${e.tagName}, key: ${t}}.`;
							throw new Error(i);
						}
						throw o;
					}
					he$3(t, null);
				}
				const i = se$4.get(r);
				gr(i) && null === Yt$6 && (Yt$6 = i.getFormat(), Gt$6 = i.getStyle(), Xt$6 = i.__key);
			} else {
				const r = za(e, re$4),
					c = za(n, se$4);
				if (r.length !== i && t(227), c.length !== s && t(228), 0 === i) 0 !== s && Ee$2(c, n, 0, s - 1, o);else if (0 === s) {
					if (0 !== i) {
						const t = null == o.after && null == o.before && 0 === Te$3(n).size && null == o.element.__lexicalLineBreak;
						ge$3(r, 0, i - 1, t ? null : l), t && (l.textContent = "");
					}
				} else !function (t, e, n, o, r, i) {
					const s = o - 1,
						l = r - 1;
					let c,
						a,
						u = i.getFirstChild(),
						f = 0,
						d = 0;
					for (; f <= s && d <= l;) {
						const t = e[f],
							o = n[d],
							r = Qt$6();
						if (t === o) u = Le$3(Pe$2(o, i.element)), f++, d++;else {
							if (void 0 === a && (a = ze$2(n, d)), void 0 === c) c = ze$2(e, f);else if (!c.has(t)) {
								f++, Zt$4(r);
								continue;
							}
							if (!a.has(t)) {
								u = Le$3(Be$2(t)), he$3(t, i.element), f++, c.delete(t), Zt$4(r);
								continue;
							}
							if (c.has(o)) {
								const t = _c(Jt$6, o);
								t !== u && i.withBefore(u ?? i.before).insertChild(t), u = Le$3(Pe$2(o, i.element)), f++, d++;
							} else we$2(o, i.withBefore(u ?? i.before)), d++;
						}
						const s = se$4.get(o);
						null !== s && gr(s) ? null === Yt$6 && (Yt$6 = s.getFormat(), Gt$6 = s.getStyle(), Xt$6 = s.__key) : es(s) && d <= l && !s.isInline() && (qt$6 += D$2), Zt$4(r);
					}
					const h = f > s,
						g = d > l;
					if (h && !g) {
						const e = n[l + 1],
							o = void 0 === e ? null : Jt$6.getElementByKey(e);
						Ee$2(n, t, d, l, i.withBefore(o ?? i.before));
					} else g && !h && ge$3(e, f, s, i.element);
				}(n, r, c, i, s, o);
			}
			c.__lexicalTextContent = qt$6, c.__lexicalFirstTextKey = Xt$6, qt$6 = r + qt$6;
		}(e, n, da(n, o, Jt$6)), wc(n) || (r = n, null == Yt$6 || Yt$6 === r.__textFormat || de$3 || r.setTextFormat(Yt$6), function (t) {
			null == Gt$6 || Gt$6 === t.__textStyle || de$3 || t.setTextStyle(Gt$6);
		}(n));
	}
	function Fe$2(t, e, n) {
		const o = e.__lexicalFirstTextKey;
		if (null != o) {
			const e = t.__key;
			let r = o;
			for (; null !== r;) {
				const t = se$4.get(r);
				if (void 0 === t) {
					r = null;
					break;
				}
				if (t.__parent === e) break;
				r = t.__parent;
			}
			if (null !== r && !n.has(r)) {
				const t = se$4.get(o);
				if (gr(t)) return Yt$6 = t.getFormat(), void (Gt$6 = t.getStyle());
			}
		}
		e.__lexicalFirstTextKey = Xt$6;
	}
	function Pe$2(e, n) {
		const o = re$4.get(e);
		let r = se$4.get(e);
		void 0 !== o && void 0 !== r || t(61);
		const i = fe$4 || oe$4.has(e) || ne$4.has(e),
			s = _c(Jt$6, e);
		if (o === r && !i) {
			let e;
			if (es(o)) {
				const n = s.__lexicalTextContent;
				"string" != typeof n && t(355, o.getType()), e = n, te$4(s);
			} else e = o.getTextContent();
			return qt$6 += e, s;
		}
		if (o !== r && i && ac(ae$3, Vt$6, ee$4, r, "updated"), ue$4.$updateDOM(r, o, s, Jt$6)) {
			const o = we$2(e, null);
			return null === n && t(62), n.replaceChild(o, s), he$3(e, null), o;
		}
		if (es(o)) {
			es(r) || t(334, e);
			const n = r.__indent;
			(fe$4 || n !== o.__indent) && ye$3(s, n);
			const l = r.__format;
			(fe$4 || l !== o.__format) && me$3(s, l);
			const c = i && (Te$3(r).size > 0 || Te$3(o).size > 0) ? Ne$3(o, r, s) : "";
			if (i) {
				const t = qt$6;
				if (De$2(o, r, s), r.isInline() || (ss(r) || Ae$2(0, r, s), Oe$2(r, s)), "" !== c) {
					const e = s.__lexicalTextContent || "";
					s.__lexicalTextContent = c + e, qt$6 = t + c + e, s.__lexicalSlotTextLength = c.length;
				} else (Te$3(r).size > 0 || Te$3(o).size > 0) && (s.__lexicalSlotTextLength = 0);
			} else {
				const e = s.__lexicalTextContent;
				"string" != typeof e && t(356, o.getType()), qt$6 += e, te$4(s);
			}
			if ((fe$4 || r.__dir !== o.__dir || r.__parent !== o.__parent) && (xe$3(s, r), ss(r) && !fe$4)) for (const t of r.getChildren()) if (es(t)) {
				xe$3(_c(Jt$6, t.getKey()), t);
			}
		} else {
			const t = r.getTextContent();
			if (rs(r)) {
				const t = r.decorate(Jt$6, jt$5);
				null !== t && Ie$2(e, t), i && (Te$3(r).size > 0 || Te$3(o).size > 0) && Ne$3(o, r, s);
			}
			qt$6 += t;
		}
		if (!de$3 && ss(r)) {
			const t = r.getLatest();
			if (t.__cachedText !== qt$6) {
				const e = t.getWritable();
				e.__cachedText = qt$6, r = e;
			}
		}
		return ue$4.$decorateDOM(r, o, s, Jt$6), Ut$6(r), s;
	}
	function Ie$2(t, e) {
		let n = Jt$6._pendingDecorators;
		const o = Jt$6._decorators;
		if (null === n) {
			if (o[t] === e) return;
			n = Rl(Jt$6);
		}
		n[t] = e;
	}
	function Le$3(t) {
		let e = t.nextSibling;
		return null !== e && e === Jt$6._blockCursorElement && (e = e.nextSibling), e;
	}
	function ze$2(t, e) {
		const n = new Set();
		for (let o = e; o < t.length; o++) n.add(t[o]);
		return n;
	}
	function Ke$2(t, e, n, o, r, i) {
		qt$6 = "", Yt$6 = null, Gt$6 = null, Xt$6 = null, fe$4 = 2 === o, Jt$6 = n, jt$5 = n._config, ue$4 = n._config.dom || nl, Vt$6 = n._nodes, ee$4 = Jt$6._listeners.mutation, ne$4 = r, oe$4 = i, re$4 = t._nodeMap, ie$4 = t, se$4 = e._nodeMap, de$3 = e._readOnly, le$4 = st$5(n._keyToDOMMap), ce$4 = function () {
			const t = new Map(),
				e = e => {
					for (const n of e) {
						const e = se$4.get(n);
						if (void 0 === e) continue;
						const o = e.__parent;
						if (null === o) continue;
						let r = t.get(o);
						void 0 === r && (r = new Set(), t.set(o, r)), r.add(n);
					}
				};
			return e(ne$4.keys()), e(oe$4), t;
		}();
		const s = new Map();
		return ae$3 = s, Pe$2("root", null), Jt$6 = void 0, Vt$6 = void 0, ne$4 = void 0, oe$4 = void 0, re$4 = void 0, ie$4 = void 0, se$4 = void 0, jt$5 = void 0, le$4 = void 0, ce$4 = void 0, ae$3 = void 0, ue$4 = nl, s;
	}
	function Be$2(e) {
		const n = le$4.get(e);
		return void 0 === n && t(75, e), n;
	}
	/*@__INLINE__*/
	function Re$2(t) {
		return {
			type: t
		};
	}
	const We$2 = /* @__PURE__ */Re$2("SELECTION_CHANGE_COMMAND"),
		$e$2 = /* @__PURE__ */Re$2("SELECTION_INSERT_CLIPBOARD_NODES_COMMAND"),
		Ue$2 = /* @__PURE__ */Re$2("CLICK_COMMAND"),
		He$2 = /* @__PURE__ */Re$2("BEFORE_INPUT_COMMAND"),
		je$2 = /* @__PURE__ */Re$2("INPUT_COMMAND"),
		Je$2 = /* @__PURE__ */Re$2("COMPOSITION_START_COMMAND"),
		Ve$2 = /* @__PURE__ */Re$2("COMPOSITION_END_COMMAND"),
		qe$2 = /* @__PURE__ */Re$2("DELETE_CHARACTER_COMMAND"),
		Ye$2 = /* @__PURE__ */Re$2("INSERT_LINE_BREAK_COMMAND"),
		Ge$2 = /* @__PURE__ */Re$2("INSERT_PARAGRAPH_COMMAND"),
		Xe$2 = /* @__PURE__ */Re$2("CONTROLLED_TEXT_INSERTION_COMMAND"),
		Qe$2 = /* @__PURE__ */Re$2("PASTE_COMMAND"),
		Ze$2 = /* @__PURE__ */Re$2("REMOVE_TEXT_COMMAND"),
		tn$3 = /* @__PURE__ */Re$2("DELETE_WORD_COMMAND"),
		en$3 = /* @__PURE__ */Re$2("DELETE_LINE_COMMAND"),
		nn$3 = /* @__PURE__ */Re$2("FORMAT_TEXT_COMMAND"),
		on$3 = /* @__PURE__ */Re$2("SET_TEXT_FORMAT_COMMAND"),
		rn$3 = /* @__PURE__ */Re$2("UNDO_COMMAND"),
		sn$3 = /* @__PURE__ */Re$2("REDO_COMMAND"),
		ln$3 = /* @__PURE__ */Re$2("KEYDOWN_COMMAND"),
		cn$3 = /* @__PURE__ */Re$2("KEY_ARROW_RIGHT_COMMAND"),
		an$3 = /* @__PURE__ */Re$2("MOVE_TO_END"),
		un$3 = /* @__PURE__ */Re$2("KEY_ARROW_LEFT_COMMAND"),
		fn$3 = /* @__PURE__ */Re$2("MOVE_TO_START"),
		dn$3 = /* @__PURE__ */Re$2("KEY_ARROW_UP_COMMAND"),
		hn$3 = /* @__PURE__ */Re$2("KEY_ARROW_DOWN_COMMAND"),
		gn$3 = /* @__PURE__ */Re$2("KEY_ENTER_COMMAND"),
		_n$2 = /* @__PURE__ */Re$2("KEY_SPACE_COMMAND"),
		pn$3 = /* @__PURE__ */Re$2("KEY_BACKSPACE_COMMAND"),
		yn$3 = /* @__PURE__ */Re$2("KEY_ESCAPE_COMMAND"),
		mn$3 = /* @__PURE__ */Re$2("KEY_DELETE_COMMAND"),
		xn$3 = /* @__PURE__ */Re$2("KEY_TAB_COMMAND"),
		Cn$3 = /* @__PURE__ */Re$2("INSERT_TAB_COMMAND"),
		Sn$3 = /* @__PURE__ */Re$2("INDENT_CONTENT_COMMAND"),
		vn$3 = /* @__PURE__ */Re$2("OUTDENT_CONTENT_COMMAND"),
		Tn$2 = /* @__PURE__ */Re$2("DROP_COMMAND"),
		kn$3 = /* @__PURE__ */Re$2("FORMAT_ELEMENT_COMMAND"),
		bn$3 = /* @__PURE__ */Re$2("DRAGSTART_COMMAND"),
		Nn$2 = /* @__PURE__ */Re$2("DRAGOVER_COMMAND"),
		wn$3 = /* @__PURE__ */Re$2("DRAGEND_COMMAND"),
		En$2 = /* @__PURE__ */Re$2("COPY_COMMAND"),
		Mn$3 = /* @__PURE__ */Re$2("CUT_COMMAND"),
		On$3 = /* @__PURE__ */Re$2("SELECT_ALL_COMMAND"),
		An$3 = /* @__PURE__ */Re$2("CLEAR_EDITOR_COMMAND"),
		Dn$3 = /* @__PURE__ */Re$2("CLEAR_HISTORY_COMMAND"),
		Fn$2 = /* @__PURE__ */Re$2("CAN_REDO_COMMAND"),
		Pn$2 = /* @__PURE__ */Re$2("CAN_UNDO_COMMAND"),
		In$2 = /* @__PURE__ */Re$2("FOCUS_COMMAND"),
		Ln$2 = /* @__PURE__ */Re$2("BLUR_COMMAND"),
		zn$2 = /* @__PURE__ */Re$2("KEY_MODIFIER_COMMAND"),
		Kn$2 = {
			[j$2]: "metaKey",
			ctrlKey: !r,
			metaKey: r
		},
		Bn$2 = {
			[j$2]: "altKey",
			altKey: r,
			ctrlKey: !r
		},
		Rn$2 = [["altKey", 1], ["ctrlKey", 2], ["metaKey", 4], ["shiftKey", 8]];
	function Wn$2(t, e, n) {
		const o = t.get(e);
		o ? o.push(n) : t.set(e, [n]);
	}
	let $n$3 = class $n {
		byKey = new Map();
		byCode = new Map();
		add(e) {
			const {
				key: n,
				modifiers: o = {}
			} = e;
			n.length > 0 || t(399);
			const r = n.toLowerCase();
			for (const t of function (t) {
				let e = [0];
				for (const [n, o] of Rn$2) {
					const r = t[n] || false;
					"any" === r ? e = e.concat(e.map(t => t | o)) : r && (e = e.map(t => t | o));
				}
				return e;
			}(o)) Wn$2(this.byKey, `${t}:${r}`, e), 1 === n.length && (/[0-9]/.test(n) ? Wn$2(this.byCode, `${t}:Digit${n}`, e) : /[a-z]/.test(r) && Wn$2(this.byCode, `${t}:Key${r.toUpperCase()}`, e));
			return this;
		}
		matches(t) {
			const e = t.key;
			if (!e) return [];
			const n = function (t) {
					let e = 0;
					for (const [n, o] of Rn$2) t[n] && (e |= o);
					return e;
				}(t),
				o = this.byKey.get(`${n}:${e.toLowerCase()}`),
				r = o ? o.slice() : [];
			if (this.byCode.size > 0 && !(1 === e.length && e.charCodeAt(0) <= 127)) {
				const e = this.byCode.get(`${n}:${t.code}`);
				e && r.push(...e);
			}
			return r;
		}
		match(t) {
			return this.matches(t)[0];
		}
	};
	function Un$2(t) {
		const e = new $n$3();
		for (const n of t) e.add(n);
		return e;
	}
	function Hn$2(t) {
		const e = new Map();
		return {
			dispose() {
				for (const t of e.values()) t.dispose();
				e.clear();
			},
			register(n, o) {
				let r = e.get(n);
				void 0 === r && (r = {
					dispose: t(n, o),
					holders: new Set()
				}, e.set(n, r));
				const i = () => {
					const t = e.get(n);
					t && t.holders.delete(i) && 0 === t.holders.size && (e.delete(n), t.dispose());
				};
				return r.holders.add(i), i;
			}
		};
	}
	function jn$2(t, e, n, o) {
		return t.addEventListener(e, n, o), t.removeEventListener.bind(t, e, n, o);
	}
	const Jn$2 = Object.freeze({}),
		Vn$2 = [["keydown", function (t, e) {
			const n = e._inputState;
			n.lastKeyDownTimeStamp = t.timeStamp, n.lastKeyCode = t.key, "Backspace" !== t.key && ro$2(n);
			if (e.isComposing()) return;
			gc(e, ln$3, t);
		}], ["pointerdown", function (t, e) {
			const n = Xc(t),
				o = t.pointerType;
			oa(n) && "touch" !== o && "pen" !== o && 0 === t.button && Qi(e, () => {
				Ea(n, e) || (e._inputState.isSelectionChangeFromMouseDown = true);
			});
		}], ["compositionstart", function (t, e) {
			gc(e, Je$2, t);
		}], ["compositionend", function (t, e) {
			const n = e._inputState;
			i ? n.compositionPhase = "ending-firefox" : l || !a$1 && !d$2 ? gc(e, Ve$2, t) : (n.compositionPhase = "ending-safari", n.compositionEndData = t.data);
		}], ["input", function (t, e) {
			t.stopPropagation();
			const n = e._inputState;
			ro$2(n), Qi(e, () => {
				so$1(t, e) || e.dispatchCommand(je$2, t);
			}, {
				event: t
			}), n.unprocessedBeforeInputData = null;
		}], ["click", function (t, e) {
			Qi(e, () => {
				const n = ni(),
					o = Pc(Tc(e)),
					r = oi();
				if (o) if (Er(n)) {
					const t = n.anchor,
						e = t.getNode();
					"element" === t.type && 0 === t.offset && n.isCollapsed() && !ss(e) && 1 === $l().getChildrenSize() && e.getTopLevelElementOrThrow().isEmpty() && null !== r && n.is(r) && (o.removeAllRanges(), n.dirty = true);
				} else if ("touch" === t.pointerType || "pen" === t.pointerType) {
					const n = Hc(o, e._rootElement).anchorNode;
					if (na(n) || kl(n)) {
						Hl(ei(r, o, e, t));
					}
				}
				if (i && null !== o && 0 === o.rangeCount) {
					const n = e._rootElement;
					if (null !== n && t.target === n) {
						const i = t.clientY;
						let s = n.childNodes.length;
						for (let t = 0; t < n.childNodes.length; t++) {
							const e = n.childNodes[t];
							if (na(e)) {
								const n = e.getBoundingClientRect();
								if (i <= (n.top + n.bottom) / 2) {
									s = t;
									break;
								}
							}
						}
						o.setBaseAndExtent(n, s, n, s);
						const l = ei(r, o, e, t);
						null !== l ? Hl(l) : o.removeAllRanges();
					}
				}
				gc(e, Ue$2, t);
			});
		}], ["cut", Jn$2], ["copy", Jn$2], ["dragstart", Jn$2], ["dragover", Jn$2], ["dragend", Jn$2], ["paste", Jn$2], ["focus", Jn$2], ["blur", Jn$2], ["drop", Jn$2]];
	s$1 && Vn$2.push(["beforeinput", (t, e) => function (t, e) {
		const n = t.inputType;
		if ("deleteCompositionText" === n || i && hc(e)) return;
		if ("insertCompositionText" === n) return;
		Qi(e, () => {
			so$1(t, e) || gc(e, He$2, t);
		}, {
			event: t
		});
	}(t, e)]);
	const qn$2 = new WeakMap(),
		Yn$2 = new WeakMap(),
		Gn$2 = Hn$2(t => (t.addEventListener("selectionchange", vo$1), () => t.removeEventListener("selectionchange", vo$1)));
	function Xn$2(t, e, n, o, r, i) {
		const l = t.anchor,
			c = t.focus,
			a = l.getNode(),
			u = Ii();
		let f;
		if (void 0 !== i) f = i;else {
			const t = Pc(Tc(u));
			f = null !== t ? Hc(t, u._rootElement) : null;
		}
		const d = null !== f ? f.anchorNode : null,
			h = l.key,
			g = u.getElementByKey(h),
			_ = n.length;
		return h !== c.key || !gr(a) || (!r && (!s$1 || u._inputState.lastBeforeInputInsertTextTimeStamp < o + 50) || a.isDirty() && _ < 2 || Vl(n)) && l.offset !== c.offset && !a.isComposing() || Tl(a) || a.isDirty() && _ > 1 || (r || !s$1) && null !== g && !a.isComposing() && d !== pa(a, g, u) || null !== f && null !== e && (!e.collapsed || e.startContainer !== f.anchorNode || e.startOffset !== f.anchorOffset) || !a.isComposing() && (a.getFormat() !== t.format || a.getStyle() !== t.style) || function (t, e) {
			if (e.isSegmented()) return true;
			if (!t.isCollapsed()) return false;
			const n = t.anchor.offset,
				o = e.getParentOrThrow(),
				r = vl(e);
			return 0 === n ? !e.canInsertTextBefore() || !o.canInsertTextBefore() && !e.isComposing() || r || function (t) {
				const e = t.getPreviousSibling();
				return (gr(e) || es(e) && e.isInline()) && !e.canInsertTextAfter();
			}(e) : n === e.getTextContentSize() && (!e.canInsertTextAfter() || !o.canInsertTextAfter() && !e.isComposing() || r);
		}(t, a);
	}
	function Qn$2(t, e) {
		return kl(t) && null !== t.nodeValue && 0 !== e && e !== t.nodeValue.length;
	}
	function Zn$2(e, n, o) {
		const {
				anchorNode: r,
				anchorOffset: i,
				focusNode: s,
				focusOffset: l
			} = Hc(e, n._rootElement),
			c = n._inputState;
		if (c.isSelectionChangeFromDOMUpdate) {
			c.isSelectionChangeFromDOMUpdate = false;
			const t = c.selectionChangeFromDOMUpdatePoints;
			if (c.selectionChangeFromDOMUpdatePoints = null, Qn$2(r, i) && Qn$2(s, l) && !c.postDeleteSelectionToRestore && (null === t || t.anchorNode === r && t.anchorOffset === i && t.focusNode === s && t.focusOffset === l)) return;
		}
		Qi(n, () => {
			if (!o) return void Hl(null);
			if (!yl(n, r, s)) return;
			let a = ni();
			if (c.postDeleteSelectionToRestore && Er(a) && a.isCollapsed()) {
				const t = a.anchor,
					e = c.postDeleteSelectionToRestore.anchor;
				(t.key === e.key && t.offset === e.offset + 1 || 1 === t.offset && e.getNode().is(t.getNode().getPreviousSibling())) && (a = c.postDeleteSelectionToRestore.clone(), Hl(a));
			}
			if (c.postDeleteSelectionToRestore = null, Er(a)) {
				const o = a.anchor,
					u = o.getNode();
				if (a.isCollapsed()) {
					"Range" === e.type && r === s && (a.dirty = true);
					const i = Tc(n).event,
						l = i ? i.timeStamp : performance.now(),
						{
							format: f,
							style: d,
							offset: h,
							key: g,
							timeStamp: _
						} = c.collapsedSelectionFormat,
						p = $l(),
						y = false === n.isComposing() && "" === p.getTextContent();
					if (l < _ + 200 && o.offset === h && o.key === g) to$2(a, f, d);else if ("text" === o.type) gr(u) || t(141), eo$2(a, u);else if ("element" === o.type && !y) {
						es(u) || t(259);
						const e = o.getNode();
						e.isEmpty() ? function (t, e) {
							const n = e.getTextFormat(),
								o = e.getTextStyle();
							to$2(t, n, o);
						}(a, e) : to$2(a, a.format, "");
					}
				} else {
					const t = o.key,
						e = a.focus.key,
						n = a.getNodes(),
						r = n.length,
						s = a.isBackward(),
						c = s ? l : i,
						u = s ? i : l,
						f = s ? e : t,
						d = s ? t : e;
					let h = 2047,
						g = false;
					for (let t = 0; t < r; t++) {
						const e = n[t],
							o = e.getTextContentSize();
						if (gr(e) && 0 !== o && !(0 === t && e.__key === f && c === o || t === r - 1 && e.__key === d && 0 === u) && (g = true, h &= e.getFormat(), 0 === h)) break;
					}
					a.format = g ? h : 0;
				}
			}
			gc(n, We$2);
		});
	}
	function to$2(t, e, n) {
		t.format === e && t.style === n || (t.format = e, t.style = n, t.dirty = true);
	}
	function eo$2(t, e) {
		to$2(t, e.getFormat(), e.getStyle());
	}
	function no$2(t) {
		if (!t.getTargetRanges) return null;
		const e = t.getTargetRanges();
		return 0 === e.length ? null : e[0];
	}
	function oo$2(t) {
		const {
			lastKeyCode: e
		} = Ii()._inputState;
		if (null == t || t.length <= 1 || null == e) return;
		const n = 1 === e.length ? e : "Enter" === e ? "\n" : "Tab" === e ? "\t" : null;
		if (!n) return;
		const o = ni();
		if (!Er(o) || !o.isCollapsed()) return;
		const r = o.anchor.getNode();
		if (!gr(r)) return;
		const {
			offset: i
		} = o.anchor;
		if (r.getTextContentSize() === i) {
			const t = r.getNextSibling();
			if ("\n" === n) {
				if (l) return;
				if (ps(t)) t.selectEnd();else if (!t) {
					const t = La(r, Gr),
						e = t && t.getNextSibling();
					es(e) && e.selectStart();
				}
			} else "\t" === n ? mr(t) && t.selectEnd() : gr(t) && t.getTextContent()[0] === n && t.select(1, 1);
		} else r.getTextContent()[i] === n && r.select(i + 1, i + 1);
	}
	function ro$2(t) {
		t.isInsertTextAfterHandledSelectionCommand = false, null !== t.handledSelectionCommandTimeoutId && (clearTimeout(t.handledSelectionCommandTimeoutId), t.handledSelectionCommandTimeoutId = null);
	}
	function io$2(t) {
		ro$2(t), t.isInsertTextAfterHandledSelectionCommand = true, t.handledSelectionCommandTimeoutId = setTimeout(() => ro$2(t), 0);
	}
	function so$1(t, e) {
		const n = Xc(t);
		if (na(n) && Ea(n, e)) return true;
		const o = e.getRootElement();
		if (null === o) return false;
		const r = Gc(o.ownerDocument);
		return null !== r && o.contains(r) && Ea(r, e);
	}
	function lo$1(e) {
		const n = e.inputType,
			o = no$2(e),
			r = Ii(),
			i = r._inputState,
			s = ni();
		if ("insertText" === n && e.data && i.isInsertTextAfterHandledSelectionCommand) {
			if (ro$2(i), e.preventDefault(), Er(s) && !s.isCollapsed()) {
				const t = s.isBackward() ? s.anchor : s.focus;
				s.anchor.set(t.key, t.offset, t.type), s.focus.set(t.key, t.offset, t.type);
			}
			return true;
		}
		if ("deleteContentBackward" === n) {
			if (null === s) {
				const t = oi();
				if (!Er(t)) return true;
				Hl(t.clone());
			}
			if (Er(s)) {
				const n = s.anchor.key === s.focus.key;
				if (function (t, e) {
					return "MediaLast" === t.lastKeyCode && e < t.lastKeyDownTimeStamp + 30;
				}(i, e.timeStamp) && r.isComposing() && n) {
					if (Fl(null), i.lastKeyDownTimeStamp = 0, setTimeout(() => {
						Qi(r, () => {
							Fl(null);
						});
					}, 30), Er(s)) {
						const e = s.anchor.getNode();
						e.markDirty(), gr(e) || t(142), eo$2(s, e);
					}
				} else {
					if (Fl(null), l && null !== o && !o.collapsed && (s.applyDOMRange(o), !s.isCollapsed())) return e.preventDefault(), s.removeText(), true;
					e.preventDefault();
					const t = s.anchor.getNode(),
						c = t.getTextContent(),
						a = t.canInsertTextAfter(),
						u = 0 === s.anchor.offset && s.focus.offset === c.length;
					let d = f$2 && n && !u && a;
					if (d && s.isCollapsed() && (d = !rs(dc(s.anchor, true))), !d) {
						gc(r, qe$2, true);
						const t = ni();
						f$2 && Er(t) && t.isCollapsed() && (i.postDeleteSelectionToRestore = t, setTimeout(() => i.postDeleteSelectionToRestore = null));
					}
				}
				return true;
			}
		}
		if (!Er(s)) return "historyUndo" !== n && "historyRedo" !== n || (e.preventDefault(), gc(r, "historyUndo" === n ? rn$3 : sn$3)), true;
		const c = e.data;
		null !== i.unprocessedBeforeInputData && Xl(false, r, i.unprocessedBeforeInputData), s.dirty && null === i.unprocessedBeforeInputData || !s.isCollapsed() || ss(s.anchor.getNode()) || null === o || s.applyDOMRange(o), i.unprocessedBeforeInputData = null;
		const a = s.anchor,
			u = s.focus,
			d = a.getNode(),
			h = u.getNode();
		if ("insertText" === n || "insertTranspose" === n) {
			if ("\n" === c) e.preventDefault(), gc(r, Ye$2, false);else if (c === D$2) e.preventDefault(), gc(r, Ge$2);else if (null == c && e.dataTransfer) {
				const t = e.dataTransfer.getData("text/plain");
				e.preventDefault(), s.insertRawText(t);
			} else null != c && Xn$2(s, o, c, e.timeStamp, true) ? (e.preventDefault(), gc(r, Xe$2, c), oo$2(c)) : i.unprocessedBeforeInputData = c;
			return i.lastBeforeInputInsertTextTimeStamp = e.timeStamp, true;
		}
		switch (e.preventDefault(), n) {
			case "insertFromYank":
			case "insertFromDrop":
			case "insertReplacementText":
				gc(r, Xe$2, e);
				oo$2((e.dataTransfer ? e.dataTransfer.getData("text/plain") : null) ?? e.data);
				break;
			case "insertFromComposition":
				{
					const t = i.hadOrphanedCompositionEvents;
					i.hadOrphanedCompositionEvents = false;
					const n = r._compositionKey;
					Fl(null), t || gc(r, Xe$2, e), fo$1(n);
					break;
				}
			case "insertLineBreak":
				Fl(null), gc(r, Ye$2, false);
				break;
			case "insertParagraph":
				Fl(null), i.isInsertLineBreak && !l ? (i.isInsertLineBreak = false, gc(r, Ye$2, false)) : gc(r, Ge$2);
				break;
			case "insertFromPaste":
			case "insertFromPasteAsQuotation":
				gc(r, Qe$2, e);
				break;
			case "deleteByComposition":
				(function (t, e) {
					return t !== e || es(t) || es(e) || !vl(t) || !vl(e);
				})(d, h) && gc(r, Ze$2, e);
				break;
			case "deleteByDrag":
				xc(Uo), gc(r, Ze$2, e);
				break;
			case "deleteByCut":
				gc(r, Ze$2, e);
				break;
			case "deleteContent":
				gc(r, qe$2, false);
				break;
			case "deleteWordBackward":
				gc(r, tn$3, true);
				break;
			case "deleteWordForward":
				gc(r, tn$3, false);
				break;
			case "deleteHardLineBackward":
			case "deleteSoftLineBackward":
				gc(r, en$3, true);
				break;
			case "deleteContentForward":
			case "deleteHardLineForward":
			case "deleteSoftLineForward":
				gc(r, en$3, false);
				break;
			case "formatStrikeThrough":
				gc(r, nn$3, "strikethrough");
				break;
			case "formatBold":
				gc(r, nn$3, "bold");
				break;
			case "formatItalic":
				gc(r, nn$3, "italic");
				break;
			case "formatUnderline":
				gc(r, nn$3, "underline");
				break;
			case "historyUndo":
				gc(r, rn$3);
				break;
			case "historyRedo":
				gc(r, sn$3);
		}
		return true;
	}
	function co$1(t) {
		const e = Ii(),
			n = e._inputState,
			o = ni(),
			r = t.data,
			l = no$2(t);
		let c = false;
		if (null != r && Er(o)) {
			const a = Pc(Tc(e)),
				u = null !== a ? Hc(a, e._rootElement) : null,
				d = "insertCompositionText" === t.inputType && "ending-firefox" !== n.compositionPhase && !e.isComposing();
			d && (n.hadOrphanedCompositionEvents = true);
			const h = o.anchor.getNode(),
				g = "insertCompositionText" === t.inputType && "ending-firefox" !== n.compositionPhase && e.isComposing() && gr(h) && Tl(h);
			if (!d && !g && Xn$2(o, l, r, t.timeStamp, false, u)) {
				if (c = true, "ending-firefox" === n.compositionPhase) {
					const t = ho$1(e, r);
					if (n.compositionPhase = "idle", t) return xc(jo), jl(), true;
				}
				const l = o.anchor.getNode();
				if (null === a || null === u) return true;
				const d = o.isBackward(),
					h = d ? o.anchor.offset : o.focus.offset,
					g = d ? o.focus.offset : o.anchor.offset;
				s$1 && !o.isCollapsed() && gr(l) && null !== u.anchorNode && l.getTextContent().slice(0, h) + r + l.getTextContent().slice(h + g) === Gl(u.anchorNode) || gc(e, Xe$2, r);
				const _ = r.length;
				i && _ > 1 && "insertCompositionText" === t.inputType && !e.isComposing() && (o.anchor.offset -= _, o._cachedNodes = null, o._cachedIsBackward = null), f$2 && e.isComposing() && (n.lastKeyDownTimeStamp = 0, Fl(null));
			}
		}
		if (!c) {
			Xl(false, e, null !== r ? r : void 0), "ending-firefox" === n.compositionPhase && (ho$1(e, r || void 0), xc(jo), n.compositionPhase = "idle");
		}
		return jl(), true;
	}
	function ao$1(t) {
		const e = Ii(),
			n = e._inputState,
			o = ni();
		if (Er(o) && !e.isComposing()) {
			n.compositionPhase = "composing", n.hadOrphanedCompositionEvents = false;
			const r = o.anchor,
				i = o.anchor.getNode();
			if (Fl(r.key), xc(Ho), t.timeStamp < n.lastKeyDownTimeStamp + 30 || "element" === r.type || !o.isCollapsed() || !f$2 && (i.getFormat() !== o.format || gr(i) && i.getStyle() !== o.style) || gr(i) && (Tl(i) || 0 === r.offset && !i.canInsertTextBefore() || r.offset === i.getTextContentSize() && !i.canInsertTextAfter())) {
				gc(e, Xe$2, F$1);
				const t = ni();
				Er(t) && Fl(t.anchor.key);
			}
		}
		return true;
	}
	function uo$1(t) {
		const e = Ii();
		return e._inputState.compositionPhase = "idle", ho$1(e, t.data), xc(jo), true;
	}
	function fo$1(t) {
		if (null === t) return;
		const e = Il(t);
		if (!gr(e) || "text" === e.getType() || Tl(e) || !e.isAttached()) return;
		const n = ni(),
			o = Er(n) && n.anchor.key === t ? n.anchor.offset : null,
			r = hr(e.getTextContent());
		if (r.setFormat(e.getFormat()), r.setStyle(e.getStyle()), e.replace(r), null !== o) {
			const t = Math.min(o, r.getTextContentSize());
			r.select(t, t);
		}
	}
	function ho$1(t, e) {
		const n = t._compositionKey;
		if (Fl(null), null !== n && null != e) {
			if ("" === e) {
				const e = Il(n),
					o = t.getElementByKey(n),
					r = null !== o && gr(e) ? pa(e, o, t) : null;
				if (null !== r && null !== r.nodeValue && gr(e)) {
					const n = Pc(Tc(t)),
						o = n && Hc(n, t._rootElement);
					let i = null,
						s = null;
					null !== o && o.anchorNode === r && (i = o.anchorOffset, s = o.focusOffset), Ql(e, r.nodeValue, i, s, true);
				}
				return fo$1(n), false;
			}
			if ("\n" === e[e.length - 1]) {
				const e = ni();
				if (Er(e) || Or(e)) {
					if (Er(e)) {
						const t = e.focus;
						e.anchor.set(t.key, t.offset, t.type);
					}
					return gc(t, gn$3, null), fo$1(n), false;
				}
			}
			const o = Il(n);
			if (null !== o && gr(o) && Tl(o)) {
				o.markDirty();
				const t = ni(),
					r = o.getTextContentSize(),
					i = Er(t) && t.anchor.key === n ? t.anchor.offset : r;
				return o.select(i, i).insertText(e), true;
			}
		}
		return Xl(true, t, e), fo$1(n), false;
	}
	const go$1 = {
			altKey: "any",
			ctrlKey: "any",
			metaKey: "any",
			shiftKey: "any"
		},
		_o$1 = {
			ctrlKey: true
		},
		po$1 = {
			metaKey: true
		},
		yo$1 = {
			shiftKey: "any"
		},
		mo$1 = {
			...yo$1,
			altKey: "any"
		};
	function xo$1(t) {
		const e = Ii(),
			n = e._inputState;
		if (null == t.key) return true;
		if ("ending-safari" === n.compositionPhase) {
			const o = function (t) {
				return "Backspace" === t.key;
			}(t);
			if (o && Qi(e, () => {
				ho$1(e, n.compositionEndData);
			}), n.compositionPhase = "idle", n.compositionEndData = "", o) return true;
		}
		let o = e._keyDownShortcuts;
		null === o && (o = Un$2(function () {
			const t = (t, e, n) => ({
					key: t,
					modifiers: e,
					onMatch: (t, e) => {
						gc(e, n, t);
					}
				}),
				e = (t, e, n, o) => ({
					key: t,
					modifiers: e,
					onMatch: (t, e) => {
						t.preventDefault(), gc(e, n, o);
					}
				}),
				n = (t, e) => ({
					key: "Enter",
					modifiers: t,
					onMatch: (t, n) => {
						n._inputState.isInsertLineBreak = e, gc(n, gn$3, t);
					}
				}),
				o = (t, e) => ({
					key: t,
					modifiers: Kn$2,
					onMatch: (t, n) => {
						const o = n._editorState._selection;
						null === o || Er(o) || (t.preventDefault(), gc(n, e, t));
					}
				});
			return [t("ArrowRight", yo$1, cn$3), t("ArrowLeft", yo$1, un$3), t("ArrowUp", mo$1, dn$3), t("ArrowDown", mo$1, hn$3), n({
				...go$1,
				shiftKey: true
			}, true), n({
				...go$1,
				shiftKey: false
			}, false), t(" ", go$1, _n$2), {
				key: "Backspace",
				modifiers: yo$1,
				onMatch: (t, e) => {
					gc(e, pn$3, t) && io$2(e._inputState);
				}
			}, t("Escape", go$1, yn$3), t("Delete", {}, mn$3), e("Backspace", Bn$2, tn$3, true), e("Delete", Bn$2, tn$3, false), e("b", Kn$2, nn$3, "bold"), e("u", Kn$2, nn$3, "underline"), e("i", Kn$2, nn$3, "italic"), t("Tab", yo$1, xn$3), e("z", Kn$2, rn$3, void 0), e("z", {
				...Kn$2,
				shiftKey: true
			}, sn$3, void 0), ...(r ? [{
				key: "o",
				modifiers: _o$1,
				onMatch: (t, e) => {
					t.preventDefault(), e._inputState.isInsertLineBreak = true, gc(e, Ye$2, true);
				}
			}, t("ArrowLeft", {
				metaKey: true,
				...yo$1
			}, fn$3), t("ArrowRight", {
				metaKey: true,
				...yo$1
			}, an$3), e("h", _o$1, qe$2, true), e("d", _o$1, qe$2, false), e("Backspace", po$1, en$3, true), e("Delete", po$1, en$3, false), e("k", _o$1, en$3, false)] : [t("Home", yo$1, fn$3), t("End", yo$1, an$3), e("y", _o$1, sn$3, void 0)]), {
				key: "a",
				modifiers: Kn$2,
				onMatch: (t, e) => {
					t.preventDefault(), gc(e, On$3, t) && io$2(e._inputState);
				}
			}, o("c", En$2), o("x", Mn$3)];
		}()), e._keyDownShortcuts = o);
		const i = o.match(t);
		return i && i.onMatch(t, e), function (t) {
			return t.ctrlKey || t.shiftKey || t.altKey || t.metaKey;
		}(t) && e.dispatchCommand(zn$2, t), true;
	}
	function Co$1(t) {
		let e = t.__lexicalEventHandles;
		return void 0 === e && (e = [], t.__lexicalEventHandles = e), e;
	}
	const So$1 = new Map();
	function vo$1(t) {
		const e = Ic(t.target);
		if (null === e) return;
		const n = yc(t.target);
		let o = null,
			r = null;
		const i = null !== n ? Yn$2.get(n) : void 0;
		if (null !== n) {
			if (void 0 !== i) {
				const t = i.editors;
				let n = i.hasShadowEditor;
				if (void 0 === n) {
					n = false;
					for (const e of t) if (null !== e._rootElement && Lc(e._rootElement.getRootNode())) {
						n = true;
						break;
					}
					i.hasShadowEditor = n;
				}
				if (n) {
					let n = null,
						i = null;
					for (const s of t) {
						const t = s._rootElement;
						if (null === t) continue;
						const l = Hc(e, t).anchorNode;
						if (null !== l && xl(l) === s) {
							if (Lc(t.getRootNode())) {
								o = s, r = l;
								break;
							}
							null === n && (n = s, i = l);
						}
					}
					null === o && null !== n && (o = n, r = i);
				} else {
					const t = e.anchorNode;
					null === t || na(t) && null !== t.shadowRoot || (o = xl(t), null !== o && (r = t));
				}
			}
			if (null === o) {
				const t = Gc(n);
				o = null !== t ? xl(t) : null;
			}
		}
		if (null === o) return;
		if (o._inputState.isSelectionChangeFromMouseDown) {
			if (void 0 !== i) for (const t of i.editors) t._inputState.isSelectionChangeFromMouseDown = false;
			Qi(o, () => {
				const n = oi(),
					i = r ?? Hc(e, o._rootElement).anchorNode;
				if (na(i) || kl(i)) {
					Hl(ei(n, e, o, t));
				}
			});
		}
		const s = ql(o),
			l = s[s.length - 1],
			c = l._key,
			a = So$1.get(c),
			u = a || l;
		u !== o && Zn$2(e, u, false), Zn$2(e, o, true), o !== l ? So$1.set(c, o) : a && So$1.delete(c);
	}
	function To$1(t) {
		t._lexicalHandled = true;
	}
	function ko(t) {
		return true === t._lexicalHandled;
	}
	function No$1(e) {
		const n = qn$2.get(e);
		if (void 0 === n) return void 0;
		const o = Yn$2.get(n);
		if (void 0 === o) return void 0;
		qn$2.delete(e);
		const r = Cl(e);
		ml(r) ? (!function (t) {
			if (null !== t._parentEditor) {
				const e = ql(t),
					n = e[e.length - 1]._key;
				So$1.get(n) === t && So$1.delete(n);
			} else So$1.delete(t._key);
		}(r), o.editors.delete(r), o.hasShadowEditor = void 0, e.__lexicalEditor = null) : r && t(198);
		const i = Co$1(e);
		for (let t = 0; t < i.length; t++) i[t]();
		e.__lexicalEventHandles = [];
	}
	function wo$1(e, n, o) {
		Ai();
		const r = e.__key,
			i = e.getParent();
		if (null === i) return void (null !== $a(e) && t(367, r, String($a(e))));
		const s = function (t) {
			const e = ni();
			if (!Er(e) || !es(t)) return e;
			const {
					anchor: n,
					focus: o
				} = e,
				r = n.getNode(),
				i = o.getNode();
			Sc(r, t) && n.set(t.__key, 0, "element");
			Sc(i, t) && o.set(t.__key, 0, "element");
			return e;
		}(e);
		let l = false;
		if (Er(s) && n) {
			const t = s.anchor,
				n = s.focus;
			t.key === r && (li(t, e, i, e.getPreviousSibling(), e.getNextSibling()), l = true), n.key === r && (li(n, e, i, e.getPreviousSibling(), e.getNextSibling()), l = true);
		} else Or(s) && n && e.isSelected() && e.selectPrevious();
		if (Er(s) && n && !l && ri(s, i)) {
			const t = e.getIndexWithinParent();
			Ol(e), ii(s, i, t, -1);
		} else Ol(e);
		o || wc(i) || i.canBeEmpty() || !i.isEmpty() || wo$1(i, n), n && s && ss(i) && i.isEmpty() && i.selectEnd();
	}
	function Eo(t) {
		return t;
	}
	const Mo = Symbol.for("ephemeral");
	function Oo(t) {
		return t[Mo] || false;
	}
	const Ao = {
		configurable: true,
		enumerable: false,
		value: void 0,
		writable: true
	};
	class Do {
		static getType() {
			const {
				ownNodeType: e
			} = Da(this);
			return void 0 === e && t(64, this.name), e;
		}
		static clone(e) {
			t(65, this.name);
		}
		$config() {
			return {};
		}
		config(t, e) {
			const n = e.extends || Ka(this.constructor);
			return Object.assign(e, {
				extends: n
			}), "string" == typeof t && Object.assign(e, {
				type: t
			}), {
				[t]: e
			};
		}
		afterCloneFrom(t) {
			this.__key === t.__key ? (this.__parent = t.__parent, this.__next = t.__next, this.__prev = t.__prev, this.__state = t.__state) : t.__state && (this.__state = t.__state.getWritable(this));
		}
		resetOnCopyNodeFrom(t) {
			this.__state && (this.__state = this.__state.getWritable(this).resetOnCopyNode());
		}
		constructor(t) {
			this.__type = this.constructor.getType(), this.__parent = null, this.__prev = null, this.__next = null, Object.defineProperty(this, "__state", Ao), Object.defineProperty(this, Wt$6, Ao), Ml(this, t);
		}
		getType() {
			return this.__type;
		}
		isInline() {
			t(137, this.constructor.name);
		}
		isAttached() {
			let t = this.__key;
			for (; null !== t;) {
				if ("root" === t) return true;
				const e = Il(t);
				if (null === e) break;
				t = null !== e.__parent ? e.__parent : $a(e);
			}
			return false;
		}
		isSelected(t) {
			const e = t || ni();
			if (null == e) return false;
			const n = e.getNodes().some(t => t.__key === this.__key);
			if (gr(this)) return n;
			if (Er(e) && "element" === e.anchor.type && "element" === e.focus.type) {
				if (e.isCollapsed()) return false;
				const t = this.getParent();
				if (rs(this) && this.isInline() && t) {
					const n = e.isBackward() ? e.focus : e.anchor;
					if (t.is(n.getNode()) && n.offset === t.getChildrenSize() && this.is(t.getLastChild())) return false;
				}
			}
			return n;
		}
		getKey() {
			return this.__key;
		}
		getIndexWithinParent() {
			const t = this.getParent();
			if (null === t) return -1;
			let e = t.getFirstChild(),
				n = 0;
			for (; null !== e;) {
				if (this.is(e)) return n;
				n++, e = e.getNextSibling();
			}
			return -1;
		}
		getParent() {
			const t = this.getLatest().__parent;
			return null === t ? null : Il(t);
		}
		getParentOrThrow() {
			const e = this.getParent();
			return null === e && t(66, this.__key), e;
		}
		getTopLevelElement() {
			let e = this;
			for (; null !== e;) {
				const n = e.getParent();
				if (wc(n) || null !== $a(e)) return es(e) || e === this && rs(e) || t(194), e;
				e = n;
			}
			return null;
		}
		getTopLevelElementOrThrow() {
			const e = this.getTopLevelElement();
			return null === e && t(67, this.__key), e;
		}
		getParents() {
			const t = [];
			let e = this.getParent();
			for (; null !== e;) t.push(e), e = e.getParent();
			return t;
		}
		getParentKeys() {
			const t = [];
			let e = this.getParent();
			for (; null !== e;) t.push(e.__key), e = e.getParent();
			return t;
		}
		getPreviousSibling() {
			const t = this.getLatest().__prev;
			return null === t ? null : Il(t);
		}
		getPreviousSiblings() {
			const t = [],
				e = this.getParent();
			if (null === e) return t;
			let n = e.getFirstChild();
			for (; null !== n && !n.is(this);) t.push(n), n = n.getNextSibling();
			return t;
		}
		getNextSibling() {
			const t = this.getLatest().__next;
			return null === t ? null : Il(t);
		}
		getNextSiblings() {
			const t = [];
			let e = this.getNextSibling();
			for (; null !== e;) t.push(e), e = e.getNextSibling();
			return t;
		}
		getCommonAncestor(t) {
			const e = es(this) ? this : this.getParent(),
				n = es(t) ? t : t.getParent(),
				o = e && n ? Uu(e, n) : null;
			return o ? o.commonAncestor : null;
		}
		is(t) {
			return null != t && this.__key === t.__key;
		}
		isBefore(e) {
			const n = Uu(this, e);
			return null !== n && ("descendant" === n.type || ("branch" === n.type ? -1 === Ru(n) : ("same" !== n.type && "ancestor" !== n.type && t(279), false)));
		}
		isParentOf(t) {
			return Sc(t, this);
		}
		getNodesBetween(e) {
			const n = this.isBefore(e),
				o = [],
				r = new Set();
			let i = this;
			for (; null !== i;) {
				const s = i.__key;
				if (r.has(s) || (r.add(s), o.push(i)), i === e) break;
				const l = es(i) ? n ? i.getFirstChild() : i.getLastChild() : null;
				if (null !== l) {
					i = l;
					continue;
				}
				const c = n ? i.getNextSibling() : i.getPreviousSibling();
				if (null !== c) {
					i = c;
					continue;
				}
				const a = i.getParentOrThrow();
				if (r.has(a.__key) || o.push(a), a === e) break;
				let u = null,
					f = a;
				do {
					if (null === f && t(68), u = n ? f.getNextSibling() : f.getPreviousSibling(), f = f.getParent(), null === f) break;
					null !== u || r.has(f.__key) || o.push(f);
				} while (null === u);
				i = u;
			}
			return n || o.reverse(), o;
		}
		isDirty() {
			const t = Ii()._dirtyLeaves;
			return null !== t && t.has(this.__key);
		}
		getLatest() {
			if (Oo(this)) return this;
			const e = Il(this.__key);
			return null === e && t(113), e;
		}
		getWritable() {
			if (Oo(this)) return this;
			Ai();
			const t = Fi(),
				e = Ii(),
				n = t._nodeMap,
				o = this.__key,
				r = this.getLatest(),
				i = e._cloneNotNeeded,
				s = ni();
			if (null !== s && s.setCachedNodes(null), i.has(o)) return Dl(r), r;
			const l = Ca(r);
			return i.add(o), Dl(l), n.set(o, l), l;
		}
		getTextContent() {
			return nu(this);
		}
		getTextContentSize() {
			return this.getTextContent().length;
		}
		createDOM(e, n) {
			t(70);
		}
		updateDOM(e, n, o) {
			t(71);
		}
		getDOMSlot(t) {
			return new Q$3(t);
		}
		exportDOM(t) {
			return {
				element: this.createDOM(t._config, t)
			};
		}
		exportJSON() {
			const t = this.__state ? this.__state.toJSON() : void 0;
			return {
				type: this.__type,
				version: 1,
				...t
			};
		}
		static importJSON(e) {
			t(18, this.name);
		}
		updateFromJSON(t) {
			return function (t, e) {
				const n = t.getWritable(),
					o = e.$;
				let r = o;
				for (const t of Ot$6(n).flatKeys) t in e && (void 0 !== r && r !== o || (r = {
					...o
				}), r[t] = e[t]);
				return (n.__state || r) && Mt$6(t).updateFromJSON(r), n;
			}(this, t);
		}
		static transform() {
			return null;
		}
		remove(t) {
			wo$1(this, true, t);
		}
		replace(e, n) {
			Ai();
			let o = ni();
			null !== o && (o = o.clone()), Oc(this, e);
			const r = this.getLatest(),
				i = this.__key,
				s = Ua(r);
			null !== s && t(400, i, r.getType(), s.getKey(), s.getType());
			const l = e.__key,
				c = e.getWritable(),
				a = this.getParentOrThrow().getWritable(),
				u = a.__size,
				f = c.getParent(),
				d = null !== f && Er(o) && ri(o, f),
				h = d ? c.getIndexWithinParent() : -1;
			Ol(c), d && null !== f && Er(o) && ii(o, f, h, -1);
			const g = r.getPreviousSibling(),
				_ = r.getNextSibling(),
				p = r.__prev,
				y = r.__next,
				m = r.__parent;
			if (wo$1(r, false, true), null === g) a.__first = l;else {
				g.getWritable().__next = l;
			}
			if (c.__prev = p, null === _) a.__last = l;else {
				_.getWritable().__prev = l;
			}
			c.__next = y, c.__parent = m, a.__size = null !== f && f.is(a) ? u - 1 : u;
			let x = 0;
			if (n && (es(this) && es(c) || t(139), x = c.getChildrenSize(), c.splice(x, 0, this.getChildren())), Er(o)) {
				Hl(o);
				const t = o.anchor,
					e = o.focus;
				t.key === i && (n && "element" === t.type ? t.set(c.__key, x + t.offset, "element") : vr(t, c)), e.key === i && (n && "element" === e.type ? e.set(c.__key, x + e.offset, "element") : vr(e, c));
			}
			return Pl() === i && Fl(l), c;
		}
		insertAfter(t, e = true) {
			Ai(), Oc(this, t);
			const n = this.getWritable(),
				o = t.getWritable();
			lu(this.getParentOrThrow());
			const r = o.getParent(),
				i = ni();
			let s = false,
				l = false,
				c = -1;
			if (null !== r && e && Er(i) && ri(i, r)) {
				const e = r.__key,
					n = i.anchor,
					o = i.focus;
				c = t.getIndexWithinParent(), s = "element" === n.type && n.key === e && n.offset === c + 1, l = "element" === o.type && o.key === e && o.offset === c + 1;
			}
			Ol(o), -1 !== c && null !== r && Er(i) && ii(i, r, c, -1);
			const a = this.getNextSibling(),
				u = this.getParentOrThrow().getWritable(),
				f = o.__key,
				d = n.__next;
			if (null === a) u.__last = f;else {
				a.getWritable().__prev = f;
			}
			if (u.__size++, n.__next = f, o.__next = d, o.__prev = n.__key, o.__parent = n.__parent, e && Er(i)) {
				const t = u.__key;
				if (s || l || ri(i, u)) {
					const e = this.getIndexWithinParent();
					ii(i, u, e + 1), s && i.anchor.set(t, e + 2, "element"), l && i.focus.set(t, e + 2, "element");
				}
			}
			return t;
		}
		insertBefore(t, e = true) {
			Ai(), Oc(this, t);
			const n = this.getWritable(),
				o = t.getWritable();
			lu(this.getParentOrThrow());
			const r = o.__key,
				i = ni(),
				s = o.getParent(),
				l = null !== s && e && Er(i) && ri(i, s),
				c = l ? o.getIndexWithinParent() : -1;
			Ol(o), l && null !== s && Er(i) && ii(i, s, c, -1);
			const a = this.getPreviousSibling(),
				u = this.getParentOrThrow().getWritable(),
				f = n.__prev,
				d = e && Er(i) && ri(i, u),
				h = d ? this.getIndexWithinParent() : -1;
			if (null === a) u.__first = r;else {
				a.getWritable().__next = r;
			}
			return u.__size++, n.__prev = r, o.__prev = f, o.__next = n.__key, o.__parent = n.__parent, d && Er(i) && ii(i, u, h), t;
		}
		isParentRequired() {
			return false;
		}
		createParentElementNode() {
			return Ws();
		}
		selectStart() {
			return this.selectPrevious();
		}
		selectEnd() {
			return this.selectNext(0, 0);
		}
		selectPrevious(t, e) {
			Ai();
			const n = Ua(this);
			if (null !== n) return n.selectPrevious(t, e);
			const o = this.getPreviousSibling(),
				r = this.getParentOrThrow();
			if (null === o) return r.select(0, 0);
			if (es(o)) return o.select();
			if (!gr(o)) {
				const t = o.getIndexWithinParent() + 1;
				return r.select(t, t);
			}
			return o.select(t, e);
		}
		selectNext(t, e) {
			Ai();
			const n = Ua(this);
			if (null !== n) return n.selectNext(t, e);
			const o = this.getNextSibling(),
				r = this.getParentOrThrow();
			if (null === o) return r.select();
			if (es(o)) return o.select(0, 0);
			if (!gr(o)) {
				const t = o.getIndexWithinParent();
				return r.select(t, t);
			}
			return o.select(t, e);
		}
		markDirty() {
			this.getWritable();
		}
		reconcileObservedMutation(t, e) {
			this.markDirty();
		}
	}
	function Fo(t) {
		return t instanceof Do;
	}
	const Po = "historic",
		Io = "history-push",
		Lo = "history-merge",
		zo = "paste",
		Ko = "cut",
		Bo = "collaboration",
		Ro = "skip-collab",
		Wo = "skip-scroll-into-view",
		$o = "skip-dom-selection",
		Uo = "skip-selection-focus",
		Ho = "composition-start",
		jo = "composition-end",
		Jo = "!important";
	function Vo(t) {
		const e = {};
		if (!t) return e;
		let n = "",
			o = "",
			r = null,
			i = false,
			s = false,
			l = false,
			c = 0;
		const a = t.length;
		let u = -1;
		for (let f = 0; f < a; f++) {
			const a = t[f];
			if (i) "*" === a && "/" === t[f + 1] && (i = false, f++);else if (s) -1 === u && (u = f), s = false;else if (null === r) {
				if ("/" !== a || "*" !== t[f + 1]) {
					if ('"' !== a && "'" !== a) {
						if ("(" !== a) {
							if (")" !== a) {
								if (l || ":" !== a || 0 !== c) {
									if (";" === a && 0 === c) {
										-1 !== u && (l ? o += t.slice(u, f) : n += t.slice(u, f), u = -1);
										const r = n.trim(),
											i = o.trim();
										"" !== r && "" !== i && (e[r] = i), n = "", o = "", l = false;
										continue;
									}
									-1 === u && (u = f);
								} else -1 !== u && (n += t.slice(u, f), u = -1), l = true;
							} else -1 === u && (u = f), c = Math.max(0, c - 1);
						} else -1 === u && (u = f), c++;
					} else -1 === u && (u = f), r = a;
				} else -1 !== u && (l ? o += t.slice(u, f) : n += t.slice(u, f), u = -1), i = true, f++;
			} else -1 === u && (u = f), "\\" === a ? s = true : a === r && (r = null);
		}
		-1 !== u && (l ? o += t.slice(u, a) : n += t.slice(u, a));
		const f = n.trim(),
			d = o.trim();
		return "" !== f && "" !== d && (e[f] = d), e;
	}
	function qo(t, e, n) {
		const o = n.trimEnd(),
			r = o.length - 10;
		r >= 0 && o.slice(r).toLowerCase() === Jo ? t.setProperty(e, o.slice(0, r).trim(), "important") : t.setProperty(e, n, "");
	}
	function Yo(t, e) {
		for (const n in e) {
			const o = e[n];
			null == o ? t.removeProperty(n) : qo(t, n, o);
		}
	}
	function Go(t, e, n = "") {
		if (e === n) return;
		const o = Vo(n),
			r = Vo(e);
		for (const e in r) delete o[e], qo(t, e, r[e]);
		for (const e in o) t.removeProperty(e);
	}
	function Xo(t, e) {
		return 16 & e ? "code" : e & T ? "mark" : 32 & e ? "sub" : 64 & e ? "sup" : null;
	}
	function Qo(t, e) {
		return 1 & e ? "strong" : 2 & e ? "em" : "span";
	}
	function Zo(t, e, n, o, r) {
		const i = o.classList;
		let s = cc(r, "base");
		void 0 !== s && i.add(...s), s = cc(r, "underlineStrikethrough");
		let l = false;
		const c = 8 & e && 4 & e;
		void 0 !== s && (8 & n && 4 & n ? (l = true, c || i.add(...s)) : c && i.remove(...s));
		for (const t in K$1) {
			const o = K$1[t];
			if (s = cc(r, t), void 0 !== s) if (n & o) {
				if (l && ("underline" === t || "strikethrough" === t)) {
					e & o && i.remove(...s);
					continue;
				}
				(0 === (e & o) || c && "underline" === t || "strikethrough" === t) && i.add(...s);
			} else e & o && i.remove(...s);
		}
		lc(o, "class");
	}
	function tr(t, e, n) {
		const o = n.isComposing(),
			r = t + (o ? A$1 : ""),
			s = ua(),
			l = fa(s).$getDOMSlot(n, e, s),
			c = l.getFirstChild();
		if (null === c || c.nodeType !== Node.TEXT_NODE) return void l.insertChild(Wc().createTextNode(r));
		const a = c,
			u = a.nodeValue;
		if (u !== r) if (o || i) {
			const [t, e, n] = function (t, e) {
				const n = t.length,
					o = e.length;
				let r = 0,
					i = 0;
				for (; r < n && r < o && t[r] === e[r];) r++;
				for (; i + r < n && i + r < o && t[n - i - 1] === e[o - i - 1];) i++;
				return [r, n - r - i, e.slice(r, o - i)];
			}(u, r);
			0 !== e && a.deleteData(t, e), a.insertData(t, n);
		} else a.nodeValue = r;
	}
	function er(t, e, n, o, r, i) {
		tr(r, t, e);
		const s = i.theme.text;
		void 0 !== s && Zo(0, 0, o, t, s);
	}
	function nr(t, e) {
		const n = Wc().createElement(e);
		return n.appendChild(t), n;
	}
	function or(t) {
		return null != t && true === t.__isInlineFormattable;
	}
	class rr extends Do {
		get __isInlineFormattable() {
			return true;
		}
		$config() {
			return this.config("text", {
				importDOM: {
					"#text": () => ({
						conversion: ar,
						priority: 0
					}),
					b: () => ({
						conversion: sr,
						priority: 0
					}),
					code: () => ({
						conversion: dr,
						priority: 0
					}),
					em: () => ({
						conversion: dr,
						priority: 0
					}),
					i: () => ({
						conversion: dr,
						priority: 0
					}),
					mark: () => ({
						conversion: dr,
						priority: 0
					}),
					s: () => ({
						conversion: dr,
						priority: 0
					}),
					span: () => ({
						conversion: ir,
						priority: 0
					}),
					strong: () => ({
						conversion: dr,
						priority: 0
					}),
					sub: () => ({
						conversion: dr,
						priority: 0
					}),
					sup: () => ({
						conversion: dr,
						priority: 0
					}),
					u: () => ({
						conversion: dr,
						priority: 0
					})
				}
			});
		}
		afterCloneFrom(t) {
			super.afterCloneFrom(t), this.__text = t.__text, this.__format = t.__format, this.__style = t.__style, this.__mode = t.__mode, this.__detail = t.__detail;
		}
		constructor(t = "", e) {
			super(e), this.__text = t, this.__format = 0, this.__style = "", this.__mode = 0, this.__detail = 0;
		}
		getFormat() {
			return this.getLatest().__format;
		}
		getDetail() {
			return this.getLatest().__detail;
		}
		getMode() {
			const t = this.getLatest();
			return U$1[t.__mode];
		}
		getStyle() {
			return this.getLatest().__style;
		}
		isToken() {
			return 1 === this.getLatest().__mode;
		}
		isComposing() {
			return this.__key === Pl();
		}
		isSegmented() {
			return 2 === this.getLatest().__mode;
		}
		isDirectionless() {
			return !!(1 & this.getLatest().__detail);
		}
		isUnmergeable() {
			return !!(2 & this.getLatest().__detail);
		}
		hasFormat(t) {
			const e = K$1[t];
			return 0 !== (this.getFormat() & e);
		}
		isSimpleText() {
			return "text" === this.__type && 0 === this.__mode;
		}
		getTextContent() {
			return this.getLatest().__text;
		}
		getFormatFlags(t, e) {
			return wl(this.getLatest().__format, t, e);
		}
		canHaveFormat() {
			return true;
		}
		isInline() {
			return true;
		}
		createDOM(t, e) {
			const n = this.__format,
				o = Xo(0, n),
				r = Qo(0, n),
				i = null === o ? r : o,
				s = Wc().createElement(i);
			let l = s;
			this.hasFormat("code") && s.setAttribute("spellcheck", "false"), null !== o && (l = Wc().createElement(r), s.appendChild(l));
			er(l, this, 0, n, this.__text, t);
			const c = this.__style;
			return "" !== c && Go(s.style, c), s;
		}
		updateDOM(e, n, o) {
			const r = this.__text,
				i = e.__format,
				s = this.__format,
				l = Xo(0, i),
				c = Xo(0, s),
				a = Qo(0, i),
				u = Qo(0, s);
			if ((null === l ? a : l) !== (null === c ? u : c)) return true;
			if (l === c && a !== u) {
				const e = n.firstChild;
				null == e && t(48);
				const i = Wc().createElement(u);
				return er(i, this, 0, s, r, o), n.replaceChild(i, e), false;
			}
			let f = n;
			null !== c && null !== l && (f = n.firstChild, null == f && t(49)), tr(r, f, this);
			const d = o.theme.text;
			void 0 !== d && i !== s && Zo(0, i, s, f, d);
			const h = e.__style,
				g = this.__style;
			return h !== g && (Go(n.style, g, h), lc(n, "style")), false;
		}
		updateFromJSON(t) {
			return super.updateFromJSON(t).setTextContent(t.text).setFormat(t.format).setDetail(t.detail).setMode(t.mode).setStyle(t.style);
		}
		exportDOM(e) {
			let {
				element: n
			} = super.exportDOM(e);
			return na(n) || t(132), n.style.whiteSpace = "pre-wrap", this.hasFormat("lowercase") ? n.style.textTransform = "lowercase" : this.hasFormat("uppercase") ? n.style.textTransform = "uppercase" : this.hasFormat("capitalize") && (n.style.textTransform = "capitalize"), this.hasFormat("bold") && (n = nr(n, "b")), this.hasFormat("italic") && (n = nr(n, "i")), this.hasFormat("strikethrough") && (n = nr(n, "s")), this.hasFormat("underline") && (n = nr(n, "u")), {
				element: n
			};
		}
		exportJSON() {
			return {
				detail: this.getDetail(),
				format: this.getFormat(),
				mode: this.getMode(),
				style: this.getStyle(),
				text: this.getTextContent(),
				...super.exportJSON()
			};
		}
		selectionTransform(t, e) {}
		setFormat(t) {
			const e = this.getWritable();
			return e.__format = "string" == typeof t ? K$1[t] : t, e;
		}
		setDetail(t) {
			const e = this.getWritable();
			return e.__detail = "string" == typeof t ? B$1[t] : t, e;
		}
		setStyle(t) {
			const e = this.getWritable();
			return e.__style = t, e;
		}
		toggleFormat(t) {
			const e = wl(this.getFormat(), t, null);
			return this.setFormat(e);
		}
		toggleDirectionless() {
			const t = this.getWritable();
			return t.__detail ^= 1, t;
		}
		toggleUnmergeable() {
			const t = this.getWritable();
			return t.__detail ^= 2, t;
		}
		setMode(t) {
			const e = $$1[t];
			if (this.__mode === e) return this;
			const n = this.getWritable();
			return n.__mode = e, n;
		}
		setTextContent(t) {
			if (this.__text === t) return this;
			const e = this.getWritable();
			return e.__text = t, e;
		}
		select(t, e) {
			Ai();
			let n = t,
				o = e;
			const r = ni(),
				i = this.getTextContent(),
				s = this.__key;
			if ("string" == typeof i) {
				const t = i.length;
				void 0 === n && (n = t), void 0 === o && (o = t);
			} else n = 0, o = 0;
			if (!Er(r)) return Xr(s, n, s, o, "text", "text");
			{
				const t = Pl();
				t !== r.anchor.key && t !== r.focus.key || Fl(s), r.setTextNodeRange(this, n, this, o);
			}
			return r;
		}
		selectStart() {
			return this.select(0, 0);
		}
		selectEnd() {
			const t = this.getTextContentSize();
			return this.select(t, t);
		}
		spliceText(t, e, n, o) {
			const r = this.getWritable(),
				i = r.__text,
				s = n.length;
			let l = t;
			l < 0 && (l = s + l, l < 0 && (l = 0));
			const c = ni();
			if (o && Er(c)) {
				const e = t + s;
				c.setTextNodeRange(r, e, r, e);
			}
			const a = i.slice(0, l) + n + i.slice(l + e);
			return r.__text = a, r;
		}
		canInsertTextBefore() {
			return true;
		}
		canInsertTextAfter() {
			return true;
		}
		splitText(...t) {
			Ai();
			const e = this.getLatest(),
				n = e.getTextContent();
			if ("" === n) return [];
			const o = e.__key,
				r = Pl(),
				i = n.length;
			t.sort((t, e) => t - e), t.push(i);
			const s = [],
				l = t.length;
			for (let e = 0, o = 0; e < i && o <= l; o++) {
				const r = t[o];
				r > e && (s.push(n.slice(e, r)), e = r);
			}
			const c = s.length;
			if (1 === c) return [e];
			const a = s[0],
				u = e.getParent();
			let f;
			const d = e.getFormat(),
				h = e.getStyle(),
				g = e.__detail;
			let _ = false,
				p = null,
				y = null;
			const m = ni();
			if (Er(m)) {
				const [t, e] = m.isBackward() ? [m.focus, m.anchor] : [m.anchor, m.focus];
				"text" === t.type && t.key === o && (p = t), "text" === e.type && e.key === o && (y = e);
			}
			e.isSegmented() ? (f = hr(a), f.__format = d, f.__style = h, f.__detail = g, f.__state = It$5(e, f), _ = true) : f = e.setTextContent(a);
			const x = [f];
			for (let t = 1; t < c; t++) {
				const n = hr(s[t]);
				n.__format = d, n.__style = h, n.__detail = g, n.__state = It$5(e, n);
				const i = n.__key;
				r === o && Fl(i), x.push(n);
			}
			const C = p ? p.offset : null,
				S = y ? y.offset : null;
			let v = 0;
			for (const t of x) {
				if (!p && !y) break;
				const e = v + t.getTextContentSize();
				if (null !== p && null !== C && C <= e && C >= v && (p.set(t.getKey(), C - v, "text"), C < e && (p = null)), null !== y && null !== S && S <= e && S >= v) {
					y.set(t.getKey(), S - v, "text");
					break;
				}
				v = e;
			}
			if (null !== u) {
				!function (t) {
					const e = t.getPreviousSibling(),
						n = t.getNextSibling();
					null !== e && Dl(e);
					null !== n && Dl(n);
				}(this);
				const t = u.getWritable(),
					e = this.getIndexWithinParent();
				_ ? (t.splice(e, 0, x), this.remove()) : t.splice(e, 1, x), Er(m) && ii(m, u, e, c - 1);
			}
			return x;
		}
		mergeWithSibling(e) {
			const n = e === this.getPreviousSibling();
			n || e === this.getNextSibling() || t(50);
			const o = this.__key,
				r = e.__key,
				i = this.__text,
				s = i.length;
			Pl() === r && Fl(o);
			const l = ni();
			if (Er(l)) {
				const t = l.anchor,
					i = l.focus;
				null !== t && t.key === r && ci(t, n, o, e, s), null !== i && i.key === r && ci(i, n, o, e, s);
			}
			const c = e.__text,
				a = n ? c + i : i + c;
			this.setTextContent(a);
			const u = this.getWritable();
			return e.remove(), u;
		}
		isTextEntity() {
			return false;
		}
	}
	function ir(t) {
		return {
			forChild: _r(t.style),
			node: null
		};
	}
	function sr(t) {
		const e = t,
			n = "normal" === e.style.fontWeight;
		return {
			forChild: _r(e.style, n ? void 0 : "bold"),
			node: null
		};
	}
	const lr = new WeakMap();
	function cr(t) {
		if (!na(t)) return false;
		if ("PRE" === t.nodeName) return true;
		const e = t.style.whiteSpace;
		return "string" == typeof e && e.startsWith("pre");
	}
	function ar(e) {
		const n = e;
		null === e.parentElement && t(129);
		let o = n.textContent || "";
		if (null !== function (t) {
			let e,
				n = t.parentNode;
			const o = [t];
			for (; null !== n && void 0 === (e = lr.get(n)) && !cr(n);) o.push(n), n = n.parentNode;
			const r = void 0 === e ? n : e;
			for (let t = 0; t < o.length; t++) lr.set(o[t], r);
			return r;
		}(n)) return {
			node: gi(o)
		};
		if (o = o.replace(/\r/g, "").replace(/[ \t\n]+/g, " "), "" === o) return {
			node: null
		};
		if (" " === o[0]) {
			let t = n,
				e = true;
			for (; null !== t && null !== (t = ur(t, false));) {
				const n = t.textContent || "";
				if (n.length > 0) {
					/[ \t\n]$/.test(n) && (o = o.slice(1)), e = false;
					break;
				}
			}
			e && (o = o.slice(1));
		}
		if (" " === o[o.length - 1]) {
			let t = n,
				e = true;
			for (; null !== t && null !== (t = ur(t, true));) {
				if ((t.textContent || "").replace(/^( |\t|\r?\n)+/, "").length > 0) {
					e = false;
					break;
				}
			}
			e && (o = o.slice(0, o.length - 1));
		}
		return "" === o ? {
			node: null
		} : {
			node: hr(o)
		};
	}
	function ur(t, e) {
		let n = t;
		for (;;) {
			let t;
			for (; null === (t = e ? n.nextSibling : n.previousSibling);) {
				const t = n.parentElement;
				if (null === t) return null;
				n = t;
			}
			if (n = t, na(n)) {
				const t = n.style.display;
				if ("" === t && !sa(n) || "" !== t && !t.startsWith("inline")) return null;
			}
			let o = n;
			for (; null !== (o = e ? n.firstChild : n.lastChild);) n = o;
			if (kl(n)) return n;
			if ("BR" === n.nodeName) return null;
		}
	}
	const fr = {
		code: "code",
		em: "italic",
		i: "italic",
		mark: "highlight",
		s: "strikethrough",
		strong: "bold",
		sub: "subscript",
		sup: "superscript",
		u: "underline"
	};
	function dr(t) {
		const e = fr[t.nodeName.toLowerCase()];
		return void 0 === e ? {
			node: null
		} : {
			forChild: _r(t.style, e),
			node: null
		};
	}
	function hr(t = "") {
		return Mc(new rr(t));
	}
	function gr(t) {
		return t instanceof rr;
	}
	function _r(t, e) {
		const n = t.fontWeight,
			o = t.textDecoration.split(" "),
			r = "700" === n || "bold" === n,
			i = o.includes("line-through"),
			s = "italic" === t.fontStyle,
			l = o.includes("underline"),
			c = t.verticalAlign,
			a = t.textTransform;
		return t => gr(t) || or(t) ? (r && !t.hasFormat("bold") && t.toggleFormat("bold"), i && !t.hasFormat("strikethrough") && t.toggleFormat("strikethrough"), s && !t.hasFormat("italic") && t.toggleFormat("italic"), l && !t.hasFormat("underline") && t.toggleFormat("underline"), "sub" !== c || t.hasFormat("subscript") || t.toggleFormat("subscript"), "super" !== c || t.hasFormat("superscript") || t.toggleFormat("superscript"), "lowercase" !== a && "uppercase" !== a && "capitalize" !== a || t.hasFormat(a) || t.toggleFormat(a), e && !t.hasFormat(e) && t.toggleFormat(e), t) : t;
	}
	class pr extends rr {
		$config() {
			return this.config("tab", {
				extends: rr
			});
		}
		constructor(t = void 0) {
			super("\t", t), this.__detail = 2;
		}
		createDOM(t) {
			const e = super.createDOM(t),
				n = cc(t.theme, "tab");
			if (void 0 !== n) {
				e.classList.add(...n);
			}
			return e;
		}
		setTextContent(t) {
			return super.setTextContent("\t");
		}
		spliceText(e, n, o, r) {
			return "" === o && 0 === n || "\t" === o && 1 === n || t(286), this;
		}
		setDetail(e) {
			return 2 !== e && t(127), this;
		}
		setMode(e) {
			return "normal" !== e && t(128), this;
		}
		canInsertTextBefore() {
			return false;
		}
		canInsertTextAfter() {
			return false;
		}
	}
	function yr() {
		return Mc(new pr());
	}
	function mr(t) {
		return t instanceof pr;
	}
	class xr {
		constructor(t, e, n) {
			this._selection = null, this.key = t, this.offset = e, this.type = n;
		}
		is(t) {
			return this.key === t.key && this.offset === t.offset && this.type === t.type;
		}
		isBefore(t) {
			if (this.key === t.key) return this.offset < t.offset;
			return Bu(Ms(Cs(this, "next")), Ms(Cs(t, "next"))) < 0;
		}
		getNode() {
			const e = Il(this.key);
			return null === e && t(20), e;
		}
		set(t, e, n, o) {
			const r = this._selection,
				i = this.key;
			o && this.key === t && this.offset === e && this.type === n || (this.key = t, this.offset = e, this.type = n, Oi() || (Pl() === i && Fl(t), null !== r && (r.setCachedNodes(null), Er(r) && (r._cachedIsBackward = null), r.dirty = true)));
		}
	}
	function Cr(t, e, n) {
		return new xr(t, e, n);
	}
	function Sr(t, e) {
		let n = e.__key,
			o = t.offset,
			r = "element";
		if (gr(e)) {
			r = "text";
			const t = e.getTextContentSize();
			o > t && (o = t);
		} else if (!es(e)) {
			const t = e.getNextSibling();
			if (gr(t)) n = t.__key, o = 0, r = "text";else {
				const t = e.getParent();
				t && (n = t.__key, o = e.getIndexWithinParent() + 1);
			}
		}
		t.set(n, o, r);
	}
	function vr(t, e) {
		if (es(e)) {
			const n = e.getLastDescendant();
			es(n) || gr(n) ? Sr(t, n) : Sr(t, e);
		} else Sr(t, e);
	}
	function Tr(t, e, n, o) {
		const r = t.getNode(),
			i = r.getChildAtIndex(t.offset),
			s = hr();
		if (s.setFormat(n), s.setStyle(o), $s(i)) i.splice(0, 0, [s]);else if (null !== i) {
			const t = wc(r) ? Ws().append(s) : s;
			i.insertBefore(t);
		} else if (wc(r)) {
			const t = r.getLastChild();
			es(t) && !t.isInline() && t.isEmpty() ? t.append(s) : r.append(Ws().append(s));
		} else r.append(s);
		t.is(e) && e.set(s.__key, 0, "text"), t.set(s.__key, 0, "text");
	}
	function kr(e, n, o, r) {
		const i = e.anchor.getNode();
		gr(i) || t(398);
		const s = e.anchor.offset,
			l = hr(n);
		l.setFormat(o), l.setStyle(r);
		const c = i.getParentOrThrow();
		if (0 === s) c.isInline() && !i.__prev ? c.insertBefore(l) : i.insertBefore(l, false);else if (s === i.getTextContentSize()) c.isInline() && !i.__next ? c.insertAfter(l) : i.insertAfter(l, false);else {
			const [t] = i.splitText(s);
			t.insertAfter(l, false);
		}
		"" === i.getTextContent() && i.isAttached() && i.remove(), l.selectEnd(), l.isComposing() && "text" === e.anchor.type && e.anchor.set(e.anchor.key, e.anchor.offset - n.length, e.anchor.type);
	}
	class br {
		constructor(t) {
			this._cachedNodes = null, this._nodes = t, this.dirty = false;
		}
		getCachedNodes() {
			return this._cachedNodes;
		}
		setCachedNodes(t) {
			this._cachedNodes = t;
		}
		is(t) {
			if (!Or(t)) return false;
			const e = this._nodes,
				n = t._nodes;
			return e.size === n.size && Array.from(e).every(t => n.has(t));
		}
		isCollapsed() {
			return false;
		}
		isBackward() {
			return false;
		}
		getStartEndPoints() {
			return null;
		}
		add(t) {
			this.dirty = true, this._nodes.add(t), this._cachedNodes = null;
		}
		delete(t) {
			this.dirty = true, this._nodes.delete(t), this._cachedNodes = null;
		}
		clear() {
			this.dirty = true, this._nodes.clear(), this._cachedNodes = null;
		}
		has(t) {
			return this._nodes.has(t);
		}
		clone() {
			return new br(new Set(this._nodes));
		}
		extract() {
			return this.getNodes();
		}
		insertRawText(t) {}
		insertText() {}
		insertNodes(t) {
			const e = this.getNodes().filter(t => null === $a(t)),
				n = e.length;
			if (0 === n) return;
			const o = e[n - 1];
			let r;
			if (gr(o)) r = o.select();else {
				const t = o.getIndexWithinParent() + 1;
				r = o.getParentOrThrow().select(t, t);
			}
			r.insertNodes(t);
			for (let t = 0; t < n; t++) e[t].remove();
		}
		getNodes() {
			const t = this._cachedNodes;
			if (null !== t) return t;
			const e = this._nodes,
				n = [];
			for (const t of e) {
				const e = Il(t);
				null !== e && n.push(e);
			}
			return Oi() || (this._cachedNodes = n), n;
		}
		getTextContent() {
			const t = this.getNodes();
			let e = "";
			for (let n = 0; n < t.length; n++) e += t[n].getTextContent();
			return e;
		}
		deleteNodes() {
			const t = this.getNodes().filter(t => null === $a(t));
			if ((ni() || oi()) === this && t[0]) {
				const e = ku(t[0], "next");
				vs(zu(e, e));
			}
			for (const e of t) e.remove();
			Nr();
		}
	}
	function Nr() {
		const t = $l();
		if (t.isEmpty()) {
			const e = Ws();
			t.append(e), e.select();
		}
	}
	function wr(t) {
		const e = function (t) {
			const e = t.getNode();
			if (t.offset > 0) return "element" === t.type && es(e) ? e.getChildAtIndex(t.offset - 1) : null;
			for (let t = e; null !== t && !aa(t) && !wc(t); t = t.getParent()) {
				const e = t.getPreviousSibling();
				if (null !== e) return e;
			}
			return null;
		}(t);
		return ps(e) && ps(e.getPreviousSibling());
	}
	function Er(t) {
		return t instanceof Mr;
	}
	class Mr {
		constructor(t, e, n, o) {
			this.anchor = t, this.focus = e, t._selection = this, e._selection = this, this._cachedNodes = null, this._cachedIsBackward = null, this.format = n, this.style = o, this.dirty = false;
		}
		getCachedNodes() {
			return this._cachedNodes;
		}
		setCachedNodes(t) {
			this._cachedNodes = t;
		}
		is(t) {
			return !!Er(t) && this.anchor.is(t.anchor) && this.focus.is(t.focus) && this.format === t.format && this.style === t.style;
		}
		isCollapsed() {
			return this.anchor.is(this.focus);
		}
		getNodes() {
			const t = this._cachedNodes;
			if (null !== t) return t;
			const e = function (t) {
				const e = [],
					[n, o] = t.getTextSlices();
				n && e.push(n.caret.origin);
				const r = new Set(),
					i = new Set();
				for (const n of t) if (Cu(n)) {
					const {
						origin: t
					} = n;
					0 === e.length ? r.add(t) : (i.add(t), e.push(t));
				} else {
					const {
						origin: t
					} = n;
					es(t) && i.has(t) || e.push(t);
				}
				o && e.push(o.caret.origin);
				if (xu(t.focus) && es(t.focus.origin) && null === t.focus.getNodeAtCaret()) for (let n = Eu(t.focus.origin, "previous"); Cu(n) && r.has(n.origin) && !n.origin.isEmpty() && n.origin.is(e[e.length - 1]); n = Ou(n)) r.delete(n.origin), e.pop();
				for (; e.length > 1;) {
					const t = e[e.length - 1];
					if (!es(t) || i.has(t) || t.isEmpty() || r.has(t)) break;
					e.pop();
				}
				if (0 === e.length && t.isCollapsed()) {
					const n = Ms(t.anchor),
						o = Ms(t.anchor.getFlipped()),
						r = t => yu(t) ? t.origin : t.getNodeAtCaret(),
						i = r(n) || r(o) || (t.anchor.getNodeAtCaret() ? n.origin : o.origin);
					e.push(i);
				}
				return e;
			}(As(ks(this), "next"));
			return Oi() || (this._cachedNodes = e), e;
		}
		setTextNodeRange(t, e, n, o) {
			return this.anchor.set(t.__key, e, "text"), this.focus.set(n.__key, o, "text"), this;
		}
		getTextContent() {
			const t = this.getNodes();
			if (0 === t.length) return "";
			const e = t[0],
				n = t[t.length - 1],
				o = this.anchor,
				r = this.focus,
				i = o.isBefore(r),
				[s, l] = Ir(this);
			let c = "",
				a = true;
			for (let u = 0; u < t.length; u++) {
				const f = t[u];
				if (es(f) && !f.isInline()) {
					a || (c += "\n");
					let t = "";
					for (const e of qa(f)) {
						const n = Ya(f, e);
						null !== n && (t += n.getTextContent());
					}
					"" !== t ? (c += t, a = false) : a = !f.isEmpty();
				} else if (a = false, gr(f)) {
					let t = f.getTextContent();
					f === e ? f === n ? "element" === o.type && "element" === r.type && r.offset !== o.offset || (t = s < l ? t.slice(s, l) : t.slice(l, s)) : t = i ? t.slice(s) : t.slice(l) : f === n && (t = i ? t.slice(0, l) : t.slice(0, s)), c += t;
				} else !rs(f) && !ps(f) || f === n && this.isCollapsed() || (c += f.getTextContent());
			}
			return c;
		}
		applyDOMRange(t) {
			const e = Ii(),
				n = e.getEditorState()._selection,
				o = Yr(t.startContainer, t.startOffset, t.endContainer, t.endOffset, e, n);
			if (null === o) return;
			const [r, i, s] = o;
			this.anchor.set(r.key, r.offset, r.type, true), this.focus.set(i.key, i.offset, i.type, true), s && (this.dirty = true), Bt$6(this);
		}
		clone() {
			const t = this.anchor,
				e = this.focus;
			return new Mr(Cr(t.key, t.offset, t.type), Cr(e.key, e.offset, e.type), this.format, this.style);
		}
		toggleFormat(t) {
			this.format = wl(this.format, t, null), this.dirty = true;
		}
		setFormat(t) {
			this.format = t, this.dirty = true;
		}
		setStyle(t) {
			this.style = t, this.dirty = true;
		}
		hasFormat(t) {
			const e = K$1[t];
			return 0 !== (this.format & e);
		}
		insertRawText(t) {
			this.insertNodes(gi(t));
		}
		insertText(e) {
			let n = this.format,
				o = this.style;
			if (!this.isCollapsed()) {
				const t = (this.focus.isBefore(this.anchor) ? this.focus : this.anchor).getNode();
				if (gr(t) && (n = t.getFormat(), o = t.getStyle()), this.removeText(), this.format = n, this.style = o, "" === e) return;
				if (null === Pl()) return "element" === this.anchor.type && Tr(this.anchor, this.focus, n, o), void kr(this, e, n, o);
			}
			"element" === this.anchor.type && Tr(this.anchor, this.focus, n, o);
			const r = this.anchor.getNode();
			gr(r) || t(398);
			const i = this.anchor.offset,
				s = r.getParentOrThrow(),
				l = r.getTextContentSize();
			if (Tl(r) || 0 === i && (!r.canInsertTextBefore() || !s.canInsertTextBefore() && !r.__prev) || i === l && (!r.canInsertTextAfter() || !s.canInsertTextAfter() && !r.__next)) {
				if (r.isSegmented() && 0 !== i && i !== l) {
					if (null !== Pl()) r.setMode("normal").setFormat(n).setStyle(o);else {
						const t = hr(r.getTextContent());
						t.setFormat(n), t.setStyle(o);
						const e = ni() === this;
						r.replace(t), this.setTextNodeRange(t, i, t, i), e && ni() !== this && Hl(this);
					}
					return void ("" !== e && this.insertText(e));
				}
				if ("" === e) return;
				if (0 === i) {
					const t = r.getPreviousSibling();
					if (gr(t) && t.canInsertTextAfter() && !Tl(t)) t.select();else {
						const t = hr();
						t.setFormat(n), t.setStyle(o), s.canInsertTextBefore() ? r.insertBefore(t) : s.insertBefore(t), t.select();
					}
					return void this.insertText(e);
				}
				if (i === l) {
					const t = r.getNextSibling();
					if (gr(t) && t.canInsertTextBefore() && !Tl(t)) t.select(0, 0);else {
						const t = hr();
						t.setFormat(n), t.setStyle(o), s.canInsertTextAfter() ? r.insertAfter(t) : s.insertAfter(t), t.select(0, 0);
					}
					return void this.insertText(e);
				}
				const t = hr(e);
				return t.setFormat(n), t.setStyle(o), r.replace(t), void t.select();
			}
			if ("" === e) return;
			const c = s.isInline() && 0 === i && !r.__prev,
				a = s.isInline() && i === l && !r.__next,
				u = r.getFormat() !== n || r.getStyle() !== o;
			if (c || a || u) {
				if ("" !== r.getTextContent() || c || a) return void kr(this, e, n, o);
				r.setFormat(n), r.setStyle(o);
			}
			r.spliceText(i, 0, e, true), r.isComposing() && "text" === this.anchor.type && this.anchor.set(this.anchor.key, this.anchor.offset - e.length, this.anchor.type);
		}
		removeText() {
			const t = ni() === this,
				e = this.anchor.key;
			Ts(this, Es(ks(this))), this.isCollapsed() && function (t, e) {
				const n = t.anchor;
				if (n.key === e) return;
				const o = n.getNode();
				let r = 0,
					i = "";
				gr(o) ? (r = o.getFormat(), i = o.getStyle()) : es(o) && (r = o.getTextFormat(), i = o.getTextStyle());
				t.format === r && t.style === i || (t.format = r, t.style = i, t.dirty = true);
			}(this, e), t && ni() !== this && Hl(this);
		}
		formatText(t, e = null) {
			Fr(this, t, e);
		}
		insertNodes(e) {
			if (0 === e.length) return;
			this.isCollapsed() || this.removeText();
			const n = this.anchor.getNode();
			if ("element" === this.anchor.type && es(n) && n.isShadowRoot() && null !== $a(n)) {
				let o = n.getFirstChild() ?? n.append(Ws()).getFirstChild();
				if (null !== o && !es(o)) {
					const t = Ws();
					o.insertBefore(t), o = t;
				}
				if (null !== o) {
					o.selectStart();
					const n = ni();
					return Er(n) || t(369), n.insertNodes(e);
				}
			}
			if ("element" === this.anchor.type && wc(n)) {
				const t = Ci(e),
					o = t.getLastDescendant();
				return n.splice(this.anchor.offset, 0, t.getChildren()), void (null !== o && o.selectEnd());
			}
			const o = this.isBackward() ? this.focus : this.anchor;
			let r = o.getNode(),
				i = La(r, aa);
			const s = e[e.length - 1];
			if (es(i) && "__language" in i) {
				if ("__language" in e[0]) this.insertText(e[0].getTextContent());else {
					const [, t] = yi(this);
					i.splice(t, 0, e), s.selectEnd();
				}
				return;
			}
			if (!e.some(t => (es(t) || rs(t)) && !t.isInline())) {
				es(i) || t(211, r.constructor.name, r.getType());
				const [n, o] = yi(this, true);
				return (es(n) ? n : i).splice(o, 0, e), void s.selectEnd();
			}
			if (es(i) && null !== $a(i)) {
				const [, t] = yi(this),
					n = pi(e);
				i.splice(t, 0, n);
				const o = n[n.length - 1];
				return void (void 0 !== o ? o.selectEnd() : i.select(t, t));
			}
			if (null === i) {
				const t = Ci(e),
					n = t.getLastDescendant();
				let o = Cs(this.anchor, "next");
				for (const e of t.getChildren()) o = zs(e, o);
				return void (null !== n && n.selectEnd());
			}
			if (es(i) && !i.isParentRequired() && !wc(i.getParentOrThrow())) {
				const [, t] = yi(this),
					n = pi(e);
				i.splice(t, 0, n);
				const o = n[n.length - 1];
				return void (void 0 !== o ? o.selectEnd() : i.select(t, t));
			}
			const l = Ci(e),
				c = l.getLastDescendant(),
				a = l.getChildren(),
				u = wr(o),
				f = !es(i) || !i.isEmpty() ? this.insertParagraph() : null;
			f && !i.isAttached() && (r = this.anchor.getNode(), i = La(r, aa));
			const d = a[a.length - 1];
			let h = a[0];
			var g;
			g = h, u || !es(g) || !aa(g) || g.isEmpty() || !es(i) || i.isEmpty() && !i.canMergeWhenEmpty() || (es(i) || t(211, r.constructor.name, r.getType()), i.append(...h.getChildren()), h = a[1]), h && (null === i && t(212, r.constructor.name, r.getType()), function (e, n) {
				const o = n.getParentOrThrow().getLastChild();
				let r = n;
				const i = [n];
				for (; r !== o;) r.getNextSibling() || t(140), r = r.getNextSibling(), i.push(r);
				let s = e;
				for (const t of i) s = s.insertAfter(t);
			}(i, h));
			const _ = La(c, aa),
				p = c.selectEnd();
			f && (es(_) && (f.canMergeWhenEmpty() || aa(d)) ? (_.append(...f.getChildren()), f.remove()) : f.isEmpty() && f.remove()), es(i) && i.isEmpty() && i.remove();
			const y = es(i) ? i.getLastChild() : null;
			ps(y) && _ !== i && y.remove();
			const m = Ms(Cs(p.anchor, "next"));
			Ss(p.anchor, m), Ss(p.focus, m);
		}
		insertParagraph() {
			this.isCollapsed() || this.removeText();
			const e = this.anchor.getNode();
			if ("element" === this.anchor.type && wc(e)) {
				const t = Ws();
				return e.splice(this.anchor.offset, 0, [t]), t.select(), t;
			}
			const [, n] = yi(this),
				o = La(this.anchor.getNode(), aa);
			if (null !== o && null !== $a(o)) return null;
			es(o) || t(213);
			const r = o.getChildAtIndex(n),
				i = r ? [r, ...r.getNextSiblings()] : [],
				s = o.insertNewAfter(this, false);
			return s ? (s.append(...i), s.selectStart(), s) : null;
		}
		insertLineBreak(t) {
			const e = _s();
			if (this.insertNodes([e]), t) {
				const t = e.getParentOrThrow(),
					n = e.getIndexWithinParent();
				t.select(n, n);
			}
		}
		extract() {
			const t = [...this.getNodes()],
				e = t.length;
			let n = t[0],
				o = t[e - 1];
			const [r, i] = Ir(this),
				s = this.isBackward(),
				[l, c] = s ? [this.focus, this.anchor] : [this.anchor, this.focus],
				[a, u] = s ? [i, r] : [r, i];
			if (0 === e) return [];
			if (1 === e) {
				if (gr(n) && !this.isCollapsed()) {
					const t = n.splitText(a, u),
						e = 0 === a ? t[0] : t[1];
					return e ? (l.set(e.getKey(), 0, "text"), c.set(e.getKey(), e.getTextContentSize(), "text"), [e]) : [];
				}
				return [n];
			}
			if (gr(n) && (a === n.getTextContentSize() ? t.shift() : 0 !== a && ([, n] = n.splitText(a), t[0] = n, l.set(n.getKey(), 0, "text"))), gr(o)) {
				const e = o.getTextContent().length;
				0 === u ? t.pop() : u !== e && ([o] = o.splitText(u), t[t.length - 1] = o, c.set(o.getKey(), o.getTextContentSize(), "text"));
			}
			return t;
		}
		modify(t, e, n) {
			if (Si(this, t, e, n)) return;
			const o = "move" === t,
				r = Ii(),
				i = Pc(Tc(r));
			if (!i) return;
			const s = r._blockCursorElement,
				l = r._rootElement,
				c = this.focus.getNode();
			null === l || null === s || !es(c) || c.isInline() || c.canBeEmpty() || Fc(s, r, l);
			const a = _c(r, this.focus.key);
			let u = a;
			if ("text" === this.focus.type && (u = gr(c) ? pa(c, a, r) : null), this.dirty) {
				const t = _c(r, this.anchor.key);
				let e = t;
				if ("text" === this.anchor.type) {
					const n = this.anchor.getNode();
					e = gr(n) ? pa(n, t, r) : null;
				}
				e && u && ai(i, e, this.anchor.offset, u, this.focus.offset);
			}
			if ("character" === n && gr(c) && c.isUnmergeable()) {
				if (e ? 0 === this.focus.offset : this.focus.offset === c.getTextContentSize()) {
					const t = ku(c, e ? "previous" : "next").getNodeAtCaret();
					if (gr(t)) {
						if (!o) {
							const n = t.getTextContentSize();
							return e ? this.focus.set(t.__key, n - 1, "text") : this.focus.set(t.__key, 1, "text"), void (this.dirty = true);
						}
						{
							const n = r.getElementByKey(t.getKey()),
								o = n ? pa(t, n, r) : null;
							if (o) {
								const t = e ? o.length : 0;
								ai(i, o, t, o, t);
							}
						}
					}
				}
			}
			if (Br(i, t, e ? "backward" : "forward", n, l), i.rangeCount > 0) {
				const t = $c(i, r._rootElement),
					n = t || i.getRangeAt(0),
					s = this.anchor.getNode(),
					l = ss(s) ? s : bc(s);
				if (this.applyDOMRange(n), this.dirty = true, !o) {
					Rr(this, e, l);
					(t ? "backward" !== i.direction : i.anchorNode === n.startContainer && i.anchorOffset === n.startOffset) || Kr(this);
				}
			}
			"lineboundary" === n && Si(this, t, e, n, "decorators");
		}
		forwardDeletion(t, e, n) {
			if (!n && ("element" === t.type && es(e) && t.offset === e.getChildrenSize() || "text" === t.type && t.offset === e.getTextContentSize())) {
				const t = e.getParent(),
					n = e.getNextSibling() || (null === t ? null : t.getNextSibling());
				if (es(n) && n.isShadowRoot()) return true;
			}
			return false;
		}
		deleteCharacter(t) {
			const e = this.isCollapsed();
			if (this.isCollapsed()) {
				const e = this.anchor;
				let n = e.getNode();
				if (this.forwardDeletion(e, n, t)) {
					const t = es(n) ? n.getNextSibling() : null;
					if (!(es(n) && n.isEmpty() && es(t) && t.isShadowRoot())) return;
				}
				const o = Cs(e, t ? "previous" : "next"),
					r = Iu(o);
				if (r.getTextSlices().every(t => null === t || 0 === t.distance)) {
					if ("element" === e.type) {
						const t = o.getNodeAtCaret();
						if (es(t) && Dc(t)) {
							const e = t.getParent();
							t.remove();
							const n = Ul(e, t);
							return void (null !== n && n.selectStart());
						}
					}
					let t = {
						type: "initial"
					};
					for (const e of r.iterNodeCarets("shadowRoot")) if (Cu(e)) {
						if (e.origin.isInline()) ;else {
							if (e.origin.isShadowRoot()) {
								if ("merge-block" === t.type) break;
								if (es(r.anchor.origin) && r.anchor.origin.isEmpty()) {
									const t = Ms(e);
									Ts(this, zu(t, t)), r.anchor.origin.remove();
								}
								return;
							}
							"merge-next-block" !== t.type && "merge-block" !== t.type || (t = {
								block: t.block,
								caret: e,
								type: "merge-block"
							});
						}
					} else {
						if ("merge-block" === t.type) break;
						if (xu(e)) {
							if (es(e.origin)) {
								if (e.origin.isInline()) {
									if (!e.origin.isParentOf(r.anchor.origin)) break;
								} else t = {
									block: e.origin,
									type: "merge-next-block"
								};
								continue;
							}
							if (rs(e.origin)) {
								if (e.origin.isIsolated()) ;else if ("merge-next-block" === t.type && (e.origin.isKeyboardSelectable() || !e.origin.isInline()) && es(r.anchor.origin) && r.anchor.origin.isEmpty()) {
									r.anchor.origin.remove();
									const t = Zr();
									t.add(e.origin.getKey()), Hl(t);
								} else {
									const t = e.origin,
										n = t.getParent();
									t.remove();
									const o = Ul(n, t);
									null !== o && o.selectStart();
								}
								return;
							}
							if (ps(e.origin)) return void e.origin.remove();
							break;
						}
					}
					if ("merge-block" === t.type) {
						const {
							caret: e,
							block: n
						} = t;
						if (qa(n).length > 0) return;
						return e.origin.isEmpty() && !n.isEmpty() && e.origin.getParent() === n.getParent() ? void e.origin.remove(true) : (Ts(this, zu(!e.origin.isEmpty() && n.isEmpty() ? bs(ku(n, e.direction)) : r.anchor, e)), this.removeText());
					}
					for (let t = e.getNode(); null !== t;) {
						if (null !== $a(t)) return;
						if (es(t) && t.isShadowRoot()) break;
						t = t.getParent();
					}
				}
				const i = this.focus;
				if (Wr(this, t, "character"), this.isCollapsed()) {
					if (t && 0 === e.offset && Lr(this, e.getNode())) return;
				} else {
					const o = "text" === i.type ? i.getNode() : null;
					if (n = "text" === e.type ? e.getNode() : null, null !== o && o.isSegmented()) {
						const e = i.offset,
							r = o.getTextContentSize();
						if (o.is(n) || t && e !== r || !t && 0 !== e) return void Ur(o, t, e);
					} else if (null !== n && n.isSegmented()) {
						const r = e.offset,
							i = n.getTextContentSize();
						if (n.is(o) || t && 0 !== r || !t && r !== i) return void Ur(n, t, r);
					}
					!function (t, e) {
						const n = t.anchor,
							o = t.focus,
							r = n.getNode(),
							i = o.getNode();
						if (r === i && "text" === n.type && "text" === o.type) {
							const t = n.offset,
								i = o.offset,
								s = t < i,
								l = s ? t : i,
								c = s ? i : t,
								a = c - 1;
							if (l !== a) {
								(function (t) {
									return !(Vl(t) || $r(t));
								})(r.getTextContent().slice(l, c)) && (e ? o.set(o.key, a, o.type) : n.set(n.key, a, n.type));
							}
						}
					}(this, t);
				}
			}
			if (e || zr(this), this.removeText(), t && !e && this.isCollapsed() && "element" === this.anchor.type && 0 === this.anchor.offset) {
				const t = this.anchor.getNode();
				t.isEmpty() && ss(t.getParent()) && null === t.getPreviousSibling() && Lr(this, t), Nr();
			}
		}
		deleteLine(t) {
			const e = this.isCollapsed(),
				n = Jr(this.anchor);
			if (null !== n && rs(Ua(n))) return this.isCollapsed() || this.focus.set(this.anchor.key, this.anchor.offset, this.anchor.type), void this.deleteCharacter(t);
			if (this.isCollapsed() && Wr(this, t, "lineboundary"), this.isCollapsed()) this.deleteCharacter(t);else {
				La(this.anchor.getNode(), aa) !== La(this.focus.getNode(), aa) ? (this.focus.set(this.anchor.key, this.anchor.offset, this.anchor.type), this.deleteCharacter(t)) : (e || zr(this), this.removeText());
			}
		}
		deleteWord(t) {
			const e = this.isCollapsed();
			if (this.isCollapsed()) {
				const e = this.anchor,
					n = e.getNode();
				if (this.forwardDeletion(e, n, t)) return;
				Wr(this, t, "word");
			}
			this.isCollapsed() ? this.deleteCharacter(t) : (e || zr(this), this.removeText());
		}
		isBackward() {
			const t = this._cachedIsBackward;
			if (null !== t) return t;
			const e = this.focus.isBefore(this.anchor);
			return Oi() || (this._cachedIsBackward = e), e;
		}
		getStartEndPoints() {
			return [this.anchor, this.focus];
		}
	}
	function Or(t) {
		return t instanceof br;
	}
	function Ar(t, e) {
		if (Or(t)) {
			for (const n of t.getNodes()) or(n) && n.setFormat(e(n.getFormat()));
			return;
		}
		if (t.isCollapsed()) return t.setFormat(e(t.format)), void Fl(null);
		const n = [];
		for (const o of t.getNodes()) gr(o) ? n.push(o) : es(o) ? o.setTextFormat(e(o.getTextFormat())) : or(o) && o.setFormat(e(o.getFormat()));
		const o = n.length;
		if (0 === o) return t.setFormat(e(t.format)), void Fl(null);
		const r = t.anchor,
			i = t.focus,
			s = t.isBackward(),
			l = s ? i : r,
			c = s ? r : i;
		let a = 0,
			u = n[0],
			f = "element" === l.type ? 0 : l.offset;
		if ("text" === l.type && f === u.getTextContentSize() && (a = 1, u = n[1], f = 0), null == u) return;
		const d = o - 1;
		let h = n[d];
		const g = "text" === c.type ? c.offset : h.getTextContentSize();
		if (u.is(h)) {
			if (f === g) return;
			const n = e(u.getFormat());
			if (Tl(u) || 0 === f && g === u.getTextContentSize()) u.setFormat(n);else {
				const t = u.splitText(f, g),
					e = 0 === f ? t[0] : t[1];
				e.setFormat(n), "text" === l.type && l.set(e.__key, 0, "text"), "text" === c.type && c.set(e.__key, g - f, "text");
			}
			return void (t.format = n);
		}
		0 === f || Tl(u) || ([, u] = u.splitText(f), f = 0);
		const _ = e(u.getFormat());
		u.setFormat(_);
		const p = e(h.getFormat());
		g > 0 && (g === h.getTextContentSize() || Tl(h) || ([h] = h.splitText(g)), h.setFormat(p));
		for (let t = a + 1; t < d; t++) {
			const o = n[t];
			o.setFormat(e(o.getFormat()));
		}
		"text" === l.type && l.set(u.__key, f, "text"), "text" === c.type && c.set(h.__key, g, "text"), t.format = _ | p;
	}
	function Dr(t, e) {
		const n = [];
		for (const [t, o] of Object.entries(e)) "boolean" == typeof o && n.push([t, o]);
		0 !== n.length && Ar(t, t => {
			for (const [e, o] of n) t = wl(t, e, o ? K$1[e] : 0);
			return t;
		});
	}
	function Fr(t, e, n = null) {
		const o = null === n && Er(t) ? wl(t.format, e, null) : n;
		Ar(t, t => wl(t, e, o));
	}
	function Pr(t) {
		const e = t.offset;
		if ("text" === t.type) return e;
		const n = t.getNode();
		return e === n.getChildrenSize() ? n.getTextContent().length : 0;
	}
	function Ir(t) {
		const e = t.getStartEndPoints();
		if (null === e) return [0, 0];
		const [n, o] = e;
		return "element" === n.type && "element" === o.type && n.key === o.key && n.offset === o.offset ? [0, 0] : [Pr(n), Pr(o)];
	}
	function Lr(t, e) {
		for (let n = e; n; n = n.getParent()) {
			if (es(n)) {
				if (n.collapseAtStart(t)) return true;
				if (wc(n)) break;
			}
			if (n.getPreviousSibling()) break;
		}
		return false;
	}
	function zr(t) {
		const e = $l();
		!e.isEmpty() && Ks(e, t) && (t.anchor.set(e.getKey(), 0, "element"), t.focus.set(e.getKey(), e.getChildrenSize(), "element"));
	}
	function Kr(t) {
		const e = t.focus,
			n = t.anchor,
			o = n.key,
			r = n.offset,
			i = n.type;
		n.set(e.key, e.offset, e.type, true), e.set(o, r, i, true);
	}
	function Br(t, e, n, o, r) {
		const i = "character" === o ? Hc(t, r) : null,
			s = i && i.focusNode,
			l = i ? i.focusOffset : 0;
		if (t.modify(e, n, o), null === i || !function (t, e, n) {
			return null !== t && 3 === t.nodeType && ("backward" === n ? e > 0 : "forward" === n && e < t.length);
		}(s, l, n)) return;
		const c = Hc(t, r);
		c.focusNode === s && c.focusOffset === l && t.modify(e, n, o);
	}
	function Rr(t, e, n) {
		const o = t.getNodes(),
			r = o.filter(t => Sc(t, n));
		if (0 === r.length || r.length === o.length) return false;
		const i = e ? r[0] : r[r.length - 1],
			s = es(i) ? i : i.getParentOrThrow();
		return e ? s.selectStart() : s.selectEnd(), true;
	}
	function Wr(t, e, n) {
		if (Si(t, "extend", e, n)) return;
		const o = Ii(),
			r = Pc(Tc(o));
		if (!r || "function" != typeof r.modify) return;
		const i = o._blockCursorElement,
			s = o._rootElement,
			l = t.anchor,
			c = t.focus.getNode();
		null === s || null === i || !es(c) || c.isInline() || c.canBeEmpty() || Fc(i, o, s);
		const a = t => {
				const e = t.getNode(),
					n = o.getElementByKey(t.key);
				return null !== n && "text" === t.type && gr(e) ? pa(e, n, o) : n;
			},
			u = l.getNode(),
			f = a(l);
		if (null === f) return;
		const d = l.offset,
			h = t.isCollapsed(),
			g = t.focus,
			_ = h ? f : a(g);
		if (null === _) return;
		const p = g.offset;
		if (ai(r, _, p, _, p), Br(r, "move", e ? "backward" : "forward", n, s), 0 === r.rangeCount) return;
		const y = $c(r, s) || r.getRangeAt(0),
			m = y.startContainer,
			x = y.startOffset;
		if (h && "character" === n && "text" === l.type && gr(u) && u.isUnmergeable()) {
			if (d === (e ? 0 : u.getTextContentSize())) {
				const n = ku(u, e ? "previous" : "next").getNodeAtCaret();
				if (gr(n)) {
					const o = e ? n.getTextContentSize() - 1 : 1;
					return t.focus.set(n.__key, o, "text"), void (t.dirty = true);
				}
			}
		}
		if (h && "character" === n && "text" === l.type) {
			const n = e ? 0 : u.getTextContentSize(),
				o = m === f ? x : d !== n ? n : -1;
			if (o >= 0) return void (o !== d && (t.focus.set(l.key, o, "text"), t.dirty = true));
		}
		const [C, S, v, T] = e ? [m, x, f, d] : [f, d, m, x],
			k = ss(u) ? u : bc(u);
		t.applyDOMRange({
			collapsed: false,
			endContainer: v,
			endOffset: T,
			startContainer: C,
			startOffset: S
		}), t.dirty = true, !Rr(t, e, k) && e && Kr(t), "lineboundary" === n && Si(t, "extend", e, n, "decorators");
	}
	const $r = (() => {
		try {
			const t = new RegExp("\\p{Emoji}", "u"),
				e = t.test.bind(t);
			if (e("\u2764\ufe0f") && e("#\ufe0f\u20e3") && e("\u{1f44d}")) return e;
		} catch (t) {}
		return () => false;
	})();
	function Ur(t, e, n) {
		const o = t,
			r = o.getTextContent().split(/(?=\s)/g),
			i = r.length;
		let s = 0,
			l = 0;
		for (let t = 0; t < i; t++) {
			const o = t === i - 1;
			if (l = s, s += r[t].length, e && s === n || s > n || o) {
				r.splice(t, 1), o && (l = void 0);
				break;
			}
		}
		const c = r.join("").trim();
		"" === c ? o.remove() : (o.setTextContent(c), o.select(l, l));
	}
	function Hr(e, n, o, r) {
		let i,
			s = n,
			l = false;
		if (na(e)) {
			let c = false;
			const a = e.childNodes,
				u = a.length,
				f = r._blockCursorElement;
			s === u && u > 0 && (c = true, s = u - 1), void 0 !== Kl(e, r) || Ea(e, r) || (l = true);
			let d = a[s],
				h = false;
			if (d === f) d = a[s + 1], h = true;else if (null !== f) {
				const t = f.parentNode;
				if (e === t) {
					n > Array.prototype.indexOf.call(t.children, f) && s--;
				}
			}
			if (i = Jl(d), gr(i)) s = Nu(i, c ? "next" : "previous");else {
				let a = Jl(e);
				if (null === a) return null;
				if (es(a)) {
					const l = r.getElementByKey(a.getKey());
					null === l && t(214);
					const u = da(a, l, r);
					[a, s] = u.resolveChildIndex(a, l, e, n), es(a) || t(215), c && s >= a.getChildrenSize() && (s = Math.max(0, a.getChildrenSize() - 1));
					let f = a.getChildAtIndex(s);
					if (es(f) && function (t, e, n) {
						const o = t.getParent();
						return null === n || null === o || !o.canBeEmpty() || o !== n.getNode();
					}(f, 0, o)) {
						const t = c ? f.getLastDescendant() : f.getFirstDescendant();
						null === t ? a = f : (f = t, a = es(f) ? f : f.getParentOrThrow()), s = 0;
					}
					gr(f) ? (i = f, a = null, s = Nu(f, c ? "next" : "previous")) : f !== a && c && !h && (es(a) || t(216), s = Math.min(a.getChildrenSize(), s + 1));
				} else {
					const t = Ua(a),
						o = null !== t ? t : a,
						i = o.getIndexWithinParent(),
						l = r.getElementByKey(a.getKey());
					let c = "after";
					if (null !== l && Jl(e) === a) {
						const t = da(a, l, r);
						t.element !== l ? c = t.resolveLeafPosition(l, e, n) : 0 === n && rs(a) && (c = "before");
					}
					s = "before" === c ? i : i + 1, a = o.getParentOrThrow();
				}
				if (es(a)) return [Cr(a.__key, s, "element"), l];
			}
		} else i = Jl(e);
		return gr(i) ? [Cr(i.__key, Nu(i, s, "clamp"), "text"), l] : null;
	}
	function jr(t, e, n) {
		const o = t.offset,
			r = t.getNode();
		if (0 === o) {
			const o = r.getPreviousSibling(),
				i = r.getParent();
			if (e) {
				if ((n || !e) && null === o && es(i) && i.isInline()) {
					const e = i.getPreviousSibling();
					gr(e) && t.set(e.__key, e.getTextContent().length, "text");
				}
			} else es(o) && !n && o.isInline() ? t.set(o.__key, o.getChildrenSize(), "element") : gr(o) && !r.isUnmergeable() && t.set(o.__key, o.getTextContent().length, "text");
		} else if (o === r.getTextContent().length) {
			const o = r.getNextSibling(),
				i = r.getParent();
			if (e && es(o) && o.isInline()) t.set(o.__key, 0, "element");else if ((n || e) && null === o && es(i) && i.isInline() && !i.canInsertTextAfter() && i.getTextContentSize() > 1) {
				const e = i.getNextSibling();
				gr(e) && t.set(e.__key, 0, "text");
			}
		}
	}
	function Jr(t) {
		const e = Il(t.key);
		return null === e ? null : ja(e);
	}
	function Vr(t, e, n) {
		const o = Jr(t),
			r = Jr(e);
		if (o === r || null !== o && null !== r && o.is(r)) return false;
		const i = n(o, r);
		if (null !== o) return es(o) ? e.set(o.getKey(), i ? o.getChildrenSize() : 0, "element") : e.set(o.getKey(), i ? o.getTextContentSize() : 0, "text"), true;
		const s = Ua(r);
		if (null === s) return false;
		const l = s.getParent();
		if (null === l) return false;
		const c = s.getIndexWithinParent();
		return e.set(l.getKey(), i ? c + 1 : c, "element"), true;
	}
	function qr(t) {
		const e = Vr(t.anchor, t.focus, (e, n) => function (t, e, n, o) {
			if (null !== n && null !== o) {
				const t = Ua(n),
					e = Ua(o);
				if (null !== t && t.is(e)) {
					for (const e of Va(t).values()) {
						if (e === n.getKey()) return true;
						if (e === o.getKey()) return false;
					}
					return true;
				}
				return null === t || null === e || t.isBefore(e);
			}
			if (null !== n) {
				const t = Ua(n),
					o = Il(e.key);
				return null === t || null === o || !(!t.is(o) && !t.isParentOf(o)) || t.isBefore(o);
			}
			const r = Ua(o),
				i = Il(t.key);
			return null !== r && null !== i && !r.is(i) && !r.isParentOf(i) && i.isBefore(r);
		}(t.anchor, t.focus, e, n));
		return e && (t.dirty = true), e;
	}
	function Yr(t, e, n, o, r, i) {
		if (null === t || null === n || !yl(r, t, n)) return null;
		const s = Hr(t, e, Er(i) ? i.anchor : null, r);
		if (null === s) return null;
		const l = Hr(n, o, Er(i) ? i.focus : null, r);
		if (null === l) return null;
		const [c, a] = s,
			[u, f] = l;
		if ("element" === c.type && "element" === u.type) {
			const e = Jl(t),
				o = Jl(n);
			if (rs(e) && rs(o)) return null;
		}
		const d = r._slotsUsed && Vr(c, u, () => 0 !== (t.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING));
		return function (t, e) {
			if ("text" === t.type && "text" === e.type) {
				const n = t.isBefore(e),
					o = t.is(e);
				jr(t, n, o), jr(e, !n, o), o && e.set(t.key, t.offset, t.type);
			}
		}(c, u), [c, u, a || f || d];
	}
	function Gr(t) {
		return es(t) && !t.isInline();
	}
	function Xr(t, e, n, o, r, i) {
		const s = Fi(),
			l = new Mr(Cr(t, e, r), Cr(n, o, i), 0, "");
		return l.dirty = true, s._selection = l, l;
	}
	function Qr() {
		const t = Cr("root", 0, "element"),
			e = Cr("root", 0, "element");
		return new Mr(t, e, 0, "");
	}
	function Zr() {
		return new br(new Set());
	}
	function ti(t, e) {
		return ei(null, t, e, null);
	}
	function ei(t, e, n, o) {
		const r = n._window;
		if (null === r) return null;
		const i = o || r.event,
			s = i ? i.type : void 0,
			l = "selectionchange" === s,
			c = !at$5 && (l || "beforeinput" === s || "compositionstart" === s || "compositionend" === s || "click" === s && i && 3 === i.detail || "drop" === s || void 0 === s);
		let a, u, f, d;
		if (Er(t) && !c) return t.clone();
		{
			if (null === e) return null;
			const o = Hc(e, n._rootElement);
			if (a = o.anchorNode, u = o.focusNode, f = o.anchorOffset, d = o.focusOffset, (l || void 0 === s) && Er(t) && !yl(n, a, u)) return t.clone();
		}
		const h = Yr(a, f, u, d, n, t);
		if (null === h) return null;
		const [g, _, p] = h;
		let y = 0,
			m = "";
		if (Er(t)) {
			const e = t.anchor;
			if (g.key === e.key) y = t.format, m = t.style;else {
				const t = g.getNode();
				gr(t) ? (y = t.getFormat(), m = t.getStyle()) : es(t) && (y = t.getTextFormat(), m = t.getTextStyle());
			}
		}
		const x = new Mr(g, _, y, m);
		return p && (x.dirty = true), x;
	}
	function ni() {
		return Fi()._selection;
	}
	function oi() {
		return Ii()._editorState._selection;
	}
	function ri(t, e) {
		const n = e.__key;
		return t.anchor.key === n || t.focus.key === n;
	}
	function ii(t, e, n, o = 1) {
		if (!ri(t, e)) return;
		const r = t.anchor,
			i = t.focus,
			s = e.__key;
		if (t.isCollapsed()) {
			const e = r.offset;
			if (n <= e && o > 0 || n < e && o < 0) {
				const n = Math.max(0, e + o);
				r.set(s, n, "element"), i.set(s, n, "element"), si(t);
			}
		} else {
			const l = t.isBackward(),
				c = l ? i : r,
				a = c.getNode(),
				u = l ? r : i,
				f = u.getNode();
			if (e.is(a)) {
				const t = c.offset;
				(n <= t && o > 0 || n < t && o < 0) && c.set(s, Math.max(0, t + o), "element");
			}
			if (e.is(f)) {
				const t = u.offset;
				(n <= t && o > 0 || n < t && o < 0) && u.set(s, Math.max(0, t + o), "element");
			}
		}
		si(t);
	}
	function si(t) {
		const e = t.anchor,
			n = e.offset,
			o = t.focus,
			r = o.offset,
			i = e.getNode(),
			s = o.getNode();
		if (t.isCollapsed()) {
			if (!es(i)) return;
			const t = i.getChildrenSize(),
				r = n >= t,
				s = r ? i.getChildAtIndex(t - 1) : i.getChildAtIndex(n);
			if (gr(s)) {
				let t = 0;
				r && (t = s.getTextContentSize()), e.set(s.__key, t, "text"), o.set(s.__key, t, "text");
			}
			return;
		}
		if (es(i)) {
			const t = i.getChildrenSize(),
				o = n >= t,
				r = o ? i.getChildAtIndex(t - 1) : i.getChildAtIndex(n);
			if (gr(r)) {
				let t = 0;
				o && (t = r.getTextContentSize()), e.set(r.__key, t, "text");
			}
		}
		if (es(s)) {
			const t = s.getChildrenSize(),
				e = r >= t,
				n = e ? s.getChildAtIndex(t - 1) : s.getChildAtIndex(r);
			if (gr(n)) {
				let t = 0;
				e && (t = n.getTextContentSize()), o.set(n.__key, t, "text");
			}
		}
	}
	function li(t, e, n, o, r) {
		let i = null,
			s = 0,
			l = null;
		null !== o ? (i = o.__key, gr(o) ? (s = o.getTextContentSize(), l = "text") : es(o) && (s = o.getChildrenSize(), l = "element")) : null !== r && (i = r.__key, gr(r) ? l = "text" : es(r) && (l = "element")), null !== i && null !== l ? t.set(i, s, l) : (s = e.getIndexWithinParent(), -1 === s && (s = n.getChildrenSize()), t.set(n.__key, s, "element"));
	}
	function ci(t, e, n, o, r) {
		"text" === t.type ? t.set(n, t.offset + (e ? 0 : r), "text") : t.offset > o.getIndexWithinParent() && t.set(t.key, t.offset - 1, "element");
	}
	function ai(t, e, n, o, r) {
		try {
			t.setBaseAndExtent(e, n, o, r);
		} catch (t) {}
	}
	function ui(t, e, n) {
		const o = _c(t, e.getKey());
		if (es(e)) {
			const r = da(e, o, t);
			return [r.element, n + r.getFirstChildOffset()];
		}
		return [o, n];
	}
	function fi(t, e, n, o, r, s) {
		const l = s.getRootNode(),
			c = bl(l) || Lc(l) ? Gc(l) : null;
		if (r.has(Bo) && c !== s || null !== c && _l(c, c)) return;
		const a = Hc(o, s);
		let u;
		if (!Er(e)) return void (null !== t && yl(n, a.anchorNode, a.focusNode) && o.removeAllRanges());
		const f = e.anchor,
			d = e.focus,
			h = f.getNode(),
			g = d.getNode(),
			[_, p] = ui(n, h, f.offset),
			[y, m] = ui(n, g, d.offset),
			x = e.format,
			C = e.style,
			S = e.isCollapsed();
		let v = _,
			T = y,
			k = false;
		if ("text" === f.type ? (v = gr(h) ? pa(h, _, n) : null, k = h.getFormat() !== x || h.getStyle() !== C) : Er(t) && "text" === t.anchor.type && (k = true), "text" === d.type && (T = gr(g) ? pa(g, y, n) : null), null !== v && null !== T) {
			if (S && (null === t || k || Er(t) && (t.format !== x || t.style !== C)) && function (t, e, n, o, r, i) {
				t._inputState.collapsedSelectionFormat = {
					format: e,
					key: r,
					offset: o,
					style: n,
					timeStamp: i
				};
			}(n, x, C, p, f.key, performance.now()), ("Range" !== o.type || !S) && a.anchorOffset === p && a.focusOffset === m && a.anchorNode === v && a.focusNode === T) {
				if (null === c || !s.contains(c)) {
					const t = null !== c ? xl(c) : null;
					null !== t && t !== n || r.has(Uo) || s.focus({
						preventScroll: true
					});
				}
				if ("element" !== f.type) return;
			}
			if (ai(o, v, p, T, m), i && e.isCollapsed() && null !== s && !r.has(Uo)) {
				const t = Yc(s);
				if (null === t || !s.contains(t)) {
					const t = Gc(s.ownerDocument),
						e = null !== t ? xl(t) : null;
					null !== e && e !== n || s.focus({
						preventScroll: true
					});
				}
			}
			if (!r.has(Wo) && e.isCollapsed() && null !== s && s === Yc(s)) {
				const t = Er(e) && "element" === e.anchor.type ? v.childNodes[p] || null : (void 0 === u && (u = Uc(o, s)), u);
				if (null !== t) {
					let e;
					if (kl(t)) {
						const n = t.ownerDocument.createRange();
						n.selectNode(t), e = n.getBoundingClientRect();
					} else e = t.getBoundingClientRect();
					!function (t, e, n) {
						const o = yc(n),
							r = vc(o);
						if (null === o || null === r) return;
						const i = n.getBoundingClientRect();
						if (e.bottom < i.top) return;
						let {
								top: s,
								bottom: l
							} = e,
							c = 0,
							a = 0,
							u = n;
						for (; null !== u;) {
							const e = u === o.body;
							if (e) {
								const e = r.visualViewport;
								if (e) {
									const t = e.offsetTop;
									c = t, a = t + e.height;
								} else c = 0, a = Tc(t).innerHeight;
								const n = r.getComputedStyle(o.documentElement),
									i = parseFloat(n.scrollPaddingTop),
									s = parseFloat(n.scrollPaddingBottom);
								isFinite(i) && (c += i), isFinite(s) && (a -= s);
							} else {
								const t = u === n ? i : u.getBoundingClientRect();
								c = t.top, a = t.bottom;
							}
							let f = 0;
							if (s < c ? f = -(c - s) : l > a && (f = l - a), 0 !== f) if (e) r.scrollBy(0, f);else {
								const t = u.scrollTop;
								u.scrollTop += f;
								const e = u.scrollTop - t;
								s -= e, l -= e;
							}
							if (e) break;
							u = pc(u);
						}
					}(n, e, s);
				}
			}
			!function (t, e, n, o, r) {
				const i = t._inputState;
				i.isSelectionChangeFromDOMUpdate = true, i.selectionChangeFromDOMUpdatePoints = void 0 !== e && void 0 !== n && void 0 !== o && void 0 !== r ? {
					anchorNode: e,
					anchorOffset: n,
					focusNode: o,
					focusOffset: r
				} : null;
			}(n, v, p, T, m);
		}
	}
	function di(t) {
		let e = ni() || oi();
		null === e && (e = $l().selectEnd()), e.insertNodes(t);
	}
	function hi(t, e) {
		for (const n of t.split(/(\r?\n|\t)/)) "\n" === n || "\r\n" === n ? e.linebreak() : "\t" === n ? e.tab() : "" !== n && e.text(n);
	}
	function gi(t) {
		const e = [];
		return hi(t, {
			linebreak: () => e.push(_s()),
			tab: () => e.push(yr()),
			text: t => e.push(hr(t))
		}), e;
	}
	function _i() {
		const t = ni();
		return null === t ? "" : t.getTextContent();
	}
	function pi(t) {
		const e = [];
		for (const n of t) ps(n) || (!es(n) && !rs(n) || n.isInline() ? e.push(n) : es(n) && e.push(...pi(n.getChildren())));
		return e;
	}
	function yi(e, n = false) {
		let o = e;
		e.isCollapsed() || o.removeText();
		const r = ni();
		Er(r) && (o = r), Er(o) || t(161);
		const i = o.anchor;
		let s = i.getNode(),
			l = i.offset;
		for (; !aa(s) && null === $a(s);) {
			const t = s;
			if ([s, l] = mi(s, l, n), t.is(s)) break;
		}
		return [s, l];
	}
	function mi(t, e, n = false) {
		const o = t.getParent();
		if (!o) {
			const t = Ws();
			return $l().append(t), t.select(), [$l(), 0];
		}
		if (gr(t)) {
			const n = t.splitText(e);
			if (0 === n.length) return [o, t.getIndexWithinParent()];
			const r = 0 === e ? 0 : 1;
			return [o, n[0].getIndexWithinParent() + r];
		}
		if (!es(t) || 0 === e) return [o, t.getIndexWithinParent()];
		const r = t.getChildAtIndex(e);
		if (r) {
			const o = new Mr(Cr(t.__key, e, "element"), Cr(t.__key, e, "element"), 0, ""),
				i = t.insertNewAfter(o);
			if (i) i.append(r, ...r.getNextSiblings());else if (n) return [t, e];
		}
		return [o, t.getIndexWithinParent() + 1];
	}
	function xi(t) {
		return ps(t) || kc(t) || gr(t) || t.isParentRequired();
	}
	function Ci(t) {
		const e = Ws();
		let n = null;
		for (let o = 0; o < t.length; o++) {
			const r = t[o];
			if (xi(r)) {
				if (null === n) {
					n = r.createParentElementNode(), e.append(n);
					const i = t[o + 1];
					if (ps(r) && (void 0 === i || !xi(i))) continue;
				}
				n.append(r);
			} else e.append(r), n = null;
		}
		return e;
	}
	function Si(t, e, n, o, r = "decorators-and-blocks") {
		if ("move" === e && "character" === o && !t.isCollapsed()) {
			const [e, o] = n === t.isBackward() ? [t.focus, t.anchor] : [t.anchor, t.focus];
			return o.set(e.key, e.offset, e.type), true;
		}
		const i = Cs(t.focus, n ? "previous" : "next"),
			s = "lineboundary" === o,
			l = "move" === e;
		let c = i,
			a = "decorators-and-blocks" === r,
			u = false;
		if (!Os(c)) {
			for (const t of c) {
				a = false;
				const {
					origin: e
				} = t;
				if (rs(e)) {
					if (e.isIsolated()) {
						u = true;
						break;
					}
					if (c = t, s && e.isInline()) continue;
				}
				break;
			}
			if (u) return true;
			if (a) for (const t of Iu(i).iterNodeCarets("extend" === e ? "shadowRoot" : "root")) {
				if (Cu(t)) t.origin.isInline() || (c = t);else {
					if (es(t.origin)) continue;
					rs(t.origin) && !t.origin.isInline() && (c = t);
				}
				break;
			}
		}
		if (c === i) return false;
		if (l && !s && rs(c.origin) && c.origin.isKeyboardSelectable()) {
			const t = Zr();
			return t.add(c.origin.getKey()), Hl(t), true;
		}
		return c = Ms(c), l && Ss(t.anchor, c), Ss(t.focus, c), a || !s;
	}
	let vi = null,
		Ti = null,
		ki = false,
		bi = false,
		Ni = false;
	const wi = new Set();
	let Ei = 0;
	const Mi = {
		characterData: true,
		childList: true,
		subtree: true
	};
	function Oi() {
		return ki || null !== vi && vi._readOnly;
	}
	function Ai() {
		ki && t(13);
	}
	function Di() {
		Ei > 99 && t(14);
	}
	function Fi() {
		return null === vi && t(195, zi()), vi;
	}
	function Pi(t) {
		null !== Fi() && null === Ti && (Ti = t), Ti !== t && e(378);
	}
	function Ii() {
		return null === Ti && t(337, zi()), Ti;
	}
	function Li() {
		Ii()._dirtyType = 2;
	}
	function zi() {
		let t = 0;
		const e = new Set(),
			n = sl.version;
		if ("undefined" != typeof window) for (const o of Bc(document)) {
			const r = Cl(o);
			if (ml(r)) t++;else if (r) {
				let t = String(r.constructor.version || "<0.17.1");
				t === n && (t += " (separately built, likely a bundler configuration issue)"), e.add(t);
			}
		}
		let o = ` Detected on the page: ${t} compatible editor(s) with version ${n}`;
		return e.size && (o += ` and incompatible editors with versions ${Array.from(e).join(", ")}`), o;
	}
	function Ki() {
		return Ti;
	}
	function Bi(t, e, n) {
		const o = e.__type,
			r = dl(t, o);
		let i = n.get(o);
		void 0 === i && (i = Array.from(r.transforms), n.set(o, i));
		const s = i.length;
		for (let t = 0; t < s && (i[t](e), e.isAttached()); t++);
	}
	function Ri(t, e) {
		return void 0 !== t && t.__key !== e && t.isAttached();
	}
	function Wi(t, e) {
		if (!e) return;
		const n = t._updateTags;
		let o = e;
		Array.isArray(e) || (o = [e]);
		for (const t of o) n.add(t);
	}
	function $i(t) {
		return Ui(t, Ii()._nodes);
	}
	function Ui(e, n) {
		const o = e.type,
			r = n.get(o);
		void 0 === r && t(17, o);
		const i = r.klass;
		e.type !== i.getType() && t(18, i.name);
		const s = i.importJSON(e),
			l = e.children;
		if (es(s) && Array.isArray(l)) for (let t = 0; t < l.length; t++) {
			const e = Ui(l[t], n);
			s.append(e);
		}
		const c = e.$slots;
		if (c) {
			Ra(s) || t(379, i.name);
			for (const t in c) {
				iu(s, t, Ui(c[t], n));
			}
		}
		return s;
	}
	function Hi(t, e, n) {
		const o = vi,
			r = ki,
			i = Ti;
		vi = e, ki = true, Ti = t;
		try {
			return n();
		} finally {
			vi = o, ki = r, Ti = i;
		}
	}
	function ji(t, e) {
		const n = Ni;
		Ni = true;
		try {
			!function (t, e) {
				const n = t._pendingEditorState,
					o = t._rootElement,
					r = t._headless || null === o;
				if (null === n) return void (!t._updating && t._deferred.length > 0 && qi(t, t._deferred));
				const i = t._editorState,
					s = i._selection,
					l = n._selection,
					c = 0 !== t._dirtyType,
					a = vi,
					u = ki,
					f = Ti,
					d = t._updating,
					h = t._observer;
				let g = null;
				if (t._pendingEditorState = null, t._editorState = n, !r && c && null !== h) {
					Ti = t, vi = n, ki = !1, t._updating = !0;
					try {
						const e = t._dirtyType,
							o = t._dirtyElements,
							r = t._dirtyLeaves;
						h.disconnect(), g = Ke$2(i, n, t, e, o, r);
					} catch (e) {
						if (e instanceof Error && t._onError(e), bi) throw e;
						return tl(t, null, o, n), mt$7(t), t._dirtyType = 2, bi = !0, ji(t, i), void (bi = !1);
					} finally {
						h.observe(o, Mi), t._updating = d, vi = a, ki = u, Ti = f;
					}
				}
				n._readOnly || (n._readOnly = !0);
				const _ = t._dirtyLeaves,
					p = t._dirtyElements,
					y = t._normalizedNodes,
					m = t._updateTags;
				c && (t._dirtyType = 0, t._cloneNotNeeded.clear(), t._dirtyLeaves = new Set(), t._dirtyElements = new Map(), t._normalizedNodes = new Set());
				t._updateTags = new Set(), function (t, e) {
					const n = t._decorators;
					let o = t._pendingDecorators || n;
					const r = e._nodeMap;
					let i;
					for (i in o) r.has(i) || (o === n && (o = Rl(t)), delete o[i]);
				}(t, n);
				const x = r ? null : Pc(Tc(t));
				if (t._editable && null !== x && (c || null === l || l.dirty || !l.is(s)) && null !== o && !m.has($o)) {
					Ti = t, vi = n;
					try {
						if (null !== h && h.disconnect(), c || null === l || l.dirty) {
							const e = t._blockCursorElement;
							null !== e && Fc(e, t, o), fi(s, l, t, x, m, o);
						}
						!function (t, e, n) {
							let o = t._blockCursorElement;
							if (Er(n) && n.isCollapsed() && "element" === n.anchor.type && e.contains(Yc(e))) {
								const r = n.anchor,
									i = r.getNode(),
									s = r.offset;
								let l = !1,
									c = null;
								if (s === i.getChildrenSize()) {
									Dc(i.getChildAtIndex(s - 1)) && (l = !0);
								} else {
									const e = i.getChildAtIndex(s);
									null !== e && Dc(e) && (l = !0, c = t.getElementByKey(e.__key));
								}
								if (l) {
									const n = da(i, t.getElementByKey(i.__key), t).element;
									return null === o && (t._blockCursorElement = o = function (t) {
										const e = t.theme,
											n = Wc().createElement("div");
										n.contentEditable = "false", n.setAttribute("data-lexical-cursor", "true");
										let o = e.blockCursor;
										if (void 0 !== o) {
											if ("string" == typeof o) {
												const t = Yu(o);
												o = e.blockCursor = t;
											}
											void 0 !== o && n.classList.add(...o);
										}
										return n;
									}(t._config)), e.style.caretColor = "transparent", void (null === c ? n.appendChild(o) : n.insertBefore(o, c));
								}
							}
							null !== o && Fc(o, t, e);
						}(t, o, l);
					} finally {
						null !== h && h.observe(o, Mi), Ti = f, vi = a;
					}
				}
				null !== g && function (t, e, n, o, r) {
					const i = Array.from(t._listeners.mutation),
						s = i.length;
					for (let t = 0; t < s; t++) {
						const [s, l] = i[t];
						for (const t of l) {
							const i = e.get(t);
							void 0 !== i && s(i, {
								dirtyLeaves: o,
								prevEditorState: r,
								updateTags: n
							});
						}
					}
				}(t, g, m, _, i);
				Er(l) || null === l || null !== s && s.is(l) || t.dispatchCommand(We$2);
				const C = t._pendingDecorators;
				null !== C && (t._decorators = C, t._pendingDecorators = null, Ji("decorator", t, !0, C));
				if (function (t, e, n) {
					const o = Wl(e),
						r = Wl(n);
					o !== r && Ji("textcontent", t, !0, r);
				}(t, e || i, n), Ji("update", t, !0, {
					dirtyElements: p,
					dirtyLeaves: _,
					editorState: n,
					mutatedNodes: g,
					normalizedNodes: y,
					prevEditorState: e || i,
					tags: m
				}), !d) {
					qi(t, t._deferred);
				}
				!function (t) {
					const e = t._updates;
					if (0 === e.length) return void (t._cascadeCount = 0);
					if (function (t) {
						if (wi.has(t)) return;
						wi.add(t), setTimeout(() => {
							wi.delete(t), t._cascadeCount = 0;
						}, 0);
					}(t), t._cascadeCount++ > 99) return t._updates = [], t._cascadeCount = 0, void t._onWarn(new Error(`One or more update listeners are endlessly enqueueing more updates. May have encountered infinite recursion caused by update listeners that trigger additional updates without a stop condition. Editor namespace: ${t._config.namespace}`));
					const n = e.shift();
					if (n) {
						const [e, o] = n;
						Xi(t, e, o);
					}
				}(t);
			}(t, e);
		} finally {
			Ni = n;
		}
	}
	function Ji(t, e, n, ...o) {
		const r = e._updating;
		e._updating = n;
		try {
			const n = e._listeners[t],
				r = Array.from(n);
			for (const [t, e] of r) {
				e && e();
				const r = t(...o),
					i = "function" == typeof r ? r : void 0;
				n.has(t) ? n.set(t, i) : i && i();
			}
		} finally {
			e._updating = r;
		}
	}
	function Vi(t, e, n, o) {
		const r = ql(t);
		let i;
		if (!Ni) for (let t = 0; t < r.length; t++) r[t]._updating || (r[t]._cascadeCount = 0);
		for (let t = 4; t >= 0; t--) for (let s = 0; s < r.length; s++) {
			const l = r[s];
			if (s > 0 && l._updating) {
				i = l;
				break;
			}
			const c = l._commands.get(e);
			if (void 0 !== c) {
				const e = c[t];
				if (e.size > 0) {
					let t = false;
					if (Qi(l, () => {
						for (const r of e) if (r(n, o)) return void (t = true);
					}), t) return t;
				}
			}
		}
		return i && i.update(() => {
			Vi(i, e, n, o);
		}), false;
	}
	function qi(t, e) {
		if (t._deferred = [], 0 !== e.length) {
			const n = t._updating;
			t._updating = true;
			try {
				for (let t = 0; t < e.length; t++) e[t]();
			} finally {
				t._updating = n;
			}
		}
	}
	function Yi(e, n) {
		const o = e._updates;
		let r = n || false;
		for (; 0 !== o.length;) {
			const n = o.shift();
			if (n) {
				const [o, i] = n,
					s = e._pendingEditorState;
				let l;
				void 0 !== i && (l = i.onUpdate, i.skipTransforms && (r = true), i.discrete && (null === s && t(191), s._flushSync = true), l && e._deferred.push(l), Wi(e, i.tag)), null == s ? Xi(e, o, i) : o();
			}
		}
		return r;
	}
	function Gi() {
		const t = Fi();
		Ai(), t._flushSync = true;
	}
	function Xi(e, n, o) {
		const r = e._updateTags;
		let i,
			s = false,
			l = false;
		void 0 !== o && (i = o.onUpdate, Wi(e, o.tag), s = o.skipTransforms || false, l = o.discrete || false), i && e._deferred.push(i);
		const c = e._editorState;
		let a = e._pendingEditorState,
			u = false;
		(null === a || a._readOnly) && (a = e._pendingEditorState = ls(a || c), u = true), a._flushSync = l;
		const f = vi,
			d = ki,
			h = Ti,
			g = e._updating;
		vi = a, ki = false, e._updating = true, Ti = e;
		const _ = e._headless || null === e.getRootElement();
		cl(null);
		try {
			u && (_ ? null !== c._selection && (a._selection = c._selection.clone()) : a._selection = function (t, e) {
				const n = t.getEditorState()._selection,
					o = Pc(Tc(t));
				return Er(n) || null == n ? ei(n, o, t, e) : n.clone();
			}(e, o && o.event || null));
			const r = e._compositionKey;
			n(), s = Yi(e, s), function (t, e) {
				const n = e.getEditorState()._selection,
					o = t._selection;
				if (Er(o)) {
					const t = o.anchor,
						e = o.focus;
					let r;
					if ("text" === t.type && (r = t.getNode(), r.selectionTransform(n, o)), "text" === e.type) {
						const t = e.getNode();
						r !== t && t.selectionTransform(n, o);
					}
				}
			}(a, e), 0 !== e._dirtyType && (s ? function (t, e) {
				const n = e._dirtyLeaves,
					o = t._nodeMap;
				for (const t of n) {
					const e = o.get(t);
					gr(e) && e.isAttached() && e.isSimpleText() && !e.isUnmergeable() && Kt$5(e);
				}
			}(a, e) : function (t, e) {
				const n = e._dirtyLeaves,
					o = e._dirtyElements,
					r = t._nodeMap,
					i = Pl(),
					s = new Map();
				let l = n,
					c = l.size,
					a = o,
					u = a.size;
				for (; c > 0 || u > 0;) {
					if (c > 0) {
						e._dirtyLeaves = new Set();
						for (const t of l) {
							const o = r.get(t);
							gr(o) && o.isAttached() && o.isSimpleText() && !o.isUnmergeable() && Kt$5(o), void 0 !== o && Ri(o, i) && Bi(e, o, s), n.add(t);
						}
						if (l = e._dirtyLeaves, c = l.size, c > 0) {
							Ei++;
							continue;
						}
					}
					e._dirtyLeaves = new Set(), e._dirtyElements = new Map(), a.delete("root") && a.set("root", !0);
					for (const t of a) {
						const n = t[0],
							l = t[1];
						if (o.set(n, l), !l) continue;
						const c = r.get(n);
						void 0 !== c && Ri(c, i) && Bi(e, c, s);
					}
					l = e._dirtyLeaves, c = l.size, a = e._dirtyElements, u = a.size, Ei++;
				}
				e._dirtyLeaves = n, e._dirtyElements = o;
			}(a, e), Yi(e), function (t, e, n, o) {
				const r = t._nodeMap,
					i = e._nodeMap,
					s = [];
				for (const [t] of o) {
					const e = i.get(t);
					void 0 !== e && (e.isAttached() || (es(e) && ct$5(e, t, r, i, s, o), r.has(t) || o.delete(t), s.push(t)));
				}
				for (const t of n) {
					const e = i.get(t);
					void 0 === e || e.isAttached() || (Ra(e) && null !== e.__slots && ct$5(e, t, r, i, s, n), r.has(t) || n.delete(t), s.push(t));
				}
				for (const t of s) i.delete(t);
				const l = Ii(),
					c = l._compositionKey;
				null === c || i.has(c) || (l._compositionKey = null);
			}(c, a, e._dirtyLeaves, e._dirtyElements));
			r !== e._compositionKey && (a._flushSync = !0);
			const i = a._selection;
			if (Er(i)) {
				e._slotsUsed && qr(i);
				const n = a._nodeMap,
					o = i.anchor.key,
					r = i.focus.key;
				void 0 !== n.get(o) && void 0 !== n.get(r) || t(19);
			} else Or(i) && 0 === i._nodes.size && (a._selection = null);
		} catch (t) {
			return t instanceof Error && e._onError(t), e._pendingEditorState = c, e._dirtyType = 2, e._cloneNotNeeded.clear(), e._dirtyLeaves = new Set(), e._dirtyElements.clear(), void ji(e);
		} finally {
			vi = f, ki = d, Ti = h, e._updating = g, Ei = 0;
		}
		const p = 0 !== e._dirtyType || e._deferred.length > 0 || function (t, e) {
			const n = e.getEditorState()._selection,
				o = t._selection;
			if (null !== o) {
				if (o.dirty || !o.is(n)) return true;
			} else if (null !== n) return true;
			return false;
		}(a, e);
		p ? a._flushSync ? (a._flushSync = false, ji(e)) : u && gl(() => {
			ji(e);
		}) : (a._flushSync = false, u && (r.clear(), e._deferred = [], e._pendingEditorState = null));
	}
	function Qi(t, e, n) {
		Ti === t && void 0 === n ? Oi() ? Xi(t, e, n) : e() : Xi(t, e, n);
	}
	function Zi(t) {
		if (wc(t)) {
			let e = null;
			for (const n of t.getChildren()) e = n.isInline() ? (e || n.replace(n.createParentElementNode())).append(n) : null;
		}
	}
	class ts extends Do {
		$config() {
			return this.config(Symbol.for("ElementNode"), {
				$transform: Zi,
				extends: Do
			});
		}
		constructor(t) {
			super(t), this.__first = null, this.__last = null, this.__size = 0, this.__format = 0, this.__style = "", this.__indent = 0, this.__dir = null, this.__textFormat = 0, this.__textStyle = "", this.__slotHost = null, this.__slots = null;
		}
		afterCloneFrom(e) {
			super.afterCloneFrom(e), this.__key === e.__key && (this.__first = e.__first, this.__last = e.__last, this.__size = e.__size, this.__slotHost = e.__slotHost, null !== this.__slotHost && null !== this.__parent && t(384, this.__key, String(this.__slotHost), String(this.__parent)), this.__slots = e.__slots), this.__indent = e.__indent, this.__format = e.__format, this.__style = e.__style, this.__dir = e.__dir, this.__textFormat = e.__textFormat, this.__textStyle = e.__textStyle;
		}
		getFormat() {
			return this.getLatest().__format;
		}
		getFormatType() {
			const t = this.getFormat();
			return W$1[t] || "";
		}
		getStyle() {
			return this.getLatest().__style;
		}
		getIndent() {
			return this.getLatest().__indent;
		}
		getChildren() {
			const t = [];
			let e = this.getFirstChild();
			for (; null !== e;) t.push(e), e = e.getNextSibling();
			return t;
		}
		getChildrenKeys() {
			const t = [];
			let e = this.getFirstChild();
			for (; null !== e;) t.push(e.__key), e = e.getNextSibling();
			return t;
		}
		getChildrenSize() {
			return this.getLatest().__size;
		}
		isEmpty() {
			return 0 === this.getChildrenSize() && 0 === qa(this).length;
		}
		isDirty() {
			const t = Ii()._dirtyElements;
			return null !== t && t.has(this.__key);
		}
		isLastChild() {
			const t = this.getLatest(),
				e = this.getParentOrThrow().getLastChild();
			return null !== e && e.is(t);
		}
		getAllTextNodes() {
			const t = [];
			for (const e of qa(this)) {
				const n = Ya(this, e);
				if (es(n)) for (const e of n.getAllTextNodes()) t.push(e);
			}
			let e = this.getFirstChild();
			for (; null !== e;) {
				if (gr(e) && t.push(e), es(e)) for (const n of e.getAllTextNodes()) t.push(n);
				e = e.getNextSibling();
			}
			return t;
		}
		getFirstDescendant() {
			let t = this.getFirstChild();
			for (; es(t);) {
				const e = t.getFirstChild();
				if (null === e) break;
				t = e;
			}
			return t;
		}
		getLastDescendant() {
			let t = this.getLastChild();
			for (; es(t);) {
				const e = t.getLastChild();
				if (null === e) break;
				t = e;
			}
			return t;
		}
		getDescendantByIndex(t) {
			const e = this.getChildren(),
				n = e.length;
			if (t >= n) {
				const t = e[n - 1];
				return es(t) && t.getLastDescendant() || t || null;
			}
			const o = e[t];
			return es(o) && o.getFirstDescendant() || o || null;
		}
		getFirstChild() {
			const t = this.getLatest().__first;
			return null === t ? null : Il(t);
		}
		getFirstChildOrThrow() {
			const e = this.getFirstChild();
			return null === e && t(45, this.__key), e;
		}
		getLastChild() {
			const t = this.getLatest().__last;
			return null === t ? null : Il(t);
		}
		getLastChildOrThrow() {
			const e = this.getLastChild();
			return null === e && t(96, this.__key), e;
		}
		getChildAtIndex(t) {
			const e = this.getChildrenSize();
			let n, o;
			if (t < e / 2) {
				for (n = this.getFirstChild(), o = 0; null !== n && o <= t;) {
					if (o === t) return n;
					n = n.getNextSibling(), o++;
				}
				return null;
			}
			for (n = this.getLastChild(), o = e - 1; null !== n && o >= t;) {
				if (o === t) return n;
				n = n.getPreviousSibling(), o--;
			}
			return null;
		}
		getTextContent() {
			let t = nu(this);
			const e = this.getChildren(),
				n = e.length;
			for (let o = 0; o < n; o++) {
				const r = e[o];
				t += r.getTextContent(), es(r) && o !== n - 1 && !r.isInline() && (t += D$2);
			}
			return t;
		}
		getTextContentSize() {
			let t = function (t) {
				let e = 0;
				for (const n of qa(t)) {
					const o = Ya(t, n);
					null !== o && (e += o.getTextContentSize());
				}
				return e;
			}(this);
			const e = this.getChildren(),
				n = e.length;
			for (let o = 0; o < n; o++) {
				const r = e[o];
				t += r.getTextContentSize(), es(r) && o !== n - 1 && !r.isInline() && (t += 2);
			}
			return t;
		}
		getDirection() {
			return this.getLatest().__dir;
		}
		getTextFormat() {
			return this.getLatest().__textFormat;
		}
		hasFormat(t) {
			if ("" !== t) {
				const e = R$1[t];
				return 0 !== (this.getFormat() & e);
			}
			return false;
		}
		hasTextFormat(t) {
			const e = K$1[t];
			return 0 !== (this.getTextFormat() & e);
		}
		getFormatFlags(t, e) {
			return wl(this.getLatest().__textFormat, t, e);
		}
		getTextStyle() {
			return this.getLatest().__textStyle;
		}
		select(t, e) {
			Ai();
			const n = ni();
			let o = t,
				r = e;
			const i = this.getChildrenSize();
			if (!this.canBeEmpty()) if (0 === t && 0 === e) {
				const t = this.getFirstChild();
				if (gr(t) || es(t)) return t.select(0, 0);
			} else if (!(void 0 !== t && t !== i || void 0 !== e && e !== i)) {
				const t = this.getLastChild();
				if (gr(t) || es(t)) return t.select();
			}
			void 0 === o && (o = i), void 0 === r && (r = i);
			const s = this.__key;
			return Er(n) ? (n.anchor.set(s, o, "element"), n.focus.set(s, r, "element"), n.dirty = true, n) : Xr(s, o, s, r, "element", "element");
		}
		selectStart() {
			const t = this.getFirstDescendant();
			return t ? t.selectStart() : this.select();
		}
		selectEnd() {
			const t = this.getLastDescendant();
			return t ? t.selectEnd() : this.select();
		}
		clear() {
			const t = this.getWritable();
			return this.getChildren().forEach(t => t.remove()), t;
		}
		append(...t) {
			return this.splice(this.getChildrenSize(), 0, t);
		}
		setDirection(t) {
			const e = this.getWritable();
			return e.__dir = t, e;
		}
		setFormat(t) {
			return this.getWritable().__format = "" !== t && R$1[t] || 0, this;
		}
		setStyle(t) {
			return this.getWritable().__style = t || "", this;
		}
		setTextFormat(t) {
			const e = this.getWritable();
			return e.__textFormat = t, e;
		}
		setTextStyle(t) {
			const e = this.getWritable();
			return e.__textStyle = t, e;
		}
		setIndent(t) {
			return this.getWritable().__indent = t, this;
		}
		splice(e, n, o) {
			Oo(this) && t(324, this.__key, this.__type);
			const r = this.getChildrenSize(),
				i = this.getWritable();
			e + n <= r || t(226, String(e), String(n), String(r));
			for (const t of o);
			const s = i.__key,
				l = [],
				c = [];
			let a = this.getChildAtIndex(e + n),
				u = null,
				f = r - n + o.length;
			if (0 !== e) if (e === r) u = this.getLastChild();else {
				const t = this.getChildAtIndex(e);
				null !== t && (u = t.getPreviousSibling());
			}
			if (n > 0) {
				let e = null === u ? this.getFirstChild() : u.getNextSibling();
				for (let o = 0; o < n; o++) {
					null === e && t(100);
					const n = e.getNextSibling(),
						o = e.__key;
					Ol(e.getWritable()), c.push(o), e = n;
				}
			}
			let d = u;
			for (const e of o) {
				null !== d && e.is(d) && (u = d = d.getPreviousSibling()), null !== a && e.is(a) && (a = a.getNextSibling());
				const n = e.getWritable();
				n.__parent === s && f--, Ol(n);
				const o = e.__key;
				if (null === d) i.__first = o, n.__prev = null;else {
					const t = d.getWritable();
					t.__next = o, n.__prev = t.__key;
				}
				e.__key === s && t(76), n.__parent = s, l.push(o), d = e;
			}
			if (null === a) {
				if (null !== d) {
					d.getWritable().__next = null, i.__last = d.__key;
				}
			} else {
				const t = a.getWritable();
				if (null !== d) {
					const e = d.getWritable();
					t.__prev = d.__key, e.__next = a.__key;
				} else t.__prev = null;
			}
			if (i.__size = f, c.length) {
				const t = ni();
				if (Er(t)) {
					const e = new Set(c),
						n = new Set(l),
						{
							anchor: o,
							focus: r
						} = t;
					ns(o, e, n) && li(o, o.getNode(), this, u, a), ns(r, e, n) && li(r, r.getNode(), this, u, a), 0 !== f || this.canBeEmpty() || wc(this) || this.remove();
				}
			}
			return i;
		}
		getDOMSlot(t) {
			return new tt$4(t);
		}
		exportDOM(t) {
			const {
				element: e
			} = super.exportDOM(t);
			if (na(e)) {
				const t = this.getIndent();
				t > 0 && (e.style.paddingInlineStart = 40 * t + "px", e.setAttribute("data-lexical-indent", String(t)));
				const n = this.getDirection();
				n && (e.dir = n);
			}
			return {
				element: e
			};
		}
		exportJSON() {
			const t = {
					children: [],
					direction: this.getDirection(),
					format: this.getFormatType(),
					indent: this.getIndent(),
					...super.exportJSON()
				},
				e = this.getTextFormat(),
				n = this.getTextStyle();
			return 0 === e && "" === n || wc(this) || this.getChildren().some(gr) || (0 !== e && (t.textFormat = e), "" !== n && (t.textStyle = n)), t;
		}
		updateFromJSON(t) {
			return super.updateFromJSON(t).setFormat(t.format).setIndent(t.indent).setDirection(t.direction).setTextFormat(t.textFormat || 0).setTextStyle(t.textStyle || "");
		}
		insertNewAfter(t, e) {
			return null;
		}
		canIndent() {
			return true;
		}
		collapseAtStart(t) {
			return false;
		}
		excludeFromCopy(t) {
			return false;
		}
		canReplaceWith(t) {
			return true;
		}
		canInsertAfter(t) {
			return true;
		}
		canBeEmpty() {
			return true;
		}
		canInsertTextBefore() {
			return true;
		}
		canInsertTextAfter() {
			return true;
		}
		isInline() {
			return false;
		}
		isShadowRoot() {
			return false;
		}
		canMergeWith(t) {
			return false;
		}
		extractWithChild(t, e, n) {
			return false;
		}
		canMergeWhenEmpty() {
			return false;
		}
		reconcileObservedMutation(t, e) {
			const n = da(this, t, e);
			let o = n.getFirstChild();
			for (let t = this.getFirstChild(); t; t = t.getNextSibling()) {
				const r = e.getElementByKey(t.getKey());
				null !== r && (null == o ? (n.insertChild(r), o = r) : o !== r && n.replaceChild(r, o), o = o.nextSibling);
			}
		}
	}
	function es(t) {
		return t instanceof ts;
	}
	function ns(t, e, n) {
		let o = t.getNode();
		for (; o;) {
			const t = o.__key;
			if (e.has(t) && !n.has(t)) return true;
			o = o.getParent();
		}
		return false;
	}
	class os extends Do {
		constructor(t) {
			super(t), this.__slotHost = null, this.__slots = null;
		}
		afterCloneFrom(e) {
			super.afterCloneFrom(e), this.__key === e.__key && (this.__slotHost = e.__slotHost, null !== this.__slotHost && null !== this.__parent && t(383, this.__key, String(this.__slotHost), String(this.__parent)), this.__slots = e.__slots);
		}
		decorate(t, e) {
			return null;
		}
		isIsolated() {
			return false;
		}
		isInline() {
			return true;
		}
		isKeyboardSelectable() {
			return true;
		}
	}
	function rs(t) {
		return t instanceof os;
	}
	class is extends ts {
		$config() {
			return this.config("root", {
				extends: ts
			});
		}
		constructor() {
			super("root"), this.__cachedText = null;
		}
		getTopLevelElementOrThrow() {
			t(51);
		}
		getTextContent() {
			const t = this.__cachedText;
			return null === t || !Oi() && 0 !== Ii()._dirtyType ? super.getTextContent() : t;
		}
		remove() {
			t(52);
		}
		replace(e) {
			t(53);
		}
		insertBefore(e) {
			t(54);
		}
		insertAfter(e) {
			t(55);
		}
		updateDOM(t, e) {
			return false;
		}
		splice(e, n, o) {
			for (const e of o) es(e) || rs(e) || t(282);
			return super.splice(e, n, o);
		}
		static importJSON(t) {
			return $l().updateFromJSON(t);
		}
		collapseAtStart() {
			return true;
		}
	}
	function ss(t) {
		return t instanceof is;
	}
	function ls(t) {
		return new fs(st$5(t._nodeMap), null, t._slotsUsed);
	}
	function cs() {
		return new fs(new Map([["root", new is()]]), null, false);
	}
	function as(e) {
		const n = e.exportJSON(),
			o = e.constructor;
		if (n.type !== o.getType() && t(130, o.name), es(e)) {
			const r = n.children;
			Array.isArray(r) || t(59, o.name);
			const i = e.getChildren();
			for (let t = 0; t < i.length; t++) {
				const e = as(i[t]);
				r.push(e);
			}
		}
		const r = qa(e);
		if (r.length > 0) {
			const i = {};
			for (const n of r) {
				const r = Ya(e, n);
				null === r && t(366, o.name, n), i[n] = as(r);
			}
			n.$slots = i;
		}
		return n;
	}
	function us(t) {
		return t instanceof fs;
	}
	class fs {
		constructor(t, e = null, n = false) {
			this._nodeMap = t, this._selection = e || null, this._flushSync = false, this._readOnly = false, this._parsed = false, this._slotsUsed = n;
		}
		isEmpty() {
			return this._nodeMap.size <= 1 && null === this._selection;
		}
		read(t, e) {
			return Hi(e && e.editor || null, this, t);
		}
		clone(t) {
			const e = new fs(this._nodeMap, void 0 === t ? this._selection : t, this._slotsUsed);
			return e._readOnly = true, e._parsed = this._parsed, e;
		}
		toJSON() {
			return Hi(null, this, () => ({
				root: as($l())
			}));
		}
	}
	class ds extends ts {
		$config() {
			return this.config("artificial", {
				extends: ts
			});
		}
		createDOM(t) {
			return Wc().createElement("div");
		}
	}
	class hs extends Do {
		$config() {
			return this.config("linebreak", {
				importDOM: {
					br: t => ys(t) || ms(t) ? null : {
						conversion: gs,
						priority: 0
					}
				}
			});
		}
		getTextContent() {
			return "\n";
		}
		createDOM() {
			return Wc().createElement("br");
		}
		updateDOM() {
			return false;
		}
		isInline() {
			return true;
		}
	}
	function gs(t) {
		return {
			node: _s()
		};
	}
	function _s() {
		return Mc(new hs());
	}
	function ps(t) {
		return t instanceof hs;
	}
	function ys(t) {
		const e = t.parentElement;
		if (null !== e && ca(e)) {
			const n = e.firstChild;
			if (n === t || n.nextSibling === t && xs(n)) {
				const n = e.lastChild;
				if (n === t || n.previousSibling === t && xs(n)) return true;
			}
		}
		return false;
	}
	function ms(t) {
		const e = t.parentElement;
		if (null !== e && ca(e)) {
			const n = e.firstChild;
			if (n === t || n.nextSibling === t && xs(n)) return false;
			const o = e.lastChild;
			if (o === t || o.previousSibling === t && xs(o)) return true;
		}
		return false;
	}
	function xs(t) {
		return kl(t) && /^( |\t|\r?\n)+$/.test(t.textContent || "");
	}
	function Cs(e, n) {
		const {
				type: o,
				key: r,
				offset: i
			} = e,
			s = Ac(e.key);
		return "text" === o ? (gr(s) || t(266, s.getType(), r), bu(s, n, i)) : (es(s) || t(267, s.getType(), r), Ds(s, e.offset, n));
	}
	function Ss(e, n) {
		const {
				origin: o,
				direction: r
			} = n,
			i = "next" === r;
		yu(n) ? e.set(o.getKey(), n.offset, "text") : xu(n) ? gr(o) ? e.set(o.getKey(), Nu(o, r), "text") : e.set(o.getParentOrThrow().getKey(), o.getIndexWithinParent() + (i ? 1 : 0), "element") : (Cu(n) && es(o) || t(268), e.set(o.getKey(), i ? 0 : o.getChildrenSize(), "element"));
	}
	function vs(t) {
		const e = ni(),
			n = Er(e) ? e : Qr();
		return Ts(n, t), Hl(n), n;
	}
	function Ts(t, e) {
		Ss(t.anchor, e.anchor), Ss(t.focus, e.focus);
	}
	function ks(t) {
		const {
				anchor: e,
				focus: n
			} = t,
			o = Cs(e, "next"),
			r = Cs(n, "next"),
			i = Bu(o, r) <= 0 ? "next" : "previous";
		return zu(Pu(o, i), Pu(r, i));
	}
	function bs(t) {
		const {
				direction: e,
				origin: n
			} = t,
			o = ku(n, hu(e)).getNodeAtCaret();
		return o ? ku(o, e) : Eu(n.getParentOrThrow(), e);
	}
	function Ns(t, e = "root") {
		const n = [t];
		for (let o = Cu(t) ? t.getParentCaret(e) : t.getSiblingCaret(); null !== o; o = o.getParentCaret(e)) n.push(bs(o));
		return n;
	}
	function ws(t) {
		return !!t && t.origin.isAttached();
	}
	function Es(e, n = "removeEmptySlices") {
		if (e.isCollapsed()) return e;
		const o = "root",
			r = "next";
		let i = n;
		const s = As(e, r);
		let l = s.anchor.origin;
		for (; null !== l && !wc(l);) l = l.getParent();
		const c = es(l) ? l.getFirstChild() : null,
			a = Ns(s.anchor, o),
			u = Ns(s.focus.getFlipped(), o),
			f = new Set(),
			d = [];
		for (const t of s.iterNodeCarets(o)) if (Cu(t)) f.add(t.origin.getKey());else if (xu(t)) {
			const {
				origin: e
			} = t;
			es(e) && !f.has(e.getKey()) || d.push(e);
		}
		const h = new Set();
		for (const t of d) {
			const e = t.getParent();
			null === e || f.has(e.getKey()) || h.add(e), Ol(t);
		}
		for (const t of h) !t.canBeEmpty() && !wc(t) && t.isEmpty() && t.isAttached() && t.remove();
		for (const t of s.getTextSlices()) {
			if (!t) continue;
			const {
					origin: e
				} = t.caret,
				n = e.getTextContentSize(),
				o = bs(ku(e, r)),
				s = e.getMode();
			if (Math.abs(t.distance) === n && "removeEmptySlices" === i || "token" === s && 0 !== t.distance) o.remove();else if (0 !== t.distance) {
				i = "removeEmptySlices";
				let e = t.removeTextSlice();
				const n = t.caret.origin;
				if ("segmented" === s) {
					const t = e.origin,
						n = hr(t.getTextContent()).setStyle(t.getStyle()).setFormat(t.getFormat());
					o.replaceOrInsert(n), e = bu(n, r, e.offset);
				}
				n.is(a[0].origin) && (a[0] = e), n.is(u[0].origin) && (u[0] = e.getFlipped());
			}
		}
		let g, _;
		for (const t of a) if (ws(t)) {
			g = Ms(t);
			break;
		}
		for (const t of u) if (ws(t)) {
			_ = Ms(t);
			break;
		}
		const p = function (t, e, n) {
			if (!t || !e) return null;
			const o = t.getParentAtCaret(),
				r = e.getParentAtCaret();
			if (!o || !r) return null;
			const i = o.getParents().reverse();
			i.push(o);
			const s = r.getParents().reverse();
			s.push(r);
			const l = Math.min(i.length, s.length);
			let c;
			for (c = 0; c < l && i[c] === s[c]; c++);
			const a = (t, e) => {
					let n;
					for (let o = c; o < t.length; o++) {
						const r = t[o];
						if (wc(r)) return;
						!n && e(r) && (n = r);
					}
					return n;
				},
				u = a(i, aa),
				f = u && a(s, t => n.has(t.getKey()) && aa(t));
			if (f && qa(f).length > 0) return null;
			return u && f ? [u, f] : null;
		}(g, _, f);
		if (p) {
			const [t, e] = p;
			Eu(t, "previous").splice(0, e.getChildren());
			let n = e.getParent();
			for (e.remove(true); n && n.isEmpty();) {
				const t = n;
				n = n.getParent(), t.remove(true);
			}
		} else if (_) {
			const t = function (t) {
					if (Cu(t)) {
						const e = t.origin;
						if (aa(e)) return e;
					} else {
						const e = t.getParentAtCaret();
						if (e && aa(e)) return e;
					}
					return null;
				}(_),
				e = t && t.getParent(),
				n = t && t.getParents().findLast(Nc);
			if (t && e && !ss(e) && t.isEmpty() && f.has(t.getKey()) && 0 === qa(t).length && (!n || f.has(n.getKey()))) {
				t.remove(true);
				let n = e;
				for (; n && !ss(n) && n.isEmpty();) {
					const t = n.getParent();
					if (t && ss(t) && t.getChildrenSize() <= 1) break;
					const e = n;
					n = t, e.remove(true);
				}
			}
		}
		null === Ul(l, c) && Ul($l(), null);
		const y = [g, _, ...a, ...u].find(ws);
		if (y) {
			return Lu(Pu(Ms(y), e.direction));
		}
		t(269, JSON.stringify(a.map(t => t.origin.__key)));
	}
	function Ms(t) {
		const e = function (t) {
				let e = t;
				for (; Cu(e);) {
					const t = Ou(e);
					if (!Cu(t)) break;
					e = t;
				}
				return e;
			}(t.getLatest()),
			{
				direction: n
			} = e;
		if (gr(e.origin)) return yu(e) ? e : bu(e.origin, n, n);
		const o = e.getAdjacentCaret();
		return xu(o) && gr(o.origin) ? bu(o.origin, n, hu(n)) : e;
	}
	function Os(t) {
		return yu(t) && t.offset !== Nu(t.origin, t.direction);
	}
	function As(t, e) {
		return t.direction === e ? t : zu(Pu(t.focus, e), Pu(t.anchor, e));
	}
	function Ds(t, e, n) {
		let o = Eu(t, "next");
		for (let t = 0; t < e; t++) {
			const t = o.getAdjacentCaret();
			if (null === t) break;
			o = t;
		}
		return Pu(o, n);
	}
	function Fs(t, e = "root") {
		let n = 0,
			o = t,
			r = Ou(o);
		for (; null === r;) {
			if (n--, r = o.getParentCaret(e), !r) return null;
			o = r, r = Ou(o);
		}
		return r && [r, n];
	}
	function Ps(e) {
		const {
			origin: n,
			offset: o,
			direction: r
		} = e;
		if (o === Nu(n, r)) return e.getSiblingCaret();
		if (o === Nu(n, hu(r))) return bs(e.getSiblingCaret());
		const [i] = n.splitText(o);
		return gr(i) || t(281), Pu(ku(i, "next"), r);
	}
	function Is(t, e) {
		return true;
	}
	function Ls(t, {
		$copyElementNode: e = Ec,
		$splitTextPointCaretNext: n = Ps,
		rootMode: o = "shadowRoot",
		$shouldSplit: r = Is,
		removeEmptyDestination: i = false
	} = {}) {
		if (yu(t)) return n(t);
		const s = t.getParentCaret(o);
		if (s) {
			const {
				origin: n
			} = s;
			if (Cu(t)) {
				const t = bs(s);
				if (i && n.isEmpty()) return n.remove(), t;
				if (!n.canBeEmpty() || !r(n, "first")) return t;
			}
			const o = function (t) {
				const e = [];
				for (let n = t.getAdjacentCaret(); n; n = n.getAdjacentCaret()) e.push(n.origin);
				return e;
			}(t);
			(o.length > 0 || !i && n.canBeEmpty() && r(n, "last")) && s.insert(e(n).splice(0, 0, o));
		}
		return s;
	}
	function zs(e, n, o) {
		let r = Pu(n, "next");
		yu(r) && (0 === r.offset ? r = ku(r.origin, "previous").getFlipped() : r.offset === r.origin.getTextContentSize() && (r = ku(r.origin, "next"))), r.origin.is(e) && (xu(r) || t(342, e.getKey(), e.getType()), r = bs(r)), (e.is(r.getNodeAtCaret()) || e.is(r.getFlipped().getNodeAtCaret())) && e.remove(true);
		for (let t = r; t; t = Ls(t, o)) r = t;
		return yu(r) && t(283), r.insert(e.isInline() ? Ws().append(e) : e), Pu(ku(e.getLatest(), "next"), n.direction);
	}
	function Ks(t, e) {
		const n = As(Er(e) ? ks(e) : e, "next"),
			o = ja(n.anchor.origin),
			r = ja(t.getLatest());
		if (null === o ? null !== r : !o.is(r)) return false;
		const i = Ms(Eu(t, "next")),
			s = Pu(Ms(Eu(t, "previous")), "next");
		return Bu(n.anchor, i) <= 0 && Bu(n.focus, s) >= 0;
	}
	class Bs extends ts {
		$config() {
			return this.config("paragraph", {
				extends: ts,
				importDOM: {
					p: () => ({
						conversion: Rs,
						priority: 0
					})
				}
			});
		}
		createDOM(t) {
			const e = Wc().createElement("p"),
				n = cc(t.theme, "paragraph");
			if (void 0 !== n) {
				e.classList.add(...n);
			}
			return e;
		}
		updateDOM(t, e, n) {
			return false;
		}
		exportDOM(t) {
			const {
				element: e
			} = super.exportDOM(t);
			if (na(e)) {
				this.isEmpty() && e.append(Wc().createElement("br"));
				const t = this.getFormatType();
				t && (e.style.textAlign = t);
			}
			return {
				element: e
			};
		}
		exportJSON() {
			const t = super.exportJSON();
			if (void 0 === t.textFormat || void 0 === t.textStyle) {
				const e = this.getChildren().find(gr);
				e ? (t.textFormat = e.getFormat(), t.textStyle = e.getStyle()) : (t.textFormat = this.getTextFormat(), t.textStyle = this.getTextStyle());
			}
			return t;
		}
		extractWithChild(t, e, n) {
			if (!Er(e)) return false;
			if ("" === this.getFormatType() && 0 === this.getIndent() && "" === this.getStyle()) return false;
			if (Ks(this, e)) {
				const t = this.getTextContent();
				return "" !== t && e.getTextContent() === t;
			}
			return false;
		}
		insertNewAfter(t, e) {
			const n = Ws();
			n.setTextFormat(t.format), n.setTextStyle(t.style);
			const o = this.getDirection();
			return n.setDirection(o), n.setFormat(this.getFormatType()), n.setStyle(this.getStyle()), this.insertAfter(n, e), n;
		}
		collapseAtStart() {
			if (this.getChildren().every(t => gr(t) && !/\S/.test(t.getTextContent()))) {
				if (null !== this.getNextSibling()) return this.selectNext(), this.remove(), true;
				if (null !== this.getPreviousSibling()) return this.selectPrevious(), this.remove(), true;
			}
			return false;
		}
	}
	function Rs(t) {
		const e = Ws();
		if (ka(e, t), va(t, e), "" === e.getFormatType()) {
			const n = t.getAttribute("align");
			n && n && n in R$1 && e.setFormat(n);
		}
		return Ta(e, t), {
			node: e
		};
	}
	function Ws() {
		return Mc(new Bs());
	}
	function $s(t) {
		return t instanceof Bs;
	}
	function Us(t) {
		console.warn(t);
	}
	const Hs = 0,
		js = 1,
		Js = 2,
		Vs = 3,
		qs = 4,
		Ys = -8,
		Gs = -7,
		Xs = -6,
		Qs = -5,
		Zs = -4;
	function tl(t, e, n, o, r) {
		const i = t._keyToDOMMap;
		i.clear(), t._editorState = cs(), t._pendingEditorState = o, t._compositionKey = null, t._dirtyType = 0, t._cloneNotNeeded.clear(), t._dirtyLeaves = new Set(), t._dirtyElements.clear(), t._normalizedNodes = new Set(), r && r.preserveUpdateQueue || (t._updateTags = new Set(), t._updates = [], t._cascadeCount = 0), t._blockCursorElement = null, null !== t._inputState.handledSelectionCommandTimeoutId && clearTimeout(t._inputState.handledSelectionCommandTimeoutId), t._inputState = {
			collapsedSelectionFormat: {
				format: 0,
				key: "root",
				offset: 0,
				style: "",
				timeStamp: 0
			},
			compositionEndData: "",
			compositionPhase: "idle",
			hadOrphanedCompositionEvents: false,
			handledSelectionCommandTimeoutId: null,
			isInsertLineBreak: false,
			isInsertTextAfterHandledSelectionCommand: false,
			isSelectionChangeFromDOMUpdate: false,
			isSelectionChangeFromMouseDown: false,
			lastBeforeInputInsertTextTimeStamp: 0,
			lastKeyCode: null,
			lastKeyDownTimeStamp: 0,
			postDeleteSelectionToRestore: null,
			selectionChangeFromDOMUpdatePoints: null,
			unprocessedBeforeInputData: null
		};
		const s = t._observer;
		null !== s && (s.disconnect(), t._observer = null), null !== e && (e.textContent = "", function (t, e) {
			const n = `__lexicalKey_${e._key}`;
			delete t[n];
		}(e, t)), null !== n && (n.textContent = "", i.set("root", n), zl(n, t, "root"));
	}
	function el(t) {
		const e = new Set(),
			n = new Set();
		for (const {
			klass: o,
			ownNodeConfig: r
		} of Fa(t)) {
			const t = o.transform;
			if (!n.has(t)) {
				n.add(t);
				const r = o.transform();
				r && e.add(r);
			}
			if (r) {
				const t = r.$transform;
				t && e.add(t);
			}
		}
		return e;
	}
	const nl = {
		$createDOM: (t, e) => t.createDOM(e._config, e),
		$decorateDOM: (t, e, n, o) => {},
		$exportDOM: (t, e) => {
			const n = hl(e, t.getType());
			return n && void 0 !== n.exportDOM ? n.exportDOM(e, t) : t.exportDOM(e);
		},
		$extractWithChild: (t, e, n, o, r) => es(t) && t.extractWithChild(e, n, o),
		$getDOMSlot: (t, e, n) => t.getDOMSlot(e),
		$getSlotTargetElement: (t, e, n, o) => null,
		$shouldExclude: (t, e, n) => es(t) && t.excludeFromCopy("html"),
		$shouldInclude: (t, e, n) => !e || t.isSelected(e),
		$updateDOM: (t, e, n, o) => t.updateDOM(e, n, o._config)
	};
	function ol(e) {
		const n = e || {},
			o = Ki(),
			r = n.theme || {},
			i = void 0 === e ? o : n.parentEditor || null,
			s = n.disableEvents || false,
			l = cs(),
			c = n.namespace || (null !== i ? i._config.namespace : Yl()),
			a = n.editorState,
			u = [is, rr, hs, pr, Bs, ds, ...(n.nodes || [])],
			{
				onError: f,
				onWarn: d,
				html: h
			} = n,
			g = void 0 === n.editable || n.editable;
		let _;
		if (void 0 === e && null !== o) _ = o._nodes;else {
			_ = new Map();
			for (let e = 0; e < u.length; e++) {
				let o = u[e],
					r = null,
					i = null;
				if (o && "object" == typeof o) {
					const t = o;
					o = t.replace, r = t.with, i = t.withKlass || null;
				}
				if ("function" != typeof o || !o.prototype || !(o === Do || o.prototype instanceof Do)) {
					let r = "<unknown>";
					try {
						r = JSON.parse(ot$5);
					} catch (t) {}
					t(365, String(e - u.length + (n.nodes ? n.nodes.length : 0)), "function" == typeof o ? `${o.name}${"function" == typeof o.getType ? ` (type ${String(o.getType())})` : ""}` : String(o), String(r));
				}
				Da(o);
				const s = o.getType(),
					l = el(o);
				_.set(s, {
					exportDOM: h && h.export ? h.export.get(o) : void 0,
					klass: o,
					replace: r,
					replaceWithKlass: i,
					sharedNodeState: Nt$6(u[e]),
					transforms: l
				});
			}
		}
		const p = new sl(l, i, _, {
			disableEvents: s,
			dom: {
				...nl,
				...(e && e.dom)
			},
			namespace: c,
			theme: r
		}, f || console.error, d || Us, function (t, e) {
			const n = new Map(),
				o = new Set(),
				r = t => {
					Object.keys(t).forEach(e => {
						let o = n.get(e);
						void 0 === o && (o = [], n.set(e, o)), o.push(t[e]);
					});
				};
			return t.forEach(t => {
				const e = t.klass.importDOM;
				if (null == e || o.has(e)) return;
				o.add(e);
				const n = e.call(t.klass);
				null !== n && r(n);
			}), e && r(e), n;
		}(_, h ? h.import : void 0), g, e);
		return void 0 !== a && (p._pendingEditorState = a, p._dirtyType = 2), function (t) {
			t.registerCommand(He$2, lo$1, Hs), t.registerCommand(je$2, co$1, Hs), t.registerCommand(Je$2, ao$1, Hs), t.registerCommand(Ve$2, uo$1, Hs), t.registerCommand(ln$3, xo$1, Hs);
		}(p), p;
	}
	function rl(t, e) {
		const n = t.get(e);
		t.delete(e), n && n();
	}
	function il(t, e, n) {
		return t.set(e, n), rl.bind(null, t, e);
	}
	class sl {
		constructor(t, e, n, o, r, i, s, l, c) {
			this._createEditorArgs = c, this._parentEditor = e, this._rootElement = null, this._editorState = t, this._pendingEditorState = null, this._compositionKey = null, this._deferred = [], this._keyToDOMMap = new lt$5(), this._updates = [], this._updating = false, this._cascadeCount = 0, this._listeners = {
				decorator: new Map(),
				editable: new Map(),
				mutation: new Map(),
				root: new Map(),
				textcontent: new Map(),
				update: new Map()
			}, this._commands = new Map(), this._config = o, this._nodes = n, this._decorators = {}, this._pendingDecorators = null, this._dirtyType = 0, this._cloneNotNeeded = new Set(), this._dirtyLeaves = new Set(), this._dirtyElements = new Map(), this._normalizedNodes = new Set(), this._updateTags = new Set(), this._observer = null, this._key = Yl(), this._onError = r, this._onWarn = i, this._htmlConversions = s, this._editable = l, this._headless = null !== e && e._headless, this._window = null, this._blockCursorElement = null, this._slotsUsed = false, this._keyDownShortcuts = null, this._inputState = {
				collapsedSelectionFormat: {
					format: 0,
					key: "root",
					offset: 0,
					style: "",
					timeStamp: 0
				},
				compositionEndData: "",
				compositionPhase: "idle",
				hadOrphanedCompositionEvents: false,
				handledSelectionCommandTimeoutId: null,
				isInsertLineBreak: false,
				isInsertTextAfterHandledSelectionCommand: false,
				isSelectionChangeFromDOMUpdate: false,
				isSelectionChangeFromMouseDown: false,
				lastBeforeInputInsertTextTimeStamp: 0,
				lastKeyCode: null,
				lastKeyDownTimeStamp: 0,
				postDeleteSelectionToRestore: null,
				selectionChangeFromDOMUpdatePoints: null,
				unprocessedBeforeInputData: null
			};
		}
		isComposing() {
			return null != this._compositionKey;
		}
		registerUpdateListener(t) {
			return il(this._listeners.update, t);
		}
		registerEditableListener(t) {
			return il(this._listeners.editable, t);
		}
		registerDecoratorListener(t) {
			return il(this._listeners.decorator, t);
		}
		registerTextContentListener(t) {
			return il(this._listeners.textcontent, t);
		}
		registerRootListener(t) {
			const e = this._listeners.root;
			return Qu(il(e, t, t(this._rootElement, null) || void 0), () => function (t, e, n) {
				const o = t.get(e);
				o && o(), t.set(e, e(...n) || void 0);
			}(e, t, [null, this._rootElement]));
		}
		registerCommand(e, n, o) {
			void 0 === o && t(35);
			const r = this._commands;
			r.has(e) || r.set(e, [new rt$5(), new rt$5(), new rt$5(), new rt$5(), new rt$5()]);
			const i = r.get(e);
			void 0 === i && t(36, String(e));
			const s = function (t) {
					return 7 & t;
				}(o),
				l = i[s];
			return s !== o ? l.addFront(n) : l.addBack(n), () => {
				l.delete(n), i.every(t => 0 === t.size) && r.delete(e);
			};
		}
		registerMutationListener(t, e, n) {
			const o = this.resolveRegisteredNodeAfterReplacements(this.getRegisteredNode(t)).klass,
				r = this._listeners.mutation;
			let i = r.get(e);
			void 0 === i && (i = new Set(), r.set(e, i)), i.add(o);
			const s = n && n.skipInitialization;
			return void 0 !== s && s || this.initializeMutationListener(e, o), () => {
				i.delete(o), 0 === i.size && r.delete(e);
			};
		}
		getRegisteredNode(e) {
			const n = this._nodes.get(e.getType());
			return void 0 === n && t(37, e.name), n;
		}
		resolveRegisteredNodeAfterReplacements(t) {
			for (; t.replaceWithKlass;) t = this.getRegisteredNode(t.replaceWithKlass);
			return t;
		}
		initializeMutationListener(t, e) {
			const n = this._editorState,
				o = xa(n).get(e.getType());
			if (!o) return;
			const r = new Map();
			for (const t of o.keys()) r.set(t, "created");
			r.size > 0 && t(r, {
				dirtyLeaves: new Set(),
				prevEditorState: n,
				updateTags: new Set(["registerMutationListener"])
			});
		}
		registerNodeTransformToKlass(t, e) {
			const n = this.getRegisteredNode(t);
			return n.transforms.add(e), n;
		}
		registerNodeTransform(t, e) {
			const n = this.registerNodeTransformToKlass(t, e),
				o = [n],
				r = n.replaceWithKlass;
			if (null != r) {
				const t = this.registerNodeTransformToKlass(r, e);
				o.push(t);
			}
			return function (t, e) {
				const n = xa(t.getEditorState()),
					o = [];
				for (const t of e) {
					const e = n.get(t);
					e && o.push(e);
				}
				if (0 === o.length) return;
				t.update(() => {
					for (const t of o) for (const e of t.keys()) {
						const t = Il(e);
						t && t.markDirty();
					}
				}, null === t._pendingEditorState ? {
					tag: Lo
				} : void 0);
			}(this, o.map(t => t.klass.getType())), () => {
				o.forEach(t => t.transforms.delete(e));
			};
		}
		hasNode(t) {
			return this._nodes.has(t.getType());
		}
		hasNodes(t) {
			return t.every(this.hasNode.bind(this));
		}
		dispatchCommand(t, ...e) {
			return gc(this, t, ...e);
		}
		getDecorators() {
			return this._decorators;
		}
		getRootElement() {
			return this._rootElement;
		}
		getKey() {
			return this._key;
		}
		setRootElement(t) {
			const e = this._rootElement;
			if (t !== e) {
				const n = cc(this._config.theme, "root"),
					o = this._pendingEditorState || this._editorState;
				if (this._rootElement = t, tl(this, e, t, o, {
					preserveUpdateQueue: true
				}), null !== e && (this._config.disableEvents || No$1(e), null != n && e.classList.remove(...n)), null !== t) {
					const e = vc(t),
						o = t.style;
					o.userSelect = "text", o.whiteSpace = "pre-wrap", o.wordBreak = "break-word", t.setAttribute("data-lexical-editor", "true"), this._window = e, this._dirtyType = 2, mt$7(this), this._updateTags.add(Lo), ji(this), this._config.disableEvents || function (t, e) {
						const n = t.ownerDocument;
						qn$2.set(t, n);
						let o = Yn$2.get(n);
						void 0 === o && (o = {
							editors: new Set(),
							hasShadowEditor: void 0
						}, Yn$2.set(n, o)), o.editors.add(e), o.hasShadowEditor = void 0, t.__lexicalEditor = e;
						const r = Co$1(t);
						r.push(Gn$2.register(n));
						for (let n = 0; n < Vn$2.length; n++) {
							const [o, i] = Vn$2[n],
								s = "function" == typeof i ? t => {
									ko(t) || (To$1(t), (e.isEditable() || "click" === o) && i(t, e));
								} : t => {
									if (ko(t)) return;
									To$1(t);
									const n = e.isEditable();
									switch (o) {
										case "cut":
											return n && gc(e, Mn$3, t);
										case "copy":
											return gc(e, En$2, t);
										case "paste":
											return n && gc(e, Qe$2, t);
										case "dragstart":
											return n && gc(e, bn$3, t);
										case "dragover":
											return n && gc(e, Nn$2, t);
										case "dragend":
											return n && gc(e, wn$3, t);
										case "focus":
											return n && gc(e, In$2, t);
										case "blur":
											return n && gc(e, Ln$2, t);
										case "drop":
											return n && gc(e, Tn$2, t);
									}
								};
							r.push(jn$2(t, o, s));
						}
					}(t, this), null != n && t.classList.add(...n);
				} else this._window = null, this._updateTags.add(Lo), ji(this);
				Ji("root", this, false, t, e);
			}
		}
		getElementByKey(t) {
			return this._keyToDOMMap.get(t) || null;
		}
		getEditorState() {
			return this._editorState;
		}
		setEditorState(e, n) {
			e.isEmpty() && t(38);
			let o = e;
			o._readOnly && (o = ls(e), o._selection = e._selection ? e._selection.clone() : null), yt$7(this);
			const r = this._pendingEditorState,
				i = void 0 !== n ? n.tag : null;
			null === r || r.isEmpty() || (null != i && this._updateTags.add(i), ji(this)), this._pendingEditorState = o, this._dirtyType = 2, this._dirtyElements.set("root", false), this._compositionKey = null, this._slotsUsed = this._slotsUsed || e._slotsUsed, Qi(this, () => {
				if (i && this._updateTags.add(i), e._parsed) for (const [t, e] of o._nodeMap.entries()) es(e) ? this._dirtyElements.set(t, true) : this._dirtyLeaves.add(t);
			}, {
				discrete: !this._updating || void 0
			});
		}
		parseEditorState(t, e) {
			return function (t, e, n) {
				const o = cs(),
					r = vi,
					i = ki,
					s = Ti,
					l = e._dirtyElements,
					c = e._dirtyLeaves,
					a = e._cloneNotNeeded,
					u = e._dirtyType;
				e._dirtyElements = new Map(), e._dirtyLeaves = new Set(), e._cloneNotNeeded = new Set(), e._dirtyType = 0, vi = o, ki = false, Ti = e, cl(null);
				try {
					const r = e._nodes;
					Ui(t.root, r), n && n(), o._readOnly = !0, o._parsed = !0;
				} catch (t) {
					t instanceof Error && e._onError(t);
				} finally {
					e._dirtyElements = l, e._dirtyLeaves = c, e._cloneNotNeeded = a, e._dirtyType = u, vi = r, ki = i, Ti = s;
				}
				return o;
			}("string" == typeof t ? JSON.parse(t) : t, this, e);
		}
		read(...t) {
			const [e, n] = 1 === t.length ? ["force-commit", t[0]] : t;
			"force-commit" === e && ji(this);
			return ("pending" === e ? this._pendingEditorState || this._editorState : this.getEditorState()).read(n, {
				editor: this
			});
		}
		update(t, e) {
			!function (t, e, n) {
				t._updating ? t._updates.push([e, n]) : Xi(t, e, n);
			}(this, t, e);
		}
		focus(t, e = {}) {
			const n = this._rootElement;
			null !== n && (n.setAttribute("autocapitalize", "off"), Qi(this, () => {
				const o = ni(),
					r = $l();
				null !== o ? o.dirty || Hl(o.clone()) : 0 !== r.getChildrenSize() && ("rootStart" === e.defaultSelection ? r.selectStart() : r.selectEnd()), xc("focus"), Cc(() => {
					n.removeAttribute("autocapitalize"), t && t();
				});
			}), null === this._pendingEditorState && n.removeAttribute("autocapitalize"));
		}
		blur() {
			const t = this._rootElement;
			null !== t && t.blur();
			const e = Pc(this._window);
			null !== e && e.removeAllRanges();
		}
		isEditable() {
			return this._editable;
		}
		setEditable(t) {
			this._editable !== t && (this._editable = t, Ji("editable", this, true, t), this._slotsUsed && this.update(() => Li()));
		}
		toJSON() {
			return {
				editorState: this._editorState.toJSON()
			};
		}
	}
	sl.version = ot$5;
	let ll = null;
	function cl(t) {
		ll = t;
	}
	const al = Symbol("INTERNAL_SKIP_AFTER_CLONE_FROM");
	let ul = 1;
	function fl() {
		ul = 1;
	}
	function dl(e, n) {
		const o = hl(e, n);
		return void 0 === o && t(30, n), o;
	}
	function hl(t, e) {
		return t._nodes.get(e);
	}
	const gl = "function" == typeof queueMicrotask ? queueMicrotask : t => {
		Promise.resolve().then(t);
	};
	function _l(t, e) {
		const n = void 0 !== e ? e : (() => {
			const e = t.getRootNode();
			return bl(e) || Lc(e) ? Gc(e) : null;
		})();
		if (!na(n)) return false;
		if (n.hasAttribute("data-lexical-slot")) return false;
		const o = Bl(n),
			r = n.nodeName;
		return Fo(o) && ("INPUT" === r || "TEXTAREA" === r || "true" === n.contentEditable && null == Cl(n));
	}
	const pl = _l;
	function yl(t, e, n) {
		const o = t.getRootElement();
		if (!o) return false;
		try {
			if (!e || !o.contains(e) || !o.contains(n)) return !1;
		} catch (t) {
			return false;
		}
		return xl(e) === t && t.read("latest", () => !_l(e));
	}
	function ml(t) {
		return t instanceof sl;
	}
	function xl(t) {
		let e = t;
		for (; null != e;) {
			const t = Cl(e);
			if (ml(t)) return t;
			e = pc(e);
		}
		return null;
	}
	function Cl(t) {
		return t ? t.__lexicalEditor : null;
	}
	function Sl(t) {
		return L$1.test(t) ? "rtl" : z$2.test(t) ? "ltr" : null;
	}
	function vl(t) {
		return mr(t) || t.isToken();
	}
	function Tl(t) {
		return vl(t) || t.isSegmented();
	}
	function kl(t) {
		return oa(t) && 3 === t.nodeType;
	}
	function bl(t) {
		return oa(t) && 9 === t.nodeType;
	}
	function Nl(t) {
		let e = t;
		for (; null != e;) {
			if (kl(e)) return e;
			e = e.firstChild;
		}
		return null;
	}
	function wl(t, e, n) {
		const o = K$1[e];
		if (null !== n && (t & o) === (n & o)) return t;
		let r = t ^ o;
		return "subscript" === e ? r &= ~K$1.superscript : "superscript" === e ? r &= ~K$1.subscript : "lowercase" === e ? (r &= ~K$1.uppercase, r &= ~K$1.capitalize) : "uppercase" === e ? (r &= ~K$1.lowercase, r &= ~K$1.capitalize) : "capitalize" === e && (r &= ~K$1.lowercase, r &= ~K$1.uppercase), r;
	}
	function El(t) {
		return gr(t) || ps(t) || rs(t);
	}
	function Ml(t, e) {
		const n = function () {
			const t = ll;
			return ll = null, t;
		}();
		if (null != (e = e || n && n.__key)) return void (t.__key = e);
		Ai(), Di();
		const o = Ii(),
			r = Fi(),
			i = "" + ul++;
		r._nodeMap.set(i, t), es(t) ? o._dirtyElements.set(i, true) : o._dirtyLeaves.add(i), o._cloneNotNeeded.add(i), 0 === o._dirtyType && (o._dirtyType = 1), t.__key = i;
	}
	function Ol(e) {
		null !== $a(e) && t(380, e.__key, String($a(e)));
		const n = e.getParent();
		if (null !== n) {
			const t = e.getWritable(),
				o = n.getWritable(),
				r = e.getPreviousSibling(),
				i = e.getNextSibling(),
				s = null !== i ? i.__key : null,
				l = null !== r ? r.__key : null,
				c = null !== r ? r.getWritable() : null,
				a = null !== i ? i.getWritable() : null;
			null === r && (o.__first = s), null === i && (o.__last = l), null !== c && (c.__next = s), null !== a && (a.__prev = l), t.__prev = null, t.__next = null, t.__parent = null, o.__size--;
		}
	}
	const Al = Ol;
	function Dl(e) {
		Di(), Oo(e) && t(323, e.__key, e.__type);
		const n = e.getLatest(),
			o = null !== n.__parent ? n.__parent : Wa(n) ? n.__slotHost : null,
			r = Fi(),
			i = Ii(),
			s = r._nodeMap,
			l = i._dirtyElements;
		null !== o && function (t, e, n) {
			let o = t;
			for (; null !== o;) {
				if (n.has(o)) return;
				const t = e.get(o);
				if (void 0 === t) break;
				n.set(o, false), o = null !== t.__parent ? t.__parent : Wa(t) ? t.__slotHost : null;
			}
		}(o, s, l);
		const c = n.__key;
		0 === i._dirtyType && (i._dirtyType = 1), es(e) ? l.set(c, true) : i._dirtyLeaves.add(c);
	}
	function Fl(t) {
		Ai();
		const e = Ii(),
			n = e._compositionKey;
		if (t !== n) {
			if (e._compositionKey = t, null !== n) {
				const t = Il(n);
				null !== t && t.getWritable();
			}
			if (null !== t) {
				const e = Il(t);
				null !== e && e.getWritable();
			}
		}
	}
	function Pl() {
		if (Oi()) return null;
		return Ii()._compositionKey;
	}
	function Il(t, e) {
		const n = (e || Fi())._nodeMap.get(t);
		return void 0 === n ? null : n;
	}
	function Ll(t, e) {
		const n = Kl(t, Ii());
		return void 0 !== n ? Il(n, e) : null;
	}
	function zl(t, e, n) {
		t[`__lexicalKey_${e._key}`] = n;
	}
	function Kl(t, e) {
		return t[`__lexicalKey_${e._key}`];
	}
	function Bl(t, e) {
		let n = t;
		for (; null != n;) {
			const t = Ll(n, e);
			if (null !== t) return t;
			n = pc(n);
		}
		return null;
	}
	function Rl(t) {
		const e = t._decorators,
			n = Object.assign({}, e);
		return t._pendingDecorators = n, n;
	}
	function Wl(t) {
		return t.read(() => $l().getTextContent());
	}
	function $l() {
		return Fi()._nodeMap.get("root");
	}
	function Ul(t, e) {
		if (!(wc(t) && t.isAttached() && t.isEmpty() && (ss(t) || null !== e && aa(e)))) return null;
		const n = Ws();
		return t.append(n), n;
	}
	function Hl(t) {
		Ai();
		const e = Fi();
		null !== t && (t.dirty = true, t.setCachedNodes(null), Er(t) && Ii()._slotsUsed && qr(t)), e._selection = t;
	}
	function jl() {
		Ai();
		yt$7(Ii());
	}
	function Jl(t) {
		const e = function (t, e) {
			let n = t;
			for (; null != n;) {
				const t = Kl(n, e);
				if (void 0 !== t) return t;
				n = pc(n);
			}
			return null;
		}(t, Ii());
		return null === e ? null : Il(e);
	}
	function Vl(t) {
		return /[\uD800-\uDBFF][\uDC00-\uDFFF]/g.test(t);
	}
	function ql(t) {
		const e = [];
		for (let n = t; null !== n; n = n._parentEditor) e.push(n);
		return e;
	}
	function Yl() {
		return Math.random().toString(36).replace(/[^a-z]+/g, "").substring(0, 5);
	}
	function Gl(t) {
		return kl(t) ? t.nodeValue : null;
	}
	function Xl(t, e, n) {
		const o = Pc(Tc(e));
		if (null === o) return;
		const r = Hc(o, e._rootElement),
			i = r.anchorNode;
		let {
			anchorOffset: s,
			focusOffset: l
		} = r;
		if (null !== i) {
			let e = Gl(i);
			const o = Bl(i);
			if (null !== e && gr(o)) {
				if ((e === A$1 || e === F$1) && n) {
					const t = n.length;
					e = n, s = t, l = t;
				}
				null !== e && Ql(o, e, s, l, t);
			}
		}
	}
	function Ql(t, e, n, o, r) {
		let i = t;
		if (i.isAttached() && (r || !i.isDirty())) {
			const s = i.isComposing();
			if (i.isToken() && s) return;
			let c = e;
			if ((s || r) && (e.endsWith(A$1) && (c = e.slice(0, -A$1.length)), r)) {
				const t = F$1;
				let e;
				for (; -1 !== (e = c.indexOf(t));) c = c.slice(0, e) + c.slice(e + t.length), null !== n && n > e && (n = Math.max(e, n - t.length)), null !== o && o > e && (o = Math.max(e, o - t.length));
			}
			const u = i.getTextContent();
			if (r || c !== u) {
				const e = ni();
				if ("" === c) {
					if (Fl(null), a$1 || l || d$2) i.remove();else {
						const t = Ii();
						Zl(i, "", e), setTimeout(() => {
							t.update(() => {
								i.isAttached() && "" === i.getTextContent() && i.remove();
							});
						}, 20);
					}
					return;
				}
				const r = i.getParent(),
					u = oi(),
					f = i.getTextContentSize(),
					h = Pl(),
					g = i.getKey();
				if (i.isToken() && !s || null !== h && g === h && !s || Er(u) && (null !== r && !r.canInsertTextBefore() && 0 === u.anchor.offset || u.anchor.key === t.__key && 0 === u.anchor.offset && !i.canInsertTextBefore() && !s || u.focus.key === t.__key && u.focus.offset === f && !i.canInsertTextAfter() && !s)) return void i.markDirty();
				if (!Er(e) || null === n || null === o) return void Zl(i, c, e);
				if (e.setTextNodeRange(i, n, i, o), i.isSegmented()) {
					const t = hr(i.getTextContent());
					i.replace(t), i = t;
				}
				Zl(i, c, e);
			}
		}
	}
	function Zl(t, e, n) {
		if (t.setTextContent(e), Er(n)) {
			const e = t.getKey();
			let o = false;
			for (const r of ["anchor", "focus"]) {
				const i = n[r];
				"text" === i.type && i.key === e && (i.offset = Nu(t, i.offset, "clamp"), o = true);
			}
			o && (n._cachedNodes = null, n._cachedIsBackward = null);
		}
	}
	function tc(t, e) {
		const n = t[j$2];
		return n && e !== r ? {
			...t,
			ctrlKey: t[n],
			[n]: t.ctrlKey
		} : t;
	}
	function ec(t, e, n) {
		const o = e[n] || false;
		return "any" === o || o === t[n];
	}
	function nc(t, e) {
		return ec(t, e, "altKey") && ec(t, e, "ctrlKey") && ec(t, e, "shiftKey") && ec(t, e, "metaKey");
	}
	function oc(t, e, n) {
		if (!nc(t, n)) return false;
		if (t.key.toLowerCase() === e.toLowerCase()) return true;
		if (e.length > 1) return false;
		if (1 === t.key.length && t.key.charCodeAt(0) <= 127) return false;
		if (t.code.startsWith("Digit") && /^\d$/.test(e)) return t.code === `Digit${e}`;
		const o = "Key" + e.toUpperCase();
		return t.code === o;
	}
	function rc(t) {
		let e = t;
		for (; null !== e;) {
			const t = e.getParent();
			if (null === t) return null;
			if (ss(t)) return e;
			e = t;
		}
		return null;
	}
	function ic(t, e) {
		const {
				anchor: n,
				focus: o
			} = t,
			r = n.key,
			i = n.offset,
			s = n.type,
			l = o.key,
			c = o.offset,
			a = o.type;
		if (Bt$6(t), !ss(e)) return t;
		const u = rc(n.getNode());
		return es(u) && u.isShadowRoot() && u.is(rc(o.getNode())) && (n.set(r, i, s), o.set(l, c, a)), t;
	}
	function sc(t) {
		const e = $l();
		if (Er(t)) {
			const e = t.anchor,
				n = t.focus,
				o = e.getNode();
			if (ss(o)) return e.set(o.getKey(), 0, "element"), n.set(o.getKey(), o.getChildrenSize(), "element"), ic(t, o), t;
			const r = o.getTopLevelElementOrThrow(),
				i = r.getParent();
			return null === i ? (es(r) && (e.set(r.getKey(), 0, "element"), n.set(r.getKey(), r.getChildrenSize(), "element"), ic(t, r)), t) : (e.set(i.getKey(), 0, "element"), n.set(i.getKey(), i.getChildrenSize(), "element"), ic(t, i), t);
		}
		{
			const t = e.select(0, e.getChildrenSize());
			return Hl(ic(t, e)), t;
		}
	}
	function lc(t, e) {
		"" === t.getAttribute(e) && t.removeAttribute(e);
	}
	function cc(t, e) {
		void 0 === t.__lexicalClassNameCache && (t.__lexicalClassNameCache = {});
		const n = t.__lexicalClassNameCache,
			o = n[e];
		if (void 0 !== o) return o;
		const r = t[e];
		if ("string" == typeof r) {
			const t = Yu(r);
			return n[e] = t, t;
		}
		return r;
	}
	function ac(e, n, o, r, i) {
		if (0 === o.size) return;
		const s = r.__type,
			l = r.__key,
			c = n.get(s);
		void 0 === c && t(33, s);
		const a = c.klass;
		let u = e.get(a);
		void 0 === u && (u = new Map(), e.set(a, u));
		const f = u.get(l),
			d = "destroyed" === f && "created" === i;
		(void 0 === f || d) && u.set(l, d ? "updated" : i);
	}
	function uc(t) {
		const e = t.getType(),
			n = Fi();
		if (n._readOnly) {
			const t = xa(n).get(e);
			return t ? Array.from(t.values()) : [];
		}
		const o = n._nodeMap,
			r = [];
		for (const [, n] of o) n instanceof t && n.__type === e && n.isAttached() && r.push(n);
		return r;
	}
	function fc(t, e, n) {
		const o = t.getParent();
		let r = n,
			i = t;
		return null !== o && (e && 0 === n ? (r = i.getIndexWithinParent(), i = o) : e || n !== i.getChildrenSize() || (r = i.getIndexWithinParent() + 1, i = o)), i.getChildAtIndex(e ? r - 1 : r);
	}
	function dc(t, e) {
		const n = t.offset;
		if ("element" === t.type) {
			return fc(t.getNode(), e, n);
		}
		{
			const o = t.getNode();
			if (e && 0 === n || !e && n === o.getTextContentSize()) {
				const t = e ? o.getPreviousSibling() : o.getNextSibling();
				return null === t ? fc(o.getParentOrThrow(), e, o.getIndexWithinParent() + (e ? 0 : 1)) : t;
			}
		}
		return null;
	}
	function hc(t) {
		const e = Tc(t).event,
			n = e && e.inputType;
		return "insertFromPaste" === n || "insertFromPasteAsQuotation" === n;
	}
	function gc(t, e, ...n) {
		return Vi(t, e, n[0], t);
	}
	function _c(e, n) {
		const o = e._keyToDOMMap.get(n);
		return void 0 === o && t(75, n), o;
	}
	function pc(t) {
		const e = t.assignedSlot || t.parentElement;
		if (null !== e) return e;
		const n = t.parentNode;
		return Lc(n) ? n.host : null;
	}
	function yc(t) {
		return bl(t) ? t : na(t) ? t.ownerDocument : null;
	}
	function mc(t) {
		return Ii()._updateTags.has(t);
	}
	function xc(t) {
		Ai();
		Ii()._updateTags.add(t);
	}
	function Cc(t) {
		Ai();
		Ii()._deferred.push(t);
	}
	function Sc(t, e) {
		let n = t.getParent();
		for (; null !== n;) {
			if (n.is(e)) return true;
			n = n.getParent();
		}
		return false;
	}
	function vc(t) {
		const e = yc(t);
		return e ? e.defaultView : null;
	}
	function Tc(e) {
		const n = e._window;
		return null === n && t(78), n;
	}
	function kc(t) {
		return es(t) && t.isInline() || rs(t) && t.isInline();
	}
	function bc(t) {
		let e = t.getLatest();
		for (; null !== e;) {
			if (null !== $a(e) && es(e)) return e;
			const t = e.getParentOrThrow();
			if (wc(t)) return t;
			e = t;
		}
		return e;
	}
	function Nc(t) {
		return es(t) && t.isShadowRoot();
	}
	function wc(t) {
		return ss(t) || Nc(t);
	}
	function Ec(t, e = false) {
		const n = t.constructor.clone(t, al);
		return Ml(n, null), n.afterCloneFrom(t), e || n.resetOnCopyNodeFrom(t), n;
	}
	function Mc(e) {
		const n = Ii(),
			o = e.getType(),
			r = hl(n, o);
		void 0 === r && t(200, e.constructor.name, o);
		const {
			replace: i,
			replaceWithKlass: s
		} = r;
		if (null !== i) {
			const n = i(e),
				r = n.constructor;
			return null !== s ? n instanceof s || t(201, s.name, s.getType(), r.name, r.getType(), e.constructor.name, o) : n instanceof e.constructor && r !== e.constructor || t(202, r.name, r.getType(), e.constructor.name, o), n.__key === e.__key && t(203, e.constructor.name, o, r.name, r.getType()), n;
		}
		return e;
	}
	function Oc(e, n) {
		!ss(e.getParent()) || es(n) || rs(n) || t(99);
	}
	function Ac(e) {
		const n = Il(e);
		return null === n && t(63, e), n;
	}
	function Dc(t) {
		if (!t || t.isInline()) return false;
		if (rs(t)) return true;
		if (es(t)) {
			if (t.isShadowRoot()) {
				const e = t.getParent();
				return !(es(e) && e.isShadowRoot());
			}
			return !t.canBeEmpty();
		}
		return false;
	}
	function Fc(t, e, n) {
		n.style.removeProperty("caret-color"), e._blockCursorElement = null;
		const o = t.parentElement;
		null !== o && o.removeChild(t);
	}
	function Pc(t) {
		return n ? (t || window).getSelection() : null;
	}
	function Ic(t) {
		const e = vc(t);
		return e ? e.getSelection() : null;
	}
	function Lc(t) {
		return ra(t) && "host" in t;
	}
	const zc = [];
	function Kc(t) {
		const e = t.getRootNode();
		if (e === t || !Lc(e)) return zc;
		const n = [e];
		let o = e.host;
		for (;;) {
			const t = o.getRootNode();
			if (t === o || !Lc(t)) break;
			n.push(t), o = t.host;
		}
		return n;
	}
	function* Bc(t) {
		const e = [t];
		let n;
		for (; n = e.pop();) {
			yield* n.querySelectorAll('[data-lexical-editor="true"]');
			const t = (bl(n) ? n : n.ownerDocument).createTreeWalker(n, NodeFilter.SHOW_ELEMENT);
			let o;
			for (; o = t.nextNode();) o.shadowRoot && e.push(o.shadowRoot);
		}
	}
	function Rc(t) {
		return null !== t ? t.ownerDocument : document;
	}
	function Wc() {
		const t = Ki();
		return Rc(null !== t ? t._rootElement : null);
	}
	function $c(t, e) {
		if (null === e || "function" != typeof t.getComposedRanges) return null;
		const n = Kc(e);
		if (0 === n.length) return null;
		const o = t.getComposedRanges;
		try {
			const e = o.call(t, {
				shadowRoots: n
			})[0];
			if (void 0 !== e) return e;
		} catch (t) {}
		try {
			const e = o.apply(t, n)[0];
			if (void 0 !== e) return e;
		} catch (t) {}
		return null;
	}
	function Uc(t, e) {
		const n = $c(t, e);
		if (null !== n) {
			const t = Jc(n);
			if (null !== t) return t;
		}
		return t.rangeCount > 0 ? t.getRangeAt(0) : null;
	}
	function Hc(t, e) {
		const n = $c(t, e);
		return null === n ? t : Vc(n, qc(t));
	}
	function jc(t, e) {
		const n = $c(t, e);
		if (null === n) return {
			points: t,
			range: t.rangeCount > 0 ? t.getRangeAt(0) : null
		};
		const o = Jc(n) ?? (t.rangeCount > 0 ? t.getRangeAt(0) : null);
		return {
			points: Vc(n, qc(t)),
			range: o
		};
	}
	function Jc(t) {
		const e = t.startContainer.ownerDocument;
		if (null === e) return null;
		const n = e.createRange();
		try {
			return n.setStart(t.startContainer, t.startOffset), n.setEnd(t.endContainer, t.endOffset), n;
		} catch (t) {
			return null;
		}
	}
	function Vc(t, e) {
		const {
			startContainer: n,
			startOffset: o,
			endContainer: r,
			endOffset: i
		} = t;
		return "backward" === e ? {
			anchorNode: r,
			anchorOffset: i,
			direction: e,
			focusNode: n,
			focusOffset: o
		} : {
			anchorNode: n,
			anchorOffset: o,
			direction: e,
			focusNode: r,
			focusOffset: i
		};
	}
	function qc(t) {
		return t.direction;
	}
	function Yc(t) {
		const e = t.getRootNode();
		return bl(e) || Lc(e) ? e.activeElement : null;
	}
	function Gc(t) {
		let e = t.activeElement;
		for (; null !== e && null !== e.shadowRoot;) {
			const t = e.shadowRoot.activeElement;
			if (null === t) break;
			e = t;
		}
		return e;
	}
	function Xc(t) {
		const e = t.target;
		if (null !== e && na(e) && null !== e.shadowRoot && "function" == typeof t.composedPath) {
			const e = t.composedPath();
			if (e.length > 0) return e[0];
		}
		return e;
	}
	function Qc(e, n) {
		let o = e.getChildAtIndex(n);
		null == o && (o = e), wc(e) && t(102);
		const r = e => {
				const n = e.getParentOrThrow(),
					i = wc(n),
					s = e !== o || i ? Ec(e) : e;
				if (i) return es(e) && es(s) || t(133), e.insertAfter(s), [e, s, s];
				{
					const [t, o, i] = r(n),
						l = e.getNextSiblings();
					return i.append(s, ...l), [t, o, s];
				}
			},
			[i, s] = r(o);
		return [i, s];
	}
	function Zc(t) {
		return na(t) && "A" === t.tagName;
	}
	function ta(t) {
		return na(t) && "TR" === t.tagName;
	}
	function ea(t) {
		return na(t) && ("TD" === t.tagName || "TH" === t.tagName);
	}
	function na(t) {
		return oa(t) && 1 === t.nodeType;
	}
	function oa(t) {
		return "object" == typeof t && null !== t && "nodeType" in t && "number" == typeof t.nodeType;
	}
	function ra(t) {
		return oa(t) && 11 === t.nodeType;
	}
	const ia = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|mark|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var|#text)$/i;
	function sa(t) {
		return !(!na(t) || !t.style.display.startsWith("inline")) || ia.test(t.nodeName);
	}
	const la = /^(address|article|aside|blockquote|canvas|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|header|hr|li|main|nav|noscript|ol|p|pre|section|table|td|tfoot|ul|video)$/i;
	function ca(t) {
		return (!na(t) || !t.style.display.startsWith("inline")) && la.test(t.nodeName);
	}
	function aa(t) {
		if (rs(t) && !t.isInline()) return true;
		if (!es(t) || wc(t)) return false;
		const e = t.getFirstChild(),
			n = null === e || ps(e) || gr(e) || e.isInline();
		return !t.isInline() && false !== t.canBeEmpty() && n;
	}
	function ua() {
		return Ii();
	}
	function fa(t = ua()) {
		return t._config.dom || nl;
	}
	function da(e, n, o = ua()) {
		const r = fa(o).$getDOMSlot(e, n, o);
		return es(e) && (_a(r) || t(344, e.getKey(), e.getType())), r;
	}
	function ha(t, e, n, o) {
		const r = t.read("latest", () => {
			const o = Il(e);
			return null !== o ? function (t, e, n = ua()) {
				const o = Ya(t, e);
				if (null === o) return null;
				const r = n.getElementByKey(o.getKey());
				return null !== r ? r.parentElement : null;
			}(o, n, t) : null;
		});
		return null !== r && (r.parentElement !== o && o.appendChild(r), r.style.display = ""), r;
	}
	function ga(t, e, n) {
		n.style.display = "none";
		const o = t.getElementByKey(e);
		null !== o && n.parentElement !== o && o.insertBefore(n, o.firstChild);
	}
	function _a(t) {
		return t instanceof tt$4;
	}
	function pa(t, e, n = ua()) {
		return Nl(da(t, e, n).element);
	}
	const ya = new WeakMap(),
		ma = new Map();
	function xa(e) {
		if (!e._readOnly && e.isEmpty()) return ma;
		e._readOnly || t(192);
		let n = ya.get(e);
		return n || (n = function (t) {
			const e = new Map();
			for (const [n, o] of t._nodeMap) {
				const t = o.__type;
				let r = e.get(t);
				r || (r = new Map(), e.set(t, r)), r.set(n, o);
			}
			return e;
		}(e), ya.set(e, n)), n;
	}
	function Ca(t) {
		const e = t.constructor.clone(t, al);
		return e.afterCloneFrom(t), e;
	}
	function Sa(t) {
		return (e = Ca(t))[Mo] = true, e;
		var e;
	}
	function va(t, e) {
		const n = t.getAttribute("data-lexical-indent");
		if (null !== n) {
			const t = parseInt(n, 10);
			if (Number.isFinite(t) && t >= 0) return void e.setIndent(t);
		}
		const o = parseInt(t.style.paddingInlineStart, 10) || 0,
			r = Math.round(o / 40);
		e.setIndent(r);
	}
	function Ta(t, e) {
		const n = e.getAttribute("dir");
		return "ltr" === n || "rtl" === n ? t.setDirection(n) : t;
	}
	function ka(t, e) {
		const n = e.style.textAlign;
		return n && n in R$1 ? t.setFormat(n) : t;
	}
	function ba(t, e) {
		t.__lexicalUnmanaged = true, e && void 0 !== e.captureSelection && (t.__lexicalCapturedSelection = e.captureSelection);
	}
	function Na(t) {
		return true === t.__lexicalUnmanaged;
	}
	function wa(t, e = ua()) {
		const n = e.isEditable();
		t.contentEditable = n ? "true" : "false", n ? t.__lexicalEditor = e : delete t.__lexicalEditor;
	}
	function Ea(t, e) {
		let n = t;
		for (; null != n;) {
			if (true === n.__lexicalCapturedSelection) return true;
			if (na(n) && n.hasAttribute("data-lexical-slot")) return false;
			if (void 0 !== Kl(n, e)) return false;
			n = pc(n);
		}
		return false;
	}
	function Ma(t, e) {
		return function (t, e) {
			return Object.prototype.hasOwnProperty.call(t, e);
		}(t, e) && t[e] !== Do[e];
	}
	const Oa = new WeakMap(),
		Aa = Symbol("lexical.synthesizedGetType");
	function Da(e) {
		const n = Oa.get(e);
		if (n) return n;
		const o = null != e.prototype && J$3 in e.prototype ? e.prototype[J$3]() : void 0,
			r = function (e) {
				if (!(e === Do || e.prototype instanceof Do)) {
					let n = "<unknown>",
						o = "<unknown>";
					try {
						n = e.getType();
					} catch (t) {}
					try {
						sl.version && (o = JSON.parse(sl.version));
					} catch (t) {}
					t(290, e.name, n, o);
				}
				return e === os || e === ts || e === Do;
			}(e),
			i = !r && Ma(e, "getType") ? e.getType : void 0,
			s = i && !(Aa in i) ? i.call(e) : void 0;
		let l,
			c = s;
		if (o) if (s) l = o[s];else {
			for (const [t, e] of Object.entries(o)) c = t, l = e;
			if (!l) for (const t of Object.getOwnPropertySymbols(o)) {
				const e = o[t];
				if (e) {
					l = e;
					break;
				}
			}
		}
		if (!r && c) {
			if (!Ma(e, "getType")) {
				const t = e,
					n = function () {
						return this !== t ? Do.getType.call(this) : c;
					};
				n[Aa] = true, e.getType = n;
			}
			if (Ma(e, "clone") || (e.clone = (t, n) => {
				cl(t);
				const o = new e();
				return n !== al && o.afterCloneFrom(t), o;
			}), Ma(e, "importJSON") || (e.importJSON = l && l.$importJSON || (t => Ia(e).updateFromJSON(t))), !Ma(e, "importDOM") && l) {
				const {
					importDOM: t
				} = l;
				t && (e.importDOM = () => t);
			}
		}
		const a = {
			klass: e,
			ownNodeConfig: l,
			ownNodeType: c
		};
		return Oa.set(e, a), a;
	}
	function* Fa(t) {
		for (let e = t; e && (e === Do || Fo(e.prototype));) {
			const t = Da(e);
			yield t, e = t.ownNodeConfig && t.ownNodeConfig.extends || Ka(e);
		}
	}
	function Pa(t) {
		const e = new Map(),
			n = new Map();
		for (const o of t) {
			const {
				ownNodeType: t
			} = Da(o);
			t && (n.set(t, o), e.set(t, new Set()));
		}
		for (const [t, o] of n) for (const {
			ownNodeType: n
		} of Fa(o)) {
			const o = n && e.get(n);
			o && o.add(t);
		}
		return e;
	}
	function Ia(t) {
		const e = ua();
		Ai();
		const n = e.resolveRegisteredNodeAfterReplacements(e.getRegisteredNode(t)),
			o = new n.klass();
		return null === n.replace ? o : Mc(o);
	}
	const La = (t, e) => {
		let n = t;
		for (; null != n && !ss(n);) {
			if (e(n)) return n;
			n = n.getParent();
		}
		return null;
	};
	function za(e, n) {
		const o = [];
		let r = e.__first;
		for (; null !== r;) {
			const e = null === n ? Il(r) : n.get(r);
			null == e && t(174), o.push(r), r = e.__next;
		}
		return o;
	}
	function Ka(t) {
		const e = Object.getPrototypeOf(t);
		if ("function" == typeof e && e !== Function.prototype) return e;
		const n = t.prototype && Object.getPrototypeOf(t.prototype);
		return n ? n.constructor : null;
	}
	const Ba = new Map();
	function Ra(t) {
		return es(t) || rs(t);
	}
	function Wa(t) {
		return es(t) || rs(t);
	}
	function $a(t) {
		const e = t.getLatest();
		return Wa(e) ? e.__slotHost : null;
	}
	function Ua(e) {
		const n = $a(e);
		if (null === n) return null;
		const o = Il(n);
		return es(o) || rs(o) || t(370), o;
	}
	function Ha(t) {
		const e = Ua(t);
		if (null === e) return null;
		const n = t.getLatest().__key;
		for (const [t, o] of Va(e)) if (o === n) return t;
		return null;
	}
	function ja(t) {
		let e = t.getLatest();
		for (; null !== e;) {
			if (null !== $a(e)) return e;
			e = e.getParent();
		}
		return null;
	}
	function Ja(t) {
		if (null === t) return null;
		const e = Er(t) ? t.anchor.getNode() : t.getNodes()[0] ?? null;
		return null === e ? null : ja(e);
	}
	function Va(t) {
		const e = t.getLatest();
		return Ra(e) && null !== e.__slots ? e.__slots : Ba;
	}
	function qa(t) {
		return Array.from(Va(t).keys());
	}
	function Ya(t, e) {
		const n = Va(t).get(e);
		return void 0 === n ? null : Il(n);
	}
	const Ga = ["__proto__", "constructor", "prototype"],
		Xa = Symbol("slotMapOwner");
	function Qa(t) {
		let e = t.__slots;
		return null !== e && e[Xa] === t || (e = new Map(e), e[Xa] = t, t.__slots = e), e;
	}
	const Za = new WeakMap(),
		tu = [];
	function eu(t) {
		for (const {
			ownNodeConfig: e
		} of Fa(t)) {
			const t = e && e.slots;
			if (t) return t;
		}
		return tu;
	}
	function nu(t) {
		let e = "";
		for (const n of qa(t)) {
			const o = Ya(t, n);
			null !== o && (e += o.getTextContent());
		}
		return e;
	}
	function ou(t, e, n) {
		const o = n.get(t),
			r = n.get(e);
		return void 0 !== o ? void 0 !== r ? o - r : -1 : void 0 !== r ? 1 : t < e ? -1 : t > e ? 1 : 0;
	}
	function ru(e) {
		const n = e.__slots;
		if (null === n || n.size < 2) return;
		const o = function (e) {
			let n = Za.get(e);
			if (void 0 === n) {
				const o = eu(e),
					r = new Map();
				for (const n of o) Ga.includes(n) && t(371, e.name, n), r.has(n) && t(372, e.name, n), r.set(n, r.size);
				n = r, Za.set(e, n);
			}
			return n;
		}(e.constructor);
		let r = null,
			i = true;
		for (const t of n.keys()) {
			if (null !== r && ou(r, t, o) > 0) {
				i = false;
				break;
			}
			r = t;
		}
		if (i) return;
		const s = Array.from(n).sort(([t], [e]) => ou(t, e, o));
		n.clear();
		for (const [t, e] of s) n.set(t, e);
	}
	function iu(e, n, o) {
		"__proto__" !== n && "constructor" !== n && "prototype" !== n || t(373, n);
		const r = e.getLatest();
		if (null !== r.__slots && r.__slots.get(n) === o.getLatest().__key) return r;
		(!es(o) && !rs(o) || o.isInline()) && t(374, o.__key);
		const i = e.getWritable(),
			s = Qa(i),
			l = s.get(n);
		void 0 !== l && cu(l);
		const c = o.getWritable(),
			a = Ua(c);
		if (null !== a) {
			const t = Ha(c);
			null !== t && Qa(a.getWritable()).delete(t), c.__slotHost = null;
		}
		return Ol(c), c.__slotHost = i.__key, s.set(n, c.__key), ru(i), Ii()._slotsUsed = true, Fi()._slotsUsed = true, i;
	}
	function su(t, e) {
		const n = t.getWritable();
		if (null === n.__slots) return n;
		const o = n.__slots.get(e);
		return void 0 !== o && (cu(o), Qa(n).delete(e)), n;
	}
	function lu(t, e) {}
	function cu(e) {
		const n = Il(e);
		if (null === n) return;
		const o = n.getWritable();
		Wa(o) || t(377, e), o.__slotHost = null, o.remove();
	}
	const au = {
		next: "previous",
		previous: "next"
	};
	class uu {
		constructor(t) {
			this.origin = t;
		}
		[Symbol.iterator]() {
			return Ku({
				hasNext: xu,
				initial: this.getAdjacentCaret(),
				map: t => t,
				step: t => t.getAdjacentCaret()
			});
		}
		getAdjacentCaret() {
			return ku(this.getNodeAtCaret(), this.direction);
		}
		getSiblingCaret() {
			return ku(this.origin, this.direction);
		}
		remove() {
			const t = this.getNodeAtCaret();
			return t && t.remove(), this;
		}
		replaceOrInsert(t, e) {
			const n = this.getNodeAtCaret();
			return t.is(this.origin) || t.is(n) || (null === n ? this.insert(t) : n.replace(t, e)), this;
		}
		splice(e, n, o = "next") {
			const r = o === this.direction ? n : Array.from(n).reverse();
			let i = this;
			const s = this.getParentAtCaret(),
				l = new Map();
			for (let t = i.getAdjacentCaret(); null !== t && l.size < e; t = t.getAdjacentCaret()) {
				const e = t.origin.getWritable();
				l.set(e.getKey(), e);
			}
			for (const e of r) {
				if (l.size > 0) {
					const n = i.getNodeAtCaret();
					if (n) {
						if (l.delete(n.getKey()), l.delete(e.getKey()), n.is(e) || i.origin.is(e)) ;else {
							const t = e.getParent();
							t && t.is(s) && e.remove(), n.replace(e);
						}
					} else null === n && t(263, Array.from(l).join(" "));
				} else i.insert(e);
				i = ku(e, this.direction);
			}
			for (const t of l.values()) t.remove();
			return this;
		}
	}
	class fu extends uu {
		type = "child";
		getLatest() {
			const t = this.origin.getLatest();
			return t === this.origin ? this : Eu(t, this.direction);
		}
		getParentCaret(t = "root") {
			return ku(gu(this.getParentAtCaret(), t), this.direction);
		}
		getFlipped() {
			const t = hu(this.direction);
			return ku(this.getNodeAtCaret(), t) || Eu(this.origin, t);
		}
		getParentAtCaret() {
			return this.origin;
		}
		getChildCaret() {
			return this;
		}
		isSameNodeCaret(t) {
			return t instanceof fu && this.direction === t.direction && this.origin.is(t.origin);
		}
		isSamePointCaret(t) {
			return this.isSameNodeCaret(t);
		}
	}
	const du = {
		root: ss,
		shadowRoot: wc
	};
	function hu(t) {
		return au[t];
	}
	function gu(t, e = "root") {
		return null === t || du[e](t) ? null : null === $a(t) ? t : null;
	}
	class _u extends uu {
		type = "sibling";
		getLatest() {
			const t = this.origin.getLatest();
			return t === this.origin ? this : ku(t, this.direction);
		}
		getSiblingCaret() {
			return this;
		}
		getParentAtCaret() {
			return this.origin.getParent();
		}
		getChildCaret() {
			return es(this.origin) ? Eu(this.origin, this.direction) : null;
		}
		getParentCaret(t = "root") {
			return ku(gu(this.getParentAtCaret(), t), this.direction);
		}
		getFlipped() {
			const t = hu(this.direction);
			return ku(this.getNodeAtCaret(), t) || Eu(this.origin.getParentOrThrow(), t);
		}
		isSamePointCaret(t) {
			return t instanceof _u && this.direction === t.direction && this.origin.is(t.origin);
		}
		isSameNodeCaret(t) {
			return (t instanceof _u || t instanceof pu) && this.direction === t.direction && this.origin.is(t.origin);
		}
	}
	class pu extends uu {
		type = "text";
		constructor(t, e) {
			super(t), this.offset = e;
		}
		getLatest() {
			const t = this.origin.getLatest();
			return t === this.origin ? this : bu(t, this.direction, this.offset);
		}
		getParentAtCaret() {
			return this.origin.getParent();
		}
		getChildCaret() {
			return null;
		}
		getParentCaret(t = "root") {
			return ku(gu(this.getParentAtCaret(), t), this.direction);
		}
		getFlipped() {
			return bu(this.origin, hu(this.direction), this.offset);
		}
		isSamePointCaret(t) {
			return t instanceof pu && this.direction === t.direction && this.origin.is(t.origin) && this.offset === t.offset;
		}
		isSameNodeCaret(t) {
			return (t instanceof _u || t instanceof pu) && this.direction === t.direction && this.origin.is(t.origin);
		}
		getSiblingCaret() {
			return ku(this.origin, this.direction);
		}
	}
	function yu(t) {
		return t instanceof pu;
	}
	function mu(t) {
		return t instanceof uu;
	}
	function xu(t) {
		return t instanceof _u;
	}
	function Cu(t) {
		return t instanceof fu;
	}
	const Su = {
			next: class extends pu {
				direction = "next";
				getNodeAtCaret() {
					return this.origin.getNextSibling();
				}
				insert(t) {
					return this.origin.insertAfter(t), this;
				}
			},
			previous: class extends pu {
				direction = "previous";
				getNodeAtCaret() {
					return this.origin.getPreviousSibling();
				}
				insert(t) {
					return this.origin.insertBefore(t), this;
				}
			}
		},
		vu = {
			next: class extends _u {
				direction = "next";
				getNodeAtCaret() {
					return this.origin.getNextSibling();
				}
				insert(t) {
					return this.origin.insertAfter(t), this;
				}
			},
			previous: class extends _u {
				direction = "previous";
				getNodeAtCaret() {
					return this.origin.getPreviousSibling();
				}
				insert(t) {
					return this.origin.insertBefore(t), this;
				}
			}
		},
		Tu = {
			next: class extends fu {
				direction = "next";
				getNodeAtCaret() {
					return this.origin.getFirstChild();
				}
				insert(t) {
					return this.origin.splice(0, 0, [t]), this;
				}
			},
			previous: class extends fu {
				direction = "previous";
				getNodeAtCaret() {
					return this.origin.getLastChild();
				}
				insert(t) {
					return this.origin.splice(this.origin.getChildrenSize(), 0, [t]), this;
				}
			}
		};
	function ku(t, e) {
		return t ? new vu[e](t) : null;
	}
	function bu(t, e, n) {
		return t ? new Su[e](t, Nu(t, n)) : null;
	}
	function Nu(t, n, o = "error") {
		const r = t.getTextContentSize();
		let i = "next" === n ? r : "previous" === n ? 0 : n;
		return (i < 0 || i > r) && ("clamp" !== o && e(284, String(n), String(r), t.getKey()), i = i < 0 ? 0 : r), i;
	}
	function wu(t, e) {
		return new Du(t, e);
	}
	function Eu(t, e) {
		return es(t) ? new Tu[e](t) : null;
	}
	function Mu(t) {
		return t && t.getChildCaret() || t;
	}
	function Ou(t) {
		return t && Mu(t.getAdjacentCaret());
	}
	class Au {
		type = "node-caret-range";
		constructor(t, e, n) {
			this.anchor = t, this.focus = e, this.direction = n;
		}
		getLatest() {
			const t = this.anchor.getLatest(),
				e = this.focus.getLatest();
			return t === this.anchor && e === this.focus ? this : new Au(t, e, this.direction);
		}
		isCollapsed() {
			return this.anchor.isSamePointCaret(this.focus);
		}
		getTextSlices() {
			const t = t => {
					const e = this[t].getLatest();
					return yu(e) ? function (t, e) {
						const {
								direction: n,
								origin: o
							} = t,
							r = Nu(o, "focus" === e ? hu(n) : n);
						return wu(t, r - t.offset);
					}(e, t) : null;
				},
				e = t("anchor"),
				n = t("focus");
			if (e && n) {
				const {
						caret: t
					} = e,
					{
						caret: o
					} = n;
				if (t.isSameNodeCaret(o)) return [wu(t, o.offset - t.offset), null];
			}
			return [e, n];
		}
		iterNodeCarets(t = "root") {
			const e = yu(this.anchor) ? this.anchor.getSiblingCaret() : this.anchor.getLatest(),
				n = this.focus.getLatest(),
				o = yu(n),
				r = e => e.isSameNodeCaret(n) ? null : Ou(e) || e.getParentCaret(t);
			return Ku({
				hasNext: t => null !== t && !(o && n.isSameNodeCaret(t)),
				initial: e.isSameNodeCaret(n) ? null : r(e),
				map: t => t,
				step: r
			});
		}
		[Symbol.iterator]() {
			return this.iterNodeCarets("root");
		}
	}
	class Du {
		type = "slice";
		constructor(t, e) {
			this.caret = t, this.distance = e;
		}
		getSliceIndices() {
			const {
					distance: t,
					caret: {
						offset: e
					}
				} = this,
				n = e + t;
			return n < e ? [n, e] : [e, n];
		}
		getTextContent() {
			const [t, e] = this.getSliceIndices();
			return this.caret.origin.getTextContent().slice(t, e);
		}
		getTextContentSize() {
			return Math.abs(this.distance);
		}
		removeTextSlice() {
			const {
					caret: {
						origin: t,
						direction: e
					}
				} = this,
				[n, o] = this.getSliceIndices(),
				r = t.getTextContent();
			return bu(t.setTextContent(r.slice(0, n) + r.slice(o)), e, n);
		}
	}
	function Fu(t) {
		return t instanceof Du;
	}
	function Pu(t, e) {
		return t.direction === e ? t : t.getFlipped();
	}
	function Iu(t) {
		return zu(t, Pu(Eu($l(), hu(t.direction)), t.direction));
	}
	function Lu(t) {
		return zu(t, t);
	}
	function zu(e, n) {
		return e.direction !== n.direction && t(265), new Au(e, n, e.direction);
	}
	function Ku(t) {
		const {
			initial: e,
			hasNext: n,
			step: o,
			map: r
		} = t;
		let i = e;
		return {
			[Symbol.iterator]() {
				return this;
			},
			next() {
				if (!n(i)) return {
					done: true,
					value: void 0
				};
				const t = {
					done: false,
					value: r(i)
				};
				return i = o(i), t;
			}
		};
	}
	function Bu(e, n) {
		const o = Uu(e.origin, n.origin);
		switch (null === o && t(275, e.origin.getKey(), n.origin.getKey()), o.type) {
			case "same":
				{
					const t = "text" === e.type,
						o = "text" === n.type;
					return t && o ? function (t, e) {
						return Math.sign(t - e);
					}(e.offset, n.offset) : e.type === n.type ? 0 : t ? -1 : o ? 1 : "child" === e.type ? -1 : 1;
				}
			case "ancestor":
				return "child" === e.type ? -1 : 1;
			case "descendant":
				return "child" === n.type ? 1 : -1;
			case "branch":
				return Ru(o);
		}
	}
	function Ru(t) {
		const {
				a: e,
				b: n
			} = t,
			o = e.__key,
			r = n.__key;
		let i = e,
			s = n;
		for (; i && s; i = i.getNextSibling(), s = s.getNextSibling()) {
			if (i.__key === r) return -1;
			if (s.__key === o) return 1;
		}
		return null === i ? 1 : -1;
	}
	function Wu(t, e) {
		return e.is(t);
	}
	function $u(t) {
		return es(t) ? [t.getLatest(), null] : [t.getParent(), t.getLatest()];
	}
	function Uu(e, n) {
		if (e.is(n)) return {
			commonAncestor: e,
			type: "same"
		};
		const o = new Map();
		for (let [t, n] = $u(e); t; n = t, t = t.getParent()) o.set(t, n);
		for (let [r, i] = $u(n); r; i = r, r = r.getParent()) {
			const s = o.get(r);
			if (void 0 !== s) return null === s ? (Wu(e, r) || t(276), {
				commonAncestor: r,
				type: "ancestor"
			}) : null === i ? (Wu(n, r) || t(277), {
				commonAncestor: r,
				type: "descendant"
			}) : ((es(s) || Wu(e, s)) && (es(i) || Wu(n, i)) && r.is(s.getParent()) && r.is(i.getParent()) || t(278), {
				a: s,
				b: i,
				commonAncestor: r,
				type: "branch"
			});
		}
		return null;
	}
	function Hu(t) {
		return t;
	}
	function ju(...t) {
		return t;
	}
	function Ju(...t) {
		return t;
	}
	function Vu(t) {
		return t;
	}
	function qu(t, e) {
		if (!e || t === e) return t;
		for (const n in e) if (t[n] !== e[n]) return {
			...t,
			...e
		};
		return t;
	}
	function Yu(...t) {
		const e = [];
		for (const n of t) if (n && "string" == typeof n) for (const [t] of n.matchAll(/\S+/g)) e.push(t);
		return e;
	}
	function Gu(t, ...e) {
		const n = Yu(...e);
		n.length > 0 && t.classList.add(...n);
	}
	function Xu(t, ...e) {
		const n = Yu(...e);
		n.length > 0 && t.classList.remove(...n);
	}
	function Qu(...t) {
		return () => {
			for (let e = t.length - 1; e >= 0; e--) t[e]();
			t.length = 0;
		};
	}
	function Zu(t, e, n) {
		return Qu(...Object.entries(e).map(([e, o]) => jn$2(t, e, o, n)));
	}

	var Lexical_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$addUpdateTag: xc,
		$applyNodeReplacement: Mc,
		$assumeActiveEditor: Pi,
		$caretFromPoint: Cs,
		$caretRangeFromSelection: ks,
		$cloneWithProperties: Ca,
		$cloneWithPropertiesEphemeral: Sa,
		$comparePointCaretNext: Bu,
		$copyNode: Ec,
		$create: Ia,
		$createChildrenArray: za,
		$createLineBreakNode: _s,
		$createNodeSelection: Zr,
		$createParagraphNode: Ws,
		$createPoint: Cr,
		$createRangeSelection: Qr,
		$createRangeSelectionFromDom: ti,
		$createTabNode: yr,
		$createTextNode: hr,
		$extendCaretToRange: Iu,
		$findMatchingParent: La,
		$flushSyncAfterUpdate: Gi,
		$formatText: Fr,
		$fullReconcile: Li,
		$generateNodesFromRawText: gi,
		$getAdjacentChildCaret: Ou,
		$getAdjacentNode: dc,
		$getAdjacentSiblingOrParentSiblingCaret: Fs,
		$getCaretInDirection: Pu,
		$getCaretRange: zu,
		$getCaretRangeInDirection: As,
		$getCharacterOffsets: Ir,
		$getChildCaret: Eu,
		$getChildCaretAtIndex: Ds,
		$getChildCaretOrSelf: Mu,
		$getCollapsedCaretRange: Lu,
		$getCommonAncestor: Uu,
		$getCommonAncestorResultBranchOrder: Ru,
		$getDOMSlot: da,
		$getDOMTextNode: pa,
		$getDocument: Wc,
		$getEditor: ua,
		$getEditorDOMRenderConfig: fa,
		$getNearestNodeFromDOMNode: Bl,
		$getNearestRootOrShadowRoot: bc,
		$getNodeByKey: Il,
		$getNodeByKeyOrThrow: Ac,
		$getNodeFromDOMNode: Ll,
		$getPreviousSelection: oi,
		$getRoot: $l,
		$getSelection: ni,
		$getSelectionSlotFrame: Ja,
		$getSiblingCaret: ku,
		$getSlot: Ya,
		$getSlotFrame: ja,
		$getSlotHost: Ua,
		$getSlotNameWithinHost: Ha,
		$getSlotNames: qa,
		$getState: Tt$7,
		$getStateChange: kt$6,
		$getTextContent: _i,
		$getTextNodeOffset: Nu,
		$getTextPointCaret: bu,
		$getTextPointCaretSlice: wu,
		$getWritableNodeState: Mt$6,
		$hasAncestor: Sc,
		$hasUpdateTag: mc,
		$insertNodeToNearestRootAtCaret: zs,
		$insertNodes: di,
		$isBlockElementNode: Gr,
		$isBlockFullySelected: Ks,
		$isChildCaret: Cu,
		$isDecoratorNode: rs,
		$isEditorState: us,
		$isElementDOMSlot: _a,
		$isElementNode: es,
		$isExtendableTextPointCaret: Os,
		$isInlineElementOrDecoratorNode: kc,
		$isInlineFormattable: or,
		$isLeafNode: El,
		$isLexicalNode: Fo,
		$isLineBreakNode: ps,
		$isNodeCaret: mu,
		$isNodeSelection: Or,
		$isParagraphNode: $s,
		$isRangeSelection: Er,
		$isRootNode: ss,
		$isRootOrShadowRoot: wc,
		$isSelectionCapturedInDecoratorInput: _l,
		$isShadowRootNode: Nc,
		$isSiblingCaret: xu,
		$isSlotChild: Wa,
		$isSlotHost: Ra,
		$isTabNode: mr,
		$isTextNode: gr,
		$isTextPointCaret: yu,
		$isTextPointCaretSlice: Fu,
		$isTokenOrSegmented: Tl,
		$isTokenOrTab: vl,
		$markSlotEditable: wa,
		$needsBlockCursorBeside: Dc,
		$nodesOfType: uc,
		$normalizeCaret: Ms,
		$normalizeSelection__EXPERIMENTAL: Bt$6,
		$onUpdate: Cc,
		$parseSerializedNode: $i,
		$removeFromParent: Ol,
		$removeSlot: su,
		$removeTextFromCaretRange: Es,
		$rewindSiblingCaret: bs,
		$selectAll: sc,
		$setCompositionKey: Fl,
		$setDirectionFromDOM: Ta,
		$setFormatFromDOM: ka,
		$setPointFromCaret: Ss,
		$setSelection: Hl,
		$setSelectionFromCaretRange: vs,
		$setSlot: iu,
		$setState: bt$7,
		$setTextFormat: Dr,
		$splitAtPointCaretNext: Ls,
		$splitNode: Qc,
		$updateDOMSelection: fi,
		$updateRangeSelectionFromCaretRange: Ts,
		ArtificialNode__DO_NOT_USE: ds,
		BEFORE_INPUT_COMMAND: He$2,
		BLUR_COMMAND: Ln$2,
		CAN_REDO_COMMAND: Fn$2,
		CAN_UNDO_COMMAND: Pn$2,
		CAN_USE_BEFORE_INPUT: s$1,
		CAN_USE_DOM: n,
		CLEAR_EDITOR_COMMAND: An$3,
		CLEAR_HISTORY_COMMAND: Dn$3,
		CLICK_COMMAND: Ue$2,
		COLLABORATION_TAG: Bo,
		COMMAND_PRIORITY_BEFORE_CRITICAL: Zs,
		COMMAND_PRIORITY_BEFORE_EDITOR: Ys,
		COMMAND_PRIORITY_BEFORE_HIGH: Qs,
		COMMAND_PRIORITY_BEFORE_LOW: Gs,
		COMMAND_PRIORITY_BEFORE_NORMAL: Xs,
		COMMAND_PRIORITY_CRITICAL: qs,
		COMMAND_PRIORITY_EDITOR: Hs,
		COMMAND_PRIORITY_HIGH: Vs,
		COMMAND_PRIORITY_LOW: js,
		COMMAND_PRIORITY_NORMAL: Js,
		COMPOSITION_END_COMMAND: Ve$2,
		COMPOSITION_END_TAG: jo,
		COMPOSITION_START_COMMAND: Je$2,
		COMPOSITION_START_TAG: Ho,
		CONTROLLED_TEXT_INSERTION_COMMAND: Xe$2,
		CONTROL_OR_ALT: Bn$2,
		CONTROL_OR_META: Kn$2,
		CONTROL_OR_OTHER_KEY: j$2,
		COPY_COMMAND: En$2,
		CUT_COMMAND: Mn$3,
		CUT_TAG: Ko,
		DEFAULT_EDITOR_DOM_CONFIG: nl,
		DELETE_CHARACTER_COMMAND: qe$2,
		DELETE_LINE_COMMAND: en$3,
		DELETE_WORD_COMMAND: tn$3,
		DRAGEND_COMMAND: wn$3,
		DRAGOVER_COMMAND: Nn$2,
		DRAGSTART_COMMAND: bn$3,
		DROP_COMMAND: Tn$2,
		DecoratorNode: os,
		ElementNode: ts,
		FOCUS_COMMAND: In$2,
		FORMAT_ELEMENT_COMMAND: kn$3,
		FORMAT_TEXT_COMMAND: nn$3,
		HISTORIC_TAG: Po,
		HISTORY_MERGE_TAG: Lo,
		HISTORY_PUSH_TAG: Io,
		INDENT_CONTENT_COMMAND: Sn$3,
		INPUT_COMMAND: je$2,
		INSERT_LINE_BREAK_COMMAND: Ye$2,
		INSERT_PARAGRAPH_COMMAND: Ge$2,
		INSERT_TAB_COMMAND: Cn$3,
		INTERNAL_$expandSelectionToWholeDocument: zr,
		INTERNAL_$isBlock: aa,
		IS_ALL_FORMATTING: k,
		IS_ANDROID: c$1,
		IS_ANDROID_CHROME: f$2,
		IS_APPLE: r,
		IS_APPLE_WEBKIT: d$2,
		IS_BOLD: p$1,
		IS_CHROME: u$2,
		IS_CODE: C$1,
		IS_FIREFOX: i,
		IS_HIGHLIGHT: T,
		IS_IOS: l,
		IS_ITALIC: y$1,
		IS_SAFARI: a$1,
		IS_STRIKETHROUGH: m$1,
		IS_SUBSCRIPT: S,
		IS_SUPERSCRIPT: v$1,
		IS_UNDERLINE: x$1,
		KEY_ARROW_DOWN_COMMAND: hn$3,
		KEY_ARROW_LEFT_COMMAND: un$3,
		KEY_ARROW_RIGHT_COMMAND: cn$3,
		KEY_ARROW_UP_COMMAND: dn$3,
		KEY_BACKSPACE_COMMAND: pn$3,
		KEY_DELETE_COMMAND: mn$3,
		KEY_DOWN_COMMAND: ln$3,
		KEY_ENTER_COMMAND: gn$3,
		KEY_ESCAPE_COMMAND: yn$3,
		KEY_MODIFIER_COMMAND: zn$2,
		KEY_SPACE_COMMAND: _n$2,
		KEY_TAB_COMMAND: xn$3,
		LineBreakNode: hs,
		MOVE_TO_END: an$3,
		MOVE_TO_START: fn$3,
		NODE_STATE_DIRECT: xt$7,
		NODE_STATE_KEY: H$3,
		NODE_STATE_LATEST: Ct$7,
		OUTDENT_CONTENT_COMMAND: vn$3,
		PASTE_COMMAND: Qe$2,
		PASTE_TAG: zo,
		ParagraphNode: Bs,
		REDO_COMMAND: sn$3,
		REMOVE_TEXT_COMMAND: Ze$2,
		RootNode: is,
		SELECTION_CHANGE_COMMAND: We$2,
		SELECTION_INSERT_CLIPBOARD_NODES_COMMAND: $e$2,
		SELECT_ALL_COMMAND: On$3,
		SET_TEXT_FORMAT_COMMAND: on$3,
		SKIP_COLLAB_TAG: Ro,
		SKIP_DOM_SELECTION_TAG: $o,
		SKIP_SCROLL_INTO_VIEW_TAG: Wo,
		SKIP_SELECTION_FOCUS_TAG: Uo,
		TEXT_TYPE_TO_FORMAT: K$1,
		TabNode: pr,
		TextNode: rr,
		UNDO_COMMAND: rn$3,
		addClassNamesToElement: Gu,
		buildImportMap: Eo,
		compileKeyboardShortcuts: Un$2,
		configExtension: ju,
		createCommand: Re$2,
		createEditor: ol,
		createRefCountedRegistry: Hn$2,
		createSharedNodeState: Nt$6,
		createState: vt$7,
		declarePeerDependency: Ju,
		defineExtension: Hu,
		findAllLexicalElementsDeep: Bc,
		flipDirection: hu,
		getActiveElement: Yc,
		getActiveElementDeep: Gc,
		getComposedEventTarget: Xc,
		getComposedStaticRange: $c,
		getDOMOwnerDocument: yc,
		getDOMSelection: Pc,
		getDOMSelectionFromTarget: Ic,
		getDOMSelectionPoints: Hc,
		getDOMSelectionRange: Uc,
		getDOMSelectionRangeAndPoints: jc,
		getDOMShadowRoots: Kc,
		getDOMTextNode: Nl,
		getDeclaredSlots: eu,
		getEditorPropertyFromDOMNode: Cl,
		getNearestEditorFromDOMNode: xl,
		getParentElement: pc,
		getRegisteredNode: hl,
		getRegisteredNodeOrThrow: dl,
		getRegisteredSubtypeMap: Pa,
		getRootOwnerDocument: Rc,
		getStaticNodeConfig: Da,
		getStyleObjectFromCSS: Vo,
		getTextDirection: Sl,
		getTransformSetFromKlass: el,
		isBlockDomNode: ca,
		isCurrentlyReadOnlyMode: Oi,
		isDOMCapturingSelection: Ea,
		isDOMDocumentNode: bl,
		isDOMNode: oa,
		isDOMShadowRoot: Lc,
		isDOMTextNode: kl,
		isDOMUnmanaged: Na,
		isDocumentFragment: ra,
		isExactShortcutMatch: oc,
		isHTMLAnchorElement: Zc,
		isHTMLElement: na,
		isHTMLTableCellElement: ea,
		isHTMLTableRowElement: ta,
		isInlineDomNode: sa,
		isLastChildInBlockNode: ms,
		isLexicalEditor: ml,
		isModifierMatch: nc,
		isOnlyChildInBlockNode: ys,
		isSelectionCapturedInDecoratorInput: pl,
		isSelectionWithinEditor: yl,
		iterStaticNodeConfigChain: Fa,
		keyboardEventMaskForPlatform: tc,
		makeStepwiseIterator: Ku,
		mergeRegister: Qu,
		mountSlotContainer: ha,
		normalizeClassNames: Yu,
		registerEventListener: jn$2,
		registerEventListeners: Zu,
		removeClassNamesFromElement: Xu,
		removeFromParent: Al,
		resetRandomKey: fl,
		safeCast: Vu,
		setDOMStyleFromCSS: Go,
		setDOMStyleObject: Yo,
		setDOMUnmanaged: ba,
		setNodeIndentFromDOM: va,
		shallowMergeConfig: qu,
		stopLexicalPropagation: To$1,
		toggleTextFormatType: wl,
		tokenizeRawText: hi,
		unmountSlotContainer: ga
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	function F(e, ...t) {
		const n = new URL("https://lexical.dev/docs/error"),
			o = new URLSearchParams();
		o.append("code", e);
		for (const e of t) o.append("v", e);
		throw n.search = o.toString(), Error(`Minified Lexical error #${e}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	/*@__INLINE__*/
	function b$2(e) {
		let t = e;
		for (; null != t;) {
			if (t.nodeType === Node.TEXT_NODE) return t;
			t = t.firstChild;
		}
		return null;
	}
	function z$1(e) {
		const t = e.parentNode;
		if (null == t) throw new Error("Should never happen");
		return [t, Array.from(t.childNodes).indexOf(e)];
	}
	function A(n, o, l, r, i) {
		const s = o.getKey(),
			c = r.getKey(),
			f = Rc(n.getRootElement()).createRange();
		let u = n.getElementByKey(s),
			g = n.getElementByKey(c),
			a = l,
			d = i;
		if (gr(o) && (u = b$2(u)), gr(r) && (g = b$2(g)), void 0 === o || void 0 === r || null === u || null === g) return null;
		"BR" === u.nodeName && ([u, a] = z$1(u)), "BR" === g.nodeName && ([g, d] = z$1(g));
		const p = u.firstChild;
		u === g && null != p && "BR" === p.nodeName && 0 === a && 0 === d && (d = 1);
		try {
			f.setStart(u, a), f.setEnd(g, d);
		} catch (e) {
			return null;
		}
		return !f.collapsed || a === d && s === c || (f.setStart(g, d), f.setEnd(u, a)), f;
	}
	function R(e, t) {
		const n = e.getRootElement();
		if (null === n) return [];
		const o = n.getBoundingClientRect(),
			l = getComputedStyle(n),
			r = parseFloat(l.paddingLeft) + parseFloat(l.paddingRight),
			i = Array.from(t.getClientRects());
		let s,
			c = i.length;
		i.sort((e, t) => {
			const n = e.top - t.top;
			return Math.abs(n) <= 3 ? e.left - t.left : n;
		});
		for (let e = 0; e < c; e++) {
			const t = i[e],
				n = s && s.top <= t.top && s.top + s.height > t.top && s.left + s.width > t.left,
				l = t.width + r === o.width;
			n || l ? (i.splice(e--, 1), c--) : s = t;
		}
		return i;
	}
	function O$1(e) {
		let t = "";
		for (const n in e) n && (t += `${n}: ${e[n]};`);
		return t;
	}
	function _(e) {
		const t = ua().getElementByKey(e.getKey());
		if (null === t) return null;
		const o = t.ownerDocument.defaultView;
		return null === o ? null : o.getComputedStyle(t);
	}
	function L(e) {
		const t = ss(e) ? e : e.getParent();
		return t && _(t);
	}
	function M$1(e) {
		const t = L(e);
		return null !== t && "rtl" === t.direction;
	}
	function $(e, t, n = "self") {
		const o = e.getStartEndPoints();
		if (t.isSelected(e) && !Tl(t) && null !== o) {
			const [l, r] = o,
				i = e.isBackward(),
				s = l.getNode(),
				c = r.getNode(),
				g = t.is(s),
				a = t.is(c);
			if (g || a) {
				const [o, l] = Ir(e),
					r = s.is(c),
					g = t.is(i ? c : s),
					a = t.is(i ? s : c);
				let d,
					p = 0;
				if (r) p = o > l ? l : o, d = o > l ? o : l;else if (g) {
					p = i ? l : o, d = void 0;
				} else if (a) {
					p = 0, d = i ? o : l;
				}
				const h = t.__text.slice(p, d);
				h !== t.__text && ("clone" === n && (t = Sa(t)), t.__text = h);
			}
		}
		return t;
	}
	function D$1(e) {
		if ("text" === e.type) return e.offset === e.getNode().getTextContentSize();
		const t = e.getNode();
		return es(t) || F(177), e.offset === t.getChildrenSize();
	}
	function U(e, n, l) {
		let i = n.getNode(),
			s = l;
		if (es(i)) {
			const e = i.getDescendantByIndex(n.offset);
			null !== e && (i = e);
		}
		for (; s > 0 && null !== i;) {
			if (es(i)) {
				const e = i.getLastDescendant();
				null !== e && (i = e);
			}
			let l = i.getPreviousSibling(),
				f = 0;
			if (null === l) {
				let e = i.getParentOrThrow(),
					t = e.getPreviousSibling();
				for (; null === t;) {
					if (e = e.getParent(), null === e) {
						l = null;
						break;
					}
					t = e.getPreviousSibling();
				}
				null !== e && (f = e.isInline() ? 0 : 2, l = t);
			}
			let u = i.getTextContent();
			"" === u && es(i) && !i.isInline() && (u = "\n\n");
			const p = u.length;
			if (!gr(i) || s >= p) {
				const e = i.getParent();
				i.remove(), null == e || 0 !== e.getChildrenSize() || ss(e) || e.remove(), s -= p + f, i = l;
			} else {
				const o = i.getKey(),
					l = e.read("latest", () => {
						const e = Il(o);
						return gr(e) && e.isSimpleText() ? e.getTextContent() : null;
					}),
					c = p - s,
					f = u.slice(0, c);
				if (null !== l && l !== u) {
					const e = oi();
					let t = i;
					if (i.isSimpleText()) i.setTextContent(l);else {
						const e = hr(l);
						i.replace(e), t = e;
					}
					if (Er(e) && e.isCollapsed()) {
						const n = e.anchor.offset;
						t.select(n, n);
					}
				} else if (i.isSimpleText()) {
					const e = n.key === o;
					let t = n.offset;
					t < s && (t = p);
					const l = e ? t - s : 0,
						r = e ? t : c;
					if (e && 0 === l) {
						const [e] = i.splitText(l, r);
						e.remove();
					} else {
						const [, e] = i.splitText(l, r);
						e.remove();
					}
				} else {
					const e = hr(f);
					i.replace(e);
				}
				s = 0;
			}
		}
	}
	const j$1 = () => {};
	function H$2(e, n) {
		(Er(e) ? e.isCollapsed() : gr(e) || es(e)) || F(280);
		const o = Vo(Er(e) ? e.style : gr(e) ? e.getStyle() : e.getTextStyle()),
			l = O$1(Object.entries(n).reduce((t, [n, l]) => ("function" == typeof l ? t[n] = l(o[n], e) : null === l ? delete t[n] : t[n] = l, t), {
				...o
			}));
		Er(e) || gr(e) ? e.setStyle(l) : e.setTextStyle(l);
	}
	function V$1(e, t) {
		const n = new Set();
		if (Er(e) && e.isCollapsed()) {
			H$2(e, t);
			const o = e.anchor.getNode();
			es(o) && o.isEmpty() && (n.add(o.getKey()), H$2(o, t));
		}
		W(e => {
			H$2(e, t);
		});
		const o = e.getNodes();
		if (o.length > 0) for (const e of o) {
			if (!es(e) || !e.canBeEmpty() || 0 !== e.getChildrenSize()) continue;
			const o = e.getKey();
			n.has(o) || (n.add(o), H$2(e, t));
		}
	}
	function W(e) {
		const n = ni();
		if (!n) return;
		const o = new Map(),
			c = e => o.get(e.getKey()) || [0, e.getTextContentSize()];
		if (Er(n)) for (const e of ks(n).getTextSlices()) e && o.set(e.caret.origin.getKey(), e.getSliceIndices());
		const f = n.getNodes();
		for (const n of f) {
			if (!gr(n) || !n.canHaveFormat()) continue;
			const [o, l] = c(n);
			if (l !== o) if (Tl(n) || 0 === o && l === n.getTextContentSize()) e(n);else {
				e(n.splitText(o, l)[0 === o ? 0 : 1]);
			}
		}
		Er(n) && "text" === n.anchor.type && "text" === n.focus.type && n.anchor.key === n.focus.key && X$1(n);
	}
	function X$1(e) {
		if (e.isBackward()) {
			const {
					anchor: t,
					focus: n
				} = e,
				{
					key: o,
					offset: l,
					type: r
				} = t;
			t.set(n.key, n.offset, n.type), n.set(o, l, r);
		}
	}
	function q$1(e, t) {
		const n = e.getFormatType(),
			o = e.getIndent();
		n !== t.getFormatType() && t.setFormat(n), o !== t.getIndent() && t.setIndent(o);
	}
	function G$1(e, t, n) {
		let o = Cs(e, n);
		if (Os(o)) return false;
		for (; o; o = o.getParentCaret()) {
			const e = o.getParentAtCaret();
			if (!e || o.getNodeAtCaret()) return false;
			if (t.is(e)) return true;
		}
		return false;
	}
	function J$2(e, t, n = q$1) {
		if (!e) return;
		const o = e.getStartEndPoints();
		let l = false,
			r = null;
		const i = new Map();
		if (o) {
			const [t, n] = o,
				s = La(t.getNode(), aa);
			r = La(n.getNode(), aa);
			const f = e.isBackward() ? "previous" : "next";
			l = es(r) && !r.is(s) && function (e, t, n) {
				const o = e.getNode();
				return (!es(o) || !o.isEmpty()) && G$1(e, t, n);
			}(n, r, hu(f)), es(s) && i.set(s.getKey(), s), es(r) && !l && i.set(r.getKey(), r);
		}
		for (const t of e.getNodes()) if (es(t) && aa(t)) {
			if (l && t.is(r)) continue;
			i.set(t.getKey(), t);
		} else if (!o) {
			const e = La(t, aa);
			es(e) && i.set(e.getKey(), e);
		}
		for (const e of i.values()) {
			if (null !== Ua(e)) continue;
			const o = t();
			n(e, o), e.replace(o, true);
		}
	}
	function Q$2(e) {
		return e.getNode().isAttached();
	}
	function Y$1(e) {
		let t = e;
		for (; null !== t && !wc(t);) {
			const e = t.getLatest(),
				n = t.getParent();
			0 === e.getChildrenSize() && t.remove(true), t = n;
		}
	}
	function Z$3(e, t, n = null) {
		const o = e.getStartEndPoints(),
			l = o ? o[0] : null,
			r = e.getNodes(),
			i = r.length;
		if (null !== l) {
			const e = ja(l.getNode());
			if (null !== e && !wc(e)) return;
		}
		if (null !== l && (0 === i || 1 === i && "element" === l.type && 0 === l.getNode().getChildrenSize())) {
			const e = "text" === l.type ? l.getNode().getParentOrThrow() : l.getNode(),
				o = e.getChildren();
			let r = t();
			return r.setFormat(e.getFormatType()), r.setIndent(e.getIndent()), o.forEach(e => r.append(e)), n && (r = n.append(r)), void e.replace(r);
		}
		let s = null,
			c = [];
		for (let o = 0; o < i; o++) {
			const l = r[o];
			wc(l) ? (ee$3(e, c, c.length, t, n), c = [], s = l) : null === s || null !== s && Sc(l, s) ? c.push(l) : (ee$3(e, c, c.length, t, n), c = [l]);
		}
		ee$3(e, c, c.length, t, n);
	}
	function ee$3(e, t, n, o, l = null) {
		if (0 === t.length) return;
		const i = t[0],
			s = new Map(),
			f = [],
			u = es(i) ? i : i.getParentOrThrow();
		let g = u.isInline() ? u.getParentOrThrow() : u,
			d = false;
		for (; null !== g;) {
			const e = g.getPreviousSibling();
			if (null !== e) {
				g = e, d = true;
				break;
			}
			if (g = g.getParentOrThrow(), wc(g)) break;
		}
		const p = new Set();
		for (let e = 0; e < n; e++) {
			const n = t[e];
			es(n) && 0 === n.getChildrenSize() && p.add(n.getKey());
		}
		const h = new Set();
		for (let e = 0; e < n; e++) {
			const n = t[e];
			let l = n.getParent();
			if (null !== l && l.isInline() && (l = l.getParent()), null !== l && El(n) && !h.has(n.getKey())) {
				const e = l.getKey();
				if (void 0 === s.get(e)) {
					const t = o();
					t.setFormat(l.getFormatType()), t.setIndent(l.getIndent()), f.push(t), s.set(e, t);
					const n = l.getChildren();
					t.splice(t.getChildrenSize(), 0, n);
					for (const e of n) if (h.add(e.getKey()), es(e)) for (const t of e.getChildrenKeys()) h.add(t);
					Y$1(l);
				}
			} else if (p.has(n.getKey())) {
				es(n) || F(179);
				const e = o();
				e.setFormat(n.getFormatType()), e.setIndent(n.getIndent()), f.push(e), n.remove(true);
			}
		}
		if (null !== l) for (let e = 0; e < f.length; e++) {
			const t = f[e];
			l.append(t);
		}
		let y = null;
		if (wc(g)) {
			if (d) {
				if (null !== l) g.insertAfter(l);else for (let e = f.length - 1; e >= 0; e--) {
					const t = f[e];
					g.insertAfter(t);
				}
			} else {
				const e = g,
					t = e.getFirstChild();
				if (es(t) && (g = t), null === t) {
					if (l) e.append(l);else for (let t = 0; t < f.length; t++) {
						const n = f[t];
						e.append(n), y = n;
					}
				} else if (null !== l) t.insertBefore(l);else for (let e = 0; e < f.length; e++) {
					const n = f[e];
					t.insertBefore(n), y = n;
				}
			}
		} else if (l) g.insertAfter(l);else for (let e = f.length - 1; e >= 0; e--) {
			const t = f[e];
			g.insertAfter(t), y = t;
		}
		const m = oi();
		Er(m) && Q$2(m.anchor) && Q$2(m.focus) ? Hl(m.clone()) : null !== y ? y.selectEnd() : e.dirty = true;
	}
	function te$3(e) {
		const t = ne$3(e);
		return null !== t && "vertical-rl" === t.writingMode;
	}
	function ne$3(e) {
		const t = e.anchor.getNode();
		return es(t) ? _(t) : L(t);
	}
	function oe$3(e, n) {
		let o = te$3(e) ? !n : n;
		re$3(e) && (o = !o);
		const l = Cs(e.focus, o ? "previous" : "next");
		if (Os(l)) return false;
		if (yu(l) && !mr(l.origin) && l.origin.isUnmergeable()) {
			const e = l.getNodeAtCaret();
			if (gr(e) && !mr(e)) return true;
		}
		for (const e of Iu(l)) {
			if (Cu(e)) return !e.origin.isInline();
			if (!es(e.origin)) {
				if (rs(e.origin)) return true;
				break;
			}
		}
		return false;
	}
	function le$3(e, t, n, o) {
		e.modify(t ? "extend" : "move", n, o);
	}
	function re$3(e) {
		const t = ne$3(e);
		return null !== t && "rtl" === t.direction;
	}
	function ie$3(e, t, n) {
		const o = re$3(e);
		let l;
		l = te$3(e) || o ? !n : n, le$3(e, t, l, "character");
	}
	function se$3(e, t, n) {
		const o = e.getStyle(),
			l = Vo(o);
		return null !== l && l[t] || n;
	}
	function ce$3(e, n, o = "") {
		let l = null;
		const i = e.getNodes();
		let s, c;
		if (Er(e)) {
			if (e.isCollapsed() && "" !== e.style) {
				const t = Vo(e.style);
				if (null !== t && n in t) return t[n];
			}
			const {
					anchor: o,
					focus: l
				} = e,
				r = e.isBackward(),
				i = r ? l.getNode() : o.getNode(),
				f = r ? o.getNode() : l.getNode(),
				u = r ? l.offset : o.offset,
				g = r ? o.offset : l.offset;
			gr(i) && u === i.getTextContentSize() && (s = i), 0 === g && (c = f);
		}
		for (let e = 0; e < i.length; e++) {
			const r = i[e];
			if (gr(r) && !r.is(0 === e ? s : c)) {
				const e = se$3(r, n, o);
				if (null === l) l = e;else if (l !== e) {
					l = "";
					break;
				}
			}
		}
		return null === l ? o : l;
	}
	const fe$3 = Vo,
		ue$3 = U;

	var LexicalSelection_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$addNodeStyle: j$1,
		$cloneWithProperties: Ca,
		$copyBlockFormatIndent: q$1,
		$ensureForwardRangeSelection: X$1,
		$forEachSelectedTextNode: W,
		$getComputedStyleForElement: _,
		$getComputedStyleForParent: L,
		$getSelectionStyleValueForProperty: ce$3,
		$isAtEdgeOfElement: G$1,
		$isAtNodeEnd: D$1,
		$isParentElementRTL: re$3,
		$isParentRTL: M$1,
		$moveCaretSelection: le$3,
		$moveCharacter: ie$3,
		$patchStyleText: V$1,
		$selectAll: sc,
		$setBlocksType: J$2,
		$shouldOverrideDefaultCharacterSelection: oe$3,
		$sliceSelectedTextNodeContent: $,
		$trimTextContentFromAnchor: U,
		$wrapNodes: Z$3,
		createDOMRange: A,
		createRectsFromDOMRange: R,
		getCSSFromStyleObject: O$1,
		getStyleObjectFromCSS: fe$3,
		trimTextContentFromAnchor: ue$3
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	function J$1(t, ...e) {
		const n = new URL("https://lexical.dev/docs/error"),
			o = new URLSearchParams();
		o.append("code", t);
		for (const t of e) o.append("v", t);
		throw n.search = o.toString(), Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	function Q$1(t) {
		const e = (t, e) => e.left >= t.left - 1 && e.top >= t.top - 1 && e.right <= t.right + 1 && e.bottom <= t.bottom + 1,
			n = [];
		for (const o of Array.from(t)) if (!(o.width < .5 || o.height < .5 || n.some(t => e(o, t)))) {
			for (let t = n.length - 1; t >= 0; t--) e(n[t], o) && n.splice(t, 1);
			n.push(o);
		}
		return n;
	}
	function Z$2(t) {
		return `${t}px`;
	}
	const tt$3 = {
		attributes: true,
		characterData: true,
		childList: true,
		subtree: true
	};
	function et$3(e, r, i) {
		let l = null,
			s = null,
			u = null,
			c = [];
		const f = Rc(e.getRootElement()).createElement("div");
		function d() {
			null === l && J$1(182), null === s && J$1(183);
			const {
					left: o,
					top: u
				} = s.getBoundingClientRect(),
				d = Q$1(R(e, r));
			var a, g;
			f.isConnected || (g = f, (a = s).insertBefore(g, a.firstChild));
			let p = false;
			for (let t = 0; t < d.length; t++) {
				const e = d[t],
					r = c[t] || Rc(l).createElement("div"),
					i = r.style;
				"absolute" !== i.position && (i.position = "absolute", p = true);
				const s = Z$2(e.left - o);
				i.left !== s && (i.left = s, p = true);
				const a = Z$2(e.top - u);
				i.top !== a && (r.style.top = a, p = true);
				const g = Z$2(e.width);
				i.width !== g && (r.style.width = g, p = true);
				const h = Z$2(e.height);
				i.height !== h && (r.style.height = h, p = true), r.parentNode !== f && (f.append(r), p = true), c[t] = r;
			}
			for (; c.length > d.length;) {
				const t = c.pop();
				null != t && t.remove();
			}
			p && i(c);
		}
		function a() {
			s = null, l = null, null !== u && u.disconnect(), u = null, f.remove();
			for (const t of c) t.remove();
			c = [];
		}
		function g() {
			const t = e.getRootElement();
			if (null === t) return a();
			const n = t.parentElement;
			if (!na(n)) return a();
			a(), l = t, s = n, u = new MutationObserver(t => {
				const n = e.getRootElement(),
					o = n && n.parentElement;
				if (n !== l || o !== s) return g();
				for (const e of t) if (!f.contains(e.target)) return d();
			}), u.observe(n, tt$3), d();
		}
		f.style.position = "relative";
		const p = e.registerRootListener(() => (g(), a));
		return () => {
			p(), a();
		};
	}
	function nt$3(t, e, n, o) {
		if ("text" !== e.type && es(n)) {
			const r = da(n, o, t);
			return [r.element, r.getFirstChildOffset() + e.offset];
		}
		return [(gr(n) ? pa(n, o, t) : Nl(o)) || o, e.offset];
	}
	function ot$4(t) {
		for (const e of t) {
			const t = e.style;
			"Highlight" !== t.background && (t.background = "Highlight"), "HighlightText" !== t.color && (t.color = "HighlightText"), t.marginTop !== Z$2(-1.5) && (t.marginTop = Z$2(-1.5)), t.paddingTop !== Z$2(4) && (t.paddingTop = Z$2(4)), t.paddingBottom !== Z$2(0) && (t.paddingBottom = Z$2(0));
		}
	}
	function rt$4(t, e = ot$4) {
		let n = null,
			o = null,
			s = null,
			u = null,
			c = null,
			f = null,
			d = () => {};
		function a(r) {
			r.read(() => {
				const r = ni();
				if (!Er(r)) return n = null, s = null, u = null, f = null, d(), void (d = () => {});
				const [a, g] = function (t) {
						const e = t.getStartEndPoints();
						return t.isBackward() ? [e[1], e[0]] : e;
					}(r),
					p = a.getNode(),
					h = p.getKey(),
					m = a.offset,
					y = g.getNode(),
					v = y.getKey(),
					E = g.offset,
					w = t.getElementByKey(h),
					C = t.getElementByKey(v),
					S = null === n || w !== o || m !== s || h !== n.getKey(),
					x = null === u || C !== c || E !== f || v !== u.getKey();
				if ((S || x) && null !== w && null !== C) {
					const n = function (t, e, n, o, r, i, l) {
						const s = (t._window ? t._window.document : document).createRange();
						return s.setStart(...nt$3(t, e, n, o)), s.setEnd(...nt$3(t, r, i, l)), s;
					}(t, a, p, w, g, y, C);
					d(), d = et$3(t, n, e);
				}
				n = p, o = w, s = m, u = y, c = C, f = E;
			}, {
				editor: t
			});
		}
		return a(t.getEditorState()), Qu(t.registerUpdateListener(({
			editorState: t
		}) => a(t)), () => {
			d();
		});
	}
	function it$4(t, e) {
		let n = null;
		const o = () => {
			const o = t.getRootElement(),
				r = null !== o ? o.ownerDocument.defaultView : null,
				i = null !== r ? r.getSelection() : null,
				l = null !== i ? Hc(i, o).anchorNode : null;
			null !== l && null !== o && o.contains(l) ? null !== n && (n(), n = null) : null === n && (n = rt$4(t, e));
		};
		return t.registerRootListener(t => {
			if (t) {
				const e = t.ownerDocument,
					i = Qu(jn$2(e, "selectionchange", o), () => {
						null !== n && n();
					});
				return o(), i;
			}
		});
	}
	function lt$4(t, e) {
		const n = t.ownerDocument,
			o = n.defaultView || window;
		let r = o.getComputedStyle(t);
		const i = "absolute" === r.position,
			l = e ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
		if ("fixed" === r.position) return n.body;
		for (let e = t; e = pc(e);) if (r = o.getComputedStyle(e), (!i || "static" !== r.position) && l.test(r.overflow + r.overflowY + r.overflowX)) return e;
		return n.body;
	}
	function st$4(t, e) {
		for (const n of e) if (t.type.startsWith(n)) return true;
		return false;
	}
	function ut$4(t, e) {
		const n = t[Symbol.iterator]();
		return new Promise((t, o) => {
			const r = [],
				i = () => {
					const {
						done: l,
						value: s
					} = n.next();
					if (l) return t(r);
					const u = new FileReader();
					u.addEventListener("error", o), u.addEventListener("load", () => {
						const t = u.result;
						"string" == typeof t && r.push({
							file: s,
							result: t
						}), i();
					}), st$4(s, e) ? u.readAsDataURL(s) : i();
				};
			i();
		});
	}
	function ct$4(t, e) {
		return Array.from(at$4(t, e));
	}
	function ft$5(t) {
		return t ? t.getAdjacentCaret() : null;
	}
	function dt$5(t, e) {
		return Array.from(Ct$6(t, e));
	}
	function at$4(t, e) {
		return yt$6("next", t, e);
	}
	function gt$4(t, e) {
		return Array.from(pt$5(t, e));
	}
	function* pt$5(t, e) {
		for (const n of yt$6("next", t, e)) {
			yield n;
			const {
				node: t,
				depth: o
			} = n;
			if (Ra(t) && !t.is(e)) for (const e of qa(t)) {
				const n = Ya(t, e);
				null !== n && (yield* ht$6(n, o + 1));
			}
		}
	}
	function* ht$6(t, e) {
		yield {
			depth: e,
			node: t
		};
		const n = e + 1;
		if (Ra(t)) for (const e of qa(t)) {
			const o = Ya(t, e);
			null !== o && (yield* ht$6(o, n));
		}
		if (es(t)) for (const e of t.getChildren()) yield* ht$6(e, n);
	}
	function mt$6(t, e) {
		const n = Fs(ku(t, e));
		return n && n[0];
	}
	function yt$6(t, e, n) {
		const o = $l(),
			r = e || o,
			i = es(r) ? Eu(r, t) : ku(r, t),
			l = Et$5(r),
			u = n ? Ou(Mu(ku(n, t))) || mt$6(n, t) : mt$6(r, t);
		let c = l;
		return Ku({
			hasNext: t => null !== t,
			initial: i,
			map: t => ({
				depth: c,
				node: t.origin
			}),
			step: t => {
				if (t.isSameNodeCaret(u)) return null;
				Cu(t) && c++;
				const e = Fs(t);
				return !e || e[0].isSameNodeCaret(u) ? null : (c += e[1], e[0]);
			}
		});
	}
	function vt$6(t) {
		const e = Fs(ku(t, "next"));
		return e && [e[0].origin, e[1]];
	}
	function Et$5(t) {
		let e = -1;
		for (let n = t; null !== n; n = n.getParent() ?? Ua(n)) e++;
		return e;
	}
	function wt$5(t) {
		const e = Mu(ku(t, "previous")),
			n = Fs(e, "root");
		return n && n[0].origin;
	}
	function Ct$6(t, e) {
		return yt$6("previous", t, e);
	}
	function St$6(t, e) {
		return Array.from(xt$6(t, e));
	}
	function* xt$6(t, e) {
		const n = [];
		for (const o of yt$6("previous", t, e)) {
			for (; n.length > 0 && o.depth <= n[n.length - 1].depth;) {
				const t = n.pop();
				yield* Nt$5(t.node, t.depth + 1);
			}
			yield o;
			const {
				node: t,
				depth: r
			} = o;
			Ra(t) && qa(t).length > 0 && !t.is(e) && n.push({
				depth: r,
				node: t
			});
		}
		for (; n.length > 0;) {
			const t = n.pop();
			yield* Nt$5(t.node, t.depth + 1);
		}
	}
	function* Nt$5(t, e) {
		const n = qa(t);
		for (let o = n.length - 1; o >= 0; o--) {
			const r = Ya(t, n[o]);
			null !== r && (yield* At$5(r, e));
		}
	}
	function* At$5(t, e) {
		yield {
			depth: e,
			node: t
		};
		const n = e + 1;
		if (es(t)) {
			const e = t.getChildren();
			for (let t = e.length - 1; t >= 0; t--) yield* At$5(e[t], n);
		}
		Ra(t) && (yield* Nt$5(t, n));
	}
	function bt$6(t, e) {
		let n = t;
		for (; null != n;) {
			if (n instanceof e) return n;
			n = n.getParent();
		}
		return null;
	}
	function Rt$6(t) {
		const e = La(t, t => es(t) && !t.isInline());
		return es(e) || J$1(4, t.__key), e;
	}
	function _t$5(t, e, n, o) {
		const r = t => t instanceof e;
		return t.registerNodeTransform(e, t => {
			const e = (t => {
				const e = t.getChildren();
				for (let t = 0; t < e.length; t++) {
					const n = e[t];
					if (r(n)) return null;
				}
				let n = t,
					o = t;
				for (; null !== n;) if (o = n, n = n.getParent(), r(n)) return {
					child: o,
					parent: n
				};
				return null;
			})(t);
			if (null !== e) {
				const {
					child: r,
					parent: i
				} = e;
				if (r.is(t)) {
					o(i, t);
					const e = r.getNextSiblings(),
						l = e.length;
					if (i.insertAfter(r), 0 !== l) {
						const t = n(i);
						r.insertAfter(t);
						for (let n = 0; n < l; n++) t.append(e[n]);
					}
					i.canBeEmpty() || 0 !== i.getChildrenSize() || i.remove();
				}
			}
		});
	}
	function It$4(t, e) {
		const n = new Map(),
			o = t._pendingEditorState;
		for (const [t, o] of e._nodeMap) n.set(t, Ca(o));
		o && (o._nodeMap = n), Li();
		const r = e._selection;
		Hl(null === r ? null : r.clone());
	}
	function Pt$5(t) {
		const e = ni() || oi();
		let n;
		if (Er(e)) n = Cs(e.focus, "next");else {
			if (null != e) {
				const t = e.getNodes(),
					o = t[t.length - 1];
				o && (n = ku(o, "next"));
			}
			n = n || Eu($l(), "previous").getFlipped().insert(Ws());
		}
		const o = zs(t, n, Os(r = n) || null !== Fs(yu(r) ? r.getSiblingCaret() : r, "shadowRoot") ? {
			$shouldSplit: (t, e) => "last" !== e
		} : void 0);
		var r;
		const s = Ou(o),
			u = Cu(s) ? Ms(s) : o;
		return vs(Lu(u)), t.getLatest();
	}
	function Dt$5(t) {
		const e = ni();
		if (!Er(e)) return void (e && e.insertNodes([t]));
		const n = ks(e);
		let o = As(Es(n), "next").anchor;
		if (yu(o)) {
			const t = Ls(o);
			if (!t) return;
			o = t;
		}
		const r = o.getFlipped();
		r.insert(t), vs(zu(r, r));
	}
	function Lt$5(t, e) {
		const n = e();
		return t.replace(n), n.append(t), n;
	}
	function Bt$5(t, e) {
		if (null == t) return false;
		const n = Object.getPrototypeOf(t);
		return null != n && null != n.constructor && n.constructor.name === e.name;
	}
	function Ot$5(t) {
		let e = null;
		if (Bt$5(t, DragEvent) ? e = t.dataTransfer : Bt$5(t, ClipboardEvent) && (e = t.clipboardData), null === e) return [false, [], false];
		const n = e.types,
			o = n.includes("Files"),
			r = n.includes("text/html") || n.includes("text/plain");
		return [o, Array.from(e.files), r];
	}
	function Tt$6(t, e) {
		const n = [];
		for (let o = 0; o < t.length; o++) {
			const r = e(t[o]);
			null !== r && n.push(r);
		}
		return n;
	}
	function Mt$5(t) {
		const e = ni();
		if (!Er(e)) return false;
		const n = new Set(),
			o = e.getNodes();
		for (let e = 0; e < o.length; e++) {
			const r = o[e],
				i = r.getKey();
			if (n.has(i)) continue;
			const l = La(r, t => es(t) && !t.isInline());
			if (null === l) continue;
			const u = l.getKey();
			l.canIndent() && !n.has(u) && (n.add(u), t(l));
		}
		return n.size > 0;
	}
	function Ft$5(t, e) {
		Eu(t, "next").insert(e);
	}
	let $t$5 = !(i || !n) && void 0;
	function Kt$4(t, e = false) {
		let n = 1;
		if (function () {
			if (void 0 === $t$5) {
				const t = document.createElement("div");
				t.style.position = "absolute", t.style.opacity = "0", t.style.width = "100px", t.style.left = "-1000px", document.body.appendChild(t);
				const e = t.getBoundingClientRect();
				t.style.setProperty("zoom", "2"), $t$5 = t.getBoundingClientRect().width === e.width, document.body.removeChild(t);
			}
			return $t$5;
		}() || e) {
			const e = t && t.ownerDocument.defaultView || window;
			for (; t;) n *= Number(e.getComputedStyle(t).getPropertyValue("zoom")), t = pc(t);
		}
		return n;
	}
	function kt$5(t) {
		return null !== t._parentEditor;
	}
	function Ht$5(t, e) {
		return Ut$5(t, e, null);
	}
	function Ut$5(t, e, n) {
		let o = false;
		for (const r of Vt$5(t)) e(r) ? null !== n && n(r) : (o = true, es(r) && Ut$5(r, e, n || (t => r.insertAfter(t))), r.remove());
		return o;
	}
	function jt$4(t, e) {
		const n = [],
			o = Array.from(t).reverse();
		for (let t = o.pop(); void 0 !== t; t = o.pop()) if (e(t)) n.push(t);else if (es(t)) for (const e of Vt$5(t)) o.push(e);
		return n;
	}
	function zt$5(t) {
		return Wt$5(Eu(t, "next"));
	}
	function Vt$5(t) {
		return Wt$5(Eu(t, "previous"));
	}
	function Wt$5(t) {
		return Ku({
			hasNext: xu,
			initial: t.getAdjacentCaret(),
			map: t => t.origin.getLatest(),
			step: t => t.getAdjacentCaret()
		});
	}
	function Xt$5(t) {
		bs(ku(t, "next")).splice(1, t.getChildren());
	}
	function Gt$5(t) {
		const e = e => Tt$7(e, t),
			n = (e, n) => bt$7(e, t, n);
		return {
			$get: e,
			$set: n,
			accessors: [e, n],
			makeGetterMethod: () => function () {
				return e(this);
			},
			makeSetterMethod: () => function (t) {
				return n(this, t);
			},
			stateConfig: t
		};
	}
	function Yt$5(t, e) {
		const n = ni();
		if (Er(n) && n.isCollapsed()) {
			const o = La(n.anchor.getNode(), t);
			if (o) {
				const t = o.getParent();
				if (null !== t && t.getFirstChild() === o && Jt$5(n.anchor, o)) return o.insertBefore(Ws()).selectEnd(), e && e.preventDefault(), true;
			}
		}
		return false;
	}
	function qt$5(t, e) {
		const n = ni();
		if (Er(n) && n.isCollapsed()) {
			const o = La(n.anchor.getNode(), t);
			if (o) {
				const t = o.getParent();
				if (null !== t && t.getLastChild() === o && Qt$5(n.anchor, o)) return o.insertAfter(Ws()).selectEnd(), e && e.preventDefault(), true;
			}
		}
		return false;
	}
	function Jt$5(t, n) {
		return G$1(t, n, "previous");
	}
	function Qt$5(t, n) {
		return G$1(t, n, "next");
	}

	var LexicalUtils_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$descendantsMatching: jt$4,
		$dfs: ct$4,
		$dfsIterator: at$4,
		$dfsWithSlots: gt$4,
		$dfsWithSlotsIterator: pt$5,
		$filter: Tt$6,
		$findMatchingParent: La,
		$firstToLastIterator: zt$5,
		$getAdjacentCaret: ft$5,
		$getAdjacentSiblingOrParentSiblingCaret: Fs,
		$getDepth: Et$5,
		$getNearestBlockElementAncestorOrThrow: Rt$6,
		$getNearestNodeOfType: bt$6,
		$getNextRightPreorderNode: wt$5,
		$getNextSiblingOrParentSibling: vt$6,
		$handleIndentAndOutdent: Mt$5,
		$insertFirst: Ft$5,
		$insertNodeIntoLeaf: Dt$5,
		$insertNodeToNearestRoot: Pt$5,
		$insertNodeToNearestRootAtCaret: zs,
		$isAtEndOfNode: Qt$5,
		$isAtStartOfNode: Jt$5,
		$isBlockFullySelected: Ks,
		$isEditorIsNestedEditor: kt$5,
		$lastToFirstIterator: Vt$5,
		$onEscapeDown: qt$5,
		$onEscapeUp: Yt$5,
		$restoreEditorState: It$4,
		$reverseDfs: dt$5,
		$reverseDfsIterator: Ct$6,
		$reverseDfsWithSlots: St$6,
		$reverseDfsWithSlotsIterator: xt$6,
		$splitNode: Qc,
		$unwrapAndFilterDescendants: Ht$5,
		$unwrapNode: Xt$5,
		$wrapNodeInElement: Lt$5,
		CAN_USE_BEFORE_INPUT: s$1,
		CAN_USE_DOM: n,
		IS_ANDROID: c$1,
		IS_ANDROID_CHROME: f$2,
		IS_APPLE: r,
		IS_APPLE_WEBKIT: d$2,
		IS_CHROME: u$2,
		IS_FIREFOX: i,
		IS_IOS: l,
		IS_SAFARI: a$1,
		addClassNamesToElement: Gu,
		calculateZoomLevel: Kt$4,
		dedupeSelectionRects: Q$1,
		eventFiles: Ot$5,
		getScrollParent: lt$4,
		isBlockDomNode: ca,
		isHTMLAnchorElement: Zc,
		isHTMLElement: na,
		isInlineDomNode: sa,
		isMimeType: st$4,
		makeStateWrapper: Gt$5,
		markSelection: rt$4,
		mediaFileReader: ut$4,
		mergeRegister: Qu,
		objectKlassEquals: Bt$5,
		positionNodeOnRange: et$3,
		registerNestedElementResolver: _t$5,
		removeClassNamesFromElement: Xu,
		selectionAlwaysOnDisplay: it$4
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	const zt$4 = Symbol.for("preact-signals");
	function Ut$4() {
		if (Zt$3 > 1) return void Zt$3--;
		let t,
			e = false;
		for (!function () {
			let t = Gt$4;
			for (Gt$4 = void 0; void 0 !== t;) t.S.v === t.v && (t.S.i = t.i), t = t.o;
		}(); void 0 !== Bt$4;) {
			let n = Bt$4;
			for (Bt$4 = void 0, Jt$4++; void 0 !== n;) {
				const o = n.u;
				if (n.u = void 0, n.f &= -3, !(8 & n.f) && ne$2(n)) try {
					n.c();
				} catch (n) {
					e || (t = n, e = true);
				}
				n = o;
			}
		}
		if (Jt$4 = 0, Zt$3--, e) throw t;
	}
	function Ht$4(t) {
		if (Zt$3 > 0) return t();
		Yt$4 = ++Xt$4, Zt$3++;
		try {
			return t();
		} finally {
			Ut$4();
		}
	}
	let Wt$4, Bt$4;
	function Vt$4(t) {
		const e = Wt$4;
		Wt$4 = void 0;
		try {
			return t();
		} finally {
			Wt$4 = e;
		}
	}
	let Gt$4,
		Zt$3 = 0,
		Jt$4 = 0,
		Xt$4 = 0,
		Yt$4 = 0,
		qt$4 = 0;
	function Qt$4(t) {
		if (void 0 === Wt$4) return;
		let e = t.n;
		return void 0 === e || e.t !== Wt$4 ? (e = {
			i: 0,
			S: t,
			p: Wt$4.s,
			n: void 0,
			t: Wt$4,
			e: void 0,
			x: void 0,
			r: e
		}, void 0 !== Wt$4.s && (Wt$4.s.n = e), Wt$4.s = e, t.n = e, 32 & Wt$4.f && t.S(e), e) : -1 === e.i ? (e.i = 0, void 0 !== e.n && (e.n.p = e.p, void 0 !== e.p && (e.p.n = e.n), e.p = Wt$4.s, e.n = void 0, Wt$4.s.n = e, Wt$4.s = e), e) : void 0;
	}
	function te$2(t, e) {
		this.v = t, this.i = 0, this.n = void 0, this.t = void 0, this.l = 0, this.W = null == e ? void 0 : e.watched, this.Z = null == e ? void 0 : e.unwatched, this.name = null == e ? void 0 : e.name;
	}
	function ee$2(t, e) {
		return new te$2(t, e);
	}
	function ne$2(t) {
		for (let e = t.s; void 0 !== e; e = e.n) if (e.S.i !== e.i || !e.S.h() || e.S.i !== e.i) return true;
		return false;
	}
	function oe$2(t) {
		for (let e = t.s; void 0 !== e; e = e.n) {
			const n = e.S.n;
			if (void 0 !== n && (e.r = n), e.S.n = e, e.i = -1, void 0 === e.n) {
				t.s = e;
				break;
			}
		}
	}
	function ie$2(t) {
		let e,
			n = t.s;
		for (; void 0 !== n;) {
			const t = n.p;
			-1 === n.i ? (n.S.U(n), void 0 !== t && (t.n = n.n), void 0 !== n.n && (n.n.p = t)) : e = n, n.S.n = n.r, void 0 !== n.r && (n.r = void 0), n = t;
		}
		t.s = e;
	}
	function re$2(t, e) {
		te$2.call(this, void 0), this.x = t, this.s = void 0, this.g = qt$4 - 1, this.f = 4, this.W = null == e ? void 0 : e.watched, this.Z = null == e ? void 0 : e.unwatched, this.name = null == e ? void 0 : e.name;
	}
	function se$2(t, e) {
		return new re$2(t, e);
	}
	function ce$2(t) {
		const e = t.m;
		if (t.m = void 0, "function" == typeof e) {
			Zt$3++;
			const n = Wt$4;
			Wt$4 = void 0;
			try {
				e();
			} catch (e) {
				throw t.f &= -2, t.f |= 8, ae$2(t), e;
			} finally {
				Wt$4 = n, Ut$4();
			}
		}
	}
	function ae$2(t) {
		for (let e = t.s; void 0 !== e; e = e.n) e.S.U(e);
		t.x = void 0, t.s = void 0, ce$2(t);
	}
	function ue$2(t) {
		if (Wt$4 !== this) throw new Error("Out-of-order effect");
		ie$2(this), Wt$4 = t, this.f &= -2, 8 & this.f && ae$2(this), Ut$4();
	}
	function le$2(t, e) {
		this.x = t, this.m = void 0, this.s = void 0, this.u = void 0, this.f = 32, this.name = null == e ? void 0 : e.name;
	}
	function de$2(t, e) {
		const n = new le$2(t, e);
		try {
			n.c();
		} catch (t) {
			throw n.d(), t;
		}
		const o = n.d.bind(n);
		return o[Symbol.dispose] = o, o;
	}
	function fe$2(t, e = {}) {
		const n = {};
		for (const o in t) {
			const i = e[o],
				r = ee$2(void 0 === i ? t[o] : i);
			n[o] = r;
		}
		return n;
	}
	te$2.prototype.brand = zt$4, te$2.prototype.h = function () {
		return true;
	}, te$2.prototype.S = function (t) {
		const e = this.t;
		e !== t && void 0 === t.e && (t.x = e, this.t = t, void 0 !== e ? e.e = t : Vt$4(() => {
			var t;
			null == (t = this.W) || t.call(this);
		}));
	}, te$2.prototype.U = function (t) {
		if (void 0 !== this.t) {
			const e = t.e,
				n = t.x;
			void 0 !== e && (e.x = n, t.e = void 0), void 0 !== n && (n.e = e, t.x = void 0), t === this.t && (this.t = n, void 0 === n && Vt$4(() => {
				var t;
				null == (t = this.Z) || t.call(this);
			}));
		}
	}, te$2.prototype.subscribe = function (t) {
		return de$2(() => {
			const e = this.value,
				n = Wt$4;
			Wt$4 = void 0;
			try {
				t(e);
			} finally {
				Wt$4 = n;
			}
		}, {
			name: "sub"
		});
	}, te$2.prototype.valueOf = function () {
		return this.value;
	}, te$2.prototype.toString = function () {
		return this.value + "";
	}, te$2.prototype.toJSON = function () {
		return this.value;
	}, te$2.prototype.peek = function () {
		const t = Wt$4;
		Wt$4 = void 0;
		try {
			return this.value;
		} finally {
			Wt$4 = t;
		}
	}, Object.defineProperty(te$2.prototype, "value", {
		get() {
			const t = Qt$4(this);
			return void 0 !== t && (t.i = this.i), this.v;
		},
		set(t) {
			if (t !== this.v) {
				if (Jt$4 > 100) throw new Error("Cycle detected");
				!function (t) {
					0 !== Zt$3 && 0 === Jt$4 && t.l !== Yt$4 && (t.l = Yt$4, Gt$4 = {
						S: t,
						v: t.v,
						i: t.i,
						o: Gt$4
					});
				}(this), this.v = t, this.i++, qt$4++, Zt$3++;
				try {
					for (let t = this.t; void 0 !== t; t = t.x) t.t.N();
				} finally {
					Ut$4();
				}
			}
		}
	}), re$2.prototype = new te$2(), re$2.prototype.h = function () {
		if (this.f &= -3, 1 & this.f) return false;
		if (32 == (36 & this.f)) return true;
		if (this.f &= -5, this.g === qt$4) return true;
		if (this.g = qt$4, this.f |= 1, this.i > 0 && !ne$2(this)) return this.f &= -2, true;
		const t = Wt$4;
		try {
			oe$2(this), Wt$4 = this;
			const t = this.x();
			(16 & this.f || this.v !== t || 0 === this.i) && (this.v = t, this.f &= -17, this.i++);
		} catch (t) {
			this.v = t, this.f |= 16, this.i++;
		}
		return Wt$4 = t, ie$2(this), this.f &= -2, true;
	}, re$2.prototype.S = function (t) {
		if (void 0 === this.t) {
			this.f |= 36;
			for (let t = this.s; void 0 !== t; t = t.n) t.S.S(t);
		}
		te$2.prototype.S.call(this, t);
	}, re$2.prototype.U = function (t) {
		if (void 0 !== this.t && (te$2.prototype.U.call(this, t), void 0 === this.t)) {
			this.f &= -33;
			for (let t = this.s; void 0 !== t; t = t.n) t.S.U(t);
		}
	}, re$2.prototype.N = function () {
		if (!(2 & this.f)) {
			this.f |= 6;
			for (let t = this.t; void 0 !== t; t = t.x) t.t.N();
		}
	}, Object.defineProperty(re$2.prototype, "value", {
		get() {
			if (1 & this.f) throw new Error("Cycle detected");
			const t = Qt$4(this);
			if (this.h(), void 0 !== t && (t.i = this.i), 16 & this.f) throw this.v;
			return this.v;
		}
	}), le$2.prototype.c = function () {
		const t = this.S();
		try {
			if (8 & this.f) return;
			if (void 0 === this.x) return;
			const t = this.x();
			"function" == typeof t && (this.m = t);
		} finally {
			t();
		}
	}, le$2.prototype.S = function () {
		if (1 & this.f) throw new Error("Cycle detected");
		this.f |= 1, this.f &= -9, ce$2(this), oe$2(this), Zt$3++;
		const t = Wt$4;
		return Wt$4 = this, ue$2.bind(this, t);
	}, le$2.prototype.N = function () {
		2 & this.f || (this.f |= 2, this.u = Bt$4, Bt$4 = this);
	}, le$2.prototype.d = function () {
		this.f |= 8, 1 & this.f || ae$2(this);
	}, le$2.prototype.dispose = function () {
		this.d();
	};
	const he$2 = {
		build: (t, e, n) => fe$2(e),
		config: {
			defaultSelection: "rootEnd",
			disabled: false
		},
		name: "@lexical/extension/AutoFocus",
		register(e, n, o) {
			const i = o.getOutput();
			return de$2(() => i.disabled.value ? void 0 : e.registerRootListener(n => {
				e.focus(() => {
					const e = null !== n ? Yc(n) : null;
					null === n || null !== e && n.contains(e) || n.focus({
						preventScroll: true
					});
				}, {
					defaultSelection: i.defaultSelection.peek()
				});
			}));
		}
	};
	function pe$2() {
		const t = $l(),
			r = ni(),
			s = Ws();
		t.clear(), t.append(s), null !== r && s.select(), Er(r) && (r.format = 0);
	}
	function ge$2(t, e = pe$2) {
		return t.registerCommand(An$3, () => (e(), true), Hs);
	}
	const me$2 = {
		build: (t, e, n) => fe$2(e),
		config: {
			$onClear: pe$2
		},
		name: "@lexical/extension/ClearEditor",
		register(t, e, n) {
			const {
				$onClear: o
			} = n.getOutput();
			return de$2(() => ge$2(t, o.value));
		}
	};
	function ye$2(t) {
		return !!rs(t) || !(!es(t) || !t.isShadowRoot());
	}
	function ve$2(t, n, o, i) {
		return !!t.isEditable() && o.target === n && t.read("latest", () => {
			const n = $l().getLastChild();
			if (null === n) return false;
			const r = t.getElementByKey(n.getKey());
			return null !== r && !(o.clientY <= r.getBoundingClientRect().bottom) && i(n);
		});
	}
	const be$2 = {
		build: (t, e) => fe$2(e),
		config: {
			$shouldInsertAfter: ye$2,
			disabled: false
		},
		name: "@lexical/ClickAfterLastBlock",
		register: (t, n, i) => de$2(() => {
			const n = i.getOutput();
			if (!n.disabled.value) return t.registerRootListener(i => {
				if (null === i) return;
				return Zu(i, {
					click: r => {
						ve$2(t, i, r, n.$shouldInsertAfter.peek()) && (r.preventDefault(), To$1(r), t.update(() => {
							const t = $l().getLastChild();
							if (null === t) return;
							if (!n.$shouldInsertAfter.peek()(t)) return;
							const i = Ws();
							t.insertAfter(i), i.select();
						}));
					},
					mousedown: e => {
						ve$2(t, i, e, n.$shouldInsertAfter.peek()) && e.preventDefault();
					}
				}, true);
			});
		})
	};
	function xe$2(t) {
		const e = new Set(),
			n = new Set();
		for (const o of Se$2(t)) {
			const t = "function" == typeof o ? o : o.replace;
			Da(t), e.add(t.getType()), n.add(t);
		}
		return {
			nodes: n,
			types: e
		};
	}
	function Se$2(t) {
		return ("function" == typeof t.nodes ? t.nodes() : t.nodes) || [];
	}
	const Ee$1 = /* @__PURE__ */vt$7("format", {
		parse: t => "number" == typeof t ? t : 0
	});
	let we$1 = class we extends os {
		get __isInlineFormattable() {
			return true;
		}
		$config() {
			return this.config("decorator-text", {
				extends: os,
				stateConfigs: [{
					flat: true,
					stateConfig: Ee$1
				}]
			});
		}
		getFormat(t) {
			return Tt$7(this, Ee$1, t);
		}
		getFormatFlags(t, e) {
			return wl(this.getFormat(), t, e);
		}
		hasFormat(t) {
			const e = K$1[t];
			return 0 !== (this.getFormat() & e);
		}
		setFormat(t) {
			return bt$7(this, Ee$1, t);
		}
		toggleFormat(t) {
			const e = this.getFormat(),
				n = wl(e, t, null);
			return this.setFormat(n);
		}
		isInline() {
			return true;
		}
		createDOM(t, e) {
			return Wc().createElement("span");
		}
	};
	function _e$2(t) {
		return t instanceof we$1;
	}
	function Ne$2(t, e, n) {
		const o = e.fontWeight,
			i = e.textDecoration.split(" "),
			r = "700" === o || "bold" === o,
			s = i.includes("line-through"),
			c = "italic" === e.fontStyle,
			a = i.includes("underline"),
			u = e.verticalAlign;
		return r && !t.hasFormat("bold") && t.toggleFormat("bold"), s && !t.hasFormat("strikethrough") && t.toggleFormat("strikethrough"), c && !t.hasFormat("italic") && t.toggleFormat("italic"), a && !t.hasFormat("underline") && t.toggleFormat("underline"), "sub" !== u || t.hasFormat("subscript") || t.toggleFormat("subscript"), "super" !== u || t.hasFormat("superscript") || t.toggleFormat("superscript"), n && !t.hasFormat(n) && t.toggleFormat(n), t;
	}
	function ke$2(t, e, n = Re$1) {
		let o = e;
		for (const [e, i] of Object.entries(n)) t.hasFormat(i) && (o = Ce$2(o, e));
		return o;
	}
	const Oe$1 = ke$2;
	function Ce$2(t, e) {
		const n = t.ownerDocument.createElement(e);
		return n.appendChild(t), n;
	}
	const Re$1 = {
			b: "bold",
			code: "code",
			em: "italic",
			i: "italic",
			mark: "highlight",
			s: "strikethrough",
			strong: "bold",
			sub: "subscript",
			sup: "superscript",
			u: "underline"
		},
		Ae$1 = {
			name: "@lexical/extension/DecoratorText",
			nodes: () => [we$1]
		};
	function Me$1(t, e) {
		let n;
		return ee$2(t(), {
			unwatched() {
				n && (n(), n = void 0);
			},
			watched() {
				this.value = t(), n = e(this);
			}
		});
	}
	const De$1 = {
		build: t => Me$1(() => t.getEditorState(), e => t.registerUpdateListener(t => {
			e.value = t.editorState;
		})),
		name: "@lexical/extension/EditorState"
	};
	function Ie$1(t, ...e) {
		const n = new URL("https://lexical.dev/docs/error"),
			o = new URLSearchParams();
		o.append("code", t);
		for (const t of e) o.append("v", t);
		throw n.search = o.toString(), Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	let Fe$1;
	try {
		Fe$1 = "0.50.0+prod.esm";
	} catch (t) {}
	const Ke$1 = Fe$1 ?? '"<unknown>+source"',
		Le$2 = new Set(["__proto__", "constructor", "prototype"]);
	function $e$1(t, e) {
		if (t && e && !Array.isArray(e) && "object" == typeof t && "object" == typeof e) {
			const n = t,
				o = e;
			for (const t in o) !Le$2.has(t) && Object.prototype.hasOwnProperty.call(o, t) && (n[t] = $e$1(n[t], o[t]));
			return t;
		}
		return e;
	}
	const je$1 = 0,
		Pe$1 = 1,
		Te$2 = 2,
		ze$1 = 3,
		Ue$1 = 4,
		He$1 = 5,
		We$1 = 6,
		Be$1 = 7;
	function Ve$1(t) {
		return t.id === je$1;
	}
	function Ge$1(t) {
		return t.id === Te$2;
	}
	function Ze$1(t) {
		return function (t) {
			return t.id === Pe$1;
		}(t) || Ie$1(305, String(t.id), String(Pe$1)), Object.assign(t, {
			id: Te$2
		});
	}
	const Je$1 = new Set();
	let Xe$1 = class Xe {
		constructor(t, e) {
			this.builder = t, this.extension = e, this.configs = new Set(), this.state = {
				id: je$1
			};
		}
		mergeConfigs() {
			let t = this.extension.config || {};
			const e = this.extension.mergeConfig ? this.extension.mergeConfig.bind(this.extension) : qu;
			for (const n of this.configs) t = e(t, n);
			return t;
		}
		init(t) {
			const e = this.state;
			Ge$1(e) || Ie$1(306, String(e.id));
			const n = {
					getDependency: this.getInitDependency.bind(this),
					getDirectDependentNames: this.getDirectDependentNames.bind(this),
					getPeer: this.getInitPeer.bind(this),
					getPeerNameSet: this.getPeerNameSet.bind(this)
				},
				o = {
					...n,
					getDependency: this.getDependency.bind(this),
					getInitResult: this.getInitResult.bind(this),
					getPeer: this.getPeer.bind(this)
				},
				i = function (t, e, n) {
					return Object.assign(t, {
						config: e,
						id: ze$1,
						registerState: n
					});
				}(e, this.mergeConfigs(), n);
			let r;
			this.state = i, this.extension.init && (r = this.extension.init(t, i.config, n)), this.state = function (t, e, n) {
				return Object.assign(t, {
					id: Ue$1,
					initResult: e,
					registerState: n
				});
			}(i, r, o);
		}
		build(t) {
			const e = this.state;
			let n;
			e.id !== Ue$1 && Ie$1(307, String(e.id), String(He$1)), this.extension.build && (n = this.extension.build(t, e.config, e.registerState));
			const o = {
				...e.registerState,
				getOutput: () => n,
				getSignal: this.getSignal.bind(this)
			};
			this.state = function (t, e, n) {
				return Object.assign(t, {
					id: He$1,
					output: e,
					registerState: n
				});
			}(e, n, o);
		}
		register(t, e) {
			this._signal = e;
			const n = this.state;
			n.id !== He$1 && Ie$1(308, String(n.id), String(He$1));
			const o = this.extension.register && this.extension.register(t, n.config, n.registerState);
			return this.state = function (t) {
				return Object.assign(t, {
					id: We$1
				});
			}(n), () => {
				const t = this.state;
				t.id !== Be$1 && Ie$1(309, String(n.id), String(Be$1)), this.state = function (t) {
					return Object.assign(t, {
						id: He$1
					});
				}(t), o && o();
			};
		}
		afterRegistration(t) {
			const e = this.state;
			let n;
			return e.id !== We$1 && Ie$1(310, String(e.id), String(We$1)), this.extension.afterRegistration && (n = this.extension.afterRegistration(t, e.config, e.registerState)), this.state = function (t) {
				return Object.assign(t, {
					id: Be$1
				});
			}(e), n;
		}
		getSignal() {
			return void 0 === this._signal && Ie$1(311), this._signal;
		}
		getInitResult() {
			void 0 === this.extension.init && Ie$1(312, this.extension.name);
			const t = this.state;
			return function (t) {
				return t.id >= Ue$1;
			}(t) || Ie$1(313, String(t.id), String(Ue$1)), t.initResult;
		}
		getInitPeer(t) {
			const e = this.builder.extensionNameMap.get(t);
			return e ? e.getExtensionInitDependency() : void 0;
		}
		getExtensionInitDependency() {
			const t = this.state;
			return function (t) {
				return t.id >= ze$1;
			}(t) || Ie$1(314, String(t.id), String(ze$1)), {
				config: t.config
			};
		}
		getPeer(t) {
			const e = this.builder.extensionNameMap.get(t);
			return e ? e.getExtensionDependency() : void 0;
		}
		getInitDependency(t) {
			const e = this.builder.getExtensionRep(t);
			return void 0 === e && Ie$1(315, this.extension.name, t.name), e.getExtensionInitDependency();
		}
		getDependency(t) {
			const e = this.builder.getExtensionRep(t);
			return void 0 === e && Ie$1(315, this.extension.name, t.name), e.getExtensionDependency();
		}
		getState() {
			const t = this.state;
			return function (t) {
				return t.id >= Be$1;
			}(t) || Ie$1(316, String(t.id), String(Be$1)), t;
		}
		getDirectDependentNames() {
			return this.builder.incomingEdges.get(this.extension.name) || Je$1;
		}
		getPeerNameSet() {
			let t = this._peerNameSet;
			return t || (t = new Set((this.extension.peerDependencies || []).map(([t]) => t)), this._peerNameSet = t), t;
		}
		getExtensionDependency() {
			if (!this._dependency) {
				const t = this.state;
				((function (t) {
					return t.id >= He$1;
				}))(t) || Ie$1(317, this.extension.name), this._dependency = {
					config: t.config,
					init: t.initResult,
					output: t.output
				};
			}
			return this._dependency;
		}
	};
	const Ye$1 = {
		tag: Lo
	};
	function qe$1() {
		const t = $l();
		t.isEmpty() && t.append(Ws());
	}
	const Qe$1 = {
			config: {
				setOptions: Ye$1,
				updateOptions: Ye$1
			},
			init: ({
				$initialEditorState: t = qe$1
			}) => ({
				$initialEditorState: t,
				initialized: false
			}),
			afterRegistration(t, {
				updateOptions: e,
				setOptions: n
			}, o) {
				const i = o.getInitResult();
				if (!i.initialized) {
					i.initialized = true;
					const {
						$initialEditorState: o
					} = i;
					if (us(o)) t.setEditorState(o, n);else if ("function" == typeof o) t.update(() => {
						o(t);
					}, e);else if (o && ("string" == typeof o || "object" == typeof o)) {
						const e = t.parseEditorState(o);
						t.setEditorState(e, n);
					}
				}
				return () => {};
			},
			name: "@lexical/extension/InitialState",
			nodes: [is, rr, hs, pr, Bs]
		},
		tn$2 = Symbol.for("@lexical/extension/LexicalBuilder");
	function en$2(...t) {
		return cn$2.fromExtensions(t).buildEditor();
	}
	function nn$2() {}
	function on$2(t) {
		throw t;
	}
	function rn$2(t) {
		return Array.isArray(t) ? t : [t];
	}
	const sn$2 = Ke$1;
	let cn$2 = class cn {
		constructor(t) {
			this.outgoingConfigEdges = new Map(), this.incomingEdges = new Map(), this.extensionNameMap = new Map(), this.conflicts = new Map(), this.PACKAGE_VERSION = sn$2, this.roots = t;
			for (const e of t) this.addExtension(e);
		}
		static fromExtensions(t) {
			const e = [rn$2(Qe$1)];
			for (const n of t) e.push(rn$2(n));
			return new cn(e);
		}
		static maybeFromEditor(t) {
			const e = t[tn$2];
			return e && (e.PACKAGE_VERSION !== sn$2 && Ie$1(292, e.PACKAGE_VERSION, sn$2), e instanceof cn || Ie$1(293)), e;
		}
		static fromEditor(t) {
			const e = cn.maybeFromEditor(t);
			return void 0 === e && Ie$1(294), e;
		}
		constructEditor() {
			const {
					$initialEditorState: t,
					onError: e,
					onWarn: n,
					...o
				} = this.buildCreateEditorArgs(),
				i = Object.assign(ol({
					...o,
					...(e ? {
						onError: t => {
							e(t, i);
						}
					} : {}),
					...(n ? {
						onWarn: t => {
							n(t, i);
						}
					} : {})
				}), {
					[tn$2]: this
				});
			for (const t of this.sortedExtensionReps()) t.build(i);
			return i;
		}
		buildEditor() {
			let t = nn$2;
			function e() {
				try {
					t();
				} finally {
					t = nn$2;
				}
			}
			const n = Object.assign(this.constructEditor(), {
				dispose: e,
				[Symbol.dispose]: e
			});
			return t = Qu(this.registerEditor(n), () => n.setRootElement(null)), n;
		}
		hasExtensionByName(t) {
			return this.extensionNameMap.has(t);
		}
		getExtensionRep(t) {
			const e = this.extensionNameMap.get(t.name);
			if (e) return e.extension !== t && Ie$1(295, t.name), e;
		}
		addEdge(t, e, n) {
			const o = this.outgoingConfigEdges.get(t);
			if (o) {
				const t = o.get(e);
				t ? t.push(...n) : o.set(e, n);
			} else this.outgoingConfigEdges.set(t, new Map([[e, n]]));
			const i = this.incomingEdges.get(e);
			i ? i.add(t) : this.incomingEdges.set(e, new Set([t]));
		}
		addExtension(t) {
			void 0 !== this._sortedExtensionReps && Ie$1(296);
			const e = rn$2(t),
				[n] = e;
			"string" != typeof n.name && Ie$1(297, typeof n.name);
			let o = this.extensionNameMap.get(n.name);
			if (void 0 !== o && o.extension !== n && Ie$1(298, n.name), !o) {
				o = new Xe$1(this, n), this.extensionNameMap.set(n.name, o);
				const t = this.conflicts.get(n.name);
				"string" == typeof t && Ie$1(299, n.name, t);
				for (const t of n.conflictsWith || []) this.extensionNameMap.has(t) && Ie$1(299, n.name, t), this.conflicts.set(t, n.name);
				for (const t of n.dependencies || []) {
					const e = rn$2(t);
					this.addEdge(n.name, e[0].name, e.slice(1)), this.addExtension(e);
				}
				for (const [t, e] of n.peerDependencies || []) this.addEdge(n.name, t, e ? [e] : []);
			}
		}
		sortedExtensionReps() {
			if (this._sortedExtensionReps) return this._sortedExtensionReps;
			const t = [],
				e = (n, o) => {
					let i = n.state;
					if (Ge$1(i)) return;
					const r = n.extension.name;
					var s;
					Ve$1(i) || Ie$1(300, r, o || "[unknown]"), Ve$1(s = i) || Ie$1(304, String(s.id), String(je$1)), i = Object.assign(s, {
						id: Pe$1
					}), n.state = i;
					const c = this.outgoingConfigEdges.get(r);
					if (c) for (const t of c.keys()) {
						const n = this.extensionNameMap.get(t);
						n && e(n, r);
					}
					i = Ze$1(i), n.state = i, t.push(n);
				};
			for (const t of this.extensionNameMap.values()) Ve$1(t.state) && e(t);
			for (const e of t) for (const [t, n] of this.outgoingConfigEdges.get(e.extension.name) || []) if (n.length > 0) {
				const e = this.extensionNameMap.get(t);
				if (e) for (const t of n) e.configs.add(t);
			}
			for (const [t, ...e] of this.roots) if (e.length > 0) {
				const n = this.extensionNameMap.get(t.name);
				void 0 === n && Ie$1(301, t.name);
				for (const t of e) n.configs.add(t);
			}
			return this._sortedExtensionReps = t, this._sortedExtensionReps;
		}
		registerEditor(t) {
			const e = this.sortedExtensionReps(),
				n = new AbortController(),
				o = [() => n.abort()],
				i = n.signal;
			for (const n of e) {
				const e = n.register(t, i);
				e && o.push(e);
			}
			for (const n of e) {
				const e = n.afterRegistration(t);
				e && o.push(e);
			}
			return Qu(...o);
		}
		buildCreateEditorArgs() {
			const t = {},
				e = new Set(),
				n = new Map(),
				o = new Map(),
				i = {},
				r = {},
				s = this.sortedExtensionReps();
			for (const c of s) {
				const {
					extension: s
				} = c;
				if (void 0 !== s.onError && (t.onError = s.onError), void 0 !== s.onWarn && (t.onWarn = s.onWarn), void 0 !== s.disableEvents && (t.disableEvents = s.disableEvents), void 0 !== s.parentEditor && (t.parentEditor = s.parentEditor), void 0 !== s.editable && (t.editable = s.editable), void 0 !== s.namespace && (t.namespace = s.namespace), void 0 !== s.$initialEditorState && (t.$initialEditorState = s.$initialEditorState), s.nodes) for (const t of Se$2(s)) {
					if ("function" != typeof t) {
						const e = n.get(t.replace);
						e && Ie$1(302, s.name, t.replace.name, e.extension.name), n.set(t.replace, c);
					}
					e.add(t);
				}
				if (s.html) {
					if (s.html.export) for (const [t, e] of s.html.export.entries()) o.set(t, e);
					s.html.import && Object.assign(i, s.html.import);
				}
				s.theme && $e$1(r, s.theme);
			}
			Object.keys(r).length > 0 && (t.theme = r), e.size && (t.nodes = [...e]);
			const c = Object.keys(i).length > 0,
				a = o.size > 0;
			(c || a) && (t.html = {}, c && (t.html.import = i), a && (t.html.export = o));
			for (const e of s) e.init(t);
			return t.onError || (t.onError = on$2), t;
		}
	};
	function an$2(t, e) {
		const n = cn$2.fromEditor(t).getExtensionRep(e);
		return void 0 === n && Ie$1(303, e.name), n.getExtensionDependency();
	}
	function un$2(t, e) {
		const n = cn$2.maybeFromEditor(t);
		if (!n) return;
		const o = n.extensionNameMap.get(e);
		return o ? o.getExtensionDependency() : void 0;
	}
	function ln$2(t, e) {
		const n = un$2(t, e);
		return void 0 === n && Ie$1(291, e), n;
	}
	function dn$2(t) {
		return an$2(ua(), t);
	}
	function fn$2(t) {
		return dn$2(t).output;
	}
	function hn$2(t) {
		return un$2(ua(), t);
	}
	const pn$2 = {
		root: {
			children: [],
			direction: null,
			format: "",
			indent: 0,
			type: "root",
			version: 1
		}
	};
	function gn$2(t) {
		const e = t.exportJSON();
		delete e.children, delete e.$slots;
		const n = {
			json: e,
			key: t.__key,
			next: t.__next,
			parent: t.__parent,
			prev: t.__prev
		};
		es(t) && (n.first = t.__first, n.last = t.__last, n.size = t.__size);
		const {
			__slotHost: o,
			__slots: i
		} = t;
		return null != i && (n.slots = [...i]), null != o && (n.slotHost = o), n;
	}
	function mn$2(t) {
		const e = new Map(),
			n = [],
			o = t.map(t => t.read(() => {
				const o = [];
				for (const i of t._nodeMap.values()) {
					let t = e.get(i);
					void 0 === t && (t = n.length, e.set(i, t), n.push(gn$2(i))), o.push(t);
				}
				return {
					nodes: o,
					selection: (r = t._selection, Er(r) ? {
						anchor: {
							key: r.anchor.key,
							offset: r.anchor.offset,
							type: r.anchor.type
						},
						focus: {
							key: r.focus.key,
							offset: r.focus.offset,
							type: r.focus.type
						},
						format: r.format,
						style: r.style,
						type: "range"
					} : Or(r) ? {
						keys: [...r._nodes],
						type: "node"
					} : null)
				};
				var r;
			}));
		return {
			nodes: n,
			states: o
		};
	}
	function yn$2(t) {
		return null != t && "object" == typeof t;
	}
	function vn$2(t) {
		return null == t || "string" == typeof t;
	}
	function bn$2(t) {
		if (!yn$2(t)) return false;
		const {
			first: e,
			json: n,
			key: o,
			last: i,
			next: r,
			parent: s,
			prev: c,
			size: a,
			slotHost: u,
			slots: l
		} = t;
		return yn$2(n) && "string" == typeof n.type && "string" == typeof o && vn$2(s) && vn$2(c) && vn$2(r) && vn$2(e) && vn$2(i) && (void 0 === a || "number" == typeof a) && vn$2(u) && (void 0 === l || Array.isArray(l) && l.every(t => Array.isArray(t) && 2 === t.length && "string" == typeof t[0] && "string" == typeof t[1]));
	}
	function xn$2(t) {
		return yn$2(t) && "string" == typeof t.key && "number" == typeof t.offset && ("text" === t.type || "element" === t.type);
	}
	function Sn$2(t) {
		if (!yn$2(t)) return false;
		const {
			nodes: e,
			states: n
		} = t;
		return Array.isArray(e) && Array.isArray(n) && e.every(bn$2) && n.every(t => yn$2(t) && Array.isArray(t.nodes) && t.nodes.every(t => "number" == typeof t && t >= 0 && t < e.length) && function (t) {
			return null == t || !!yn$2(t) && ("node" === t.type ? Array.isArray(t.keys) && t.keys.every(t => "string" == typeof t) : "range" === t.type && xn$2(t.anchor) && xn$2(t.focus) && "number" == typeof t.format && "string" == typeof t.style);
		}(t.selection));
	}
	function En$1(t, n) {
		if ("root" !== t.type) return $i(t);
		let o;
		if (n.parseEditorState({
			root: t
		}, () => {
			o = $l();
		}), void 0 === o) throw new Error("editorStateFamily: the root version did not parse");
		return o;
	}
	function wn$2(t, e) {
		const n = [],
			o = new Map();
		let i = false,
			r = false;
		const s = e.parseEditorState(pn$2, () => {
			for (const i of t.nodes) {
				let t = null;
				try {
					t = En$1(i.json, e);
				} catch (t) {
					n.push(null);
					continue;
				}
				const r = o.get(i.key);
				void 0 === r ? o.set(i.key, t.__key) : t.__key = r, n.push(t);
			}
			const s = t => null === t ? null : o.get(t) ?? null;
			for (const [e, o] of t.nodes.entries()) {
				const t = n[e];
				if (null === t) continue;
				t.__parent = s(o.parent), t.__prev = s(o.prev), t.__next = s(o.next), es(t) && (t.__first = s(o.first ?? null), t.__last = s(o.last ?? null), t.__size = o.size ?? 0);
				const r = t;
				void 0 !== o.slots && (i = true, r.__slots = new Map(o.slots.flatMap(([t, e]) => {
					const n = s(e);
					return null === n ? [] : [[t, n]];
				}))), void 0 !== o.slotHost && (r.__slotHost = s(o.slotHost));
			}
			r = true;
		});
		return r ? t.states.map(t => {
			const e = new Map();
			for (const o of t.nodes) {
				const t = n[o];
				if (null == t) return null;
				e.set(t.__key, t);
			}
			if (!e.has("root")) return null;
			const r = s.clone(function (t, e) {
				if (null == t) return null;
				if ("node" === t.type) {
					const n = Zr();
					for (const o of t.keys) {
						const t = e.get(o);
						if (void 0 === t) return null;
						n._nodes.add(t);
					}
					return n;
				}
				const n = e.get(t.anchor.key),
					o = e.get(t.focus.key);
				if (void 0 === n || void 0 === o) return null;
				const i = Qr();
				return i.anchor.key = n, i.anchor.offset = t.anchor.offset, i.anchor.type = t.anchor.type, i.focus.key = o, i.focus.offset = t.focus.offset, i.focus.type = t.focus.type, i.format = t.format, i.style = t.style, i;
			}(t.selection, o));
			return r._nodeMap = e, r._slotsUsed = i, r._parsed = false, r;
		}) : t.states.map(() => null);
	}
	const _n$1 = {
			build: t => Me$1(() => t.getRootElement(), e => t.registerRootListener(t => {
				e.value = t;
			})),
			name: "@lexical/extension/RootElement"
		},
		Nn$1 = {
			build: t => Me$1(() => t.isEditable(), e => t.registerEditableListener(t => {
				e.value = t;
			})),
			name: "@lexical/extension/WatchEditable"
		};
	function kn$2(t, e) {
		return function (t, e) {
			const n = `lexicalHMR:${encodeURIComponent(e)}`;
			return void 0 !== t ? `${n}:${encodeURIComponent(t)}` : n;
		}("" === e ? void 0 : e, On$2(t) ? t._config.namespace : "");
	}
	function On$2(t) {
		const e = cn$2.maybeFromEditor(t);
		if (!e) return false;
		for (const n of e.extensionNameMap.values()) {
			const {
				namespace: e
			} = n.extension;
			if (e && e === t._config.namespace) return true;
		}
		return null !== t._parentEditor && On$2(t._parentEditor);
	}
	function Cn$2(t, e) {
		return t.data[e];
	}
	function Rn$1(t) {
		if (null == t || "object" != typeof t) return false;
		const e = t,
			n = t => Object.prototype.hasOwnProperty.call(e, t);
		return n("editable") && n("editorState") && "boolean" == typeof e.editable && function (t) {
			return "object" == typeof t && null !== t && "function" == typeof t.toJSON && "function" == typeof t.isEmpty;
		}(e.editorState);
	}
	const An$2 = {
			afterRegistration(t, {
				hot: e,
				id: n
			}, o) {
				if (!e) return () => {};
				const i = kn$2(t, n),
					r = un$2(t, "@lexical/history/History");
				let s = false;
				const c = Cn$2(e, i);
				if (Rn$1(c)) try {
					t.setEditable(c.editable);
					const e = "function" == typeof c.serialize ? c.serialize() : null;
					if (function (t) {
						if (null == t || "object" != typeof t) return !1;
						const {
							family: e,
							history: n
						} = t;
						if (!Sn$2(e)) return !1;
						if (null == n) return !0;
						const o = t => "number" == typeof t && t >= 0 && t < e.states.length,
							{
								current: i,
								redoStack: r,
								undoStack: s
							} = n;
						return (null === i || o(i)) && Array.isArray(r) && r.every(o) && Array.isArray(s) && s.every(o);
					}(e)) {
						const n = wn$2(e.family, t),
							o = n[0];
						null == o || o.isEmpty() || (o._parsed = !0, t.setEditorState(o, {
							tag: Lo
						}), null != e.history && r && (r.output.historyState.value = function (t, e, n) {
							const o = t => {
									const o = e[t];
									return null == o || o.isEmpty() ? null : {
										editor: n,
										editorState: o
									};
								},
								i = t => t.map(o).filter(t => null !== t),
								r = null === t.current ? null : o(t.current),
								s = i(t.undoStack);
							return {
								current: r,
								redoStack: i(t.redoStack),
								undoStack: s
							};
						}(e.history, n, t)), s = !0);
					} else ;
				} catch (t) {}
				s && o.getInitResult().restoreCount.value++;
				const a = o.getDependency(De$1).output,
					u = o.getDependency(Nn$1).output,
					l = o.getDependency(_n$1).output;
				let d = null;
				return de$2(() => {
					const n = a.value,
						o = u.value,
						s = null !== l.value,
						c = Cn$2(e, i);
					if (null !== d && d.editorState === n && d.editable === o) return void (Rn$1(c) && c.owner === t && (c.mounted = s));
					d = {
						editable: o,
						editorState: n
					};
					const f = {
						...((n.isEmpty() && Rn$1(c) ? c : null) ?? {
							editorState: n,
							serialize: () => function (t, e, n) {
								const o = [e],
									i = e => e.editor === t,
									r = t => o.push(t.editorState) - 1,
									s = t => t.filter(i).map(r),
									c = n ? {
										current: n.current && i(n.current) ? r(n.current) : null,
										redoStack: s(n.redoStack),
										undoStack: s(n.undoStack)
									} : null;
								return {
									family: mn$2(o),
									history: c
								};
							}(t, n, r ? r.output.historyState.peek() : null)
						}),
						editable: o,
						mounted: s,
						owner: t
					};
					e.data[i] = f;
				});
			},
			build: (t, e, n) => n.getInitResult(),
			config: {
				hot: null
			},
			dependencies: [De$1, _n$1, Nn$1],
			init: () => ({
				restoreCount: ee$2(0)
			}),
			name: "@lexical/extension/HMR"
		},
		Mn$2 = new Set(),
		Dn$2 = {
			build(t, e, o) {
				const i = o.getDependency(De$1).output,
					r = ee$2({
						watchedNodeKeys: new Map()
					}),
					s = Me$1(() => {}, () => de$2(() => {
						const t = s.peek(),
							{
								watchedNodeKeys: e
							} = r.value;
						let o,
							c = false;
						i.value.read(() => {
							if (ni()) for (const [n, i] of e.entries()) {
								if (0 === i.size) {
									e.delete(n);
									continue;
								}
								const r = Il(n),
									s = r && r.isSelected() || false;
								c = c || s !== (!!t && t.has(n)), s && (o = o || new Set(), o.add(n));
							}
						}), !c && o && t && o.size === t.size || (s.value = o);
					}));
				return {
					watchNodeKey: function (t) {
						const e = se$2(() => (s.value || Mn$2).has(t)),
							{
								watchedNodeKeys: n
							} = r.peek();
						let o = n.get(t);
						const i = void 0 !== o;
						return o = o || new Set(), o.add(e), i || (n.set(t, o), r.value = {
							watchedNodeKeys: n
						}), e;
					}
				};
			},
			dependencies: [De$1],
			name: "@lexical/extension/NodeSelection"
		},
		In$1 = /* @__PURE__ */Re$2("INSERT_HORIZONTAL_RULE_COMMAND");
	let Fn$1 = class Fn extends os {
		$config() {
			return this.config("horizontalrule", {
				importDOM: {
					hr: () => ({
						conversion: Kn$1,
						priority: 0
					})
				}
			});
		}
		exportDOM() {
			return {
				element: Wc().createElement("hr")
			};
		}
		createDOM(t) {
			const e = Wc().createElement("hr");
			return Gu(e, t.theme.hr), e;
		}
		getTextContent() {
			return "\n";
		}
		isInline() {
			return false;
		}
		updateDOM() {
			return false;
		}
	};
	function Kn$1() {
		return {
			node: Ln$1()
		};
	}
	function Ln$1() {
		return Ia(Fn$1);
	}
	function $n$2(t) {
		return t instanceof Fn$1;
	}
	const jn$1 = {
			dependencies: [De$1, Dn$2],
			name: "@lexical/extension/HorizontalRule",
			nodes: () => [Fn$1],
			register(t, e, o) {
				const {
						watchNodeKey: r
					} = o.getDependency(Dn$2).output,
					c = ee$2({
						nodeSelections: new Map()
					}),
					a = t._config.theme.hrSelected ?? "selected";
				return Qu(t.registerCommand(In$1, t => {
					const e = ni();
					if (!Er(e)) return false;
					if (null !== e.focus.getNode()) {
						const t = Ln$1();
						Pt$5(t);
					}
					return true;
				}, Hs), t.registerCommand(Ue$2, t => {
					if (oa(t.target)) {
						const e = Ll(t.target);
						if ($n$2(e)) return function (t, e = false) {
							const o = ni(),
								i = t.isSelected(),
								r = t.getKey();
							let s;
							e && Or(o) ? s = o : (s = Zr(), Hl(s)), i ? s.delete(r) : s.add(r);
						}(e, t.shiftKey), true;
					}
					return false;
				}, js), t.registerMutationListener(Fn$1, (e, n) => {
					Ht$4(() => {
						let n = !1;
						const {
							nodeSelections: o
						} = c.peek();
						for (const [i, s] of e.entries()) if ("destroyed" === s) o.delete(i), n = !0;else {
							const e = o.get(i),
								s = t.getElementByKey(i);
							e ? e.domNode.value = s : (n = !0, o.set(i, {
								domNode: ee$2(s),
								selectedSignal: r(i)
							}));
						}
						n && (c.value = {
							nodeSelections: o
						});
					});
				}), de$2(() => {
					const t = [];
					for (const {
						domNode: e,
						selectedSignal: n
					} of c.value.nodeSelections.values()) t.push(de$2(() => {
						const t = e.value;
						if (t) {
							n.value ? Gu(t, a) : Xu(t, a);
						}
					}));
					return Qu(...t);
				}));
			}
		},
		Pn$1 = {
			build: t => ({
				composingTextNode: ee$2(null),
				compositionKey: ee$2(null)
			}),
			name: "@lexical/extension/IME",
			register(t, e, o) {
				const {
						compositionKey: r,
						composingTextNode: s
					} = o.getOutput(),
					c = t.registerCommand(Je$2, () => {
						const t = ni();
						return Er(t) && (r.value = t.anchor.key), false;
					}, Ys),
					a = de$2(() => {
						const e = r.value;
						s.value = null !== e ? t.read("latest", () => {
							const t = Il(e);
							return gr(t) ? t : null;
						}) : null;
					}),
					u = t.registerUpdateListener(({
						tags: t,
						editorState: e
					}) => {
						t.has(Ho) && e.read(() => {
							const t = ni();
							if (!Er(t)) return;
							const e = t.anchor.getNode();
							gr(e) && (s.value = e);
						});
					}),
					l = t.registerRootListener(t => {
						if (null === t) return void (r.value = null);
						return jn$2(t, "compositionend", () => {
							r.value = null;
						});
					});
				return Qu(c, a, u, l);
			}
		},
		Tn$1 = [["ctrlKey", "Ctrl"], ["altKey", "Alt"], ["shiftKey", "Shift"], ["metaKey", "Meta"]],
		zn$1 = {
			" ": "Space"
		},
		Un$1 = {
			...zn$1,
			Alt: "\u2325",
			ArrowDown: "\u2193",
			ArrowLeft: "\u2190",
			ArrowRight: "\u2192",
			ArrowUp: "\u2191",
			Backspace: "\u232b",
			CapsLock: "\u21ea",
			Ctrl: "\u2303",
			Delete: "\u2326",
			End: "\u2198",
			Enter: "\u21a9",
			Escape: "\u238b",
			Home: "\u2196",
			Meta: "\u2318",
			PageDown: "\u21df",
			PageUp: "\u21de",
			Shift: "\u21e7",
			Tab: "\u21e5"
		},
		Hn$1 = {
			...Un$1,
			Tab: "\u21e4"
		};
	function Wn$1(t, e = {}) {
		const {
				isApple: n = r
			} = e,
			{
				unshiftedKey: o,
				key: i
			} = t,
			r$1 = tc(t.modifiers || {}, n),
			s = [],
			c = n ? true === r$1.shiftKey ? Hn$1 : Un$1 : zn$1;
		for (const [t, e] of Tn$1) if (true === r$1[t]) {
			if (n && "shiftKey" === t && o && 1 === i.length) continue;
			s.push(c[e] || e);
		}
		return s.push(c[i] || !n && true === r$1.shiftKey && o || 1 === i.length && i.toUpperCase() || i), s;
	}
	function Bn$1(t) {
		return function (t) {
			return Array.isArray(t);
		}(t) ? t : t ? [t] : [];
	}
	const Vn$1 = {
		build: (t, e, n) => fe$2(e),
		config: {
			disabled: false,
			priority: Js,
			shortcuts: {}
		},
		mergeConfig(t, e) {
			const n = qu(t, e);
			return n.shortcuts = function (t, e) {
				if (!e) return t;
				const n = {
					...e
				};
				for (const [e, o] of Object.entries(t)) void 0 === n[e] && (n[e] = o);
				return n;
			}(t.shortcuts, e.shortcuts), n;
		},
		name: "@lexical/extension/KeyboardShortcuts",
		register(t, e, o) {
			const {
				disabled: i,
				priority: r,
				shortcuts: s
			} = o.getOutput();
			return de$2(() => {
				if (!i.value) {
					const e = [];
					for (const t of Object.values(s.value)) for (const n of Bn$1(t)) e.push(n);
					return function (t, e, o) {
						const i = Un$2(e);
						return t.registerCommand(ln$3, (e, o) => {
							let r;
							for (const s of i.matches(e)) {
								if (t !== o && !s.bubbleFromNestedEditors) continue;
								if (s.$disabled && (void 0 === r && (r = ni()), s.$disabled(r, o))) continue;
								const i = o.dispatchCommand.bind(o, s.command, e);
								if (s.$dispatch ? s.$dispatch(s.command, e, i, o) : i()) return true;
							}
							return false;
						}, o);
					}(t, e, r.value);
				}
			});
		}
	};
	const Gn$1 = {
			build: (t, e) => fe$2({
				inheritEditableFromParent: e.inheritEditableFromParent
			}),
			config: {
				$getParentEditor: function () {
					const t = ua();
					return cn$2.fromEditor(t), t;
				},
				inheritEditableFromParent: false
			},
			init: (t, e, n) => {
				const o = e.$getParentEditor();
				t.parentEditor = o, t.theme = t.theme || o._config.theme;
			},
			name: "@lexical/extension/NestedEditor",
			register: (t, e, n) => de$2(() => {
				const e = t._parentEditor;
				if (e && n.getOutput().inheritEditableFromParent.value) return t.setEditable(e.isEditable()), e.registerEditableListener(t.setEditable.bind(t));
			})
		},
		Zn$1 = {
			config: {
				attribute: "data-selected",
				nodes: []
			},
			init(t, e) {
				const n = new Set(),
					o = Pa(xe$2(t).nodes);
				for (const t of e.nodes) {
					const e = t.getType(),
						i = o.get(e);
					void 0 === i && Ie$1(339, t.name, e), n.add(e);
					for (const t of i) n.add(t);
				}
				return {
					matchTypes: n
				};
			},
			mergeConfig: (t, e) => qu(t, {
				...e,
				...(e.nodes && {
					nodes: [...t.nodes, ...e.nodes]
				})
			}),
			name: "@lexical/extension/NodeSelectionDataSelected",
			register(t, e, o) {
				const {
						attribute: i
					} = e,
					{
						matchTypes: r
					} = o.getInitResult(),
					s = new Map(),
					c = e => {
						const o = new Set();
						e.read(() => {
							const t = ni();
							if (Or(t)) for (const e of t.getNodes()) r.has(e.getType()) && o.add(e.getKey());
						});
						for (const [t, e] of s) o.has(t) || (e.removeAttribute(i), s.delete(t));
						for (const e of o) {
							const n = t.getElementByKey(e);
							null !== n && (n.setAttribute(i, "true"), s.set(e, n));
						}
					};
				c(t.getEditorState());
				const a = t.registerUpdateListener(({
					editorState: t
				}) => c(t));
				return () => {
					a();
					for (const t of s.values()) t.removeAttribute(i);
					s.clear();
				};
			}
		};
	function Jn$1(t) {
		es(t) && t.isInline() && t.isEmpty() && t.remove();
	}
	const Xn$1 = {
			build: (t, e, n) => fe$2(e),
			config: {
				disabled: false
			},
			name: "@lexical/NormalizeInlineElements",
			register: (t, e, n) => {
				const o = n.getOutput();
				return de$2(() => {
					if (!o.disabled.value) {
						const e = [];
						for (const {
							klass: n,
							transforms: o
						} of t._nodes.values()) n.prototype instanceof ts && n.prototype.isInline !== ts.prototype.isInline && (o.add(Jn$1), e.push(() => o.delete(Jn$1)));
						return () => e.forEach(t => t());
					}
				});
			}
		},
		Yn$1 = new Set([Uo, Wo]);
	const qn$1 = {
		build: (t, e, n) => fe$2(e),
		config: {
			$fixFocusOverselection: function () {
				const t = ni();
				if (Er(t) && !t.isCollapsed()) {
					const e = As(ks(t), "next");
					let n = e.focus;
					for (yu(n) && e.anchor.origin !== n.origin && 0 === n.offset && (n = bs(n.getSiblingCaret())), xu(n) && e.anchor.origin !== n.origin && ps(n.origin) && (n = bs(n)); Cu(n) && e.anchor.origin !== n.origin;) n = bs(ku(n.origin, "next"));
					if (xu(n) && es(n.origin) && (n = Ms(Eu(n.origin, "previous")).getFlipped()), n = Ms(n), !n.isSamePointCaret(e.focus)) {
						const t = vs(zu(e.anchor, n)),
							o = ua().getRootElement(),
							i = o && Pc(o.ownerDocument.defaultView);
						i && fi(oi(), t, ua(), i, Yn$1, o);
					}
				}
			},
			dateNow: Date.now,
			disabled: false,
			thresholdMsec: 100
		},
		name: "@lexical/NormalizeTripleClickSelection",
		register: (t, e, n) => de$2(() => {
			const e = n.getOutput();
			if (!e.disabled.value) return t.registerRootListener(n => {
				if (!n) return;
				let o = 0;
				const i = t => {
					if (t ? t.detail > 2 : o > 0) {
						const n = e.dateNow.peek()();
						o = t && "mousedown" === t.type || n - o <= e.thresholdMsec.peek() ? n : 0;
					}
					return o;
				};
				return Qu(t.registerCommand(We$2, () => (i(null) && (o = 0, e.$fixFocusOverselection.peek()()), false), Zs), Zu(n, {
					mousedown: i,
					mouseup: i
				}, true));
			});
		})
	};
	function Qn$1(t) {
		const e = t.target;
		oc(t, "a", Kn$2) && na(e) && ("INPUT" === e.tagName || "TEXTAREA" === e.tagName) && e.addEventListener("keydown", To$1, {
			once: true
		});
	}
	const to$1 = {
		build: (t, e, n) => fe$2(e),
		config: {
			disabled: false
		},
		name: "@lexical/extension/PreventSelectAll",
		register: (t, e, n) => {
			const o = n.getOutput();
			return de$2(() => {
				if (!o.disabled.value) return t.registerRootListener(t => {
					if (t) return jn$2(t, "keydown", Qn$1, true);
				});
			});
		}
	};
	const eo$1 = {
			build: (t, e, n) => fe$2(e),
			config: {
				cascadeSelection: false,
				disabled: false
			},
			dependencies: [to$1],
			name: "@lexical/extension/SelectBlock",
			register: (t, o, r) => {
				const s = r.getOutput(),
					c = r.getDependency(to$1).output;
				return Qu(de$2(() => {
					c.disabled.value = s.disabled.value;
				}), de$2(() => {
					if (!s.disabled.value) return t.registerCommand(On$3, (o, r) => {
						if (r !== t) {
							if (!s.cascadeSelection.peek()) return false;
							return !!r.read("pending", () => {
								const t = ni();
								return Er(t) && Ks($l(), t);
							}) && (sc(), true);
						}
						const c = ni();
						if (Or(c)) {
							const t = c.getNodes(),
								e = t[0];
							if (!e) return false;
							const n = e.getTopLevelElement();
							return !n || ss(n) || n.is(e) || t.length > 1 && (u = n, !t.every(t => u.is(t.getTopLevelElement()))) ? sc() : es(n) && n.select(0, n.getChildrenSize()), true;
						}
						var u;
						if (!Er(c)) return false;
						const l = c.anchor.getNode(),
							d = l.getTopLevelElement();
						if (d && d.is(c.focus.getNode().getTopLevelElement()) && !Ks(d, c)) return d.select(0, d.getChildrenSize()), true;
						let f = ja(l);
						for (; null !== f;) {
							if (es(f) && !Ks(f, c)) return f.select(0, f.getChildrenSize()), true;
							const t = Ua(f);
							f = null === t ? null : ja(t);
						}
						return Ks($l(), c) || sc(), true;
					}, js);
				}));
			}
		},
		no$1 = {
			build: (t, e, n) => fe$2(e),
			config: {
				disabled: false,
				onReposition: void 0
			},
			name: "@lexical/utils/SelectionAlwaysOnDisplay",
			register: (t, e, n) => {
				const o = n.getOutput();
				return de$2(() => {
					if (!o.disabled.value) return it$4(t, o.onReposition.value);
				});
			}
		};
	function oo$1(t) {
		return t.canIndent();
	}
	function io$1(t, e, o = oo$1) {
		return Qu(t.registerCommand(xn$3, e => {
			const o = ni();
			if (!Er(o)) return false;
			e.preventDefault();
			const r = function (t) {
				if (t.getNodes().filter(t => Gr(t) && t.canIndent()).length > 0) return true;
				const e = t.anchor,
					n = t.focus,
					o = n.isBefore(e) ? n : e,
					i = o.getNode(),
					r = Rt$6(i);
				if (r.canIndent()) {
					const t = r.getKey();
					let e = Qr();
					if (e.anchor.set(t, 0, "element"), e.focus.set(t, 0, "element"), e = Bt$6(e), e.anchor.is(o)) return true;
				}
				return false;
			}(o) ? e.shiftKey ? vn$3 : Sn$3 : Cn$3;
			return t.dispatchCommand(r);
		}, Hs), t.registerCommand(Sn$3, () => {
			const t = "number" == typeof e ? e : e ? e.peek() : null,
				r = ni();
			if (!Er(r)) return false;
			const s = "function" == typeof o ? o : o.peek();
			return Mt$5(e => {
				if (s(e)) {
					const n = e.getIndent() + 1;
					(!t || n < t) && e.setIndent(n);
				}
			});
		}, qs));
	}
	const ro$1 = {
		build: (t, e, n) => fe$2(e),
		config: {
			$canIndent: oo$1,
			disabled: false,
			maxIndent: null
		},
		name: "@lexical/extension/TabIndentation",
		register(t, e, n) {
			const {
				disabled: o,
				maxIndent: i,
				$canIndent: r
			} = n.getOutput();
			return de$2(() => {
				if (!o.value) return io$1(t, i, r);
			});
		}
	};

	var LexicalExtension_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$applyFormatToDom: Oe$1,
		$createHorizontalRuleNode: Ln$1,
		$defaultShouldInsertAfter: ye$2,
		$getExtensionDependency: dn$2,
		$getExtensionOutput: fn$2,
		$getPeerDependency: hn$2,
		$isDecoratorTextNode: _e$2,
		$isHorizontalRuleNode: $n$2,
		AutoFocusExtension: he$2,
		CONTROL_OR_ALT: Bn$2,
		CONTROL_OR_META: Kn$2,
		ClearEditorExtension: me$2,
		ClickAfterLastBlockExtension: be$2,
		DecoratorTextExtension: Ae$1,
		DecoratorTextNode: we$1,
		EditorStateExtension: De$1,
		HMRExtension: An$2,
		HorizontalRuleExtension: jn$1,
		HorizontalRuleNode: Fn$1,
		IMEExtension: Pn$1,
		INSERT_HORIZONTAL_RULE_COMMAND: In$1,
		InitialStateExtension: Qe$1,
		KeyboardShortcutsExtension: Vn$1,
		LexicalBuilder: cn$2,
		NestedEditorExtension: Gn$1,
		NodeSelectionDataSelectedExtension: Zn$1,
		NodeSelectionExtension: Dn$2,
		NormalizeInlineElementsExtension: Xn$1,
		NormalizeTripleClickSelectionExtension: qn$1,
		PreventSelectAllExtension: to$1,
		RootElementExtension: _n$1,
		SelectBlockExtension: eo$1,
		SelectionAlwaysOnDisplayExtension: no$1,
		TabIndentationExtension: ro$1,
		WatchEditableExtension: Nn$1,
		applyFormatFromStyle: Ne$2,
		applyFormatToDom: ke$2,
		batch: Ht$4,
		buildEditorFromExtensions: en$2,
		compileKeyboardShortcuts: Un$2,
		computed: se$2,
		configExtension: ju,
		declarePeerDependency: Ju,
		defineExtension: Hu,
		effect: de$2,
		formatKeyboardShortcut: Wn$1,
		getExtensionDependencyFromEditor: an$2,
		getKnownTypesAndNodes: xe$2,
		getPeerDependencyFromEditor: un$2,
		getPeerDependencyFromEditorOrThrow: ln$2,
		namedSignals: fe$2,
		registerClearEditor: ge$2,
		registerTabIndentation: io$1,
		safeCast: Vu,
		shallowMergeConfig: qu,
		signal: ee$2,
		untracked: Vt$4,
		watchedSignal: Me$1
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	function tt$2(t, ...e) {
		const n = new URL("https://lexical.dev/docs/error"),
			o = new URLSearchParams();
		o.append("code", t);
		for (const t of e) o.append("v", t);
		throw n.search = o.toString(), Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	let et$2;
	function nt$2(t, e) {
		const {
			key: n
		} = e;
		return t && n in t ? t[n] : e.defaultValue;
	}
	function ot$3(t) {
		return et$2 && et$2.editor === t ? et$2 : void 0;
	}
	function rt$3(t, e) {
		const n = ot$3(e);
		return n && n[t];
	}
	function st$3(t, e) {
		if ("cfg" in e) {
			const {
				cfg: n,
				updater: o
			} = e;
			return [n, o(nt$2(t, n))];
		}
		return e;
	}
	function it$3(t, e) {
		let n = e;
		for (const o of t) {
			const [t, r] = st$3(n, o),
				s = t.key;
			if (n === e && nt$2(n, t) === r) continue;
			const i = n === e || void 0 === n ? ct$3(e) : n;
			i[s] = r, n = i;
		}
		return n;
	}
	function ct$3(t) {
		return Object.create(t || null);
	}
	function lt$3(t, e) {
		return [t, e];
	}
	function ut$3(t, e) {
		return {
			cfg: t,
			updater: e
		};
	}
	function at$3(t, n, o, r = ua()) {
		const s = et$2,
			i = ot$3(r);
		try {
			return et$2 = {
				...i,
				editor: r,
				[t]: n
			}, o();
		} finally {
			et$2 = s;
		}
	}
	function ft$4(t, n = () => {}) {
		return (o, r = ua()) => e => {
			const s = ot$3(r),
				i = s && s[t],
				c = it$3(o, i || n(r));
			return c && c !== i ? at$3(t, c, e, r) : e();
		};
	}
	function pt$4(t, e, o, r) {
		return Object.assign(vt$7(Symbol(e), {
			isEqual: r,
			parse: o
		}), {
			[t]: true
		});
	}
	const dt$4 = (t, e, n) => {
		ht$5(t), n();
	};
	function ht$5(t) {
		if (!bl(t)) return;
		const e = t;
		if (null === e.querySelector("style")) return;
		const n = new Map();
		function s(t) {
			let e = n.get(t);
			if (void 0 === e) {
				e = new Set();
				for (let n = 0; n < t.style.length; n++) e.add(t.style[n]);
				n.set(t, e);
			}
			return e;
		}
		try {
			for (const t of Array.from(e.styleSheets)) {
				let n;
				try {
					n = t.cssRules;
				} catch (t) {
					continue;
				}
				for (const t of Array.from(n)) {
					if (!Bt$5(t, CSSStyleRule)) continue;
					let n;
					try {
						n = e.querySelectorAll(t.selectorText);
					} catch (t) {
						continue;
					}
					for (const e of Array.from(n)) {
						if (!na(e)) continue;
						const n = s(e);
						for (let o = 0; o < t.style.length; o++) {
							const r = t.style[o];
							n.has(r) || e.style.setProperty(r, t.style.getPropertyValue(r), t.style.getPropertyPriority(r));
						}
					}
				}
			}
		} catch (t) {}
	}
	const mt$5 = "@lexical/html/DOM",
		gt$3 = Symbol.for("@lexical/html/DOMExportContext"),
		yt$5 = "@lexical/html/DOMImport",
		xt$5 = Symbol.for("@lexical/html/DOMImportContext"),
		St$5 = () => true;
	function $t$4(t, e, n) {
		return pt$4(gt$3, t, e, n);
	}
	const vt$5 = /* @__PURE__ */$t$4("root", Boolean),
		Ct$5 = /* @__PURE__ */$t$4("isExport", Boolean);
	function bt$5(t) {
		const e = un$2(t, mt$5);
		return e ? e.output.defaults : void 0;
	}
	function kt$4(t, n = ua()) {
		return nt$2(function (t) {
			return rt$3(gt$3, t) || bt$5(t);
		}(n), t);
	}
	function wt$4(t) {
		const e = un$2(t, mt$5);
		return e ? e.output.runtime : void 0;
	}
	function Dt$4(t, n, o = ua()) {
		const r = wt$4(o);
		r && r.setContextValue(t, n);
	}
	function Ot$4(t, n, o = ua()) {
		const r = wt$4(o);
		r && r.setContextValue(t, n(nt$2(r.editorContext, t)));
	}
	function At$4(t = ua()) {
		const n = wt$4(t);
		return n ? n.getSessionConfig() : fa(t);
	}
	const Mt$4 = /* @__PURE__ */ft$4(gt$3, bt$5);
	function Nt$4(t, e, n) {
		return {
			...e,
			...n,
			nodes: t
		};
	}
	function Et$4(t) {
		return e => e instanceof t;
	}
	function It$3(t, {
		nodes: e
	}) {
		if ("*" === e) return St$5;
		let n = {};
		const o = [];
		for (const r of e) if ("getType" in r) {
			const e = r.getType();
			if (n) {
				const o = t.get(e);
				void 0 === o && tt$2(339, r.name, e);
				for (const t of o) n[t] = true;
			}
			o.push(Et$4(r));
		} else n = void 0, o.push(r);
		return n || (1 === o.length ? o[0] : t => {
			for (const e of o) if (e(t)) return true;
			return false;
		});
	}
	function Wt$3(t) {
		return (e, n, o) => t(e, o);
	}
	function Rt$5(t) {
		return (e, n, o, r) => t(e, n, r);
	}
	function Tt$5(t) {
		return (e, n, o, r, s) => t(e, n, o, s);
	}
	function Ft$4(t) {
		return (e, n, o, r, s, i) => t(e, n, o, r, i);
	}
	function zt$3(t, e) {
		return (n, o) => {
			const r = () => t(n, o),
				s = e(n);
			return s ? s(n, r, o) : r();
		};
	}
	function Pt$4(t, e) {
		return (n, o, r) => {
			const s = () => t(n, o, r),
				i = e(n);
			return i ? i(n, o, s, r) : s();
		};
	}
	const jt$3 = Pt$4,
		_t$4 = Rt$5;
	function Lt$4(t, e) {
		return (n, o, r, s) => {
			const i = () => t(n, o, r, s),
				c = e(n);
			return c ? c(n, o, r, i, s) : i();
		};
	}
	function Bt$3(t, e) {
		return (n, o, r, s, i) => {
			const c = () => t(n, o, r, s, i),
				l = e(n);
			return l ? l(n, o, r, s, c, i) : c();
		};
	}
	function Ut$3(t, e) {
		return (n, o, r, s) => {
			t(n, o, r, s);
			const i = e(n);
			i && i(n, o, r, s);
		};
	}
	function Vt$3(t, e, n, o, r) {
		let s = n[e];
		for (const n of t[e]) if ("function" == typeof n[0]) {
			const [t, e] = n;
			s = o(s, n => t(n) && e || void 0);
		} else {
			const t = n[1],
				e = {};
			for (const n in t) {
				const r = t[n];
				r && (e[n] = r.reduce((t, e) => o(t, () => e), s));
			}
			s = o(s, t => {
				const n = e[t.getType()];
				return n && r(n);
			});
		}
		n[e] = s;
	}
	function qt$3(t, e, n, o) {
		if (!o) return;
		const r = t[e];
		if ("function" == typeof n) r.push([n, o]);else {
			const t = r[r.length - 1];
			let e;
			t && "types" === t[0] ? e = t[1] : (e = {}, r.push(["types", e]));
			for (const t in n) {
				const n = e[t] || [];
				e[t] = n, n.push(o);
			}
		}
	}
	function Gt$3(t) {
		return "*" === t.nodes;
	}
	function Ht$3(t, e) {
		const n = Pa(xe$2(t).nodes),
			o = {
				$createDOM: [],
				$decorateDOM: [],
				$exportDOM: [],
				$extractWithChild: [],
				$getDOMSlot: [],
				$getSlotTargetElement: [],
				$shouldExclude: [],
				$shouldInclude: [],
				$updateDOM: []
			};
		for (const t of function (t) {
			const e = [],
				n = [],
				o = [];
			for (const r of t) if (Gt$3(r)) e.push(r);else if (Array.isArray(r.nodes)) for (const t of r.nodes) Fo(t.prototype) ? o.push(1 === r.nodes.length ? r : {
				...r,
				nodes: [t]
			}) : n.push(1 === r.nodes.length ? r : {
				...r,
				nodes: [t]
			});
			const r = new Map(),
				s = t => {
					let e = r.get(t);
					if (void 0 === e) {
						e = -1;
						for (const n of Fa(t)) e++;
						r.set(t, e);
					}
					return e;
				};
			return o.sort((t, e) => s(t.nodes[0]) - s(e.nodes[0])), [...o, ...n, ...e];
		}(e)) {
			const e = It$3(n, t);
			for (const n in o) {
				qt$3(o, n, e, t[n]);
			}
		}
		return o;
	}
	function Jt$3(t) {
		return t;
	}
	function Qt$3(t, {
		overrides: e
	}) {
		const n = Ht$3(t, e),
			o = {
				...nl,
				...t.dom
			};
		return Vt$3(n, "$createDOM", o, zt$3, Wt$3), Vt$3(n, "$exportDOM", o, zt$3, Wt$3), Vt$3(n, "$extractWithChild", o, Bt$3, Ft$4), Vt$3(n, "$getDOMSlot", o, jt$3, _t$4), Vt$3(n, "$shouldExclude", o, Pt$4, Rt$5), Vt$3(n, "$shouldInclude", o, Pt$4, Rt$5), Vt$3(n, "$getSlotTargetElement", o, Lt$4, Tt$5), Vt$3(n, "$updateDOM", o, Lt$4, Tt$5), Vt$3(n, "$decorateDOM", o, Ut$3, Jt$3), o;
	}
	function Kt$3(t) {
		return {
			get: e => nt$2(t, e)
		};
	}
	function Yt$3(t) {
		const e = Object.create(null);
		return it$3(t, e) || e;
	}
	function Zt$2(t, e) {
		const n = Kt$3(e);
		return t.filter(t => !(t.disabledForEditor && t.disabledForEditor(n)));
	}
	function Xt$3(t) {
		if ("*" === t.nodes) return () => true;
		const e = t.nodes.map(t => {
			const e = t;
			return Fo(e.prototype) ? t => t instanceof e : t;
		});
		return t => e.some(e => e(t));
	}
	let te$1 = class te {
		sessionCache = new Map();
		constructor(t, e, n, o) {
			this.editor = t, this.initialEditorConfig = e, this.overrides = n, this.editorContext = o, this.installed = Zt$2(n, o), this.hasSessionGates = n.some(t => t.disabledForSession);
		}
		setContextValue(t, e) {
			const n = this.installed;
			this.editorContext[t.key] = e;
			const o = Zt$2(this.overrides, this.editorContext);
			if (function (t, e) {
				if (t.length !== e.length) return false;
				for (let n = 0; n < t.length; n++) if (t[n] !== e[n]) return false;
				return true;
			}(n, o)) return;
			const r = function (t, e) {
				const n = new Set(t),
					o = new Set(e),
					r = [];
				for (const e of t) o.has(e) || r.push(e);
				for (const t of e) n.has(t) || r.push(t);
				return r;
			}(n, o);
			this.installed = o, this.sessionCache.clear();
			const s = Qt$3(this.initialEditorConfig, {
				overrides: o
			});
			this.editor._config.dom = s;
			const i = function (t) {
				const e = [];
				for (const n of t) (n.$createDOM || n.$getDOMSlot || n.$decorateDOM) && e.push(Xt$3(n));
				return 0 === e.length ? null : t => e.some(e => e(t));
			}(r);
			if (!i) return;
			const c = s.$updateDOM;
			s.$updateDOM = (t, e, n, o) => !!i(t) || c(t, e, n, o), this.editor.update(Li, {
				discrete: true
			}), s.$updateDOM = c;
		}
		getSessionConfig() {
			const t = this.editor._config.dom || nl;
			if (!this.hasSessionGates) return t;
			const e = Kt$3(rt$3(gt$3, this.editor) || this.editorContext),
				n = [],
				o = [];
			if (this.installed.forEach((t, r) => {
				t.disabledForSession && t.disabledForSession(e) ? n.push(String(r)) : o.push(t);
			}), 0 === n.length) return t;
			const r = n.join(",");
			let s = this.sessionCache.get(r);
			return s || (s = Qt$3(this.initialEditorConfig, {
				overrides: o
			}), this.sessionCache.set(r, s)), s;
		}
	};
	const ee$1 = {
			build(t, e, n) {
				const {
						initialEditorConfig: o
					} = n.getInitResult(),
					r = Yt$3(e.contextDefaults);
				return {
					defaults: r,
					runtime: new te$1(t, o, e.overrides, r)
				};
			},
			config: {
				contextDefaults: [],
				overrides: []
			},
			html: {
				export: new Map([[is, () => {
					const t = Wc().createElement("div");
					return t.role = "textbox", {
						element: t
					};
				}]])
			},
			init(t, e) {
				const n = {
						dom: t.dom,
						nodes: t.nodes
					},
					o = Yt$3(e.contextDefaults),
					r = Zt$2(e.overrides, o);
				return t.dom = Qt$3(t, {
					overrides: r
				}), {
					initialEditorConfig: n
				};
			},
			mergeConfig(t, e) {
				const n = qu(t, e);
				for (const o of ["overrides", "contextDefaults"]) e[o] && (n[o] = [...t[o], ...e[o]]);
				return n;
			},
			name: mt$5
		},
		ne$1 = Symbol.for("@lexical/html/SelectorImpl");
	function oe$1(t, e) {
		const n = {
			kind: "element",
			predicate: (o = e, 0 === o.length ? na : 1 === o.length ? o[0] : (t, e) => {
				for (const n of o) if (!n(t, e)) return false;
				return true;
			}),
			tags: t
		};
		var o;
		const s = n => oe$1(t, [...e, n]);
		return {
			[ne$1]: n,
			attr: (t, e, n) => s(ie$1(t, e, n)),
			classAll: (...t) => s(se$1(t)),
			classAny: (...t) => s(function (t) {
				const e = re$1(t);
				if (0 === e.length) return () => false;
				return t => {
					if (!na(t)) return false;
					const n = t.classList;
					for (const t of e) if (n.contains(t)) return true;
					return false;
				};
			}(t)),
			styleAny: (t, e, n) => s(function (t, e, n) {
				if ("string" == typeof e) return n => na(n) && n.style.getPropertyValue(t) === e;
				if (e instanceof RegExp) {
					const o = n && n.capture,
						s = e;
					return (e, n) => {
						if (!na(e)) return false;
						const i = e.style.getPropertyValue(t);
						if (!i) return false;
						const c = i.match(s);
						return null !== c && (void 0 !== o && (n[o] = c), true);
					};
				}
				tt$2(362, JSON.stringify(t));
			}(t, e, n))
		};
	}
	function re$1(t) {
		const e = [];
		for (const n of t) n && e.push(n);
		return e;
	}
	function se$1(t) {
		const e = re$1(t);
		return 0 === e.length ? () => true : t => {
			if (!na(t)) return false;
			const n = t.classList;
			for (const t of e) if (!n.contains(t)) return false;
			return true;
		};
	}
	function ie$1(t, e, n) {
		if (true === e) return e => na(e) && e.hasAttribute(t);
		if ("string" == typeof e) return n => na(n) && n.getAttribute(t) === e;
		if (e instanceof RegExp) {
			const o = n && n.capture,
				s = e;
			return (e, n) => {
				if (!na(e)) return false;
				const i = e.getAttribute(t);
				if (null == i) return false;
				const c = i.match(s);
				return null !== c && (void 0 !== o && (n[o] = c), true);
			};
		}
		tt$2(361, JSON.stringify(t));
	}
	const ce$1 = {
			kind: "text",
			predicate: kl,
			tags: new Set()
		},
		le$1 = {
			[ne$1]: ce$1
		},
		ue$1 = {
			kind: "comment",
			predicate: t => 8 === t.nodeType,
			tags: new Set()
		},
		ae$1 = {
			[ne$1]: ue$1
		},
		fe$1 = {
			any: () => oe$1(new Set(), []),
			comment: () => ae$1,
			tag(...t) {
				t.length > 0 || tt$2(363);
				const e = new Set();
				for (const n of t) e.add(n.toUpperCase());
				return oe$1(e, []);
			},
			text: () => le$1
		};
	function pe$1(t, e) {
		return na(t) && t.nodeName === e.toUpperCase();
	}
	const de$1 = /[A-Za-z0-9_-]/;
	let he$1 = class he {
		constructor(t, e) {
			this.source = t, this.pos = e;
		}
		peek(t = 0) {
			return this.source[this.pos + t] || "";
		}
		consume() {
			return this.source[this.pos++] || "";
		}
		eof() {
			return this.pos >= this.source.length;
		}
		skipWhitespace() {
			for (; !this.eof() && /\s/.test(this.peek());) this.pos++;
		}
		readIdent() {
			const t = this.pos;
			for (; !this.eof() && de$1.test(this.peek());) this.pos++;
			return this.source.slice(t, this.pos);
		}
		readQuoted() {
			const t = this.consume();
			this.assert('"' === t || "'" === t, "expected quote");
			const e = this.pos;
			for (; !this.eof() && this.peek() !== t;) "\\" === this.peek() ? this.pos += 2 : this.pos++;
			this.assert(!this.eof(), "unterminated string");
			const n = this.source.slice(e, this.pos);
			return this.pos++, n.replace(/\\(.)/g, "$1");
		}
		assert(t, e) {
			t || tt$2(364, String(this.pos + 1), e, this.source);
		}
	};
	function me$1(t) {
		const e = new Set(),
			n = [],
			o = [];
		let r = false;
		if (t.skipWhitespace(), "*" === t.peek()) t.consume(), r = true;else if (de$1.test(t.peek())) {
			const n = t.readIdent();
			n && e.add(n.toUpperCase());
		}
		for (; !t.eof();) {
			const e = t.peek();
			if ("." === e) {
				t.consume();
				const e = t.readIdent();
				t.assert("" !== e, 'expected class name after "."'), o.push(e);
			} else if ("#" === e) {
				t.consume();
				const e = t.readIdent();
				t.assert("" !== e, 'expected id after "#"'), n.push(ie$1("id", e));
			} else {
				if ("[" !== e) break;
				{
					t.consume(), t.skipWhitespace();
					const e = t.readIdent();
					t.assert("" !== e, 'expected attribute name after "["'), t.skipWhitespace();
					let o = true;
					if ("=" === t.peek()) {
						t.consume(), t.skipWhitespace();
						const e = t.peek();
						'"' === e || "'" === e ? o = t.readQuoted() : (o = t.readIdent(), t.assert("" !== o, "expected attribute value")), t.skipWhitespace();
					}
					t.assert("]" === t.peek(), 'expected "]"'), t.consume(), n.push(ie$1(e, o));
				}
			}
		}
		return o.length > 0 && n.push(se$1(o)), t.assert(r || e.size > 0 || n.length > 0, "expected a selector"), {
			predicates: n,
			tags: e
		};
	}
	function ge$1(t) {
		const e = new he$1(t, 0),
			n = [];
		for (; n.push(me$1(e)), e.skipWhitespace(), !e.eof();) e.assert("," === e.peek(), 'expected "," (selector lists are the only supported combinator)'), e.consume(), e.skipWhitespace();
		if (1 === n.length) return oe$1(n[0].tags, n[0].predicates);
		const o = new Set();
		if (n.every(t => t.tags.size > 0)) for (const t of n) for (const e of t.tags) o.add(e);
		return oe$1(o, [(t, e) => {
			for (const o of n) {
				const n = t.nodeName;
				if (o.tags.size > 0 && !o.tags.has(n)) continue;
				let r = true;
				for (const n of o.predicates) if (!n(t, e)) {
					r = false;
					break;
				}
				if (r) return true;
			}
			return false;
		}]);
	}
	function ye$1(t, e, n) {
		return pt$4(xt$5, t, e, n);
	}
	const xe$1 = /* @__PURE__ */ye$1("importSource", () => "unknown"),
		Se$1 = /* @__PURE__ */ye$1("importSourceDataTransfer", () => null),
		$e = /* @__PURE__ */ye$1("textFormat", () => 0),
		ve$1 = /* @__PURE__ */ye$1("textStyle", () => ({}));
	function Ce$1(t) {
		if (!na(t)) return false;
		if ("PRE" === t.nodeName) return true;
		const e = t.style.whiteSpace;
		return "string" == typeof e && e.startsWith("pre");
	}
	function be$1(t) {
		if (kl(t)) return true;
		if (!na(t)) return false;
		const e = t.style.display;
		return e ? e.startsWith("inline") : !ca(t) && sa(t);
	}
	const ke$1 = /* @__PURE__ */ye$1("whitespaceConfig", () => ({
			isInline: be$1,
			preservesWhitespace: Ce$1
		})),
		we = /* @__PURE__ */ye$1("importOverlays", () => []);
	class De {
		constructor(t) {
			this.record = t;
		}
		get(t) {
			return nt$2(this.record, t);
		}
		set(t, e) {
			this.record[t.key] = e;
		}
		update(t, e) {
			this.record[t.key] = e(nt$2(this.record, t));
		}
		has(t) {
			return Object.prototype.hasOwnProperty.call(this.record, t.key);
		}
	}
	function Oe(t) {
		const e = un$2(t, yt$5);
		return e ? e.output.defaults : void 0;
	}
	function Ae(t, n = ua()) {
		return nt$2(function (t) {
			return rt$3(xt$5, t) || Oe(t);
		}(n), t);
	}
	const Me = /* @__PURE__ */ft$4(xt$5, Oe);
	function Ne$1(t) {
		return Gr(t) || rs(t) && !t.isInline();
	}
	function Ee(t, e) {
		const n = [];
		let o = [];
		const r = () => {
			0 !== o.length && (n.push(e().splice(0, 0, o)), o = []);
		};
		for (const s of t) if (Ne$1(s)) {
			if (r(), es(s)) {
				const t = Ee(s.getChildren(), e);
				s.splice(0, s.getChildrenSize(), t);
			}
			n.push(s);
		} else o.push(s);
		return r(), n;
	}
	function Ie(t, e) {
		if (!na(e)) return t;
		const n = e.style.textAlign;
		if (!_e$1(n)) return t;
		for (const e of t) Gr(e) && "" === e.getFormatType() && e.setFormat(n);
		return t;
	}
	function We(t, e, n) {
		1 === t.length && ps(t[0]) && (t = []);
		const o = Ws();
		if (na(n)) {
			const t = n.style.textAlign;
			_e$1(t) && o.setFormat(t);
		}
		return [o.splice(0, 0, t)];
	}
	const Re = {
			$accepts: Ne$1,
			$packageRun: We,
			name: "BlockSchema"
		},
		Te$1 = {
			$accepts: t => !Ne$1(t),
			name: "InlineSchema"
		},
		Fe = {
			$accepts: Ne$1,
			$packageRun: t => t,
			name: "NestedBlockSchema"
		},
		ze = {
			$accepts: Ne$1,
			$packageRun: We,
			name: "RootSchema"
		},
		Pe = fe$1,
		je = new Set(["center", "end", "justify", "left", "right", "start"]);
	function _e$1(t) {
		return je.has(t);
	}
	const Le$1 = {
			B: {
				fontWeight: "bold"
			},
			EM: {
				fontStyle: "italic"
			},
			I: {
				fontStyle: "italic"
			},
			S: {
				textDecoration: "line-through"
			},
			STRONG: {
				fontWeight: "bold"
			},
			SUB: {
				verticalAlign: "sub"
			},
			SUP: {
				verticalAlign: "super"
			},
			U: {
				textDecoration: "underline"
			}
		},
		Be = {
			CODE: C$1,
			MARK: T
		};
	const Ue = new Set(["font-weight", "font-style", "text-decoration", "text-transform", "vertical-align"]);
	const Ve = {
		$import: (t, e) => {
			const n = t.get($e),
				o = Le$1[e.nodeName],
				r = function (t) {
					return {
						fontStyle: t.style.fontStyle,
						fontWeight: t.style.fontWeight,
						textDecoration: t.style.textDecoration,
						textTransform: t.style.textTransform,
						verticalAlign: t.style.verticalAlign
					};
				}(e),
				s = o ? (i = o, {
					fontStyle: (c = r).fontStyle || i.fontStyle,
					fontWeight: c.fontWeight || i.fontWeight,
					textDecoration: c.textDecoration || i.textDecoration,
					textTransform: c.textTransform || i.textTransform,
					verticalAlign: c.verticalAlign || i.verticalAlign
				}) : r;
			var i, c;
			let l = (u = n, a = function (t) {
				let e = 0,
					n = 0;
				const {
					fontWeight: o,
					fontStyle: r,
					textDecoration: s,
					textTransform: i,
					verticalAlign: c
				} = t;
				if ("700" === o || "bold" === o ? e |= p$1 : "normal" !== o && "400" !== o || (n |= p$1), "italic" === r ? e |= y$1 : "normal" === r && (n |= y$1), s) {
					const t = s.split(" ");
					t.includes("underline") && (e |= x$1), t.includes("line-through") && (e |= m$1), t.includes("none") && (n |= x$1 | m$1);
				}
				return "lowercase" === i ? (e |= K$1.lowercase, n |= K$1.uppercase | K$1.capitalize) : "uppercase" === i ? (e |= K$1.uppercase, n |= K$1.lowercase | K$1.capitalize) : "capitalize" === i ? (e |= K$1.capitalize, n |= K$1.lowercase | K$1.uppercase) : "none" === i && (n |= K$1.lowercase | K$1.uppercase | K$1.capitalize), "sub" === c ? (e |= S, n |= v$1) : "super" === c ? (e |= v$1, n |= S) : "baseline" === c && (n |= S | v$1), {
					clear: n,
					set: e
				};
			}(s), u & ~a.clear | a.set);
			var u, a;
			const f = Be[e.nodeName];
			return f && (l |= f), l === n ? t.$importChildren(e) : t.$importChildren(e, {
				context: [lt$3($e, l)]
			});
		},
		match: /* @__PURE__ */Pe.tag("b", "strong", "em", "i", "code", "mark", "s", "sub", "sup", "u", "span"),
		name: "@lexical/html/inline-format"
	};
	function qe(t, e, n) {
		let o = t;
		for (;;) {
			let t = null;
			for (; null === (t = e ? o.nextSibling : o.previousSibling);) {
				const t = o.parentNode;
				if (null === t) return null;
				o = t;
			}
			if (o = t, !n.isInline(o)) return null;
			let r = o;
			for (; null !== (r = e ? o.firstChild : o.lastChild);) o = r;
			if (kl(o)) return o;
			if ("BR" === o.nodeName) return null;
		}
	}
	function Ge(t, e) {
		return 0 !== e && gr(t) ? t.setFormat(e) : t;
	}
	function He(t, e) {
		if (gr(t)) {
			const n = function (t) {
				let e = "";
				for (const n in t) Ue.has(n) || (e += `${n}: ${t[n]}; `);
				return e.trimEnd();
			}(e);
			"" !== n && t.setStyle(n);
		}
		return t;
	}
	const Je = {
			$import: (t, e) => {
				const n = t.get($e),
					o = t.get(ve$1),
					r = t.get(ke$1);
				if (function (t, e) {
					let n = t.parentNode;
					for (; null !== n;) {
						if (e.preservesWhitespace(n)) return true;
						n = n.parentNode;
					}
					return false;
				}(e, r)) {
					const t = gi(e.textContent || "");
					for (const e of t) Ge(e, n), He(e, o);
					return t;
				}
				const s = function (t, e) {
					let n = (t.textContent || "").replace(/\r/g, "").replace(/[ \t\n]+/g, " ");
					if (0 === n.length) return "";
					if (" " === n[0]) {
						let o = t,
							r = true;
						for (; null !== o && null !== (o = qe(o, false, e));) {
							const t = o.textContent || "";
							if (t.length > 0) {
								/[ \t\n]$/.test(t) && (n = n.slice(1)), r = false;
								break;
							}
						}
						r && (n = n.slice(1));
					}
					if (n.length > 0 && " " === n[n.length - 1]) {
						let o = t,
							r = true;
						for (; null !== o && null !== (o = qe(o, true, e));) if ((o.textContent || "").replace(/^( |\t|\r?\n)+/, "").length > 0) {
							r = false;
							break;
						}
						r && (n = n.slice(0, -1));
					}
					return n;
				}(e, r);
				if ("" === s) return [];
				const i = hr(s);
				return Ge(i, n), He(i, o), [i];
			},
			match: /* @__PURE__ */Pe.text(),
			name: "@lexical/html/#text"
		},
		Qe = {
			$import: () => [],
			match: /* @__PURE__ */Pe.tag("script", "style"),
			name: "@lexical/html/script-style-ignore"
		},
		Ke = {
			$import: (t, e) => ys(e) || ms(e) ? [] : [_s()],
			match: /* @__PURE__ */Pe.tag("br"),
			name: "@lexical/html/br"
		},
		Ye = {
			$import: (t, e) => {
				const n = Ws();
				if (ka(n, e), va(e, n), "" === n.getFormatType()) {
					const t = e.getAttribute("align");
					t && _e$1(t) && n.setFormat(t);
				}
				return Ta(n, e), [n.splice(0, 0, t.$importChildren(e))];
			},
			match: /* @__PURE__ */Pe.tag("p"),
			name: "@lexical/html/p"
		},
		Ze = {
			$import: (t, n, o) => ua().hasNode(Fn$1) ? [Ln$1()] : o(),
			match: /* @__PURE__ */Pe.tag("hr"),
			name: "@lexical/html/hr"
		},
		Xe = [Qe, Ye, Ze, {
			$import: (t, e, n) => ca(e) ? Ie(t.$importChildren(e, {
				schema: Re
			}), e) : n(),
			match: /* @__PURE__ */Pe.any(),
			name: "@lexical/html/transparent-block"
		}, Je, Ke, Ve];
	function tn$1(t, e) {
		const n = [];
		let o = 0,
			r = 0;
		for (; o < t.length && r < e.length;) t[o] <= e[r] ? n.push(t[o++]) : n.push(e[r++]);
		for (; o < t.length;) n.push(t[o++]);
		for (; r < e.length;) n.push(e[r++]);
		return n;
	}
	function en$1(t) {
		const e = [],
			n = new Map(),
			o = [],
			r = [],
			s = [],
			i = new Set();
		t.forEach((t, c) => {
			const l = function (t) {
					const e = t[ne$1];
					return void 0 === e && tt$2(360), e;
				}(t.match),
				u = t.name || function (t, e) {
					if ("text" === t.kind) return `#text@${e}`;
					if ("comment" === t.kind) return `#comment@${e}`;
					if (0 === t.tags.size) return `*@${e}`;
					const n = Array.from(t.tags).join(",").toLowerCase();
					return `${n}@${e}`;
				}(l, c);
			if (t.name && i.add(t.name), e.push({
				$import: t.$import,
				name: u,
				predicate: l.predicate
			}), "text" === l.kind) r.push(c);else if ("comment" === l.kind) s.push(c);else if (0 === l.tags.size) o.push(c);else for (const t of l.tags) {
				let e = n.get(t);
				e || (e = [], n.set(t, e)), e.push(c);
			}
		});
		const c = new Map();
		if (0 === o.length) for (const [t, e] of n) c.set(t, e);else for (const [t, e] of n) c.set(t, tn$1(e, o));
		return {
			byTag: c,
			commentIndices: s,
			rules: e,
			textIndices: r,
			wildcardIndices: o
		};
	}
	function nn$1(t, e) {
		return kl(e) ? t.textIndices : 8 === e.nodeType ? t.commentIndices : na(e) ? t.byTag.get(e.nodeName) || t.wildcardIndices : on$1;
	}
	const on$1 = Object.freeze([]);
	function rn$1(t) {
		const e = [];
		for (const n of t) if (sn$1(n)) for (const t of n.rules) e.push(t);else e.push(n);
		return e;
	}
	function sn$1(t) {
		return "object" == typeof t && null !== t && "__type" in t && "CompiledOverlayRules" === t.__type;
	}
	function cn$1(t) {
		const e = rn$1(t);
		return {
			__type: "CompiledOverlayRules",
			dispatch: en$1(e),
			rules: e
		};
	}
	const ln$1 = Object.freeze({});
	function un$1(t, e) {
		const n = {
			$importChildren: (e, n) => function (t, e, n) {
				const o = n && n.rules ? n.rules.dispatch : void 0;
				o && t.overlays.push(o);
				try {
					const o = () => an$1(t, e, n);
					return n && n.context ? Me(n.context, t.editor)(o) : o();
				} finally {
					o && t.overlays.pop();
				}
			}(t, e, n),
			$importOne: (e, n) => fn$1(t, e, n),
			captures: e,
			get: e => Ae(e, t.editor),
			session: t.session
		};
		return n;
	}
	function an$1(t, e, n) {
		const o = n && n.$onChild,
			r = [];
		for (const n of Array.from(e.childNodes)) {
			const e = fn$1(t, n, void 0);
			for (const t of e) {
				const e = o ? o(t) : t;
				null != e && r.push(e);
			}
		}
		const s = n && n.$after ? n.$after(r) : r,
			i = n && n.schema;
		return i ? function (t, e, n, o) {
			const r = [];
			let s = null;
			const i = () => {
				if (null === s) return;
				const e = s;
				if (s = null, t.$packageRun) {
					const s = t.$packageRun(e, n, o);
					if (s.length > 0) {
						for (const t of s) r.push(t);
						return;
					}
				}
				if ("hoist" === t.onReject) for (const t of e) r.push(t);
			};
			for (const o of e) t.$accepts(o, n) ? (i(), r.push(o)) : (null === s && (s = []), s.push(o));
			return i(), t.$finalize ? t.$finalize(r, n) : r;
		}(i, s, null, e) : s;
	}
	function fn$1(t, e, n) {
		const o = () => function (t, e) {
			const n = function (t, e) {
				const n = [];
				for (let o = t.overlays.length - 1; o >= 0; o--) {
					const r = t.overlays[o],
						s = nn$1(r, e);
					s.length > 0 && n.push({
						dispatch: r,
						indices: s
					});
				}
				const o = nn$1(t.dispatch, e);
				o.length > 0 && n.push({
					dispatch: t.dispatch,
					indices: o
				});
				return n;
			}(t, e);
			if (0 === n.length) return pn$1(t, e);
			let o = 0,
				r = 0;
			const s = () => {
				for (; o < n.length;) {
					const {
						dispatch: i,
						indices: c
					} = n[o];
					for (; r < c.length;) {
						const n = c[r++],
							o = i.rules[n],
							l = {};
						if (o.predicate(e, l)) {
							const n = un$1(t, 0 === Object.keys(l).length ? ln$1 : l);
							try {
								return o.$import(n, e, s);
							} catch (t) {
								throw t;
							}
						}
					}
					o++, r = 0;
				}
				return pn$1(t, e);
			};
			return s();
		}(t, e);
		return n && n.context ? Me(n.context, t.editor)(o) : o();
	}
	function pn$1(t, e) {
		if (0 === e.childNodes.length) return [];
		const n = [];
		for (const o of Array.from(e.childNodes)) {
			const e = fn$1(t, o, void 0);
			for (const t of e) n.push(t);
		}
		return n;
	}
	const dn$1 = {
			$import: (t, e) => t.$importChildren(e),
			match: /* @__PURE__ */fe$1.any(),
			name: "@lexical/html/default-hoist"
		},
		hn$1 = {
			build(t, e) {
				const n = en$1(rn$1(e.rules)),
					r = it$3(e.contextDefaults, void 0),
					s = e.preprocess;
				return {
					$generateNodesFromDOM: (e, i) => {
						const c = rt$3(xt$5, t) || r,
							l = i && i.context ? it$3(i.context, c) : c,
							u = void 0 !== l && l !== c ? l : Object.create(c || null),
							a = new De(u),
							f = {
								session: a
							};
						return function (t, e, n) {
							let o = t.length - 1;
							const r = () => {
								for (; o >= 0;) return void (0, t[o--])(e, n, r);
							};
							r();
						}(i && i.preprocess ? [...s, ...i.preprocess] : s, e, f), at$3(xt$5, u, () => function (t, e, n, r) {
							return an$1({
								dispatch: t,
								editor: e,
								overlays: r.get(we).map(t => t.dispatch),
								session: r
							}, bl(n) ? n.body : n, {
								schema: ze
							});
						}(n, t, e, a), t);
					},
					defaults: r
				};
			},
			config: {
				contextDefaults: [],
				preprocess: [dt$4],
				rules: [dn$1]
			},
			mergeConfig: (t, e) => qu(t, {
				...e,
				...(e.contextDefaults && {
					contextDefaults: [...t.contextDefaults, ...e.contextDefaults]
				}),
				...(e.preprocess && {
					preprocess: [...t.preprocess, ...e.preprocess]
				}),
				...(e.rules && {
					rules: [...e.rules, ...t.rules]
				})
			}),
			name: yt$5
		};
	function mn$1(t, e) {
		return fn$2(hn$1).$generateNodesFromDOM(t, e);
	}
	const gn$1 = {
		dependencies: [[hn$1, {
			rules: Xe
		}]],
		name: "@lexical/html/CoreImport"
	};
	function yn$1(t) {
		return t;
	}
	const xn$1 = [Ze],
		Sn$1 = {
			dependencies: [jn$1, gn$1],
			name: "@lexical/html/HorizontalRuleImport"
		},
		$n$1 = {
			any: fe$1.any,
			comment: fe$1.comment,
			css: ge$1,
			tag: fe$1.tag,
			text: fe$1.text
		},
		vn$1 = new Set(["STYLE", "SCRIPT"]);
	function Cn$1(t, e) {
		ht$5(e);
		const n = bl(e) ? e.body.childNodes : e.childNodes,
			r = [],
			s = [];
		for (const e of n) if (!vn$1.has(e.nodeName)) {
			const n = An$1(e, t, s, false);
			if (null !== n) for (const t of n) r.push(t);
		}
		return function (t) {
			for (const e of t) e.getParent() && e.getNextSibling() instanceof ds && e.insertAfter(_s());
			for (const e of t) {
				const t = e.getParent();
				t && t.splice(e.getIndexWithinParent(), 1, e.getChildren());
			}
		}(s), r;
	}
	function bn$1(t, n = null, o = ua()) {
		return Mt$4([lt$3(Ct$5, true)], o)(() => {
			const e = $l(),
				r = At$4(o),
				s = Ja(n),
				i = t.append.bind(t);
			for (const t of (es(s) ? s : e).getChildren()) Dn$1(o, t, i, n, r);
			return t;
		});
	}
	function kn$1(t, n = $l()) {
		const o = ua();
		return Mt$4([lt$3(Ct$5, true), lt$3(vt$5, true)], o)(() => {
			const e = At$4(o),
				r = t.append.bind(t);
			return Dn$1(o, n, r, null, e), t;
		});
	}
	function wn$1(t, e = null) {
		return ("undefined" == typeof document || "undefined" == typeof window && void 0 === global.window) && tt$2(338), Pi(t), bn$1(Wc().createElement("div"), e, t).innerHTML;
	}
	function Dn$1(e, n, o, i = null, c = fa(e)) {
		let l = c.$shouldInclude(n, i, e);
		const u = c.$shouldExclude(n, i, e);
		let a = n;
		null !== i && gr(n) && (a = $(i, n, "clone"));
		const f = c.$exportDOM(a, e),
			{
				element: p,
				after: h,
				append: g,
				$getChildNodes: x
			} = f;
		if (!p) return false;
		const S = Wc().createDocumentFragment(),
			v = x ? x() : es(a) ? a.getChildren() : [],
			C = l && Or(i) && es(n) ? null : i,
			b = S.append.bind(S);
		let k = null;
		for (const t of v) {
			const o = Dn$1(e, t, b, C, c);
			o && (k = t), !l && o && c.$extractWithChild(n, t, i, "html", e) && (l = true);
		}
		if (l && !u) {
			if ((na(p) || ra(p)) && (g ? g(S) : p.append(S), function (t, e) {
				const n = t.lastChild;
				if (ps(e) && na(t) && ca(t) && null !== n && "BR" === n.nodeName) {
					const e = Wc().createElement("br");
					e.setAttribute("data-lexical-managed-linebreak", "true"), t.append(e);
				}
			}(p, k)), ra(p)) {
				if (h) {
					const t = h.call(a, p);
					t && p.replaceChildren(t);
				}
				o(p);
			} else if (o(p), h) {
				const t = h.call(a, p);
				t && p.replaceWith(t);
			}
		} else o(S);
		return l;
	}
	function On$1(t, e, n, o = null) {
		return Dn$1(t, e, n.append.bind(n), o, At$4(t));
	}
	function An$1(t, e, n, o, r = new Map(), s) {
		const i = [];
		if (vn$1.has(t.nodeName)) return i;
		let c = null;
		const l = function (t, e) {
				const {
						nodeName: n
					} = t,
					o = e._htmlConversions.get(n.toLowerCase());
				let r = null;
				if (void 0 !== o) for (const e of o) {
					const n = e(t);
					null !== n && (null === r || (r.priority || 0) <= (n.priority || 0)) && (r = n);
				}
				return null !== r ? r.conversion : null;
			}(t, e),
			u = l ? l(t) : null;
		let a = null;
		if (null !== u) {
			a = u.after;
			const e = u.node;
			if (c = Array.isArray(e) ? e[e.length - 1] : e, null !== c) {
				for (const [, t] of r) if (c = t(c, s), !c) break;
				c && i.push(...(Array.isArray(e) ? e : [c]));
			}
			null != u.forChild && r.set(t.nodeName, u.forChild);
		}
		const f = t.childNodes;
		let p = [];
		const d = (null == c || !wc(c)) && (null != c && Gr(c) || o);
		for (let t = 0; t < f.length; t++) p.push(...An$1(f[t], e, n, d, new Map(r), c));
		if (null != a && (p = a(p)), ca(t) && (p = Mn$1(t, p, d ? () => {
			const t = new ds();
			return n.push(t), t;
		} : Ws)), null == c) {
			if (p.length > 0) for (const t of p) i.push(t);else ca(t) && function (t) {
				if (null == t.nextSibling || null == t.previousSibling) return false;
				return sa(t.nextSibling) && sa(t.previousSibling);
			}(t) && i.push(_s());
		} else es(c) && c.append(...p);
		return i;
	}
	function Mn$1(t, e, n) {
		const o = t.style.textAlign,
			r = [];
		let s = [];
		for (let t = 0; t < e.length; t++) {
			const i = e[t];
			if (Gr(i)) o && !i.getFormat() && i.setFormat(o), r.push(i);else if (s.push(i), t === e.length - 1 || t < e.length - 1 && Gr(e[t + 1])) {
				const t = n();
				t.setFormat(o), t.append(...s), r.push(t), s = [];
			}
		}
		return r;
	}

	var LexicalHtml_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$appendNodeToHTML: On$1,
		$distributeInlineWrapper: Ee,
		$generateDOMFromNodes: bn$1,
		$generateDOMFromRoot: kn$1,
		$generateHtmlFromNodes: wn$1,
		$generateNodesFromDOM: Cn$1,
		$generateNodesFromDOMViaExtension: mn$1,
		$getImportContextValue: Ae,
		$getRenderContextValue: kt$4,
		$getSessionDOMRenderConfig: At$4,
		$inlineStylesFromStyleSheets: dt$4,
		$isBlockLevel: Ne$1,
		$propagateTextAlignToBlockChildren: Ie,
		$setRenderContextValue: Dt$4,
		$updateRenderContextValue: Ot$4,
		$withImportContext: Me,
		$withRenderContext: Mt$4,
		BlockSchema: Re,
		CoreImportExtension: gn$1,
		CoreImportRules: Xe,
		DOMImportExtension: hn$1,
		DOMRenderExtension: ee$1,
		HorizontalRuleImportExtension: Sn$1,
		HorizontalRuleImportRules: xn$1,
		ImportOverlays: we,
		ImportSource: xe$1,
		ImportSourceDataTransfer: Se$1,
		ImportTextFormat: $e,
		ImportTextStyle: ve$1,
		ImportWhitespaceConfig: ke$1,
		InlineSchema: Te$1,
		NestedBlockSchema: Fe,
		RenderContextExport: Ct$5,
		RenderContextRoot: vt$5,
		RootSchema: ze,
		contextUpdater: ut$3,
		contextValue: lt$3,
		createImportState: ye$1,
		createRenderState: $t$4,
		defaultIsInline: be$1,
		defaultPreservesWhitespace: Ce$1,
		defineImportRule: yn$1,
		defineOverlayRules: cn$1,
		domOverride: Nt$4,
		isElementOfTag: pe$1,
		parseSelector: ge$1,
		sel: $n$1
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	function ht$4(t, ...e) {
		const n = new URL("https://lexical.dev/docs/error"),
			r = new URLSearchParams();
		r.append("code", t);
		for (const t of e) r.append("v", t);
		throw n.search = r.toString(), Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	function ft$3(t) {
		let e = 1,
			n = t.getParent();
		for (; null != n;) {
			if (Mt$3(n)) {
				const t = n.getParent();
				if (Wt$2(t)) {
					e++, n = t.getParent();
					continue;
				}
				ht$4(40);
			}
			return e;
		}
		return e;
	}
	function dt$3(t) {
		const e = t.getParent();
		Wt$2(e) || ht$4(40);
		let n = e,
			r = e;
		for (; null !== r;) r = r.getParent(), Wt$2(r) && (n = r);
		return n;
	}
	function pt$3(t) {
		let e = [];
		const n = t.getChildren().filter(Mt$3);
		for (let t = 0; t < n.length; t++) {
			const r = n[t],
				i = r.getFirstChild();
			Wt$2(i) ? e = e.concat(pt$3(i)) : e.push(r);
		}
		return e;
	}
	function mt$4(t) {
		return Mt$3(t) && Wt$2(t.getFirstChild());
	}
	function _t$3(t, e) {
		return e.getValue();
	}
	function yt$4(t, e) {
		return Mt$3(t) && (0 === e.length || 1 === e.length && t.is(e[0]) && 0 === t.getChildrenSize());
	}
	function Ct$4(t, e) {
		return Wt$2(t) ? Ec(t).setListType(e) : Kt$2(e);
	}
	function St$4(t) {
		const e = ni();
		if (null !== e) {
			let n = e.getNodes();
			if (Er(e)) {
				const [r] = e.getStartEndPoints(),
					i = r.getNode(),
					l = i.getParent();
				if (wc(i)) {
					const t = i.getFirstChild();
					if (t) n = t.selectStart().getNodes();else {
						const t = Ws();
						i.append(t), n = t.select().getNodes();
					}
				} else if (yt$4(i, n)) {
					if (wc(l)) {
						const e = Kt$2(t);
						i.replace(e);
						const n = Et$3();
						es(i) && (n.setFormat(i.getFormatType()), n.setIndent(i.getIndent())), e.append(n);
					} else if (Mt$3(i)) {
						const e = i.getParentOrThrow();
						if (null === Ua(e)) {
							const n = Ct$4(e, t);
							kt$3(n, e.getChildren()), e.replace(n);
						}
					}
					return;
				}
			}
			const i = new Set();
			for (let e = 0; e < n.length; e++) {
				const r = n[e];
				if (es(r) && r.isEmpty() && !Mt$3(r) && null === Ua(r) && !i.has(r.getKey())) {
					bt$4(r, t);
					continue;
				}
				let o = El(r) ? r.getParent() : Mt$3(r) && r.isEmpty() ? r : null;
				for (; null != o;) {
					const e = o.getKey();
					if (Wt$2(o)) {
						if (!i.has(e) && null === Ua(o)) {
							const n = Ct$4(o, t);
							kt$3(n, o.getChildren()), o.replace(n), i.add(e);
						}
						break;
					}
					{
						const n = o.getParent();
						if (wc(n) && !i.has(e)) {
							i.add(e), bt$4(o, t);
							break;
						}
						o = n;
					}
				}
			}
		}
	}
	function kt$3(t, e) {
		t.splice(t.getChildrenSize(), 0, e);
	}
	function bt$4(t, e) {
		if (Wt$2(t)) return t;
		const i = t.getPreviousSibling(),
			s = t.getNextSibling(),
			o = Et$3();
		let l;
		if (kt$3(o, t.getChildren()), Wt$2(i) && e === i.getListType()) i.append(o), Wt$2(s) && e === s.getListType() && (kt$3(i, s.getChildren()), s.remove()), l = i;else if (Wt$2(s) && e === s.getListType()) s.getFirstChildOrThrow().insertBefore(o), l = s;else {
			const n = Kt$2(e);
			n.append(o), t.replace(n), l = n;
		}
		o.setFormat(t.getFormatType()), o.setIndent(t.getIndent());
		const c = ni();
		return Er(c) && (l.getKey() === c.anchor.key && c.anchor.set(o.getKey(), c.anchor.offset, "element"), l.getKey() === c.focus.key && c.focus.set(o.getKey(), c.focus.offset, "element")), t.remove(), l;
	}
	function vt$4(t, e) {
		const n = t.getLastChild(),
			r = e.getFirstChild();
		n && r && mt$4(n) && mt$4(r) && n.getFirstChild().getListType() === r.getFirstChild().getListType() && (vt$4(n.getFirstChild(), r.getFirstChild()), r.remove());
		const i = e.getChildren();
		i.length > 0 && t.append(...i), e.remove();
	}
	function Tt$4() {
		const e = ni();
		if (Er(e)) {
			const n = new Set(),
				r = e.getNodes(),
				i = e.anchor.getNode();
			if (yt$4(i, r)) n.add(dt$3(i));else for (let e = 0; e < r.length; e++) {
				const i = r[e];
				if (El(i)) {
					const e = bt$6(i, Ft$3);
					null != e && n.add(dt$3(e));
				}
			}
			for (const t of n) {
				if (null !== Ua(t)) continue;
				let n = t;
				const r = pt$3(t);
				for (const t of r) {
					const r = Ws().setTextStyle(e.style).setTextFormat(e.format);
					r.setFormat(t.getFormatType()).setIndent(t.getIndent()).setDirection(t.getDirection()).setStyle(t.getStyle()), kt$3(r, t.getChildren()), n.insertAfter(r), n = r, t.__key === e.anchor.key && Ss(e.anchor, Ms(Eu(r, "next"))), t.__key === e.focus.key && Ss(e.focus, Ms(Eu(r, "next"))), t.remove();
				}
				t.remove();
			}
		}
	}
	function xt$4(t) {
		const e = "check" !== t.getListType();
		let n = t.getStart();
		for (const r of t.getChildren()) Mt$3(r) && (r.getValue() !== n && r.setValue(n), e && null != r.getLatest().__checked && r.setChecked(void 0), Wt$2(r.getFirstChild()) || n++);
	}
	function Lt$3(t) {
		const e = new Set();
		if (mt$4(t) || e.has(t.getKey())) return;
		const n = t.getParent(),
			r = t.getNextSibling(),
			i = t.getPreviousSibling();
		if (mt$4(r) && mt$4(i)) {
			const n = i.getFirstChild();
			if (Wt$2(n)) {
				n.append(t);
				const i = r.getFirstChild();
				if (Wt$2(i)) {
					kt$3(n, i.getChildren()), r.remove(), e.add(r.getKey());
				}
			}
		} else if (mt$4(r)) {
			const e = r.getFirstChild();
			if (Wt$2(e)) {
				const n = e.getFirstChild();
				null !== n && n.insertBefore(t);
			}
		} else if (mt$4(i)) {
			const e = i.getFirstChild();
			Wt$2(e) && e.append(t);
		} else if (Wt$2(n)) {
			const e = Ec(t),
				s = Ec(n);
			e.append(s), s.append(t), i ? i.insertAfter(e) : r ? r.insertBefore(e) : n.append(e);
		}
	}
	function Nt$3(t) {
		if (mt$4(t)) return;
		const e = t.getParent(),
			n = e ? e.getParent() : void 0;
		if (Wt$2(n ? n.getParent() : void 0) && Mt$3(n) && Wt$2(e)) {
			const r = e ? e.getFirstChild() : void 0,
				i = e ? e.getLastChild() : void 0;
			if (t.is(r)) n.insertBefore(t), e.isEmpty() && n.remove();else if (t.is(i)) n.insertAfter(t), e.isEmpty() && n.remove();else {
				const r = Ec(t),
					i = Ec(e);
				r.append(i), t.getPreviousSiblings().forEach(t => i.append(t));
				const s = Ec(t),
					o = Ec(e);
				s.append(o), kt$3(o, t.getNextSiblings()), n.insertBefore(r), n.insertAfter(s), n.replace(t);
			}
		}
	}
	function Pt$3(t = false) {
		const e = ni();
		if (!Er(e) || !e.isCollapsed()) return false;
		const c = e.anchor.getNode();
		let a = null;
		if (Mt$3(c) && 0 === c.getChildrenSize()) a = c;else if (gr(c)) {
			const t = c.getParent();
			Mt$3(t) && t.getChildren().every(t => gr(t) && "" === t.getTextContent().trim()) && (a = t);
		}
		if (null === a) return false;
		const u = dt$3(a),
			g = a.getParent();
		Wt$2(g) || ht$4(40);
		const h = g.getParent();
		let f;
		if (wc(h)) f = Ws(), u.insertAfter(f);else {
			if (!Mt$3(h)) return false;
			f = Ec(h), h.insertAfter(f);
		}
		f.setTextStyle(e.style).setTextFormat(e.format).select();
		const d = a.getNextSiblings();
		if (d.length > 0) {
			const e = t ? _t$3(0, a) : 1,
				n = Ec(g).setStart(e);
			if (Mt$3(f)) {
				const t = Ec(f);
				t.append(n), f.insertAfter(t);
			} else f.insertAfter(n);
			n.append(...d);
		}
		return function (t) {
			let e = t;
			for (; null == e.getNextSibling() && null == e.getPreviousSibling();) {
				const t = e.getParent();
				if (null == t || !Mt$3(t) && !Wt$2(t)) break;
				e = t;
			}
			e.remove();
		}(a), true;
	}
	let Ft$3 = class Ft extends ts {
		$config() {
			return this.config("listitem", {
				$transform: t => {
					const e = t.getParent();
					if (Wt$2(e)) "check" !== e.getListType() && null != t.getChecked() && t.setChecked(void 0);else if (e) {
						const n = t.createParentElementNode();
						Wt$2(n) || ht$4(340);
						const r = [t];
						for (const e of ["previous", "next"]) {
							r.reverse();
							for (const {
								origin: n
							} of ku(t, e)) {
								if (!Mt$3(n)) break;
								r.push(n);
							}
						}
						t.insertBefore(n), n.splice(0, 0, r), wc(e) || (zs(n, bs(ku(n, "next")), {
							$shouldSplit: () => false,
							removeEmptyDestination: true
						}), e.isEmpty() && e.isAttached() && e.remove());
					}
				},
				extends: ts,
				importDOM: Eo({
					li: () => ({
						conversion: At$3,
						priority: 0
					})
				})
			});
		}
		constructor(t = 1, e = void 0, n) {
			super(n), this.__value = void 0 === t ? 1 : t, this.__checked = e;
		}
		afterCloneFrom(t) {
			super.afterCloneFrom(t), this.__value = t.__value, this.__checked = t.__checked;
		}
		createDOM(t) {
			const e = Wc().createElement("li");
			return this.updateListItemDOM(null, e, t), e;
		}
		updateListItemDOM(t, e, n) {
			!function (t, e) {
				const n = e.getParent();
				!Wt$2(n) || "check" !== n.getListType() || Wt$2(e.getFirstChild()) ? (t.removeAttribute("role"), t.removeAttribute("tabIndex"), t.removeAttribute("aria-checked")) : (t.setAttribute("role", "checkbox"), t.setAttribute("tabIndex", "-1"), t.setAttribute("aria-checked", e.getChecked() ? "true" : "false"));
			}(e, this), e.value = this.__value, function (t, e, n) {
				const r = e.list;
				if (!r) return;
				const i = r.listitem,
					s = r.nested && r.nested.listitem,
					o = n.getParent(),
					l = Wt$2(o) && "check" === o.getListType(),
					c = n.getChecked(),
					a = n.getChildren().some(t => Wt$2(t)),
					u = [];
				void 0 !== r.listitemChecked && u.push(r.listitemChecked);
				void 0 !== r.listitemUnchecked && u.push(r.listitemUnchecked);
				void 0 !== s && u.push(...Yu(s));
				u.length > 0 && Xu(t, ...u);
				const g = [];
				void 0 !== i && g.push(...Yu(i));
				if (l) {
					const t = c ? r.listitemChecked : r.listitemUnchecked;
					void 0 !== t && g.push(t);
				}
				void 0 !== s && a && g.push(...Yu(s));
				g.length > 0 && Gu(t, ...g);
			}(e, n.theme, this);
			const r = t ? t.__style : "",
				i = this.__style;
			r !== i && Go(e.style, i, r), function (t, e, n) {
				const r = e.__textStyle,
					i = n ? n.__textStyle : "";
				if (null !== n && i === r) return;
				const s = Vo(r);
				for (const e in s) t.style.setProperty(`--listitem-marker-${e}`, s[e]);
				if ("" !== i) for (const e in Vo(i)) e in s || t.style.removeProperty(`--listitem-marker-${e}`);
			}(e, this, t);
		}
		updateDOM(t, e, n) {
			const r = e;
			return this.updateListItemDOM(t, r, n), false;
		}
		updateFromJSON(t) {
			return super.updateFromJSON(t).setValue(t.value).setChecked(t.checked);
		}
		exportDOM(t) {
			const e = this.createDOM(t._config),
				n = this.getFormatType();
			n && (e.style.textAlign = n);
			const r = this.getDirection();
			return r && (e.dir = r), mt$4(this) ? {
				after(t) {
					if (na(t)) {
						const e = t.previousElementSibling;
						if (na(e) && "LI" === e.nodeName) {
							for (; t.firstChild;) e.append(t.firstChild);
							t.remove();
						}
					}
					return t;
				},
				element: e
			} : {
				element: e
			};
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				checked: this.getChecked(),
				value: this.getValue()
			};
		}
		append(...t) {
			for (let e = 0; e < t.length; e++) {
				const n = t[e];
				if (es(n) && this.canMergeWith(n)) {
					const t = n.getChildren();
					this.append(...t), n.remove();
				} else super.append(n);
			}
			return this;
		}
		replace(t, e) {
			if (Mt$3(t)) return super.replace(t);
			this.setIndent(0);
			const i = this.getParentOrThrow();
			if (!Wt$2(i)) return t;
			if (i.__first === this.getKey()) i.insertBefore(t);else if (i.__last === this.getKey()) i.insertAfter(t);else {
				const e = Ec(i);
				let n = this.getNextSibling();
				for (; n;) {
					const t = n;
					n = n.getNextSibling(), e.append(t);
				}
				i.insertAfter(t), t.insertAfter(e);
			}
			const s = this.__key;
			let o = 0;
			if (e && (es(t) || ht$4(139), o = t.getChildrenSize(), t.splice(o, 0, this.getChildren())), e && es(t)) {
				const e = ni();
				if (Er(e)) for (const n of e.getStartEndPoints()) n.key === s && "element" === n.type && n.set(t.getKey(), o + n.offset, "element");
			}
			return this.remove(), 0 === i.getChildrenSize() && i.remove(), t;
		}
		insertAfter(t, e = true) {
			const n = this.getParentOrThrow();
			if (Wt$2(n) || ht$4(39), Mt$3(t)) return super.insertAfter(t, e);
			const r = this.getNextSiblings();
			if (n.insertAfter(t, e), 0 !== r.length) {
				const i = Ec(n),
					s = r[0];
				"number" === i.getListType() && Mt$3(s) && i.setStart(_t$3(0, s)), r.forEach(t => i.append(t)), t.insertAfter(i, e);
			}
			return t;
		}
		remove(t) {
			const e = this.getPreviousSibling(),
				n = this.getNextSibling();
			super.remove(t), e && n && mt$4(e) && mt$4(n) && e.getFirstChild().getListType() === n.getFirstChild().getListType() && (vt$4(e.getFirstChild(), n.getFirstChild()), n.remove());
		}
		resetOnCopyNodeFrom(t) {
			super.resetOnCopyNodeFrom(t), t.getChecked() && this.setChecked(false);
		}
		insertNewAfter(t, e = true) {
			const n = Ec(this);
			return this.insertAfter(n, e), n;
		}
		collapseAtStart(t) {
			if (mt$4(this)) return false;
			const e = this.getParentOrThrow();
			if (Mt$3(e.getParentOrThrow())) return Nt$3(this), true;
			const n = Ws().append(...this.getChildren()),
				r = this.getNextSiblings();
			if (r.length > 0) {
				const t = Ec(e);
				t.append(...r), e.insertAfter(t);
			}
			return e.insertAfter(n), this.remove(), 0 === e.getChildrenSize() && e.remove(), n.selectStart(), true;
		}
		getValue() {
			return this.getLatest().__value;
		}
		setValue(t) {
			const e = this.getWritable();
			return e.__value = t, e;
		}
		getChecked() {
			const t = this.getLatest();
			let e;
			const n = this.getParent();
			return Wt$2(n) && (e = n.getListType()), "check" === e ? Boolean(t.__checked) : void 0;
		}
		setChecked(t) {
			const e = this.getWritable();
			return e.__checked = t, e;
		}
		toggleChecked() {
			const t = this.getWritable();
			return t.setChecked(!t.__checked);
		}
		getIndent() {
			const t = this.getParent();
			if (null === t || !this.isAttached()) return this.getLatest().__indent;
			let e = t.getParentOrThrow(),
				n = 0;
			for (; Mt$3(e);) e = e.getParentOrThrow().getParentOrThrow(), n++;
			return n;
		}
		setIndent(t) {
			"number" != typeof t && ht$4(117), (t = Math.floor(t)) >= 0 || ht$4(199);
			let e = this.getIndent();
			for (; e !== t;) e < t ? (Lt$3(this), e++) : (Nt$3(this), e--);
			return this;
		}
		canInsertAfter(t) {
			return Mt$3(t);
		}
		canReplaceWith(t) {
			return Mt$3(t);
		}
		canMergeWith(t) {
			return Mt$3(t) || $s(t);
		}
		extractWithChild(t, e) {
			if (!Er(e)) return false;
			const n = e.anchor.getNode(),
				i = e.focus.getNode();
			return this.isParentOf(n) && this.isParentOf(i) && this.getTextContent().length === e.getTextContent().length;
		}
		isParentRequired() {
			return true;
		}
		createParentElementNode() {
			return Kt$2("bullet");
		}
		canMergeWhenEmpty() {
			return true;
		}
	};
	function At$3(t) {
		if (t.classList.contains("task-list-item")) for (const e of t.children) if ("INPUT" === e.tagName) return Ot$3(e);
		if (t.classList.contains("joplin-checkbox")) for (const e of t.children) if (e.classList.contains("checkbox-wrapper") && e.children.length > 0 && "INPUT" === e.children[0].tagName) return Ot$3(e.children[0]);
		const e = t.getAttribute("aria-checked"),
			n = Et$3("true" === e || "false" !== e && void 0);
		return ka(n, t), {
			after: It$2.bind(null, n),
			node: Ta(n, t)
		};
	}
	function Ot$3(t) {
		if (!("checkbox" === t.getAttribute("type"))) return {
			node: null
		};
		const e = Et$3(t.hasAttribute("checked"));
		return {
			after: It$2.bind(null, e),
			node: e
		};
	}
	function It$2(t, e) {
		const n = e[0];
		return 1 === e.length && $s(n) && !t.getFormatType() && n.getFormatType() ? (t.setFormat(n.getFormatType()), n.getChildren()) : e;
	}
	function Et$3(t) {
		return Mc(new Ft$3(void 0, t));
	}
	function Mt$3(t) {
		return t instanceof Ft$3;
	}
	let wt$3 = class wt extends ts {
		$config() {
			return this.config("list", {
				$transform: t => {
					!function (t) {
						const e = t.getNextSibling();
						Wt$2(e) && t.getListType() === e.getListType() && vt$4(t, e);
					}(t), xt$4(t);
				},
				extends: ts,
				importDOM: Eo({
					ol: () => ({
						conversion: $t$3,
						priority: 0
					}),
					ul: () => ({
						conversion: $t$3,
						priority: 0
					})
				})
			});
		}
		constructor(t = "number", e = 1, n) {
			super(n);
			const r = Rt$4[t] || t;
			this.__listType = r, this.__tag = "number" === r ? "ol" : "ul", this.__start = e;
		}
		afterCloneFrom(t) {
			super.afterCloneFrom(t), this.__listType = t.__listType, this.__tag = t.__tag, this.__start = t.__start;
		}
		getTag() {
			return this.getLatest().__tag;
		}
		setListType(t) {
			const e = this.getWritable();
			return e.__listType = t, e.__tag = "number" === t ? "ol" : "ul", e;
		}
		getListType() {
			return this.getLatest().__listType;
		}
		getStart() {
			return this.getLatest().__start;
		}
		setStart(t) {
			const e = this.getWritable();
			return e.__start = t, e;
		}
		createDOM(t, e) {
			const n = this.__tag,
				r = Wc().createElement(n);
			return 1 !== this.__start && r.setAttribute("start", String(this.__start)), r.__lexicalListType = this.__listType, Dt$3(r, t.theme, this), r;
		}
		updateDOM(t, e, n) {
			return t.__tag !== this.__tag || t.__listType !== this.__listType || (Dt$3(e, n.theme, this), t.__start !== this.__start && e.setAttribute("start", String(this.__start)), false);
		}
		updateFromJSON(t) {
			return super.updateFromJSON(t).setListType(t.listType).setStart(t.start);
		}
		exportDOM(t) {
			const e = this.createDOM(t._config, t);
			if (na(e)) {
				1 !== this.__start && e.setAttribute("start", String(this.__start)), "check" === this.__listType && e.setAttribute("__lexicalListType", "check");
				const t = this.getDirection();
				t && (e.dir = t);
			}
			return {
				element: e
			};
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				listType: this.getListType(),
				start: this.getStart(),
				tag: this.getTag()
			};
		}
		canBeEmpty() {
			return false;
		}
		canIndent() {
			return false;
		}
		splice(t, e, n) {
			let r = n;
			for (let t = 0; t < n.length; t++) {
				const e = n[t];
				if (!Mt$3(e)) {
					r === n && (r = [...n]);
					const i = this.createListItemNode();
					!es(e) || Wt$2(e) || e.isInline() ? i.append(e) : i.append(...e.getChildren()), r[t] = i;
				}
			}
			return super.splice(t, e, r);
		}
		extractWithChild(t) {
			return Mt$3(t);
		}
		createListItemNode() {
			return Et$3();
		}
	};
	function Dt$3(t, e, n) {
		const r = [],
			i = [],
			s = e.list;
		if (void 0 !== s) {
			const t = s[`${n.__tag}Depth`] || [],
				e = ft$3(n) - 1,
				o = e % t.length,
				l = t[o],
				c = s[n.__tag];
			let a;
			const u = s.nested,
				g = s.checklist;
			if (void 0 !== u && u.list && (a = u.list), void 0 !== c && r.push(c), void 0 !== g && "check" === n.__listType && r.push(g), void 0 !== l) {
				r.push(...Yu(l));
				for (let e = 0; e < t.length; e++) e !== o && i.push(...Yu(t[e]));
			}
			if (void 0 !== a) {
				const t = Yu(a);
				e > 1 ? r.push(...t) : i.push(...t);
			}
		}
		i.length > 0 && Xu(t, ...i), r.length > 0 && Gu(t, ...r);
	}
	function $t$3(t) {
		let e;
		if (function (t) {
			return na(t) && "ol" === t.nodeName.toLowerCase();
		}(t)) {
			const n = t.start;
			e = Kt$2("number", n);
		} else e = function (t) {
			if ("check" === t.getAttribute("__lexicallisttype") || t.classList.contains("contains-task-list") || "1" === t.getAttribute("data-is-checklist")) return true;
			for (const e of t.childNodes) if (na(e) && e.hasAttribute("aria-checked")) return true;
			return false;
		}(t) ? Kt$2("check") : Kt$2("bullet");
		return Ta(e, t), {
			after: t => function (t, e) {
				const n = e.createListItemNode.bind(e),
					r = [];
				for (let e = 0; e < t.length; e++) {
					const i = t[e];
					if (Mt$3(i)) {
						r.push(i);
						const t = i.getChildren();
						t.length > 1 && t.forEach(t => {
							Wt$2(t) && r.push(n().append(t));
						});
					} else r.push(n().append(i));
				}
				return r;
			}(t, e),
			node: e
		};
	}
	const Rt$4 = {
		ol: "number",
		ul: "bullet"
	};
	function Kt$2(t = "number", e = 1) {
		return Mc(new wt$3(t, e));
	}
	function Wt$2(t) {
		return t instanceof wt$3;
	}
	const Bt$2 = new Set([" ", "Alt", "ArrowDown", "ArrowLeft", "ArrowUp", "CapsLock", "Control", "Escape", "Meta", "Shift"]),
		Ut$2 = /* @__PURE__ */Re$2("INSERT_CHECK_LIST_COMMAND");
	function qt$2(t, e) {
		const i$1 = e && e.disableTakeFocusOnClick || false,
			s = "boolean" == typeof i$1 ? () => i$1 : i$1.peek.bind(i$1),
			o = t => {
				const e = t.target;
				if (!na(e)) return false;
				const n = e.__lexicalCheckListLastHandled;
				return void 0 !== n && t.timeStamp - n < 500;
			},
			l = t => {
				"touch" === t.pointerType && (o(t) || ((t => {
					const e = t.target;
					na(e) && (e.__lexicalCheckListLastHandled = t.timeStamp);
				})(t), Jt$2(t, s())));
			};
		let a = "none";
		const u = t => {
				a = function (t, e) {
					let n = false;
					return Vt$2(t, () => {
						n = true, t.preventDefault(), e && t.stopPropagation();
					}), n;
				}(t, s()) ? "checkMark" : "content";
			},
			g = () => {
				"content" === a && zt$2(t), a = "none";
			};
		return Qu(t.registerCommand(Ut$2, () => (St$4("check"), true), js), t.registerCommand(hn$3, e => Xt$2(e, t, false), js), t.registerCommand(dn$3, e => Xt$2(e, t, true), js), t.registerCommand(yn$3, () => {
			if (null != Ht$2(t)) {
				const e = t.getRootElement();
				return null != e && e.focus(), true;
			}
			return false;
		}, js), t.registerCommand(_n$2, e => {
			const n = Ht$2(t);
			return !(null == n || !t.isEditable()) && (t.update(() => {
				const t = Bl(n);
				Mt$3(t) && (e.preventDefault(), t.toggleChecked());
			}), true);
		}, js), t.registerCommand(un$3, e => null !== Ht$2(t) ? (zt$2(t), false) : t.read("latest", () => {
			const i = ni();
			if (Er(i) && i.isCollapsed()) {
				const {
						anchor: n
					} = i,
					r = "element" === n.type;
				if (r || 0 === n.offset) {
					const i = n.getNode(),
						s = La(i, t => es(t) && !t.isInline());
					if (Mt$3(s)) {
						const n = s.getParent();
						if (Wt$2(n) && "check" === n.getListType() && (r || s.getFirstDescendant() === i)) {
							const n = t.getElementByKey(s.__key);
							if (null != n && Yc(n) !== n) return n.focus(), e.preventDefault(), true;
						}
					}
				}
			}
			return false;
		}), js), t.registerRootListener(e => {
			if (null !== e) return Qu(Zu(e, {
				click: t => {
					g(), (t => {
						o(t) || Jt$2(t, s());
					})(t);
				},
				pointerup: t => {
					g(), l(t);
				}
			}), Zu(e, {
				beforeinput: () => zt$2(t),
				focusin: () => {
					i && "content" === a && zt$2(t);
				},
				keydown: e => {
					Bt$2.has(e.key) || zt$2(t);
				},
				mousedown: u,
				pointerdown: u
			}, {
				capture: true
			}), jn$2(e, "touchstart", u, {
				capture: true,
				passive: false
			}));
		}));
	}
	function Vt$2(t, n) {
		const r = t.target;
		if (!na(r)) return;
		const i = r.firstChild;
		if (na(i) && ("UL" === i.tagName || "OL" === i.tagName)) return;
		const s = r.parentNode;
		if (!s || "check" !== s.__lexicalListType) return;
		let o = null,
			l = null;
		if ("clientX" in t) o = t.clientX;else if ("touches" in t) {
			const e = t.touches;
			e.length > 0 && (o = e[0].clientX, l = "touch");
		}
		if (null == o) return;
		const c = r.getBoundingClientRect(),
			a = o / Kt$4(r),
			u = r.ownerDocument.defaultView,
			g = u ? u.getComputedStyle(r, "::before") : {
				width: "0px"
			},
			h = parseFloat(g.width),
			f = "touch" === l || "pointerType" in t && "touch" === t.pointerType ? 32 : 0;
		("rtl" === r.dir ? a < c.right + f && a > c.right - h - f : a > c.left - f && a < c.left + h + f) && n();
	}
	function Jt$2(t, e) {
		Vt$2(t, () => {
			if (na(t.target)) {
				const n = t.target,
					r = xl(n);
				null != r && r.isEditable() && r.update(() => {
					const t = Bl(n);
					Mt$3(t) && (e ? (xc(Uo), xc($o)) : n.focus(), t.toggleChecked());
				});
			}
		});
	}
	function zt$2(t) {
		const e = t.getRootElement(),
			n = e ? Yc(e) : null;
		null !== e && na(n) && jt$2(n) && e.focus({
			preventScroll: true
		});
	}
	function jt$2(t) {
		const e = t.parentNode;
		return "LI" === t.tagName && null != e && "check" === e.__lexicalListType;
	}
	function Ht$2(t) {
		const e = t.getRootElement(),
			n = e ? Yc(e) : null;
		return na(n) && jt$2(n) ? n : null;
	}
	function Xt$2(t, e, n) {
		const r = Ht$2(e);
		if (null != r) {
			let i = null;
			e.update(() => {
				const s = Bl(r);
				if (!Mt$3(s)) return;
				const o = function (t, e) {
					let n = e ? t.getPreviousSibling() : t.getNextSibling(),
						r = t;
					for (; null == n && Mt$3(r);) r = r.getParentOrThrow().getParent(), null != r && (n = e ? r.getPreviousSibling() : r.getNextSibling());
					for (; Mt$3(n);) {
						const t = e ? n.getLastChild() : n.getFirstChild();
						if (!Wt$2(t)) return n;
						n = e ? t.getLastChild() : t.getFirstChild();
					}
					return null;
				}(s, n);
				null != o && (o.selectStart(), null != e.getElementByKey(o.__key) && (t.preventDefault(), i = o.__key));
			}, {
				onUpdate: () => {
					const t = null === i ? null : e.getElementByKey(i);
					null != t && t.focus();
				}
			});
		}
		return false;
	}
	function Gt$2(t, e) {
		const n = [];
		for (const r of t) if (Mt$3(r)) {
			n.push(r);
			const t = r.getChildren();
			if (t.length > 1) for (const r of t) Wt$2(r) && n.push(e.createListItemNode().append(r));
		} else n.push(e.createListItemNode().append(r));
		return n;
	}
	const Zt$1 = {
		$import: (t, e) => {
			let n;
			var r;
			return pe$1(e, "ol") ? n = Kt$2("number", e.start) : n = (r = e).matches('[__lexicallisttype="check"], .contains-task-list, [data-is-checklist="1"]') || null !== r.querySelector(":scope > [aria-checked]") ? Kt$2("check") : Kt$2("bullet"), Ta(n, e), [n.splice(0, 0, Ie(Gt$2(t.$importChildren(e), n), e))];
		},
		match: /* @__PURE__ */$n$1.tag("ol", "ul"),
		name: "@lexical/list/list"
	};
	function Qt$2(t, e) {
		if (1 !== e.length) return e;
		const n = e[0];
		return $s(n) && !t.getFormatType() && n.getFormatType() ? (t.setFormat(n.getFormatType()), n.getChildren()) : e;
	}
	function Yt$2(t) {
		const e = t => Ne$1(t) && !Wt$2(t);
		if (!t.some(e)) return t;
		const n = [];
		let r = [];
		const i = () => {
			r.length > 0 && (n.push(r), r = []);
		};
		for (const s of t) e(s) ? (i(), n.push(es(s) ? s.getChildren() : [s])) : r.push(s);
		i();
		const s = [];
		for (const t of n) s.length > 0 && s.push(_s()), s.push(...t);
		return s;
	}
	const te = {
		$import: (t, e) => {
			const n = e.getAttribute("aria-checked"),
				r = Et$3("true" === n || "false" !== n && void 0);
			return ka(r, e), Ta(r, e), [r.splice(0, 0, Yt$2(Qt$2(r, t.$importChildren(e))))];
		},
		match: /* @__PURE__ */$n$1.tag("li"),
		name: "@lexical/list/li"
	};
	function ee(t, e, n) {
		const r = pe$1(n, "input") ? n : n.querySelector('input[type="checkbox"]');
		if (!r || "checkbox" !== r.getAttribute("type")) return [];
		const i = Et$3(r.hasAttribute("checked"));
		return ka(i, e), Ta(i, e), [i.splice(0, 0, Yt$2(Qt$2(i, t.$importChildren(e))))];
	}
	const ne = {
			$accepts: t => Mt$3(t) || Wt$2(t),
			$packageRun: t => [Et$3().splice(0, 0, t)],
			name: "ListSchema"
		},
		re = [{
			$import: (t, e, n) => {
				const r = e.querySelector(':scope > input[type="checkbox"]');
				return r ? ee(t, e, r) : n();
			},
			match: /* @__PURE__ */$n$1.tag("li").classAll("task-list-item"),
			name: "@lexical/list/li-task-list-item"
		}, {
			$import: (t, e, n) => {
				const r = e.querySelector(":scope > .checkbox-wrapper");
				if (!r) return n();
				const i = r.querySelector(':scope > input[type="checkbox"]');
				return i ? ee(t, e, i) : n();
			},
			match: /* @__PURE__ */$n$1.tag("li").classAll("joplin-checkbox"),
			name: "@lexical/list/li-joplin-checkbox"
		}, Zt$1, te],
		ie = /* @__PURE__ */Re$2("UPDATE_LIST_START_COMMAND"),
		se = /* @__PURE__ */Re$2("INSERT_UNORDERED_LIST_COMMAND"),
		oe = /* @__PURE__ */Re$2("INSERT_ORDERED_LIST_COMMAND"),
		le = /* @__PURE__ */Re$2("REMOVE_LIST_COMMAND");
	function ce(t, e) {
		return Qu(t.registerCommand(oe, () => (St$4("number"), true), js), t.registerCommand(ie, t => {
			const {
					listNodeKey: e,
					newStart: n
				} = t,
				r = Il(e);
			return !!Wt$2(r) && ("number" === r.getListType() && (r.setStart(n), xt$4(r)), true);
		}, js), t.registerCommand(se, () => (St$4("bullet"), true), js), t.registerCommand(le, () => (Tt$4(), true), js), t.registerCommand(Ge$2, () => Pt$3(!!(e && e.restoreNumbering)), js), t.registerCommand(pn$3, t => {
			const e = ni();
			if (!Er(e) || !e.isCollapsed()) return false;
			const {
				anchor: i
			} = e;
			if (0 !== i.offset) return false;
			let s = i.getNode();
			for (; !Mt$3(s);) {
				if (null !== s.getPreviousSibling()) return false;
				const t = s.getParent();
				if (null === t) return false;
				s = t;
			}
			return !(!Mt$3(s) || !s.collapseAtStart(e)) && (t.preventDefault(), true);
		}, Ys), t.registerNodeTransform(Ft$3, t => {
			const e = t.getFirstChild();
			if (e) {
				if (gr(e)) {
					const n = e.getStyle(),
						r = e.getFormat();
					t.getTextStyle() !== n && t.setTextStyle(n), t.getTextFormat() !== r && t.setTextFormat(r);
				}
			} else {
				const e = ni();
				Er(e) && (e.style !== t.getTextStyle() || e.format !== t.getTextFormat()) && e.isCollapsed() && t.is(e.anchor.getNode()) && t.setTextStyle(e.style).setTextFormat(e.format);
			}
		}), t.registerNodeTransform(rr, t => {
			const e = t.getParent();
			if (Mt$3(e) && t.is(e.getFirstChild())) {
				const n = t.getStyle(),
					r = t.getFormat();
				n === e.getTextStyle() && r === e.getTextFormat() || e.setTextStyle(n).setTextFormat(r);
			}
		}));
	}
	function ae(t) {
		const e = t => {
			const e = t.getParent();
			if (Wt$2(t.getFirstChild()) || !Wt$2(e)) return;
			const n = La(t, t => Mt$3(t) && Wt$2(t.getParent()) && Mt$3(t.getPreviousSibling()));
			if (null === n && t.getIndent() > 0) t.setIndent(0);else if (Mt$3(n)) {
				const r = n.getPreviousSibling();
				if (Mt$3(r)) {
					const n = function (t) {
							let e = t,
								n = e.getFirstChild();
							for (; Wt$2(n);) {
								const t = n.getLastChild();
								if (!Mt$3(t)) break;
								e = t, n = e.getFirstChild();
							}
							return e;
						}(r),
						i = n.getParent();
					if (Wt$2(i)) {
						const n = ft$3(i);
						n + 1 < ft$3(e) && t.setIndent(n);
					}
				}
			}
		};
		return t.registerNodeTransform(wt$3, t => {
			const n = [t];
			for (; n.length > 0;) {
				const t = n.shift();
				if (Wt$2(t)) for (const r of t.getChildren()) if (Mt$3(r)) {
					e(r);
					const t = r.getFirstChild();
					Wt$2(t) && n.push(t);
				}
			}
		});
	}
	const ue = {
			build: (t, e, n) => fe$2(e),
			config: {
				hasStrictIndent: false,
				shouldPreserveNumbering: false
			},
			dependencies: [gn$1, [hn$1, {
				rules: re
			}]],
			name: "@lexical/list/List",
			nodes: () => [wt$3, Ft$3],
			register(t, e, n) {
				const r = n.getOutput();
				return Qu(de$2(() => ce(t, {
					restoreNumbering: r.shouldPreserveNumbering.value
				})), de$2(() => r.hasStrictIndent.value ? ae(t) : void 0));
			}
		},
		ge = {
			build: (t, e) => fe$2(e),
			config: {
				disableTakeFocusOnClick: false
			},
			dependencies: [ue],
			name: "@lexical/list/CheckList",
			register: (t, e, n) => qt$2(t, n.getOutput())
		},
		he = {
			dependencies: [ue],
			name: "@lexical/list/Import"
		},
		fe = /^MsoListParagraph(CxSp(First|Middle|Last))?$/,
		de = /^[A-Za-z0-9]+[.)]/,
		pe = /Microsoft Word/i,
		me = "data-mso-list";
	function _e(t) {
		const e = (t.getAttribute(me) || "").match(/level(\d+)/);
		return e ? parseInt(e[1], 10) : 1;
	}
	function ye(t) {
		return t.querySelector(`span[${me}="Ignore"]`);
	}
	function Ce(t) {
		const e = ye(t);
		return e ? (e.textContent || "").trim() : "";
	}
	function Se(t) {
		return de.test(t) ? "number" : "bullet";
	}
	function ke(t) {
		const e = ye(t);
		if (!e) return;
		let n = e;
		for (; n.parentElement && n.parentElement !== t && "SPAN" === n.parentElement.nodeName;) n = n.parentElement;
		n.remove();
	}
	function be(t) {
		return na(t) && fe.test(t.className);
	}
	function ve(t, e) {
		const n = Kt$2(Se(e[0].marker)),
			r = [{
				level: e[0].level,
				list: n
			}];
		for (const n of e) {
			for (; r.length > 1 && r[r.length - 1].level > n.level;) r.pop();
			if (n.level > r[r.length - 1].level) {
				const t = Kt$2(Se(n.marker));
				r[r.length - 1].list.append(Et$3().append(t)), r.push({
					level: n.level,
					list: t
				});
			}
			ke(n.el), r[r.length - 1].list.append(Et$3().splice(0, 0, t.$importChildren(n.el, {
				schema: Te$1
			})));
		}
		return n;
	}
	const Te = /* @__PURE__ */ye$1("@lexical/list/word-consumed-list-items", () => null),
		xe = {
			$import: (t, e) => {
				let n = t.session.get(Te);
				if (null === n && (n = new WeakSet(), t.session.set(Te, n)), n.has(e)) return [];
				const r = [];
				let i = e;
				for (; i && be(i) && (n.add(i), r.push({
					el: i,
					level: _e(i),
					marker: Ce(i)
				}), !i.classList.contains("MsoListParagraphCxSpLast") && "MsoListParagraph" !== i.className);) i = i.nextElementSibling;
				return [ve(t, r)];
			},
			match: /* @__PURE__ */$n$1.tag("p").classAny("MsoListParagraph", "MsoListParagraphCxSpFirst", "MsoListParagraphCxSpMiddle", "MsoListParagraphCxSpLast"),
			name: "@lexical/list/word-list-paragraph"
		},
		Le = /* @__PURE__ */cn$1([{
			$import: () => [],
			match: /* @__PURE__ */$n$1.tag("o:p"),
			name: "@lexical/list/word-o-p"
		}, xe]),
		Ne = {
			dependencies: [ue, [hn$1, {
				preprocess: [(t, e, n) => {
					const r = t.querySelector('meta[name="Generator"]');
					if (r && pe.test(r.getAttribute("content") || "")) {
						for (const e of Array.from(t.querySelectorAll('[style*="mso-list"]'))) {
							const t = Vo(e.getAttribute("style") || "")["mso-list"];
							t && e.setAttribute(me, t);
						}
						e.session.update(we, t => [...t, Le]);
					}
					n();
				}]
			}]],
			name: "@lexical/list/WordListImport"
		};

	var LexicalList_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createListItemNode: Et$3,
		$createListNode: Kt$2,
		$getListDepth: ft$3,
		$handleListInsertParagraph: Pt$3,
		$insertList: St$4,
		$isListItemNode: Mt$3,
		$isListNode: Wt$2,
		$removeList: Tt$4,
		CheckListExtension: ge,
		INSERT_CHECK_LIST_COMMAND: Ut$2,
		INSERT_ORDERED_LIST_COMMAND: oe,
		INSERT_UNORDERED_LIST_COMMAND: se,
		ListExtension: ue,
		ListImportExtension: he,
		ListImportRules: re,
		ListItemNode: Ft$3,
		ListNode: wt$3,
		ListSchema: ne,
		REMOVE_LIST_COMMAND: le,
		UPDATE_LIST_START_COMMAND: ie,
		WordListImportExtension: Ne,
		registerCheckList: qt$2,
		registerList: ce,
		registerListStrictIndentTransform: ae
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	const v = {
			build(e, t, n) {
				const r = n.getInitResult();
				return {
					...fe$2(t),
					announce(e) {
						r.value = e === r.peek() ? e + "\u200b" : e;
					}
				};
			},
			config: {
				owner: null,
				politeness: "polite"
			},
			dependencies: [_n$1],
			init: () => ee$2(""),
			name: "@lexical/a11y/AriaLiveRegion",
			register(o, i, u) {
				const l = u.getInitResult(),
					{
						owner: a,
						politeness: s
					} = u.getOutput(),
					c = u.getDependency(_n$1).output,
					d = ee$2(null);
				return Qu(de$2(() => {
					const e = a.value,
						t = e ? null : c.value,
						n = e ?? (t ? t.ownerDocument.body : null);
					if (!n) return;
					const o = function (e) {
						const t = e.ownerDocument.createElement("div");
						return t.setAttribute("aria-atomic", "true"), t.setAttribute("role", "status"), function (e) {
							const t = e.style;
							t.border = "0", t.clip = "rect(0 0 0 0)", t.height = "1px", t.margin = "-1px", t.overflow = "hidden", t.padding = "0", t.position = "absolute", t.whiteSpace = "nowrap", t.width = "1px";
						}(t), e.appendChild(t), t;
					}(n);
					return d.value = o, () => {
						o.remove(), d.value = null;
					};
				}), de$2(() => {
					const e = d.value;
					e && e.setAttribute("aria-live", s.value);
				}), de$2(() => {
					const e = l.value,
						t = d.peek();
					t && (t.textContent = e);
				}));
			}
		};

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	const K = new Set(["http:", "https:", "mailto:", "sms:", "tel:"]);
	class B extends ts {
		$config() {
			return this.config("link", {
				extends: ts,
				importDOM: {
					a: () => ({
						conversion: H$1,
						priority: 1
					})
				}
			});
		}
		constructor(t = "", e = {}, n) {
			super(n);
			const {
				target: r = null,
				rel: i = null,
				title: s = null
			} = e;
			this.__url = t, this.__target = r, this.__rel = i, this.__title = s;
		}
		afterCloneFrom(t) {
			super.afterCloneFrom(t), this.__url = t.__url, this.__rel = t.__rel, this.__target = t.__target, this.__title = t.__title;
		}
		createDOM(t) {
			const e = Wc().createElement("a");
			return this.updateLinkDOM(null, e, t), Gu(e, t.theme.link), e;
		}
		updateLinkDOM(t, e, n) {
			if (Zc(e)) {
				t && t.__url === this.__url || (e.href = this.sanitizeUrl(this.__url));
				for (const n of ["target", "rel", "title"]) {
					const r = `__${n}`,
						i = this[r];
					t && t[r] === i || (i ? e[n] = i : e.removeAttribute(n));
				}
			}
		}
		updateDOM(t, e, n) {
			return this.updateLinkDOM(t, e, n), false;
		}
		updateFromJSON(t) {
			return super.updateFromJSON(t).setURL(t.url).setRel(t.rel || null).setTarget(t.target || null).setTitle(t.title || null);
		}
		sanitizeUrl(t) {
			const e = t;
			t = rt$2(t);
			try {
				const e = new URL(rt$2(t));
				if (!K.has(e.protocol)) return "about:blank";
			} catch (t) {
				const n = e.replace(/[\u0000-\u001F\u007F\s]/g, "").match(/^([a-z][a-z0-9+.-]*):/i);
				if (null != n && !K.has(`${n[1].toLowerCase()}:`)) return "about:blank";
			}
			return t;
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				rel: this.getRel(),
				target: this.getTarget(),
				title: this.getTitle(),
				url: this.getURL()
			};
		}
		getURL() {
			return this.getLatest().__url;
		}
		setURL(t) {
			const e = this.getWritable();
			return e.__url = t, e;
		}
		getTarget() {
			return this.getLatest().__target;
		}
		setTarget(t) {
			const e = this.getWritable();
			return e.__target = t, e;
		}
		getRel() {
			return this.getLatest().__rel;
		}
		setRel(t) {
			const e = this.getWritable();
			return e.__rel = t, e;
		}
		getTitle() {
			return this.getLatest().__title;
		}
		setTitle(t) {
			const e = this.getWritable();
			return e.__title = t, e;
		}
		insertNewAfter(t, e = true) {
			const n = Ec(this);
			return this.insertAfter(n, e), n;
		}
		canInsertTextBefore() {
			return false;
		}
		canInsertTextAfter() {
			return false;
		}
		canBeEmpty() {
			return false;
		}
		isInline() {
			return true;
		}
		extractWithChild(t, e, n) {
			if (!Er(e)) return false;
			const r = e.anchor.getNode(),
				i = e.focus.getNode();
			return (this.is(r) || this.isParentOf(r)) && (this.is(i) || this.isParentOf(i)) && e.getTextContent().length > 0;
		}
		isEmailURI() {
			return this.getURL().startsWith("mailto:");
		}
		isWebSiteURI() {
			const t = this.getURL();
			return t.startsWith("https://") || t.startsWith("http://");
		}
		shouldMergeAdjacentLink(t) {
			return this.getType() === t.getType() && this.getURL() === t.getURL() && this.getTarget() === t.getTarget() && this.getRel() === t.getRel() && this.getTitle() === t.getTitle();
		}
	}
	function J(t) {
		const e = Cs(t, "next");
		return [e, e.getFlipped()];
	}
	function j(t, e) {
		for (const n of e) if (n.origin.isAttached()) {
			const e = Ms(n);
			return void Ss(t, e);
		}
	}
	function Z$1(t) {
		const e = ni();
		let n = null,
			r = null;
		function i() {
			Er(e) && (j(e.anchor, n), j(e.focus, r), Bt$6(e));
		}
		Er(e) && (n = J(e.anchor), r = J(e.focus));
		let s = false;
		for (const e of Eu(t, "next")) {
			const n = e.origin;
			if (es(n) && !n.isInline()) {
				const r = n.getChildren();
				if (r.length > 0) {
					const e = Ec(t);
					e.append(...r), n.append(e), s = true;
				}
				zs(n, bs(e), {
					$shouldSplit: () => false
				});
			}
		}
		function l(t, e, n) {
			const [r, i] = t,
				s = t => xu(t) && t.origin.is(e);
			if (!s(r) && !s(i)) return t;
			const l = Ms(Eu(n, "next"));
			return [l, l.getFlipped()];
		}
		if (t.isAttached()) {
			const e = t.getPreviousSibling();
			if (q(e) && e.shouldMergeAdjacentLink(t)) return n && (n = l(n, e, t)), r && (r = l(r, e, t)), e.append(...t.getChildren()), t.remove(), void i();
			const o = t.getNextSibling();
			q(o) && t.shouldMergeAdjacentLink(o) && (n && (n = l(n, t, o)), r && (r = l(r, t, o)), t.append(...o.getChildren()), o.remove(), s = true);
		}
		if (s) {
			if (!t.canBeEmpty() && t.isEmpty()) {
				const e = t.getParent();
				t.remove(), e && e.isEmpty() && e.remove();
			}
			i();
		}
	}
	function H$1(t) {
		let e = null;
		if (Zc(t)) {
			const n = t.textContent;
			(null !== n && "" !== n || t.children.length > 0) && (e = G(t.getAttribute("href") || "", {
				rel: t.getAttribute("rel"),
				target: t.getAttribute("target"),
				title: t.getAttribute("title")
			}));
		}
		return {
			node: e
		};
	}
	function G(t = "", e) {
		return Mc(new B(t, e));
	}
	function q(t) {
		return t instanceof B;
	}
	class Q extends B {
		constructor(t = "", e = {}, n) {
			super(t, e, n), this.__isUnlinked = void 0 !== e.isUnlinked && null !== e.isUnlinked && e.isUnlinked;
		}
		afterCloneFrom(t) {
			super.afterCloneFrom(t), this.__isUnlinked = t.__isUnlinked;
		}
		$config() {
			return this.config("autolink", {
				extends: B
			});
		}
		shouldMergeAdjacentLink(t) {
			return false;
		}
		getIsUnlinked() {
			return this.getLatest().__isUnlinked;
		}
		setIsUnlinked(t) {
			const e = this.getWritable();
			return e.__isUnlinked = t, e;
		}
		createDOM(t) {
			return this.__isUnlinked ? Wc().createElement("span") : super.createDOM(t);
		}
		updateDOM(t, e, n) {
			return super.updateDOM(t, e, n) || t.__isUnlinked !== this.__isUnlinked;
		}
		updateFromJSON(t) {
			return super.updateFromJSON(t).setIsUnlinked(t.isUnlinked || false);
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				isUnlinked: this.__isUnlinked
			};
		}
	}
	function V(t = "", e) {
		return Mc(new Q(t, e));
	}
	function X(t) {
		return t instanceof Q;
	}
	const Y = /* @__PURE__ */Re$2("TOGGLE_LINK_COMMAND");
	function tt$1(t, e) {
		if ("element" === t.type) {
			const n = t.getNode();
			es(n) || function (t, ...e) {
				const n = new URL("https://lexical.dev/docs/error"),
					r = new URLSearchParams();
				r.append("code", t);
				for (const t of e) r.append("v", t);
				throw n.search = r.toString(), Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
			}(252);
			return n.getChildren()[t.offset + e] || null;
		}
		return null;
	}
	function et$1(t, e = {}) {
		let n;
		if (t && "object" == typeof t) {
			const {
				url: r,
				...i
			} = t;
			n = r, e = {
				...i,
				...e
			};
		} else n = t;
		const {
				target: r,
				title: i
			} = e,
			s = void 0 === e.rel ? "noreferrer" : e.rel,
			l = ni();
		if (null === l || !Er(l) && !Or(l)) return;
		if (Or(l)) {
			const t = l.getNodes();
			if (0 === t.length) return;
			return void t.forEach(t => {
				if (null === n) {
					const e = La(t, t => !X(t) && q(t));
					e && (e.insertBefore(t), 0 === e.getChildren().length && e.remove());
				} else {
					const e = La(t, t => !X(t) && q(t));
					if (e) e.setURL(n), void 0 !== r && e.setTarget(r), void 0 !== s && e.setRel(s), void 0 !== i && e.setTitle(i);else {
						const e = G(n, {
							rel: s,
							target: r,
							title: i
						});
						t.insertBefore(e), e.append(t);
					}
				}
			});
		}
		if (l.isCollapsed() && null === n) for (const t of l.getNodes()) {
			const e = La(t, t => !X(t) && q(t));
			return void (null !== e && (e.getParentOrThrow().splice(e.getIndexWithinParent(), 0, e.getChildren()), e.remove()));
		}
		const a = l.extract();
		if (null === n) {
			const t = new Set();
			return void a.forEach(e => {
				const n = La(e, t => !X(t) && q(t));
				if (null !== n) {
					const e = n.getKey();
					if (t.has(e)) return;
					!function (t, e) {
						const n = new Set(e.filter(e => t.isParentOf(e)).map(t => t.getKey())),
							r = t.getChildren(),
							i = r => n.has(r.getKey()) || es(r) && e.some(e => t.isParentOf(e) && r.isParentOf(e)),
							s = r.filter(i);
						if (s.length === r.length) return r.forEach(e => t.insertBefore(e)), void t.remove();
						const l = r.findIndex(i),
							u = r.findLastIndex(i),
							a = 0 === l,
							c = u === r.length - 1;
						if (a) s.forEach(e => t.insertBefore(e));else if (c) for (let e = s.length - 1; e >= 0; e--) t.insertAfter(s[e]);else {
							for (let e = s.length - 1; e >= 0; e--) t.insertAfter(s[e]);
							const e = r.slice(u + 1);
							if (e.length > 0) {
								const n = Ec(t);
								s[s.length - 1].insertAfter(n), e.forEach(t => n.append(t));
							}
						}
					}(n, a), t.add(e);
				}
			});
		}
		const c = new Set(),
			m = t => {
				c.has(t.getKey()) || (c.add(t.getKey()), t.setURL(n), void 0 !== r && t.setTarget(r), void 0 !== s && t.setRel(s), void 0 !== i && t.setTitle(i));
			};
		if (1 === a.length) {
			const t = a[0],
				e = La(t, q);
			if (null !== e) return m(e);
		}
		!function (t) {
			const e = ni();
			if (!Er(e)) return t();
			const n = Bt$6(e),
				r = n.isBackward(),
				i = tt$1(n.anchor, r ? -1 : 0),
				s = tt$1(n.focus, r ? 0 : -1);
				t();
			if (i || s) {
				const t = ni();
				if (Er(t)) {
					const e = t.clone();
					if (i) {
						const t = i.getParent();
						t && e.anchor.set(t.getKey(), i.getIndexWithinParent() + (r ? 1 : 0), "element");
					}
					if (s) {
						const t = s.getParent();
						t && e.focus.set(t.getKey(), s.getIndexWithinParent() + (r ? 0 : 1), "element");
					}
					Hl(Bt$6(e));
				}
			}
		}(() => {
			let t = null;
			for (const e of a) {
				if (!e.isAttached()) continue;
				const l = La(e, q);
				if (l) {
					m(l);
					continue;
				}
				if (es(e)) {
					if (!e.isInline()) continue;
					if (q(e)) {
						if (!(X(e) || null !== t && t.getParentOrThrow().isParentOf(e))) {
							m(e), t = e;
							continue;
						}
						for (const t of e.getChildren()) e.insertBefore(t);
						e.remove();
						continue;
					}
				}
				const o = e.getPreviousSibling();
				q(o) && o.is(t) ? o.append(e) : (t = G(n, {
					rel: s,
					target: r,
					title: i
				}), e.insertAfter(t), t.append(e));
			}
		});
	}
	const nt$1 = /^\+?[0-9\s()-]{5,}$/;
	function rt$2(t) {
		return t.match(/^[a-z][a-z0-9+.-]*:/i) || t.match(/^[/#.]/) ? t : t.includes("@") ? `mailto:${t}` : nt$1.test(t) ? `tel:${t}` : `https://${t}`;
	}
	const it$2 = {
			build: (t, e) => fe$2(e),
			config: {
				created: "Link",
				createdMany: "%s links",
				destroyed: "Link removed",
				destroyedMany: "%s links removed",
				disabled: false
			},
			dependencies: [v],
			name: "@lexical/link/AutoLinkAnnounce",
			register(n, r, i) {
				const {
						created: s,
						createdMany: l,
						destroyed: o,
						destroyedMany: u,
						disabled: a
					} = i.getOutput(),
					{
						announce: c
					} = i.getDependency(v).output;
				return de$2(() => a.value ? void 0 : n.registerMutationListener(Q, t => {
					let e = 0,
						n = 0;
					for (const [, r] of t) "created" === r ? e++ : "destroyed" === r && n++;
					e > 0 && 0 === n ? c(1 === e ? s.peek() : l.peek().replace("%s", String(e))) : n > 0 && 0 === e && c(1 === n ? o.peek() : u.peek().replace("%s", String(n)));
				}, {
					skipInitialization: true
				}));
			}
		},
		st$2 = [{
			$import: (t, e) => {
				if (!e.textContent && 0 === e.children.length) return [];
				const n = e.getAttribute("href") || "",
					r = {
						rel: e.getAttribute("rel"),
						target: e.getAttribute("target"),
						title: e.getAttribute("title")
					};
				return Ee(t.$importChildren(e), () => G(n, r));
			},
			match: /* @__PURE__ */$n$1.tag("a"),
			name: "@lexical/link/a"
		}];
	function lt$2(t, n) {
		return Qu(t.registerNodeTransform(B, Z$1), t.registerCommand(Y, t => {
			const e = n.validateUrl.peek(),
				r = n.attributes.peek();
			if (null === t) return et$1(null), true;
			if ("string" == typeof t) return !(void 0 !== e && !e(t)) && (et$1(t, r), true);
			{
				const {
					url: n,
					...i
				} = t;
				return !(void 0 !== e && !e(n)) && (et$1(n, {
					...r,
					...i
				}), true);
			}
		}, Hs), de$2(() => {
			const e = n.validateUrl.value;
			if (!e) return;
			const r = n.attributes.value;
			return t.registerCommand(Qe$2, n => {
				const i = ni();
				if (!Er(i) || i.isCollapsed() || !Bt$5(n, ClipboardEvent)) return false;
				if (null === n.clipboardData) return false;
				const s = n.clipboardData.getData("text");
				if (!e(s)) return false;
				return !i.getNodes().some(t => es(t) || gr(t) && !t.isSimpleText()) && (t.dispatchCommand(Y, {
					...r,
					url: s
				}), n.preventDefault(), true);
			}, js);
		}));
	}
	const ot$2 = {
			build: (t, e, r) => fe$2(e),
			config: {
				attributes: void 0,
				validateUrl: void 0
			},
			dependencies: [gn$1, [hn$1, {
				rules: st$2
			}]],
			mergeConfig(t, e) {
				const n = qu(t, e);
				return t.attributes && (n.attributes = qu(t.attributes, n.attributes)), n;
			},
			name: "@lexical/link/Link",
			nodes: () => [B],
			register: (t, e, n) => lt$2(t, n.getOutput())
		},
		ut$2 = {
			dependencies: [ot$2],
			name: "@lexical/link/Import"
		};
	function at$2(t, e, n = {}) {
		const r = n => {
			const r = 1 === n.button;
			if ("auxclick" === n.type && !r) return;
			const i = n.target;
			if (!oa(i)) return;
			const s = xl(i);
			if (null === s) return;
			let o = null,
				a = null,
				c = false;
			if (s.update(() => {
				const t = Bl(i);
				if (null !== t) {
					const n = La(t, es);
					if (!e.disabled.peek()) if (q(n)) c = X(n) && n.getIsUnlinked(), o = n.sanitizeUrl(n.getURL()), a = n.getTarget();else {
						const t = function (t, e) {
							let n = t;
							for (; null != n;) {
								if (e(n)) return n;
								n = n.parentNode;
							}
							return null;
						}(i, Zc);
						null !== t && (o = t.href, a = t.target);
					}
				}
			}), null === o || "" === o || c) return;
			const f = t.read("latest", ni);
			!Er(f) || f.isCollapsed() ? (window.open(o, e.newTab.peek() || r || n.metaKey || n.ctrlKey || "_blank" === a ? "_blank" : "_self"), n.preventDefault()) : n.preventDefault();
		};
		return t.registerRootListener(t => {
			if (t) return Zu(t, {
				auxclick: r,
				click: r
			}, n);
		});
	}
	const ct$2 = {
		build: (t, e, r) => fe$2(e),
		config: {
			disabled: false,
			newTab: false
		},
		dependencies: [ot$2],
		name: "@lexical/link/ClickableLink",
		register: (t, e, n) => at$2(t, n.getOutput())
	};
	function gt$2(t, e = t => t) {
		return n => {
			const r = t.exec(n);
			return null === r ? null : {
				index: r.index,
				length: r[0].length,
				text: r[0],
				url: e(r[0])
			};
		};
	}
	const ft$2 = /((https?:\/\/(www\.)?)|(www\.))[-\p{L}\p{N}@:%._+~#=]{1,256}\.[\p{L}\p{N}]{1,6}(?:[-\p{L}\p{N}()@:%_+.~#?&//=]*[\p{L}\p{N}()@_~#?&//=])?/u,
		dt$2 = t => {
			const e = ft$2.exec(t);
			if (null === e) return null;
			let n = e[0],
				r = 0;
			for (const t of n) "(" === t ? r++ : ")" === t && r--;
			for (; r < 0 && n.endsWith(")");) n = n.slice(0, -1), r++;
			return {
				index: e.index,
				length: n.length,
				text: n,
				url: n.startsWith("http") ? n : `https://${n}`
			};
		},
		ht$3 = gt$2(/(([^<>()[\]\\.,;:\s@"]{1,64}(\.[^<>()[\]\\.,;:\s@"]{1,64}){0,63})|(".{1,255}"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]{1,63}\.){1,127}[a-zA-Z]{2,63}))/, t => `mailto:${t}`);
	function pt$2(t, e) {
		for (let n = 0; n < e.length; n++) {
			const r = e[n](t);
			if (r) return r;
		}
		return null;
	}
	const mt$3 = /[.,;\s]/;
	function xt$3(t, e) {
		return e.test(t);
	}
	function _t$2(t, e) {
		return xt$3(t[t.length - 1], e);
	}
	function kt$2(t, e) {
		return xt$3(t[0], e);
	}
	function bt$3(t, e) {
		let n = t.getPreviousSibling();
		return es(n) && (n = n.getLastDescendant()), null === n || ps(n) || gr(n) && _t$2(n.getTextContent(), e);
	}
	function vt$3(t, e) {
		let n = t.getNextSibling();
		return es(n) && (n = n.getFirstDescendant()), null === n || ps(n) || gr(n) && kt$2(n.getTextContent(), e);
	}
	function Ut$1(t, e, n, r, i) {
		if (!(t > 0 ? xt$3(r[t - 1], n) : bt$3(i[0], n))) return false;
		return e < r.length ? xt$3(r[e], n) : vt$3(i[i.length - 1], n);
	}
	function Tt$3(t, e, n) {
		const r = [],
			i = [],
			s = [];
		let l = 0,
			o = 0;
		const u = [...t];
		for (; u.length > 0;) {
			const t = u[0],
				a = t.getTextContent().length,
				c = o;
			o + a <= e ? (r.push(t), l += a) : c >= n ? s.push(t) : i.push(t), o += a, u.shift();
		}
		return [l, r, i, s];
	}
	function Lt$2(t, e, n, r) {
		const i = V(r.url, r.attributes);
		if (1 === t.length) {
			let s,
				l = t[0];
			0 === e ? [s, l] = l.splitText(n) : [, s, l] = l.splitText(e, n);
			const o = hr(r.text);
			return o.setFormat(s.getFormat()), o.setDetail(s.getDetail()), o.setStyle(s.getStyle()), i.append(o), s.replace(i), l;
		}
		if (t.length > 1) {
			const r = t[0];
			let s,
				l = r.getTextContent().length;
			0 === e ? s = r : [, s] = r.splitText(e);
			const o = [];
			let a;
			for (let e = 1; e < t.length; e++) {
				const r = t[e],
					i = r.getTextContent().length,
					s = l;
				if (s < n) if (l + i <= n) o.push(r);else {
					const [t, e] = r.splitText(n - s);
					o.push(t), a = e;
				}
				l += i;
			}
			const c = ni(),
				d = c ? c.getNodes().find(gr) : void 0,
				h = hr(s.getTextContent());
			return h.setFormat(s.getFormat()), h.setDetail(s.getDetail()), h.setStyle(s.getStyle()), i.append(h, ...o), d && d === s && (Er(c) ? h.select(c.anchor.offset, c.focus.offset) : Or(c) && h.select(0, h.getTextContent().length)), s.replace(i), a;
		}
	}
	function Ct$3(t, e, n, r) {
		const i = t.getChildren(),
			s = i.length;
		for (let e = 0; e < s; e++) {
			const r = i[e];
			if (!gr(r) || !r.isSimpleText()) return yt$3(t), void n(null, t.getURL());
		}
		const l = t.getTextContent(),
			o = pt$2(l, e);
		if (null === o || o.text !== l) return yt$3(t), void n(null, t.getURL());
		if (!bt$3(t, r) || !vt$3(t, r)) return yt$3(t), void n(null, t.getURL());
		const u = t.getURL();
		u !== o.url && (t.setURL(o.url), n(o.url, u)), o.attributes && (t.getRel() !== o.attributes.rel && t.setRel(o.attributes.rel || null), t.getTarget() !== o.attributes.target && t.setTarget(o.attributes.target || null), t.getTitle() !== o.attributes.title && t.setTitle(o.attributes.title || null));
	}
	function yt$3(t) {
		const e = t.getChildren();
		for (let n = e.length - 1; n >= 0; n--) t.insertAfter(e[n]);
		return t.remove(), e.map(t => t.getLatest());
	}
	const St$3 = {
		changeHandlers: [],
		excludeParents: [],
		matchers: [],
		separatorRegex: mt$3
	};
	function Rt$3(t, e = St$3) {
		const {
				matchers: n,
				changeHandlers: r,
				excludeParents: i,
				separatorRegex: s = mt$3
			} = e,
			l = (t, e) => {
				for (const n of r) n(t, e);
			};
		return Qu(t.registerNodeTransform(rr, t => {
			const e = t.getParentOrThrow(),
				r = t.getPreviousSibling();
			if (X(e)) Ct$3(e, n, l, s);else if (!q(e) && !i.some(t => t(e))) {
				if (t.isSimpleText() && (kt$2(t.getTextContent(), s) || !X(r))) {
					const e = function (t) {
						const e = [t];
						let n = t.getNextSibling();
						for (; null !== n && gr(n) && n.isSimpleText() && (e.push(n), !/[\s]/.test(n.getTextContent()));) n = n.getNextSibling();
						return e;
					}(t);
					!function (t, e, n, r) {
						for (const e of t) {
							const t = e.getParent();
							if (X(t) && !t.getIsUnlinked()) return;
						}
						let i = [...t];
						const s = i.map(t => t.getTextContent()).join("");
						let l,
							o = s,
							u = 0;
						for (; (l = pt$2(o, e)) && null !== l;) {
							const t = l.index,
								e = t + l.length;
							if (Ut$1(u + t, u + e, r, s, i)) {
								const [r,, s, a] = Tt$3(i, u + t, u + e);
								let c = false;
								for (const t of s) {
									const e = t.getParent();
									if (X(e) && !e.getIsUnlinked()) {
										c = true;
										break;
									}
								}
								if (c) {
									u += e, o = o.substring(e);
									continue;
								}
								const g = Lt$2(s, u + t - r, u + e - r, l);
								i = g ? [g, ...a] : a, n(l.url, null), u = 0;
							} else u += e;
							o = o.substring(e);
						}
					}(e, n, l, s);
				}
				!function (t, e, n, r) {
					const i = t.getParent(),
						s = t.getPreviousSibling(),
						l = t.getNextSibling(),
						o = t.getTextContent();
					if (!X(i) || i.getIsUnlinked()) {
						if (X(s) && !s.getIsUnlinked() && s.is(t.getPreviousSibling()) && t.getParent() === s.getParent()) {
							if (!kt$2(o, r)) return yt$3(s), void n(null, s.getURL());
							if (u = o, s.isEmailURI() ? /^\.[a-zA-Z]{2,}/.test(u) : /^\.[a-zA-Z0-9]{1,}/.test(u)) {
								const i = s.getTextContent() + o,
									l = pt$2(i, e);
								null !== l && l.text === i && (s.append(t), Ct$3(s, e, n, r), n(null, s.getURL()));
							}
						}
						var u;
						!X(l) || l.getIsUnlinked() || _t$2(o, r) || l.is(t.getNextSibling()) && t.getParent() === l.getParent() && (yt$3(l), n(null, l.getURL()));
					}
				}(t, n, l, s);
			}
		}), t.registerCommand(Y, t => {
			const e = ni();
			if (null !== t || !Er(e)) return false;
			return e.extract().forEach(t => {
				const e = t.getParent();
				X(e) && (e.setIsUnlinked(!e.getIsUnlinked()), e.markDirty());
			}), false;
		}, js));
	}
	const At$2 = {
		config: St$3,
		dependencies: [it$2, ot$2],
		mergeConfig(t, e) {
			const n = qu(t, e);
			for (const r of ["matchers", "changeHandlers", "excludeParents"]) {
				const i = e[r];
				Array.isArray(i) && (n[r] = [...t[r], ...i]);
			}
			return n;
		},
		name: "@lexical/link/AutoLink",
		nodes: [Q],
		register: Rt$3
	};

	var LexicalLink_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createAutoLinkNode: V,
		$createLinkNode: G,
		$isAutoLinkNode: X,
		$isLinkNode: q,
		$toggleLink: et$1,
		AutoLinkAnnounceExtension: it$2,
		AutoLinkExtension: At$2,
		AutoLinkNode: Q,
		ClickableLinkExtension: ct$2,
		LinkExtension: ot$2,
		LinkImportExtension: ut$2,
		LinkImportRules: st$2,
		LinkNode: B,
		TOGGLE_LINK_COMMAND: Y,
		autoLinkEmailMatcher: ht$3,
		autoLinkUrlMatcher: dt$2,
		createLinkMatcherWithRegExp: gt$2,
		formatUrl: rt$2,
		registerAutoLink: Rt$3,
		registerClickableLink: at$2,
		registerLink: lt$2
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	function Z(r, i, l = null) {
		const c = Rc(l),
			s = l ? Kc(l) : [],
			u = null !== l && s.length > 0;
		if (u && "function" == typeof c.caretPositionFromPoint) {
			const t = c.caretPositionFromPoint(r, i, {
				shadowRoots: s
			});
			if (null !== t && function (t, e) {
				for (let n = t; null !== n;) {
					if (n === e) return true;
					n = pc(n);
				}
				return false;
			}(t.offsetNode, l)) return {
				node: t.offsetNode,
				offset: t.offset
			};
		}
		if (u) {
			const t = l.getRootNode();
			if (Lc(t)) {
				const e = t.elementFromPoint(r, i);
				if (null !== e && l.contains(e)) {
					const t = function (t, e, n, o) {
						const r = o.createRange(),
							i = t => e < t.top ? t.top - e : e > t.bottom ? e - t.bottom : 0,
							l = e => t < e.left ? e.left - t : t > e.right ? t - e.right : 0,
							c = o.createTreeWalker(n, NodeFilter.SHOW_TEXT);
						let s = null,
							u = 1 / 0,
							a = 1 / 0;
						for (let t = c.nextNode(); t; t = c.nextNode()) {
							r.selectNodeContents(t);
							for (const e of r.getClientRects()) {
								const n = i(e),
									o = l(e);
								(n < u || n === u && o < a) && (u = n, a = o, s = t);
							}
						}
						if (null === s) return null;
						let f = 0,
							p = 1 / 0,
							d = 1 / 0;
						for (let e = 0; e <= s.length; e++) {
							r.setStart(s, e), r.collapse(true);
							const n = r.getBoundingClientRect(),
								o = i(n),
								l = Math.abs(t - n.left);
							(o < p || o === p && l < d) && (p = o, d = l, f = e);
						}
						return {
							node: s,
							offset: f
						};
					}(r, i, e, c);
					if (null !== t) return t;
				}
			}
		}
		if ("function" == typeof c.caretRangeFromPoint) {
			const t = c.caretRangeFromPoint(r, i);
			return null === t ? null : {
				node: t.startContainer,
				offset: t.startOffset
			};
		}
		if ("function" == typeof c.caretPositionFromPoint) {
			const t = c.caretPositionFromPoint(r, i);
			return null === t ? null : {
				node: t.offsetNode,
				offset: t.offset
			};
		}
		return null;
	}
	function tt(t, ...e) {
		const n = new URL("https://lexical.dev/docs/error"),
			o = new URLSearchParams();
		o.append("code", t);
		for (const t of e) o.append("v", t);
		throw n.search = o.toString(), Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	const et = {
		"application/x-lexical-editor": 0,
		"text/html": 10,
		"text/plain": 20,
		"text/uri-list": 30
	};
	function nt(t) {
		if (window.trustedTypes && window.trustedTypes.createPolicy) {
			return window.trustedTypes.createPolicy("lexical", {
				createHTML: t => t
			}).createHTML(t);
		}
		return t;
	}
	const ot$1 = (t, e) => {
			if (!Er(e)) return e.insertRawText(t), true;
			e !== ni() && Hl(e);
			const n = t => {
				const e = ni();
				Er(e) && t(e);
			};
			return hi(t, {
				linebreak: () => n(t => t.insertParagraph()),
				tab: () => n(t => t.insertNodes([yr()])),
				text: t => n(e => e.insertText(t))
			}), true;
		},
		rt$1 = {
			"application/x-lexical-editor": [(t, e, n) => {
				try {
					const n = ua(),
						o = JSON.parse(t);
					if (o && o.namespace === n._config.namespace && Array.isArray(o.nodes)) {
						return Tt$2(n, vt$2(o.nodes), e), !0;
					}
				} catch (t) {
					console.error(t);
				}
				return n();
			}],
			"text/html": [(t, e, n) => {
				try {
					const n = ua(),
						o = new DOMParser().parseFromString(nt(t), "text/html");
					return Tt$2(n, Cn$1(n, o), e), !0;
				} catch (t) {
					return console.error(t), n();
				}
			}],
			"text/plain": [ot$1],
			"text/uri-list": [ot$1]
		};
	function it$1(t, e, n, o) {
		if (!t) return false;
		const r = i => !!t[i] && t[i](e, n, r.bind(null, i - 1), o);
		return r(t.length - 1);
	}
	function lt$1(t, e, n) {
		const o = e.getData("text/plain");
		for (const r of function (t) {
			return Object.keys(t.$importMimeType).filter(e => void 0 !== t.$importMimeType[e]).sort((e, n) => {
				const o = t.priority[e],
					r = t.priority[n];
				return void 0 === o && void 0 === r ? e < n ? -1 : e > n ? 1 : 0 : void 0 === o ? 1 : void 0 === r ? -1 : o - r;
			});
		}(t)) {
			const i = e.getData(r);
			if (i && ("text/html" !== r || i !== o) && it$1(t.$importMimeType[r], i, n, e)) return true;
		}
		return false;
	}
	const ct$1 = {
		$importMimeType: rt$1,
		$insertDataTransfer: (t, e) => lt$1({
			$importMimeType: rt$1,
			priority: et
		}, t, e),
		priority: et
	};
	const st$1 = {
			build: (t, e) => ({
				$importMimeType: e.$importMimeType,
				$insertDataTransfer: (t, n) => lt$1(e, t, n),
				priority: e.priority
			}),
			config: {
				$importMimeType: rt$1,
				priority: et
			},
			mergeConfig(t, e) {
				const n = qu(t, e);
				if (e.$importMimeType) {
					const o = {
						...t.$importMimeType
					};
					for (const [t, n] of Object.entries(e.$importMimeType)) if (n) {
						const e = o[t];
						o[t] = e ? [...e, ...n] : n;
					}
					n.$importMimeType = o;
				}
				return e.priority && (n.priority = {
					...t.priority,
					...e.priority
				}), n;
			},
			name: "@lexical/clipboard/Import"
		},
		ut$1 = {
			dependencies: [gn$1, [st$1, {
				$importMimeType: {
					"text/html": [(t, e, n, o) => {
						const i = new DOMParser().parseFromString(nt(t), "text/html"),
							l = mn$1(i, {
								context: [lt$3(xe$1, "paste"), lt$3(Se$1, o)]
							});
						return Tt$2(ua(), l, e), true;
					}]
				}
			}]],
			name: "@lexical/clipboard/DOMImport"
		};
	function at$1(t, e = ni()) {
		return null == e && tt(166), Er(e) && e.isCollapsed() || 0 === e.getNodes().length ? "" : wn$1(t, e);
	}
	function ft$1(t, e = ni()) {
		return null == e && tt(166), Er(e) && e.isCollapsed() || 0 === e.getNodes().length ? null : JSON.stringify(Mt$2(t, e));
	}
	function pt$1(t, e) {
		const n = t.getData("text/plain") || t.getData("text/uri-list");
		null != n && e.insertRawText(n);
	}
	function dt$1(t, e, n) {
		(function () {
			const t = hn$2(st$1.name);
			return t ? t.output : ct$1;
		})().$insertDataTransfer(t, e);
	}
	const mt$2 = "application/x-lexical-drag";
	function gt$1(t, e) {
		const n = {
			editorKey: e.getKey()
		};
		t.setData(mt$2, JSON.stringify(n));
	}
	function yt$2(t, e, n) {
		const o = t.dataTransfer;
		if (null === o) return false;
		const r = function (t) {
			const e = t.getData(mt$2);
			if (!e) return null;
			let n;
			try {
				n = JSON.parse(e);
			} catch (t) {
				return null;
			}
			return null !== (o = n) && "object" == typeof o && "editorKey" in o && "string" == typeof o.editorKey ? n : null;
			var o;
		}(o);
		if (null === r) return false;
		const i = function (t, e) {
			const n = Z(t.clientX, t.clientY, e.getRootElement());
			if (null === n) return null;
			const o = Bl(n.node);
			if (null === o) return null;
			if (gr(o)) return bu(o, "next", n.offset);
			if (es(o)) return Ds(o, n.offset, "next");
			const r = o.getParent();
			return null === r ? null : Ds(r, o.getIndexWithinParent() + 1, "next");
		}(t, e);
		if (null === i) return false;
		const s = Ls(i);
		if (null === s) return false;
		const u = r.editorKey === e.getKey(),
			a = ni();
		if (u) {
			if (!Er(a) || a.isCollapsed()) return false;
			if (function (t, e) {
				const {
					anchor: n,
					focus: o
				} = As(ks(e), "next");
				return Bu(n, t) < 0 && Bu(t, o) < 0;
			}(i, a)) return t.preventDefault(), true;
			a.removeText();
		}
		if (!s.origin.isAttached()) return t.preventDefault(), true;
		if (n(o, vs(Lu(s)), e), !u) {
			const t = e.getRootElement(),
				n = t ? t.ownerDocument : null,
				o = n ? function (t, e) {
					for (const n of Bc(e)) {
						const e = Cl(n);
						if (ml(e) && e.getKey() === t && na(n)) return n;
					}
					return null;
				}(r.editorKey, n) : null;
			null !== o && o.dispatchEvent(new InputEvent("beforeinput", {
				bubbles: true,
				cancelable: true,
				inputType: "deleteByDrag"
			}));
		}
		return t.preventDefault(), true;
	}
	function xt$2(t, e) {
		return yt$2(t, e, dt$1);
	}
	function ht$2(t, e) {
		return yt$2(t, e, (t, e) => pt$1(t, e));
	}
	function Tt$2(t, e, n) {
		t.dispatchCommand($e$2, {
			nodes: e,
			selection: n
		}) || (n.insertNodes(e), function (t) {
			if (Er(t) && t.isCollapsed()) {
				const e = t.anchor;
				let n = null;
				const o = Cs(e, "previous");
				if (o) if (yu(o)) n = o.origin;else {
					const t = zu(o, Eu($l(), "next").getFlipped());
					for (const e of t) {
						if (gr(e.origin)) {
							n = e.origin;
							break;
						}
						if (es(e.origin) && !e.origin.isInline()) break;
					}
				}
				if (n && gr(n)) {
					const e = n.getFormat(),
						o = n.getStyle();
					t.format === e && t.style === o || (t.format = e, t.style = o, t.dirty = true);
				}
			}
		}(n));
	}
	function bt$2(t, e, n, o = []) {
		let r = null === e || n.isSelected(e);
		const i = es(n) && n.excludeFromCopy("clone");
		let l = n;
		null !== e && gr(l) && (l = $(e, l, "clone"));
		const c = es(l) ? l.getChildren() : [],
			s = function (t) {
				const e = t.exportJSON(),
					n = t.constructor;
				if (e.type !== n.getType() && tt(58, n.name), es(t)) {
					const t = e.children;
					Array.isArray(t) || tt(59, n.name);
				}
				return e;
			}(l);
		gr(l) && 0 === l.getTextContentSize() && (r = false);
		const u = r && Or(e) && es(n) ? null : e;
		for (let o = 0; o < c.length; o++) {
			const i = c[o],
				l = bt$2(t, u, i, s.children);
			!r && es(n) && l && n.extractWithChild(i, e, "clone") && (r = true);
		}
		if (r && !i) {
			const e = qa(l);
			if (e.length > 0) {
				const n = {};
				for (const o of e) {
					const e = Ya(l, o);
					null === e && tt(366, l.constructor.name, o);
					const r = [];
					bt$2(t, null, e, r), 1 === r.length && r[0].type === e.getType() || tt(385, o, l.constructor.name, String(r.length), String(r.length > 0 ? r[0].type : "none")), n[o] = r[0];
				}
				s.$slots = n;
			}
		}
		if (r && !i) o.push(s);else if (Array.isArray(s.children)) for (let t = 0; t < s.children.length; t++) {
			const e = s.children[t];
			o.push(e);
		}
		return r;
	}
	function Mt$2(t, e) {
		const n = [],
			o = $l(),
			r = Ja(e),
			i = (es(r) ? r : o).getChildren();
		for (let o = 0; o < i.length; o++) {
			bt$2(t, e, i[o], n);
		}
		return {
			namespace: t._config.namespace,
			nodes: n
		};
	}
	function vt$2(t) {
		const e = [];
		for (const n of t) e.push($i(n));
		return e;
	}
	let wt$2 = null;
	async function $t$2(t, e, n) {
		if (null !== wt$2) return false;
		if (null !== e) return new Promise((o, r) => {
			t.update(() => {
				o(Ct$2(t, e, n));
			});
		});
		const o = t.getRootElement(),
			r = t._window || window,
			i = r.document,
			l = Pc(r);
		if (null === o || null === l) return false;
		const c = i.createElement("span");
		c.style.position = "fixed", c.style.top = "-1000px", c.append(i.createTextNode("#")), o.append(c);
		const s = i.createRange();
		return s.setStart(c, 0), s.setEnd(c, 1), l.removeAllRanges(), l.addRange(s), new Promise((e, o) => {
			const l = t.registerCommand(En$2, o => (Bt$5(o, ClipboardEvent) && (l(), null !== wt$2 && (r.clearTimeout(wt$2), wt$2 = null), e(Ct$2(t, o, n))), true), qs);
			wt$2 = r.setTimeout(() => {
				l(), wt$2 = null, e(false);
			}, 50), i.execCommand("copy"), c.remove();
		});
	}
	function Ct$2(t, e, n) {
		if (void 0 === n) {
			const e = Pc(t._window),
				o = ni();
			if (!o || o.isCollapsed()) return false;
			if (!e) return false;
			const r = Hc(e, t.getRootElement()),
				i = r.anchorNode,
				l = r.focusNode;
			if (null !== i && null !== l && !yl(t, i, l)) return false;
			n = Pt$2(o);
		}
		e.preventDefault();
		const o = e.clipboardData;
		return null !== o && (Nt$2(o, n), true);
	}
	const Dt$2 = [["text/html", at$1], ["application/x-lexical-editor", ft$1]];
	function Pt$2(t = ni()) {
		return function (t, e) {
			const n = {
				"text/plain": ""
			};
			for (const [o, r] of Object.entries(t)) if (r) {
				const t = Ot$2(r, e);
				null !== t && (n[o] = t);
			}
			return n;
		}(Rt$2(), t);
	}
	function Nt$2(t, e) {
		for (const [n] of Dt$2) void 0 === e[n] && t.setData(n, "");
		for (const n in e) {
			const o = e[n];
			void 0 !== o && t.setData(n, o);
		}
	}
	function Rt$2(t = ua()) {
		const e = un$2(t, Et$2.name);
		return e ? e.output : St$2;
	}
	const St$2 = {
		"application/x-lexical-editor": [(t, e) => t ? ft$1(ua(), t) : e()],
		"text/html": [(t, e) => t ? at$1(ua(), t) : e()],
		"text/plain": [(t, e) => t ? t.getTextContent() : e()]
	};
	function Ot$2(t, e) {
		const n = o => t[o] ? t[o](e, n.bind(null, o - 1)) : null;
		return n(t.length - 1);
	}
	function Ft$2(t, e = ni()) {
		return Ot$2(Rt$2()[t] || [], e);
	}
	const Et$2 = {
		build: (t, e, n) => e.$exportMimeType,
		config: {
			$exportMimeType: St$2
		},
		mergeConfig(t, e) {
			const n = qu(t, e);
			if (e.$exportMimeType) {
				const o = {
					...t.$exportMimeType
				};
				for (const [t, n] of Object.entries(e.$exportMimeType)) if (n) {
					const e = o[t];
					o[t] = e ? [...e, ...n] : n;
				}
				n.$exportMimeType = o;
			}
			return n;
		},
		name: "@lexical/clipboard/GetClipboardData"
	};

	var LexicalClipboard_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$exportMimeTypeFromSelection: Ft$2,
		$generateJSONFromSelectedNodes: Mt$2,
		$generateNodesFromSerializedNodes: vt$2,
		$getClipboardDataFromSelection: Pt$2,
		$getHtmlContent: at$1,
		$getLexicalContent: ft$1,
		$handlePlainTextDrop: ht$2,
		$handleRichTextDrop: xt$2,
		$insertDataTransferForPlainText: pt$1,
		$insertDataTransferForRichText: dt$1,
		$insertGeneratedNodes: Tt$2,
		$writeDragSourceToDataTransfer: gt$1,
		ClipboardDOMImportExtension: ut$1,
		ClipboardImportExtension: st$1,
		DEFAULT_IMPORT_MIME_TYPE: rt$1,
		DEFAULT_IMPORT_MIME_TYPE_PRIORITY: et,
		GetClipboardDataExtension: Et$2,
		caretFromPoint: Z,
		copyToClipboard: $t$2,
		setLexicalClipboardDataTransfer: Nt$2
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	function C(t, e, n, o, r) {
		if (null === t || 0 === n.size && 0 === o.size && !r) return 0;
		const i = e._selection,
			a = t._selection;
		if (r) return 1;
		if (!(Er(i) && Er(a) && a.isCollapsed() && i.isCollapsed())) return 0;
		const l = function (t, e, n) {
			const o = t._nodeMap,
				r = [];
			for (const t of e) {
				const e = o.get(t);
				void 0 !== e && r.push(e);
			}
			for (const [t, e] of n) {
				if (!e) continue;
				const n = o.get(t);
				void 0 === n || ss(n) || r.push(n);
			}
			return r;
		}(e, n, o);
		if (0 === l.length) return 0;
		if (l.length > 1) {
			const n = e._nodeMap,
				o = n.get(i.anchor.key),
				r = n.get(a.anchor.key);
			return o && r && !t._nodeMap.has(o.__key) && gr(o) && 1 === o.__text.length && 1 === i.anchor.offset ? 2 : 0;
		}
		const u = l[0],
			s = t._nodeMap.get(u.__key);
		if (!gr(s) || !gr(u) || s.__mode !== u.__mode) return 0;
		const d = s.__text,
			c = u.__text;
		if (d === c) return 0;
		const p = i.anchor,
			f = a.anchor;
		if (p.key !== f.key || "text" !== p.type) return 0;
		const h = p.offset,
			m = f.offset,
			g = c.length - d.length;
		return 1 === g && m === h - 1 ? 2 : -1 === g && m === h + 1 ? 3 : -1 === g && m === h ? 4 : 0;
	}
	function b$1(t, e, n) {
		let o = n(),
			r = 0,
			i = o,
			a = 0,
			l = null;
		return (u, s, d, c, p, x) => {
			const b = n();
			if (x.has(Ho) && (i = o, a = r, l = u), x.has(Po)) return r = 0, o = b, 2;
			x.has(jo) && l && (o = i, r = a, u = l);
			const E = x.has(zo) || x.has(Ko) ? 0 : C(u, s, c, p, t.isComposing()),
				w = (() => {
					const n = null === d || d.editor === t,
						i = x.has(Io);
					if (!i && n && x.has(Lo)) return 0;
					if (1 === E) return 2;
					if (null === u) return 1;
					const a = s._selection;
					if (!(c.size > 0 || p.size > 0)) return null !== a ? 0 : 2;
					const l = "number" == typeof e ? e : e.peek();
					if (false === i && 0 !== E && E === r && b < o + l && n) return 0;
					if (1 === c.size) {
						if (function (t, e, n) {
							const o = e._nodeMap.get(t),
								r = n._nodeMap.get(t),
								i = e._selection,
								a = n._selection;
							return !(Er(i) && Er(a) && "element" === i.anchor.type && "element" === i.focus.type && "text" === a.anchor.type && "text" === a.focus.type || !gr(o) || !gr(r) || o.__parent !== r.__parent) && JSON.stringify(e.read(() => o.exportJSON())) === JSON.stringify(n.read(() => r.exportJSON()));
						}(Array.from(c)[0], u, s)) return 0;
					}
					return 1;
				})();
			return o = b, r = E, w;
		};
	}
	function E(t, e) {
		if (null !== e && e.editor === t.editor) return e;
		const {
				editor: n
			} = t,
			o = n.getEditorState();
		return o.isEmpty() ? null : {
			editor: n,
			editorState: o
		};
	}
	function w(t, e) {
		t.undoStack = [], t.redoStack = [], t.current = null, e && e(t);
	}
	function D(t, e, n, o = Date.now, r, f = null) {
		const m = b$1(t, n, o),
			g = () => {
				r && r(e);
			};
		return g(), Qu(t.registerCommand(rn$3, () => (function (t, e, n) {
			const o = e.redoStack,
				r = e.undoStack;
			if (0 !== r.length) {
				const i = e.current,
					a = r.pop();
				if (a) {
					const e = E(a, i);
					null !== e && (o.push(e), t.dispatchCommand(Fn$2, true));
				}
				0 === r.length && t.dispatchCommand(Pn$2, false), e.current = a || null, n && n(e), a && a.editor.setEditorState(a.editorState, {
					tag: Po
				});
			}
		}(t, e, r), true), Hs), t.registerCommand(sn$3, () => (function (t, e, n) {
			const o = e.redoStack,
				r = e.undoStack;
			if (0 !== o.length) {
				const i = e.current,
					a = o.pop();
				if (a) {
					const e = E(a, i);
					null !== e && (r.push(e), t.dispatchCommand(Pn$2, true));
				}
				0 === o.length && t.dispatchCommand(Fn$2, false), e.current = a || null, n && n(e), a && a.editor.setEditorState(a.editorState, {
					tag: Po
				});
			}
		}(t, e, r), true), Hs), t.registerCommand(An$3, () => (w(e, r), false), Hs), t.registerCommand(Dn$3, () => (w(e, r), t.dispatchCommand(Fn$2, false), t.dispatchCommand(Pn$2, false), true), Hs), t.registerUpdateListener(({
			editorState: n,
			prevEditorState: o,
			dirtyLeaves: r,
			dirtyElements: i,
			tags: a
		}) => {
			const l = e.current,
				u = e.redoStack,
				s = e.undoStack,
				d = null === l ? null : l.editorState;
			if (null !== l && n === d) return;
			const h = m(o, n, l, r, i, a);
			if (1 === h) {
				0 !== u.length && (e.redoStack = [], t.dispatchCommand(Fn$2, false));
				const n = function (t, e, n) {
					return null === n ? null : n.editor === t ? {
						...n
					} : e.isEmpty() ? null : {
						editor: t,
						editorState: e
					};
				}(t, o, l);
				if (null !== n) {
					s.push(n);
					const e = "number" == typeof f || null === f ? f : f.peek();
					null !== e && s.length > e && s.splice(0, s.length - e), t.dispatchCommand(Pn$2, true);
				}
			} else if (2 === h) return;
			e.current = {
				editor: t,
				editorState: n
			}, g();
		}));
	}
	function M() {
		return {
			current: null,
			redoStack: [],
			undoStack: []
		};
	}
	const O = {
		build: (t, {
			delay: e,
			createInitialHistoryState: o,
			disabled: r,
			maxDepth: i,
			now: a
		}, l) => ({
			...fe$2({
				delay: e,
				disabled: r,
				historyState: o(t),
				maxDepth: i,
				now: a
			}),
			...l.getInitResult()
		}),
		config: {
			createInitialHistoryState: M,
			delay: 300,
			disabled: "undefined" == typeof window,
			maxDepth: null,
			now: Date.now
		},
		init: () => ({
			canRedo: ee$2(false),
			canUndo: ee$2(false)
		}),
		name: "@lexical/history/History",
		register: (e, n, r) => {
			const {
					canUndo: i,
					canRedo: a
				} = r.getInitResult(),
				l = r.getOutput(),
				u = t => Ht$4(() => {
					i.value = null != t && t.undoStack.length > 0, a.value = null != t && t.redoStack.length > 0;
				});
			return de$2(() => {
				if (!l.disabled.value) return D(e, l.historyState.value, l.delay, () => l.now.peek()(), u, l.maxDepth);
				u(null);
			});
		}
	};
	function z(t) {
		const e = t ? un$2(t, "@lexical/extension/HMR") : void 0;
		return e ? e.output.restoreCount.value : 0;
	}
	const H = {
		build: (t, {
			disabled: e,
			parentEditor: o
		}) => fe$2({
			disabled: e,
			parentEditor: o || t._parentEditor
		}),
		config: {
			disabled: false,
			parentEditor: null
		},
		dependencies: [[O, {
			disabled: true
		}]],
		name: "@lexical/history/SharedHistory",
		register: (e, n, i) => de$2(() => {
			const {
				disabled: t,
				parentEditor: n
			} = i.getOutput();
			if (!t.value) {
				const {
					output: t
				} = i.getDependency(O);
				z(e), z(n.value);
				const a = function (t) {
					return t ? un$2(t, O.name) : null;
				}(n.value);
				if (!a) return;
				const l = a.output;
				Ht$4(() => {
					t.delay.value = l.delay.value, t.historyState.value = l.historyState.value, t.now.value = l.now.value, t.maxDepth.value = l.maxDepth.value, t.disabled.value = l.disabled.value;
				});
			}
		})
	};

	var LexicalHistory_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		HistoryExtension: O,
		SharedHistoryExtension: H,
		createEmptyHistoryState: M,
		registerHistory: D
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	function s() {
		return $l().getTextContent();
	}
	function f$1(t, e = true) {
		if (t) return false;
		let n = s();
		return e && (n = n.trim()), "" === n;
	}
	function u$1(t, e) {
		return () => f$1(t, e);
	}
	function c(o) {
		if (!f$1(o, false)) return false;
		const l = $l().getChildren(),
			s = l.length;
		if (s > 1) return false;
		for (let t = 0; t < s; t++) {
			const o = l[t];
			if (rs(o)) return false;
			if (es(o)) {
				if (!$s(o)) return false;
				if (0 !== o.__indent) return false;
				const t = o.getChildren(),
					e = t.length;
				for (let n = 0; n < e; n++) {
					const e = t[n];
					if (!gr(e)) return false;
				}
			}
		}
		return true;
	}
	function g$1(t) {
		return () => c(t);
	}
	function a(t, e) {
		let r = t.getFirstChild(),
			o = 0;
		t: for (; null !== r;) {
			if (es(r)) {
				const t = r.getFirstChild();
				if (null !== t) {
					r = t;
					continue;
				}
			} else if (gr(r)) {
				const t = r.getTextContentSize();
				if (o + t > e) return {
					node: r,
					offset: e - o
				};
				o += t;
			}
			const t = r.getNextSibling();
			if (null !== t) {
				r = t;
				continue;
			}
			let l = r.getParent();
			for (; null !== l;) {
				const t = l.getNextSibling();
				if (null !== t) {
					r = t;
					continue t;
				}
				l = l.getParent();
			}
			break;
		}
		return null;
	}
	function d$1(t, ...e) {
		const n = new URL("https://lexical.dev/docs/error"),
			r = new URLSearchParams();
		r.append("code", t);
		for (const t of e) r.append("v", t);
		throw n.search = r.toString(), Error(`Minified Lexical error #${t}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	function x(t, e, n, r) {
		const s = t => t instanceof n,
			f = t => {
				const e = hr(t.getTextContent()).setFormat(t.getFormat()).setStyle(t.getStyle()).setDetail(t.getDetail());
				t.replace(e);
			};
		return [t.registerNodeTransform(rr, t => {
			if (!t.isSimpleText()) return;
			let n,
				o = t.getPreviousSibling(),
				l = t.getTextContent(),
				u = t;
			if (gr(o)) {
				const n = o.getTextContent(),
					r = e(n + l);
				if (s(o)) {
					if (null === r || 0 !== (t => t.getLatest().__mode)(o)) return void f(o);
					{
						const e = r.end - n.length;
						if (e > 0) {
							const r = n + l.slice(0, e);
							if (o.select(), o.setTextContent(r), e === l.length) t.remove();else {
								const n = l.slice(e);
								t.setTextContent(n);
							}
							return;
						}
					}
				} else if (null === r || r.start < n.length) return;
			}
			let c = 0;
			for (;;) {
				const t = l;
				n = e(t);
				const g = null === n ? "" : t.slice(n.end);
				if (l = g, "" === g) {
					const r = u.getNextSibling();
					if (gr(r)) {
						const i = t + r.getTextContent(),
							o = e(i);
						if (null === o) return void (s(r) ? f(r) : r.markDirty());
						if (null === n || o.start !== n.start) return;
					}
				}
				if (null === n) return;
				if (0 === n.start && gr(o) && o.isTextEntity()) {
					c += n.end;
					continue;
				}
				let a;
				0 === n.start ? [a, u] = u.splitText(n.end) : [, a, u] = u.splitText(n.start + c, n.end + c), void 0 === a && d$1(165, "nodeToReplace");
				const x = r(a);
				if (x.setFormat(a.getFormat()), a.replace(x), null == u) return;
				c = 0, o = x;
			}
		}), t.registerNodeTransform(n, t => {
			const n = t.getTextContent(),
				r = e(n);
			if (null === r || 0 !== r.start) return void f(t);
			if (n.length > r.end) return void t.splitText(r.end);
			const o = t.getPreviousSibling();
			gr(o) && o.isTextEntity() && (f(o), f(t));
			const l = t.getNextSibling();
			gr(l) && l.isTextEntity() && (f(l), s(t) && f(t));
		})];
	}

	var LexicalText_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$canShowPlaceholder: c,
		$canShowPlaceholderCurry: g$1,
		$findTextIntersectionFromCharacters: a,
		$isRootTextContentEmpty: f$1,
		$isRootTextContentEmptyCurry: u$1,
		$rootTextContent: s,
		registerLexicalTextEntity: x
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	const d = {
			bold: "bold",
			italic: "italic",
			strikeThrough: "strikethrough",
			subscript: "subscript",
			superscript: "superscript",
			underline: "underline"
		},
		u = Symbol.for("@lexical/dragon/WindowState");
	function f(e, t, n) {
		const i = function (e) {
			let t = e[u];
			return void 0 === t && (t = {
				dispose: () => {},
				editors: new Map(),
				installs: new Set()
			}, e[u] = t), t;
		}(e);
		if (0 === i.installs.size) {
			const t = y.bind(e);
			e.addEventListener("message", t, true), i.dispose = () => {
				e.removeEventListener("message", t, true);
			};
		}
		if (i.installs.add(t), n) {
			const e = i.editors.get(n) || new Set();
			e.add(t), i.editors.set(n, e);
		}
		return g.bind(null, e, i, t, n);
	}
	function g(e, t, n, i) {
		if (i) {
			const e = t.editors.get(i);
			e && e.delete(n) && 0 === e.size && t.editors.delete(i);
		}
		t.installs.delete(n) && 0 === t.installs.size && (t.dispose(), delete e[u]);
	}
	function p(e) {
		return e && e.ownerDocument.defaultView;
	}
	function m(n) {
		const i = Me$1(() => p(n.getRootElement()), e => n.registerRootListener(t => {
			e.value = p(t);
		}));
		return de$2(() => {
			const e = i.value;
			if (e) return f(e, Symbol("@lexical/dragon/editorInstall"), n);
		});
	}
	function y(e) {
		if (e.origin !== this.location.origin) return;
		const t = function (e) {
			const t = e[u];
			if (void 0 === t) return null;
			const n = Cl(Gc(e.document));
			return ml(n) && t.editors.has(n) ? n : null;
		}(this);
		if (null === t) return;
		const n = e.data;
		if ("string" == typeof n) {
			let r;
			try {
				r = JSON.parse(n);
			} catch (e) {
				return;
			}
			if (r && "nuanria_messaging" === r.protocol && "request" === r.type) {
				const n = r.payload;
				if (n && "makeChanges" === n.functionId) {
					const r = n.args;
					if (Array.isArray(r)) {
						const [n, l, a, u, c, f] = r;
						if (![n, l, u, c].every(Number.isFinite) || "string" != typeof a && -1 !== a) return;
						t.update(() => {
							const t = ni();
							if (Er(t)) {
								const i = t.anchor;
								let o = i.getNode(),
									r = 0,
									g = 0;
								if (gr(o) && n >= 0 && l >= 0 && (r = n, g = n + l, t.setTextNodeRange(o, r, o, g)), "string" != typeof a || r === g && "" === a || (t.insertRawText(a), o = i.getNode()), gr(o)) {
									const e = o.getTextContentSize();
									r = Math.min(Math.max(u, 0), e), g = u < 0 || c < 0 ? r : Math.min(u + c, e), t.setTextNodeRange(o, r, o, g);
								}
								if ("string" == typeof f && c > 0 && !t.isCollapsed()) {
									const e = d[f];
									void 0 !== e && t.formatText(e);
								}
								e.stopImmediatePropagation();
							}
						});
					}
				}
			}
		}
	}
	const b = {
		build: (e, t, i) => fe$2(t),
		config: {
			disabled: "undefined" == typeof window
		},
		name: "@lexical/dragon",
		register: (e, n, i) => de$2(() => i.getOutput().disabled.value ? void 0 : m(e))
	};

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	function mt$1(e) {
		const t = Il(e);
		return At$1(t) ? t.getTag() : null;
	}
	const ht$1 = {
		build: (e, t) => fe$2(t),
		config: {
			created: "Heading level %s",
			destroyed: "Heading level %s removed",
			disabled: false
		},
		dependencies: [v],
		name: "@lexical/rich-text/HeadingAnnounce",
		register(e, t, n) {
			const {
					created: r,
					destroyed: o,
					disabled: i
				} = n.getOutput(),
				{
					announce: s
				} = n.getDependency(v).output;
			return de$2(() => i.value ? void 0 : e.registerMutationListener(wt$1, (t, {
				prevEditorState: n
			}) => {
				let i = null,
					a = null;
				for (const [r, o] of t) "created" === o && null === i ? i = e.read("latest", () => mt$1(r)) : "destroyed" === o && null === a && (a = n.read(() => mt$1(r)));
				null !== i ? s(r.peek().replace("%s", i.slice(1))) : null !== a && s(o.peek().replace("%s", a.slice(1)));
			}, {
				skipInitialization: true
			}));
		}
	};
	const Ct$1 = {
			$import: (e, t) => {
				const n = It$1(t.nodeName.toLowerCase());
				return va(t, n), ka(n, t), Ta(n, t), [n.splice(0, 0, e.$importChildren(t))];
			},
			match: /* @__PURE__ */$n$1.tag("h1", "h2", "h3", "h4", "h5", "h6"),
			name: "@lexical/rich-text/heading"
		},
		yt$1 = {
			$import: (e, t) => {
				const n = Ft$1();
				return ka(n, t), va(t, n), Ta(n, t), [n.splice(0, 0, e.$importChildren(t))];
			},
			match: /* @__PURE__ */$n$1.tag("blockquote"),
			name: "@lexical/rich-text/blockquote"
		},
		xt$1 = {
			$import: (e, t) => {
				const n = Ft$1({
					shadowRoot: true
				});
				return ka(n, t), va(t, n), Ta(n, t), [n.splice(0, 0, e.$importChildren(t, {
					schema: Re
				}))];
			},
			match: /* @__PURE__ */$n$1.tag("blockquote"),
			name: "@lexical/rich-text/blockquote-shadow-root"
		},
		vt$1 = [Ct$1, yt$1, {
			$import: (e, t, n) => {
				const r = t.firstChild;
				return r && na(o = r) && "SPAN" === o.nodeName && "26pt" === o.style.fontSize ? e.$importChildren(t) : n();
				var o;
			},
			match: /* @__PURE__ */$n$1.tag("p"),
			name: "@lexical/rich-text/google-docs-title-p"
		}, {
			$import: (e, t, n) => "26pt" !== t.style.fontSize ? n() : [It$1("h1").splice(0, 0, e.$importChildren(t))],
			match: /* @__PURE__ */$n$1.tag("span"),
			name: "@lexical/rich-text/google-docs-title-span"
		}];
	function Dt$1(e, t) {
		return e && null !== t ? qu(e, t) : t;
	}
	const Nt$1 = {
			build: (e, t) => fe$2(t),
			config: {
				escapeFormatTriggers: {
					capitalize: {
						enter: true,
						space: true,
						tab: true
					},
					lowercase: {
						enter: true,
						space: true,
						tab: true
					},
					uppercase: {
						enter: true,
						space: true,
						tab: true
					}
				},
				shouldHandlePasteAsFiles: Gt$1
			},
			conflictsWith: ["@lexical/plain-text"],
			dependencies: [ht$1, b, Xn$1, qn$1, gn$1, [hn$1, {
				rules: vt$1
			}]],
			mergeConfig: function (e, t) {
				const n = qu(e, t);
				return t.escapeFormatTriggers && (n.escapeFormatTriggers = function (e, t) {
					const n = qu(e, t);
					for (const r of Object.keys(t)) n[r] = Dt$1(e[r], t[r]);
					return n;
				}(e.escapeFormatTriggers, t.escapeFormatTriggers)), n;
			},
			name: "@lexical/rich-text",
			nodes: () => [wt$1, Kt$1],
			register: (e, t, n) => de$2(() => {
				const {
					escapeFormatTriggers: t,
					shouldHandlePasteAsFiles: r
				} = n.getOutput();
				return Qt$1(e, t, r);
			})
		},
		St$1 = {
			dependencies: [Nt$1],
			name: "@lexical/rich-text/Import"
		},
		bt$1 = /* @__PURE__ */Re$2("DRAG_DROP_PASTE_FILE"),
		Tt$1 = /* @__PURE__ */vt$7("shadowRoot", {
			parse: Boolean
		});
	let Kt$1 = class Kt extends ts {
		$config() {
			return this.config("quote", {
				extends: ts,
				importDOM: {
					blockquote: () => ({
						conversion: Et$1,
						priority: 0
					})
				},
				stateConfigs: [{
					flat: true,
					stateConfig: Tt$1
				}]
			});
		}
		isShadowRoot() {
			return Tt$7(this, Tt$1);
		}
		setIsShadowRoot(e) {
			return bt$7(this, Tt$1, e);
		}
		createDOM(e) {
			const t = Wc().createElement("blockquote");
			return Gu(t, e.theme.quote), t;
		}
		updateDOM(e, t, n) {
			return false;
		}
		exportDOM(e) {
			const {
				element: t
			} = super.exportDOM(e);
			if (na(t)) {
				this.isEmpty() && t.append(Wc().createElement("br"));
				const e = this.getFormatType();
				e && (t.style.textAlign = e);
				const n = this.getDirection();
				n && (t.dir = n);
			}
			return {
				element: t
			};
		}
		exportJSON() {
			return super.exportJSON();
		}
		static importJSON(e) {
			return Ft$1().updateFromJSON(e);
		}
		insertNewAfter(e, t) {
			const n = Ws();
			n.setTextFormat(e.format), n.setTextStyle(e.style);
			const r = this.getDirection();
			return n.setDirection(r), n.setFormat(this.getFormatType()), n.setStyle(this.getStyle()), this.insertAfter(n, t), n;
		}
		collapseAtStart() {
			if (this.isShadowRoot()) {
				for (const e of this.getChildren()) this.insertBefore(e);
				return this.remove(), true;
			}
			const e = Ws();
			return this.getChildren().forEach(t => e.append(t)), this.replace(e), true;
		}
		canMergeWhenEmpty() {
			return true;
		}
	};
	function Ft$1(e) {
		const t = Mc(new Kt$1());
		return e && e.shadowRoot ? t.setIsShadowRoot(true) : t;
	}
	function kt$1(e) {
		return e instanceof Kt$1;
	}
	let wt$1 = class wt extends ts {
		$config() {
			return this.config("heading", {
				extends: ts,
				importDOM: {
					h1: () => ({
						conversion: _t$1,
						priority: 0
					}),
					h2: () => ({
						conversion: _t$1,
						priority: 0
					}),
					h3: () => ({
						conversion: _t$1,
						priority: 0
					}),
					h4: () => ({
						conversion: _t$1,
						priority: 0
					}),
					h5: () => ({
						conversion: _t$1,
						priority: 0
					}),
					h6: () => ({
						conversion: _t$1,
						priority: 0
					}),
					p: e => {
						const t = e.firstChild;
						return null !== t && Ot$1(t) ? {
							conversion: () => ({
								node: null
							}),
							priority: 3
						} : null;
					},
					span: e => Ot$1(e) ? {
						conversion: () => ({
							node: It$1("h1")
						}),
						priority: 3
					} : null
				}
			});
		}
		afterCloneFrom(e) {
			super.afterCloneFrom(e), this.__tag = e.__tag;
		}
		constructor(e = "h1", t) {
			super(t), this.__tag = e;
		}
		getTag() {
			return this.getLatest().__tag;
		}
		setTag(e) {
			const t = this.getWritable();
			return t.__tag = e, t;
		}
		createDOM(e) {
			const t = this.__tag,
				n = Wc().createElement(t),
				r = e.theme.heading;
			if (void 0 !== r) {
				const e = r[t];
				Gu(n, e);
			}
			return n;
		}
		updateDOM(e, t, n) {
			return e.__tag !== this.__tag;
		}
		exportDOM(e) {
			const {
				element: t
			} = super.exportDOM(e);
			if (na(t)) {
				this.isEmpty() && t.append(Wc().createElement("br"));
				const e = this.getFormatType();
				e && (t.style.textAlign = e);
				const n = this.getDirection();
				n && (t.dir = n);
			}
			return {
				element: t
			};
		}
		updateFromJSON(e) {
			return super.updateFromJSON(e).setTag(e.tag);
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				tag: this.getTag()
			};
		}
		insertNewAfter(e, t = true) {
			const n = e ? e.anchor.offset : 0,
				r = this.getLastDescendant(),
				o = !r || e && e.anchor.key === r.getKey() && n === r.getTextContentSize() || !e ? Ws() : It$1(this.getTag()).setFormat(this.getFormatType()).setStyle(this.getStyle()),
				i = this.getDirection();
			if (o.setDirection(i), this.insertAfter(o, t), 0 === n && !this.isEmpty() && e) {
				const e = Ws();
				e.select(), this.replace(e, true);
			}
			return o;
		}
		collapseAtStart() {
			if (this.isEmpty()) {
				const e = Ws();
				this.getChildren().forEach(t => e.append(t)), this.replace(e);
			}
			return true;
		}
		extractWithChild() {
			return true;
		}
	};
	function Ot$1(e) {
		return "span" === e.nodeName.toLowerCase() && "26pt" === e.style.fontSize;
	}
	function _t$1(e) {
		const t = e.nodeName.toLowerCase();
		let n = null;
		return "h1" !== t && "h2" !== t && "h3" !== t && "h4" !== t && "h5" !== t && "h6" !== t || (n = It$1(t), va(e, n), ka(n, e), Ta(n, e)), {
			node: n
		};
	}
	function Et$1(e) {
		const t = Ft$1();
		return ka(t, e), va(e, t), Ta(t, e), {
			node: t
		};
	}
	function It$1(e = "h1") {
		return Mc(new wt$1(e));
	}
	function At$1(e) {
		return e instanceof wt$1;
	}
	function Rt$1(e) {
		const t = Bl(e);
		return rs(t);
	}
	function Pt$1(e) {
		const t = e.focus;
		return "root" === t.key && t.offset === $l().getChildrenSize();
	}
	function zt$1(e) {
		const t = e.focus;
		return "root" === t.key && 0 === t.offset;
	}
	function Mt$1(e, t) {
		if (!e.isCollapsed()) return false;
		const n = "next" === t;
		if (!(n ? Pt$1(e) : zt$1(e))) return false;
		const r = e.focus.offset;
		return Dc($l().getChildAtIndex(n ? r - 1 : r));
	}
	function $t$1(e, t, n, r) {
		let o = false,
			i = null;
		if (e.isCollapsed() && "text" === e.anchor.type) {
			const t = e.anchor.getNode();
			if (gr(t)) {
				i = t;
				const r = e.anchor.offset,
					s = r === t.getTextContentSize() && null === t.getNextSibling(),
					a = 0 === r && null === t.getPreviousSibling();
				o = "end" === n && s || "start" === n && a || "both" === n && (s || a);
			}
		}
		let s = false;
		for (const [n, a] of Object.entries(r)) {
			if (null == a || !a[t]) continue;
			const r = n;
			if (a.onlyAtBoundary) {
				if (!(o && i && gr(i) && i.hasFormat(r))) continue;
				s = true;
			}
			e.hasFormat(r) && e.toggleFormat(r);
		}
		s && e.setStyle("");
	}
	const Lt$1 = {
		capitalize: {
			enter: true,
			space: true,
			tab: true
		},
		lowercase: {
			enter: true,
			space: true,
			tab: true
		},
		uppercase: {
			enter: true,
			space: true,
			tab: true
		}
	};
	function Bt$1(e, t) {
		return function (e, t) {
			if (!e.isCollapsed()) return false;
			const n = Cs(e.focus, t),
				r = La(n.origin, Nc);
			if (!r) return false;
			const o = e.focus.getNode();
			if (!r.is(o) && !Sc(o, r)) return false;
			const i = zu(n, ku(r, t));
			if (i.getTextSlices().some(e => e && e.getTextContentSize() > 0)) return false;
			const s = zu(i.anchor.getSiblingCaret(), i.focus);
			let a = s.anchor.origin;
			for (const e of s) {
				if (!xu(e) || !e.origin.is(a.getParent())) return false;
				a = e.origin;
			}
			let l = r;
			for (const e of Iu(ku(r, t))) {
				if (!e.origin.is(l.getParent())) {
					if (Dc(e.origin)) {
						const e = ku(l, t);
						return vs(zu(e, e)), true;
					}
					break;
				}
				if (!Nc(e.origin)) break;
				l = e.origin;
			}
			return false;
		}(e, t) || function (e, t) {
			if (!e.isCollapsed() || "element" !== e.anchor.type) return false;
			const n = Cs(e.anchor, t).getNodeAtCaret();
			return !(!Nc(n) || n.isInline() || (vs(Lu(Ms(Eu(n, t)))), 0));
		}(e, t);
	}
	function qt$1(e) {
		return rs(e) && !e.isInline() && !e.isIsolated() && e.isKeyboardSelectable();
	}
	function Jt$1(e) {
		const t = Zr();
		t.add(e), Hl(t);
	}
	function Wt$1(e, t) {
		if (!e.isCollapsed()) return false;
		const n = e.focus,
			r = n.getNode(),
			o = t ? "previous" : "next",
			i = Cs(n, o);
		if ("element" === n.type && es(r) && wc(r)) {
			const e = i.getNodeAtCaret();
			return !(null === e || !qt$1(e)) && (Jt$1(e.__key), true);
		}
		const s = La(es(r) ? r : r.getParentOrThrow(), e => es(e) && !e.isInline() && wc(e.getParent()));
		if (null === s) return false;
		const a = ku(s, o).getNodeAtCaret();
		if (null === a || !qt$1(a)) return false;
		if (0 === s.getTextContentSize()) return Jt$1(a.__key), true;
		const l = ua().getRootElement();
		if (null === l) return false;
		const c = Pc(l.ownerDocument.defaultView);
		if (null === c || 0 === c.rangeCount) return false;
		const u = c.anchorNode,
			f = c.anchorOffset,
			g = c.focusNode,
			d = c.focusOffset;
		c.modify("move", t ? "backward" : "forward", "line");
		const p = c.anchorNode,
			m = c.anchorOffset;
		if (null === p) return Ht$1(c, u, f, g, d), false;
		const h = Bl(p);
		if (Ht$1(c, u, f, g, d), null === h) return false;
		if (p === u && m === f) return Jt$1(a.__key), true;
		return !h.is(s) && !Sc(h, s) && (Jt$1(a.__key), true);
	}
	function Ht$1(e, t, n, r, o) {
		null !== t && null !== r && e.setBaseAndExtent(t, n, r, o);
	}
	function jt$1(e, n) {
		if (!e.isCollapsed()) return false;
		const r = e.focus.getNode(),
			o = La(es(r) ? r : r.getParentOrThrow(), e => es(e) && !e.isInline());
		if (null === o) return false;
		const i = ua(),
			s = i.getRootElement();
		if (null === s) return false;
		const a = s.ownerDocument.defaultView;
		if (null === a) return false;
		let l = false;
		for (const e of o.getChildren()) if (es(e) && e.isInline()) {
			const t = i.getElementByKey(e.getKey());
			if (null !== t) {
				const e = a.getComputedStyle(t).display;
				if ("inline-grid" === e || "inline-flex" === e) {
					l = true;
					break;
				}
			}
		}
		if (!l) return false;
		const c = ku(o, n ? "previous" : "next").getNodeAtCaret();
		if (null === c || !es(c)) {
			if (n) {
				const e = o.getFirstDescendant();
				gr(e) ? e.select(0, 0) : o.select(0, 0);
			} else {
				const e = o.getLastDescendant();
				if (gr(e)) {
					const t = e.getTextContentSize();
					e.select(t, t);
				} else {
					const e = o.getChildrenSize();
					o.select(e, e);
				}
			}
			return true;
		}
		const u = i.getElementByKey(c.getKey());
		if (null === u) return false;
		const f = Pc(a);
		if (null === f || 0 === f.rangeCount) return false;
		const g = f.getRangeAt(0).cloneRange();
		g.collapse(true);
		const d = g.getBoundingClientRect(),
			p = u.getBoundingClientRect(),
			m = p.top + p.height / 2;
		if (d.height > 0) {
			const n = Z(d.left, m, s);
			if (null !== n && u.contains(n.node)) {
				const t = s.ownerDocument.createRange();
				return t.setStart(n.node, n.offset), t.collapse(true), e.applyDOMRange(t), e.dirty = true, true;
			}
		}
		const h = n ? c.getLastDescendant() : c.getFirstDescendant();
		if (gr(h)) {
			const e = n ? h.getTextContentSize() : 0;
			h.select(e, e);
		} else {
			const e = c.getChildrenSize();
			c.select(n ? e : 0, n ? e : 0);
		}
		return true;
	}
	function Vt$1(e, t) {
		const n = ku(e, t),
			r = n.getAdjacentCaret();
		null !== r && es(r.origin) && !r.origin.isInline() && r.origin.isShadowRoot() ? vs(Lu(n)) : "next" === t ? e.selectNext(0, 0) : e.selectPrevious();
	}
	function Xt$1(e, t) {
		const n = e.getNodes().map(e => ku(e, "next")).sort(Bu),
			r = n[0],
			o = n[n.length - 1];
		if (!r || !o) return false;
		for (let e = 0; e < n.length - 1; e++) if (!n[e + 1].origin.is(n[e].getNodeAtCaret())) return false;
		return vs(As(zu(bs(r), o), t)), Gi(), true;
	}
	function Yt$1(e, t, n) {
		n.preventDefault(), n.stopPropagation();
		const r = e.getNodes();
		if (0 === r.length) return true;
		const o = r.map(e => ku(e, "next")).sort(Bu),
			i = (t ? o[0] : o[o.length - 1]).origin,
			s = La(i, e => e !== i && es(e) && !e.isInline()) ?? $l(),
			a = t ? 0 : s.getChildrenSize();
		return s.select(a, a), true;
	}
	function Gt$1(e, t) {
		return e.length > 0 && !t;
	}
	function Qt$1(a, l$1 = ee$2(Lt$1), c = ee$2(Gt$1)) {
		return Qu(a.registerCommand(Ue$2, e => {
			const t = ni();
			if (Or(t)) {
				const n = e.target;
				if (na(n)) for (const e of t.getNodes()) {
					const t = a.getElementByKey(e.getKey());
					if (null !== t && t.contains(n)) return false;
				}
				return t.clear(), true;
			}
			return Er(t) && $t$1(t, "click", "both", l$1.peek()), false;
		}, Hs), a.registerCommand(qe$2, e => {
			const t = ni();
			return Er(t) ? (t.deleteCharacter(e), true) : !!Or(t) && (t.deleteNodes(), true);
		}, Hs), a.registerCommand(tn$3, e => {
			const t = ni();
			return !!Er(t) && (t.deleteWord(e), true);
		}, Hs), a.registerCommand(en$3, e => {
			const t = ni();
			return !!Er(t) && (t.deleteLine(e), true);
		}, Hs), a.registerCommand(Xe$2, t => {
			const n = ni();
			if ("string" == typeof t) null !== n && n.insertText(t);else {
				if (null === n) return false;
				const r = t.dataTransfer;
				if (null != r) dt$1(r, n);else if (Er(n)) {
					const e = t.data;
					return e && n.insertText(e), true;
				}
			}
			return true;
		}, Hs), a.registerCommand(Ze$2, () => {
			const e = ni();
			return !!Er(e) && (e.removeText(), true);
		}, Hs), a.registerCommand(nn$3, e => {
			const t = ni();
			return !(!Er(t) && !Or(t)) && (Fr(t, e), true);
		}, Hs), a.registerCommand(on$3, e => {
			const t = ni();
			return !(!Er(t) && !Or(t)) && (Dr(t, e), true);
		}, Hs), a.registerCommand(kn$3, e => {
			const t = ni();
			if (!Er(t) && !Or(t)) return false;
			const n = t.getNodes();
			for (const t of n) {
				const n = La(t, e => es(e) && !e.isInline());
				null !== n && n.setFormat(e);
			}
			return true;
		}, Hs), a.registerCommand(Ye$2, e => {
			const t = ni();
			return !!Er(t) && (t.insertLineBreak(e), true);
		}, Hs), a.registerCommand(Ge$2, () => {
			const e = ni();
			return !!Er(e) && (e.insertParagraph(), true);
		}, Hs), a.registerCommand(Cn$3, () => {
			const e = yr(),
				t = ni();
			return Er(t) && (e.setFormat(t.format), e.setStyle(t.style)), di([e]), true;
		}, Hs), a.registerCommand(Sn$3, () => Mt$5(e => {
			const t = e.getIndent();
			e.setIndent(t + 1);
		}), Hs), a.registerCommand(vn$3, () => Mt$5(e => {
			const t = e.getIndent();
			t > 0 && e.setIndent(Math.max(0, t - 1));
		}), Hs), a.registerCommand(dn$3, e => {
			let t = ni();
			if (Or(t)) {
				const n = t.getNodes();
				if (n.length > 0) {
					if (!e.shiftKey || !Xt$1(t, "previous")) return e.preventDefault(), Vt$1(n[0], "previous"), true;
					t = ni();
				}
			}
			if (Er(t)) {
				if (zt$1(t)) return e.preventDefault(), true;
				if (!e.shiftKey && Bt$1(t, "previous")) return e.preventDefault(), true;
				if (!e.shiftKey && Wt$1(t, true)) return e.preventDefault(), true;
				if (!e.shiftKey && jt$1(t, true)) return e.preventDefault(), true;
			}
			return false;
		}, Hs), a.registerCommand(hn$3, e => {
			let t = ni();
			if (Or(t)) {
				const n = t.getNodes();
				if (n.length > 0) {
					if (!e.shiftKey || !Xt$1(t, "next")) return e.preventDefault(), Vt$1(n[0], "next"), true;
					t = ni();
				}
			}
			if (Er(t)) {
				if (Pt$1(t)) return e.preventDefault(), true;
				if (!e.shiftKey && Bt$1(t, "next")) return e.preventDefault(), true;
				if (!e.shiftKey && Wt$1(t, false)) return e.preventDefault(), true;
				if (!e.shiftKey && jt$1(t, false)) return e.preventDefault(), true;
			}
			return false;
		}, Hs), a.registerCommand(un$3, e => {
			let t = ni();
			if (Or(t)) {
				const n = t.getNodes();
				if (n.length > 0) {
					const r = M$1(n[0]) ? "next" : "previous";
					if (!e.shiftKey || !Xt$1(t, r)) return e.preventDefault(), Vt$1(n[0], r), true;
					t = ni();
				}
			}
			if (!Er(t)) return false;
			const n = M$1(t.anchor.getNode()) ? "next" : "previous";
			if (Mt$1(t, n)) return e.preventDefault(), true;
			if (!e.shiftKey && Bt$1(t, n)) return e.preventDefault(), true;
			if (e.shiftKey || $t$1(t, "arrow", "start", l$1.peek()), oe$3(t, true)) {
				const n = e.shiftKey;
				return e.preventDefault(), ie$3(t, n, true), true;
			}
			return false;
		}, Hs), a.registerCommand(cn$3, e => {
			let t = ni();
			if (Or(t)) {
				const n = t.getNodes();
				if (n.length > 0) {
					const r = M$1(n[0]) ? "previous" : "next";
					if (!e.shiftKey || !Xt$1(t, r)) return e.preventDefault(), Vt$1(n[0], r), true;
					t = ni();
				}
			}
			if (!Er(t)) return false;
			const n = M$1(t.anchor.getNode()) ? "previous" : "next";
			if (Mt$1(t, n)) return e.preventDefault(), true;
			if (!e.shiftKey && Bt$1(t, n)) return e.preventDefault(), true;
			if (e.shiftKey || $t$1(t, "arrow", "end", l$1.peek()), oe$3(t, false)) {
				const n = e.shiftKey;
				return e.preventDefault(), ie$3(t, n, false), true;
			}
			return false;
		}, Hs), a.registerCommand(pn$3, e => {
			const t = ni();
			if (!Or(t) && Rt$1(e.target)) return false;
			if (Er(t)) {
				if (function (e) {
					if (!e.isCollapsed()) return false;
					const {
						anchor: t
					} = e;
					if (0 !== t.offset) return false;
					const n = t.getNode();
					if (ss(n)) return false;
					const r = Rt$6(n);
					return r.getIndent() > 0 && (r.is(n) || n.is(r.getFirstDescendant()));
				}(t)) return e.preventDefault(), a.dispatchCommand(vn$3);
				if (l && s$1) return false;
			} else if (!Or(t)) return false;
			return e.preventDefault(), a.dispatchCommand(qe$2, true);
		}, Hs), a.registerCommand(mn$3, e => {
			const t = ni();
			return !(!Or(t) && Rt$1(e.target)) && !(!Er(t) && !Or(t)) && (e.preventDefault(), a.dispatchCommand(qe$2, false));
		}, Hs), a.registerCommand(gn$3, e => {
			let t = ni();
			if (Or(t)) {
				const e = t.getNodes();
				1 === e.length && rs(e[0]) && !e[0].isInline() && (t = e[0].selectNext());
			}
			if (!Er(t)) return false;
			if ($t$1(t, "enter", "both", l$1.peek()), null !== e) {
				if ((l || a$1 || d$2) && s$1) return false;
				if (e.preventDefault(), e.shiftKey) return a.dispatchCommand(Ye$2, false);
			}
			return a.dispatchCommand(Ge$2);
		}, Hs), a.registerCommand(yn$3, () => {
			const e = ni();
			return !!Er(e) && (a.blur(), true);
		}, Hs), a.registerCommand(Tn$2, e => {
			const [, r] = Ot$5(e);
			if (r.length > 0) {
				const n = e.clientX,
					o = e.clientY,
					i = Z(n, o, a.getRootElement());
				if (null !== i) {
					const {
							offset: e,
							node: t
						} = i,
						n = Bl(t);
					if (null !== n) {
						const t = Qr();
						if (gr(n)) t.anchor.set(n.getKey(), e, "text"), t.focus.set(n.getKey(), e, "text");else {
							const e = n.getParentOrThrow().getKey(),
								r = n.getIndexWithinParent() + 1;
							t.anchor.set(e, r, "element"), t.focus.set(e, r, "element");
						}
						const r = Bt$6(t);
						Hl(r);
					}
				}
				return a.dispatchCommand(bt$1, r), e.preventDefault(), true;
			}
			return xt$2(e, a);
		}, Hs), a.registerCommand(bn$3, e => {
			const [t] = Ot$5(e),
				n = ni();
			return !(t && !Er(n)) && (Er(n) && !n.isCollapsed() && null !== e.dataTransfer && (Nt$2(e.dataTransfer, Pt$2(n)), gt$1(e.dataTransfer, a)), true);
		}, Hs), a.registerCommand(Nn$2, e => {
			const [n] = Ot$5(e),
				r = ni();
			if (n && !Er(r)) return false;
			const o = e.clientX,
				i = e.clientY,
				s = Z(o, i, a.getRootElement());
			if (null !== s) {
				const t = Bl(s.node);
				rs(t) && e.preventDefault();
			}
			return true;
		}, Hs), a.registerCommand(On$3, () => {
			const e = ni();
			return sc(Er(e) && null !== ja(e.anchor.getNode()) ? e : null), true;
		}, Hs), a.registerCommand(En$2, e => ($t$2(a, Bt$5(e, ClipboardEvent) ? e : null), true), Hs), a.registerCommand(Mn$3, e => (async function (e, t) {
			t.update(() => {
				const e = ni();
				Er(e) && !e.isCollapsed() && zr(e);
			}, {
				discrete: true,
				tag: Ko
			}), await $t$2(t, Bt$5(e, ClipboardEvent) ? e : null), t.update(() => {
				const e = ni();
				Er(e) ? e.removeText() : Or(e) && e.getNodes().forEach(e => e.remove());
			}, {
				tag: Ko
			});
		}(e, a), true), Hs), a.registerCommand(Qe$2, t => {
			const [, n, r] = Ot$5(t);
			if (c.peek()(n, r) && a.dispatchCommand(bt$1, n)) return true;
			if (oa(t.target) && _l(t.target)) return false;
			return null !== ni() && (function (t, n) {
				t.preventDefault(), n.update(() => {
					const r = ni(),
						o = Bt$5(t, InputEvent) || Bt$5(t, KeyboardEvent) ? null : t.clipboardData;
					null != o && null !== r && dt$1(o, r);
				}, {
					tag: zo
				});
			}(t, a), true);
		}, Hs), a.registerCommand(_n$2, () => {
			const e = ni();
			return Er(e) && $t$1(e, "space", "both", l$1.peek()), false;
		}, Hs), a.registerCommand(xn$3, () => {
			const e = ni();
			return Er(e) && $t$1(e, "tab", "both", l$1.peek()), false;
		}, Hs), a.registerCommand(an$3, e => {
			const t = ni();
			if (Or(t)) return Yt$1(t, false, e);
			if (!Er(t)) return false;
			const {
				anchor: n
			} = t;
			if ("element" !== n.type || 0 !== n.offset) return false;
			const r = n.getNode();
			if (!es(r)) return false;
			const o = r.getFirstChild();
			if (!rs(o) || !o.isInline()) return false;
			const i = r.getKey(),
				s = r.selectEnd();
			return e.shiftKey && s.anchor.set(i, 0, "element"), e.preventDefault(), e.stopPropagation(), true;
		}, Hs), a.registerCommand(fn$3, e => {
			const t = ni();
			if (Or(t)) return Yt$1(t, true, e);
			if (!Er(t)) return false;
			const {
					anchor: n,
					focus: r
				} = t,
				o = La(r.getNode(), e => es(e) && !e.isInline());
			if (null === o) return false;
			const i = o.getFirstChild();
			if (!rs(i) || !i.isInline()) return false;
			if (La(n.getNode(), e => es(e) && !e.isInline()) !== o) return false;
			const s = o.getKey();
			return ("element" !== r.type || r.key !== s || 0 !== r.offset) && (t.focus.set(s, 0, "element"), e.shiftKey || t.anchor.set(s, 0, "element"), e.preventDefault(), e.stopPropagation(), true);
		}, Hs));
	}

	var LexicalRichText_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createHeadingNode: It$1,
		$createQuoteNode: Ft$1,
		$isHeadingNode: At$1,
		$isQuoteNode: kt$1,
		DRAG_DROP_PASTE: bt$1,
		HeadingAnnounceExtension: ht$1,
		HeadingNode: wt$1,
		QuoteNode: Kt$1,
		RichTextExtension: Nt$1,
		RichTextImportExtension: St$1,
		RichTextImportRules: vt$1,
		ShadowRootQuoteRule: xt$1,
		defaultShouldHandlePasteAsFiles: Gt$1,
		eventFiles: Ot$5,
		quoteShadowRootState: Tt$1,
		registerRichText: Qt$1
	});

	/**
	 * Copyright (c) Meta Platforms, Inc. and affiliates.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	const ot = /^(\d+(?:\.\d+)?)px$/,
		lt = {
			BOTH: 3,
			COLUMN: 2,
			NO_STATUS: 0,
			ROW: 1
		};
	class rt extends ts {
		$config() {
			return this.config("tablecell", {
				extends: ts,
				importDOM: {
					td: () => ({
						conversion: it,
						priority: 0
					}),
					th: () => ({
						conversion: it,
						priority: 0
					})
				}
			});
		}
		afterCloneFrom(e) {
			super.afterCloneFrom(e), this.__rowSpan = e.__rowSpan, this.__backgroundColor = e.__backgroundColor, this.__verticalAlign = e.__verticalAlign, this.__colSpan = e.__colSpan, this.__headerState = e.__headerState, this.__width = e.__width;
		}
		updateFromJSON(e) {
			return super.updateFromJSON(e).setHeaderStyles(e.headerState).setColSpan(e.colSpan || 1).setRowSpan(e.rowSpan || 1).setWidth(e.width || void 0).setBackgroundColor(e.backgroundColor || null).setVerticalAlign(e.verticalAlign || void 0);
		}
		constructor(e = lt.NO_STATUS, t = 1, n, o) {
			super(o), this.__colSpan = t, this.__rowSpan = 1, this.__headerState = e, this.__width = n, this.__backgroundColor = null, this.__verticalAlign = void 0;
		}
		createDOM(e) {
			const o = Wc().createElement(this.getTag());
			return this.__width && (o.style.width = `${this.__width}px`), this.__colSpan > 1 && (o.colSpan = this.__colSpan), this.__rowSpan > 1 && (o.rowSpan = this.__rowSpan), null !== this.__backgroundColor && (o.style.backgroundColor = this.__backgroundColor), st(this.__verticalAlign) && (o.style.verticalAlign = this.__verticalAlign), Gu(o, e.theme.tableCell, this.hasHeader() && e.theme.tableCellHeader), o;
		}
		exportDOM(e) {
			const t = super.exportDOM(e);
			if (na(t.element)) {
				const e = t.element;
				e.setAttribute("data-temporary-table-cell-lexical-key", this.getKey()), e.style.border = "1px solid black", this.__colSpan > 1 && (e.colSpan = this.__colSpan), this.__rowSpan > 1 && (e.rowSpan = this.__rowSpan), e.style.width = `${this.getWidth() || 75}px`, e.style.verticalAlign = this.getVerticalAlign() || "top", e.style.textAlign = "start", null === this.__backgroundColor && this.hasHeader() && (e.style.backgroundColor = "#f2f3f5");
			}
			return t;
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				...(st(this.__verticalAlign) && {
					verticalAlign: this.__verticalAlign
				}),
				backgroundColor: this.getBackgroundColor(),
				colSpan: this.__colSpan,
				headerState: this.__headerState,
				rowSpan: this.__rowSpan,
				width: this.getWidth()
			};
		}
		getColSpan() {
			return this.getLatest().__colSpan;
		}
		setColSpan(e) {
			const t = this.getWritable();
			return t.__colSpan = e, t;
		}
		getRowSpan() {
			return this.getLatest().__rowSpan;
		}
		setRowSpan(e) {
			const t = this.getWritable();
			return t.__rowSpan = e, t;
		}
		getTag() {
			return this.hasHeader() ? "th" : "td";
		}
		setHeaderStyles(e, t = lt.BOTH) {
			const n = this.getWritable();
			return n.__headerState = e & t | n.__headerState & ~t, n;
		}
		getHeaderStyles() {
			return this.getLatest().__headerState;
		}
		setWidth(e) {
			const t = this.getWritable();
			return t.__width = e, t;
		}
		getWidth() {
			return this.getLatest().__width;
		}
		getBackgroundColor() {
			return this.getLatest().__backgroundColor;
		}
		setBackgroundColor(e) {
			const t = this.getWritable();
			return t.__backgroundColor = e, t;
		}
		getVerticalAlign() {
			return this.getLatest().__verticalAlign;
		}
		setVerticalAlign(e) {
			const t = this.getWritable();
			return t.__verticalAlign = e || void 0, t;
		}
		toggleHeaderStyle(e) {
			const t = this.getWritable();
			return (t.__headerState & e) === e ? t.__headerState &= ~e : t.__headerState |= e, t;
		}
		hasHeaderState(e) {
			return (this.getHeaderStyles() & e) === e;
		}
		hasHeader() {
			return this.getLatest().__headerState !== lt.NO_STATUS;
		}
		updateDOM(e) {
			return e.__headerState !== this.__headerState || e.__width !== this.__width || e.__colSpan !== this.__colSpan || e.__rowSpan !== this.__rowSpan || e.__backgroundColor !== this.__backgroundColor || e.__verticalAlign !== this.__verticalAlign;
		}
		isShadowRoot() {
			return true;
		}
		collapseAtStart() {
			return true;
		}
		canBeEmpty() {
			return false;
		}
		canIndent() {
			return false;
		}
	}
	function st(e) {
		return "middle" === e || "bottom" === e;
	}
	function it(e) {
		const t = e,
			n = e.nodeName.toLowerCase();
		let a;
		ot.test(t.style.width) && (a = parseFloat(t.style.width));
		let u = lt.NO_STATUS;
		if ("th" === n) {
			const e = t.getAttribute("scope");
			if ("col" === e) u = lt.COLUMN;else if ("row" === e) u = lt.ROW;else {
				const e = t.parentElement,
					n = na(e) && "tr" === e.nodeName.toLowerCase() && na(e.parentElement) && ("thead" === e.parentElement.nodeName.toLowerCase() || 0 === e.rowIndex),
					l = 0 === t.cellIndex;
				n && (u |= lt.ROW), l && (u |= lt.COLUMN), u === lt.NO_STATUS && (u = lt.ROW);
			}
		}
		const h = ct(u, t.colSpan, a);
		h.__rowSpan = t.rowSpan;
		const d = t.style.backgroundColor;
		"" !== d && (h.__backgroundColor = d);
		const f = t.style.verticalAlign;
		st(f) && (h.__verticalAlign = f), Ta(h, t);
		const g = t.style,
			p = (g && g.textDecoration || "").split(" "),
			m = "700" === g.fontWeight || "bold" === g.fontWeight,
			C = p.includes("line-through"),
			S = "italic" === g.fontStyle,
			_ = p.includes("underline"),
			b = g.color;
		return {
			after: e => {
				const t = [];
				let n = null;
				const o = () => {
					if (n) {
						const e = n.getFirstChild();
						ps(e) && 1 === n.getChildrenSize() && e.remove();
					}
				};
				for (const l of e) if (kc(l) || gr(l) || ps(l)) {
					if (gr(l) && (m && l.toggleFormat("bold"), C && l.toggleFormat("strikethrough"), S && l.toggleFormat("italic"), _ && l.toggleFormat("underline"), b)) {
						const e = l.getStyle();
						e.includes("color:") || l.setStyle(e + `color: ${b};`);
					}
					n ? n.append(l) : (n = Ws().append(l), t.push(n));
				} else t.push(l), o(), n = null;
				return o(), 0 === t.length && t.push(Ws()), t;
			},
			node: h
		};
	}
	function ct(e = lt.NO_STATUS, t = 1, n) {
		return Mc(new rt(e, t, n));
	}
	function at(e) {
		return e instanceof rt;
	}
	const ut = /* @__PURE__ */Re$2("INSERT_TABLE_COMMAND");
	function ht(e, ...t) {
		const n = new URL("https://lexical.dev/docs/error"),
			o = new URLSearchParams();
		o.append("code", e);
		for (const e of t) o.append("v", e);
		throw n.search = o.toString(), Error(`Minified Lexical error #${e}; visit ${n.toString()} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`);
	}
	class dt extends ts {
		$config() {
			return this.config("tablerow", {
				extends: ts,
				importDOM: {
					tr: () => ({
						conversion: ft,
						priority: 0
					})
				}
			});
		}
		afterCloneFrom(e) {
			super.afterCloneFrom(e), this.__height = e.__height;
		}
		updateFromJSON(e) {
			return super.updateFromJSON(e).setHeight(e.height);
		}
		constructor(e = void 0, t) {
			super(t), this.__height = e;
		}
		exportJSON() {
			const e = this.getHeight();
			return {
				...super.exportJSON(),
				...(void 0 === e ? void 0 : {
					height: e
				})
			};
		}
		createDOM(e) {
			const o = Wc().createElement("tr");
			return this.__height && (o.style.height = `${this.__height}px`), Gu(o, e.theme.tableRow), o;
		}
		extractWithChild(e, t, n) {
			return "html" === n;
		}
		isShadowRoot() {
			return true;
		}
		setHeight(e) {
			const t = this.getWritable();
			return t.__height = e, t;
		}
		getHeight() {
			return this.getLatest().__height;
		}
		updateDOM(e) {
			return e.__height !== this.__height;
		}
		canBeEmpty() {
			return false;
		}
		canIndent() {
			return false;
		}
	}
	function ft(e) {
		const t = e;
		let n;
		return ot.test(t.style.height) && (n = parseFloat(t.style.height)), {
			after: e => jt$4(e, at),
			node: Ta(gt(n), t)
		};
	}
	function gt(e) {
		return Mc(new dt(e));
	}
	function pt(e) {
		return e instanceof dt;
	}
	function mt(e, t, n = true) {
		const o = ho();
		for (let l = 0; l < e; l++) {
			const e = gt();
			for (let o = 0; o < t; o++) {
				let t = lt.NO_STATUS;
				"object" == typeof n ? (0 === l && n.rows && (t |= lt.ROW), 0 === o && n.columns && (t |= lt.COLUMN)) : n && (0 === l && (t |= lt.ROW), 0 === o && (t |= lt.COLUMN));
				const r = ct(t),
					s = Ws();
				s.append(hr()), r.append(s), e.append(r);
			}
			o.append(e);
		}
		return o;
	}
	function Ct(e) {
		const t = La(e, e => at(e));
		return at(t) ? t : null;
	}
	function St(e) {
		const t = La(e, e => pt(e));
		if (pt(t)) return t;
		throw new Error("Expected table cell to be inside of table row.");
	}
	function _t(e) {
		const t = La(e, e => fo(e));
		if (fo(t)) return t;
		throw new Error("Expected table cell to be inside of table.");
	}
	function bt(e) {
		const t = St(e);
		return _t(t).getChildren().findIndex(e => e.is(t));
	}
	function wt(e) {
		return St(e).getChildren().findIndex(t => t.is(e));
	}
	function yt(e, t) {
		const n = _t(e),
			{
				x: o,
				y: l
			} = n.getCordsFromCellNode(e, t);
		return {
			above: n.getCellNodeFromCords(o, l - 1, t),
			below: n.getCellNodeFromCords(o, l + 1, t),
			left: n.getCellNodeFromCords(o - 1, l, t),
			right: n.getCellNodeFromCords(o + 1, l, t)
		};
	}
	function Nt(e, t) {
		const n = e.getChildren();
		if (t >= n.length || t < 0) throw new Error("Expected table cell to be inside of table row.");
		return n[t].remove(), e;
	}
	function xt(e, t, n = true, o, l) {
		const r = e.getChildren();
		if (t >= r.length || t < 0) throw new Error("Table row target index out of range");
		const s = r[t];
		if (!pt(s)) throw new Error("Row before insertion index does not exist.");
		for (let e = 0; e < o; e++) {
			const e = s.getChildren(),
				t = e.length,
				o = gt();
			for (let n = 0; n < t; n++) {
				const t = e[n];
				at(t) || ht(12);
				const {
					above: r,
					below: s
				} = yt(t, l);
				let i = lt.NO_STATUS;
				const a = r && r.getWidth() || s && s.getWidth() || void 0;
				(r && r.hasHeaderState(lt.COLUMN) || s && s.hasHeaderState(lt.COLUMN)) && (i |= lt.COLUMN);
				const u = ct(i, 1, a);
				u.append(Ws()), o.append(u);
			}
			n ? s.insertAfter(o) : s.insertBefore(o);
		}
		return e;
	}
	const vt = (e, t) => e === lt.BOTH || e === t ? t : lt.NO_STATUS;
	function Tt(e = true) {
		const t = ni();
		Er(t) || on(t) || ht(188);
		const n = t.anchor.getNode(),
			o = t.focus.getNode(),
			[l] = Yt(n),
			[r,, s] = Yt(o),
			[, i, c] = Ut(s, r, l),
			{
				startRow: a
			} = c,
			{
				startRow: u
			} = i;
		return e ? Ft(a + l.__rowSpan > u + r.__rowSpan ? l : r, true) : Ft(u < a ? r : l, false);
	}
	const Rt = Tt;
	function Ft(e, t = true) {
		const [,, n] = Yt(e),
			[o, l] = Ut(n, e, e),
			r = o[0].length,
			{
				startRow: s
			} = l;
		let i = null;
		if (t) {
			const t = s + e.__rowSpan - 1,
				l = o[t],
				a = gt();
			for (let e = 0; e < r; e++) {
				const {
					cell: n,
					startRow: o
				} = l[e];
				if (o + n.__rowSpan - 1 <= t) {
					const t = l[e].cell.__headerState,
						n = vt(t, lt.COLUMN);
					a.append(ct(n).append(Ws()));
				} else n.setRowSpan(n.__rowSpan + 1);
			}
			const u = n.getChildAtIndex(t);
			pt(u) || ht(256), u.insertAfter(a), i = a;
		} else {
			const e = s,
				t = o[e],
				l = gt();
			for (let n = 0; n < r; n++) {
				const {
					cell: o,
					startRow: r
				} = t[n];
				if (r === e) {
					const e = t[n].cell.__headerState,
						o = vt(e, lt.COLUMN);
					l.append(ct(o).append(Ws()));
				} else o.setRowSpan(o.__rowSpan + 1);
			}
			const a = n.getChildAtIndex(e);
			pt(a) || ht(257), a.insertBefore(l), i = l;
		}
		return i;
	}
	function At(e, t, n = true, o, l) {
		const r = e.getChildren(),
			s = [];
		for (let e = 0; e < r.length; e++) {
			const n = r[e];
			if (pt(n)) for (let e = 0; e < o; e++) {
				const e = n.getChildren();
				if (t >= e.length || t < 0) throw new Error("Table column target index out of range");
				const o = e[t];
				at(o) || ht(12);
				const {
					left: r,
					right: i
				} = yt(o, l);
				let a = lt.NO_STATUS;
				(r && r.hasHeaderState(lt.ROW) || i && i.hasHeaderState(lt.ROW)) && (a |= lt.ROW);
				const u = ct(a);
				u.append(Ws()), s.push({
					newTableCell: u,
					targetCell: o
				});
			}
		}
		return s.forEach(({
			newTableCell: e,
			targetCell: t
		}) => {
			n ? t.insertAfter(e) : t.insertBefore(e);
		}), e;
	}
	function Ot(e = true) {
		const t = ni();
		Er(t) || on(t) || ht(188);
		const n = t.anchor.getNode(),
			o = t.focus.getNode(),
			[l] = Yt(n),
			[r,, s] = Yt(o),
			[, i, c] = Ut(s, r, l),
			{
				startColumn: a
			} = c,
			{
				startColumn: u
			} = i;
		return e ? kt(a + l.__colSpan > u + r.__colSpan ? l : r, true) : kt(u < a ? r : l, false);
	}
	const Kt = Ot;
	function kt(e, t = true, n = true) {
		const [,, o] = Yt(e),
			[l, r] = Ut(o, e, e),
			s = l.length,
			{
				startColumn: i
			} = r,
			a = t ? i + e.__colSpan - 1 : i - 1,
			u = o.getFirstChild();
		pt(u) || ht(120);
		let h = null;
		function d(e = lt.NO_STATUS) {
			const t = ct(e).append(Ws());
			return null === h && (h = t), t;
		}
		let f = u;
		for (let e = 0; e < s; e++) {
			if (0 !== e) {
				const e = f.getNextSibling();
				pt(e) || ht(121), f = e;
			}
			const t = l[e],
				n = t[a < 0 ? 0 : a].cell.__headerState,
				o = vt(n, lt.ROW);
			if (a < 0) {
				Lt(f, d(o));
				continue;
			}
			const {
				cell: r,
				startColumn: s
			} = t[a];
			if (s + r.__colSpan - 1 <= a) {
				let n = null;
				for (let o = 0; o <= a; o++) {
					const l = t[o];
					l.startRow === e && (n = l.cell), l.cell.__colSpan > 1 && (o += l.cell.__colSpan - 1);
				}
				null === n ? Lt(f, d(o)) : n.insertAfter(d(o));
			} else r.setColSpan(r.__colSpan + 1);
		}
		null !== h && n && zt(h);
		const g = o.getColWidths();
		if (g) {
			const e = [...g],
				t = a < 0 ? 0 : a,
				n = e[t];
			e.splice(t, 0, n), o.setColWidths(e);
		}
		return h;
	}
	function Et(e, t) {
		const n = e.getChildren();
		for (let e = 0; e < n.length; e++) {
			const o = n[e];
			if (pt(o)) {
				const e = o.getChildren();
				if (t >= e.length || t < 0) throw new Error("Table column target index out of range");
				e[t].remove();
			}
		}
		return e;
	}
	function Mt() {
		const e = ni();
		Er(e) || on(e) || ht(188);
		const [t, n] = e.isBackward() ? [e.focus.getNode(), e.anchor.getNode()] : [e.anchor.getNode(), e.focus.getNode()],
			[o,, l] = Yt(t),
			[r] = Yt(n),
			[s, i, c] = Ut(l, o, r),
			{
				startRow: a
			} = i,
			{
				startRow: u
			} = c,
			h = u + r.__rowSpan - 1;
		if (s.length === h - a + 1) return l.selectPrevious(), void l.remove();
		const g = s[0].length,
			p = s[h + 1],
			m = l.getChildAtIndex(h + 1);
		for (let e = h; e >= a; e--) {
			for (let t = g - 1; t >= 0; t--) {
				const {
					cell: n,
					startRow: o,
					startColumn: l
				} = s[e][t];
				if (l === t) {
					if (o < a || o + n.__rowSpan - 1 > h) {
						const e = Math.max(o, a),
							t = Math.min(n.__rowSpan + o - 1, h),
							l = e <= t ? t - e + 1 : 0;
						n.setRowSpan(n.__rowSpan - l);
					}
					if (o >= a && o + n.__rowSpan - 1 > h && e === h) {
						pt(m) || ht(387);
						let o = null;
						for (let n = 0; n < t; n++) {
							const t = p[n],
								l = t.cell;
							t.startRow === e + 1 && (o = l), l.__colSpan > 1 && (n += l.__colSpan - 1);
						}
						null === o ? Lt(m, n) : o.insertAfter(n);
					}
				}
			}
			const t = l.getChildAtIndex(e);
			pt(t) || ht(206, String(e)), t.remove();
		}
		if (void 0 !== p) {
			const {
				cell: e
			} = p[0];
			zt(e);
		} else {
			const e = s[a - 1],
				{
					cell: t
				} = e[0];
			zt(t);
		}
	}
	const Wt = Mt;
	function $t() {
		const e = ni();
		Er(e) || on(e) || ht(188);
		const t = e.anchor.getNode(),
			n = e.focus.getNode(),
			[o,, l] = Yt(t),
			[r] = Yt(n),
			[s, i, c] = Ut(l, o, r),
			{
				startColumn: a
			} = i,
			{
				startRow: u,
				startColumn: h
			} = c,
			g = Math.min(a, h),
			p = Math.max(a + o.__colSpan - 1, h + r.__colSpan - 1),
			m = p - g + 1;
		if (s[0].length === p - g + 1) return l.selectPrevious(), void l.remove();
		const C = s.length;
		for (let e = 0; e < C; e++) for (let t = g; t <= p; t++) {
			const {
				cell: n,
				startColumn: o
			} = s[e][t];
			if (o < g) {
				if (t === g) {
					const e = g - o;
					n.setColSpan(n.__colSpan - Math.min(m, n.__colSpan - e));
				}
			} else if (o + n.__colSpan - 1 > p) {
				if (t === p) {
					const e = p - o + 1;
					n.setColSpan(n.__colSpan - e);
				}
			} else n.remove();
		}
		const S = s[u],
			_ = a > h ? S[a + o.__colSpan] : S[h + r.__colSpan];
		if (void 0 !== _) {
			const {
				cell: e
			} = _;
			zt(e);
		} else {
			const e = h < a ? S[h - 1] : S[a - 1],
				{
					cell: t
				} = e;
			zt(t);
		}
		const b = l.getColWidths();
		if (b) {
			const e = [...b];
			e.splice(g, m), l.setColWidths(e);
		}
	}
	const Ht = $t;
	function zt(e) {
		const t = e.getFirstDescendant();
		null == t ? e.selectStart() : t.getParentOrThrow().selectStart();
	}
	function Lt(e, t) {
		const n = e.getFirstChild();
		null !== n ? n.insertBefore(t) : e.append(t);
	}
	function Bt(e) {
		if (0 === e.length) return null;
		const t = _t(e[0]),
			[n] = Xt(t, null, null);
		let o = 1 / 0,
			l = -1 / 0,
			r = 1 / 0,
			s = -1 / 0;
		const i = new Set();
		for (const t of n) for (const n of t) {
			if (!n || !n.cell) continue;
			const t = n.cell.getKey();
			if (!i.has(t) && e.some(e => e.is(n.cell))) {
				i.add(t);
				const e = n.startRow,
					c = n.startColumn,
					a = n.cell.__rowSpan || 1,
					u = n.cell.__colSpan || 1;
				o = Math.min(o, e), l = Math.max(l, e + a - 1), r = Math.min(r, c), s = Math.max(s, c + u - 1);
			}
		}
		if (o === 1 / 0 || r === 1 / 0) return null;
		const a = l - o + 1,
			u = s - r + 1,
			h = n[o][r];
		if (!h.cell) return null;
		const d = h.cell;
		d.setColSpan(u), d.setRowSpan(a);
		const f = new Set([d.getKey()]);
		for (let e = o; e <= l; e++) for (let t = r; t <= s; t++) {
			const o = n[e][t];
			if (!o.cell) continue;
			const l = o.cell,
				r = l.getKey();
			if (!f.has(r)) {
				f.add(r);
				Dt(l) || d.append(...l.getChildren()), l.remove();
			}
		}
		return 0 === d.getChildrenSize() && d.append(Ws()), d;
	}
	function Dt(e) {
		if (1 !== e.getChildrenSize()) return false;
		const t = e.getFirstChildOrThrow();
		return !(!$s(t) || !t.isEmpty());
	}
	function Pt() {
		const e = ni();
		Er(e) || on(e) || ht(188);
		const t = e.anchor.getNode(),
			n = La(t, at);
		return at(n) || ht(148), It(n);
	}
	function It(e) {
		const [t, n, o] = Yt(e),
			l = t.__colSpan,
			r = t.__rowSpan;
		if (1 === l && 1 === r) return;
		const [s, i] = Ut(o, t, t),
			{
				startColumn: a,
				startRow: u
			} = i,
			h = t.__headerState & lt.COLUMN,
			d = Array.from({
				length: l
			}, (e, t) => {
				let n = h;
				for (let e = 0; 0 !== n && e < s.length; e++) n &= s[e][t + a].cell.__headerState;
				return n;
			}),
			f = t.__headerState & lt.ROW,
			g = Array.from({
				length: r
			}, (e, t) => {
				let n = f;
				for (let e = 0; 0 !== n && e < s[0].length; e++) n &= s[t + u][e].cell.__headerState;
				return n;
			}),
			p = e => Ec(t).setColSpan(1).setRowSpan(1).setHeaderStyles(e).setWidth(void 0).append(Ws());
		if (l > 1) {
			for (let e = 1; e < l; e++) t.insertAfter(p(d[e] | g[0]));
			t.setColSpan(1);
		}
		if (r > 1) {
			let e;
			for (let t = 1; t < r; t++) {
				const o = u + t,
					r = s[o];
				e = (e || n).getNextSibling(), pt(e) || ht(125);
				let i = null;
				for (let e = 0; e < a; e++) {
					const t = r[e],
						n = t.cell;
					t.startRow === o && (i = n), n.__colSpan > 1 && (e += n.__colSpan - 1);
				}
				if (null === i) for (let n = l - 1; n >= 0; n--) Lt(e, p(d[n] | g[t]));else for (let e = l - 1; e >= 0; e--) i.insertAfter(p(d[e] | g[t]));
			}
			t.setRowSpan(1);
		}
	}
	function Ut(e, t, n) {
		const [o, l, r] = Xt(e, t, n);
		return null === l && ht(207), null === r && ht(208), [o, l, r];
	}
	function Xt(e, t, n) {
		const o = [];
		let l = null,
			r = null;
		function s(e) {
			let t = o[e];
			return void 0 === t && (o[e] = t = []), t;
		}
		const i = e.getChildren();
		for (let e = 0; e < i.length; e++) {
			const o = i[e];
			pt(o) || ht(209);
			const c = s(e);
			for (let a = o.getFirstChild(), u = 0; null != a; a = a.getNextSibling()) {
				for (at(a) || ht(147); void 0 !== c[u];) u++;
				const o = {
						cell: a,
						startColumn: u,
						startRow: e
					},
					{
						__rowSpan: h,
						__colSpan: d
					} = a;
				for (let t = 0; t < h && !(e + t >= i.length); t++) {
					const n = s(e + t);
					for (let e = 0; e < d; e++) n[u + e] = o;
				}
				null !== t && null === l && t.is(a) && (l = o), null !== n && null === r && n.is(a) && (r = o);
			}
		}
		return [o, l, r];
	}
	function Yt(e) {
		let t;
		if (e instanceof rt) t = e;else if ("__type" in e) {
			const n = La(e, at);
			at(n) || ht(148), t = n;
		} else {
			const n = La(e.getNode(), at);
			at(n) || ht(148), t = n;
		}
		const n = t.getParent();
		pt(n) || ht(149);
		const o = n.getParent();
		return fo(o) || ht(210), [t, n, o];
	}
	function qt(e, t, n) {
		let o,
			l = Math.min(t.startColumn, n.startColumn),
			r = Math.min(t.startRow, n.startRow),
			s = Math.max(t.startColumn + t.cell.__colSpan - 1, n.startColumn + n.cell.__colSpan - 1),
			i = Math.max(t.startRow + t.cell.__rowSpan - 1, n.startRow + n.cell.__rowSpan - 1);
		do {
			o = false;
			for (let t = 0; t < e.length; t++) for (let n = 0; n < e[0].length; n++) {
				const c = e[t][n];
				if (!c) continue;
				const a = c.startColumn + c.cell.__colSpan - 1,
					u = c.startRow + c.cell.__rowSpan - 1,
					h = c.startColumn <= s && a >= l,
					d = c.startRow <= i && u >= r;
				if (h && d) {
					const e = Math.min(l, c.startColumn),
						t = Math.max(s, a),
						n = Math.min(r, c.startRow),
						h = Math.max(i, u);
					e === l && t === s && n === r && h === i || (l = e, s = t, r = n, i = h, o = true);
				}
			}
		} while (o);
		return {
			maxColumn: s,
			maxRow: i,
			minColumn: l,
			minRow: r
		};
	}
	function Jt(e) {
		const t = e.getChildren();
		let n = null;
		for (const e of t) {
			if (!pt(e)) return false;
			if (null === n && (n = e.getChildrenSize()), e.getChildrenSize() !== n) return false;
			const t = e.getChildren();
			for (const e of t) if (!at(e) || 1 !== e.getRowSpan() || 1 !== e.getColSpan()) return false;
		}
		return (n || 0) > 0;
	}
	function Vt(e, t, n) {
		if (t === n) return;
		const o = e.getColumnCount();
		if (t < 0 || t >= o || n < 0 || n >= o) return;
		if (!Jt(e)) return;
		e.getChildren().filter(pt).forEach(e => {
			const o = e.getChildren(),
				[l] = o.splice(t, 1);
			o.splice(n, 0, l), e.splice(0, o.length, o);
		});
		const l = e.getColWidths();
		if (l && l.length === o) {
			const o = [...l],
				[r] = o.splice(t, 1);
			o.splice(n, 0, r), e.setColWidths(o);
		}
	}
	function jt(e, t, n) {
		if (t === n) return;
		const o = e.getChildren().filter(pt),
			l = o.length;
		if (t < 0 || t >= l || n < 0 || n >= l) return;
		if (!Jt(e)) return;
		const r = o[t],
			s = o[n];
		n > t ? s.insertAfter(r) : s.insertBefore(r);
	}
	function Gt(e) {
		const [t,, n] = Yt(e),
			o = n.getChildren().filter(pt),
			l = o.length,
			r = o[0].getChildren().length,
			s = new Array(l);
		for (let e = 0; e < l; e++) s[e] = new Array(r);
		for (let e = 0; e < l; e++) {
			const n = o[e].getChildren().filter(at);
			let l = 0;
			for (let o = 0; o < n.length; o++) {
				for (; s[e][l];) l++;
				const r = n[o],
					i = r.__rowSpan || 1,
					c = r.__colSpan || 1;
				for (let t = 0; t < i; t++) for (let n = 0; n < c; n++) s[e + t][l + n] = r;
				if (t === r) return {
					colSpan: c,
					columnIndex: l,
					rowIndex: e,
					rowSpan: i
				};
				l += c;
			}
		}
		return null;
	}
	function Qt(e, t) {
		const n = t.getStartEndPoints(),
			o = on(t);
		if (null === n) return false;
		const [l, r] = n,
			[i, a, u] = Yt(l),
			h = La(r.getNode(), e => at(e));
		if (!(at(i) && at(h) && pt(a) && fo(u))) return false;
		const [d, f, p] = Ut(u, i, h),
			[m] = Xt(e, null, null),
			C = d.length,
			S = C > 0 ? d[0].length : 0;
		let _ = f.startRow,
			b = f.startColumn,
			w = m.length,
			y = w > 0 ? m[0].length : 0;
		if (o) {
			const e = qt(d, f, p),
				t = e.maxRow - e.minRow + 1,
				n = e.maxColumn - e.minColumn + 1;
			_ = e.minRow, b = e.minColumn, w = Math.min(w, t), y = Math.min(y, n);
		}
		let N = false;
		const x = Math.min(C, _ + w) - 1,
			v = Math.min(S, b + y) - 1,
			T = new Set();
		for (let e = _; e <= x; e++) for (let t = b; t <= v; t++) {
			const n = d[e][t];
			T.has(n.cell.getKey()) || 1 === n.cell.__rowSpan && 1 === n.cell.__colSpan || (It(n.cell), T.add(n.cell.getKey()), N = true);
		}
		let [R] = Xt(u.getWritable(), null, null);
		const F = w - C + _;
		for (let e = 0; e < F; e++) {
			Ft(R[C - 1][0].cell);
		}
		const A = y - S + b;
		for (let e = 0; e < A; e++) {
			kt(R[0][S - 1].cell, true, false);
		}
		[R] = Xt(u.getWritable(), null, null);
		for (let e = _; e < _ + w; e++) for (let t = b; t < b + y; t++) {
			const n = e - _,
				o = t - b,
				l = m[n][o];
			if (l.startRow !== n || l.startColumn !== o) continue;
			const r = l.cell;
			if (1 !== r.__rowSpan || 1 !== r.__colSpan) {
				const n = [],
					o = Math.min(e + r.__rowSpan, _ + w) - 1,
					l = Math.min(t + r.__colSpan, b + y) - 1;
				for (let r = e; r <= o; r++) for (let e = t; e <= l; e++) {
					const t = R[r][e];
					n.push(t.cell);
				}
				Bt(n), N = true;
			}
			const {
					cell: i
				} = R[e][t],
				a = r.getBackgroundColor();
			null != a && i.setBackgroundColor(a);
			const u = r.getVerticalAlign();
			void 0 !== u && i.setVerticalAlign(u);
			const h = i.getChildren();
			r.getChildren().forEach(e => {
				if (gr(e)) {
					Ws().append(e), i.append(e);
				} else i.append(e);
			}), h.forEach(e => e.remove());
		}
		if (o && N) {
			const [e] = Xt(u.getWritable(), null, null);
			e[f.startRow][f.startColumn].cell.selectEnd();
		}
		return true;
	}
	function Zt(e, t, n) {
		const [o] = Xt(e, null, null);
		t >= 0 && t < o.length || ht(396, String(t));
		const l = o[t],
			r = n ? lt.ROW : lt.NO_STATUS,
			s = new Set();
		for (let e = 0; e < l.length; e++) {
			const t = l[e];
			null != t && (s.has(t.cell) || (s.add(t.cell), t.cell.setHeaderStyles(r, lt.ROW)));
		}
	}
	function en(e, t, n) {
		const [o] = Xt(e, null, null);
		o.length > 0 && t >= 0 && t < o[0].length || ht(397, String(t));
		const l = n ? lt.COLUMN : lt.NO_STATUS,
			r = new Set();
		for (let e = 0; e < o.length; e++) {
			const n = o[e][t];
			null != n && (r.has(n.cell) || (r.add(n.cell), n.cell.setHeaderStyles(l, lt.COLUMN)));
		}
	}
	function tn(e) {
		const [[t, n, o, l], [r, s, i, c]] = ["anchor", "focus"].map(t => {
			const n = e[t].getNode(),
				o = La(n, at);
			at(o) || ht(238, t, n.getKey(), n.getType());
			const l = o.getParent();
			pt(l) || ht(239, t);
			const r = l.getParent();
			return fo(r) || ht(240, t), [n, o, l, r];
		});
		return l.is(c) || ht(241), {
			anchorCell: n,
			anchorNode: t,
			anchorRow: o,
			anchorTable: l,
			focusCell: s,
			focusNode: r,
			focusRow: i,
			focusTable: c
		};
	}
	class nn {
		constructor(e, t, n) {
			this.anchor = t, this.focus = n, t._selection = this, n._selection = this, this._cachedNodes = null, this.dirty = false, this.tableKey = e;
		}
		getStartEndPoints() {
			return [this.anchor, this.focus];
		}
		isValid() {
			if ("root" === this.tableKey || "root" === this.anchor.key || "element" !== this.anchor.type || "root" === this.focus.key || "element" !== this.focus.type) return false;
			const e = Il(this.tableKey),
				t = Il(this.anchor.key),
				n = Il(this.focus.key);
			return null !== e && null !== t && null !== n;
		}
		isBackward() {
			return this.focus.isBefore(this.anchor);
		}
		getCachedNodes() {
			return this._cachedNodes;
		}
		setCachedNodes(e) {
			this._cachedNodes = e;
		}
		is(e) {
			return on(e) && this.tableKey === e.tableKey && this.anchor.is(e.anchor) && this.focus.is(e.focus);
		}
		set(e, t, n) {
			this.dirty = this.dirty || e !== this.tableKey || t !== this.anchor.key || n !== this.focus.key, this.tableKey = e, this.anchor.key = t, this.focus.key = n, this._cachedNodes = null;
		}
		clone() {
			return new nn(this.tableKey, Cr(this.anchor.key, this.anchor.offset, this.anchor.type), Cr(this.focus.key, this.focus.offset, this.focus.type));
		}
		isCollapsed() {
			return false;
		}
		extract() {
			return this.getNodes();
		}
		insertRawText(e) {
			if ("" === e) return;
			const t = (e.endsWith("\n") ? e.slice(0, -1) : e).split("\n").map(e => e.split("\t")),
				n = ho();
			for (const e of t) {
				const t = gt();
				for (const n of e) {
					const e = ct(lt.NO_STATUS),
						o = Ws();
					n && o.append(hr(n)), e.append(o), t.append(e);
				}
				n.append(t);
			}
			const {
				anchorCell: o
			} = tn(this);
			Qt(n, o.select(0, o.getChildrenSize()));
		}
		insertText() {}
		hasFormat(e) {
			let t = 0;
			this.getNodes().filter(at).forEach(e => {
				const n = e.getFirstChild();
				$s(n) && (t |= n.getTextFormat());
			});
			const n = K$1[e];
			return 0 !== (t & n);
		}
		insertNodes(e) {
			const t = this.focus.getNode();
			es(t) || ht(151);
			Bt$6(t.select(0, t.getChildrenSize())).insertNodes(e);
		}
		getShape() {
			const {
					anchorCell: e,
					focusCell: t
				} = tn(this),
				n = Gt(e);
			null === n && ht(153);
			const o = Gt(t);
			null === o && ht(155);
			const l = Math.min(n.columnIndex, o.columnIndex),
				r = Math.max(n.columnIndex + n.colSpan - 1, o.columnIndex + o.colSpan - 1),
				s = Math.min(n.rowIndex, o.rowIndex),
				i = Math.max(n.rowIndex + n.rowSpan - 1, o.rowIndex + o.rowSpan - 1);
			return {
				fromX: Math.min(l, r),
				fromY: Math.min(s, i),
				toX: Math.max(l, r),
				toY: Math.max(s, i)
			};
		}
		getNodes() {
			if (!this.isValid()) return [];
			const e = this._cachedNodes;
			if (null !== e) return e;
			const {
					anchorTable: t,
					anchorCell: n,
					focusCell: o
				} = tn(this),
				l = o.getParents()[1];
			if (l !== t) {
				if (t.isParentOf(o)) {
					const e = l.getParent();
					null == e && ht(159), this.set(this.tableKey, o.getKey(), e.getKey());
				} else {
					const e = t.getParent();
					null == e && ht(158), this.set(this.tableKey, e.getKey(), o.getKey());
				}
				return this.getNodes();
			}
			const [r, s, i] = Ut(t, n, o),
				{
					minColumn: c,
					maxColumn: a,
					minRow: u,
					maxRow: h
				} = qt(r, s, i),
				d = new Map([[t.getKey(), t]]);
			let f = null;
			for (let e = u; e <= h; e++) for (let t = c; t <= a; t++) {
				const {
						cell: n
					} = r[e][t],
					o = n.getParent();
				pt(o) || ht(160), o !== f && (d.set(o.getKey(), o), f = o), d.has(n.getKey()) || sn(n, e => {
					d.set(e.getKey(), e);
				});
			}
			const g = Array.from(d.values());
			return Oi() || (this._cachedNodes = g), g;
		}
		getTextContent() {
			const e = this.getNodes().filter(e => at(e));
			let t = "";
			for (let n = 0; n < e.length; n++) {
				const o = e[n],
					l = o.__parent,
					r = (e[n + 1] || {}).__parent;
				t += o.getTextContent() + (r !== l ? "\n" : "\t");
			}
			return t;
		}
	}
	function on(e) {
		return e instanceof nn;
	}
	function ln() {
		const e = Cr("root", 0, "element"),
			t = Cr("root", 0, "element");
		return new nn("root", e, t);
	}
	function rn(e, t, n) {
		e.getKey(), t.getKey(), n.getKey();
		const o = ni(),
			l = on(o) ? o.clone() : new nn("root", Cr("root", 0, "element"), Cr("root", 0, "element"));
		return l.set(e.getKey(), t.getKey(), n.getKey()), l;
	}
	function sn(e, t) {
		const n = [[e]];
		for (let e = n.at(-1); void 0 !== e && n.length > 0; e = n.at(-1)) {
			const o = e.pop();
			void 0 === o ? n.pop() : false !== t(o) && es(o) && n.push(o.getChildren());
		}
	}
	function cn(e, t = ua()) {
		const n = Il(e);
		fo(n) || ht(231, e);
		const o = mn(n, t.getElementByKey(e));
		return null === o && ht(232, e), {
			tableElement: o,
			tableNode: n
		};
	}
	class an {
		constructor() {
			this.observers = new Map(), this.nextFocus = null, this.shouldCheckSelectionForTable = null;
		}
		setNextFocus(e) {
			this.nextFocus = e;
		}
		getAndClearNextFocus() {
			const {
				nextFocus: e
			} = this;
			return null !== e && (this.nextFocus = null), e;
		}
		setShouldCheckSelectionForTable(e) {
			this.shouldCheckSelectionForTable = e;
		}
		getAndClearShouldCheckSelectionForTable() {
			const {
				shouldCheckSelectionForTable: e
			} = this;
			return e ? (this.shouldCheckSelectionForTable = null, e) : null;
		}
		removeObserver(e) {
			const t = this.observers.get(e);
			return void 0 !== t && (t[0].removeListeners(), this.observers.delete(e), true);
		}
		removeAllObservers() {
			for (const e of Array.from(this.observers.keys())) this.removeObserver(e);
		}
		$getTableNodesAndObservers() {
			const e = [];
			for (const [t, [n]] of Array.from(this.observers.entries())) {
				const o = Il(t);
				fo(o) ? e.push([o, n]) : this.removeObserver(t);
			}
			return e;
		}
	}
	class un {
		constructor(e, t) {
			this.isHighlightingCells = false, this.anchorX = -1, this.anchorY = -1, this.focusX = -1, this.focusY = -1, this.listenersToRemove = new Set(), this.tableNodeKey = t, this.editor = e, this.table = {
				columns: 0,
				domRows: [],
				rows: 0
			}, this.tableSelection = null, this.anchorCellNodeKey = null, this.focusCellNodeKey = null, this.anchorCell = null, this.focusCell = null, this.hasHijackedSelectionStyles = false, this.isSelecting = false, this.isPointerDrag = false, this.pointerStartCell = null, this.pointerType = null, this.abortController = new AbortController(), this.listenerOptions = {
				signal: this.abortController.signal
			}, this.trackTable();
		}
		getTable() {
			return this.table;
		}
		removeListeners() {
			this.abortController.abort("removeListeners"), Array.from(this.listenersToRemove).forEach(e => e()), this.listenersToRemove.clear();
		}
		$lookup() {
			return cn(this.tableNodeKey, this.editor);
		}
		trackTable() {
			const e = new MutationObserver(e => {
				this.editor.read("latest", () => {
					let t = false;
					for (let n = 0; n < e.length; n++) {
						const o = e[n].target.nodeName;
						if ("TABLE" === o || "TBODY" === o || "THEAD" === o || "TR" === o) {
							t = true;
							break;
						}
					}
					if (!t) return;
					const {
						tableNode: n,
						tableElement: o
					} = this.$lookup();
					this.table = An(n, o);
				});
			});
			this.listenersToRemove.add(() => e.disconnect()), this.editor.read("latest", () => {
				const {
					tableNode: t,
					tableElement: n
				} = this.$lookup();
				this.table = An(t, n), e.observe(n, {
					attributes: true,
					childList: true,
					subtree: true
				});
			});
		}
		$clearHighlight(e = true) {
			const t = this.editor;
			this.isHighlightingCells = false, this.anchorX = -1, this.anchorY = -1, this.focusX = -1, this.focusY = -1, this.tableSelection = null, this.anchorCellNodeKey = null, this.focusCellNodeKey = null, this.anchorCell = null, this.focusCell = null, this.hasHijackedSelectionStyles = false, this.$enableHighlightStyle();
			const {
				tableNode: n,
				tableElement: o
			} = this.$lookup();
			On(t, An(n, o), null), e && null !== ni() && (Hl(null), t.dispatchCommand(We$2));
		}
		$enableHighlightStyle() {
			const e = this.editor,
				{
					tableElement: t
				} = this.$lookup();
			Xu(t, e._config.theme.tableSelection), t.classList.remove("disable-selection"), this.hasHijackedSelectionStyles = false;
		}
		$disableHighlightStyle() {
			const {
				tableElement: e
			} = this.$lookup();
			Gu(e, this.editor._config.theme.tableSelection), this.hasHijackedSelectionStyles = true;
		}
		$updateTableTableSelection(e) {
			if (null !== e) {
				e.tableKey !== this.tableNodeKey && ht(233, e.tableKey, this.tableNodeKey);
				const t = this.editor;
				this.tableSelection = e, this.isHighlightingCells = true, this.$disableHighlightStyle(), this.updateDOMSelection(), On(t, this.table, this.tableSelection);
			} else this.$clearHighlight();
		}
		updateDOMSelection() {
			if (null !== this.anchorCell && null !== this.focusCell) {
				const e = Pc(this.editor._window);
				e && e.rangeCount > 0 && e.removeAllRanges();
			}
		}
		$setFocusCellForSelection(e, t = false) {
			const n = this.editor,
				{
					tableNode: o
				} = this.$lookup(),
				l = e.x,
				r = e.y;
			if (this.focusCell = e, !this.isHighlightingCells) {
				(t || this.anchorX !== l || this.anchorY !== r || null != this.tableSelection && null != this.anchorCellNodeKey) && (this.isHighlightingCells = true, this.$disableHighlightStyle());
			}
			if (-1 !== this.focusX && -1 !== this.focusY && l === this.focusX && r === this.focusY) return false;
			if (this.focusX = l, this.focusY = r, this.isHighlightingCells) {
				const s = jn(o, e.elem);
				if (null != this.tableSelection && null != this.anchorCellNodeKey) {
					let e = s;
					if (null === e && t && (e = o.getCellNodeFromCords(l, r, this.table)), null !== e) {
						const t = this.$getAnchorTableCellOrThrow();
						return this.focusCellNodeKey = e.getKey(), this.tableSelection = rn(o, t, e), Hl(this.tableSelection), n.dispatchCommand(We$2), On(n, this.table, this.tableSelection), true;
					}
				}
			}
			return false;
		}
		$getAnchorTableCell() {
			const e = this.anchorCellNodeKey ? Il(this.anchorCellNodeKey) : null;
			return at(e) ? e : null;
		}
		$getAnchorTableCellOrThrow() {
			const e = this.$getAnchorTableCell();
			return null === e && ht(234), e;
		}
		$getFocusTableCell() {
			const e = this.focusCellNodeKey ? Il(this.focusCellNodeKey) : null;
			return at(e) ? e : null;
		}
		$getFocusTableCellOrThrow() {
			const e = this.$getFocusTableCell();
			return null === e && ht(235), e;
		}
		$setAnchorCellForSelection(e) {
			this.isHighlightingCells = false, this.anchorCell = e, this.anchorX = e.x, this.anchorY = e.y, this.focusX = -1, this.focusY = -1, this.focusCell = null, this.focusCellNodeKey = null;
			const {
					tableNode: t
				} = this.$lookup(),
				n = jn(t, e.elem);
			if (null !== n) {
				const e = n.getKey();
				null != this.tableSelection ? (this.tableSelection = this.tableSelection.clone(), this.tableSelection.set(t.getKey(), e, e)) : this.tableSelection = rn(t, n, n), this.anchorCellNodeKey = e;
			}
		}
		$formatCells(e) {
			const t = ni();
			on(t) || ht(236);
			const n = Qr(),
				o = n.anchor,
				l = n.focus,
				r = t.getNodes().filter(at);
			r.length > 0 || ht(237);
			const s = r[0].getFirstChild(),
				i = $s(s) ? s.getFormatFlags(e, null) : null;
			r.forEach(t => {
				o.set(t.getKey(), 0, "element"), l.set(t.getKey(), t.getChildrenSize(), "element"), n.formatText(e, i);
			}), Hl(t), this.editor.dispatchCommand(We$2);
		}
		$clearText() {
			const {
					editor: e
				} = this,
				t = Il(this.tableNodeKey);
			if (!fo(t)) throw new Error("Expected TableNode.");
			const n = ni();
			on(n) || ht(253);
			const o = n.getNodes().filter(at),
				l = t.getFirstChild(),
				r = t.getLastChild();
			if (o.length > 0 && null !== l && null !== r && pt(l) && pt(r) && o[0] === l.getFirstChild() && o[o.length - 1] === r.getLastChild()) {
				t.selectPrevious();
				const n = t.getParent();
				return t.remove(), void (ss(n) && n.isEmpty() && e.dispatchCommand(Ge$2));
			}
			o.forEach(e => {
				if (es(e)) {
					const t = e.getFirstChild(),
						n = $s(t) ? Ec(t) : Ws(),
						o = hr();
					n.append(o), e.append(n), e.getChildren().forEach(e => {
						e !== n && e.remove();
					});
				}
			}), On(e, this.table, null), Hl(null), e.dispatchCommand(We$2);
		}
	}
	const hn = "__lexicalTableSelection";
	function dn(e) {
		const t = Ac(e);
		return fo(t) || ht(386, e), t;
	}
	const fn = 40;
	function gn(e, t, n) {
		const o = e => Math.max(1, Math.ceil(Math.min(fn, e) / fn * 18));
		return e <= t + fn ? -o(t + fn - e) : e >= n - fn ? o(e - (n - fn)) : 0;
	}
	function pn(e) {
		return na(e) && "TABLE" === e.nodeName;
	}
	function mn(e, t) {
		if (!t) return t;
		const n = pn(t) ? t : t.querySelector("table");
		return pn(n) || ht(341, e.constructor.name, e.getType(), e.getKey(), t.nodeName), n;
	}
	function Cn(e) {
		return e._window;
	}
	function Sn(e, t) {
		for (let n = t, o = null; null !== n; n = n.getParent()) {
			if (e.is(n)) return o;
			at(n) && (o = n);
		}
		return null;
	}
	const _n = [[hn$3, "down"], [dn$3, "up"], [un$3, "backward"], [cn$3, "forward"]],
		bn = [tn$3, en$3, qe$2],
		wn = [pn$3, mn$3];
	function yn(e, t) {
		return e.registerRootListener(n => {
			if (null === n) return;
			const o = e._window;
			if (null === o) return;
			return jn$2(o, "pointerdown", o => {
				const l = Xc(o);
				if (0 !== o.button || !oa(l) || !n.contains(l)) return;
				const r = function (e) {
					const t = Rn(e);
					if (null === t) return null;
					let n = t.elem;
					for (; null != n;) {
						if ("TABLE" === n.nodeName && hn in n && n[hn]) return {
							cellElement: t,
							tableElement: n,
							tableObserver: n[hn]
						};
						n = n.parentNode;
					}
					return null;
				}(l);
				e.update(() => {
					if (on(ni())) {
						for (const [e] of t.observers.values()) e.$clearHighlight(false);
						Hl(null), e.dispatchCommand(We$2);
					}
					if (!r) return;
					const {
						tableObserver: n,
						tableElement: l,
						cellElement: s
					} = r;
					!function (e, t, n, o, l, r) {
						const s = e._window;
						if (!s) return;
						const i$1 = n => {
							if (l.isSelecting) return;
							l.isSelecting = true, l.isPointerDrag = false, l.pointerStartCell = n;
							const i$1 = "touch" === t.pointerType,
								c = t.pointerId,
								a = t.clientX,
								u = t.clientY;
							let h = !i$1;
							i$1 || null !== l.anchorCell || e.update(() => {
								l.$setAnchorCellForSelection(n);
							});
							let d = t.clientX,
								f = t.clientY,
								g = null,
								p = null;
							const m = e => e.pointerId === c,
								C = (e, t) => !(Math.abs(e - a) <= 10 && Math.abs(t - u) <= 10),
								S = () => {
									l.isSelecting = false, l.isPointerDrag = false, l.pointerStartCell = null, null !== g && (s.cancelAnimationFrame(g), g = null), null !== p && (p(), p = null);
								},
								_ = (e, t) => {
									const n = o.getRootNode();
									if (!bl(n) && !Lc(n)) return null;
									for (const l of n.elementsFromPoint(e, t)) {
										const e = Fn(o, l);
										if (e) return e;
									}
									return null;
								},
								b = (t, o) => {
									if (h || l.isPointerDrag && t.elem !== n.elem) {
										if (null === l.anchorCell || !h) {
											const o = h ? t : n;
											e.update(() => {
												l.$setAnchorCellForSelection(o);
											});
										}
										h = true, null !== l.focusCell && t.elem === l.focusCell.elem || (r.setNextFocus({
											focusCell: t,
											override: o,
											tableKey: l.tableNodeKey
										}), e.dispatchCommand(We$2));
									}
								},
								w = e => {
									for (let t = o.parentElement; t; t = t.parentElement) {
										if ("x" === e ? t.scrollWidth > t.clientWidth : t.scrollHeight > t.clientHeight) {
											const n = s.getComputedStyle(t),
												o = "x" === e ? n.overflowX : n.overflowY;
											if ("auto" === o || "scroll" === o) return t;
										}
									}
									return null;
								},
								y = (e, t, n) => {
									let o, l;
									if (null === e) o = 0, l = "x" === n ? s.innerWidth : s.innerHeight;else {
										const t = e.getBoundingClientRect();
										o = "x" === n ? t.left : t.top, l = "x" === n ? t.right : t.bottom;
									}
									const r = gn(t, o, l);
									if (0 === r) return false;
									if (null === e) {
										const e = "x" === n ? s.scrollX : s.scrollY;
										return s.scrollBy("x" === n ? r : 0, "x" === n ? 0 : r), ("x" === n ? s.scrollX : s.scrollY) !== e;
									}
									if ("x" === n) {
										const t = e.scrollLeft;
										return e.scrollLeft += r, e.scrollLeft !== t;
									}
									const i = e.scrollTop;
									return e.scrollTop += r, e.scrollTop !== i;
								},
								N = (e, t) => {
									let n = d,
										o = f;
									if (null === e) n = Math.min(Math.max(n, 1), s.innerWidth - 1);else {
										const t = e.getBoundingClientRect();
										n = Math.min(Math.max(n, t.left + 1), t.right - 1);
									}
									if (null === t) o = Math.min(Math.max(o, 1), s.innerHeight - 1);else {
										const e = t.getBoundingClientRect();
										o = Math.min(Math.max(o, e.top + 1), e.bottom - 1);
									}
									return [n, o];
								},
								x = () => {
									const e = w("x");
									if (null !== e) {
										const t = e.getBoundingClientRect();
										if (0 !== gn(d, t.left, t.right)) return true;
									}
									const t = w("y"),
										n = null === t ? 0 : t.getBoundingClientRect().top,
										o = null === t ? s.innerHeight : t.getBoundingClientRect().bottom;
									return 0 !== gn(f, n, o);
								},
								T = () => {
									if (g = null, !l.isSelecting) return;
									const e = w("x"),
										t = w("y"),
										n = null !== e && y(e, d, "x"),
										o = y(t, f, "y");
									if (n || o) {
										const [n, o] = N(e, t),
											l = _(n, o);
										l && b(l, false), g = s.requestAnimationFrame(T);
									}
								},
								R = () => {
									null !== g || i$1 && !l.isPointerDrag || !x() || (g = s.requestAnimationFrame(T));
								},
								F = e => {
									m(e) && S();
								},
								A = e => {
									if (!m(e)) return;
									if (!(e => !(1 & ~e.buttons))(e) && l.isSelecting) return void S();
									const t = Xc(e);
									if (!oa(t)) return;
									d = e.clientX, f = e.clientY, !l.isPointerDrag && C(d, f) && (l.isPointerDrag = true);
									let n = null;
									const r = !(i || o.contains(t));
									n = r ? Fn(o, t) : _(e.clientX, e.clientY), n && b(n, r), R();
								};
							p = Zu(s, {
								lostpointercapture: F,
								pointercancel: F,
								pointermove: A,
								pointerup: e => {
									m(e) && S();
								}
							}, l.listenerOptions);
						};
						l.pointerType = t.pointerType;
						const c = dn(l.tableNodeKey),
							a = oi(),
							u = Er(a) || on(a) ? Pn(a.anchor.getNode()) : null,
							h = null !== u && u.isParentOf(c);
						if (i && t.shiftKey && (Er(a) || on(a)) && (zn(a, c) || h)) {
							const e = a.anchor.getNode(),
								o = Sn(c, a.anchor.getNode());
							if (o) {
								const e = Vn(l, o);
								e.elem !== n.elem ? (l.$setAnchorCellForSelection(e), l.$setFocusCellForSelection(n), Yn(t)) : "touch" !== t.pointerType && l.$setAnchorCellForSelection(n);
							} else {
								(c.isBefore(e) ? c.selectStart() : c.selectEnd()).anchor.set(a.anchor.key, a.anchor.offset, a.anchor.type), Yn(t);
							}
						} else "touch" !== t.pointerType && l.$setAnchorCellForSelection(n);
						i$1(n);
					}(e, o, s, l, n, t);
				});
			});
		});
	}
	function Nn(e, t, n, o, l) {
		const r = n.getRootElement(),
			s = Cn(n);
		null !== r && null !== s || ht(246);
		const i = new un(n, e.getKey()),
			c = mn(e, t);
		!function (e, t) {
			null !== Tn(e) && ht(205);
			e[hn] = t;
		}(c, i), i.listenersToRemove.add(() => function (e, t) {
			Tn(e) === t && delete e[hn];
		}(c, i));
		i.listenersToRemove.add(jn$2(c, "mousedown", e => {
			const t = Xc(e);
			if (e.detail >= 3 && oa(t)) {
				null !== Rn(t) && e.preventDefault();
			}
		}, i.listenerOptions));
		for (const [t, o] of _n) i.listenersToRemove.add(n.registerCommand(t, t => Xn(n, t, o, e, i, l), Vs));
		i.listenersToRemove.add(n.registerCommand(yn$3, t => {
			const n = ni();
			if (on(n)) {
				const o = Sn(e, n.focus.getNode());
				if (null !== o) return Yn(t), o.selectEnd(), true;
			}
			return false;
		}, Vs));
		const a = () => {
			const t = ni();
			return !!zn(t, e) && !!on(t) && (i.$clearText(), true);
		};
		for (const e of bn) i.listenersToRemove.add(n.registerCommand(e, a, Vs));
		const u = t => {
			const n = ni();
			if (!on(n) && !Er(n)) return false;
			const o = e.isParentOf(n.anchor.getNode());
			if (o !== e.isParentOf(n.focus.getNode())) {
				const t = o ? "anchor" : "focus",
					l = o ? "focus" : "anchor",
					{
						key: r,
						offset: s,
						type: i
					} = n[l];
				return e[n[t].isBefore(n[l]) ? "selectPrevious" : "selectNext"]()[l].set(r, s, i), false;
			}
			return !!zn(n, e) && !!on(n) && (t && (t.preventDefault(), t.stopPropagation()), i.$clearText(), true);
		};
		for (const e of wn) i.listenersToRemove.add(n.registerCommand(e, u, Vs));
		i.listenersToRemove.add(n.registerCommand(Mn$3, e => {
			const t = ni();
			if (t) {
				if (!on(t) && !Er(t)) return false;
				$t$2(n, Bt$5(e, ClipboardEvent) ? e : null, Pt$2(t));
				const o = u(e);
				return Er(t) ? (t.removeText(), true) : o;
			}
			return false;
		}, Vs));
		const p = r.ownerDocument;
		return i.listenersToRemove.add(jn$2(p, "paste", t => {
			if (t.defaultPrevented) return;
			n.read("latest", () => {
				const t = ni();
				return r.contains(p.activeElement) && on(t) && zn(t, e);
			}) && (t.preventDefault(), n.dispatchCommand(Qe$2, t));
		})), i.listenersToRemove.add(jn$2(p, "copy", t => {
			if (t.defaultPrevented) return;
			const o = Xc(t);
			if (o === r || oa(o) && r.contains(o)) return;
			n.read("latest", () => {
				const t = ni();
				return r.contains(Yc(r)) && on(t) && zn(t, e);
			}) && (t.preventDefault(), n.dispatchCommand(En$2, t));
		})), i.listenersToRemove.add(n.registerCommand(nn$3, t => {
			const n = ni();
			return !!zn(n, e) && !!on(n) && (i.$formatCells(t), true);
		}, Vs)), i.listenersToRemove.add(n.registerCommand(kn$3, t => {
			const n = ni();
			if (!on(n) || !zn(n, e)) return false;
			const o = n.anchor.getNode(),
				l = n.focus.getNode();
			if (!at(o) || !at(l)) return false;
			const [r, s, i] = Ut(e, o, l),
				{
					minColumn: c,
					maxColumn: a,
					minRow: u,
					maxRow: h
				} = qt(r, s, i);
			if (0 === u && 0 === c && h === r.length - 1 && a === r[0].length - 1) return e.setFormat(t), true;
			const f = new Set();
			for (let e = u; e <= h; e++) for (let n = c; n <= a; n++) {
				const o = r[e][n].cell;
				if (f.has(o)) continue;
				f.add(o), o.setFormat(t);
				const l = o.getChildren();
				for (let e = 0; e < l.length; e++) {
					const n = l[e];
					es(n) && !n.isInline() && n.setFormat(t);
				}
			}
			return true;
		}, Vs)), i.listenersToRemove.add(n.registerCommand(Xe$2, t => {
			const o = ni();
			if (!zn(o, e)) return false;
			if (on(o)) return i.$clearHighlight(), false;
			if (Er(o)) {
				const l = La(o.anchor.getNode(), e => at(e));
				if (!at(l)) return false;
				if ("string" == typeof t) {
					const l = Jn(n, o, e);
					if (l) return qn(l, e, [hr(t)]), true;
				}
			}
			return false;
		}, Vs)), o && i.listenersToRemove.add(n.registerCommand(xn$3, t => {
			const n = ni();
			if (!Er(n) || !n.isCollapsed() || !zn(n, e)) return false;
			const o = Pn(n.anchor.getNode());
			return !(null === o || !e.is(In(o))) && (Yn(t), function (e, t) {
				const n = "next" === t ? "getNextSibling" : "getPreviousSibling",
					o = "next" === t ? "getFirstChild" : "getLastChild",
					l = e[n]();
				if (es(l)) return l.selectEnd();
				const r = La(e, pt);
				null === r && ht(247);
				for (let e = r[n](); pt(e); e = e[n]()) {
					const t = e[o]();
					if (es(t)) return t.selectEnd();
				}
				const s = La(r, fo);
				null === s && ht(248);
				"next" === t ? s.selectNext() : s.selectPrevious();
			}(o, t.shiftKey ? "previous" : "next"), true);
		}, Vs)), i.listenersToRemove.add(n.registerCommand(In$2, t => e.isSelected(), Vs)), i.listenersToRemove.add(n.registerCommand(Ge$2, () => {
			const t = ni();
			if (!Er(t) || !t.isCollapsed() || !zn(t, e)) return false;
			const o = Jn(n, t, e);
			return !!o && (qn(o, e), true);
		}, Vs)), i;
	}
	function xn(e, t) {
		const n = ni(),
			o = oi(),
			l = e.getAndClearNextFocus();
		if (null !== l) {
			const {
					tableKey: t,
					focusCell: o
				} = l,
				r = e.observers.get(t);
			r || ht(335, t);
			const [s] = r;
			if (on(n) && n.tableKey === s.tableNodeKey) return (o.x !== s.focusX || o.y !== s.focusY) && (s.$setFocusCellForSelection(o), true);
			if (null !== s.anchorCell && null !== s.anchorCellNodeKey && o.elem !== s.anchorCell.elem && null !== s.tableSelection) return s.$setFocusCellForSelection(o, true), true;
		}
		const r = e.getAndClearShouldCheckSelectionForTable();
		if (r && Er(o) && Er(n) && n.isCollapsed()) {
			const e = Il(r);
			if (fo(e)) {
				const t = n.anchor.getNode(),
					o = e.getFirstChild(),
					l = Pn(t);
				if (null !== l && pt(o)) {
					const t = o.getFirstChild();
					if (at(t) && e.is(La(l, n => n.is(e) || n.is(t)))) return t.selectStart(), true;
				}
			}
		}
		on(n) && function (e, t) {
			const n = Cn(e),
				o = oi();
			if (!t.is(o)) return;
			const l = dn(t.tableKey),
				r = Pc(n),
				s = r && Hc(r, e.getRootElement());
			if (r && s && s.anchorNode && s.focusNode) {
				const n = Bl(s.focusNode),
					o = n && !l.isParentOf(n),
					i = Bl(s.anchorNode),
					c = i && l.isParentOf(i);
				if (o && c && r.rangeCount > 0) {
					const n = ti(r, e);
					n && (n.anchor.set(l.getKey(), t.isBackward() ? l.getChildrenSize() : 0, "element"), r.removeAllRanges(), Hl(n));
				}
			}
		}(t, n), Er(n) && function (e, t) {
			const n = oi(),
				{
					anchor: o,
					focus: l
				} = e,
				r = o.getNode(),
				s = l.getNode(),
				i = Pn(r),
				c = Pn(s),
				a = i ? In(i) : null,
				u = c ? In(c) : null,
				h = e.isBackward(),
				d = i && c && a && u && a.is(u),
				g = u && (!a || a.isParentOf(u)),
				p = a && (!u || u.isParentOf(a));
			if (g) {
				const t = e.clone(),
					[n] = Ut(u, c, c),
					o = n[0][0].cell,
					l = n[n.length - 1].at(-1).cell;
				t.focus.set(h ? o.getKey() : l.getKey(), h ? 0 : l.getChildrenSize(), "element"), Hl(t);
			} else if (p) {
				const t = e.clone(),
					[n] = Ut(a, i, i),
					o = n[0][0].cell,
					l = n[n.length - 1].at(-1).cell;
				t.anchor.set(h ? l.getKey() : o.getKey(), h ? l.getChildrenSize() : 0, "element"), Hl(t);
			} else if (d) {
				const o = t.observers.get(a.getKey());
				o || ht(335, a.getKey());
				const [l] = o;
				if (i.is(c) || (l.$setAnchorCellForSelection(Vn(l, i)), l.$setFocusCellForSelection(Vn(l, c), true)), "touch" === l.pointerType && l.isSelecting && l.isPointerDrag && e.isCollapsed() && Er(n) && n.isCollapsed()) {
					const e = Pn(n.anchor.getNode()),
						{
							pointerStartCell: t
						} = l;
					null !== t && Vn(l, c).elem !== t.elem && e && !e.is(c) && (l.$setAnchorCellForSelection(Vn(l, e)), l.$setFocusCellForSelection(Vn(l, c), true), l.pointerType = null);
				}
			}
		}(n, e);
		for (const [n, o] of e.$getTableNodesAndObservers()) vn(t, n, o);
		return false;
	}
	function vn(e, t, n) {
		const o = ni(),
			l = oi();
		o && !o.is(l) && (on(o) || on(l)) && n.tableSelection && !n.tableSelection.is(l) && (on(o) && o.tableKey === n.tableNodeKey ? n.$updateTableTableSelection(o) : !on(o) && on(l) && l.tableKey === n.tableNodeKey && n.$updateTableTableSelection(null)), n.hasHijackedSelectionStyles && !t.isSelected() ? function (e, t) {
			t.$enableHighlightStyle(), Kn(t.table, t => {
				const n = t.elem;
				t.highlighted = false, Dn(e, t), n.getAttribute("style") || n.removeAttribute("style");
			});
		}(e, n) : !n.hasHijackedSelectionStyles && t.isSelected() && function (e, t) {
			t.$disableHighlightStyle(), Kn(t.table, t => {
				t.highlighted = true, Bn(e, t);
			});
		}(e, n);
	}
	function Tn(e) {
		return e[hn] || null;
	}
	function Rn(e) {
		let t = e;
		for (; null != t;) {
			const e = t.nodeName;
			if ("TD" === e || "TH" === e) {
				const e = t._cell;
				return void 0 === e ? null : e;
			}
			t = t.parentNode;
		}
		return null;
	}
	function Fn(e, t) {
		if (!e.contains(t)) return null;
		let n = null;
		for (let o = t; null != o; o = o.parentNode) {
			if (o === e) return n;
			const t = o.nodeName;
			"TD" !== t && "TH" !== t || (n = o._cell || null);
		}
		return null;
	}
	function An(e, t) {
		const n = [],
			o = {
				columns: 0,
				domRows: n,
				rows: 0
			};
		let l = mn(e, t).querySelector("tr"),
			r = 0,
			s = 0;
		for (n.length = 0; null != l;) {
			const e = l.nodeName;
			if ("TD" === e || "TH" === e) {
				const e = {
					elem: l,
					hasBackgroundColor: "" !== l.style.backgroundColor,
					highlighted: false,
					x: r,
					y: s
				};
				l._cell = e;
				let t = n[s];
				void 0 === t && (t = n[s] = []), t[r] = e;
			} else {
				const e = l.firstChild;
				if (null != e) {
					l = e;
					continue;
				}
			}
			const t = l.nextSibling;
			if (null != t) {
				r++, l = t;
				continue;
			}
			const o = l.parentNode;
			if (null != o) {
				const e = o.nextSibling;
				if (null == e) break;
				s++, r = 0, l = e;
			}
		}
		return o.columns = r + 1, o.rows = s + 1, o;
	}
	function On(e, t, n) {
		const o = new Set(n ? n.getNodes() : []);
		Kn(t, (t, n) => {
			const l = t.elem;
			o.has(n) ? (t.highlighted = true, Bn(e, t)) : (t.highlighted = false, Dn(e, t), l.getAttribute("style") || l.removeAttribute("style"));
		});
	}
	function Kn(e, t) {
		const {
			domRows: n
		} = e;
		for (let e = 0; e < n.length; e++) {
			const o = n[e];
			if (o) for (let n = 0; n < o.length; n++) {
				const l = o[n];
				if (!l) continue;
				const r = Bl(l.elem);
				null !== r && t(l, r, {
					x: n,
					y: e
				});
			}
		}
	}
	const kn = (e, t, n, o, l) => {
		const r = "forward" === l;
		switch (l) {
			case "backward":
			case "forward":
				return n !== (r ? e.table.columns - 1 : 0) ? Ln(t.getCellNodeFromCordsOrThrow(n + (r ? 1 : -1), o, e.table), r) : o !== (r ? e.table.rows - 1 : 0) ? Ln(t.getCellNodeFromCordsOrThrow(r ? 0 : e.table.columns - 1, o + (r ? 1 : -1), e.table), r) : r ? t.selectNext() : t.selectPrevious(), true;
			case "up":
				return 0 !== o ? Ln(t.getCellNodeFromCordsOrThrow(n, o - 1, e.table), false) : t.selectPrevious(), true;
			case "down":
				return o !== e.table.rows - 1 ? Ln(t.getCellNodeFromCordsOrThrow(n, o + 1, e.table), true) : t.selectNext(), true;
			default:
				return false;
		}
	};
	function En(e, t) {
		let n, o;
		if (t.startColumn === e.minColumn) n = "minColumn";else {
			if (t.startColumn + t.cell.__colSpan - 1 !== e.maxColumn) return null;
			n = "maxColumn";
		}
		if (t.startRow === e.minRow) o = "minRow";else {
			if (t.startRow + t.cell.__rowSpan - 1 !== e.maxRow) return null;
			o = "maxRow";
		}
		return [n, o];
	}
	function Mn(e, t, n) {
		const o = En(e, t);
		if (o) return o;
		const l = En(e, n);
		return l ? Wn(l) : ["minColumn", "minRow"];
	}
	function Wn([e, t]) {
		return ["minColumn" === e ? "maxColumn" : "minColumn", "minRow" === t ? "maxRow" : "minRow"];
	}
	function $n(e, t, [n, o]) {
		const l = t[o],
			r = e[l];
		void 0 === r && ht(250, o, String(l));
		const s = t[n],
			i = r[s];
		return void 0 === i && ht(250, n, String(s)), i;
	}
	function Hn(e, t, n, o, l) {
		const r = qt(t, n, o),
			s = function (e, t) {
				const {
					minColumn: n,
					maxColumn: o,
					minRow: l,
					maxRow: r
				} = t;
				let s = 1,
					i = 1,
					c = 1,
					a = 1;
				const u = e[l],
					h = e[r];
				for (let e = n; e <= o; e++) s = Math.max(s, u[e].cell.__rowSpan), a = Math.max(a, h[e].cell.__rowSpan);
				for (let t = l; t <= r; t++) i = Math.max(i, e[t][n].cell.__colSpan), c = Math.max(c, e[t][o].cell.__colSpan);
				return {
					bottomSpan: a,
					leftSpan: i,
					rightSpan: c,
					topSpan: s
				};
			}(t, r),
			{
				topSpan: i,
				leftSpan: c,
				bottomSpan: a,
				rightSpan: u
			} = s,
			h = Mn(r, n, o),
			[d, f] = Wn(h);
		let g = r[d],
			p = r[f];
		"forward" === l ? g += "maxColumn" === d ? 1 : c : "backward" === l ? g -= "minColumn" === d ? 1 : u : "down" === l ? p += "maxRow" === f ? 1 : i : "up" === l && (p -= "minRow" === f ? 1 : a);
		const m = t[p];
		if (void 0 === m) return false;
		const C = m[g];
		if (void 0 === C) return false;
		const [S, _] = function (e, t, n) {
				const o = qt(e, t, n),
					l = Mn(o, t, n);
				return [$n(e, o, l), $n(e, o, Wn(l))];
			}(t, n, C),
			b = Vn(e, S.cell),
			w = Vn(e, _.cell);
		return e.$setAnchorCellForSelection(b), e.$setFocusCellForSelection(w, true), true;
	}
	function zn(e, t) {
		if (Er(e) || on(e)) {
			const n = t.isParentOf(e.anchor.getNode()),
				o = t.isParentOf(e.focus.getNode());
			return n && o;
		}
		return false;
	}
	function Ln(e, t) {
		t ? e.selectStart() : e.selectEnd();
	}
	function Bn(e, t) {
		const o = t.elem,
			l = e._config.theme;
		at(Bl(o)) || ht(131), Gu(o, l.tableCellSelected);
	}
	function Dn(e, t) {
		const n = t.elem;
		at(Bl(n)) || ht(131);
		const o = e._config.theme;
		Xu(n, o.tableCellSelected);
	}
	function Pn(e) {
		const t = La(e, at);
		return at(t) ? t : null;
	}
	function In(e) {
		const t = La(e, fo);
		return fo(t) ? t : null;
	}
	function Un(e, t, n, o, l, r, s) {
		const i = Cs(n.focus, l ? "previous" : "next");
		if (Os(i)) return false;
		let c = i;
		for (const e of Iu(i).iterNodeCarets("shadowRoot")) {
			if (!xu(e) || !es(e.origin)) return false;
			c = e;
		}
		const a = c.getParentAtCaret();
		if (!at(a)) return false;
		const u = a,
			h = function (e) {
				for (const t of Iu(e).iterNodeCarets("root")) {
					const {
						origin: n
					} = t;
					if (at(n)) {
						if (Cu(t)) return Eu(n, e.direction);
					} else if (!pt(n)) break;
				}
				return null;
			}(ku(u, c.direction)),
			d = La(u, fo);
		if (!d || !d.is(r)) return false;
		const f = e.getElementByKey(u.getKey()),
			p = Rn(f);
		if (!f || !p) return false;
		const m = ao(e, d);
		if (s.table = m, h) {
			if ("extend" === o) {
				const t = Rn(e.getElementByKey(h.origin.getKey()));
				if (!t) return false;
				s.$setAnchorCellForSelection(p), s.$setFocusCellForSelection(t, true);
			} else {
				const e = Ms(h);
				Ss(n.anchor, e), Ss(n.focus, e);
			}
		} else if ("extend" === o) s.$setAnchorCellForSelection(p), s.$setFocusCellForSelection(p, true);else {
			const e = function (e) {
				const t = Ou(e);
				return Cu(t) ? Ms(t) : e;
			}(ku(d, i.direction));
			Ss(n.anchor, e), Ss(n.focus, e);
		}
		return Yn(t), true;
	}
	function Xn(e, t, n, o, l, r) {
		if (("up" === n || "down" === n) && function (e) {
			const t = e.getRootElement();
			if (!t) return false;
			return t.hasAttribute("aria-controls") && "typeahead-menu" === t.getAttribute("aria-controls");
		}(e)) return false;
		const i = ni();
		if (!zn(i, o)) {
			if (Er(i)) {
				if ("backward" === n) {
					if (i.focus.offset > 0) return false;
					const e = function (e) {
						for (let t = e, n = e; null !== n; t = n, n = n.getParent()) if (es(n)) {
							if (n !== t && n.getFirstChild() !== t) return null;
							if (!n.isInline()) return n;
						}
						return null;
					}(i.focus.getNode());
					if (!e) return false;
					const n = e.getPreviousSibling();
					return !!fo(n) && (Yn(t), t.shiftKey ? i.focus.set(n.getParentOrThrow().getKey(), n.getIndexWithinParent(), "element") : n.selectEnd(), true);
				}
				if (t.shiftKey && ("up" === n || "down" === n)) {
					const e = i.focus.getNode();
					if (!i.isCollapsed() && ("up" === n && !i.isBackward() || "down" === n && i.isBackward())) {
						let l = La(e, e => fo(e));
						if (at(l) && (l = La(l, fo)), l !== o) return false;
						if (!l) return false;
						const r = "down" === n ? l.getNextSibling() : l.getPreviousSibling();
						if (!r) return false;
						let c = 0;
						"up" === n && es(r) && (c = r.getChildrenSize());
						let a = r;
						if ("up" === n && es(r)) {
							const e = r.getLastChild();
							a = e || r, c = gr(a) ? a.getTextContentSize() : 0;
						}
						const u = i.clone();
						return u.focus.set(a.getKey(), c, gr(a) ? "text" : "element"), Hl(u), Yn(t), true;
					}
					if (wc(e)) {
						const e = "up" === n ? i.getNodes()[i.getNodes().length - 1] : i.getNodes()[0];
						if (e) {
							if (null !== Sn(o, e)) {
								const e = o.getFirstDescendant(),
									t = o.getLastDescendant();
								if (!e || !t) return false;
								const [n] = Yt(e),
									[r] = Yt(t),
									s = o.getCordsFromCellNode(n, l.table),
									i = o.getCordsFromCellNode(r, l.table),
									c = o.getDOMCellFromCordsOrThrow(s.x, s.y, l.table),
									a = o.getDOMCellFromCordsOrThrow(i.x, i.y, l.table);
								return l.$setAnchorCellForSelection(c), l.$setFocusCellForSelection(a, true), true;
							}
						}
						return false;
					}
					{
						let o = La(e, e => es(e) && !e.isInline());
						if (at(o) && (o = La(o, fo)), !o) return false;
						const r = "down" === n ? o.getNextSibling() : o.getPreviousSibling();
						if (fo(r) && l.tableNodeKey === r.getKey()) {
							const e = r.getFirstDescendant(),
								o = r.getLastDescendant();
							if (!e || !o) return false;
							const [l] = Yt(e),
								[s] = Yt(o),
								c = i.clone();
							return c.focus.set(("up" === n ? l : s).getKey(), "up" === n ? 0 : s.getChildrenSize(), "element"), Yn(t), Hl(c), true;
						}
					}
				}
			}
			return "down" === n && ro(e) && function (e, t) {
				if (!Er(e)) return false;
				const n = Cs(e.focus, "next"),
					o = Eu(t, "next");
				return null !== Uu(n.origin, o.origin) && Bu(n, o) < 0;
			}(i, o) && r.setShouldCheckSelectionForTable(o.getKey()), false;
		}
		if (Er(i)) {
			if ("backward" === n || "forward" === n) {
				return Un(e, t, i, t.shiftKey ? "extend" : "move", "backward" === n, o, l);
			}
			if (i.isCollapsed()) {
				const {
						anchor: s,
						focus: c
					} = i,
					a = La(s.getNode(), at),
					u = La(c.getNode(), at);
				if (!at(a) || !a.is(u)) return false;
				const h = In(a);
				if (h !== o && null != h) {
					const o = mn(h, e.getElementByKey(h.getKey()));
					if (null != o) return l.table = An(h, o), Xn(e, t, n, h, l, r);
				}
				const d = e.getElementByKey(a.__key),
					f = e.getElementByKey(s.key);
				if (null == f || null == d) return false;
				let p;
				if ("element" === s.type) p = f.getBoundingClientRect();else {
					const t = Pc(Cn(e));
					if (null === t || 0 === t.rangeCount) return false;
					const n = Uc(t, e.getRootElement());
					if (null === n) return false;
					p = n.getBoundingClientRect();
				}
				const m = "up" === n ? a.getFirstChild() : a.getLastChild();
				if (null == m) return false;
				const C = e.getElementByKey(m.__key);
				if (null == C) return false;
				const S = C.getBoundingClientRect();
				if ("up" === n ? S.top > p.top - p.height : p.bottom + p.height > S.bottom) {
					Yn(t);
					const e = o.getCordsFromCellNode(a, l.table);
					if (!t.shiftKey) return kn(l, o, e.x, e.y, n);
					{
						const t = o.getDOMCellFromCordsOrThrow(e.x, e.y, l.table);
						l.$setAnchorCellForSelection(t), l.$setFocusCellForSelection(t, true);
					}
					return true;
				}
			}
		} else if (on(i)) {
			const {
				anchor: r,
				focus: s,
				tableKey: c
			} = i;
			if (c !== o.getKey()) return false;
			const a = La(r.getNode(), at),
				u = La(s.getNode(), at),
				[h] = i.getNodes();
			fo(h) || ht(251);
			const d = mn(h, e.getElementByKey(h.getKey()));
			if (!at(a) || !at(u) || !fo(h) || null == d) return false;
			l.$updateTableTableSelection(i);
			const f = An(h, d),
				p = o.getCordsFromCellNode(a, f),
				m = o.getDOMCellFromCordsOrThrow(p.x, p.y, f);
			if (l.$setAnchorCellForSelection(m), Yn(t), t.shiftKey) {
				const [e, t, r] = Ut(o, a, u);
				return Hn(l, e, t, r, n);
			}
			return u.selectEnd(), true;
		}
		return false;
	}
	function Yn(e) {
		e.preventDefault(), e.stopImmediatePropagation(), e.stopPropagation();
	}
	function qn(e, t, n) {
		const o = Ws();
		"first" === e ? t.insertBefore(o) : t.insertAfter(o), o.append(...(n || [])), o.selectEnd();
	}
	function Jn(e, t, n) {
		const o = n.getParent();
		if (!o) return;
		const l = Pc(Cn(e));
		if (!l) return;
		const r = Hc(l, e.getRootElement()).anchorNode,
			s = e.getElementByKey(o.getKey()),
			i = mn(n, e.getElementByKey(n.getKey()));
		if (!r || !s || !i || !s.contains(r) || i.contains(r)) return;
		const c = La(t.anchor.getNode(), e => at(e));
		if (!c) return;
		const a = La(c, e => fo(e));
		if (!fo(a) || !a.is(n)) return;
		const [u, h] = Ut(n, c, c),
			d = u[0][0],
			f = u[u.length - 1][u[0].length - 1],
			{
				startRow: p,
				startColumn: m
			} = h,
			C = p === d.startRow && m === d.startColumn,
			S = p === f.startRow && m === f.startColumn;
		return C ? "first" : S ? "last" : void 0;
	}
	function Vn(e, t) {
		const {
				tableNode: n
			} = e.$lookup(),
			o = n.getCordsFromCellNode(t, e.table);
		return n.getDOMCellFromCordsOrThrow(o.x, o.y, e.table);
	}
	function jn(e, t, n) {
		return Sn(e, Bl(t, n));
	}
	function Gn(e) {
		return na(e) && "DIV" === e.nodeName;
	}
	function Qn(e, n, o) {
		let l = e.querySelector(":scope > colgroup");
		if (!o) return void (l && l.remove());
		l || (l = Wc().createElement("colgroup"), ba(l), e.insertBefore(l, e.firstChild));
		const r = [];
		for (let e = 0; e < n; e++) {
			const n = Wc().createElement("col"),
				l = o[e];
			l && (n.style.width = `${l}px`), r.push(n);
		}
		l.replaceChildren(...r);
	}
	function Zn(e, t, o) {
		if (!t.theme.tableAlignment) return;
		const l = [],
			r = [];
		for (const e of ["center", "right"]) {
			const n = t.theme.tableAlignment[e];
			n && (e === o ? r : l).push(n);
		}
		Xu(e, ...l), Gu(e, ...r);
	}
	const eo = new WeakSet();
	function to(e) {
		const {
			scrollable: t,
			scrollbar: n,
			tableElement: o
		} = e;
		if (0 === n.classList.length && 0 === function (e) {
			const t = e.style.display;
			e.style.display = "";
			const n = e.offsetHeight - e.clientHeight;
			return e.style.display = t, n;
		}(n)) return eo.add(n), n.style.display = "none", t.style.scrollbarWidth = "auto", () => {};
		const l = () => {
				n.scrollLeft !== t.scrollLeft && (n.scrollLeft = t.scrollLeft);
			},
			r = () => {
				t.scrollLeft !== n.scrollLeft && (t.scrollLeft = n.scrollLeft);
			};
		t.addEventListener("scroll", l, {
			passive: true
		}), n.addEventListener("scroll", r, {
			passive: true
		});
		let s = null;
		"undefined" != typeof ResizeObserver && (s = new ResizeObserver(() => {
			no(t, n);
		}), s.observe(t), s.observe(o));
		return no(t, n), () => {
			t.removeEventListener("scroll", l), n.removeEventListener("scroll", r), s && s.disconnect();
		};
	}
	function no(e, t) {
		if (eo.has(t)) return;
		const n = t.firstElementChild;
		if (!n || !na(n) || !e.isConnected) return;
		const l = e.ownerDocument.defaultView;
		if (!l) return void (t.style.display = "none");
		const r = l.getComputedStyle(e).overflowX,
			s = "auto" === r || "scroll" === r,
			i = e.scrollWidth,
			c = e.clientWidth,
			a = i + "px";
		n.style.width !== a && (n.style.width = a);
		const u = s && i > c;
		t.style.display = u ? "" : "none";
	}
	function oo(e) {
		if (!e.hasAttribute("data-lexical-sticky-scrollbar")) return null;
		const t = e.firstElementChild;
		if (!Gn(t)) return null;
		const n = t.querySelector(":scope > table");
		if (!pn(n)) return null;
		const o = t.nextElementSibling;
		return Gn(o) ? {
			scrollable: t,
			scrollbar: o,
			tableElement: n
		} : null;
	}
	const lo = new WeakSet();
	function ro(e = ua()) {
		return lo.has(e);
	}
	function so(e = ua()) {
		const t = un$2(e, "@lexical/table/Table");
		return !!t && t.output.hasStickyScrollbar.peek() && t.output.hasHorizontalScroll.peek();
	}
	function io(e, t) {
		t ? lo.add(e) : lo.delete(e);
	}
	class co extends ts {
		__rowStriping = false;
		__frozenColumnCount = 0;
		__frozenRowCount = 0;
		__colWidths = void 0;
		$config() {
			return this.config("table", {
				extends: ts,
				importDOM: {
					table: () => ({
						conversion: uo,
						priority: 1
					})
				}
			});
		}
		getColWidths() {
			return this.getLatest().__colWidths;
		}
		setColWidths(e) {
			const t = this.getWritable();
			return t.__colWidths = e, t;
		}
		afterCloneFrom(e) {
			super.afterCloneFrom(e), this.__colWidths = e.__colWidths, this.__rowStriping = e.__rowStriping, this.__frozenColumnCount = e.__frozenColumnCount, this.__frozenRowCount = e.__frozenRowCount;
		}
		updateFromJSON(e) {
			return super.updateFromJSON(e).setRowStriping(e.rowStriping || false).setFrozenColumns(e.frozenColumnCount || 0).setFrozenRows(e.frozenRowCount || 0).setColWidths(e.colWidths);
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				colWidths: this.getColWidths(),
				frozenColumnCount: this.__frozenColumnCount ? this.__frozenColumnCount : void 0,
				frozenRowCount: this.__frozenRowCount ? this.__frozenRowCount : void 0,
				rowStriping: this.__rowStriping ? this.__rowStriping : void 0
			};
		}
		extractWithChild(e, t, n) {
			return "html" === n;
		}
		getDOMSlot(e) {
			const t = pn(e) ? e : e.querySelector("table");
			return pn(t) || ht(229), super.getDOMSlot(e).withElement(t).withAfter(t.querySelector(":scope > colgroup"));
		}
		createDOM(e, o) {
			const l = Wc().createElement("table");
			this.__style && Go(l.style, this.__style);
			if (this.getColWidths()) {
				const e = Wc().createElement("colgroup");
				l.appendChild(e), ba(e);
			}
			if (Gu(l, e.theme.table), this.updateTableElement(null, l, e), ro(o)) {
				const r = so(o),
					s = function (e, o, l) {
						const r = Wc().createElement("div"),
							s = o.theme.tableScrollableWrapper;
						return s ? Gu(r, s) : r.style.overflowX = "auto", l && (r.style.scrollbarWidth = "none"), r.appendChild(e), r;
					}(l, e, r);
				if (this.updateTableWrapper(null, s, l, e), r) {
					const o = function (e) {
							const o = Wc(),
								l = o.createElement("div"),
								r = e.theme.tableStickyScrollbar;
							r ? Gu(l, r) : (l.style.position = "sticky", l.style.bottom = "0", l.style.overflowX = "scroll", l.style.overflowY = "hidden"), l.style.display = "none", l.setAttribute("aria-hidden", "true"), l.tabIndex = -1;
							const s = o.createElement("div");
							return s.style.height = "1px", s.style.width = "0px", l.appendChild(s), l;
						}(e),
						l = Wc().createElement("div");
					return l.setAttribute("data-lexical-sticky-scrollbar", "true"), l.appendChild(s), l.appendChild(o), ba(o), l;
				}
				return s;
			}
			return l;
		}
		updateTableWrapper(e, t, o, l) {
			this.__frozenColumnCount !== (e ? e.__frozenColumnCount : 0) && function (e, t, o, l) {
				l > 0 ? (Gu(e, o.theme.tableFrozenColumn), t.setAttribute("data-lexical-frozen-column", "true")) : (Xu(e, o.theme.tableFrozenColumn), t.removeAttribute("data-lexical-frozen-column"));
			}(t, o, l, this.__frozenColumnCount), this.__frozenRowCount !== (e ? e.__frozenRowCount : 0) && function (e, t, o, l) {
				l > 0 ? (Gu(e, o.theme.tableFrozenRow), t.setAttribute("data-lexical-frozen-row", "true")) : (Xu(e, o.theme.tableFrozenRow), t.removeAttribute("data-lexical-frozen-row"));
			}(t, o, l, this.__frozenRowCount);
		}
		updateTableElement(e, t, o) {
			this.__style !== (e ? e.__style : "") && Go(t.style, this.__style, e ? e.__style : ""), this.__rowStriping !== (!!e && e.__rowStriping) && function (e, t, o) {
				o ? (Gu(e, t.theme.tableRowStriping), e.setAttribute("data-lexical-row-striping", "true")) : (Xu(e, t.theme.tableRowStriping), e.removeAttribute("data-lexical-row-striping"));
			}(t, o, this.__rowStriping);
			const l = e ? e.getColumnCount() : 0,
				r = e ? e.__colWidths : void 0;
			this.getColumnCount() === l && this.getColWidths() === r || Qn(t, this.getColumnCount(), this.getColWidths()), Zn(t, o, this.getFormatType());
		}
		updateDOM(e, t, n) {
			const o = mn(this, t);
			if (t === o === ro()) return true;
			if (Gn(t)) {
				if (t.hasAttribute("data-lexical-sticky-scrollbar") !== so()) return true;
				const l = o.parentElement;
				Gn(l) && this.updateTableWrapper(e, l, o, n);
			}
			return this.updateTableElement(e, o, n), false;
		}
		scaleDOMColWidths(e, t) {
			const n = this.getColWidths();
			if (!n) return;
			Qn(mn(this, e), this.getColumnCount(), n.map(e => e * t));
		}
		exportDOM(e) {
			const n = super.exportDOM(e),
				{
					element: l
				} = n,
				r = !pn(l) && na(l) ? l.querySelector("table") : l;
			if (na(l) && pn(r) && r !== l) {
				l.dir && (r.dir = l.dir);
				const {
					paddingInlineStart: e
				} = l.style;
				e && (r.style.paddingInlineStart = e);
				const t = l.getAttribute("data-lexical-indent");
				null !== t && r.setAttribute("data-lexical-indent", t);
			}
			return {
				after: l => {
					if (n.after && (l = n.after(l)), !pn(l) && na(l) && (l = l.querySelector("table")), !pn(l)) return null;
					Zn(l, e._config, this.getFormatType());
					const [r] = Xt(this, null, null),
						s = new Map();
					for (const e of r) for (const t of e) {
						const e = t.cell.getKey();
						s.has(e) || s.set(e, {
							colSpan: t.cell.getColSpan(),
							startColumn: t.startColumn
						});
					}
					const i = new Set();
					for (const e of l.querySelectorAll(":scope > tr > [data-temporary-table-cell-lexical-key]")) {
						const t = e.getAttribute("data-temporary-table-cell-lexical-key");
						if (t) {
							const n = s.get(t);
							if (e.removeAttribute("data-temporary-table-cell-lexical-key"), n) {
								s.delete(t);
								for (let e = 0; e < n.colSpan; e++) i.add(e + n.startColumn);
							}
						}
					}
					const c = l.querySelector(":scope > colgroup");
					if (c) {
						const e = Array.from(l.querySelectorAll(":scope > colgroup > col")).filter((e, t) => i.has(t));
						c.replaceChildren(...e);
					}
					const a = l.querySelectorAll(":scope > tr");
					if (a.length > 0) {
						const e = Wc().createElement("tbody");
						for (const t of a) e.appendChild(t);
						l.append(e);
					}
					return l;
				},
				element: r
			};
		}
		canBeEmpty() {
			return false;
		}
		isShadowRoot() {
			return true;
		}
		getCordsFromCellNode(e, t) {
			const {
				rows: n,
				domRows: o
			} = t;
			for (let t = 0; t < n; t++) {
				const n = o[t];
				if (null != n) for (let o = 0; o < n.length; o++) {
					const l = n[o];
					if (null == l) continue;
					const {
							elem: r
						} = l,
						s = jn(this, r);
					if (null !== s && e.is(s)) return {
						x: o,
						y: t
					};
				}
			}
			throw new Error("Cell not found in table.");
		}
		getDOMCellFromCords(e, t, n) {
			const {
					domRows: o
				} = n,
				l = o[t];
			if (null == l) return null;
			const r = l[e < l.length ? e : l.length - 1];
			return null == r ? null : r;
		}
		getDOMCellFromCordsOrThrow(e, t, n) {
			const o = this.getDOMCellFromCords(e, t, n);
			if (!o) throw new Error("Cell not found at cords.");
			return o;
		}
		getCellNodeFromCords(e, t, n) {
			const o = this.getDOMCellFromCords(e, t, n);
			if (null == o) return null;
			const l = Bl(o.elem);
			return at(l) ? l : null;
		}
		getCellNodeFromCordsOrThrow(e, t, n) {
			const o = this.getCellNodeFromCords(e, t, n);
			if (!o) throw new Error("Node at cords not TableCellNode.");
			return o;
		}
		getRowStriping() {
			return Boolean(this.getLatest().__rowStriping);
		}
		setRowStriping(e) {
			const t = this.getWritable();
			return t.__rowStriping = e, t;
		}
		setFrozenColumns(e) {
			const t = this.getWritable();
			return t.__frozenColumnCount = e, t;
		}
		getFrozenColumns() {
			return this.getLatest().__frozenColumnCount;
		}
		setFrozenRows(e) {
			const t = this.getWritable();
			return t.__frozenRowCount = e, t;
		}
		getFrozenRows() {
			return this.getLatest().__frozenRowCount;
		}
		canSelectBefore() {
			return true;
		}
		canIndent() {
			return false;
		}
		getColumnCount() {
			const e = this.getFirstChild();
			if (!pt(e)) return 0;
			let t = 0;
			return e.getChildren().forEach(e => {
				at(e) && (t += e.getColSpan());
			}), t;
		}
	}
	function ao(e, t) {
		const n = e.getElementByKey(t.getKey());
		return null === n && ht(230), An(t, n);
	}
	function uo(e) {
		const t = ho();
		e.hasAttribute("data-lexical-row-striping") && t.setRowStriping(true), e.hasAttribute("data-lexical-frozen-column") && t.setFrozenColumns(1), e.hasAttribute("data-lexical-frozen-row") && t.setFrozenRows(1);
		const n = e.querySelector(":scope > colgroup");
		if (n) {
			let e = [];
			for (const t of n.querySelectorAll(":scope > col")) {
				let n = t.style.width || "";
				if (!ot.test(n) && (n = t.getAttribute("width") || "", !/^\d+$/.test(n))) {
					e = void 0;
					break;
				}
				e.push(parseFloat(n));
			}
			e && t.setColWidths(e);
		}
		return Ta(t, e), {
			after: e => jt$4(e, pt),
			node: t
		};
	}
	function ho() {
		return Mc(new co());
	}
	function fo(e) {
		return e instanceof co;
	}
	function go(e) {
		pt(e.getParent()) ? e.isEmpty() && e.append(Ws()) : e.remove();
	}
	function po(e) {
		fo(e.getParent()) ? Ht$5(e, at) : e.remove();
	}
	function mo(e) {
		Ht$5(e, pt);
		const [t] = Xt(e, null, null),
			n = t.reduce((e, t) => Math.max(e, t.length), 0),
			o = e.getChildren();
		for (let e = 0; e < t.length; ++e) {
			const l = o[e];
			if (!l) continue;
			pt(l) || ht(254, l.constructor.name, l.getType());
			const r = t[e].reduce((e, t) => t ? 1 + e : e, 0);
			if (r === n) continue;
			const s = l.getLastChild(),
				i = at(s) ? s.getHeaderStyles() & lt.ROW : lt.NO_STATUS;
			for (let e = r; e < n; ++e) {
				const e = ct(i);
				e.append(Ws()), l.append(e);
			}
		}
		const l = e.getColWidths(),
			r = e.getColumnCount();
		if (l && l.length !== r) {
			let t;
			if (r < l.length) t = l.slice(0, r);else if (l.length > 0) {
				const e = l[l.length - 1];
				t = [...l, ...Array(r - l.length).fill(e)];
			}
			e.setColWidths(t);
		}
	}
	function Co(e) {
		if (e.detail < 3 || !oa(e.target)) return false;
		const t = Bl(e.target);
		if (null === t) return false;
		const n = La(t, e => es(e) && !e.isInline());
		if (null === n) return false;
		return !!at(n.getParent()) && (n.select(0), true);
	}
	function So() {
		const e = ni();
		if (!Er(e)) return false;
		const t = In(e.anchor.getNode());
		if (null === t) return false;
		const n = $l();
		if (!n.is(t.getParent()) || 1 !== n.getChildrenSize()) return false;
		const [o] = Xt(t, null, null);
		if (0 === o.length || 0 === o[0].length) return false;
		const l = o[0][0];
		if (!l || !l.cell) return false;
		const r = o[o.length - 1],
			s = r[r.length - 1];
		if (!s || !s.cell) return false;
		const i = rn(t, l.cell, s.cell);
		return Hl(i), true;
	}
	function _o(e) {
		return e.registerNodeTransform(rt, e => {
			if (e.getColSpan() > 1 || e.getRowSpan() > 1) {
				const [,, t] = Yt(e),
					[n] = Ut(t, e, e),
					o = n.length,
					l = n[0].length;
				let r = t.getFirstChild();
				pt(r) || ht(175);
				const s = [];
				for (let e = 0; e < o; e++) {
					0 !== e && (r = r.getNextSibling(), pt(r) || ht(175));
					let t = null;
					for (let o = 0; o < l; o++) {
						const l = n[e][o],
							i = l.cell;
						if (l.startRow === e && l.startColumn === o) t = i, s.push(i);else if (i.getColSpan() > 1 || i.getRowSpan() > 1) {
							at(i) || ht(176);
							const e = ct(i.__headerState);
							null !== t ? t.insertAfter(e) : Ft$5(r, e);
						}
					}
				}
				for (const e of s) e.setColSpan(1), e.setRowSpan(1);
			}
		});
	}
	function bo(e, t = true) {
		const n = new an(),
			o = (o, l, r) => {
				const s = mn(o, r),
					i = Nn(o, s, e, t, n);
				n.observers.set(l, [i, s]);
			};
		return Qu(yn(e, n), e.registerCommand(We$2, () => xn(n, e), Vs), e.registerMutationListener(co, t => {
			e.read("latest", () => {
				for (const [e, l] of t) {
					const t = n.observers.get(e);
					if ("created" === l || "updated" === l) {
						const {
							tableNode: l,
							tableElement: r
						} = cn(e);
						void 0 === t ? o(l, e, r) : r !== t[1] && (n.removeObserver(e), o(l, e, r));
					} else "destroyed" === l && n.removeObserver(e);
				}
			});
		}, {
			skipInitialization: false
		}), () => {
			n.removeAllObservers();
		});
	}
	function wo(e, t) {
		e.hasNodes([co]) || ht(255);
		const {
			hasNestedTables: n = ee$2(false)
		} = t ?? {};
		return Qu(e.registerCommand(ut, e => function ({
			rows: e,
			columns: t,
			includeHeaders: n
		}, o) {
			const l = ni() || oi();
			if (!l || !Er(l)) return false;
			if (!o && In(l.anchor.getNode())) return false;
			const r = mt(Number(e), Number(t), n);
			Pt$5(r);
			const i = r.getFirstDescendant();
			return gr(i) && i.select(), true;
		}(e, n.peek()), Hs), e.registerCommand($e$2, (t, o) => e === o && function (e, t) {
			const {
				nodes: n,
				selection: o
			} = e;
			if (!n.some(e => fo(e) || ct$4(e).some(e => fo(e.node)))) {
				if (on(o)) {
					let e = "",
						t = false;
					for (const o of n) {
						const n = es(o) && !o.isInline();
						e.length > 0 && (n || t) && (e += "\n"), e += o.getTextContent(), t = n;
					}
					return o.insertRawText(e), true;
				}
				return false;
			}
			const l = on(o),
				r = Er(o);
			if (!(r && null !== La(o.anchor.getNode(), e => at(e)) && null !== La(o.focus.getNode(), e => at(e)) || l)) return false;
			if (1 === n.length && fo(n[0])) return Qt(n[0], o);
			if (r && t.peek() && !function (e) {
				if (on(e) && !e.focus.getNode().is(e.anchor.getNode())) return true;
				if (Er(e) && at(e.anchor.getNode()) && !e.anchor.getNode().is(e.focus.getNode())) return true;
				return false;
			}(o)) return false;
			return true;
		}(t, n), Hs), e.registerCommand(On$3, So, js), e.registerCommand(Ue$2, Co, Hs), e.registerNodeTransform(co, mo), e.registerNodeTransform(dt, po), e.registerNodeTransform(rt, go));
	}
	const yo = {
			$accepts: pt,
			$packageRun: e => e.every(at) ? [gt().splice(0, 0, e)] : [],
			name: "TableSchema"
		},
		No = {
			$accepts: at,
			name: "TableRowSchema"
		},
		xo = [{
			$import: (e, t) => {
				const n = ho();
				t.hasAttribute("data-lexical-row-striping") && n.setRowStriping(true), t.hasAttribute("data-lexical-frozen-column") && n.setFrozenColumns(1), t.hasAttribute("data-lexical-frozen-row") && n.setFrozenRows(1);
				const o = t.querySelector(":scope > colgroup");
				if (o) {
					let e = [];
					for (const t of o.querySelectorAll(":scope > col")) {
						let n = t.style.width || "";
						if (!ot.test(n) && (n = t.getAttribute("width") || "", !/^\d+$/.test(n))) {
							e = void 0;
							break;
						}
						e.push(parseFloat(n));
					}
					e && n.setColWidths(e);
				}
				return [n.splice(0, 0, jt$4(e.$importChildren(t), pt))];
			},
			match: /* @__PURE__ */$n$1.tag("table"),
			name: "@lexical/table/table"
		}, {
			$import: (e, t) => [gt(ot.test(t.style.height) ? parseFloat(t.style.height) : void 0).splice(0, 0, jt$4(e.$importChildren(t), at))],
			match: /* @__PURE__ */$n$1.tag("tr"),
			name: "@lexical/table/tr"
		}, {
			$import: (e, t) => {
				const n = "TH" === t.nodeName,
					o = ot.test(t.style.width) ? parseFloat(t.style.width) : void 0;
				let l = lt.NO_STATUS;
				if (n) {
					const e = t.getAttribute("scope");
					if ("col" === e) l = lt.COLUMN;else if ("row" === e) l = lt.ROW;else {
						const e = t.parentElement,
							n = ta(e) && (e.parentElement && "THEAD" === e.parentElement.nodeName || 0 === e.rowIndex),
							o = 0 === t.cellIndex;
						n && (l |= lt.ROW), o && (l |= lt.COLUMN), l === lt.NO_STATUS && (l = lt.ROW);
					}
				}
				const a = ct(l, t.colSpan, o);
				a.__rowSpan = t.rowSpan;
				const u = t.style.backgroundColor;
				"" !== u && (a.__backgroundColor = u);
				const h = t.style.verticalAlign;
				(function (e) {
					return "middle" === e || "bottom" === e;
				})(h) && (a.__verticalAlign = h);
				const d = e.get($e),
					f = d | function (e) {
						let t = 0;
						const n = e.fontWeight;
						"700" !== n && "bold" !== n || (t |= p$1), "italic" === e.fontStyle && (t |= y$1);
						const o = (e.textDecoration || "").split(" ");
						return o.includes("underline") && (t |= x$1), o.includes("line-through") && (t |= m$1), t;
					}(t.style),
					g = e.get(ve$1),
					p = t.style.color,
					m = p ? {
						...g,
						color: p
					} : g,
					C = [];
				f !== d && C.push(lt$3($e, f)), m !== g && C.push(lt$3(ve$1, m));
				const S = function (e) {
						const t = [];
						let n = null;
						const o = () => {
							if (null !== n) {
								const e = n.getFirstChild();
								ps(e) && 1 === n.getChildrenSize() && e.remove();
							}
						};
						for (const l of e) kc(l) || gr(l) || ps(l) ? null !== n ? n.append(l) : (n = Ws().append(l), t.push(n)) : (o(), n = null, t.push(l));
						return o(), 0 === t.length && t.push(Ws()), t;
					}(e.$importChildren(t, {
						context: C
					})),
					_ = n ? S : Ie(S, t);
				return [a.splice(0, 0, _)];
			},
			match: /* @__PURE__ */$n$1.tag("td", "th"),
			name: "@lexical/table/cell"
		}];
	const vo = {
			build: (e, t, n) => fe$2(t),
			config: {
				hasCellBackgroundColor: true,
				hasCellMerge: true,
				hasHorizontalScroll: true,
				hasNestedTables: false,
				hasStickyScrollbar: false,
				hasTabHandler: true
			},
			dependencies: [gn$1, [hn$1, {
				rules: xo
			}]],
			name: "@lexical/table/Table",
			nodes: () => [co, dt, rt],
			register(e, t, n) {
				const l = n.getOutput();
				let r = false;
				return Qu(de$2(() => {
					const t = l.hasHorizontalScroll.value,
						n = l.hasStickyScrollbar.value && t,
						o = ro(e);
					o !== t && io(e, t), o === t && r === n || e.update(Li), r = n;
				}), wo(e, l), de$2(() => bo(e, l.hasTabHandler.value)), de$2(() => {
					if (l.hasStickyScrollbar.value && l.hasHorizontalScroll.value) return e.registerRootListener(t => {
						if (t) return function (e) {
							const t = new Map();
							return Qu(() => {
								for (const {
									cleanup: e
								} of t.values()) e();
								t.clear();
							}, e.registerMutationListener(co, n => {
								for (const [l, r] of n) {
									const n = t.get(l);
									if ("destroyed" === r) {
										n && (n.cleanup(), t.delete(l));
										continue;
									}
									const s = e.getElementByKey(l),
										i = s && na(s) ? oo(s) : null;
									n && i && n.parts.scrollable === i.scrollable && n.parts.scrollbar === i.scrollbar && n.parts.tableElement === i.tableElement ? no(i.scrollable, i.scrollbar) : (n && (n.cleanup(), t.delete(l)), i && t.set(l, {
										cleanup: to(i),
										parts: i
									}));
								}
							}, {
								skipInitialization: false
							}));
						}(e);
					});
				}), de$2(() => l.hasCellMerge.value ? void 0 : _o(e)), de$2(() => l.hasCellBackgroundColor.value ? void 0 : e.registerNodeTransform(rt, e => {
					null !== e.getBackgroundColor() && e.setBackgroundColor(null);
				})));
			}
		},
		To = {
			dependencies: [vo],
			name: "@lexical/table/Import"
		};

	var LexicalTable_prod = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$computeTableCellRectBoundary: qt,
		$computeTableMap: Ut,
		$computeTableMapSkipCellCheck: Xt,
		$createTableCellNode: ct,
		$createTableNode: ho,
		$createTableNodeWithDimensions: mt,
		$createTableRowNode: gt,
		$createTableSelection: ln,
		$createTableSelectionFrom: rn,
		$deleteTableColumn: Et,
		$deleteTableColumnAtSelection: $t,
		$deleteTableColumn__EXPERIMENTAL: Ht,
		$deleteTableRowAtSelection: Mt,
		$deleteTableRow__EXPERIMENTAL: Wt,
		$findCellNode: Pn,
		$findTableNode: In,
		$getElementForTableNode: ao,
		$getNodeTriplet: Yt,
		$getTableAndElementByKey: cn,
		$getTableCellNodeFromLexicalNode: Ct,
		$getTableCellNodeRect: Gt,
		$getTableColumnIndexFromTableCellNode: wt,
		$getTableNodeFromLexicalNodeOrThrow: _t,
		$getTableRowIndexFromTableCellNode: bt,
		$getTableRowNodeFromTableCellNodeOrThrow: St,
		$insertTableColumn: At,
		$insertTableColumnAtNode: kt,
		$insertTableColumnAtSelection: Ot,
		$insertTableColumn__EXPERIMENTAL: Kt,
		$insertTableRow: xt,
		$insertTableRowAtNode: Ft,
		$insertTableRowAtSelection: Tt,
		$insertTableRow__EXPERIMENTAL: Rt,
		$isScrollableTablesActive: ro,
		$isSimpleTable: Jt,
		$isStickyScrollbarActive: so,
		$isTableCellNode: at,
		$isTableNode: fo,
		$isTableRowNode: pt,
		$isTableSelection: on,
		$mergeCells: Bt,
		$moveTableColumn: Vt,
		$moveTableRow: jt,
		$removeTableRowAtIndex: Nt,
		$setTableColumnIsHeader: en,
		$setTableRowIsHeader: Zt,
		$unmergeCell: Pt,
		$unmergeCellNode: It,
		INSERT_TABLE_COMMAND: ut,
		TableCellHeaderStates: lt,
		TableCellNode: rt,
		TableExtension: vo,
		TableImportExtension: To,
		TableImportRules: xo,
		TableNode: co,
		TableObserver: un,
		TableRowNode: dt,
		TableRowSchema: No,
		TableSchema: yo,
		applyTableHandlers: Nn,
		getDOMCellFromTarget: Rn,
		getTableElement: mn,
		getTableObserverFromTableElement: Tn,
		registerTableCellUnmergeTransform: _o,
		registerTablePlugin: wo,
		registerTableSelectionObserver: bo,
		setScrollableTablesActive: io
	});

	exports = __originalExports__;
	exports.Clipboard = LexicalClipboard_prod;
	exports.Core = Lexical_prod;
	exports.Extension = LexicalExtension_prod;
	exports.History = LexicalHistory_prod;
	exports.Html = LexicalHtml_prod;
	exports.Link = LexicalLink_prod;
	exports.List = LexicalList_prod;
	exports.RichText = LexicalRichText_prod;
	exports.Selection = LexicalSelection_prod;
	exports.Table = LexicalTable_prod;
	exports.Text = LexicalText_prod;
	exports.Utils = LexicalUtils_prod;

})(this.BX.UI.Lexical = this.BX.UI.Lexical || {});
