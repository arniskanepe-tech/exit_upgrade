// assets/game.js
(() => {
  // ============ Konfigurācija ============
  const symbols = ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];

  const intro = {
    greeting: "Čau, Nikola! Daudz laimes dzimšanas dienā! Esam tev sarūpējuši vienu dāvanu, kas liks parakāties atmiņas dzīlēs, paskaitīt, iespējams pasvīst un cerams sagādās pozitīvas emocijas. Vai esi gatava?",
    answer: "jā",
    wrongHint: "tiešām?"
  };

  const levels = [
    {
      id: 1,
      background: "bg.jpg",
      targetSlot: 1,
      answer: "345",
      cardHtml: `
        <p>Kas par fantastisku Gadu Secību bijusi.</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "Padoms #1 (L1) — paskaties uz GADU secību.",
      hint2: "Padoms #2 (L1) — cipari ir tieši 3 un tie ir redzami vienā līnijā.",
      hint3: "Padoms #3 (L1) — uzgriez līdz MĒRĶA simbolam."
    },
    {
      id: 2,
      background: "bg1.jpg",
      targetSlot: 0,
      answer: "149",
      cardHtml: `
        <p>Steady, Dress up, Go!</p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "",
      hint2: "",
      hint3: ""
    },
    {
      id: 3,
      background: "bg2.jpg",
      targetSlot: 3,
      answer: "159",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "",
      hint2: "",
      hint3: ""
    },
    {
      id: 4,
      background: "bg3.jpg",
      targetSlot: 2,
      answer: "317",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "",
      hint2: "",
      hint3: ""
    },
    {
      id: 5,
      background: "bg4.jpg",
      targetSlot: 6,
      answer: "368",
      cardHtml: `
        <p></p>
        <p class="muted">Uzgriez kodu pretī izvēlētajam simbolam.</p>
      `,
      hint1: "",
      hint2: "",
      hint3: ""
    }
  ];

  const wrongMessages = [
    { text: "Tā jau nu gan nebūs", sound: "assets/sound/wrong_01.m4a" },
    { text: "Sīkais, nu tu dod...", sound: "assets/sound/wrong_09.m4a" },
    { text: "Ola, Ola, seniorita...", sound: "assets/sound/wrong_08.m4a" },
    { text: "Wtf...", sound: "assets/sound/wrong_07.m4a" },
    { text: "Vēl kaut kādas grandiozas idejas..", sound: "assets/sound/wrong_06.m4a" },
    { text: "Asprāte, ja?", sound: "assets/sound/wrong_05.m4a" },
    { text: "Atpakaļ uz bērnu dārzu?", sound: "assets/sound/wrong_04.m4a" },
    { text: "Saņemies, tu to vari?", sound: "assets/sound/wrong_03.m4a" },
    { text: "Es zinu, ka tu vari labāk!", sound: "assets/sound/wrong_02.m4a" },
    { text: "Forza, forza!!!", sound: "assets/sound/wrong_10.m4a" }
  ];

  // ============ DOM ============
  const scene = document.getElementById("scene");
  const diskShell = document.getElementById("diskShell");
  const canvas = document.getElementById("diskCanvas");

  const taskCard = document.getElementById("taskCard");
  const cardTitle = document.getElementById("cardTitle");
  const cardBody = document.getElementById("cardBody");
  const feedback = document.getElementById("feedback");
  const targetSymbolLabel = document.getElementById("targetSymbolLabel");
  const nextBtn = document.getElementById("nextBtn");
  const resultMsg = document.getElementById("resultMsg");

  // MOBILE TASK MODAL
  const taskFab = document.getElementById("taskFab");
  const taskOverlay = document.getElementById("taskOverlay");
  const taskModalBody = document.getElementById("taskModalBody");
  const taskClose = document.getElementById("taskClose");

  const taskCardHome = taskCard.parentElement;

  function isMobileUI(){
    return window.matchMedia("(max-width: 900px) and (hover: none)").matches;
  }

  function openTask(){
    if (!isMobileUI()) return;
    taskModalBody.innerHTML = "";
    taskModalBody.appendChild(taskCard);
    taskOverlay.hidden = false;
  }

  function closeTask(){
    if (!isMobileUI()) return;
    taskOverlay.hidden = true;
    taskCardHome.appendChild(taskCard);
  }

  if (taskFab) taskFab.addEventListener("click", e => {
    e.stopPropagation();
    openTask();
  });

  if (taskClose) taskClose.addEventListener("click", closeTask);

  if (taskOverlay){
    taskOverlay.addEventListener("click", e => {
      if (e.target === taskOverlay) closeTask();
    });
  }

  function updateTaskFab(){
    if (!taskFab) return;
    taskFab.hidden = !isMobileUI();
    if (!isMobileUI()) closeTask();
  }

  window.addEventListener("resize", updateTaskFab);

  // ============ Disks ============
  const disk = window.DiskGameDisk.create({
    canvas,
    symbols,
    targetSlot: 0
  });

  let levelIndex = 0;
  let isOpen = false;
  let solved = false;

  // ============ HINTS ============
  function normalizeHints(lvl){
    const arr = [];
    if (lvl.hint1 != null) arr.push({ text: lvl.hint1 });
    if (lvl.hint2 != null) arr.push({ text: lvl.hint2 });
    if (lvl.hint3 != null) arr.push({ text: lvl.hint3 });
    while (arr.length < 3) arr.push({ text: "" });
    return arr.map((h,i)=>({ title:`Padoms ${i+1}`, text:h.text||"" }));
  }

  function setHintsForLevel(lvl){
    if (window.Hints?.setHints){
      window.Hints.setHints(normalizeHints(lvl));
      window.Hints.close?.();
      window.Hints.show?.();
    }
  }

  // ============ LEVEL ============
  function loadLevel(i){
    levelIndex = i;
    const lvl = levels[i];

    setHintsForLevel(lvl);
    scene.style.backgroundImage = `url("assets/${lvl.background}")`;

    cardTitle.textContent = lvl.title || "";
    cardBody.innerHTML = lvl.cardHtml;
    targetSymbolLabel.textContent = symbols[lvl.targetSlot];

    disk.setTargetSlot(lvl.targetSlot);

    solved = false;
    resultMsg.textContent = "";
    nextBtn.hidden = true;
  }

  // ============ DISK UI ============
  function openDisk(){
    if (isOpen) return;
    isOpen = true;
    window.Hints?.close?.();
    diskShell.classList.add("disk-center");
    diskShell.classList.remove("disk-corner");
    disk.setInteractive(true);
  }

  function closeDisk(){
    if (!isOpen) return;
    isOpen = false;
    diskShell.classList.add("disk-corner");
    diskShell.classList.remove("disk-center");
    disk.setInteractive(false);
  }

  diskShell.addEventListener("click", ()=>{
    if (diskShell.classList.contains("disk-corner")) openDisk();
  });

  document.addEventListener("pointerdown", e=>{
    if (!isOpen) return;
    if (diskShell.contains(e.target)) return;
    if (taskCard.contains(e.target)) return;
    closeDisk();
  });

  // ============ CHECK ============
  let wrongPool = [...wrongMessages];

  function playSfx(src){
    const a = new Audio(src);
    a.play().catch(()=>{});
  }

  function getNextWrongMessage(){
    if (!wrongPool.length) wrongPool=[...wrongMessages];
    const i = Math.floor(Math.random()*wrongPool.length);
    const m = wrongPool.splice(i,1)[0];
    playSfx(m.sound);
    return m.text;
  }

  disk.setOnCheck(()=>{
    if (!isOpen) return;
    const lvl = levels[levelIndex];
    const code = disk.getCodeAtTarget();

    if (code === lvl.answer){
      solved = true;
      disk.renderStatus("OK", true);
      nextBtn.hidden = false;
      feedback.innerHTML = "Pareizi! Spied <strong>Tālāk</strong>.";
    } else {
      solved = false;
      disk.renderStatus("NĒ", false);
      nextBtn.hidden = true;
      resultMsg.textContent = getNextWrongMessage();
      feedback.innerHTML = "Pamēģini vēlreiz.";
    }
  });

  nextBtn.addEventListener("click", ()=>{
    if (!solved) return;
    if (levelIndex >= levels.length-1){
      showFinal();
      return;
    }
    loadLevel(levelIndex+1);
    closeDisk();
  });

  // ============ FINĀLS ============
  function showFinal(){
    closeDisk();
    window.Hints?.hide?.();
    taskFab && (taskFab.hidden=true);
    taskOverlay && (taskOverlay.hidden=true);
    taskCard.hidden = true;
    diskShell.hidden = true;
    scene.style.backgroundImage = `url("assets/finiss.jpg")`;
  }

  // ============ START ============
  window.Hints?.init?.({ mountEl: scene });
  loadLevel(0);
  updateTaskFab();
})();