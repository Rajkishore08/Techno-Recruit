import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Global variables for auth state
let authInstance = null;
let currentIdToken = null;
let currentUser = null;

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "" 
    : "https://techno-recruit.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();

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

    let currentGuideData = null;

    // Synchronize range slider value display
    questionCountInput.addEventListener("input", (e) => {
        questionCountVal.textContent = e.target.value;
    });

    // DOM Elements for Auth
    const loginBtn = document.getElementById("loginBtn");
    const overlayLoginBtn = document.getElementById("overlayLoginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const userProfile = document.getElementById("userProfile");
    const userAvatar = document.getElementById("userAvatar");
    const userNameElement = document.getElementById("userName");
    const authLockOverlay = document.getElementById("authLockOverlay");

    // Initialize Firebase
    async function initFirebase() {
        let firebaseConfig = {
            apiKey: "",
            authDomain: "",
            projectId: "",
            storageBucket: "",
            messagingSenderId: "",
            appId: "",
            measurementId: ""
        };

        try {
            // Priority 1: Check Firebase Hosting auto-init configuration
            const hostingResponse = await fetch("/__/firebase/init.json");
            if (hostingResponse.ok) {
                const hConfig = await hostingResponse.json();
                if (hConfig && hConfig.apiKey) {
                    firebaseConfig = hConfig;
                    console.log("Firebase initialized dynamically via Hosting.");
                }
            } else {
                // Priority 2: Backend config endpoint (reads from .env)
                const response = await fetch(`${API_BASE}/api/config`);
                if (response.ok) {
                    const bConfig = await response.json();
                    if (bConfig && bConfig.apiKey) {
                        firebaseConfig = bConfig;
                        console.log("Firebase config loaded from environment.");
                    }
                }
            }
        } catch (e) {
            console.warn("Could not load dynamic Firebase configuration.", e);
        }

        if (!firebaseConfig.apiKey) {
            console.warn("Firebase configuration is missing. Ensure environment variables or Firebase Hosting config are set.");
            return;
        }

        const app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);

        // Attach Auth Event Handlers
        const provider = new GoogleAuthProvider();

        const handleLogin = async () => {
            try {
                await signInWithPopup(authInstance, provider);
            } catch (err) {
                console.error("Sign in failed:", err);
                alert(`Authentication error: ${err.message}`);
            }
        };

        loginBtn.addEventListener("click", handleLogin);
        overlayLoginBtn.addEventListener("click", handleLogin);

        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(authInstance);
            } catch (err) {
                console.error("Sign out failed:", err);
            }
        });

        // Monitor Auth State
        onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                currentUser = user;
                currentIdToken = await user.getIdToken();
                
                // Update UI state
                loginBtn.style.display = "none";
                userProfile.style.display = "flex";
                userAvatar.src = user.photoURL || "https://www.gravatar.com/avatar/?d=mp";
                userNameElement.textContent = user.displayName || user.email;
                authLockOverlay.style.display = "none";
                
                // Load user's history list
                loadHistoryList();
            } else {
                currentUser = null;
                currentIdToken = null;
                
                // Reset UI state
                loginBtn.style.display = "flex";
                userProfile.style.display = "none";
                authLockOverlay.style.display = "flex";
                
                // Clear history list display and active guides
                historyList.innerHTML = `
                    <div class="history-empty">
                        <i data-lucide="lock"></i>
                        <p>Sign in to view history</p>
                    </div>
                `;
                lucide.createIcons();
                resultsContainer.style.display = "none";
                traceContainer.style.display = "none";
            }
        });
    }

    // Tab Switcher Logic
    const tabArchitectBtn = document.getElementById("tabArchitectBtn");
    const tabNavigatorBtn = document.getElementById("tabNavigatorBtn");
    const tabArchitectContent = document.getElementById("tabArchitectContent");
    const tabNavigatorContent = document.getElementById("tabNavigatorContent");

    if (tabArchitectBtn && tabNavigatorBtn) {
        tabArchitectBtn.addEventListener("click", () => switchTab("architect"));
        tabNavigatorBtn.addEventListener("click", () => switchTab("navigator"));
    }

    function switchTab(tabName) {
        if (tabName === "architect") {
            tabArchitectBtn.classList.add("active");
            tabNavigatorBtn.classList.remove("active");
            tabArchitectContent.style.display = "block";
            tabNavigatorContent.style.display = "none";
        } else {
            tabNavigatorBtn.classList.add("active");
            tabArchitectBtn.classList.remove("active");
            tabNavigatorContent.style.display = "block";
            tabArchitectContent.style.display = "none";
        }
        lucide.createIcons();
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
            alert(`Resume Upload Error: ${err.message}`);
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

        dropzone.addEventListener("click", (e) => {
            if (e.target.closest(`#${removeBtnId}`)) return;
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

    setupDropzone("architectResumeDropzone", "architectResumeInput", "architectResumeBadge", "architectFileName", "architectFileWords", "removeArchitectResumeBtn", (txt) => { architectResumeText = txt; });
    setupDropzone("navigatorResumeDropzone", "navigatorResumeInput", "navigatorResumeBadge", "navigatorFileName", "navigatorFileWords", "removeNavigatorResumeBtn", (txt) => { navigatorResumeText = txt; });

    // Career Navigator Agent Execution
    const analyzeCareerBtn = document.getElementById("analyzeCareerBtn");
    const navigatorLoading = document.getElementById("navigatorLoading");
    const navigatorResults = document.getElementById("navigatorResults");
    const candidateOverviewCard = document.getElementById("candidateOverviewCard");
    const rolesGrid = document.getElementById("rolesGrid");

    if (analyzeCareerBtn) {
        analyzeCareerBtn.addEventListener("click", async () => {
            if (!currentUser) {
                alert("Please sign in with Google first.");
                return;
            }

            if (!navigatorResumeText || !navigatorResumeText.trim()) {
                alert("Please upload a candidate resume file (PDF, DOCX, or TXT) first.");
                return;
            }

            analyzeCareerBtn.disabled = true;
            navigatorLoading.style.display = "block";
            navigatorResults.style.display = "none";
            navigatorLoading.scrollIntoView({ behavior: "smooth", block: "center" });

            try {
                const formData = new FormData();
                formData.append("resume_text", navigatorResumeText);

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
                renderCareerNavigatorResults(resData.data);
            } catch (e) {
                alert(`Career Analysis Error: ${e.message}`);
            } finally {
                analyzeCareerBtn.disabled = false;
                navigatorLoading.style.display = "none";
            }
        });
    }

    function renderCareerNavigatorResults(data) {
        if (!data) return;
        navigatorResults.style.display = "block";
        navigatorResults.scrollIntoView({ behavior: "smooth", block: "start" });

        const topSkills = data.top_skills_identified || [];
        candidateOverviewCard.innerHTML = `
            <div class="overview-title">
                <i data-lucide="user-check"></i>
                Candidate Profile Overview
            </div>
            <p class="overview-summary">${data.candidate_summary || "Candidate background analyzed successfully."}</p>
            <div class="overview-skills-tags">
                ${topSkills.map(s => `<span class="overview-skill-tag">${s}</span>`).join("")}
            </div>
        `;

        rolesGrid.innerHTML = "";
        const roles = data.suggested_roles || [];
        roles.forEach(role => {
            const roleCard = document.createElement("div");
            roleCard.className = "role-card";

            const strengths = (role.key_strengths || []).map(s => `<li>${s}</li>`).join("");
            const gaps = (role.skill_gaps || []).map(g => `<li>${g}</li>`).join("");

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
    generatorForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const checkedCategories = [];
        document.querySelectorAll("input[name='categories']:checked").forEach(cb => {
            checkedCategories.push(cb.value);
        });

        if (checkedCategories.length === 0) {
            alert("Please select at least one question category.");
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
                    alert("Please input a candidate response to evaluate.");
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
                    alert(`Evaluation failed: ${err.message}`);
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
                    alert("Web Speech API is not supported in this browser. Please try Google Chrome.");
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
            alert(`Tweak failed: ${err.message}`);
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

                    // Hide trace container since we are viewing history
                    traceContainer.style.display = "none";
                    
                    loadHistoryItem(item.guide_id);
                });

                historyList.appendChild(card);
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
            alert(`Error loading history item: ${error.message}`);
        }
    }

    // Copy JSON to clipboard
    copyBtn.addEventListener("click", () => {
        if (!currentGuideData) return;
        
        navigator.clipboard.writeText(JSON.stringify(currentGuideData, null, 2)).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `<i data-lucide="check" style="color:var(--color-success)"></i> Copied!`;
            lucide.createIcons();
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                lucide.createIcons();
            }, 2000);
        }).catch(err => {
            console.error("Could not copy text: ", err);
        });
    });

    // Export Guide to Markdown file download
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
    });

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
    printBtn.addEventListener("click", () => {
        window.print();
    });
});
