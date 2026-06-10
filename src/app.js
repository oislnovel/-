const elements = {
  textInput: document.querySelector('#textInput'),
  charCount: document.querySelector('#charCount'),
  status: document.querySelector('#status'),
  voiceSelect: document.querySelector('#voiceSelect'),
  playButton: document.querySelector('#playButton'),
  stopButton: document.querySelector('#stopButton'),
};

let voices = [];

function setStatus(message) {
  if (elements.status) elements.status.textContent = message;
}

function updateCharCount() {
  elements.charCount.textContent = `${elements.textInput.value.length.toLocaleString('ja-JP')}文字`;
}

function populateVoices() {
  if (!('speechSynthesis' in window)) {
    elements.voiceSelect.innerHTML = '<option value="">音声合成に未対応</option>';
    setStatus('このブラウザは音声合成に対応していません');
    return;
  }

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

function selectedVoice() {
  return voices.find((voice) => voice.voiceURI === elements.voiceSelect.value) || null;
}

function stopReading() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  setStatus('停止しました');
}

function readText() {
  const text = elements.textInput.value.trim();

  if (!text) {
    setStatus('本文を貼り付けてください');
    return;
  }

  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    setStatus('このブラウザは音声合成に対応していません');
    return;
  }

  speechSynthesis.cancel();
  const voice = selectedVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice?.lang || 'ja-JP';
  utterance.onstart = () => setStatus('読み上げ中');
  utterance.onend = () => setStatus('読み上げ完了');
  utterance.onerror = () => setStatus('読み上げでエラーが発生しました');
  speechSynthesis.speak(utterance);
}

function init() {
  const missingElement = Object.values(elements).some((element) => element === null);
  if (missingElement) {
    console.error('Mimi Reader: 必要なHTML要素が見つかりません。');
    return;
  }

  updateCharCount();
  populateVoices();
  elements.textInput.addEventListener('input', updateCharCount);
  elements.playButton.addEventListener('click', readText);
  elements.stopButton.addEventListener('click', stopReading);

  if ('speechSynthesis' in window) {
    if (typeof speechSynthesis.addEventListener === 'function') {
      speechSynthesis.addEventListener('voiceschanged', populateVoices);
    } else {
      speechSynthesis.onvoiceschanged = populateVoices;
    }
  }
}

init();
