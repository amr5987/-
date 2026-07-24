let allReciters = [];
let selectedReciter = null;

const surahsNames = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
    "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
    "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
    "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
    "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
    "التكوير", "الإنفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
    "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
    "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "المعون", "الكوثر", "الكافرون", "النصر",
    "المسد", "الإخلاص", "الفلق", "الناس"
];

const mainView = document.getElementById('mainView');
const detailsView = document.getElementById('detailsView');
const recitersContainer = document.getElementById('recitersContainer');
const surahContainer = document.getElementById('surahContainer');
const searchInput = document.getElementById('searchInput');
const searchSurahInput = document.getElementById('searchSurahInput');
const globalAudio = document.getElementById('globalAudio');
const floatingPlayer = document.getElementById('floatingPlayer');
const playingTitle = document.getElementById('playingTitle');

function updateClockAndDates() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';

    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, '0');

    const clockElement = document.getElementById('clockTime');
    if (clockElement) clockElement.textContent = `${formattedHours}:${minutes}:${seconds} ${ampm}`;

    const gregElement = document.getElementById('gregorianDate');
    if (gregElement) {
        const optionsGreg = { year: 'numeric', month: 'long', day: 'numeric' };
        gregElement.textContent = now.toLocaleDateString('ar-EG', optionsGreg);
    }

    const hijriElement = document.getElementById('hijriDate');
    if (hijriElement) {
        const optionsHijri = { year: 'numeric', month: 'long', day: 'numeric' };
        hijriElement.textContent = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', optionsHijri).format(now);
    }
}

function initStats() {
    if (!localStorage.getItem('totalListens')) {
        localStorage.setItem('totalListens', '0');
    }

    let visits = parseInt(localStorage.getItem('siteVisits') || '0');
    if (!localStorage.getItem('hasVisitedBefore')) {
        visits += 1;
        localStorage.setItem('siteVisits', visits);
        localStorage.setItem('hasVisitedBefore', 'true');
    }
    
    const viewsEl = document.getElementById('siteViews');
    if (viewsEl) viewsEl.textContent = visits;
    updateListenCountDisplay();
}

function incrementListenCount() {
    let listens = parseInt(localStorage.getItem('totalListens') || '0') + 1;
    localStorage.setItem('totalListens', listens);
    updateListenCountDisplay();
}

function updateListenCountDisplay() {
    let listens = localStorage.getItem('totalListens') || '0';
    const listenEl = document.getElementById('listenCount');
    if (listenEl) listenEl.textContent = listens;
}

async function fetchReciters() {
    try {
        const response = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar');
        const data = await response.json();
        
        allReciters = data.reciters.map(r => {
            const moshaf = r.moshaf[0];
            return {
                id: r.id,
                name: r.name,
                repetition: moshaf ? moshaf.name : "مصحف كامل",
                server: moshaf ? moshaf.server : "",
                surahList: moshaf ? moshaf.surah_list.split(',').map(Number) : []
            };
        }).filter(r => r.server !== "");

        displayReciters(allReciters);
    } catch (error) {
        if (recitersContainer) {
            recitersContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--accent-color);">حدث خطأ في تحميل القراء.</p>';
        }
    }
}

function displayReciters(list) {
    if (!recitersContainer) return;
    recitersContainer.innerHTML = '';
    
    const countBadge = document.getElementById('reciterCount');
    if (countBadge) countBadge.textContent = `${list.length} قارئ`;

    list.forEach(reciter => {
        const firstLetter = reciter.name.split(' ')[0][0] || 'ق';
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openReciter(reciter);

        card.innerHTML = `
            <div class="card-header">
                <div class="avatar">${firstLetter}</div>
                <div class="info">
                    <h3 style="margin:0; font-size:16px;">${reciter.name}</h3>
                    <p style="color: var(--text-muted); margin: 5px 0 0 0; font-size:13px;">${reciter.repetition}</p>
                </div>
            </div>
            <button class="open-btn" style="width: 100%;"><i class="fa-solid fa-list-ul"></i> عرض السور</button>
        `;
        recitersContainer.appendChild(card);
    });
}

