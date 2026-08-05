/**
 * Public player game client — chat UI (output + bottom input).
 * Loaded by site.js when MODE === "play".
 *
 * Plain msg → .play-pre with MUSH colors.
 * data.ui.components → structured layout blocks.
 */
(function (global) {
  "use strict";

  var MAX_MSG = 400;
  var messages = [];
  var socket = null;
  var status = "idle";
  var rootEl = null;

  var FG = {
    x: "var(--site-text-muted)",
    r: "#e85d5d",
    g: "#4caf7a",
    y: "#d4a84b",
    b: "#6b9fd4",
    m: "#c77dbe",
    c: "#5cb8b2",
    w: "var(--site-text)",
  };

  function token() {
    try {
      return sessionStorage.getItem("ursamu.webAdmin.token") || "";
    } catch (_) {
      return "";
    }
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** MUSH / truecolor → safe HTML spans. */
  function mushToHtml(raw) {
    if (raw == null) return "";
    // deno-lint-ignore no-control-regex
    var s = String(raw).replace(/\u001b\[[0-9;]*m/g, "");
    s = s.replace(/%r/gi, "\n").replace(/%t/gi, "\t")
      .replace(/%b/gi, " ");

    var style = {};
    var parts = [];
    var buf = "";

    function flush() {
      if (!buf) return;
      var text = esc(buf);
      buf = "";
      var css = [];
      if (style.color) css.push("color:" + style.color);
      if (style.bold) css.push("font-weight:700");
      if (style.underline) css.push("text-decoration:underline");
      if (style.italic) css.push("font-style:italic");
      if (css.length) {
        parts.push(
          '<span class="mush-text" style="' +
            css.join(";") + '">' + text + "</span>",
        );
      } else {
        parts.push(text);
      }
    }

    var re =
      /%c([nNrRgGyYbBmMcCwWxXhHuUiI])|%c<#([0-9a-fA-F]{6})>|<#([0-9a-fA-F]{6})>|%x([nNrRgGyYbBmMcCwWxXhHuUiI])/g;
    var last = 0;
    var m;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) {
        buf += s.slice(last, m.index);
        flush();
      }
      last = m.index + m[0].length;
      if (m[2] || m[3]) {
        flush();
        style = Object.assign({}, style, {
          color: "#" + (m[2] || m[3]),
        });
        continue;
      }
      var code = String(m[1] || m[4] || "").toLowerCase();
      flush();
      if (code === "n") {
        style = {};
        continue;
      }
      if (code === "h") {
        style = Object.assign({}, style, { bold: true });
        continue;
      }
      if (code === "u") {
        style = Object.assign({}, style, { underline: true });
        continue;
      }
      if (code === "i") {
        style = Object.assign({}, style, { italic: true });
        continue;
      }
      if (FG[code]) {
        style = Object.assign({}, style, { color: FG[code] });
      }
    }
    if (last < s.length) {
      buf += s.slice(last);
      flush();
    }
    return parts.join("");
  }

  function hasLayout(data) {
    if (!data || typeof data !== "object") return false;
    var ui = data.ui;
    return !!(ui && typeof ui === "object" &&
      (Array.isArray(ui.components) || ui.type === "layout"));
  }

  function cellHtml(v) {
    if (v == null) return "";
    return mushToHtml(String(v));
  }

  function renderLayout(ui) {
    var comps = Array.isArray(ui.components) ? ui.components : [];
    var html = '<div class="play-layout">';
    for (var i = 0; i < comps.length; i++) {
      var c = comps[i] || {};
      var t = String(c.type || "");
      if (t === "header") {
        html += '<header class="play-layout__header"><h2 class="' +
          'play-layout__title">' +
          cellHtml(c.title || c.content || "") +
          "</h2></header>";
      } else if (t === "table" && Array.isArray(c.content)) {
        html += '<table class="play-layout__table"><tbody>';
        for (var r = 0; r < c.content.length; r++) {
          var row = c.content[r];
          html += "<tr>";
          var cells = Array.isArray(row) ? row : [row];
          for (var ci = 0; ci < cells.length; ci++) {
            html += "<td>" + cellHtml(cells[ci]) + "</td>";
          }
          html += "</tr>";
        }
        html += "</tbody></table>";
      } else if (t === "list") {
        var items = Array.isArray(c.content)
          ? c.content
          : [c.content];
        html += '<ul class="play-layout__list">';
        for (var li = 0; li < items.length; li++) {
          html += "<li>" + cellHtml(items[li]) + "</li>";
        }
        html += "</ul>";
      } else if (t === "panel") {
        html += '<section class="play-layout__panel">';
        if (c.title) {
          html += '<h3 class="play-layout__panel-title">' +
            esc(String(c.title)) + "</h3>";
        }
        html += '<div class="play-layout__panel-body">' +
          cellHtml(
            typeof c.content === "string"
              ? c.content
              : JSON.stringify(c.content),
          ) +
          "</div></section>";
      } else if (typeof c.content === "string") {
        html += '<div class="play-pre">' +
          mushToHtml(c.content) + "</div>";
      }
    }
    html += "</div>";
    return html;
  }

  function renderMessages() {
    var out = rootEl && rootEl.querySelector(".play-output");
    if (!out) return;
    if (!messages.length) {
      out.innerHTML =
        '<p class="play-output__empty">Connecting to the world…</p>';
      return;
    }
    var html = "";
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      html += '<div class="play-msg">';
      if (hasLayout(m.data)) {
        html += renderLayout(m.data.ui);
      } else if (m.msg) {
        html += '<div class="play-pre">' +
          mushToHtml(m.msg) + "</div>";
      }
      html += "</div>";
    }
    out.innerHTML = html;
    out.scrollTop = out.scrollHeight;
  }

  function setStatus(s) {
    status = s;
    var el = rootEl && rootEl.querySelector(".play-root__status");
    if (!el) return;
    el.textContent = s;
    el.className = "play-root__status" +
      (s === "open" ? " is-open" : "") +
      (s === "error" ? " is-error" : "");
    var inp = rootEl.querySelector(".play-prompt__input");
    var btn = rootEl.querySelector(".play-prompt__send");
    var dis = s !== "open";
    if (inp) inp.disabled = dis;
    if (btn) btn.disabled = dis;
  }

  function setError(msg) {
    var el = rootEl && rootEl.querySelector(".play-error");
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function push(m) {
    messages.push(m);
    if (messages.length > MAX_MSG) {
      messages = messages.slice(-MAX_MSG);
    }
    renderMessages();
  }

  function wsUrl() {
    var proto = location.protocol === "https:" ? "wss:" : "ws:";
    var host = location.hostname;
    var port = 4202;
    try {
      var cfg = global.__SITE_CFG__;
      if (cfg && cfg.server) {
        port = Number(cfg.server.wsPort || cfg.server.ws || 4202);
      }
    } catch (_) { /* ignore */ }
    if (String(port) === String(location.port)) {
      return proto + "//" + location.host;
    }
    return proto + "//" + host + ":" + port;
  }

  function fetchWsPort(cb) {
    fetch("/api/v1/config")
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data && data.server) {
          global.__SITE_CFG__ = data;
        }
        cb();
      })
      .catch(function () {
        cb();
      });
  }

  function connect() {
    var t = token();
    if (!t) {
      setStatus("error");
      setError("Sign in to play.");
      return;
    }
    if (socket) {
      try {
        socket.close();
      } catch (_) { /* ignore */ }
      socket = null;
    }
    setStatus("connecting");
    setError("");
    fetchWsPort(function () {
      try {
        socket = new WebSocket(wsUrl());
      } catch (e) {
        setStatus("error");
        setError(String(e && e.message || e));
        return;
      }
      socket.onopen = function () {
        setStatus("open");
        socket.send(JSON.stringify({ type: "auth", token: t }));
        setTimeout(function () {
          if (socket && socket.readyState === 1) {
            socket.send(JSON.stringify({ msg: "look" }));
          }
        }, 200);
      };
      socket.onmessage = function (ev) {
        try {
          var payload = JSON.parse(String(ev.data));
          if (
            payload.msg != null ||
            (payload.data && Object.keys(payload.data).length)
          ) {
            push({
              msg: payload.msg,
              data: payload.data,
            });
          }
        } catch (_) {
          push({ msg: String(ev.data) });
        }
      };
      socket.onerror = function () {
        setStatus("error");
        setError("Connection error");
      };
      socket.onclose = function () {
        setStatus("closed");
        socket = null;
      };
    });
  }

  function sendCmd(line) {
    var t = String(line || "").trim();
    if (!t || !socket || socket.readyState !== 1) return;
    push({ msg: "%ch>%cn " + t });
    socket.send(JSON.stringify({ msg: t }));
  }

  function mount(mainEl) {
    if (!mainEl) return;
    // Figma client: output + cream rule + input | SEND (enter submits)
    mainEl.innerHTML =
      '<div class="play-root" id="play-root">' +
      '<span class="play-root__status" aria-live="polite">idle</span>' +
      '<p class="play-error" hidden></p>' +
      '<div class="play-output" role="log" aria-live="polite" ' +
      'aria-relevant="additions"></div>' +
      '<hr class="play-prompt-rule" aria-hidden="true" />' +
      '<form class="play-prompt" id="play-form" autocomplete="off">' +
      '<label class="visually-hidden" for="play-cmd">Command</label>' +
      '<input id="play-cmd" class="play-prompt__input" type="text" ' +
      'name="cmd" spellcheck="false" autocomplete="off" ' +
      'placeholder="Enter something..." disabled />' +
      '<button type="submit" class="play-prompt__send" disabled>' +
      "SEND</button>" +
      "</form></div>";

    rootEl = document.getElementById("play-root");
    messages = [];
    renderMessages();

    var form = document.getElementById("play-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = form.querySelector(".play-prompt__input");
        if (!inp) return;
        var v = inp.value;
        inp.value = "";
        sendCmd(v);
        inp.focus();
      });
    }

    connect();
    var inp2 = rootEl && rootEl.querySelector(".play-prompt__input");
    if (inp2) {
      setTimeout(function () {
        try {
          inp2.focus();
        } catch (_) { /* ignore */ }
      }, 100);
    }
  }

  function destroy() {
    if (socket) {
      try {
        socket.close();
      } catch (_) { /* ignore */ }
      socket = null;
    }
    rootEl = null;
    messages = [];
  }

  global.SitePlay = {
    mount: mount,
    destroy: destroy,
    connect: connect,
    sendCmd: sendCmd,
  };
})(typeof window !== "undefined" ? window : globalThis);
