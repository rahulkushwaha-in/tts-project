const inputText = document.getElementById('inputText');
const audioPlayer = document.getElementById('audioPlayer');
const voiceSelect = document.getElementById('voiceSelect');
const rateRange = document.getElementById('rateRange');
const pitchRange = document.getElementById('pitchRange');
const convertButton = document.getElementById('convertButton');
const stopButton = document.getElementById('stopButton');
const resumeButton = document.getElementById('resumeButton');
const progressBar = document.getElementById('progressBar');

// Populate voice options
function populateVoiceList() {
    const voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = voices
        .map((voice, index) => `<option value="${index}">${voice.name} (${voice.lang})</option>`)
        .join('');
}

// Initialize voices
populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

let synthesis;
let pausePosition = 0; // Variable to store the position where speech was paused

function convertText() {
    stopSpeech();

    const selectedVoiceIndex = voiceSelect.value;
    const selectedVoice = speechSynthesis.getVoices()[selectedVoiceIndex];

    synthesis = new SpeechSynthesisUtterance(inputText.value);
    synthesis.voice = selectedVoice;
    synthesis.rate = parseFloat(rateRange.value);
    synthesis.pitch = parseFloat(pitchRange.value);

    synthesis.onstart = () => {
        convertButton.disabled = true;
        stopButton.disabled = false;
        resumeButton.disabled = true;
        progressBar.style.display = 'block';
        progressBar.querySelector('div').style.width = '0';
    };

    synthesis.onend = () => {
        console.log('Speech synthesis complete.');
        convertButton.disabled = false;
        stopButton.disabled = true;
        resumeButton.disabled = false;
        progressBar.style.display = 'none';
    };

    synthesis.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        convertButton.disabled = false;
        stopButton.disabled = true;
        resumeButton.disabled = false;
        progressBar.style.display = 'none';
    };

    synthesis.onboundary = (event) => {
        const progress = (event.charIndex / inputText.value.length) * 100;
        progressBar.querySelector('div').style.width = progress + '%';
    };

    speechSynthesis.speak(synthesis);

    audioPlayer.src = URL.createObjectURL(new Blob([inputText.value], { type: 'audio/wav' }));
}

function stopSpeech() {
    if (synthesis) {
        synthesis.onstart = null;
        synthesis.onend = null;
        synthesis.onerror = null;
        synthesis.onboundary = null;
        synthesis.onpause = null;
        synthesis.onresume = null;
        speechSynthesis.cancel();
        convertButton.disabled = false;
        stopButton.disabled = true;
        resumeButton.disabled = false;
        progressBar.style.display = 'none';

        // If speech was paused, store the current position
        if (synthesis.paused) {
            pausePosition = synthesis.charIndex;
        }
    }
}

function resumeSpeech() {
    if (synthesis && synthesis.paused) {
        stopSpeech();
        convertText();
        synthesis.onstart = () => {
            synthesis.onstart = null; // Reset the onstart event to avoid double firing
            synthesis.onpause = null; // Remove the pause event listener
            synthesis.onboundary = (event) => {
                const progress = ((event.charIndex + pausePosition) / inputText.value.length) * 100;
                progressBar.querySelector('div').style.width = progress + '%';
            };
        };
    }
}
