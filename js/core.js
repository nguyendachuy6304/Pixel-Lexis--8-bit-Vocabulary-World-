// --- js/core.js (Đã sửa lỗi tải Map) ---

let currentLevelData = null; 
let currentQuestionIndex = 0;
let heroHP = 100;
let monsterHP = 100;
let maxMonsterHP = 100; 
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let activeBuffs = []; 
let selectedBuffIndex = null; 
let currentMapId = ""; 

const BUFF_LIST = [
    { id: 'BERSERK', icon: '⚔️', name: 'Cuồng Nộ', desc: 'x2 Sát thương (Chỉ lượt này)' },
    { id: 'IRONCLAD', icon: '🛡️', name: 'Giáp Sắt', desc: 'Giảm 80% sát thương nhận (Nếu sai)' },
    { id: 'VAMPIRE', icon: '🩸', name: 'Hút Máu', desc: 'Hồi 30 HP ngay lập tức (Nếu đúng)' },
    { id: 'CRITICAL', icon: '⚡', name: 'Chí Mạng', desc: 'Chắc chắn x3 Sát thương' },
    { id: 'LUCKY', icon: '🍀', name: 'May Mắn', desc: 'Chắc chắn Né đòn (Nếu sai)' }
];

// 1. GẮN HÀM VÀO WINDOW ĐỂ HTML GỌI ĐƯỢC (QUAN TRỌNG)
window.initMap = function(levels, mapId) {
    console.log("Đang khởi tạo bản đồ:", mapId, levels); // Log để kiểm tra
    currentMapId = mapId;
    const container = document.getElementById("level-list"); 
    
    if(!container) {
        console.error("Không tìm thấy div id='level-list'");
        return;
    }
    
    // Reset và thêm class CSS
    container.innerHTML = ""; 
    container.className = "world-map-container"; 
    
    // Thêm class hình nền
    if (mapId === 'map_rung') container.classList.add("bg-forest");
    else if (mapId === 'map_city') container.classList.add("bg-city");
    else if (mapId === 'map_dungeon') container.classList.add("bg-dungeon");

    // Vẽ đường nối SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("map-connections");
    container.appendChild(svg);

    // Sắp xếp level
    levels.sort((a, b) => a.id - b.id);

    // Tính toán vị trí ZIG-ZAG (Hình rắn leo núi)
    const positions = [];
    const totalLevels = levels.length;
    
    levels.forEach((level, index) => {
        // Logic khóa bài: Bài 1 luôn mở, bài sau mở khi bài trước xong
        if (index === 0) level.locked = false; 
        else {
            const prevLevel = levels[index - 1];
            level.locked = !prevLevel.completed;
        }

        const btn = document.createElement("button");
        btn.className = "map-node";
        
        if (level.locked) {
            btn.innerText = "🔒";
            btn.disabled = true;
        } else if (level.completed) {
            btn.classList.add("completed");
            btn.innerText = "★"; 
        } else {
            btn.classList.add("unlocked");
            btn.innerText = level.id;
        }

        let diff = level.levelDifficulty || 1;
        btn.setAttribute("data-label", `Lv.${level.id}: ${level.name}`);
        btn.onclick = () => window.startBattle(level); // Gọi hàm qua window

        // --- CÔNG THỨC VỊ TRÍ ---
        // Y: Đi từ dưới lên (90% -> 10%)
        const stepY = 80 / Math.max(totalLevels, 1); 
        const topPos = 85 - (stepY * index); 
        
        // X: Uốn lượn hình Sin
        const wave = Math.sin(index * 2.5) * 35; // Biên độ uốn lượn
        const leftPos = 50 + wave; 

        btn.style.top = `${topPos}%`;
        btn.style.left = `${leftPos}%`;

        positions.push({ x: leftPos, y: topPos });
        container.appendChild(btn);
    });

    // Vẽ dây nối
    if (positions.length > 1) {
        let pathD = "";
        positions.forEach((pos, i) => {
            if (i === 0) pathD += `M ${pos.x}% ${pos.y}%`;
            else pathD += ` L ${pos.x}% ${pos.y}%`;
        });
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathD);
        path.classList.add("connection-line");
        svg.appendChild(path);
    }
};

// 2. CÁC HÀM HỖ TRỢ KHÁC (CŨNG GẮN VÀO WINDOW)
function generateBuffs() {
    const shuffled = [...BUFF_LIST].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(buff => ({ ...buff, used: false }));
}

