/**
 * TechPlan AI - Technical Event Planner Frontend Engine
 */

let currentPlan = null;
let currentDayFilter = 1;
let venueList = [
    { id: "v1", name: "Main College Auditorium", capacity: 150, has_ac: true, has_projector: true, has_sound_system: true, has_computers: false, cost_per_day: 0, confirmed: false },
    { id: "v2", name: "Sir MV Seminar Hall", capacity: 100, has_ac: true, has_projector: true, has_sound_system: true, has_computers: false, cost_per_day: 0, confirmed: false },
    { id: "v3", name: "Central Computing Complex Lab 1", capacity: 60, has_ac: true, has_projector: true, has_sound_system: false, has_computers: true, cost_per_day: 0, confirmed: false }
];

let sampleDatasets = {};

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", async () => {
    renderVenueTable();
    setupEventListeners();
    await fetchSampleDatasets();
    // Default load standard symposium
    loadPreset("standard_symposium");
});

async function fetchSampleDatasets() {
    try {
        const res = await fetch("/api/sample-datasets");
        if (res.ok) {
            sampleDatasets = await res.json();
        }
    } catch (e) {
        console.warn("Could not fetch remote presets, using embedded defaults", e);
    }
}

function setupEventListeners() {
    // Generate Plan Button
    document.getElementById("btn-generate-plan").addEventListener("click", handleGeneratePlan);
    
    // Reset Button
    document.getElementById("btn-reset-form").addEventListener("click", resetFormToEmpty);
    
    // Add Venue Button
    document.getElementById("btn-add-venue").addEventListener("click", addNewVenueRow);
    
    // Export PDF Button
    document.getElementById("btn-export-pdf").addEventListener("click", exportPlanPdf);
    
    // Export CSV Button
    document.getElementById("btn-export-csv").addEventListener("click", exportPlanCsv);
    
    // Print Button
    document.getElementById("btn-print-plan").addEventListener("click", () => window.print());
    
    // Modify Requirements Button
    document.getElementById("btn-modify-req").addEventListener("click", () => {
        document.getElementById("input-section").scrollIntoView({ behavior: "smooth" });
    });

    // Preset buttons
    document.querySelectorAll(".preset-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const presetKey = e.currentTarget.getAttribute("data-preset");
            loadPreset(presetKey);
        });
    });

    // Duration Type listener
    const durRadios = document.querySelectorAll("input[name='duration_type']");
    durRadios.forEach(r => {
        r.addEventListener("change", (e) => {
            const isDays = e.target.value === "days";
            document.getElementById("num-days-container").style.display = isDays ? "block" : "none";
        });
    });

    // Section Tab Switching
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const tabTarget = e.currentTarget.getAttribute("data-tab");
            switchTab(tabTarget);
        });
    });

    // Task Filter listener
    document.getElementById("task-phase-filter")?.addEventListener("change", filterTasks);
    document.getElementById("task-priority-filter")?.addEventListener("change", filterTasks);
    document.getElementById("task-search-input")?.addEventListener("input", filterTasks);
}

