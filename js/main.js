/* =========================================================
   上海善福电子科技有限公司 官网 交互脚本
   ========================================================= */
(function () {
  "use strict";

  /* 当前年份 */
  var y = document.getElementById("year");
  if (y) { y.textContent = new Date().getFullYear(); }

  /* 移动端导航 */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        if (window.innerWidth <= 760) { nav.classList.remove("open"); }
      });
    });
  }

  /* 返回顶部 */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 400) { toTop.classList.add("show"); }
      else { toTop.classList.remove("show"); }
    });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* FAQ 折叠：事件委托，兼容动态注入的 FAQ 项（faq_list / 搜索页） */
  document.addEventListener("click", function (e) {
    var q = e.target.closest(".faq-q");
    if (q) { q.parentElement.classList.toggle("open"); }
  });

  /* 大家都在问：点击跳转并展开对应问题 */
  document.querySelectorAll("a.faq-hot-item").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.classList.add("open");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  /* 带 #q 锚点直接访问时，自动展开对应问题 */
  if (location.hash) {
    var t = document.getElementById(location.hash.slice(1));
    if (t && t.classList.contains("faq-item")) {
      t.classList.add("open");
      setTimeout(function () { t.scrollIntoView({ behavior: "smooth", block: "center" }); }, 250);
    }
  }

  /* 首页 Hero 轮播 */
  var slides = document.querySelectorAll(".hero-slide");
  var dots = document.querySelectorAll(".hero-dots button");
  if (slides.length > 1) {
    var idx = 0;
    function show(i) {
      slides.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      dots.forEach(function (d, k) { d.classList.toggle("active", k === i); });
    }
    if (dots.length) {
      dots.forEach(function (d, k) {
        d.addEventListener("click", function () { idx = k; show(k); restart(); });
      });
    }
    var timer = setInterval(function () {
      idx = (idx + 1) % slides.length; show(idx);
    }, 5000);
    function restart() { clearInterval(timer); timer = setInterval(function () { idx = (idx + 1) % slides.length; show(idx); }, 5000); }
  }

  /* 滚动进入动画（轻量） */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.style.opacity = 1; en.target.style.transform = "none"; io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.style.opacity = 0; el.style.transform = "translateY(24px)";
      el.style.transition = "opacity .6s ease, transform .6s ease";
      io.observe(el);
    });
  }
})();