function selectBuff(index) {
    if (activeBuffs[index].used) return;
    selectedBuffIndex = (selectedBuffIndex === index) ? null : index;
    renderBuffs();
}

function renderBuffs() {
    const container = document.createElement("div");
    container.className = "buff-container";
    container.id = "buff-ui";
    if (activeBuffs.length === 0) return;

    activeBuffs.forEach((buff, index) => {
        const span = document.createElement("span");
        span.className = "buff-item";
        span.innerText = buff.icon;
        if (buff.used) {
            span.classList.add("used");
            span.setAttribute("data-tooltip", `${buff.name} (Đã dùng)`);
        } else {
            span.setAttribute("data-tooltip", `${buff.name}: ${buff.desc}`);
            span.onclick = () => selectBuff(index);
        }
        if (selectedBuffIndex === index) span.classList.add("selected");
        container.appendChild(span);
    });

    const battleScreen = document.getElementById("battle-screen");
    const statusBar = document.querySelector(".status-bar");
    const oldBuff = document.getElementById("buff-ui");
    if(oldBuff) oldBuff.remove();
    battleScreen.insertBefore(container, statusBar);
}

window.startBattle = function(levelData) {
    currentLevelData = levelData;
    activeBuffs = generateBuffs(); 
    selectedBuffIndex = null;      
    
    document.getElementById("map-screen").classList.add("hidden");
    document.getElementById("battle-screen").classList.remove("hidden");
    const pauseModal = document.getElementById("pause-modal");
    if(pauseModal) pauseModal.classList.add("hidden");
    document.getElementById("btn-back-map").classList.add("hidden");

    heroHP = 100;
    let levelDiff = levelData.levelDifficulty || 1;
    maxMonsterHP = levelDiff * 100;
    monsterHP = maxMonsterHP;

    currentQuestionIndex = 0;
    
    // Xác định loại boss
    const bossType = levelData.bossType || 'demon';
    const bossName = levelData.isBoss ? "BOSS" : "MONSTER";
    document.getElementById("monster-name").innerText = `${bossName} (Lv.${levelDiff})`;
    document.getElementById("monster-title").innerText = levelData.name || bossName;
    
    // Hiển thị ảnh boss từ PNG
    const monsterDisplay = document.querySelector(".pixel-monster");
    monsterDisplay.innerHTML = `<img src="images/boss/${bossType}/images.svg" onerror="this.src='images/boss/demon/images.svg'" alt="${bossType}">`;
    
    // Hiển thị ảnh hero
    const heroDisplay = document.querySelector(".pixel-hero");
    if(heroDisplay) {
        heroDisplay.innerHTML = `<img src="images/hero/warrior.svg" alt="hero">`;
    }
    
    renderBuffs();
    updateHealthUI();
    loadQuestion();
};

function loadQuestion() {
    const qText = document.getElementById("question-text");
    const inputArea = document.querySelector(".player-actions"); 
    inputArea.innerHTML = ""; 

    if (currentQuestionIndex < currentLevelData.questions.length) {
        const q = currentLevelData.questions[currentQuestionIndex];
        const diffStars = "⭐".repeat(q.difficulty || 1);
        qText.innerHTML = `${q.question} <br><small style="color:#ffeb3b; font-size: 18px; margin-top:5px; display:block;">(Độ khó: ${diffStars})</small>`;
        qText.style.color = "#ffffff";
        qText.classList.remove("crit-effect");

        if (q.type === 'mc') {
            const divOpts = document.createElement("div");
            divOpts.className = "mc-options";
            q.options.forEach((opt, index) => {
                const btn = document.createElement("button");
                btn.className = "mc-btn";
                const label = ["A", "B", "C", "D"][index];
                btn.innerText = `${label}. ${opt}`;
                btn.onclick = () => checkAnswer(label); 
                divOpts.appendChild(btn);
            });
            inputArea.appendChild(divOpts);
        } else {
            const input = document.createElement("input");
            input.type = "text";
            input.className = "pixel-input";
            input.placeholder = q.type === 'fill' ? "Điền từ..." : "Nhập đáp án...";
            const btn = document.createElement("button");
            btn.className = "pixel-btn";
            btn.innerText = "TẤN CÔNG";
            btn.onclick = () => checkAnswer(input.value);
            input.addEventListener("keypress", (e) => { if (e.key === "Enter") checkAnswer(input.value); });
            inputArea.appendChild(input);
            inputArea.appendChild(btn);
            input.focus();
        }
    } else {
        levelVictory();
    }
}

