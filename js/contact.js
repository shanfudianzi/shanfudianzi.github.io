/* =========================================================
   上海善福电子科技 - 在线留言表单（前端演示）
   说明（暂定需求）：
   - 提交时收集各文本框内容（暂无后端，先获取值）
   - 点击提交：按钮置灰并禁用，给出提交反馈
   - 暂时默认成功：清空表单文本框，并显示成功提示
   - 提交成功后重新激活按钮，允许再次提交
   ========================================================= */
(function () {
  "use strict";

  var form = document.getElementById("contactFormEl");
  if (!form) return;

  var btn = form.querySelector('button[type="submit"]');
  var msg = document.getElementById("formMsg");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    /* 1. 获取文本框内容（暂时仅收集，无后端提交） */
    var data = {};
    form.querySelectorAll("input, textarea, select").forEach(function (el) {
      if (el.name) data[el.name] = el.value;
    });
    if (window.console) console.log("在线留言内容：", data);

    /* 2. 点击后按钮置灰并禁用，给出提交反馈 */
    if (btn) {
      btn.disabled = true;
      btn.textContent = "已提交";
    }

    /* 3. 暂时默认成功：清空表单文本框并提示 */
    form.reset();
    if (msg) {
      msg.style.display = "block";
      msg.textContent = "✓ 提交成功，我们会尽快与您联系！";
    }

    /* 4. 提交成功后重新激活按钮，并稍后收起成功提示 */
    setTimeout(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "提交咨询";
      }
      if (msg) {
        setTimeout(function () { msg.style.display = "none"; }, 3000);
      }
    }, 1500);
  });
})();
