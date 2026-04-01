// ── SKILL TAGS ──
const skillInput = document.getElementById('skillInput');
const skillTagsContainer = document.getElementById('skillTags');
const skillsHidden = document.getElementById('skills');
let skillsArray = [];
let debouncedAutoSave;

function triggerAutoSave() {
    saveFormData();
    updateProgress();
    calcATS();
}

function attachAutoSaveListeners(root) {
    if (!root) return;

    const elements = root.querySelectorAll ? root.querySelectorAll('input, textarea, select') : [];
    elements.forEach(el => {
        el.addEventListener('input', () => debouncedAutoSave && debouncedAutoSave());
        el.addEventListener('change', () => debouncedAutoSave && debouncedAutoSave());
    });

    // If root itself is an input-like element, attach listeners too
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(root.tagName)) {
        root.addEventListener('input', () => debouncedAutoSave && debouncedAutoSave());
        root.addEventListener('change', () => debouncedAutoSave && debouncedAutoSave());
    }
}

skillInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = skillInput.value.trim().replace(/,$/, '');
        if (val && !skillsArray.includes(val)) {
            skillsArray.push(val);
            renderSkillTags();
            skillInput.value = '';
            skillsHidden.value = skillsArray.join(', ');
        }
    }
});

function renderSkillTags() {
    skillTagsContainer.innerHTML = skillsArray.map((skill, i) => `
        <span class="skill-tag">
            ${skill}
            <span class="remove" onclick="removeSkill(${i})">×</span>
        </span>
    `).join('');
}

function removeSkill(index) {
    skillsArray.splice(index, 1);
    renderSkillTags();
    skillsHidden.value = skillsArray.join(', ');
}

// ── AI ENHANCE ──
// Static template strings only — no user input interpolated
const aiSuggestions = {
    summary: "Results-driven professional with experience building scalable applications. Passionate about clean code, performance optimization, and delivering impactful user experiences. Proven track record of collaborating with cross-functional teams to ship high-quality products on time.",
    eduDescription: "Dean's List for 3 consecutive semesters. President of Computer Science Club. Completed capstone project on machine learning algorithms. Volunteered as teaching assistant for introductory programming courses.",
    expDescription: "• Engineered RESTful APIs improving response time by 40%\n• Collaborated with a team using Agile/Scrum methodology\n• Implemented CI/CD pipelines reducing deployment time by 60%\n• Mentored junior developers and conducted code reviews",
    projectDescription: "• Built full-stack application with modern technologies\n• Implemented responsive design for mobile and desktop\n• Integrated third-party APIs for enhanced functionality\n• Deployed to cloud platform with 99.9% uptime"
};

function aiEnhance(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const suggestion = aiSuggestions[fieldId];
    if (!suggestion) return;

    field.value = '';
    field.style.borderColor = '#6366f1';
    field.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';

    let i = 0;
    const interval = setInterval(() => {
        field.value += suggestion[i];
        i++;
        field.scrollTop = field.scrollHeight;
        if (i >= suggestion.length) {
            clearInterval(interval);
            field.style.borderColor = '#10b981';
            field.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.2)';
            setTimeout(() => { field.style.borderColor = ''; field.style.boxShadow = ''; }, 1500);
        }
    }, 18);
}

// ── GENERATE RESUME ──
document.getElementById('generateBtn').addEventListener('click', function(e) {
    e.preventDefault();

    const btn = this;
    btn.classList.add('loading');
    btn.textContent = '✦ Generating...';

    setTimeout(() => {
        buildResume();
        btn.classList.remove('loading');
        btn.textContent = '✦ Generate Resume';
    }, 800);
});



// ── MISSING FUNCTIONS ──

// Collapsible sections
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const body = section.querySelector('.section-body');
    const chevron = section.querySelector('.chevron');

    if (body.classList.contains('expanded')) {
        body.classList.remove('expanded');
        chevron.classList.remove('rotated');
    } else {
        body.classList.add('expanded');
        chevron.classList.add('rotated');
    }
}

// Add entry functionality
function addEntry(type) {
    // Map type to correct container ID (experience→experienceEntries, projects→projectEntries, etc)
    const containerMap = {
        'experience': 'experienceEntries',
        'projects': 'projectEntries',
        'certifications': 'certEntries',
        'awards': 'awardEntries'
    };
    const containerId = containerMap[type] || `${type}Entries`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    
    // Create new entry block from first entry as template
    const firstEntry = container.querySelector('.entry-block');
    if (!firstEntry) return;
    
    const clone = firstEntry.cloneNode(true);
    
    // Reset all input values in cloned entry
    clone.querySelectorAll('input, textarea').forEach(el => el.value = '');
    
    // Ensure the cloned entry has a remove button and it works
    let removeBtn = clone.querySelector('.remove-entry-btn');
    if (!removeBtn) {
        removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-entry-btn';
        removeBtn.title = 'Remove entry';
        removeBtn.textContent = '×';
        clone.appendChild(removeBtn);
    }

    removeBtn.onclick = function() {
        const entryBlocks = container.querySelectorAll('.entry-block');
        // Always keep at least one entry block
        if (entryBlocks.length <= 1) return;
        this.closest('.entry-block').remove();
        updateProgress();
        saveFormData();
    };

    // Ensure newly added inputs are tracked by auto-save / progress updates
    attachAutoSaveListeners(clone);
    container.appendChild(clone);
    updateProgress();
    saveFormData();
}