function checkAnswer(userAnswer) {
    const q = currentLevelData.questions[currentQuestionIndex];
    const processedAnswer = userAnswer.trim().toUpperCase();
    const processedCorrect = q.correct.toUpperCase();
    
    const qDiff = q.difficulty || 1;
    const totalDifficulty = currentLevelData.questions.reduce((sum, item) => sum + (item.difficulty || 1), 0);
    let baseDamage = (qDiff / totalDifficulty) * maxMonsterHP;
    
    let currentBuff = null;
    if (selectedBuffIndex !== null) currentBuff = activeBuffs[selectedBuffIndex];

    if (processedAnswer === processedCorrect) {
        playSound('hit');
        let finalDamage = baseDamage;
        let isCrit = false;
        let msg = "CHÍNH XÁC!!";
        
        // Hiệu ứng tấn công hero
        const heroDisplay = document.querySelector(".pixel-hero");
        const monsterDisplay = document.querySelector(".pixel-monster");
        heroDisplay?.classList.add("attacking-hero");
        
        // Hiệu ứng mũi tên/đạn
        const arrow = document.createElement("div");
        arrow.className = "arrow-effect";
        arrow.style.left = "30px";
        arrow.style.top = "80px";
        monsterDisplay?.parentElement?.appendChild(arrow);
        
        // Hiệu ứng boss nhận đòn + explosion
        setTimeout(() => {
            monsterDisplay?.classList.add("attacking-monster");
            createExplosion(monsterDisplay);
            flashScreen();
        }, 300);
        
        if (currentBuff) {
            if (currentBuff.id === 'BERSERK') { finalDamage *= 2; msg = `CUỒNG NỘ! (-${Math.round(finalDamage)} HP)`; }
            if (currentBuff.id === 'CRITICAL') { finalDamage *= 3; isCrit = true; msg = `BẠO KÍCH!!! (-${Math.round(finalDamage)} HP)`; }
            if (currentBuff.id === 'VAMPIRE') { heroHP = Math.min(100, heroHP + 30); msg += " [HÚT MÁU]"; }
            currentBuff.used = true;
        } else { msg += ` (-${Math.round(finalDamage)} HP)`; }

        monsterHP -= finalDamage;
        currentQuestionIndex++;
        
        // Hiển thị damage text lớn
        showDamageText(Math.round(finalDamage), monsterDisplay);
        
        updateHealthUI();
        
        // Xóa hiệu ứng
        setTimeout(() => {
            heroDisplay?.classList.remove("attacking-hero");
            monsterDisplay?.classList.remove("attacking-monster");
            arrow?.remove();
        }, 600);
        
        const qText = document.getElementById("question-text");
        qText.innerText = msg;
        if(isCrit) qText.classList.add("crit-effect"); else qText.style.color = "#4caf50";
    } else {
        let damageTaken = 25;
        let msg = "";
        
        // Hiệu ứng boss tấn công
        const monsterDisplay = document.querySelector(".pixel-monster");
        const heroDisplay = document.querySelector(".pixel-hero");
        monsterDisplay?.classList.add("attacking-monster");
        
        // Hiệu ứng lửa từ boss
        const fire = document.createElement("div");
        fire.className = "fire-effect";
        fire.style.left = "50%";
        fire.style.top = "50%";
        fire.style.transform = "translate(-50%, -50%)";
        monsterDisplay?.parentElement?.appendChild(fire);
        
        createFireParticles(monsterDisplay);
        
        if (currentBuff) {
            if (currentBuff.id === 'LUCKY') { damageTaken = 0; playSound('win'); msg = "MAY MẮN! NÉ ĐÒN HOÀN TOÀN!"; }
            else if (currentBuff.id === 'IRONCLAD') { damageTaken *= 0.2; playSound('miss'); msg = `GIÁP SẮT! (-${damageTaken} HP)`; }
            else { playSound('miss'); msg = `SAI RỒI! (-${damageTaken} HP) [Mất Buff]`; }
            currentBuff.used = true;
        } else { playSound('miss'); msg = `SAI RỒI! (-${damageTaken} HP)`; }
        
        heroHP -= damageTaken;
        
        // Hiệu ứng hero nhận đòn + explosion
        setTimeout(() => {
            heroDisplay?.classList.add("attacking-hero");
            createExplosion(heroDisplay);
            if(damageTaken > 0) flashScreen("#ff0000");
        }, 300);
        
        // Hiển thị damage text
        if(damageTaken > 0) showDamageText(Math.round(damageTaken), heroDisplay);
        
        // Xóa hiệu ứng
        setTimeout(() => {
            monsterDisplay?.classList.remove("attacking-monster");
            heroDisplay?.classList.remove("attacking-hero");
            fire?.remove();
        }, 600);
        
        shakeScreen();
        const qText = document.getElementById("question-text");
        qText.innerText = msg;
        qText.style.color = damageTaken === 0 ? "#00e5ff" : "#d32f2f";
        updateHealthUI();
    }
    selectedBuffIndex = null;
    renderBuffs();
    const btns = document.querySelectorAll(".player-actions button");
    btns.forEach(b => b.disabled = true);

    if (heroHP <= 0) gameOver();
    else setTimeout(() => { if (monsterHP > 1) loadQuestion(); else levelVictory(); }, 1500);
}

