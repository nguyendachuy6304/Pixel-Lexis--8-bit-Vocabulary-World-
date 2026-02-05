// --- js/core.js ---
let currentLevelData = null; 
let currentQuestionIndex = 0;
let heroHP = 100;
let monsterHP = 100;
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// --- KHỞI TẠO MAP ---
function initMap(levels) {
    const listContainer = document.getElementById("level-list");
    if(!listContainer) return; // Tránh lỗi nếu không tìm thấy element
    listContainer.innerHTML = "";

    const allNormalDone = levels.filter(l => !l.isBoss).every(l => l.completed);
    const bossLevel = levels.find(l => l.isBoss);
    if(bossLevel && allNormalDone) bossLevel.locked = false;

    levels.forEach((level) => {
        const btn = document.createElement("button");
        btn.className = "level-btn";
        if (level.isBoss) btn.classList.add("boss-level");
        let statusIcon = level.locked ? "🔒" : (level.completed ? "✅" : "⚔️");
        btn.innerText = `${level.name} ${statusIcon}`;
        btn.disabled = level.locked;
        btn.onclick = () => startBattle(level);
        listContainer.appendChild(btn);
    });
}

// --- BẮT ĐẦU TRẬN ĐẤU ---
function startBattle(levelData) {
    currentLevelData = levelData;
    
    // UI Switching
    document.getElementById("map-screen").classList.add("hidden");
    document.getElementById("battle-screen").classList.remove("hidden");
    
    // Đảm bảo nút Pause hiện lên và Menu ẩn đi
    document.getElementById("btn-pause-toggle").classList.remove("hidden");
    document.getElementById("pause-modal").classList.add("hidden");
    document.getElementById("btn-back-map").classList.add("hidden"); // Nút thắng/thua ẩn đi

    // Reset Game State
    heroHP = 100;
    monsterHP = 100;
    currentQuestionIndex = 0;

    // Render Info
    document.getElementById("monster-name").innerText = levelData.isBoss ? "THE BOSS" : "MONSTER";
    document.querySelector(".pixel-monster").innerText = levelData.isBoss ? "👹" : "👾";
    
    // Enable Inputs
    document.getElementById("btn-attack").disabled = false;
    const input = document.querySelector(".pixel-input");
    input.disabled = false;
    input.value = "";

    updateHealthUI();
    loadQuestion();
}

// --- LOGIC CÂU HỎI & TẤN CÔNG (Giữ nguyên logic Retry) ---
function loadQuestion() {
    const qText = document.getElementById("question-text");
    const input = document.querySelector(".pixel-input");

    if (currentQuestionIndex < currentLevelData.questions.length) {
        const q = currentLevelData.questions[currentQuestionIndex];
        qText.innerText = `Dịch: "${q.meaning}"`;
        qText.style.color = "#ffffff";
        input.value = "";
        input.focus();
    } else {
        levelVictory();
    }
}

function attack() {
    const input = document.querySelector(".pixel-input");
    const qText = document.getElementById("question-text");
    const answer = input.value.trim().toUpperCase();
    const correct = currentLevelData.questions[currentQuestionIndex].word.toUpperCase();

    if (answer === correct) {
        playSound('hit');
        const dmg = 100 / currentLevelData.questions.length;
        monsterHP -= dmg;
        currentQuestionIndex++;
        updateHealthUI();
        qText.innerText = "CHÍNH XÁC! TẤN CÔNG!!";
        qText.style.color = "#4caf50";
        setTimeout(() => {
            if (monsterHP > 1) loadQuestion(); else levelVictory();
        }, 800);
    } else {
        playSound('miss');
        heroHP -= 25;
        updateHealthUI();
        shakeScreen();
        qText.innerText = `SAI RỒI! (-25 HP)`;
        qText.style.color = "#d32f2f";
        input.value = "";
        
        if (heroHP <= 0) gameOver();
        else setTimeout(() => loadQuestion(), 1500);
    }
}