function attachRemoveHandler(entry, container) {
    const removeBtn = entry.querySelector('.remove-entry-btn');
    if (!removeBtn) return;

    removeBtn.onclick = function() {
        const entryBlocks = container.querySelectorAll('.entry-block');
        if (entryBlocks.length <= 1) return;
        entry.remove();
        updateProgress();
        saveFormData();
    };
}

function setupRemoveButtons(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.entry-block').forEach(entry => attachRemoveHandler(entry, container));
}

// Photo upload handling
function handlePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image size should be less than 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('photoPreview').src = e.target.result;
        document.getElementById('photoPreview').style.display = 'block';
        document.getElementById('photoPlaceholder').style.display = 'none';
        localStorage.setItem('resumePhoto', e.target.result);
        showToast('Photo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

// Skill suggestions based on job title
function suggestSkills() {
    const jobTitleInput = document.getElementById('professionalTitle');
    const jobTitle = jobTitleInput?.value.trim().toLowerCase() || '';

    const skillSuggestions = {
        'software engineer': ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git'],
        'web developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js', 'PHP'],
        'data scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'Pandas', 'TensorFlow'],
        'product manager': ['Agile', 'Scrum', 'Analytics', 'User Research', 'Roadmapping'],
        'designer': ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Experience'],
        'marketing': ['SEO', 'Content Marketing', 'Social Media', 'Google Analytics', 'Copywriting']
    };

    const container = document.getElementById('skillSuggestions');
    if (!container) return;

    // Allow partial matches (e.g. "software" should match "software engineer")
    const matchedKeys = Object.keys(skillSuggestions).filter(key => {
        if (!jobTitle) return false;
        return key.includes(jobTitle) || jobTitle.includes(key);
    });

    const suggestions = matchedKeys.length > 0
        ? matchedKeys.flatMap(key => skillSuggestions[key])
        : [];

    if (suggestions.length > 0) {
        container.innerHTML = '';
        suggestions.forEach(skill => {
            const div = document.createElement('div');
            div.textContent = skill;
            div.addEventListener('click', () => addSuggestedSkill(skill));
            container.appendChild(div);
        });
        container.classList.add('show');
    } else {
        container.classList.remove('show');
        container.innerHTML = '';
    }
}

function addSuggestedSkill(skill) {
    if (!skillsArray.includes(skill)) {
        skillsArray.push(skill);
        renderSkillTags();
        document.getElementById('skills').value = skillsArray.join(', ');
    }
    document.getElementById('skillSuggestions').classList.remove('show');
}

// Word count — accepts a textarea element directly (called via oninput="updateWordCount(this)")
function updateWordCount(textarea) {
    const counter = document.getElementById('wordCount');
    if (!counter) return;
    const text = textarea.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    counter.textContent = `${words} words · ${text.length} characters`;
}

// AI enhance for individual entries — btn is the clicked button element
function aiEnhanceEntry(btn, fieldName) {
    const entry = btn.closest('.entry-block');
    if (!entry) return;
    const field = entry.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    const suggestion = aiSuggestions[fieldName];
    if (!suggestion) return;

    field.value = '';
    field.style.borderColor = '#6366f1';
    field.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';

    let i = 0;
    const interval = setInterval(() => {
        field.value += suggestion[i];
        i++;
        field.scrollTop = field.scrollHeight;
        if (i >= suggestion.length) {
            clearInterval(interval);
            field.style.borderColor = '#10b981';
            field.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.2)';
            setTimeout(() => { field.style.borderColor = ''; field.style.boxShadow = ''; }, 1500);
        }
    }, 15);
}

