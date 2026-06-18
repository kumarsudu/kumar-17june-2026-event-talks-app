// BQ Release Notes Hub JavaScript

// Application State
let updatesState = [];
let filteredUpdates = [];
let currentFilter = 'all';
let currentSearch = '';
let selectedUpdate = null;

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const lastFetchedText = document.getElementById('last-fetched-text');
const notesGrid = document.getElementById('notes-grid');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const retryBtn = document.getElementById('retry-btn');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const filterChips = document.querySelectorAll('.chip');
const exportCsvBtn = document.getElementById('export-csv-btn');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelTweetBtn = document.getElementById('cancel-tweet');
const sendTweetBtn = document.getElementById('send-tweet');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCountSpan = document.getElementById('char-count');
const modalBadge = document.getElementById('modal-badge');
const modalDate = document.getElementById('modal-date');
const modalUpdateText = document.getElementById('modal-update-text');

// Stats Counters
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statAnnouncements = document.getElementById('stat-announcements');
const statBreaking = document.getElementById('stat-breaking');
const statCards = document.querySelectorAll('.stat-card');

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    fetchReleaseNotes(false);
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Theme Toggle Button
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Refresh Button
    refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Retry Button
    retryBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Reset Filters Button
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Search Input
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        toggleClearSearchButton();
        applyFiltersAndSearch();
    });

    // Clear Search Button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        toggleClearSearchButton();
        applyFiltersAndSearch();
        searchInput.focus();
    });

    // Filter Chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-type');
            applyFiltersAndSearch();
        });
    });

    // Stats Cards (acting as filters)
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.getAttribute('data-filter');
            // Find corresponding chip and click it
            const targetChip = Array.from(filterChips).find(chip => chip.getAttribute('data-type') === filterType);
            if (targetChip) {
                targetChip.click();
            } else if (filterType === 'all') {
                filterChips[0].click();
            }
        });
    });

    // Export CSV Button
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }

    // Tweet Modal Close Events
    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    
    // Close modal on outside click
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Textarea character count and validation
    tweetTextarea.addEventListener('input', updateCharCount);

    // Tweet Share Action
    sendTweetBtn.addEventListener('click', publishTweet);
}

