// Lilith Life Organizer - Main Logic File

// ==================== STATE MANAGEMENT ====================
let currentLocalStorageKey = localStorage.getItem("lilith_active_slot") || "lilith_state";
let localDirectoryHandle = null;
let state = {
    user: {
        level: 1,
        xp: 0
    },
    notes: [],
    diary: {}, // Format: { "YYYY-MM-DD": { text: "...", mood: "..." } }
    ideas: [],
    quests: {
        daily: [],
        weekly: [],
        monthly: []
    },
    tasks: [],
    projects: [],
    goals: [],
    calendarEvents: [],
    habits: [], // Format: [ { id: "...", name: "...", tracking: { "YYYY-MM-DD": true/false } } ]
    finances: [],
    apps: []
};

// Seeding standard placeholder data to make it look premium on first run
const SEED_DATA = {
    user: { level: 1, xp: 0 },
    notes: [],
    diary: {},
    ideas: [],
    quests: {
        daily: [
            { id: "qd-1", text: "Fazer análise diária geral", xp: 30, completed: false },
            { id: "qd-2", text: "Registrar humor no diário", xp: 15, completed: false },
            { id: "qd-3", text: "Marcar pelo menos 1 hábito, escrever no diário pessoal, supervisionar Controle de Hábitos", xp: 20, completed: false }
        ],
        weekly: [
            { id: "qw-1", text: "Cumprir todas as metas de hábitos", xp: 80, completed: false },
            { id: "qw-2", text: "Completar 1 milestone de projeto", xp: 100, completed: false }
        ],
        monthly: [
            { id: "qm-1", text: "Revisar balanço financeiro mensal", xp: 200, completed: false },
            { id: "qm-2", text: "Atingir nível 3 de produtividade", xp: 250, completed: false }
        ]
    },
    tasks: [],
    projects: [],
    goals: [],
    calendarEvents: [],
    habits: [],
    finances: [],
    libraryItems: [],
    apps: [
        { id: "app-1", name: "Spotify", url: "https://open.spotify.com/", desc: "Trilha sonora para foco", type: "spotify", active: true, logo: "spotify.png" },
        { id: "app-2", name: "GitHub", url: "https://github.com/", desc: "Repositórios e códigos", type: "github", active: true, logo: "github.png" },
        { id: "app-5", name: "Phantom Troupe", url: "https://phantomtroupe.vercel.app", desc: "Projeto Phantom Troupe", type: "phantom", active: true, logo: "phantomtroupe.jpg" },
        { id: "app-6", name: "Sonoridade", url: "https://sonoridade-psi.vercel.app/", desc: "Plataforma Sonoridade", type: "sonoridade", active: true, logo: "sonoridade.png" },
        { id: "app-7", name: "Espaço Terapêutico", url: "https://paginaterapeutaanderson.vercel.app/espaco.html", desc: "Espaço Terapêutico", type: "espaco", active: true, logo: "espacoterapeutico.png" },
        { id: "app-8", name: "Estética X", url: "https://zero-delta-one.vercel.app", desc: "Estética X", type: "esteticax", active: true, logo: "esteticaX.png" },
        { id: "app-9", name: "Zero Signal", url: "#", desc: "Aplicativo", type: "zerosignal", active: true, logo: "zerosignal_logo.jpeg" },
        { id: "app-10", name: "Infinity Technology", url: "https://www.infinitytechnologyltda.com.br", desc: "Infinity Technology", type: "infinity", active: true, logo: "infinitytechnologylogo.png" },
        { id: "app-11", name: "WhatsApp", url: "https://web.whatsapp.com", desc: "Conectar ao WhatsApp Web", type: "whatsapp", active: true, logo: "whatsapp.png" },
        { id: "app-12", name: "SupaBase", url: "https://supabase.com/dashboard/org/losdimttlnvpikajsbqm", desc: "Banco de dados SupaBase", type: "supabase", active: true, logo: "supabase.png" },
        { id: "app-13", name: "Vercel Hospedagens", url: "https://vercel.com/infinitytechnologyltda-creates-projects", desc: "Vercel Hospedagens", type: "vercel", active: true, logo: "vercel.png" }
    ]
};

// Load State from LocalStorage
function loadState() {
    const rawState = localStorage.getItem(currentLocalStorageKey);
    if (rawState) {
        try {
            state = JSON.parse(rawState);
            if (state.themeColor) {
                localStorage.setItem("lilith_theme_color", state.themeColor);
            }
        } catch (e) {
            console.error("Erro ao parsear dados do localStorage. Usando padrões.", e);
            state = { ...SEED_DATA };
        }
    } else {
        state = { ...SEED_DATA };
        saveState();
    }
    // Migration: update quest qd-1 text
    if (state.quests && state.quests.daily) {
        const q = state.quests.daily.find(q => q.id === "qd-1");
        if (q && q.text === "Concluir 3 tarefas hoje") {
            q.text = "Fazer análise diária geral";
            saveState();
        }
        const q3 = state.quests.daily.find(q => q.id === "qd-3");
        if (q3 && q3.text === "Marcar pelo menos 1 hábito") {
            q3.text = "Marcar pelo menos 1 hábito, escrever no diário pessoal, supervisionar Controle de Hábitos";
            saveState();
        }
    }
    
    // Migration: update Central de Aplicações apps
    if (state.apps) {
        // Remove Notion and Google Calendar if present
        const originalLength = state.apps.length;
        state.apps = state.apps.filter(app => {
            const nameLower = app.name.toLowerCase();
            return nameLower !== "notion" && nameLower !== "google calendar";
        });

        const addAppIfMissing = (name, url, desc, type, logo) => {
            const existingIndex = state.apps.findIndex(app => app.name.toLowerCase() === name.toLowerCase());
            if (existingIndex === -1) {
                state.apps.push({
                    id: "app-" + Date.now() + Math.random().toString(36).substr(2, 5),
                    name,
                    url,
                    desc,
                    type,
                    logo,
                    active: true
                });
            } else {
                // Update properties if they already exist, particularly the logo and type
                state.apps[existingIndex].logo = logo;
                state.apps[existingIndex].type = type;
                if (url !== "#") {
                    state.apps[existingIndex].url = url;
                }
            }
        };

        addAppIfMissing("Spotify", "https://open.spotify.com/", "Trilha sonora para foco", "spotify", "spotify.png");
        addAppIfMissing("GitHub", "https://github.com/", "Repositórios e códigos", "github", "github.png");
        addAppIfMissing("Phantom Troupe", "https://phantomtroupe.vercel.app", "Projeto Phantom Troupe", "phantom", "phantomtroupe.jpg");
        addAppIfMissing("Sonoridade", "https://sonoridade-psi.vercel.app/", "Plataforma Sonoridade", "sonoridade", "sonoridade.png");
        addAppIfMissing("Espaço Terapêutico", "https://paginaterapeutaanderson.vercel.app/espaco.html", "Espaço Terapêutico", "espaco", "espacoterapeutico.png");
        addAppIfMissing("Estética X", "https://zero-delta-one.vercel.app", "Estética X", "esteticax", "esteticaX.png");
        addAppIfMissing("Zero Signal", "#", "Aplicativo", "zerosignal", "zerosignal_logo.jpeg");
        addAppIfMissing("Infinity Technology", "https://www.infinitytechnologyltda.com.br", "Infinity Technology", "infinity", "infinitytechnologylogo.png");
        addAppIfMissing("WhatsApp", "https://web.whatsapp.com", "Conectar ao WhatsApp Web", "whatsapp", "whatsapp.png");
        addAppIfMissing("SupaBase", "https://supabase.com/dashboard/org/losdimttlnvpikajsbqm", "Banco de dados SupaBase", "supabase", "supabase.png");
        addAppIfMissing("Vercel Hospedagens", "https://vercel.com/infinitytechnologyltda-creates-projects", "Vercel Hospedagens", "vercel", "vercel.png");

        saveState();
    }
}

// Save State to LocalStorage
function saveState() {
    localStorage.setItem(currentLocalStorageKey, JSON.stringify(state));
    writeToLocalDirectory();
    const storageMode = localStorage.getItem("lilith_storage_mode") || "cloud";
    if (storageMode === "cloud" && supabaseClient && supabaseUser) {
        saveToSupabaseDebounced();
    }
}

async function writeToLocalDirectory() {
    if (!localDirectoryHandle) return;
    try {
        const fileHandle = await localDirectoryHandle.getFileHandle("lilith_database.json", { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(state, null, 2));
        await writable.close();
    } catch (err) {
        console.error("Failed to write to local directory:", err);
    }
}

// Gamification: Add XP
function addXP(amount) {
    state.user.xp += amount;
    // Level up calculation: e.g. Level * 100 XP is target
    let target = state.user.level * 100;
    while (state.user.xp >= target) {
        state.user.xp -= target;
        state.user.level += 1;
        target = state.user.level * 100;
        showLevelUpNotification(state.user.level);
    }
    saveState();
    updateUIElements();
}

function showLevelUpNotification(level) {
    showMagicAlert("🎉 Nível Up!", `Parabéns! Você subiu para o Nível ${level} de Produtividade! Continue completando quests.`);
}

// ==================== ROUTER & VIEWS ====================
let currentModule = "dashboard";
const ALL_NAV_MODULES = ["dashboard","notes","diary","ideas","whiteboard","quests","tasks","projects","goals","calendar","habits","library","finances","appcenter"];
let visitedModules = new Set(["dashboard"]);

function initRouter() {
    const menuItems = document.querySelectorAll(".menu-item");
    const visor = document.getElementById("menu-visor");
    const titles = {
        dashboard: "Painel Geral",
        notes: "Anotações",
        diary: "Diário Pessoal",
        ideas: "Insights & Ideias",
        whiteboard: "Quadro Negro",
        quests: "Quests & Missões",
        tasks: "Quadro de Tarefas",
        projects: "Projetos",
        goals: "Metas & Objetivos",
        calendar: "Calendário",
        habits: "Controle de Hábitos",
        library: "Biblioteca & Arquivos",
        finances: "Finanças Pessoais",
        appcenter: "Central de Aplicações"
    };

    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const mod = item.getAttribute("data-module");
            switchModule(mod, true); // Enable page transition animation
            
            // Close mobile menu if open
            document.getElementById("sidebar").classList.remove("mobile-open");
        });

        // Hover effects: Cyberpunk scramble visor text
        item.addEventListener("mouseenter", () => {
            const mod = item.getAttribute("data-module");
            const text = titles[mod] || "Lilith";
            scrambleText(visor, text.toUpperCase());
        });

        item.addEventListener("mouseleave", () => {
            const activeText = titles[currentModule] || "Lilith";
            scrambleText(visor, activeText.toUpperCase());
        });
    });

    // Mobile Sidebar toggle
    document.getElementById("mobile-toggle").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("mobile-open");
    });
}

function scrambleText(element, targetText) {
    if (!element) return;
    if (element.textContent === targetText) return;
    if (element.scrambleInterval) {
        clearInterval(element.scrambleInterval);
    }
    
    let frame = 0;
    const originalText = element.textContent;
    const targetLength = targetText.length;
    const maxLength = Math.max(originalText.length, targetLength);
    const CHARS = "01$%-+/\\?[]{}<>@#&*";
    
    element.scrambleInterval = setInterval(() => {
        let currentText = "";
        for (let i = 0; i < maxLength; i++) {
            if (i < frame) {
                if (i < targetLength) {
                    currentText += targetText[i];
                }
            } else {
                if (i < targetLength || i < originalText.length) {
                    currentText += CHARS[Math.floor(Math.random() * CHARS.length)];
                }
            }
        }
        element.textContent = currentText;
        frame += 1.5;
        
        if (frame >= maxLength) {
            element.textContent = targetText;
            clearInterval(element.scrambleInterval);
            element.scrambleInterval = null;
        }
    }, 30);
}

function switchModule(moduleName, useTransition = false) {
    if (useTransition && moduleName !== currentModule) {
        const overlay = document.getElementById("page-transition-overlay");
        if (overlay) {
            overlay.classList.add("active");
            setTimeout(() => {
                executeModuleSwitch(moduleName);
                setTimeout(() => {
                    overlay.classList.remove("active");
                }, 50);
            }, 200);
            return;
        }
    }
    executeModuleSwitch(moduleName);
}

