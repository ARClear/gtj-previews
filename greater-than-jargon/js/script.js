/* Greater Than Jargon — nav toggle, footer year, request form. */
(function () {
  "use strict";

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

  /* ---- Request form ---------------------------------------------------
     Posts to Formspree with fetch so the visitor stays on the page.
     While the action still holds the XXXXXXX placeholder, nothing is
     sent: the form shows the confirmation with a preview note instead. */
  var form = document.querySelector("[data-request-form]");
  if (!form) return;

  var status = form.querySelector(".form-status");
  var submitBtn = form.querySelector("[type=submit]");
  var success = document.getElementById("form-success");
  var isPlaceholder = form.action.indexOf("XXXXXXX") !== -1;

  var messages = {
    name: { valueMissing: "Enter your name." },
    business: { valueMissing: "Enter your business name." },
    phone: {
      valueMissing: "Enter a phone number.",
      patternMismatch: "Enter a 10-digit phone number, like 816-555-0123."
    },
    email: {
      valueMissing: "Enter your email address.",
      typeMismatch: "Enter an email address like name@example.com."
    },
    details: { valueMissing: "Tell me a little about what you're looking for." }
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
})();
