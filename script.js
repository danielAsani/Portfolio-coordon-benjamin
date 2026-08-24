const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const revealItems = document.querySelectorAll(".reveal");
const statValues = document.querySelectorAll(".hero__stats dd");
const quoteCarousel = document.querySelector("[data-quote-carousel]");
const quoteCards = document.querySelectorAll(".quote-card");
const quotePrev = document.querySelector("[data-quote-prev]");
const quoteNext = document.querySelector("[data-quote-next]");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const statConfigs = Array.from(statValues, (stat) => {
  const finalText = stat.textContent.trim();
  const match = finalText.match(/^(\d+)(.*)$/);

  return {
    element: stat,
    finalText,
    target: match ? Number(match[1]) : 0,
    suffix: match ? match[2] : "",
    hasPlayed: false,
  };
});

const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3);

const formatStatValue = (value, suffix) => `${Math.round(value)}${suffix}`;

const playStatCounter = () => {
  if (prefersReducedMotion) {
    statConfigs.forEach(({ element, finalText }) => {
      element.textContent = finalText;
    });
    return;
  }

  statConfigs.forEach((config) => {
    if (config.hasPlayed) return;

    config.hasPlayed = true;

    const randomDuration = 620;
    const settleDuration = 1200;
    const maxRandom = Math.max(config.target * 1.4, config.target + 8, 12);
    let currentValue = 0;
    const randomTimer = window.setInterval(() => {
      currentValue = Math.floor(Math.random() * (maxRandom + 1));
      config.element.textContent = formatStatValue(currentValue, config.suffix);
    }, 38);

    window.setTimeout(() => {
      window.clearInterval(randomTimer);
      const startTime = performance.now();
      const startValue = currentValue;

      const settle = (now) => {
        const progress = Math.min((now - startTime) / settleDuration, 1);
        const easedProgress = easeOutCubic(progress);
        const value = startValue + (config.target - startValue) * easedProgress;

        config.element.textContent = progress === 1
          ? config.finalText
          : formatStatValue(value, config.suffix);

        if (progress < 1) {
          window.requestAnimationFrame(settle);
        }
      };

      window.requestAnimationFrame(settle);
    }, randomDuration);
  });
};

const setHeaderState = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

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

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        if (entry.target.classList.contains("hero__stats")) {
          playStatCounter();
        }
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
