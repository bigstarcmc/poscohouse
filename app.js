const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutButton = document.getElementById('logoutButton');

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        loginError.textContent = '이메일과 비밀번호를 입력해주세요.';
        return;
    }

    if (!email.includes('@') || email.length < 5 || password.length < 3) {
        loginError.textContent = '이메일 형식과 비밀번호를 다시 확인해주세요.';
        return;
    }

    try {
        const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
        const authResponse = await fetch(authUrl, {
            method: 'POST',
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!authResponse.ok) {
            loginError.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
            return;
        }

        const authData = await authResponse.json();
        if (authData.access_token) {
            localStorage.setItem('poscohouse.accessToken', authData.access_token);
            if (authData.refresh_token) {
                localStorage.setItem('poscohouse.refreshToken', authData.refresh_token);
            }
        }

        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
    } catch (error) {
        loginError.textContent = '로그인 처리 중 오류가 발생했습니다.';
    }
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

        if (target === 'salary') {
            initializeSalaryConfig();
        }
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

const salaryProfileName = '진한';

const defaultSalaryConfig = {
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

let salaryConfig = defaultSalaryConfig;

async function readSalaryConfigFromSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }

    try {
        const profileQuery = new URLSearchParams({
            select: 'id',
            name: `eq.${salaryProfileName}`,
            limit: '1'
        });
        const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?${profileQuery.toString()}`, {
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                Accept: 'application/json'
            }
        });

        if (!profileResponse.ok) {
            return null;
        }

        const profileRows = await profileResponse.json();
        if (!Array.isArray(profileRows) || profileRows.length === 0) {
            return null;
        }

        const ownerId = profileRows[0].id;
        const configQuery = new URLSearchParams({
            select: 'base_pay,meal_allowance,self_design_support,job_environment_allowance,shift_allowance_rate,performance_pay_rate,management_bonus_rate,night_hourly_rate,effective_from',
            owner_id: `eq.${ownerId}`,
            order: 'effective_from.desc',
            limit: '1'
        });
        const configResponse = await fetch(`${supabaseUrl}/rest/v1/salary_config?${configQuery.toString()}`, {
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                Accept: 'application/json'
            }
        });

        if (!configResponse.ok) {
            return null;
        }

        const configRows = await configResponse.json();
        if (!Array.isArray(configRows) || configRows.length === 0) {
            return null;
        }

        const row = configRows[0];
        return {
            basePay: Number(row.base_pay),
            mealAllowance: Number(row.meal_allowance),
            selfDesignSupport: Number(row.self_design_support),
            jobEnvironmentAllowance: Number(row.job_environment_allowance),
            shiftAllowanceRate: Number(row.shift_allowance_rate),
            performancePayRate: Number(row.performance_pay_rate),
            managementBonusRate: Number(row.management_bonus_rate),
            nightHourlyRate: Number(row.night_hourly_rate),
            effectiveFrom: row.effective_from
        };
    } catch (error) {
        return null;
    }
}

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

function populateSalaryConfigForm(config) {
    if (!config) {
        return;
    }

    const fields = {
        salaryBasePayInput: config.basePay,
        salaryMealAllowanceInput: config.mealAllowance,
        salarySelfDesignSupportInput: config.selfDesignSupport,
        salaryJobEnvironmentAllowanceInput: config.jobEnvironmentAllowance,
        salaryShiftAllowanceRateInput: config.shiftAllowanceRate,
        salaryPerformancePayRateInput: config.performancePayRate,
        salaryManagementBonusRateInput: config.managementBonusRate,
        salaryNightHourlyRateInput: config.nightHourlyRate
    };

    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
        }
    });
}

async function readCurrentSalaryConfigRowForProfile(ownerId) {
    const query = new URLSearchParams({
        select: 'id,base_pay,meal_allowance,self_design_support,job_environment_allowance,shift_allowance_rate,performance_pay_rate,management_bonus_rate,night_hourly_rate,effective_from',
        owner_id: `eq.${ownerId}`,
        order: 'effective_from.desc',
        limit: '1'
    });

    const response = await fetch(`${supabaseUrl}/rest/v1/salary_config?${query.toString()}`, {
        headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        return null;
    }

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
        return null;
    }

    const row = rows[0];
    return row;
}

async function getProfileIdForName(name) {
    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }

    try {
        const query = new URLSearchParams({
            select: 'id',
            name: `eq.${name}`,
            limit: '1'
        });

        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?${query.toString()}`, {
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            return null;
        }

        const rows = await response.json();
        if (!Array.isArray(rows) || rows.length === 0) {
            return null;
        }

        return rows[0].id || null;
    } catch (error) {
        return null;
    }
}

