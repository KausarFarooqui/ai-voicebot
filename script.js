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

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;

    // 👤 Show in "You asked" container
    document.getElementById("userText").innerHTML = `You asked: <em>${transcript}</em>`;

    // 💬 Add user message to chat
    createMessage('user', transcript);

    handleCommand(transcript);
  };

  recognition.onspeechend = () => recognition.stop();

  recognition.onend = () => {
    startBtn.classList.remove("listening");
  };

  recognition.onerror = function () {
    alert("Speech recognition failed. Try again.");
    startBtn.classList.remove("listening");
  };
}

function stopSpeaking() {
  speechSynthesis.cancel();
  document.getElementById("startBtn").classList.remove("listening");

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
      botBubble.textContent += text.charAt(index); // ✅ FIXED spacing with .textContent
      index++;
    } else {
      clearInterval(typingInterval);
      typingInterval = null;
    }
  }, 40); // ✅ smoother speed for readability

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
