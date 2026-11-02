(function () {
  "use strict";

  function showToast(message) {
    var toast = document.querySelector(".copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "copy-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function setupMenu() {
    var body = document.body;
    var menu = document.querySelector(".header-menu");
    if (!menu) return;

    var close = document.createElement("button");
    close.type = "button";
    close.className = "local-menu-close";
    close.setAttribute("aria-label", "Chiudi menu");
    close.innerHTML = "&times;";
    close.addEventListener("click", function () {
      body.classList.remove("menu-open");
    });
    menu.appendChild(close);

    document.querySelectorAll(".header-burger-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        body.classList.toggle("menu-open");
      });
    });

    document.querySelectorAll(".header-menu a").forEach(function (link) {
      link.addEventListener("click", function () {
        body.classList.remove("menu-open");
      });
    });
  }

  function setupCopyIban() {
    document.querySelectorAll('a[href=""]').forEach(function (link) {
      var text = (link.textContent || "").replace(/\s+/g, " ").trim();
      if (!/^[A-Z]{2}[A-Z0-9]{6,}$/i.test(text)) return;
      link.style.cursor = "pointer";
      link.addEventListener("click", function (event) {
        event.preventDefault();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () { showToast("IBAN copiato"); },
            function () { showToast("Copia manuale: " + text); }
          );
        } else {
          showToast("Copia manuale: " + text);
        }
      });
    });
  }

  function setupMarquees() {
    var marquees = document.querySelectorAll(".Marquee");
    if (!marquees.length) return;

    marquees.forEach(function (root) {
      var measure = root.querySelector(".Marquee-measure");
      var path = root.querySelector(".Marquee-path");
      var pathGroup = root.querySelector(".Marquee-path-group");
      var svg = root.querySelector(".Marquee-svg");
      var textPath = root.querySelector("textPath");
      if (!measure || !path || !textPath) return;

      var tspans = Array.prototype.slice.call(
        textPath.querySelectorAll("tspan")
      );
      if (!tspans.length) return;

      var waveFrequency =
        parseFloat(root.getAttribute("data-wave-frequency")) || 1;
      var waveIntensity =
        parseFloat(root.getAttribute("data-wave-intensity")) || 0;
      var frequencyFactor = Math.min(Math.max(0.1 * waveFrequency, 0), 1);
      var padding = 250 * (1 - frequencyFactor) + 1000 * frequencyFactor;
      var direction =
        root.getAttribute("data-animation-direction") === "right" ? 1 : -1;
      var speed = parseFloat(root.getAttribute("data-animation-speed")) || 1;

      function readItems() {
        return Array.prototype.slice
          .call(measure.querySelectorAll(".Marquee-item"))
          .map(function (item) {
            var style = window.getComputedStyle(item);
            return {
              width: item.getBoundingClientRect().width,
              spacing: parseFloat(style.marginRight) || 0,
              height: item.clientHeight || 39
            };
          });
      }

      var items = readItems();
      if (!items.length) return;

      var measuredWidth = 50;
      var pathLength = 0;
      var progress = 0;
      var last = 0;

      function layout() {
        items = readItems();
        if (!items.length) return;

        var period = items.reduce(function (sum, item) {
          return sum + item.width + item.spacing;
        }, 0);
        measuredWidth = Math.max(period, 50);

        var regionWidth = Math.max(
          root.clientWidth || 0,
          document.documentElement.clientWidth || 0,
          window.innerWidth || 0,
          50
        );
        var textHeight = items[0].height || 39;
        var curveOffset = padding * 0.333;
        var numPoints = Math.ceil((regionWidth + 3 * padding) / padding) + 2;
        var startX = -padding;
        var baselineY = textHeight * 0.662;

        var d = "M" + startX + "," + baselineY + " ";
        for (var n = 0; n < numPoints; n++) {
          var px = startX + n * padding;
          var py = baselineY + (n % 2 === 0 ? 0 : waveIntensity);
          d +=
            n === 0
              ? " L" + px + "," + py
              : " S" + (px - curveOffset) + "," + py + " " + px + "," + py;
        }
        path.setAttribute("d", d);

        var dashArray = items.reduce(function (acc, item) {
          return acc + item.width + " " + item.spacing + " ";
        }, "");
        path.setAttribute("stroke-dasharray", dashArray);

        if (pathGroup) {
          pathGroup.setAttribute(
            "transform",
            "translate(0, " + textHeight * 0.05 + ")"
          );
        }
        if (svg) {
          svg.style.height = textHeight + waveIntensity + "px";
          svg.style.transform = "translateY(" + textHeight * 0.1 + "px)";
          svg.style.overflow = "visible";
        }

        pathLength = path.getTotalLength
          ? path.getTotalLength()
          : numPoints * padding;

        var neededGroups =
          Math.ceil((pathLength + measuredWidth * 3) / measuredWidth) + 1;
        var neededCount = neededGroups * items.length;
        var current = textPath.querySelectorAll("tspan");
        for (var k = current.length; k < neededCount; k++) {
          var template = current[k % items.length];
          if (!template) break;
          var clone = template.cloneNode(true);
          textPath.appendChild(clone);
        }
        tspans = Array.prototype.slice.call(
          textPath.querySelectorAll("tspan")
        );

        var offset = 0;
        for (var i = 0; i < tspans.length; i++) {
          var item = items[i % items.length];
          tspans[i].setAttribute("x", String(offset));
          tspans[i].style.display = "block";
          offset += item.width + item.spacing;
        }
      }

      function render() {
        var offset =
          (((measuredWidth + progress) % measuredWidth) + measuredWidth) %
          measuredWidth;
        textPath.setAttribute("startOffset", String(-offset));
        path.setAttribute("stroke-dashoffset", String(offset));

        for (var i = 0; i < tspans.length; i++) {
          var tspan = tspans[i];
          var x = parseFloat(tspan.getAttribute("x"));
          if (isNaN(x)) {
            tspan.style.display = "none";
            continue;
          }
          var item = items[i % items.length];
          var start = x - offset;
          var end = start + item.width + item.spacing;
          var min = -padding;
          var max = pathLength;
          var offscreen =
            (start > max && end > max) || (start < min && end < min);
          tspan.style.display = offscreen ? "none" : "block";
        }
      }

      function frame(now) {
        if (!last) last = now;
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        progress -= direction * speed * 60 * dt;

        render();
        root._marqueeFrame = window.requestAnimationFrame(frame);
      }

      function refresh() {
        layout();
        render();
      }

      refresh();
      window.addEventListener("resize", refresh);
      window.addEventListener("load", refresh);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refresh);
      }
      root._marqueeFrame = window.requestAnimationFrame(frame);
    });
  }

  function setupScrollAnimations() {
    var targets = Array.prototype.slice.call(
      document.querySelectorAll(".preFade")
    );
    if (!targets.length) return;

    function reveal(element) {
      if (!element.classList.contains("fadeIn")) {
        element.classList.add("fadeIn");
      }
    }

    // Menu links live inside a hidden overlay: reveal them straight away.
    targets.forEach(function (element) {
      if (element.closest(".header-menu")) reveal(element);
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach(reveal);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" }
    );

    targets.forEach(function (element) {
      if (element.classList.contains("fadeIn")) return;
      var rect = element.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        window.requestAnimationFrame(function () {
          reveal(element);
        });
      } else {
        observer.observe(element);
      }
    });

    // Fallback: reveal anything that enters the viewport, even if the
    // IntersectionObserver does not fire (older mobile browsers).
    function revealInView() {
      var viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      targets.forEach(function (element) {
        if (element.classList.contains("fadeIn")) return;
        var rect = element.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < viewportHeight) reveal(element);
      });
    }

    window.addEventListener("scroll", revealInView, { passive: true });
    document.addEventListener("scroll", revealInView, { passive: true });
    window.addEventListener("touchmove", revealInView, { passive: true });
    window.addEventListener("resize", revealInView);
    window.setTimeout(revealInView, 400);

    // Last-resort safety net: never leave content permanently hidden.
    window.setTimeout(function () {
      targets.forEach(reveal);
    }, 8000);
  }

  function setupParallax() {
    var entries = [];

    function getScale(section) {
      var isRegalo = section && section.getAttribute("data-section-id") === "6ae3d3b0e81d677d1d477d7f";
      if (isRegalo) {
        return window.innerWidth <= 767 ? 1.50 : 1.10;
      }
      return window.innerWidth <= 767 ? 1.40 : 1.15;
    }

    function getBleed(section) {
      var isRegalo = section && section.getAttribute("data-section-id") === "6ae3d3b0e81d677d1d477d7f";
      if (isRegalo) {
        return 0.08;
      }
      return 0.18;
    }

    document
      .querySelectorAll("section.page-section")
      .forEach(function (section) {
        var img = section.querySelector("img.background-image-fx");
        if (!img) return;

        var focal = img.getAttribute("data-image-focal-point") || "";
        var parts = focal.split(",");
        var fx = parseFloat(parts[0]);
        var fy = parseFloat(parts[1]);
        if (!isNaN(fx)) {
          img.style.objectPosition =
            (fx * 100).toFixed(2) + "% " + (!isNaN(fy) ? (fy * 100).toFixed(2) + "%" : "50%");
          img.style.transformOrigin =
            (fx * 100).toFixed(2) + "% " + (!isNaN(fy) ? (fy * 100).toFixed(2) + "%" : "50%");
        }

        entries.push({
          section: section,
          img: img,
          scale: getScale(section),
          bleed: getBleed(section),
          speed: 0.45,
          maxOffset: 0
        });
      });

    if (!entries.length) return;

    // Work out how far the image may travel before an edge of the
    // section would be exposed, so the background is never "cut".
    function measure() {
      entries.forEach(function (entry) {
        entry.scale = getScale(entry.section);
        entry.bleed = getBleed(entry.section);

        var img = entry.img;
        var previous = img.style.transform;
        img.style.transform =
          "translate3d(0, 0, 0) scale(" + entry.scale.toFixed(4) + ")";

        var sectionRect = entry.section.getBoundingClientRect();
        var imgRect = img.getBoundingClientRect();
        img.style.transform = previous;

        var topSlack = Math.max(0, sectionRect.top - imgRect.top);
        var bottomSlack = Math.max(0, imgRect.bottom - sectionRect.bottom);
        var safe = Math.min(topSlack, bottomSlack);
        var byBleed = (sectionRect.height || 1) * entry.bleed;

        entry.maxOffset = Math.max(0, Math.min(byBleed, safe * 0.85));
      });
    }

    function update() {
      entries.forEach(function (entry) {
        var rect = entry.section.getBoundingClientRect();
        var maxOffset = entry.maxOffset;
        var scrolled = Math.max(-rect.top, 0);
        var offset = -maxOffset + scrolled * entry.speed;
        if (offset > maxOffset) offset = maxOffset;
        if (offset < -maxOffset) offset = -maxOffset;

        entry.img.style.transform =
          "translate3d(0, " +
          offset.toFixed(2) +
          "px, 0) scale(" +
          entry.scale.toFixed(4) +
          ")";
      });
    }

    function refresh() {
      measure();
      update();
    }

    window.addEventListener("scroll", update, { passive: true });
    document.addEventListener("scroll", update, { passive: true });
    window.addEventListener("touchmove", update, { passive: true });
    window.addEventListener("resize", refresh);
    window.addEventListener("load", refresh);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refresh);
    }
    refresh();
  }

  // Homepage hero & Lista nozze: the entrance animation runs in CSS (local.css).
  // This is a safety net so content can never stay hidden if animations fail.
  function setupRegaloReveal() {
    var heroWrapper = document.querySelector(
      'body.homepage main section[data-section-id="6ae3d3b0e81d677d1d477db6"] .content-wrapper'
    );

    var blocks = [
      ".fe-block-64a95292975c77b252c8", // regalo intro text
      ".fe-block-660be2cad256b712cd7f", // regalo IBAN button
      ".fe-block-f57eb76475aa94c8c98a", // regalo "Intestato a"
    ]
      .map(function (selector) {
        return document.querySelector(selector);
      })
      .filter(Boolean);

    if (heroWrapper) blocks.push(heroWrapper);

    window.setTimeout(function () {
      blocks.forEach(function (block) {
        block.style.animation = "none";
        block.style.opacity = "1";
        block.style.transform = "none";
      });
    }, 3000);
  }

  function init() {
    setupMenu();
    setupCopyIban();
    setupMarquees();
    setupScrollAnimations();
    setupParallax();
    setupRegaloReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
