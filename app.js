const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutButton = document.getElementById('logoutButton');

loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!userId || !password) {
        loginError.textContent = '아이디와 비밀번호를 입력해주세요.';
        return;
    }

    if (userId.length < 2 || password.length < 3) {
        loginError.textContent = '로그인 정보를 다시 확인해주세요.';
        return;
    }

    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
});

logoutButton.addEventListener('click', function () {
    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});

const navItems = Array.from(document.querySelectorAll('.nav-item'));
const panels = {
    home: document.getElementById('panel-home'),
    calendar: document.getElementById('panel-calendar'),
    salary: document.getElementById('panel-salary'),
    ledger: document.getElementById('panel-ledger'),
    savings: document.getElementById('panel-savings'),
    settings: document.getElementById('panel-settings')
};

navItems.forEach((item) => {
    item.addEventListener('click', function () {
        const target = item.dataset.tab;

        navItems.forEach((btn) => btn.classList.toggle('active', btn === item));

        Object.entries(panels).forEach(([key, panel]) => {
            panel.classList.toggle('active', key === target);
        });
    });
});

const profileTeam = document.querySelector('.profile-team');
const settingsTeamLabel = document.getElementById('selectedTeamLabel');
const teamButtons = Array.from(document.querySelectorAll('.team-button'));
const storageKey = 'poscohouse.selectedTeam';
const teamMap = {
    A: 'A조',
    B: 'B조',
    C: 'C조',
    D: 'D조'
};

const currentTeam = localStorage.getItem(storageKey) || 'C';

function applyTeam(teamName) {
    const teamKey = teamName || 'C';
    const label = teamMap[teamKey] || 'C조';

    teamButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.team === teamKey);
    });

    if (profileTeam) {
        profileTeam.textContent = `${label} · 4조2교대`;
    }

    if (settingsTeamLabel) {
        settingsTeamLabel.textContent = label;
    }
}

teamButtons.forEach((button) => {
    button.addEventListener('click', function () {
        const nextTeam = button.dataset.team || 'C';
        localStorage.setItem(storageKey, nextTeam);
        applyTeam(nextTeam);
    });
});

applyTeam(currentTeam);