// Fetch Notes from Backend
async function fetchReleaseNotes(forceRefresh = false) {
    showLoading();
    setRefreshingIcon(true);
    
    const url = `/api/notes${forceRefresh ? '?refresh=true' : ''}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            updatesState = data.updates;
            lastFetchedText.textContent = `Synced: ${data.last_fetched}`;
            
            // Calculate and display statistics
            calculateStats(updatesState);
            
            // Apply current filters
            applyFiltersAndSearch();
            showContent();
        } else {
            throw new Error(data.error || 'Failed to retrieve release notes.');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        errorMessage.textContent = error.message || 'Could not reach server.';
        showError();
    } finally {
        setRefreshingIcon(false);
    }
}

// Stats Calculation
function calculateStats(updates) {
    const total = updates.length;
    const features = updates.filter(u => u.type.toLowerCase() === 'feature').length;
    const announcements = updates.filter(u => u.type.toLowerCase() === 'announcement').length;
    const breaking = updates.filter(u => 
        u.type.toLowerCase() === 'breaking' || 
        u.type.toLowerCase() === 'deprecation' || 
        u.type.toLowerCase() === 'breaking change'
    ).length;
    
    // Animate stats counter increment
    animateCounter(statTotal, total);
    animateCounter(statFeatures, features);
    animateCounter(statAnnouncements, announcements);
    animateCounter(statBreaking, breaking);
}

function animateCounter(element, target) {
    const duration = 800; // ms
    const startTime = performance.now();
    const startValue = parseInt(element.textContent, 10) || 0;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function outQuad
        const ease = progress * (2 - progress);
        const value = Math.floor(startValue + (target - startValue) * ease);
        
        element.textContent = value;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(update);
}

// Filtering and Searching Logic
function applyFiltersAndSearch() {
    filteredUpdates = updatesState.filter(update => {
        // 1. Filter by category
        const matchesFilter = currentFilter === 'all' || 
            update.type.toLowerCase() === currentFilter.toLowerCase() ||
            (currentFilter === 'Breaking' && (
                update.type.toLowerCase() === 'breaking' || 
                update.type.toLowerCase() === 'deprecation' || 
                update.type.toLowerCase() === 'breaking change'
            ));
            
        // 2. Filter by search query
        const matchesSearch = currentSearch === '' || 
            update.text.toLowerCase().includes(currentSearch) ||
            update.type.toLowerCase().includes(currentSearch) ||
            update.date.toLowerCase().includes(currentSearch);
            
        return matchesFilter && matchesSearch;
    });
    
    renderNotes(filteredUpdates);
}

// Render release notes cards
function renderNotes(notes) {
    notesGrid.innerHTML = '';
    
    if (notes.length === 0) {
        notesGrid.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    notesGrid.style.display = 'grid';
    
    notes.forEach(note => {
        const card = document.createElement('article');
        card.className = 'note-card';
        card.setAttribute('data-id', note.id);
        
        // Determine badge class
        let badgeClass = 'badge-generic';
        const typeLower = note.type.toLowerCase();
        if (typeLower.includes('feature')) badgeClass = 'badge-feature';
        else if (typeLower.includes('announc')) badgeClass = 'badge-announcement';
        else if (typeLower.includes('breaking') || typeLower.includes('deprecat')) badgeClass = 'badge-breaking';
        else if (typeLower.includes('change')) badgeClass = 'badge-change';
        else if (typeLower.includes('issue') || typeLower.includes('fix') || typeLower.includes('resolve')) badgeClass = 'badge-issue';
        
        card.innerHTML = `
            <div class="note-header">
                <div class="note-meta">
                    <span class="badge ${badgeClass}">${note.type}</span>
                    <span class="note-date"><i class="fa-regular fa-calendar"></i> ${note.date}</span>
                </div>
                <div class="note-actions-top">
                    <button class="action-icon-btn copy-note-btn" data-id="${note.id}" title="Copy Update to Clipboard">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <a href="${note.link}" target="_blank" class="action-icon-btn" title="View Source Release Notes" rel="noopener noreferrer">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
            </div>
            
            <div class="note-body">
                ${note.html}
            </div>
            
            <div class="note-footer">
                <a href="${note.link}" target="_blank" class="doc-link" rel="noopener noreferrer">
                    Official Docs <i class="fa-solid fa-angle-right"></i>
                </a>
                <button class="btn btn-tweet share-tweet-btn" data-id="${note.id}">
                    <i class="fa-brands fa-x-twitter"></i> Tweet
                </button>
            </div>
        `;
        
        notesGrid.appendChild(card);
    });
    
    // Add event listeners to the share buttons
    document.querySelectorAll('.share-tweet-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const updateId = btn.getAttribute('data-id');
            const update = updatesState.find(u => u.id === updateId);
            if (update) {
                openTweetModal(update);
            }
        });
    });

    // Add event listeners to the copy buttons
    document.querySelectorAll('.copy-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const updateId = btn.getAttribute('data-id');
            const update = updatesState.find(u => u.id === updateId);
            if (update) {
                copyToClipboard(update, btn);
            }
        });
    });
}

// Reset filters
function resetFilters() {
    searchInput.value = '';
    currentSearch = '';
    toggleClearSearchButton();
    
    filterChips.forEach(c => c.classList.remove('active'));
    filterChips[0].classList.add('active');
    currentFilter = 'all';
    
    applyFiltersAndSearch();
    searchInput.focus();
}

// Toggle Clear Search Button Visibility
function toggleClearSearchButton() {
    if (currentSearch) {
        clearSearchBtn.style.display = 'block';
    } else {
        clearSearchBtn.style.display = 'none';
    }
}

// Helper to update loading spinner state on the refresh button
function setRefreshingIcon(isRefreshing) {
    if (isRefreshing) {
        refreshIcon.classList.add('spinning');
        refreshBtn.disabled = true;
    } else {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

// UI State Switchers
function showLoading() {
    loadingState.style.display = 'flex';
    notesGrid.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
}

function showContent() {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
}

function showError() {
    loadingState.style.display = 'none';
    notesGrid.style.display = 'none';
    emptyState.style.display = 'none';
    errorState.style.display = 'flex';
}

// Tweet Composer Modal Handling
function openTweetModal(update) {
    selectedUpdate = update;
    
    // Pre-fill modal metadata
    modalBadge.className = 'preview-badge';
    let badgeClass = 'badge-generic';
    const typeLower = update.type.toLowerCase();
    if (typeLower.includes('feature')) badgeClass = 'badge-feature';
    else if (typeLower.includes('announc')) badgeClass = 'badge-announcement';
    else if (typeLower.includes('breaking') || typeLower.includes('deprecat')) badgeClass = 'badge-breaking';
    else if (typeLower.includes('change')) badgeClass = 'badge-change';
    else if (typeLower.includes('issue')) badgeClass = 'badge-issue';
    
    modalBadge.classList.add(badgeClass);
    modalBadge.textContent = update.type;
    modalDate.textContent = update.date;
    modalUpdateText.textContent = update.text;
    
    // Formulate a beautiful, concise tweet content
    // Twitter has 280-char limit. A link is counted as 23 characters.
    // We leave 23 chars for link, 1 space, plus a few characters for hashtags/formatting.
    // We target around 245 characters maximum inside the text area to leave room for the link!
    const tweetHeader = `[BigQuery ${update.type}] (${update.date}): `;
    const hashtags = ` #BigQuery #GoogleCloud`;
    
    const availableTextLength = 280 - 23 - 1 - tweetHeader.length - hashtags.length;
    
    let baseText = update.text;
    if (baseText.length > availableTextLength) {
        baseText = baseText.substring(0, availableTextLength - 3) + "...";
    }
    
    const initialTweet = `${tweetHeader}${baseText}${hashtags}`;
    
    tweetTextarea.value = initialTweet;
    updateCharCount();
    
    // Open modal with animation
    tweetModal.style.display = 'flex';
    setTimeout(() => {
        tweetModal.classList.add('open');
    }, 10);
    
    // Auto-focus and place cursor at end
    tweetTextarea.focus();
    tweetTextarea.selectionStart = tweetTextarea.selectionEnd = tweetTextarea.value.length;
}

