(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tip = document.querySelector(".tip");
  var progress = document.querySelector(".progress");
  var rail = document.querySelector(".rail");
  var links = Array.prototype.slice.call(document.querySelectorAll(".rail a[href^='#']"));
  var screens = Array.prototype.slice.call(document.querySelectorAll(".screen"));

  function pad(n, d) {
    return Number(n).toFixed(d);
  }

  function countUp(el) {
    if (!el || el.dataset.done === "1") return;
    el.dataset.done = "1";
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reduce || isNaN(target)) {
      el.textContent = pad(target, dec);
      return;
    }
    var start = performance.now();
    var dur = 900;
    function frame(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = pad(target * e, dec);
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = pad(0, dec);
    requestAnimationFrame(frame);
  }

  function mountDonut(root) {
    var list = root.querySelectorAll(".legend button[data-value]");
    var series = [];
    var total = 0;
    Array.prototype.forEach.call(list, function (btn) {
      var v = parseFloat(btn.getAttribute("data-value"));
      series.push({ value: v, color: btn.getAttribute("data-color"), btn: btn });
      total += v;
    });
    if (!total) return;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 120 120");
    var g = document.createElementNS(ns, "g");
    g.setAttribute("transform", "rotate(-90 60 60)");
    var r = 34;
    var c = 2 * Math.PI * r;
    var acc = 0;
    series.forEach(function (s, i) {
      var len = (s.value / total) * c;
      var gap = len > 10 ? 1.4 : 0.4;
      var draw = Math.max(0, len - gap);
      var circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", "60");
      circle.setAttribute("cy", "60");
      circle.setAttribute("r", String(r));
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", s.color);
      circle.setAttribute("stroke-width", "9");
      circle.style.strokeDasharray = "0 " + c;
      circle.setAttribute("data-final", draw + " " + (c - draw));
      circle.setAttribute("stroke-dashoffset", String(-acc));
      circle.dataset.i = String(i);
      g.appendChild(circle);
      s.btn.dataset.i = String(i);
      acc += len;
    });
    svg.appendChild(g);
    root.querySelector(".donut-svg").appendChild(svg);
    root._circles = g.querySelectorAll("circle");

    function focus(i) {
      Array.prototype.forEach.call(root._circles, function (node, idx) {
        node.classList.toggle("is-dim", i !== null && idx !== i);
      });
      Array.prototype.forEach.call(list, function (btn, idx) {
        btn.parentElement.classList.toggle("is-dim", i !== null && idx !== i);
      });
    }
    root.addEventListener("mouseover", function (e) {
      var t = e.target.closest("[data-i]");
      focus(t ? parseInt(t.dataset.i, 10) : null);
    });
    root.addEventListener("mouseleave", function () { focus(null); });
    root.addEventListener("focusin", function (e) {
      var t = e.target.closest("[data-i]");
      focus(t ? parseInt(t.dataset.i, 10) : null);
    });
    root.addEventListener("focusout", function () { focus(null); });
  }

  function playDonut(root) {
    if (root.dataset.played === "1") return;
    root.dataset.played = "1";
    var circles = root._circles || [];
    Array.prototype.forEach.call(circles, function (node, i) {
      var finalDash = node.getAttribute("data-final");
      if (reduce) {
        node.style.strokeDasharray = finalDash;
        return;
      }
      node.style.transition = "stroke-dasharray 0.9s cubic-bezier(.2,.7,.2,1) " + (i * 0.06) + "s";
      requestAnimationFrame(function () {
        node.style.strokeDasharray = finalDash;
      });
    });
  }

  function mountStage(host) {
    var rows = host.querySelectorAll("tr[data-value]");
    var data = Array.prototype.map.call(rows, function (tr) {
      return { name: tr.getAttribute("data-name"), value: parseFloat(tr.getAttribute("data-value")) };
    });
    var ns = "http://www.w3.org/2000/svg";
    var W = 680;
    var H = 360;
    var padL = 64;
    var padR = 48;
    var padT = 24;
    var padB = 42;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    var maxX = 200;
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "大学 67 人，高中 191 人，初中 171 人，小学 67 人");

    function xOf(v) { return padL + (v / maxX) * plotW; }
    function yOf(i) { return padT + (i + 0.5) * (plotH / data.length); }

    var grid = document.createElementNS(ns, "g");
    [0, 50, 100, 150, 200].forEach(function (tick) {
      var x = xOf(tick);
      var line = document.createElementNS(ns, "line");
      line.setAttribute("x1", x);
      line.setAttribute("x2", x);
      line.setAttribute("y1", padT);
      line.setAttribute("y2", padT + plotH);
      line.setAttribute("stroke", "#c9bfb2");
      line.setAttribute("stroke-width", "1");
      grid.appendChild(line);
      var label = document.createElementNS(ns, "text");
      label.setAttribute("x", x);
      label.setAttribute("y", H - 16);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "#5e564e");
      label.setAttribute("font-size", "12");
      label.setAttribute("font-family", "Palatino Linotype, Noto Serif SC, serif");
      label.textContent = String(tick);
      grid.appendChild(label);
    });
    svg.appendChild(grid);

    var axisName = document.createElementNS(ns, "text");
    axisName.setAttribute("x", padL + plotW);
    axisName.setAttribute("y", H - 2);
    axisName.setAttribute("text-anchor", "end");
    axisName.setAttribute("fill", "#5e564e");
    axisName.setAttribute("font-size", "12");
    axisName.textContent = "人数";
    svg.appendChild(axisName);

    var pts = data.map(function (d, i) { return { x: xOf(d.value), y: yOf(i), d: d }; });
    var dAttr = "M " + pts[0].x + " " + pts[0].y;
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      dAttr += " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + p2.x + " " + p2.y;
    }
    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", dAttr);
    path.setAttribute("class", "line");
    svg.appendChild(path);

    var tips = {
      "大学": "67 人从大学阶段才开始感觉到外貌焦虑。",
      "高中": "191 人，四个阶段里人数最多。",
      "初中": "171 人，和高峰几乎接上。",
      "小学": "67 人在小学就开始感觉到。"
    };

    pts.forEach(function (p) {
      var name = document.createElementNS(ns, "text");
      name.setAttribute("x", 8);
      name.setAttribute("y", p.y + 4);
      name.setAttribute("fill", "#17211e");
      name.setAttribute("font-size", "14");
      name.setAttribute("font-family", "Noto Sans SC, Microsoft YaHei, sans-serif");
      name.textContent = p.d.name;
      svg.appendChild(name);

      var dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", p.x);
      dot.setAttribute("cy", p.y);
      dot.setAttribute("r", "5.5");
      dot.setAttribute("fill", "#f7f4ef");
      dot.setAttribute("stroke", "#9e4030");
      dot.setAttribute("stroke-width", "2.5");
      dot.setAttribute("data-tip", p.d.name + " · " + p.d.value + " 人。" + tips[p.d.name]);
      svg.appendChild(dot);

      var val = document.createElementNS(ns, "text");
      var leftSide = p.x > padL + plotW - 70;
      val.setAttribute("x", leftSide ? p.x - 12 : p.x + 12);
      val.setAttribute("y", p.y - 10);
      val.setAttribute("text-anchor", leftSide ? "end" : "start");
      val.setAttribute("fill", "#9e4030");
      val.setAttribute("font-size", "14");
      val.setAttribute("font-family", "Palatino Linotype, Noto Serif SC, serif");
      val.textContent = String(p.d.value);
      svg.appendChild(val);
    });

    host.appendChild(svg);
    requestAnimationFrame(function () {
      var len = path.getTotalLength();
      path.style.setProperty("--len", len);
      if (reduce) path.style.strokeDashoffset = "0";
    });
  }

  document.querySelectorAll("[data-donut]").forEach(mountDonut);
  document.querySelectorAll("[data-stage]").forEach(mountStage);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("inview");
      entry.target.querySelectorAll(".count").forEach(countUp);
      entry.target.querySelectorAll("[data-donut]").forEach(playDonut);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  screens.forEach(function (screen) { io.observe(screen); });

  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      links.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
      rail.classList.toggle("on-dark", entry.target.classList.contains("is-ink"));
      var active = rail.querySelector("a.active");
      if (active && rail.scrollWidth > rail.clientWidth) {
        active.scrollIntoView({ inline: "center", block: "nearest" });
      }
    });
  }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });

  screens.forEach(function (screen) { spy.observe(screen); });

  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = "scaleX(" + p + ")";
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });

  function moveTip(x, y, text) {
    if (!text) {
      tip.classList.remove("show");
      return;
    }
    tip.textContent = text;
    tip.classList.add("show");
    var rect = tip.getBoundingClientRect();
    var left = x + 14;
    var top = y + 16;
    if (left + rect.width > window.innerWidth - 8) left = x - rect.width - 14;
    if (top + rect.height > window.innerHeight - 8) top = y - rect.height - 12;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  document.addEventListener("mousemove", function (e) {
    var node = e.target.closest("[data-tip]");
    moveTip(e.clientX, e.clientY, node ? node.getAttribute("data-tip") : "");
  });
  document.addEventListener("mouseleave", function () { tip.classList.remove("show"); });
  document.addEventListener("focusin", function (e) {
    var node = e.target.closest("[data-tip]");
    if (!node) return;
    var r = node.getBoundingClientRect();
    moveTip(r.left, r.bottom, node.getAttribute("data-tip"));
  });
  document.addEventListener("focusout", function () { tip.classList.remove("show"); });
})();
