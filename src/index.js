const remSize = parseInt(getComputedStyle(document.documentElement).fontSize);
const playPanel = document.getElementById("playPanel");
const infoPanel = document.getElementById("infoPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const startButton = document.getElementById("startButton");
const romaNode = document.getElementById("roma");
const gradeOption = document.getElementById("gradeOption");
const aa = document.getElementById("aa");
const gameTime = 120;
const tmpCanvas = document.createElement("canvas");
const mode = document.getElementById("mode");
let typeTimer;
// https://dova-s.jp/bgm/play3143.html
const bgm = new Audio("mp3/bgm.mp3");
bgm.volume = 0.3;
bgm.loop = true;
let typeIndex = 0;
let errorCount = 0;
let normalCount = 0;
let solveCount = 0;
let problems = [];
let englishVoices = [];
let guide = false;
let keyboardAudio, correctAudio, incorrectAudio, endAudio;
loadAudios();
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const layout104 = {
  "default": [
    "{esc} ` 1 2 3 4 5 6 7 8 9 0 -",
    "{tab} q w e r t y u i o p [ ]",
    "{lock} a s d f g h j k l ;",
    "{shift} z x c v b n m , .",
    "🌏 無変換 {space} 変換",
  ],
  "shift": [
    "{esc} ~ ! @ # $ % ^ & * ( ) _",
    "{tab} Q W E R T Y U I O P { }",
    '{lock} A S D F G H J K L :',
    "{shift} Z X C V B N M < >",
    "🌏 無変換 {space} 変換",
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
  "🌏": "🇯🇵",
};
const simpleKeyboard = new SimpleKeyboard.default({
  layout: layout109,
  display: keyboardDisplay,
  onInit: function () {
    document.getElementById("keyboard").classList.add("d-none");
  },
  onKeyPress: function (input) {
    switch (input) {
      case "{esc}":
        return typeEventKey("Esc");
      case "{space}":
        return typeEventKey(" ");
      case "無変換":
        return typeEventKey("NoConvert");
      case "変換":
        return typeEventKey("Convert");
      case "🌏":
        if (simpleKeyboard.options.layout == layout109) {
          keyboardDisplay["🌏"] = "🇺🇸";
          simpleKeyboard.setOptions({
            layout: layout104,
            display: keyboardDisplay,
          });
        } else {
          keyboardDisplay["🌏"] = "🇯🇵";
          simpleKeyboard.setOptions({
            layout: layout109,
            display: keyboardDisplay,
          });
        }
        break;
      case "{shift}":
      case "{lock}": {
        const shiftToggle = (simpleKeyboard.options.layoutName == "default")
          ? "shift"
          : "default";
        simpleKeyboard.setOptions({ layoutName: shiftToggle });
        break;
      }
      default:
        return typeEventKey(input);
    }
  },
});
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.dataset.theme = "dark";
  }
  if (localStorage.getItem("bgm") != 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
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
    aa.parentNode.style.height = calcAAOuterSize() + "px";
    resizeFontSize(aa);
  } else {
    virtualKeyboardOn.classList.add("d-none");
    virtualKeyboardOff.classList.remove("d-none");
    document.getElementById("keyboard").classList.add("d-none");
    document.getElementById("guideSwitch").checked = false;
    guide = false;
    aa.parentNode.style.height = calcAAOuterSize() + "px";
    resizeFontSize(aa);
  }
}

function toggleGuide() {
  const virtualKeyboardOn = document.getElementById("virtualKeyboardOn");
  const virtualKeyboardOff = document.getElementById("virtualKeyboardOff");
  if (this.checked) {
    virtualKeyboardOn.classList.remove("d-none");
    virtualKeyboardOff.classList.add("d-none");
    document.getElementById("keyboard").classList.remove("d-none");
    aa.parentNode.style.height = calcAAOuterSize() + "px";
    resizeFontSize(aa);
    guide = true;
  } else {
    virtualKeyboardOn.classList.add("d-none");
    virtualKeyboardOff.classList.remove("d-none");
    document.getElementById("keyboard").classList.add("d-none");
    aa.parentNode.style.height = calcAAOuterSize() + "px";
    resizeFontSize(aa);
    guide = false;
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.dataset.theme = "dark";
  }
}