async function saveSalaryConfigFromForm() {
    if (!supabaseUrl || !supabaseAnonKey) {
        if (salaryConfigSaveStatus) {
            salaryConfigSaveStatus.textContent = 'Supabase 키가 없어 저장할 수 없습니다.';
        }
        return;
    }

    const profileId = await getProfileIdForName(salaryProfileName);
    if (!profileId) {
        if (salaryConfigSaveStatus) {
            salaryConfigSaveStatus.textContent = '진한 프로필을 찾지 못했습니다.';
        }
        return;
    }

    const config = {
        basePay: Number(document.getElementById('salaryBasePayInput').value || 0),
        mealAllowance: Number(document.getElementById('salaryMealAllowanceInput').value || 0),
        selfDesignSupport: Number(document.getElementById('salarySelfDesignSupportInput').value || 0),
        jobEnvironmentAllowance: Number(document.getElementById('salaryJobEnvironmentAllowanceInput').value || 0),
        shiftAllowanceRate: Number(document.getElementById('salaryShiftAllowanceRateInput').value || 0),
        performancePayRate: Number(document.getElementById('salaryPerformancePayRateInput').value || 0),
        managementBonusRate: Number(document.getElementById('salaryManagementBonusRateInput').value || 0),
        nightHourlyRate: Number(document.getElementById('salaryNightHourlyRateInput').value || 0),
        effectiveFrom: '2026-09-28'
    };

    const existingRow = await readCurrentSalaryConfigRowForProfile(profileId);
    const payload = {
        owner_id: profileId,
        base_pay: config.basePay,
        meal_allowance: config.mealAllowance,
        self_design_support: config.selfDesignSupport,
        job_environment_allowance: config.jobEnvironmentAllowance,
        shift_allowance_rate: config.shiftAllowanceRate,
        performance_pay_rate: config.performancePayRate,
        management_bonus_rate: config.managementBonusRate,
        night_hourly_rate: config.nightHourlyRate,
        effective_from: config.effectiveFrom
    };

    try {
        const method = existingRow ? 'PATCH' : 'POST';
        const url = existingRow
            ? `${supabaseUrl}/rest/v1/salary_config?id=eq.${encodeURIComponent(existingRow.id)}`
            : `${supabaseUrl}/rest/v1/salary_config`;

        const response = await fetch(url, {
            method,
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal',
                Accept: 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (salaryConfigSaveStatus) {
                salaryConfigSaveStatus.textContent = '저장 실패: Supabase 응답 오류';
            }
            return;
        }

        salaryConfig = {
            basePay: config.basePay,
            mealAllowance: config.mealAllowance,
            selfDesignSupport: config.selfDesignSupport,
            jobEnvironmentAllowance: config.jobEnvironmentAllowance,
            shiftAllowanceRate: config.shiftAllowanceRate,
            performancePayRate: config.performancePayRate,
            managementBonusRate: config.managementBonusRate,
            nightHourlyRate: config.nightHourlyRate,
            effectiveFrom: config.effectiveFrom
        };

        updateSalaryUI();

        if (salaryConfigSaveStatus) {
            salaryConfigSaveStatus.textContent = '급여 설정 저장 완료';
        }
    } catch (error) {
        if (salaryConfigSaveStatus) {
            salaryConfigSaveStatus.textContent = '저장 실패';
        }
    }
}

const balanceValue = document.getElementById('currentBalanceValue');
const balanceAdjustButton = document.getElementById('balanceAdjustButton');
const balanceAdjustmentInput = document.getElementById('balanceAdjustmentInput');
const salaryConfigSaveStatus = document.getElementById('salaryConfigSaveStatus');

const balanceStorageKey = 'poscohouse.currentBalance';
const defaultBalance = 512500;
const supabaseUrl = (window.POSCOHOUSE_SUPABASE_URL || 'https://flddhgciftiuoxuwnrzx.supabase.co').replace(/\/$/, '');
const supabaseAnonKey = (window.POSCOHOUSE_SUPABASE_ANON_KEY || '').trim();

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

async function readBalanceFromSupabaseAccounts() {
    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }

    const ownerId = localStorage.getItem('poscohouse.ownerId') || '';
    const query = new URLSearchParams({
        select: 'id,current_balance',
        limit: '1'
    });

    if (ownerId) {
        query.set('owner_id', `eq.${ownerId}`);
    }

    const url = `${supabaseUrl}/rest/v1/accounts?${query.toString()}`;

    try {
        const response = await fetch(url, {
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            return null;
        }

        const rows = await response.json();
        if (!Array.isArray(rows) || rows.length === 0) {
            return null;
        }

        const balance = Number(rows[0].current_balance);
        return Number.isFinite(balance) ? balance : null;
    } catch (error) {
        return null;
    }
}

async function writeBalanceToSupabaseAccounts(value) {
    if (!supabaseUrl || !supabaseAnonKey) {
        return false;
    }

    const ownerId = localStorage.getItem('poscohouse.ownerId') || '';
    const query = new URLSearchParams({
        select: 'id,current_balance',
        limit: '1'
    });

    if (ownerId) {
        query.set('owner_id', `eq.${ownerId}`);
    }

    const readUrl = `${supabaseUrl}/rest/v1/accounts?${query.toString()}`;

    try {
        const readResponse = await fetch(readUrl, {
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                Accept: 'application/json'
            }
        });

        if (!readResponse.ok) {
            return false;
        }

        const rows = await readResponse.json();
        if (!Array.isArray(rows) || rows.length === 0) {
            return false;
        }

        const row = rows[0];
        const patchUrl = `${supabaseUrl}/rest/v1/accounts?id=eq.${encodeURIComponent(row.id)}`;
        const patchResponse = await fetch(patchUrl, {
            method: 'PATCH',
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
            },
            body: JSON.stringify({ current_balance: value })
        });

        return patchResponse.ok;
    } catch (error) {
        return false;
    }
}

