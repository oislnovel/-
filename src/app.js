(function () {
  'use strict';

  const textInput = document.getElementById('textInput');
  const charCount = document.getElementById('charCount');
  const statusText = document.getElementById('status');
  const voiceSelect = document.getElementById('voiceSelect');
  const speakButton = document.getElementById('speakButton');
  const stopButton = document.getElementById('stopButton');

  let voices = [];
  let utterance = null;

  function setStatus(message) {
    statusText.textContent = message;
  }

  function updateCharCount() {
    charCount.textContent = `${textInput.value.length.toLocaleString('ja-JP')}文字`;
  }

  function voiceLabel(voice) {
    const defaultText = voice.default ? ' / 既定' : '';
    return `${voice.name} (${voice.lang}${defaultText})`;
  }

  function populateVoices() {
    if (!('speechSynthesis' in window)) {
      voiceSelect.innerHTML = '<option value="">このブラウザは音声合成に未対応です</option>';
      setStatus('このブラウザは音声合成に対応していません。');
      return;
    }

    const selectedValue = voiceSelect.value;
    voices = window.speechSynthesis.getVoices().slice().sort((a, b) => {
      const aJa = a.lang.toLowerCase().startsWith('ja') ? 0 : 1;
      const bJa = b.lang.toLowerCase().startsWith('ja') ? 0 : 1;
      return aJa - bJa || a.name.localeCompare(b.name, 'ja') || a.lang.localeCompare(b.lang, 'ja');
    });

    voiceSelect.replaceChildren();

    if (voices.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '音声を読み込み中です';
      voiceSelect.appendChild(option);
      return;
    }

    voices.forEach((voice) => {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = voiceLabel(voice);
      voiceSelect.appendChild(option);
    });

    const ayumi = voices.find((voice) => /ayumi/i.test(voice.name) && voice.lang.toLowerCase().startsWith('ja'));
    const japanese = voices.find((voice) => voice.lang.toLowerCase().startsWith('ja'));
    const previous = voices.find((voice) => voice.voiceURI === selectedValue);
    voiceSelect.value = (previous || ayumi || japanese || voices[0]).voiceURI;
  }

  function selectedVoice() {
    return voices.find((voice) => voice.voiceURI === voiceSelect.value) || null;
  }

  function speak() {
    if (!('speechSynthesis' in window)) {
      setStatus('このブラウザは音声合成に対応していません。');
      return;
    }

    const text = textInput.value.trim();
    if (!text) {
      setStatus('本文を貼り付けてください。');
      textInput.focus();
      return;
    }

    window.speechSynthesis.cancel();

    utterance = new SpeechSynthesisUtterance(text);
    const voice = selectedVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'ja-JP';
    }

    utterance.onstart = () => setStatus('読み上げ中です。');
    utterance.onend = () => setStatus('読み上げが終わりました。');
    utterance.onerror = (event) => setStatus(`読み上げを停止しました。${event.error ? ` (${event.error})` : ''}`);

    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('停止しました。');
  }

  textInput.addEventListener('input', updateCharCount);
  speakButton.addEventListener('click', speak);
  stopButton.addEventListener('click', stop);

  updateCharCount();
  populateVoices();

  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
    window.setTimeout(populateVoices, 300);
    window.setTimeout(populateVoices, 1000);
  }
}());