function playAudio(audioBuffer, volume) {
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    audioSource.connect(gainNode);
    audioSource.start();
  } else {
    audioSource.connect(audioContext.destination);
    audioSource.start();
  }
}

function unlockAudio() {
  audioContext.resume();
}

function loadAudio(url) {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
      return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
          resolve(audioBuffer);
        }, (err) => {
          reject(err);
        });
      });
    });
}

function loadAudios() {
  promises = [
    loadAudio("mp3/keyboard.mp3"),
    loadAudio("mp3/correct.mp3"),
    loadAudio("mp3/cat.mp3"),
    loadAudio("mp3/end.mp3"),
  ];
  Promise.all(promises).then((audioBuffers) => {
    keyboardAudio = audioBuffers[0];
    correctAudio = audioBuffers[1];
    incorrectAudio = audioBuffers[2];
    endAudio = audioBuffers[3];
  });
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise(function (resolve) {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      speechSynthesis.addEventListener("voiceschanged", function () {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
    }
  });
  allVoicesObtained.then((voices) => {
    englishVoices = voices.filter((voice) => voice.lang == "en-US");
  });
}
loadVoices();

function loopVoice(text, n) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = "en-US";
  for (let i = 0; i < n; i++) {
    speechSynthesis.speak(msg);
  }
}

function loadProblems() {
  const grade = gradeOption.selectedIndex;
  fetch("data/" + grade + ".tsv").then(function (response) {
    return response.text();
  }).then(function (tsv) {
    problems = tsv.split("\n").slice(0, -1).map((line) => {
      const [en, jaStr] = line.split("\t");
      const ja = jaStr.split("|").slice(0, 3).join("\n");
      return { en: en, ja: ja };
    });
  }).catch(function (err) {
    console.error(err);
  });
}

function typeNormal(currNode) {
  currNode.classList.remove("d-none");
  playAudio(keyboardAudio);
  currNode.style.color = "silver";
  typeIndex += 1;
  normalCount += 1;
}

function underlineSpace(currNode) {
  if (currNode.textContent == " ") {
    currNode.style.removeProperty("text-decoration");
  }
  const nextNode = currNode.nextElementSibling;
  if (nextNode && nextNode.textContent == " ") {
    nextNode.style.textDecoration = "underline";
  }
}

function nextProblem() {
  playAudio(correctAudio);
  typeIndex = 0;
  solveCount += 1;
  typable();
}

function removeGuide(currNode) {
  const prevNode = currNode.previousSiblingElement;
  if (prevNode) {
    let key = prevNode.textContent;
    if (key == " ") key = "{space}";
    const button = simpleKeyboard.getButtonElement(key);
    button.classList.remove("bg-info");
  }
  let key = currNode.textContent;
  if (key == " ") key = "{space}";
  const button = simpleKeyboard.getButtonElement(key);
  if (button) {
    button.classList.remove("bg-info");
    simpleKeyboard.setOptions({ layoutName: "default" });
  } else {
    const shift = simpleKeyboard.getButtonElement("{shift}");
    shift.classList.remove("bg-info");
  }
}

function showGuide(currNode) {
  if (guide) {
    let key = currNode.textContent;
    if (key == " ") key = "{space}";
    const button = simpleKeyboard.getButtonElement(key);
    if (button) {
      button.classList.add("bg-info");
    } else {
      const shift = simpleKeyboard.getButtonElement("{shift}");
      shift.classList.add("bg-info");
    }
  }
}

function upKeyEvent(event) {
  switch (event.key) {
    case "Shift":
    case "CapsLock":
      if (guide) {
        simpleKeyboard.setOptions({ layoutName: "default" });
        showGuide(romaNode.childNodes[typeIndex]);
      }
  }
}

