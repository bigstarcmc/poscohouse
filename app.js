const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutButton = document.getElementById('logoutButton');

const calendarGrid = document.getElementById('calendarGrid');
const calendarMonthLabel = document.querySelector('.month-label');
const prevMonthButton = document.getElementById('prevMonthButton');
const nextMonthButton = document.getElementById('nextMonthButton');
const calendarViewButtons = Array.from(document.querySelectorAll('[data-calendar-view]'));
const calendarViewStatus = document.getElementById('calendarViewStatus');

const shiftPattern = ['day', 'day', 'off', 'off', 'night', 'night', 'off', 'off'];
const teamOffsets = { A: 0, B: 1, C: 2, D: 3 };
const shiftLabels = { day: '주', night: '야', off: '휴' };
const shiftColors = { day: 'day', night: 'night', off: 'off' };
let calendarMonth = new Date(2026, 8, 1);
let currentCalendarView = 'mine';
let currentCalendarTeam = 'C';

function ymd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getShiftType(dateStr, team = 'C') {
    const anchor = new Date(2026, 8, 28, 0, 0, 0);
    const date = new Date(`${dateStr}T00:00:00+09:00`);
    const offsetDays = Math.round((date - anchor) / 86400000);
    const base = ((offsetDays + (teamOffsets[team] || 0)) % shiftPattern.length + shiftPattern.length) % shiftPattern.length;
    return shiftPattern[base] || 'off';
}

