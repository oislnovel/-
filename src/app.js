import { splitIntoSpeechChunks } from './speech.js';

const SAMPLE_TEXT = `吾輩は猫である。名前はまだ無い。\n\nこのアプリは、ブラウザの音声合成を使って日本語の文章を読み上げます。PCの音声出力をイヤホンに設定してから再生してください。`;
const STORAGE_KEY = 'mimi-reader-state-v1';

const elements = {
  textInput: document.querySelector('#textInput'),
  fileInput: document.querySelector('#fileInput'),
  sampleButton: document.querySelector('#sampleButton'),
  clearButton: document.querySelector('#clearButton'),
  charCount: document.querySelector('#charCount'),
  voiceSelect: document.querySelector('#voiceSelect'),
  rate: document.querySelector('#rate'),
  pitch: document.querySelector('#pitch'),
  volume: document.querySelector('#volume'),
  rateValue: document.querySelector('#rateValue'),
  pitchValue: document.querySelector('#pitchValue'),
  volumeValue: document.querySelector('#volumeValue'),
  playButton: document.querySelector('#playButton'),
  pauseButton: document.querySelector('#pauseButton'),
  stopButton: document.querySelector('#stopButton'),
  progress: document.querySelector('#progress'),
  progressText: document.querySelector('#progressText'),
  status: document.querySelector('#status'),
};

let voices = [];
let chunks = [];
let currentChunkIndex = 0;
let isStoppedManually = false;

function saveState() {
  const state = {
    text: elements.textInput.value,
    rate: elements.rate.value,
    pitch: elements.pitch.value,
    volume: elements.volume.value,
    voiceURI: elements.voiceSelect.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw);
    elements.textInput.value = state.text ?? '';
    elements.rate.value = state.rate ?? '1';
    elements.pitch.value = state.pitch ?? '1';
    elements.volume.value = state.volume ?? '1';
    elements.voiceSelect.dataset.preferredVoice = state.voiceURI ?? '';
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function updateLabels() {
  elements.charCount.textContent = `${elements.textInput.value.length.toLocaleString('ja-JP')}文字`;
  elements.rateValue.textContent = Number(elements.rate.value).toFixed(1);
  elements.pitchValue.textContent = Number(elements.pitch.value).toFixed(1);
  elements.volumeValue.textContent = `${Math.round(Number(elements.volume.value) * 100)}%`;
}

function setStatus(message) {
  elements.status.textContent = message;
}

function updateProgress() {
  const total = chunks.length;
  const current = total === 0 ? 0 : Math.min(currentChunkIndex + 1, total);
  elements.progress.max = Math.max(total, 1);
  elements.progress.value = total === 0 ? 0 : current;
  elements.progressText.textContent = `${current} / ${total}`;
}

function populateVoices() {
  voices = speechSynthesis.getVoices().sort((a, b) => {
    const aJapanese = a.lang.startsWith('ja') ? 0 : 1;
    const bJapanese = b.lang.startsWith('ja') ? 0 : 1;
    return aJapanese - bJapanese || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name);
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
    option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' - 既定' : ''}`;
    elements.voiceSelect.append(option);
  }

  const preferred = elements.voiceSelect.dataset.preferredVoice;
  const preferredVoice = voices.find((voice) => voice.voiceURI === preferred);
  const japaneseVoice = voices.find((voice) => voice.lang.startsWith('ja'));
  elements.voiceSelect.value = preferredVoice?.voiceURI || japaneseVoice?.voiceURI || voices[0]?.voiceURI || '';
}

function getSelectedVoice() {
  return voices.find((voice) => voice.voiceURI === elements.voiceSelect.value) ?? null;
}

function speakCurrentChunk() {
  if (currentChunkIndex >= chunks.length) {
    setStatus('読み上げが完了しました。');
    updateProgress();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex]);
  utterance.lang = getSelectedVoice()?.lang ?? 'ja-JP';
  utterance.voice = getSelectedVoice();
  utterance.rate = Number(elements.rate.value);
  utterance.pitch = Number(elements.pitch.value);
  utterance.volume = Number(elements.volume.value);

  utterance.onstart = () => {
    setStatus(`読み上げ中: ${currentChunkIndex + 1} / ${chunks.length}`);
    updateProgress();
  };
  utterance.onend = () => {
    if (isStoppedManually) return;
    currentChunkIndex += 1;
    updateProgress();
    speakCurrentChunk();
  };
  utterance.onerror = (event) => {
    setStatus(`読み上げエラー: ${event.error}`);
  };

  speechSynthesis.speak(utterance);
}

function play() {
  if (!('speechSynthesis' in window)) {
    setStatus('このブラウザは音声合成に対応していません。Chrome / Edge / Safari を試してください。');
    return;
  }

  if (speechSynthesis.paused) {
    speechSynthesis.resume();
    setStatus('読み上げを再開しました。');
    return;
  }

  const text = elements.textInput.value.trim();
  chunks = splitIntoSpeechChunks(text);
  currentChunkIndex = 0;
  isStoppedManually = false;
  updateProgress();

  if (chunks.length === 0) {
    setStatus('読み上げる本文を入力してください。');
    return;
  }

  speechSynthesis.cancel();
  saveState();
  speakCurrentChunk();
}

function pause() {
  if (!('speechSynthesis' in window)) return;
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    setStatus('一時停止しました。');
  }
}

function stop() {
  isStoppedManually = true;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  currentChunkIndex = 0;
  updateProgress();
  setStatus('停止しました。');
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const parser = new DOMParser();
    const content = String(reader.result ?? '');
    const text = file.type === 'text/html' || file.name.match(/\.html?$/i)
      ? parser.parseFromString(content, 'text/html').body.textContent ?? ''
      : content;
    elements.textInput.value = text.trim();
    updateLabels();
    saveState();
    setStatus(`${file.name} を読み込みました。`);
  };
  reader.onerror = () => setStatus('ファイルを読み込めませんでした。');
  reader.readAsText(file, 'utf-8');
}

function bindEvents() {
  elements.textInput.addEventListener('input', () => {
    updateLabels();
    saveState();
  });
  elements.fileInput.addEventListener('change', (event) => {
    const [file] = event.target.files ?? [];
    if (file) readFile(file);
  });
  elements.sampleButton.addEventListener('click', () => {
    elements.textInput.value = SAMPLE_TEXT;
    updateLabels();
    saveState();
    setStatus('サンプル本文を入力しました。');
  });
  elements.clearButton.addEventListener('click', () => {
    stop();
    elements.textInput.value = '';
    updateLabels();
    saveState();
  });
  for (const element of [elements.rate, elements.pitch, elements.volume, elements.voiceSelect]) {
    element.addEventListener('input', () => {
      updateLabels();
      saveState();
    });
  }
  elements.playButton.addEventListener('click', play);
  elements.pauseButton.addEventListener('click', pause);
  elements.stopButton.addEventListener('click', stop);
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'Enter') play();
    if (event.key === 'Escape') stop();
  });
}

function init() {
  loadState();
  updateLabels();
  updateProgress();
  bindEvents();
  if ('speechSynthesis' in window) {
    populateVoices();
    speechSynthesis.addEventListener('voiceschanged', populateVoices);
  } else {
    elements.voiceSelect.innerHTML = '<option>音声合成に未対応</option>';
    setStatus('このブラウザは音声合成に対応していません。Chrome / Edge / Safari を試してください。');
  }
}

init();
