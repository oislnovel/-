const elements = {
  textInput: document.querySelector('#textInput'),
  charCount: document.querySelector('#charCount'),
  voiceSelect: document.querySelector('#voiceSelect'),
  playButton: document.querySelector('#playButton'),
  stopButton: document.querySelector('#stopButton'),
  status: document.querySelector('#status'),
};

let voices = [];
let currentUtterance = null;

function updateCharCount() {
  elements.charCount.textContent = `${elements.textInput.value.length.toLocaleString('ja-JP')}文字`;
}

function setStatus(message) {
  elements.status.textContent = message;
}

function populateVoices() {
  voices = speechSynthesis.getVoices().sort((a, b) => {
    const aJapanese = a.lang.startsWith('ja') ? 0 : 1;
    const bJapanese = b.lang.startsWith('ja') ? 0 : 1;
    return aJapanese - bJapanese || a.name.localeCompare(b.name, 'ja');
  });

  elements.voiceSelect.innerHTML = '';

  if (voices.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '音声を読み込み中です';
    elements.voiceSelect.append(option);
    return;
  }

  for (const voice of voices) {
    const option = document.createElement('option');
    option.value = voice.voiceURI;
    option.textContent = `${voice.name} (${voice.lang})`;
    elements.voiceSelect.append(option);
  }

  const japaneseVoice = voices.find((voice) => voice.lang.startsWith('ja'));
  elements.voiceSelect.value = japaneseVoice?.voiceURI || voices[0].voiceURI;
}

function getSelectedVoice() {
  return voices.find((voice) => voice.voiceURI === elements.voiceSelect.value) ?? null;
}

function stopReading() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
  setStatus('停止しました');
}

function readText() {
  const text = elements.textInput.value.trim();

  if (!text) {
    setStatus('本文を貼り付けてください');
    return;
  }

  if (!('speechSynthesis' in window)) {
    setStatus('このブラウザは音声合成に対応していません');
    return;
  }

  speechSynthesis.cancel();
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = getSelectedVoice()?.lang ?? 'ja-JP';
  currentUtterance.voice = getSelectedVoice();
  currentUtterance.onstart = () => setStatus('読み上げ中');
  currentUtterance.onend = () => {
    currentUtterance = null;
    setStatus('読み上げ完了');
  };
  currentUtterance.onerror = () => setStatus('読み上げでエラーが発生しました');

  speechSynthesis.speak(currentUtterance);
}

function init() {
  updateCharCount();
  elements.textInput.addEventListener('input', updateCharCount);
  elements.playButton.addEventListener('click', readText);
  elements.stopButton.addEventListener('click', stopReading);

  if ('speechSynthesis' in window) {
    populateVoices();
    speechSynthesis.addEventListener('voiceschanged', populateVoices);
  } else {
    elements.voiceSelect.innerHTML = '<option>音声合成に未対応</option>';
    setStatus('このブラウザは音声合成に対応していません');
  }
}

init();