// TODO: Chrome の実装の問題で、
// Linux / Android では日本語キーボードを使っていても
// 英語キーボードの配列で event.key が出力されてしまう
// よく使う記号だけ入れ替えて無理やり対処する
function patchEvent(event) {
  if (event.key == "@" && event.code == "Digit2") {
    return '"';
  } else if (event.key == "&" && event.code == "Digit7") {
    return "'";
  } else {
    return event.key;
  }
}

function typeEvent(event) {
  const key = patchEvent(event);
  if (key == " " || key == "Spacebar") {
    event.preventDefault();  // ScrollLock
  }
  typeEventKey(key);
}

function typeEventKey(key) {
  const currNode = romaNode.childNodes[typeIndex];
  if (key.match(/^[^0-9]$/)) {
    if (key == currNode.textContent) {
      typeNormal(currNode);
      removeGuide(currNode);
      underlineSpace(currNode);
    } else {
      // const state = checkTypeStyle(currNode, currNode.textContent, event.key, romaNode);
      // if (!state) {
      //   playAudio(incorrectAudio, 0.3);
      //   errorCount += 1;
      // }
      playAudio(incorrectAudio, 0.3);
      errorCount += 1;
    }
    if (typeIndex == romaNode.childNodes.length) {
      nextProblem();
    } else {
      showGuide(romaNode.childNodes[typeIndex]);
    }
  } else {
    switch (key) {
      case "NonConvert":
        [...romaNode.children].forEach((span) => {
          span.classList.remove("d-none");
        });
        downTime(5);
        break;
      case "Convert": {
        const text = romaNode.textContent;
        loopVoice(text, 1);
        break;
      }
      case "Shift":
      case "CapsLock":
        if (guide) {
          simpleKeyboard.setOptions({ layoutName: "shift" });
          showGuide(romaNode.childNodes[typeIndex]);
        }
        break;
      case "Escape":
      case "Esc":
        replay();
        break;
    }
  }
}

function replay() {
  clearInterval(typeTimer);
  removeGuide(romaNode.childNodes[typeIndex]);
  document.removeEventListener("keydown", typeEvent);
  initTime();
  loadProblems();
  countdown();
  typeIndex = normalCount = errorCount = solveCount = 0;
  countPanel.classList.remove("d-none");
  scorePanel.classList.add("d-none");
}

function calcAAOuterSize() {
  let height = document.documentElement.clientHeight;
  height -= document.getElementById("header").offsetHeight;
  height -= document.getElementById("timePanel").offsetHeight;
  height -= document.getElementById("typePanel").offsetHeight;
  height -= document.getElementById("keyboard").offsetHeight;
  return height;
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
  const nodeHeight = calcAAOuterSize();
  const nodeWidth = infoPanel.clientWidth;
  const nodeRect = [nodeWidth, nodeHeight];
  const textRect = getTextRect(node.innerText, fontSize, font, lineHeight);
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

function typable() {
  const problem = problems[getRandomInt(0, problems.length)];
  aa.textContent = problem.ja;
  const roma = problem.en;
  if (mode.textContent == "EASY") {
    loopVoice(roma, 1);
  }
  while (romaNode.firstChild) {
    romaNode.removeChild(romaNode.firstChild);
  }
  for (let i = 0; i < roma.length; i++) {
    const span = document.createElement("span");
    if (mode.textContent != "EASY") {
      span.classList.add("d-none");
    }
    span.textContent = roma[i];
    romaNode.appendChild(span);
  }
  resizeFontSize(aa);
  showGuide(romaNode.childNodes[0]);
}

function countdown() {
  typeIndex = normalCount = errorCount = solveCount = 0;
  document.getElementById("guideSwitch").disabled = true;
  document.getElementById("virtualKeyboard").disabled = true;
  infoPanel.classList.add("d-none");
  playPanel.classList.add("d-none");
  countPanel.classList.remove("d-none");
  scorePanel.classList.add("d-none");
  counter.innerText = 3;
  const timer = setInterval(function () {
    const counter = document.getElementById("counter");
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.innerText) > 1) {
      const t = parseInt(counter.innerText) - 1;
      counter.style.backgroundColor = colors[t];
      counter.innerText = t;
    } else {
      clearInterval(timer);
      document.getElementById("guideSwitch").disabled = false;
      document.getElementById("virtualKeyboard").disabled = false;
      infoPanel.classList.remove("d-none");
      playPanel.classList.remove("d-none");
      countPanel.classList.add("d-none");
      scorePanel.classList.add("d-none");
      aa.parentNode.style.height = calcAAOuterSize() + "px";
      resizeFontSize(aa);
      window.scrollTo({
        top: document.getElementById("timePanel").getBoundingClientRect().top +
          document.documentElement.scrollTop,
        behavior: "auto",
      });
      typable();
      startTypeTimer();
      if (localStorage.getItem("bgm") == 1) {
        bgm.play();
      }
      document.addEventListener("keydown", typeEvent);
    }
  }, 1000);
}