function executeModuleSwitch(moduleName) {
    currentModule = moduleName;
    
    // Switch background video depending on active module
    const bgVideo = document.getElementById("bg-video");
    if (bgVideo) {
        const newSrc = (moduleName === "dashboard") ? "fundodashboard.mp4" : "angeldark.mp4";
        const currentSrc = bgVideo.getAttribute("src") || bgVideo.querySelector("source")?.getAttribute("src");
        if (currentSrc !== newSrc) {
            bgVideo.src = newSrc;
            const sourceEl = bgVideo.querySelector("source");
            if (sourceEl) sourceEl.src = newSrc;
            bgVideo.load();
            bgVideo.play().catch(err => console.log("Video auto-play interrupted:", err));
        }
    }
    
    // Toggle active menu class
    document.querySelectorAll(".menu-item").forEach(item => {
        if(item.getAttribute("data-module") === moduleName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Toggle panel visibility
    document.querySelectorAll(".module-panel").forEach(panel => {
        if(panel.getAttribute("id") === `module-${moduleName}`) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });

    // Adjust Page Title
    const titles = {
        dashboard: "Painel Geral",
        notes: "Anotações",
        diary: "Diário Pessoal",
        ideas: "Insights & Ideias",
        whiteboard: "Quadro Negro",
        quests: "Quests & Missões",
        tasks: "Quadro de Tarefas",
        projects: "Projetos",
        goals: "Metas & Objetivos",
        calendar: "Calendário",
        habits: "Controle de Hábitos",
        library: "Biblioteca & Arquivos",
        finances: "Finanças Pessoais",
        appcenter: "Central de Aplicações"
    };
    document.getElementById("page-title").textContent = titles[moduleName] || "Lilith";

    // Update visor text
    const visor = document.getElementById("menu-visor");
    if (visor) {
        scrambleText(visor, (titles[moduleName] || "Lilith").toUpperCase());
    }

    // Setup "+ Nova Ação" behavior
    setupGlobalActionBtn(moduleName);

    // Specific Module Inits
    if(moduleName === "whiteboard") {
        initWhiteboard();
    } else if(moduleName === "calendar") {
        renderCalendar();
    }

    renderModuleContent(moduleName);

    // Track visited modules for "Fazer análise diária geral" quest
    visitedModules.add(moduleName);
    checkDailyAnalysisQuest();
    checkDailyHabitsQuest();
}

function checkDailyAnalysisQuest() {
    const quest = state.quests.daily.find(q => q.id === "qd-1");
    if (!quest || quest.completed) return;
    const allVisited = ALL_NAV_MODULES.every(m => visitedModules.has(m));
    if (allVisited) {
        quest.completed = true;
        addXP(quest.xp);
        showMagicAlert("🏆 Quest Concluída!", "Você visitou todas as páginas! 'Fazer análise diária geral' completa. +" + quest.xp + " XP!");
        renderQuests();
        saveState();
    }
}

function checkDailyHabitsQuest() {
    const quest = state.quests.daily.find(q => q.id === "qd-3");
    if (!quest || quest.completed) return;

    const todayStr = getTodayString();
    
    // 1. Escrever no diário pessoal
    const wroteDiary = !!state.diary[todayStr];
    
    // 2. Fazer algo em Finanças Pessoais (transaction exists with today's date)
    const didFinance = state.finances.some(f => f.date === todayStr);

    // 3. Marcar pelo menos 1 hábito
    const markedHabit = state.habits.some(h => h.tracking && h.tracking[todayStr]);

    // 4. Supervisionar Controle de Hábitos (visited the habits module)
    const visitedHabits = visitedModules.has("habits");

    if (wroteDiary && didFinance && markedHabit && visitedHabits) {
        quest.completed = true;
        addXP(quest.xp);
        showMagicAlert("🏆 Quest Concluída!", "Quest 'Marcar pelo menos 1 hábito, escrever no diário pessoal, supervisionar Controle de Hábitos' concluída! +" + quest.xp + " XP!");
        renderQuests();
        saveState();
    }
}

// Global action button context changes
function setupGlobalActionBtn(moduleName) {
    const btn = document.getElementById("global-action-btn");
    const container = document.getElementById("header-action-container");
    const label = document.getElementById("global-action-text");
    
    // Default show
    container.style.display = "block";
    btn.onclick = null;

    switch(moduleName) {
        case "dashboard":
        case "tasks":
            label.textContent = "Nova Tarefa";
            btn.onclick = () => openModal("modal-tasks-overlay");
            break;
        case "notes":
            label.textContent = "Nova Anotação";
            btn.onclick = () => {
                document.getElementById("note-id-input").value = "";
                document.getElementById("note-form").reset();
                document.getElementById("note-modal-title").textContent = "Nova Anotação";
                openModal("modal-notes-overlay");
            };
            break;
        case "ideas":
            label.textContent = "Nova Ideia";
            btn.onclick = () => openModal("modal-ideas-overlay");
            break;
        case "quests":
            label.textContent = "Nova Quest";
            btn.onclick = () => {
                const text = prompt("Digite a descrição da sua quest diária customizada:");
                if(text) {
                    state.quests.daily.push({
                        id: "qd-" + Date.now(),
                        text: text,
                        xp: 20,
                        completed: false
                    });
                    saveState();
                    renderQuests();
                }
            };
            break;
        case "projects":
            label.textContent = "Novo Projeto";
            btn.onclick = () => {
                document.getElementById("project-id-input").value = "";
                document.getElementById("project-form").reset();
                document.getElementById("project-modal-title").textContent = "Novo Projeto";
                document.getElementById("project-submit-btn").textContent = "Criar Projeto";
                openModal("modal-projects-overlay");
            };
            break;
        case "goals":
            label.textContent = "Nova Meta";
            btn.onclick = () => openModal("modal-goals-overlay");
            break;
        case "habits":
            label.textContent = "Novo Hábito";
            btn.onclick = () => openModal("modal-habits-overlay");
            break;
        case "library":
            label.textContent = "Salvar Recurso";
            btn.onclick = () => openModal("modal-library-overlay");
            break;
        case "finances":
            label.textContent = "Nova Transação";
            btn.onclick = () => openModal("modal-finances-overlay");
            break;
        case "appcenter":
            label.textContent = "Nova Integração";
            btn.onclick = () => openModal("modal-appcenter-overlay");
            break;
        default:
            container.style.display = "none";
    }
}

// ==================== MODALS COMMON ====================
function openModal(id) {
    document.getElementById(id).classList.add("active");
}
function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

// Global hook for modal closing click on outer overlay
window.addEventListener("click", (e) => {
    if(e.target.classList.contains("modal-overlay")) {
        e.target.classList.remove("active");
    }
});


// ==================== MODULAR RENDERERS ====================

function renderModuleContent(moduleName) {
    switch(moduleName) {
        case "dashboard":
            renderDashboard();
            break;
        case "notes":
            renderNotes();
            break;
        case "diary":
            initDiary();
            break;
        case "ideas":
            renderIdeas();
            break;
        case "quests":
            renderQuests();
            break;
        case "tasks":
            renderTasks();
            break;
        case "projects":
            renderProjects();
            break;
        case "goals":
            renderGoals();
            break;
        case "habits":
            renderHabits();
            break;
        case "library":
            renderLibrary();
            break;
        case "finances":
            renderFinances();
            break;
        case "appcenter":
            renderAppCenter();
            break;
    }
    // Re-trigger Lucide icons render
    if(window.lucide) {
        lucide.createIcons();
    }
}

function updateUIElements() {
    // XP and levels
    const levelDisplay = document.getElementById("level-display");
    if(levelDisplay) levelDisplay.textContent = `Nível ${state.user.level}`;
    
    const dashLevel = document.getElementById("dash-level");
    if(dashLevel) dashLevel.textContent = state.user.level;

    const avatarCircle = document.getElementById("avatar-circle");
    if(avatarCircle && state.user.avatar) {
        avatarCircle.style.backgroundImage = `url(${state.user.avatar})`;
        avatarCircle.textContent = "";
    }

    const target = state.user.level * 100;
    const xpPct = (state.user.xp / target) * 100;
    const dashXpBar = document.getElementById("dash-xp-bar");
    if(dashXpBar) dashXpBar.style.width = `${xpPct}%`;

    const dashXpText = document.getElementById("dash-xp-text");
    if(dashXpText) dashXpText.textContent = `${state.user.xp} / ${target} XP`;

    // Pending tasks counter
    const pendingTasks = state.tasks.filter(t => !t.completed).length;
    const statPending = document.getElementById("stat-pending-tasks");
    if(statPending) statPending.textContent = pendingTasks;

    // Completed habits counter
    let completedHabits = 0;
    const todayStr = getTodayString();
    state.habits.forEach(h => {
        if(h.tracking && h.tracking[todayStr]) completedHabits++;
    });
    const statHabits = document.getElementById("stat-completed-habits");
    if(statHabits) statHabits.textContent = completedHabits;

    // Financial balance
    let income = 0;
    let expense = 0;
    state.finances.forEach(f => {
        if(f.type === "Receita") income += f.amount;
        else expense += f.amount;
    });
    const balance = income - expense;
    const statBalance = document.getElementById("stat-financial-balance");
    if(statBalance) {
        statBalance.textContent = formatBRL(balance);
        if(balance < 0) {
            statBalance.style.color = "var(--danger)";
        } else {
            statBalance.style.color = "var(--success)";
        }
    }
}

// 1. DASHBOARD
function renderDashboard() {
    updateUIElements();
    
    // Top 3 next tasks
    const tbody = document.getElementById("dash-tasks-list");
    tbody.innerHTML = "";
    
    const activeTasks = state.tasks.filter(t => !t.completed).slice(0, 3);
    if(activeTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-dim);">Nenhuma tarefa pendente. Divirta-se!</td></tr>`;
    } else {
        activeTasks.forEach(task => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <button class="habit-checkbox" onclick="toggleTaskStatus('${task.id}')">
                        <i data-lucide="check" style="width:12px; height:12px; display:none;"></i>
                    </button>
                </td>
                <td style="font-weight:600;">${task.title}</td>
                <td><span class="priority-badge ${task.priority.toLowerCase() === 'alta' ? 'high' : task.priority.toLowerCase() === 'média' ? 'medium' : 'low'}">${task.priority}</span></td>
                <td style="color:var(--text-muted); font-size:13px;">${formatDateString(task.date)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Top 3 recent notes
    const notesDiv = document.getElementById("dash-notes-list");
    notesDiv.innerHTML = "";
    const recentNotes = state.notes.slice(-3).reverse();
    if(recentNotes.length === 0) {
        notesDiv.innerHTML = `<div style="text-align:center; color: var(--text-dim); padding: 12px;">Nenhuma anotação criada.</div>`;
    } else {
        recentNotes.forEach(note => {
            const card = document.createElement("div");
            card.className = "note-card";
            card.style.padding = "14px";
            card.innerHTML = `
                <div class="note-header">
                    <span class="note-category">${note.category}</span>
                </div>
                <h4 class="note-title" style="font-size:14px; margin-top:4px;">${note.title}</h4>
                <p class="note-desc" style="-webkit-line-clamp: 2; font-size:12px; margin-top:2px;">${note.content}</p>
            `;
            notesDiv.appendChild(card);
        });
    }

    // Mini month calendar summary
    renderMiniCalendar();

    // Render goals widget
    renderDashboardGoals();
}

function renderDashboardGoals() {
    const container = document.getElementById("dash-goals-list");
    if(!container) return;
    container.innerHTML = "";

    const activeGoals = state.goals.slice(0, 3); // Get up to 3 goals
    if(activeGoals.length === 0) {
        container.innerHTML = `<div style="text-align:center; color: var(--text-dim); padding: 12px;">Nenhuma meta cadastrada.</div>`;
        return;
    }

    activeGoals.forEach(goal => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.flexDirection = "column";
        item.style.gap = "6px";
        item.style.padding = "10px";
        item.style.background = "var(--bg-card)";
        item.style.borderRadius = "var(--border-radius-md)";
        item.style.border = "1px solid var(--border-color)";

        item.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                ${goal.image ? `
                <div style="width: 48px; height: 48px; border-radius: var(--border-radius-sm); overflow:hidden; border:1px solid var(--border-color); flex-shrink:0;">
                    <img src="${goal.image}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                ` : `
                <div style="width: 48px; height: 48px; border-radius: var(--border-radius-sm); background:rgba(255,255,255,0.05); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i data-lucide="target" style="width:18px; height:18px; color:var(--text-muted);"></i>
                </div>
                `}
                <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                    <span style="font-size:13px; font-weight:600; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;" title="${goal.title}">${goal.title}</span>
                    <span style="font-size:11px; color:var(--text-dim);">${goal.type} • Alvo: ${formatDateString(goal.date)}</span>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; font-size:11px; margin-top:2px;">
                <div style="flex:1; height:4px; background:var(--bg-dark); border-radius:2px; overflow:hidden;">
                    <div style="width:${goal.progress}%; height:100%; background:linear-gradient(to right, var(--primary), var(--accent));"></div>
                </div>
                <span style="font-weight:700; color:var(--text-main); width:30px; text-align:right;">${goal.progress}%</span>
            </div>
        `;
        container.appendChild(item);
    });

    if(window.lucide) {
        lucide.createIcons({ attrs: { style: 'width:18px; height:18px; color:var(--text-muted);' } });
    }
}

function renderMiniCalendar() {
    const container = document.getElementById("dash-mini-calendar");
    if(!container) return;
    container.innerHTML = "";
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Add day headers
    const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    days.forEach(d => {
        const header = document.createElement("div");
        header.className = "calendar-day-label";
        header.style.fontSize = "10px";
        header.textContent = d;
        container.appendChild(header);
    });

    // Padding empty days
    for(let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day inactive";
        emptyCell.style.minHeight = "28px";
        emptyCell.style.aspectRatio = "1";
        container.appendChild(emptyCell);
    }

    // Days representation
    for(let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day";
        cell.style.minHeight = "28px";
        cell.style.aspectRatio = "1";
        cell.style.justifyContent = "center";
        cell.style.alignItems = "center";
        cell.style.padding = "0";
        cell.innerHTML = `<span class="day-number" style="font-size:11px;">${d}</span>`;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (d === now.getDate()) {
            cell.classList.add("today");
        }

        // Highlight tasks/events
        const dayTasks = state.tasks.filter(t => t.date === dateStr && !t.completed);
        const dayEvents = state.calendarEvents.filter(e => e.date === dateStr);
        if(dayTasks.length > 0 || dayEvents.length > 0) {
            cell.style.borderColor = "var(--primary)";
            cell.style.background = "rgba(212, 44, 117, 0.1)";
        }

        container.appendChild(cell);
    }
}

// 2. NOTES
function renderNotes() {
    const grid = document.getElementById("notes-grid-container");
    grid.innerHTML = "";
    
    const searchVal = document.getElementById("notes-search").value.toLowerCase();
    const filterCat = document.getElementById("notes-filter-category").value;

    const filtered = state.notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchVal) || note.content.toLowerCase().includes(searchVal);
        const matchesCat = filterCat === "" || note.category === filterCat;
        return matchesSearch && matchesCat;
    });

    if(filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:40px;">Nenhuma anotação encontrada. Crie uma nova clicando em "+ Nova Anotação".</div>`;
        return;
    }

    filtered.forEach(note => {
        const card = document.createElement("div");
        card.className = "note-card";
        card.innerHTML = `
            <div class="note-header">
                <span class="note-category">${note.category}</span>
                <button class="note-fav-btn ${note.favorite ? 'active' : ''}" onclick="toggleNoteFavorite('${note.id}')">
                    <i data-lucide="star"></i>
                </button>
            </div>
            <h3 class="note-title">${note.title}</h3>
            <p class="note-desc">${note.content}</p>
            <div class="note-footer">
                <span class="note-date">${formatDateString(note.date)}</span>
                <div class="note-actions">
                    <button class="note-action" onclick="editNote('${note.id}')" title="Editar"><i data-lucide="edit"></i></button>
                    <button class="note-action delete" onclick="deleteNote('${note.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById("notes-search").addEventListener("input", renderNotes);
document.getElementById("notes-filter-category").addEventListener("change", renderNotes);

document.getElementById("note-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const idInput = document.getElementById("note-id-input").value;
    const title = document.getElementById("note-title-input").value;
    const category = document.getElementById("note-category-input").value;
    const content = document.getElementById("note-content-input").value;
    
    if(idInput) {
        // Edit existing
        const note = state.notes.find(n => n.id === idInput);
        if(note) {
            note.title = title;
            note.category = category;
            note.content = content;
        }
    } else {
        // Create new
        const newNote = {
            id: "note-" + Date.now(),
            title,
            category,
            content,
            date: getTodayString(),
            favorite: false
        };
        state.notes.push(newNote);
        addXP(10); // Award XP
    }
    saveState();
    closeModal("modal-notes-overlay");
    renderNotes();
});

function toggleNoteFavorite(id) {
    const note = state.notes.find(n => n.id === id);
    if(note) {
        note.favorite = !note.favorite;
        saveState();
        renderNotes();
    }
}

function deleteNote(id) {
    if(confirm("Deseja realmente excluir esta anotação?")) {
        state.notes = state.notes.filter(n => n.id !== id);
        saveState();
        renderNotes();
    }
}

function editNote(id) {
    const note = state.notes.find(n => n.id === id);
    if(note) {
        document.getElementById("note-id-input").value = note.id;
        document.getElementById("note-title-input").value = note.title;
        document.getElementById("note-category-input").value = note.category;
        document.getElementById("note-content-input").value = note.content;
        
        document.getElementById("note-modal-title").textContent = "Editar Anotação";
        openModal("modal-notes-overlay");
    }
}

// 3. DIÁRIO PESSOAL
let selectedMoods = []; // Array of up to 3 selected moods
let currentDiaryCalendarDate = new Date();
let selectedDiaryDate = getTodayString();

function initDiary() {
    const dateInput = document.getElementById("diary-date-input");
    if(!dateInput.value) {
        dateInput.value = selectedDiaryDate;
    }
    
    // Set mood button handlers
    const moodBtns = document.querySelectorAll(".mood-btn");
    moodBtns.forEach(btn => {
        btn.onclick = () => {
            const mood = btn.getAttribute("data-mood");
            const index = selectedMoods.indexOf(mood);
            if (index > -1) {
                selectedMoods.splice(index, 1);
            } else {
                if (selectedMoods.length < 3) {
                    selectedMoods.push(mood);
                } else {
                    selectedMoods.shift();
                    selectedMoods.push(mood);
                }
            }
            updateMoodButtonsUI();
        };
    });

    // Calendar Navigation
    document.getElementById("diary-prev-month").onclick = (e) => {
        e.preventDefault();
        currentDiaryCalendarDate.setMonth(currentDiaryCalendarDate.getMonth() - 1);
        renderDiaryCalendar();
    };

    document.getElementById("diary-next-month").onclick = (e) => {
        e.preventDefault();
        currentDiaryCalendarDate.setMonth(currentDiaryCalendarDate.getMonth() + 1);
        renderDiaryCalendar();
    };

    // Load initial date
    loadDiaryForDate(selectedDiaryDate);
    renderDiaryCalendar();
    renderDiaryHistory();
}

function updateMoodButtonsUI() {
    const moodBtns = document.querySelectorAll(".mood-btn");
    moodBtns.forEach(btn => {
        btn.classList.remove("selected-1", "selected-2", "selected-3");
        const mood = btn.getAttribute("data-mood");
        const idx = selectedMoods.indexOf(mood);
        if (idx === 0) {
            btn.classList.add("selected-1");
        } else if (idx === 1) {
            btn.classList.add("selected-2");
        } else if (idx === 2) {
            btn.classList.add("selected-3");
        }
    });
}

function renderDiaryCalendar() {
    const grid = document.getElementById("diary-calendar-days");
    if(!grid) return;
    grid.innerHTML = "";

    const year = currentDiaryCalendarDate.getFullYear();
    const month = currentDiaryCalendarDate.getMonth();

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    document.getElementById("diary-calendar-month-year").textContent = `${monthNames[month]} ${year}`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    // Fill blanks
    for(let i = 0; i < firstDayIndex; i++) {
        const cell = document.createElement("div");
        cell.className = "diary-calendar-day inactive";
        grid.appendChild(cell);
    }

    const todayStr = getTodayString();

    // Populate month days
    for(let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("div");
        cell.className = "diary-calendar-day";
        cell.textContent = d;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        if (dateStr === todayStr) {
            cell.classList.add("today");
        }
        if (dateStr === selectedDiaryDate) {
            cell.classList.add("selected");
        }
        if (state.diary[dateStr]) {
            cell.classList.add("has-entry");
        }

        cell.onclick = () => {
            selectedDiaryDate = dateStr;
            document.getElementById("diary-date-input").value = dateStr;
            document.getElementById("diary-selected-date-label").textContent = `Dia Selecionado: ${formatDateString(dateStr)}`;
            
            renderDiaryCalendar();
            loadDiaryForDate(dateStr);
        };

        grid.appendChild(cell);
    }
}

function loadDiaryForDate(dateStr) {
    const entry = state.diary[dateStr];
    const textInput = document.getElementById("diary-content-input");
    
    selectedDiaryDate = dateStr;
    document.getElementById("diary-date-input").value = dateStr;
    document.getElementById("diary-selected-date-label").textContent = `Dia Selecionado: ${formatDateString(dateStr)}`;

    selectedMoods = [];

    if(entry) {
        textInput.value = entry.text;
        if (entry.moods && Array.isArray(entry.moods)) {
            selectedMoods = [...entry.moods];
        } else if (entry.mood) {
            selectedMoods = [entry.mood];
        }
    } else {
        textInput.value = "";
    }
    
    updateMoodButtonsUI();
}

document.getElementById("diary-save-btn").onclick = () => {
    const dateStr = document.getElementById("diary-date-input").value;
    const text = document.getElementById("diary-content-input").value;
    
    if(selectedMoods.length === 0) {
        showMagicAlert("Aviso!", "Por favor, selecione pelo menos um humor para este registro.");
        return;
    }
    if(!text.trim()) {
        showMagicAlert("Aviso!", "Escreva uma reflexão antes de salvar.");
        return;
    }

    const existingEntry = state.diary[dateStr];
    const isNew = !existingEntry;
    
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nowTimestamp = `${formatDateString(getTodayString())} às ${timeStr}`;
    
    let createdAt = nowTimestamp;
    let updatedAt = nowTimestamp;
    
    if (existingEntry) {
        createdAt = existingEntry.createdAt || existingEntry.updatedAt || nowTimestamp;
        updatedAt = nowTimestamp;
    }

    state.diary[dateStr] = { 
        text, 
        moods: [...selectedMoods],
        mood: selectedMoods[0], // Keep for dashboard / compatibility
        createdAt: createdAt,
        updatedAt: updatedAt
    };
    saveState();
    
    if(isNew) {
        addXP(25);
    }
    
    showMagicAlert("✨ Diário Salvo!", "Seu diário e humor diários foram gravados com sucesso!");
    checkDailyHabitsQuest();
    renderDiaryCalendar();
    renderDiaryHistory();
};

function renderDiaryHistory() {
    const historyDiv = document.getElementById("diary-history-list");
    if(!historyDiv) return;
    historyDiv.innerHTML = "";
    
    const dates = Object.keys(state.diary).sort().reverse();
    if(dates.length === 0) {
        historyDiv.innerHTML = `<div style="font-size:12px; color: var(--text-dim); text-align:center; width:100%;">Nenhum registro anterior.</div>`;
        return;
    }

    const emojis = { excited: "🤩", happy: "😊", neutral: "😐", tired: "🥱", sad: "😢" };

    dates.forEach(dateStr => {
        const entry = state.diary[dateStr];
        const card = document.createElement("div");
        card.className = "diary-card-horizontal";
        
        let moodsArray = [];
        if (entry.moods && Array.isArray(entry.moods)) {
            moodsArray = entry.moods;
        } else if (entry.mood) {
            moodsArray = [entry.mood];
        }

        let emojisHTML = "";
        moodsArray.forEach((mood, idx) => {
            const emoji = emojis[mood] || "😐";
            emojisHTML += `<span class="diary-card-emoji-item mood-rank-${idx + 1}" title="${mood}">${emoji}</span>`;
        });

        // Separate "Criado em" and "Alterado em" timestamps
        const createdTime = entry.createdAt || entry.updatedAt || formatDateString(dateStr);
        const updatedTime = entry.updatedAt;
        
        let timestampText = `Criado em: ${createdTime}`;
        if (updatedTime && updatedTime !== createdTime) {
            timestampText = `Criado em: ${createdTime}<br>Alterado em: ${updatedTime}`;
        }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; font-weight:700; color:var(--text-main);">${formatDateString(dateStr)}</span>
                <div class="diary-card-emojis">${emojisHTML}</div>
            </div>
            <div style="font-size:12px; color:var(--text-muted); line-height:1.5; height:54px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; margin-top:4px;">
                ${entry.text}
            </div>
            <div style="font-size:10px; color:var(--text-dim); border-top:1px solid var(--border-color); padding-top:6px; margin-top:auto; line-height:1.4;">
                ${timestampText}
            </div>
        `;

        card.onclick = () => {
            selectedDiaryDate = dateStr;
            const entryDate = new Date(dateStr + "T00:00:00");
            currentDiaryCalendarDate = entryDate;
            renderDiaryCalendar();
            loadDiaryForDate(dateStr);
        };
        historyDiv.appendChild(card);
    });
}

// 4. INSIGHTS E IDEIAS
function renderIdeas() {
    const container = document.getElementById("ideas-grid-container");
    container.innerHTML = "";

    if(state.ideas.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:40px;">Sem ideias registradas. Capture seu próximo insight!</div>`;
        return;
    }

    state.ideas.forEach(idea => {
        const card = document.createElement("div");
        card.className = "note-card";
        card.innerHTML = `
            <div class="note-header">
                <span class="note-category" style="background: rgba(6, 182, 212, 0.15); color: var(--accent); border-color: rgba(6, 182, 212, 0.3);">${idea.theme}</span>
            </div>
            <h3 class="note-title">${idea.title}</h3>
            <p class="note-desc">${idea.content}</p>
            <div class="note-footer">
                <span class="note-date">${formatDateString(idea.date)}</span>
                <div class="note-actions">
                    <button class="note-action" onclick="convertIdeaToTask('${idea.id}')" title="Transformar em Tarefa" style="color:var(--accent);"><i data-lucide="check-square"></i></button>
                    <button class="note-action" onclick="convertIdeaToProject('${idea.id}')" title="Transformar em Projeto" style="color:var(--secondary);"><i data-lucide="folder-git"></i></button>
                    <button class="note-action delete" onclick="deleteIdea('${idea.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

document.getElementById("idea-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("idea-title-input").value;
    const theme = document.getElementById("idea-theme-input").value || "Geral";
    const content = document.getElementById("idea-content-input").value;
    
    state.ideas.push({
        id: "idea-" + Date.now(),
        title,
        theme,
        content,
        date: getTodayString()
    });
    
    addXP(15);
    saveState();
    closeModal("modal-ideas-overlay");
    document.getElementById("idea-form").reset();
    renderIdeas();
});

function deleteIdea(id) {
    if(confirm("Excluir esta ideia?")) {
        state.ideas = state.ideas.filter(i => i.id !== id);
        saveState();
        renderIdeas();
    }
}

function convertIdeaToTask(id) {
    const idea = state.ideas.find(i => i.id === id);
    if(idea) {
        // Autofill Task Modal
        document.getElementById("task-id-input").value = "";
        document.getElementById("task-title-input").value = `Executar: ${idea.title}`;
        document.getElementById("task-category-input").value = idea.theme;
        document.getElementById("task-priority-input").value = "Média";
        document.getElementById("task-date-input").value = getTodayString();
        
        // Setup specialized save trigger to remove idea upon conversion
        const form = document.getElementById("task-form");
        const originalSubmit = form.onsubmit;
        
        openModal("modal-tasks-overlay");
        
        form.onsubmit = (e) => {
            // Remove the converted idea
            state.ideas = state.ideas.filter(i => i.id !== id);
            saveState();
            // Let the standard task submission logic run (it listens to form submit normally, so we just trigger it or code it manually)
        };
    }
}

function convertIdeaToProject(id) {
    const idea = state.ideas.find(i => i.id === id);
    if(idea) {
        // Pre-fill Project Modal
        document.getElementById("project-title-input").value = idea.title;
        document.getElementById("project-category-input").value = idea.theme;
        document.getElementById("project-desc-input").value = idea.content;
        document.getElementById("project-steps-input").value = "Planejamento inicial\nDefinição do escopo\nExecução das tarefas\nEntrega final";
        
        openModal("modal-projects-overlay");
        
        const form = document.getElementById("project-form");
        form.onsubmit = (e) => {
            // Let the standard project submission run, then delete the idea
            setTimeout(() => {
                state.ideas = state.ideas.filter(i => i.id !== id);
                saveState();
                renderIdeas();
            }, 100);
        };
    }
}

// 5. WHITEBOARD (QUADRO NEGRO)
let canvas, ctx;
let drawing = false;
let brushColor = "#F7EFEF";
let brushSize = 5;
let tool = "draw"; // draw or erase
let whiteboardInitialized = false;
let wbUndoStack = [];
let wbRedoStack = [];
const WB_MAX_HISTORY = 50;
let shapeStartX = 0, shapeStartY = 0;
let shapePreviewData = null;

function wbSaveState() {
    if (!canvas || !ctx) return;
    wbUndoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (wbUndoStack.length > WB_MAX_HISTORY) wbUndoStack.shift();
    wbRedoStack = [];
}

function wbUndo() {
    if (!canvas || !ctx || wbUndoStack.length <= 1) return;
    wbRedoStack.push(wbUndoStack.pop());
    ctx.putImageData(wbUndoStack[wbUndoStack.length - 1], 0, 0);
}

function wbRedo() {
    if (!canvas || !ctx || wbRedoStack.length === 0) return;
    const state = wbRedoStack.pop();
    wbUndoStack.push(state);
    ctx.putImageData(state, 0, 0);
}

function initWhiteboard() {
    canvas = document.getElementById("whiteboard-canvas");
    ctx = canvas.getContext("2d");
    
    if (whiteboardInitialized) {
        if (canvas.width === 0) {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width || 800;
            canvas.height = 550;
            ctx.fillStyle = "#2E2A2D";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        return;
    }
    
    // Fit canvas to parent container size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = 550;
    
    // Draw canvas black background
    ctx.fillStyle = "#2E2A2D";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    wbUndoStack = [];
    wbRedoStack = [];
    wbSaveState();

    // Mouse events
    canvas.onmousedown = (e) => wbPointerDown(e.offsetX, e.offsetY);
    canvas.onmousemove = (e) => wbPointerMove(e.offsetX, e.offsetY);
    canvas.onmouseup = (e) => wbPointerUp(e.offsetX, e.offsetY);
    canvas.onmouseleave = (e) => { if(drawing) wbPointerUp(e.offsetX, e.offsetY); };

    // Touch events
    canvas.ontouchstart = (e) => {
        const t = e.touches[0];
        const r = canvas.getBoundingClientRect();
        wbPointerDown(t.clientX - r.left, t.clientY - r.top);
        e.preventDefault();
    };
    canvas.ontouchmove = (e) => {
        const t = e.touches[0];
        const r = canvas.getBoundingClientRect();
        wbPointerMove(t.clientX - r.left, t.clientY - r.top);
        e.preventDefault();
    };
    canvas.ontouchend = (e) => {
        wbPointerUp(shapeStartX, shapeStartY);
    };

    // Color dots selector
    const dots = document.querySelectorAll(".color-dot");
    dots.forEach(dot => {
        dot.onclick = () => {
            dots.forEach(d => d.classList.remove("active"));
            dot.classList.add("active");
            brushColor = dot.getAttribute("data-color");
            selectTool("draw");
        };
    });

    // Tool clickers
    document.getElementById("whiteboard-tool-draw").onclick = () => selectTool("draw");
    document.getElementById("whiteboard-tool-erase").onclick = () => selectTool("erase");
    document.getElementById("whiteboard-tool-text").onclick = () => selectTool("text");
    document.getElementById("whiteboard-tool-line").onclick = () => selectTool("line");
    document.getElementById("whiteboard-tool-rect").onclick = () => selectTool("rect");
    document.getElementById("whiteboard-tool-circle").onclick = () => selectTool("circle");
    document.getElementById("whiteboard-tool-triangle").onclick = () => selectTool("triangle");
    
    // Size changes
    document.getElementById("whiteboard-brush-size").onchange = (e) => {
        brushSize = parseInt(e.target.value);
    };

    // Clean canvas
    document.getElementById("whiteboard-clear-btn").onclick = () => {
        if(confirm("Deseja realmente limpar toda a lousa?")) {
            ctx.fillStyle = "#2E2A2D";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            wbSaveState();
        }
    };

    // Undo / Redo buttons
    document.getElementById("whiteboard-undo-btn").onclick = () => wbUndo();
    document.getElementById("whiteboard-redo-btn").onclick = () => wbRedo();

    // Keyboard shortcuts Ctrl+Z / Ctrl+Y
    document.addEventListener("keydown", (e) => {
        const whiteboardVisible = document.getElementById("module-whiteboard")?.classList.contains("active");
        if (!whiteboardVisible) return;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
            e.preventDefault();
            wbUndo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
            e.preventDefault();
            wbRedo();
        }
    });

    // Export image
    document.getElementById("whiteboard-export-btn").onclick = () => {
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `lilith-quadronegro-${getTodayString()}.png`;
        link.href = dataURL;
        link.click();
    };
    
    whiteboardInitialized = true;
}

const WB_ALL_TOOLS = ["draw", "erase", "text", "line", "rect", "circle", "triangle"];

function selectTool(selected) {
    tool = selected;
    WB_ALL_TOOLS.forEach(t => {
        const btn = document.getElementById("whiteboard-tool-" + t);
        if (btn) btn.style.borderColor = (t === selected) ? "var(--primary)" : "var(--border-color)";
    });
    // Show/hide text input bar
    const textBar = document.getElementById("wb-text-bar");
    if (textBar) {
        textBar.style.display = (selected === "text") ? "flex" : "none";
        if (selected === "text") {
            setTimeout(() => document.getElementById("wb-text-input")?.focus(), 50);
        }
    }
    // Change cursor based on tool
    if (canvas) {
        canvas.style.cursor = (selected === "text") ? "text" : "crosshair";
    }
}

// --- Unified pointer handlers ---
function wbPointerDown(x, y) {
    if (tool === "text") {
        // Text tool: read from inline input bar
        const textInput = document.getElementById("wb-text-input");
        const sizeSelect = document.getElementById("wb-text-size");
        const userText = textInput ? textInput.value : "";
        if (userText && userText.trim()) {
            const fontSize = sizeSelect ? parseInt(sizeSelect.value) : 28;
            ctx.font = `${fontSize}px 'Inter', sans-serif`;
            ctx.fillStyle = brushColor;
            ctx.textBaseline = "top";
            ctx.fillText(userText, x, y);
            wbSaveState();
        }
        return;
    }
    drawing = true;
    shapeStartX = x;
    shapeStartY = y;
    if (tool === "draw" || tool === "erase") {
        ctx.beginPath();
        ctx.moveTo(x, y);
    } else {
        // Save canvas state for rubber-band preview
        shapePreviewData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

function wbPointerMove(x, y) {
    if (!drawing) return;
    if (tool === "draw" || tool === "erase") {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = (tool === "draw") ? brushColor : "#2E2A2D";
        ctx.lineTo(x, y);
        ctx.stroke();
    } else {
        // Rubber-band preview for shapes
        ctx.putImageData(shapePreviewData, 0, 0);
        wbDrawShape(shapeStartX, shapeStartY, x, y);
    }
}

function wbPointerUp(x, y) {
    if (!drawing) return;
    if (tool === "draw" || tool === "erase") {
        ctx.closePath();
    } else {
        // Final shape render (restore clean state, then draw final)
        ctx.putImageData(shapePreviewData, 0, 0);
        wbDrawShape(shapeStartX, shapeStartY, x, y);
        shapePreviewData = null;
    }
    drawing = false;
    wbSaveState();
}

function wbDrawShape(x1, y1, x2, y2) {
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (tool) {
        case "line":
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.closePath();
            break;

        case "rect": {
            const w = x2 - x1;
            const h = y2 - y1;
            ctx.beginPath();
            ctx.strokeRect(x1, y1, w, h);
            ctx.closePath();
            break;
        }

        case "circle": {
            const rx = Math.abs(x2 - x1) / 2;
            const ry = Math.abs(y2 - y1) / 2;
            const cx = x1 + (x2 - x1) / 2;
            const cy = y1 + (y2 - y1) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.closePath();
            break;
        }

        case "triangle": {
            const midX = x1 + (x2 - x1) / 2;
            ctx.beginPath();
            ctx.moveTo(midX, y1);      // top center
            ctx.lineTo(x2, y2);        // bottom right
            ctx.lineTo(x1, y2);        // bottom left
            ctx.closePath();
            ctx.stroke();
            break;
        }
    }
}

// 6. QUESTS E MISSÕES
function renderQuests() {
    const renderList = (elementId, list) => {
        const div = document.getElementById(elementId);
        div.innerHTML = "";
        
        if(list.length === 0) {
            div.innerHTML = `<div style="font-size:13px; color: var(--text-dim); padding:10px;">Sem missões cadastradas.</div>`;
            return;
        }

        list.forEach(quest => {
            const item = document.createElement("div");
            item.className = `quest-item ${quest.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <div class="quest-info">
                    <span class="quest-label">${quest.text}</span>
                    <div class="quest-meta">
                        <span>Recompensa: <span class="quest-reward">+${quest.xp} XP</span></span>
                    </div>
                </div>
                <button class="habit-checkbox ${quest.completed ? 'checked' : ''}" onclick="toggleQuestStatus('${elementId}', '${quest.id}')">
                    ${quest.completed ? '<i data-lucide="check" style="width:12px; height:12px;"></i>' : ''}
                </button>
            `;
            div.appendChild(item);
        });
    };

    renderList("quests-daily-list", state.quests.daily);
    renderList("quests-weekly-list", state.quests.weekly);
    renderList("quests-monthly-list", state.quests.monthly);
}

function toggleQuestStatus(categoryElementId, questId) {
    let listName = "";
    if(categoryElementId.includes("daily")) listName = "daily";
    else if(categoryElementId.includes("weekly")) listName = "weekly";
    else listName = "monthly";

    const quest = state.quests[listName].find(q => q.id === questId);
    if(quest) {
        quest.completed = !quest.completed;
        if(quest.completed) {
            addXP(quest.xp); // Reward XP instantly
        } else {
            addXP(-quest.xp); // Deduct XP if unchecked
        }
        saveState();
        renderQuests();
    }
}

// 7. TAREFAS
function renderTasks() {
    const tbody = document.getElementById("tasks-table-body");
    const historyTbody = document.getElementById("tasks-history-table-body");
    
    if(!tbody || !historyTbody) return;
    
    tbody.innerHTML = "";
    historyTbody.innerHTML = "";

    // Active tasks filtering
    const search = document.getElementById("tasks-search").value.toLowerCase();
    const priority = document.getElementById("tasks-filter-priority").value;

    const activeTasks = state.tasks.filter(task => {
        if (task.completed) return false;
        const matchesSearch = task.title.toLowerCase().includes(search) || (task.category && task.category.toLowerCase().includes(search));
        const matchesPriority = priority === "" || task.priority === priority;
        return matchesSearch && matchesPriority;
    });

    // Completed tasks filtering
    const historySearch = document.getElementById("tasks-history-search").value.toLowerCase();
    const historyPriority = document.getElementById("tasks-history-filter-priority").value;

    const completedTasks = state.tasks.filter(task => {
        if (!task.completed) return false;
        const matchesSearch = task.title.toLowerCase().includes(historySearch) || (task.category && task.category.toLowerCase().includes(historySearch));
        const matchesPriority = historyPriority === "" || task.priority === historyPriority;
        return matchesSearch && matchesPriority;
    });

    // Active tasks rendering
    if(activeTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-dim); padding: 30px;">Nenhuma tarefa ativa encontrada.</td></tr>`;
    } else {
        activeTasks.forEach(task => {
            const tr = document.createElement("tr");
            tr.className = "task-row";
            tr.innerHTML = `
                <td>
                    <button class="habit-checkbox" onclick="toggleTaskStatus('${task.id}')">
                        <!-- Unchecked -->
                    </button>
                </td>
                <td style="font-weight:600;">${task.title}</td>
                <td style="color:var(--text-muted);">${task.category || "Geral"}</td>
                <td><span class="priority-badge ${task.priority.toLowerCase() === 'alta' ? 'high' : task.priority.toLowerCase() === 'média' ? 'medium' : 'low'}">${task.priority}</span></td>
                <td style="color:var(--text-muted); font-size:13px;">${formatDateString(task.date)}</td>
                <td style="text-align:right;">
                    <div class="note-actions" style="justify-content: flex-end;">
                        <button class="note-action" onclick="editTask('${task.id}')" title="Editar"><i data-lucide="edit"></i></button>
                        <button class="note-action delete" onclick="deleteTask('${task.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Completed tasks history rendering
    if(completedTasks.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-dim); padding: 30px;">Nenhuma tarefa concluída no histórico.</td></tr>`;
    } else {
        completedTasks.forEach(task => {
            const tr = document.createElement("tr");
            tr.className = "task-row";
            tr.innerHTML = `
                <td>
                    <button class="habit-checkbox checked" onclick="toggleTaskStatus('${task.id}')">
                        <i data-lucide="check" style="width:12px; height:12px;"></i>
                    </button>
                </td>
                <td style="font-weight:600; text-decoration: line-through; color: var(--text-dim);">${task.title}</td>
                <td style="color:var(--text-muted);">${task.category || "Geral"}</td>
                <td><span class="priority-badge ${task.priority.toLowerCase() === 'alta' ? 'high' : task.priority.toLowerCase() === 'média' ? 'medium' : 'low'}">${task.priority}</span></td>
                <td style="color:var(--text-muted); font-size:13px;">${formatDateString(task.date)}</td>
                <td style="text-align:right;">
                    <div class="note-actions" style="justify-content: flex-end;">
                        <button class="note-action" onclick="editTask('${task.id}')" title="Editar"><i data-lucide="edit"></i></button>
                        <button class="note-action delete" onclick="deleteTask('${task.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
                    </div>
                </td>
            `;
            historyTbody.appendChild(tr);
        });
    }
}

document.getElementById("tasks-search").addEventListener("input", renderTasks);
document.getElementById("tasks-filter-priority").addEventListener("change", renderTasks);
document.getElementById("tasks-history-search").addEventListener("input", renderTasks);
document.getElementById("tasks-history-filter-priority").addEventListener("change", renderTasks);

const clearHistoryBtn = document.getElementById("tasks-clear-history-btn");
if(clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
        if(confirm("Tem certeza que deseja apagar permanentemente todas as tarefas concluídas do histórico?")) {
            state.tasks = state.tasks.filter(t => !t.completed);
            saveState();
            renderTasks();
            updateUIElements();
        }
    });
}

document.getElementById("task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("task-id-input").value;
    const title = document.getElementById("task-title-input").value;
    const category = document.getElementById("task-category-input").value || "Geral";
    const priority = document.getElementById("task-priority-input").value;
    const date = document.getElementById("task-date-input").value;

    if(id) {
        const task = state.tasks.find(t => t.id === id);
        if(task) {
            task.title = title;
            task.category = category;
            task.priority = priority;
            task.date = date;
        }
    } else {
        state.tasks.push({
            id: "task-" + Date.now(),
            title,
            category,
            priority,
            date,
            completed: false
        });
        addXP(10);
    }
    saveState();
    closeModal("modal-tasks-overlay");
    document.getElementById("task-form").reset();
    
    // Check if we are inside converted task flow
    document.getElementById("task-form").onsubmit = null; 

    if(currentModule === "dashboard") renderDashboard();
    else renderTasks();
});

function toggleTaskStatus(id) {
    const task = state.tasks.find(t => t.id === id);
    if(task) {
        task.completed = !task.completed;
        if(task.completed) addXP(15);
        else addXP(-15);
        saveState();
        
        if(currentModule === "dashboard") renderDashboard();
        else renderTasks();
    }
}

function deleteTask(id) {
    if(confirm("Excluir esta tarefa?")) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveState();
        renderTasks();
    }
}

function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if(task) {
        document.getElementById("task-id-input").value = task.id;
        document.getElementById("task-title-input").value = task.title;
        document.getElementById("task-category-input").value = task.category;
        document.getElementById("task-priority-input").value = task.priority;
        document.getElementById("task-date-input").value = task.date;
        
        document.getElementById("task-modal-title").textContent = "Editar Tarefa";
        openModal("modal-tasks-overlay");
    }
}

// 8. PROJETOS
function renderProjects() {
    const container = document.getElementById("projects-grid-container");
    container.innerHTML = "";

    if(state.projects.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:40px;">Nenhum projeto ativo. Inicie um clicando em "+ Novo Projeto".</div>`;
        return;
    }

    state.projects.forEach(project => {
        // Calculate progress percentage
        const total = project.steps.length;
        const completed = project.steps.filter(s => s.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        const card = document.createElement("div");
        card.className = "project-card";
        
        let stepsHTML = "";
        project.steps.forEach((step, index) => {
            stepsHTML += `
                <div class="subtask-item ${step.completed ? 'completed' : ''}">
                    <input type="checkbox" id="step-${project.id}-${index}" ${step.completed ? 'checked' : ''} onchange="toggleProjectStep('${project.id}', ${index})">
                    <label for="step-${project.id}-${index}">${step.text}</label>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="project-meta">
                <span class="project-tag">${project.category}</span>
                <div class="note-actions">
                    <button class="note-action" onclick="editProject('${project.id}')" title="Editar"><i data-lucide="edit" style="width:16px; height:16px;"></i></button>
                    <button class="note-action delete" onclick="deleteProject('${project.id}')" title="Excluir"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
                </div>
            </div>
            <h3 class="section-title" style="margin-bottom:0;">${project.title}</h3>
            <p style="font-size:13px; color: var(--text-muted); margin-bottom:8px;">${project.desc || ""}</p>
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom: 4px;">
                <span>Progresso</span>
                <span>${percent}%</span>
            </div>
            <div class="project-progress-bar">
                <div class="project-progress-fill" style="width: ${percent}%;"></div>
            </div>
            <div class="project-subtasks">
                ${stepsHTML}
            </div>
        `;
        container.appendChild(card);
    });
}

document.getElementById("project-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("project-id-input").value;
    const title = document.getElementById("project-title-input").value;
    const category = document.getElementById("project-category-input").value || "Geral";
    const desc = document.getElementById("project-desc-input").value;
    const stepsText = document.getElementById("project-steps-input").value;
    
    // Parse steps from lines, preserving completed status if same text existed
    const existingProject = id ? state.projects.find(p => p.id === id) : null;
    const steps = stepsText.split("\n")
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => {
            const existingStep = existingProject ? existingProject.steps.find(s => s.text === t) : null;
            return { text: t, completed: existingStep ? existingStep.completed : false };
        });

    if (id) {
        // Edit existing project
        const project = state.projects.find(p => p.id === id);
        if (project) {
            project.title = title;
            project.category = category;
            project.desc = desc;
            project.steps = steps;
        }
    } else {
        // Create new project
        state.projects.push({
            id: "proj-" + Date.now(),
            title,
            category,
            desc,
            steps
        });
        addXP(30); // Project creation gives substantial XP
    }

    saveState();
    closeModal("modal-projects-overlay");
    document.getElementById("project-form").reset();
    renderProjects();
});

function toggleProjectStep(projectId, stepIndex) {
    const project = state.projects.find(p => p.id === projectId);
    if(project && project.steps[stepIndex] !== undefined) {
        project.steps[stepIndex].completed = !project.steps[stepIndex].completed;
        if(project.steps[stepIndex].completed) {
            addXP(10); // Reward for milestone
        } else {
            addXP(-10);
        }
        saveState();
        renderProjects();
    }
}

function deleteProject(id) {
    if(confirm("Tem certeza que deseja deletar este projeto?")) {
        state.projects = state.projects.filter(p => p.id !== id);
        saveState();
        renderProjects();
    }
}

function editProject(id) {
    const project = state.projects.find(p => p.id === id);
    if(project) {
        document.getElementById("project-id-input").value = project.id;
        document.getElementById("project-title-input").value = project.title;
        document.getElementById("project-category-input").value = project.category;
        document.getElementById("project-desc-input").value = project.desc || "";
        
        // Convert steps array back to newline separated string
        const stepsText = project.steps.map(s => s.text).join("\n");
        document.getElementById("project-steps-input").value = stepsText;
        
        document.getElementById("project-modal-title").textContent = "Editar Projeto";
        document.getElementById("project-submit-btn").textContent = "Salvar Alterações";
        openModal("modal-projects-overlay");
    }
}

// 9. GOALS (METAS)
function renderGoals() {
    const container = document.getElementById("goals-list-container");
    container.innerHTML = "";

    const filterVal = document.getElementById("goals-filter-type").value;
    const filtered = state.goals.filter(goal => filterVal === "" || goal.type === filterVal);

    if(filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center; color: var(--text-dim); padding: 40px;">Nenhuma meta cadastrada para este período.</div>`;
        return;
    }

    filtered.forEach(goal => {
        const card = document.createElement("div");
        card.className = "goal-card";
        card.innerHTML = `
            ${goal.image ? `
            <div class="goal-image-container" style="width: 100%; height: 140px; overflow: hidden; border-radius: var(--border-radius-md); margin-bottom: 8px; border: 1px solid var(--border-color);">
                <img src="${goal.image}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            ` : ''}
            <div class="goal-header">
                <span class="goal-type">${goal.type}</span>
                <span style="font-size:12px; color: var(--text-muted);">Alvo: ${formatDateString(goal.date)}</span>
            </div>
            <h3 class="section-title" style="margin-bottom:0px; display:flex; justify-content:space-between; align-items:center;">
                ${goal.title}
                <button class="note-action delete" onclick="deleteGoal('${goal.id}')" title="Excluir"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
            </h3>
            <div class="goal-slider-container">
                <input type="range" class="goal-slider" min="0" max="100" value="${goal.progress}" onchange="updateGoalProgress('${goal.id}', this.value)">
                <span style="font-weight:700; width:45px; text-align:right;">${goal.progress}%</span>
            </div>
        `;
        container.appendChild(card);
    });
}

document.getElementById("goals-filter-type").addEventListener("change", renderGoals);

document.getElementById("goal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("goal-title-input").value;
    const type = document.getElementById("goal-type-input").value;
    const date = document.getElementById("goal-date-input").value;
    const fileInput = document.getElementById("goal-image-input");

    const saveGoal = (imageSrc = "") => {
        state.goals.push({
            id: "goal-" + Date.now(),
            title,
            type,
            date,
            progress: 0,
            image: imageSrc
        });

        addXP(15);
        saveState();
        closeModal("modal-goals-overlay");
        document.getElementById("goal-form").reset();
        renderGoals();
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            saveGoal(evt.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveGoal("");
    }
});

function updateGoalProgress(id, val) {
    const goal = state.goals.find(g => g.id === id);
    if(goal) {
        const oldVal = goal.progress;
        goal.progress = parseInt(val);
        
        // Award XP if completed
        if(goal.progress === 100 && oldVal < 100) {
            addXP(50); // Massive XP for finishing goal!
            showMagicAlert("🏆 Meta Concluída!", `Excelente! Você atingiu 100% na meta: "${goal.title}" e ganhou +50 XP!`);
        }
        saveState();
        renderGoals();
    }
}

function deleteGoal(id) {
    if(confirm("Excluir esta meta?")) {
        state.goals = state.goals.filter(g => g.id !== id);
        saveState();
        renderGoals();
    }
}

// 10. CALENDÁRIO COMPLETO
let currentCalendarDate = new Date();

function renderCalendar() {
    const grid = document.getElementById("calendar-days-grid");
    if(!grid) return;
    grid.innerHTML = "";

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    document.getElementById("calendar-month-year").textContent = `${monthNames[month]} ${year}`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    // Fill blank cells from previous month
    for(let i = 0; i < firstDayIndex; i++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day inactive";
        grid.appendChild(cell);
    }

    // Populate active days
    const today = new Date();
    for(let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day";
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add("today");
        }

        let eventsHTML = "";
        
        // Find tasks scheduled on this day
        const dayTasks = state.tasks.filter(t => t.date === dateStr);
        dayTasks.forEach(task => {
            eventsHTML += `<span class="event-dot task" title="${task.title}">${task.completed ? '✓ ' : ''}${task.title}</span>`;
        });

        // Find calendar manual events on this day
        const dayEvents = state.calendarEvents.filter(e => e.date === dateStr);
        dayEvents.forEach(ev => {
            eventsHTML += `<span class="event-dot event" title="${ev.title}">${ev.title}</span>`;
        });

        cell.innerHTML = `
            <span class="day-number">${d}</span>
            <div class="day-events">${eventsHTML}</div>
        `;
        
        cell.onclick = () => addCalendarEventPrompt(dateStr);
        grid.appendChild(cell);
    }
}

document.getElementById("calendar-prev-month").onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
};
document.getElementById("calendar-next-month").onclick = () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
};

function addCalendarEventPrompt(dateStr) {
    document.getElementById("calendar-event-date-input").value = dateStr;
    document.getElementById("calendar-event-title-input").value = "";
    document.getElementById("calendar-event-label").textContent = `Adicionar evento para o dia (${formatDateString(dateStr)}):`;
    openModal("modal-calendar-overlay");
}

document.getElementById("calendar-event-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const dateStr = document.getElementById("calendar-event-date-input").value;
    const title = document.getElementById("calendar-event-title-input").value;

    if(title && title.trim()) {
        state.calendarEvents.push({
            id: "ev-" + Date.now(),
            title: title.trim(),
            date: dateStr,
            type: "event"
        });
        addXP(5);
        saveState();
        closeModal("modal-calendar-overlay");
        
        if (currentModule === "calendar") {
            renderCalendar();
        } else if (currentModule === "dashboard") {
            renderDashboard();
        }
    }
});

// 11. HÁBITOS (CONTROLE DE FREQUÊNCIA)
function renderHabits() {
    const tbody = document.getElementById("habits-table-body");
    const headerRow = document.getElementById("habits-header-row");
    tbody.innerHTML = "";
    
    // Clear and rebuild headers with past 7 days
    headerRow.innerHTML = `<th style="text-align: left; padding-left: 16px;">Hábito</th>`;
    
    const dates = [];
    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    
    for(let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = getFormatDateString(d);
        dates.push(dateStr);
        
        const th = document.createElement("th");
        th.style.width = "60px";
        th.innerHTML = `<span style="font-size:10px; color:var(--text-dim);">${weekdays[d.getDay()]}</span><br><span style="font-size:13px;">${d.getDate()}</span>`;
        headerRow.appendChild(th);
    }
    
    headerRow.innerHTML += `<th style="width: 100px;">Streak</th><th style="width: 80px;">Ações</th>`;

    if(state.habits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: var(--text-dim); padding: 30px;">Nenhum hábito cadastrado. Crie um clicando no botão no topo.</td></tr>`;
        return;
    }

    state.habits.forEach(habit => {
        const tr = document.createElement("tr");
        
        let colsHTML = `<td style="text-align: left; padding-left: 16px; font-weight:600;">${habit.name}</td>`;
        
        dates.forEach(dateStr => {
            const isChecked = habit.tracking && habit.tracking[dateStr];
            colsHTML += `
                <td>
                    <div class="habit-checkbox ${isChecked ? 'checked' : ''}" onclick="toggleHabitDay('${habit.id}', '${dateStr}')">
                        ${isChecked ? '<i data-lucide="check" style="width:12px; height:12px;"></i>' : ''}
                    </div>
                </td>
            `;
        });

        const streak = calculateStreak(habit);
        colsHTML += `
            <td><span class="streak-badge">🔥 ${streak} dias</span></td>
            <td>
                <button class="note-action delete" onclick="deleteHabit('${habit.id}')" title="Excluir"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
            </td>
        `;

        tr.innerHTML = colsHTML;
        tbody.appendChild(tr);
    });
}

document.getElementById("habit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("habit-title-input").value;
    
    state.habits.push({
        id: "hb-" + Date.now(),
        name,
        tracking: {}
    });

    addXP(10);
    saveState();
    closeModal("modal-habits-overlay");
    document.getElementById("habit-form").reset();
    renderHabits();
});

function toggleHabitDay(habitId, dateStr) {
    const habit = state.habits.find(h => h.id === habitId);
    if(habit) {
        if(!habit.tracking) habit.tracking = {};
        habit.tracking[dateStr] = !habit.tracking[dateStr];
        
        if(habit.tracking[dateStr]) {
            addXP(5); // Fast action points
        } else {
            addXP(-5);
        }
        
        saveState();
        checkDailyHabitsQuest();
        renderHabits();
    }
}

function calculateStreak(habit) {
    if(!habit.tracking) return 0;
    
    let streak = 0;
    let checkDate = new Date();
    
    while(true) {
        const dateStr = getFormatDateString(checkDate);
        if(habit.tracking[dateStr]) {
            streak++;
            // Check day before
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function deleteHabit(id) {
    if(confirm("Excluir este hábito?")) {
        state.habits = state.habits.filter(h => h.id !== id);
        saveState();
        renderHabits();
    }
}

// 12. BIBLIOTECA
function renderLibrary() {
    const container = document.getElementById("library-grid-container");
    container.innerHTML = "";

    const filterVal = document.getElementById("library-filter-category").value;

    // Initialize mock elements if empty
    if(!state.libraryItems) {
        state.libraryItems = [
            { id: "lib-1", title: "Planilha de Orçamento Familiar", category: "Documentos", url: "https://docs.google.com", notes: "Planilha compartilhada de controle financeiro do casal." },
            { id: "lib-2", title: "Dribbble Portfolio Inspo", category: "Links Úteis", url: "https://dribbble.com", notes: "Referências visuais e UI para novos designs." }
        ];
        saveState();
    }

    const libFiltered = state.libraryItems.filter(item => filterVal === "" || item.category === filterVal);

    if(libFiltered.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color: var(--text-dim); padding: 40px;">Biblioteca vazia. Adicione referências importantes.</div>`;
        return;
    }

    libFiltered.forEach(item => {
        const card = document.createElement("div");
        card.className = "library-card";
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div class="library-card-icon">
                    <i data-lucide="${item.category === 'Documentos' ? 'file-text' : item.category === 'Links Úteis' ? 'link' : 'book'}"></i>
                </div>
                <button class="note-action delete" onclick="deleteLibraryItem('${item.id}')" title="Excluir"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
            </div>
            <h3 class="section-title" style="margin-bottom:0px; font-size:16px;">${item.title}</h3>
            <span style="font-size:10px; text-transform:uppercase; color: var(--text-dim); font-weight:700;">${item.category}</span>
            <p style="font-size:12px; color: var(--text-muted); flex:1;">${item.notes || "Sem observações."}</p>
            ${item.url ? `<a href="${item.url}" target="_blank" class="library-link"><i data-lucide="external-link" style="width:12px; height:12px;"></i> Acessar Recurso</a>` : ''}
        `;
        container.appendChild(card);
    });
}

document.getElementById("library-filter-category").addEventListener("change", renderLibrary);

document.getElementById("library-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("library-title-input").value;
    const category = document.getElementById("library-category-input").value;
    const url = document.getElementById("library-url-input").value;
    const notes = document.getElementById("library-notes-input").value;

    if(!state.libraryItems) state.libraryItems = [];

    state.libraryItems.push({
        id: "lib-" + Date.now(),
        title,
        category,
        url,
        notes
    });

    addXP(10);
    saveState();
    closeModal("modal-library-overlay");
    document.getElementById("library-form").reset();
    renderLibrary();
});

function deleteLibraryItem(id) {
    if(confirm("Excluir item da biblioteca?")) {
        state.libraryItems = state.libraryItems.filter(item => item.id !== id);
        saveState();
        renderLibrary();
    }
}

// 13. FINANÇAS
function renderFinances() {
    updateUIElements(); // Ensure totals are updated in memory and dashboard cards
    
    // Total numbers calculations
    let totalIncome = 0;
    let totalExpense = 0;
    
    state.finances.forEach(item => {
        if(item.type === "Receita") {
            totalIncome += item.amount;
        } else {
            totalExpense += item.amount;
        }
    });

    document.getElementById("finance-total-income").textContent = formatBRL(totalIncome);
    document.getElementById("finance-total-expense").textContent = formatBRL(totalExpense);
    
    const balance = totalIncome - totalExpense;
    const balanceEl = document.getElementById("finance-net-balance");
    balanceEl.textContent = formatBRL(balance);
    if(balance < 0) {
        balanceEl.className = "stat-value amount-expense";
    } else {
        balanceEl.className = "stat-value amount-income";
    }

    // Ledger table list
    const tbody = document.getElementById("finance-ledger-body");
    tbody.innerHTML = "";

    if(state.finances.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-dim); padding: 30px;">Nenhuma movimentação registrada.</td></tr>`;
        return;
    }

    // Reverse sort transactions by date
    const sorted = [...state.finances].sort((a,b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="color:var(--text-muted); font-size:13px;">${formatDateString(item.date)}</td>
            <td style="font-weight:600;">${item.desc}</td>
            <td><span class="project-tag" style="background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--border-color);">${item.category}</span></td>
            <td><span class="priority-badge ${item.type === 'Receita' ? 'low' : 'high'}">${item.type === 'Receita' ? 'Entrada' : 'Saída'}</span></td>
            <td style="font-weight:700;" class="${item.type === 'Receita' ? 'amount-income' : 'amount-expense'}">${item.type === 'Receita' ? '+' : '-'} R$ ${item.amount.toFixed(2)}</td>
            <td style="text-align:right;">
                <button class="note-action delete" onclick="deleteTransaction('${item.id}')" title="Excluir"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById("finance-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const desc = document.getElementById("finance-desc-input").value;
    const type = document.getElementById("finance-type-input").value;
    const category = document.getElementById("finance-category-input").value;
    const amount = parseFloat(document.getElementById("finance-amount-input").value);
    const date = document.getElementById("finance-date-input").value;

    state.finances.push({
        id: "fin-" + Date.now(),
        desc,
        type,
        category,
        amount,
        date
    });

    addXP(10);
    saveState();
    checkDailyHabitsQuest();
    closeModal("modal-finances-overlay");
    document.getElementById("finance-form").reset();
    renderFinances();
});

function deleteTransaction(id) {
    if(confirm("Excluir esta transação financeira?")) {
        state.finances = state.finances.filter(f => f.id !== id);
        saveState();
        checkDailyHabitsQuest();
        renderFinances();
    }
}

// 14. CENTRAL DE APLICATIVOS
function renderAppCenter() {
    const container = document.getElementById("appcenter-grid-container");
    container.innerHTML = "";

    const todayStr = getTodayString();

    state.apps.forEach(app => {
        const tile = document.createElement("div");
        tile.className = "app-tile";
        tile.setAttribute("data-app-id", app.id);
        tile.style.cursor = "pointer";
        
        tile.onclick = (e) => {
            if (e.target.tagName.toLowerCase() !== 'button' && e.target.tagName.toLowerCase() !== 'a' && !e.target.closest('button') && !e.target.closest('a')) {
                selectAppForVisualizer(app.id, false);
            }
        };
        
        const wasAccessedToday = app.lastAccessedDate === todayStr;
        const ledHtml = `<div class="app-access-led ${wasAccessedToday ? 'accessed' : 'not-accessed'}" title="${wasAccessedToday ? 'Acessado hoje' : 'Não acessado hoje'}"></div>`;
        
        const logoHtml = app.logo 
            ? `<img src="${app.logo}" alt="${app.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: contain; display: block; background: rgba(255,255,255,0.05); padding: 4px; border: 1px solid rgba(255,255,255,0.1);">`
            : `<div class="app-icon app-${app.type || 'generic'}" style="font-size: 20px; font-weight:700;">${app.name[0]}</div>`;
            
        tile.innerHTML = `
            ${ledHtml}
            ${logoHtml}
            <h3 class="section-title" style="margin-bottom:0; font-size:16px;">${app.name}</h3>
            <p style="font-size:12px; color: var(--text-muted); flex:1;">${app.desc}</p>
            <span class="app-status ${app.active ? 'connected' : 'disconnected'}">${app.active ? 'Ativo' : 'Inativo'}</span>
            <div style="display:flex; gap:10px; width:100%; margin-top:8px;">
                <button class="action-btn-secondary" style="flex:1; padding:6px 0; font-size:12px; justify-content:center;" onclick="toggleAppStatus('${app.id}')">
                    ${app.active ? 'Desativar' : 'Ativar'}
                </button>
                <button class="action-btn" style="flex:1; padding:6px 0; font-size:12px; justify-content:center; box-shadow:none;" onclick="selectAppForVisualizer('${app.id}', true)">
                    Visualizar
                </button>
            </div>
        `;
        container.appendChild(tile);
    });
}

function selectAppForVisualizer(id, shouldOpenTab = false) {
    const app = state.apps.find(a => a.id === id);
    if (!app) return;

    document.querySelectorAll(".app-tile").forEach(tile => {
        tile.classList.remove("selected");
    });
    
    const activeTile = document.querySelector(`[data-app-id="${id}"]`);
    if (activeTile) {
        activeTile.classList.add("selected");
    }

    const titleEl = document.getElementById("app-visualizer-title");
    const externalLink = document.getElementById("app-visualizer-external");
    const reloadBtn = document.getElementById("app-visualizer-reload");
    const placeholder = document.getElementById("app-visualizer-placeholder");
    const iframeTemplate = document.getElementById("app-visualizer-iframe");
    const imageContainer = document.getElementById("app-visualizer-image-container");
    const assistedContainer = document.getElementById("app-visualizer-assisted");
    const videoEl = document.getElementById("app-visualizer-video");
    const videoControls = document.getElementById("app-visualizer-video-controls");

    titleEl.textContent = app.name;

    // Mark as accessed today
    const todayStr = getTodayString();
    if (app.lastAccessedDate !== todayStr) {
        app.lastAccessedDate = todayStr;
        saveState();
        
        // Update the led indicator class directly
        const led = activeTile ? activeTile.querySelector(".app-access-led") : null;
        if (led) {
            led.className = "app-access-led accessed";
            led.title = "Acessado hoje";
        }
    }

    // Hide all dynamically loaded app iframes
    document.querySelectorAll(".app-iframe").forEach(iframe => {
        iframe.style.display = "none";
    });
    if (iframeTemplate) {
        iframeTemplate.style.display = "none";
    }

    // Hide reload button by default
    if (reloadBtn) {
        reloadBtn.style.display = "none";
        reloadBtn.onclick = null;
    }

    const isSpecialApp = (
        app.type === "spotify" || app.type === "github" || app.type === "supabase" || app.type === "vercel" ||
        app.name.toLowerCase().includes("spotify") ||
        app.name.toLowerCase().includes("github") ||
        app.name.toLowerCase().includes("supabase") ||
        app.name.toLowerCase().includes("vercel")
    );

    if (isSpecialApp) {
        let matchedType = "spotify";
        if (app.type) {
            matchedType = app.type;
        } else {
            const nameLower = app.name.toLowerCase();
            if (nameLower.includes("spotify")) matchedType = "spotify";
            else if (nameLower.includes("github")) matchedType = "github";
            else if (nameLower.includes("supabase")) matchedType = "supabase";
            else if (nameLower.includes("vercel")) matchedType = "vercel";
        }

        // Initialize activeAppStreams if not present
        if (!window.activeAppStreams) {
            window.activeAppStreams = {};
        }

        // Open the app tab in a new window ONLY if explicitly requested (clicked "Visualizar")
        if (shouldOpenTab && app.url && app.url !== "#") {
            window.open(app.url, '_blank');
        }
        
        placeholder.style.display = "none";
        imageContainer.style.display = "none";

        // Check if there is an active running stream for this app in the background!
        const existingStream = window.activeAppStreams[matchedType];
        const isStreamValid = existingStream && existingStream.getVideoTracks().some(track => track.readyState === "live");

        if (isStreamValid) {
            // Already streaming this app! Show the live viewport directly
            assistedContainer.style.display = "none";
            videoEl.srcObject = existingStream;
            videoEl.muted = true; // Keep muted as audio is disabled
            videoEl.style.display = "block";
            videoEl.play().catch(console.error);
            videoControls.style.display = "block";
        } else {
            // No stream or stream was stopped/inactive
            videoEl.srcObject = null;
            videoEl.style.display = "none";
            videoControls.style.display = "none";
            assistedContainer.style.display = "block";
            
            renderAssistedScreen(matchedType, assistedContainer, app);
        }
        
        externalLink.href = app.url || "#";
        externalLink.style.display = "flex";
    } else {
        // Non-special apps (iframes or standard placeholders)
        if (videoEl) {
            videoEl.srcObject = null;
            videoEl.style.display = "none";
        }
        if (videoControls) {
            videoControls.style.display = "none";
        }
        imageContainer.style.display = "none";
        assistedContainer.style.display = "none";
        
        if (app.url && app.url !== "#") {
            // Look for existing iframe for this app
            let appIframe = document.querySelector(`.app-iframe[data-app-id="${app.id}"]`);
            if (!appIframe) {
                appIframe = document.createElement("iframe");
                appIframe.className = "app-iframe";
                appIframe.setAttribute("data-app-id", app.id);
                appIframe.src = app.url;
                appIframe.style.width = "100%";
                appIframe.style.height = "100%";
                appIframe.style.border = "none";
                appIframe.style.background = "white";
                appIframe.style.display = "none";
                const visualizerBody = document.querySelector(".app-visualizer-body");
                if (visualizerBody) {
                    visualizerBody.appendChild(appIframe);
                }
            }
            appIframe.style.display = "block";
            placeholder.style.display = "none";
            
            externalLink.href = app.url;
            externalLink.style.display = "flex";
            
            // Configure reload button for this iframe
            if (reloadBtn) {
                reloadBtn.style.display = "flex";
                reloadBtn.onclick = () => {
                    appIframe.src = appIframe.src;
                };
            }
        } else {
            placeholder.style.display = "flex";
            externalLink.style.display = "none";
        }
    }
}

function renderAssistedScreen(type, container, app) {
    container.innerHTML = `
        <div class="assisted-layout" style="padding: 48px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 24px; background: #07090b; min-height: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.04);">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); display: flex; align-items: center; justify-content: center; color: var(--primary); margin-bottom: 8px;">
                <i data-lucide="monitor-play" style="width: 32px; height: 32px;"></i>
            </div>
            
            <div style="max-width: 420px; display: flex; flex-direction: column; gap: 8px;">
                <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #fff;">Transmissão Remota - ${app.name}</h3>
                <p style="margin: 0; font-size: 13px; color: var(--text-muted); line-height: 1.6;">
                    Para visualizar e monitorar o <strong>${app.name}</strong> diretamente neste painel, clique no botão abaixo e selecione a aba aberta do navegador correspondente.
                </p>
            </div>

            <button class="action-btn tab-stream-btn" style="padding: 12px 24px; font-size: 14px; font-weight: 700; background: #ef4444; border: none; color: white; display: flex; align-items: center; gap: 10px; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3); transition: all 0.2s ease;">
                <i data-lucide="video" style="width: 18px; height: 18px;"></i>
                Iniciar Transmissão Remota
            </button>

            <div class="stream-error-message" style="display: none; padding: 12px 16px; border-radius: 8px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 12px; font-family: monospace; max-width: 400px; word-break: break-all; text-align: left;"></div>
        </div>
    `;

    lucide.createIcons({ attrs: { class: 'lucide' }, container: container });

    const streamBtn = container.querySelector(".tab-stream-btn");
    const errorEl = container.querySelector(".stream-error-message");
    const videoEl = document.getElementById("app-visualizer-video");
    const videoControls = document.getElementById("app-visualizer-video-controls");
    const stopStreamBtn = document.getElementById("app-visualizer-stop-stream");

    const stopStreamCapture = () => {
        if (window.activeAppStreams && window.activeAppStreams[type]) {
            window.activeAppStreams[type].getTracks().forEach(t => t.stop());
            delete window.activeAppStreams[type];
        }
        if (videoEl) {
            videoEl.srcObject = null;
            videoEl.style.display = "none";
        }
        if (videoControls) {
            videoControls.style.display = "none";
        }
        container.style.display = "block";
        if (errorEl) errorEl.style.display = "none";
    };

    streamBtn.onclick = () => {
        if (errorEl) errorEl.style.display = "none";

        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            if (errorEl) {
                errorEl.textContent = "Erro: O compartilhamento de tela não é suportado neste navegador ou requer uma conexão segura (HTTPS ou localhost).";
                errorEl.style.display = "block";
            }
            return;
        }

        navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
        }).then(stream => {
            if (!window.activeAppStreams) {
                window.activeAppStreams = {};
            }
            window.activeAppStreams[type] = stream;

            // Hide the helper card and display the live stream
            container.style.display = "none";
            videoEl.srcObject = stream;
            videoEl.muted = true;
            videoEl.style.display = "block";
            videoEl.play().catch(console.error);

            // Show floating video controls
            videoControls.style.display = "block";

            // Stop tracking when track ends (user stops sharing via browser bar)
            stream.getVideoTracks()[0].onended = () => {
                stopStreamCapture();
            };
        }).catch(err => {
            console.error(err);
            if (errorEl) {
                errorEl.textContent = `Erro: ${err.name} - ${err.message}`;
                errorEl.style.display = "block";
            }
        });
    };

    stopStreamBtn.onclick = stopStreamCapture;
}

document.getElementById("app-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("app-name-input").value;
    const url = document.getElementById("app-url-input").value;
    const desc = document.getElementById("app-desc-input").value || "Link externo integrado";
    
    let logo = "";
    try {
        logo = "https://www.google.com/s2/favicons?sz=128&domain=" + new URL(url).hostname;
    } catch(err) {
        logo = "";
    }
    
    state.apps.push({
        id: "app-" + Date.now(),
        name,
        url,
        desc,
        type: "generic",
        logo: logo,
        active: true
    });

    addXP(10);
    saveState();
    closeModal("modal-appcenter-overlay");
    document.getElementById("app-form").reset();
    renderAppCenter();
});

function toggleAppStatus(id) {
    const app = state.apps.find(a => a.id === id);
    if(app) {
        app.active = !app.active;
        saveState();
        renderAppCenter();
    }
}

// ==================== HELPER FUNCTIONS ====================
function getTodayString() {
    const now = new Date();
    return getFormatDateString(now);
}

function getFormatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateString(str) {
    if(!str) return "";
    const parts = str.split("-");
    if(parts.length !== 3) return str;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatBRL(amount) {
    return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ==================== STARTUP ====================
window.onload = () => {
    loadState();
    initRouter();
    bindTourEvents();
    initFloatingStreamControls();
    
    // Track mouse for CSS glow effect
    window.addEventListener("mousemove", (e) => {
        document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    });
    
    // Flash topbar with baby blue light when clicking interactive elements
    window.addEventListener("click", (e) => {
        let el = e.target;
        let isInteractive = false;
        while (el && el !== document.body) {
            const tagName = el.tagName ? el.tagName.toLowerCase() : "";
            if (
                tagName === "button" || 
                tagName === "a" || 
                tagName === "input" || 
                tagName === "select" || 
                tagName === "textarea" ||
                el.classList.contains("menu-item") ||
                el.classList.contains("action-btn") ||
                el.classList.contains("btn") ||
                el.getAttribute("role") === "button" ||
                el.onclick ||
                window.getComputedStyle(el).cursor === "pointer"
            ) {
                isInteractive = true;
                break;
            }
            el = el.parentElement;
        }
        
        if (isInteractive) {
            const topbar = document.querySelector(".topbar");
            if (topbar) {
                topbar.classList.remove("topbar-flash");
                void topbar.offsetWidth; // Trigger reflow to restart CSS animation
                topbar.classList.add("topbar-flash");
            }
        }
    });
    initDiaryFontSelector();
    
    // Force active state first render
    switchModule("dashboard");
    checkDailyHabitsQuest();
    updateUIElements();
    
    // Initialize Theme Color Picker
    initThemeColorPicker();
    
    // Initialize Supabase
    initSupabase();
    initSupabaseEventListeners();
};

function initDiaryFontSelector() {
    const fontsMap = {
        default: "'Outfit', sans-serif",
        cinzel: "'Cinzel', serif",
        "cinzel-dec": "'Cinzel Decorative', serif",
        medieval: "'MedievalSharp', cursive",
        playfair: "'Playfair Display', serif",
        cormorant: "'Cormorant Garamond', serif",
        lora: "'Lora', serif",
        "great-vibes": "'Great Vibes', cursive",
        "alex-brush": "'Alex Brush', cursive",
        dancing: "'Dancing Script', cursive",
        montserrat: "'Montserrat', sans-serif"
    };

    const fontNames = {
        default: "Padrão",
        cinzel: "Cinzel",
        "cinzel-dec": "Cinzel Dec.",
        medieval: "Medieval",
        playfair: "Playfair",
        cormorant: "Cormorant",
        lora: "Lora",
        "great-vibes": "Great Vibes",
        "alex-brush": "Alex Brush",
        dancing: "Dancing Script",
        montserrat: "Montserrat"
    };

    const fontSelect = document.getElementById("diary-font-select");
    const label = document.getElementById("diary-label-title");
    const textarea = document.getElementById("diary-content-input");
    const fontNameSpan = document.getElementById("current-font-name");

    if (!fontSelect || !label) return;

    function applyFont(fontKey) {
        if (fontsMap[fontKey]) {
            label.style.fontFamily = fontsMap[fontKey];
            if (textarea) {
                textarea.style.fontFamily = fontsMap[fontKey];
            }
            if (fontNameSpan) fontNameSpan.textContent = fontNames[fontKey];
            localStorage.setItem("lilith_diary_font", fontKey);
        }
    }

    fontSelect.addEventListener("change", (e) => {
        applyFont(e.target.value);
    });

    const savedFont = localStorage.getItem("lilith_diary_font") || "default";
    fontSelect.value = savedFont;
    applyFont(savedFont);
}



// ==================== MAGIC EFFECTS SYSTEM ====================

// 1. Magic Toast Alert System
function showMagicAlert(title, text = "") {
    let container = document.getElementById("magic-toast-container");
    if(!container) {
        container = document.createElement("div");
        container.className = "magic-toast-container";
        container.id = "magic-toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "magic-toast";
    toast.innerHTML = `
        <div class="magic-toast-icon">
            <i data-lucide="sparkles"></i>
        </div>
        <div style="display:flex; flex-direction:column; gap:2px; flex:1;">
            <span class="magic-toast-title">${title}</span>
            ${text ? `<span class="magic-toast-text">${text}</span>` : ""}
        </div>
    `;
    container.appendChild(toast);
    
    if(window.lucide) {
        lucide.createIcons({ attrs: { class: 'magic-toast-icon' } });
    }

    // Spawn sparkle particles inside toast
    spawnMagicSparkles(toast);

    // Auto dismiss
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 400);
    }, 10000);
}

function spawnMagicSparkles(parent) {
    const symbols = ["✦", "★", "✦", "✧", "★"];
    for (let i = 0; i < 15; i++) {
        const sparkle = document.createElement("span");
        sparkle.className = "magic-sparkle";
        sparkle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        
        // Random positions and travel trajectories
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 60;
        const mx = Math.cos(angle) * distance;
        const my = Math.sin(angle) * distance;
        
        sparkle.style.setProperty("--mx", `${mx}px`);
        sparkle.style.setProperty("--my", `${my}px`);
        
        sparkle.style.left = `${30 + Math.random() * 100}px`;
        sparkle.style.top = `${15 + Math.random() * 15}px`;
        sparkle.style.animationDelay = `${Math.random() * 0.15}s`;
        
        parent.appendChild(sparkle);
    }
}

// 2. Magical Tour Showcase Logic
let currentTourStep = 0;
const tourSteps = [
    {
        targetId: "sidebar",
        module: "dashboard",
        title: "Navegação Lilith",
        desc: "Centralize tudo em um único ambiente! Use este menu principal para alternar rapidamente entre os 14 módulos de produtividade e organização da Lilith."
    },
    {
        targetId: "avatar-circle",
        module: "dashboard",
        title: "Seu Progresso Gamificado",
        desc: "Cada ação realizada (como concluir tarefas, salvar diários, manter hábitos) rende pontos de Experiência (XP). Suba de nível e turbine seu foco!"
    },
    {
        targetId: "global-action-btn",
        module: "dashboard",
        title: "Botão de Ação Mágico",
        desc: "Este botão se adapta ao módulo ativo! No Dashboard cria Tarefas, nas Anotações cria Notas, nas Finanças cria Transações, e assim por diante."
    },
    {
        targetId: "nav-whiteboard",
        module: "dashboard",
        title: "Lousa & Brainstorming",
        desc: "Acesse o Quadro Negro para desenhar esboços, fluxogramas e mapas mentais com cores neon vibrantes em uma lousa de espaço infinito."
    },
    {
        targetId: "nav-quests",
        module: "dashboard",
        title: "Missões & Quests",
        desc: "Mantenha sua rotina afiada completando missões Diárias, Semanais e Mensais que rendem quantias generosas de XP para seu personagem Lilith."
    }
];

function startMagicTour() {
    currentTourStep = 0;
    const overlay = document.getElementById("magic-tour-overlay");
    const spotlight = document.getElementById("magic-spotlight");
    const card = document.getElementById("magic-tour-card");

    if(!overlay || !spotlight || !card) return;

    overlay.classList.add("active");
    spotlight.style.display = "block";
    card.style.display = "flex";

    renderTourStep();
}

function renderTourStep() {
    const step = tourSteps[currentTourStep];
    
    // Switch to target module if different
    if (currentModule !== step.module) {
        switchModule(step.module);
    }

    const targetEl = document.getElementById(step.targetId);
    if (targetEl) {
        if (targetEl.classList.contains("menu-item")) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            setTimeout(() => {
                updateSpotlight(targetEl);
            }, 200);
        } else {
            updateSpotlight(targetEl);
        }
    }

    // Update text
    document.getElementById("magic-tour-title").textContent = step.title;
    document.getElementById("magic-tour-desc").textContent = step.desc;
    document.getElementById("magic-tour-step").textContent = `${currentTourStep + 1} / ${tourSteps.length}`;

    // Handle button visibility
    document.getElementById("magic-tour-prev").style.visibility = currentTourStep === 0 ? "hidden" : "visible";
    document.getElementById("magic-tour-next").textContent = currentTourStep === tourSteps.length - 1 ? "Concluir" : "Próximo";
}

function updateSpotlight(element) {
    const spotlight = document.getElementById("magic-spotlight");
    const card = document.getElementById("magic-tour-card");
    if(!spotlight || !card) return;
    
    const rect = element.getBoundingClientRect();
    const padding = 8;

    spotlight.style.top = `${rect.top + window.scrollY - padding}px`;
    spotlight.style.left = `${rect.left + window.scrollX - padding}px`;
    spotlight.style.width = `${rect.width + padding * 2}px`;
    spotlight.style.height = `${rect.height + padding * 2}px`;

    let cardTop = rect.bottom + window.scrollY + 16;
    let cardLeft = rect.left + window.scrollX;

    if (cardLeft + 320 > window.innerWidth) {
        cardLeft = window.innerWidth - 340;
    }
    if (cardTop + 200 > window.innerHeight + window.scrollY) {
        cardTop = rect.top + window.scrollY - 220; 
    }
    if (cardTop < window.scrollY) {
        cardTop = window.scrollY + 20;
    }

    card.style.top = `${cardTop}px`;
    card.style.left = `${cardLeft}px`;

    spawnTourSparkles(element);
}

function spawnTourSparkles(element) {
    const rect = element.getBoundingClientRect();
    const symbols = ["★", "✦", "✧"];
    for(let i = 0; i < 8; i++) {
        const p = document.createElement("span");
        p.className = "magic-sparkle";
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.color = "var(--primary)";
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 40;
        const mx = Math.cos(angle) * distance;
        const my = Math.sin(angle) * distance;
        
        p.style.setProperty("--mx", `${mx}px`);
        p.style.setProperty("--my", `${my}px`);
        
        p.style.left = `${rect.left + rect.width/2 + window.scrollX}px`;
        p.style.top = `${rect.top + rect.height/2 + window.scrollY}px`;
        p.style.fontSize = "14px";
        
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1200);
    }
}

function endMagicTour() {
    const overlay = document.getElementById("magic-tour-overlay");
    const spotlight = document.getElementById("magic-spotlight");
    const card = document.getElementById("magic-tour-card");

    if(overlay) overlay.classList.remove("active");
    if(spotlight) spotlight.style.display = "none";
    if(card) card.style.display = "none";

    showMagicAlert("Tour Concluído! 🪄", "Você conheceu os principais mistérios e janelas da Lilith.");
}

function bindTourEvents() {
    const tourBtn = document.getElementById("magic-tour-btn");
    if(tourBtn) {
        tourBtn.onclick = (e) => {
            e.preventDefault();
            startMagicTour();
        };
    }

    const prevBtn = document.getElementById("magic-tour-prev");
    if(prevBtn) {
        prevBtn.onclick = (e) => {
            e.preventDefault();
            if (currentTourStep > 0) {
                currentTourStep--;
                renderTourStep();
            }
        };
    }

    const nextBtn = document.getElementById("magic-tour-next");
    if(nextBtn) {
        nextBtn.onclick = (e) => {
            e.preventDefault();
            if (currentTourStep < tourSteps.length - 1) {
                currentTourStep++;
                renderTourStep();
            } else {
                endMagicTour();
            }
        };
    }
}

// ==================== FLOATING STREAM INTEGRATION ====================
function initFloatingStreamControls() {
    const pipBtn = document.getElementById("app-visualizer-pip");
    const floatBtn = document.getElementById("app-visualizer-float");
    const dockBtn = document.getElementById("floating-dock-btn");
    const closeBtn = document.getElementById("floating-close-btn");
    
    const floatingContainer = document.getElementById("app-floating-stream-container");
    const floatingWrapper = document.getElementById("floating-video-wrapper");
    const visualizerBody = document.querySelector(".app-visualizer-body");
    const videoControls = document.getElementById("app-visualizer-video-controls");
    const assistedContainer = document.getElementById("app-visualizer-assisted");

    if (pipBtn) {
        pipBtn.onclick = () => {
            const videoEl = document.getElementById("app-visualizer-video");
            if (videoEl && videoEl.srcObject) {
                videoEl.requestPictureInPicture().catch(err => {
                    console.error("Erro ao abrir PiP nativo:", err);
                    alert("Seu navegador não suporta a janela externa (PiP) para esse tipo de stream.");
                });
            }
        };
    }

    if (floatBtn) {
        floatBtn.onclick = () => {
            const videoEl = document.getElementById("app-visualizer-video");
            if (videoEl && videoEl.srcObject && floatingWrapper) {
                floatingWrapper.appendChild(videoEl);
                videoEl.style.width = "100%";
                videoEl.style.height = "100%";
                videoEl.style.objectFit = "contain";
                floatingContainer.style.display = "flex";
                if (videoControls) videoControls.style.display = "none";
                if (assistedContainer) assistedContainer.style.display = "none";
            }
        };
    }

    if (dockBtn) {
        dockBtn.onclick = () => {
            const videoEl = document.getElementById("app-visualizer-video");
            if (videoEl && visualizerBody) {
                visualizerBody.appendChild(videoEl);
                videoEl.style.width = "100%";
                videoEl.style.height = "100%";
                floatingContainer.style.display = "none";
                if (videoControls) videoControls.style.display = "flex";
            }
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => {
            // Find active app type to stop the correct stream
            const activeTile = document.querySelector(".app-tile.selected");
            if (activeTile) {
                const id = activeTile.getAttribute("data-app-id");
                const app = state.apps.find(a => a.id === id);
                if (app) {
                    let type = app.type || "spotify";
                    if (window.activeAppStreams && window.activeAppStreams[type]) {
                        window.activeAppStreams[type].getTracks().forEach(t => t.stop());
                        delete window.activeAppStreams[type];
                    }
                }
            }
            
            const videoEl = document.getElementById("app-visualizer-video");
            if (videoEl && visualizerBody) {
                visualizerBody.appendChild(videoEl);
                videoEl.srcObject = null;
                videoEl.style.display = "none";
            }
            floatingContainer.style.display = "none";
            if (assistedContainer) {
                assistedContainer.style.display = "block";
            }
        };
    }

    // Initialize dragging on the floating header panel
    const header = floatingContainer ? floatingContainer.querySelector(".floating-header") : null;
    if (floatingContainer && header) {
        makeElementDraggable(floatingContainer, header);
    }
}

function makeElementDraggable(el, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;
    handle.ontouchstart = dragTouchStart;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        let newTop = el.offsetTop - pos2;
        let newLeft = el.offsetLeft - pos1;
        
        // Boundaries
        if (newTop < 0) newTop = 0;
        if (newLeft < 0) newLeft = 0;
        if (newTop + el.clientHeight > window.innerHeight) newTop = window.innerHeight - el.clientHeight;
        if (newLeft + el.clientWidth > window.innerWidth) newLeft = window.innerWidth - el.clientWidth;

        el.style.top = newTop + "px";
        el.style.left = newLeft + "px";
        el.style.bottom = "auto";
        el.style.right = "auto";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }

    // Touch support for mobile dragging
    function dragTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            pos3 = touch.clientX;
            pos4 = touch.clientY;
            document.ontouchend = closeTouchDragElement;
            document.ontouchmove = touchElementDrag;
        }
    }

    function touchElementDrag(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            pos1 = pos3 - touch.clientX;
            pos2 = pos4 - touch.clientY;
            pos3 = touch.clientX;
            pos4 = touch.clientY;
            
            let newTop = el.offsetTop - pos2;
            let newLeft = el.offsetLeft - pos1;
            
            if (newTop < 0) newTop = 0;
            if (newLeft < 0) newLeft = 0;
            if (newTop + el.clientHeight > window.innerHeight) newTop = window.innerHeight - el.clientHeight;
            if (newLeft + el.clientWidth > window.innerWidth) newLeft = window.innerWidth - el.clientWidth;

            el.style.top = newTop + "px";
            el.style.left = newLeft + "px";
            el.style.bottom = "auto";
            el.style.right = "auto";
        }
    }

    function closeTouchDragElement() {
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}

// ==================== SUPABASE INTEGRATION ====================
let supabaseClient = null;
let supabaseUser = null;
let supabaseSaveTimeout = null;
let supabaseSyncing = false;

// Default credentials provided by user
const DEFAULT_SUPABASE_URL = "https://hbedehhinrhfmkpedems.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_SJK5ZSK5NbItigRZkXuByw_5QVV2lNT";

// Initialize Supabase Client
async function initSupabase() {
    // Force cloud mode always
    localStorage.setItem("lilith_storage_mode", "cloud");

    const url = DEFAULT_SUPABASE_URL;
    const key = DEFAULT_SUPABASE_KEY;

    try {
        if (typeof supabase === 'undefined') {
            console.error("Supabase SDK não está carregado.");
            return;
        }
        supabaseClient = supabase.createClient(url, key);
        
        // Listen to auth changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (session && session.user) {
                const isNewUser = !supabaseUser || supabaseUser.id !== session.user.id;
                supabaseUser = session.user;
                updateSupabaseUI();
                
                const loginScreen = document.getElementById('login-screen');
                const appContainer = document.getElementById('app-container');
                if(loginScreen) loginScreen.style.display = 'none';
                if(appContainer) appContainer.style.display = 'block';

                if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && isNewUser)) {
                    await loadStateFromSupabase(false);
                }
            } else {
                supabaseUser = null;
                updateSupabaseUI();
                
                const loginScreen = document.getElementById('login-screen');
                const appContainer = document.getElementById('app-container');
                if(loginScreen) loginScreen.style.display = 'flex';
                if(appContainer) appContainer.style.display = 'none';
            }
        });
        
        // Check current session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            supabaseUser = session.user;
            const loginScreen = document.getElementById('login-screen');
            const appContainer = document.getElementById('app-container');
            if(loginScreen) loginScreen.style.display = 'none';
            if(appContainer) appContainer.style.display = 'block';
            await loadStateFromSupabase(false);
        } else {
            const loginScreen = document.getElementById('login-screen');
            const appContainer = document.getElementById('app-container');
            if(loginScreen) loginScreen.style.display = 'flex';
            if(appContainer) appContainer.style.display = 'none';
        }
        
        updateSupabaseUI();
    } catch (err) {
        console.error("Erro ao inicializar Supabase:", err);
        showMagicAlert("Erro na Nuvem ☁️", "Não foi possível conectar ao projeto Supabase.");
        supabaseClient = null;
        supabaseUser = null;
        updateSupabaseUI();
    }
}