function openReciter(reciter) {
    selectedReciter = reciter;
    const nameEl = document.getElementById('currentReciterName');
    const styleEl = document.getElementById('currentStyle');
    
    if (nameEl) nameEl.textContent = reciter.name;
    if (styleEl) styleEl.textContent = reciter.repetition;

    renderSurahs();
    if (mainView) mainView.classList.add('hidden');
    if (detailsView) detailsView.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function showMainView() {
    if (detailsView) detailsView.classList.add('hidden');
    if (mainView) mainView.classList.remove('hidden');
}

// دالة تحميل المصحف كاملاً بضغطة زر
function downloadFullQuranZip() {
    if (!selectedReciter || !selectedReciter.server) return;
    
    // إشعار للمستخدم بأن العمل جارٍ
    alert("سيتم فتح روابط تحميل السور تباعاً أو توجيهك لرابط الخادم المباشر للمصحف.");
    
    // رابط السيرفر الأساسي الذي يحتوي على المصحف كاملًا أو السورة الأولى كمثال سريع
    const serverUrl = selectedReciter.server;
    
    // فتح السيرفر في تبويب جديد ليتمكن المستخدم من تصفح مجلد السور أو تحميل ما يريده مباشرة
    window.open(serverUrl, '_blank');
}

function renderSurahs(filter = "") {
    if (!surahContainer || !selectedReciter) return;
    
    surahContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <button onclick="downloadFullQuranZip()" class="action-btn" style="padding: 15px 30px; font-size: 16px; background: linear-gradient(135deg, #00f3ff, #0051ff);">
                <i class="fa-solid fa-cloud-arrow-down"></i> تحميل المصحف كاملاً (سيرفر الشيخ)
            </button>
        </div>
    `;

    selectedReciter.surahList.forEach(surahNum => {
        const surahName = surahsNames[surahNum - 1];
        if (filter && !surahName.includes(filter)) return;

        const padNum = surahNum.toString().padStart(3, '0');
        const audioUrl = `${selectedReciter.server}${padNum}.mp3`;

        const item = document.createElement('div');
        item.className = 'surah-item';
        item.innerHTML = `
            <div class="surah-meta">
                <div class="surah-num">${surahNum}</div>
                <div>سورة ${surahName}</div>
            </div>
            <div class="surah-actions">
                <button class="action-btn play-btn" onclick="playAudio('${audioUrl}', '${surahName}')" title="تشغيل">
                    <i class="fa-solid fa-play"></i> تشغيل
                </button>
                <a href="${audioUrl}" target="_blank" download class="action-btn download-btn-icon" title="تحميل MP3">
                    <i class="fa-solid fa-download"></i>
                </a>
            </div>
        `;
        surahContainer.appendChild(item);
    });
}

function playAudio(url, surahName) {
    if (!globalAudio || !floatingPlayer) return;
    globalAudio.src = url;
    globalAudio.play();

    if (playingTitle) playingTitle.textContent = `${selectedReciter.name} - سورة ${surahName}`;
    floatingPlayer.classList.add('active');

    globalAudio.onended = function() {
        incrementListenCount();
    };
}

function loadComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    const comments = JSON.parse(localStorage.getItem('siteComments') || '[]');
    commentsList.innerHTML = '';

    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">لا توجد تعليقات بعد، كن أول من يعلق!</p>';
        return;
    }

    comments.forEach(c => {
        const item = document.createElement('div');
        item.className = 'comment-card';
        item.innerHTML = `
            <strong style="color: var(--text-main);">${c.user}</strong>
            <p style="margin-top: 5px; color: var(--text-muted);">${c.text}</p>
        `;
        commentsList.appendChild(item);
    });
}

function addComment() {
    const userInp = document.getElementById('commentUser');
    const textInp = document.getElementById('commentText');

    const user = userInp.value.trim();
    const text = textInp.value.trim();

    if (!user || !text) {
        alert("يرجى إدخال اسمك وتفاصيل التعليق!");
        return;
    }

    const comments = JSON.parse(localStorage.getItem('siteComments') || '[]');
    comments.unshift({ user, text });
    localStorage.setItem('siteComments', JSON.stringify(comments));

    userInp.value = '';
    textInp.value = '';
    loadComments();
}

function toggleTheme() {
    const body = document.body;
    const themeBtnIcon = document.getElementById('themeIcon');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
        if(themeBtnIcon) themeBtnIcon.className = "fa-solid fa-sun";
    } else {
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
        if(themeBtnIcon) themeBtnIcon.className = "fa-solid fa-moon";
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeBtnIcon = document.getElementById('themeIcon');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if(themeBtnIcon) themeBtnIcon.className = "fa-solid fa-moon";
    } else {
        if(themeBtnIcon) themeBtnIcon.className = "fa-solid fa-sun";
    }
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = allReciters.filter(r => r.name.toLowerCase().includes(term));
        displayReciters(filtered);
    });
}

if (searchSurahInput) {
    searchSurahInput.addEventListener('input', (e) => {
        renderSurahs(e.target.value.trim());
    });
}

loadTheme();
setInterval(updateClockAndDates, 1000);
updateClockAndDates();
initStats();
loadComments();
fetchReciters();
