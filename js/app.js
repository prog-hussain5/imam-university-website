/**
 * University Student Search — Main Application
 * جامعة الإمام جعفر الصادق - قسم هندسة تقنيات الحاسوب
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  const state = {
    lang:          'ar',
    theme:         'light',
    searchQuery:   '',
    stageFilter:   '',
    subjectFilter: '',
    yearFilter:    '',
    sortCol:       'id',
    sortDir:       'asc',
    page:          1,
    pageSize:      25,
    filtered:      [],
    allStudents:   []
  };

  // ── DOM Refs ───────────────────────────────────────────────────────────────
  const $  = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ── Grade Classifier ────────────────────────────────────────────────────────
  function gradeClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'very-good';
    if (score >= 70) return 'good';
    if (score >= 60) return 'pass';
    return 'fail';
  }

  function gradeLabel(score) {
    const key = gradeClass(score).replace('-', '');
    const map = { excellent: 'excellent', verygood: 'veryGood', good: 'good', pass: 'pass', fail: 'fail' };
    const t = window.i18n[state.lang];
    if (score >= 90) return t.excellent;
    if (score >= 80) return t.veryGood;
    if (score >= 70) return t.good;
    if (score >= 60) return t.pass;
    return t.fail;
  }

  // ── Translation helpers ─────────────────────────────────────────────────────
  function t(key) {
    return window.i18n[state.lang][key] || key;
  }

  function translateStage(stageAr) {
    if (state.lang === 'en') {
      return window.i18n.en.stageMap[stageAr] || stageAr;
    }
    return stageAr;
  }

  function translateSubject(subjectAr) {
    if (state.lang === 'en') {
      return window.i18n.en.subjectMap[subjectAr] || subjectAr;
    }
    return subjectAr;
  }

  // ── Apply full i18n pass to the DOM ────────────────────────────────────────
  function applyTranslations() {
    const lang   = state.lang;
    const translations = window.i18n[lang];

    // data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key] !== undefined) el.textContent = translations[key];
    });

    // data-i18n-placeholder elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[key] !== undefined) el.placeholder = translations[key];
    });

    // Page title
    document.title = t('pageTitle');

    // Filter select options text that map to i18n keys
    const stageOptionMap = {
      '': 'allStages',
      'الأولى': 'stage1',
      'الثانية': 'stage2',
      'الثالثة': 'stage3',
      'الرابعة': 'stage4'
    };
    const stageFilter = $('stageFilter');
    [...stageFilter.options].forEach(opt => {
      const key = stageOptionMap[opt.value];
      if (key) opt.text = t(key);
    });

    // Year filter
    const yearFilter = $('yearFilter');
    yearFilter.options[0].text = t('allYears');

    // Subject filter — first option
    $('subjectFilter').options[0].text = t('allSubjects');

    // Search placeholder
    $('searchInput').placeholder = t('searchPlaceholder');

    // Pagination buttons
    $('prevBtn').textContent = t('prev');
    $('nextBtn').textContent = t('next');

    // Table headers
    const headerKeys = [
      'colNum','colName','colStage','colSubject','colYear',
      'colQuizzes','colReports','colActivities','colExam',
      'colAttendance','colParticipation','colSupport','colTotal'
    ];
    $$('#dataTable thead th').forEach((th, i) => {
      if (headerKeys[i]) {
        const sortIndicator = th.querySelector('.sort-indicator');
        th.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE || node.nodeName === 'SPAN' && !node.classList.contains('sort-indicator')) {
            // skip
          }
        });
        // Rebuild text content keeping sort indicator
        const indicator = th.querySelector('.sort-indicator');
        th.textContent = t(headerKeys[i]);
        if (indicator) th.appendChild(indicator);
      }
    });

    // Document direction
    document.documentElement.lang = lang;
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.dataset.lang = lang;
  }

  // ── Populate Subject Filter ────────────────────────────────────────────────
  function populateSubjectFilter() {
    const selSubject = $('subjectFilter');
    const current = selSubject.value;

    // Gather subjects based on current stage filter
    let subjects;
    if (state.stageFilter) {
      subjects = [...new Set(
        state.allStudents
          .filter(s => s.stage === state.stageFilter)
          .map(s => s.subject)
      )].sort((a, b) => a.localeCompare(b, 'ar'));
    } else {
      subjects = window.allSubjects.slice();
    }

    // Rebuild options
    while (selSubject.options.length > 1) selSubject.remove(1);
    subjects.forEach(subj => {
      const opt = document.createElement('option');
      opt.value = subj;
      opt.text  = translateSubject(subj);
      selSubject.add(opt);
    });

    // Restore prior selection if still valid
    if (subjects.includes(current)) selSubject.value = current;
    else selSubject.value = '';

    state.subjectFilter = selSubject.value;
  }

  // ── Filter & Sort ─────────────────────────────────────────────────────────
  function applyFilters() {
    const q = state.searchQuery.toLowerCase().trim();

    state.filtered = state.allStudents.filter(s => {
      if (state.stageFilter   && s.stage   !== state.stageFilter)   return false;
      if (state.subjectFilter && s.subject !== state.subjectFilter) return false;
      if (state.yearFilter    && s.year    !== state.yearFilter)     return false;
      if (q && !s.name.toLowerCase().includes(q))                    return false;
      return true;
    });

    applySort();
  }

  function applySort() {
    const col = state.sortCol;
    const dir = state.sortDir === 'asc' ? 1 : -1;

    state.filtered.sort((a, b) => {
      const av = a[col];
      const bv = b[col];
      if (typeof av === 'string') return av.localeCompare(bv, 'ar') * dir;
      return (av - bv) * dir;
    });

    state.page = 1;
    renderTable();
    updateStats();
  }

  // ── Render Table ───────────────────────────────────────────────────────────
  function renderTable() {
    const tbody     = $('tableBody');
    const noResults = $('noResults');
    const tableEl   = $('dataTable');

    if (state.filtered.length === 0) {
      tableEl.classList.add('hidden');
      noResults.classList.remove('hidden');
      updatePagination();
      return;
    }

    tableEl.classList.remove('hidden');
    noResults.classList.add('hidden');

    const start = (state.page - 1) * state.pageSize;
    const end   = Math.min(start + state.pageSize, state.filtered.length);
    const rows  = state.filtered.slice(start, end);

    tbody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    rows.forEach((s, idx) => {
      const tr = document.createElement('tr');
      tr.style.animationDelay = `${idx * 18}ms`;

      const gc = gradeClass(s.grandTotal);

      tr.innerHTML = `
        <td class="col-num">${start + idx + 1}</td>
        <td class="col-name" style="text-align:start">
          <span class="student-name">${s.name}</span>
        </td>
        <td><span class="stage-tag">${translateStage(s.stage)}</span></td>
        <td style="font-size:.8rem;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${translateSubject(s.subject)}">${translateSubject(s.subject)}</td>
        <td><span class="year-tag">${s.year}</span></td>
        <td>${badge(s.quizzesTotal, 20)}</td>
        <td>${badge(s.reportsTotal, 20)}</td>
        <td>${badge(s.activitiesTotal, 40)}</td>
        <td>${badge(s.exam, 50)}</td>
        <td>${badge(s.attendance, 5)}</td>
        <td>${badge(s.participation, 5)}</td>
        <td>${badge(s.supportTotal, 10)}</td>
        <td>
          <span class="grade-badge ${gc}" title="${gradeLabel(s.grandTotal)}">
            ${s.grandTotal}
          </span>
        </td>
      `;

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    updatePagination();

    // Update showing range
    $('showingFrom').textContent = state.filtered.length ? start + 1 : 0;
    $('showingTo').textContent   = end;
    $('totalCount').textContent  = state.filtered.length;
  }

  function badge(val, max) {
    const pct = (val / max) * 100;
    let cls = 'pass';
    if (pct >= 90) cls = 'excellent';
    else if (pct >= 80) cls = 'very-good';
    else if (pct >= 70) cls = 'good';
    else if (pct >= 60) cls = 'pass';
    else cls = 'fail';
    return `<span class="grade-badge ${cls}">${val}</span>`;
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  function updateStats() {
    const total    = state.allStudents.length;
    const filtered = state.filtered.length;

    $('totalStudentsStat').textContent  = total.toLocaleString();
    $('filteredCountStat').textContent  = filtered.toLocaleString();

    if (filtered === 0) {
      $('avgGradeStat').textContent  = '—';
      $('passRateStat').textContent  = '—';
      return;
    }

    const avg  = state.filtered.reduce((s, r) => s + r.grandTotal, 0) / filtered;
    const pass = state.filtered.filter(r => r.grandTotal >= 60).length;

    $('avgGradeStat').textContent  = avg.toFixed(1);
    $('passRateStat').textContent  = Math.round((pass / filtered) * 100) + '%';
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  function updatePagination() {
    const total     = state.filtered.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    const curPage    = state.page;

    $('prevBtn').disabled = curPage <= 1;
    $('nextBtn').disabled = curPage >= totalPages;

    // Page info text
    const infoTpl  = t('pageInfo');
    $('pageInfo').textContent = infoTpl
      .replace('{current}', curPage)
      .replace('{total}',   totalPages);

    // Page number buttons
    const container = $('pageNumbers');
    container.innerHTML = '';

    const pages = buildPageList(curPage, totalPages);
    pages.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'page-num' + (p === curPage ? ' active' : '') + (p === '…' ? ' dots' : '');
      btn.textContent = p === '…' ? '…' : p;
      if (p !== '…') {
        btn.addEventListener('click', () => {
          state.page = p;
          renderTable();
          scrollToResults();
        });
      }
      container.appendChild(btn);
    });
  }

  function buildPageList(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const list = [];
    list.push(1);
    if (cur > 3) list.push('…');
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) list.push(p);
    if (cur < total - 2) list.push('…');
    list.push(total);
    return list;
  }

  function scrollToResults() {
    $('dataTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Sort handler ───────────────────────────────────────────────────────────
  function handleSort(col) {
    if (state.sortCol === col) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortCol = col;
      state.sortDir = 'asc';
    }
    updateSortIndicators();
    applySort();
  }

  function updateSortIndicators() {
    $$('#dataTable thead th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      const ind = th.querySelector('.sort-indicator');
      if (ind) ind.textContent = '↕';
    });

    const activeTh = document.querySelector(`#dataTable thead th[data-col="${state.sortCol}"]`);
    if (activeTh) {
      activeTh.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      const ind = activeTh.querySelector('.sort-indicator');
      if (ind) ind.textContent = state.sortDir === 'asc' ? '▲' : '▼';
    }
  }

  // ── Theme Toggle ───────────────────────────────────────────────────────────
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    $('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('uniTheme', theme); } catch (_) {}
  }

  // ── Language Switch ────────────────────────────────────────────────────────
  function setLanguage(lang) {
    state.lang = lang;
    applyTranslations();
    populateSubjectFilter();
    renderTable();
    try { localStorage.setItem('uniLang', lang); } catch (_) {}
  }

  // ── Search / Filter ────────────────────────────────────────────────────────
  function runSearch() {
    state.searchQuery   = $('searchInput').value;
    state.stageFilter   = $('stageFilter').value;
    state.subjectFilter = $('subjectFilter').value;
    state.yearFilter    = $('yearFilter').value;
    state.page = 1;
    applyFilters();
  }

  function resetAll() {
    $('searchInput').value  = '';
    $('stageFilter').value  = '';
    $('subjectFilter').value = '';
    $('yearFilter').value   = '';
    state.searchQuery   = '';
    state.stageFilter   = '';
    state.subjectFilter = '';
    state.yearFilter    = '';
    state.sortCol = 'id';
    state.sortDir = 'asc';
    state.page    = 1;
    updateSortIndicators();
    populateSubjectFilter();
    applyFilters();
  }

  // ── Event Listeners ─────────────────────────────────────────────────────────
  function initEvents() {
    // Search button
    $('searchBtn').addEventListener('click', runSearch);

    // Enter key on search input
    $('searchInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') runSearch();
    });

    // Live search (debounced)
    let searchTimer;
    $('searchInput').addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(runSearch, 280);
      $('clearSearch').style.opacity = $('searchInput').value ? '1' : '0';
    });

    // Clear search button
    $('clearSearch').addEventListener('click', () => {
      $('searchInput').value = '';
      $('clearSearch').style.opacity = '0';
      state.searchQuery = '';
      runSearch();
    });

    // Stage filter change → repopulate subjects
    $('stageFilter').addEventListener('change', () => {
      state.stageFilter = $('stageFilter').value;
      populateSubjectFilter();
      runSearch();
    });

    // Subject / Year filter change
    $('subjectFilter').addEventListener('change', runSearch);
    $('yearFilter').addEventListener('change', runSearch);

    // Reset button
    $('resetBtn').addEventListener('click', resetAll);

    // Pagination
    $('prevBtn').addEventListener('click', () => {
      if (state.page > 1) { state.page--; renderTable(); scrollToResults(); }
    });
    $('nextBtn').addEventListener('click', () => {
      const totalPages = Math.ceil(state.filtered.length / state.pageSize);
      if (state.page < totalPages) { state.page++; renderTable(); scrollToResults(); }
    });

    // Page size select
    $('pageSizeSelect').addEventListener('change', e => {
      state.pageSize = parseInt(e.target.value, 10);
      state.page = 1;
      renderTable();
    });

    // Sort columns
    $$('#dataTable thead th.sortable').forEach(th => {
      th.addEventListener('click', () => handleSort(th.dataset.col));
    });

    // Theme toggle
    $('themeToggle').addEventListener('click', () => {
      setTheme(state.theme === 'light' ? 'dark' : 'light');
    });

    // Language toggle
    $('langToggle').addEventListener('click', () => {
      setLanguage(state.lang === 'ar' ? 'en' : 'ar');
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    state.allStudents = window.studentsData || [];
    state.filtered    = state.allStudents.slice();

    // Restore preferences
    try {
      const savedTheme = localStorage.getItem('uniTheme');
      const savedLang  = localStorage.getItem('uniLang');
      if (savedTheme) setTheme(savedTheme);
      if (savedLang)  setLanguage(savedLang);
    } catch (_) {}

    populateSubjectFilter();
    applyTranslations();
    applyFilters();
    initEvents();

    // Initial clear button state
    $('clearSearch').style.opacity = '0';
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