// Update UI connection status
function updateSupabaseUI() {
    const cloudBtn = document.getElementById("supabase-status-btn");
    const cloudIcon = document.getElementById("supabase-cloud-icon");
    const userEmailEl = document.getElementById("supabase-user-email");
    
    const panelConfig = document.getElementById("supabase-panel-config");
    const panelAuth = document.getElementById("supabase-panel-auth");
    const panelDashboard = document.getElementById("supabase-panel-dashboard");
    const storageModeSelect = document.getElementById("lilith-storage-mode");

    if (storageModeSelect) {
        storageModeSelect.value = localStorage.getItem("lilith_storage_mode") || "cloud";
    }

    if (!cloudBtn || !cloudIcon) return;

    // Reset styles
    cloudBtn.className = "supabase-status-btn";
    
    const storageMode = localStorage.getItem("lilith_storage_mode") || "cloud";

    if (storageMode === "local") {
        // Local storage only
        cloudBtn.classList.add("disconnected");
        cloudBtn.title = "Armazenamento: Apenas Local";
        cloudIcon.setAttribute("data-lucide", "database");
        
        // Populate the slot select input to match localStorage active slot
        const slotSelect = document.getElementById("local-storage-slot-select");
        if (slotSelect) {
            slotSelect.value = localStorage.getItem("lilith_active_slot") || "lilith_state";
        }
        
        if (panelConfig) panelConfig.style.display = "none";
        if (panelAuth) panelAuth.style.display = "block"; // Show Local Storage Slot Selector
        if (panelDashboard) panelDashboard.style.display = "none";
    } else {
        // Cloud mode
        if (panelAuth) panelAuth.style.display = "none"; // Hide Local Storage Slot Selector
        
        if (!supabaseClient) {
            // Disconnected from project
            cloudBtn.classList.add("disconnected");
            cloudBtn.title = "Configurar Supabase";
            cloudIcon.setAttribute("data-lucide", "cloud-off");
            
            if (panelConfig) panelConfig.style.display = "block";
            if (panelDashboard) panelDashboard.style.display = "none";
        } else {
            // Connected
            cloudBtn.classList.add("connected");
            cloudBtn.title = "Supabase: Conectado à Nuvem";
            cloudIcon.setAttribute("data-lucide", "cloud");
            
            if (userEmailEl) {
                const slot = localStorage.getItem("lilith_active_slot") || "lilith_state";
                const slotNames = {
                    lilith_state: "Pessoal (Padrão)",
                    lilith_state_trabalho: "Trabalho",
                    lilith_state_estudos: "Estudos"
                };
                userEmailEl.textContent = slotNames[slot] || slot;
            }
            
            if (panelConfig) panelConfig.style.display = "none";
            if (panelDashboard) panelDashboard.style.display = "block";
        }
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

// Debounce state saves to Supabase
function saveToSupabaseDebounced() {
    if (supabaseSaveTimeout) clearTimeout(supabaseSaveTimeout);
    
    const syncStatusEl = document.getElementById("supabase-sync-status");
    if (syncStatusEl) {
        syncStatusEl.textContent = "Salvando...";
        syncStatusEl.style.background = "rgba(234, 179, 8, 0.1)";
        syncStatusEl.style.color = "#eab308";
    }

    supabaseSaveTimeout = setTimeout(() => {
        uploadStateToSupabase();
    }, 1500);
}

// Upload local state to Supabase
async function uploadStateToSupabase(showAlert = false) {
    if (!supabaseClient) return;
    
    supabaseSyncing = true;
    const syncStatusEl = document.getElementById("supabase-sync-status");
    const lastSyncTimeEl = document.getElementById("supabase-last-sync-time");

    try {
        const userId = supabaseUser ? supabaseUser.id : (localStorage.getItem("lilith_active_slot") || "lilith_state");
        const { error } = await supabaseClient
            .from('lilith_data')
            .upsert({ 
                user_id: userId, 
                state: state, 
                updated_at: new Date().toISOString() 
            }, { onConflict: 'user_id' });

        if (error) throw error;

        const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (syncStatusEl) {
            syncStatusEl.textContent = "Sincronizado";
            syncStatusEl.style.background = "rgba(34, 197, 94, 0.1)";
            syncStatusEl.style.color = "#22c55e";
        }
        if (lastSyncTimeEl) {
            lastSyncTimeEl.textContent = `${timeStr} (Enviado)`;
        }
        if (showAlert) {
            showMagicAlert("Nuvem Atualizada! ☁️", "Seus dados locais foram enviados com sucesso para o Supabase.");
        }
    } catch (err) {
        console.error("Erro ao enviar dados para Supabase:", err);
        if (syncStatusEl) {
            syncStatusEl.textContent = "Erro ao Sincronizar";
            syncStatusEl.style.background = "rgba(239, 68, 68, 0.1)";
            syncStatusEl.style.color = "#ef4444";
        }
        showMagicAlert("Erro de Sincronização ❌", "Falha ao salvar dados na nuvem.");
    } finally {
        supabaseSyncing = false;
    }
}

// Load state from Supabase
async function loadStateFromSupabase(showAlert = true) {
    if (!supabaseClient) return;

    supabaseSyncing = true;
    const syncStatusEl = document.getElementById("supabase-sync-status");
    const lastSyncTimeEl = document.getElementById("supabase-last-sync-time");

    try {
        const userId = supabaseUser ? supabaseUser.id : (localStorage.getItem("lilith_active_slot") || "lilith_state");
        const { data, error } = await supabaseClient
            .from('lilith_data')
            .select('state, updated_at')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (data && data.state) {
            // Overwrite state and save local
            state = data.state;
            localStorage.setItem(currentLocalStorageKey, JSON.stringify(state));
            if (state.themeColor) {
                setThemeColor(state.themeColor);
            }
            
            // Re-render dashboard/active module
            updateUIElements();
            renderModuleContent(currentModule);
            
            if (syncStatusEl) {
                syncStatusEl.textContent = "Sincronizado";
                syncStatusEl.style.background = "rgba(34, 197, 94, 0.1)";
                syncStatusEl.style.color = "#22c55e";
            }
            if (lastSyncTimeEl) {
                lastSyncTimeEl.textContent = `${timeStr} (Baixado)`;
            }
            if (showAlert) {
                showMagicAlert("Sincronização Concluída! ☁️", "Dados carregados da nuvem e aplicados localmente.");
            }
        } else {
            // No remote state exists yet (new account) -> Upload current local state
            await uploadStateToSupabase(false);
            if (syncStatusEl) {
                syncStatusEl.textContent = "Sincronizado";
                syncStatusEl.style.background = "rgba(34, 197, 94, 0.1)";
                syncStatusEl.style.color = "#22c55e";
            }
            if (lastSyncTimeEl) {
                lastSyncTimeEl.textContent = `${timeStr} (Nuvem Inicializada)`;
            }
        }
    } catch (err) {
        console.error("Erro ao carregar dados do Supabase:", err);
        if (syncStatusEl) {
            syncStatusEl.textContent = "Erro ao Sincronizar";
            syncStatusEl.style.background = "rgba(239, 68, 68, 0.1)";
            syncStatusEl.style.color = "#ef4444";
        }
        if (showAlert) {
            showMagicAlert("Erro ao Carregar ❌", "Falha ao buscar dados na nuvem.");
        }
    } finally {
        supabaseSyncing = false;
    }
}

// Function to export all data to a structured markdown file and raw JSON file
function downloadBackup() {
    let md = `# Lilith Life Organizer - Relatório de Backup Geral\n`;
    md += `Gerado em: ${new Date().toLocaleString("pt-BR")}\n`;
    md += `Nível: ${state.user.level} | XP: ${state.user.xp}\n\n`;
    md += `========================================================\n\n`;

    // 1. NOTES
    md += `## 🎯 ANOTAÇÕES\n\n`;
    if (state.notes && state.notes.length > 0) {
        state.notes.forEach(note => {
            md += `### ${note.title || "Sem título"}\n`;
            md += `* **Categoria:** ${note.category || "Sem categoria"}\n`;
            md += `* **Data:** ${formatDateString(note.date)}\n`;
            md += `* **Favorito:** ${note.favorite ? "Sim" : "Não"}\n\n`;
            md += `${note.content || ""}\n\n`;
            md += `--------------------------------------------------------\n\n`;
        });
    } else {
        md += `Nenhuma anotação registrada.\n\n`;
    }

    // 2. DIARY
    md += `## 📖 DIÁRIO PESSOAL\n\n`;
    const diaryKeys = Object.keys(state.diary || {});
    if (diaryKeys.length > 0) {
        diaryKeys.sort().forEach(dateKey => {
            const entry = state.diary[dateKey];
            md += `### Entrada de ${formatDateString(dateKey)}\n`;
            md += `* **Mood/Humor:** ${entry.mood || "Neutro"}\n\n`;
            md += `${entry.text || ""}\n\n`;
            md += `--------------------------------------------------------\n\n`;
        });
    } else {
        md += `Nenhuma entrada no diário pessoal.\n\n`;
    }

    // 3. IDEAS
    md += `## 💡 INSIGHTS & IDEIAS\n\n`;
    if (state.ideas && state.ideas.length > 0) {
        state.ideas.forEach(idea => {
            md += `### ${idea.title || "Sem título"}\n`;
            md += `* **Tema:** ${idea.theme || "Geral"}\n`;
            md += `* **Data:** ${formatDateString(idea.date)}\n\n`;
            md += `${idea.content || ""}\n\n`;
            md += `--------------------------------------------------------\n\n`;
        });
    } else {
        md += `Nenhuma ideia registrada.\n\n`;
    }

    // 4. TASKS
    md += `## 📋 QUADRO DE TAREFAS\n\n`;
    if (state.tasks && state.tasks.length > 0) {
        md += `| Concluída | Prioridade | Categoria | Data Limite | Título |\n`;
        md += `| :---: | :---: | :---: | :---: | :--- |\n`;
        state.tasks.forEach(task => {
            md += `| ${task.completed ? "[X]" : "[ ]"} | ${task.priority || "Média"} | ${task.category || "Pessoal"} | ${formatDateString(task.date)} | ${task.title} |\n`;
        });
        md += `\n`;
    } else {
        md += `Nenhuma tarefa registrada.\n\n`;
    }

    // 5. PROJECTS
    md += `## 🚀 PROJETOS\n\n`;
    if (state.projects && state.projects.length > 0) {
        state.projects.forEach(proj => {
            md += `### ${proj.title}\n`;
            md += `* **Categoria:** ${proj.category || "Geral"}\n`;
            md += `* **Descrição:** ${proj.desc || "Sem descrição"}\n\n`;
            md += `**Passos/Etapas:**\n`;
            if (proj.steps && proj.steps.length > 0) {
                proj.steps.forEach(step => {
                    md += `* [${step.completed ? "x" : " "}] ${step.text}\n`;
                });
            } else {
                md += `Nenhuma etapa definida.\n`;
            }
            md += `\n--------------------------------------------------------\n\n`;
        });
    } else {
        md += `Nenhum projeto registrado.\n\n`;
    }

    // 6. GOALS
    md += `## 🎯 METAS & OBJETIVOS\n\n`;
    if (state.goals && state.goals.length > 0) {
        state.goals.forEach(goal => {
            md += `### ${goal.title}\n`;
            md += `* **Prazo:** ${goal.type || "Curto Prazo"}\n`;
            md += `* **Data Alvo:** ${formatDateString(goal.date)}\n`;
            md += `* **Progresso:** ${goal.progress}%\n`;
            if (goal.image) {
                md += `* **Imagem:** ${goal.image} (Path/Referência)\n`;
            }
            md += `\n--------------------------------------------------------\n\n`;
        });
    } else {
        md += `Nenhuma meta cadastrada.\n\n`;
    }

    // 7. HABITS
    md += `## ⚡ CONTROLE DE HÁBITOS\n\n`;
    if (state.habits && state.habits.length > 0) {
        state.habits.forEach(habit => {
            md += `### Hábito: ${habit.name}\n`;
            md += `**Histórico de Conclusões:**\n`;
            const completedDates = Object.keys(habit.tracking || {}).filter(dateKey => habit.tracking[dateKey]);
            if (completedDates.length > 0) {
                completedDates.sort().forEach(d => {
                    md += `* Concluído em: ${formatDateString(d)}\n`;
                });
            } else {
                md += `Sem histórico de conclusões registradas.\n`;
            }
            md += `\n--------------------------------------------------------\n\n`;
        });
    } else {
        md += `Nenhum hábito cadastrado.\n\n`;
    }

    // 8. FINANCES
    md += `## 💰 FINANÇAS PESSOAIS\n\n`;
    if (state.finances && state.finances.length > 0) {
        md += `| Tipo | Categoria | Valor (R$) | Data | Descrição |\n`;
        md += `| :---: | :---: | :---: | :---: | :--- |\n`;
        state.finances.forEach(fin => {
            md += `| ${fin.type} | ${fin.category} | ${fin.amount.toFixed(2)} | ${formatDateString(fin.date)} | ${fin.desc} |\n`;
        });
        md += `\n`;
    } else {
        md += `Nenhuma transação financeira registrada.\n\n`;
    }

    // 9. APP CENTER
    md += `## 🔌 INTEGRACÕES & CENTRAL DE APLICATIVOS\n\n`;
    if (state.apps && state.apps.length > 0) {
        state.apps.forEach(app => {
            md += `### ${app.name}\n`;
            md += `* **URL:** ${app.url || "#"}\n`;
            md += `* **Descrição:** ${app.desc || ""}\n`;
            md += `* **Tipo:** ${app.type || "generic"}\n`;
            md += `* **Ativo:** ${app.active ? "Sim" : "Não"}\n`;
            if (app.logo) {
                md += `* **Logo/Imagem:** ${app.logo}\n`;
            }
            md += `\n--------------------------------------------------------\n\n`;
        });
    } else {
        md += `Nenhuma integração cadastrada.\n\n`;
    }

    // 10. CALENDAR EVENTS
    md += `## 📅 EVENTOS DO CALENDÁRIO\n\n`;
    if (state.calendarEvents && state.calendarEvents.length > 0) {
        state.calendarEvents.forEach(ev => {
            md += `* **Data:** ${formatDateString(ev.date)} | **Evento:** ${ev.title}\n`;
        });
        md += `\n`;
    } else {
        md += `Nenhum evento registrado no calendário.\n\n`;
    }

    // Trigger Markdown Download
    const blobMd = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const linkMd = document.createElement("a");
    linkMd.href = URL.createObjectURL(blobMd);
    linkMd.download = "lilith_backup_relatorio.md";
    linkMd.click();

    // Trigger JSON Raw Data Download (including all images & videos data)
    const blobJson = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8;" });
    const linkJson = document.createElement("a");
    linkJson.href = URL.createObjectURL(blobJson);
    linkJson.download = "lilith_state_raw.json";
    linkJson.click();

    showMagicAlert("Backup Concluído! 💾", "Baixados lilith_backup_relatorio.md e lilith_state_raw.json.");
}

// Bind Supabase interaction events
function initSupabaseEventListeners() {
    const cloudBtn = document.getElementById("supabase-status-btn");
    const saveConfigBtn = document.getElementById("supabase-save-config-btn");
    const disconnectProjBtn = document.getElementById("supabase-disconnect-project-btn");
    const changeKeysBtn = document.getElementById("supabase-change-keys-btn");
    const signOutBtn = document.getElementById("supabase-signout-btn");
    const backupBtn = document.getElementById("supabase-backup-btn");
    
    // Login Screen Logic
    const loginForm = document.getElementById("auth-login-form");
    const togglePassBtn = document.getElementById("toggle-password-btn");
    const passInputEl = document.getElementById("login-password");
    
    if (togglePassBtn && passInputEl) {
        togglePassBtn.onclick = () => {
            const isPass = passInputEl.type === "password";
            passInputEl.type = isPass ? "text" : "password";
            const icon = document.getElementById("toggle-password-icon");
            if(icon) {
                icon.setAttribute("data-lucide", isPass ? "eye-off" : "eye");
                lucide.createIcons(); // refresh icons
            }
        };
    }

    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const userInput = document.getElementById("login-username").value.trim().toLowerCase();
            const passInput = document.getElementById("login-password").value.trim();
            
            if (userInput !== "andersonmoitinho" || passInput !== "A@147896325@a") {
                showMagicAlert("Acesso Negado ❌", "Usuário ou senha incorretos.");
                return;
            }

            const btn = document.getElementById("login-submit-btn");
            const originalText = btn.textContent;
            btn.textContent = "Autenticando...";
            btn.disabled = true;
            btn.style.opacity = "0.5";

            const email = "anhderson1@gmail.com";
            
            try {
                // Ensure client is initialized
                if(!supabaseClient) {
                     supabaseClient = supabase.createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
                }

                let { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: passInput
                });
                
                if (error && error.message.includes("Invalid login credentials")) {
                    // Try silent signup
                    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
                        email: email,
                        password: passInput
                    });
                    
                    if (signUpError) {
                        throw signUpError;
                    }
                    showMagicAlert("Conta Criada! 🎉", "Sua conta exclusiva foi configurada e logada.");
                } else if (error) {
                    throw error;
                }

                // Force app entry immediately regardless of session state event timing
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app-container').style.display = 'block';
                await loadStateFromSupabase(false);

            } catch (err) {
                console.error(err);
                showMagicAlert("Erro ❌", "Ocorreu um erro na autenticação.");
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
                btn.style.opacity = "1";
            }
        };
    }
    
    // Avatar Upload Logic
    const avatarCircle = document.getElementById("avatar-circle");
    const profileUpload = document.getElementById("profile-image-upload");
    if (avatarCircle && profileUpload) {
        avatarCircle.onclick = () => profileUpload.click();
        
        profileUpload.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Str = event.target.result;
                // Save to state
                if(!state.user) state.user = { level: 1, xp: 0 };
                state.user.avatar = base64Str;
                saveState(); // Trigger sync
                
                // Update UI
                avatarCircle.style.backgroundImage = `url(${base64Str})`;
                avatarCircle.textContent = "";
                
                showMagicAlert("Perfil Atualizado! 👤", "Sua imagem de perfil foi salva com sucesso.");
            };
            reader.readAsDataURL(file);
        };
    }

    // Open modal on cloud icon click
    if (cloudBtn) {
        cloudBtn.onclick = (e) => {
            e.preventDefault();
            openModal("modal-supabase-overlay");
        };
    }

    // Save project credentials
    if (saveConfigBtn) {
        saveConfigBtn.onclick = async () => {
            const urlInput = document.getElementById("supabase-url-input").value.trim();
            const keyInput = document.getElementById("supabase-key-input").value.trim();

            if (!urlInput || !keyInput) {
                showMagicAlert("Aviso ⚠️", "Por favor preencha todos os campos.");
                return;
            }

            localStorage.setItem("lilith_supabase_url", urlInput);
            localStorage.setItem("lilith_supabase_key", keyInput);

            showMagicAlert("Configuração Salva! 💾", "Conectando ao projeto Supabase...");
            await initSupabase();
        };
    }

    // Local Directory Storage Setup
    const localFolderBtn = document.getElementById("local-folder-storage-btn");
    const localFolderStatus = document.getElementById("local-folder-status");
    if (localFolderBtn && window.showDirectoryPicker) {
        localFolderBtn.onclick = async () => {
            try {
                localDirectoryHandle = await window.showDirectoryPicker({
                    id: 'lilith_storage',
                    mode: 'readwrite',
                    startIn: 'documents'
                });
                
                if (localFolderStatus) {
                    localFolderStatus.style.display = "block";
                    localFolderStatus.textContent = `Pasta selecionada: ${localDirectoryHandle.name}`;
                    localFolderStatus.style.color = "#22c55e"; // green
                }
                
                // Immediately backup current state to this folder
                await writeToLocalDirectory();
                showMagicAlert("Pasta Vinculada! 📁", `Dados salvos em lilith_database.json dentro de ${localDirectoryHandle.name}. O sistema tentará manter este arquivo atualizado enquanto a página estiver aberta.`);
            } catch (err) {
                console.error("Error picking directory:", err);
                if (err.name !== 'AbortError') {
                    showMagicAlert("Erro ❌", "Não foi possível acessar a pasta.");
                }
            }
        };
    } else if (localFolderBtn) {
        localFolderBtn.onclick = () => showMagicAlert("Aviso ⚠️", "Seu navegador não suporta seleção de pastas locais (File System Access API).");
    }
    function generateTextReport(state) {
        let report = `========================================================\n`;
        report += `    LILITH LIFE ORGANIZER - RELATÓRIO GERAL DE DADOS\n`;
        report += `    Gerado em: ${new Date().toLocaleString("pt-BR")}\n`;
        report += `    Perfil: Nível ${state.user ? state.user.level : 1} | XP: ${state.user ? state.user.xp : 0}\n`;
        report += `========================================================\n\n`;

        // 1. NOTES
        report += `[ 🎯 ANOTAÇÕES ]\n\n`;
        if (state.notes && state.notes.length > 0) {
            state.notes.forEach(note => {
                report += `TÍTULO: ${note.title || "Sem título"}\n`;
                report += `Categoria: ${note.category || "Sem categoria"} | Data: ${note.date ? note.date.split('T')[0] : ""}\n`;
                report += `Conteúdo:\n${note.content || ""}\n`;
                report += `--------------------------------------------------------\n\n`;
            });
        } else {
            report += `Nenhuma anotação registrada.\n\n`;
        }

        // 2. DIARY
        report += `[ 📖 DIÁRIO PESSOAL ]\n\n`;
        const diaryKeys = Object.keys(state.diary || {});
        if (diaryKeys.length > 0) {
            diaryKeys.sort().forEach(dateKey => {
                const entry = state.diary[dateKey];
                report += `Entrada de ${dateKey.split('T')[0]}\n`;
                report += `Mood/Humor: ${entry.mood || "Neutro"}\n`;
                report += `Texto: ${entry.text || ""}\n`;
                report += `--------------------------------------------------------\n\n`;
            });
        } else {
            report += `Nenhuma entrada no diário pessoal.\n\n`;
        }

        // 3. IDEAS
        report += `[ 💡 INSIGHTS & IDEIAS ]\n\n`;
        if (state.ideas && state.ideas.length > 0) {
            state.ideas.forEach(idea => {
                report += `Ideia: ${idea.title || idea.text || "Sem título"}\n`;
                report += `Tema/Categoria: ${idea.theme || idea.category || "Geral"}\n`;
                report += `Conteúdo:\n${idea.content || ""}\n`;
                report += `--------------------------------------------------------\n\n`;
            });
        } else {
            report += `Nenhuma ideia registrada.\n\n`;
        }

        // 4. TASKS
        report += `[ 📋 QUADRO DE TAREFAS ]\n\n`;
        if (state.tasks && state.tasks.length > 0) {
            state.tasks.forEach(task => {
                report += `[${task.completed ? "X" : " "}] ${task.title || task.text} (Prioridade: ${task.priority || "Média"} | Cat: ${task.category || "Pessoal"})\n`;
            });
            report += `\n`;
        } else {
            report += `Nenhuma tarefa registrada.\n\n`;
        }

        // 5. PROJECTS
        report += `[ 🚀 PROJETOS ]\n\n`;
        if (state.projects && state.projects.length > 0) {
            state.projects.forEach(proj => {
                report += `Projeto: ${proj.title}\n`;
                report += `Categoria: ${proj.category || "Geral"}\n`;
                report += `Status: ${proj.status || "Em andamento"}\n`;
                report += `Descrição: ${proj.desc || "Sem descrição"}\n`;
                if (proj.steps && proj.steps.length > 0) {
                    report += `Passos/Etapas:\n`;
                    proj.steps.forEach(step => {
                        report += `  - [${step.completed ? "x" : " "}] ${step.text}\n`;
                    });
                } else if (proj.tasks && proj.tasks.length > 0) {
                    report += `Tarefas:\n`;
                    proj.tasks.forEach(task => {
                        report += `  - [${task.completed ? "x" : " "}] ${task.text}\n`;
                    });
                }
                report += `--------------------------------------------------------\n\n`;
            });
        } else {
            report += `Nenhum projeto registrado.\n\n`;
        }

        // 6. GOALS
        report += `[ 🎯 METAS & OBJETIVOS ]\n\n`;
        if (state.goals && state.goals.length > 0) {
            state.goals.forEach(goal => {
                report += `Meta: ${goal.title}\n`;
                report += `Prazo: ${goal.type || "Curto Prazo"}\n`;
                report += `Progresso: ${goal.progress}%\n`;
                report += `--------------------------------------------------------\n\n`;
            });
        } else {
            report += `Nenhuma meta cadastrada.\n\n`;
        }

        // 7. HABITS
        report += `[ ⚡ CONTROLE DE HÁBITOS ]\n\n`;
        if (state.habits && state.habits.length > 0) {
            state.habits.forEach(habit => {
                report += `Hábito: ${habit.name}\n`;
                const completedDates = Object.keys(habit.tracking || {}).filter(dateKey => habit.tracking[dateKey]);
                if (completedDates.length > 0) {
                    report += `Dias concluídos: ${completedDates.length}\n`;
                } else {
                    report += `Sem histórico de conclusões.\n`;
                }
                report += `--------------------------------------------------------\n\n`;
            });
        } else {
            report += `Nenhum hábito cadastrado.\n\n`;
        }

        // 8. FINANCES
        report += `[ 💰 FINANÇAS PESSOAIS ]\n\n`;
        if (state.finances && state.finances.length > 0) {
            let total = 0;
            state.finances.forEach(fin => {
                report += `${fin.type === "receita" ? "+" : "-"} R$ ${parseFloat(fin.amount).toFixed(2)} | ${fin.category} | ${fin.desc}\n`;
                if(fin.type === "receita") total += parseFloat(fin.amount);
                else total -= parseFloat(fin.amount);
            });
            report += `\nSaldo Calculado das Transações: R$ ${total.toFixed(2)}\n`;
        } else if (state.finance && state.finance.balance !== undefined) {
             report += `Saldo Atual: R$ ${state.finance.balance}\n`;
        } else {
            report += `Nenhuma transação financeira registrada.\n\n`;
        }

        // 9. APP CENTER
        report += `\n[ 🔌 INTEGRAÇÕES & APPS ]\n\n`;
        if (state.apps && state.apps.length > 0) {
            state.apps.forEach(app => {
                report += `${app.name} (${app.active ? "Ativo" : "Inativo"})\n`;
            });
        } else {
            report += `Nenhuma integração cadastrada.\n\n`;
        }

        // 10. CALENDAR EVENTS
        report += `\n[ 📅 EVENTOS DO CALENDÁRIO ]\n\n`;
        if (state.calendarEvents && state.calendarEvents.length > 0) {
            state.calendarEvents.forEach(ev => {
                report += `Data: ${ev.date ? ev.date.split('T')[0] : ""} | Evento: ${ev.title}\n`;
            });
            report += `\n`;
        } else {
            report += `Nenhum evento registrado no calendário.\n\n`;
        }
        
        report += `========================================================\n`;
        report += `Relatório gerado automaticamente por Lilith OS.`;
        return report;
    }

    // Backup download triggers
    if (backupBtn) {
        backupBtn.onclick = () => downloadBackup();
    }
    
    const backupNotepadBtn = document.getElementById("backup-notepad-btn");
    if (backupNotepadBtn) {
        backupNotepadBtn.onclick = () => {
            const textContent = generateTextReport(state);
            const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lilith_relatorio_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showMagicAlert("Backup Concluído! 📄", "Relatório simples de texto (.txt) baixado.");
        };
    }

    const backupWordpadBtn = document.getElementById("backup-wordpad-btn");
    if (backupWordpadBtn) {
        backupWordpadBtn.onclick = () => {
            const rawText = generateTextReport(state);
            const formattedText = rawText.replace(/\n/g, "\\par\n");
            const rtfContent = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\\deflang1046{\\fonttbl{\\f0\\fnil\\fcharset0 Consolas;}}
{\\*\\generator Riched20 10.0.19041}\\viewkind4\\uc1 
\\pard\\sa200\\sl276\\slmult1\\f0\\fs22\\par
${formattedText}
}`;
            const blob = new Blob([rtfContent], { type: "application/rtf;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lilith_relatorio_${new Date().toISOString().split('T')[0]}.rtf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showMagicAlert("Backup Concluído! 📝", "Relatório simples formatado (.rtf) baixado.");
        };
    }

    const backupImageBtn = document.getElementById("backup-image-btn");
    if (backupImageBtn) {
        backupImageBtn.onclick = async () => {
            if (typeof html2canvas === 'undefined') {
                showMagicAlert("Erro ❌", "A biblioteca de imagens ainda está carregando. Tente novamente em alguns segundos.");
                return;
            }
            const modal = document.getElementById("modal-supabase-overlay");
            if (modal) modal.style.display = "none";
            
            showMagicAlert("Gerando...", "Criando imagem do relatório simples...");
            
            // Create a temporary hidden div for the report
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.left = "-9999px";
            tempDiv.style.top = "0";
            tempDiv.style.width = "800px";
            tempDiv.style.padding = "40px";
            tempDiv.style.backgroundColor = "#ffffff";
            tempDiv.style.color = "#000000";
            tempDiv.style.fontFamily = "monospace";
            tempDiv.style.fontSize = "16px";
            tempDiv.style.whiteSpace = "pre-wrap";
            tempDiv.style.lineHeight = "1.5";
            tempDiv.textContent = generateTextReport(state);
            document.body.appendChild(tempDiv);
            
            setTimeout(async () => {
                try {
                    const canvas = await html2canvas(tempDiv, {
                        backgroundColor: "#ffffff",
                        scale: 2
                    });
                    const url = canvas.toDataURL("image/png");
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `lilith_relatorio_${new Date().toISOString().split('T')[0]}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    showMagicAlert("Relatório Visual Concluído! 🖼️", "Imagem do relatório baixada.");
                } catch (err) {
                    console.error("Error generating image:", err);
                    showMagicAlert("Erro ❌", "Falha ao gerar o relatório em imagem.");
                } finally {
                    document.body.removeChild(tempDiv);
                }
            }, 500);
        };
    }

    // Local storage slot selection save
    const slotSaveBtn = document.getElementById("local-storage-slot-save-btn");
    const slotSelect = document.getElementById("local-storage-slot-select");
    if (slotSaveBtn && slotSelect) {
        slotSaveBtn.onclick = async () => {
            const selectedSlot = slotSelect.value;
            const previousSlot = localStorage.getItem("lilith_active_slot") || "lilith_state";
            
            if (selectedSlot !== previousSlot) {
                // Save active slot in localStorage
                localStorage.setItem("lilith_active_slot", selectedSlot);
                currentLocalStorageKey = selectedSlot;
                
                // Load state from the newly selected slot
                loadState();
                
                // Load theme color from this slot if saved
                const themeColor = localStorage.getItem("lilith_theme_color") || "#D97A9A";
                setThemeColor(themeColor);
                
                // If cloud mode and supabaseClient, fetch state from Supabase for this slot
                const storageMode = localStorage.getItem("lilith_storage_mode") || "cloud";
                if (storageMode === "cloud" && supabaseClient) {
                    await loadStateFromSupabase(false);
                }
                
                // Re-render UI elements
                updateUIElements();
                renderModuleContent(currentModule);
                
                const slotNames = {
                    lilith_state: "Pessoal (Padrão)",
                    lilith_state_trabalho: "Trabalho",
                    lilith_state_estudos: "Estudos"
                };
                const slotName = slotNames[selectedSlot] || selectedSlot;
                showMagicAlert("Perfil Alterado! 📁", `O perfil "${slotName}" foi ativado.`);
                
                // Close modal
                closeModal("modal-supabase-overlay");
            } else {
                showMagicAlert("Aviso ⚠️", "Este perfil já está ativo.");
            }
        };
    }
}

