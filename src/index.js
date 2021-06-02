const playPanel = document.getElementById('playPanel');
const countPanel = document.getElementById('countPanel');
const scorePanel = document.getElementById('scorePanel');
const startButton = document.getElementById('startButton');
const romaNode = document.getElementById('roma');
const gradeOption = document.getElementById('gradeOption');
const infoPanel = document.getElementById('infoPanel');
const aa = document.getElementById('aa');
const gameTime = 180;
const tmpCanvas = document.createElement('canvas');
const mode = document.getElementById('mode');
let typeTimer;
// https://dova-s.jp/bgm/play3143.html
const bgm = new Audio('bgm.mp3');
bgm.volume = 0.3;
bgm.loop = true;
let typeIndex = 0;
let errorCount = 0;
let normalCount = 0;
let solveCount = 0;
let problems = [];
let englishVoices = [];
let keyboardAudio, correctAudio, incorrectAudio, endAudio;
loadAudios();
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();


function clearConfig() {
  localStorage.clear();
}

function loadConfig() {
  if (localStorage.getItem('darkMode') == 1) {
    document.documentElement.dataset.theme = 'dark';
  }
  if (localStorage.getItem('bgm') != 1) {
    document.getElementById('bgmOn').classList.add('d-none');
    document.getElementById('bgmOff').classList.remove('d-none');
  }
}
loadConfig();

function toggleBGM() {
  if (localStorage.getItem('bgm') == 1) {
    document.getElementById('bgmOn').classList.add('d-none');
    document.getElementById('bgmOff').classList.remove('d-none');
    localStorage.setItem('bgm', 0);
    bgm.pause();
  } else {
    document.getElementById('bgmOn').classList.remove('d-none');
    document.getElementById('bgmOff').classList.add('d-none');
    localStorage.setItem('bgm', 1);
    bgm.play();
  }
}