function levelVictory() {
    playSound('win');
    document.getElementById("monster-hp").style.width = "0%";
    document.getElementById("question-text").innerText = "CHIẾN THẮNG!";
    const monsterDisplay = document.querySelector(".pixel-monster");
    monsterDisplay.innerHTML = "🏳️";
    currentLevelData.completed = true;
    document.getElementById("btn-back-map").classList.remove("hidden");
    document.querySelector(".player-actions").innerHTML = "";

    if(window.saveLevelProgress) window.saveLevelProgress(currentMapId, currentLevelData.id);
}

// CÁC HÀM TIỆN ÍCH (Gắn vào window cho chắc chắn)
window.togglePause = function() {
    const modal = document.getElementById("pause-modal");
    if(modal) modal.classList.toggle("hidden");
}
window.restartLevel = function() { window.togglePause(); window.startBattle(currentLevelData); }
window.goHome = function() { window.location.href = 'index.html'; }
window.backToMap = function() {
    document.getElementById("battle-screen").classList.add("hidden");
    document.getElementById("map-screen").classList.remove("hidden");
    const buffUI = document.getElementById("buff-ui");
    if(buffUI) buffUI.remove(); 
    // Gọi lại initMap để cập nhật trạng thái mới
    if(typeof window.currentMapLevels !== 'undefined') window.initMap(window.currentMapLevels, currentMapId);
}
function updateHealthUI() {
    document.getElementById("hero-hp").style.width = `${Math.max(0, heroHP)}%`;
    const monsterPercent = (monsterHP / maxMonsterHP) * 100;
    document.getElementById("monster-hp").style.width = `${Math.max(0, monsterPercent)}%`;
    
    // Hiển thị số máu
    const heroHpText = document.getElementById("hero-hp-text");
    const monsterHpText = document.getElementById("monster-hp-text");
    
    if(heroHpText) heroHpText.innerText = `${Math.max(0, heroHP)}/100`;
    if(monsterHpText) monsterHpText.innerText = `${Math.max(0, Math.round(monsterHP))}/${maxMonsterHP}`;
}
function gameOver() {
    document.getElementById("question-text").innerText = "GAME OVER...";
    const heroDisplay = document.querySelector(".pixel-hero");
    if(heroDisplay) heroDisplay.innerHTML = "💀";
    document.getElementById("btn-back-map").classList.remove("hidden");
    document.querySelector(".player-actions").innerHTML = "";
}
function shakeScreen() {
    const screen = document.body;
    screen.classList.add("shake-screen");
    setTimeout(() => { screen.classList.remove("shake-screen"); }, 500);
}
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
    osc.connect(g); g.connect(audioCtx.destination); const now = audioCtx.currentTime;
    if (type === 'hit') { osc.type='square'; osc.frequency.setValueAtTime(400,now); osc.frequency.exponentialRampToValueAtTime(1000,now+0.1); g.gain.setValueAtTime(0.1,now); g.gain.exponentialRampToValueAtTime(0.01,now+0.1); osc.start(now); osc.stop(now+0.1); }
    else if (type === 'miss') { osc.type='sawtooth'; osc.frequency.setValueAtTime(150,now); osc.frequency.linearRampToValueAtTime(50,now+0.3); g.gain.setValueAtTime(0.1,now); g.gain.linearRampToValueAtTime(0.01,now+0.3); osc.start(now); osc.stop(now+0.3); }
    else if (type === 'win') { playNote(523.25,0,0.1); playNote(659.25,0.1,0.1); playNote(783.99,0.2,0.2); }
}
function playNote(f,s,d){const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.1,audioCtx.currentTime+s);g.gain.linearRampToValueAtTime(0,audioCtx.currentTime+s+d);o.start(audioCtx.currentTime+s);o.stop(audioCtx.currentTime+s+d);}

