/*
 * Site behaviors, replacing the live site's jQuery, Elementor, Swiper and Slick
 * scripts with one small file. Works on the static markup
 * (components/elementor/Elementor.tsx prints the same classes Elementor did),
 * so pages render fully without it; it only adds interaction.
 *
 *  - header menu: dropdowns and the phone menu toggle (the menu shows and
 *    wraps exactly as on the live site)
 *  - the "Request Appointment" pop-up (#popup-566 links) with its GoHighLevel form
 *  - nested accordions (one open at a time, like Elementor)
 *  - carousels (Elementor nested/image carousels) and the theme's sliders
 *  (the before/after sliders are left as the live page shows them: its Twenty20
 *  script never starts, so they stay empty)
 *  - GoHighLevel embeds load when needed; scroll-to-top button
 *  - blog comments sent to the GoHighLevel webhook
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
  // Elementor gives Swiper its breakpoints as minimum widths, so the number of slides in view switches one
  // pixel lower than the CSS does (desktop from 1024 px, tablet from 767 px), as on the live site; the
  // spacing between slides follows the CSS breakpoints.
  function swiperDevice() {
    var w = window.innerWidth;
    return w < MOBILE ? "mobile" : w < TABLET ? "tablet" : "desktop";
  }

  /* ---------- GoHighLevel embeds ---------- */
  var embedScript = false;
  function loadEmbed(frame) {
    if (!frame || frame.getAttribute("src")) return;
    var h = frame.getAttribute("data-height");
    // The form's own script sets the final height; until it does, use the height GoHighLevel declared.
    if (h && !/px$/.test(frame.style.height)) frame.style.height = h + "px";
    // GoHighLevel's script hides the frame until the form is ready, then shows it at the form's height. The
    // space reserved around it is kept until then (so nothing below jumps), then released, so the form ends
    // up exactly as tall as on the live site.
    var box = frame.closest(".vse-embed");
    if (box && window.MutationObserver) {
      var watch = new MutationObserver(function () {
        if (frame.style.visibility === "visible" && frame.style.position !== "absolute") {
          box.style.minHeight = "";
          watch.disconnect();
        }
      });
      watch.observe(frame, { attributes: true, attributeFilter: ["style"] });
    }
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
    // An embed on screen when the page opens (the appointment calendar) loads once the page has
    // loaded; the others load when the visitor first scrolls, taps or types and they come near.
    function onScreen(f) {
      var r = f.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    }
    function afterLoad(cb) {
      if (d.readyState === "complete") cb();
      else window.addEventListener("load", cb, { once: true });
    }
    afterLoad(function () {
      frames.filter(onScreen).forEach(loadEmbed);
    });
    var started = false;
    function start() {
      if (started) return;
      started = true;
      var rest = frames.filter(function (f) {
        return !f.getAttribute("src");
      });
      if (!("IntersectionObserver" in window)) return rest.forEach(loadEmbed);
      var io = new IntersectionObserver(
        function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) {
              loadEmbed(e.target);
              io.unobserve(e.target);
            }
          });
        },
        { rootMargin: "800px 0px" }
      );
      rest.forEach(function (f) {
        io.observe(f);
      });
    }
    ["scroll", "pointerdown", "touchstart", "keydown"].forEach(function (ev) {
      window.addEventListener(ev, start, { once: true, passive: true });
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
    // Inside .site-body (the live <body> classes, including Elementor's global styles), where Elementor put it.
    (d.querySelector(".site-body") || d.body).appendChild(modal);
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
          $$("a, [tabindex]", drop).forEach(function (a) {
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
        var dev = swiperDevice();
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

  /*
   * The theme's Slick sliders (same options as the live theme's custom.js), with the markup Slick 1.8.1
   * builds there: the slides themselves sit in the track, after copies of the last slides in view and
   * before copies of all of them.
   */
  function initSlick(selector, opts) {
    $$(selector).forEach(function (root) {
      var slides = $$(":scope > *", root);
      if (slides.length < 2) return;
      var count = slides.length;
      root.classList.add("slick-initialized", "slick-slider");
      if (opts.dots) root.classList.add("slick-dotted");
      var list = d.createElement("div");
      list.className = opts.draggable === false ? "slick-list" : "slick-list draggable";
      var track = d.createElement("div");
      track.className = "slick-track";
      track.style.opacity = "1";
      list.appendChild(track);
      slides.forEach(function (el, i) {
        el.classList.add("slick-slide");
        el.setAttribute("data-slick-index", i);
        track.appendChild(el);
      });
      var prev, next, dots;
      if (opts.arrows) {
        prev = d.createElement("button");
        prev.className = "slick-prev slick-arrow";
        prev.setAttribute("aria-label", "Previous");
        prev.type = "button";
        prev.textContent = "Previous";
        root.appendChild(prev);
      }
      root.appendChild(list);
      if (opts.arrows) {
        next = d.createElement("button");
        next.className = "slick-next slick-arrow";
        next.setAttribute("aria-label", "Next");
        next.type = "button";
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
      var busy = false;
      function show() {
        var w = window.innerWidth;
        var n = opts.slidesToShow;
        (opts.responsive || []).forEach(function (r) {
          if (w < r.breakpoint) n = Math.min(n, r.slidesToShow);
        });
        return Math.min(n, count);
      }
      var before = [];
      var after = [];
      function clone(el, i) {
        var c = el.cloneNode(true);
        c.classList.add("slick-cloned");
        c.classList.remove("slick-active", "slick-current");
        c.setAttribute("data-slick-index", i);
        c.id = "";
        c.setAttribute("aria-hidden", "true");
        c.setAttribute("tabindex", "-1");
        $$("a, button, [tabindex]", c).forEach(function (x) {
          x.setAttribute("tabindex", "-1");
        });
        return c;
      }
      function makeClones() {
        before.concat(after).forEach(function (c) {
          c.remove();
        });
        before = [];
        after = [];
        if (!opts.infinite) return;
        for (var k = count - show(); k < count; k++) before.push(clone(slides[k], k - count));
        before.forEach(function (c) {
          track.insertBefore(c, slides[0]);
        });
        for (var j = 0; j < count; j++) after.push(clone(slides[j], j + count));
        after.forEach(function (c) {
          track.appendChild(c);
        });
      }
      function all() {
        return before.concat(slides, after);
      }
      // In infinite mode every slide is a stop (one dot each); otherwise the slider stops at the last full view.
      function pages() {
        return opts.infinite ? count : Math.max(1, count - show() + 1);
      }
      function buildDots() {
        if (!dots) return;
        dots.innerHTML = "";
        var groups = Math.ceil(count / show());
        for (var i = 0; i < pages(); i++) {
          var li = d.createElement("li");
          li.setAttribute("role", "presentation");
          var b = d.createElement("button");
          b.type = "button";
          b.setAttribute("role", "tab");
          b.setAttribute("aria-label", i + 1 + " of " + groups);
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
        }
        var sw = list.clientWidth / n;
        all().forEach(function (el) {
          el.style.width = sw + "px";
        });
        track.style.width = sw * all().length + "px";
        if (!dots || dots.children.length !== pages()) buildDots();
        go(Math.min(index, pages() - 1), false);
      }
      function place(pos, animate) {
        var sw = slides[0].getBoundingClientRect().width;
        track.style.transition = animate && !reduceMotion ? "transform " + opts.speed + "ms ease" : "";
        track.style.transform = "translate3d(" + -(before.length + pos) * sw + "px, 0px, 0px)";
      }
      function mark(i) {
        var n = show();
        var items = all();
        items.forEach(function (el, k) {
          var on = k >= before.length + i && k < before.length + i + n;
          el.classList.toggle("slick-active", on);
          if (el.classList.contains("slick-cloned")) return;
          el.classList.toggle("slick-current", k === before.length + i);
          el.setAttribute("aria-hidden", on ? "false" : "true");
          el.setAttribute("tabindex", on ? "0" : "-1");
          // Off-screen slides are hidden from assistive tech, so nothing in them takes focus.
          $$("a, button, [tabindex]", el).forEach(function (x) {
            x.setAttribute("tabindex", on ? "0" : "-1");
          });
        });
        if (dots)
          Array.prototype.forEach.call(dots.children, function (li, k) {
            li.classList.toggle("slick-active", k === i);
          });
      }
      function go(i, user) {
        if (busy) return;
        var max = pages() - 1;
        var target = i;
        if (!opts.infinite) target = Math.max(0, Math.min(max, i));
        var final = target > max ? 0 : target < 0 ? max : target;
        index = final;
        if (user === false) {
          place(final, false);
          mark(final);
          return;
        }
        // Like Slick: past either end the track slides on into the copies, then jumps back to the real slide.
        place(target, true);
        mark(target === final ? final : target);
        if (target !== final) {
          busy = true;
          setTimeout(
            function () {
              busy = false;
              place(final, false);
              mark(final);
            },
            reduceMotion ? 0 : opts.speed,
          );
        }
        if (user) restart();
      }
      function restart() {
        clearInterval(timer);
        if (opts.autoplay && !reduceMotion)
          timer = setInterval(function () {
            if (!d.hidden) go(index + 1, null);
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
      swipe(list, function (dir) {
        go(index + dir, true);
      });
      layout();
      restart();
      window.addEventListener("resize", layout);
    });
  }

  /* ---------- Sticky header (Elementor's sticky option, on the live header) ---------- */
  function initSticky() {
    $$("[data-sticky]").forEach(function (el) {
      // A sticky box inside another sticky box rides along with it (as on the live site).
      if (el.parentNode.closest("[data-sticky]")) return;
      var cfg = {};
      try {
        cfg = JSON.parse(el.getAttribute("data-sticky"));
      } catch {
        return;
      }
      var spacer = null;
      var start = 0;
      function offset() {
        var dev = device();
        var v = dev === "mobile" ? cfg.sticky_offset_mobile : dev === "tablet" ? cfg.sticky_offset_tablet : undefined;
        return num(v === undefined || v === "" ? cfg.sticky_offset : v, 0);
      }
      function enabled() {
        return !cfg.sticky_on || cfg.sticky_on.indexOf(device()) >= 0;
      }
      function measure() {
        var ref = spacer || el;
        start = ref.getBoundingClientRect().top + window.scrollY;
      }
      function on() {
        if (spacer) return;
        spacer = d.createElement("div");
        spacer.className = "elementor-sticky__spacer";
        spacer.setAttribute("aria-hidden", "true");
        spacer.style.height = el.offsetHeight + "px";
        el.parentNode.insertBefore(spacer, el.nextSibling);
        el.style.position = "fixed";
        el.style.width = spacer.getBoundingClientRect().width + "px";
        el.style.marginTop = "0px";
        el.style.marginBottom = "0px";
        el.style.top = offset() + "px";
        el.classList.add("elementor-sticky--active", "elementor-section--handles-inside", "elementor-sticky--effects");
      }
      function off() {
        if (!spacer) return;
        spacer.remove();
        spacer = null;
        el.style.position = el.style.width = el.style.marginTop = el.style.marginBottom = el.style.top = "";
        el.classList.remove("elementor-sticky--active", "elementor-section--handles-inside", "elementor-sticky--effects");
      }
      function update() {
        if (!enabled()) return off();
        if (window.scrollY + offset() > start) on();
        else off();
      }
      measure();
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", function () {
        off();
        measure();
        update();
      });
      update();
    });
  }

  /*
   * Blog comment form: sent to the client's GoHighLevel webhook (a workflow there picks it up). Name, email
   * and website are remembered in this browser when the visitor ticks the box, as WordPress did.
   */
  var COMMENT_HOOK = "https://services.leadconnectorhq.com/hooks/SR0NgXI2OVoVaS9kGsIJ/webhook-trigger/88327577-5cc5-4bbe-8ed0-1dce2c03437d";
  var COMMENTER = "vse-commenter";
  function commentNote(f, text) {
    var note = f.querySelector(".vse-comment-note");
    if (!note) {
      note = d.createElement("p");
      note.className = "vse-comment-note";
      note.setAttribute("role", "status");
      f.appendChild(note);
    }
    note.textContent = text;
  }
  function initCommentForms() {
    var saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(COMMENTER) || "null");
    } catch {
      saved = null;
    }
    if (!saved) return;
    $$("[data-comment-form]").forEach(function (f) {
      ["author", "email", "url"].forEach(function (k) {
        if (f.elements[k] && saved[k]) f.elements[k].value = saved[k];
      });
      if (f.elements["wp-comment-cookies-consent"]) f.elements["wp-comment-cookies-consent"].checked = true;
    });
  }
  d.addEventListener("submit", function (e) {
    var f = e.target.closest && e.target.closest("[data-comment-form]");
    if (!f) return;
    e.preventDefault();
    var v = function (k) {
      return f.elements[k] ? f.elements[k].value.trim() : "";
    };
    if (!v("comment") || !v("author") || !v("email")) return commentNote(f, "Please fill in the comment, your name and your email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) return commentNote(f, "Please enter a valid email address.");
    var keep = f.elements["wp-comment-cookies-consent"] && f.elements["wp-comment-cookies-consent"].checked;
    try {
      if (keep) localStorage.setItem(COMMENTER, JSON.stringify({ author: v("author"), email: v("email"), url: v("url") }));
      else localStorage.removeItem(COMMENTER);
    } catch {
      /* storage blocked: nothing to remember */
    }
    var title = d.querySelector("h1.entry-title");
    var button = f.querySelector("[type=submit]");
    if (button) button.disabled = true;
    commentNote(f, "Sending…");
    fetch(COMMENT_HOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "blog_comment",
        name: v("author"),
        email: v("email"),
        website: v("url"),
        comment: v("comment"),
        post_id: v("comment_post_ID"),
        post_title: title ? title.textContent.trim() : d.title,
        post_url: location.origin + location.pathname,
        submitted_at: new Date().toISOString(),
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        f.elements.comment.value = "";
        commentNote(f, "Thank you! Your comment has been sent.");
      })
      .catch(function () {
        commentNote(f, "Your comment could not be sent. Please try again, or call us at (661) 254-5200.");
      })
      .then(function () {
        if (button) button.disabled = false;
      });
  });

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
    initSticky();
    initMenus();
    initAccordions();
    initSwipers();
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
      draggable: false,
      responsive: [{ breakpoint: 480, slidesToShow: 1 }],
    });
    initScrollTop();
    initEmbeds();
    initCommentForms();
  }
  // The built pages are plain HTML (scripts/postbuild.mjs removes Next's runtime), so this starts
  // right away. Under `next dev`, React hydrates the page first: wait for that
  // (components/layout/HydrationSignal.tsx), or React would undo these changes; 3 s failsafe.
  var started = false;
  function start() {
    if (started) return;
    started = true;
    init();
  }
  if (!window.__next_f || window.__vseHydrated) {
    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", start);
    else start();
  } else {
    window.addEventListener("vse:hydrated", start, { once: true });
    setTimeout(start, 3000);
  }
})();