// --- CÁC HÀM XỬ LÝ GAME ---
function updateHealthUI() {
    document.getElementById("hero-hp").style.width = `${Math.max(0, heroHP)}%`;
    document.getElementById("monster-hp").style.width = `${Math.max(0, monsterHP)}%`;
}

function levelVictory() {
    playSound('win');
    document.getElementById("monster-hp").style.width = "0%";
    document.getElementById("question-text").innerText = "CHIẾN THẮNG!";
    document.querySelector(".pixel-monster").innerText = "🏳️";
    currentLevelData.completed = true;
    endGameUI();
}

function gameOver() {
    document.getElementById("question-text").innerText = "BẠN ĐÃ THUA...";
    document.querySelector(".pixel-monster").innerText = "💀";
    endGameUI();
}

function endGameUI() {
    document.getElementById("btn-attack").disabled = true;
    document.querySelector(".pixel-input").disabled = true;
    document.getElementById("btn-back-map").classList.remove("hidden"); // Hiện nút quay về to ở dưới
    document.getElementById("btn-pause-toggle").classList.add("hidden"); // Ẩn nút pause đi
}

// --- HỆ THỐNG MENU (MỚI) ---
function togglePause() {
    const modal = document.getElementById("pause-modal");
    if (modal.classList.contains("hidden")) {
        modal.classList.remove("hidden"); // Hiện menu
    } else {
        modal.classList.add("hidden"); // Ẩn menu (Tiếp tục)
        document.querySelector(".pixel-input").focus();
    }
}

function restartLevel() {
    togglePause(); // Đóng menu
    startBattle(currentLevelData); // Chơi lại từ đầu
}

function backToMap() {
    document.getElementById("battle-screen").classList.add("hidden");
    document.getElementById("map-screen").classList.remove("hidden");
    // Vẽ lại map
    if(typeof currentMapLevels !== 'undefined') initMap(currentMapLevels);
}

function goHome() {
    window.location.href = 'index.html';
}

function shakeScreen() {
    document.body.style.animation = "shake 0.5s";
    setTimeout(() => { document.body.style.animation = ""; }, 500);
}

// --- ÂM THANH (Giữ nguyên) ---
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
    osc.connect(g); g.connect(audioCtx.destination); const now = audioCtx.currentTime;
    if (type === 'hit') { osc.type='square'; osc.frequency.setValueAtTime(400,now); osc.frequency.exponentialRampToValueAtTime(1000,now+0.1); g.gain.setValueAtTime(0.1,now); g.gain.exponentialRampToValueAtTime(0.01,now+0.1); osc.start(now); osc.stop(now+0.1); }
    else if (type === 'miss') { osc.type='sawtooth'; osc.frequency.setValueAtTime(150,now); osc.frequency.linearRampToValueAtTime(50,now+0.3); g.gain.setValueAtTime(0.1,now); g.gain.linearRampToValueAtTime(0.01,now+0.3); osc.start(now); osc.stop(now+0.3); }
    else if (type === 'win') { playNote(523.25,0,0.1); playNote(659.25,0.1,0.1); playNote(783.99,0.2,0.2); }
}
function playNote(f,s,d){const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.1,audioCtx.currentTime+s);g.gain.linearRampToValueAtTime(0,audioCtx.currentTime+s+d);o.start(audioCtx.currentTime+s);o.stop(audioCtx.currentTime+s+d);}

// --- EVENT LISTENERS ---
document.getElementById("btn-attack").addEventListener("click", attack);
document.querySelector(".pixel-input").addEventListener("keypress", (e) => { if (e.key === "Enter") attack(); });

// Sự kiện Menu
document.getElementById("btn-back-map").addEventListener("click", backToMap);
document.getElementById("btn-pause-toggle").addEventListener("click", togglePause);
document.getElementById("btn-resume").addEventListener("click", togglePause);
document.getElementById("btn-restart").addEventListener("click", restartLevel);
document.getElementById("btn-menu-map").addEventListener("click", backToMap);
document.getElementById("btn-menu-home").addEventListener("click", goHome);