const header = document.querySelector("[data-header]");
const hero = document.querySelector(".hero");
const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const revealItems = document.querySelectorAll(".reveal");
const statsSection = document.querySelector(".stats-strip__inner");
const statValues = document.querySelectorAll(".stats-strip__grid span");
const quoteCarousel = document.querySelector("[data-quote-carousel]");
const quoteCards = document.querySelectorAll(".quote-card");
const quotePrev = document.querySelector("[data-quote-prev]");
const quoteNext = document.querySelector("[data-quote-next]");
const floatingTop = document.querySelector("[data-floating-top]");
const contactModal = document.querySelector("[data-contact-modal]");
const contactOpenButtons = document.querySelectorAll("[data-contact-open]");
const contactCloseButtons = document.querySelectorAll("[data-contact-close]");
const contactForm = document.querySelector("[data-contact-form]");
const contactChoices = document.querySelectorAll("[data-contact-choice]");
const contactMethodLabel = document.querySelector("[data-contact-method-label]");
const contactMethodInput = document.querySelector("[data-contact-method-input]");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lastFocusedElement = null;

const statConfigs = Array.from(statValues, (stat) => {
  const finalText = stat.textContent.trim();
  const match = finalText.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
  const numberText = match ? match[1] : "0";
  const hasDecimal = numberText.includes(".") || numberText.includes(",");
  const decimals = hasDecimal ? numberText.split(/[.,]/)[1].length : 0;
  const shouldPad = !hasDecimal && numberText.length > 1 && numberText.startsWith("0");

  return {
    element: stat,
    finalText,
    target: Number(numberText.replace(",", ".")),
    suffix: match ? match[2] : "",
    decimals,
    minLength: shouldPad ? numberText.length : 0,
    timers: [],
    frame: null,
  };
});

const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3);

const formatStatValue = (value, { suffix, decimals, minLength }) => {
  const rounded = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  return `${rounded.padStart(minLength, "0")}${suffix}`;
};

const playStatCounter = () => {
  if (prefersReducedMotion) {
    statConfigs.forEach(({ element, finalText }) => {
      element.textContent = finalText;
    });
    return;
  }

  statConfigs.forEach((config) => {
    config.timers.forEach((timer) => window.clearTimeout(timer));
    config.timers = [];
    if (config.frame) {
      window.cancelAnimationFrame(config.frame);
    }

    const randomDuration = 620;
    const settleDuration = 1200;
    const maxRandom = Math.max(config.target * 1.35, config.target + 8, 12);
    let currentValue = 0;
    const randomTimer = window.setInterval(() => {
      currentValue = Math.random() * maxRandom;
      config.element.textContent = formatStatValue(currentValue, config);
    }, 38);
    config.timers.push(randomTimer);

    const settleTimer = window.setTimeout(() => {
      window.clearInterval(randomTimer);
      const startTime = performance.now();
      const startValue = currentValue;

      const settle = (now) => {
        const progress = Math.min((now - startTime) / settleDuration, 1);
        const easedProgress = easeOutCubic(progress);
        const value = startValue + (config.target - startValue) * easedProgress;

        config.element.textContent = progress === 1
          ? config.finalText
          : formatStatValue(value, config);

        if (progress < 1) {
          config.frame = window.requestAnimationFrame(settle);
        }
      };

      config.frame = window.requestAnimationFrame(settle);
    }, randomDuration);
    config.timers.push(settleTimer);
  });
};

const setHeaderState = () => {
  const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 12;
  const isPastHero = window.scrollY > heroBottom - 8;

  header.classList.toggle("is-visible", isPastHero);
  header.classList.toggle("is-scrolled", isPastHero);

  const distanceFromBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
  floatingTop?.classList.toggle("is-visible", distanceFromBottom < 700);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });
window.addEventListener("resize", setHeaderState);

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

const setContactMethod = (method) => {
  if (!contactMethodLabel || !contactMethodInput) return;

  if (method === "email") {
    contactMethodLabel.textContent = "Adresse email";
    contactMethodInput.type = "email";
    contactMethodInput.name = "email";
    contactMethodInput.autocomplete = "email";
    contactMethodInput.placeholder = "exemple@email.com";
    return;
  }

  contactMethodLabel.textContent = "Numero WhatsApp";
  contactMethodInput.type = "tel";
  contactMethodInput.name = "whatsapp";
  contactMethodInput.autocomplete = "tel";
  contactMethodInput.placeholder = "+243 ...";
};

const openContactModal = () => {
  if (!contactModal) return;

  lastFocusedElement = document.activeElement;
  contactModal.hidden = false;
  document.body.classList.add("contact-modal-open");
  window.setTimeout(() => {
    contactModal.querySelector("input, textarea, button")?.focus();
  }, 0);
};

const closeContactModal = () => {
  if (!contactModal) return;

  contactModal.hidden = true;
  document.body.classList.remove("contact-modal-open");
  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
};

contactOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openContactModal();
  });
});

contactCloseButtons.forEach((button) => {
  button.addEventListener("click", closeContactModal);
});

contactChoices.forEach((choice) => {
  choice.addEventListener("change", () => {
    if (choice.checked) {
      setContactMethod(choice.value);
    }
  });
});

const initialContactChoice = Array.from(contactChoices).find((choice) => choice.checked);
if (initialContactChoice) {
  setContactMethod(initialContactChoice.value);
}

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const formData = new FormData(contactForm);
  const method = formData.get("reply_method");
  const fullName = formData.get("full_name");
  const contactValue = formData.get(method === "email" ? "email" : "whatsapp");
  const subject = formData.get("subject");
  const message = formData.get("message");
  const body = [
    `Nom complet : ${fullName}`,
    `Reponse souhaitee : ${method === "email" ? "Email" : "WhatsApp"}`,
    `Contact : ${contactValue}`,
    "",
    "Message :",
    message,
  ].join("\n");

  window.location.href = `mailto:contact@el-manager.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  closeContactModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contactModal && !contactModal.hidden) {
    closeContactModal();
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
    rootMargin: "0px 0px -8% 0px",
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

if (statsSection) {
  let statsAreVisible = false;
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsAreVisible) {
          statsAreVisible = true;
          playStatCounter();
        }

        if (!entry.isIntersecting) {
          statsAreVisible = false;
        }
      });
    },
    {
      threshold: 0.35,
      rootMargin: "0px 0px -12% 0px",
    }
  );

  statsObserver.observe(statsSection);
}

let activeQuoteIndex = 0;
let quoteTimer;

const showQuote = (nextIndex) => {
  if (!quoteCards.length) return;

  quoteCards[activeQuoteIndex].classList.remove("is-active");
  activeQuoteIndex = (nextIndex + quoteCards.length) % quoteCards.length;
  quoteCards[activeQuoteIndex].classList.add("is-active");
};

const startQuoteAutoplay = () => {
  if (prefersReducedMotion || quoteCards.length < 2) return;

  window.clearInterval(quoteTimer);
  quoteTimer = window.setInterval(() => {
    showQuote(activeQuoteIndex + 1);
  }, 4200);
};

const moveQuote = (direction) => {
  showQuote(activeQuoteIndex + direction);
  startQuoteAutoplay();
};

quotePrev?.addEventListener("click", () => {
  moveQuote(-1);
});

quoteNext?.addEventListener("click", () => {
  moveQuote(1);
});

quoteCarousel?.addEventListener("mouseenter", () => {
  window.clearInterval(quoteTimer);
});

quoteCarousel?.addEventListener("mouseleave", startQuoteAutoplay);

startQuoteAutoplay();
