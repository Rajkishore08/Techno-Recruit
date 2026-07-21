import { initializeApp, getApps, deleteApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Global Toast Notifications Utility
function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "info";
    if (type === "success") icon = "check-circle";
    if (type === "error") icon = "alert-circle";
    
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px) scale(0.95)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}
window.showToast = showToast;

// Global variables for auth state
let authInstance = null;
let currentIdToken = null;
let currentUser = null;

const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "0.0.0.0" || window.location.port === "8001")
    ? "" 
    : "https://techno-recruit.onrender.com";

// Default public Firebase config for immediate synchronous initialization
const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBJa0JPhdfdGI8qsVsLyvB87VvqvFb4LR8",
    authDomain: "techno-recruit.firebaseapp.com",
    projectId: "techno-recruit",
    storageBucket: "techno-recruit.firebasestorage.app",
    messagingSenderId: "235364274013",
    appId: "1:235364274013:web:9db2497f8946987989e2b4",
    measurementId: "G-LKVL7NWK5L"
};

let defaultApp = null;
try {
    defaultApp = initializeApp(DEFAULT_FIREBASE_CONFIG);
    authInstance = getAuth(defaultApp);
} catch (e) {
    console.warn("Synchronous default Firebase init warning:", e);
}

function initApp() {
    // Initialize Lucide Icons
    if (window.lucide) lucide.createIcons();

    // DOM Elements
    const generatorForm = document.getElementById("generatorForm");
    const jobTitleInput = document.getElementById("jobTitle");
    const experienceLevelSelect = document.getElementById("experienceLevel");
    const jobDescriptionInput = document.getElementById("jobDescription");
    const questionCountInput = document.getElementById("questionCount");
    const questionCountVal = document.getElementById("questionCountVal");
    const submitBtn = document.getElementById("submitBtn");
    
    const traceContainer = document.getElementById("traceContainer");
    const traceTimeline = document.getElementById("traceTimeline");
    const iterationCounter = document.getElementById("iterationCounter");
    
    const resultsContainer = document.getElementById("resultsContainer");
    const resultsTitle = document.getElementById("resultsTitle");
    const metaPosition = document.getElementById("metaPosition");
    const metaLevel = document.getElementById("metaLevel");
    const metaGuideId = document.getElementById("metaGuideId");
    const questionsAccordion = document.getElementById("questionsAccordion");
    
    const copyBtn = document.getElementById("copyBtn");
    const exportMdBtn = document.getElementById("exportMdBtn");
    const printBtn = document.getElementById("printBtn");
    const historyList = document.getElementById("historyList");
    const careerHistoryList = document.getElementById("careerHistoryList");
    const tourBtn = document.getElementById("tourBtn");
    const dashboardStartTourBtn = document.getElementById("dashboardStartTourBtn");
    const onboardingModal = document.getElementById("onboardingModal");
    const closeOnboardingBtn = document.getElementById("closeOnboardingBtn");
    const onboardingNextBtn = document.getElementById("onboardingNextBtn");
    const onboardingPrevBtn = document.getElementById("onboardingPrevBtn");

    let currentGuideData = null;

    // Synchronize range slider value display
    if (questionCountInput && questionCountVal) {
        questionCountInput.addEventListener("input", (e) => {
            questionCountVal.textContent = e.target.value;
        });
    }

    // DOM Elements for Auth
    const loginBtn = document.getElementById("loginBtn");
    const overlayLoginBtn = document.getElementById("overlayLoginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const userProfile = document.getElementById("userProfile");
    const userAvatar = document.getElementById("userAvatar");
    const userNameElement = document.getElementById("userName");
    const authLockOverlay = document.getElementById("authLockOverlay");

    // Initialize Firebase dynamically from Firebase Hosting init.json or backend environment
    async function initFirebase() {
        let firebaseConfig = null;
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "0.0.0.0";

        if (!isLocal) {
            try {
                // Priority 1: Check Firebase Hosting auto-init configuration
                const hostingResponse = await fetch("/__/firebase/init.json");
                if (hostingResponse.ok) {
                    const hConfig = await hostingResponse.json();
                    if (hConfig && hConfig.apiKey) {
                        firebaseConfig = hConfig;
                        console.log("Firebase initialized dynamically via Hosting.");
                    }
                }
            } catch (e) {
                console.warn("Hosting init.json not available.", e);
            }
        }

        if (!firebaseConfig || !firebaseConfig.apiKey) {
            try {
                // Priority 2: Backend config endpoint (reads from .env)
                const response = await fetch(`${API_BASE}/api/config`);
                if (response.ok) {
                    const bConfig = await response.json();
                    if (bConfig && bConfig.apiKey) {
                        firebaseConfig = bConfig;
                        console.log("Firebase config loaded from backend environment.");
                    }
                }
            } catch (e) {
                console.warn("Backend config endpoint not available.", e);
            }
        }

        if (!firebaseConfig || !firebaseConfig.apiKey) {
            console.warn("Firebase configuration is missing. Ensure environment variables or Firebase Hosting config are set.");
            return;
        }

        try {
            const existingApps = getApps();
            if (existingApps.length > 0) {
                for (const existingApp of existingApps) {
                    await deleteApp(existingApp);
                }
            }
            const app = initializeApp(firebaseConfig);
            authInstance = getAuth(app);

            // Monitor Auth State
            onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    const token = await user.getIdToken();
                    localStorage.setItem("techno_recruit_local_auth", "true");
                    setAuthenticatedUser(user, token);
                } else {
                    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "0.0.0.0";
                    const isLocalAuthStored = localStorage.getItem("techno_recruit_local_auth") === "true";
                    
                    if (isLocalhost && isLocalAuthStored) {
                        const localUser = {
                            uid: "local_dev_admin",
                            displayName: "Local Developer Admin",
                            email: "dev@techno-recruit.local",
                            photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=techno"
                        };
                        setAuthenticatedUser(localUser, "local_dev_token");
                    } else if (!currentUser) {
                        currentIdToken = null;
                        
                        // Reset UI state
                        if (loginBtn) loginBtn.style.display = "flex";
                        if (userProfile) userProfile.style.display = "none";
                        if (authLockOverlay) authLockOverlay.style.display = "flex";
                        
                        // Clear history list display
                        if (historyList) {
                            historyList.innerHTML = `
                                <div class="history-empty">
                                    <i data-lucide="lock"></i>
                                    <p>Sign in to view history</p>
                                </div>
                            `;
                        }
                        if (careerHistoryList) {
                            careerHistoryList.innerHTML = `
                                <div class="history-empty">
                                    <i data-lucide="lock"></i>
                                    <p>Sign in to view history</p>
                                </div>
                            `;
                        }
                        lucide.createIcons();
                        if (resultsContainer) resultsContainer.style.display = "none";
                        if (traceContainer) traceContainer.style.display = "none";
                    }
                }
            });

            // Check for redirect result if popup was previously blocked
            getRedirectResult(authInstance).then((res) => {
                if (res && res.user) {
                    console.log("Redirect login successful:", res.user);
                }
            }).catch((err) => {
                console.warn("Redirect result check notice:", err);
            });
        } catch (err) {
            console.error("Firebase App initialization failed:", err);
        }
    }

    function setAuthenticatedUser(user, token) {
        currentUser = user;
        currentIdToken = token || "local_dev_token";
        localStorage.setItem("techno_recruit_local_auth", "true");

        if (loginBtn) loginBtn.style.display = "none";
        if (userProfile) userProfile.style.display = "flex";
        if (userAvatar) userAvatar.src = user.photoURL || "https://www.gravatar.com/avatar/?d=mp";
        if (userNameElement) userNameElement.textContent = user.displayName || user.email;
        if (authLockOverlay) authLockOverlay.style.display = "none";

        loadHistoryList();
        loadCareerHistoryList();

        if (document.body.dataset.page === "dashboard") {
            renderDashboardMetrics();
        }

        if (document.body.dataset.page === "login") {
            window.location.href = "/index.html";
        }
    }

    // Attach Auth Event Handlers immediately to all login buttons
    const handleLogin = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const targetBtn = e ? e.currentTarget : null;
        let origHtml = "";
        if (targetBtn) {
            origHtml = targetBtn.innerHTML;
            targetBtn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:18px; height:18px;"></i> <span>Connecting to Google...</span>`;
            if (window.lucide) lucide.createIcons();
            targetBtn.disabled = true;
        }

        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "0.0.0.0";

        try {
            if (!authInstance) {
                await initFirebase();
            }
            if (authInstance) {
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                try {
                    const result = await signInWithPopup(authInstance, provider);
                    if (result && result.user) {
                        setAuthenticatedUser(result.user, await result.user.getIdToken());
                        return;
                    }
                } catch (popupErr) {
                    console.warn("Popup error occurred, checking fallback...", popupErr);
                    if (isLocalhost) {
                        console.log("Localhost detected: using instant local admin login.");
                        const localUser = {
                            uid: "local_dev_admin",
                            displayName: "Local Developer Admin",
                            email: "dev@techno-recruit.local",
                            photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=techno"
                        };
                        setAuthenticatedUser(localUser, "local_dev_token");
                        return;
                    } else {
                        await signInWithRedirect(authInstance, provider);
                        return;
                    }
                }
            } else if (isLocalhost) {
                const localUser = {
                    uid: "local_dev_admin",
                    displayName: "Local Developer Admin",
                    email: "dev@techno-recruit.local",
                    photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=techno"
                };
                setAuthenticatedUser(localUser, "local_dev_token");
                return;
            }
        } catch (err) {
            console.error("Sign in failed:", err);
            if (isLocalhost) {
                const localUser = {
                    uid: "local_dev_admin",
                    displayName: "Local Developer Admin",
                    email: "dev@techno-recruit.local",
                    photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=techno"
                };
                setAuthenticatedUser(localUser, "local_dev_token");
            } else {
                showToast(`Authentication error: ${err.message}`, "error");
            }
        } finally {
            if (targetBtn) {
                targetBtn.innerHTML = origHtml;
                targetBtn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
        }
    };

    document.querySelectorAll("#loginBtn, #overlayLoginBtn, .btn-login").forEach(btn => {
        btn.addEventListener("click", handleLogin);
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                localStorage.removeItem("techno_recruit_local_auth");
                currentUser = null;
                currentIdToken = null;
                if (authInstance) {
                    await signOut(authInstance);
                }
                window.location.reload();
            } catch (err) {
                console.error("Sign out failed:", err);
            }
        });
    }

    // Page Routing and Redirection tab switcher
    function switchTab(pageId, pendingId = null) {
        if (pageId === "navigator") {
            if (pendingId) {
                localStorage.setItem("pending_analysis_id", pendingId);
            }
            if (document.body.dataset.page !== "navigator") {
                window.location.href = "/navigator.html";
            }
        } else if (pageId === "architect") {
            if (pendingId) {
                localStorage.setItem("pending_guide_id", pendingId);
            }
            if (document.body.dataset.page !== "architect") {
                window.location.href = "/architect.html";
            }
        } else if (pageId === "talent-search") {
            if (document.body.dataset.page !== "talent-search") {
                window.location.href = "/talent-search.html";
            }
        } else if (pageId === "ats-optimizer") {
            if (document.body.dataset.page !== "ats-optimizer") {
                window.location.href = "/ats-optimizer.html";
            }
        }
    }

    // Overlay Sidebar Drawer Toggle Setup
    const floatingHistoryBtn = document.getElementById("floatingHistoryBtn");
    const closeSidebarBtn = document.getElementById("closeSidebarBtn");
    const sidebar = document.querySelector(".sidebar");
    
    if (floatingHistoryBtn && sidebar) {
        floatingHistoryBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.add("active");
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener("click", () => {
            sidebar.classList.remove("active");
        });
    }

    // Close sidebar on click outside
    document.addEventListener("click", (e) => {
        if (sidebar && sidebar.classList.contains("active")) {
            if (!sidebar.contains(e.target) && (!floatingHistoryBtn || !floatingHistoryBtn.contains(e.target))) {
                sidebar.classList.remove("active");
            }
        }
    });

    // Embedded Predefined Roles Database & Live Autocomplete Dropdown
    const PREDEFINED_TECH_ROLES = [
        { title: "Full Stack Engineer", domain: "Software Engineering", desc: "Build frontend & backend web applications end-to-end" },
        { title: "Frontend Engineer", domain: "Software Engineering", desc: "React, Vue, TypeScript, UI/UX implementation & performance" },
        { title: "Backend Engineer", domain: "Software Engineering", desc: "Node.js, Python, Java, Microservices, REST & GraphQL APIs" },
        { title: "DevOps & Cloud Engineer", domain: "Infrastructure & Cloud", desc: "AWS, Docker, Kubernetes, CI/CD pipelines & Infrastructure as Code" },
        { title: "Data Engineer", domain: "Data & AI", desc: "ETL pipelines, PySpark, BigQuery, Snowflake, SQL Data Warehousing" },
        { title: "AI / Machine Learning Engineer", domain: "Data & AI", desc: "PyTorch, TensorFlow, LLMs, Computer Vision & NLP Models" },
        { title: "Product Manager", domain: "Product & Strategy", desc: "Roadmaps, Agile/Scrum, User Research, Feature Prioritization" },
        { title: "UI/UX Designer & Product Designer", domain: "Design", desc: "Figma Prototyping, Wireframes, User Testing, Design Systems" },
        { title: "Mobile Application Developer", domain: "Mobile Engineering", desc: "React Native, Flutter, Swift (iOS), Kotlin (Android)" },
        { title: "Cybersecurity Analyst & Engineer", domain: "Security", desc: "Penetration testing, Network security, SIEM, Threat analysis" },
        { title: "Site Reliability Engineer (SRE)", domain: "Infrastructure", desc: "High availability, Incident management, Observability & Prometheus" },
        { title: "Software Architect & Systems Engineer", domain: "Architecture", desc: "Distributed systems, High scalability, System Design, Cloud Architecture" },
        { title: "QA Automation Engineer", domain: "Quality Assurance", desc: "Selenium, Cypress, Playwright, Automated E2E testing pipelines" },
        { title: "Blockchain & Smart Contract Developer", domain: "Web3 & Blockchain", desc: "Solidity, Ethereum, Web3.js, DeFi protocols & Security audits" },
        { title: "Embedded Systems Engineer", domain: "Hardware & IoT", desc: "C/C++, Microcontrollers, RTOS, Firmware & Hardware Integration" },
        { title: "Data Scientist & Analytics Lead", domain: "Data & AI", desc: "Statistical modeling, Python, Pandas, Predictive analytics & Tableau" },
        { title: "Solutions Architect", domain: "Technical Sales & Enterprise", desc: "Enterprise cloud integration, Partner technical solutions, AWS/Azure" },
        { title: "Database Administrator (DBA)", domain: "Data & Infrastructure", desc: "PostgreSQL, MySQL, Performance tuning, Sharding, Replication" },
        { title: "Technical Program Manager (TPM)", domain: "Management", desc: "Cross-functional engineering execution, Agile delivery, Risk management" },
        { title: "Game Developer", domain: "Interactive Media", desc: "Unity, Unreal Engine, C#, C++, 3D Graphics & Physics engines" }
    ];

    const customRoleInput = document.getElementById("customRoleInput");
    const customRoleAutocompleteList = document.getElementById("customRoleAutocompleteList");

    if (customRoleInput && customRoleAutocompleteList) {
        function renderAutocompleteMatches(query = "") {
            const cleanQuery = query.toLowerCase().trim();
            const matches = PREDEFINED_TECH_ROLES.filter(r => 
                !cleanQuery || 
                r.title.toLowerCase().includes(cleanQuery) || 
                r.domain.toLowerCase().includes(cleanQuery) ||
                r.desc.toLowerCase().includes(cleanQuery)
            );

            if (matches.length === 0) {
                customRoleAutocompleteList.style.display = "none";
                return;
            }

            customRoleAutocompleteList.innerHTML = matches.map(r => `
                <div class="autocomplete-dropdown-item" data-title="${r.title}">
                    <div class="autocomplete-item-title">
                        <span>${r.title}</span>
                        <span class="autocomplete-item-domain">${r.domain}</span>
                    </div>
                    <div class="autocomplete-item-desc">${r.desc}</div>
                </div>
            `).join("");

            customRoleAutocompleteList.style.display = "block";

            // Click listener for items
            customRoleAutocompleteList.querySelectorAll(".autocomplete-dropdown-item").forEach(item => {
                item.addEventListener("click", () => {
                    customRoleInput.value = item.dataset.title;
                    customRoleAutocompleteList.style.display = "none";
                });
            });
        }

        customRoleInput.addEventListener("focus", () => {
            renderAutocompleteMatches(customRoleInput.value);
        });

        customRoleInput.addEventListener("input", (e) => {
            renderAutocompleteMatches(e.target.value);
        });

        document.addEventListener("click", (e) => {
            if (!customRoleInput.contains(e.target) && !customRoleAutocompleteList.contains(e.target)) {
                customRoleAutocompleteList.style.display = "none";
            }
        });
    }

    // AI Semantic Talent Pool Search Setup
    const talentSearchQueryInput = document.getElementById("talentSearchQueryInput");
    const executeTalentSearchBtn = document.getElementById("executeTalentSearchBtn");
    const talentSearchLoading = document.getElementById("talentSearchLoading");
    const talentSearchResults = document.getElementById("talentSearchResults");
    const talentSearchBanner = document.getElementById("talentSearchBanner");
    const talentSearchGrid = document.getElementById("talentSearchGrid");

    async function executeTalentSearch(queryText) {
        if (!queryText || !queryText.trim()) {
            showToast("Please enter a talent search query.", "warning");
            return;
        }

        if (!currentIdToken) {
            showToast("Please sign in with Google to search your candidate talent pool.", "warning");
            return;
        }

        executeTalentSearchBtn.disabled = true;
        talentSearchLoading.style.display = "block";
        talentSearchResults.style.display = "none";

        try {
            const response = await fetch(`${API_BASE}/api/search-talent-pool`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentIdToken}`
                },
                body: JSON.stringify({ query: queryText.trim() })
            });

            if (!response.ok) {
                throw new Error("Failed to execute talent search query.");
            }

            const res = await response.json();
            const searchData = res.data || {};
            const matches = searchData.matched_candidates || [];

            talentSearchResults.style.display = "block";

            if (talentSearchBanner) {
                talentSearchBanner.innerHTML = `
                    <div>
                        <strong style="font-size:15px; color:#fff;">Search Results for: "${searchData.query || queryText}"</strong>
                        <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Retrieved ${matches.length} matching candidate profiles sorted by vector relevance score</div>
                    </div>
                    <span class="profile-tag" style="background:rgba(56,189,248,0.2); color:#38bdf8; font-weight:700; padding:4px 10px; border-radius:20px; font-size:12px;">
                        ${matches.length} Matches Found
                    </span>
                `;
            }

            if (talentSearchGrid) {
                if (matches.length === 0) {
                    talentSearchGrid.innerHTML = `
                        <div class="card" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-secondary);">
                            <i data-lucide="search-x" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 12px;"></i>
                            <h4 style="color: var(--text-primary); margin-bottom: 4px;">No Candidate Matches Found</h4>
                            <p style="font-size: 13px; margin: 0;">Try broadening your query terms or uploading more resumes into the Talent Pool.</p>
                        </div>
                    `;
                    lucide.createIcons();
                    return;
                }

                talentSearchGrid.innerHTML = matches.map(match => {
                    const score = match.relevance_score || 0;
                    const scoreColor = score >= 80 ? "var(--color-success)" : (score >= 60 ? "var(--color-primary-light)" : "#f59e0b");
                    const skills = (match.top_skills || []).map(s => `<span class="overview-skill-tag" style="font-size:11px; padding:3px 8px;">${s}</span>`).join("");

                    return `
                        <div class="card candidate-search-match-card" style="padding: 20px; border: 1px solid rgba(255,255,255,0.08); position: relative;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                <div>
                                    <h4 style="font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0;">👤 ${match.candidate_name}</h4>
                                    <span style="font-size: 11px; color: var(--text-secondary);">📄 ${match.filename || 'resume.pdf'}</span>
                                </div>
                                <div style="text-align: right;">
                                    <span style="font-size: 16px; font-weight: 800; color: ${scoreColor}; font-family: var(--font-heading);">${score}%</span>
                                    <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Match Fit</div>
                                </div>
                            </div>

                            <div style="padding: 10px 14px; border-radius: 8px; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 14px;">
                                <div style="font-size: 11px; font-weight: 700; color: var(--color-primary-light); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                    <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i> AI Match Reasoning
                                </div>
                                <p style="font-size: 12.5px; color: var(--text-primary); line-height: 1.5; margin: 0;">${match.match_reasoning || 'Strong candidate alignment with target query requirements.'}</p>
                            </div>

                            ${skills ? `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px;">${skills}</div>` : ''}

                            <button type="button" class="btn-secondary inspect-talent-match-btn" data-analysis-id="${match.analysis_id}" style="width: 100%; justify-content: center; font-size: 12px; padding: 8px 12px;">
                                <span>Inspect Full Scorecard</span>
                                <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                    `;
                }).join("");

                // Attach click handlers to inspect buttons
                talentSearchGrid.querySelectorAll(".inspect-talent-match-btn").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        const targetId = e.currentTarget.dataset.analysisId;
                        if (targetId) {
                            switchTab("navigator", targetId);
                        }
                    });
                });
                lucide.createIcons();
            }
        } catch (e) {
            showToast(`Talent Search Error: ${e.message}`, "error");
        } finally {
            executeTalentSearchBtn.disabled = false;
            talentSearchLoading.style.display = "none";
        }
    }

    if (executeTalentSearchBtn && talentSearchQueryInput) {
        executeTalentSearchBtn.addEventListener("click", () => {
            executeTalentSearch(talentSearchQueryInput.value);
        });

        talentSearchQueryInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                executeTalentSearch(talentSearchQueryInput.value);
            }
        });

        document.querySelectorAll(".search-prompt-pill").forEach(pill => {
            pill.addEventListener("click", (e) => {
                const q = e.currentTarget.dataset.query;
                if (q) {
                    talentSearchQueryInput.value = q;
                    executeTalentSearch(q);
                }
            });
        });
    }

    // AI Resume Enhancer & ATS Optimizer Setup
    const atsResumeDropzone = document.getElementById("atsResumeDropzone");
    const atsResumeFileInput = document.getElementById("atsResumeFileInput");
    const atsResumeDropzoneContent = document.getElementById("atsResumeDropzoneContent");
    const atsResumeTextArea = document.getElementById("atsResumeTextArea");
    const atsJobTitleInput = document.getElementById("atsJobTitleInput");
    const atsJobDescTextArea = document.getElementById("atsJobDescTextArea");
    const runAtsOptimizerBtn = document.getElementById("runAtsOptimizerBtn");
    const atsOptimizerLoading = document.getElementById("atsOptimizerLoading");
    const atsResultsContainer = document.getElementById("atsResultsContainer");
    const atsRoleTitleHeading = document.getElementById("atsRoleTitleHeading");
    const atsScoreValue = document.getElementById("atsScoreValue");
    const atsMatchedKeywordsPills = document.getElementById("atsMatchedKeywordsPills");
    const atsMissingKeywordsPills = document.getElementById("atsMissingKeywordsPills");
    const atsImpactImprovementsList = document.getElementById("atsImpactImprovementsList");
    const atsOptimizedResumeText = document.getElementById("atsOptimizedResumeText");
    const copyAtsResumeBtn = document.getElementById("copyAtsResumeBtn");
    const downloadAtsResumeBtn = document.getElementById("downloadAtsResumeBtn");

    let selectedAtsFile = null;

    if (atsResumeDropzone && atsResumeFileInput) {
        atsResumeDropzone.addEventListener("click", () => atsResumeFileInput.click());

        atsResumeFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                selectedAtsFile = e.target.files[0];
                atsResumeDropzoneContent.innerHTML = `
                    <i data-lucide="file-check" class="dropzone-icon" style="width: 32px; height: 32px; color: var(--color-success);"></i>
                    <p class="dropzone-title" style="font-size: 14px; font-weight: 700; color: #fff;">${selectedAtsFile.name}</p>
                    <p class="dropzone-subtitle" style="font-size: 12px; color: var(--color-success);">Resume file ready for ATS optimization</p>
                `;
                lucide.createIcons();
            }
        });

        atsResumeDropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            atsResumeDropzone.classList.add("dragover");
        });

        atsResumeDropzone.addEventListener("dragleave", () => {
            atsResumeDropzone.classList.remove("dragover");
        });

        atsResumeDropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            atsResumeDropzone.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                selectedAtsFile = e.dataTransfer.files[0];
                atsResumeDropzoneContent.innerHTML = `
                    <i data-lucide="file-check" class="dropzone-icon" style="width: 32px; height: 32px; color: var(--color-success);"></i>
                    <p class="dropzone-title" style="font-size: 14px; font-weight: 700; color: #fff;">${selectedAtsFile.name}</p>
                    <p class="dropzone-subtitle" style="font-size: 12px; color: var(--color-success);">Resume file ready for ATS optimization</p>
                `;
                lucide.createIcons();
            }
        });
    }

    if (runAtsOptimizerBtn) {
        runAtsOptimizerBtn.addEventListener("click", async () => {
            const jobTitle = atsJobTitleInput ? atsJobTitleInput.value.trim() : "";
            const jobDesc = atsJobDescTextArea ? atsJobDescTextArea.value.trim() : "";
            const rawResumeText = atsResumeTextArea ? atsResumeTextArea.value.trim() : "";

            if (!selectedAtsFile && !rawResumeText) {
                showToast("Please upload a resume file or paste resume text.", "warning");
                return;
            }

            if (!jobDesc) {
                showToast("Please enter target Job Description & key requirements.", "warning");
                return;
            }

            runAtsOptimizerBtn.disabled = true;
            atsOptimizerLoading.style.display = "block";
            atsResultsContainer.style.display = "none";

            try {
                const formData = new FormData();
                if (selectedAtsFile) {
                    formData.append("file", selectedAtsFile);
                } else {
                    formData.append("resume_text", rawResumeText);
                }
                formData.append("job_title", jobTitle || "Target Role");
                formData.append("job_description", jobDesc);

                const response = await fetch(`${API_BASE}/api/optimize-resume`, {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    const errJson = await response.json().catch(() => ({}));
                    throw new Error(errJson.detail || "Failed to execute ATS optimization.");
                }

                const result = await response.json();
                const data = result.data || {};

                atsResultsContainer.style.display = "block";

                if (atsRoleTitleHeading) {
                    atsRoleTitleHeading.textContent = `Target Role: ${data.job_title || jobTitle || 'Target Position'}`;
                }

                if (atsScoreValue) {
                    const score = data.ats_score || 0;
                    atsScoreValue.textContent = `${score}%`;
                    atsScoreValue.style.color = score >= 80 ? "var(--color-success)" : (score >= 60 ? "var(--color-primary-light)" : "#f59e0b");
                }

                if (atsMatchedKeywordsPills) {
                    const matched = data.matched_keywords || [];
                    atsMatchedKeywordsPills.innerHTML = matched.length ? matched.map(kw => `
                        <span class="domain-pill" style="background:rgba(16,185,129,0.18); color:#34d399; border:1px solid rgba(16,185,129,0.3); font-size:12px; padding:4px 10px; font-weight:600;">✓ ${kw}</span>
                    `).join("") : `<span style="font-size:13px; color:var(--text-muted);">No exact matching keywords found</span>`;
                }

                if (atsMissingKeywordsPills) {
                    const missing = data.missing_keywords || [];
                    atsMissingKeywordsPills.innerHTML = missing.length ? missing.map(kw => `
                        <span class="domain-pill" style="background:rgba(245,158,11,0.18); color:#fbbf24; border:1px solid rgba(245,158,11,0.3); font-size:12px; padding:4px 10px; font-weight:600;">+ ${kw}</span>
                    `).join("") : `<span style="font-size:13px; color:var(--color-success);">Zero critical keywords missing! Excellent coverage.</span>`;
                }

                if (atsImpactImprovementsList) {
                    const improvements = data.formatting_and_impact_improvements || [];
                    atsImpactImprovementsList.innerHTML = improvements.map(imp => `
                        <li style="margin-bottom: 8px;">${imp}</li>
                    `).join("");
                }

                if (atsOptimizedResumeText) {
                    atsOptimizedResumeText.textContent = data.ats_optimized_resume_text || "No resume text generated.";
                }

                showToast("AI Resume Optimization & ATS Gap Audit Complete!", "success");
            } catch (err) {
                showToast(`ATS Optimization Error: ${err.message}`, "error");
            } finally {
                runAtsOptimizerBtn.disabled = false;
                atsOptimizerLoading.style.display = "none";
            }
        });
    }

    if (copyAtsResumeBtn && atsOptimizedResumeText) {
        copyAtsResumeBtn.addEventListener("click", () => {
            const text = atsOptimizedResumeText.textContent;
            if (!text) return;
            navigator.clipboard.writeText(text).then(() => {
                showToast("Tailored ATS resume content copied to clipboard!", "success");
            }).catch(err => {
                showToast("Failed to copy text", "error");
            });
        });
    }

    if (downloadAtsResumeBtn && atsOptimizedResumeText) {
        downloadAtsResumeBtn.addEventListener("click", () => {
            const text = atsOptimizedResumeText.textContent;
            if (!text) return;
            const jTitle = (atsJobTitleInput && atsJobTitleInput.value.trim()) ? atsJobTitleInput.value.trim() : "Target_Role";
            const cleanFilename = `${jTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_ATS_Optimized_Resume.txt`;
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = cleanFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(`Downloaded ${cleanFilename}`, "success");
        });
    }

    // Custom Role Analysis Event Handler
    const analyzeCustomRoleBtn = document.getElementById("analyzeCustomRoleBtn");
    const customRoleLoading = document.getElementById("customRoleLoading");

    if (analyzeCustomRoleBtn && customRoleInput && customRoleLoading) {
        analyzeCustomRoleBtn.addEventListener("click", async () => {
            const roleTitle = customRoleInput.value.trim();
            if (!roleTitle) {
                showToast("Please enter a target job title.", "warning");
                return;
            }

            if (!navigatorResumeText || !navigatorResumeText.trim()) {
                showToast("Please upload or parse a resume first to evaluate suitability against.", "warning");
                return;
            }

            analyzeCustomRoleBtn.disabled = true;
            customRoleLoading.style.display = "block";

            try {
                const response = await fetch(`${API_BASE}/api/analyze-custom-role`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${currentIdToken}`
                    },
                    body: JSON.stringify({
                        resume_text: navigatorResumeText,
                        role_title: roleTitle
                    })
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(err || "Failed to analyze custom role suitability.");
                }

                const role = await response.json();
                
                if (rolesGrid) {
                    const roleCard = document.createElement("div");
                    roleCard.className = "role-card custom-analyzed-role";
                    roleCard.style.border = "1px solid var(--color-primary-light)";
                    roleCard.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.2)";

                    const strengths = (role.key_strengths || []).map(s => `<li>${s}</li>`).join("");
                    const gaps = (role.skill_gaps || []).map(g => `<li>${g}</li>`).join("");

                    roleCard.innerHTML = `
                        <div class="role-card-header">
                            <h4 style="color:var(--color-primary-light);"><i data-lucide="plus-circle" style="width:18px; height:18px; vertical-align:middle; margin-right:4px;"></i> ${role.role_title}</h4>
                            <span class="domain-pill" style="background:rgba(99,102,241,0.2); color:var(--color-primary-light); border:1px solid var(--color-primary-light);">${role.domain || "Technology"}</span>
                        </div>
                        <p class="role-match-summary">${role.match_summary}</p>
                        
                        <div class="level-scores-box">
                            <div class="level-score-row">
                                <div class="level-score-label">
                                    <span>Junior / Beginner Match</span>
                                    <span class="score-val beginner">${role.beginner_score || 0}%</span>
                                </div>
                                <div class="level-meter-bg">
                                    <div class="level-meter-fill beginner" style="width: ${role.beginner_score || 0}%"></div>
                                </div>
                            </div>

                            <div class="level-score-row">
                                <div class="level-score-label">
                                    <span>Mid-Level Match</span>
                                    <span class="score-val intermediate">${role.intermediate_score || 0}%</span>
                                </div>
                                <div class="level-meter-bg">
                                    <div class="level-meter-fill intermediate" style="width: ${role.intermediate_score || 0}%"></div>
                                </div>
                            </div>

                            <div class="level-score-row">
                                <div class="level-score-label">
                                    <span>Senior / Lead Match</span>
                                    <span class="score-val experienced">${role.experienced_score || 0}%</span>
                                </div>
                                <div class="level-meter-bg">
                                    <div class="level-meter-fill experienced" style="width: ${role.experienced_score || 0}%"></div>
                                </div>
                            </div>
                        </div>

                        <div class="role-details-section">
                            <div class="detail-block">
                                <h5 class="strengths-title"><i data-lucide="check-circle-2"></i> Key Candidate Strengths</h5>
                                <ul class="details-list">${strengths}</ul>
                            </div>
                            <div class="detail-block">
                                <h5 class="gaps-title"><i data-lucide="x-circle"></i> Identified Skill Gaps</h5>
                                <ul class="details-list">${gaps}</ul>
                            </div>
                        </div>

                        <div class="role-next-steps">
                            <h5><i data-lucide="arrow-right-circle"></i> Recommended Next Steps</h5>
                            <p>${role.recommended_next_steps}</p>
                        </div>
                    `;

                    rolesGrid.insertBefore(roleCard, rolesGrid.firstChild);
                    customRoleInput.value = "";
                    roleCard.scrollIntoView({ behavior: "smooth", block: "center" });
                    if (window.lucide) lucide.createIcons();
                }
            } catch (err) {
                showToast(`Custom Role Analysis Error: ${err.message}`, "error");
            } finally {
                analyzeCustomRoleBtn.disabled = false;
                customRoleLoading.style.display = "none";
            }
        });
    }

    // Trigger Firebase init
    initFirebase();

    if (tourBtn) tourBtn.addEventListener("click", () => showOnboardingModal(0));
    if (dashboardStartTourBtn) dashboardStartTourBtn.addEventListener("click", () => showOnboardingModal(0));

    // Page Route Initialization
    const currentPage = document.body.dataset.page || "dashboard";
    if (currentPage === "dashboard") {
        renderDashboardMetrics();
    } else if (currentPage === "navigator") {
        // Ready for navigator page
    } else if (currentPage === "architect") {
        // Ready for architect page
    }

    // Dashboard Metrics & Activity Feed Renderer
    async function renderDashboardMetrics() {
        const dashMetricCandidates = document.getElementById("dashMetricCandidates");
        const dashMetricGuides = document.getElementById("dashMetricGuides");
        const dashMetricAvgFit = document.getElementById("dashMetricAvgFit");
        const dashMetricTopDomain = document.getElementById("dashMetricTopDomain");
        const dashRecentActivityFeed = document.getElementById("dashRecentActivityFeed");

        if (!currentIdToken) return;

        try {
            // Fetch career history metrics
            const historyResp = await fetch(`${API_BASE}/api/career-history`, {
                headers: { "Authorization": `Bearer ${currentIdToken}` }
            });
            let items = [];
            if (historyResp.ok) {
                items = await historyResp.json();
                if (dashMetricCandidates) dashMetricCandidates.textContent = items.length;
            }

            // Fetch guides metrics
            const guidesResp = await fetch(`${API_BASE}/api/history`, {
                headers: { "Authorization": `Bearer ${currentIdToken}` }
            });
            if (guidesResp.ok) {
                const guides = await guidesResp.json();
                if (dashMetricGuides) dashMetricGuides.textContent = guides.length;
            }

            if (items && items.length > 0) {
                // Compute average score & top domain
                let totalScoreSum = 0;
                let totalScoreCount = 0;
                const domainCounts = {};

                items.forEach(item => {
                    const roles = item.data?.suggested_roles || [];
                    roles.forEach(r => {
                        totalScoreSum += (r.beginner_score || 0) + (r.intermediate_score || 0) + (r.experienced_score || 0);
                        totalScoreCount += 3;
                        const d = r.domain || "Software Engineering";
                        domainCounts[d] = (domainCounts[d] || 0) + 1;
                    });
                });

                if (totalScoreCount > 0 && dashMetricAvgFit) {
                    dashMetricAvgFit.textContent = `${Math.round(totalScoreSum / totalScoreCount)}%`;
                }

                const topDomain = Object.keys(domainCounts).reduce((a, b) => domainCounts[a] > domainCounts[b] ? a : b, "Software Engineering");
                if (dashMetricTopDomain) dashMetricTopDomain.textContent = topDomain;

                // Render recent activity feed
                if (dashRecentActivityFeed) {
                    let feedHtml = "";
                    items.slice(0, 4).forEach(item => {
                        let rawName = item.candidate_name || item.data?.candidate_name || "";
                        if (!rawName || rawName === "Uploaded Resume" || rawName === "Candidate Profile") {
                            rawName = (item.filename && item.filename !== "Uploaded Resume") ? item.filename.replace(/\.[^/.]+$/, "") : "Candidate Profile";
                        }
                        const cName = rawName;
                        const dateStr = item.timestamp ? new Date(item.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recent";
                        const rolesCount = item.data?.suggested_roles?.length || 0;
                        const verTag = item.version ? ` (V${item.version})` : "";

                        feedHtml += `
                            <div class="activity-feed-item" style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:rgba(15,23,42,0.6); border:1px solid var(--border-color); border-radius:var(--radius-sm); margin-bottom:10px;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div style="width:36px; height:36px; border-radius:50%; background:rgba(99,102,241,0.2); display:flex; align-items:center; justify-content:center; color:var(--color-primary-light);">
                                        <i data-lucide="user-check" style="width:18px; height:18px;"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight:700; font-size:14px; color:var(--text-primary);">${cName}${verTag}</div>
                                        <div style="font-size:12px; color:var(--text-secondary);">Evaluated ${rolesCount} career paths • ${item.filename || 'resume.pdf'}</div>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <span style="font-size:11px; color:var(--text-muted);">${dateStr}</span>
                                    <button type="button" class="btn-secondary inspect-activity-btn" data-analysis-id="${item.analysis_id}" style="padding:6px 12px; font-size:12px;">
                                        <span>Inspect</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                    dashRecentActivityFeed.innerHTML = feedHtml;

                    // Attach click event to inspect buttons
                    document.querySelectorAll(".inspect-activity-btn").forEach(btn => {
                        btn.addEventListener("click", (e) => {
                            const targetId = e.currentTarget.dataset.analysisId;
                            const matchItem = items.find(i => i.analysis_id === targetId);
                            if (matchItem) {
                                switchTab("navigator");
                                const selectEl = document.getElementById("candidateSelectorSelect");
                                const nameInputEl = document.getElementById("candidateNameInput");
                                if (selectEl) selectEl.value = targetId;
                                if (nameInputEl) nameInputEl.value = matchItem.candidate_name || matchItem.data?.candidate_name || "";
                                renderCareerNavigatorResults(matchItem.data, null, matchItem);
                            }
                        });
                    });
                    lucide.createIcons();
                }
            }
        } catch (e) {
            console.warn("Failed to render dashboard metrics:", e);
        }
    }

    // INTERACTIVE ONBOARDING TOUR MODAL LOGIC
    const onboardingStepContent = document.getElementById("onboardingStepContent");
    const onboardingStepIndicators = document.getElementById("onboardingStepIndicators");

    let currentOnboardingStep = 0;

    const onboardingSteps = [
        {
            icon: "compass",
            title: "1. AI Career Navigator & Role Recommender",
            desc: "Upload candidate resumes in PDF, DOCX, or TXT format to immediately calculate match suitability scores (0-100%) across Junior (0-2 yrs), Mid-Level (3-5 yrs), and Senior (5-8+ yrs) positions across 3 to 5 recommended tech roles."
        },
        {
            icon: "crown",
            title: "2. Experience Highlights & Score Versioning",
            desc: "Techno Recruit automatically extracts key candidate achievements into specialized highlight cards: Leadership & Student Community, Hackathons & Awards, and Company Internships. Re-screen candidate profiles to compare Version 1 vs Version 2 score improvements side-by-side!"
        },
        {
            icon: "brain-circuit",
            title: "3. Interview Architect & Rubric Grading",
            desc: "Input job specifications to launch an autonomous 4-agent orchestration loop (JD Analyzer, Question Architect, Critic Refiner, and Scorecard Architect). Generates 6 STAR behavioral & technical questions complete with model evaluation rubrics."
        }
    ];

    function showOnboardingModal(stepIndex = 0) {
        currentOnboardingStep = stepIndex;
        renderOnboardingStep();
        if (onboardingModal) onboardingModal.style.display = "flex";
    }

    function renderOnboardingStep() {
        if (!onboardingStepContent) return;
        const step = onboardingSteps[currentOnboardingStep];

        onboardingStepContent.innerHTML = `
            <div class="onboarding-step-hero">
                <div class="onboarding-step-icon">
                    <i data-lucide="${step.icon}" style="width: 32px; height: 32px;"></i>
                </div>
                <h3 class="onboarding-step-title">${step.title}</h3>
                <p class="onboarding-step-desc">${step.desc}</p>
            </div>
        `;

        if (onboardingNextBtn) {
            onboardingNextBtn.textContent = currentOnboardingStep === onboardingSteps.length - 1 ? "Get Started" : "Next Step";
        }
        if (onboardingPrevBtn) {
            onboardingPrevBtn.style.display = currentOnboardingStep > 0 ? "inline-block" : "none";
        }

        if (onboardingStepIndicators) {
            const dots = onboardingStepIndicators.querySelectorAll(".step-dot");
            dots.forEach((dot, idx) => {
                if (idx === currentOnboardingStep) {
                    dot.style.background = "var(--color-primary-light)";
                    dot.style.width = "16px";
                } else {
                    dot.style.background = "var(--border-color)";
                    dot.style.width = "10px";
                }
            });
        }

        lucide.createIcons();
    }

    if (closeOnboardingBtn) {
        closeOnboardingBtn.addEventListener("click", () => {
            if (onboardingModal) onboardingModal.style.display = "none";
            localStorage.setItem("techno_recruit_onboarded", "true");
        });
    }

    if (onboardingNextBtn) {
        onboardingNextBtn.addEventListener("click", () => {
            if (currentOnboardingStep < onboardingSteps.length - 1) {
                currentOnboardingStep++;
                renderOnboardingStep();
            } else {
                if (onboardingModal) onboardingModal.style.display = "none";
                localStorage.setItem("techno_recruit_onboarded", "true");
                window.location.href = "/navigator.html";
            }
        });
    }

    if (onboardingPrevBtn) {
        onboardingPrevBtn.addEventListener("click", () => {
            if (currentOnboardingStep > 0) {
                currentOnboardingStep--;
                renderOnboardingStep();
            }
        });
    }

    // Show onboarding tour automatically for new visitors
    const onboarded = localStorage.getItem("techno_recruit_onboarded");
    if (!onboarded && document.body.dataset.page === "dashboard") {
        setTimeout(() => showOnboardingModal(0), 1000);
    }

    // Resume State & Drag-and-Drop Parsing Logic
    let architectResumeText = "";
    let navigatorResumeText = "";

    async function handleResumeUpload(file, badgeEl, fileNameEl, fileWordsEl, textAssignCallback) {
        if (!file) return;
        badgeEl.style.display = "flex";
        fileNameEl.textContent = file.name;
        fileWordsEl.textContent = "Parsing text...";
        fileWordsEl.style.color = "var(--color-info)";

        const formData = new FormData();
        formData.append("file", file);

        try {
            const headers = {};
            if (currentIdToken) {
                headers["Authorization"] = `Bearer ${currentIdToken}`;
            }

            const response = await fetch(`${API_BASE}/api/parse-resume`, {
                method: "POST",
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err || "Resume parsing failed.");
            }

            const data = await response.json();
            textAssignCallback(data.resume_text);
            fileWordsEl.textContent = `${data.word_count || 0} words extracted`;
            fileWordsEl.style.color = "var(--color-success)";
        } catch (err) {
            showToast(`Resume Upload Error: ${err.message}`, "error");
            badgeEl.style.display = "none";
            textAssignCallback("");
        }
    }

    function setupDropzone(dropzoneId, inputId, badgeId, fileNameId, wordsId, removeBtnId, textAssignCallback) {
        const dropzone = document.getElementById(dropzoneId);
        const input = document.getElementById(inputId);
        const badge = document.getElementById(badgeId);
        const fileName = document.getElementById(fileNameId);
        const words = document.getElementById(wordsId);
        const removeBtn = document.getElementById(removeBtnId);

        if (!dropzone || !input) return;

        input.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        dropzone.addEventListener("click", (e) => {
            if (removeBtnId && e.target.closest(`#${removeBtnId}`)) return;
            input.click();
        });

        dropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        });

        dropzone.addEventListener("dragleave", () => {
            dropzone.classList.remove("dragover");
        });

        dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleResumeUpload(e.dataTransfer.files[0], badge, fileName, words, textAssignCallback);
            }
        });

        input.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                handleResumeUpload(e.target.files[0], badge, fileName, words, textAssignCallback);
            }
        });

        if (removeBtn) {
            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                input.value = "";
                badge.style.display = "none";
                textAssignCallback("");
            });
        }
    }

    // Career Navigator Agent Execution
    const analyzeCareerBtn = document.getElementById("analyzeCareerBtn");
    const navigatorLoading = document.getElementById("navigatorLoading");
    const navigatorResults = document.getElementById("navigatorResults");
    const candidateOverviewCard = document.getElementById("candidateOverviewCard");
    const scoreComparisonBanner = document.getElementById("scoreComparisonBanner");
    const sideBySideTableCard = document.getElementById("sideBySideTableCard");
    const rolesGrid = document.getElementById("rolesGrid");

    const candidateSelectorSelect = document.getElementById("candidateSelectorSelect");
    const candidateNameInput = document.getElementById("candidateNameInput");

    let selectedParentAnalysisId = null;

    setupDropzone("architectResumeDropzone", "architectResumeInput", "architectResumeBadge", "architectFileName", "architectFileWords", "removeArchitectResumeBtn", (txt) => { architectResumeText = txt; });
    setupDropzone("navigatorResumeDropzone", "navigatorResumeInput", "navigatorResumeBadge", "navigatorFileName", "navigatorFileWords", "removeNavigatorResumeBtn", (txt) => { 
        navigatorResumeText = txt; 
        // Reset previously selected candidate dropdown and inputs on fresh resume upload/removal
        if (candidateSelectorSelect) candidateSelectorSelect.value = "";
        selectedParentAnalysisId = null;
        if (candidateNameInput) candidateNameInput.value = "";
    });

    if (candidateSelectorSelect) {
        candidateSelectorSelect.addEventListener("change", (e) => {
            const val = e.target.value;
            if (val) {
                const opt = candidateSelectorSelect.options[candidateSelectorSelect.selectedIndex];
                selectedParentAnalysisId = val;
                if (candidateNameInput && opt.dataset.candidateName) {
                    candidateNameInput.value = opt.dataset.candidateName;
                }
            } else {
                selectedParentAnalysisId = null;
            }
        });
    }

    if (analyzeCareerBtn) {
        analyzeCareerBtn.addEventListener("click", async () => {
            if (!currentUser) {
                showToast("Please sign in with Google first.", "warning");
                return;
            }

            if (!navigatorResumeText || !navigatorResumeText.trim()) {
                showToast("Please upload a candidate resume file (PDF, DOCX, or TXT) first.", "warning");
                return;
            }

            analyzeCareerBtn.disabled = true;
            navigatorLoading.style.display = "block";
            navigatorResults.style.display = "none";
            navigatorLoading.scrollIntoView({ behavior: "smooth", block: "center" });

            try {
                const formData = new FormData();
                formData.append("resume_text", navigatorResumeText);
                if (candidateNameInput && candidateNameInput.value.trim()) {
                    formData.append("candidate_name", candidateNameInput.value.trim());
                }
                if (selectedParentAnalysisId) {
                    formData.append("parent_analysis_id", selectedParentAnalysisId);
                }

                const response = await fetch(`${API_BASE}/api/suggest-roles`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${currentIdToken}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(err || "Career Navigator Agent failed.");
                }

                const resData = await response.json();
                renderCareerNavigatorResults(resData.data, resData.baseline_session, resData.session);
                loadCareerHistoryList();
            } catch (e) {
                showToast(`Career Analysis Error: ${e.message}`, "error");
            } finally {
                analyzeCareerBtn.disabled = false;
                navigatorLoading.style.display = "none";
            }
        });
    }

    async function loadCareerHistoryList() {
        if (!careerHistoryList || !currentIdToken) return;
        try {
            const response = await fetch(`${API_BASE}/api/career-history`, {
                headers: { "Authorization": `Bearer ${currentIdToken}` }
            });
            if (!response.ok) return;

            const items = await response.json();
            if (!items || items.length === 0) {
                careerHistoryList.innerHTML = `
                    <div class="history-empty">
                        <i data-lucide="file-text"></i>
                        <p>No saved resume runs</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            careerHistoryList.innerHTML = "";
            
            // Populate candidate dropdown
            if (candidateSelectorSelect) {
                candidateSelectorSelect.innerHTML = `<option value="">-- Start New Candidate Profile --</option>`;
                items.forEach(item => {
                    let rawName = item.candidate_name || item.data?.candidate_name || "";
                    if (!rawName || rawName === "Uploaded Resume" || rawName === "Candidate Profile") {
                        rawName = (item.filename && item.filename !== "Uploaded Resume") ? item.filename.replace(/\.[^/.]+$/, "") : "Candidate Profile";
                    }
                    const opt = document.createElement("option");
                    opt.value = item.analysis_id;
                    opt.dataset.candidateName = rawName;
                    const verStr = item.version ? ` (V${item.version})` : "";
                    opt.textContent = `${rawName} - ${item.filename || 'Resume'}${verStr}`;
                    candidateSelectorSelect.appendChild(opt);
                });
            }

            const pendingAnalysisId = localStorage.getItem("pending_analysis_id");

            items.forEach(item => {
                const div = document.createElement("div");
                div.className = "career-history-item";
                const dateStr = item.timestamp ? new Date(item.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recent";
                const rolesCount = item.data?.suggested_roles?.length || 0;
                
                let rawName = item.candidate_name || item.data?.candidate_name || "";
                if (!rawName || rawName === "Uploaded Resume" || rawName === "Candidate Profile") {
                    rawName = (item.filename && item.filename !== "Uploaded Resume") ? item.filename.replace(/\.[^/.]+$/, "") : "Candidate Profile";
                }
                const cName = rawName;
                const verTag = item.version ? ` <span class="profile-tag" style="font-size:10px; padding:2px 6px; background:rgba(99,102,241,0.2); color:var(--color-primary-light);">V${item.version}</span>` : "";

                div.innerHTML = `
                    <div class="career-history-filename" style="font-weight:700; color:var(--text-primary);">👤 ${cName}${verTag}</div>
                    <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">📄 ${item.filename || 'resume.pdf'}</div>
                    <div class="career-history-meta">
                        <span>🎯 ${rolesCount} Roles Evaluated</span>
                        <span>📅 ${dateStr}</span>
                    </div>
                `;

                div.addEventListener("click", () => {
                    document.querySelectorAll(".career-history-item").forEach(el => el.classList.remove("active"));
                    div.classList.add("active");
                    switchTab("navigator", item.analysis_id);
                    if (candidateNameInput) candidateNameInput.value = cName;
                    selectedParentAnalysisId = item.analysis_id;
                    renderCareerNavigatorResults(item.data, null, item);
                });

                careerHistoryList.appendChild(div);

                if (pendingAnalysisId && item.analysis_id === pendingAnalysisId) {
                    localStorage.removeItem("pending_analysis_id");
                    setTimeout(() => div.click(), 100);
                }
            });
            lucide.createIcons();
        } catch (e) {
            console.warn("Failed to load career history:", e);
        }
    }

    function renderCareerNavigatorResults(data, baselineSession, currentSessionRecord) {
        if (!data) return;
        navigatorResults.style.display = "block";
        navigatorResults.scrollIntoView({ behavior: "smooth", block: "start" });

        let rawName = currentSessionRecord?.candidate_name || data.candidate_name || "";
        if (!rawName || rawName === "Uploaded Resume" || rawName === "Candidate Profile") {
            rawName = (currentSessionRecord?.filename && currentSessionRecord.filename !== "Uploaded Resume") ? currentSessionRecord.filename.replace(/\.[^/.]+$/, "") : "Candidate Profile";
        }
        const cName = rawName;
        const cVer = currentSessionRecord?.version ? ` (Version ${currentSessionRecord.version})` : "";

        if (candidateNameInput && !candidateNameInput.value.trim()) {
            candidateNameInput.value = cName;
        }

        // Render Delta Score Comparison Banner if baseline session is available
        const prevData = baselineSession ? baselineSession.data : null;
        if (prevData && prevData.suggested_roles && scoreComparisonBanner) {
            scoreComparisonBanner.style.display = "block";
            const prevRoles = prevData.suggested_roles || [];
            const currRoles = data.suggested_roles || [];

            const calculateAvgScore = (roles, field) => {
                if (!roles.length) return 0;
                const sum = roles.reduce((acc, r) => acc + (r[field] || 0), 0);
                return Math.round(sum / roles.length);
            };

            const prevBeg = calculateAvgScore(prevRoles, "beginner_score");
            const currBeg = calculateAvgScore(currRoles, "beginner_score");
            const diffBeg = currBeg - prevBeg;

            const prevInt = calculateAvgScore(prevRoles, "intermediate_score");
            const currInt = calculateAvgScore(currRoles, "intermediate_score");
            const diffInt = currInt - prevInt;

            const prevExp = calculateAvgScore(prevRoles, "experienced_score");
            const currExp = calculateAvgScore(currRoles, "experienced_score");
            const diffExp = currExp - prevExp;

            const formatDelta = (val) => {
                if (val > 0) return `<span class="delta-badge positive"><i data-lucide="trending-up"></i> +${val}%</span>`;
                if (val < 0) return `<span class="delta-badge negative"><i data-lucide="trending-down"></i> ${val}%</span>`;
                return `<span class="delta-badge neutral"><i data-lucide="minus"></i> 0%</span>`;
            };

            scoreComparisonBanner.innerHTML = `
                <div class="comparison-title">
                    <i data-lucide="sparkles"></i>
                    Resume Progression: ${cName} (Before vs Updated Version)
                </div>
                <div class="comparison-subtitle">
                    Tracking score improvement from baseline (${baselineSession.filename || 'Previous Resume'}) to current version (${currentSessionRecord?.filename || 'Updated Resume'}):
                </div>
                <div class="delta-grid">
                    <div class="delta-item">
                        <div class="delta-label">Junior / Beginner Match</div>
                        ${formatDelta(diffBeg)}
                        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${prevBeg}% → ${currBeg}%</div>
                    </div>
                    <div class="delta-item">
                        <div class="delta-label">Mid-Level Match</div>
                        ${formatDelta(diffInt)}
                        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${prevInt}% → ${currInt}%</div>
                    </div>
                    <div class="delta-item">
                        <div class="delta-label">Senior / Lead Match</div>
                        ${formatDelta(diffExp)}
                        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${prevExp}% → ${currExp}%</div>
                    </div>
                </div>
            `;

            // Render Side-by-Side Before vs After Comparison Table
            if (sideBySideTableCard) {
                sideBySideTableCard.style.display = "block";
                let tableRows = "";

                currRoles.forEach(cRole => {
                    const matchPrevRole = prevRoles.find(r => r.role_title.toLowerCase().trim() === cRole.role_title.toLowerCase().trim()) || prevRoles[0];
                    const pBeg = matchPrevRole ? matchPrevRole.beginner_score : 0;
                    const cBeg = cRole.beginner_score;
                    
                    const pInt = matchPrevRole ? matchPrevRole.intermediate_score : 0;
                    const cInt = cRole.intermediate_score;
                    
                    const pExp = matchPrevRole ? matchPrevRole.experienced_score : 0;
                    const cExp = cRole.experienced_score;

                    tableRows += `
                        <tr>
                            <td><strong>${cRole.role_title}</strong></td>
                            <td class="score-cell"><span class="score-v1">${pBeg}%</span> <span class="score-v2">${cBeg}%</span></td>
                            <td class="score-cell"><span class="score-v1">${pInt}%</span> <span class="score-v2">${cInt}%</span></td>
                            <td class="score-cell"><span class="score-v1">${pExp}%</span> <span class="score-v2">${cExp}%</span></td>
                        </tr>
                    `;
                });

                sideBySideTableCard.innerHTML = `
                    <h4 style="font-family:var(--font-heading); font-size:16px; color:var(--text-primary); margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="arrow-left-right" style="color:var(--color-primary-light);"></i> Side-by-Side Role Score Comparison (Before V1 vs Updated V2)
                    </h4>
                    <p style="font-size:12px; color:var(--text-secondary);">Comparing score progression for candidate <strong>${cName}</strong> across individual target job roles:</p>
                    <div class="comparison-table-wrapper">
                        <table class="comparison-table">
                            <thead>
                                <tr>
                                    <th>Target Role</th>
                                    <th>Beginner Score (Before → After)</th>
                                    <th>Mid-Level Score (Before → After)</th>
                                    <th>Senior Score (Before → After)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            lucide.createIcons();
        } else {
            if (scoreComparisonBanner) scoreComparisonBanner.style.display = "none";
            if (sideBySideTableCard) sideBySideTableCard.style.display = "none";
        }

        function parseBold(text) {
            if (!text) return "";
            let str = String(text);
            
            // 1. Replace explicit markdown **bold**
            str = str.replace(/\*\*(.*?)\*\*/g, '<strong class="highlight-strong">$1</strong>');

            // 2. Highlight key action words / awards
            str = str.replace(/\b(Winner of the|Winner of|Winner at|Winner|Runner-up in the|Runner-up at|Runner-up|Runner Up|1st Place|First Place|Top 3|Secured|Won)\b/gi, '<span class="highlight-gold">$1</span>');

            // 3. Highlight key job roles / leadership titles
            str = str.replace(/\b(Full Stack Developer Intern|Full Stack Developer|Frontend Developer|Backend Developer|Product Designer|UI\/UX Designer|Campus Lead|Associate Director|Secretary|Design Lead|Digital Illustrator|Software Engineer|Data Scientist|DevOps Engineer|Project Lead|Co-founded)\b/gi, '<span class="highlight-cyan">$1</span>');

            // 4. Highlight key organization / institution names
            str = str.replace(/\b(Google Developer Group On Campus - CIT|Google Developer Group|Google Developer Groups|Student Developers Cell - CIT|Student Developers Cell|Xthlete|TIA IT|NIT Surathkal|NITK|Amrita Vishwa Vidyapeetham|Create Digital Solutions|Snippet Script|CIT)\b/gi, '<span class="highlight-purple">$1</span>');

            // 5. Highlight hackathon & project names
            str = str.replace(/\b(Quantum Challenge 2023|CryptoShield 2K24|HackVerse 5\.0|Beyond Abstraction|Altruisty Design Challenge|DeFai-Nexus|Eco-Fortune|Techno Badge|Student Shield)\b/gi, '<span class="highlight-emerald">$1</span>');

            return str;
        }

        // Render Candidate Overview Card
        const topSkills = data.top_skills_identified || [];

        // Build Extracted Links Section
        let linksHtml = "";
        const rawLinks = data.profile_and_project_links || [];
        if (Array.isArray(rawLinks) && rawLinks.length > 0) {
            linksHtml = `
                <div class="overview-links-section" style="margin-top:16px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                        <i data-lucide="link-2" style="width:15px; height:15px; color:var(--color-primary-light);"></i>
                        Extracted Profile & Project Hyperlinks (${rawLinks.length})
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${rawLinks.map(l => {
                            const url = l.url || "#";
                            const title = l.title || l.label || url;
                            return `
                                <a href="${url}" target="_blank" rel="noopener noreferrer" class="extracted-link-badge" style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); color:var(--color-primary-light); text-decoration:none; font-size:12px; font-weight:600; transition:all 0.2s;">
                                    <i data-lucide="external-link" style="width:13px; height:13px;"></i>
                                    <span>${parseBold(title)}</span>
                                </a>
                            `;
                        }).join("")}
                    </div>
                </div>
            `;
        }

        // Build Why Best Fit Card
        let bestFitHtml = "";
        if (data.why_best_fit) {
            bestFitHtml = `
                <div class="why-best-fit-card" style="margin-top:16px; padding:16px 20px; border-radius:12px; background:linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(99,102,241,0.15) 100%); border:1px solid rgba(16,185,129,0.35); color:var(--text-primary); box-shadow:0 4px 14px rgba(0,0,0,0.2);">
                    <div style="font-size:13px; font-weight:800; color:var(--color-success); text-transform:uppercase; letter-spacing:0.6px; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="award" style="width:18px; height:18px;"></i>
                        Why This Candidate Is The Best Fit
                    </div>
                    <p style="font-size:13.5px; line-height:1.6; color:var(--text-primary); margin:0;">
                        ${parseBold(data.why_best_fit)}
                    </p>
                </div>
            `;
        }

        candidateOverviewCard.innerHTML = `
            <div class="overview-title">
                <i data-lucide="user-check"></i>
                Candidate Profile: ${cName}${cVer}
            </div>
            <p class="overview-summary">${parseBold(data.candidate_summary) || "Candidate background analyzed successfully."}</p>
            ${bestFitHtml}
            <div class="overview-skills-tags" style="margin-top:14px;">
                ${topSkills.map(s => `<span class="overview-skill-tag" style="font-weight:700;">${parseBold(s)}</span>`).join("")}
            </div>
            ${linksHtml}
        `;

        // Render Experience Highlight Cards (Leadership, Hackathons, Internships)
        const leadershipList = document.getElementById("leadershipList");
        const hackathonList = document.getElementById("hackathonList");
        const internshipList = document.getElementById("internshipList");
        const recommendationsList = document.getElementById("recommendationsList");

        if (leadershipList) {
            const raw = data.leadership_and_community;
            const items = (Array.isArray(raw) && raw.length > 0) ? raw : ["Led student developer initiatives, club projects, and peer technical mentoring."];
            leadershipList.innerHTML = items.map(i => `<li>${parseBold(typeof i === 'string' ? i : JSON.stringify(i))}</li>`).join("");
        }
        if (hackathonList) {
            const raw = data.achievements_and_competitions;
            const items = (Array.isArray(raw) && raw.length > 0) ? raw : ["Competed in technical hackathons, coding contests, and academic competitions."];
            hackathonList.innerHTML = items.map(i => `<li>${parseBold(typeof i === 'string' ? i : JSON.stringify(i))}</li>`).join("");
        }
        if (internshipList) {
            const raw = data.work_and_internship_experience;
            const items = (Array.isArray(raw) && raw.length > 0) ? raw : ["Software engineering internship experience, client development, and startup project work."];
            internshipList.innerHTML = items.map(i => `<li>${parseBold(typeof i === 'string' ? i : JSON.stringify(i))}</li>`).join("");
        }
        if (recommendationsList) {
            const raw = data.dynamic_recommendations;
            const items = (Array.isArray(raw) && raw.length > 0) ? raw : ["Highlight quantitative metrics for project impact, student community leadership, and hackathon wins."];
            recommendationsList.innerHTML = items.map(i => `<li>${parseBold(typeof i === 'string' ? i : JSON.stringify(i))}</li>`).join("");
        }

        rolesGrid.innerHTML = "";
        const roles = data.suggested_roles || [];
        roles.forEach(role => {
            const roleCard = document.createElement("div");
            roleCard.className = "role-card";

            const strengths = (role.key_strengths || []).map(s => `<li>${parseBold(s)}</li>`).join("");
            const gaps = (role.skill_gaps || []).map(g => `<li>${parseBold(g)}</li>`).join("");

            roleCard.innerHTML = `
                <div class="role-card-header">
                    <h4>${role.role_title}</h4>
                    <span class="domain-pill">${role.domain || "Technology"}</span>
                </div>
                <p class="role-match-summary">${role.match_summary}</p>
                
                <div class="level-scores-box">
                    <div class="level-score-row">
                        <div class="level-score-label">
                            <span>Junior / Beginner Match</span>
                            <span class="score-val beginner">${role.beginner_score || 0}%</span>
                        </div>
                        <div class="level-meter-bg">
                            <div class="level-meter-fill beginner" style="width: ${role.beginner_score || 0}%"></div>
                        </div>
                    </div>

                    <div class="level-score-row">
                        <div class="level-score-label">
                            <span>Mid-Level Match</span>
                            <span class="score-val intermediate">${role.intermediate_score || 0}%</span>
                        </div>
                        <div class="level-meter-bg">
                            <div class="level-meter-fill intermediate" style="width: ${role.intermediate_score || 0}%"></div>
                        </div>
                    </div>

                    <div class="level-score-row">
                        <div class="level-score-label">
                            <span>Senior / Lead Match</span>
                            <span class="score-val experienced">${role.experienced_score || 0}%</span>
                        </div>
                        <div class="level-meter-bg">
                            <div class="level-meter-fill experienced" style="width: ${role.experienced_score || 0}%"></div>
                        </div>
                    </div>
                </div>

                <div class="role-details-section">
                    <div class="detail-block">
                        <h5 class="strengths-title"><i data-lucide="check-circle-2"></i> Key Candidate Strengths</h5>
                        <ul class="detail-list">${strengths || "<li>Solid baseline qualification</li>"}</ul>
                    </div>

                    <div class="detail-block">
                        <h5 class="gaps-title"><i data-lucide="trending-up"></i> Skill Gaps & Focus Areas</h5>
                        <ul class="detail-list">${gaps || "<li>Deepen domain specialization</li>"}</ul>
                    </div>

                    ${role.recommended_next_steps ? `
                    <div class="advice-tip">
                        <strong>Career Tip:</strong> ${role.recommended_next_steps}
                    </div>` : ''}
                </div>
            `;
            rolesGrid.appendChild(roleCard);
        });

        lucide.createIcons();
    }

    // Multi-Agent Flowchart States
    function updateFlowchartState(phase) {
        document.querySelectorAll(".flow-node").forEach(node => {
            node.classList.remove("active", "critique-loop");
        });
        
        const nodeInput = document.getElementById("nodeInput");
        const nodeJd = document.getElementById("nodeJdParser");
        const nodeSyllabus = document.getElementById("nodeSyllabus");
        const nodeGenerator = document.getElementById("nodeGenerator");
        const nodeCritic = document.getElementById("nodeCritic");
        const nodeScorecard = document.getElementById("nodeScorecard");
        const nodeLogger = document.getElementById("nodeLogger");

        if (phase === "INPUT" || phase === "RESUME_MATCHER") {
            nodeInput.classList.add("active");
        } else if (phase === "JD_PARSER") {
            nodeJd.classList.add("active");
        } else if (phase === "SYLLABUS") {
            nodeSyllabus.classList.add("active");
        } else if (phase === "GENERATING") {
            nodeGenerator.classList.add("active");
        } else if (phase === "CRITIC") {
            nodeCritic.classList.add("active");
        } else if (phase === "REFINER") {
            nodeGenerator.classList.add("active");
            nodeCritic.classList.add("critique-loop");
        } else if (phase === "SCORECARD") {
            nodeScorecard.classList.add("active");
        } else if (phase === "DB_LOGGING") {
            nodeLogger.classList.add("active");
        } else if (phase === "COMPLETED") {
            nodeLogger.classList.add("active");
        }
    }

    // Form submission
    if (generatorForm) {
        generatorForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const checkedCategories = [];
            document.querySelectorAll("input[name='categories']:checked").forEach(cb => {
                checkedCategories.push(cb.value);
            });

        if (checkedCategories.length === 0) {
            showToast("Please select at least one question category.", "warning");
            return;
        }

        const payload = {
            job_title: jobTitleInput.value.trim(),
            experience_level: experienceLevelSelect.value,
            count: parseInt(questionCountInput.value),
            categories: checkedCategories,
            job_description: jobDescriptionInput.value.trim(),
            resume_text: architectResumeText
        };

        // UI States (disable form, clear previous outputs)
        submitBtn.disabled = true;
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> <span>Running Agent Loop...</span>`;
        lucide.createIcons();

        traceContainer.style.display = "block";
        traceTimeline.innerHTML = "";
        iterationCounter.textContent = "Iteration 1/8";
        updateFlowchartState("INPUT");
        
        resultsContainer.style.display = "none";
        questionsAccordion.innerHTML = "";
        currentGuideData = null;

        traceContainer.scrollIntoView({ behavior: "smooth", block: "start" });

        try {
            const response = await fetch(`${API_BASE}/api/generate`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentIdToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || "Failed to connect to agent loop API.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop(); // Save partial line for next iteration

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const eventData = JSON.parse(line.substring(6));
                            handleStreamEvent(eventData);
                        } catch (parseErr) {
                            console.error("Error parsing stream line:", line, parseErr);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Stream Error:", error);
            appendTraceStep({
                phase: "ERROR",
                message: `Generation process failed: ${error.message}`,
                iteration: 0
            });
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
            lucide.createIcons();
            loadHistoryList(); // Refresh history sidebar
        }
    });
}

    function handleStreamEvent(event) {
        if (event.iteration) {
            iterationCounter.textContent = `Iteration ${event.iteration}/8`;
        }

        if (event.phase) {
            updateFlowchartState(event.phase);
        }

        appendTraceStep(event);

        if (event.phase === "COMPLETED" && event.data) {
            currentGuideData = event.data;
            renderFinalGuide(currentGuideData);
        }
    }

    function appendTraceStep(event) {
        const step = document.createElement("div");
        step.className = `trace-step phase-${event.phase.toLowerCase().replace(" ", "-")}`;

        let iconName = "help-circle";
        switch (event.phase) {
            case "JD_PARSER": iconName = "file-text"; break;
            case "SYLLABUS": iconName = "book-open"; break;
            case "GENERATING": iconName = "pen-tool"; break;
            case "CRITIC": iconName = "shield-alert"; break;
            case "REFINER": iconName = "refresh-cw"; break;
            case "SCORECARD": iconName = "award"; break;
            case "DB_LOGGING": iconName = "database"; break;
            case "PERCEIVE": iconName = "eye"; break;
            case "REASON": iconName = "brain"; break;
            case "EXECUTE": iconName = "play"; break;
            case "OBSERVE": iconName = "inbox"; break;
            case "UPDATE STATE": iconName = "refresh-cw"; break;
            case "ERROR": iconName = "alert-triangle"; break;
            case "COMPLETED": iconName = "check-circle"; break;
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let detailHTML = "";
        if (event.phase === "EXECUTE" && event.tool) {
            detailHTML = `
                <div class="trace-tool-details">
                    <div class="trace-tool-title">Executing specialist sub-agent: <code>${event.tool}()</code></div>
                    <pre class="trace-tool-code">${JSON.stringify(event.args || {}, null, 2)}</pre>
                </div>
            `;
        } else if (event.phase === "OBSERVE" && event.result) {
            let formattedResult = event.result;
            try {
                if (typeof event.result === "string" && (event.result.startsWith("{") || event.result.startsWith("["))) {
                    formattedResult = JSON.stringify(JSON.parse(event.result), null, 2);
                } else if (typeof event.result === "object") {
                    formattedResult = JSON.stringify(event.result, null, 2);
                }
            } catch(e) {}
            
            detailHTML = `
                <div class="trace-tool-details">
                    <div class="trace-tool-title">Observation output:</div>
                    <pre class="trace-tool-code">${formattedResult}</pre>
                </div>
            `;
        }

        step.innerHTML = `
            <div class="trace-dot">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="trace-content">
                <div class="trace-step-header">
                    <span class="trace-step-title">${event.phase}</span>
                    <span class="trace-step-time">${timeStr}</span>
                </div>
                <div class="trace-step-body">${event.message}</div>
                ${detailHTML}
            </div>
        `;

        traceTimeline.appendChild(step);
        lucide.createIcons();
        traceTimeline.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // Render final interview guide structure
    function renderFinalGuide(guide) {
        metaPosition.textContent = guide.job_title || "N/A";
        metaLevel.textContent = guide.experience_level || "N/A";
        metaGuideId.textContent = guide.guide_id || "N/A";

        // Render Dashboard Stats
        const questionsList = guide.questions || [];
        document.getElementById("dashTotalCount").textContent = questionsList.length;
        
        const techCount = questionsList.filter(q => q.category.toLowerCase().includes("tech") || q.category.toLowerCase().includes("coding") || q.category.toLowerCase().includes("design")).length;
        const techCoverageVal = questionsList.length ? Math.round((techCount / questionsList.length) * 100) : 0;
        document.getElementById("dashTechCoverage").textContent = `${techCoverageVal}%`;
        
        const easyCount = questionsList.filter(q => q.difficulty.toLowerCase().includes("easy")).length;
        const medCount = questionsList.filter(q => q.difficulty.toLowerCase().includes("medium")).length;
        const hardCount = questionsList.filter(q => q.difficulty.toLowerCase().includes("hard")).length;
        const total = questionsList.length;
        const easyPct = total ? Math.round((easyCount / total) * 100) : 0;
        const medPct = total ? Math.round((medCount / total) * 100) : 0;
        const hardPct = total ? (100 - easyPct - medPct) : 0;
        
        const easyBar = document.getElementById("diffEasyBar");
        const medBar = document.getElementById("diffMediumBar");
        const hardBar = document.getElementById("diffHardBar");
        easyBar.style.width = `${easyPct}%`;
        easyBar.title = `Easy: ${easyCount} questions (${easyPct}%)`;
        medBar.style.width = `${medPct}%`;
        medBar.title = `Medium: ${medCount} questions (${medPct}%)`;
        hardBar.style.width = `${hardPct}%`;
        hardBar.title = `Hard: ${hardCount} questions (${hardPct}%)`;

        // Render LLMOps Metrics
        if (guide.metrics) {
            document.getElementById("metricsLatency").textContent = `${guide.metrics.total_latency_sec || 0.0}s`;
            document.getElementById("metricsTokens").textContent = (guide.metrics.total_tokens || 0).toLocaleString();
            document.getElementById("metricsCost").textContent = `$${(guide.metrics.estimated_cost_usd || 0.00).toFixed(4)}`;
        } else {
            document.getElementById("metricsLatency").textContent = "N/A";
            document.getElementById("metricsTokens").textContent = "N/A";
            document.getElementById("metricsCost").textContent = "N/A";
        }

        // Render AI Job Description Requirements Fit
        const jobProfileBlock = document.getElementById("jobProfileBlock");
        if (guide.job_analysis) {
            jobProfileBlock.style.display = "block";
            document.getElementById("parsedCandidateProfile").textContent = guide.job_analysis.candidate_profile || "N/A";
            
            const techContainer = document.getElementById("parsedTechSkills");
            techContainer.innerHTML = "";
            const techSkills = guide.job_analysis.technical_competencies || [];
            if (techSkills.length === 0) {
                techContainer.innerHTML = `<span class="text-secondary" style="font-size:12px;">None parsed</span>`;
            } else {
                techSkills.forEach(skill => {
                    const tag = document.createElement("span");
                    tag.className = "profile-tag";
                    tag.textContent = skill;
                    techContainer.appendChild(tag);
                });
            }
            
            const softContainer = document.getElementById("parsedSoftSkills");
            softContainer.innerHTML = "";
            const softSkills = guide.job_analysis.soft_skills || [];
            if (softSkills.length === 0) {
                softContainer.innerHTML = `<li style="font-size:12px;">None parsed</li>`;
            } else {
                softSkills.forEach(skill => {
                    const li = document.createElement("li");
                    li.textContent = skill;
                    softContainer.appendChild(li);
                });
            }
        } else {
            jobProfileBlock.style.display = "none";
        }

        // Render Resume Match & 3 Custom Personalized Questions
        const resumeFitBanner = document.getElementById("resumeFitBanner");
        if (guide.resume_match && resumeFitBanner) {
            const match = guide.resume_match;
            resumeFitBanner.style.display = "block";

            const matchedPills = (match.matched_skills || []).map(s => `<span class="profile-tag" style="background:rgba(16,185,129,0.15); color:var(--color-success); border-color:rgba(16,185,129,0.3);">${s}</span>`).join("");
            const missingPills = (match.missing_requirements || []).map(s => `<span class="profile-tag" style="background:rgba(245,158,11,0.15); color:var(--color-warning); border-color:rgba(245,158,11,0.3);">${s}</span>`).join("");

            const customQs = (match.personalized_questions || []).map(q => `
                <div class="custom-q-item">
                    <div class="custom-q-text">Q: ${q.question}</div>
                    <div class="custom-q-focus">🎯 Focus Area: ${q.focus_area}</div>
                    ${q.sample_ideal_answer ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:6px;"><strong>Ideal Response (Resume Context):</strong> ${q.sample_ideal_answer}</div>` : ''}
                </div>
            `).join("");

            resumeFitBanner.innerHTML = `
                <div class="resume-fit-header">
                    <div>
                        <h4 style="font-family:var(--font-heading); font-size:18px; color:var(--text-primary); margin-bottom:4px; display:flex; align-items:center; gap:8px;">
                            <i data-lucide="user-check" style="width:20px; height:20px; color:var(--color-success);"></i>
                            Candidate Resume Fit Analysis
                        </h4>
                        <p style="font-size:13px; color:var(--text-secondary);">${match.summary_reasoning || ''}</p>
                    </div>
                    <div class="fit-score-badge">
                        ${match.overall_fit_score || 0}% Fit
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:14px;">
                    <div>
                        <span class="section-label" style="color:var(--color-success);">Matched Qualifications</span>
                        <div class="profile-tags">${matchedPills || '<span>General background alignment</span>'}</div>
                    </div>
                    <div>
                        <span class="section-label" style="color:var(--color-warning);">Gaps / Areas to Probe</span>
                        <div class="profile-tags">${missingPills || '<span>No major gaps identified</span>'}</div>
                    </div>
                </div>

                ${customQs ? `
                <div class="custom-resume-questions-card">
                    <h5><i data-lucide="sparkles"></i> 3 Personalized Custom Questions (Based on Candidate Resume)</h5>
                    ${customQs}
                </div>` : ''}
            `;
            lucide.createIcons();
        } else if (resumeFitBanner) {
            resumeFitBanner.style.display = "none";
        }

        questionsAccordion.innerHTML = "";
        
        if (questionsList.length === 0) {
            questionsAccordion.innerHTML = `<p class="text-secondary" style="padding: 20px 0;">No questions were returned. Check execution logs.</p>`;
            resultsContainer.style.display = "block";
            return;
        }

        questionsList.forEach((q, idx) => {
            const qItem = document.createElement("div");
            qItem.className = "accordion-item";
            qItem.setAttribute("data-qid", q.id);
            
            const categoryBadge = getCategoryBadge(q.category);
            const difficultyBadge = getDifficultyBadge(q.difficulty);

            const rubric1 = q.grading_rubric && q.grading_rubric["1"] ? q.grading_rubric["1"] : "Candidate fails to explain or displays zero competency.";
            const rubric3 = q.grading_rubric && q.grading_rubric["3"] ? q.grading_rubric["3"] : "Candidate provides standard competencies but misses deeper details.";
            const rubric5 = q.grading_rubric && q.grading_rubric["5"] ? q.grading_rubric["5"] : "Candidate displays exceptional subject mastery with design reasoning.";

            qItem.innerHTML = `
                <button class="accordion-header">
                    <div class="accordion-title-block">
                        <span class="accordion-num">0${idx + 1}</span>
                        <div class="accordion-text-wrap">
                            <span class="accordion-question">${escapeHTML(q.question)}</span>
                            <div class="accordion-badges">
                                ${categoryBadge}
                                ${difficultyBadge}
                                <span class="badge" style="background-color: rgba(6, 182, 212, 0.1); color: var(--color-info); border-color: rgba(6, 182, 212, 0.2);">Target: ${escapeHTML(q.target_skill || "General")}</span>
                            </div>
                        </div>
                    </div>
                    <i data-lucide="chevron-down" class="accordion-icon"></i>
                </button>
                <div class="accordion-content">
                    <div class="accordion-inner">
                        <div class="content-section">
                            <span class="section-label">Rationale</span>
                            <p class="section-text">${escapeHTML(q.rationale || "Evaluates target competency capability.")}</p>
                        </div>
                        <div class="content-section">
                            <span class="section-label">Ideal Candidate Response (Model Answer)</span>
                            <div class="section-text section-model-answer">${escapeHTML(q.model_answer || "N/A")}</div>
                        </div>
                        <div class="content-section">
                            <span class="section-label">Grading & Score Rubric</span>
                            <div class="rubric-grid">
                                <div class="rubric-box">
                                    <span class="rubric-score score-1"><i data-lucide="star"></i> Score 1 (Poor)</span>
                                    <p class="section-text">${escapeHTML(rubric1)}</p>
                                </div>
                                <div class="rubric-box">
                                    <span class="rubric-score score-3"><i data-lucide="star"></i> Score 3 (Good)</span>
                                    <p class="section-text">${escapeHTML(rubric3)}</p>
                                </div>
                                <div class="rubric-box">
                                    <span class="rubric-score score-5"><i data-lucide="star"></i> Score 5 (Elite)</span>
                                    <p class="section-text">${escapeHTML(rubric5)}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Question Tweak panel -->
                        <div class="tweak-controls-panel" style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-color); padding-top:16px; margin-top:16px;">
                            <span class="section-label" style="margin-bottom:0;">Regenerate / Adjust Question</span>
                            <div style="display:flex; gap:8px;">
                                <button class="btn-secondary tweak-harder-btn" style="padding: 6px 12px; font-size:11px; color:var(--color-error); border-color:rgba(239,68,68,0.2);"><i data-lucide="trending-up" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i> Harder</button>
                                <button class="btn-secondary tweak-easier-btn" style="padding: 6px 12px; font-size:11px; color:var(--color-success); border-color:rgba(16,185,129,0.2);"><i data-lucide="trending-down" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i> Easier</button>
                                <button class="btn-secondary tweak-custom-btn" style="padding: 6px 12px; font-size:11px; color:var(--color-primary); border-color:rgba(99,102,241,0.2);"><i data-lucide="edit-3" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i> Custom Tweak</button>
                            </div>
                        </div>
                        <div class="custom-tweak-tray" style="display:none; flex-direction:column; gap:8px; margin-top:10px; background-color:rgba(30,41,59,0.3); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-sm);">
                            <input type="text" class="custom-tweak-input" placeholder="e.g., focus more on Vector database performance optimizations..." style="width:100%; padding:8px 12px; font-size:12px;">
                            <div style="display:flex; gap:8px; justify-content:flex-end;">
                                <button class="btn-secondary cancel-tweak-btn" style="padding:4px 8px; font-size:11px;">Cancel</button>
                                <button class="btn-primary apply-tweak-btn" style="padding:4px 12px; font-size:11px;">Apply</button>
                            </div>
                        </div>

                        <!-- Candidate Assessment Sandbox -->
                        <div class="content-section evaluation-sandbox" style="border-top:1px dashed var(--border-color); padding-top:20px; margin-top:20px;">
                            <span class="section-label">Candidate Assessment Sandbox (Score response)</span>
                            <div class="sandbox-grid" style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
                                <div class="textarea-voice-container" style="position:relative; width:100%;">
                                    <textarea class="candidate-answer-input" rows="3" placeholder="Paste candidate response, or click the mic to speak..." style="width:100%; padding-right:50px;"></textarea>
                                    <button class="voice-input-btn" title="Speak Response" style="position:absolute; right:12px; top:12px; background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:6px; border-radius:50%; transition:var(--transition-smooth);"><i data-lucide="mic"></i></button>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span class="voice-status" style="font-size:11px; color:var(--color-info); display:none;">🎙️ Listening... Speak now.</span>
                                    <button class="btn-primary evaluate-answer-btn" style="padding: 8px 16px; font-size:13px; margin-left:auto;"><i data-lucide="check-square" style="width:13px; height:13px; vertical-align:middle; margin-right:4px;"></i> Evaluate Response</button>
                                </div>
                                
                                <!-- Evaluation Result Card -->
                                <div class="evaluation-result-card" style="display:none; background-color:rgba(10, 15, 26, 0.5); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:16px; margin-top:12px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border-color); padding-bottom:8px; margin-bottom:12px;">
                                        <h5 style="font-family:var(--font-heading); font-size:14px; font-weight:600; color:var(--color-secondary);">AI Scoring Feedback</h5>
                                        <div class="evaluation-stars" style="color:var(--color-warning); display:flex; gap:2px;"></div>
                                    </div>
                                    <div class="eval-split-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                                        <div>
                                            <span class="section-label" style="font-size:10px; color:var(--color-success);">Strengths</span>
                                            <ul class="eval-strengths" style="padding-left:14px; font-size:12px; color:var(--text-secondary); line-height:1.4;"></ul>
                                        </div>
                                        <div>
                                            <span class="section-label" style="font-size:10px; color:var(--color-error);">Weaknesses / Gaps</span>
                                            <ul class="eval-weaknesses" style="padding-left:14px; font-size:12px; color:var(--text-secondary); line-height:1.4;"></ul>
                                        </div>
                                    </div>
                                    <div class="eval-redflags-section" style="display:none; margin-top:12px; padding:10px; background-color:rgba(239, 68, 68, 0.05); border-left:3px solid var(--color-error); border-radius:2px;">
                                        <span class="section-label" style="font-size:10px; color:var(--color-error);">⚠️ Red Flags</span>
                                        <ul class="eval-redflags" style="padding-left:14px; font-size:12px; color:var(--text-secondary); line-height:1.4; margin-top:4px;"></ul>
                                    </div>
                                    <div class="eval-followup-section" style="margin-top:12px; padding:10px; background-color:rgba(6, 182, 212, 0.05); border-left:3px solid var(--color-info); border-radius:2px;">
                                        <span class="section-label" style="font-size:10px; color:var(--color-info);">Suggested Follow-Up</span>
                                        <p class="eval-followup" style="font-size:12px; color:var(--text-primary); margin-top:4px; font-style:italic;"></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Toggle accordion logic
            const header = qItem.querySelector(".accordion-header");
            header.addEventListener("click", () => {
                const isOpen = qItem.classList.contains("open");
                document.querySelectorAll(".accordion-item").forEach(item => {
                    item.classList.remove("open");
                });
                if (!isOpen) {
                    qItem.classList.add("open");
                }
            });

            // 1. Hook Tweak Controls
            const tweakHarderBtn = qItem.querySelector(".tweak-harder-btn");
            const tweakEasierBtn = qItem.querySelector(".tweak-easier-btn");
            const tweakCustomBtn = qItem.querySelector(".tweak-custom-btn");
            const customTweakTray = qItem.querySelector(".custom-tweak-tray");
            const cancelTweakBtn = qItem.querySelector(".cancel-tweak-btn");
            const applyTweakBtn = qItem.querySelector(".apply-tweak-btn");
            const customTweakInput = qItem.querySelector(".custom-tweak-input");

            tweakHarderBtn.addEventListener("click", () => triggerTweak(guide.guide_id, q.id, "harder"));
            tweakEasierBtn.addEventListener("click", () => triggerTweak(guide.guide_id, q.id, "easier"));
            
            tweakCustomBtn.addEventListener("click", () => {
                customTweakTray.style.display = "flex";
            });
            cancelTweakBtn.addEventListener("click", () => {
                customTweakTray.style.display = "none";
                customTweakInput.value = "";
            });
            applyTweakBtn.addEventListener("click", () => {
                const text = customTweakInput.value.trim();
                if (!text) return;
                triggerTweak(guide.guide_id, q.id, "custom", text);
            });

            // 2. Hook Sandbox Evaluation logic
            const candidateAnswerInput = qItem.querySelector(".candidate-answer-input");
            const evaluateAnswerBtn = qItem.querySelector(".evaluate-answer-btn");
            const voiceInputBtn = qItem.querySelector(".voice-input-btn");
            const voiceStatus = qItem.querySelector(".voice-status");

            evaluateAnswerBtn.addEventListener("click", async () => {
                const answerText = candidateAnswerInput.value.trim();
                if (!answerText) {
                    showToast("Please input a candidate response to evaluate.", "warning");
                    return;
                }
                
                evaluateAnswerBtn.disabled = true;
                const origHTML = evaluateAnswerBtn.innerHTML;
                evaluateAnswerBtn.innerHTML = `<i data-lucide="loader" class="spin" style="width:13px; height:13px; vertical-align:middle; margin-right:4px;"></i> Grading...`;
                lucide.createIcons();
                
                try {
                    const res = await fetch(`${API_BASE}/api/evaluate`, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${currentIdToken}`
                        },
                        body: JSON.stringify({
                            guide_id: guide.guide_id,
                            question_id: q.id,
                            candidate_answer: answerText
                        })
                    });
                    
                    if (!res.ok) throw new Error("Evaluation request failed.");
                    
                    const evalResult = await res.json();
                    renderEvaluationResult(qItem, evalResult);
                } catch(err) {
                    showToast(`Evaluation failed: ${err.message}`, "error");
                } finally {
                    evaluateAnswerBtn.disabled = false;
                    evaluateAnswerBtn.innerHTML = origHTML;
                    lucide.createIcons();
                }
            });

            // 3. Web Speech API Voice Dictation
            voiceInputBtn.addEventListener("click", () => {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognition) {
                    showToast("Web Speech API is not supported in this browser. Please try Google Chrome.", "warning");
                    return;
                }
                
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.lang = "en-US";
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;
                
                recognition.onstart = () => {
                    voiceInputBtn.classList.add("recording");
                    voiceStatus.style.display = "inline";
                };
                
                recognition.onend = () => {
                    voiceInputBtn.classList.remove("recording");
                    voiceStatus.style.display = "none";
                };
                
                recognition.onerror = (e) => {
                    console.error("Speech Recognition Error:", e);
                    voiceInputBtn.classList.remove("recording");
                    voiceStatus.style.display = "none";
                };
                
                recognition.onresult = (event) => {
                    const resultText = event.results[0][0].transcript;
                    candidateAnswerInput.value = (candidateAnswerInput.value + " " + resultText).trim();
                };
                
                recognition.start();
            });

            questionsAccordion.appendChild(qItem);
        });

        resultsContainer.style.display = "block";
        lucide.createIcons();
        resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Trigger Single Question Tweak Regene Endpoint Call
    async function triggerTweak(guideId, questionId, action, feedback = "") {
        const accordionItem = document.querySelector(`.accordion-item[data-qid="${questionId}"]`);
        const headerText = accordionItem ? accordionItem.querySelector(".accordion-question") : null;
        const originalText = headerText ? headerText.textContent : "";
        
        if (headerText) {
            headerText.innerHTML = `<span style="color:var(--color-primary)"><i data-lucide="loader" class="spin" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> Tweaking question... Please wait...</span>`;
            lucide.createIcons();
        }
        
        try {
            const res = await fetch(`${API_BASE}/api/tweak`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentIdToken}`
                },
                body: JSON.stringify({
                    guide_id: guideId,
                    question_id: questionId,
                    action: action,
                    feedback: feedback
                })
            });
            
            if (!res.ok) throw new Error("Failed to tweak question.");
            const updatedGuide = await res.json();
            
            // Reload the final guide in place
            currentGuideData = updatedGuide;
            renderFinalGuide(currentGuideData);
        } catch(err) {
            showToast(`Tweak failed: ${err.message}`, "error");
            if (headerText) headerText.textContent = originalText;
        }
    }

    // Render Grading Evaluation scorecard
    function renderEvaluationResult(qItem, evalResult) {
        const resultCard = qItem.querySelector(".evaluation-result-card");
        const starsContainer = qItem.querySelector(".evaluation-stars");
        const strengthsList = qItem.querySelector(".eval-strengths");
        const weaknessesList = qItem.querySelector(".eval-weaknesses");
        const redFlagsSection = qItem.querySelector(".eval-redflags-section");
        const redFlagsList = qItem.querySelector(".eval-redflags");
        const followUpText = qItem.querySelector(".eval-followup");
        
        // Render rating stars
        starsContainer.innerHTML = "";
        const score = evalResult.score || 1;
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("i");
            star.setAttribute("data-lucide", "star");
            star.style.width = "14px";
            star.style.height = "14px";
            if (i <= score) {
                star.style.fill = "var(--color-warning)";
            }
            starsContainer.appendChild(star);
        }
        
        // Render Strengths list
        strengthsList.innerHTML = "";
        (evalResult.strengths || []).forEach(str => {
            const li = document.createElement("li");
            li.textContent = str;
            strengthsList.appendChild(li);
        });
        
        // Render Weaknesses list
        weaknessesList.innerHTML = "";
        (evalResult.weaknesses || []).forEach(weak => {
            const li = document.createElement("li");
            li.textContent = weak;
            weaknessesList.appendChild(li);
        });
        
        // Render Red Flags alert if present
        const redFlags = evalResult.red_flags || [];
        if (redFlags.length > 0) {
            redFlagsSection.style.display = "block";
            redFlagsList.innerHTML = "";
            redFlags.forEach(flag => {
                const li = document.createElement("li");
                li.textContent = flag;
                redFlagsList.appendChild(li);
            });
        } else {
            redFlagsSection.style.display = "none";
        }
        
        // Render suggestion follow-up
        followUpText.textContent = evalResult.follow_up_question || "None suggested.";
        
        resultCard.style.display = "block";
        lucide.createIcons();
    }

    // Helper functions for badge generation
    function getCategoryBadge(category = "") {
        const cat = category.toLowerCase();
        if (cat.includes("tech")) {
            return `<span class="badge badge-tech"><i data-lucide="code" style="width: 10px; height: 10px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Tech</span>`;
        } else if (cat.includes("behav")) {
            return `<span class="badge badge-beh"><i data-lucide="users" style="width: 10px; height: 10px; display: inline; vertical-align: middle; margin-right: 4px;"></i> Behavioral</span>`;
        } else if (cat.includes("system") || cat.includes("design") || cat.includes("arch")) {
            return `<span class="badge" style="background-color: rgba(245, 158, 11, 0.1); color: var(--color-warning); border-color: rgba(245, 158, 11, 0.2);"><i data-lucide="layout" style="width: 10px; height: 10px; display: inline; vertical-align: middle; margin-right: 4px;"></i> System Design</span>`;
        } else {
            return `<span class="badge" style="background-color: rgba(94, 234, 212, 0.1); color: #14b8a6; border-color: rgba(94, 234, 212, 0.2);">${escapeHTML(category)}</span>`;
        }
    }

    function getDifficultyBadge(difficulty = "medium") {
        const diff = difficulty.toLowerCase();
        if (diff.includes("easy")) {
            return `<span class="badge badge-easy">Easy</span>`;
        } else if (diff.includes("hard") || diff.includes("expert") || diff.includes("senior")) {
            return `<span class="badge badge-hard">Hard</span>`;
        } else {
            return `<span class="badge badge-medium">Medium</span>`;
        }
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Load History list from API
    async function loadHistoryList() {
        try {
            const res = await fetch(`${API_BASE}/api/history`, {
                headers: {
                    "Authorization": `Bearer ${currentIdToken}`
                }
            });
            if (!res.ok) throw new Error("Could not load history list");
            
            const history = await res.json();
            historyList.innerHTML = "";

            if (history.length === 0) {
                historyList.innerHTML = `
                    <div class="history-empty">
                        <i data-lucide="folder-open"></i>
                        <p>No generated guides yet</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            const pendingGuideId = localStorage.getItem("pending_guide_id");

            history.forEach(item => {
                const card = document.createElement("div");
                card.className = "history-item";
                if (currentGuideData && currentGuideData.guide_id === item.guide_id) {
                    card.classList.add("active");
                }

                const dateStr = item.timestamp ? `Ref: #${item.timestamp}` : "Saved Guide";

                card.innerHTML = `
                    <h4>${escapeHTML(item.job_title)}</h4>
                    <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Level: ${item.experience_level}</p>
                    <div class="history-meta">
                        <span>${item.questions ? item.questions.length : 0} Questions</span>
                        <span>${dateStr}</span>
                    </div>
                `;

                card.addEventListener("click", () => {
                    document.querySelectorAll(".history-item").forEach(el => el.classList.remove("active"));
                    card.classList.add("active");

                    if (document.body.dataset.page !== "architect") {
                        switchTab("architect", item.guide_id);
                        return;
                    }

                    // Hide trace container since we are viewing history
                    if (traceContainer) traceContainer.style.display = "none";
                    
                    loadHistoryItem(item.guide_id);
                });

                historyList.appendChild(card);

                if (pendingGuideId && item.guide_id === pendingGuideId) {
                    localStorage.removeItem("pending_guide_id");
                    setTimeout(() => card.click(), 100);
                }
            });
            lucide.createIcons();

        } catch (error) {
            console.error("Error loading history list:", error);
        }
    }

    // Load full history item contents
    async function loadHistoryItem(guideId) {
        try {
            const res = await fetch(`${API_BASE}/api/history/${guideId}`, {
                headers: {
                    "Authorization": `Bearer ${currentIdToken}`
                }
            });
            if (!res.ok) throw new Error("Failed to load history guide");
            
            const data = await res.json();
            currentGuideData = data;
            renderFinalGuide(currentGuideData);
        } catch (error) {
            showToast(`Error loading history item: ${error.message}`, "error");
        }
    }

    // Copy JSON to clipboard
    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            if (!currentGuideData) return;
            
            navigator.clipboard.writeText(JSON.stringify(currentGuideData, null, 2)).then(() => {
                showToast("Interview guide JSON copied to clipboard!", "success");
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = `<i data-lucide="check" style="color:var(--color-success)"></i> Copied!`;
                lucide.createIcons();
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    lucide.createIcons();
                }, 2000);
            }).catch(err => {
                console.error("Could not copy text: ", err);
                showToast("Failed to copy to clipboard", "error");
            });
        });
    }

    // Export Guide to Markdown file download
    if (exportMdBtn) {
        exportMdBtn.addEventListener("click", () => {
            if (!currentGuideData) return;
            const mdText = exportToMarkdown(currentGuideData);
            const blob = new Blob([mdText], { type: "text/markdown;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            
            const cleanTitle = currentGuideData.job_title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            link.setAttribute("download", `interview-guide-${cleanTitle}.md`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Interview guide exported as Markdown!", "success");
        });
    }

    // Build Markdown template
    function exportToMarkdown(guide) {
        let md = `# Interview Evaluation Guide: ${guide.job_title}\n`;
        md += `**Target Seniority Level:** ${guide.experience_level}\n`;
        md += `**Guide Unique Identifier:** ${guide.guide_id}\n\n`;
        
        if (guide.job_analysis) {
            md += `## 1. Candidate Requirements Persona Fit\n\n`;
            md += `### Target Candidate Profile\n`;
            md += `> ${guide.job_analysis.candidate_profile || "N/A"}\n\n`;
            
            md += `### Core Technical Competencies\n`;
            const tech = guide.job_analysis.technical_competencies || [];
            if (tech.length === 0) md += `- None identified\n`;
            tech.forEach(skill => { md += `- ${skill}\n`; });
            md += `\n`;
            
            md += `### Target Soft Skills\n`;
            const soft = guide.job_analysis.soft_skills || [];
            if (soft.length === 0) md += `- None identified\n`;
            soft.forEach(skill => { md += `- ${skill}\n`; });
            md += `\n`;
        }
        
        md += `## 2. Evaluative Interview Questions\n\n`;
        
        const questionsList = guide.questions || [];
        questionsList.forEach((q, idx) => {
            md += `### Q${idx + 1}. ${q.question}\n`;
            md += `- **Category:** ${q.category}\n`;
            md += `- **Target Competency:** ${q.target_skill || "General"}\n`;
            md += `- **Difficulty:** ${q.difficulty}\n\n`;
            
            md += `#### Rationale\n`;
            md += `> ${q.rationale || "Evaluates target competency capability."}\n\n`;
            
            md += `#### Model Candidate Response (Ideal Answer)\n`;
            md += `\`\`\`text\n${q.model_answer || "N/A"}\n\`\`\`\n\n`;
            
            md += `#### Structured Scorecard Rubric\n`;
            const r1 = q.grading_rubric && q.grading_rubric["1"] ? q.grading_rubric["1"] : "Candidate fails to explain or displays zero competency.";
            const r3 = q.grading_rubric && q.grading_rubric["3"] ? q.grading_rubric["3"] : "Candidate provides standard competencies but misses deeper details.";
            const r5 = q.grading_rubric && q.grading_rubric["5"] ? q.grading_rubric["5"] : "Candidate displays exceptional subject mastery with design reasoning.";
            md += `| Score | Assessment Criteria |\n`;
            md += `| --- | --- |\n`;
            md += `| **Score 1 (Poor)** | ${r1} |\n`;
            md += `| **Score 3 (Good)** | ${r3} |\n`;
            md += `| **Score 5 (Elite)** | ${r5} |\n\n`;
            md += `---\n\n`;
        });
        
        return md;
    }

    // Trigger Print Screen
    if (printBtn) {
        printBtn.addEventListener("click", () => {
            window.print();
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