function renderCalendar() {
    if (!calendarGrid) return;

    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const startDay = monthStart.getDay();
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const prevDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();

    calendarGrid.innerHTML = '';
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    weekdays.forEach((weekday) => {
        const el = document.createElement('div');
        el.className = 'calendar-weekday';
        el.textContent = weekday;
        calendarGrid.appendChild(el);
    });

    const todayYmd = ymd(new Date());
    const monthYmdBase = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}`;
    let displayed = 0;

    for (let i = 0; i < startDay; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-date muted';
        const dom = prevDays - startDay + i + 1;
        el.textContent = String(dom);
        calendarGrid.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        const dateStr = ymd(d);
        const shift = getShiftType(dateStr, currentCalendarTeam);
        const el = document.createElement('div');
        el.className = 'calendar-date';
        if (dateStr === todayYmd) {
            el.classList.add('today');
        }
        if (shift === 'off') {
            el.classList.add('off');
        }
        el.innerHTML = `${day}<span class="shift-dot ${shiftColors[shift]}">${shiftLabels[shift]}</span>`;
        el.dataset.date = dateStr;
        el.addEventListener('click', () => {
            console.log('calendar date clicked:', dateStr, 'shift', shift, 'view', currentCalendarView);
        });
        calendarGrid.appendChild(el);
        displayed++;
    }

    const remaining = 42 - (startDay + daysInMonth);
    for (let day = 1; day <= remaining; day++) {
        const el = document.createElement('div');
        el.className = 'calendar-date muted';
        el.textContent = String(day);
        calendarGrid.appendChild(el);
    }

    if (calendarMonthLabel) {
        calendarMonthLabel.textContent = `${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth() + 1}월`;
    }
}

if (prevMonthButton) {
    prevMonthButton.addEventListener('click', function () {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
        console.log('prevMonthButton clicked:', ymd(calendarMonth));
        renderCalendar();
    });
}

if (nextMonthButton) {
    nextMonthButton.addEventListener('click', function () {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        console.log('nextMonthButton clicked:', ymd(calendarMonth));
        renderCalendar();
    });
}

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
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            loginError.textContent = error.message || '이메일 또는 비밀번호가 올바르지 않습니다.';
            return;
        }

        if (data?.session?.access_token) {
            localStorage.setItem('poscohouse.accessToken', data.session.access_token);
        }

        if (data?.session?.refresh_token) {
            localStorage.setItem('poscohouse.refreshToken', data.session.refresh_token);
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

async function getAuthenticatedUserId() {
    if (!window.supabaseClient || !window.supabaseClient.auth || !window.supabaseClient.auth.getUser) {
        console.error('getAuthenticatedUserId: supabaseClient.auth.getUser() not available.');
        return null;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.getUser();
        if (error) {
            console.error('getAuthenticatedUserId: auth.getUser() failed:', error.message || error);
            return null;
        }

        if (!data?.user?.id) {
            console.error('getAuthenticatedUserId: logged-in user id missing.');
            return null;
        }

        return data.user.id;
    } catch (error) {
        console.error('getAuthenticatedUserId: unexpected error while reading auth user id:', error);
        return null;
    }
}

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
        currentCalendarTeam = nextTeam;
        applyTeam(nextTeam);
        renderCalendar();
        console.log('teamButtons clicked:', nextTeam);
    });
});

calendarViewButtons.forEach((button) => {
    button.addEventListener('click', function () {
        const view = button.dataset.calendarView || 'mine';
        currentCalendarView = view;
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

        if (view === 'all') {
            console.log('calendarViewButtons clicked: showing all teams row-view; A/B/C/D row view active');
        } else {
            console.log('calendarViewButtons clicked: showing mine team view');
        }

        renderCalendar();
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

const calendarMonthLabel = document.querySelector('.month-label');
const prevMonthButton = document.querySelector('#prevMonthButton');
const nextMonthButton = document.querySelector('#nextMonthButton');
let calendarMonth = new Date(2026, 8, 1);

function updateCalendarMonthLabel() {
    if (calendarMonthLabel) {
        calendarMonthLabel.textContent = `${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth() + 1}월`;
    }
}

if (prevMonthButton) {
    prevMonthButton.addEventListener('click', function () {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
        updateCalendarMonthLabel();
    });
}

if (nextMonthButton) {
    nextMonthButton.addEventListener('click', function () {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        updateCalendarMonthLabel();
    });
}

updateCalendarMonthLabel();

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
        console.error('readSalaryConfigFromSupabase: missing Supabase URL or anon key.');
        return null;
    }

    const ownerId = await getAuthenticatedUserId();
    if (!ownerId) {
        console.error('readSalaryConfigFromSupabase: no authenticated user id available; cannot read salary_config by owner_id.');
        return null;
    }

    try {
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
            console.error('readSalaryConfigFromSupabase: salary_config fetch failed with status', configResponse.status, 'for owner_id', ownerId);
            return null;
        }

        const configRows = await configResponse.json();
        if (!Array.isArray(configRows) || configRows.length === 0) {
            console.error('readSalaryConfigFromSupabase: no salary_config row found for owner_id', ownerId);
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
        console.error('readSalaryConfigFromSupabase: unexpected fetch error:', error);
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

const salaryLineFieldMap = {
    basePayLine: { configKey: 'basePay', label: '직무기준급' },
    mealAllowanceLine: { configKey: 'mealAllowance', label: '중식비' },
    selfDesignLine: { configKey: 'selfDesignSupport', label: '자기설계지원금' },
    jobEnvironmentLine: { configKey: 'jobEnvironmentAllowance', label: '직무환경수당' },
    performanceLine: { configKey: 'performancePayRate', label: '업적급율' },
    shiftAllowanceLine: { configKey: 'shiftAllowanceRate', label: '교대수당율' },
    nightAllowanceLine: { configKey: 'nightHourlyRate', label: '야간시급' }
};

function attachInlineSalaryEditing() {
    const salaryRows = Array.from(document.querySelectorAll('#panel-salary .formula-row'));
    salaryRows.forEach((row) => {
        const line = row.querySelector('span:nth-child(2)');
        if (!line) return;
        const lineId = line.id;
        const fieldDef = salaryLineFieldMap[lineId];
        if (!fieldDef) return;

        row.addEventListener('click', function () {
            if (row.querySelector('input')) return;
            const existingValue = salaryConfig[fieldDef.configKey] || 0;
            const input = document.createElement('input');
            input.type = 'number';
            input.step = fieldDef.configKey.includes('Rate') ? '0.0001' : '1000';
            input.value = String(existingValue);
            input.className = 'inline-salary-edit';
            line.replaceWith(input);
            input.focus();

            const saveSalaryInline = async () => {
                const nextValue = Number(input.value || 0);
                if (fieldDef.configKey === 'basePay') salaryConfig.basePay = nextValue;
                if (fieldDef.configKey === 'mealAllowance') salaryConfig.mealAllowance = nextValue;
                if (fieldDef.configKey === 'selfDesignSupport') salaryConfig.selfDesignSupport = nextValue;
                if (fieldDef.configKey === 'jobEnvironmentAllowance') salaryConfig.jobEnvironmentAllowance = nextValue;
                if (fieldDef.configKey === 'performancePayRate') salaryConfig.performancePayRate = nextValue;
                if (fieldDef.configKey === 'shiftAllowanceRate') salaryConfig.shiftAllowanceRate = nextValue;
                if (fieldDef.configKey === 'nightHourlyRate') salaryConfig.nightHourlyRate = nextValue;

                const replacement = document.createElement('span');
                replacement.id = lineId;
                replacement.textContent = lineId === 'performanceLine' || lineId === 'shiftAllowanceLine' || lineId === 'nightAllowanceLine'
                    ? formatMoney(nextValue)
                    : formatMoney(nextValue);
                input.replaceWith(replacement);
                updateSalaryUI();
                console.log('inlineSalaryEdit saved:', fieldDef.label, nextValue);
                await saveSalaryConfigFromForm();
            };

            input.addEventListener('blur', saveSalaryInline);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    saveSalaryInline();
                }
            });
        });
    });
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

async function saveSalaryConfigFromForm() {
    if (!supabaseUrl || !supabaseAnonKey) {
        if (salaryConfigSaveStatus) {
            salaryConfigSaveStatus.textContent = 'Supabase 키가 없어 저장할 수 없습니다.';
        }
        return;
    }

    const ownerId = await getAuthenticatedUserId();
    if (!ownerId) {
        if (salaryConfigSaveStatus) {
            salaryConfigSaveStatus.textContent = '로그인한 사용자를 찾지 못했습니다.';
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

    const existingRow = await readCurrentSalaryConfigRowForProfile(ownerId);
    const payload = {
        owner_id: ownerId,
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
const addAccountButton = document.getElementById('addAccountButton');

const balanceStorageKey = 'poscohouse.currentBalance';
const defaultBalance = 512500;
const supabaseUrl = (window.POSCOHOUSE_SUPABASE_URL || 'https://flddhgciftiuoxuwnrzx.supabase.co').replace(/\/$/, '');
const supabaseAnonKey = (window.POSCOHOUSE_SUPABASE_ANON_KEY || '').trim();

async function readAccountsFromSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('readAccountsFromSupabase: missing Supabase URL or anon key.');
        return [];
    }

    const ownerId = await getAuthenticatedUserId();
    if (!ownerId) {
        console.error('readAccountsFromSupabase: no authenticated user id available.');
        return [];
    }

    try {
        const query = new URLSearchParams({
            select: 'id,name,type,institution,current_balance',
            owner_id: `eq.${ownerId}`,
            order: 'id.asc'
        });

        const response = await fetch(`${supabaseUrl}/rest/v1/accounts?${query.toString()}`, {
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            console.error('readAccountsFromSupabase: failed with status', response.status);
            return [];
        }

        const rows = await response.json();
        return Array.isArray(rows) ? rows : [];
    } catch (error) {
        console.error('readAccountsFromSupabase: unexpected error:', error);
        return [];
    }
}

function renderAccountsToSettings(rows) {
    const settingsAccountList = document.getElementById('settingsAccountList');
    if (!settingsAccountList) {
        return;
    }

    settingsAccountList.innerHTML = '';

    if (!Array.isArray(rows) || rows.length === 0) {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'setting-row';
        emptyRow.innerHTML = '<span>등록된 계좌가 없습니다</span><span class="status-dot muted"></span>';
        settingsAccountList.appendChild(emptyRow);
        return;
    }

    rows.forEach((row) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'setting-row';

        const nameEl = document.createElement('span');
        nameEl.textContent = row.name || '계좌';

        const statusEl = document.createElement('span');
        statusEl.className = 'status-dot ok';

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'settings-row-delete';
        deleteButton.dataset.accountDeleteId = row.id;
        deleteButton.textContent = '삭제';
        deleteButton.addEventListener('click', async function () {
            const ok = await deleteAccount(row.id);
            if (ok) {
                const updated = await readAccountsFromSupabase();
                renderAccountsToSettings(updated);
            }
        });

        rowEl.appendChild(nameEl);
        rowEl.appendChild(statusEl);
        rowEl.appendChild(deleteButton);
        settingsAccountList.appendChild(rowEl);
    });
}

async function addAccount(name, type, institution) {

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('addAccount: missing Supabase URL or anon key.');
        return null;
    }

    const ownerId = await getAuthenticatedUserId();
    if (!ownerId) {
        console.error('addAccount: no authenticated user id available for owner_id.');
        return null;
    }

    const payload = {
        owner_id: ownerId,
        name,
        type,
        institution,
        current_balance: 0
    };

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/accounts`, {
            method: 'POST',
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
            console.error('addAccount: insert failed with', response.status);
            return null;
        }

        return await readAccountsFromSupabase();
    } catch (error) {
        console.error('addAccount: unexpected error:', error);
        return null;
    }
}

