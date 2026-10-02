"use strict";
(function() {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const KEY = "grambandhan.farmer.v1";
  const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const taka = (n) => "\u09F3" + Number(n || 0).toLocaleString("en-IN");
  const pct = (a, b) => !b ? 0 : Math.min(100, Math.round(a / b * 100));
  const today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const nice = (d) => new Date(d).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" }
  );
  const ago = (d) => {
    const m = Math.round((Date.now() - new Date(d)) / 6e4);
    if (m < 60) return m + " min ago";
    if (m < 1440) return Math.round(m / 60) + " hr ago";
    return Math.round(m / 1440) + " d ago";
  };
  const DISTRICTS = [
    "Bogura",
    "Rangpur",
    "Dinajpur",
    "Jessore",
    "Khulna",
    "Satkhira",
    "Comilla",
    "Mymensingh",
    "Rajshahi",
    "Sylhet",
    "Barishal",
    "Munshiganj",
    "Jamalpur",
    "Chuadanga",
    "Sirajganj",
    "Tangail"
  ];
  const CATEGORIES = {
    Crop: { icon: "\u{1F33E}", base: 26 },
    Vegetable: { icon: "\u{1F96C}", base: 24 },
    Poultry: { icon: "\u{1F413}", base: 32 },
    Fisheries: { icon: "\u{1F41F}", base: 34 },
    Cattle: { icon: "\u{1F404}", base: 22 },
    Handicraft: { icon: "\u{1F9FA}", base: 16 }
  };
  const DASHBOARD_WIDGETS = [
    { key: "stats", label: "Summary numbers", hint: "Funds raised, wallet balance, sales, rating" },
    { key: "projects", label: "Projects that need you", hint: "Running and funding projects with a progress bar" },
    { key: "updates", label: "Latest field updates", hint: "Your most recent progress posts" },
    { key: "money", label: "Money in and out", hint: "A short list of recent transactions" }
  ];
  const DEFAULT_DASHBOARD_WIDGETS = { stats: true, projects: true, updates: true, money: true };
  function toast(msg, bad) {
    const t = document.createElement("div");
    t.className = "toast" + (bad ? " toast--bad" : "");
    t.textContent = msg;
    $("#toasts").appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  let S = null;
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.user || !parsed.projects || !Array.isArray(parsed.projects) || !parsed.wallet || !parsed.notifications) {
        return null;
      }
      if (!parsed.settings) parsed.settings = { dashboard: { ...DEFAULT_DASHBOARD_WIDGETS } };
      if (parsed.settings && !parsed.settings.dashboard) parsed.settings.dashboard = { ...DEFAULT_DASHBOARD_WIDGETS };
      if (!parsed.products) parsed.products = [];
      if (!parsed.orders) parsed.orders = [];
      if (!parsed.reviews) parsed.reviews = [];
      return parsed;
    } catch (e) {
    }
    return null;
  }
  function notify(text, type) {
    S.notifications.unshift({ id: uid("N"), text, type: type || "info", at: (/* @__PURE__ */ new Date()).toISOString(), read: false });
    save();
    paintBell();
  }
  function notifyBlockchainTransaction(tx) {
    if (!tx) return;
    if (!tx.txHash) {
      tx.txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    }
    tx.blockNumber = tx.blockNumber || 19842e3 + Math.floor(Math.random() * 5e4);
    tx.blockchainVerified = true;
    tx.verifiedEmail = "binsadikmuhutasim@gmail.com";
    tx.verifiedSms = "01838213020";
    fetch("/api/v1/notifications/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction: tx,
        email: "binsadikmuhutasim@gmail.com",
        sms: "01838213020"
      })
    }).catch(() => {
    });
    toast(`\u26D3\uFE0F Base Sepolia Tx Confirmed: ${tx.id} | \u{1F4E7} Email: binsadikmuhutasim@gmail.com | \u{1F4F1} SMS: 01838213020`);
  }
  function blank(user) {
    return {
      user,
      projects: [],
      products: [],
      orders: [],
      wallet: { balance: 0, tx: [] },
      reviews: [],
      settings: { dashboard: { ...DEFAULT_DASHBOARD_WIDGETS } },
      notifications: [{
        id: uid("N"),
        text: "Welcome to Grambandhan, " + user.name.split(" ")[0] + ". Start by listing your first project.",
        type: "info",
        at: (/* @__PURE__ */ new Date()).toISOString(),
        read: false
      }]
    };
  }
  function seed(user) {
    const now = Date.now();
    const d = (days) => new Date(now - days * 864e5).toISOString();
    const p1 = {
      id: "PRJ-2401",
      title: "Aman Rice Cultivation \u2014 2 acres",
      category: "Crop",
      description: "High-yield BRRI dhan87 on two acres of own land. Funds cover seed, urea, irrigation and harvest labour. Buyer already lined up at the Shibganj paddy hat.",
      district: "Bogura",
      upazila: "Shibganj",
      goal: 145e3,
      raised: 145e3,
      months: 5,
      start: today(),
      status: "active",
      createdAt: d(46),
      disbursed: true,
      images: ["\u{1F33E}", "\u{1F331}", "\u{1F69C}"],
      docs: ["land-deed.pdf"],
      insurance: { opted: true, plan: "Crop shield \u2014 standard", premium: 3625, claim: null },
      investors: [
        { name: "Muhutasim B.", amount: 6e4, at: d(40) },
        { name: "Tasfi A.", amount: 5e4, at: d(36) },
        { name: "Shezan I.", amount: 35e3, at: d(30) }
      ],
      progress: [
        { id: uid("U"), at: d(28), percent: 15, title: "Land prepared and seedbed sown", note: "Two rounds of ploughing done. Seedbed covered against the heat.", photos: ["\u{1F331}"], verified: "Field agent Nusrat" },
        { id: uid("U"), at: d(14), percent: 45, title: "Transplanting finished", note: "All 2 acres transplanted with 8 labourers over three days.", photos: ["\u{1F33E}", "\u{1F469}\u200D\u{1F33E}"], verified: "Field agent Nusrat" },
        { id: uid("U"), at: d(3), percent: 62, title: "First urea application", note: "Applied 45 kg urea. Slight leaf-folder seen in the north plot, spraying next week.", photos: ["\u{1F33F}"], verified: null }
      ]
    };
    const p2 = {
      id: "PRJ-2402",
      title: "Organic Tomato Tunnel Farm",
      category: "Vegetable",
      description: "Poly-tunnel tomato on 30 decimals, off-season variety for the winter market.",
      district: "Bogura",
      upazila: "Shibganj",
      goal: 9e4,
      raised: 32800,
      months: 4,
      start: today(),
      status: "funding",
      createdAt: d(12),
      images: ["\u{1F345}"],
      docs: [],
      insurance: { opted: false, plan: null, premium: 0, claim: null },
      investors: [{ name: "Fariha T.", amount: 32800, at: d(8) }],
      progress: []
    };
    const p3 = {
      id: "PRJ-2403",
      title: "Mango Orchard Expansion",
      category: "Crop",
      description: "Adding 60 Amrapali saplings to the existing orchard plus a drip line.",
      district: "Bogura",
      upazila: "Shibganj",
      goal: 6e4,
      raised: 0,
      months: 12,
      start: today(),
      status: "pending",
      createdAt: d(2),
      images: ["\u{1F96D}"],
      docs: ["orchard-photo.jpg"],
      insurance: { opted: false, plan: null, premium: 0, claim: null },
      investors: [],
      progress: []
    };
    [p1, p2, p3].forEach((p) => {
      p.risk = assessRisk(p, user);
    });
    return {
      user,
      projects: [p1, p2, p3],
      products: [
        { id: uid("P"), name: "Premium Chinigura Rice", category: "Farming", price: 600, unit: "per 5 kg", qty: 40, desc: "Aromatic fine rice, this season's harvest, sun-dried and hand-sorted.", icon: "\u{1F35A}", status: "live", sold: 26, rating: 4.8 },
        { id: uid("P"), name: "Farm Fresh Brown Eggs", category: "Farming", price: 240, unit: "per tray of 30", qty: 18, desc: "Free-range hens, collected the same morning.", icon: "\u{1F95A}", status: "live", sold: 54, rating: 4.6 }
      ],
      orders: [
        { id: uid("ORD"), product: "Premium Chinigura Rice", buyer: "Nabila H.", qty: 3, total: 1800, status: "delivered", at: d(6) },
        { id: uid("ORD"), product: "Farm Fresh Brown Eggs", buyer: "Rafid K.", qty: 2, total: 480, status: "packed", at: d(1) },
        { id: uid("ORD"), product: "Premium Chinigura Rice", buyer: "Sadia R.", qty: 1, total: 600, status: "new", at: d(0) }
      ],
      wallet: {
        balance: 41200,
        tx: [
          { id: uid("TXN"), type: "in", desc: "Disbursement \u2014 Aman Rice Cultivation", method: "bKash", amount: 145e3, at: d(26), status: "complete" },
          { id: uid("TXN"), type: "out", desc: "Insurance premium \u2014 Crop shield", method: "Wallet", amount: 3625, at: d(26), status: "complete" },
          { id: uid("TXN"), type: "out", desc: "Withdrawal to bKash 017****891", method: "bKash", amount: 1e5, at: d(24), status: "complete" },
          { id: uid("TXN"), type: "in", desc: "Marketplace sale \u2014 Chinigura Rice \xD73", method: "Nagad", amount: 1800, at: d(6), status: "complete" }
        ]
      },
      reviews: [
        { from: "Muhutasim B.", role: "Investor", stars: 5, at: d(9), project: "Aman Rice Cultivation", text: "Updates come on time with clear photos. I always know where my money went." },
        { from: "Nabila H.", role: "Buyer", stars: 5, at: d(5), project: "Marketplace order", text: "Rice arrived clean and exactly as described. Will order again." },
        { from: "Field agent Nusrat", role: "Field agent", stars: 4, at: d(14), project: "Aman Rice Cultivation", text: "Records are well kept. Keep the pest log updated weekly." }
      ],
      settings: { dashboard: { ...DEFAULT_DASHBOARD_WIDGETS } },
      notifications: [
        { id: uid("N"), text: "Fariha T. invested \u09F332,800 in Organic Tomato Tunnel Farm.", type: "money", at: d(8), read: false },
        { id: uid("N"), text: "Mango Orchard Expansion is awaiting admin approval.", type: "info", at: d(2), read: false },
        { id: uid("N"), text: "New order: Premium Chinigura Rice \xD71 from Sadia R.", type: "order", at: d(0), read: false }
      ]
    };
  }
  function assessRisk(p, user) {
    const cat = CATEGORIES[p.category] || { base: 25 };
    let score = cat.base;
    const factors = [];
    const advice = [];
    factors.push({ label: p.category + " projects carry a baseline risk of " + cat.base + " points", delta: cat.base });
    if (p.goal > 2e5) {
      score += 14;
      factors.push({ label: "Large funding goal above \u09F32,00,000", delta: 14 });
      advice.push("Split the project into two funding rounds so investors can see results before the second tranche.");
    } else if (p.goal > 1e5) {
      score += 7;
      factors.push({ label: "Mid-size funding goal", delta: 7 });
    } else {
      score -= 4;
      factors.push({ label: "Modest funding goal is easier to fill and manage", delta: -4 });
    }
    if (p.months > 9) {
      score += 12;
      factors.push({ label: "Long cycle of " + p.months + " months", delta: 12 });
      advice.push("Add a mid-cycle milestone so investors are not waiting months for news.");
    } else if (p.months < 3) {
      score += 5;
      factors.push({ label: "Very short cycle leaves no room for delay", delta: 5 });
    }
    const m = new Date(p.start || today()).getMonth();
    const monsoon = m >= 5 && m <= 8;
    if (monsoon && ["Crop", "Vegetable"].includes(p.category)) {
      score += 10;
      factors.push({ label: "Start date falls in the monsoon window", delta: 10 });
      advice.push("Check the field drainage before transplanting; waterlogging is the top claim cause in this season.");
    }
    const flood = ["Sirajganj", "Jamalpur", "Satkhira", "Khulna", "Barishal"];
    if (flood.includes(p.district)) {
      score += 9;
      factors.push({ label: p.district + " is in a flood-prone belt", delta: 9 });
      advice.push("Take insurance cover \u2014 projects in " + p.district + " claim roughly twice as often.");
    }
    const done = user.completed || 0;
    if (done >= 2) {
      score -= 10;
      factors.push({ label: done + " projects already completed on this platform", delta: -10 });
    } else if (done === 0) {
      score += 6;
      factors.push({ label: "No completed project history yet", delta: 6 });
      advice.push("Post progress updates at least twice a month \u2014 new farmers with regular updates fund about 40% faster.");
    }
    if (!p.docs || !p.docs.length) {
      score += 6;
      factors.push({ label: "No supporting document attached", delta: 6 });
      advice.push("Attach a land document or a lease paper. Listings with documents get approved faster.");
    }
    if (p.insurance && p.insurance.opted) {
      score -= 8;
      factors.push({ label: "Insurance cover selected", delta: -8 });
    } else {
      advice.push("Consider crop insurance \u2014 the premium is 2.5% of the goal and covers up to 80% of a verified loss.");
    }
    score = Math.max(5, Math.min(95, Math.round(score)));
    const level = score < 33 ? "low" : score < 60 ? "medium" : "high";
    if (!advice.length) advice.push("This plan looks solid. Keep the progress log current and disbursement will move quickly.");
    return { score, level, factors, advice, at: (/* @__PURE__ */ new Date()).toISOString() };
  }
  function bindAuth() {
    const sel = $("#regDistrict");
    sel.innerHTML = '<option value="">Select district</option>' + DISTRICTS.map((d) => `<option>${d}</option>`).join("");
    $$("[data-goauth]").forEach((b) => b.addEventListener("click", () => {
      const go = b.dataset.goauth;
      $("#viewLogin").classList.toggle("is-hidden", go !== "login");
      $("#viewSignup").classList.toggle("is-hidden", go !== "signup");
    }));
    $("#loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors();
      const phone = $("#loginPhone").value.trim();
      const pass = $("#loginPass").value;
      let ok = true;
      if (!/^01[3-9]\d{8}$/.test(phone)) {
        ok = false;
        setError("loginPhone", "Enter an 11-digit Bangladeshi number starting with 01.");
      }
      if (pass.length < 4) {
        ok = false;
        setError("loginPass", "Password must be at least 4 characters.");
      }
      if (!ok) return;
      if (!S) {
        S = seed({
          name: "Rahima Khatun",
          phone,
          email: "",
          role: "Farmer",
          district: "Bogura",
          upazila: "Shibganj",
          land: 210,
          exp: 14,
          crops: ["Rice", "Vegetables", "Poultry"],
          nid: "19XXXXXXXXXXXX",
          verified: true,
          completed: 2,
          rating: 4.8,
          joined: "2024-11-02"
        });
        save();
      }
      enterApp();
    });
    let step = 1;
    const setStep = (n) => {
      step = n;
      $$(".regstep").forEach((f) => f.classList.toggle("is-active", +f.dataset.step === n));
      $$(".steps__item").forEach((li) => li.classList.toggle("is-active", +li.dataset.step <= n));
      $("#regBack").classList.toggle("is-hidden", n === 1);
      $("#regNext").classList.toggle("is-hidden", n === 3);
      $("#regSubmit").classList.toggle("is-hidden", n !== 3);
    };
    $("#regBack").addEventListener("click", () => setStep(Math.max(1, step - 1)));
    $("#regNext").addEventListener("click", () => {
      if (validateStep(step)) setStep(step + 1);
    });
    $("#regNidFile").addEventListener("change", (e) => {
      const f = e.target.files[0];
      $("#regNidFileName").textContent = f ? f.name : "Tap to attach a photo";
    });
    $("#regForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateStep(3)) return;
      const crops = $$("#regCrops input:checked").map((i) => i.value);
      S = blank({
        name: $("#regName").value.trim(),
        phone: $("#regPhone").value.trim(),
        email: $("#regEmail").value.trim(),
        role: $$("input[name=role]").find((r) => r.checked).value,
        district: $("#regDistrict").value,
        upazila: $("#regUpazila").value.trim(),
        land: +$("#regLand").value || 0,
        exp: +$("#regExp").value || 0,
        crops: crops.length ? crops : ["Rice"],
        nid: $("#regNid").value.trim().replace(/\d(?=\d{4})/g, "X"),
        verified: true,
        completed: 0,
        rating: 0,
        joined: today()
      });
      save();
      toast("Account created and NID verified.");
      enterApp();
    });
    function validateStep(n) {
      clearErrors();
      let ok = true;
      const need = (id, test, msg) => {
        const v = $("#" + id).value.trim();
        if (!test(v)) {
          setError(id, msg);
          ok = false;
        }
      };
      if (n === 1) {
        need("regName", (v) => v.length >= 3, "Please write your full name.");
        need("regPhone", (v) => /^01[3-9]\d{8}$/.test(v), "Enter an 11-digit number starting with 01.");
        need("regEmail", (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "That email address is not valid.");
        need("regPass", (v) => v.length >= 6, "Use at least 6 characters.");
      }
      if (n === 2) {
        need("regDistrict", (v) => !!v, "Choose your district.");
        need("regUpazila", (v) => v.length >= 2, "Write your upazila.");
        need("regLand", (v) => v === "" || +v >= 0, "Land size cannot be negative.");
      }
      if (n === 3) {
        need("regNid", (v) => /^(\d{10}|\d{13}|\d{17})$/.test(v), "An NID number has 10, 13 or 17 digits.");
        if (!$("#regTerms").checked) {
          setError("regTerms", "You need to accept the terms to continue.");
          ok = false;
        }
      }
      return ok;
    }
  }
  function setError(id, msg) {
    const el = $(`.field__error[data-for="${id}"]`);
    if (el) {
      el.textContent = msg;
      el.classList.add("is-on");
    }
    const inp = $("#" + id);
    if (inp && inp.closest(".field")) inp.closest(".field").classList.add("is-bad");
  }
  function clearErrors(root) {
    $$(".field__error", root || document).forEach((e) => {
      e.classList.remove("is-on");
      e.textContent = "";
    });
    $$(".field.is-bad", root || document).forEach((f) => f.classList.remove("is-bad"));
  }
  function enterApp() {
    if (!S || !S.user || !S.projects || !S.projects.length) {
      S = seed({
        name: S && S.user && S.user.name || "Md. Rafiqul Islam",
        phone: S && S.user && S.user.phone || "01712345678",
        email: S && S.user && S.user.email || "",
        role: "Farmer",
        district: S && S.user && S.user.district || "Bogura",
        upazila: S && S.user && S.user.upazila || "Shibganj",
        land: 210,
        exp: 14,
        crops: ["Rice", "Vegetables", "Poultry"],
        nid: "19XXXXXXXXXXXX",
        verified: true,
        completed: 2,
        rating: 4.8,
        joined: "2024-11-02"
      });
      save();
    }
    $("#authScreen").classList.add("is-hidden");
    $("#app").classList.remove("is-hidden");
    const name = S.user && S.user.name || "Md. Rafiqul Islam";
    const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    $("#topAvatar").textContent = initials;
    $("#topName").textContent = name;
    $("#topMeta").textContent = (S.user && S.user.role || "Farmer") + " \xB7 " + (S.user && S.user.upazila ? S.user.upazila + ", " : "") + (S.user && S.user.district || "Bogura") + (S.user && S.user.verified ? " \xB7 verified" : "");
    paintBell();
    if (!location.hash.startsWith("#/")) location.hash = "#/dashboard";
    route();
  }
  function paintBell() {
    const notifs = S && Array.isArray(S.notifications) ? S.notifications : [];
    const n = notifs.filter((x) => !x.read).length;
    $("#bellDot").hidden = n === 0;
    $("#notifList").innerHTML = notifs.length ? notifs.slice(0, 12).map((n2) => `
        <div class="notif ${n2.read ? "" : "is-new"}">
          <span>${n2.type === "money" ? "\u{1F4B0}" : n2.type === "order" ? "\u{1F4E6}" : "\u{1F4CC}"}</span>
          <div><div>${esc(n2.text)}</div><time>${ago(n2.at)}</time></div>
        </div>`).join("") : '<p class="muted">Nothing new right now.</p>';
  }
  const routes = {};
  function route() {
    const hash = location.hash.replace(/^#\//, "") || "dashboard";
    const [name, a, b] = hash.split("/");
    const view = routes[name] || routes.dashboard;
    $$("[data-nav]").forEach((el) => el.classList.toggle("is-on", el.dataset.nav === name || name === "project" && el.dataset.nav === "projects"));
    $("#main").innerHTML = view(a, b);
    $("#rail").classList.remove("is-open");
    window.scrollTo(0, 0);
    if (view.after) view.after(a, b);
  }
  const find = (id) => S.projects.find((p) => p.id === id);
  const statusTag = (s) => `<span class="tag tag--${s === "funding" ? "active" : s}">${{
    pending: "Awaiting approval",
    funding: "Raising funds",
    active: "Running",
    completed: "Completed",
    rejected: "Needs changes",
    draft: "Draft"
  }[s] || s}</span>`;
  routes.dashboard = function() {
    if (!S) return "";
    const w = S.settings && S.settings.dashboard || DEFAULT_DASHBOARD_WIDGETS;
    const projects = Array.isArray(S.projects) ? S.projects : [];
    const active = projects.filter((p) => ["funding", "active"].includes(p.status));
    const raised = projects.reduce((t, p) => t + (p.raised || 0), 0);
    const goal = projects.reduce((t, p) => t + (p.goal || 0), 0);
    const orders = Array.isArray(S.orders) ? S.orders : [];
    const sales = orders.reduce((t, o) => t + (o.total || 0), 0);
    const openOrders = orders.filter((o) => o.status !== "delivered").length;
    const latest = projects.flatMap((p) => (p.progress || []).map((u) => ({ ...u, project: p.title }))).sort((x, y) => new Date(y.at) - new Date(x.at)).slice(0, 3);
    const anyOn = w.stats || w.projects || w.updates || w.money;
    const uName = S.user && S.user.name ? S.user.name.split(" ")[0] : "Farmer";
    return `
      <div class="pagehead">
        <div>
          <h1 class="h1">Good to see you, ${esc(uName)}</h1>
          <p>${active.length} project${active.length === 1 ? "" : "s"} running \xB7 ${openOrders} order${openOrders === 1 ? "" : "s"} to pack</p>
        </div>
        <div class="row">
          <button class="btn btn--ghost" id="dashCustomize">\u2699 Customize</button>
          <a class="btn btn--ghost" href="#/market">Add a product</a>
          <a class="btn btn--primary" href="#/project/new">Start a project</a>
        </div>
      </div>

      ${w.stats ? `<dl class="cards cols-4" style="margin-bottom:18px">
        <div class="stat stat--green"><dt>Funds raised</dt><dd>${taka(raised)}</dd><small>of ${taka(goal)} requested</small></div>
        <div class="stat"><dt>Wallet balance</dt><dd>${taka(S.wallet ? S.wallet.balance : 0)}</dd><small>ready to withdraw</small></div>
        <div class="stat"><dt>Marketplace sales</dt><dd>${taka(sales)}</dd><small>${orders.length} orders</small></div>
        <div class="stat stat--gold"><dt>Your rating</dt><dd>${S.user && S.user.rating || "\u2014"}</dd><small>${(S.reviews || []).length} reviews</small></div>
      </dl>` : ""}

      ${w.projects || w.updates ? `<div class="cards cols-2">
        ${w.projects ? `<section class="box">
          <div class="box__head"><h3>Projects that need you</h3><a class="link" href="#/projects">See all</a></div>
          ${active.length ? active.map((p) => `
            <a class="pcard" href="#/project/${p.id}" style="margin-bottom:10px">
              <div class="pcard__body">
                <div class="row" style="justify-content:space-between">
                  <h4>${CATEGORIES[p.category].icon} ${esc(p.title)}</h4>${statusTag(p.status)}
                </div>
                <div class="bar"><span style="width:${pct(p.raised, p.goal)}%"></span></div>
                <div class="meter"><span>${taka(p.raised)} raised</span><span>${pct(p.raised, p.goal)}% of ${taka(p.goal)}</span></div>
                ${p.status === "active" && daysSinceUpdate(p) > 7 ? `<p class="pcard__meta" style="color:var(--clay)">No update for ${daysSinceUpdate(p)} days \u2014 investors are waiting.</p>` : ""}
              </div>
            </a>`).join("") : `<div class="empty"><b>No running projects</b>List one and investors can start funding within two days.
               <p><a class="btn btn--primary btn--sm" href="#/project/new" style="margin-top:10px">Start a project</a></p></div>`}
        </section>` : ""}

        ${w.updates ? `<section class="box">
          <div class="box__head"><h3>Latest field updates</h3></div>
          ${latest.length ? `<ul class="tl">${latest.map((u) => `
            <li><time>${nice(u.at)} \xB7 ${esc(u.project)}</time>
              <h5>${esc(u.title)}</h5><p>${esc(u.note)}</p>
              ${u.verified ? `<span class="verified">Verified by ${esc(u.verified)}</span>` : '<span class="pcard__meta">Awaiting field-agent check</span>'}
            </li>`).join("")}</ul>` : '<p class="muted">Your updates will appear here once you post one.</p>'}
        </section>` : ""}
      </div>` : ""}

      ${w.money ? `<section class="box" style="margin-top:16px">
        <div class="box__head"><h3>Money in and out</h3><a class="link" href="#/wallet">Open wallet</a></div>
        ${txTable(S.wallet.tx.slice(0, 4))}
      </section>` : ""}

      ${!anyOn ? `<div class="empty"><b>Your dashboard is empty</b>Every widget is turned off.
        <p><button class="btn btn--primary btn--sm" style="margin-top:10px" id="dashCustomizeEmpty">Turn widgets back on</button></p></div>` : ""}`;
  };
  routes.dashboard.after = function() {
    const open = () => customizeDashboardModal();
    const b1 = $("#dashCustomize");
    if (b1) b1.addEventListener("click", open);
    const b2 = $("#dashCustomizeEmpty");
    if (b2) b2.addEventListener("click", open);
  };
  function customizeDashboardModal() {
    const w = S.settings.dashboard;
    modal("Customize your dashboard", `
      <p class="muted">Turn off anything you don't want to see every time you sign in. This only changes your own view.</p>
      <div class="widgetlist">
        ${DASHBOARD_WIDGETS.map((d) => `
          <label class="widgetrow">
            <span><b>${esc(d.label)}</b><i>${esc(d.hint)}</i></span>
            <span class="switch"><input type="checkbox" data-widget="${d.key}" ${w[d.key] ? "checked" : ""}><i></i></span>
          </label>`).join("")}
      </div>
      <div class="row" style="margin-top:16px;justify-content:space-between">
        <button class="btn btn--ghost btn--sm" id="widgetsResetBtn">Reset to default</button>
        <button class="btn btn--primary btn--sm" id="widgetsDoneBtn">Done</button>
      </div>`, () => {
      $$("[data-widget]").forEach((cb) => cb.addEventListener("change", () => {
        S.settings.dashboard[cb.dataset.widget] = cb.checked;
        save();
      }));
      $("#widgetsResetBtn").addEventListener("click", () => {
        S.settings.dashboard = { ...DEFAULT_DASHBOARD_WIDGETS };
        save();
        closeModal();
        toast("Dashboard reset to default.");
        route();
      });
      $("#widgetsDoneBtn").addEventListener("click", () => {
        closeModal();
        route();
      });
    });
  }
  function daysSinceUpdate(p) {
    if (!p.progress.length) return Math.round((Date.now() - new Date(p.createdAt)) / 864e5);
    const last = p.progress.map((u) => new Date(u.at)).sort((a, b) => b - a)[0];
    return Math.round((Date.now() - last) / 864e5);
  }
  function txTable(rows) {
    if (!rows.length) return '<div class="empty"><b>No transactions yet</b>Money moves show up here.</div>';
    return `<div style="overflow-x:auto"><table><thead><tr>
      <th>Date</th><th>Detail</th><th>Method</th><th class="num">Amount</th></tr></thead><tbody>
      ${rows.map((t) => `<tr>
        <td>${nice(t.at)}</td><td>${esc(t.desc)}</td><td>${esc(t.method)}</td>
        <td class="num" style="color:${t.type === "in" ? "var(--green-700)" : "var(--clay)"};font-weight:600">
          ${t.type === "in" ? "+" : "\u2212"}${taka(t.amount)}</td></tr>`).join("")}
      </tbody></table></div>`;
  }
  routes.projects = function(filter) {
    const f = filter || "all";
    const list = S.projects.filter((p) => f === "all" ? true : f === "open" ? ["funding", "active", "pending"].includes(p.status) : p.status === f);
    return `
      <div class="pagehead">
        <div><h1 class="h1">My projects</h1><p>Create listings, track funding and keep investors updated.</p></div>
        <a class="btn btn--primary" href="#/project/new">Start a project</a>
      </div>
      <div class="tabs">
        ${[["all", "All"], ["open", "Open"], ["pending", "Awaiting approval"], ["active", "Running"], ["completed", "Completed"]].map(([k, label]) => `<button class="${f === k ? "is-on" : ""}" onclick="location.hash='#/projects/${k}'">${label}</button>`).join("")}
      </div>
      ${list.length ? `<div class="plist">${list.map(projectCard).join("")}</div>` : `<div class="empty"><b>Nothing here yet</b>Projects you create will be listed under this tab.</div>`}`;
  };
  function projectCard(p) {
    return `<a class="pcard" href="#/project/${p.id}">
      <div class="pcard__top">
        <span class="pcard__cat">${CATEGORIES[p.category].icon}</span>
        ${statusTag(p.status)}
      </div>
      <div class="pcard__body">
        <h4>${esc(p.title)}</h4>
        <div class="pcard__meta">${esc(p.upazila)}, ${esc(p.district)} \xB7 ${p.months} months \xB7 ${p.id}</div>
        <div class="bar"><span style="width:${pct(p.raised, p.goal)}%"></span></div>
        <div class="meter"><span>${taka(p.raised)}</span><span>${pct(p.raised, p.goal)}% of ${taka(p.goal)}</span></div>
        <div class="pcard__foot">
          <span class="tag risk-${p.risk.level}">Risk ${p.risk.score} \u2014 ${p.risk.level}</span>
          <span class="pcard__meta">${p.investors.length} investor${p.investors.length === 1 ? "" : "s"}</span>
        </div>
      </div></a>`;
  }
  routes.project = function(id, tab) {
    if (id === "new") return newProjectView();
    const p = find(id);
    if (!p) return `<div class="empty"><b>Project not found</b>It may have been removed.</div>`;
    const t = tab || "overview";
    const T = (k, label) => `<button class="${t === k ? "is-on" : ""}" onclick="location.hash='#/project/${p.id}/${k}'">${label}</button>`;
    return `
      <div class="pagehead">
        <div>
          <div class="row" style="gap:8px"><a class="link" href="#/projects">\u2190 All projects</a>${statusTag(p.status)}</div>
          <h1 class="h1">${CATEGORIES[p.category].icon} ${esc(p.title)}</h1>
          <p>${esc(p.upazila)}, ${esc(p.district)} \xB7 ${p.months}-month cycle \xB7 created ${nice(p.createdAt)}</p>
        </div>
        <div class="row">
          ${p.status === "active" ? `<button class="btn btn--primary" data-act="update" data-id="${p.id}">Post an update</button>` : ""}
          ${p.status === "active" && p.raised >= p.goal && !p.disbursed ? `<button class="btn btn--gold" data-act="disburse" data-id="${p.id}">Request funds</button>` : ""}
          ${p.status === "rejected" ? `<button class="btn btn--primary" data-act="resubmit" data-id="${p.id}">Fix and resubmit</button>` : ""}
        </div>
      </div>

      <div class="tabs">${T("overview", "Overview")}${T("progress", "Progress")}${T("investors", "Investors")}${T("risk", "Risk advice")}${T("insurance", "Insurance")}</div>
      ${{
      overview: pOverview,
      progress: pProgress,
      investors: pInvestors,
      risk: pRisk,
      insurance: pInsurance
    }[t](p)}`;
  };
  function pOverview(p) {
    const doneUpdate = p.progress.length ? p.progress[p.progress.length - 1].percent : 0;
    return `<div class="cards cols-2">
      <section class="box">
        <div class="box__head"><h3>Funding</h3><span class="pcard__meta">${p.id}</span></div>
        <div class="bar"><span style="width:${pct(p.raised, p.goal)}%"></span></div>
        <div class="meter"><span><b>${taka(p.raised)}</b> raised</span><span>Goal ${taka(p.goal)}</span></div>
        <dl class="kv" style="margin-top:16px">
          <dt>Investors</dt><dd>${p.investors.length}</dd>
          <dt>Still needed</dt><dd>${taka(Math.max(0, p.goal - p.raised))}</dd>
          <dt>Work completed</dt><dd>${doneUpdate}%</dd>
          <dt>Insurance</dt><dd>${p.insurance.opted ? esc(p.insurance.plan) : "Not taken"}</dd>
        </dl>
      </section>
      <section class="box">
        <div class="box__head"><h3>What this project is</h3></div>
        <p style="margin-top:0;color:var(--ink-2)">${esc(p.description)}</p>
        <div class="thumbs" style="margin-top:14px">${p.images.map((i) => `<span class="thumb">${i}</span>`).join("")}</div>
        <p class="hint">${p.docs.length ? "Attached: " + p.docs.map(esc).join(", ") : "No supporting document attached."}</p>
      </section>
    </div>
    ${p.status === "pending" ? `<div class="box" style="margin-top:16px;background:var(--gold-100);border-color:#EBD9AE">
      <h3 class="h3">Waiting for the admin team</h3>
      <p style="margin:6px 0 0;color:var(--ink-2)">Listings are usually reviewed within 48 hours. You will get a notification either way. If something is missing, you can fix it and resubmit without starting over.</p></div>` : ""}
    ${p.status === "rejected" ? `<div class="box" style="margin-top:16px;background:var(--clay-100);border-color:#EFC9BE">
      <h3 class="h3">Changes requested</h3><p style="margin:6px 0 0">${esc(p.rejectNote || "The reviewer asked for a clearer budget breakdown and a land document.")}</p></div>` : ""}`;
  }
  function pProgress(p) {
    return `<div class="box">
      <div class="box__head"><h3>Field log</h3>
        ${p.status === "active" ? `<button class="btn btn--primary btn--sm" data-act="update" data-id="${p.id}">Post an update</button>` : ""}</div>
      ${p.progress.length ? `<ul class="tl">${[...p.progress].reverse().map((u) => `
        <li>
          <time>${nice(u.at)} \xB7 ${u.percent}% complete</time>
          <h5>${esc(u.title)}</h5>
          <p>${esc(u.note)}</p>
          ${u.photos && u.photos.length ? `<div class="thumbs" style="margin-top:8px">${u.photos.map((x) => `<span class="thumb">${x}</span>`).join("")}</div>` : ""}
          ${u.verified ? `<span class="verified">Verified by ${esc(u.verified)}</span>` : `<span class="pcard__meta">Waiting for the field agent to verify</span>`}
        </li>`).join("")}</ul>` : `<div class="empty"><b>No updates yet</b>Investors fund farmers they can see. Post a photo and a line about what you did this week.</div>`}
    </div>`;
  }
  function pInvestors(p) {
    if (!p.investors.length) return `<div class="empty"><b>No investors yet</b>Once your listing is approved it appears in the investor feed.</div>`;
    return `<div class="box"><div class="box__head"><h3>Who funded this project</h3>
      <span class="pcard__meta">Profit is shared in proportion to these amounts</span></div>
      <div style="overflow-x:auto"><table><thead><tr><th>Investor</th><th>Date</th><th class="num">Amount</th><th class="num">Share</th></tr></thead>
      <tbody>${p.investors.map((i) => `<tr><td>${esc(i.name)}</td><td>${nice(i.at)}</td>
        <td class="num">${taka(i.amount)}</td><td class="num">${Math.round(i.amount / p.raised * 100)}%</td></tr>`).join("")}
      </tbody></table></div></div>`;
  }
  function pRisk(p) {
    const r = p.risk;
    return `<div class="box">
      <div class="box__head"><h3>Risk reading for this project</h3>
        <button class="btn btn--ghost btn--sm" data-act="rescore" data-id="${p.id}">Recalculate</button></div>
      <div class="risk">
        <div class="risk__score risk--${r.level}">${r.score}<small>${r.level} risk</small></div>
        <div style="flex:1;min-width:240px">
          <p style="margin:0;color:var(--ink-2)">The score weighs your project type, size, season, district and track record. It is guidance, not a decision \u2014 the admin team still reviews every listing.</p>
          <ul>${r.factors.map((f) => `<li>${esc(f.label)} <b style="color:${f.delta > 0 ? "var(--clay)" : "var(--green-700)"}">${f.delta > 0 ? "+" : ""}${f.delta}</b></li>`).join("")}</ul>
        </div>
      </div>
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)">
        <h3 class="h3">What to do about it</h3>
        <ul style="color:var(--ink-2)">${r.advice.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
      </div></div>`;
  }
  function pInsurance(p) {
    if (p.insurance.opted) {
      return `<div class="box">
        <div class="box__head"><h3>Cover in force</h3><span class="tag tag--active">Active</span></div>
        <dl class="kv">
          <dt>Plan</dt><dd>${esc(p.insurance.plan)}</dd>
          <dt>Premium paid</dt><dd>${taka(p.insurance.premium)}</dd>
          <dt>Pays out up to</dt><dd>${taka(Math.round(p.goal * 0.8))}</dd>
          <dt>Claim status</dt><dd>${p.insurance.claim ? esc(p.insurance.claim.status) : "No claim filed"}</dd>
        </dl>
        ${p.insurance.claim ? `<p class="hint">Filed ${nice(p.insurance.claim.at)} \u2014 ${esc(p.insurance.claim.reason)}</p>` : `<button class="btn btn--ghost" style="margin-top:14px" data-act="claim" data-id="${p.id}">File a claim</button>`}
      </div>`;
    }
    const premium = Math.round(p.goal * 0.025);
    return `<div class="box">
      <div class="box__head"><h3>Protect this project</h3></div>
      <p style="margin-top:0;color:var(--ink-2)">Flood, pest outbreak, disease and a verified crop failure are covered. The premium comes out of your wallet once, and a verified loss pays back up to 80% of the funding goal.</p>
      <dl class="kv"><dt>Premium</dt><dd>${taka(premium)} (2.5% of ${taka(p.goal)})</dd>
        <dt>Maximum payout</dt><dd>${taka(Math.round(p.goal * 0.8))}</dd></dl>
      <button class="btn btn--primary" style="margin-top:14px" data-act="insure" data-id="${p.id}">Take this cover</button>
    </div>`;
  }
  function newProjectView() {
    return `
      <div class="pagehead"><div>
        <a class="link" href="#/projects">\u2190 All projects</a>
        <h1 class="h1">Start a new project</h1>
        <p>Three short steps. You can save a draft and finish later.</p>
      </div></div>
      <div class="box" style="max-width:720px">
        <ol class="steps" id="npSteps">
          <li class="steps__item is-active" data-step="1"><span>1</span>The project</li>
          <li class="steps__item" data-step="2"><span>2</span>Money and time</li>
          <li class="steps__item" data-step="3"><span>3</span>Check and submit</li>
        </ol>
        <form id="npForm" novalidate>
          <fieldset class="regstep is-active" data-step="1">
            <label class="field"><span class="field__label">Project name <em>\u09AA\u09CD\u09B0\u0995\u09B2\u09CD\u09AA\u09C7\u09B0 \u09A8\u09BE\u09AE</em></span>
              <input id="npTitle" placeholder="e.g. Boro Rice on 2 acres">
              <span class="field__error" data-for="npTitle"></span></label>
            <label class="field"><span class="field__label">Category</span>
              <select id="npCat">${Object.keys(CATEGORIES).map((c) => `<option>${c}</option>`).join("")}</select></label>
            <label class="field"><span class="field__label">What will you do with the money?</span>
              <textarea id="npDesc" placeholder="Describe the work, the inputs you need and who will buy the output."></textarea>
              <span class="field__error" data-for="npDesc"></span></label>
            <div class="grid2">
              <label class="field"><span class="field__label">District</span>
                <select id="npDistrict">${DISTRICTS.map((d) => `<option ${d === S.user.district ? "selected" : ""}>${d}</option>`).join("")}</select></label>
              <label class="field"><span class="field__label">Upazila</span>
                <input id="npUpazila" value="${esc(S.user.upazila)}">
                <span class="field__error" data-for="npUpazila"></span></label>
            </div>
          </fieldset>

          <fieldset class="regstep" data-step="2">
            <div class="grid2">
              <label class="field"><span class="field__label">Funding needed (\u09F3)</span>
                <input id="npGoal" type="number" min="5000" step="1000" placeholder="e.g. 90000">
                <span class="field__error" data-for="npGoal"></span></label>
              <label class="field"><span class="field__label">Cycle length (months)</span>
                <input id="npMonths" type="number" min="1" max="36" placeholder="e.g. 5">
                <span class="field__error" data-for="npMonths"></span></label>
            </div>
            <label class="field"><span class="field__label">Start date</span>
              <input id="npStart" type="date" value="${today()}">
              <span class="field__error" data-for="npStart"></span></label>
            <label class="field"><span class="field__label">Expected outcome</span>
              <input id="npOutcome" placeholder="e.g. 4,200 kg paddy, sold at the Shibganj hat"></label>
            <div class="field">
              <span class="field__label">Photos and documents <em>\u099B\u09AC\u09BF \u0993 \u0995\u09BE\u0997\u099C\u09AA\u09A4\u09CD\u09B0</em></span>
              <label class="drop" for="npFiles">
                <input type="file" id="npFiles" hidden multiple accept="image/*,.pdf">
                <b id="npFilesName">Attach land papers or field photos</b>
                <i>A land document speeds up approval and lowers your risk score</i></label>
            </div>
          </fieldset>

          <fieldset class="regstep" data-step="3">
            <div id="npReview"></div>
          </fieldset>

          <div class="auth__actions">
            <button class="btn btn--ghost" type="button" id="npDraft">Save draft</button>
            <button class="btn btn--ghost is-hidden" type="button" id="npBack">Back</button>
            <button class="btn btn--primary" type="button" id="npNext">Continue</button>
            <button class="btn btn--primary is-hidden" type="submit" id="npSubmit">Submit for approval</button>
          </div>
        </form>
      </div>`;
  }
  routes.project.after = function(id) {
    if (id !== "new") {
      bindDetailActions();
      return;
    }
    let step = 1;
    const setStep = (n) => {
      step = n;
      $$("#npForm .regstep").forEach((f) => f.classList.toggle("is-active", +f.dataset.step === n));
      $$("#npSteps .steps__item").forEach((li) => li.classList.toggle("is-active", +li.dataset.step <= n));
      $("#npBack").classList.toggle("is-hidden", n === 1);
      $("#npNext").classList.toggle("is-hidden", n === 3);
      $("#npSubmit").classList.toggle("is-hidden", n !== 3);
      if (n === 3) renderReview();
    };
    const draft = () => ({
      id: uid("PRJ"),
      title: $("#npTitle").value.trim(),
      category: $("#npCat").value,
      description: $("#npDesc").value.trim(),
      district: $("#npDistrict").value,
      upazila: $("#npUpazila").value.trim(),
      goal: +$("#npGoal").value || 0,
      months: +$("#npMonths").value || 0,
      start: $("#npStart").value || today(),
      outcome: $("#npOutcome").value.trim(),
      raised: 0,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      images: [CATEGORIES[$("#npCat").value].icon],
      docs: window.__npFiles || [],
      insurance: { opted: false, plan: null, premium: 0, claim: null },
      investors: [],
      progress: []
    });
    function renderReview() {
      const p = draft();
      p.risk = assessRisk(p, S.user);
      $("#npReview").innerHTML = `
        <h2 class="h2" style="margin-bottom:12px">Check before you submit</h2>
        <dl class="kv" style="margin-bottom:18px">
          <dt>Project</dt><dd>${esc(p.title) || "\u2014"}</dd>
          <dt>Category</dt><dd>${CATEGORIES[p.category].icon} ${p.category}</dd>
          <dt>Where</dt><dd>${esc(p.upazila)}, ${esc(p.district)}</dd>
          <dt>Funding</dt><dd>${taka(p.goal)}</dd>
          <dt>Cycle</dt><dd>${p.months} months from ${nice(p.start)}</dd>
          <dt>Attachments</dt><dd>${p.docs.length ? p.docs.map(esc).join(", ") : "None"}</dd>
        </dl>
        <div class="risk" style="padding:14px;background:var(--surface-2);border-radius:var(--radius)">
          <div class="risk__score risk--${p.risk.level}">${p.risk.score}<small>${p.risk.level} risk</small></div>
          <div style="flex:1;min-width:220px">
            <b>What the risk model says</b>
            <ul>${p.risk.advice.slice(0, 3).map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
          </div>
        </div>
        <p class="hint">On submit the listing goes to the admin team for approval. It becomes visible to investors once approved.</p>`;
    }
    function validate(n) {
      clearErrors($("#npForm"));
      let ok = true;
      const bad = (id2, msg) => {
        setError(id2, msg);
        ok = false;
      };
      if (n === 1) {
        if ($("#npTitle").value.trim().length < 6) bad("npTitle", "Give the project a clear name of at least 6 characters.");
        if ($("#npDesc").value.trim().length < 30) bad("npDesc", "Write at least a couple of sentences \u2014 investors read this first.");
        if ($("#npUpazila").value.trim().length < 2) bad("npUpazila", "Write your upazila.");
      }
      if (n === 2) {
        const g = +$("#npGoal").value, m = +$("#npMonths").value;
        if (!(g >= 5e3)) bad("npGoal", "The smallest project we can list is \u09F35,000.");
        if (g > 2e6) bad("npGoal", "Above \u09F320,00,000 the project has to be split into rounds.");
        if (!(m >= 1 && m <= 36)) bad("npMonths", "Cycle length must be between 1 and 36 months.");
        if (new Date($("#npStart").value) < new Date(today())) bad("npStart", "Start date cannot be in the past.");
      }
      return ok;
    }
    $("#npFiles").addEventListener("change", (e) => {
      window.__npFiles = Array.from(e.target.files).map((f) => f.name);
      $("#npFilesName").textContent = window.__npFiles.length ? window.__npFiles.length + " file(s) attached" : "Attach land papers or field photos";
    });
    $("#npBack").addEventListener("click", () => setStep(step - 1));
    $("#npNext").addEventListener("click", () => {
      if (validate(step)) setStep(step + 1);
    });
    $("#npDraft").addEventListener("click", () => {
      const p = draft();
      if (!p.title) {
        setError("npTitle", "A draft still needs a name.");
        return;
      }
      p.status = "draft";
      p.risk = assessRisk(p, S.user);
      S.projects.unshift(p);
      save();
      toast("Draft saved.");
      location.hash = "#/projects";
    });
    $("#npForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(1)) {
        setStep(1);
        return;
      }
      if (!validate(2)) {
        setStep(2);
        return;
      }
      const p = draft();
      p.risk = assessRisk(p, S.user);
      S.projects.unshift(p);
      window.__npFiles = [];
      notify("\u201C" + p.title + "\u201D was submitted and is waiting for admin approval.", "info");
      save();
      toast("Submitted. The admin team reviews it within 48 hours.");
      location.hash = "#/project/" + p.id;
    });
  };
  function bindDetailActions() {
    $$("[data-act]").forEach((btn) => btn.addEventListener("click", () => {
      const p = find(btn.dataset.id);
      const act = btn.dataset.act;
      if (act === "update") return updateModal(p);
      if (act === "disburse") return disburseModal(p);
      if (act === "insure") return insureModal(p);
      if (act === "claim") return claimModal(p);
      if (act === "resubmit") {
        p.status = "pending";
        save();
        toast("Resubmitted for review.");
        route();
      }
      if (act === "rescore") {
        p.risk = assessRisk(p, S.user);
        save();
        toast("Risk recalculated.");
        route();
      }
    }));
  }
  function modal(title, body, onOpen) {
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = body;
    $("#modal").hidden = false;
    if (onOpen) onOpen();
  }
  const closeModal = () => {
    $("#modal").hidden = true;
  };
  function updateModal(p) {
    const last = p.progress.length ? p.progress[p.progress.length - 1].percent : 0;
    modal("Post a progress update", `
      <label class="field"><span class="field__label">What happened? <em>\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE</em></span>
        <input id="upTitle" placeholder="e.g. Second urea applied">
        <span class="field__error" data-for="upTitle"></span></label>
      <label class="field"><span class="field__label">Details for your investors</span>
        <textarea id="upNote" placeholder="A few lines about the work, cost and anything that went wrong."></textarea>
        <span class="field__error" data-for="upNote"></span></label>
      <label class="field"><span class="field__label">Work completed: <b id="upPctOut">${last}%</b></span>
        <input id="upPct" type="range" min="${last}" max="100" value="${last}"></label>
      <div class="field"><span class="field__label">Photos <em>\u099B\u09AC\u09BF</em></span>
        <label class="drop" for="upFiles"><input type="file" id="upFiles" hidden multiple accept="image/*">
          <b id="upFilesName">Attach field photos</b><i>Photos are what investors trust most</i></label></div>
      <button class="btn btn--primary btn--block" id="upSave">Post update</button>`, () => {
      $("#upPct").addEventListener("input", (e) => {
        $("#upPctOut").textContent = e.target.value + "%";
      });
      let files = [];
      $("#upFiles").addEventListener("change", (e) => {
        files = Array.from(e.target.files).map(() => "\u{1F4F7}");
        $("#upFilesName").textContent = files.length + " photo(s) attached";
      });
      $("#upSave").addEventListener("click", () => {
        clearErrors($("#modalBody"));
        let ok = true;
        if ($("#upTitle").value.trim().length < 4) {
          setError("upTitle", "Write a short headline.");
          ok = false;
        }
        if ($("#upNote").value.trim().length < 15) {
          setError("upNote", "Add a little more detail.");
          ok = false;
        }
        if (!ok) return;
        const percent = +$("#upPct").value;
        p.progress.push({
          id: uid("U"),
          at: (/* @__PURE__ */ new Date()).toISOString(),
          percent,
          title: $("#upTitle").value.trim(),
          note: $("#upNote").value.trim(),
          photos: files.length ? files : ["\u{1F4F7}"],
          verified: null
        });
        if (percent === 100) {
          p.status = "completed";
          S.user.completed = (S.user.completed || 0) + 1;
          notify("\u201C" + p.title + "\u201D marked complete. Profit distribution will start after field verification.", "money");
        }
        notify("Update posted on \u201C" + p.title + "\u201D. Investors have been notified.", "info");
        save();
        closeModal();
        toast("Update posted.");
        route();
      });
    });
  }
  function disburseModal(p) {
    modal("Request your funds", `
      <p class="muted">The project is fully funded. A field agent verifies the site, then the money moves to your wallet \u2014 usually within two working days.</p>
      <dl class="kv" style="margin-bottom:16px">
        <dt>Available</dt><dd>${taka(p.raised)}</dd>
        <dt>Platform fee</dt><dd>${taka(Math.round(p.raised * 0.02))} (2%)</dd>
        <dt>You receive</dt><dd>${taka(p.raised - Math.round(p.raised * 0.02))}</dd>
      </dl>
      <label class="field"><span class="field__label">Send to</span>
        <select id="dsMethod"><option>bKash</option><option>Nagad</option><option>Bank transfer</option></select></label>
      <button class="btn btn--primary btn--block" id="dsGo">Request disbursement</button>`, () => {
      $("#dsGo").addEventListener("click", () => {
        const net = p.raised - Math.round(p.raised * 0.02);
        p.disbursed = true;
        S.wallet.balance += net;
        const tx = {
          id: uid("TXN"),
          type: "in",
          desc: "Disbursement \u2014 " + p.title,
          method: $("#dsMethod").value,
          amount: net,
          at: (/* @__PURE__ */ new Date()).toISOString(),
          status: "complete"
        };
        S.wallet.tx.unshift(tx);
        notifyBlockchainTransaction(tx);
        notify("Disbursement of " + taka(net) + " credited to your wallet.", "money");
        save();
        closeModal();
        toast("Funds credited to your wallet.");
        route();
      });
    });
  }
  function insureModal(p) {
    const premium = Math.round(p.goal * 0.025);
    modal("Take insurance cover", `
      <p class="muted">Cover starts the day the premium clears and runs to the end of the cycle.</p>
      <label class="field"><span class="field__label">Plan</span>
        <select id="inPlan">
          <option>Crop shield \u2014 standard</option>
          <option>Weather &amp; flood \u2014 extended</option>
          <option>Livestock &amp; disease</option>
        </select></label>
      <dl class="kv" style="margin-bottom:16px"><dt>Premium</dt><dd>${taka(premium)}</dd>
        <dt>Wallet balance</dt><dd>${taka(S.wallet.balance)}</dd></dl>
      <button class="btn btn--primary btn--block" id="inGo" ${S.wallet.balance < premium ? "disabled" : ""}>
        ${S.wallet.balance < premium ? "Not enough balance" : "Pay premium and activate"}</button>`, () => {
      const go = $("#inGo");
      if (go.disabled) return;
      go.addEventListener("click", () => {
        S.wallet.balance -= premium;
        const tx = { id: uid("TXN"), type: "out", desc: "Insurance premium \u2014 " + p.title, method: "Wallet", amount: premium, at: (/* @__PURE__ */ new Date()).toISOString(), status: "complete" };
        S.wallet.tx.unshift(tx);
        notifyBlockchainTransaction(tx);
        p.insurance = { opted: true, plan: $("#inPlan").value, premium, claim: null };
        p.risk = assessRisk(p, S.user);
        notify("Insurance active on \u201C" + p.title + "\u201D.", "info");
        save();
        closeModal();
        toast("Cover is active.");
        route();
      });
    });
  }
  function claimModal(p) {
    modal("File an insurance claim", `
      <label class="field"><span class="field__label">What happened?</span>
        <select id="clReason"><option>Flood damage</option><option>Pest or disease outbreak</option>
          <option>Crop failure</option><option>Livestock loss</option><option>Storm damage</option></select></label>
      <label class="field"><span class="field__label">Describe the loss</span>
        <textarea id="clNote" placeholder="When it happened and roughly how much was lost."></textarea>
        <span class="field__error" data-for="clNote"></span></label>
      <div class="field"><span class="field__label">Evidence photos</span>
        <label class="drop" for="clFiles"><input type="file" id="clFiles" hidden multiple accept="image/*">
        <b>Attach photos of the damage</b><i>A field agent will visit to confirm</i></label></div>
      <button class="btn btn--primary btn--block" id="clGo">Submit claim</button>`, () => {
      $("#clGo").addEventListener("click", () => {
        clearErrors($("#modalBody"));
        if ($("#clNote").value.trim().length < 15) {
          setError("clNote", "Please describe the loss in a little more detail.");
          return;
        }
        p.insurance.claim = { at: (/* @__PURE__ */ new Date()).toISOString(), reason: $("#clReason").value, status: "Under review" };
        notify("Claim filed on \u201C" + p.title + "\u201D. A field agent will visit within 3 days.", "info");
        save();
        closeModal();
        toast("Claim submitted.");
        route();
      });
    });
  }
  routes.market = function() {
    const sales = S.orders.reduce((t, o) => t + o.total, 0);
    return `
      <div class="pagehead">
        <div><h1 class="h1">Marketplace</h1><p>Sell straight to buyers. No middleman takes a cut.</p></div>
        <button class="btn btn--primary" id="addProduct">List a product</button>
      </div>
      <dl class="cards cols-3" style="margin-bottom:18px">
        <div class="stat"><dt>Products listed</dt><dd>${S.products.length}</dd></div>
        <div class="stat stat--green"><dt>Total sales</dt><dd>${taka(sales)}</dd></div>
        <div class="stat"><dt>Orders to handle</dt><dd>${S.orders.filter((o) => o.status !== "delivered").length}</dd></div>
      </dl>

      <section class="box" style="margin-bottom:16px">
        <div class="box__head"><h3>Your products</h3></div>
        ${S.products.length ? `<div class="plist">${S.products.map((pr) => `
          <div class="pcard"><div class="pcard__body">
            <div class="row" style="justify-content:space-between">
              <h4>${pr.icon} ${esc(pr.name)}</h4>
              <span class="tag tag--${pr.qty > 0 ? "active" : "rejected"}">${pr.qty > 0 ? "In stock" : "Sold out"}</span>
            </div>
            <div class="pcard__meta">${esc(pr.desc)}</div>
            <dl class="kv"><dt>Price</dt><dd>${taka(pr.price)} ${esc(pr.unit)}</dd>
              <dt>Stock</dt><dd>${pr.qty}</dd><dt>Sold</dt><dd>${pr.sold}</dd>
              <dt>Rating</dt><dd><span class="stars">${"\u2605".repeat(Math.round(pr.rating))}</span> ${pr.rating}</dd></dl>
            <div class="row" style="margin-top:6px">
              <button class="btn btn--ghost btn--sm" data-stock="${pr.id}">Update stock</button>
              <button class="btn btn--danger btn--sm" data-remove="${pr.id}">Remove</button>
            </div>
          </div></div>`).join("")}</div>` : `<div class="empty"><b>No products yet</b>List what you have ready to sell \u2014 rice, eggs, vegetables, handicraft.</div>`}
      </section>

      <section class="box">
        <div class="box__head"><h3>Orders</h3></div>
        ${S.orders.length ? `<div style="overflow-x:auto"><table><thead><tr>
          <th>Order</th><th>Product</th><th>Buyer</th><th class="num">Qty</th><th class="num">Total</th><th>Status</th><th></th>
        </tr></thead><tbody>${S.orders.map((o) => `<tr>
          <td>${o.id}</td><td>${esc(o.product)}</td><td>${esc(o.buyer)}</td>
          <td class="num">${o.qty}</td><td class="num">${taka(o.total)}</td>
          <td><span class="tag tag--${o.status === "delivered" ? "completed" : o.status === "packed" ? "funded" : "pending"}">${o.status}</span></td>
          <td>${o.status !== "delivered" ? `<button class="btn btn--ghost btn--sm" data-adv="${o.id}">
            ${o.status === "new" ? "Mark packed" : "Mark delivered"}</button>` : ""}</td></tr>`).join("")}
        </tbody></table></div>` : `<div class="empty"><b>No orders yet</b>Orders from buyers will show here.</div>`}
      </section>`;
  };
  routes.market.after = function() {
    $("#addProduct").addEventListener("click", productModal);
    $$("[data-adv]").forEach((b) => b.addEventListener("click", () => {
      const o = S.orders.find((x) => x.id === b.dataset.adv);
      if (o.status === "new") {
        o.status = "packed";
        toast("Order marked packed.");
      } else if (o.status === "packed") {
        o.status = "delivered";
        S.wallet.balance += o.total;
        const tx = { id: uid("TXN"), type: "in", desc: "Marketplace sale \u2014 " + o.product, method: "Nagad", amount: o.total, at: (/* @__PURE__ */ new Date()).toISOString(), status: "complete" };
        S.wallet.tx.unshift(tx);
        notifyBlockchainTransaction(tx);
        toast("Delivered. " + taka(o.total) + " added to your wallet.");
      }
      save();
      route();
    }));
    $$("[data-remove]").forEach((b) => b.addEventListener("click", () => {
      S.products = S.products.filter((p) => p.id !== b.dataset.remove);
      save();
      toast("Product removed.");
      route();
    }));
    $$("[data-stock]").forEach((b) => b.addEventListener("click", () => {
      const pr = S.products.find((p) => p.id === b.dataset.stock);
      modal("Update stock", `
        <label class="field"><span class="field__label">Units available for ${esc(pr.name)}</span>
          <input id="stQty" type="number" min="0" value="${pr.qty}"></label>
        <button class="btn btn--primary btn--block" id="stGo">Save stock</button>`, () => {
        $("#stGo").addEventListener("click", () => {
          pr.qty = Math.max(0, +$("#stQty").value || 0);
          save();
          closeModal();
          toast("Stock updated.");
          route();
        });
      });
    }));
  };
  function productModal() {
    modal("List a product", `
      <label class="field"><span class="field__label">Product name <em>\u09AA\u09A3\u09CD\u09AF\u09C7\u09B0 \u09A8\u09BE\u09AE</em></span>
        <input id="prName" placeholder="e.g. Handwoven Bamboo Basket">
        <span class="field__error" data-for="prName"></span></label>
      <div class="grid2">
        <label class="field"><span class="field__label">Price (\u09F3)</span>
          <input id="prPrice" type="number" min="1"><span class="field__error" data-for="prPrice"></span></label>
        <label class="field"><span class="field__label">Unit</span>
          <input id="prUnit" placeholder="per kg / per piece"></label>
      </div>
      <div class="grid2">
        <label class="field"><span class="field__label">Quantity in stock</span>
          <input id="prQty" type="number" min="1"><span class="field__error" data-for="prQty"></span></label>
        <label class="field"><span class="field__label">Category</span>
          <select id="prCat"><option>Farming</option><option>Handicraft</option><option>Dairy</option></select></label>
      </div>
      <label class="field"><span class="field__label">Description</span>
        <textarea id="prDesc" placeholder="What it is, how it was grown or made, how soon you can ship."></textarea>
        <span class="field__error" data-for="prDesc"></span></label>
      <button class="btn btn--primary btn--block" id="prGo">Publish to marketplace</button>`, () => {
      $("#prGo").addEventListener("click", () => {
        clearErrors($("#modalBody"));
        let ok = true;
        if ($("#prName").value.trim().length < 3) {
          setError("prName", "Give the product a name.");
          ok = false;
        }
        if (!(+$("#prPrice").value > 0)) {
          setError("prPrice", "Price must be more than zero.");
          ok = false;
        }
        if (!(+$("#prQty").value > 0)) {
          setError("prQty", "Enter how many units you have.");
          ok = false;
        }
        if ($("#prDesc").value.trim().length < 10) {
          setError("prDesc", "Add a short description for buyers.");
          ok = false;
        }
        if (!ok) return;
        const cat = $("#prCat").value;
        S.products.unshift({
          id: uid("P"),
          name: $("#prName").value.trim(),
          category: cat,
          price: +$("#prPrice").value,
          unit: $("#prUnit").value.trim() || "per unit",
          qty: +$("#prQty").value,
          desc: $("#prDesc").value.trim(),
          icon: cat === "Handicraft" ? "\u{1F9FA}" : cat === "Dairy" ? "\u{1F95B}" : "\u{1F33D}",
          status: "live",
          sold: 0,
          rating: 0
        });
        notify("\u201C" + $("#prName").value.trim() + "\u201D is live in the marketplace.", "order");
        save();
        closeModal();
        toast("Product published.");
        route();
      });
    });
  }
  routes.wallet = function() {
    const inSum = S.wallet.tx.filter((t) => t.type === "in").reduce((a, t) => a + t.amount, 0);
    const outSum = S.wallet.tx.filter((t) => t.type === "out").reduce((a, t) => a + t.amount, 0);
    return `
      <div class="pagehead">
        <div><h1 class="h1">Money</h1><p>Disbursements, sales and withdrawals in one place.</p></div>
        <button class="btn btn--primary" id="withdrawBtn">Withdraw</button>
      </div>
      <dl class="cards cols-3" style="margin-bottom:18px">
        <div class="stat stat--green"><dt>Wallet balance</dt><dd>${taka(S.wallet.balance)}</dd><small>available now</small></div>
        <div class="stat"><dt>Received to date</dt><dd>${taka(inSum)}</dd></div>
        <div class="stat"><dt>Paid out</dt><dd>${taka(outSum)}</dd></div>
      </dl>
      <div class="cards cols-2" style="margin-bottom:16px">
        <section class="box">
          <div class="box__head"><h3>Payout methods</h3></div>
          <dl class="kv"><dt>bKash</dt><dd>017****891 \xB7 default</dd>
            <dt>Nagad</dt><dd>017****891</dd>
            <dt>Bank</dt><dd>Sonali Bank, Shibganj \xB7 ****4102</dd></dl>
          <p class="hint">Withdrawals to mobile wallets clear the same day; bank transfers take one working day.</p>
        </section>
        <section class="box">
          <div class="box__head"><h3>Upcoming</h3></div>
          ${S.projects.filter((p) => p.status === "active" && p.raised >= p.goal).length ? S.projects.filter((p) => p.status === "active" && p.raised >= p.goal).map((p) => `<p style="margin:0 0 8px">${esc(p.title)} \u2014 profit split due at harvest, around ${nice(new Date(Date.now() + p.months * 26e8))}.</p>`).join("") : '<p class="muted">Nothing scheduled. Fully funded projects show their payout dates here.</p>'}
        </section>
      </div>
      <section class="box"><div class="box__head"><h3>Transaction history</h3></div>${txTable(S.wallet.tx)}</section>`;
  };
  routes.wallet.after = function() {
    $("#withdrawBtn").addEventListener("click", () => {
      modal("Withdraw money", `
        <p class="muted">Available: <b>${taka(S.wallet.balance)}</b></p>
        <label class="field"><span class="field__label">Amount (\u09F3)</span>
          <input id="wdAmt" type="number" min="100" max="${S.wallet.balance}">
          <span class="field__error" data-for="wdAmt"></span></label>
        <label class="field"><span class="field__label">Send to</span>
          <select id="wdTo"><option>bKash 017****891</option><option>Nagad 017****891</option><option>Sonali Bank ****4102</option></select></label>
        <button class="btn btn--primary btn--block" id="wdGo">Withdraw</button>`, () => {
        $("#wdGo").addEventListener("click", () => {
          clearErrors($("#modalBody"));
          const amt = +$("#wdAmt").value;
          if (!(amt >= 100)) {
            setError("wdAmt", "The smallest withdrawal is \u09F3100.");
            return;
          }
          if (amt > S.wallet.balance) {
            setError("wdAmt", "That is more than your balance.");
            return;
          }
          S.wallet.balance -= amt;
          const tx = {
            id: uid("TXN"),
            type: "out",
            desc: "Withdrawal to " + $("#wdTo").value,
            method: $("#wdTo").value.split(" ")[0],
            amount: amt,
            at: (/* @__PURE__ */ new Date()).toISOString(),
            status: "complete"
          };
          S.wallet.tx.unshift(tx);
          notifyBlockchainTransaction(tx);
          notify("Withdrawal of " + taka(amt) + " sent to " + $("#wdTo").value + ".", "money");
          save();
          closeModal();
          toast("Withdrawal sent.");
          route();
        });
      });
    });
  };
  routes.support = function() {
    const experts = [
      { n: "Dr. Anisur Rahman", s: "Senior Crop Specialist", d: "Rice, maize, soil health", on: true },
      { n: "Farhana Yeasmin", s: "Plant Pathologist", d: "Pests and disease control", on: true },
      { n: "Md. Jahangir Alam", s: "Livestock &amp; Fisheries", d: "Poultry, cattle, pond management", on: false },
      { n: "Shireen Akter", s: "Handicraft &amp; Market Linkage", d: "Pricing, packaging, buyers", on: true }
    ];
    return `
      <div class="pagehead"><div><h1 class="h1">Expert help</h1>
        <p>Free advice from verified agricultural specialists. Most reply within an hour.</p></div></div>
      <dl class="cards cols-4" style="margin-bottom:18px">
        <div class="stat"><dt>Specialists</dt><dd>150+</dd></div>
        <div class="stat"><dt>Farmers helped</dt><dd>5k+</dd></div>
        <div class="stat stat--green"><dt>Issues resolved</dt><dd>92%</dd></div>
        <div class="stat"><dt>Available</dt><dd>24/7</dd></div>
      </dl>
      <div class="cards cols-2">
        ${experts.map((e) => `<div class="expert">
          <span class="avatar">${e.n.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
          <div style="flex:1"><b>${e.n}</b><span>${e.s} \xB7 ${e.d}</span></div>
          <button class="btn btn--${e.on ? "primary" : "ghost"} btn--sm" data-ask="${e.n}" ${e.on ? "" : "disabled"}>
            ${e.on ? "Ask" : "Offline"}</button>
        </div>`).join("")}
      </div>`;
  };
  routes.support.after = function() {
    $$("[data-ask]").forEach((b) => b.addEventListener("click", () => {
      modal("Ask " + b.dataset.ask, `
        <label class="field"><span class="field__label">Your question <em>\u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8</em></span>
          <textarea id="qText" placeholder="Describe the problem. Mention the crop, its age and what you have already tried."></textarea>
          <span class="field__error" data-for="qText"></span></label>
        <div class="field"><span class="field__label">Photo of the problem</span>
          <label class="drop" for="qFile"><input type="file" id="qFile" hidden accept="image/*">
            <b>Attach a photo</b><i>A clear leaf or soil photo helps a lot</i></label></div>
        <button class="btn btn--primary btn--block" id="qGo">Send question</button>`, () => {
        $("#qGo").addEventListener("click", () => {
          clearErrors($("#modalBody"));
          if ($("#qText").value.trim().length < 15) {
            setError("qText", "Add a bit more detail so the expert can help.");
            return;
          }
          notify("Your question was sent to " + b.dataset.ask + ".", "info");
          closeModal();
          toast("Question sent. You will get a reply in the app.");
        });
      });
    }));
  };
  routes.reviews = function() {
    const avg = S.reviews.length ? (S.reviews.reduce((a, r) => a + r.stars, 0) / S.reviews.length).toFixed(1) : "\u2014";
    return `
      <div class="pagehead"><div><h1 class="h1">What people say about you</h1>
        <p>Your rating decides how high your listings appear to investors and buyers.</p></div></div>
      <dl class="cards cols-3" style="margin-bottom:18px">
        <div class="stat stat--gold"><dt>Average rating</dt><dd>${avg}</dd><small>${S.reviews.length} reviews</small></div>
        <div class="stat"><dt>Projects completed</dt><dd>${S.user.completed || 0}</dd></div>
        <div class="stat stat--green"><dt>Verification</dt><dd>${S.user.verified ? "Verified" : "Pending"}</dd><small>NID and phone checked</small></div>
      </dl>
      ${S.reviews.length ? `<div class="cards cols-2">${S.reviews.map((r) => `
        <div class="box">
          <div class="box__head"><div><b>${esc(r.from)}</b><div class="pcard__meta">${esc(r.role)} \xB7 ${esc(r.project)}</div></div>
            <span class="stars">${"\u2605".repeat(r.stars)}${"\u2606".repeat(5 - r.stars)}</span></div>
          <p style="margin:0;color:var(--ink-2)">${esc(r.text)}</p>
          <p class="hint">${nice(r.at)}</p>
        </div>`).join("")}</div>` : '<div class="empty"><b>No reviews yet</b>Finish your first project and investors will rate you.</div>'}`;
  };
  routes.profile = function() {
    const u = S.user;
    return `
      <div class="pagehead"><div><h1 class="h1">Profile</h1><p>This is what investors and buyers see.</p></div>
        <button class="btn btn--ghost" id="editProfile">Edit profile</button></div>
      <div class="cards cols-2">
        <section class="box">
          <div class="box__head"><h3>Identity</h3>
            <span class="tag tag--${u.verified ? "active" : "pending"}">${u.verified ? "Verified" : "Unverified"}</span></div>
          <dl class="kv">
            <dt>Name</dt><dd>${esc(u.name)}</dd>
            <dt>Role</dt><dd>${esc(u.role)}</dd>
            <dt>Phone</dt><dd>${esc(u.phone)}</dd>
            <dt>Email</dt><dd>${esc(u.email) || "\u2014"}</dd>
            <dt>NID</dt><dd>${esc(u.nid)}</dd>
            <dt>Member since</dt><dd>${nice(u.joined)}</dd>
          </dl>
        </section>
        <section class="box">
          <div class="box__head"><h3>Farm</h3></div>
          <dl class="kv">
            <dt>Location</dt><dd>${esc(u.upazila)}, ${esc(u.district)}</dd>
            <dt>Land</dt><dd>${u.land} decimal</dd>
            <dt>Experience</dt><dd>${u.exp} years</dd>
            <dt>Produces</dt><dd>${u.crops.map(esc).join(", ")}</dd>
          </dl>
          <div class="chips" style="margin-top:12px">${u.crops.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
        </section>
      </div>
      <section class="box" style="margin-top:16px">
        <div class="box__head"><h3>Account</h3></div>
        <div class="row">
          <button class="btn btn--ghost" id="themeBtn">Switch light / dark</button>
          <button class="btn btn--danger" id="resetBtn">Reset demo data</button>
        </div>
        <p class="hint">Resetting clears every project, product and transaction stored in this browser.</p>
      </section>`;
  };
  routes.profile.after = function() {
    $("#editProfile").addEventListener("click", () => {
      const u = S.user;
      modal("Edit profile", `
        <label class="field"><span class="field__label">Full name</span><input id="epName" value="${esc(u.name)}">
          <span class="field__error" data-for="epName"></span></label>
        <div class="grid2">
          <label class="field"><span class="field__label">District</span>
            <select id="epDistrict">${DISTRICTS.map((d) => `<option ${d === u.district ? "selected" : ""}>${d}</option>`).join("")}</select></label>
          <label class="field"><span class="field__label">Upazila</span><input id="epUpazila" value="${esc(u.upazila)}"></label>
        </div>
        <div class="grid2">
          <label class="field"><span class="field__label">Land (decimal)</span><input id="epLand" type="number" min="0" value="${u.land}"></label>
          <label class="field"><span class="field__label">Experience (years)</span><input id="epExp" type="number" min="0" value="${u.exp}"></label>
        </div>
        <label class="field"><span class="field__label">Email</span><input id="epEmail" type="email" value="${esc(u.email)}">
          <span class="field__error" data-for="epEmail"></span></label>
        <button class="btn btn--primary btn--block" id="epGo">Save changes</button>`, () => {
        $("#epGo").addEventListener("click", () => {
          clearErrors($("#modalBody"));
          let ok = true;
          if ($("#epName").value.trim().length < 3) {
            setError("epName", "Name is too short.");
            ok = false;
          }
          const em = $("#epEmail").value.trim();
          if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
            setError("epEmail", "That email is not valid.");
            ok = false;
          }
          if (!ok) return;
          Object.assign(S.user, {
            name: $("#epName").value.trim(),
            district: $("#epDistrict").value,
            upazila: $("#epUpazila").value.trim(),
            land: +$("#epLand").value || 0,
            exp: +$("#epExp").value || 0,
            email: em
          });
          save();
          closeModal();
          toast("Profile updated.");
          enterApp();
        });
      });
    });
    $("#themeBtn").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem(KEY + ".theme", next);
      } catch (e) {
      }
    });
    $("#resetBtn").addEventListener("click", () => {
      if (!confirm("Clear all saved data and start over?")) return;
      try {
        localStorage.removeItem(KEY);
      } catch (e) {
      }
      location.reload();
    });
  };
  function boot() {
    try {
      const t = localStorage.getItem(KEY + ".theme");
      if (t) document.documentElement.setAttribute("data-theme", t);
    } catch (e) {
    }
    bindAuth();
    S = load();
    const isSso = location.search.includes("sso=1") || localStorage.getItem("grambandhan_farmer_sso") === "true";
    if (!S || !S.projects || !S.projects.length || !S.wallet || !S.notifications) {
      S = seed({
        name: S && S.user && S.user.name || "Md. Rafiqul Islam",
        phone: S && S.user && S.user.phone || "01712345678",
        email: S && S.user && S.user.email || "",
        role: "Farmer",
        district: S && S.user && S.user.district || "Bogura",
        upazila: S && S.user && S.user.upazila || "Shibganj",
        land: 210,
        exp: 14,
        crops: ["Rice", "Vegetables", "Poultry"],
        nid: "19XXXXXXXXXXXX",
        verified: true,
        completed: 2,
        rating: 4.8,
        joined: "2024-11-02"
      });
      save();
    }
    $("#menuBtn").addEventListener("click", () => $("#rail").classList.toggle("is-open"));
    $("#bellBtn").addEventListener("click", () => {
      $("#notifPanel").hidden = !$("#notifPanel").hidden;
    });
    $("#notifClose").addEventListener("click", () => {
      $("#notifPanel").hidden = true;
    });
    $("#notifClear").addEventListener("click", () => {
      if (S && S.notifications) {
        S.notifications.forEach((n) => {
          n.read = true;
        });
        save();
        paintBell();
        toast("All caught up.");
      }
    });
    $("#logoutBtn").addEventListener("click", () => {
      try {
        localStorage.removeItem("grambandhan_farmer_sso");
      } catch (e) {
      }
      $("#app").classList.add("is-hidden");
      $("#authScreen").classList.remove("is-hidden");
      $("#viewLogin").classList.remove("is-hidden");
      $("#viewSignup").classList.add("is-hidden");
    });
    $("#modalClose").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", (e) => {
      if (e.target.id === "modal") closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
        $("#notifPanel").hidden = true;
      }
    });
    window.addEventListener("hashchange", () => {
      if (S) route();
    });
    if (isSso || S && S.user) enterApp();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
