const BACKEND_URL = 'https://shiny-tribble-x76q9vq49g62p4jw-3000.app.github.dev/'; // Configura il backend qui

// Salvataggio dei nomi delle squadre per suggerimenti
const teamSuggestions = new Set();

// Funzioni di Gestione UI
function toggleVisibility(showId, ...hideIds) {
    document.getElementById(showId).style.display = 'block';
    hideIds.forEach(id => document.getElementById(id).style.display = 'none');
}

// Funzione per aggiungere una riga nella tabella dei risultati
function addRow(summaryBody, teamName, totalScore, penalty, insufficient, currentDate) {
    const newRow = summaryBody.insertRow();
    newRow.insertCell(0).innerText = currentDate;
    newRow.insertCell(1).innerText = teamName;
    newRow.insertCell(2).innerText = totalScore;
    newRow.insertCell(3).innerText = penalty;
    newRow.insertCell(4).innerText = insufficient ? 'Sì' : 'No';
    newRow.insertCell(5).innerText = totalScore > 0 ? '1' : '0';

    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Elimina';
    deleteButton.style.backgroundColor = '#f44336';
    deleteButton.style.color = 'white';
    deleteButton.style.border = 'none';
    deleteButton.style.padding = '5px 10px';
    deleteButton.style.cursor = 'pointer';
    deleteButton.addEventListener('click', () => summaryBody.deleteRow(newRow.rowIndex - 1));
    newRow.insertCell(6).appendChild(deleteButton);
}

// Event Listener: Avvia partita
document.getElementById('start-game').addEventListener('click', function () {
    const team1Name = document.getElementById('team1-name').value.trim();
    const team2Name = document.getElementById('team2-name').value.trim();

    if (!team1Name || !team2Name) {
        alert('Inserisci i nomi di entrambe le squadre!');
        return;
    }

    teamSuggestions.add(team1Name);
    teamSuggestions.add(team2Name);

    document.getElementById('team1-name-display').innerText = team1Name;
    document.getElementById('team2-name-display').innerText = team2Name;
    toggleVisibility('score-input', 'team-names');
});

// Event Listener: Invia punteggio
document.getElementById('submit-score').addEventListener('click', function () {
    const summaryBody = document.getElementById('summary-body');
    const currentDate = new Date().toLocaleDateString();

    const scores = [
        {
            teamName: document.getElementById('team1-name-display').innerText,
            score: parseInt(document.getElementById('team1-score').value) || 0,
            penalty: parseInt(document.getElementById('team1-penalty').value) || 0,
            insufficient: document.getElementById('team1-insufficient').checked,
        },
        {
            teamName: document.getElementById('team2-name-display').innerText,
            score: parseInt(document.getElementById('team2-score').value) || 0,
            penalty: parseInt(document.getElementById('team2-penalty').value) || 0,
            insufficient: document.getElementById('team2-insufficient').checked,
        },
    ];

    scores.forEach(score => {
        const totalScore = score.score - score.penalty;
        addRow(summaryBody, score.teamName, totalScore, score.penalty, score.insufficient, currentDate);
    });

    toggleVisibility('summary', 'score-input');
    saveScoresToBackend(scores); // Salva al backend
});

// Funzione: Suggerimenti per i nomi delle squadre
function suggestTeamNames(inputId) {
    const input = document.getElementById(inputId);
    input.addEventListener('input', debounce(() => {
        const suggestions = Array.from(teamSuggestions).filter(team =>
            team.toLowerCase().includes(input.value.toLowerCase())
        );
        console.log('Suggerimenti:', suggestions); // Debug
    }, 300));
}

// Utility: Debounce
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Suggerimenti per i nomi delle squadre
suggestTeamNames('team1-name');
suggestTeamNames('team2-name');

// Funzioni Backend
async function saveScoresToBackend(scores) {
    if (!BACKEND_URL) {
        console.error('URL backend non configurato');
        return;
    }

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scores),
        });

        if (!response.ok) throw new Error('Errore nel salvataggio dei dati');
        console.log('Dati salvati con successo');
    } catch (error) {
        console.error('Errore durante il salvataggio:', error);
        alert('Errore durante il salvataggio dei dati.');
    }
}

async function reloadScoresFromBackend() {
    try {
        const response = await fetch(BACKEND_URL);
        const data = await response.json();
        const summaryBody = document.getElementById('summary-body');
        summaryBody.innerHTML = '';

        data.forEach(score => {
            addRow(summaryBody, score.team, score.totalScore, score.penalty, score.insufficient, score.date);
        });
    } catch (error) {
        console.error('Errore durante il caricamento dei dati:', error);
    }
}

document.getElementById('reload-data').addEventListener('click', reloadScoresFromBackend);

// Altri Event Listener
document.getElementById('delete-all').addEventListener('click', () => {
    document.getElementById('summary-body').innerHTML = '';
});