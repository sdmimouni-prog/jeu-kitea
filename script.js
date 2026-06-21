(() => {
  const experience = document.querySelector("[data-experience]");
  const startButton = document.querySelector("[data-start-button]");
  const quitButton = document.querySelector("[data-quit-button]");
  const continueButton = document.querySelector("[data-continue-button]");
  const memoryBackButtons = document.querySelectorAll("[data-memory-back]");
  const memoryStartButton = document.querySelector("[data-memory-start]");
  const memorySuccessBackButton = document.querySelector("[data-memory-success-back]");
  const memorySuccessContinueButton = document.querySelector("[data-memory-success-continue]");
  const wheelBackButton = document.querySelector("[data-wheel-back]");
  const spinButton = document.querySelector("[data-spin-button]");
  const finalBackButton = document.querySelector("[data-final-back]");
  const memoryCardButtons = document.querySelectorAll("[data-memory-card]");
  const memoryResetButton = document.querySelector("[data-memory-reset]");
  const observeTimeNodes = document.querySelectorAll("[data-observe-time], [data-observe-time-card]");
  const memoryPlayTimeNode = document.querySelector("[data-memory-play-time]");
  const memoryDots = document.querySelectorAll(".memory-selection-dots span");
  const gameArtboard = document.querySelector("[data-game-artboard]");
  const playLayer = document.querySelector("[data-play-layer]");
  const catcher = document.querySelector("[data-catcher]");
  const scoreNode = document.querySelector("[data-score]");
  const timeNode = document.querySelector("[data-time-left]");
  const resultScoreNode = document.querySelector("[data-result-score]");

  const screens = new Set(["intro", "game", "result", "memory", "memory-observe", "memory-play", "memory-success", "wheel", "final"]);
  const design = Object.freeze({ width: 1536, height: 1024 });
  const gameDesign = Object.freeze({ width: 1644, height: 957 });
  const couponLabels = ["5%", "10%", "15%", "K", "KITEA"];
  const game = {
    catcherWidth: 450,
    catcherX: 822,
    duration: 10000,
    drops: [],
    goal: 15,
    lastFrame: 0,
    lastSpawn: 0,
    raf: 0,
    running: false,
    score: 0,
    spawnEvery: 520,
    startedAt: 0,
    timer: 0,
  };
  const memory = {
    observeInterval: 0,
    observeTimer: 0,
    playInterval: 0,
    playTimer: 0,
    selected: [],
    sequence: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  };
  let spinTimer = 0;

  const setAppHeight = () => {
    document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
  };

  const setScreen = (screenName) => {
    if (!screens.has(screenName)) return false;
    experience.dataset.screen = screenName;
    return true;
  };

  const formatScore = (value) => String(value).padStart(2, "0");

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  const setCatcherX = (x) => {
    const half = game.catcherWidth / 2;
    game.catcherX = Math.max(half + 24, Math.min(gameDesign.width - half - 24, x));
    catcher.style.setProperty("--catcher-x", game.catcherX.toFixed(1));
  };

  const clientToDesignX = (clientX) => {
    const rect = gameArtboard.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * gameDesign.width;
  };

  const moveCatcher = (event) => {
    if (experience.dataset.screen !== "game") return;
    setCatcherX(clientToDesignX(event.clientX));
  };

  const resetDrops = () => {
    game.drops.forEach((drop) => drop.element.remove());
    game.drops = [];
  };

  const renderScore = () => {
    scoreNode.textContent = formatScore(game.score);
  };

  const renderTime = (value) => {
    timeNode.textContent = String(value);
  };

  const clearMemoryTimers = () => {
    clearInterval(memory.observeInterval);
    clearTimeout(memory.observeTimer);
    clearInterval(memory.playInterval);
    clearTimeout(memory.playTimer);
  };

  const clearSpinTimer = () => {
    clearTimeout(spinTimer);
    delete experience.dataset.wheelSpinning;
    spinButton.disabled = false;
  };

  const renderObserveTime = (value) => {
    const text = String(value).padStart(2, "0");
    observeTimeNodes.forEach((node) => {
      node.textContent = text;
    });
  };

  const resetMemorySelection = () => {
    memory.selected = [];
    memoryCardButtons.forEach((button) => {
      button.classList.remove("is-picked");
    });
    memoryDots.forEach((dot) => {
      dot.classList.remove("is-filled");
    });
  };

  const renderMemoryPlayTime = (value) => {
    memoryPlayTimeNode.textContent = String(value).padStart(2, "0");
  };

  const startMemoryPlay = () => {
    clearMemoryTimers();
    resetMemorySelection();
    renderMemoryPlayTime(20);
    setScreen("memory-play");

    let remaining = 20;
    memory.playInterval = window.setInterval(() => {
      remaining -= 1;
      renderMemoryPlayTime(Math.max(0, remaining));
      if (remaining <= 0) clearInterval(memory.playInterval);
    }, 1000);
    memory.playTimer = window.setTimeout(() => {
      clearInterval(memory.playInterval);
      renderMemoryPlayTime(0);
    }, 20000);
  };

  const startMemoryObserve = () => {
    clearMemoryTimers();
    resetMemorySelection();
    renderObserveTime(3);
    setScreen("memory-observe");

    let remaining = 3;
    memory.observeInterval = window.setInterval(() => {
      remaining -= 1;
      renderObserveTime(Math.max(0, remaining));
      if (remaining <= 0) clearInterval(memory.observeInterval);
    }, 1000);
    memory.observeTimer = window.setTimeout(startMemoryPlay, 3000);
  };

  const makeDrop = () => {
    const label = couponLabels[Math.floor(Math.random() * couponLabels.length)];
    const size = randomBetween(118, 178);
    const baseX = randomBetween(135, gameDesign.width - 135);
    const element = document.createElement("div");
    const whiteCoupon = label === "KITEA" || Math.random() > 0.72;

    element.className = `drop${whiteCoupon ? " drop--white" : ""}`;
    element.style.width = `${(size / gameDesign.width) * 100}%`;
    element.style.height = `${((size * 1.35) / gameDesign.height) * 100}%`;
    element.style.setProperty("--coupon-rotate", `${randomBetween(-7, 7).toFixed(2)}deg`);
    element.innerHTML = `
      <div class="drop__canopy"></div>
      <div class="drop__strings"></div>
      <div class="drop__coupon">${label}</div>
    `;

    playLayer.appendChild(element);

    return {
      baseX,
      element,
      phase: randomBetween(0, Math.PI * 2),
      size,
      speed: randomBetween(185, 260),
      sway: randomBetween(18, 54),
      x: baseX,
      y: -size,
    };
  };

  const positionDrop = (drop, now) => {
    drop.x = drop.baseX + Math.sin(now / 560 + drop.phase) * drop.sway;
    drop.element.style.left = `${(drop.x / gameDesign.width) * 100}%`;
    drop.element.style.top = `${(drop.y / gameDesign.height) * 100}%`;
  };

  const catchDrop = (drop) => {
    const couponX = drop.x;
    const couponY = drop.y + drop.size * 1.08;
    const left = game.catcherX - game.catcherWidth / 2;
    const right = game.catcherX + game.catcherWidth / 2;
    const top = 690;
    const bottom = 900;

    return couponX >= left && couponX <= right && couponY >= top && couponY <= bottom;
  };

  const stopGame = () => {
    game.running = false;
    cancelAnimationFrame(game.raf);
    clearTimeout(game.timer);
  };

  const finishGame = () => {
    if (experience.dataset.screen === "result") return;
    stopGame();
    resetDrops();
    renderTime(0);
    resultScoreNode.textContent = String(game.score).padStart(2, "0");
    experience.dataset.intent = "reward";
    setScreen("result");
  };

  const updateGame = (now) => {
    if (!game.running) return;

    if (!game.lastFrame) game.lastFrame = now;
    const delta = Math.min((now - game.lastFrame) / 1000, 0.05);
    game.lastFrame = now;

    const elapsed = now - game.startedAt;
    renderTime(Math.max(0, Math.ceil((game.duration - elapsed) / 1000)));

    if (elapsed >= game.duration) {
      finishGame();
      return;
    }

    if (now - game.lastSpawn > game.spawnEvery) {
      game.drops.push(makeDrop());
      game.lastSpawn = now;
    }

    game.drops = game.drops.filter((drop) => {
      drop.y += drop.speed * delta;
      positionDrop(drop, now);

      if (catchDrop(drop)) {
        game.score += 1;
        renderScore();
        drop.element.remove();
        return false;
      }

      if (drop.y > gameDesign.height + drop.size) {
        drop.element.remove();
        return false;
      }

      return true;
    });

    game.raf = requestAnimationFrame(updateGame);
  };

  const startGame = () => {
    stopGame();
    resetDrops();
    game.score = 0;
    game.startedAt = performance.now();
    game.lastFrame = 0;
    game.lastSpawn = 0;
    game.running = true;
    renderScore();
    renderTime(10);
    setCatcherX(gameDesign.width / 2);
    setScreen("game");
    game.timer = window.setTimeout(finishGame, game.duration);
    game.raf = requestAnimationFrame(updateGame);
  };

  const handleStart = () => {
    startGame();
    experience.dataset.intent = "started";

    const event = new CustomEvent("kitea:game-start", {
      detail: {
        currentScreen: experience.dataset.screen,
        nextScreen: "game",
      },
    });

    window.dispatchEvent(event);
  };

  setAppHeight();
  window.addEventListener("resize", setAppHeight, { passive: true });
  window.addEventListener("orientationchange", setAppHeight, { passive: true });
  startButton.addEventListener("click", handleStart);
  quitButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    stopGame();
    resetDrops();
    experience.dataset.intent = "home";
    setScreen("intro");
  });
  continueButton.addEventListener("click", () => {
    experience.dataset.intent = "memory";
    setScreen("memory");
  });
  continueButton.addEventListener("pointerenter", () => {
    experience.dataset.continueHover = "true";
  });
  continueButton.addEventListener("pointerleave", () => {
    delete experience.dataset.continueHover;
  });
  memoryBackButtons.forEach((button) => {
    button.addEventListener("click", () => {
      clearMemoryTimers();
      experience.dataset.intent = "reward";
      setScreen("result");
    });
  });
  memoryStartButton.addEventListener("click", () => {
    experience.dataset.intent = "memory-started";
    startMemoryObserve();
  });
  memoryResetButton.addEventListener("click", resetMemorySelection);
  memoryCardButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (experience.dataset.screen !== "memory-play") return;
      const index = Number(button.dataset.memoryCard);
      memory.selected.push(index);
      button.classList.add("is-picked");
      const dot = memoryDots[memory.selected.length - 1];
      if (dot) dot.classList.add("is-filled");
      if (memory.selected.length >= memory.sequence.length) {
        clearMemoryTimers();
        experience.dataset.intent = "memory-sequence-complete";
        setScreen("memory-success");
      }
    });
  });
  memorySuccessBackButton.addEventListener("click", () => {
    clearMemoryTimers();
    clearSpinTimer();
    experience.dataset.intent = "home";
    setScreen("intro");
  });
  memorySuccessContinueButton.addEventListener("click", () => {
    clearMemoryTimers();
    experience.dataset.intent = "wheel";
    setScreen("wheel");
  });
  wheelBackButton.addEventListener("click", () => {
    clearSpinTimer();
    experience.dataset.intent = "memory-sequence-complete";
    setScreen("memory-success");
  });
  spinButton.addEventListener("click", () => {
    if (experience.dataset.wheelSpinning === "true") return;
    clearSpinTimer();
    experience.dataset.intent = "final";
    experience.dataset.wheelSpinning = "true";
    spinButton.disabled = true;
    spinTimer = window.setTimeout(() => {
      clearSpinTimer();
      setScreen("final");
    }, 2150);
  });
  finalBackButton.addEventListener("click", () => {
    clearSpinTimer();
    experience.dataset.intent = "wheel";
    setScreen("wheel");
  });
  gameArtboard.addEventListener("pointerdown", (event) => {
    gameArtboard.setPointerCapture?.(event.pointerId);
    moveCatcher(event);
  });
  gameArtboard.addEventListener("pointermove", moveCatcher);

  window.KiteaCouponGame = {
    design,
    startGame,
    setScreen,
    getScreen: () => experience.dataset.screen,
  };
})();
