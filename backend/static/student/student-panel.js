(() => {
  const topbar = document.querySelector(".topbar-status");
  const clock = document.querySelector("[data-session-clock]");
  const roleButtons = Array.from(document.querySelectorAll("[data-role-strip] .role-pill"));
  const bioTrigger = document.querySelector("[data-bio-trigger]");
  const bioIcon = document.querySelector("[data-bio-icon]");
  const bioLabel = document.querySelector("[data-bio-label]");

  if (topbar && clock) {
    const rawStart = topbar.getAttribute("data-session-start");
    const startedAt = rawStart ? new Date(rawStart) : new Date();

    const format = (seconds) => {
      const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
      const secs = String(seconds % 60).padStart(2, "0");
      return `${hours}:${minutes}:${secs}`;
    };

    const updateClock = () => {
      const diffSeconds = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
      clock.textContent = format(diffSeconds);
    };

    updateClock();
    window.setInterval(updateClock, 1000);
  }

  if (roleButtons.length) {
    roleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        roleButtons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
      });
    });
  }

  if (bioTrigger) {
    bioTrigger.addEventListener("click", () => {
      bioTrigger.classList.add("is-scanning");
      bioTrigger.classList.remove("is-confirmed");
      if (bioLabel) {
        bioLabel.textContent = "ESCANEANDO_RETINA";
      }
      if (bioIcon) {
        bioIcon.textContent = "settings_slow_motion";
      }
      window.setTimeout(() => {
        bioTrigger.classList.remove("is-scanning");
        bioTrigger.classList.add("is-confirmed");
        if (bioIcon) {
          bioIcon.textContent = "check_circle";
        }
        if (bioLabel) {
          bioLabel.textContent = "IDENTIDAD_CONFIRMADA";
        }
      }, 1600);
    });
  }

  const form = document.querySelector("[data-decision-form]");
  if (!form) {
    return;
  }

  const options = Array.from(form.querySelectorAll(".decision-option"));
  const justificationInput = form.querySelector("[data-justification-input]");
  const hint = form.querySelector("[data-justification-hint]");

  const syncDecisionState = () => {
    let needsJustification = false;

    options.forEach((option) => {
      const radio = option.querySelector("input[type='radio']");
      const selected = Boolean(radio?.checked);
      option.classList.toggle("is-selected", selected);
      if (selected && option.dataset.requiresJustification === "true") {
        needsJustification = true;
      }
    });

    if (justificationInput) {
      justificationInput.required = needsJustification;
      justificationInput.placeholder = needsJustification
        ? "Esta decision requiere justificacion obligatoria"
        : "Explica por que tomas esta decision";
    }

    if (hint) {
      hint.textContent = needsJustification
        ? "La opcion seleccionada exige justificacion escrita."
        : "Algunas decisiones requieren sustento escrito antes de avanzar.";
    }
  };

  options.forEach((option) => {
    option.addEventListener("change", syncDecisionState);
    option.addEventListener("click", syncDecisionState);
  });

  syncDecisionState();
})();
