import simpleKeyboard from "https://cdn.jsdelivr.net/npm/simple-keyboard@3.7.77/+esm";

const remSize = parseInt(getComputedStyle(document.documentElement).fontSize);
const gamePanel = document.getElementById("gamePanel");
const infoPanel = document.getElementById("infoPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const startButton = document.getElementById("startButton");
const romaNode = document.getElementById("roma");
const gradeOption = document.getElementById("gradeOption");
const aa = document.getElementById("aa");
const tmpCanvas = document.createElement("canvas");
const mode = document.getElementById("mode");
const gameTime = 120;
let playing;
let countdowning;
let typeTimer;
// https://dova-s.jp/bgm/play3143.html
const bgm = new Audio("mp3/bgm.mp3");
bgm.volume = 0.3;
bgm.loop = true;
let errorCount = 0;
let normalCount = 0;
let solveCount = 0;
let problems = [];
let problem;
let guide = false;
const layout104 = {
  "default": [
    "{esc} ` 1 2 3 4 5 6 7 8 9 0 -",
    "{tab} q w e r t y u i o p [ ]",
    "{lock} a s d f g h j k l ;",
    "{shift} z x c v b n m , .",
    "🌏 {altLeft} {space} {altRight}",
  ],
  "shift": [
    "{esc} ~ ! @ # $ % ^ & * ( ) _",
    "{tab} Q W E R T Y U I O P { }",
    "{lock} A S D F G H J K L :",
    "{shift} Z X C V B N M < >",
    "🌏 {altLeft} {space} {altRight}",
  ],
};
const layout109 = {
  "default": [
    "{esc} 1 2 3 4 5 6 7 8 9 0 -",
    "{tab} q w e r t y u i o p",
    "{lock} a s d f g h j k l ;",
    "{shift} z x c v b n m , .",
    "🌏 無変換 {space} 変換",
  ],
  "shift": [
    "{esc} ! \" # $ % & ' ( ) =",
    "{tab} Q W E R T Y U I O P",
    "{lock} A S D F G H J K L +",
    "{shift} Z X C V B N M < >",
    "🌏 無変換 {space} 変換",
  ],
};
const keyboardDisplay = {
  "{esc}": "Esc",
  "{tab}": "Tab",
  "{lock}": "Caps",
  "{shift}": "Shift",
  "{space}": " ",
  "{altLeft}": "Alt",
  "{altRight}": "Alt",
  "🌏": (navigator.language.startsWith("ja")) ? "🇯🇵" : "🇺🇸",
};
const keyboard = new simpleKeyboard.default({
  layout: (navigator.language.startsWith("ja")) ? layout109 : layout104,
  display: keyboardDisplay,
  onInit: () => {
    document.getElementById("keyboard").classList.add("d-none");
  },
  onKeyPress: (input) => {
    switch (input) {
      case "{esc}":
        return typeEventKey("Escape");
      case "{space}":
        return typeEventKey(" ");
      case "無変換":
      case "{altLeft}":
        return typeEventKey("NonConvert");
      case "変換":
      case "{altRight}":
        return typeEventKey("Convert");
      case "🌏":
        if (keyboard.options.layout == layout109) {
          keyboardDisplay["🌏"] = "🇺🇸";
          keyboard.setOptions({
            layout: layout104,
            display: keyboardDisplay,
          });
        } else {
          keyboardDisplay["🌏"] = "🇯🇵";
          keyboard.setOptions({
            layout: layout109,
            display: keyboardDisplay,
          });
        }
        break;
      case "{shift}":
      case "{lock}": {
        const shiftToggle = (keyboard.options.layoutName == "default")
          ? "shift"
          : "default";
        keyboard.setOptions({ layoutName: shiftToggle });
        break;
      }
      default:
        return typeEventKey(input);
    }
  },
});
let audioContext;
const audioBufferCache = {};
let englishVoices = [];
loadVoices();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("bgm") != 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleBGM() {
  if (localStorage.getItem("bgm") == 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
    localStorage.setItem("bgm", 0);
    bgm.pause();
  } else {
    document.getElementById("bgmOn").classList.remove("d-none");
    document.getElementById("bgmOff").classList.add("d-none");
    localStorage.setItem("bgm", 1);
    bgm.play();
  }
}

function toggleKeyboard() {
  const virtualKeyboardOn = document.getElementById("virtualKeyboardOn");
  const virtualKeyboardOff = document.getElementById("virtualKeyboardOff");
  if (virtualKeyboardOn.classList.contains("d-none")) {
    virtualKeyboardOn.classList.remove("d-none");
    virtualKeyboardOff.classList.add("d-none");
    document.getElementById("keyboard").classList.remove("d-none");
    resizeFontSize(aa);
  } else {
    virtualKeyboardOn.classList.add("d-none");
    virtualKeyboardOff.classList.remove("d-none");
    document.getElementById("keyboard").classList.add("d-none");
    document.getElementById("guideSwitch").checked = false;
    guide = false;
    resizeFontSize(aa);
  }
}

function toggleGuide(event) {
  if (event.target.checked) {
    guide = true;
    showGuide(romaNode.children[1].textContent);
  } else {
    guide = false;
    removeGuide(romaNode.children[1].textContent);
  }
}

function createAudioContext() {
  if (globalThis.AudioContext) {
    return new globalThis.AudioContext();
  } else {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
}

function unlockAudio() {
  const uttr = new SpeechSynthesisUtterance("");
  uttr.lang = "en-US";
  speechSynthesis.speak(uttr);

  if (audioContext) {
    audioContext.resume();
  } else {
    audioContext = createAudioContext();
    loadAudio("end", "mp3/end.mp3");
    loadAudio("keyboard", "mp3/keyboard.mp3");
    loadAudio("correct", "mp3/correct.mp3");
    loadAudio("incorrect", "mp3/cat.mp3");
  }
  document.removeEventListener("click", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
}

async function loadAudio(name, url) {
  if (!audioContext) return;
  if (audioBufferCache[name]) return audioBufferCache[name];
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Loading audio ${name} error:`, error);
    throw error;
  }
}

function playAudio(name, volume) {
  if (!audioContext) return;
  const audioBuffer = audioBufferCache[name];
  if (!audioBuffer) {
    console.error(`Audio ${name} is not found in cache`);
    return;
  }
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  const gainNode = audioContext.createGain();
  if (volume) gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
  sourceNode.connect(gainNode);
  sourceNode.start();
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  const jokeVoices = [
    // "com.apple.eloquence.en-US.Flo",
    "com.apple.speech.synthesis.voice.Bahh",
    "com.apple.speech.synthesis.voice.Albert",
    // "com.apple.speech.synthesis.voice.Fred",
    "com.apple.speech.synthesis.voice.Hysterical",
    "com.apple.speech.synthesis.voice.Organ",
    "com.apple.speech.synthesis.voice.Cellos",
    "com.apple.speech.synthesis.voice.Zarvox",
    // "com.apple.eloquence.en-US.Rocko",
    // "com.apple.eloquence.en-US.Shelley",
    // "com.apple.speech.synthesis.voice.Princess",
    // "com.apple.eloquence.en-US.Grandma",
    // "com.apple.eloquence.en-US.Eddy",
    "com.apple.speech.synthesis.voice.Bells",
    // "com.apple.eloquence.en-US.Grandpa",
    "com.apple.speech.synthesis.voice.Trinoids",
    // "com.apple.speech.synthesis.voice.Kathy",
    // "com.apple.eloquence.en-US.Reed",
    "com.apple.speech.synthesis.voice.Boing",
    "com.apple.speech.synthesis.voice.Whisper",
    "com.apple.speech.synthesis.voice.Deranged",
    "com.apple.speech.synthesis.voice.GoodNews",
    "com.apple.speech.synthesis.voice.BadNews",
    "com.apple.speech.synthesis.voice.Bubbles",
    // "com.apple.voice.compact.en-US.Samantha",
    // "com.apple.eloquence.en-US.Sandy",
    // "com.apple.speech.synthesis.voice.Junior",
    // "com.apple.speech.synthesis.voice.Ralph",
  ];
  allVoicesObtained.then((voices) => {
    englishVoices = voices
      .filter((voice) => voice.lang == "en-US")
      .filter((voice) => !jokeVoices.includes(voice.voiceURI));
  });
}

function loopVoice(text, n) {
  speechSynthesis.cancel();
  const msg = new globalThis.SpeechSynthesisUtterance(text);
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = "en-US";
  for (let i = 0; i < n; i++) {
    speechSynthesis.speak(msg);
  }
}

function loadProblems() {
  const grade = gradeOption.selectedIndex;
  fetch("data/" + grade + ".tsv")
    .then((response) => response.text())
    .then((tsv) => {
      problems = tsv.trim().split("\n").map((line) => {
        const [en, jaStr] = line.split("\t");
        const ja = jaStr.split("|").slice(0, 3).join("\n");
        return { en: en, ja: ja };
      });
    }).catch((err) => {
      console.error(err);
    });
}

function underlineSpace(node, key) {
  if (key == " ") {
    node.style.textDecoration = "underline";
  } else {
    node.style.removeProperty("text-decoration");
  }
}

function nextProblem() {
  playAudio("correct", 0.3);
  solveCount += 1;
  typable();
}

function removeGuide(key) {
  if (key == " ") key = "{space}";
  const button = keyboard.getButtonElement(key);
  if (button) {
    button.classList.remove("guide");
    keyboard.setOptions({ layoutName: "default" });
  } else {
    const shift = keyboard.getButtonElement("{shift}");
    if (shift) shift.classList.remove("guide");
  }
}

function showGuide(key) {
  if (key == " ") key = "{space}";
  const button = keyboard.getButtonElement(key);
  if (button) {
    button.classList.add("guide");
  } else {
    const shift = keyboard.getButtonElement("{shift}");
    if (shift) shift.classList.add("guide");
  }
}

function upKeyEvent(event) {
  switch (event.key) {
    case "Shift":
    case "CapsLock":
      if (guide) {
        keyboard.setOptions({ layoutName: "default" });
        showGuide(romaNode.children[1].textContent);
      }
  }
}

function typeEvent(event) {
  switch (event.code) {
    case "AltLeft":
      return typeEventKey("NonConvert");
    case "AltRight":
      return typeEventKey("Convert");
    case "Space":
      event.preventDefault();
      // falls through
    default:
      return typeEventKey(event.key);
  }
}

function typeEventKey(key) {
  switch (key) {
    case "NonConvert":
      changeVisibility("visible");
      downTime(5);
      return;
    case "Convert":
      loopVoice(problem.en, 1);
      return;
    case "Shift":
    case "CapsLock":
      if (guide) {
        keyboard.setOptions({ layoutName: "shift" });
        showGuide(romaNode.childen[1].textContent);
      }
      return;
    case "Escape":
      replay();
      return;
    case " ":
      if (!playing) {
        replay();
        return;
      }
  }
  if (/^[^0-9]$/.test(key)) {
    const children = romaNode.children;
    const typeIndex = children[0].textContent.length + 1;
    const wantedKey = children[1].textContent;
    if (key == wantedKey) {
      playAudio("keyboard");
      normalCount += 1;
      const nextWantedKey = problem.en[typeIndex];
      removeGuide(wantedKey);
      children[0].textContent += key;
      children[1].textContent = nextWantedKey;
      children[2].textContent = problem.en.slice(typeIndex + 1);
      underlineSpace(children[1], nextWantedKey);
      if (typeIndex == problem.en.length) {
        nextProblem();
      } else if (guide) {
        showGuide(nextWantedKey);
      }
    } else {
      playAudio("incorrect", 0.3);
      errorCount += 1;
    }
  }
}

function replay() {
  clearInterval(typeTimer);
  removeGuide(romaNode.children[1].textContent);
  initTime();
  loadProblems();
  countdown();
  countPanel.classList.remove("d-none");
  scorePanel.classList.add("d-none");
}

function resizeFontSize(node) {
  // https://stackoverflow.com/questions/118241/
  function getTextWidth(text, font) {
    // re-use canvas object for better performance
    // const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = tmpCanvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }
  function getTextRect(text, fontSize, font, lineHeight) {
    const lines = text.split("\n");
    const fontConfig = fontSize + "px " + font;
    let maxWidth = 0;
    for (let i = 0; i < lines.length; i++) {
      const width = getTextWidth(lines[i], fontConfig);
      if (maxWidth < width) {
        maxWidth = width;
      }
    }
    return [maxWidth, fontSize * lines.length * lineHeight];
  }
  function getPaddingRect(style) {
    const width = parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight);
    const height = parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom);
    return [width, height];
  }
  const style = getComputedStyle(node);
  const font = style.fontFamily;
  const fontSize = parseFloat(style.fontSize);
  const lineHeight = parseFloat(style.lineHeight) / fontSize;
  const nodeHeight = globalThis.innerHeight - 320;
  const nodeWidth = infoPanel.clientWidth;
  const nodeRect = [nodeWidth, nodeHeight];
  const textRect = getTextRect(node.textContent, fontSize, font, lineHeight);
  const paddingRect = getPaddingRect(style);

  // https://stackoverflow.com/questions/46653569/
  // Safariで正確な算出ができないので誤差ぶんだけ縮小化 (10%)
  const rowFontSize = fontSize * (nodeRect[0] - paddingRect[0]) / textRect[0] *
    0.90;
  const colFontSize = fontSize * (nodeRect[1] - paddingRect[1]) / textRect[1] *
    0.90;
  if (colFontSize < rowFontSize) {
    if (colFontSize < remSize) {
      node.style.fontSize = remSize + "px";
    } else {
      node.style.fontSize = colFontSize + "px";
    }
  } else {
    if (rowFontSize < remSize) {
      node.style.fontSize = remSize + "px";
    } else {
      node.style.fontSize = rowFontSize + "px";
    }
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function changeVisibility(visibility) {
  const children = romaNode.children;
  children[1].style.visibility = visibility;
  children[2].style.visibility = visibility;
}

function typable() {
  problem = problems[getRandomInt(0, problems.length)];
  aa.textContent = problem.ja;
  const roma = problem.en;
  if (mode.textContent == "EASY") loopVoice(roma, 1);
  const children = romaNode.children;
  children[0].textContent = "";
  children[1].textContent = roma[0];
  children[2].textContent = roma.slice(1);

  if (mode.textContent == "EASY") loopVoice(problem.en, 1);
  const visibility = (mode.textContent == "EASY") ? "visible" : "hidden";
  changeVisibility(visibility);
  resizeFontSize(aa);
  if (guide) showGuide(roma[0]);
}

function countdown() {
  const aaOuter = document.getElementById("aaOuter");
  const typePanel = document.getElementById("typePanel");
  const keyboardPanel = document.getElementById("keyboard");
  aaOuter.after(typePanel, keyboardPanel);

  if (countdowning) return;
  countdowning = true;
  if (localStorage.getItem("bgm") == 1) bgm.play();
  document.getElementById("guideSwitch").disabled = true;
  document.getElementById("virtualKeyboard").disabled = true;
  gamePanel.classList.add("d-none");
  infoPanel.classList.add("d-none");
  countPanel.classList.remove("d-none");
  counter.textContent = 3;
  const timer = setInterval(() => {
    const counter = document.getElementById("counter");
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.textContent) > 1) {
      const t = parseInt(counter.textContent) - 1;
      counter.style.backgroundColor = colors[t];
      counter.textContent = t;
    } else {
      countdowning = false;
      playing = true;
      const prevKey = romaNode.children[1].textContent;
      removeGuide(prevKey);
      normalCount = errorCount = solveCount = 0;
      clearInterval(timer);
      document.getElementById("guideSwitch").disabled = false;
      document.getElementById("virtualKeyboard").disabled = false;
      gamePanel.classList.remove("d-none");
      countPanel.classList.add("d-none");
      infoPanel.classList.remove("d-none");
      scorePanel.classList.add("d-none");
      resizeFontSize(aa);
      globalThis.scrollTo({
        top: document.getElementById("aaOuter").getBoundingClientRect().top,
        behavior: "auto",
      });
      typable();
      startTypeTimer();
    }
  }, 1000);
}

function startTypeTimer() {
  const timeNode = document.getElementById("time");
  typeTimer = setInterval(() => {
    const t = parseInt(timeNode.textContent);
    if (t > 0) {
      timeNode.textContent = t - 1;
    } else {
      clearInterval(typeTimer);
      bgm.pause();
      playAudio("end");
      scoring();
    }
  }, 1000);
}

function downTime(n) {
  const timeNode = document.getElementById("time");
  const t = parseInt(timeNode.textContent);
  const downedTime = t - n;
  if (downedTime < 0) {
    timeNode.textContent = 0;
  } else {
    timeNode.textContent = downedTime;
  }
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

gradeOption.addEventListener("change", () => {
  initTime();
  clearInterval(typeTimer);
});

function scoring() {
  playing = false;
  infoPanel.classList.remove("d-none");
  gamePanel.classList.add("d-none");
  countPanel.classList.add("d-none");
  scorePanel.classList.remove("d-none");
  const grade = gradeOption.options[gradeOption.selectedIndex].value;
  const typeSpeed = (normalCount / gameTime).toFixed(2);
  document.getElementById("totalType").textContent = normalCount + errorCount;
  document.getElementById("typeSpeed").textContent = typeSpeed;
  document.getElementById("errorType").textContent = errorCount;
  document.getElementById("twitter").href =
    "https://twitter.com/intent/tweet?text=英単語タイピングの" + grade +
    "をプレイしたよ! (速度: " + typeSpeed + "回/秒) " +
    "&url=https%3a%2f%2fmarmooo.github.com/english-words-typing/%2f&hashtags=英単語タイピング";
}

function changeMode(event) {
  normalCount = errorCount = solveCount = 0;
  document.getElementById("time").textContent = gameTime;
  if (event.target.textContent == "EASY") {
    event.target.textContent = "HARD";
  } else {
    event.target.textContent = "EASY";
  }
  const visibility = (mode.textContent == "EASY") ? "visible" : "hidden";
  changeVisibility(visibility);
}

resizeFontSize(aa);

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleBGM").onclick = toggleBGM;
document.getElementById("virtualKeyboard").onclick = toggleKeyboard;
globalThis.addEventListener("resize", () => {
  resizeFontSize(aa);
});
document.getElementById("mode").onclick = changeMode;
document.getElementById("guideSwitch").onchange = toggleGuide;
startButton.addEventListener("click", replay);
document.addEventListener("keyup", upKeyEvent);
document.addEventListener("keydown", typeEvent);
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
