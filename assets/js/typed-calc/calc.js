function _classCallCheck(t, e) {
  if (!(t instanceof e))
    throw new TypeError('Cannot call a class as a function');
}
function peg$subclass(t, e) {
  function r() {
    this.constructor = t;
  }
  (r.prototype = e.prototype), (t.prototype = new r());
}
function peg$SyntaxError(t, e, r, n) {
  (this.message = t), (this.expected = e), (this.found = r), (this.location = n), (this.name =
    'SyntaxError'), 'function' == typeof Error.captureStackTrace &&
    Error.captureStackTrace(this, peg$SyntaxError);
}
function peg$parse(t, e) {
  function r(t, e) {
    return { type: 'literal', text: t, ignoreCase: e };
  }
  function n(t, e, r) {
    return { type: 'class', parts: t, inverted: e, ignoreCase: r };
  }
  function o() {
    return { type: 'end' };
  }
  function i(t) {
    return { type: 'other', description: t };
  }
  function a(e) {
    var r,
      n = Le[e];
    if (n) return n;
    for (r = e - 1; !Le[r]; ) r--;
    for (n = Le[r], n = { line: n.line, column: n.column }; e > r; )
      10 === t.charCodeAt(r) ? (n.line++, (n.column = 1)) : n.column++, r++;
    return (Le[e] = n), n;
  }
  function u(t, e) {
    var r = a(t),
      n = a(e);
    return {
      start: { offset: t, line: r.line, column: r.column },
      end: { offset: e, line: n.line, column: n.column }
    };
  }
  function c(t) {
    Me > Ze || (Ze > Me && ((Me = Ze), (Pe = [])), Pe.push(t));
  }
  function s(t, e, r) {
    return new peg$SyntaxError(peg$SyntaxError.buildMessage(t, e), t, e, r);
  }
  function l() {
    var e, r, n, o, i, a, u, s;
    if (((e = Ze), (r = m()), r !== R)) {
      for (
        n = [], 40 === t.charCodeAt(Ze)
          ? ((o = L), Ze++)
          : ((o = R), 0 === Ue && c(M));
        o !== R;

      )
        n.push(o), 40 === t.charCodeAt(Ze)
          ? ((o = L), Ze++)
          : ((o = R), 0 === Ue && c(M));
      n !== R
        ? (
            (o = m()),
            o !== R
              ? (
                  (i = p()),
                  i !== R
                    ? (
                        (a = m()),
                        a !== R
                          ? (
                              41 === t.charCodeAt(Ze)
                                ? ((u = P), Ze++)
                                : ((u = R), 0 === Ue && c(U)),
                              u === R && (u = null),
                              u !== R
                                ? (
                                    (s = m()),
                                    s !== R
                                      ? ((je = e), (r = O(i)), (e = r))
                                      : ((Ze = e), (e = R))
                                  )
                                : ((Ze = e), (e = R))
                            )
                          : ((Ze = e), (e = R))
                      )
                    : ((Ze = e), (e = R))
                )
              : ((Ze = e), (e = R))
          )
        : ((Ze = e), (e = R));
    } else (Ze = e), (e = R);
    return e;
  }
  function p() {
    var t, e, r, n;
    if (((t = Ze), (e = f()), e !== R)) {
      for (r = [], n = p(); n !== R; ) r.push(n), (n = p());
      r !== R ? ((je = t), (e = D(e, r)), (t = e)) : ((Ze = t), (t = R));
    } else (Ze = t), (t = R);
    return t;
  }
  function f() {
    var t;
    return (t = y()), t === R && (t = d()), t;
  }
  function d() {
    var e, r, n, o, i, a, u, s, l, f, d, y, h, g;
    if (((e = Ze), (r = m()), r !== R)) {
      for (
        n = [], 40 === t.charCodeAt(Ze)
          ? ((o = L), Ze++)
          : ((o = R), 0 === Ue && c(M));
        o !== R;

      )
        n.push(o), 40 === t.charCodeAt(Ze)
          ? ((o = L), Ze++)
          : ((o = R), 0 === Ue && c(M));
      n !== R
        ? (
            (o = m()),
            o !== R
              ? (
                  955 === t.charCodeAt(Ze)
                    ? ((i = G), Ze++)
                    : ((i = R), 0 === Ue && c(H)),
                  i !== R
                    ? (
                        (a = m()),
                        a !== R
                          ? (
                              (u = S()),
                              u !== R
                                ? (
                                    58 === t.charCodeAt(Ze)
                                      ? ((s = J), Ze++)
                                      : ((s = R), 0 === Ue && c(K)),
                                    s !== R
                                      ? (
                                          (l = A()),
                                          l !== R
                                            ? (
                                                8594 === t.charCodeAt(Ze)
                                                  ? ((f = Q), Ze++)
                                                  : ((f = R), 0 === Ue && c(V)),
                                                f !== R
                                                  ? (
                                                      (d = p()),
                                                      d !== R
                                                        ? (
                                                            (y = m()),
                                                            y !== R
                                                              ? (
                                                                  41 ===
                                                                  t.charCodeAt(
                                                                    Ze
                                                                  )
                                                                    ? (
                                                                        (h = P),
                                                                        Ze++
                                                                      )
                                                                    : (
                                                                        (h = R),
                                                                        0 ===
                                                                          Ue &&
                                                                          c(U)
                                                                      ),
                                                                  h === R &&
                                                                    (h = null),
                                                                  h !== R
                                                                    ? (
                                                                        (g = m()),
                                                                        g !== R
                                                                          ? (
                                                                              (je = e),
                                                                              (r = W(
                                                                                u,
                                                                                l,
                                                                                d
                                                                              )),
                                                                              (e = r)
                                                                            )
                                                                          : (
                                                                              (Ze = e),
                                                                              (e = R)
                                                                            )
                                                                      )
                                                                    : (
                                                                        (Ze = e),
                                                                        (e = R)
                                                                      )
                                                                )
                                                              : (
                                                                  (Ze = e),
                                                                  (e = R)
                                                                )
                                                          )
                                                        : ((Ze = e), (e = R))
                                                    )
                                                  : ((Ze = e), (e = R))
                                              )
                                            : ((Ze = e), (e = R))
                                        )
                                      : ((Ze = e), (e = R))
                                  )
                                : ((Ze = e), (e = R))
                            )
                          : ((Ze = e), (e = R))
                      )
                    : ((Ze = e), (e = R))
                )
              : ((Ze = e), (e = R))
          )
        : ((Ze = e), (e = R));
    } else (Ze = e), (e = R);
    return e;
  }
  function y() {
    var t;
    return (t = b()), t === R &&
      (
        (t = g()),
        t === R &&
          (
            (t = h()),
            t === R &&
              (
                (t = N()),
                t === R &&
                  (
                    (t = T()),
                    t === R &&
                      ((t = C()), t === R && ((t = S()), t === R && (t = x())))
                  )
              )
          )
      ), t;
  }
  function h() {
    var t, e, r;
    return (t = Ze), (e = v()), e !== R
      ? (
          (r = p()),
          r !== R ? ((je = t), (e = X(e, r)), (t = e)) : ((Ze = t), (t = R))
        )
      : ((Ze = t), (t = R)), t;
  }
  function g() {
    var t, e, r;
    return (t = Ze), (e = z()), e !== R
      ? (
          (r = p()),
          r !== R ? ((je = t), (e = Y(r)), (t = e)) : ((Ze = t), (t = R))
        )
      : ((Ze = t), (t = R)), t;
  }
  function v() {
    var t;
    return (t = $()), t === R && (t = _()), t;
  }
  function b() {
    var t, e, r, n, o, i, a;
    return (t = Ze), (e = I()), e !== R
      ? (
          (r = p()),
          r !== R
            ? (
                (n = k()),
                n !== R
                  ? (
                      (o = p()),
                      o !== R
                        ? (
                            (i = w()),
                            i !== R
                              ? (
                                  (a = p()),
                                  a !== R
                                    ? ((je = t), (e = te(r, o, a)), (t = e))
                                    : ((Ze = t), (t = R))
                                )
                              : ((Ze = t), (t = R))
                          )
                        : ((Ze = t), (t = R))
                    )
                  : ((Ze = t), (t = R))
              )
            : ((Ze = t), (t = R))
        )
      : ((Ze = t), (t = R)), t;
  }
  function A() {
    var t;
    return (t = B()), t === R && (t = F()), t;
  }
  function m() {
    var e, r;
    for (
      e = [], ee.test(t.charAt(Ze))
        ? ((r = t.charAt(Ze)), Ze++)
        : ((r = R), 0 === Ue && c(re));
      r !== R;

    )
      e.push(r), ee.test(t.charAt(Ze))
        ? ((r = t.charAt(Ze)), Ze++)
        : ((r = R), 0 === Ue && c(re));
    return e;
  }
  function S() {
    var e, r, n, o, i;
    if (
      (
        (e = Ze),
        (r = Ze),
        Ue++,
        (n = E()),
        Ue--,
        n === R ? (r = void 0) : ((Ze = r), (r = R)),
        r !== R
      )
    )
      if (((n = m()), n !== R)) {
        if (
          (
            (o = []),
            ne.test(t.charAt(Ze))
              ? ((i = t.charAt(Ze)), Ze++)
              : ((i = R), 0 === Ue && c(oe)),
            i !== R
          )
        )
          for (; i !== R; )
            o.push(i), ne.test(t.charAt(Ze))
              ? ((i = t.charAt(Ze)), Ze++)
              : ((i = R), 0 === Ue && c(oe));
        else o = R;
        o !== R
          ? (
              (i = m()),
              i !== R ? ((je = e), (r = ie(o)), (e = r)) : ((Ze = e), (e = R))
            )
          : ((Ze = e), (e = R));
      } else (Ze = e), (e = R);
    else (Ze = e), (e = R);
    return e;
  }
  function x() {
    var e, r, n, o, i, a, u, s;
    return (e = Ze), (r = m()), r !== R
      ? (
          40 === t.charCodeAt(Ze)
            ? ((n = L), Ze++)
            : ((n = R), 0 === Ue && c(M)),
          n !== R
            ? (
                (o = m()),
                o !== R
                  ? (
                      (i = y()),
                      i !== R
                        ? (
                            (a = m()),
                            a !== R
                              ? (
                                  41 === t.charCodeAt(Ze)
                                    ? ((u = P), Ze++)
                                    : ((u = R), 0 === Ue && c(U)),
                                  u !== R
                                    ? (
                                        (s = m()),
                                        s !== R
                                          ? ((je = e), (r = ae(i)), (e = r))
                                          : ((Ze = e), (e = R))
                                      )
                                    : ((Ze = e), (e = R))
                                )
                              : ((Ze = e), (e = R))
                          )
                        : ((Ze = e), (e = R))
                    )
                  : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function T() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 4) === ue
            ? ((n = ue), (Ze += 4))
            : ((n = R), 0 === Ue && c(ce)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((je = e), (r = se()), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function C() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 5) === le
            ? ((n = le), (Ze += 5))
            : ((n = R), 0 === Ue && c(pe)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((je = e), (r = fe()), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function N() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          48 === t.charCodeAt(Ze)
            ? ((n = de), Ze++)
            : ((n = R), 0 === Ue && c(ye)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((je = e), (r = he()), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function E() {
    var t;
    return (t = I()), t === R &&
      (
        (t = k()),
        t === R &&
          (
            (t = w()),
            t === R &&
              (
                (t = _()),
                t === R &&
                  (
                    (t = $()),
                    t === R &&
                      (
                        (t = B()),
                        t === R &&
                          (
                            (t = F()),
                            t === R && ((t = z()), t === R && (t = C()))
                          )
                      )
                  )
              )
          )
      ), t;
  }
  function I() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 2) === ge
            ? ((n = ge), (Ze += 2))
            : ((n = R), 0 === Ue && c(ve)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((r = [r, n, o]), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function k() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 4) === be
            ? ((n = be), (Ze += 4))
            : ((n = R), 0 === Ue && c(Ae)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((r = [r, n, o]), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function w() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 4) === me
            ? ((n = me), (Ze += 4))
            : ((n = R), 0 === Ue && c(Se)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((r = [r, n, o]), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function _() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 4) === xe
            ? ((n = xe), (Ze += 4))
            : ((n = R), 0 === Ue && c(Te)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((je = e), (r = Ce()), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function $() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 4) === Ne
            ? ((n = Ne), (Ze += 4))
            : ((n = R), 0 === Ue && c(Ee)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((je = e), (r = Ie()), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function B() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 3) === ke
            ? ((n = ke), (Ze += 3))
            : ((n = R), 0 === Ue && c(we)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((je = e), (r = _e()), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function F() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 4) === $e
            ? ((n = $e), (Ze += 4))
            : ((n = R), 0 === Ue && c(Be)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((je = e), (r = Fe()), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  function z() {
    var e, r, n, o;
    return (e = Ze), (r = m()), r !== R
      ? (
          t.substr(Ze, 6) === ze
            ? ((n = ze), (Ze += 6))
            : ((n = R), 0 === Ue && c(qe)),
          n !== R
            ? (
                (o = m()),
                o !== R ? ((je = e), (r = Re()), (e = r)) : ((Ze = e), (e = R))
              )
            : ((Ze = e), (e = R))
        )
      : ((Ze = e), (e = R)), e;
  }
  e = void 0 !== e ? e : {};
  var q,
    R = {},
    Z = { Program: l },
    j = l,
    L = '(',
    M = r('(', !1),
    P = ')',
    U = r(')', !1),
    O = function(t) {
      return t;
    },
    D = function(t, e) {
      return e && e.length
        ? ((e = e.pop()), { type: 'application', left: t, right: e })
        : t;
    },
    G = 'λ',
    H = r('λ', !1),
    J = ':',
    K = r(':', !1),
    Q = '→',
    V = r('→', !1),
    W = function(t, e, r) {
      return { type: 'abstraction', arg: { type: e, id: t }, body: r };
    },
    X = function(t, e) {
      return { type: 'arithmetic', operator: t, expression: e };
    },
    Y = function(t) {
      return { type: 'is_zero', expression: t };
    },
    te = function(t, e, r) {
      return { type: 'conditional_expression', condition: t, then: e, el: r };
    },
    ee = /^[ \t\r\n]/,
    re = n([' ', '	', '\r', '\n'], !1, !1),
    ne = /^[a-z]/,
    oe = n([['a', 'z']], !1, !1),
    ie = function(t) {
      return { name: t.join(''), type: 'identifier' };
    },
    ae = function(t) {
      return t;
    },
    ue = 'true',
    ce = r('true', !1),
    se = function() {
      return { type: 'literal', value: !0 };
    },
    le = 'false',
    pe = r('false', !1),
    fe = function() {
      return { type: 'literal', value: !1 };
    },
    de = '0',
    ye = r('0', !1),
    he = function() {
      return { type: 'literal', value: 0 };
    },
    ge = 'if',
    ve = r('if', !1),
    be = 'then',
    Ae = r('then', !1),
    me = 'else',
    Se = r('else', !1),
    xe = 'pred',
    Te = r('pred', !1),
    Ce = function() {
      return 'pred';
    },
    Ne = 'succ',
    Ee = r('succ', !1),
    Ie = function() {
      return 'succ';
    },
    ke = 'Nat',
    we = r('Nat', !1),
    _e = function() {
      return 'Nat';
    },
    $e = 'Bool',
    Be = r('Bool', !1),
    Fe = function() {
      return 'Bool';
    },
    ze = 'iszero',
    qe = r('iszero', !1),
    Re = function() {
      return 'iszero';
    },
    Ze = 0,
    je = 0,
    Le = [{ line: 1, column: 1 }],
    Me = 0,
    Pe = [],
    Ue = 0;
  if ('startRule' in e) {
    if (!(e.startRule in Z))
      throw Error('Can\'t start parsing from rule "' + e.startRule + '".');
    j = Z[e.startRule];
  }
  if (((q = j()), q !== R && Ze === t.length)) return q;
  throw (
    q !== R && Ze < t.length && c(o()),
    s(
      Pe,
      Me < t.length ? t.charAt(Me) : null,
      Me < t.length ? u(Me, Me + 1) : u(Me, Me)
    )
  );
}
var _createClass = (function() {
  function t(t, e) {
    for (var r = 0; r < e.length; r++) {
      var n = e[r];
      (n.enumerable = n.enumerable || !1), (n.configurable = !0), 'value' in
        n && (n.writable = !0), Object.defineProperty(t, n.key, n);
    }
  }
  return function(e, r, n) {
    return r && t(e.prototype, r), n && t(e, n), e;
  };
})();
peg$subclass(peg$SyntaxError, Error), (peg$SyntaxError.buildMessage = function(
  t,
  e
) {
  function r(t) {
    return t.charCodeAt(0).toString(16).toUpperCase();
  }
  function n(t) {
    return t
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g, function(t) {
        return '\\x0' + r(t);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(t) {
        return '\\x' + r(t);
      });
  }
  function o(t) {
    return t
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g, '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g, function(t) {
        return '\\x0' + r(t);
      })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(t) {
        return '\\x' + r(t);
      });
  }
  function i(t) {
    return c[t.type](t);
  }
  function a(t) {
    var e,
      r,
      n = Array(t.length);
    for (e = 0; e < t.length; e++) n[e] = i(t[e]);
    if ((n.sort(), n.length > 0)) {
      for (e = 1, r = 1; e < n.length; e++)
        n[e - 1] !== n[e] && ((n[r] = n[e]), r++);
      n.length = r;
    }
    switch (n.length) {
      case 1:
        return n[0];
      case 2:
        return n[0] + ' or ' + n[1];
      default:
        return n.slice(0, -1).join(', ') + ', or ' + n[n.length - 1];
    }
  }
  function u(t) {
    return t ? '"' + n(t) + '"' : 'end of input';
  }
  var c = {
    literal: function(t) {
      return '"' + n(t.text) + '"';
    },
    class: function(t) {
      var e,
        r = '';
      for (e = 0; e < t.parts.length; e++)
        r +=
          t.parts[e] instanceof Array
            ? o(t.parts[e][0]) + '-' + o(t.parts[e][1])
            : o(t.parts[e]);
      return '[' + (t.inverted ? '^' : '') + r + ']';
    },
    any: function() {
      return 'any character';
    },
    end: function() {
      return 'end of input';
    },
    other: function(t) {
      return t.description;
    }
  };
  return 'Expected ' + a(t) + ' but ' + u(e) + ' found.';
});
var SymbolTableImpl = (function() {
    function t() {
      _classCallCheck(this, t), (this.table = []);
    }
    return _createClass(t, [
      {
        key: 'push',
        value: function(t) {
          this.table.push(t);
        }
      },
      {
        key: 'lookup',
        value: function(t) {
          for (var e = this.table.length - 1; e >= 0; e -= 1) {
            var r = this.table[e].get(t);
            if (void 0 !== r) return r;
          }
          return void 0;
        }
      }
    ]), t;
  })(),
  Scope = (function() {
    function t() {
      _classCallCheck(this, t), (this.map = {});
    }
    return _createClass(t, [
      {
        key: 'add',
        value: function(t, e) {
          this.map[t] = e;
        }
      },
      {
        key: 'get',
        value: function(t) {
          return this.map[t];
        }
      }
    ]), t;
  })(),
  ASTNodes = {
    Abstraction: 'abstraction',
    Condition: 'conditional_expression',
    Identifier: 'identifier',
    Literal: 'literal',
    Arithmetic: 'arithmetic',
    IsZero: 'is_zero',
    Application: 'application'
  },
  SymbolTable = new SymbolTableImpl(),
  Types = { Natural: 'Nat', Boolean: 'Bool' },
  typeEq = function t(e, r) {
    if (e instanceof Array && r instanceof Array) {
      if (e.length !== r.length) return !1;
      for (var n = 0; n < e.length; n += 1) if (!t(e[n], r[n])) return !1;
      return !0;
    }
    return 'string' == typeof e && 'string' == typeof r ? e === r : !1;
  },
  Check = function e(t, r) {
    if (((r = r || []), !t)) return { diagnostics: r };
    if (t.type === ASTNodes.Literal)
      return 0 === t.value
        ? { diagnostics: r, type: Types.Natural }
        : t.value === !1 || t.value === !0
          ? { diagnostics: r, type: Types.Boolean }
          : (r.push('Unknown type literal'), { diagnostics: r });
    if (t.type === ASTNodes.Identifier)
      return { diagnostics: r, type: SymbolTable.lookup(t.name) };
    if (t.type === ASTNodes.Condition) {
      if (!t.then || !t.el || !t.condition)
        return r.push('No condition for a conditional expression'), {
          diagnostics: r
        };
      var n = e(t.condition);
      r = r.concat(n.diagnostics);
      var o = n.type;
      if (!typeEq(o, Types.Boolean))
        return r.push('Incorrect type of condition of condition'), {
          diagnostics: r
        };
      var i = e(t.then);
      r = r.concat(i.diagnostics);
      var a = i.type,
        u = e(t.el);
      r = r.concat(u.diagnostics);
      var c = u.type;
      return typeEq(a, c)
        ? i
        : (r.push('Incorrect type of then/else branches'), { diagnostics: r });
    }
    if (t.type === ASTNodes.Abstraction) {
      var s = new Scope();
      if ((s.add(t.arg.id.name, t.arg.type), SymbolTable.push(s), !t.body))
        return r.push('No body of a function'), { diagnostics: r };
      var l = e(t.body),
        p = l.type;
      return (r = r.concat(l.diagnostics)), p
        ? { diagnostics: r, type: [t.arg.type, p] }
        : (r.push('Incorrect type of the body'), { diagnostics: r });
    }
    if (t.type === ASTNodes.IsZero) {
      var f = e(t.expression);
      r = r.concat(f.diagnostics);
      var d = f.type;
      return typeEq(d, Types.Natural)
        ? { diagnostics: r, type: Types.Boolean }
        : (r.push('Incorrect type of IsZero'), { diagnostics: r });
    }
    if (t.type === ASTNodes.Arithmetic) {
      var y = e(t.expression);
      r = r.concat(y.diagnostics);
      var h = y.type;
      return typeEq(h, Types.Natural)
        ? { diagnostics: r, type: Types.Natural }
        : (r.push('Incorrect type of ' + t.operation), { diagnostics: r });
    }
    if (t.type === ASTNodes.Application) {
      var g = e(t.left),
        v = g.type || [];
      r = r.concat(g.diagnostics);
      var b = e(t.right),
        A = b.type || [];
      return (r = r.concat(b.diagnostics)), v.length
        ? t.right && v[0] !== A
          ? (r.push('Incorrect type of application'), { diagnostics: r })
          : { diagnostics: r, type: v[1] }
        : { diagnostics: r };
    }
    return { diagnostics: r };
  },
  SymbolTable2 = new SymbolTableImpl(),
  Eval = function r(t) {
    if (!t) return null;
    if (t.type === ASTNodes.Literal) return t.value;
    if (t.type === ASTNodes.Identifier) return SymbolTable2.lookup(t.name);
    if (t.type === ASTNodes.Condition) return r(r(t.condition) ? t.then : t.el);
    if (t.type === ASTNodes.Abstraction) {
      var e = new Scope();
      return function(n) {
        return e.add(t.arg.id.name, n), SymbolTable2.push(e), r(t.body);
      };
    }
    if (t.type === ASTNodes.IsZero) return 0 === r(t.expression);
    if (t.type === ASTNodes.Arithmetic) {
      var n = t.operator,
        o = r(t.expression);
      switch (n) {
        case 'succ':
          return o + 1;
        case 'pred':
          return 0 > o - 1 ? o : o - 1;
      }
    } else if (t.type === ASTNodes.Application) {
      var i = r(t.left),
        a = r(t.right);
      return i(a);
    }
    return !0;
  };
