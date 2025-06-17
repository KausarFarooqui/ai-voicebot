let typingInterval = null;

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

function getMatchedAnswer(userInput) {
  const query = userInput.toLowerCase();
  for (const item of qaTrainingSet) {
    if (item.tags.some(tag => query.includes(tag))) {
      return item.answer;
    }
  }
  return null;
}

function startListening() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  const startBtn = document.getElementById("startBtn");
  recognition.lang = "en-US";
  recognition.start();

  startBtn.classList.add("listening");

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    getBotResponse(transcript);
    startBtn.classList.remove("listening");
  };

  recognition.onend = function () {
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

  // Stop typing
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
}

function speakWithEffect(text) {
  const display = document.getElementById("botResponse");
  display.innerHTML = "";
  let index = 0;

  if (typingInterval) clearInterval(typingInterval);

  typingInterval = setInterval(() => {
    if (index < text.length) {
      display.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(typingInterval);
      typingInterval = null;
    }
  }, 30);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.pitch = 1.1;
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
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
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't answer that.";
      speakWithEffect(reply);
    })
    .catch(err => {
      console.error(err);
      speakWithEffect("Something went wrong. Please try again.");
    });
}