if (balanceAdjustButton && balanceAdjustmentInput) {
    balanceAdjustButton.addEventListener('click', async function () {
        const change = Number(balanceAdjustmentInput.value) || 0;
        const oldBalance = Number(localStorage.getItem(balanceStorageKey) || String(defaultBalance));
        const nextBalance = oldBalance + change;

        const synced = await writeBalanceToSupabaseAccounts(nextBalance);
        if (!synced) {
            localStorage.setItem(balanceStorageKey, String(nextBalance));
        } else {
            localStorage.setItem(balanceStorageKey, String(nextBalance));
        }

        updateBalanceUI(nextBalance);
    });
}

async function initializeBalance() {
    const supabaseBalance = await readBalanceFromSupabaseAccounts();

    if (typeof supabaseBalance === 'number') {
        localStorage.setItem(balanceStorageKey, String(supabaseBalance));
        updateBalanceUI(supabaseBalance);
        return;
    }

    const storedBalance = Number(localStorage.getItem(balanceStorageKey) || String(defaultBalance));
    updateBalanceUI(storedBalance);
}

initializeBalance();

async function initializeSalaryConfig() {
    const remoteConfig = await readSalaryConfigFromSupabase();
    if (remoteConfig) {
        salaryConfig = remoteConfig;
        populateSalaryConfigForm(remoteConfig);
    } else {
        populateSalaryConfigForm(salaryConfig);
    }
    updateSalaryUI();
}

const saveSalaryConfigButton = document.getElementById('saveSalaryConfigButton');
if (saveSalaryConfigButton) {
    saveSalaryConfigButton.addEventListener('click', saveSalaryConfigFromForm);
}

initializeSalaryConfig();
applyTeam(currentTeam);