// Template switching
function setTemplate(template) {
    document.querySelectorAll('.tpl-btn').forEach(btn => btn.classList.remove('active'));

    const activeButton = document.querySelector(`[onclick="setTemplate('${template}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    const preview = document.getElementById('resumePreview');
    if (preview) {
        preview.className = `resume-document template-${template}`;
    }
    localStorage.setItem('selectedTemplate', template);
}

// Zoom functionality
let currentZoom = 1;
function resetZoom() {
    currentZoom = 1;
    const preview = document.getElementById('resumePreview');
    if (!preview) return;
    preview.style.transform = `scale(${currentZoom})`;
    preview.style.transformOrigin = 'top center';
    preview.style.transition = 'transform 0.2s ease-out';
}

function zoomIn() {
    if (currentZoom < 2) {
        currentZoom += 0.1;
        const preview = document.getElementById('resumePreview');
        preview.style.transform = `scale(${currentZoom})`;
        preview.style.transformOrigin = 'top center';
        preview.style.transition = 'transform 0.2s ease-out';
    }
}

function zoomOut() {
    if (currentZoom > 0.5) {
        currentZoom -= 0.1;
        const preview = document.getElementById('resumePreview');
        preview.style.transform = `scale(${currentZoom})`;
        preview.style.transformOrigin = 'top center';
        preview.style.transition = 'transform 0.2s ease-out';
    }
}

// Preview theme toggle
function updateThemeToggleIcon() {
    const btn = document.getElementById('themeToggleBtn');
    const preview = document.getElementById('resumePreview');
    if (!btn || !preview) return;
    const isDark = preview.classList.contains('preview-dark');
    btn.textContent = isDark ? '🌙' : '☀️';
}

function togglePreviewTheme() {
    const preview = document.getElementById('resumePreview');
    preview.classList.toggle('preview-dark');
    const isDark = preview.classList.contains('preview-dark');
    localStorage.setItem('previewTheme', isDark ? 'dark' : 'light');
    updateThemeToggleIcon();
}

// PDF download
function downloadPDF() {
    const el = document.getElementById('resumePreview');

    if (el.querySelector('.empty-state')) {
        showToast('Generate your resume first!', 'error');
        return;
    }

    showToast('Generating PDF...', 'success');

    const prevTransform = el.style.transform;
    const prevTransition = el.style.transition;
    el.style.transform = 'none';
    el.style.transition = 'none';
    el.classList.add('pdf-exporting');

    html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgW = pageW;
        const imgH = (canvas.height * pageW) / canvas.width;

        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        let y = 0;
        let remaining = imgH;
        let first = true;

        while (remaining > 0) {
            if (!first) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, -y, imgW, imgH);
            y += pageH;
            remaining -= pageH;
            first = false;
        }

        pdf.save('ElevateCV-resume.pdf');

        el.style.transform = prevTransform;
        el.style.transition = prevTransition;
        el.classList.remove('pdf-exporting');
        showToast('PDF downloaded!', 'success');
    }).catch(err => {
        el.style.transform = prevTransform;
        el.style.transition = prevTransition;
        el.classList.remove('pdf-exporting');
        console.error('PDF error:', err);
        showToast('Failed to generate PDF', 'error');
    });
}

// Custom confirm modal (replaces browser confirm())
function showConfirmModal(message, onConfirm) {
    const overlay = document.getElementById('confirmOverlay');
    const msg = document.getElementById('confirmMessage');
    const btnOk = document.getElementById('confirmOk');
    const btnCancel = document.getElementById('confirmCancel');

    msg.textContent = message;
    overlay.classList.add('show');

    const cleanup = () => overlay.classList.remove('show');

    btnOk.onclick = () => { cleanup(); onConfirm(); };
    btnCancel.onclick = cleanup;
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(); };
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// ── IMPROVED EXISTING FUNCTIONS ──

// Form validation
function validateForm() {
    let isValid = true;

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!firstName) {
        document.getElementById('firstNameErr').textContent = 'First name is required';
        document.getElementById('firstNameErr').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('firstNameErr').style.display = 'none';
    }

    if (!lastName) {
        document.getElementById('lastNameErr').textContent = 'Last name is required';
        document.getElementById('lastNameErr').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('lastNameErr').style.display = 'none';
    }

    if (!email) {
        document.getElementById('emailErr').textContent = 'Email is required';
        document.getElementById('emailErr').style.display = 'block';
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        document.getElementById('emailErr').textContent = 'Please enter a valid email';
        document.getElementById('emailErr').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('emailErr').style.display = 'none';
    }

    return isValid;
}

function clearForm() {
    showConfirmModal('Clear all form data? This cannot be undone.', () => {
        _doClearForm();
    });
}

function _doClearForm() {

    // Clear localStorage
    localStorage.removeItem('resumeFormData');
    localStorage.removeItem('resumePhoto');

    // Clear all inputs and textareas
    document.querySelectorAll('#resumeForm input:not([type="hidden"]):not([type="file"]), #resumeForm textarea').forEach(el => el.value = '');

    // Clear first/last name errors
    ['firstNameErr', 'lastNameErr', 'emailErr'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Clear skills
    skillsArray = [];
    renderSkillTags();
    document.getElementById('skills').value = '';

    // Remove extra entry blocks (keep only first)
    ['experienceEntries', 'projectEntries', 'certEntries', 'awardEntries'].forEach(id => {
        const container = document.getElementById(id);
        const entries = container.querySelectorAll('.entry-block');
        entries.forEach((entry, i) => { if (i > 0) entry.remove(); });
        // Clear first entry fields
        container.querySelectorAll('input, textarea').forEach(el => el.value = '');
    });

    // Reset photo
    document.getElementById('photoPreview').src = '';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoPlaceholder').style.display = '';

    // Reset word count
    const summaryField = document.getElementById('summary');
    if (summaryField) {
        summaryField.value = '';
        updateWordCount(summaryField);
    }

    // Reset preview to empty state
    document.getElementById('resumePreview').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">✦</div>
            <h2>Your Resume Preview</h2>
            <p>Fill in the form and click "Generate Resume" to see your professional ElevateCV resume here.</p>
            <div class="empty-features">
                <span class="empty-feature">✦ ATS Friendly</span>
                <span class="empty-feature">⚡ Instant Preview</span>
                <span class="empty-feature">🎨 3 Templates</span>
                <span class="empty-feature">⬇ PDF Export</span>
            </div>
        </div>`;

    // Hide ATS bar
    document.getElementById('atsBar').style.display = 'none';

    updateProgress();
    showToast('Form cleared!', 'success');
}
function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Progress tracking
function updateProgress() {
    const totalFields = 15; // Approximate total fields
    let filledFields = 0;

    const basicFields = ['firstName', 'lastName', 'professionalTitle'];
    basicFields.forEach(id => {
        if (document.getElementById(id)?.value.trim()) filledFields++;
    });

    // Check email separately
    if (document.getElementById('email')?.value.trim()) filledFields++;
    if (document.getElementById('summary')?.value.trim()) filledFields++;

    // Check experience entries
    const expEntries = document.querySelectorAll('#experienceEntries .entry-block');
    expEntries.forEach(entry => {
        if (entry.querySelector('[name="jobTitle"]')?.value.trim()) filledFields++;
        if (entry.querySelector('[name="company"]')?.value.trim()) filledFields++;
    });

    // Check education
    if (document.getElementById('degree')?.value.trim()) filledFields++;
    if (document.getElementById('university')?.value.trim()) filledFields++;

    // Check skills
    if (skillsArray.length > 0) filledFields++;

    const progress = Math.min((filledFields / totalFields) * 100, 100);
    document.querySelector('.progress-bar-fill').style.width = `${progress}%`;

    // Update the section completion counter (keep top label as "Profile Completion")
    const totalSections = 8;
    let sectionsCompleted = 0;

        if (document.getElementById('firstName')?.value.trim() || document.getElementById('email')?.value.trim()) sectionsCompleted++;
    if (document.getElementById('summary')?.value.trim()) sectionsCompleted++;
    if (skillsArray.length > 0) sectionsCompleted++;
    if (document.getElementById('degree')?.value.trim() || document.getElementById('university')?.value.trim()) sectionsCompleted++;
    if (Array.from(expEntries).some(entry => entry.querySelector('[name="jobTitle"]')?.value.trim() || entry.querySelector('[name="company"]')?.value.trim())) sectionsCompleted++;
    if (Array.from(document.querySelectorAll('#projectEntries .entry-block')).some(entry => entry.querySelector('[name="projectTitle"]')?.value.trim())) sectionsCompleted++;
    if (Array.from(document.querySelectorAll('#certEntries .entry-block')).some(entry => entry.querySelector('[name="certName"]')?.value.trim())) sectionsCompleted++;
    if (Array.from(document.querySelectorAll('#awardEntries .entry-block')).some(entry => entry.querySelector('[name="awardTitle"]')?.value.trim())) sectionsCompleted++;

    const progressTextEl = document.getElementById('progressText');
    if (progressTextEl) {
        progressTextEl.textContent = `${sectionsCompleted} / ${totalSections} sections`;
    }
}

// ATS score calculation
function calcATS() {
    let score = 0;
    const maxScore = 100;

    // Keywords and phrases that ATS systems look for
    const keywords = [
        'experience', 'skills', 'education', 'projects', 'leadership',
        'team', 'collaboration', 'results', 'achievements', 'quantifiable'
    ];

    // Aggregate content from all sources
    let contentParts = [
        document.getElementById('summary')?.value || '',
        document.getElementById('eduDescription')?.value || '',
        skillsArray.join(' ')
    ];
    
    // Add descriptions from multi-entry blocks
    document.querySelectorAll('#experienceEntries [name="expDescription"]').forEach(el => {
        contentParts.push(el.value || '');
    });
    
    document.querySelectorAll('#projectEntries [name="projectDescription"]').forEach(el => {
        contentParts.push(el.value || '');
    });
    
    const content = contentParts.join(' ').toLowerCase();

    // Check for keyword presence
    keywords.forEach(keyword => {
        if (content.includes(keyword)) score += 5;
    });

    // Length checks
    if (document.getElementById('summary')?.value.length > 100) score += 10;
    if (skillsArray.length >= 5) score += 10;
    
    // Check if there are experience descriptions with length > 200
    let hasLongExpDesc = false;
    document.querySelectorAll('#experienceEntries [name="expDescription"]').forEach(el => {
        if (el.value.length > 200) hasLongExpDesc = true;
    });
    if (hasLongExpDesc) score += 10;

    // Contact info completeness
    const contactFields = ['email', 'phone', 'linkedin'];
    const filledContacts = contactFields.filter(id => document.getElementById(id)?.value.trim()).length;
    score += filledContacts * 5;

    // Education completeness
    if (document.getElementById('degree')?.value && document.getElementById('university')?.value) {
        score += 10;
    }

    score = Math.min(score, maxScore);
    document.querySelector('.ats-fill').style.width = `${score}%`;

    // Update the specific parts of the ATS bar without overwriting the structure
    const atsScoreText = document.getElementById('atsScoreText');
    const atsHint = document.getElementById('atsHint');
    if (atsScoreText) atsScoreText.textContent = `${score}%`;
    if (atsHint) atsHint.textContent = 'Higher scores improve job matching';

    // Ensure ATS bar is visible once we have calculated a score
    const atsBar = document.getElementById('atsBar');
    if (atsBar) atsBar.style.display = 'flex';
}

// ── LOCAL STORAGE ──

// Save form data
function saveFormData() {
    const formData = {
        firstName: document.getElementById('firstName')?.value || '',
        lastName: document.getElementById('lastName')?.value || '',
        professionalTitle: document.getElementById('professionalTitle')?.value || '',
        location: document.getElementById('location')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        email: document.getElementById('email')?.value || '',
        linkedin: document.getElementById('linkedin')?.value || '',
        portfolio: document.getElementById('portfolio')?.value || '',
        summary: document.getElementById('summary')?.value || '',
        skills: skillsArray,
        degree: document.getElementById('degree')?.value || '',
        university: document.getElementById('university')?.value || '',
        eduLocation: document.getElementById('eduLocation')?.value || '',
        eduYears: document.getElementById('eduYears')?.value || '',
        eduDescription: document.getElementById('eduDescription')?.value || '',
        language: document.getElementById('language')?.value || '',
        proficiency: document.getElementById('proficiency')?.value || '',
        hobbies: document.getElementById('hobbies')?.value || '',
        
        // Save multi-entry blocks as arrays
        experience: [],
        projects: [],
        certifications: [],
        awards: [],
        
        selectedTemplate: localStorage.getItem('selectedTemplate') || 'modern',
        previewTheme: localStorage.getItem('previewTheme') || 'light'
    };
    
    // Extract experience entries
    document.querySelectorAll('#experienceEntries .entry-block').forEach(entry => {
        formData.experience.push({
            jobTitle: entry.querySelector('[name="jobTitle"]')?.value || '',
            company: entry.querySelector('[name="company"]')?.value || '',
            expLocation: entry.querySelector('[name="expLocation"]')?.value || '',
            expDuration: entry.querySelector('[name="expDuration"]')?.value || '',
            expDescription: entry.querySelector('[name="expDescription"]')?.value || ''
        });
    });
    
    // Extract project entries
    document.querySelectorAll('#projectEntries .entry-block').forEach(entry => {
        formData.projects.push({
            projectTitle: entry.querySelector('[name="projectTitle"]')?.value || '',
            technologies: entry.querySelector('[name="technologies"]')?.value || '',
            projectDescription: entry.querySelector('[name="projectDescription"]')?.value || '',
            projectLink: entry.querySelector('[name="projectLink"]')?.value || ''
        });
    });
    
    // Extract certification entries
    document.querySelectorAll('#certEntries .entry-block').forEach(entry => {
        formData.certifications.push({
            certName: entry.querySelector('[name="certName"]')?.value || '',
            certIssuer: entry.querySelector('[name="certIssuer"]')?.value || '',
            certYear: entry.querySelector('[name="certYear"]')?.value || ''
        });
    });
    
    // Extract award entries
    document.querySelectorAll('#awardEntries .entry-block').forEach(entry => {
        formData.awards.push({
            awardTitle: entry.querySelector('[name="awardTitle"]')?.value || '',
            awardYear: entry.querySelector('[name="awardYear"]')?.value || '',
            awardDesc: entry.querySelector('[name="awardDesc"]')?.value || ''
        });
    });

    localStorage.setItem('resumeFormData', JSON.stringify(formData));
}

// Load form data
function loadFormData() {
    const saved = localStorage.getItem('resumeFormData');
    if (!saved) return;

    try {
        const formData = JSON.parse(saved);

        // Load basic fields
        const basicFields = ['firstName', 'lastName', 'professionalTitle', 'location', 'phone', 'email', 'linkedin', 
                           'portfolio', 'summary', 'degree', 'university', 'eduLocation', 'eduYears',
                           'eduDescription', 'language', 'proficiency', 'hobbies'];
        basicFields.forEach(key => {
            if (document.getElementById(key)) {
                document.getElementById(key).value = formData[key] || '';
            }
        });
        
        // Load skills
        if (formData.skills) {
            skillsArray = formData.skills || [];
            renderSkillTags();
            document.getElementById('skills').value = skillsArray.join(', ');
        }

        // Load multi-entry data
        // Experience
        if (formData.experience && formData.experience.length > 0) {
            const expContainer = document.getElementById('experienceEntries');
            const firstEntry = expContainer.querySelector('.entry-block');
            if (firstEntry) {
                // Clear first entry and populate with saved data
                formData.experience.forEach((exp, idx) => {
                    let entryBlock;
                    if (idx === 0) {
                        entryBlock = firstEntry;
                    } else {
                        entryBlock = firstEntry.cloneNode(true);
                        expContainer.appendChild(entryBlock);
                    }
                    entryBlock.querySelector('[name="jobTitle"]').value = exp.jobTitle || '';
                    entryBlock.querySelector('[name="company"]').value = exp.company || '';
                    entryBlock.querySelector('[name="expLocation"]').value = exp.expLocation || '';
                    entryBlock.querySelector('[name="expDuration"]').value = exp.expDuration || '';
                    entryBlock.querySelector('[name="expDescription"]').value = exp.expDescription || '';

                    // Ensure remove button works and inputs auto-save
                    attachRemoveHandler(entryBlock, expContainer);
                    attachAutoSaveListeners(entryBlock);
                });
            }
        }
        
        // Projects
        if (formData.projects && formData.projects.length > 0) {
            const projContainer = document.getElementById('projectEntries');
            const firstEntry = projContainer.querySelector('.entry-block');
            if (firstEntry) {
                formData.projects.forEach((proj, idx) => {
                    let entryBlock;
                    if (idx === 0) {
                        entryBlock = firstEntry;
                    } else {
                        entryBlock = firstEntry.cloneNode(true);
                        projContainer.appendChild(entryBlock);
                    }
                    entryBlock.querySelector('[name="projectTitle"]').value = proj.projectTitle || '';
                    entryBlock.querySelector('[name="technologies"]').value = proj.technologies || '';
                    entryBlock.querySelector('[name="projectDescription"]').value = proj.projectDescription || '';
                    entryBlock.querySelector('[name="projectLink"]').value = proj.projectLink || '';

                    // Ensure remove button and auto-save wiring
                    attachRemoveHandler(entryBlock, projContainer);
                    attachAutoSaveListeners(entryBlock);
                });
            }
        }

        // Certifications
        if (formData.certifications && formData.certifications.length > 0) {
            const certContainer = document.getElementById('certEntries');
            const firstEntry = certContainer.querySelector('.entry-block');
            if (firstEntry) {
                formData.certifications.forEach((cert, idx) => {
                    let entryBlock;
                    if (idx === 0) {
                        entryBlock = firstEntry;
                    } else {
                        entryBlock = firstEntry.cloneNode(true);
                        certContainer.appendChild(entryBlock);
                    }
                    entryBlock.querySelector('[name="certName"]').value = cert.certName || '';
                    entryBlock.querySelector('[name="certIssuer"]').value = cert.certIssuer || '';
                    entryBlock.querySelector('[name="certYear"]').value = cert.certYear || '';

                    // Ensure remove button and auto-save wiring
                    attachRemoveHandler(entryBlock, certContainer);
                    attachAutoSaveListeners(entryBlock);
                });
            }
        }

        // Awards
        if (formData.awards && formData.awards.length > 0) {
            const awardContainer = document.getElementById('awardEntries');
            const firstEntry = awardContainer.querySelector('.entry-block');
            if (firstEntry) {
                formData.awards.forEach((award, idx) => {
                    let entryBlock;
                    if (idx === 0) {
                        entryBlock = firstEntry;
                    } else {
                        entryBlock = firstEntry.cloneNode(true);
                        awardContainer.appendChild(entryBlock);
                    }
                    entryBlock.querySelector('[name="awardTitle"]').value = award.awardTitle || '';
                    entryBlock.querySelector('[name="awardYear"]').value = award.awardYear || '';
                    entryBlock.querySelector('[name="awardDesc"]').value = award.awardDesc || '';

                    // Ensure remove button and auto-save wiring
                    attachRemoveHandler(entryBlock, awardContainer);
                    attachAutoSaveListeners(entryBlock);
                });
            }
        }

        // Load template and theme
        if (formData.selectedTemplate) {
            setTemplate(formData.selectedTemplate);
        }
        if (formData.previewTheme === 'dark') {
            togglePreviewTheme();
        }

        // Load photo
        const photo = localStorage.getItem('resumePhoto');
        if (photo) {
            document.getElementById('photoPreview').src = photo;
            document.getElementById('photoPreview').style.display = 'block';
            document.getElementById('photoPlaceholder').style.display = 'none';
        }

        updateProgress();
        calcATS();
        updateThemeToggleIcon();
    } catch (e) {
        console.error('Error loading saved data:', e);
    }
}

// ── ENHANCED BUILD RESUME (MULTIPLE ENTRIES) ──
function buildResume() {
    try {
        if (!validateForm()) {
            showToast('Please fix the errors before generating', 'error');
            return;
        }

        const get = id => sanitize(document.getElementById(id)?.value?.trim() || '');

        const firstName = get('firstName');
        const lastName = get('lastName');
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        const title = get('professionalTitle');
        const location = get('location');
        const phone = get('phone');
        const email = get('email');
        const linkedin = get('linkedin');
        const portfolio = get('portfolio');
        const summary = get('summary');
        const skills = get('skills');
        const hobbies = get('hobbies');

        // Contact chips
        const chips = [
            location && `<span class="contact-chip">📍 ${location}</span>`,
            phone && `<span class="contact-chip">📞 ${phone}</span>`,
            email && `<span class="contact-chip">✉️ ${email}</span>`,
            linkedin && `<span class="contact-chip">🔗 <a href="https://${linkedin}" target="_blank">LinkedIn</a></span>`,
            portfolio && `<span class="contact-chip">💻 <a href="https://${portfolio}" target="_blank">Portfolio</a></span>`,
        ].filter(Boolean).join('');

        // Skills pills
        const skillPills = skillsArray.length > 0
            ? skillsArray.map(s => `<span class="skill-pill">${sanitize(s)}</span>`).join('')
            : '';

        // Languages
        let languagesHTML = '';
        const language = get('language');
        if (language) {
            const langs = language.split(',');
            const profs = document.getElementById('proficiency')?.value?.split(',') || [];
            const langItems = langs.map((l, i) => `
                <div class="lang-item">
                    <span class="lang-name">${sanitize(l.trim())}</span>
                    ${profs[i] ? `<span class="lang-level">${sanitize(profs[i].trim())}</span>` : ''}
                </div>`).join('');
            languagesHTML = `
                <div class="resume-section">
                    <div class="resume-section-title">Languages</div>
                    ${langItems}
                </div>`;
        }

        // Left column
        let leftCol = '';

        // Profile photo
        const photoSrc = localStorage.getItem('resumePhoto');
        if (photoSrc) {
            leftCol += `<img src="${photoSrc}" alt="Profile Photo" style="width:120px;height:120px;border-radius:8px;margin-bottom:1rem;object-fit:cover;">`;
        }

        if (skillPills) {
            leftCol += `
                <div class="resume-section">
                    <div class="resume-section-title">Skills</div>
                    <div>${skillPills}</div>
                </div>`;
        }

        leftCol += languagesHTML;

        if (hobbies) {
            leftCol += `
                <div class="resume-section">
                    <div class="resume-section-title">Interests</div>
                    <p>${sanitize(hobbies)}</p>
                </div>`;
        }

        // Right column
        let rightCol = '';

        if (summary) {
            rightCol += `
                <div class="resume-section">
                    <div class="resume-section-title">Professional Summary</div>
                    <p>${sanitize(summary).replace(/\n/g, '<br>')}</p>
                </div>`;
        }

        // Experience entries
        const expEntries = document.querySelectorAll('#experienceEntries .entry-block');
        if (expEntries.length > 0) {
            let expHTML = '';
            expEntries.forEach(entry => {
                const jobTitle = sanitize(entry.querySelector('[name="jobTitle"]')?.value || '');
                const company = sanitize(entry.querySelector('[name="company"]')?.value || '');
                const expLocation = sanitize(entry.querySelector('[name="expLocation"]')?.value || '');
                const expDuration = sanitize(entry.querySelector('[name="expDuration"]')?.value || '');
                const expDesc = sanitize(entry.querySelector('[name="expDescription"]')?.value || '');

                if (jobTitle || company) {
                    expHTML += `
                        <div class="resume-item">
                            <div class="item-title">${jobTitle || 'Job Title'}</div>
                            <div class="item-subtitle">${company || ''}${expLocation ? ' · ' + expLocation : ''}</div>
                            ${expDuration ? `<div class="item-meta">${expDuration}</div>` : ''}
                            ${expDesc ? `<div class="item-desc">${expDesc.replace(/\n/g, '<br>')}</div>` : ''}
                        </div>`;
                }
            });

            if (expHTML) {
                rightCol += `
                    <div class="resume-section">
                        <div class="resume-section-title">Experience</div>
                        ${expHTML}
                    </div>`;
            }
        }

        // Education
        const degree = get('degree');
        const university = get('university');
        const eduLocation = get('eduLocation');
        const eduYears = get('eduYears');
        const eduDesc = get('eduDescription');

        if (degree || university) {
            rightCol += `
                <div class="resume-section">
                    <div class="resume-section-title">Education</div>
                    <div class="resume-item">
                        <div class="item-title">${degree || 'Degree'}</div>
                        <div class="item-subtitle">${university || ''}${eduLocation ? ' · ' + eduLocation : ''}</div>
                        ${eduYears ? `<div class="item-meta">${eduYears}</div>` : ''}
                        ${eduDesc ? `<div class="item-desc">${eduDesc.replace(/\n/g, '<br>')}</div>` : ''}
                    </div>
                </div>`;
        }

        // Projects
        const projectEntries = document.querySelectorAll('#projectEntries .entry-block');
        if (projectEntries.length > 0) {
            let projHTML = '';
            projectEntries.forEach(entry => {
                const projectTitle = sanitize(entry.querySelector('[name="projectTitle"]')?.value || '');
                const technologies = sanitize(entry.querySelector('[name="technologies"]')?.value || '');
                const projectDesc = sanitize(entry.querySelector('[name="projectDescription"]')?.value || '');
                const projectLink = sanitize(entry.querySelector('[name="projectLink"]')?.value || '');

                if (projectTitle) {
                    projHTML += `
                        <div class="resume-item">
                            <div class="item-title">${projectTitle}</div>
                            ${technologies ? `<div class="item-subtitle">${technologies}</div>` : ''}
                            ${projectDesc ? `<div class="item-desc">${projectDesc.replace(/\n/g, '<br>')}</div>` : ''}
                            ${projectLink ? `<a class="project-link-btn" href="https://${projectLink}" target="_blank">🔗 View Project</a>` : ''}
                        </div>`;
                }
            });

            if (projHTML) {
                rightCol += `
                    <div class="resume-section">
                        <div class="resume-section-title">Projects</div>
                        ${projHTML}
                    </div>`;
            }
        }

        // Certifications
        const certEntries = document.querySelectorAll('#certEntries .entry-block');
        if (certEntries.length > 0) {
            let certHTML = '';
            certEntries.forEach(entry => {
                const certName = sanitize(entry.querySelector('[name="certName"]')?.value || '');
                const certIssuer = sanitize(entry.querySelector('[name="certIssuer"]')?.value || '');
                const certDate = sanitize(entry.querySelector('[name="certYear"]')?.value || '');
                const certDesc = '';

                if (certName) {
                    certHTML += `
                        <div class="resume-item">
                            <div class="item-title">${certName}</div>
                            <div class="item-subtitle">${certIssuer || ''}${certDate ? ' · ' + certDate : ''}</div>
                            ${certDesc ? `<div class="item-desc">${certDesc.replace(/\n/g, '<br>')}</div>` : ''}
                        </div>`;
                }
            });

            if (certHTML) {
                rightCol += `
                    <div class="resume-section">
                        <div class="resume-section-title">Certifications</div>
                        ${certHTML}
                    </div>`;
            }
        }

        // Awards
        const awardEntries = document.querySelectorAll('#awardEntries .entry-block');
        if (awardEntries.length > 0) {
            let awardHTML = '';
            awardEntries.forEach(entry => {
                const awardName = sanitize(entry.querySelector('[name="awardTitle"]')?.value || '');
                const awardIssuer = '';
                const awardDate = sanitize(entry.querySelector('[name="awardYear"]')?.value || '');
                const awardDesc = sanitize(entry.querySelector('[name="awardDesc"]')?.value || '');

                if (awardName) {
                    awardHTML += `
                        <div class="resume-item">
                            <div class="item-title">${awardName}</div>
                            <div class="item-subtitle">${awardIssuer || ''}${awardDate ? ' · ' + awardDate : ''}</div>
                            ${awardDesc ? `<div class="item-desc">${awardDesc.replace(/\n/g, '<br>')}</div>` : ''}
                        </div>`;
                }
            });

            if (awardHTML) {
                rightCol += `
                    <div class="resume-section">
                        <div class="resume-section-title">Awards & Honors</div>
                        ${awardHTML}
                    </div>`;
            }
        }

        // Update preview
        document.getElementById('resumePreview').innerHTML = `
            <div class="resume-top-bar">
                <div class="resume-name">${fullName || 'Your Name'}</div>
                ${title ? `<div class="resume-title">${title}</div>` : ''}
                ${chips ? `<div class="resume-contact">${chips}</div>` : ''}
            </div>
            <div class="resume-body">
                <div class="resume-left-col">${leftCol || '<p style="color:#94a3b8;font-size:0.85rem">Add skills, languages & interests</p>'}</div>
                <div class="resume-right-col">${rightCol || '<p style="color:#94a3b8;font-size:0.85rem">Add your experience, education & projects</p>'}</div>
            </div>
        `;

        // Save data and update metrics
        saveFormData();
        updateProgress();
        calcATS();
        showToast('Resume generated successfully!', 'success');

    } catch (error) {
        console.error('Error building resume:', error);
        showToast('Error generating resume. Please try again.', 'error');
    }
}

// ── INITIALIZATION ──

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Load saved form data
    loadFormData();

    // Ensure remove buttons are wired up for any pre-existing entry blocks
    ['experienceEntries', 'projectEntries', 'certEntries', 'awardEntries'].forEach(setupRemoveButtons);

    // Close skill suggestion dropdown when user clicks outside of it
    document.addEventListener('click', (event) => {
        const suggestions = document.getElementById('skillSuggestions');
        const input = document.getElementById('professionalTitle');
        if (!suggestions || !input) return;
        if (!suggestions.contains(event.target) && event.target !== input) {
            suggestions.classList.remove('show');
        }
    });
    
    // Expand all sections by default
    document.querySelectorAll('.section-title').forEach(title => {
        const section = title.closest('.form-section');
        const body = section.querySelector('.section-body');
        if (body) {
            body.classList.add('expanded');
            const chevron = section.querySelector('.chevron');
            if (chevron) chevron.classList.add('rotated');
        }
    });

    // Create debounced auto-save function
    debouncedAutoSave = debounce(triggerAutoSave, 800); // Wait 800ms after last input before saving

    // Auto-save on input changes with debounce (includes dynamically added fields)
    attachAutoSaveListeners(document);

    // Word counter wired via oninput="updateWordCount(this)" in HTML — no extra listener needed

    // Photo upload
    document.getElementById('photoInput')?.addEventListener('change', handlePhoto);

    // Skill suggestions (use correct ID: professionalTitle)
    document.getElementById('professionalTitle')?.addEventListener('input', suggestSkills);

    // Update theme toggle icon based on current preview theme
    updateThemeToggleIcon();

    // Allow double-clicking the preview to reset zoom
    document.getElementById('resumePreview')?.addEventListener('dblclick', resetZoom);
});
