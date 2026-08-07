/* =========================================================
   所有常见问题（分页 list）
   读取 data/faq.json → 渲染手风琴列表，每页最多 12 条
   折叠交互由 main.js 统一事件委托处理（.faq-q）
   ========================================================= */
(function () {
  "use strict";

  var PAGE_SIZE = 12;
  var root = document.getElementById("faq-list-root");
  if (!root) return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var items = [];
  var totalPages = 1;
  var current = 1;

  /* 与静态 FAQ 页结构一致，确保 main.js 的事件委托可展开 */
  function itemHtml(it) {
    return '<div class="faq-item" id="' + esc(it.id) + '">'
      + '<button type="button" class="faq-q">' + esc(it.question)
      + '<span class="plus">+</span></button>'
      + '<div class="faq-a"><p>' + esc(it.answer) + '</p></div></div>';
  }

  function pagerHtml() {
    if (totalPages <= 1) return "";
    var parts = [];
    parts.push('<button type="button" class="pager-prev"'
      + (current === 1 ? ' disabled' : '') + '>&lsaquo; 上一页</button>');
    for (var i = 1; i <= totalPages; i++) {
      parts.push('<button type="button" class="pager-num'
        + (i === current ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>');
    }
    parts.push('<button type="button" class="pager-next"'
      + (current === totalPages ? ' disabled' : '') + '>下一页 &rsaquo;</button>');
    parts.push('<span class="pager-info">第 ' + current + ' / ' + totalPages
      + ' 页，共 ' + items.length + ' 条</span>');
    return '<div class="pager" id="faqPager">' + parts.join("") + '</div>';
  }

  function render() {
    var start = (current - 1) * PAGE_SIZE;
    var slice = items.slice(start, start + PAGE_SIZE);
    root.innerHTML = '<div class="faq-list">' + slice.map(itemHtml).join("") + '</div>' + pagerHtml();

    var pager = document.getElementById("faqPager");
    if (pager) {
      pager.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        if (btn.classList.contains("pager-prev") && current > 1) { current--; }
        else if (btn.classList.contains("pager-next") && current < totalPages) { current++; }
        else if (btn.classList.contains("pager-num")) {
          current = parseInt(btn.getAttribute("data-page"), 10) || 1;
        } else { return; }
        render();
        window.scrollTo({ top: (root.offsetTop || 0) - 80, behavior: "smooth" });
      });
    }
  }

  fetch("data/faq.json")
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      items = data || [];
      totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
      render();
    })
    .catch(function (err) {
      root.innerHTML = '<p class="list-error">数据加载失败：' + esc(err.message)
        + '。请通过本地服务器（http://）或线上域名访问本页。</p>';
    });
})();