function toggleDarkMode() {
  if (localStorage.getItem('darkMode') == 1) {
    localStorage.setItem('darkMode', 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem('darkMode', 1);
    document.documentElement.dataset.theme = 'dark';
  }
}

function toggleOverview() {
  var overview = document.getElementById('overview');
  if (overview.dataset && overview.dataset.collapse == 'true') {
    overview.dataset.collapse = 'false';
    overview.classList.add('d-none');
    overview.classList.add('d-sm-block');
  } else {
    overview.dataset.collapse = 'true';
    overview.classList.remove('d-none');
    overview.classList.remove('d-sm-block');
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
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
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
    loadAudio('keyboard.mp3'),
    loadAudio('correct.mp3'),
    loadAudio('cat.mp3'),
    loadAudio('end.mp3'),
  ];
  Promise.all(promises).then(audioBuffers => {
    keyboardAudio = audioBuffers[0];
    correctAudio = audioBuffers[1];
    incorrectAudio = audioBuffers[2];
    endAudio = audioBuffers[3];
  });
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise(function(resolve, reject) {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      speechSynthesis.addEventListener("voiceschanged", function() {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
    }
  });
  allVoicesObtained.then(voices => {
    englishVoices = voices.filter(voice => voice.lang == 'en-US' );
  });
}
loadVoices();

function loopVoice(text, n) {
  speechSynthesis.cancel();
  var msg = new SpeechSynthesisUtterance(text);
  msg.voice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
  msg.lang = 'en-US';
  for (var i=0; i<n; i++) {
    speechSynthesis.speak(msg);
  }
}

function loadProblems() {
  var grade = gradeOption.selectedIndex + 3;
  if (grade > 0) {
    fetch('data/' + grade + '.tsv').then(function(response) {
      return response.text();
    }).then(function(tsv) {
      problems = tsv.split('\n').slice(0, -1).map(line => {
        const [en, jaStr] = line.split('\t');
        const ja = jaStr.split('|').slice(0, 3).join('\n');
        return { en:en, ja:ja };
      });
    }).catch(function(err) {
      console.error(err);
    });
  }
}

function fixTypeStyle(currNode, word) {
  currNode.textContent = word;
  typeNormal(currNode);
}

function appendWord(currNode, word) {
  const span = document.createElement('span');
  span.textContent = word;
  currNode.parentNode.insertBefore(span, currNode.NextSibling);
}

// http://typingx0.net/key_l.html
function checkTypeStyle(currNode, word, key, romaNode) {
  const nodes = romaNode.childNodes;
  const nextNode = nodes[typeIndex+1];
  let nextWord;
  if (nextNode) {  // 最後の文字を tu --> tsu に変換しようとした時 (nextNode = null)
    nextWord = nextNode.textContent;
  }
  let prevWord;
  if (typeIndex != 0) {
    prevWord = nodes[typeIndex-1].textContent;
  }
  let secondWord;
  if (nodes[typeIndex+2]) {
    secondWord = nodes[typeIndex+2].textContent;
  }
  if (word == 'c' && key == 'k' &&  // ca, cu, co --< ka, ku, ko
    (nextWord == 'a' || nextWord == 'u' || nextWord == 'o')) {
    fixTypeStyle(currNode, key);
  } else if (word == 'k' && key == 'c' &&  // ka, ku, ko --< ca, cu, co
    (nextWord == 'a' || nextWord == 'u' || nextWord == 'o')) {
    fixTypeStyle(currNode, key);
  } else if (word == 'i' && key == 'h' && prevWord == 's') {  // si --> shi
    fixTypeStyle(currNode, key);
    appendWord(currNode, 'i');
  } else if (word == 'h' && key == 'i' && prevWord == 's' && nextWord == 'i') {  // shi --> si
    fixTypeStyle(currNode, key);
    if (nextWord) { nextNode.remove(); }
  } else if (word == 's' && key == 'c' && (nextWord == 'i' || nextWord == 'e')) {  // si, se --> ci, ce
    fixTypeStyle(currNode, key);
  } else if (word == 'c' && key == 's' && (nextWord == 'i' || nextWord == 'e')) {  // ci, ce --> si, se
    fixTypeStyle(currNode, key);
  } else if (word == 'z' && key == 'j' && nextWord == 'i') {  // zi --> ji
    fixTypeStyle(currNode, key);
  } else if (word == 'j' && key == 'z' && nextWord == 'i') {  // ji --> zi
    fixTypeStyle(currNode, key);
  } else if (word == 't' && key == 'c' && nextWord == 'i') {  // ti --> chi
    fixTypeStyle(currNode, key);
    appendWord(currNode, 'h');
  } else if (word == 'c' && key == 't' && nextWord == 'h' && secondWord == 'i') {  // chi --> ti
    fixTypeStyle(currNode, key);
    if (nextWord) { nextNode.remove(); }
  } else if (word == 'u' && key == 's' && prevWord == 't') {  // tu --> tsu
    fixTypeStyle(currNode, key);
    appendWord(currNode, 'u');
  } else if (word == 's' && key == 'u' && prevWord == 't' && nextWord == 'u') {  // tsu --> tu
    fixTypeStyle(currNode, key);
    if (nextWord) { nextNode.remove(); }
  } else if (word == 'h' && key == 'f' && nextWord == 'u') {  // hu --> fu
    fixTypeStyle(currNode, key);
  } else if (word == 'f' && key == 'h' && nextWord == 'u') {  // fu --> hu
    fixTypeStyle(currNode, key);
  } else if (word == 'n' && key == 'x' && nextWord == 'n') {  // nn --> xn
    fixTypeStyle(currNode, key);
  } else if (word == 'x' && key == 'n' && nextWord == 'n') {  // xn --> nn
    fixTypeStyle(currNode, key);
  } else if (word == 'x' && key == 'l' &&  // xa, xi, xu, xe, xo --> la, li, lu, le, lo
    (nextWord == 'a' || nextWord == 'i' || nextWord == 'u' || nextWord == 'e' || nextWord == 'o')) {
    fixTypeStyle(currNode, key);
  } else if (word == 'l' && key == 'x' &&  // la, li, lu, le, lo --> xa, xi, xu, xe, xo
    (nextWord == 'a' || nextWord == 'i' || nextWord == 'u' || nextWord == 'e' || nextWord == 'o')) {
    fixTypeStyle(currNode, key);
  } else if (word == 'l' && key == 'x' &&  nextWord == 'y' && // lya, lyu, lyo --> xya, xyu, xyo
    (nextWord == 'a' || nextWord == 'u' || nextWord == 'o')) {  // TODO: lyi, lye
    fixTypeStyle(currNode, key);
  } else if ((word == 'i' || word == 'e') && key == 'h' && prevWord == 'w') { // wi, we --> whi, whe
    fixTypeStyle(currNode, key);
    appendWord(currNode, word);
  } else if (word == 'h' && prevWord == 'w' &&
    (key + nextWord == 'ii' || key + nextWord == 'ee')) { // whi, whe --> wi, we
    fixTypeStyle(currNode, key);
    if (nextWord) { nextNode.remove(); }
  } else if (word == 'y' && key == 'h' && prevWord == 's' &&
    (nextWord == 'a' || nextWord == 'u' || nextWord == 'e' || nextWord == 'o')) {  // sya, syu, sye, syo --> sha, shu, she, sho
    fixTypeStyle(currNode, key);
  } else if (word == 'h' && key == 'y' && prevWord == 's' &&
    (nextWord == 'a' || nextWord == 'u' || nextWord == 'e' || nextWord == 'o')) {  // sha, shu, she, sho --> sya, syu, sye, syo
    fixTypeStyle(currNode, key);
  } else if (word == 'z' && key == 'j' && nextWord == 'y' &&
    (secondWord == 'a' || secondWord == 'u' || secondWord == 'o')) {  // zya, zyu, zyo --> ja, ju, jo
    fixTypeStyle(currNode, key);
    if (nextWord) { nextNode.remove(); }
  } else if (word == 'j' && key == 'z' &&
    (nextWord == 'a' || netxWord == 'u' || nextword == 'o')) {  // ja, ju, jo --> zya, zyu, zyo
    fixTypeStyle(currNode, key);
    appendWord(currNode, 'y');
  } else if (word == 'z' && key == 'j' && nextWord == 'y') {  // zya, zyi, zyu, zye, zyo --> jya, jyi, jyu, jye, jyo
    fixTypeStyle(currNode, key);
  } else if (prevWord == 'j' && word == 'y' &&
    (key + nextWord == 'aa' || key + nextWord == 'uu' || key + nextWord == 'oo')) {  // jya, jyu, jyo --> ja, ju, jo
    fixTypeStyle(currNode, key);
    if (nextWord) { nextNode.remove(); }
  } else if (word == 'j' && key == 'y'
    && (nextWord == 'a' || nextWord == 'u' || nextWord == 'o')) {  // ja, ju, jo --> jya, jyu, jyo
    fixTypeStyle(currNode, key);
    fixTypeStyle(currNode, nextWord);
  } else if (word == 'j' && key == 'z' && nextWord == 'y') {  // jya, jyi, jyu, jye, jyo --> zya, zyi, zyu, zye, zyo
    fixTypeStyle(currNode, key);
  } else if (word == 't' && key == 'c' && nextWord == 'y') {  // tya, tyi, tyu, tye, tyo --> cya, cyi, cyu, cye, cyo
    fixTypeStyle(currNode, key);
  } else if (word == 'c' && key == 't' && nextWord == 'y') {  // cya, cyi, cyu, cye, cyo --> tya, tyi, tyu, tye, tyo
    fixTypeStyle(currNode, key);
  } else if (word == 't' && key == 'c' && nextWord == 'y' &&  // tya, tyu, tye, tyo --> cha, chu, che, cho
    (secondWord == 'a' || secondWord == 'u' || secondWord == 'e' || secondWord == 'o')) {
    fixTypeStyle(currNode, key);
    nextNode.textContent = 'h';
  } else if (word == 'c' && key == 't' && nextWord == 'h' &&  // cha, chu, che, cho --> tya, tyu, tye, tyo
    (secondWord == 'a' || secondWord == 'u' || secondWord == 'e' || secondWord == 'o')) {
    fixTypeStyle(currNode, key);
    nextNode.textContent = 'y';
  } else if (prevWord == 'c' && word == 'y' && key == 'h' &&  // cya, cyu, cye, cyo --> cha, chu, che, cho
    (nextWord == 'a' || nextWord == 'u' || nextWord == 'e' || nextWord == 'o')) {
    fixTypeStyle(currNode, key);
    nextNode.textContent = nextWord;
  } else if (prevWord == 'c' && word == 'h' && key == 'y'  // cha, chu, che, cho --> cya, cyu, cye, cyo
    (nextWord == 'a' || nextWord == 'u' || nextWord == 'e' || nextWord == 'o')) {
    fixTypeStyle(currNode, key);
    nextNode.textContent = nextWord;
  } else {
    return false;
  }
  return true;
}

function typeNormal(currNode) {
  currNode.classList.remove('d-none');
  playAudio(keyboardAudio);
  currNode.style.color = 'silver';
  typeIndex += 1;
  normalCount += 1;
}

function nextProblem() {
  playAudio(correctAudio);
  typeIndex = 0;
  solveCount += 1;
  typable();
}

function typeEvent(event) {
  const currNode = romaNode.childNodes[typeIndex];
  if (event.key.match(/^[^0-9]$/)) {
    if (event.key == currNode.textContent) {
      typeNormal(currNode);
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
    }
  } else {
    switch (event.key) {
      case '1':
        mode.textContent = 'EASY';
        replay();
        break;
      case '2':
        mode.textContent = 'HARD';
        replay();
        break;
      case '4':
        [...romaNode.children].forEach(span => {
          span.classList.remove('d-none');
        });
        downTime(5);
        break;
      case '5':
        const text = romaNode.textContent;
        loopVoice(text, 1);
        downTime(5);
        break;
      case 'Escape': case 'Esc':
        replay();
        break;
    }
  }
}

function replay() {
  clearInterval(typeTimer);
  document.body.removeEventListener('keydown', typeEvent);
  initTime();
  loadProblems();
  countdown();
  typeIndex = normalCount = errorCount = solveCount = 0;
  countPanel.hidden = false;
  scorePanel.hidden = true;
}

function calcAAOuterSize() {
  const typePanelHeight = document.getElementById('typePanel').offsetHeight;
  return document.documentElement.clientHeight - aa.parentNode.offsetTop - typePanelHeight;
}

function resizeFontSize(node) {
  // https://stackoverflow.com/questions/118241/
  function getTextWidth(text, font) {
      // re-use canvas object for better performance
      // var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
      var context = tmpCanvas.getContext("2d");
      context.font = font;
      var metrics = context.measureText(text);
      return metrics.width;
  }
  function getTextRect(text, fontSize, font, lineHeight) {
    var lines = text.split('\n');
    var maxWidth = 0;
    var fontConfig = fontSize + 'px ' + font;
    for (var i=0; i<lines.length; i++) {
      var width = getTextWidth(lines[i], fontConfig);
      if (maxWidth < width) {
        maxWidth = width;
      }
    }
    return [maxWidth, fontSize * lines.length * lineHeight];
  }
  function getPaddingRect(style) {
    var width = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    var height = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    return [width, height];
  }
  var style = getComputedStyle(node);
  var font = style.fontFamily;
  var fontSize = parseFloat(style.fontSize);
  var lineHeight = parseFloat(style.lineHeight) / fontSize;
  var nodeHeight = calcAAOuterSize();
  var nodeWidth = infoPanel.clientWidth;
  var nodeRect = [nodeWidth, nodeHeight];
  var textRect = getTextRect(node.innerText, fontSize, font, lineHeight);
  var paddingRect = getPaddingRect(style);

  // https://stackoverflow.com/questions/46653569/
  // Safariで正確な算出ができないので誤差ぶんだけ縮小化 (10%)
  var rowFontSize = fontSize * (nodeRect[0] - paddingRect[0]) / textRect[0] * 0.90;
  var colFontSize = fontSize * (nodeRect[1] - paddingRect[1]) / textRect[1] * 0.90;
  if (colFontSize < rowFontSize) {
    node.style.fontSize = colFontSize + 'px';
  } else {
    node.style.fontSize = rowFontSize + 'px';
  }
}

function getRandomInt(min, max) {
  var min = Math.ceil(min);
  var max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function typable() {
  const problem = problems[getRandomInt(0, problems.length)];
  aa.textContent = problem.ja;
  const roma = problem.en;
  if (mode.textContent == 'EASY') {
    loopVoice(roma, 1);
  }
  while(romaNode.firstChild) {
    romaNode.removeChild(romaNode.firstChild);
  }
  for (var i=0; i<roma.length; i++) {
    var span = document.createElement('span');
    if (mode.textContent != 'EASY') {
      span.classList.add('d-none');
    }
    span.textContent = roma[i];
    romaNode.appendChild(span);
  }
  resizeFontSize(aa);
}

function countdown() {
  typeIndex = normalCount = errorCount = solveCount = 0;
  playPanel.classList.add('d-none');
  countPanel.hidden = false;
  scorePanel.hidden = true;
  counter.innerText = 3;
  var timer = setInterval(function(){
    var counter = document.getElementById('counter');
    var colors = ['skyblue', 'greenyellow', 'violet', 'tomato'];
    if (parseInt(counter.innerText) > 1) {
      var t = parseInt(counter.innerText) - 1;
      counter.style.backgroundColor = colors[t];
      counter.innerText = t;
    } else {
      clearInterval(timer);
      countPanel.hidden = true;
      scorePanel.hidden = true;
      playPanel.classList.remove('d-none');
      typable();
      startTypeTimer();
      if (localStorage.getItem('bgm') == 1) {
        bgm.play();
      }
      document.body.addEventListener('keydown', typeEvent);
      startButton.addEventListener('click', startGame);
    }
  }, 1000);
}

function startGame() {
  clearInterval(typeTimer);
  startButton.removeEventListener('click', startGame);
  document.removeEventListener('keydown', startKeyEvent);
  initTime();
  loadProblems();
  countdown();
}

function startKeyEvent(event) {
  if (event.key == ' ' || event.key == 'Spacebar') {
    startGame();
  } else if (event.key == 'E' || event.key == '1') {
    mode.textContent = 'EASY';
  } else if (event.key == 'H' || event.key == '2') {
    mode.textContent = 'HARD';
  }
}
document.addEventListener('keydown', startKeyEvent);
startButton.addEventListener('click', startGame);

function startTypeTimer() {
  var timeNode = document.getElementById('time');
  typeTimer = setInterval(function() {
    var arr = timeNode.innerText.split('秒 /');
    var t = parseInt(arr[0]);
    if (t > 0) {
      timeNode.innerText = (t-1) + '秒 /' + arr[1];
    } else {
      clearInterval(typeTimer);
      bgm.pause();
      playAudio(endAudio);
      playPanel.classList.add('d-none');
      countPanel.hidden = true;
      scorePanel.hidden = false;
      scoring();
    }
  }, 1000);
}

function downTime(n) {
  const timeNode = document.getElementById('time');
  const arr = timeNode.innerText.split('秒 /');
  const t = parseInt(arr[0]);
  const downedTime = t - n;
  if (downedTime < 0) {
    timeNode.innerText = '0秒 /' + arr[1];
  } else {
    timeNode.innerText = downedTime + '秒 /' + arr[1];
  }
}


function initTime() {
  document.getElementById('time').innerText = gameTime + '秒 / ' + gameTime + '秒';
}

gradeOption.addEventListener('change', function() {
  initTime();
  document.addEventListener('keydown', startKeyEvent);
  clearInterval(typeTimer);
});

function scoring() {
  document.body.removeEventListener('keydown', typeEvent);
  var grade = gradeOption.options[gradeOption.selectedIndex].value;
  var typeSpeed = (normalCount / gameTime).toFixed(2);
  document.getElementById('totalType').innerText = normalCount + errorCount;
  document.getElementById('typeSpeed').innerText = typeSpeed;
  document.getElementById('errorType').innerText = errorCount;
  document.getElementById('twitter').href = 'https://twitter.com/intent/tweet?text=英単語タイピングの' + grade +
    'をプレイしたよ! (速度: ' + typeSpeed + '回/秒) ' +
    '&url=https%3a%2f%2fmarmooo.github.com/hageda%2f&hashtags=英単語タイピング';
  document.addEventListener('keydown', startKeyEvent);
}

aa.parentNode.style.height = calcAAOuterSize() + 'px';
resizeFontSize(aa);
window.addEventListener('resize', function() {
  aa.parentNode.style.height = calcAAOuterSize() + 'px';
  resizeFontSize(aa);
});
document.addEventListener('click', unlockAudio, { once:true, useCapture:true });