function closeTweetModal() {
    tweetModal.classList.remove('open');
    setTimeout(() => {
        tweetModal.style.display = 'none';
        selectedUpdate = null;
    }, 300);
}

function updateCharCount() {
    const text = tweetTextarea.value;
    
    // Calculate total characters, accounting for the link that will be appended
    // Standard Twitter links are mapped to 23 characters.
    const linkLength = 23;
    const spaceBetween = 1;
    
    const totalChars = text.length + spaceBetween + linkLength;
    charCountSpan.textContent = totalChars;
    
    // Highlight character count based on limits
    charCountSpan.className = ''; // reset
    if (totalChars > 280) {
        charCountSpan.classList.add('danger');
        sendTweetBtn.disabled = true;
    } else if (totalChars > 260) {
        charCountSpan.classList.add('warning');
        sendTweetBtn.disabled = false;
    } else {
        sendTweetBtn.disabled = false;
    }
}

function publishTweet() {
    if (!selectedUpdate) return;
    
    const tweetText = tweetTextarea.value;
    const docUrl = selectedUpdate.link;
    
    // Combine tweet text and url
    const fullTweet = `${tweetText} ${docUrl}`;
    
    // Construct Twitter Intent URL
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullTweet)}`;
    
    // Open in a new window
    window.open(twitterIntentUrl, '_blank', 'width=550,height=420,toolbar=0,status=0');
    
    // Close modal
    closeTweetModal();
}

// Copy update details to clipboard
function copyToClipboard(update, btn) {
    const textToCopy = `[BigQuery ${update.type}] (${update.date})\n${update.text}\nSource: ${update.link}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Change icon and add copied class
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-check';
        btn.classList.add('copied');
        btn.title = 'Copied!';
        
        // Revert after 1.5 seconds
        setTimeout(() => {
            icon.className = 'fa-regular fa-copy';
            btn.classList.remove('copied');
            btn.title = 'Copy Update to Clipboard';
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Export filtered release notes to CSV file
function exportToCSV() {
    if (filteredUpdates.length === 0) {
        alert('No updates found to export.');
        return;
    }
    
    // CSV headers
    const headers = ['Date', 'Type', 'Link', 'Description'];
    
    // Format rows
    const rows = filteredUpdates.map(update => {
        // Helper to escape double quotes in CSV fields
        const escapeCSVField = (field) => {
            if (field === null || field === undefined) return '';
            const stringified = String(field);
            if (stringified.includes('"') || stringified.includes(',') || stringified.includes('\n') || stringified.includes('\r')) {
                return `"${stringified.replace(/"/g, '""')}"`;
            }
            return stringified;
        };
        
        return [
            escapeCSVField(update.date),
            escapeCSVField(update.type),
            escapeCSVField(update.link),
            escapeCSVField(update.text)
        ];
    });
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Format current date for filename
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_release_notes_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize Active Theme on startup
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-moon';
        }
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-sun';
        }
    }
}

// Toggle Theme between light and dark
function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-moon';
        }
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        if (themeIcon) {
            themeIcon.className = 'fa-solid fa-sun';
        }
        localStorage.setItem('theme', 'dark');
    }
}
