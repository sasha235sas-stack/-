document.addEventListener('DOMContentLoaded', () => {
    const numParticipantsInput = document.getElementById('num-participants');
    const createTableBtn = document.getElementById('create-table-btn');
    const endTournamentBtn = document.getElementById('end-tournament-btn');
    const continueTournamentBtn = document.getElementById('continue-tournament-btn');

    const tableBody = document.querySelector('#tournament-table tbody');
    const totalGoalsSpan = document.getElementById('total-goals-span');

    const legendContainer = document.querySelector('.legend');
    const pedestalContainer = document.getElementById('pedestal-container');
    const pedestalSimple = document.querySelector('.pedestal-simple'); // New selector

    const STORAGE_KEY = 'tournamentTableData';

    // Function to apply rating difference styling
    function applyRatingStyle(row, participantRating, opponentRating) {
        const cells = row.querySelectorAll('td');
        const ratingDiff = participantRating - opponentRating;

        cells.forEach(cell => cell.classList.remove(
            'rating-diff-plus-2',
            'rating-diff-plus-1',
            'rating-diff-0',
            'rating-diff-minus-1',
            'rating-diff-minus-2'
        ));

        if (ratingDiff >= 2) {
            cells.forEach(cell => cell.classList.add('rating-diff-plus-2'));
        } else if (ratingDiff === 1) {
            cells.forEach(cell => cell.classList.add('rating-diff-plus-1'));
        } else if (ratingDiff === 0) {
            cells.forEach(cell => cell.classList.add('rating-diff-0'));
        } else if (ratingDiff === -1) {
            cells.forEach(cell => cell.classList.add('rating-diff-minus-1'));
        } else if (ratingDiff <= -2) {
            cells.forEach(cell => cell.classList.add('rating-diff-minus-2'));
        }
    }

    // Function to highlight top 3 players by goals scored with borders
    function highlightTopPlayers() {
        const rows = tableBody.querySelectorAll('tr');
        const playersData = [];

        rows.forEach(row => {
            row.classList.remove('top-3-player-border-1', 'top-3-player-border-2', 'top-3-player-border-3');
            const goalsScoredInput = row.querySelector('.goals-scored');
            const goalsScored = parseInt(goalsScoredInput.value) || 0;
            playersData.push({ row, goalsScored });
        });

        playersData.sort((a, b) => b.goalsScored - a.goalsScored);

        for (let i = 0; i < Math.min(3, playersData.length); i++) {
            if (playersData[i].goalsScored > 0) {
                playersData[i].row.classList.add(`top-3-player-border-${i + 1}`);
            }
        }
    }

    // Function to highlight player with the least goals
    function highlightLeastGoals() {
        const rows = tableBody.querySelectorAll('tr');
        const playersData = [];

        rows.forEach(row => {
            row.classList.remove('least-goals-border');
            const goalsScoredInput = row.querySelector('.goals-scored');
            const goalsScored = parseInt(goalsScoredInput.value) || 0;
            playersData.push({ row, goalsScored });
        });

        if (playersData.length > 0) {
            playersData.sort((a, b) => a.goalsScored - b.goalsScored);
            const minGoals = playersData[0].goalsScored;

            playersData.forEach(player => {
                if (player.goalsScored === minGoals && minGoals >= 0) {
                    player.row.classList.add('least-goals-border');
                }
            });
        }
    }

    // Function to process and display the top 3 players on the simplified pedestal
    function displayPedestal() {
        const rows = tableBody.querySelectorAll('tr');
        const playersData = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const playerName = cells[1].querySelector('input').value;
            const goalsScored = parseInt(cells[4].querySelector('input').value) || 0;
            const totalGoals = parseInt(cells[5].textContent) || 0; // Use calculated total goals

            playersData.push({
                playerName,
                goalsScored: goalsScored,
                totalGoals: totalGoals,
            });
        });

        // Sort by goals scored first, then total goals as a tie-breaker
        playersData.sort((a, b) => {
            if (b.goalsScored !== a.goalsScored) {
                return b.goalsScored - a.goalsScored;
            }
            return b.totalGoals - a.totalGoals;
        });

        const pedestalStepsSimple = pedestalSimple.querySelectorAll('.pedestal-step-simple');

        pedestalStepsSimple.forEach((step, index) => {
            const playerRankDiv = step.querySelector('.player-rank-simple');
            const playerNameDiv = step.querySelector('.player-name-simple');
            const playerGoalsDiv = step.querySelector('.player-goals-simple');

            if (index < playersData.length) {
                const playerData = playersData[index];
                playerRankDiv.textContent = index + 1; // Rank (1, 2, 3)
                playerNameDiv.textContent = playerData.playerName;
                playerGoalsDiv.textContent = `Голы: ${playerData.goalsScored}`; // Display scored goals
                step.style.display = ''; // Show the step
            } else {
                step.style.display = 'none'; // Hide unused steps
            }
        });

        pedestalContainer.style.display = 'flex'; // Show pedestal
        document.getElementById('tournament-table').style.display = 'none'; // Hide table
        document.getElementById('end-tournament-btn').style.display = 'none'; // Hide end button
        document.getElementById('num-participants').closest('.controls').style.display = 'none'; // Hide controls
        document.querySelector('.total-score').style.display = 'none'; // Hide total score
        legendContainer.style.display = 'none'; // Hide legend
    }

    // Function to reset to the initial state for a new tournament
    function resetTournament() {
        pedestalContainer.style.display = 'none'; // Hide pedestal
        document.getElementById('tournament-table').style.display = ''; // Show table
        document.getElementById('end-tournament-btn').style.display = ''; // Show end tournament button
        document.getElementById('num-participants').closest('.controls').style.display = ''; // Show controls
        document.querySelector('.total-score').style.display = ''; // Show total score
        legendContainer.style.display = ''; // Show legend

        // Clear table and re-initialize
        tableBody.innerHTML = '';
        numParticipantsInput.value = 5; // Reset to default
        createTableRows(parseInt(numParticipantsInput.value));
        updateLegend(); // Re-update legend
        localStorage.removeItem(STORAGE_KEY); // Clear saved data
        localStorage.removeItem('numParticipants');
    }

    // Function to save data to localStorage
    function saveData() {
        const tableData = [];
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const participantRatingInput = cells[2].querySelector('input');
            const opponentRatingInput = cells[3].querySelector('input');
            const goalsScoredInput = cells[4].querySelector('input');

            const rowData = {
                index: cells[0].textContent,
                name: cells[1].querySelector('input').value,
                rating: participantRatingInput.value,
                opponentRating: opponentRatingInput.value,
                goalsScored: goalsScoredInput.value,
                totalGoals: cells[5].textContent
            };
            tableData.push(rowData);
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(tableData));
        localStorage.setItem('numParticipants', numParticipantsInput.value);
    }

    // Function to load data from localStorage
    function loadData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const savedNumParticipants = localStorage.getItem('numParticipants');

        if (savedNumParticipants) {
            numParticipantsInput.value = savedNumParticipants;
        }

        if (savedData) {
            const tableData = JSON.parse(savedData);
            tableBody.innerHTML = '';

            tableData.forEach(rowData => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${rowData.index}</td>
                    <td><input type="text" value="${rowData.name}" class="participant-name"></td>
                    <td><input type="number" value="${rowData.rating}" min="0" class="participant-rating"></td>
                    <td><input type="number" value="${rowData.opponentRating}" min="0" class="opponent-rating"></td>
                    <td><input type="number" value="${rowData.goalsScored}" min="0" class="goals-scored"></td>
                    <td class="total-goals-cell">${rowData.totalGoals}</td>
                `;
                tableBody.appendChild(row);
            });
            addInputListeners();
            applyAllRatingStyles();
            calculateTotalGoals();
            highlightTopPlayers();
            highlightLeastGoals();
        } else {
            createTableRows(parseInt(numParticipantsInput.value));
        }
        updateLegend();
    }

    // Function to create table rows
    function createTableRows(numParticipants) {
        const currentRowCount = tableBody.querySelectorAll('tr').length;
        for (let i = currentRowCount + 1; i <= numParticipants; i++) {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${i}</td>
                <td><input type="text" value="Имя участника" class="participant-name"></td>
                <td><input type="number" value="0" min="0" class="participant-rating"></td>
                <td><input type="number" value="0" min="0" class="opponent-rating"></td>
                <td><input type="number" value="0" min="0" class="goals-scored"></td>
                <td class="total-goals-cell">0</td>
            `;
            tableBody.appendChild(row);
        }
        addInputListeners();
        applyAllRatingStyles();
        calculateTotalGoals();
        highlightTopPlayers();
        highlightLeastGoals();
        saveData();
    }

    // Function to add event listeners to input fields
    function addInputListeners() {
        const inputs = tableBody.querySelectorAll('input');
        inputs.forEach(input => {
            input.removeEventListener('input', handleInput);
            input.addEventListener('input', handleInput);
        });
    }

    // Handler for input events that triggers calculation and saving
    function handleInput() {
        calculateTotalGoals();
        applyAllRatingStyles();
        highlightTopPlayers();
        highlightLeastGoals();
        saveData();
    }

    // Function to apply rating styles to all rows
    function applyAllRatingStyles() {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const participantRatingInput = row.querySelector('.participant-rating');
            const opponentRatingInput = row.querySelector('.opponent-rating');

            const participantRating = parseInt(participantRatingInput.value) || 0;
            const opponentRating = parseInt(opponentRatingInput.value) || 0;

            applyRatingStyle(row, participantRating, opponentRating);
        });
    }

    // Function to calculate the total goals for each row and the overall total
    function calculateTotalGoals() {
        let overallTotalGoals = 0;
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const goalsScoredInput = row.querySelector('.goals-scored');
            const goalsScored = parseInt(goalsScoredInput.value) || 0;

            const totalGoalsForRow = goalsScored;

            const totalGoalsCell = row.querySelector('.total-goals-cell');
            if (totalGoalsCell) {
                totalGoalsCell.textContent = totalGoalsForRow;
            }

            overallTotalGoals += totalGoalsForRow;
        });

        totalGoalsSpan.textContent = overallTotalGoals;
    }

    // Function to create and update the legend
    function updateLegend() {
        legendContainer.innerHTML = `
            <div class="legend-group">
                <div class="legend-group-title">Рейтинги</div>
                <div class="legend-item">
                    <div class="legend-color rating-diff-plus-2"></div>
                    <span>Ваш рейтинг > Рейтинг соперника на 2+</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color rating-diff-plus-1"></div>
                    <span>Ваш рейтинг > Рейтинг соперника на 1</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color rating-diff-0"></div>
                    <span>Ваш рейтинг = Рейтинг соперника</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color rating-diff-minus-1"></div>
                    <span>Ваш рейтинг < Рейтинг соперника на 1</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color rating-diff-minus-2"></div>
                    <span>Ваш рейтинг < Рейтинг соперника на 2+</span>
                </div>
            </div>
            <div class="legend-group">
                <div class="legend-group-title">Игроки</div>
                <div class="legend-item">
                    <div class="legend-color border-legend-item top-3-player-border-1"></div>
                    <span>Топ 1 игрок (по голам)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color border-legend-item top-3-player-border-2"></div>
                    <span>Топ 2 игрок (по голам)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color border-legend-item top-3-player-border-3"></div>
                    <span>Топ 3 игрок (по голам)</span>
                </div>
                 <div class="legend-item">
                    <div class="legend-color border-legend-item least-goals-border"></div>
                    <span>Игрок(и) с наименьшим кол-вом голов</span>
                </div>
            </div>
        `;
    }

    // Event listener for the "Create Table" button
    createTableBtn.addEventListener('click', () => {
        const numParticipants = parseInt(numParticipantsInput.value);
        if (numParticipants > 0) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('numParticipants');
            tableBody.innerHTML = '';
            createTableRows(numParticipants);
            updateLegend();
            endTournamentBtn.style.display = ''; // Show end tournament button
        } else {
            alert('Please enter a valid number of participants (greater than 0).');
        }
    });

    // Event listener for the "End Tournament" button
    endTournamentBtn.addEventListener('click', () => {
        displayPedestal();
    });

    // Event listener for the "Continue Tournament" button
    continueTournamentBtn.addEventListener('click', () => {
        resetTournament();
    });

    // Load data when the page loads
    loadData();
});