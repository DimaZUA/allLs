(function () {
  function firstNonEmpty() {
    for (let i = 0; i < arguments.length; i++) {
      const v = arguments[i];
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return "";
  }

  function findByKeyVariants(root, variants, maxDepth) {
    const keys = (variants || []).map(k => String(k).toLowerCase());
    const depthLimit = Number.isFinite(maxDepth) ? maxDepth : 3;
    const queue = [{ node: root, depth: 0 }];
    const seen = new Set();

    while (queue.length) {
      const item = queue.shift();
      const node = item.node;
      const depth = item.depth;
      if (!node || typeof node !== "object") continue;
      if (seen.has(node)) continue;
      seen.add(node);

      const entries = Array.isArray(node)
        ? node.map((v, idx) => [String(idx), v])
        : Object.entries(node);

      for (const [k, v] of entries) {
        const keyLower = String(k).toLowerCase();
        if (keys.includes(keyLower)) {
          const found = firstNonEmpty(v);
          if (found) return found;
        }
      }

      if (depth >= depthLimit) continue;
      for (const [, v] of entries) {
        if (v && typeof v === "object") {
          queue.push({ node: v, depth: depth + 1 });
        }
      }
    }

    return "";
  }

  function getResidentTokenFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return (params.get("rt") || "").trim();
    } catch (_) {
      return "";
    }
  }

  function setElementDisplay(selector, display) {
    const element =
      selector.startsWith("#")
        ? document.getElementById(selector.slice(1))
        : document.querySelector(selector);

    if (element) {
      element.style.display = display;
    }
  }

  function applyResidentPayload(payload) {
    if (!payload || typeof payload !== "object") return false;

    window.us = payload.us || {};
    window.b = payload.b || {};
    window.org = payload.org || "";
    window.adr = payload.adr || "";
    window.dt = payload.dt || "";
    window.what = payload.what || {};
    window.kto = payload.kto || {};
    window.nach = payload.nach || {};
    window.nachnote = payload.nachnote || {};
    window.allnach = payload.allnach || {};
    window.oplat = payload.oplat || {};
    window.ls = payload.ls || {};
    window.plat = payload.plat || {};
    window.files = { files: [] };

    us = window.us;
    b = window.b;
    org = window.org;
    adr = window.adr;
    dt = window.dt;
    what = window.what;
    kto = window.kto;
    nach = window.nach;
    nachnote = window.nachnote;
    allnach = window.allnach;
    oplat = window.oplat;
    ls = window.ls;
    plat = window.plat;
    files = window.files;

    const homeCode = String(payload.home_code || payload.code || getParam("homeCode") || "");
    const homeMeta = payload.home && typeof payload.home === "object" ? payload.home : {};
    let homeMetaData = {};
    try {
      const rawHomeData = homeMeta.data;
      if (rawHomeData && typeof rawHomeData === "string") {
        const parsed = JSON.parse(rawHomeData);
        if (parsed && typeof parsed === "object") {
          homeMetaData = parsed;
        }
      } else if (rawHomeData && typeof rawHomeData === "object") {
        homeMetaData = rawHomeData;
      }
    } catch (_) {
      homeMetaData = {};
    }
    const ibanValue = firstNonEmpty(
      payload.Iban,
      payload.iban,
      homeMeta.Iban,
      homeMeta.iban,
      homeMetaData.Iban,
      homeMetaData.iban,
      findByKeyVariants(payload, ["Iban", "iban", "IBAN"], 4)
    );
    const bankValue = firstNonEmpty(
      payload.Bank,
      payload.bank,
      homeMeta.Bank,
      homeMeta.bank,
      homeMetaData.Bank,
      homeMetaData.bank,
      findByKeyVariants(payload, ["Bank", "bank", "Банк"], 4)
    );
    let mfoValue =
      payload.MFO ||
      payload.mfo ||
      payload["МФО"] ||
      homeMeta.MFO ||
      homeMeta.mfo ||
      homeMeta["МФО"] ||
      homeMetaData.MFO ||
      homeMetaData.mfo ||
      homeMetaData["МФО"] ||
      findByKeyVariants(payload, ["MFO", "mfo", "МФО"], 4) ||
      "";
    const viberQrValue = firstNonEmpty(
      payload.ViberQr,
      payload.viberQr,
      homeMeta.ViberQr,
      homeMeta.viberQr,
      homeMetaData.ViberQr,
      homeMetaData.viberQr,
      findByKeyVariants(payload, ["ViberQr", "viberQr", "viberqr"], 4)
    );
    const privatTokenValue = firstNonEmpty(
      payload.privatToken,
      payload.PrivatToken,
      payload.privat_token,
      homeMeta.privatToken,
      homeMeta.PrivatToken,
      homeMeta.privat_token,
      homeMetaData.privatToken,
      homeMetaData.PrivatToken,
      homeMetaData.privat_token,
      findByKeyVariants(payload, ["privatToken", "PrivatToken", "privat_token"], 4)
    );
    const privatQrValue = firstNonEmpty(
      payload.PrivatQr,
      payload.privatQr,
      payload.privat_qr,
      homeMeta.PrivatQr,
      homeMeta.privatQr,
      homeMeta.privat_qr,
      homeMetaData.PrivatQr,
      homeMetaData.privatQr,
      homeMetaData.privat_qr,
      findByKeyVariants(payload, ["PrivatQr", "privatQr", "privat_qr"], 4)
    );
    const privatQrLenValue = firstNonEmpty(
      payload.PrivatQRLen,
      payload.privatQrLen,
      payload.privat_qr_len,
      homeMeta.PrivatQRLen,
      homeMeta.privatQrLen,
      homeMeta.privat_qr_len,
      homeMetaData.PrivatQRLen,
      homeMetaData.privatQrLen,
      homeMetaData.privat_qr_len,
      findByKeyVariants(payload, ["PrivatQRLen", "privatQrLen", "privat_qr_len"], 4)
    );
    if (!mfoValue && ibanValue && String(ibanValue).length >= 10) {
      mfoValue = String(ibanValue).substring(4, 10);
    }
    window.residentHomeMeta = {
      code: homeCode,
      okpo: payload.okpo || homeMeta.okpo || homeMetaData.okpo || homeMetaData.code || homeCode,
      name: firstNonEmpty(payload.name, payload.ORGKR, homeMeta.name, homeMeta.ORGKR, homeMetaData.name, homeMetaData.ORGKR, org),
      Iban: ibanValue,
      Bank: bankValue,
      mfo: mfoValue,
      ViberQr: viberQrValue,
      privatToken: privatTokenValue,
      PrivatQr: privatQrValue,
      PrivatQRLen: privatQrLenValue,
      token: String(payload.token || homeMeta.token || "")
    };

    window.homes = [
      {
        code: window.residentHomeMeta.code,
        okpo: window.residentHomeMeta.okpo,
        name: window.residentHomeMeta.name,
        Iban: window.residentHomeMeta.Iban,
        Bank: window.residentHomeMeta.Bank,
        mfo: window.residentHomeMeta.mfo,
        ViberQr: window.residentHomeMeta.ViberQr,
        privatToken: window.residentHomeMeta.privatToken,
        PrivatQr: window.residentHomeMeta.PrivatQr,
        PrivatQRLen: window.residentHomeMeta.PrivatQRLen,
        token: window.residentHomeMeta.token
      }
    ];
    homes = window.homes;

    const accountId =
      String(payload.account_id || "") || Object.keys(window.ls || {})[0] || "";
    if (!accountId || !window.ls || !window.ls[accountId]) return false;

    const kv = String(window.ls[accountId].kv || "");
    if (homeCode) setParam("homeCode", homeCode);
    setParam("actionCode", "accounts");
    if (kv) setParam("kv", kv);

    if (typeof fillMissingDates === "function") {
      fillMissingDates(window.nach);
    }
    if (typeof initLS === "function") {
      initLS();
    }
    return true;
  }

  async function tryEnterResidentMode() {
    const token = getResidentTokenFromUrl();
    if (!token) return false;

    setElementDisplay("#auth-section", "none");
    setElementDisplay(".sidebar", "none");
    setElementDisplay(".topbar", "none");
    setElementDisplay(".content", "block");
    setElementDisplay("#hamburger", "none");

    document.body.classList.add("resident-mode", "app");
    document.body.classList.remove(
      "authenticated",
      "files-mode",
      "sidebar-open"
    );
    document.documentElement.style.setProperty("--topbar-offset", "0px");

    const { data, error } = await client.rpc("resident_get_ls", {
      p_token: token
    });

    if (error || !data) {
      return false;
    }

    const applied = applyResidentPayload(data);
    if (applied) {
      try {
        client
          .rpc("resident_visit_log", { p_token: token, p_source: "resident_web" })
          .catch(() => {});
      } catch (_) {}
    }
    return applied;
  }

  async function enterAppMode() {
    setElementDisplay("#auth-section", "none");

    document.body.classList.add("authenticated", "app");
    document.body.classList.remove("files-mode");

    setElementDisplay(".sidebar", "block");
    setElementDisplay(".content", "block");
    setElementDisplay("#hamburger", "flex");

    await initApp();
  }

  function enterAuthMode() {
    setElementDisplay("#auth-section", "block");

    document.body.classList.remove(
      "authenticated",
      "app",
      "files-mode",
      "sidebar-open"
    );

    setElementDisplay(".sidebar", "none");
    setElementDisplay(".content", "none");
    setElementDisplay("#hamburger", "none");
  }

  function setupAuthFormToggles() {
    const showSignup = document.getElementById("show-signup");
    const showLogin = document.getElementById("show-login");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    if (showSignup && loginForm && signupForm) {
      showSignup.onclick = () => {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
      };
    }

    if (showLogin && loginForm && signupForm) {
      showLogin.onclick = () => {
        signupForm.style.display = "none";
        loginForm.style.display = "block";
      };
    }
  }

  function setupLoginForm() {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const email = document.getElementById("email")?.value;
      const password = document.getElementById("password")?.value;
      const statusEl = document.getElementById("login-status");

      const { error } = await client.auth.signInWithPassword({ email, password });

      if (error) {
        if (statusEl) {
          statusEl.textContent = `❌ Помилка входу: ${error.message}`;
        }
        return;
      }

      if (statusEl) {
        statusEl.textContent = "✅ Успішний вхід";
      }

      await enterAppMode();
    });
  }

  function setupSignupForm() {
    const form = document.getElementById("signup-form");
    if (!form) return;

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const email = document.getElementById("signup-email")?.value;
      const password = document.getElementById("signup-password")?.value;
      const confirm = document.getElementById("signup-password-confirm")?.value;
      const statusEl = document.getElementById("signup-status");

      if (password !== confirm) {
        if (statusEl) {
          statusEl.textContent = "❌ Пароли не совпадают";
        }
        return;
      }

      const { error } = await client.auth.signUp({ email, password });

      if (error) {
        if (statusEl) {
          statusEl.textContent = `❌ Ошибка регистрации: ${error.message}`;
        }
        return;
      }

      if (statusEl) {
        statusEl.style.color = "green";
        statusEl.textContent = "✅ Регистрация успешна! Проверьте почту.";
      }
    });
  }

  async function checkInitialSession() {
    const preloader = document.getElementById("preloader");

    try {
      const enteredResidentMode = await tryEnterResidentMode();
      if (enteredResidentMode) {
        return;
      }

      let {
        data: { session }
      } = await client.auth.getSession();

      if (!session) {
        const refreshed = await client.auth.refreshSession();
        session = refreshed.data.session;
      }

      if (session) {
        await enterAppMode();
      } else {
        enterAuthMode();
      }
    } finally {
      document.body.classList.add("auth-checked");

      if (preloader) {
        preloader.classList.add("hidden");
      }
    }
  }

  setupAuthFormToggles();
  setupLoginForm();
  setupSignupForm();
  checkInitialSession();
})();
