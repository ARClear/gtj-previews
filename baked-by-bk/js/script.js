/* Baked by BK — nav toggle, hero carousel, request form helpers. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Footer year ---------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Mobile navigation --------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Escape closes the menu and returns focus to the button.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset if the window grows past the mobile breakpoint.
    window.matchMedia("(min-width: 48em)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---- Carousel -------------------------------------------------------
     Slides are the <li> elements in the markup, shown in source order.
     To swap a photo, replace the file in images/carousel/ with the same
     name. To add one, copy an <li> and point it at the next number. */
  document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-slide"));
    var track = carousel.querySelector(".carousel-track");
    var prevBtn = carousel.querySelector("[data-carousel-prev]");
    var nextBtn = carousel.querySelector("[data-carousel-next]");
    var pauseBtn = carousel.querySelector("[data-carousel-pause]");
    var DELAY = 5000;
    var current = 0;
    var timer = null;
    var userPaused = reduceMotion.matches; // no autoplay when motion is reduced
    var hovering = false;
    var focused = false;

    if (slides.length < 2) {
      carousel.querySelector(".carousel-controls").hidden = true;
      return;
    }

    function show(index) {
      slides[current].classList.remove("is-active");
      slides[current].setAttribute("aria-hidden", "true");
      current = (index + slides.length) % slides.length;
      prepare(current);
      prepare(current + 1);
      slides[current].classList.add("is-active");
      slides[current].removeAttribute("aria-hidden");
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    function sync() {
      // Autoplay only when nobody is interacting and the user hasn't paused.
      var shouldPlay = !userPaused && !hovering && !focused && !document.hidden;
      if (shouldPlay && !timer) {
        timer = setInterval(function () { show(current + 1); }, DELAY);
      } else if (!shouldPlay) {
        stop();
      }
      // Announce slide changes only when the user is driving.
      track.setAttribute("aria-live", userPaused ? "polite" : "off");
      pauseBtn.setAttribute("aria-pressed", String(userPaused));
      pauseBtn.setAttribute("aria-label", userPaused ? "Play slideshow" : "Pause slideshow");
    }

    // Backdrop: a blurred copy of the slide's own photo. Set lazily for the
    // current and next slide so the page doesn't load every photo up front.
    function prepare(index) {
      var slide = slides[(index + slides.length) % slides.length];
      var img = slide.querySelector("img");
      if (!img || slide.style.getPropertyValue("--slide-bg")) return;
      img.loading = "eager";
      slide.style.setProperty("--slide-bg", 'url("' + img.src + '")');
    }

    slides.forEach(function (slide, i) {
      if (i !== 0) slide.setAttribute("aria-hidden", "true");
    });
    prepare(0);
    prepare(1);

    prevBtn.addEventListener("click", function () { show(current - 1); restart(); });
    nextBtn.addEventListener("click", function () { show(current + 1); restart(); });
    pauseBtn.addEventListener("click", function () { userPaused = !userPaused; sync(); });

    function restart() { stop(); sync(); }

    carousel.addEventListener("mouseenter", function () { hovering = true; sync(); });
    carousel.addEventListener("mouseleave", function () { hovering = false; sync(); });
    carousel.addEventListener("focusin", function () { focused = true; sync(); });
    carousel.addEventListener("focusout", function (e) {
      if (!carousel.contains(e.relatedTarget)) { focused = false; sync(); }
    });

    // Touch: pause while a finger is on it, resume a moment after.
    var touchTimer = null;
    carousel.addEventListener("touchstart", function () {
      clearTimeout(touchTimer);
      hovering = true;
      sync();
    }, { passive: true });
    carousel.addEventListener("touchend", function () {
      touchTimer = setTimeout(function () { hovering = false; sync(); }, DELAY);
    }, { passive: true });

    // Swipe left/right to change slides.
    var startX = null;
    carousel.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) show(dx < 0 ? current + 1 : current - 1);
      startX = null;
    }, { passive: true });

    document.addEventListener("visibilitychange", sync);
    reduceMotion.addEventListener("change", function (mq) {
      if (mq.matches) { userPaused = true; sync(); }
    });

    sync();
  });

  /* ---- Request form ---------------------------------------------------
     Posts to Formspree with fetch so the visitor stays on the page.
     While the action still holds the YOUR_FORM_ID placeholder, nothing is
     sent: the form shows the confirmation with a preview note instead. */
  var form = document.querySelector("[data-order-form]");
  if (form) {
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector("[type=submit]");
    var success = document.getElementById("form-success");
    var isPlaceholder = form.action.indexOf("YOUR_FORM_ID") !== -1;

    var messages = {
      name: { valueMissing: "Enter your name." },
      phone: {
        valueMissing: "Enter a cell phone number Brandy can text or call.",
        patternMismatch: "Enter a 10-digit phone number, like 816-555-0123."
      },
      email: {
        valueMissing: "Enter your email address.",
        typeMismatch: "Enter an email address like name@example.com."
      },
      request: { valueMissing: "Tell Brandy what you'd like and the date you need it." }
    };

    form.setAttribute("novalidate", "");

    function errorFor(field) {
      var v = field.validity;
      var m = messages[field.name] || {};
      if (v.valid) return "";
      if (v.valueMissing) return m.valueMissing || "This field is required.";
      if (v.typeMismatch) return m.typeMismatch || "Check this entry.";
      if (v.patternMismatch) return m.patternMismatch || "Check this entry.";
      return field.validationMessage;
    }

    function showError(field) {
      var msg = errorFor(field);
      var slot = document.getElementById(field.id + "-error");
      if (slot) slot.textContent = msg;
      if (msg) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
      return !msg;
    }

    var fields = Array.prototype.slice.call(form.querySelectorAll("[data-validate]"));

    fields.forEach(function (field) {
      // Validate on leaving a field, then live once it has an error.
      field.addEventListener("blur", function () { if (field.value) showError(field); });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") showError(field);
      });
    });

    function showSuccess(previewOnly) {
      form.hidden = true;
      if (previewOnly) success.querySelector("[data-preview-note]").hidden = false;
      success.hidden = false;
      success.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";

      var firstBad = null;
      fields.forEach(function (field) {
        if (!showError(field) && !firstBad) firstBad = field;
      });
      if (firstBad) {
        firstBad.focus();
        return;
      }

      if (isPlaceholder) {
        showSuccess(true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          showSuccess(false);
        })
        .catch(function () {
          status.textContent =
            "Your request didn't go through. Check your connection and select Send request again.";
          submitBtn.disabled = false;
          submitBtn.textContent = "Send request";
          if (window.turnstile) window.turnstile.reset();
        });
    });
  }
})();
