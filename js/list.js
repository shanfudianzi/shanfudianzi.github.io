/* 通用列表分页渲染：读取 JSON，按 推荐(rec)→序号(seq)→上架/发布时间(added/date) 排序，每页 N 条。
   用法：在页面放置 <div id="list-root" data-list="products" data-url="data/products.json" data-type="product" data-perpage="15"></div>
   新闻列表：data-type="news" data-url="data/news.json" data-cat="company|industry|all" */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // 排序：推荐优先(1在前) → 序号升序 → 时间倒序（最新在前）
  function sortItems(items) {
    return items.slice().sort(function (a, b) {
      var ra = a.rec || 0, rb = b.rec || 0;
      if (rb !== ra) return rb - ra;
      var sa = a.seq || 0, sb = b.seq || 0;
      if (sa !== sb) return sa - sb;
      var ta = a.added || a.date || "", tb = b.added || b.date || "";
      return tb.localeCompare(ta);
    });
  }

  function productCard(it) {
    return '<a class="card product-card" href="products/' + esc(it.slug) + '.html">'
      + '<div class="thumb"><img loading="lazy" src="images/' + esc(it.img) + '" alt="' + esc(it.title) + '"></div>'
      + '<div class="card-body"><h3>' + esc(it.title) + '</h3><span class="tag">' + esc(it.cat) + '</span>'
      + '<p class="spec">' + esc(it.tagline || "") + '</p>'
      + '<p class="brands-line">品牌：' + esc(it.brand || "") + '</p>'
      + '<span class="more">查看详情</span></div></a>';
  }

  function newsCard(it) {
    return '<a class="news-item" href="news/' + esc(it.slug) + '.html"><img loading="lazy" src="images/' + esc(it.img) + '" alt="">'
      + '<div><div class="meta"><span class="tag-cat">' + esc(it.cat) + '</span> ' + esc(it.date) + '</div>'
      + '<h3>' + esc(it.title) + '</h3><p>' + esc(it.desc || "") + '</p></div></a>';
  }

  function getPager(root) {
    var p = root.nextElementSibling;
    if (!p || !p.classList || !p.classList.contains("pager")) {
      p = document.createElement("div");
      p.className = "pager";
      root.parentNode.insertBefore(p, root.nextSibling);
    }
    return p;
  }

  function buildPager(root, page, pages, total) {
    var pager = getPager(root);
    if (total <= root._per && pages <= 1) { pager.innerHTML = ""; return; }
    var html = '<span class="pager-info">共 ' + total + ' 条 · 第 ' + page + "/" + pages + ' 页</span>';
    if (page > 1) html += '<button data-p="1">« 首页</button><button data-p="' + (page - 1) + '">上一页</button>';
    var s = Math.max(1, page - 2), e = Math.min(pages, page + 2);
    if (s > 1) html += '<button data-p="1">1</button>' + (s > 2 ? '<span class="pager-gap">…</span>' : "");
    for (var i = s; i <= e; i++) {
      html += '<button data-p="' + i + '"' + (i === page ? ' class="active"' : "") + ">" + i + "</button>";
    }
    if (e < pages) html += (e < pages - 1 ? '<span class="pager-gap">…</span>' : "") + '<button data-p="' + pages + '">' + pages + "</button>";
    if (page < pages) html += '<button data-p="' + (page + 1) + '">下一页</button><button data-p="' + pages + '">末页 »</button>';
    pager.innerHTML = html;
    pager.querySelectorAll("button[data-p]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        renderPage(root, parseInt(btn.getAttribute("data-p"), 10));
        window.scrollTo({ top: root.offsetTop - 80, behavior: "smooth" });
      });
    });
  }

  function renderPage(root, page) {
    var per = root._per, items = root._items;
    var total = items.length;
    var pages = Math.max(1, Math.ceil(total / per));
    if (page < 1) page = 1;
    if (page > pages) page = pages;
    root._page = page;
    var start = (page - 1) * per;
    var slice = items.slice(start, start + per);
    var wrapClass = root._type === "news" ? "news-list" : "grid grid-3";
    var cardFn = root._type === "news" ? newsCard : productCard;
    root.innerHTML = '<div class="' + wrapClass + '">' + slice.map(cardFn).join("") + "</div>";
    buildPager(root, page, pages, total);
  }

  function resolveItems(root, data) {
    var cat = root.getAttribute("data-cat");
    if (root._type === "news") {
      if (cat === "all") return (data.company || []).concat(data.industry || []);
      return data[cat] || [];
    }
    return data;
  }

  function initList(root) {
    var url = root.getAttribute("data-url");
    root._per = parseInt(root.getAttribute("data-perpage") || "15", 10);
    root._type = root.getAttribute("data-type") || "product";
    root._page = 1;
    var _u = url + (url.indexOf("?") === -1 ? "?" : "&") + "_t=" + Date.now();
    fetch(_u, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        root._items = sortItems(resolveItems(root, data));
        renderPage(root, 1);
      })
      .catch(function (err) {
        root.innerHTML = '<p class="list-error">列表加载失败：' + esc(err.message) + '。请确认通过本地服务器（如 http://）访问本页。</p>';
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("#list-root[data-list]").forEach(initList);
  });
})();