function startKeyEvent(event) {
  if (event.key == " " || event.key == "Spacebar") {
    event.preventDefault();
    document.removeEventListener("keydown", startKeyEvent);
    replay();
  }
}

function startTypeTimer() {
  const timeNode = document.getElementById("time");
  typeTimer = setInterval(function () {
    const arr = timeNode.innerText.split("秒 /");
    const t = parseInt(arr[0]);
    if (t > 0) {
      timeNode.innerText = (t - 1) + "秒 /" + arr[1];
    } else {
      clearInterval(typeTimer);
      bgm.pause();
      playAudio(endAudio);
      scoring();
    }
  }, 1000);
}

function downTime(n) {
  const timeNode = document.getElementById("time");
  const arr = timeNode.innerText.split("秒 /");
  const t = parseInt(arr[0]);
  const downedTime = t - n;
  if (downedTime < 0) {
    timeNode.innerText = "0秒 /" + arr[1];
  } else {
    timeNode.innerText = downedTime + "秒 /" + arr[1];
  }
}

function initTime() {
  document.getElementById("time").innerText = gameTime + "秒 / " + gameTime +
    "秒";
}

gradeOption.addEventListener("change", function () {
  initTime();
  clearInterval(typeTimer);
});

function scoring() {
  infoPanel.classList.remove("d-none");
  playPanel.classList.add("d-none");
  countPanel.classList.add("d-none");
  scorePanel.classList.remove("d-none");
  document.removeEventListener("keydown", typeEvent);
  const grade = gradeOption.options[gradeOption.selectedIndex].value;
  const typeSpeed = (normalCount / gameTime).toFixed(2);
  document.getElementById("totalType").innerText = normalCount + errorCount;
  document.getElementById("typeSpeed").innerText = typeSpeed;
  document.getElementById("errorType").innerText = errorCount;
  document.getElementById("twitter").href =
    "https://twitter.com/intent/tweet?text=英単語タイピングの" + grade +
    "をプレイしたよ! (速度: " + typeSpeed + "回/秒) " +
    "&url=https%3a%2f%2fmarmooo.github.com/hageda%2f&hashtags=英単語タイピング";
  document.addEventListener("keydown", startKeyEvent);
}

function changeMode() {
  if (this.textContent == "EASY") {
    this.textContent = "HARD";
  } else {
    this.textContent = "EASY";
  }
}

aa.parentNode.style.height = calcAAOuterSize(true) + "px";
resizeFontSize(aa);

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleBGM").onclick = toggleBGM;
document.getElementById("virtualKeyboard").onclick = toggleKeyboard;
window.addEventListener("resize", function () {
  aa.parentNode.style.height = calcAAOuterSize() + "px";
  resizeFontSize(aa);
});
document.getElementById("mode").onclick = changeMode;
document.getElementById("guideSwitch").onchange = toggleGuide;
startButton.addEventListener("click", replay);
document.addEventListener("keyup", upKeyEvent);
document.addEventListener("keydown", startKeyEvent);
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
