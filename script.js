const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const techCanvas = document.querySelector("#techBackground");
const scrollPanels = Array.from(document.querySelectorAll(".scroll-panel"));

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  window.dispatchEvent(
    new CustomEvent("background-right-click", {
      detail: {
        x: event.clientX,
        y: event.clientY,
      },
    })
  );
});

document.addEventListener("copy", (event) => {
  event.preventDefault();
});

document.addEventListener("keydown", (event) => {
  const key = event.key.toUpperCase();
  const usesDevShortcut = event.ctrlKey || event.metaKey;
  const usesInspectorShortcut = event.ctrlKey && event.shiftKey;

  if (
    event.key === "F12" ||
    (usesInspectorShortcut && ["I", "J", "C"].includes(key)) ||
    (usesDevShortcut && ["U", "S"].includes(key))
  ) {
    event.preventDefault();
  }
});

if (scrollPanels.length > 0) {
  document.body.classList.add("is-animated-scroll");

  const setActivePanel = (activeIndex) => {
    scrollPanels.forEach((panel, index) => {
      panel.classList.toggle("is-visible", index === activeIndex);
      panel.classList.toggle("is-past", index < activeIndex);
      panel.classList.toggle("is-future", index > activeIndex);
    });
  };

  if ("IntersectionObserver" in window) {
    let activeIndex = 0;
    const ratios = new Map(scrollPanels.map((panel) => [panel, 0]));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.intersectionRatio);
        });

        const nextIndex = scrollPanels.reduce((bestIndex, panel, index) => {
          return ratios.get(panel) > ratios.get(scrollPanels[bestIndex]) ? index : bestIndex;
        }, activeIndex);

        if (nextIndex !== activeIndex || !scrollPanels[activeIndex].classList.contains("is-visible")) {
          activeIndex = nextIndex;
          setActivePanel(activeIndex);
        }
      },
      {
        threshold: [0, 0.18, 0.34, 0.5, 0.66, 0.82, 1],
      }
    );

    scrollPanels.forEach((panel) => observer.observe(panel));
    setActivePanel(0);
  } else {
    scrollPanels.forEach((panel) => panel.classList.add("is-visible"));
  }
}

if (techCanvas) {
  const ctx = techCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossible d'initialiser le fond interactif.");
  }

  const pointer = {
    active: false,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  const particles = [];
  const bursts = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let animationFrame = 0;

  const buildParticles = () => {
    particles.length = 0;
    const count = Math.min(90, Math.max(38, Math.floor((width * height) / 22000)));

    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 1.6 + 0.7,
      });
    }
  };

  const resizeCanvas = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    techCanvas.width = Math.floor(width * pixelRatio);
    techCanvas.height = Math.floor(height * pixelRatio);
    techCanvas.style.width = `${width}px`;
    techCanvas.style.height = `${height}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildParticles();
  };

  const drawCircuitLines = () => {
    ctx.strokeStyle = "rgba(23, 107, 91, 0.08)";
    ctx.lineWidth = 1;

    for (let y = 32; y < height; y += 84) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (let x = 24; x < width; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  const updateParticle = (particle) => {
    if (!reducedMotion) {
      particle.x += particle.vx;
      particle.y += particle.vy;
    }

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    const dx = particle.x - pointer.x;
    const dy = particle.y - pointer.y;
    const distance = Math.hypot(dx, dy);

    if (pointer.active && distance < 150 && distance > 0) {
      const force = (150 - distance) / 150;
      particle.x += (dx / distance) * force * 1.8;
      particle.y += (dy / distance) * force * 1.8;
    }
  };

  const createBurst = (x, y) => {
    const rays = Array.from({ length: 14 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 14 + Math.random() * 0.22;
      const length = Math.random() * 64 + 42;

      return {
        angle,
        length,
        speed: Math.random() * 1.6 + 1,
      };
    });

    bursts.push({
      x,
      y,
      age: 0,
      duration: reducedMotion ? 1 : 34,
      rays,
    });

    if (reducedMotion) {
      draw();
    }
  };

  const drawBursts = () => {
    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const burst = bursts[i];
      const progress = burst.age / burst.duration;
      const opacity = Math.max(0, 1 - progress);
      const radius = 12 + progress * 96;

      ctx.strokeStyle = `rgba(47, 95, 152, ${0.42 * opacity})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(23, 107, 91, ${0.38 * opacity})`;
      burst.rays.forEach((ray) => {
        const start = progress * 18;
        const end = start + ray.length * progress;
        const x1 = burst.x + Math.cos(ray.angle) * start;
        const y1 = burst.y + Math.sin(ray.angle) * start;
        const x2 = burst.x + Math.cos(ray.angle) * end;
        const y2 = burst.y + Math.sin(ray.angle) * end;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.fillStyle = `rgba(47, 95, 152, ${0.7 * opacity})`;
        ctx.beginPath();
        ctx.arc(x2, y2, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      burst.age += 1;

      if (burst.age > burst.duration) {
        bursts.splice(i, 1);
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    drawCircuitLines();

    particles.forEach(updateParticle);

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];

      for (let j = i + 1; j < particles.length; j += 1) {
        const next = particles[j];
        const distance = Math.hypot(particle.x - next.x, particle.y - next.y);

        if (distance < 112) {
          ctx.strokeStyle = `rgba(23, 107, 91, ${0.16 * (1 - distance / 112)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
        }
      }

      const pointerDistance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
      if (pointer.active && pointerDistance < 190) {
        ctx.strokeStyle = `rgba(47, 95, 152, ${0.22 * (1 - pointerDistance / 190)})`;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }

      ctx.fillStyle = pointer.active && pointerDistance < 130 ? "#2f5f98" : "#176b5b";
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBursts();

    if (!reducedMotion) {
      animationFrame = requestAnimationFrame(draw);
    }
  };

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", (event) => {
    pointer.active = true;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  window.addEventListener("background-right-click", (event) => {
    createBurst(event.detail.x, event.detail.y);
  });

  resizeCanvas();
  draw();

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(animationFrame);
  });
}
