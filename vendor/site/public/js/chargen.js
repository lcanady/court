/**
 * Public chargen FE — stepper matching in-game +cg stages.
 * Loaded by site.js when MODE === "chargen".
 *
 * API: /api/v1/cofd/chargen/*
 * Demo: ?demo=1 uses local state (Playwright / offline).
 */
(function (global) {
  "use strict";

  var API = "/api/v1/cofd/chargen";
  var state = null;
  var opts = {};
  var busy = false;
  var demo = false;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function token() {
    try {
      return sessionStorage.getItem("ursamu.webAdmin.token") || "";
    } catch (_) {
      return "";
    }
  }

  function authHeaders() {
    var h = { "Content-Type": "application/json" };
    var t = token();
    if (t) h.Authorization = "Bearer " + t;
    return h;
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function titleCase(s) {
    return String(s || "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  // ── Demo store (Playwright / offline) ──────────────────────────

  function demoInit() {
    return {
      ok: true,
      started: true,
      stage: 1,
      maxStage: 7,
      stageName: "Concept & Anchors",
      stages: [
        { stage: 1, name: "Concept & Anchors", short: "Concept" },
        { stage: 2, name: "Template", short: "Template" },
        { stage: 3, name: "Template Details", short: "Detail" },
        { stage: 4, name: "Attributes", short: "Attrs" },
        { stage: 5, name: "Skills", short: "Skills" },
        { stage: 6, name: "Merits", short: "Merits" },
        { stage: 7, name: "Powers", short: "Powers" },
      ],
      sheet: {
        template: "mortal",
        concept: "",
        virtue: "",
        vice: "",
        attributes: {
          intelligence: 1, wits: 1, resolve: 1,
          strength: 1, dexterity: 1, stamina: 1,
          presence: 1, manipulation: 1, composure: 1,
        },
        skills: {},
        specialties: {},
        merits: {},
        customFields: {},
        powers: {},
        contracts: [],
        moralityValue: 7,
        powerStatValue: 1,
        energyCurrent: 0,
        advantages: {
          willpowerMax: 2,
          willpowerCurrent: 2,
          size: 5,
        },
      },
      isSubmitted: false,
      isApproved: false,
      canAdvance: false,
      validationError: "Concept cannot be empty or 'Unknown'.",
      templateMeta: {
        key: "mortal",
        name: "Mortal",
        customFields: [],
      },
    };
  }

  function demoValidate(st) {
    var sh = st.sheet;
    var stage = st.stage;
    if (stage === 1) {
      if (!sh.concept || !sh.virtue || !sh.vice) {
        return "Fill concept, virtue, and vice.";
      }
    }
    if (stage === 2 && !sh.template) {
      return "Choose a template.";
    }
    if (stage === 3 && sh.template === "changeling") {
      var need = ["seeming", "kith", "court", "favored", "needle", "thread"];
      for (var i = 0; i < need.length; i++) {
        if (!(sh.customFields || {})[need[i]]) {
          return "Set " + need[i] + ".";
        }
      }
    }
    if (stage === 4) {
      var a = sh.attributes || {};
      var m = (a.intelligence || 1) - 1 + (a.wits || 1) - 1 +
        (a.resolve || 1) - 1;
      var p = (a.strength || 1) - 1 + (a.dexterity || 1) - 1 +
        (a.stamina || 1) - 1;
      var s = (a.presence || 1) - 1 + (a.manipulation || 1) - 1 +
        (a.composure || 1) - 1;
      var xs = [m, p, s].slice().sort(function (x, y) {
        return x - y;
      });
      if (xs[0] !== 3 || xs[1] !== 4 || xs[2] !== 5) {
        return "Attribute extras must be 5/4/3. " +
          "M+" + m + " P+" + p + " S+" + s;
      }
    }
    return null;
  }

  function demoRefresh() {
    var err = demoValidate(state);
    state.canAdvance = !err;
    state.validationError = err;
    state.stageName = (state.stages.find(function (s) {
      return s.stage === state.stage;
    }) || {}).name || "Stage";
    if (state.sheet.template === "changeling") {
      state.maxStage = 7;
      state.templateMeta = {
        key: "changeling",
        name: "Changeling: The Lost",
        customFields: [
          "seeming", "kith", "court", "favored",
          "needle", "thread", "mask", "mien",
        ],
      };
    } else if (state.sheet.template === "werewolf") {
      state.maxStage = 8;
      state.templateMeta = {
        key: "werewolf",
        name: "Werewolf: The Forsaken",
        customFields: ["auspice", "tribe"],
      };
    } else {
      state.maxStage = 6;
      state.templateMeta = {
        key: "mortal",
        name: "Mortal",
        customFields: [],
      };
    }
    state.stages = state.stages.filter(function (s) {
      return s.stage <= state.maxStage;
    });
    while (state.stages.length < state.maxStage) {
      var n = state.stages.length + 1;
      state.stages.push({
        stage: n,
        name: "Stage " + n,
        short: "S" + n,
      });
    }
  }

  // ── API ────────────────────────────────────────────────────────

  async function api(method, path, body) {
    if (demo) return demoApi(method, path, body);
    var res = await fetch(API + path, {
      method: method,
      credentials: "same-origin",
      headers: authHeaders(),
      body: body != null ? JSON.stringify(body) : undefined,
    });
    var data = {};
    try {
      data = await res.json();
    } catch (_) { /* empty */ }
    if (!res.ok) {
      var err = new Error(data.error || ("HTTP " + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function demoApi(method, path, body) {
    if (!state) state = demoInit();
    if (path === "" && method === "GET") {
      demoRefresh();
      return Promise.resolve(state);
    }
    if (path === "/start") {
      state = demoInit();
      if (body && body.reset) { /* fresh */ }
      demoRefresh();
      return Promise.resolve(state);
    }
    if (path === "/set") {
      var trait = String((body && body.trait) || "").toLowerCase();
      var value = String((body && body.value) || "");
      var sh = state.sheet;
      if (trait === "concept") sh.concept = value;
      else if (trait === "virtue") sh.virtue = value;
      else if (trait === "vice") sh.vice = value;
      else if (trait === "template") sh.template = value.toLowerCase();
      else if (
        [
          "seeming", "kith", "court", "favored",
          "needle", "thread", "mask", "mien",
          "auspice", "tribe",
        ].indexOf(trait) >= 0
      ) {
        sh.customFields = sh.customFields || {};
        sh.customFields[trait] = value;
      } else if (sh.attributes && trait in sh.attributes) {
        sh.attributes[trait] = Math.max(
          1,
          Math.min(5, parseInt(value, 10) || 1),
        );
      } else {
        sh.skills = sh.skills || {};
        sh.skills[trait] = Math.max(
          0,
          Math.min(5, parseInt(value, 10) || 0),
        );
      }
      demoRefresh();
      return Promise.resolve(state);
    }
    if (path === "/next") {
      demoRefresh();
      if (!state.canAdvance) {
        return Promise.reject(
          Object.assign(new Error(state.validationError), {
            status: 400,
            data: state,
          }),
        );
      }
      if (state.stage < state.maxStage) state.stage += 1;
      demoRefresh();
      return Promise.resolve(state);
    }
    if (path === "/back") {
      if (state.stage > 1) state.stage -= 1;
      demoRefresh();
      return Promise.resolve(state);
    }
    return Promise.resolve(state);
  }

  async function loadOptions() {
    var topics = [
      "virtues", "vices", "templates", "seemings",
      "courts", "regalia", "attributes", "skills",
    ];
    if (demo) {
      opts = {
        virtues: {
          items: [
            { name: "Just" }, { name: "Loyal" },
            { name: "Courageous" }, { name: "Honest" },
          ],
        },
        vices: {
          items: [
            { name: "Greedy" }, { name: "Ambitious" },
            { name: "Wrathful" }, { name: "Prideful" },
          ],
        },
        templates: {
          items: [
            { key: "mortal", name: "Mortal" },
            { key: "changeling", name: "Changeling: The Lost" },
            { key: "werewolf", name: "Werewolf: The Forsaken" },
          ],
        },
        seemings: {
          items: [
            { name: "Beast" }, { name: "Darkling" },
            { name: "Elemental" }, { name: "Fairest" },
            { name: "Ogre" }, { name: "Wizened" },
          ],
        },
        courts: {
          items: [
            { name: "Spring" }, { name: "Summer" },
            { name: "Autumn" }, { name: "Winter" },
          ],
        },
        regalia: {
          items: [
            { name: "Crown" }, { name: "Jewel" },
            { name: "Mirror" }, { name: "Shield" },
            { name: "Steed" }, { name: "Sword" },
          ],
        },
        attributes: {
          mental: ["intelligence", "wits", "resolve"],
          physical: ["strength", "dexterity", "stamina"],
          social: ["presence", "manipulation", "composure"],
        },
        skills: {
          mental: [
            "academics", "computer", "crafts", "investigation",
            "medicine", "occult", "politics", "science",
          ],
          physical: [
            "athletics", "brawl", "drive", "firearms",
            "larceny", "stealth", "survival", "weaponry",
          ],
          social: [
            "animal ken", "empathy", "expression", "intimidation",
            "persuasion", "socialize", "streetwise", "subterfuge",
          ],
        },
        kiths: {
          items: [
            { name: "Dancer", seeming: "Fairest" },
            { name: "Playmate", seeming: "Fairest" },
            { name: "Hunterheart", seeming: "Beast" },
          ],
        },
      };
      return;
    }
    await Promise.all(topics.map(async function (t) {
      try {
        var r = await fetch(
          API + "/options?topic=" + encodeURIComponent(t),
          { credentials: "same-origin" },
        );
        if (r.ok) opts[t] = await r.json();
      } catch (_) { /* ignore */ }
    }));
  }

  async function loadKiths(seeming) {
    if (demo) {
      opts.kiths = {
        items: (opts.kiths && opts.kiths.items || []).filter(
          function (k) {
            return !seeming ||
              String(k.seeming).toLowerCase() ===
                seeming.toLowerCase();
          },
        ),
      };
      return;
    }
    try {
      var q = "/options?topic=kiths";
      if (seeming) {
        q += "&seeming=" + encodeURIComponent(seeming);
      }
      var r = await fetch(API + q, { credentials: "same-origin" });
      if (r.ok) opts.kiths = await r.json();
    } catch (_) { /* ignore */ }
  }

  // ── Render ─────────────────────────────────────────────────────

  function setMsg(el, text, isErr) {
    if (!el) return;
    if (!text) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = text;
    el.className = isErr ? "cg-error" : "cg-ok";
  }

  function renderStepper(stages, current) {
    var html = '<ol class="cg-stepper" data-cg-stepper ' +
      'aria-label="Chargen progress">';
    for (var i = 0; i < stages.length; i++) {
      var s = stages[i];
      var cls = "cg-stepper__item";
      if (s.stage === current) cls += " is-current";
      else if (s.stage < current) cls += " is-done";
      html += '<li class="' + cls + '" data-stage="' + s.stage + '">' +
        '<span class="cg-stepper__num">' + s.stage + "</span>" +
        "<span>" + esc(s.short || s.name) + "</span></li>";
    }
    html += "</ol>";
    return html;
  }

  function selectOptions(items, selected, valueKey, labelKey) {
    valueKey = valueKey || "name";
    labelKey = labelKey || valueKey;
    var html = '<option value="">— choose —</option>';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var v = typeof it === "string" ? it : it[valueKey];
      var lbl = typeof it === "string" ? it : (it[labelKey] || v);
      var sel = String(selected || "").toLowerCase() ===
        String(v).toLowerCase()
        ? " selected"
        : "";
      html += '<option value="' + esc(v) + '"' + sel + ">" +
        esc(lbl) + "</option>";
    }
    return html;
  }

  function fieldSelect(id, label, items, selected, valueKey) {
    return '<div class="cg-field">' +
      '<label class="cg-field__label" for="' + id + '">' +
      esc(label) + "</label>" +
      '<select class="cg-select" id="' + id +
      '" data-cg-field="' + id + '">' +
      selectOptions(items, selected, valueKey) +
      "</select></div>";
  }

  function fieldText(id, label, value, multiline) {
    var tag = multiline ? "textarea" : "input";
    var extra = multiline
      ? ""
      : ' type="text"';
    return '<div class="cg-field">' +
      '<label class="cg-field__label" for="' + id + '">' +
      esc(label) + "</label>" +
      "<" + tag + ' class="cg-' +
      (multiline ? "textarea" : "input") +
      '" id="' + id + '" data-cg-field="' + id + '"' +
      extra + (multiline ? ">" + esc(value || "") + "</textarea>"
        : ' value="' + esc(value || "") + '">') +
      "</div>";
  }

  function attrExtras(attrs) {
    attrs = attrs || {};
    function sum(keys) {
      var t = 0;
      for (var i = 0; i < keys.length; i++) {
        t += Math.max(0, (attrs[keys[i]] || 1) - 1);
      }
      return t;
    }
    return {
      mental: sum(["intelligence", "wits", "resolve"]),
      physical: sum(["strength", "dexterity", "stamina"]),
      social: sum(["presence", "manipulation", "composure"]),
    };
  }

  function skillSum(skills, keys) {
    skills = skills || {};
    var t = 0;
    for (var i = 0; i < keys.length; i++) {
      t += skills[keys[i]] || 0;
    }
    return t;
  }

  function renderDots(name, value, min, max) {
    min = min == null ? 0 : min;
    max = max == null ? 5 : max;
    var html = '<div class="cg-dots" data-cg-dots="' +
      esc(name) + '">';
    for (var i = 1; i <= max; i++) {
      var on = i <= value ? " is-on" : "";
      var v = i < min ? min : i;
      // clicking filled last dot toggles toward min
      html += '<button type="button" class="cg-dot' + on +
        '" data-cg-dot="' + esc(name) + '" data-val="' + i +
        '" aria-label="' + esc(name) + " " + i +
        '"></button>';
    }
    html += "</div>";
    return html;
  }

  function renderDotGroup(title, names, values, min) {
    values = values || {};
    min = min == null ? 0 : min;
    var html = '<div class="cg-group"><h3 class="cg-group__title">' +
      esc(title) + "</h3>";
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      var v = values[n] != null ? values[n] : min;
      html += '<div class="cg-dots-row">' +
        '<span class="cg-dots-row__label">' +
        esc(titleCase(n)) + "</span>" +
        renderDots(n, v, min, 5) +
        '<span class="cg-dots-row__val">' + v + "</span></div>";
    }
    html += "</div>";
    return html;
  }

  function renderStageBody(st) {
    var sh = st.sheet || {};
    var stage = st.stage;
    var html = "";

    if (stage === 1) {
      html += '<p class="cg-stage__hint">Define your core identity — ' +
        "concept, virtue (strength), and vice (flaw). Same as " +
        "<code>+cg</code> Stage 1.</p>";
      html += fieldText("concept", "Concept", sh.concept, true);
      html += fieldSelect(
        "virtue",
        "Virtue",
        (opts.virtues && opts.virtues.items) || [],
        sh.virtue,
      );
      html += fieldSelect(
        "vice",
        "Vice",
        (opts.vices && opts.vices.items) || [],
        sh.vice,
      );
    } else if (stage === 2) {
      html += '<p class="cg-stage__hint">Choose your supernatural ' +
        "template (or Mortal).</p>";
      var items = (opts.templates && opts.templates.items) || [];
      html += '<div class="cg-cards" data-cg-templates>';
      for (var i = 0; i < items.length; i++) {
        var t = items[i];
        var key = t.key || t.name;
        var sel = String(sh.template || "").toLowerCase() ===
          String(key).toLowerCase()
          ? " is-selected"
          : "";
        html += '<button type="button" class="cg-card' + sel +
          '" data-cg-template="' + esc(key) + '">' +
          '<p class="cg-card__name">' + esc(t.name || key) +
          "</p>" +
          '<p class="cg-card__key">' + esc(key) + "</p></button>";
      }
      html += "</div>";
    } else if (stage === 3) {
      html += '<p class="cg-stage__hint">Template-specific details. ' +
        "Required fields must be set before advancing.</p>";
      var fields = (st.templateMeta && st.templateMeta.customFields) ||
        [];
      var optional = { mask: 1, mien: 1, animals: 1 };
      var cf = sh.customFields || {};
      for (var f = 0; f < fields.length; f++) {
        var fname = fields[f];
        if (optional[fname]) continue;
        if (fname === "seeming") {
          html += fieldSelect(
            "seeming",
            "Seeming",
            (opts.seemings && opts.seemings.items) || [],
            cf.seeming,
          );
        } else if (fname === "kith") {
          html += fieldSelect(
            "kith",
            "Kith",
            (opts.kiths && opts.kiths.items) || [],
            cf.kith,
          );
        } else if (fname === "court") {
          html += fieldSelect(
            "court",
            "Court",
            (opts.courts && opts.courts.items) || [],
            cf.court,
          );
        } else if (fname === "favored") {
          html += fieldSelect(
            "favored",
            "Second favored Regalia",
            (opts.regalia && opts.regalia.items) || [],
            cf.favored,
          );
        } else if (fname === "auspice" || fname === "tribe") {
          html += fieldText(fname, titleCase(fname), cf[fname]);
        } else {
          html += fieldText(fname, titleCase(fname), cf[fname]);
        }
      }
      if (!fields.length) {
        html += '<p class="cg-stage__hint">No extra details for ' +
          "this template — continue.</p>";
      }
    } else if (stage === 4) {
      var ax = attrExtras(sh.attributes);
      var bad = ![3, 4, 5].every(function (n) {
        return [ax.mental, ax.physical, ax.social].indexOf(n) >= 0;
      });
      html += '<p class="cg-stage__hint">Assign free 1 in each, then ' +
        "extras as <strong>5 / 4 / 3</strong> across Mental, " +
        "Physical, and Social.</p>";
      html += '<p class="cg-pool' + (bad ? " is-bad" : "") +
        '">Extras — Mental <strong>+' + ax.mental +
        "</strong> · Physical <strong>+" + ax.physical +
        "</strong> · Social <strong>+" + ax.social +
        "</strong> (need 5/4/3)</p>";
      var A = opts.attributes || {};
      html += renderDotGroup(
        "Mental",
        A.mental || ["intelligence", "wits", "resolve"],
        sh.attributes,
        1,
      );
      html += renderDotGroup(
        "Physical",
        A.physical || ["strength", "dexterity", "stamina"],
        sh.attributes,
        1,
      );
      html += renderDotGroup(
        "Social",
        A.social || ["presence", "manipulation", "composure"],
        sh.attributes,
        1,
      );
    } else if (stage === 5) {
      var S = opts.skills || {};
      var mKeys = S.mental || [];
      var pKeys = S.physical || [];
      var sKeys = S.social || [];
      var ms = skillSum(sh.skills, mKeys);
      var ps = skillSum(sh.skills, pKeys);
      var ss = skillSum(sh.skills, sKeys);
      html += '<p class="cg-stage__hint">Skill priorities ' +
        "<strong>11 / 9 / 7</strong> across the three categories." +
        "</p>";
      html += '<p class="cg-pool">Totals — Mental <strong>' + ms +
        "</strong> · Physical <strong>" + ps +
        "</strong> · Social <strong>" + ss +
        "</strong> (need 11/9/7)</p>";
      html += renderDotGroup("Mental", mKeys, sh.skills, 0);
      html += renderDotGroup("Physical", pKeys, sh.skills, 0);
      html += renderDotGroup("Social", sKeys, sh.skills, 0);
    } else if (stage === 6) {
      html += '<p class="cg-stage__hint">Merits — set dots with ' +
        "<code>+cg/set MeritName=N</code> in-game for full " +
        "catalog, or enter a merit name and dots below.</p>";
      var merits = sh.merits || {};
      var mKeys2 = Object.keys(merits);
      html += fieldText("merit_name", "Merit name", "");
      html += fieldText("merit_dots", "Dots (1–5)", "1");
      html += '<button type="button" class="cg-btn" ' +
        'data-cg-add-merit>Add merit</button>';
      if (mKeys2.length) {
        html += '<div class="cg-group cg-group--spaced">' +
          '<h3 class="cg-group__title">Selected</h3><ul>';
        for (var mi = 0; mi < mKeys2.length; mi++) {
          html += "<li>" + esc(titleCase(mKeys2[mi])) + " · " +
            merits[mKeys2[mi]] + "</li>";
        }
        html += "</ul></div>";
      }
    } else if (stage >= 7) {
      html += '<p class="cg-stage__hint">Powers stage — for ' +
        "Changeling, pick Contracts in-game with " +
        "<code>+cg/contract</code>. Web picks coming soon; " +
        "you can submit when the sheet validates.</p>";
      var contracts = sh.contracts || [];
      if (contracts.length) {
        html += "<ul>";
        for (var c = 0; c < contracts.length; c++) {
          html += "<li>" + esc(contracts[c]) + "</li>";
        }
        html += "</ul>";
      }
    }

    return html;
  }

  function renderSheetSummary(st) {
    if (!st || !st.sheet) {
      return '<p class="cg-sheet__muted">No draft yet.</p>';
    }
    var sh = st.sheet;
    var cf = sh.customFields || {};
    var html = '<div class="cg-sheet">';
    html += '<div class="cg-sheet__block">' +
      '<p class="cg-sheet__label">Concept</p>' +
      '<p class="cg-sheet__value">' +
      esc(sh.concept || "—") + "</p></div>";
    html += '<div class="cg-sheet__block">' +
      '<p class="cg-sheet__label">Template</p>' +
      '<p class="cg-sheet__value">' +
      esc(titleCase(sh.template || "mortal")) + "</p></div>";
    html += '<div class="cg-sheet__block">' +
      '<p class="cg-sheet__label">Anchors</p>' +
      '<p class="cg-sheet__value">' +
      esc(sh.virtue || "—") + " / " +
      esc(sh.vice || "—") + "</p></div>";
    if (cf.seeming || cf.court) {
      html += '<div class="cg-sheet__block">' +
        '<p class="cg-sheet__label">Seeming / Court</p>' +
        '<p class="cg-sheet__value">' +
        esc(cf.seeming || "—") + " · " +
        esc(cf.kith || "—") + "<br>" +
        esc(cf.court || "—") + "</p></div>";
    }
    html += '<div class="cg-sheet__block">' +
      '<p class="cg-sheet__label">Stage</p>' +
      '<p class="cg-sheet__value">' +
      st.stage + " / " + st.maxStage + " — " +
      esc(st.stageName || "") + "</p></div>";
    html += "</div>";
    return html;
  }

  function renderMain(st) {
    var main = qs("[data-site-main]");
    if (!main) return;

    if (!st) {
      main.innerHTML =
        '<section class="site-section cg-root">' +
        '<div class="cg-gate">' +
        '<h2 class="cg-header__title">Character Generation</h2>' +
        "<p>Loading…</p></div></section>";
      return;
    }

    if (st.closed) {
      main.innerHTML =
        '<section class="site-section cg-root">' +
        '<div class="cg-gate">' +
        '<h2 class="cg-header__title">Chargen closed</h2>' +
        "<p>" + esc(st.reason || "Already approved.") + "</p>" +
        '<a class="cg-btn cg-btn--primary" href="/">Home</a>' +
        "</div></section>";
      return;
    }

    if (st.needAuth) {
      main.innerHTML =
        '<section class="site-section cg-root">' +
        '<div class="cg-gate">' +
        '<h2 class="cg-header__title">Character Generation</h2>' +
        "<p>Sign in to build your character with the same " +
        "stepper as in-game <code>+cg</code>.</p>" +
        '<a class="cg-btn cg-btn--primary" href="/login">' +
        "Sign in</a> " +
        '<button type="button" class="cg-btn" data-cg-demo>' +
        "Try demo</button>" +
        "</div></section>";
      return;
    }

    if (!st.started) {
      main.innerHTML =
        '<section class="site-section cg-root">' +
        '<div class="cg-gate">' +
        '<h2 class="cg-header__title">Character Generation</h2>' +
        "<p>Guided creation matching in-game stages — " +
        "Concept, Template, Details, Attributes, Skills, " +
        "Merits, and Powers.</p>" +
        '<button type="button" class="cg-btn cg-btn--primary" ' +
        'data-cg-start>Begin chargen</button>' +
        "</div></section>";
      return;
    }

    var stages = st.stages || [];
    var html = '<section class="site-section cg-root" data-cg-root>' +
      '<header class="cg-header">' +
      '<h2 class="cg-header__title">Character Generation</h2>' +
      '<p class="cg-header__sub">Stage ' + st.stage + " of " +
      st.maxStage + " — " + esc(st.stageName || "") +
      (demo ? " · demo" : "") + "</p></header>";

    html += renderStepper(stages, st.stage);
    html += '<div class="cg-error" data-cg-error hidden></div>';
    html += '<div class="cg-ok" data-cg-ok hidden></div>';
    html += '<div class="cg-stage" data-cg-stage>' +
      '<h3 class="cg-stage__title">' +
      esc(st.stageName || ("Stage " + st.stage)) + "</h3>" +
      renderStageBody(st) + "</div>";

    html += '<div class="cg-actions">' +
      '<button type="button" class="cg-btn" data-cg-back' +
      (st.stage <= 1 ? " disabled" : "") + ">Back</button>" +
      '<button type="button" class="cg-btn cg-btn--primary" ' +
      'data-cg-next>' +
      (st.stage >= st.maxStage ? "Finish" : "Next stage") +
      "</button></div></section>";

    main.innerHTML = html;

    if (st.validationError && !st.canAdvance) {
      setMsg(qs("[data-cg-error]"), st.validationError, true);
    }

    var right = qs("[data-site-right-panels]");
    if (right) {
      right.innerHTML =
        '<section class="site-menu menu">' +
        '<h2 class="site-menu__title">Draft sheet</h2>' +
        renderSheetSummary(st) + "</section>";
    }

    wireStage();
  }

  // ── Events ─────────────────────────────────────────────────────

  async function applyTrait(trait, value, opts) {
    opts = opts || {};
    if (busy) return;
    busy = true;
    try {
      state = await api("POST", "/set", {
        trait: trait,
        value: String(value),
      });
      if (trait === "seeming") await loadKiths(value);
      // Full re-render only when layout must change (template /
      // dots / seeming→kith). Text fields keep focus.
      var heavy = opts.rerender ||
        trait === "template" ||
        trait === "seeming" ||
        opts.dots;
      if (heavy) {
        renderMain(state);
      } else {
        setMsg(
          qs("[data-cg-error]"),
          state.canAdvance ? "" : (state.validationError || ""),
          !state.canAdvance,
        );
        setMsg(qs("[data-cg-ok]"), "", false);
        var right = qs("[data-site-right-panels]");
        if (right) {
          right.innerHTML =
            '<section class="site-menu menu">' +
            '<h2 class="site-menu__title">Draft sheet</h2>' +
            renderSheetSummary(state) + "</section>";
        }
      }
    } catch (e) {
      setMsg(
        qs("[data-cg-error]"),
        e.message || "Could not save.",
        true,
      );
      if (e.data && e.data.sheet) {
        state = Object.assign(state || {}, e.data);
      }
    } finally {
      busy = false;
    }
  }

  function wireStage() {
    var root = qs("[data-cg-root]") || document;

    root.querySelectorAll("[data-cg-field]").forEach(function (el) {
      var id = el.getAttribute("data-cg-field");
      var ev = el.tagName === "SELECT" ? "change" : "change";
      el.addEventListener(ev, function () {
        if (id === "merit_name" || id === "merit_dots") return;
        applyTrait(id, el.value);
      });
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        el.addEventListener("blur", function () {
          if (id === "merit_name" || id === "merit_dots") return;
          applyTrait(id, el.value);
        });
      }
    });

    root.querySelectorAll("[data-cg-template]").forEach(
      function (btn) {
        btn.addEventListener("click", function () {
          applyTrait(
            "template",
            btn.getAttribute("data-cg-template"),
            { rerender: true },
          );
        });
      },
    );

    root.querySelectorAll("[data-cg-dot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-cg-dot");
        var val = btn.getAttribute("data-val");
        // toggle off if clicking current value on attrs min 1
        var cur = 0;
        if (state && state.sheet) {
          cur = (state.sheet.attributes &&
            state.sheet.attributes[name]) ||
            (state.sheet.skills && state.sheet.skills[name]) ||
            0;
        }
        var next = parseInt(val, 10);
        if (cur === next && next > 0) {
          // attrs floor 1, skills floor 0
          var isAttr = state.sheet.attributes &&
            name in state.sheet.attributes;
          next = isAttr ? Math.max(1, next - 1) : next - 1;
          if (next < 0) next = 0;
        }
        applyTrait(name, String(next), { dots: true });
      });
    });

    var addM = qs("[data-cg-add-merit]", root);
    if (addM) {
      addM.addEventListener("click", function () {
        var n = qs("#merit_name", root);
        var d = qs("#merit_dots", root);
        if (!n || !n.value.trim()) return;
        applyTrait(
          n.value.trim(),
          (d && d.value) || "1",
        );
      });
    }

    var back = qs("[data-cg-back]", root);
    if (back) {
      back.addEventListener("click", async function () {
        if (busy) return;
        busy = true;
        try {
          state = await api("POST", "/back", {});
          renderMain(state);
        } catch (e) {
          setMsg(qs("[data-cg-error]"), e.message, true);
        } finally {
          busy = false;
        }
      });
    }

    var next = qs("[data-cg-next]", root);
    if (next) {
      next.addEventListener("click", async function () {
        if (busy) return;
        busy = true;
        try {
          state = await api("POST", "/next", {});
          if (state.readyToSubmit) {
            setMsg(
              qs("[data-cg-ok]"),
              "Sheet ready. Submit in-game with +cg/submit " +
                "for staff review, or continue editing.",
              false,
            );
          }
          renderMain(state);
        } catch (e) {
          if (e.data) {
            state = Object.assign(state || {}, e.data);
            renderMain(state);
          }
          setMsg(
            qs("[data-cg-error]"),
            e.message || "Cannot advance.",
            true,
          );
        } finally {
          busy = false;
        }
      });
    }
  }

  function wireGlobal() {
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest
        ? e.target.closest("[data-cg-start], [data-cg-demo]")
        : null;
      if (!t) return;
      if (t.hasAttribute("data-cg-demo")) {
        demo = true;
        boot();
        return;
      }
      if (t.hasAttribute("data-cg-start")) {
        (async function () {
          try {
            state = await api("POST", "/start", {});
            renderMain(state);
          } catch (err) {
            if (err.status === 401) {
              renderMain({ needAuth: true });
            } else {
              renderMain({
                needAuth: false,
                started: false,
              });
              setTimeout(function () {
                setMsg(
                  qs("[data-cg-error]"),
                  err.message,
                  true,
                );
              }, 0);
            }
          }
        })();
      }
    });
  }

  async function boot() {
    var params = new URLSearchParams(location.search);
    if (params.get("demo") === "1") demo = true;

    var shell = qs("[data-site-shell]");
    if (shell) {
      shell.classList.add(
        "is-compact",
        "is-mode-no-hero",
        "is-plain",
        "is-mode-chargen",
      );
    }
    var banner = qs(".site-banner");
    if (banner) banner.hidden = true;

    // Load catalog CSS if not present
    if (!qs('link[data-cg-css]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/site/css/chargen.css?v=20260804cg1";
      link.setAttribute("data-cg-css", "1");
      document.head.appendChild(link);
    }

    renderMain(null);
    await loadOptions();

    if (demo) {
      state = demoInit();
      demoRefresh();
      renderMain(state);
      return;
    }

    try {
      state = await api("GET", "");
      renderMain(state);
    } catch (e) {
      if (e.status === 401) {
        renderMain({ needAuth: true });
      } else {
        renderMain({ needAuth: true });
      }
    }
  }

  wireGlobal();

  global.SiteChargen = {
    boot: boot,
    isDemo: function () {
      return demo;
    },
    getState: function () {
      return state;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
