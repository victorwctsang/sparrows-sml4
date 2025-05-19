// Global variables
let isCompactView = false;
let filteredData = [];
let selectedTeams = ["Spike Wazowski"]; // Default to Spike Wazowski
let isFilterCollapsed = false; // Track filter section state
let processedData = []; // Will store the processed CSV data

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadScheduleData();
});

// Load and process schedule data from CSV
async function loadScheduleData() {
    try {
        const response = await fetch('schedule.csv');
        const csvText = await response.text();
        const rows = csvText.split('\n').slice(1); // Skip header row

        processedData = rows
            .filter(row => row.trim()) // Remove empty rows
            .map(row => {
                const [
                    competition,
                    week,
                    time,
                    division,
                    court,
                    team1Name,
                    team2Name,
                    team3Name,
                    endTime,
                    eventTitle,
                    startDate,
                    endDate,
                    calendarUrl
                ] = row.split(',');

                return {
                    competition,
                    week: parseInt(week),
                    time,
                    division,
                    court: parseInt(court),
                    team1: team1Name,
                    team2: team2Name,
                    team3: team3Name,
                    endTime,
                    eventTitle,
                    startDate,
                    endDate,
                    calendarUrl
                };
            });

        filteredData = [...processedData];

        // Initialize the UI after data is loaded
        populateFilters();
        loadFiltersFromCache();

        // If no teams are selected after loading from cache, default to Spike Wazowski
        if (selectedTeams.length === 0) {
            selectedTeams = ["Spike Wazowski"];
            const spikeWazowskiCheckbox = document.querySelector(`input[data-team="Spike Wazowski"]`);
            if (spikeWazowskiCheckbox) {
                spikeWazowskiCheckbox.checked = true;
            }
            document.getElementById('selected-teams-text').textContent = "Spike Wazowski";
        }

        applyFilters();
        updateMatchesCount();

        // Add event listeners
        document.getElementById('division-filter').addEventListener('change', applyFilters);
        document.getElementById('competition-filter').addEventListener('change', applyFilters);
        document.getElementById('week-filter').addEventListener('change', applyFilters);
        document.getElementById('reset-filters').addEventListener('click', resetFilters);
        document.getElementById('toggle-view').addEventListener('click', toggleView);

        // Team dropdown functionality
        const teamDropdownBtn = document.getElementById('team-dropdown-btn');
        const teamDropdown = document.getElementById('team-dropdown');

        teamDropdownBtn.addEventListener('click', () => {
            teamDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!teamDropdownBtn.contains(event.target) && !teamDropdown.contains(event.target)) {
                teamDropdown.classList.add('hidden');
            }
        });

        // Select all teams checkbox
        document.getElementById('select-all-teams').addEventListener('change', (e) => {
            const teamCheckboxes = document.querySelectorAll('#team-options input[type="checkbox"]');
            teamCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
            updateSelectedTeams();
        });

        // Add animation to Mike's eye
        animateEye();

        // Set up filter toggle
        setupFilterToggle();
    } catch (error) {
        console.error('Error loading schedule data:', error);
        // Show error message to user
        const container = document.getElementById('schedule-container');
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="monster-eye mx-auto mb-4" style="width: 60px; height: 60px;">
                    <div class="monster-pupil" style="width: 30px; height: 30px;">
                        <div class="volleyball-pattern"></div>
                        <div class="volleyball-line"></div>
                        <div class="volleyball-line-vertical"></div>
                    </div>
                </div>
                <h3 class="mt-2 text-lg font-medium text-gray-900">Error Loading Schedule</h3>
                <p class="mt-1 text-sm text-gray-500">Unable to load the schedule data. Please try refreshing the page.</p>
            </div>
        `;
    }
}

// Set up collapsible filter section
function setupFilterToggle() {
    const filterToggle = document.getElementById('filter-toggle');
    const filterContent = document.getElementById('filter-content');
    const toggleIcon = document.querySelector('.toggle-filters-btn');

    // Load filter collapse state from localStorage
    isFilterCollapsed = localStorage.getItem('filterCollapsed') === 'true';

    // Apply initial state
    if (isFilterCollapsed) {
        filterContent.classList.remove('expanded');
        filterContent.classList.add('collapsed');
        toggleIcon.classList.add('rotated');
    }

    filterToggle.addEventListener('click', () => {
        isFilterCollapsed = !isFilterCollapsed;

        if (isFilterCollapsed) {
            filterContent.classList.remove('expanded');
            filterContent.classList.add('collapsed');
            toggleIcon.classList.add('rotated');
        } else {
            filterContent.classList.remove('collapsed');
            filterContent.classList.add('expanded');
            toggleIcon.classList.remove('rotated');
        }

        // Save state to localStorage
        localStorage.setItem('filterCollapsed', isFilterCollapsed);
    });
}

// Animate Mike's eye to follow cursor
function animateEye() {
    const pupil = document.querySelector('.monster-pupil');
    const eye = document.querySelector('.monster-eye');

    document.addEventListener('mousemove', (e) => {
        const eyeRect = eye.getBoundingClientRect();
        const eyeCenterX = eyeRect.left + eyeRect.width / 2;
        const eyeCenterY = eyeRect.top + eyeRect.height / 2;

        // Calculate distance from cursor to eye center
        const dx = e.clientX - eyeCenterX;
        const dy = e.clientY - eyeCenterY;

        // Limit movement to stay within the eye
        const maxMove = 15;
        const angle = Math.atan2(dy, dx);
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, maxMove);

        const moveX = Math.cos(angle) * distance;
        const moveY = Math.sin(angle) * distance;

        pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
}

// Populate filter dropdowns
function populateFilters() {
    // Get unique values for each filter
    const teams = [...new Set(processedData.flatMap(match => [match.team1, match.team2, match.team3]))].sort().reverse();
    const divisions = [...new Set(processedData.map(item => item.division))].sort();
    const competitions = [...new Set(processedData.map(item => item.competition))].sort();
    const weeks = [...new Set(processedData.map(item => item.week))].sort((a, b) => a - b);

    // Populate team filter with checkboxes
    const teamOptions = document.getElementById('team-options');
    teams.forEach(team => {
        const checkboxItem = document.createElement('label');
        checkboxItem.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = team;
        checkbox.dataset.team = team;
        checkbox.addEventListener('change', updateSelectedTeams);

        // Set Spike Wazowski as checked by default
        if (team === "Spike Wazowski") {
            checkbox.checked = true;
        }

        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(document.createTextNode(team));
        teamOptions.appendChild(checkboxItem);
    });

    // Populate division filter
    const divisionFilter = document.getElementById('division-filter');
    divisions.forEach(division => {
        const option = document.createElement('option');
        option.value = division;
        option.textContent = division;
        divisionFilter.appendChild(option);
    });

    // Populate competition filter
    const competitionFilter = document.getElementById('competition-filter');
    competitions.forEach(competition => {
        const option = document.createElement('option');
        option.value = competition;
        option.textContent = competition;
        competitionFilter.appendChild(option);
    });

    // Populate week filter
    const weekFilter = document.getElementById('week-filter');
    weeks.forEach(week => {
        const option = document.createElement('option');
        option.value = week;
        option.textContent = `Week ${week}`;
        weekFilter.appendChild(option);
    });
}

// Update selected teams display and apply filters
function updateSelectedTeams() {
    const teamCheckboxes = document.querySelectorAll('#team-options input[type="checkbox"]:checked');
    selectedTeams = Array.from(teamCheckboxes).map(checkbox => checkbox.value);

    const selectedTeamsText = document.getElementById('selected-teams-text');
    if (selectedTeams.length === 0) {
        selectedTeamsText.textContent = 'Select Teams';
    } else if (selectedTeams.length === 1) {
        selectedTeamsText.textContent = selectedTeams[0];
    } else {
        selectedTeamsText.textContent = `${selectedTeams.length} teams selected`;
    }

    applyFilters();
    saveFiltersToCache();
}

// Apply filters to the schedule
function applyFilters() {
    const divisionFilter = document.getElementById('division-filter').value;
    const competitionFilter = document.getElementById('competition-filter').value;
    const weekFilter = document.getElementById('week-filter').value;

    filteredData = processedData.filter(match => {
        // Team filter (check if team is playing or on duty)
        const teamMatches = selectedTeams.length === 0 ||
            selectedTeams.includes(match.team1) ||
            selectedTeams.includes(match.team2) ||
            selectedTeams.includes(match.team3);

        // Other filters
        const divisionMatches = !divisionFilter || match.division === divisionFilter;
        const competitionMatches = !competitionFilter || match.competition === competitionFilter;
        const weekMatches = !weekFilter || match.week.toString() === weekFilter;

        return teamMatches && divisionMatches && competitionMatches && weekMatches;
    });

    renderSchedule(filteredData);
    updateMatchesCount();
    saveFiltersToCache();
}

// Reset all filters
function resetFilters() {
    // Reset team checkboxes
    document.querySelectorAll('#team-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = checkbox.dataset.team === "Spike Wazowski"; // Only check Spike Wazowski
    });
    document.getElementById('select-all-teams').checked = false;
    document.getElementById('selected-teams-text').textContent = 'Spike Wazowski';
    selectedTeams = ["Spike Wazowski"];

    // Reset other filters
    document.getElementById('division-filter').value = '';
    document.getElementById('competition-filter').value = '';
    document.getElementById('week-filter').value = '';

    applyFilters();

    // Clear cache
    localStorage.removeItem('volleyballFilters');
}

// Toggle between compact and detailed view
function toggleView() {
    isCompactView = !isCompactView;
    const toggleButton = document.getElementById('toggle-view');
    toggleButton.textContent = `Toggle View: ${isCompactView ? 'Detailed' : 'Compact'}`;
    renderSchedule(filteredData);
    saveFiltersToCache();
}

// Update the matches count display
function updateMatchesCount() {
    const countElement = document.getElementById('matches-count');
    countElement.textContent = `Showing ${filteredData.length} of ${processedData.length} matches`;
}

// Save filters to localStorage
function saveFiltersToCache() {
    const filters = {
        selectedTeams,
        division: document.getElementById('division-filter').value,
        competition: document.getElementById('competition-filter').value,
        week: document.getElementById('week-filter').value,
        isCompactView,
        isFilterCollapsed
    };

    localStorage.setItem('volleyballFilters', JSON.stringify(filters));
}

// Load filters from localStorage
function loadFiltersFromCache() {
    const savedFilters = localStorage.getItem('volleyballFilters');
    if (savedFilters) {
        const filters = JSON.parse(savedFilters);

        // Restore team selections
        if (filters.selectedTeams && filters.selectedTeams.length > 0) {
            selectedTeams = filters.selectedTeams;
            document.querySelectorAll('#team-options input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = selectedTeams.includes(checkbox.value);
            });

            const selectedTeamsText = document.getElementById('selected-teams-text');
            if (selectedTeams.length === 1) {
                selectedTeamsText.textContent = selectedTeams[0];
            } else {
                selectedTeamsText.textContent = `${selectedTeams.length} teams selected`;
            }
        }

        // Restore other filters
        if (filters.division) document.getElementById('division-filter').value = filters.division;
        if (filters.competition) document.getElementById('competition-filter').value = filters.competition;
        if (filters.week) document.getElementById('week-filter').value = filters.week;

        // Restore view mode
        if (filters.isCompactView !== undefined) {
            isCompactView = filters.isCompactView;
            const toggleButton = document.getElementById('toggle-view');
            toggleButton.textContent = `Toggle View: ${isCompactView ? 'Detailed' : 'Compact'}`;
        }

        // Restore filter collapse state
        if (filters.isFilterCollapsed !== undefined) {
            isFilterCollapsed = filters.isFilterCollapsed;
        }
    }
}

// Render the schedule based on current filters and view mode
function renderSchedule(data) {
    const container = document.getElementById('schedule-container');
    container.innerHTML = '';

    if (data.length === 0) {
        const noMatches = document.createElement('div');
        noMatches.className = 'col-span-full text-center py-8';
        noMatches.innerHTML = `
            <div class="monster-eye mx-auto mb-4" style="width: 60px; height: 60px;">
                <div class="monster-pupil" style="width: 30px; height: 30px;">
                    <div class="volleyball-pattern"></div>
                    <div class="volleyball-line"></div>
                    <div class="volleyball-line-vertical"></div>
                </div>
            </div>
            <h3 class="mt-2 text-lg font-medium text-gray-900">No matches found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your filters to find matches.</p>
        `;
        container.appendChild(noMatches);
        return;
    }

    // Sort data by week, then by time
    data.sort((a, b) => {
        if (a.week !== b.week) return a.week - b.week;

        // Convert time to 24-hour format for comparison
        const timeA = convertTo24Hour(a.time);
        const timeB = convertTo24Hour(b.time);
        return timeA.localeCompare(timeB);
    });

    // Group by week
    const weekGroups = {};
    data.forEach(match => {
        if (!weekGroups[match.week]) {
            weekGroups[match.week] = [];
        }
        weekGroups[match.week].push(match);
    });

    // Render based on view mode
    if (isCompactView) {
        // Compact view - individual cards for each match
        data.forEach(match => {
            const card = document.createElement('div');
            card.className = 'schedule-card bg-white rounded-lg shadow-md overflow-hidden';

            // Determine team classes based on whether they're selected
            const team1Class = selectedTeams.includes(match.team1) ? 'team-pill team-highlighted' : 'team-pill team-playing';
            const team2Class = selectedTeams.includes(match.team2) ? 'team-pill team-highlighted' : 'team-pill team-playing';
            const team3Class = selectedTeams.includes(match.team3) ? 'team-pill team-highlighted' : 'team-pill team-duty';

            // Create a volleyball icon for the court number
            const courtIcon = `
                <div class="bg-white text-green-700 rounded-full w-16 h-16 flex items-center justify-center font-bold relative">
                    <div class="text-center">
                        <div class="text-xs">Court</div>
                        <div>${match.court}</div>
                    </div>
                    <div class="absolute inset-0 border-2 border-green-700 rounded-full" style="border-style: dashed;"></div>
                </div>
            `;

            card.innerHTML = `
                <div class="bg-green-600 text-white px-4 py-3 flex justify-between items-center">
                    <div>
                        <h3 class="font-semibold">${match.competition} - Week ${match.week} (${formatDate(match.startDate)})</h3>
                        <p class="text-sm text-green-100">${match.time} - Division ${match.division}</p>
                    </div>
                    ${courtIcon}
                </div>
                <div class="p-4">
                    <div class="mb-3">
                        <h4 class="text-sm font-medium text-gray-500 mb-2">Playing Teams:</h4>
                        <div class="flex flex-wrap">
                            <span class="${team1Class}">${match.team1}</span>
                            <span class="${team2Class}">${match.team2}</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h4 class="text-sm font-medium text-gray-500 mb-2">Duty Team:</h4>
                        <span class="${team3Class}">${match.team3} (Duty)</span>
                    </div>
                    ${match.calendarUrl ? `
                    <div class="mt-4">
                        <a href="${match.calendarUrl}" target="_blank" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
                            </svg>
                            Add to Google Calendar
                        </a>
                    </div>
                    ` : ''}
                </div>
            `;

            container.appendChild(card);
        });
    } else {
        // Detailed view - one card per week
        Object.keys(weekGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(week => {
            const weekCard = document.createElement('div');
            weekCard.className = 'schedule-card bg-white rounded-lg shadow-md overflow-hidden col-span-full';

            const weekHeader = document.createElement('div');
            weekHeader.className = 'bg-green-600 text-white px-4 py-3';
            weekHeader.innerHTML = `
                <h3 class="text-lg font-semibold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                    </svg>
                    Week ${week} (${formatDate(weekGroups[week][0].startDate)})
                </h3>
            `;
            weekCard.appendChild(weekHeader);

            const matchesTable = document.createElement('div');
            matchesTable.className = 'overflow-x-auto';
            matchesTable.innerHTML = `
                <div class="divide-y divide-gray-200">
                    ${weekGroups[week].map(match => {
                            // Check if any selected teams are in this match
                            const hasSelectedTeam = selectedTeams.length > 0 && (
                                selectedTeams.includes(match.team1) ||
                                selectedTeams.includes(match.team2) ||
                                selectedTeams.includes(match.team3)
                            );

                            // Apply highlighting if needed
                            const rowClass = hasSelectedTeam ? 'bg-green-50' : '';

                            // Determine team classes based on whether they're selected
                            const team1Class = selectedTeams.includes(match.team1) ? 'team-pill team-highlighted' : 'team-pill team-playing';
                            const team2Class = selectedTeams.includes(match.team2) ? 'team-pill team-highlighted' : 'team-pill team-playing';
                            const team3Class = selectedTeams.includes(match.team3) ? 'team-pill team-highlighted' : 'team-pill team-duty';

                            return `
                                <div class="${rowClass} p-4">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="md:col-span-1">
                                            <div class="text-xs font-medium uppercase tracking-wider">Competition: ${match.competition} (${match.division})</div>
                                            <div class="text-xs font-medium uppercase tracking-wider">Time: ${match.time}</div>
                                            <div class="text-xs font-medium uppercase tracking-wider">Court: ${match.court}</div>
                                        </div>
                                        <div class="md:col-span-1">
                                            <div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</div>
                                            <div class="mt-1 flex flex-wrap gap-2">
                                                <span class="${team1Class}">${match.team1}</span>
                                                <span class="${team2Class}">${match.team2}</span>
                                                <span class="${team3Class}">${match.team3} (Duty)</span>
                                            </div>
                                            ${match.calendarUrl ? `
                                            <div class="mt-3">
                                                <a href="${match.calendarUrl}" target="_blank" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                                    <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
                                                    </svg>
                                                    Add to Google Calendar
                                                </a>
                                            </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>
            `;
            weekCard.appendChild(matchesTable);
            container.appendChild(weekCard);
        });
    }
}

// Helper function to convert time to 24-hour format for sorting
function convertTo24Hour(timeStr) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier === 'pm') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${hours}:${minutes}`;
}

// Helper function to format date from ISO string
function formatDate(isoString) {
    if (!isoString) return '';

    // Parse the YYYYMMDDTHHMMSS format
    const year = isoString.substring(0, 4);
    const month = isoString.substring(4, 6);
    const day = isoString.substring(6, 8);
    const hours = isoString.substring(9, 11);
    const minutes = isoString.substring(11, 13);
    const seconds = isoString.substring(13, 15);

    // Create date object with the parsed components
    const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);

    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}
