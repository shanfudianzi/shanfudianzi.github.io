/* =========================================================
   上海善福电子科技 站内搜索
   读取 URL ?q=关键词&scope=all|products|news
   - all：同时检索产品(products.json)与新闻(news.json)，以选项卡分组展示
   - products：仅检索产品；news：仅检索新闻
   模糊匹配：按标题(title)包含关键词（支持空格分词，全部词命中才算）
   ========================================================= */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getParam(name) {
    try {
      var v = new URLSearchParams(location.search).get(name);
      return v ? v : "";
    } catch (e) { return ""; }
  }

  var q = getParam("q").trim();
  var scope = getParam("scope") || "all";
  if (scope !== "products" && scope !== "news") scope = "all";

  var PAGE_SIZE = 12;                 /* 搜索结果每页最多 12 篇 */
  var state = { page: 1, totalPages: 1 };

  var input = document.getElementById("searchInput");
  var scopeInput = document.getElementById("scopeInput");
  var resultsEl = document.getElementById("searchResults");
  var countEl = document.getElementById("searchCount");
  var tabsEl = document.getElementById("searchTabs");
  var form = document.getElementById("searchForm");

  if (input && q) input.value = q;
  if (scopeInput) scopeInput.value = scope;

  /* 选项卡切换：仅切换展示范围，不重新请求，直接重渲染 */
  if (tabsEl) {
    tabsEl.querySelectorAll("button").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-scope") === scope);
      btn.addEventListener("click", function () {
        scope = btn.getAttribute("data-scope");
        if (scopeInput) scopeInput.value = scope;
        tabsEl.querySelectorAll("button").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        var u = new URLSearchParams(location.search);
        u.set("scope", scope);
        if (q) u.set("q", q);
        try { history.replaceState(null, "", "search.html?" + u.toString()); } catch (e) {}
        state.page = 1;               /* 切换数据源回到第一页 */
        render();
      });
    });
  }

  /* 数据缓存 */
  var PRODUCTS = null, NEWS = null;
  function loadProducts() {
    if (PRODUCTS) return Promise.resolve(PRODUCTS);
    return fetch("data/products.json")
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { PRODUCTS = d; return d; });
  }
  function loadNews() {
    if (NEWS) return Promise.resolve(NEWS);
    return fetch("data/news.json")
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { NEWS = d; return d; });
  }

  /* 标题模糊匹配：按空格分词，所有词均出现在标题中 */
  function matchTitle(title, query) {
    var t = String(title == null ? "" : title).toLowerCase();
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return terms.every(function (term) { return t.indexOf(term) >= 0; });
  }

  /* 高亮命中词 */
  function highlight(title, query) {
    var out = esc(title);
    var terms = query.split(/\s+/).filter(Boolean);
    terms.forEach(function (term) {
      if (!term) return;
      var re = new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  function productItem(it) {
    return '<a class="search-item" href="products/' + esc(it.slug) + '.html">'
      + '<div class="si-thumb"><img loading="lazy" src="images/' + esc(it.img) + '" alt="' + esc(it.title) + '"></div>'
      + '<div class="si-body"><span class="tag">' + esc(it.cat) + '</span>'
      + '<h3>' + highlight(it.title, q) + '</h3>'
      + '<p>' + esc(it.tagline || "") + '</p></div></a>';
  }
  function newsItem(it) {
    return '<a class="search-item" href="news/' + esc(it.slug) + '.html">'
      + '<div class="si-thumb"><img loading="lazy" src="images/' + esc(it.img) + '" alt=""></div>'
      + '<div class="si-body"><span class="tag-cat">' + esc(it.cat) + '</span>'
      + '<h3>' + highlight(it.title, q) + '</h3>'
      + '<p>' + esc(it.desc || it.intro || "") + '</p></div></a>';
  }

  function gather() {
    var proms = [];
    if (scope === "all" || scope === "products") {
      proms.push(loadProducts().then(function (d) {
        return { type: "products", items: d };
      }));
    }
    if (scope === "all" || scope === "news") {
      proms.push(loadNews().then(function (d) {
        return { type: "news", items: (d.company || []).concat(d.industry || []) };
      }));
    }
    return Promise.all(proms);
  }

  /* 搜索结果分页器（复用 .pager 样式） */
  function buildPager(total) {
    if (state.totalPages <= 1) return "";
    var parts = [];
    parts.push('<button type="button" class="pager-prev"'
      + (state.page === 1 ? ' disabled' : '') + '>&lsaquo; 上一页</button>');
    for (var i = 1; i <= state.totalPages; i++) {
      parts.push('<button type="button" class="pager-num'
        + (i === state.page ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>');
    }
    parts.push('<button type="button" class="pager-next"'
      + (state.page === state.totalPages ? ' disabled' : '') + '>下一页 &rsaquo;</button>');
    parts.push('<span class="pager-info">第 ' + state.page + ' / ' + state.totalPages
      + ' 页，共 ' + total + ' 条</span>');
    return '<div class="pager" id="searchPager">' + parts.join("") + '</div>';
  }

  function bindPager() {
    var pager = document.getElementById("searchPager");
    if (!pager) return;
    pager.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      if (btn.classList.contains("pager-prev") && state.page > 1) { state.page--; }
      else if (btn.classList.contains("pager-next") && state.page < state.totalPages) { state.page++; }
      else if (btn.classList.contains("pager-num")) {
        state.page = parseInt(btn.getAttribute("data-page"), 10) || 1;
      } else { return; }
      render();
      if (resultsEl) resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function render() {
    if (!q) {
      if (resultsEl) resultsEl.innerHTML = '<p class="search-empty">请输入关键词进行搜索。</p>';
      if (countEl) countEl.textContent = "";
      return;
    }
    gather().then(function (groups) {
      /* 构建有序的命中项列表（all 时产品在前、新闻在后） */
      var ordered = [];
      var groupCounts = {};
      groups.forEach(function (g) {
        var matched = g.items.filter(function (it) { return matchTitle(it.title, q); });
        groupCounts[g.type] = matched.length;
        matched.forEach(function (it) { ordered.push({ type: g.type, item: it }); });
      });
      var total = ordered.length;
      state.totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (state.page > state.totalPages) state.page = state.totalPages;
      var start = (state.page - 1) * PAGE_SIZE;
      var pageItems = ordered.slice(start, start + PAGE_SIZE);

      var html = "";
      if (total === 0) {
        html = '<p class="search-empty">未找到与“' + esc(q) + '”相关的产品或资讯，换个关键词试试。</p>';
      } else if (scope === "all") {
        /* 跨组统一分页：组切换时插入 group 标题 */
        var openGroup = null;
        pageItems.forEach(function (o) {
          if (o.type !== openGroup) {
            if (openGroup !== null) html += '</div></div>';
            var label = o.type === "products" ? "产品" : "新闻";
            html += '<div class="search-group"><h3 class="search-group-title">' + label
              + '（' + groupCounts[o.type] + '）</h3><div class="search-list">';
            openGroup = o.type;
          }
          html += (o.type === "products" ? productItem(o.item) : newsItem(o.item));
        });
        if (openGroup !== null) html += '</div></div>';
      } else {
        /* 单数据源：单个 search-list */
        html = '<div class="search-list">' + pageItems.map(function (o) {
          return o.type === "products" ? productItem(o.item) : newsItem(o.item);
        }).join("") + '</div>';
      }
      if (resultsEl) resultsEl.innerHTML = html + buildPager(total);
      bindPager();
      if (countEl) countEl.textContent = "找到 " + total + " 条与“" + q + "”相关的结果"
        + (state.totalPages > 1 ? "（第 " + state.page + " / " + state.totalPages + " 页）" : "");
    }).catch(function (err) {
      if (resultsEl) resultsEl.innerHTML = '<p class="list-error">数据加载失败：' + esc(err.message)
        + '。请通过本地服务器（http://）或线上域名访问本页。</p>';
    });
  }

  /* 确保提交时带上当前 scope（选项卡可能已切换） */
  if (form) {
    form.addEventListener("submit", function () {
      if (scopeInput) scopeInput.value = scope;
    });
  }

  render();
})();