function renderVenueTable() {
    const tbody = document.getElementById("venues-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    venueList.forEach((v, idx) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
        tr.innerHTML = `
            <td class="p-2 text-center">
                <input type="radio" name="selected_venue_radio" value="${v.id}" ${idx === 0 ? "checked" : ""} class="text-blue-600 focus:ring-blue-500">
            </td>
            <td class="p-2">
                <input type="text" class="venue-name-input w-full px-2 py-1 border border-slate-200 rounded text-sm" value="${v.name}" data-idx="${idx}">
            </td>
            <td class="p-2">
                <input type="number" class="venue-cap-input w-24 px-2 py-1 border border-slate-200 rounded text-sm text-center font-medium" value="${v.capacity}" min="10" data-idx="${idx}">
            </td>
            <td class="p-2 text-center">
                <div class="flex items-center justify-center space-x-2 text-xs text-slate-500">
                    <label class="flex items-center"><input type="checkbox" ${v.has_ac ? "checked" : ""} class="venue-ac-cb mr-1" data-idx="${idx}"> AC</label>
                    <label class="flex items-center"><input type="checkbox" ${v.has_projector ? "checked" : ""} class="venue-proj-cb mr-1" data-idx="${idx}"> Projector</label>
                    <label class="flex items-center"><input type="checkbox" ${v.has_sound_system ? "checked" : ""} class="venue-sound-cb mr-1" data-idx="${idx}"> Sound</label>
                </div>
            </td>
            <td class="p-2 text-center">
                <button type="button" class="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition" onclick="deleteVenue(${idx})">
                    Remove
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Bind change listeners to update venueList array
    document.querySelectorAll(".venue-name-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            venueList[idx].name = e.target.value;
        });
    });
    document.querySelectorAll(".venue-cap-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            venueList[idx].capacity = parseInt(e.target.value) || 0;
        });
    });
    document.querySelectorAll(".venue-ac-cb").forEach(input => {
        input.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            venueList[idx].has_ac = e.target.checked;
        });
    });
    document.querySelectorAll(".venue-proj-cb").forEach(input => {
        input.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            venueList[idx].has_projector = e.target.checked;
        });
    });
    document.querySelectorAll(".venue-sound-cb").forEach(input => {
        input.addEventListener("change", (e) => {
            const idx = e.target.getAttribute("data-idx");
            venueList[idx].has_sound_system = e.target.checked;
        });
    });
}

function addNewVenueRow() {
    const newId = "v" + (venueList.length + 1);
    venueList.push({
        id: newId,
        name: `Seminar Hall ${String.fromCharCode(65 + venueList.length)}`,
        capacity: 120,
        has_ac: true,
        has_projector: true,
        has_sound_system: true,
        has_computers: false,
        cost_per_day: 0,
        confirmed: false
    });
    renderVenueTable();
}

function deleteVenue(idx) {
    if (venueList.length <= 1) {
        alert("You must keep at least one venue in the options list.");
        return;
    }
    venueList.splice(idx, 1);
    renderVenueTable();
}

function loadPreset(presetKey) {
    if (!sampleDatasets[presetKey]) return;
    const preset = sampleDatasets[presetKey].data;

    document.getElementById("event_name").value = preset.event_name || "";
    document.getElementById("description").value = preset.description || "";
    document.getElementById("event_date").value = preset.event_date || "";
    
    // Duration
    const durType = preset.duration_type || "days";
    document.querySelector(`input[name='duration_type'][value='${durType}']`).checked = true;
    document.getElementById("num-days-container").style.display = durType === "days" ? "block" : "none";
    document.getElementById("num_days").value = preset.num_days || 1;
    
    // Times
    document.getElementById("preferred_start_time").value = preset.preferred_start_time || "09:00";
    document.getElementById("preferred_end_time").value = preset.preferred_end_time || "17:00";
    
    // Participants & Budget
    document.getElementById("expected_participants").value = preset.expected_participants ?? 100;
    document.getElementById("available_budget").value = preset.available_budget ?? 25000;
    
    // People counts
    document.getElementById("num_speakers").value = preset.num_speakers ?? 2;
    document.getElementById("num_judges").value = preset.num_judges ?? 2;
    document.getElementById("num_faculty").value = preset.num_faculty ?? 3;
    document.getElementById("num_volunteers").value = preset.num_volunteers ?? 10;
    
    // Sessions
    document.getElementById("num_sessions").value = preset.num_sessions ?? 3;
    const sessionTypes = preset.session_types || ["technical_talk", "workshop", "coding_competition"];
    document.querySelectorAll("input[name='session_types']").forEach(cb => {
        cb.checked = sessionTypes.includes(cb.value);
    });

    // Facilities
    const facilities = preset.facilities || {};
    document.getElementById("fac_projector").checked = facilities.projector ?? true;
    document.getElementById("fac_sound").checked = facilities.sound_system ?? true;
    document.getElementById("fac_wifi").checked = facilities.wifi ?? true;
    document.getElementById("fac_computers").checked = facilities.computers ?? true;
    document.getElementById("fac_power").checked = facilities.power_boards ?? true;
    document.getElementById("fac_reg_desks").checked = facilities.registration_desks ?? true;
    document.getElementById("fac_water").checked = facilities.water_dispenser ?? true;
    document.getElementById("fac_stationery").checked = facilities.stationery_kits ?? true;

    // Logistics Toggles
    document.getElementById("log_lunch").checked = preset.include_lunch ?? true;
    document.getElementById("log_tea").checked = preset.include_tea_snacks ?? true;
    document.getElementById("log_kits").checked = preset.include_kits ?? true;
    document.getElementById("log_certs").checked = preset.include_printed_certificates ?? true;
    document.getElementById("log_mementos").checked = preset.include_mementos ?? true;

    // Confirmations
    document.getElementById("conf_venue").checked = preset.confirmed_venue ?? false;
    document.getElementById("conf_speakers").checked = preset.confirmed_speakers ?? false;
    document.getElementById("conf_budget").checked = preset.confirmed_budget_approval ?? false;

    // Venues
    if (preset.venues && preset.venues.length > 0) {
        venueList = JSON.parse(JSON.stringify(preset.venues));
    }
    renderVenueTable();

    // Visual preset badge notice
    const presetNotice = document.getElementById("active-preset-notice");
    if (presetNotice) {
        presetNotice.innerHTML = `Loaded scenario: <b>${sampleDatasets[presetKey].name}</b> &mdash; <span class="text-slate-500">${sampleDatasets[presetKey].description}</span>`;
    }
}

function resetFormToEmpty() {
    document.getElementById("event_name").value = "";
    document.getElementById("description").value = "";
    document.getElementById("event_date").value = "";
    document.getElementById("expected_participants").value = "";
    document.getElementById("available_budget").value = "";
    document.getElementById("num_sessions").value = "1";
    document.getElementById("active-preset-notice").innerHTML = "Form cleared. Enter custom requirements or load a test preset above.";
}

function collectFormData() {
    // Get selected venue ID
    const selectedRadio = document.querySelector("input[name='selected_venue_radio']:checked");
    const selectedVenueId = selectedRadio ? selectedRadio.value : (venueList[0] ? venueList[0].id : null);

    // Selected session types
    const sessionTypes = [];
    document.querySelectorAll("input[name='session_types']:checked").forEach(cb => {
        sessionTypes.push(cb.value);
    });

    const durType = document.querySelector("input[name='duration_type']:checked").value;

    return {
        event_name: document.getElementById("event_name").value.trim(),
        description: document.getElementById("description").value.trim(),
        event_date: document.getElementById("event_date").value,
        duration_type: durType,
        duration_value: parseFloat(document.getElementById("num_days").value) || 1.0,
        num_days: durType === "days" ? (parseInt(document.getElementById("num_days").value) || 1) : 1,
        preferred_start_time: document.getElementById("preferred_start_time").value,
        preferred_end_time: document.getElementById("preferred_end_time").value,
        expected_participants: parseInt(document.getElementById("expected_participants").value) || 0,
        available_budget: parseFloat(document.getElementById("available_budget").value) || 0.0,
        venues: venueList,
        selected_venue_id: selectedVenueId,
        facilities: {
            projector: document.getElementById("fac_projector").checked,
            sound_system: document.getElementById("fac_sound").checked,
            wifi: document.getElementById("fac_wifi").checked,
            computers: document.getElementById("fac_computers").checked,
            power_boards: document.getElementById("fac_power").checked,
            registration_desks: document.getElementById("fac_reg_desks").checked,
            water_dispenser: document.getElementById("fac_water").checked,
            stationery_kits: document.getElementById("fac_stationery").checked,
        },
        num_sessions: parseInt(document.getElementById("num_sessions").value) || 1,
        session_types: sessionTypes.length > 0 ? sessionTypes : ["technical_talk"],
        num_speakers: parseInt(document.getElementById("num_speakers").value) || 0,
        num_judges: parseInt(document.getElementById("num_judges").value) || 0,
        num_faculty: parseInt(document.getElementById("num_faculty").value) || 1,
        num_volunteers: parseInt(document.getElementById("num_volunteers").value) || 0,
        include_lunch: document.getElementById("log_lunch").checked,
        include_tea_snacks: document.getElementById("log_tea").checked,
        include_kits: document.getElementById("log_kits").checked,
        include_printed_certificates: document.getElementById("log_certs").checked,
        include_mementos: document.getElementById("log_mementos").checked,
        confirmed_venue: document.getElementById("conf_venue").checked,
        confirmed_speakers: document.getElementById("conf_speakers").checked,
        confirmed_budget_approval: document.getElementById("conf_budget").checked,
    };
}

async function handleGeneratePlan() {
    const payload = collectFormData();
    
    // UI Loading state
    const btn = document.getElementById("btn-generate-plan");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Agent Planning in Progress...`;

    const progressDiv = document.getElementById("planning-progress-banner");
    progressDiv.classList.remove("hidden");
    
    const steps = [
        "Phase 1/4: Analyzing input requirements & checking base parameters...",
        "Phase 2/4: Decomposing event into 9 lifecycle phases & scheduling timetable...",
        "Phase 3/4: Calculating transparent budget formulas & checking constraints...",
        "Phase 4/4: Formulating alternatives & rendering structured dashboard..."
    ];

    let stepIdx = 0;
    const progressInterval = setInterval(() => {
        stepIdx = (stepIdx + 1) % steps.length;
        document.getElementById("progress-step-text").innerText = steps[stepIdx];
    }, 400);

    try {
        const response = await fetch("/api/plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        clearInterval(progressInterval);

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Planning engine failed");
        }

        currentPlan = await response.json();
        renderPlanDashboard(currentPlan);

        // Smooth scroll to results
        document.getElementById("plan-results-section").classList.remove("hidden");
        document.getElementById("plan-results-section").scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        clearInterval(progressInterval);
        alert("Error generating plan: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        progressDiv.classList.add("hidden");
    }
}

function renderPlanDashboard(plan) {
    const report = plan.constraint_validation_report;
    const budget = plan.estimated_budget;
    const venue = plan.venue_recommendation;

    // 1. Feasibility Status Banner
    const banner = document.getElementById("status-banner");
    const statusPill = document.getElementById("status-pill");
    const statusMsg = document.getElementById("status-message");

    if (report.overall_status === "FEASIBLE") {
        banner.className = "p-5 rounded-2xl mb-8 border transition bg-emerald-50 border-emerald-200 text-emerald-950 shadow-sm";
        statusPill.className = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white";
        statusPill.innerText = "Feasible Plan";
        statusMsg.innerText = report.feasibility_summary;
    } else if (report.overall_status === "FEASIBLE_WITH_WARNINGS") {
        banner.className = "p-5 rounded-2xl mb-8 border transition bg-amber-50 border-amber-200 text-amber-950 shadow-sm";
        statusPill.className = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-600 text-white";
        statusPill.innerText = "Feasible with Warnings";
        statusMsg.innerText = report.feasibility_summary;
    } else {
        banner.className = "p-5 rounded-2xl mb-8 border transition bg-rose-50 border-rose-200 text-rose-950 shadow-sm";
        statusPill.className = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-600 text-white";
        statusPill.innerText = "Infeasible – Constraints Violated";
        statusMsg.innerText = report.feasibility_summary;
    }

    // 2. High-Level Metric Cards
    document.getElementById("metric-venue-name").innerText = venue.recommended_venue_name;
    document.getElementById("metric-venue-util").innerText = `${venue.utilization_percentage}% capacity utilized (${plan.participant_distribution.students}/${venue.recommended_venue_capacity} seats)`;
    
    document.getElementById("metric-budget-cost").innerText = `₹${budget.total_estimated_expenses.toLocaleString('en-IN')}`;
    const varPrefix = budget.variance >= 0 ? "+" : "";
    document.getElementById("metric-budget-var").innerText = `Sanctioned: ₹${budget.total_budget_available.toLocaleString('en-IN')} (${varPrefix}₹${budget.variance.toLocaleString('en-IN')})`;
    document.getElementById("metric-budget-var").className = budget.is_within_budget ? "text-xs text-emerald-700 font-semibold" : "text-xs text-rose-600 font-bold";

    document.getElementById("metric-tasks-count").innerText = `${plan.task_decomposition.length} Tasks`;
    document.getElementById("metric-tasks-phases").innerText = "Across 9 lifecycle management phases";

    document.getElementById("metric-footfall-count").innerText = `${plan.participant_distribution.total_crowd} Total Footfall`;
    document.getElementById("metric-footfall-ratio").innerText = `Volunteer ratio: ${plan.participant_distribution.ratio_student_volunteer}`;

    // 3. Render All Structured Output Sections (A to L)
    renderSectionOverview(plan);
    renderSectionVenue(plan);
    renderSectionTasks(plan);
    renderSectionSchedule(plan);
    renderSectionTechnicalSessions(plan);
    renderSectionResources(plan);
    renderSectionParticipants(plan);
    renderSectionResponsibility(plan);
    renderSectionBudget(plan);
    renderSectionConstraints(plan);
    renderSectionRisks(plan);
    renderSectionRecommendations(plan);

    // Default to Overview tab
    switchTab("tab-overview");
}

function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    document.querySelectorAll(".tab-panel").forEach(panel => {
        if (panel.id === tabId) {
            panel.classList.remove("hidden");
        } else {
            panel.classList.add("hidden");
        }
    });
}

/* SECTION RENDERERS */

function renderSectionOverview(plan) {
    const ov = plan.event_overview;
    document.getElementById("ov-event-title").innerText = ov.event_name;
    document.getElementById("ov-event-desc").innerText = ov.description || "Technical symposium conducted by department coordinators.";
    document.getElementById("ov-date").innerText = ov.event_date;
    document.getElementById("ov-hours").innerText = ov.operating_hours;
    document.getElementById("ov-participants").innerText = `${ov.expected_participants} Students`;
    document.getElementById("ov-budget").innerText = `₹${ov.available_budget.toLocaleString('en-IN')}`;
    document.getElementById("ov-sessions").innerText = `${ov.num_sessions} Technical Track(s)`;
    document.getElementById("ov-venue").innerText = ov.selected_venue_name;
}

function renderSectionVenue(plan) {
    const v = plan.venue_recommendation;
    document.getElementById("vr-name").innerText = v.recommended_venue_name;
    document.getElementById("vr-capacity").innerText = `${v.recommended_venue_capacity} Seats`;
    document.getElementById("vr-util").innerText = `${v.utilization_percentage}%`;
    document.getElementById("vr-status-pill").innerText = v.status;
    document.getElementById("vr-confirmed").innerHTML = v.is_confirmed 
        ? `<span class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Confirmed Booking</span>` 
        : `<span class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Pending Administrative Confirmation</span>`;
    document.getElementById("vr-rationale").innerText = v.rationale;

    // Evaluated venues table
    const tbody = document.getElementById("vr-evaluated-table");
    tbody.innerHTML = "";
    v.available_venues_evaluated.forEach(item => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-100 text-sm";
        tr.innerHTML = `
            <td class="py-2.5 px-3 font-semibold text-slate-800">${item.name}</td>
            <td class="py-2.5 px-3 text-center">${item.capacity}</td>
            <td class="py-2.5 px-3 text-center font-medium ${item.utilization_pct > 100 ? 'text-rose-600 font-bold' : 'text-slate-700'}">${item.utilization_pct}%</td>
            <td class="py-2.5 px-3 text-center">
                <span class="text-xs px-2 py-0.5 rounded-full ${item.status === 'Suitable' || item.status.includes('Ideal') ? 'bg-emerald-100 text-emerald-800' : (item.status.includes('Insufficient') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')}">${item.status}</span>
            </td>
            <td class="py-2.5 px-3 text-xs text-slate-500">
                ${item.has_ac ? '✓ AC ' : ''}${item.has_projector ? '✓ Proj ' : ''}${item.has_sound ? '✓ Sound ' : ''}${item.has_computers ? '✓ Lab' : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Alternatives list
    const altUl = document.getElementById("vr-alternatives-list");
    altUl.innerHTML = "";
    v.alternative_options.forEach(alt => {
        const li = document.createElement("li");
        li.className = "text-sm text-slate-600 flex items-start space-x-2";
        li.innerHTML = `<span class="text-blue-500 mt-0.5 font-bold">•</span><span>${alt}</span>`;
        altUl.appendChild(li);
    });
}

function renderSectionTasks(plan) {
    const filterPhase = document.getElementById("task-phase-filter");
    if (filterPhase && filterPhase.options.length <= 1) {
        // Populate distinct phases
        const phases = [...new Set(plan.task_decomposition.map(t => t.phase_name))];
        phases.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p;
            opt.innerText = p;
            filterPhase.appendChild(opt);
        });
    }
    filterTasks();
}

function filterTasks() {
    if (!currentPlan) return;
    const phaseVal = document.getElementById("task-phase-filter")?.value || "ALL";
    const prioVal = document.getElementById("task-priority-filter")?.value || "ALL";
    const searchVal = document.getElementById("task-search-input")?.value.toLowerCase() || "";

    const filtered = currentPlan.task_decomposition.filter(t => {
        const matchPhase = (phaseVal === "ALL" || t.phase_name === phaseVal);
        const matchPrio = (prioVal === "ALL" || t.priority === prioVal);
        const matchSearch = (!searchVal || t.task_name.toLowerCase().includes(searchVal) || t.assigned_role.toLowerCase().includes(searchVal) || t.description.toLowerCase().includes(searchVal));
        return matchPhase && matchPrio && matchSearch;
    });

    const tbody = document.getElementById("tasks-table-body");
    tbody.innerHTML = "";

    filtered.forEach(t => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-100 hover:bg-slate-50 transition text-sm";
        const prioBadge = t.priority === "High" ? "bg-rose-100 text-rose-700" : (t.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700");
        const statusBadge = t.status === "Ready" ? "bg-emerald-100 text-emerald-800" : (t.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800");

        tr.innerHTML = `
            <td class="p-3 text-center">
                <input type="checkbox" class="task-checkbox rounded text-blue-600 focus:ring-blue-500 cursor-pointer" onchange="updateTaskProgress()">
            </td>
            <td class="p-3 font-mono text-xs font-bold text-slate-500">${t.task_id}</td>
            <td class="p-3">
                <span class="text-xs font-semibold text-blue-600 block mb-0.5">${t.phase_name}</span>
                <span class="font-semibold text-slate-800 block">${t.task_name}</span>
                <span class="text-xs text-slate-500 mt-0.5 block">${t.description}</span>
            </td>
            <td class="p-3">
                <span class="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">${t.assigned_role}</span>
            </td>
            <td class="p-3 text-center font-mono text-xs text-slate-600">${t.estimated_duration}</td>
            <td class="p-3 text-center">
                <span class="text-xs px-2 py-0.5 rounded-full font-bold ${prioBadge}">${t.priority}</span>
            </td>
            <td class="p-3 text-xs font-medium text-slate-600">${t.deadline}</td>
            <td class="p-3 text-center">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge}">${t.status}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateTaskProgress();
}

function updateTaskProgress() {
    const total = document.querySelectorAll(".task-checkbox").length;
    const checked = document.querySelectorAll(".task-checkbox:checked").length;
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
    
    const bar = document.getElementById("tasks-progress-bar");
    const label = document.getElementById("tasks-progress-label");
    if (bar) bar.style.width = `${pct}%`;
    if (label) label.innerText = `${checked} of ${total} tasks checked (${pct}%)`;
}

function renderSectionSchedule(plan) {
    const daysContainer = document.getElementById("schedule-days-selector");
    daysContainer.innerHTML = "";

    const daysCount = Object.keys(plan.schedule_by_day).length;
    for (let d = 1; d <= daysCount; d++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `px-4 py-1.5 text-sm font-semibold rounded-lg transition ${d === currentDayFilter ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`;
        btn.innerText = `Day ${d} Timetable`;
        btn.onclick = () => {
            currentDayFilter = d;
            renderSectionSchedule(plan);
        };
        daysContainer.appendChild(btn);
    }

    const slots = plan.schedule_by_day[currentDayFilter] || plan.detailed_schedule;
    const timelineDiv = document.getElementById("schedule-timeline-list");
    timelineDiv.innerHTML = "";

    slots.forEach(s => {
        const item = document.createElement("div");
        item.className = "flex space-x-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition bg-white shadow-sm";
        
        let typePillClass = "bg-blue-100 text-blue-700";
        if (s.activity_type === "break") typePillClass = "bg-amber-100 text-amber-800";
        if (s.activity_type === "inauguration" || s.activity_type === "valedictory") typePillClass = "bg-purple-100 text-purple-800";
        if (s.activity_type === "registration") typePillClass = "bg-emerald-100 text-emerald-800";

        item.innerHTML = `
            <div class="w-32 flex-shrink-0 text-right pr-4 border-r border-slate-200">
                <span class="block text-sm font-bold text-slate-800">${s.start_time} - ${s.end_time}</span>
                <span class="block text-xs font-mono text-slate-500">${s.duration_minutes} mins</span>
                <span class="inline-block mt-2 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${typePillClass}">${s.activity_type}</span>
            </div>
            <div class="flex-grow">
                <h4 class="text-base font-bold text-slate-900">${s.activity_name}</h4>
                <p class="text-sm text-slate-600 mt-1">${s.description}</p>
                <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span class="px-2.5 py-1 bg-slate-100 rounded-md font-medium text-slate-700">Team: ${s.assigned_team}</span>
                    <span class="px-2.5 py-1 bg-slate-100 rounded-md font-medium text-slate-700">Location: ${s.location}</span>
                    <span class="px-2.5 py-1 bg-slate-100 rounded-md text-slate-600">Equipment: ${s.required_resources}</span>
                </div>
            </div>
        `;
        timelineDiv.appendChild(item);
    });
}

function renderSectionTechnicalSessions(plan) {
    const container = document.getElementById("tech-sessions-grid");
    container.innerHTML = "";

    plan.technical_sessions.forEach(s => {
        const card = document.createElement("div");
        card.className = "p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow transition flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-mono font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">${s.session_id}</span>
                    <span class="text-xs font-bold text-slate-600 uppercase tracking-wider">${s.duration_minutes} Minutes</span>
                </div>
                <h4 class="text-base font-bold text-slate-900 mb-1">${s.title}</h4>
                <p class="text-sm text-slate-700 font-medium mb-3">${s.suggested_topic}</p>
                
                <div class="space-y-2 text-xs text-slate-600">
                    <div><b>Facilitator:</b> ${s.speaker_or_judge_type}</div>
                    <div><b>Tech Requirements:</b> ${s.required_hardware_software}</div>
                    <div><b>Participant Prereqs:</b> ${s.prerequisites}</div>
                    ${s.evaluation_criteria ? `<div><b>Evaluation Criteria:</b> ${s.evaluation_criteria}</div>` : ''}
                </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Format: ${s.type.replace('_', ' ').toUpperCase()}</span>
                <span class="text-emerald-600">Verified Feasible</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderSectionResources(plan) {
    const rc = plan.resource_checklist;
    const itemsTbody = document.getElementById("resources-table-body");
    itemsTbody.innerHTML = "";

    rc.items.forEach(item => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-100 text-sm";
        tr.innerHTML = `
            <td class="p-3 font-semibold text-slate-800">${item.name}</td>
            <td class="p-3 text-slate-600">${item.category}</td>
            <td class="p-3 text-center">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium ${item.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                    ${item.available ? 'Available' : 'Missing'}
                </span>
            </td>
            <td class="p-3 text-center">
                <span class="text-xs ${item.critical ? 'font-bold text-rose-600' : 'text-slate-400'}">${item.critical ? 'Critical' : 'Standard'}</span>
            </td>
        `;
        itemsTbody.appendChild(tr);
    });

    const workaroundsDiv = document.getElementById("resource-workarounds-list");
    workaroundsDiv.innerHTML = "";
    if (rc.suggested_workarounds.length === 0) {
        workaroundsDiv.innerHTML = `<div class="p-4 bg-emerald-50 rounded-xl text-emerald-800 text-sm font-medium">All equipment and facilities are fully satisfied. No workarounds needed!</div>`;
    } else {
        rc.suggested_workarounds.forEach(w => {
            const card = document.createElement("div");
            card.className = "p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900";
            card.innerHTML = `<b>Missing: ${w.resource}</b><p class="mt-1">${w.suggested_solution}</p>`;
            workaroundsDiv.appendChild(card);
        });
    }
}

function renderSectionParticipants(plan) {
    const p = plan.participant_distribution;
    document.getElementById("pd-students").innerText = p.students;
    document.getElementById("pd-speakers").innerText = p.speakers;
    document.getElementById("pd-judges").innerText = p.judges;
    document.getElementById("pd-faculty").innerText = p.faculty_coordinators;
    document.getElementById("pd-volunteers").innerText = p.student_volunteers;
    document.getElementById("pd-leads").innerText = p.organizing_leads;
    document.getElementById("pd-total").innerText = p.total_crowd;
    document.getElementById("pd-food").innerText = p.food_count_headcount;
    document.getElementById("pd-certs").innerText = p.certificate_count;
    document.getElementById("pd-ratio").innerText = p.ratio_student_volunteer;
}

function renderSectionResponsibility(plan) {
    const container = document.getElementById("resp-matrix-container");
    container.innerHTML = "";

    plan.responsibility_matrix.forEach(r => {
        const card = document.createElement("div");
        card.className = "p-5 rounded-2xl border border-slate-200 bg-white shadow-sm";
        card.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h4 class="text-base font-bold text-slate-900">${r.role_name}</h4>
                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">${r.head_count} Headcount</span>
            </div>
            <div class="mb-3">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Key Responsibilities</span>
                <ul class="text-xs text-slate-600 list-disc list-inside space-y-1">
                    ${r.key_responsibilities.map(x => `<li>${x}</li>`).join('')}
                </ul>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div class="bg-slate-50 p-2.5 rounded-lg">
                    <b class="text-slate-800 block mb-1">Pre-Event:</b>
                    <ul class="space-y-1 text-slate-600 list-disc list-inside">
                        ${r.pre_event_tasks.map(x => `<li>${x}</li>`).join('')}
                    </ul>
                </div>
                <div class="bg-slate-50 p-2.5 rounded-lg">
                    <b class="text-slate-800 block mb-1">Event-Day:</b>
                    <ul class="space-y-1 text-slate-600 list-disc list-inside">
                        ${r.event_day_tasks.map(x => `<li>${x}</li>`).join('')}
                    </ul>
                </div>
                <div class="bg-slate-50 p-2.5 rounded-lg">
                    <b class="text-slate-800 block mb-1">Post-Event:</b>
                    <ul class="space-y-1 text-slate-600 list-disc list-inside">
                        ${r.post_event_tasks.map(x => `<li>${x}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderSectionBudget(plan) {
    const b = plan.estimated_budget;
    document.getElementById("bg-total-avail").innerText = `₹${b.total_budget_available.toLocaleString('en-IN')}`;
    document.getElementById("bg-total-exp").innerText = `₹${b.total_estimated_expenses.toLocaleString('en-IN')}`;
    document.getElementById("bg-variance").innerText = `₹${b.variance.toLocaleString('en-IN')} (${b.variance_percentage}%)`;
    document.getElementById("bg-variance").className = b.is_within_budget ? "text-xl font-bold text-emerald-600" : "text-xl font-bold text-rose-600";
    document.getElementById("bg-contingency").innerText = `₹${b.contingency_fund.toLocaleString('en-IN')} (${b.contingency_percentage}%)`;

    // Category breakdown badges
    const catDiv = document.getElementById("bg-categories-breakdown");
    catDiv.innerHTML = "";
    for (const [cat, amt] of Object.entries(b.breakdown_by_category)) {
        const badge = document.createElement("div");
        badge.className = "px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center";
        badge.innerHTML = `<span class="text-slate-700 font-medium">${cat}</span><span class="font-bold text-slate-900">₹${amt.toLocaleString('en-IN')}</span>`;
        catDiv.appendChild(badge);
    }

    // Line items table
    const tbody = document.getElementById("budget-items-table");
    tbody.innerHTML = "";
    b.items.forEach(item => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-100 text-sm hover:bg-slate-50";
        tr.innerHTML = `
            <td class="p-3 text-xs font-semibold text-slate-500">${item.category}</td>
            <td class="p-3 font-semibold text-slate-800">${item.item_name}</td>
            <td class="p-3 text-xs font-mono text-slate-600">${item.formula}</td>
            <td class="p-3 text-right font-bold text-slate-900">₹${item.total_cost.toLocaleString('en-IN')}</td>
            <td class="p-3 text-xs text-slate-500">${item.notes}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderSectionConstraints(plan) {
    const report = plan.constraint_validation_report;
    document.getElementById("cr-passed-count").innerText = `${report.passed_count} Passed`;
    document.getElementById("cr-warning-count").innerText = `${report.warning_count} Warnings`;
    document.getElementById("cr-failed-count").innerText = `${report.failed_count} Failed`;

    const tbody = document.getElementById("constraints-table-body");
    tbody.innerHTML = "";

    report.checks.forEach(chk => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-100 text-sm hover:bg-slate-50";
        
        let badgeClass = "bg-emerald-100 text-emerald-800";
        if (chk.status === "WARNING") badgeClass = "bg-amber-100 text-amber-800";
        if (chk.status === "FAILED") badgeClass = "bg-rose-100 text-rose-800";

        let altHtml = "";
        if (chk.alternatives && chk.alternatives.length > 0) {
            altHtml = `
                <div class="mt-2 pt-2 border-t border-slate-200">
                    <span class="text-xs font-bold text-blue-700 block mb-1">Recommended Practical Alternatives:</span>
                    <ul class="text-xs text-slate-700 list-disc list-inside space-y-1">
                        ${chk.alternatives.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        tr.innerHTML = `
            <td class="p-3 font-bold text-slate-800">${chk.name}</td>
            <td class="p-3 text-xs text-slate-500">${chk.category}</td>
            <td class="p-3 text-center">
                <span class="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${badgeClass}">${chk.status}</span>
            </td>
            <td class="p-3">
                ${chk.problem ? `<p class="text-xs font-bold text-rose-700 mb-1">Problem: ${chk.problem}</p>` : ''}
                <p class="text-xs text-slate-600">${chk.explanation || ''}</p>
                ${altHtml}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderSectionRisks(plan) {
    const container = document.getElementById("risks-container");
    container.innerHTML = "";

    plan.risks_and_alternatives.forEach(r => {
        const card = document.createElement("div");
        card.className = "p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between";
        
        const sevClass = r.severity === "High" ? "bg-rose-100 text-rose-700" : (r.severity === "Medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700");

        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sevClass}">${r.severity} Severity</span>
                    <span class="text-xs text-slate-500">${r.likelihood} Likelihood</span>
                </div>
                <h4 class="text-base font-bold text-slate-900 mb-2">${r.risk_title}</h4>
                <p class="text-xs text-slate-600 mb-3"><b class="text-slate-700">Impact:</b> ${r.impact_description}</p>
                
                <div class="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-950 mb-2">
                    <b class="text-blue-800 block mb-0.5">Mitigation Protocol:</b>
                    ${r.mitigation_strategy}
                </div>
                <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-950">
                    <b class="text-emerald-800 block mb-0.5">Contingency Plan B:</b>
                    ${r.alternative_plan}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderSectionRecommendations(plan) {
    const list = document.getElementById("final-recommendations-list");
    list.innerHTML = "";

    plan.final_recommendations.forEach(rec => {
        const item = document.createElement("li");
        item.className = "p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 flex items-start space-x-2";
        item.innerHTML = `<span class="text-blue-600 font-bold mt-0.5">✓</span><span>${rec}</span>`;
        list.appendChild(item);
    });
}

/* EXPORT FUNCTIONS */

async function exportPlanPdf() {
    if (!currentPlan) return;
    try {
        const response = await fetch("/api/export/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentPlan)
        });

        if (!response.ok) throw new Error("Failed to generate PDF");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(currentPlan.event_overview.event_name || 'EventPlan').replace(/\s+/g, '_')}_Plan.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        alert("Export failed: " + e.message);
    }
}

async function exportPlanCsv() {
    if (!currentPlan) return;
    try {
        const response = await fetch("/api/export/csv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentPlan)
        });

        if (!response.ok) throw new Error("Failed to generate CSV");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(currentPlan.event_overview.event_name || 'EventPlan').replace(/\s+/g, '_')}_Plan.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        alert("Export failed: " + e.message);
    }
}