// ==================== THEME COLOR PICKER ====================
function initThemeColorPicker() {
    const themeColorInput = document.getElementById("theme-color-input");
    const savedThemeColor = localStorage.getItem("lilith_theme_color") || "#D97A9A";
    
    // Set initial theme
    setThemeColor(savedThemeColor);

    if (themeColorInput) {
        // Set input value
        themeColorInput.value = savedThemeColor;
        
        // Listen to live input and final change
        themeColorInput.oninput = (e) => {
            setThemeColor(e.target.value);
        };
        themeColorInput.onchange = (e) => {
            setThemeColor(e.target.value);
        };
    }
}

function setThemeColor(hex) {
    if (!hex || !hex.startsWith("#") || hex.length !== 7) return;

    // Helper to parse hex to rgb
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Convert RGB to HSL
    let r_norm = r / 255;
    let g_norm = g / 255;
    let b_norm = b / 255;
    let max = Math.max(r_norm, g_norm, b_norm);
    let min = Math.min(r_norm, g_norm, b_norm);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r_norm: h = (g_norm - b_norm) / d + (g_norm < b_norm ? 6 : 0); break;
            case g_norm: h = (b_norm - r_norm) / d + 2; break;
            case b_norm: h = (r_norm - g_norm) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    // Derive secondary and accent HSL
    const s_l = Math.min(95, l + 12);
    const s_s = Math.min(100, s + 10);
    const a_l = Math.min(98, l + 20);
    const a_s = Math.max(10, s - 10);

    const primary = hex;
    const primaryGlow = `rgba(${r}, ${g}, ${b}, 0.35)`;
    
    // Secondary
    const secondary = `hsl(${h}, ${s_s}%, ${s_l}%)`;
    // Convert secondary to rgb for glow
    const secRgb = hslToRgb(h / 360, s_s / 100, s_l / 100);
    const secondaryGlow = `rgba(${secRgb[0]}, ${secRgb[1]}, ${secRgb[2]}, 0.35)`;

    // Accent
    const accent = `hsl(${h}, ${a_s}%, ${a_l}%)`;
    // Convert accent to rgb for glow
    const accRgb = hslToRgb(h / 360, a_s / 100, a_l / 100);
    const accentGlow = `rgba(${accRgb[0]}, ${accRgb[1]}, ${accRgb[2]}, 0.35)`;

    // Apply to documentElement variables
    const root = document.documentElement;
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--primary-glow', primaryGlow);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--secondary-glow', secondaryGlow);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-glow', accentGlow);
    
    root.style.setProperty('--border-color', `rgba(${r}, ${g}, ${b}, 0.3)`);
    root.style.setProperty('--border-hover', secondary);
    root.style.setProperty('--text-muted', accent);
    
    root.style.setProperty('--success', secondary);
    root.style.setProperty('--warning', accent);
    root.style.setProperty('--danger', primary);

    // Update circular color indicator in the header
    const previewDot = document.getElementById("theme-color-preview");
    if (previewDot) {
        previewDot.style.backgroundColor = primary;
    }

    // Save to localStorage so it persists
    localStorage.setItem('lilith_theme_color', hex);
    
    // Keep color input synced
    const themeColorInput = document.getElementById("theme-color-input");
    if (themeColorInput && themeColorInput.value !== hex) {
        themeColorInput.value = hex;
    }

    // Update state object and save it
    if (typeof state !== 'undefined' && state) {
        state.themeColor = hex;
        saveState();
    }
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