async function deleteAccount(accountId) {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('deleteAccount: missing Supabase URL or anon key.');
        return false;
    }

    if (!window.confirm('정말 삭제하시겠습니까?')) {
        console.log('deleteAccount: user cancelled delete for accountId', accountId);
        return false;
    }

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/accounts?id=eq.${encodeURIComponent(accountId)}`, {
            method: 'DELETE',
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            console.error('deleteAccount: delete failed with status', response.status);
            if (response.status === 23503) {
                window.alert('해당 계좌를 참조하는 거래내역이 있어 삭제할 수 없습니다. 먼저 거래를 정리해주세요.');
            } else {
                window.alert('계좌 삭제 중 오류가 발생했습니다.');
            }
            return false;
        }

        console.log('deleteAccount: successful delete account', accountId);
        return true;
    } catch (error) {
        console.error('deleteAccount: unexpected error:', error);
        window.alert('계좌 삭제 중 오류가 발생했습니다.');
        return false;
    }
}

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

if (addAccountButton) {
    addAccountButton.addEventListener('click', async function () {
        const settings = document.getElementById('panel-settings');
        const existing = settings?.querySelector('#addAccountForm');
        if (existing) {
            existing.remove();
        }

        const form = document.createElement('div');
        form.className = 'add-account-form';
        form.id = 'addAccountForm';
        form.innerHTML = `
            <div class="add-account-row">
                <label>계좌 이름</label>
                <input type="text" id="addAccountName" placeholder="예: 공동 생활비 통장" />
            </div>
            <div class="add-account-row">
                <label>소유자 선택</label>
                <select id="addAccountOwner">
                    <option value="${localStorage.getItem('poscohouse.ownerId') || 'self'}">로그인 사용자</option>
                    <option value="선영">선영</option>
                    <option value="진한">진한</option>
                </select>
            </div>
            <div class="add-account-row">
                <label>유형 선택</label>
                <select id="addAccountType">
                    <option value="급여통장">급여통장</option>
                    <option value="저축">저축</option>
                    <option value="카드">카드</option>
                    <option value="생활비">생활비</option>
                </select>
            </div>
            <div class="add-account-row">
                <label>금융기관</label>
                <input type="text" id="addAccountInstitution" placeholder="예: POSCO" />
            </div>
            <div class="add-account-actions">
                <button type="button" id="confirmAddAccount">추가</button>
                <button type="button" id="cancelAddAccount">취소</button>
            </div>
        `;

        const list = document.getElementById('settingsAccountList');
        if (list) {
            list.appendChild(form);
        }

        const cancel = form.querySelector('#cancelAddAccount');
        cancel.addEventListener('click', () => form.remove());

        const confirm = form.querySelector('#confirmAddAccount');
        confirm.addEventListener('click', async function () {
            const name = form.querySelector('#addAccountName').value.trim();
            const owner = form.querySelector('#addAccountOwner').value || 'self';
            const type = form.querySelector('#addAccountType').value || '급여통장';
            const institution = form.querySelector('#addAccountInstitution').value.trim() || 'POSCO';
            if (!name) {
                window.alert('계좌 이름을 입력해주세요.');
                return;
            }

            console.log('addAccount requested:', { name, owner, type, institution });
            const rows = await addAccount(name, type, institution);
            if (Array.isArray(rows)) {
                renderAccountsToSettings(rows);
                form.remove();
            } else {
                console.error('addAccount: failed insert payload:', { name, owner, type, institution });
                window.alert('계좌 추가 실패. RLS 또는 owner_id/필수 컬럼 제약을 확인하세요.');
            }
        });
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

async function initializeSettingsAccounts() {
    const rows = await readAccountsFromSupabase();
    renderAccountsToSettings(rows);
}

initializeSalaryConfig();
initializeSettingsAccounts();
applyTeam(currentTeam);