// --- HIỆU ỨNG HOÀNH TRÁNG ---
function createExplosion(element) {
    if(!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Tạo flash effect
    for(let i = 0; i < 12; i++) {
        const particle = document.createElement("div");
        particle.style.position = "fixed";
        particle.style.left = x + "px";
        particle.style.top = y + "px";
        particle.style.width = "20px";
        particle.style.height = "20px";
        particle.style.background = `hsl(${Math.random() * 60 + 0}, 100%, ${Math.random() * 50 + 50}%)`; // Màu vàng-cam-đỏ
        particle.style.borderRadius = "50%";
        particle.style.pointerEvents = "none";
        particle.style.zIndex = "999";
        particle.style.animation = `explosion-burst 0.8s ease-out forwards`;
        particle.style.setProperty("--tx", (Math.random() - 0.5) * 200 + "px");
        particle.style.setProperty("--ty", (Math.random() - 0.5) * 200 + "px");
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 800);
    }
}

function createFireParticles(element) {
    if(!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Tạo particle lửa
    for(let i = 0; i < 8; i++) {
        const fire = document.createElement("div");
        fire.style.position = "fixed";
        fire.style.left = x + "px";
        fire.style.top = y + "px";
        fire.style.width = "15px";
        fire.style.height = "15px";
        fire.style.background = `radial-gradient(circle, #FF6B00, #FF0000)`;
        fire.style.borderRadius = "50%";
        fire.style.pointerEvents = "none";
        fire.style.zIndex = "999";
        fire.style.filter = "blur(2px)";
        fire.style.animation = `fire-spread 1s ease-out forwards`;
        fire.style.setProperty("--spreadx", (Math.random() - 0.5) * 150 + "px");
        fire.style.setProperty("--spready", (Math.random() - 0.5) * 150 + "px");
        document.body.appendChild(fire);
        
        setTimeout(() => fire.remove(), 1000);
    }
}

function flashScreen(color = "#ffff00") {
    const flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100vw";
    flash.style.height = "100vh";
    flash.style.backgroundColor = color;
    flash.style.opacity = "0.7";
    flash.style.pointerEvents = "none";
    flash.style.zIndex = "998";
    flash.style.animation = "flash-fade 0.5s ease-out forwards";
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), 500);
}

function showDamageText(damage, element) {
    if(!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    const dmg = document.createElement("div");
    dmg.innerText = "-" + damage;
    dmg.style.position = "fixed";
    dmg.style.left = x + "px";
    dmg.style.top = y + "px";
    dmg.style.fontSize = "48px";
    dmg.style.fontWeight = "bold";
    dmg.style.color = "#ff0000";
    dmg.style.textShadow = "2px 2px 4px #000";
    dmg.style.pointerEvents = "none";
    dmg.style.zIndex = "999";
    dmg.style.animation = "damage-float 1.5s ease-out forwards";
    dmg.style.fontFamily = "'VT323', monospace";
    document.body.appendChild(dmg);
    
    setTimeout(() => dmg.remove(), 1500);
}

document.addEventListener("DOMContentLoaded", () => {
    const btnPause = document.getElementById("btn-pause-toggle");
    if(btnPause) btnPause.addEventListener("click", window.togglePause);
    const btnResume = document.getElementById("btn-resume");
    if(btnResume) btnResume.addEventListener("click", window.togglePause);
    const btnRestart = document.getElementById("btn-restart");
    if(btnRestart) btnRestart.addEventListener("click", window.restartLevel);
    const btnMenuMap = document.getElementById("btn-menu-map");
    if(btnMenuMap) btnMenuMap.addEventListener("click", window.backToMap);
    const btnMenuHome = document.getElementById("btn-menu-home");
    if(btnMenuHome) btnMenuHome.addEventListener("click", window.goHome);
    const btnBackMap = document.getElementById("btn-back-map");
    if(btnBackMap) btnBackMap.addEventListener("click", window.backToMap);
});