// assets/game.js
(() => {
  const symbols = ["★","☾","▲","◆","✚","⬣","⬟","●","▣"];

  // ===== Welcome / start gate =====
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
      hint1: "Padoms #1 — paskaties uz GADU secību.",
      hint2: "Padoms #2 — cipari ir tieši 3 un tie ir vienā līnijā.",
      hint3: "Padoms #3 — uzgriez līdz MĒRĶA simbolam."
    },
    {
      id: 2,
      background: "bg1.jpg",
      targetSlot: 0,
      answer: "149",
      cardHtml: `<p>Steady, Dress up, Go!</p>`
    },
    {
      id: 3,
      background: "bg2.jpg",
      targetSlot: 3,
      answer: "159",
      cardHtml: `<p></p>`
    },
    {
      id: 4,
      background: "bg3.jpg",
      targetSlot: 2,
      answer: "317",
      cardHtml: `<p></p>`
    },
    {
      id: 5,
      background: "bg4.jpg",
      targetSlot: 6,
      answer: "368",
      cardHtml: `<p></p>`
    }
  ];

  const wrongMessages = [
    { text: "Tā jau nu gan nebūs", sound: "assets/sound/wrong_01.m4a" },
    { text: "Sīkais, nu tu dod...", sound: "assets/sound/wrong_09.m4a" },
    { text: "Wtf...", sound: "assets/sound/wrong_07.m4a" },
    { text: "Saņemies, tu to vari!", sound: "assets/sound/wrong_03.m4a" }
  ];

  // ===== DOM =====
  const scene = document.getElementById("scene");
  const diskShell = document.getElementById("diskShell");
  const canvas = document.getElementById("diskCanvas");

  const cardTitle = document.getElementById("cardTitle");
  const cardBody = document.getElementById("cardBody");
  const feedback = document.getElementById("feedback");
  const targetSymbolLabel = document.getElementById("targetSymbolLabel");
  const taskCard = document.getElementById("taskCard");
  const nextBtn = document.getElementById("nextBtn");
  const resultMsg = document.getElementById("resultMsg");

  const welcome = document.getElementById("welcome");
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeInput = document.getElementById("welcomeInput");
  const welcomeHint = document.getElementById("welcomeHint");

  function normalize(s){ return (s || "").trim().toLowerCase(); }

  function showWelcomeHint(txt){
    welcomeHint.textContent = txt;
    welcomeHint.classList.add("show");
    setTimeout(() => welcomeHint.classList.remove("show"), 900);
  }

  function setupWelcome(){
    welcomeTitle.textContent = intro.greeting;

    welcomeInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (normalize(welcomeInput.value) === normalize(intro.answer)) {
        welcome.style.display = "none";
        startGame();
      } else {
        showWelcomeHint(intro.wrongHint);
        welcomeInput.value = "";
      }
    });

    setTimeout(() => welcomeInput.focus(), 0);
  }

  // ===== Disk =====
  const disk = window.DiskGameDisk.create({
    canvas,
    targetSlot: 0,
    symbols
  });

  let levelIndex = 0;
  let isOpen = false;
  let solved = false;

  let wrongPool = [...wrongMessages];

  function playWrong(){
    if (!wrongPool.length) wrongPool = [...wrongMessages];
    const i = Math.floor(Math.random() * wrongPool.length);
    const msg = wrongPool.splice(i,1)[0];
    new Audio(msg.sound).play().catch(()=>{});
    return msg.text;
  }

  function loadLevel(i){
    levelIndex = i;
    const lvl = levels[i];

    scene.style.backgroundImage = `url("assets/${lvl.background}")`;
    cardTitle.textContent = "";
    cardBody.innerHTML = lvl.cardHtml;
    targetSymbolLabel.textContent = symbols[lvl.targetSlot];
    disk.setTargetSlot(lvl.targetSlot);

    solved = false;
    resultMsg.textContent = "";
    nextBtn.hidden = true;

    if (window.Hints?.setHints) {
      window.Hints.setHints([
        { title:"Padoms 1", text:lvl.hint1||"" },
        { title:"Padoms 2", text:lvl.hint2||"" },
        { title:"Padoms 3", text:lvl.hint3||"" }
      ]);
      window.Hints.close?.();
    }
  }

  function startGame(){
    loadLevel(0);
    closeDisk();
  }

  function openDisk(){
    if (isOpen) return;
    isOpen = true;
    diskShell.classList.add("disk-center");
    diskShell.classList.remove("disk-corner");
    disk.setInteractive(true);
  }

  function closeDisk(){
    isOpen = false;
    diskShell.classList.add("disk-corner");
    diskShell.classList.remove("disk-center");
    disk.setInteractive(false);
  }

  diskShell.addEventListener("click", () => {
    if (diskShell.classList.contains("disk-corner")) openDisk();
  });

  disk.setOnCheck(() => {
    if (!isOpen) return;
    const lvl = levels[levelIndex];
    if (disk.getCodeAtTarget() === lvl.answer) {
      solved = true;
      disk.renderStatus("OK", true);
      nextBtn.hidden = false;
    } else {
      disk.renderStatus("NĒ", false);
      resultMsg.textContent = playWrong();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (!solved) return;
    if (levelIndex === levels.length - 1) {
      taskCard.hidden = true;
      diskShell.hidden = true;
      scene.style.backgroundImage = `url("assets/finiss.jpg")`;
      return;
    }
    loadLevel(levelIndex + 1);
    closeDisk();
  });

  if (window.Hints?.init) window.Hints.init({ mountEl: scene });
  setupWelcome();
})();