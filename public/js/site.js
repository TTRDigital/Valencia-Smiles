/*
 * Site behaviors, replacing the live site's jQuery, Elementor, Swiper, Slick
 * and Twenty20 scripts with one small file. Works on the static markup
 * (components/elementor/Elementor.tsx prints the same classes Elementor did),
 * so pages render fully without it; it only adds interaction.
 *
 *  - header menu: dropdowns, phone menu toggle, and a width check that
 *    switches to the phone menu whenever the full menu would wrap
 *  - pop-ups (#popup-<id> links): the "Request Appointment" form
 *  - nested accordions (one open at a time, like Elementor)
 *  - carousels (Elementor nested/image carousels) and the theme's sliders
 *  - before/after comparison sliders
 *  - GoHighLevel embeds load when needed; scroll-to-top button
 */
(function () {
  "use strict";
  var d = document;
  var MOBILE = 767;
  var TABLET = 1024;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $$(sel, root) {
    return Array.prototype.slice.call((root || d).querySelectorAll(sel));
  }
  function device() {
    var w = window.innerWidth;
    return w <= MOBILE ? "mobile" : w <= TABLET ? "tablet" : "desktop";
  }

  /* ---------- GoHighLevel embeds ---------- */
  var embedScript = false;
  function loadEmbed(frame) {
    if (!frame || frame.getAttribute("src")) return;
    var h = frame.getAttribute("data-height");
    // The form's own script sets the final height; until it does, use the height GoHighLevel declared.
    if (h && !/px$/.test(frame.style.height)) frame.style.height = h + "px";
    frame.setAttribute("src", frame.getAttribute("data-src"));
    if (!embedScript) {
      embedScript = true;
      var s = d.createElement("script");
      s.src = "https://link.msgsndr.com/js/form_embed.js";
      s.async = true;
      d.body.appendChild(s);
    }
  }
  function initEmbeds() {
    var frames = $$("iframe[data-lc-embed]").filter(function (f) {
      return !f.closest(".elementor-location-popup");
    });
    if (!frames.length) return;
    if (!("IntersectionObserver" in window)) return frames.forEach(loadEmbed);
    var io = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            loadEmbed(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "600px 0px" }
    );
    frames.forEach(function (f) {
      io.observe(f);
    });
  }

  /* ---------- Pop-ups ---------- */
  var openPopup = null;
  var lastFocus = null;
  function popupFor(id) {
    var modal = d.getElementById("elementor-popup-modal-" + id);
    if (modal) return modal;
    var doc = d.querySelector('.elementor-location-popup[data-elementor-id="' + id + '"]');
    if (!doc) return null;
    modal = d.createElement("div");
    modal.id = "elementor-popup-modal-" + id;
    modal.className = "dialog-widget dialog-lightbox-widget dialog-type-buttons dialog-type-lightbox elementor-popup-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Request Appointment");
    modal.style.display = "none";
    modal.innerHTML =
      '<div class="dialog-widget-content dialog-lightbox-widget-content animated"><a role="button" tabindex="0" aria-label="Close" href="#" class="dialog-close-button dialog-lightbox-close-button"><svg aria-hidden="true" class="e-font-icon-svg e-eicon-close" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z"></path></svg></a><div class="dialog-header dialog-lightbox-header"></div><div class="dialog-message dialog-lightbox-message"></div></div>';
    modal.querySelector(".dialog-message").appendChild(doc);
    doc.style.display = "block";
    d.body.appendChild(modal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.closest(".dialog-close-button")) {
        e.preventDefault();
        closePopup();
      }
    });
    return modal;
  }
  function showPopup(id) {
    var modal = popupFor(id);
    if (!modal) return false;
    lastFocus = d.activeElement;
    modal.style.display = "flex";
    openPopup = modal;
    $$("iframe[data-lc-embed]", modal).forEach(loadEmbed);
    var close = modal.querySelector(".dialog-close-button");
    if (close) close.focus();
    return true;
  }
  function closePopup() {
    if (!openPopup) return;
    openPopup.style.display = "none";
    openPopup = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-popup], .header-btn > a");
    if (!a) return;
    var id = a.getAttribute("data-popup");
    if (!id) {
      // The live pop-up opened from ".header-btn" only when that link had no address of its own.
      var href = a.getAttribute("href") || "";
      if (href && href !== "#") return;
      id = "566";
    }
    if (showPopup(id)) e.preventDefault();
  });
  d.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePopup();
  });

  /* ---------- Header menu ---------- */
  function initMenus() {
    $$(".elementor-widget-nav-menu").forEach(function (w) {
      var main = w.querySelector(".elementor-nav-menu--main");
      var toggle = w.querySelector(".elementor-menu-toggle");
      var drop = w.querySelector("nav.elementor-nav-menu--dropdown");

      // Desktop dropdowns: open on hover and keyboard focus.
      if (main) {
        $$("li.menu-item-has-children", main).forEach(function (li) {
          var sub = li.querySelector(":scope > ul");
          var a = li.querySelector(":scope > a");
          var timer;
          function show() {
            clearTimeout(timer);
            $$(":scope > li > ul", li.parentNode).forEach(function (u) {
              if (u !== sub) hide(u);
            });
            // SmartMenus' sizing, as on the live site; deeper levels open to the right of their item.
            sub.style.cssText = "z-index:3;width:auto;min-width:10em;max-width:1000px;display:block;margin-left:0;margin-top:0;" + (li.parentNode.classList.contains("sub-menu") ? "top:0;left:" + li.offsetWidth + "px;" : "top:auto;left:0;");
            a.classList.add("highlighted");
            a.setAttribute("aria-expanded", "true");
          }
          function hide(u) {
            u.style.cssText = "";
            var pa = u.parentNode.querySelector(":scope > a");
            if (pa) {
              pa.classList.remove("highlighted");
              pa.setAttribute("aria-expanded", "false");
            }
          }
          li.addEventListener("mouseenter", show);
          li.addEventListener("mouseleave", function () {
            timer = setTimeout(function () {
              hide(sub);
            }, 250);
          });
          li.addEventListener("focusin", show);
          li.addEventListener("focusout", function (e) {
            if (!li.contains(e.relatedTarget)) hide(sub);
          });
        });
      }

      // Phone menu.
      if (toggle && drop) {
        function setOpen(open) {
          toggle.classList.toggle("elementor-active", open);
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
          drop.setAttribute("aria-hidden", open ? "false" : "true");
          $$("a", drop).forEach(function (a) {
            a.tabIndex = open ? 0 : -1;
          });
          place();
          if (w.classList.contains("elementor-nav-menu--stretch")) stretch();
        }
        function place() {
          // As Elementor does: the dropdown sits right under the toggle button.
          drop.style.top = toggle.offsetHeight + "px";
          drop.style.setProperty("--menu-height", Math.max(0, window.innerHeight - toggle.getBoundingClientRect().bottom) + "px");
        }
        function stretch() {
          // Elementor's "full width" dropdown: as wide as the page, aligned to its left edge.
          var r = w.getBoundingClientRect();
          drop.style.width = d.documentElement.clientWidth + "px";
          drop.style.left = -r.left + "px";
        }
        toggle.addEventListener("click", function () {
          setOpen(!toggle.classList.contains("elementor-active"));
        });
        toggle.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle.click();
          }
        });
        // Sub-menus in the phone menu open and close on tap of their arrow.
        $$("li.menu-item-has-children > a", drop).forEach(function (a) {
          a.addEventListener("click", function (e) {
            var onArrow = e.target.closest(".sub-arrow, .dropdown-menu-toggle");
            var sub = a.parentNode.querySelector(":scope > ul");
            if (!sub) return;
            var open = sub.style.display === "block";
            if (onArrow || !open) {
              e.preventDefault();
              sub.style.display = open ? "" : "block";
              a.classList.toggle("highlighted", !open);
              a.setAttribute("aria-expanded", open ? "false" : "true");
            }
          });
        });
        window.addEventListener("resize", function () {
          if (!toggle.classList.contains("elementor-active")) return;
          place();
          if (w.classList.contains("elementor-nav-menu--stretch")) stretch();
        });
      }

      // The menu must never wrap: if the full menu does not fit on one line, show the phone menu instead.
      if (main && toggle) {
        var ul = main.querySelector(".elementor-nav-menu");
        var check = function () {
          w.classList.remove("vse-menu-collapsed");
          if (getComputedStyle(main).display === "none") return;
          var items = $$(":scope > li", ul);
          if (!items.length) return;
          var top = items[0].offsetTop;
          var wraps = items.some(function (li) {
            return li.offsetTop > top + 2;
          });
          if (wraps || ul.scrollWidth > main.clientWidth + 1) w.classList.add("vse-menu-collapsed");
        };
        check();
        window.addEventListener("resize", check);
        if (d.fonts && d.fonts.ready) d.fonts.ready.then(check);
      }
    });
  }

  /* ---------- Accordions ---------- */
  function initAccordions() {
    $$(".e-n-accordion").forEach(function (acc) {
      var one = acc.hasAttribute("data-max-one");
      var items = $$(":scope > details", acc);
      items.forEach(function (det) {
        var sum = det.querySelector("summary");
        det.addEventListener("toggle", function () {
          sum.setAttribute("aria-expanded", det.open ? "true" : "false");
          if (det.open && one)
            items.forEach(function (o) {
              if (o !== det && o.open) o.open = false;
            });
        });
      });
    });
  }

  /* ---------- Carousels (Elementor's Swiper carousels) ---------- */
  function num(v, f) {
    var n = parseFloat(v);
    return isNaN(n) ? f : n;
  }
  function initSwipers() {
    $$(".e-n-carousel.swiper, .elementor-image-carousel-wrapper.swiper").forEach(function (root) {
      var cfg = {};
      try {
        cfg = JSON.parse(root.getAttribute("data-settings") || "{}");
      } catch {
        cfg = {};
      }
      var widget = root.closest(".elementor-widget");
      var wrapper = root.querySelector(".swiper-wrapper");
      var slides = $$(":scope > .swiper-slide", wrapper);
      if (!slides.length) return;
      var pag = widget.querySelector(".swiper-pagination");
      var prev = widget.querySelector(".elementor-swiper-button-prev");
      var next = widget.querySelector(".elementor-swiper-button-next");
      var index = 0;
      var timer = null;
      var paused = false;
      function perView() {
        var dev = device();
        var v = dev === "mobile" ? cfg.slides_to_show_mobile : dev === "tablet" ? cfg.slides_to_show_tablet : cfg.slides_to_show;
        if (!v && dev === "mobile") v = 1;
        if (!v && dev === "tablet") v = cfg.slides_to_show ? Math.min(2, num(cfg.slides_to_show, 3)) : 2;
        return Math.max(1, Math.round(num(v, root.classList.contains("e-n-carousel") ? 3 : 3)));
      }
      function gap() {
        var dev = device();
        var g = (dev === "mobile" && cfg.image_spacing_custom_mobile && cfg.image_spacing_custom_mobile.size !== "" && cfg.image_spacing_custom_mobile) || (dev !== "desktop" && cfg.image_spacing_custom_tablet && cfg.image_spacing_custom_tablet.size !== "" && cfg.image_spacing_custom_tablet) || cfg.image_spacing_custom;
        return g ? num(g.size, 10) : 10;
      }
      root.classList.add("swiper-initialized", "swiper-horizontal");
      wrapper.style.transitionTimingFunction = "ease";
      var bullets = [];
      function pages() {
        return Math.max(1, slides.length - perView() + 1);
      }
      function buildBullets() {
        if (!pag) return;
        pag.innerHTML = "";
        pag.className = "swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal";
        bullets = [];
        for (var i = 0; i < pages(); i++) {
          var b = d.createElement("span");
          b.className = "swiper-pagination-bullet";
          b.setAttribute("role", "button");
          b.setAttribute("tabindex", "0");
          b.setAttribute("aria-label", "Go to slide " + (i + 1));
          (function (k) {
            b.addEventListener("click", function () {
              go(k, true);
            });
          })(i);
          pag.appendChild(b);
          bullets.push(b);
        }
      }
      function layout() {
        var pv = perView();
        var g = gap();
        var w = root.clientWidth;
        var sw = (w - g * (pv - 1)) / pv;
        slides.forEach(function (s) {
          s.style.width = sw + "px";
          s.style.marginRight = g + "px";
        });
        if (bullets.length !== pages()) buildBullets();
        go(Math.min(index, pages() - 1), false);
      }
      function go(i, user) {
        var max = pages() - 1;
        if (i > max) i = cfg.infinite === "yes" || cfg.autoplay === "yes" ? 0 : max;
        if (i < 0) i = cfg.infinite === "yes" ? max : 0;
        index = i;
        var g = gap();
        var off = slides[i] ? slides[i].offsetLeft - slides[0].offsetLeft : 0;
        wrapper.style.transitionDuration = (user === false || reduceMotion ? 0 : num(cfg.speed, 500)) + "ms";
        wrapper.style.transform = "translate3d(" + -off + "px, 0px, 0px)";
        slides.forEach(function (s, k) {
          s.classList.toggle("swiper-slide-active", k === i);
          s.classList.toggle("swiper-slide-next", k === i + 1);
          s.classList.toggle("swiper-slide-prev", k === i - 1);
        });
        bullets.forEach(function (b, k) {
          b.classList.toggle("swiper-pagination-bullet-active", k === i);
          if (k === i) b.setAttribute("aria-current", "true");
          else b.removeAttribute("aria-current");
        });
        if (user) restart();
        void g;
      }
      function restart() {
        clearInterval(timer);
        if (cfg.autoplay === "yes" && !reduceMotion)
          timer = setInterval(function () {
            if (!paused && !d.hidden) go(index + 1);
          }, num(cfg.autoplay_speed, 5000));
      }
      if (prev)
        prev.addEventListener("click", function () {
          go(index - 1, true);
        });
      if (next)
        next.addEventListener("click", function () {
          go(index + 1, true);
        });
      if (cfg.pause_on_hover === "yes") {
        widget.addEventListener("mouseenter", function () {
          paused = true;
        });
        widget.addEventListener("mouseleave", function () {
          paused = false;
        });
      }
      swipe(root, function (dir) {
        go(index + dir, true);
      });
      buildBullets();
      layout();
      restart();
      window.addEventListener("resize", layout);
    });
  }

  function swipe(el, cb) {
    var x0 = null;
    var y0 = null;
    el.addEventListener(
      "touchstart",
      function (e) {
        x0 = e.touches[0].clientX;
        y0 = e.touches[0].clientY;
      },
      { passive: true }
    );
    el.addEventListener(
      "touchend",
      function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        var dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) cb(dx < 0 ? 1 : -1);
        x0 = null;
      },
      { passive: true }
    );
  }

  /* ---------- The theme's Slick sliders (same options as the live theme's custom.js) ---------- */
  function initSlick(selector, opts) {
    $$(selector).forEach(function (root) {
      var items = $$(":scope > *", root);
      if (items.length < 2) return;
      root.classList.add("slick-initialized", "slick-slider");
      var list = d.createElement("div");
      list.className = "slick-list draggable";
      var track = d.createElement("div");
      track.className = "slick-track";
      list.appendChild(track);
      var slides = items.map(function (el, i) {
        var s = d.createElement("div");
        s.className = "slick-slide";
        s.setAttribute("data-slick-index", i);
        var inner = d.createElement("div");
        s.appendChild(inner);
        inner.appendChild(el);
        el.style.width = "100%";
        el.style.display = "inline-block";
        track.appendChild(s);
        return s;
      });
      var prev, next, dots;
      if (opts.arrows) {
        prev = d.createElement("button");
        prev.className = "slick-prev slick-arrow";
        prev.type = "button";
        prev.setAttribute("aria-label", "Previous");
        prev.textContent = "Previous";
        root.appendChild(prev);
      }
      root.appendChild(list);
      if (opts.arrows) {
        next = d.createElement("button");
        next.className = "slick-next slick-arrow";
        next.type = "button";
        next.setAttribute("aria-label", "Next");
        next.textContent = "Next";
        root.appendChild(next);
      }
      if (opts.dots) {
        dots = d.createElement("ul");
        dots.className = "slick-dots";
        dots.setAttribute("role", "tablist");
        root.appendChild(dots);
      }
      var index = 0;
      var timer = null;
      function show() {
        var w = window.innerWidth;
        var n = opts.slidesToShow;
        (opts.responsive || []).forEach(function (r) {
          if (w < r.breakpoint) n = Math.min(n, r.slidesToShow);
        });
        return Math.min(n, slides.length);
      }
      // Like Slick: in infinite mode every slide is a stop (one dot each) and the track
      // continues into copies of the first slides; otherwise it stops at the last full view.
      function pages() {
        return opts.infinite ? slides.length : Math.max(1, slides.length - show() + 1);
      }
      var clones = [];
      function makeClones() {
        clones.forEach(function (c) {
          c.remove();
        });
        clones = [];
        if (!opts.infinite) return;
        for (var k = 0; k < show(); k++) {
          var c = slides[k].cloneNode(true);
          c.classList.add("slick-cloned");
          c.setAttribute("aria-hidden", "true");
          c.removeAttribute("data-slick-index");
          $$("a, button, [tabindex]", c).forEach(function (x) {
            x.setAttribute("tabindex", "-1");
          });
          track.appendChild(c);
          clones.push(c);
        }
      }
      function buildDots() {
        if (!dots) return;
        dots.innerHTML = "";
        for (var i = 0; i < pages(); i++) {
          var li = d.createElement("li");
          li.setAttribute("role", "presentation");
          var b = d.createElement("button");
          b.type = "button";
          b.setAttribute("role", "tab");
          b.setAttribute("aria-label", i + 1 + " of " + pages());
          b.textContent = String(i + 1);
          (function (k) {
            b.addEventListener("click", function () {
              go(k, true);
            });
          })(i);
          li.appendChild(b);
          dots.appendChild(li);
        }
      }
      var shown = 0;
      function layout() {
        var n = show();
        if (n !== shown) {
          shown = n;
          makeClones();
          // Before/after sliders inside clones need their own handles.
          clones.forEach(function (c) {
            $$(".twentytwenty-wrapper", c).forEach(function (wr) {
              var cont = wr.querySelector(".twentytwenty-container");
              wr.parentNode.insertBefore(cont, wr);
              wr.remove();
              $$(".twentytwenty-overlay, .twentytwenty-handle", cont).forEach(function (x) {
                x.remove();
              });
              initTwentyOne(cont);
            });
          });
        }
        var sw = list.clientWidth / n;
        slides.concat(clones).forEach(function (s) {
          s.style.width = sw + "px";
        });
        track.style.width = sw * (slides.length + clones.length) + "px";
        if (!dots || dots.children.length !== pages()) buildDots();
        go(Math.min(index, pages() - 1), false);
      }
      function go(i, user) {
        var max = pages() - 1;
        if (i > max) i = opts.infinite ? 0 : max;
        if (i < 0) i = opts.infinite ? max : 0;
        index = i;
        var sw = slides[0].getBoundingClientRect().width;
        track.style.transition = user === false || reduceMotion ? "none" : "transform " + opts.speed + "ms ease";
        track.style.transform = "translate3d(" + -i * sw + "px, 0px, 0px)";
        var n = show();
        slides.forEach(function (s, k) {
          var on = k >= i && k < i + n;
          s.classList.toggle("slick-active", on);
          s.classList.toggle("slick-current", k === i);
          s.setAttribute("aria-hidden", on ? "false" : "true");
        });
        if (dots)
          Array.prototype.forEach.call(dots.children, function (li, k) {
            li.classList.toggle("slick-active", k === i);
          });
        if (user) restart();
      }
      function restart() {
        clearInterval(timer);
        if (opts.autoplay && !reduceMotion)
          timer = setInterval(function () {
            if (!d.hidden) go(index + 1);
          }, 3000);
      }
      if (prev)
        prev.addEventListener("click", function () {
          go(index - 1, true);
        });
      if (next)
        next.addEventListener("click", function () {
          go(index + 1, true);
        });
      if (!opts.noSwipe)
        swipe(list, function (dir) {
          go(index + dir, true);
        });
      layout();
      restart();
      window.addEventListener("resize", layout);
    });
  }

  /* ---------- Before/after (Twenty20) ---------- */
  function initTwenty() {
    $$(".twentytwenty-container").forEach(initTwentyOne);
  }
  function initTwentyOne(c) {
    (function () {
      var imgs = c.querySelectorAll("img");
      if (imgs.length < 2) return;
      var before = imgs[0];
      var after = imgs[1];
      var offset = num(c.getAttribute("data-offset"), 0.5);
      var wrap = d.createElement("div");
      wrap.className = "twentytwenty-wrapper twentytwenty-horizontal";
      c.parentNode.insertBefore(wrap, c);
      wrap.appendChild(c);
      before.classList.add("twentytwenty-before");
      after.classList.add("twentytwenty-after");
      var overlay = d.createElement("div");
      overlay.className = "twentytwenty-overlay";
      var bl = c.getAttribute("data-before");
      var al = c.getAttribute("data-after");
      overlay.innerHTML = (bl ? '<div class="twentytwenty-before-label" data-content="' + bl + '"></div>' : "") + (al ? '<div class="twentytwenty-after-label" data-content="' + al + '"></div>' : "");
      c.appendChild(overlay);
      var handle = d.createElement("div");
      handle.className = "twentytwenty-handle";
      handle.setAttribute("role", "slider");
      handle.setAttribute("tabindex", "0");
      handle.setAttribute("aria-label", "Drag to compare before and after");
      handle.innerHTML = '<span class="twentytwenty-left-arrow"></span><span class="twentytwenty-right-arrow"></span>';
      c.appendChild(handle);
      c.classList.add("active");
      function size() {
        var w = after.getBoundingClientRect().width || c.clientWidth;
        var h = after.getBoundingClientRect().height;
        if (!w || !h) return;
        c.style.height = h + "px";
        var x = w * offset;
        before.style.clip = "rect(0px, " + x + "px, " + h + "px, 0px)";
        handle.style.left = x + "px";
        handle.setAttribute("aria-valuenow", Math.round(offset * 100));
      }
      function move(clientX) {
        var r = c.getBoundingClientRect();
        offset = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        size();
      }
      var drag = false;
      c.addEventListener("pointerdown", function (e) {
        drag = true;
        move(e.clientX);
        if (c.setPointerCapture) c.setPointerCapture(e.pointerId);
      });
      c.addEventListener("pointermove", function (e) {
        if (drag) move(e.clientX);
      });
      c.addEventListener("pointerup", function () {
        drag = false;
      });
      c.addEventListener("pointercancel", function () {
        drag = false;
      });
      handle.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          offset = Math.max(0, Math.min(1, offset + (e.key === "ArrowLeft" ? -0.05 : 0.05)));
          size();
          e.preventDefault();
        }
      });
      c.style.touchAction = "pan-y";
      [before, after].forEach(function (im) {
        if (!im.complete) im.addEventListener("load", size);
      });
      size();
      window.addEventListener("resize", size);
    })();
  }

  /* ---------- Scroll to top (Astra) ---------- */
  function initScrollTop() {
    var b = d.getElementById("ast-scroll-top");
    if (!b) return;
    function onScroll() {
      b.style.display = window.scrollY > 300 ? "block" : "none";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    b.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    b.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        b.click();
      }
    });
  }

  function init() {
    initMenus();
    initAccordions();
    initSwipers();
    initTwenty();
    initSlick(".why-patient-slider-wrap", {
      dots: false,
      arrows: false,
      infinite: true,
      speed: 300,
      slidesToShow: 3,
      autoplay: true,
      responsive: [
        { breakpoint: 991, slidesToShow: 2 },
        { breakpoint: 600, slidesToShow: 2 },
        { breakpoint: 480, slidesToShow: 1 },
      ],
    });
    initSlick(".before-after-slider-wrap", {
      dots: true,
      arrows: true,
      infinite: true,
      speed: 300,
      slidesToShow: 3,
      autoplay: false,
      noSwipe: true,
      responsive: [{ breakpoint: 480, slidesToShow: 1 }],
    });
    initScrollTop();
    initEmbeds();
  }
  // Start after React has hydrated the page (components/layout/HydrationSignal.tsx); 3 s failsafe.
  var started = false;
  function start() {
    if (started) return;
    started = true;
    init();
  }
  if (window.__vseHydrated) start();
  else {
    window.addEventListener("vse:hydrated", start, { once: true });
    setTimeout(start, 3000);
  }
})();
