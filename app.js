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

    const calendarStatus = document.getElementById('calendarViewStatus');
    if (calendarStatus) {
        calendarStatus.textContent = `${label} · 4조2교대`;
    }
}

teamButtons.forEach((button) => {
    button.addEventListener('click', function () {
        const nextTeam = button.dataset.team || 'C';
        localStorage.setItem(storageKey, nextTeam);
        applyTeam(nextTeam);
    });
});

const calendarViewButtons = Array.from(document.querySelectorAll('[data-calendar-view]'));
const calendarViewStatus = document.getElementById('calendarViewStatus');

calendarViewButtons.forEach((button) => {
    button.addEventListener('click', function () {
        const view = button.dataset.calendarView || 'mine';
        localStorage.setItem('poscohouse.calendarView', view);

        calendarViewButtons.forEach((candidate) => {
            candidate.classList.toggle('active', candidate === button);
        });

        if (calendarViewStatus) {
            const selectedTeam = localStorage.getItem(storageKey) || 'C';
            const label = teamMap[selectedTeam] || 'C조';
            calendarViewStatus.textContent = view === 'all'
                ? '4개조 전체 · 휴가/대근 표시'
                : `${label} · 4조2교대`;
        }
    });
});

const savedCalendarView = localStorage.getItem('poscohouse.calendarView') || 'mine';
const savedCalendarButton = calendarViewButtons.find((button) => button.dataset.calendarView === savedCalendarView) || calendarViewButtons[0];
if (savedCalendarButton) {
    savedCalendarButton.classList.add('active');
    calendarViewButtons.forEach((button) => {
        if (button !== savedCalendarButton) {
            button.classList.remove('active');
        }
    });
}

const salaryConfig = {
    basePay: 16700000,
    mealAllowance: 1400000,
    selfDesignSupport: 2000000,
    jobEnvironmentAllowance: 400000,
    shiftAllowanceRate: 0.08,
    performancePayRate: 0.3333,
    managementBonusRate: 1.0,
    nightHourlyRate: 5700,
    effectiveFrom: '2026-09-28'
};

function formatMoney(amount) {
    return `₩${Math.round(amount / 10000) / 100}만`;
}

function calculateSalary() {
    const basePay = salaryConfig.basePay;
    const mealAllowance = salaryConfig.mealAllowance;
    const selfDesignSupport = salaryConfig.selfDesignSupport;
    const jobEnvironmentAllowance = salaryConfig.jobEnvironmentAllowance;
    const shiftAllowance = basePay * salaryConfig.shiftAllowanceRate;
    const performancePay = (basePay + mealAllowance) * salaryConfig.performancePayRate;
    const nightHours = 56;
    const nightAllowance = salaryConfig.nightHourlyRate * nightHours;

    const estimated = basePay + mealAllowance + selfDesignSupport + jobEnvironmentAllowance + shiftAllowance + performancePay + nightAllowance;

    return {
        estimated,
        basePay,
        mealAllowance,
        selfDesignSupport,
        jobEnvironmentAllowance,
        shiftAllowance,
        performancePay,
        nightAllowance
    };
}

function updateSalaryUI() {
    const result = calculateSalary();
    const salaryTotal = document.getElementById('salaryTotal');
    const salaryPredictionValue = document.getElementById('salaryPredictionValue');

    if (salaryTotal) {
        salaryTotal.textContent = formatMoney(result.estimated);
    }

    if (salaryPredictionValue) {
        salaryPredictionValue.textContent = formatMoney(result.estimated);
    }

    const basePayLine = document.getElementById('basePayLine');
    const mealAllowanceLine = document.getElementById('mealAllowanceLine');
    const selfDesignLine = document.getElementById('selfDesignLine');
    const jobEnvironmentLine = document.getElementById('jobEnvironmentLine');
    const performanceLine = document.getElementById('performanceLine');
    const shiftAllowanceLine = document.getElementById('shiftAllowanceLine');
    const nightAllowanceLine = document.getElementById('nightAllowanceLine');

    if (basePayLine) basePayLine.textContent = formatMoney(result.basePay);
    if (mealAllowanceLine) mealAllowanceLine.textContent = formatMoney(result.mealAllowance);
    if (selfDesignLine) selfDesignLine.textContent = formatMoney(result.selfDesignSupport);
    if (jobEnvironmentLine) jobEnvironmentLine.textContent = formatMoney(result.jobEnvironmentAllowance);
    if (performanceLine) performanceLine.textContent = formatMoney(result.performancePay);
    if (shiftAllowanceLine) shiftAllowanceLine.textContent = formatMoney(result.shiftAllowance);
    if (nightAllowanceLine) nightAllowanceLine.textContent = formatMoney(result.nightAllowance);
}

const balanceValue = document.getElementById('currentBalanceValue');
const balanceAdjustButton = document.getElementById('balanceAdjustButton');
const balanceAdjustmentInput = document.getElementById('balanceAdjustmentInput');

function updateBalanceUI(value) {
    if (balanceValue) {
        const balance = Number(value) || 0;
        balanceValue.textContent = new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            maximumFractionDigits: 0
        }).format(balance);
    }
}

if (balanceAdjustButton && balanceAdjustmentInput) {
    balanceAdjustButton.addEventListener('click', function () {
        const change = Number(balanceAdjustmentInput.value) || 0;
        const oldBalance = Number(localStorage.getItem('poscohouse.currentBalance') || '512500');
        const nextBalance = oldBalance + change;
        localStorage.setItem('poscohouse.currentBalance', String(nextBalance));
        updateBalanceUI(nextBalance);
    });
}

const storedBalance = Number(localStorage.getItem('poscohouse.currentBalance') || '512500');
updateBalanceUI(storedBalance);

updateSalaryUI();
applyTeam(currentTeam);

