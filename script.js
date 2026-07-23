let allReciters = [];
let selectedReciter = null;

// أسماء سور القرآن الكريم كاملة مرتبة
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

// العناصر الرئيسية في الصفحة
const mainView = document.getElementById('mainView');
const detailsView = document.getElementById('detailsView');
const recitersContainer = document.getElementById('recitersContainer');
const surahContainer = document.getElementById('surahContainer');
const searchInput = document.getElementById('searchInput');
const searchSurahInput = document.getElementById('searchSurahInput');
const globalAudio = document.getElementById('globalAudio');
const floatingPlayer = document.getElementById('floatingPlayer');
const playingTitle = document.getElementById('playingTitle');

// 1. تحديث الساعة والتاريخ
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
    if (clockElement) {
        clockElement.textContent = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    }

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

// 2. إدارة عدد الزيارات والاستماعات
function initStats() {
    if (!localStorage.getItem('isListenResetDone')) {
        localStorage.setItem('totalListens', '0');
        localStorage.setItem('isListenResetDone', 'true');
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

// 3. جلب القراء من API
async function fetchReciters() {
    try {
        const response = await fetch('https://mp3quran.net/api/v3/reciters?language=ar');
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

// 4. عرض قائمة القراء
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
                    <h3>${reciter.name}</h3>
                    <p style="color: var(--text-muted); margin: 5px 0 0 0;">${reciter.repetition}</p>
                </div>
            </div>
            <button class="open-btn" style="width: 100%;"><i class="fa-solid fa-list-ul"></i> عرض السور والتحميل</button>
        `;
        recitersContainer.appendChild(card);
    });
}

// 5. فتح القارئ وتجهيز زر التحميل لضغط المصحف كاملاً في ملف واحد بضغطة زر
function openReciter(reciter) {
    selectedReciter = reciter;
    
    const nameEl = document.getElementById('currentReciterName');
    const styleEl = document.getElementById('currentStyle');
    
    if (nameEl) nameEl.textContent = reciter.name;
    if (styleEl) styleEl.textContent = reciter.repetition;

    const downloadBtn = document.getElementById('downloadFullBtn');
    if (downloadBtn) {
        downloadBtn.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i> تحميل المصحف كاملاً (ملف مضغوط ZIP)`;
        
        downloadBtn.onclick = async function(e) {
            e.preventDefault();
            
            if (!reciter.server || !reciter.surahList || reciter.surahList.length === 0) {
                alert("عذراً، روابط التحميل غير متوفرة لهذا القارئ.");
                return;
            }

            const originalText = downloadBtn.innerHTML;
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري إعداد وضغط المصحف...`;

            try {
                const zip = new JSZip();
                const folderName = `مصحف_${reciter.name}`;
                const folder = zip.folder(folderName);

                const promises = reciter.surahList.map(async (surahNum) => {
                    const surahName = surahsNames[surahNum - 1];
                    const padNum = surahNum.toString().padStart(3, '0');
                    const audioUrl = `${reciter.server}${padNum}.mp3`;
                    const fileName = `${padNum}_سورة_${surahName}.mp3`;

                    try {
                        const response = await fetch(audioUrl);
                        const blob = await response.blob();
                        folder.file(fileName, blob);
                    } catch (err) {
                        console.error(`خطأ في تحميل سورة ${surahName}`, err);
                    }
                });

                await Promise.all(promises);

                downloadBtn.innerHTML = `<i class="fa-solid fa-box-archive"></i> جاري حفظ الملف المضغوط...`;
                const content = await zip.generateAsync({ type: "blob" });

                const blobUrl = window.URL.createObjectURL(content);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;
                a.download = `${folderName}.zip`;
                document.body.appendChild(a);
                a.click();
                
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);

                downloadBtn.innerHTML = `<i class="fa-solid fa-check"></i> تم التحميل بنجاح!`;
                setTimeout(() => {
                    downloadBtn.innerHTML = originalText;
                    downloadBtn.disabled = false;
                }, 3000);

            } catch (err) {
                alert("حدث خطأ أثناء ضغط الملفات. حاول مرة أخرى.");
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }
        };
    }

    renderSurahs();
    if (mainView) mainView.classList.add('hidden');
    if (detailsView) detailsView.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function showMainView() {
    if (detailsView) detailsView.classList.add('hidden');
    if (mainView) mainView.classList.remove('hidden');
}

// 6. عرض السور مع دعم التحميل الفردي المباشر
function renderSurahs(filter = "") {
    if (!surahContainer || !selectedReciter) return;
    surahContainer.innerHTML = "";

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

// 7. تشغيل الصوت والاستماع لنهايته بالكامل لتحديث العداد
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

// 8. إدارة التعليقات
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

// 9. تبديل الثيم (بلاك / وايت)
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

// 10. البحث والتهيئة
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