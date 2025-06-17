let typingInterval = null;
let recognitionLang = 'en-US';
let speechLang = 'en-US';

const qaTrainingSet = [
  {
    tags: ["tell me about yourself", "introduce yourself", "who are you"],
    answer: `Hello! I'm Kausar Farooqui, a Full Stack AI & ML Developer from New Delhi. I’ve built projects like NeuroStock.AI, SightMate, and I did my B.Tech in AI & ML from Jamia Hamdard University.`
  },
  {
    tags: ["education", "academic background"],
    answer: `I did my B.Tech in Computer Science with a specialization in AI & ML from Jamia Hamdard University. My CGPA is 7.8, and I focused on applied AI systems and real-time ML solutions.`
  },
  {
    tags: ["projects", "your work"],
    answer: `My top projects are: NeuroStock.AI, SightMate, Cyber Security Threat Detector, Book Recommendation System using NLP, and this VoiceBot.`
  }
];

function startListening() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  const startBtn = document.getElementById("startBtn");
  recognition.lang = recognitionLang;
  recognition.start();

  startBtn.classList.add("listening");
  startWaveAnimation();

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("userText").innerHTML = `You asked: <em>${transcript}</em>`;
    createMessage('user', transcript);
    handleCommand(transcript);
  };

  recognition.onspeechend = () => recognition.stop();

  recognition.onend = () => {
    startBtn.classList.remove("listening");
    stopWaveAnimation();
  };

  recognition.onerror = function () {
    alert("Speech recognition failed. Try again.");
    startBtn.classList.remove("listening");
    stopWaveAnimation();
  };
}

function stopSpeaking() {
  speechSynthesis.cancel();
  document.getElementById("startBtn").classList.remove("listening");
  stopWaveAnimation();

  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
}

function createMessage(type, text) {
  const container = document.getElementById("chatContainer");
  const div = document.createElement("div");
  div.className = type === 'user' ? 'user-msg' : 'bot-msg';
  div.innerText = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function speakWithEffect(text) {
  const botBubble = createMessage('bot', '');
  let index = 0;

  if (typingInterval) clearInterval(typingInterval);

  typingInterval = setInterval(() => {
    if (index < text.length) {
      botBubble.textContent += text.charAt(index);
      index++;
    } else {
      clearInterval(typingInterval);
      typingInterval = null;
    }
  }, 40);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLang;
  utterance.pitch = 1.1;
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

function getMatchedAnswer(userInput) {
  const query = userInput.toLowerCase();
  for (const item of qaTrainingSet) {
    if (item.tags.some(tag => query.includes(tag))) {
      return item.answer;
    }
  }
  return null;
}

function getBotResponse(userInput) {
  const matched = getMatchedAnswer(userInput);
  if (matched) {
    speakWithEffect(matched);
    return;
  }

  const prompt = `You are Kausar Farooqui, an AI/ML developer. Answer this clearly and smartly:\n\n"${userInput}"`;

  fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  )
    .then(res => res.json())
    .then(data => {
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't answer that.";
      speakWithEffect(reply);
    })
    .catch(err => {
      console.error(err);
      speakWithEffect("Something went wrong. Please try again.");
    });
}

function handleCommand(transcript) {
  const lc = transcript.toLowerCase();

  if (lc.includes("switch to hindi")) {
    recognitionLang = 'hi-IN';
    speechLang = 'hi-IN';
    speakWithEffect("भाषा अब हिंदी में बदल गई है।");
    return;
  }

  if (lc.includes("switch to spanish")) {
    recognitionLang = 'es-ES';
    speechLang = 'es-ES';
    speakWithEffect("El idioma se ha cambiado al español.");
    return;
  }

  if (lc.includes("switch to french")) {
    recognitionLang = 'fr-FR';
    speechLang = 'fr-FR';
    speakWithEffect("La langue a été changée en français.");
    return;
  }

  if (lc.includes("switch to english")) {
    recognitionLang = 'en-US';
    speechLang = 'en-US';
    speakWithEffect("Language switched to English.");
    return;
  }

  getBotResponse(transcript);
}

let audioContext, analyser, microphone, animationId;

function startWaveAnimation() {
  const leftCanvas = document.getElementById("leftBar");
  const rightCanvas = document.getElementById("rightBar");
  const leftCtx = leftCanvas.getContext("2d");
  const rightCtx = rightCanvas.getContext("2d");

  function resizeBars() {
    const container = document.querySelector(".voicebot-ui");
    const height = container.clientHeight * 0.6;
    leftCanvas.height = rightCanvas.height = height;
    leftCanvas.width = rightCanvas.width = 16;
  }

  resizeBars();
  window.addEventListener("resize", resizeBars);

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 64;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function getColor(val) {
      if (val < 85) return "#00ff7f"; // green
      if (val < 170) return "#ffa500"; // orange
      return "#ff3b3b"; // red
    }

    function drawBar(ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const barWidth = ctx.canvas.width;
      const barSpacing = 4;
      const barCount = Math.floor(ctx.canvas.height / barSpacing);
      const segmentSize = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * segmentSize] || 0;
        const height = (val / 255) * barSpacing;
        const y = ctx.canvas.height - i * barSpacing;

        ctx.fillStyle = getColor(val);
        ctx.fillRect(0, y, barWidth, height);
      }
    }

    function animateBars() {
      animationId = requestAnimationFrame(animateBars);
      analyser.getByteFrequencyData(dataArray);
      drawBar(leftCtx);
      drawBar(rightCtx);
    }

    animateBars();
  });
}

function stopWaveAnimation() {
  if (animationId) cancelAnimationFrame(animationId);
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  const leftCanvas = document.getElementById("leftBar");
  const rightCanvas = document.getElementById("rightBar");
  if (leftCanvas && rightCanvas) {
    const leftCtx = leftCanvas.getContext("2d");
    const rightCtx = rightCanvas.getContext("2d");
    leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
    rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
  }
}