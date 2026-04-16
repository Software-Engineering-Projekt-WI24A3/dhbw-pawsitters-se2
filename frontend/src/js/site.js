import { compile, createApp, nextTick } from '/assets/vendor/vue.esm-browser.prod.js';

let gitgraphLoader = null;
const DROPDOWN_SELECTOR = 'details.repo_menu, details.locale_menu';
const dropdownTimers = new WeakMap();
const dropdownFrames = new WeakMap();
const GIT_GRAPH_COLORS = ['#111114', '#2F5AA8', '#8A5A20', '#0F766E', '#8B3D60', '#5B6B2D'];

function createEmptyRepository() {
    return {
        generatedAt: '',
        repository: {
            owner: '',
            name: '',
            label: ''
        },
        git: {
            remoteUrl: '',
            repository: {
                owner: '',
                name: '',
                label: ''
            },
            branch: '',
            defaultBranch: '',
            totalCommits: 0,
            mergeCommits: 0,
            branchCount: 0,
            contributorCount: 0,
            authors: [],
            activity: {
                week: [],
                month: [],
                year: []
            },
            activityRanges: {
                week: '',
                month: '',
                year: ''
            },
            branches: [],
            branchGraphs: {},
            projectGraph: {
                branch: '',
                graphImport: [],
                recentCommits: [],
                lastCommitDate: '',
                lastCommitLabel: ''
            },
            lastCommitDate: '',
            lastCommitLabel: ''
        },
        board: {
            cards: [],
            columns: [],
            summary: {
                openCount: 0,
                assignedCount: 0,
                ownerCount: 0,
                criteriaCount: 0
            },
            owners: [],
            emptyText: ''
        }
    };
}

function normalizeRepository(repository) {
    const empty = createEmptyRepository();
    const source = repository && typeof repository === 'object' ? repository : {};
    const sourceRepository = source.repository && typeof source.repository === 'object' ? source.repository : {};
    const sourceGit = source.git && typeof source.git === 'object' ? source.git : {};
    const sourceGitRepository = sourceGit.repository && typeof sourceGit.repository === 'object' ? sourceGit.repository : {};
    const sourceGitActivity = sourceGit.activity && typeof sourceGit.activity === 'object' ? sourceGit.activity : {};
    const sourceGitRanges = sourceGit.activityRanges && typeof sourceGit.activityRanges === 'object' ? sourceGit.activityRanges : {};
    const sourceBoard = source.board && typeof source.board === 'object' ? source.board : {};
    const sourceBoardSummary = sourceBoard.summary && typeof sourceBoard.summary === 'object' ? sourceBoard.summary : {};

    const extractGitHubLogin = (value) => {
        if (typeof value !== 'string') {
            return '';
        }

        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }

        const directLoginPattern = /^[A-Za-z0-9-]+(?:\[bot\])?$/;
        if (directLoginPattern.test(trimmed)) {
            return trimmed;
        }

        const profileMatch = trimmed.match(/^https?:\/\/github\.com\/([A-Za-z0-9-]+(?:\[bot\])?)\/?$/i);
        if (profileMatch?.[1]) {
            return profileMatch[1];
        }

        return '';
    };

    const githubAvatarFromLogin = (login) => {
        if (!login) {
            return '';
        }
        return `https://avatars.githubusercontent.com/${encodeURIComponent(login)}?size=80`;
    };

    const normalizeAuthorWithFallback = (author) => {
        if (!author || typeof author !== 'object') {
            return author;
        }

        const login = extractGitHubLogin(author.profileUrl);

        return {
            ...author,
            avatarUrl: author.avatarUrl || githubAvatarFromLogin(login)
        };
    };

    const normalizeRecentCommitWithFallback = (commit) => {
        if (!commit || typeof commit !== 'object') {
            return commit;
        }

        const login = extractGitHubLogin(commit.profileUrl);

        return {
            ...commit,
            avatarUrl: commit.avatarUrl || githubAvatarFromLogin(login)
        };
    };

    const sourceBranchGraphs = sourceGit.branchGraphs && typeof sourceGit.branchGraphs === 'object' ? sourceGit.branchGraphs : {};
    const normalizedBranchGraphs = Object.fromEntries(
        Object.entries(sourceBranchGraphs).map(([branchName, graph]) => {
            const safeGraph = graph && typeof graph === 'object' ? graph : {};
            const recentCommits = Array.isArray(safeGraph.recentCommits)
                ? safeGraph.recentCommits.map(normalizeRecentCommitWithFallback)
                : [];

            return [branchName, {
                ...safeGraph,
                graphImport: Array.isArray(safeGraph.graphImport) ? safeGraph.graphImport : [],
                recentCommits
            }];
        })
    );

    const sourceProjectGraph = sourceGit.projectGraph && typeof sourceGit.projectGraph === 'object'
        ? sourceGit.projectGraph
        : {};

    return {
        ...empty,
        ...source,
        repository: {
            ...empty.repository,
            ...sourceRepository
        },
        git: {
            ...empty.git,
            ...sourceGit,
            repository: {
                ...empty.git.repository,
                ...sourceGitRepository
            },
            authors: Array.isArray(sourceGit.authors) ? sourceGit.authors.map(normalizeAuthorWithFallback) : [],
            activity: {
                ...empty.git.activity,
                ...sourceGitActivity
            },
            activityRanges: {
                ...empty.git.activityRanges,
                ...sourceGitRanges
            },
            branches: Array.isArray(sourceGit.branches) ? sourceGit.branches : [],
            branchGraphs: normalizedBranchGraphs,
            projectGraph: {
                ...empty.git.projectGraph,
                ...sourceProjectGraph,
                graphImport: Array.isArray(sourceProjectGraph.graphImport) ? sourceProjectGraph.graphImport : [],
                recentCommits: Array.isArray(sourceProjectGraph.recentCommits)
                    ? sourceProjectGraph.recentCommits.map(normalizeRecentCommitWithFallback)
                    : []
            }
        },
        board: {
            ...empty.board,
            ...sourceBoard,
            cards: Array.isArray(sourceBoard.cards) ? sourceBoard.cards : [],
            columns: Array.isArray(sourceBoard.columns) ? sourceBoard.columns : [],
            summary: {
                ...empty.board.summary,
                ...sourceBoardSummary
            },
            owners: Array.isArray(sourceBoard.owners) ? sourceBoard.owners : []
        }
    };
}

function ensureGitgraphLibrary() {
    if (window.GitgraphJS) {
        return Promise.resolve(window.GitgraphJS);
    }

    if (gitgraphLoader) {
        return gitgraphLoader;
    }

    gitgraphLoader = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-gitgraph-loader]');

        if (existing) {
            existing.addEventListener('load', () => resolve(window.GitgraphJS), { once: true });
            existing.addEventListener('error', () => {
                gitgraphLoader = null;
                reject(new Error('Failed to load GitgraphJS.'));
            }, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = '/assets/vendor/gitgraph.umd.min.js';
        script.async = true;
        script.dataset.gitgraphLoader = 'true';
        script.addEventListener('load', () => resolve(window.GitgraphJS), { once: true });
        script.addEventListener('error', () => {
            gitgraphLoader = null;
            reject(new Error('Failed to load GitgraphJS.'));
        }, { once: true });
        document.head.append(script);
    });

    return gitgraphLoader;
}

function readRepositoryBootstrap() {
    const bootstrap = document.querySelector('[data-repository-bootstrap]');
    const raw = bootstrap?.getAttribute('data-repository-bootstrap')?.trim()
        || bootstrap?.textContent?.trim();

    if (!raw) {
        return createEmptyRepository();
    }

    try {
        return normalizeRepository(JSON.parse(raw));
    } catch {
        return createEmptyRepository();
    }
}

function pickPreferredBoard(repository) {
    const columns = repository.board.columns;
    return columns[0]?.id ?? 'frontend';
}

function pickPreferredBranch(repository) {
    const branches = repository.git.branches;

    if (branches.some((branch) => branch.name === 'develop')) {
        return 'develop';
    }

    return repository.git.defaultBranch || branches[0]?.name || '';
}

function sanitizePopupText(value) {
    if (typeof value !== 'string') {
        return '';
    }

    const collapsed = value
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!collapsed) {
        return '';
    }

    const knownPopupNoise = [
        /Repository\s+DE\s+Einloggen\s+Playwright(?:-Tests)?\s+Git\s+Kanban Board/i,
        /GESAMTER\s+PROJEKTGRAPH/i,
        /PAWSITTERS\.\s*RUHIGES INTERFACE/i
    ];

    if (knownPopupNoise.some((pattern) => pattern.test(collapsed))) {
        return '';
    }

    return collapsed;
}

function formatLocalDateTime(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat(document.documentElement.lang || 'de', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function formatDurationMs(value) {
    const durationMs = Number(value);
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
        return '';
    }

    if (durationMs < 1000) {
        return `${Math.round(durationMs)}ms`;
    }

    if (durationMs < 60_000) {
        return `${(durationMs / 1000).toFixed(1)}s`;
    }

    const minutes = Math.floor(durationMs / 60_000);
    const seconds = Math.round((durationMs % 60_000) / 1000);
    return `${minutes}m ${seconds}s`;
}

const appShellTemplate = document.querySelector('#app-shell')?.innerHTML ?? '';
const appShellRender = appShellTemplate ? compile(appShellTemplate) : () => null;
const initialRepository = readRepositoryBootstrap();

const appRoot = document.querySelector('#app-shell');
const playwrightRunnerRoot = document.querySelector('[data-playwright-runner]');
const defaultPlaywrightStatusLabels = {
    idle: 'Ready',
    pending: 'Pending',
    running: 'Running',
    passed: 'Passed',
    failed: 'Failed',
    skipped: 'Skipped'
};

const localizedPlaywrightStatusLabels = {
    idle: playwrightRunnerRoot?.getAttribute('data-status-idle') || defaultPlaywrightStatusLabels.idle,
    pending: playwrightRunnerRoot?.getAttribute('data-status-pending') || defaultPlaywrightStatusLabels.pending,
    running: playwrightRunnerRoot?.getAttribute('data-status-running') || defaultPlaywrightStatusLabels.running,
    passed: playwrightRunnerRoot?.getAttribute('data-status-passed') || defaultPlaywrightStatusLabels.passed,
    failed: playwrightRunnerRoot?.getAttribute('data-status-failed') || defaultPlaywrightStatusLabels.failed,
    skipped: playwrightRunnerRoot?.getAttribute('data-status-skipped') || defaultPlaywrightStatusLabels.skipped
};

const localizedPlaywrightNeverLabel = playwrightRunnerRoot?.getAttribute('data-last-run-never') || 'No run yet';

createApp({
    render: appShellRender,
    data() {
        const repository = normalizeRepository(initialRepository);

        return {
            menuOpen: false,
            scrolled: false,
            gitView: 'activity',
            boardView: pickPreferredBoard(repository),
            gitActivityRange: 'week',
            selectedBranch: pickPreferredBranch(repository),
            repository,
            repositoryLoading: Boolean(document.querySelector('[data-repository-live]')),
            repositoryRefreshing: false,
            repositoryError: '',
            repositoryRefreshAbortController: null,
            repositoryRefreshRequestId: 0,
            gitGraphSignature: '',
            gitGraphWidth: 0,
            selectedGitCommitHash: '',
            hoveredGitCommitHash: '',
            gitGraphTooltip: {
                visible: false,
                x: 0,
                y: 0,
                sourceX: 0,
                sourceY: 0,
                anchorX: 0,
                shortSha: '',
                dateLabel: '',
                subject: '',
                author: '',
                authorAvatarUrl: '',
                authorInitials: '',
                mergeInfo: ''
            },
            activeGitCommitModalHash: '',
            activeBoardCardKey: '',
            playwrightRunnerEnabled: Boolean(playwrightRunnerRoot),
            playwrightStatusPollingHandle: null,
            playwrightStatusLoading: false,
            playwrightRunPending: false,
            playwrightStatusError: '',
            playwrightRunId: 0,
            playwrightRunning: false,
            playwrightStartedAt: '',
            playwrightFinishedAt: '',
            playwrightExitCode: null,
            playwrightSummary: {
                total: 0,
                passed: 0,
                failed: 0,
                pending: 0,
                status: 'idle'
            },
            playwrightTests: [],
            playwrightLogs: [],
            playwrightNextLogIndex: 0,
            playwrightStatusLabels: localizedPlaywrightStatusLabels,
            playwrightNeverLabel: localizedPlaywrightNeverLabel
        };
    },
    computed: {
        currentActivityBars() {
            return this.repository.git.activity[this.gitActivityRange] || [];
        },
        currentActivityRangeLabel() {
            return this.repository.git.activityRanges[this.gitActivityRange] || this.repository.git.activityRanges.week || '';
        },
        currentProjectGraph() {
            if (this.repository.git.projectGraph?.graphImport?.length) {
                return this.repository.git.projectGraph;
            }

            const fallbackBranch = pickPreferredBranch(this.repository);
            const fallbackGraph = this.repository.git.branchGraphs[fallbackBranch];
            if (fallbackGraph) {
                return fallbackGraph;
            }

            return {
                branch: fallbackBranch,
                graphImport: [],
                recentCommits: [],
                lastCommitDate: '',
                lastCommitLabel: ''
            };
        },
        currentBoardColumn() {
            const columns = this.repository.board.columns;
            return columns.find((column) => column.id === this.boardView) || columns[0] || {
                id: '',
                label: '',
                cards: [],
                toneStyle: ''
            };
        },
        activeGitCommit() {
            if (!this.activeGitCommitModalHash) {
                return null;
            }

            const commit = this.currentProjectGraph?.recentCommits?.find((item) => item.hash === this.activeGitCommitModalHash) ?? null;
            if (!commit) {
                return null;
            }

            const cleanMessage = sanitizePopupText(commit.message);
            return {
                ...commit,
                message: cleanMessage || 'Commit'
            };
        },
        activeGitCommitGraphEntry() {
            if (!this.activeGitCommitModalHash) {
                return null;
            }

            return this.currentProjectGraph?.graphImport?.find((commit) => commit.hash === this.activeGitCommitModalHash) ?? null;
        },
        activeGitCommitRefs() {
            return this.activeGitCommitGraphEntry?.refs ?? [];
        },
        activeGitCommitParents() {
            return this.activeGitCommitGraphEntry?.parents ?? [];
        },
        activeGitCommitUrl() {
            if (!this.activeGitCommitModalHash) {
                return '';
            }

            return this.getGitCommitUrl(this.activeGitCommitModalHash);
        },
        activeBoardCard() {
            if (!this.activeBoardCardKey) {
                return null;
            }

            const card = this.repository.board.cards.find((item) => item.key === this.activeBoardCardKey) ?? null;
            if (!card) {
                return null;
            }

            const cleanDescription = sanitizePopupText(card.description || "");
            return {
                ...card,
                description: cleanDescription,
                hasDescription: Boolean(cleanDescription)
            };
        },
        playwrightLogText() {
            return this.playwrightLogs
                .map((entry) => entry?.text ?? '')
                .filter(Boolean)
                .join('\n');
        },
        playwrightLastRunLabel() {
            const reference = this.playwrightFinishedAt || this.playwrightStartedAt;
            const formatted = formatLocalDateTime(reference);
            return formatted || this.playwrightNeverLabel;
        }
    },
    mounted() {
        this.initializeRepositoryViews();
        this.initializeDropdowns();
        this.ensureRepositoryState();
        this.syncScrollState();
        this.handleResize();
        this.refreshRepositoryData();
        this.initializePlaywrightRunner();
        window.addEventListener('scroll', this.syncScrollState, { passive: true });
        window.addEventListener('resize', this.handleResize, { passive: true });
        document.addEventListener('pointerdown', this.handleDocumentPointerDown);
        document.addEventListener('keydown', this.handleDocumentKeydown);
    },
    beforeUnmount() {
        window.removeEventListener('scroll', this.syncScrollState);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
        document.removeEventListener('keydown', this.handleDocumentKeydown);
        this.closeAllDropdowns({ immediate: true });
        this.stopPlaywrightPolling();
        document.body.classList.remove('body--modal-open');
    },
    methods: {
        initializePlaywrightRunner() {
            if (!this.playwrightRunnerEnabled) {
                return;
            }

            this.fetchPlaywrightStatus({ resetLogs: true });
            this.startPlaywrightPolling();
        },
        startPlaywrightPolling() {
            if (!this.playwrightRunnerEnabled || this.playwrightStatusPollingHandle) {
                return;
            }

            this.playwrightStatusPollingHandle = window.setInterval(() => {
                this.fetchPlaywrightStatus();
            }, 1200);
        },
        stopPlaywrightPolling() {
            if (typeof this.playwrightStatusPollingHandle === 'number') {
                window.clearInterval(this.playwrightStatusPollingHandle);
            }
            this.playwrightStatusPollingHandle = null;
        },
        normalizePlaywrightPayload(payload = {}) {
            const source = payload && typeof payload === 'object' ? payload : {};
            const sourceRunner = source.runner && typeof source.runner === 'object' ? source.runner : {};
            const sourceSummary = source.summary && typeof source.summary === 'object' ? source.summary : {};
            const sourceTests = Array.isArray(source.tests) ? source.tests : [];
            const sourceLogs = Array.isArray(source.logs) ? source.logs : [];
            const allowedStatus = new Set(['idle', 'pending', 'running', 'passed', 'failed', 'skipped']);

            const tests = sourceTests.map((testCase, index) => {
                const entry = testCase && typeof testCase === 'object' ? testCase : {};
                const status = typeof entry.status === 'string' && allowedStatus.has(entry.status)
                    ? entry.status
                    : 'idle';
                return {
                    id: entry.id || `${entry.location || 'test'}-${index}`,
                    location: entry.location || '',
                    title: entry.title || '',
                    name: entry.name || entry.title || entry.location || '',
                    status,
                    durationMs: Number.isFinite(Number(entry.durationMs)) ? Number(entry.durationMs) : 0
                };
            });

            const total = Number.isFinite(Number(sourceSummary.total))
                ? Number(sourceSummary.total)
                : tests.length;
            const passed = Number.isFinite(Number(sourceSummary.passed))
                ? Number(sourceSummary.passed)
                : tests.filter((entry) => entry.status === 'passed').length;
            const failed = Number.isFinite(Number(sourceSummary.failed))
                ? Number(sourceSummary.failed)
                : tests.filter((entry) => entry.status === 'failed').length;
            const pending = Number.isFinite(Number(sourceSummary.pending))
                ? Number(sourceSummary.pending)
                : Math.max(0, total - passed - failed);

            let status = typeof sourceSummary.status === 'string' && allowedStatus.has(sourceSummary.status)
                ? sourceSummary.status
                : 'idle';

            const running = Boolean(sourceRunner.running);
            if (running) {
                status = 'running';
            } else if (failed > 0) {
                status = 'failed';
            } else if (total > 0 && passed >= total && pending === 0) {
                status = 'passed';
            } else if (pending > 0) {
                status = 'pending';
            } else if (total > 0) {
                status = 'passed';
            }

            return {
                runId: Number.isFinite(Number(sourceRunner.runId)) ? Number(sourceRunner.runId) : 0,
                running,
                startedAt: sourceRunner.startedAt || '',
                finishedAt: sourceRunner.finishedAt || '',
                exitCode: Number.isInteger(sourceRunner.exitCode) ? sourceRunner.exitCode : null,
                summary: {
                    total,
                    passed,
                    failed,
                    pending,
                    status
                },
                tests,
                logs: sourceLogs.map((entry, index) => {
                    const logEntry = entry && typeof entry === 'object' ? entry : {};
                    return {
                        index: Number.isFinite(Number(logEntry.index)) ? Number(logEntry.index) : index,
                        stream: logEntry.stream === 'stderr' ? 'stderr' : 'stdout',
                        text: typeof logEntry.text === 'string' ? logEntry.text : '',
                        time: logEntry.time || ''
                    };
                }).filter((entry) => entry.text.trim().length > 0),
                nextLogIndex: Number.isFinite(Number(source.nextLogIndex))
                    ? Number(source.nextLogIndex)
                    : sourceLogs.length
            };
        },
        applyPlaywrightStatus(payload = {}, options = {}) {
            if (!this.playwrightRunnerEnabled) {
                return;
            }

            const normalized = this.normalizePlaywrightPayload(payload);
            const runChanged = normalized.runId !== this.playwrightRunId;
            const resetLogs = options.resetLogs === true || runChanged;
            const mergedLogs = resetLogs
                ? [...normalized.logs]
                : [...this.playwrightLogs, ...normalized.logs];

            this.playwrightRunId = normalized.runId;
            this.playwrightRunning = normalized.running;
            this.playwrightStartedAt = normalized.startedAt;
            this.playwrightFinishedAt = normalized.finishedAt;
            this.playwrightExitCode = normalized.exitCode;
            this.playwrightSummary = normalized.summary;
            this.playwrightTests = normalized.tests;
            this.playwrightNextLogIndex = normalized.nextLogIndex;
            this.playwrightLogs = mergedLogs.slice(-1400);

            if (normalized.logs.length > 0 || resetLogs) {
                this.scrollPlaywrightLogsToEnd();
            }
        },
        scrollPlaywrightLogsToEnd() {
            window.requestAnimationFrame(() => {
                const consoleNode = document.querySelector('[data-playwright-log-console]');
                if (!consoleNode) {
                    return;
                }

                consoleNode.scrollTop = consoleNode.scrollHeight;
            });
        },
        playwrightLabelForStatus(status) {
            return this.playwrightStatusLabels[status] || this.playwrightStatusLabels.idle || defaultPlaywrightStatusLabels.idle;
        },
        playwrightFormatDuration(value) {
            return formatDurationMs(value);
        },
        async fetchPlaywrightStatus(options = {}) {
            if (!this.playwrightRunnerEnabled) {
                return;
            }

            if (this.playwrightStatusLoading && options.force !== true) {
                return;
            }

            const from = options.resetLogs === true ? 0 : Math.max(0, this.playwrightNextLogIndex);
            this.playwrightStatusLoading = true;

            try {
                const response = await fetch(`/api/tests/e2e/status.json?from=${from}`, {
                    headers: {
                        Accept: 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache'
                    },
                    cache: 'no-store'
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.message || `Playwright status request failed with ${response.status}`);
                }

                this.playwrightStatusError = '';
                this.applyPlaywrightStatus(data, {
                    resetLogs: options.resetLogs === true
                });
            } catch (error) {
                this.playwrightStatusError = error?.message || 'Playwright status request failed.';
            } finally {
                this.playwrightStatusLoading = false;
            }
        },
        async runPlaywrightTests() {
            if (!this.playwrightRunnerEnabled || this.playwrightRunPending || this.playwrightRunning) {
                return;
            }

            this.playwrightRunPending = true;

            try {
                const response = await fetch('/api/tests/e2e/run', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok && response.status !== 409) {
                    throw new Error(data.message || `Playwright run request failed with ${response.status}`);
                }

                this.playwrightStatusError = '';
                this.applyPlaywrightStatus(data, { resetLogs: true });
                await this.fetchPlaywrightStatus({ force: true });
            } catch (error) {
                this.playwrightStatusError = error?.message || 'Playwright run request failed.';
            } finally {
                this.playwrightRunPending = false;
            }
        },
        toggleMenu() {
            this.menuOpen = !this.menuOpen;

            if (!this.menuOpen) {
                this.closeAllDropdowns();
            }
        },
        closeMenu() {
            this.menuOpen = false;
            this.closeAllDropdowns();
        },
        syncModalBodyLock() {
            document.body.classList.toggle(
                'body--modal-open',
                Boolean(this.activeGitCommitModalHash || this.activeBoardCardKey)
            );
        },
        closeRepositoryModal() {
            this.activeGitCommitModalHash = '';
            this.activeBoardCardKey = '';
            this.syncModalBodyLock();
        },
        getDropdowns() {
            return Array.from(document.querySelectorAll(DROPDOWN_SELECTOR));
        },
        initializeDropdowns() {
            this.getDropdowns().forEach((details) => {
                const summary = details.querySelector('summary');

                if (!summary || details.dataset.dropdownInitialized === 'true') {
                    return;
                }

                details.dataset.dropdownInitialized = 'true';
                details.classList.remove('is-open');
                this.setDropdownExpanded(details, false);

                summary.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.toggleDropdown(details);
                });
            });
        },
        setDropdownExpanded(details, expanded) {
            const summary = details.querySelector('summary');

            if (summary) {
                summary.setAttribute('aria-expanded', String(expanded));
            }
        },
        clearDropdownAnimation(details) {
            const timeoutId = dropdownTimers.get(details);

            if (typeof timeoutId === 'number') {
                window.clearTimeout(timeoutId);
                dropdownTimers.delete(details);
            }

            const frameIds = dropdownFrames.get(details) ?? [];
            frameIds.forEach((frameId) => window.cancelAnimationFrame(frameId));
            dropdownFrames.delete(details);
        },
        toggleDropdown(details) {
            if (!details) {
                return;
            }

            if (details.classList.contains('is-open')) {
                this.closeDropdown(details);
                return;
            }

            this.openDropdown(details);
        },
        openDropdown(details) {
            if (!details) {
                return;
            }

            this.closeAllDropdowns({ exclude: details });
            this.clearDropdownAnimation(details);
            details.open = true;
            this.setDropdownExpanded(details, true);

            const frameIds = [];
            frameIds.push(window.requestAnimationFrame(() => {
                frameIds.push(window.requestAnimationFrame(() => {
                    details.classList.add('is-open');
                    dropdownFrames.delete(details);
                }));
            }));
            dropdownFrames.set(details, frameIds);
        },
        closeDropdown(details, options = {}) {
            if (!details) {
                return;
            }

            const { immediate = false } = options;

            this.clearDropdownAnimation(details);
            this.setDropdownExpanded(details, false);

            if (immediate) {
                details.classList.remove('is-open');
                details.open = false;
                return;
            }

            if (!details.open && !details.classList.contains('is-open')) {
                return;
            }

            details.classList.remove('is-open');

            const timeoutId = window.setTimeout(() => {
                details.open = false;
                dropdownTimers.delete(details);
            }, 340);

            dropdownTimers.set(details, timeoutId);
        },
        closeAllDropdowns(options = {}) {
            const { exclude = null, immediate = false } = options;

            this.getDropdowns().forEach((details) => {
                if (details === exclude) {
                    return;
                }

                this.closeDropdown(details, { immediate });
            });
        },
        handleDocumentPointerDown(event) {
            if (event.target.closest(DROPDOWN_SELECTOR)) {
                return;
            }

            this.closeAllDropdowns();
        },
        handleDocumentKeydown(event) {
            if (event.key !== 'Escape') {
                return;
            }

            if (this.activeGitCommitModalHash || this.activeBoardCardKey) {
                this.closeRepositoryModal();
                return;
            }

            this.closeAllDropdowns();
        },
        initializeRepositoryViews() {
            const segmentedGroups = document.querySelectorAll('[data-segmented]');

            segmentedGroups.forEach((group) => {
                const property = group.getAttribute('data-segmented');
                const configuredValue = group.getAttribute('data-active');
                const firstButton = group.querySelector('[data-segmented-value]');
                const firstValue = firstButton?.getAttribute('data-segmented-value');

                if (!property) {
                    return;
                }

                const currentValue = this[property];
                const hasCurrentButton = currentValue
                    ? group.querySelector(`[data-segmented-value="${currentValue}"]`)
                    : null;

                if (!hasCurrentButton) {
                    this[property] = configuredValue || firstValue || currentValue;
                }
            });

            nextTick(() => {
                this.updateSegmentedIndicators();
            });
        },
        ensureRepositoryState() {
            const nextBoardView = pickPreferredBoard(this.repository);
            const nextBranch = pickPreferredBranch(this.repository);
            const boardIds = new Set(this.repository.board.columns.map((column) => column.id));
            const boardCardKeys = new Set(this.repository.board.cards.map((card) => card.key));
            const branchNames = new Set(this.repository.git.branches.map((branch) => branch.name));
            const activityRanges = new Set(Object.keys(this.repository.git.activity));

            if (!boardIds.has(this.boardView)) {
                this.boardView = nextBoardView;
            }

            if (!branchNames.has(this.selectedBranch)) {
                this.selectedBranch = nextBranch;
            }

            if (!activityRanges.has(this.gitActivityRange)) {
                this.gitActivityRange = 'week';
            }

            const recentCommitHashes = new Set((this.currentProjectGraph?.recentCommits ?? []).map((commit) => commit.hash));
            if (this.selectedGitCommitHash && !recentCommitHashes.has(this.selectedGitCommitHash)) {
                this.selectedGitCommitHash = '';
            }
            if (this.activeGitCommitModalHash && !recentCommitHashes.has(this.activeGitCommitModalHash)) {
                this.activeGitCommitModalHash = '';
            }
            if (this.activeBoardCardKey && !boardCardKeys.has(this.activeBoardCardKey)) {
                this.activeBoardCardKey = '';
            }
            this.syncModalBodyLock();

            nextTick(() => {
                this.initializeDropdowns();
                this.updateSegmentedIndicators();

                if (this.gitView === 'graph') {
                    this.renderGitGraph(true);
                }
            });
        },
        async clearBrowserRepositoryCaches() {
            const tasks = [];

            if (typeof window !== 'undefined' && 'caches' in window) {
                tasks.push((async () => {
                    const cacheKeys = await window.caches.keys();
                    await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
                })());
            }

            if (typeof window !== 'undefined' && window.localStorage) {
                tasks.push(Promise.resolve().then(() => {
                    window.localStorage.clear();
                }));
            }

            if (typeof window !== 'undefined' && window.sessionStorage) {
                tasks.push(Promise.resolve().then(() => {
                    window.sessionStorage.clear();
                }));
            }

            await Promise.allSettled(tasks);
        },
        async triggerRepositoryRefresh() {
            if (this.repositoryRefreshing) {
                return;
            }

            this.repositoryRefreshing = true;

            try {
                await this.clearBrowserRepositoryCaches();
                await this.refreshRepositoryData({
                    forceFresh: true
                });
                if (this.repositoryError) {
                    await this.refreshRepositoryData({
                        forceFresh: true
                    });
                }
            } finally {
                this.repositoryRefreshing = false;
            }
        },
        async refreshRepositoryData(options = {}) {
            if (!document.querySelector('[data-repository-live]')) {
                return;
            }

            const localeFromQuery = new URLSearchParams(window.location.search).get('locale');
            const locale = localeFromQuery || document.documentElement.lang || 'de';
            const forceFresh = options.forceFresh === true;
            const requestId = this.repositoryRefreshRequestId + 1;
            this.repositoryRefreshRequestId = requestId;

            if (this.repositoryRefreshAbortController) {
                this.repositoryRefreshAbortController.abort();
            }
            const abortController = new AbortController();
            this.repositoryRefreshAbortController = abortController;

            this.repositoryLoading = true;

            try {
                const params = new URLSearchParams({
                    locale
                });
                if (forceFresh) {
                    params.set('refresh', '1');
                    params.set('_', Date.now().toString(36));
                }

                const response = await fetch(`/api/repository/live.json?${params.toString()}`, {
                    headers: {
                        Accept: 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache'
                    },
                    cache: 'no-store',
                    signal: abortController.signal
                });

                if (!response.ok) {
                    throw new Error(`Live repository request failed with ${response.status}`);
                }

                const data = await response.json();

                if (data?.error) {
                    throw new Error(data.message || data.error);
                }

                if (requestId !== this.repositoryRefreshRequestId) {
                    return;
                }
                this.repository = normalizeRepository(data);
                this.repositoryError = '';
                this.ensureRepositoryState();
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return;
                }
                if (requestId !== this.repositoryRefreshRequestId) {
                    return;
                }
                this.repositoryError = error.message;
                this.ensureRepositoryState();
            } finally {
                if (requestId === this.repositoryRefreshRequestId) {
                    this.repositoryLoading = false;
                }
                if (this.repositoryRefreshAbortController === abortController) {
                    this.repositoryRefreshAbortController = null;
                }
            }
        },
        setSegment(property, value) {
            if (!property || !value) {
                return;
            }

            if (property === 'gitView' || property === 'boardView') {
                this.closeRepositoryModal();
            }

            this[property] = value;
            nextTick(() => {
                this.updateSegmentedIndicators();

                if (property === 'gitView' && value === 'graph') {
                    this.renderGitGraph(true);
                }
            });
        },
        selectGitActivityRange(range, event) {
            this.gitActivityRange = range;
            this.closeDetailsFromEvent(event);
        },
        selectGitBranch(branchName, event) {
            this.selectedBranch = branchName;
            this.selectedGitCommitHash = '';
            this.activeGitCommitModalHash = '';
            this.syncModalBodyLock();
            this.closeDetailsFromEvent(event);
            nextTick(() => {
                this.renderGitGraph(true);
            });
        },
        closeDetailsFromEvent(event) {
            const details = event?.currentTarget?.closest(DROPDOWN_SELECTOR);
            if (details) {
                this.closeDropdown(details);
            }
        },
        openBoardCardModal(cardKey) {
            if (!cardKey) {
                return;
            }

            this.activeBoardCardKey = cardKey;
            this.activeGitCommitModalHash = '';
            this.syncModalBodyLock();
        },
        getGithubRepositoryBase() {
            const remoteUrl = this.repository.git.remoteUrl || '';
            if (!remoteUrl) {
                return '';
            }

            if (/^https?:\/\/github\.com\//i.test(remoteUrl)) {
                return remoteUrl.replace(/\.git$/i, '');
            }

            const sshMatch = remoteUrl.match(/^git@github\.com:(.+?)(?:\.git)?$/i);
            if (sshMatch?.[1]) {
                return `https://github.com/${sshMatch[1]}`;
            }

            return '';
        },
        getGitCommitUrl(commitHash) {
            if (!commitHash) {
                return '';
            }

            const repositoryBase = this.getGithubRepositoryBase();
            if (!repositoryBase) {
                return '';
            }

            return `${repositoryBase}/commit/${commitHash}`;
        },
        getGitGraphContainer() {
            return document.querySelector('[data-gitgraph-container]');
        },
        getRecentCommitCards() {
            return Array.from(document.querySelectorAll('[data-recent-commit-hash]'));
        },
        readGitGraphData() {
            return this.currentProjectGraph?.graphImport ?? [];
        },
        readGraphCommitDetails(commitHash) {
            if (!commitHash) {
                return null;
            }

            const graphCommit = this.readGitGraphData().find((commit) => commit.hash === commitHash);
            const recentCommit = this.currentProjectGraph?.recentCommits?.find((commit) => commit.hash === commitHash);

            if (!graphCommit && !recentCommit) {
                return null;
            }

            const refs = Array.isArray(graphCommit?.refs) ? graphCommit.refs : [];
            const isMerge = refs.some((ref) => typeof ref === 'string' && ref.toLowerCase().startsWith('merge:'));
            const mergeLabel = refs.find((ref) => typeof ref === 'string' && ref.toLowerCase().startsWith('merge:')) ?? '';
            const mergeInfo = mergeLabel ? mergeLabel.replace(/^merge:\s*/i, '') : '';

            const subject = sanitizePopupText(graphCommit?.subject || recentCommit?.message || 'Commit');

            return {
                shortSha: recentCommit?.shortSha || commitHash.slice(0, 7),
                dateLabel: recentCommit?.dateLabel || '',
                subject: subject || 'Commit',
                author: recentCommit?.author || '',
                authorAvatarUrl: recentCommit?.avatarUrl || '',
                authorInitials: recentCommit?.initials || '',
                mergeInfo: isMerge ? mergeInfo : '',
                isMerge
            };
        },
        syncGitGraphPanelHeight() {
            const workspaceBody = document.querySelector('.git_graph_workspace__body');
            const container = this.getGitGraphContainer();

            if (!workspaceBody || !container) {
                return;
            }

            const svg = container.querySelector('svg');
            const svgBBox = typeof svg?.getBBox === 'function' ? svg.getBBox() : null;
            const svgBBoxHeight = svgBBox ? Math.ceil(svgBBox.y + svgBBox.height) : 0;
            const graphRectHeight = Math.max(
                svgBBoxHeight,
                svg?.getBoundingClientRect?.().height ?? 0,
                container.scrollHeight,
                0
            );
            const requiredHeight = Math.max(420, Math.ceil(graphRectHeight + 56));

            workspaceBody.style.setProperty('--git-graph-panel-height', `${requiredHeight}px`);
        },
        clearCustomGitBranchLabels() {
            const labelLayer = document.querySelector('[data-git-branch-labels]');
            if (labelLayer) {
                labelLayer.innerHTML = '';
            }
        },
        renderCustomGitBranchLabels() {
            const container = this.getGitGraphContainer();
            const labelLayer = document.querySelector('[data-git-branch-labels]');
            if (!container || !labelLayer) {
                return;
            }

            labelLayer.innerHTML = '';

            const branches = this.repository.git.branches
                .filter((branch) => typeof branch?.name === 'string' && branch.name.trim() && typeof branch?.hash === 'string' && branch.hash.trim());
            if (!branches.length) {
                return;
            }

            const panelRect = labelLayer.getBoundingClientRect();
            const labelOffset = 18;

            branches.forEach((branch) => {
                const headNode = this.getGraphCommitNode(branch.hash);
                if (!headNode) {
                    return;
                }

                const nodeRect = headNode.getBoundingClientRect();
                const x = Math.round(nodeRect.right - panelRect.left + labelOffset);
                const y = Math.round(nodeRect.top - panelRect.top + (nodeRect.height / 2));

                const label = document.createElement('button');
                label.type = 'button';
                label.className = 'git_graph_branch_label';
                label.textContent = branch.name;
                label.title = branch.name;
                const branchColor = this.getBranchLabelColor(branch, branches);
                label.style.color = branchColor;
                label.style.borderColor = branchColor;
                label.style.left = `${x}px`;
                label.style.top = `${y}px`;
                label.addEventListener('click', () => {
                    this.selectGitBranch(branch.name);
                });

                labelLayer.append(label);
            });
        },
        bindGitGraphBranchLabelTracking() {
            const container = this.getGitGraphContainer();
            if (!container || container.dataset.graphBranchLabelsBound === 'true') {
                return;
            }

            container.dataset.graphBranchLabelsBound = 'true';

            let queued = false;
            container.addEventListener('scroll', () => {
                if (queued) {
                    return;
                }
                queued = true;
                requestAnimationFrame(() => {
                    queued = false;
                    this.renderCustomGitBranchLabels();
                });
            }, { passive: true });
        },
        getGraphCommitDotColor(commitHash) {
            const container = this.getGitGraphContainer();
            const svg = container?.querySelector('svg');
            if (!svg || !commitHash || typeof window.getComputedStyle !== 'function') {
                return '';
            }

            const normalizeColor = (value) => {
                if (typeof value !== 'string') {
                    return '';
                }

                const normalized = value.trim().toLowerCase();
                if (!normalized || normalized === 'none' || normalized === 'transparent') {
                    return '';
                }

                return normalized;
            };

            const escapedHash = window.CSS && typeof window.CSS.escape === 'function'
                ? window.CSS.escape(commitHash)
                : commitHash;

            const dot = svg.querySelector(`circle[id="${escapedHash}"]`);
            if (!dot) {
                return '';
            }

            return normalizeColor(dot.getAttribute('fill'))
                || normalizeColor(window.getComputedStyle(dot).fill);
        },
        getBranchLabelColor(branch, branches = []) {
            const node = this.getGraphCommitNode(branch?.hash);
            const fallbackColor = GIT_GRAPH_COLORS[
                Math.max(0, branches.findIndex((item) => item?.name === branch?.name)) % GIT_GRAPH_COLORS.length
            ] || GIT_GRAPH_COLORS[0];

            if (!node || typeof window.getComputedStyle !== 'function') {
                return fallbackColor;
            }

            const normalizeColor = (value) => {
                if (typeof value !== 'string') {
                    return '';
                }

                const normalized = value.trim().toLowerCase();
                if (!normalized || normalized === 'none' || normalized === 'transparent') {
                    return '';
                }

                return normalized;
            };

            const dotColor = this.getGraphCommitDotColor(branch?.hash);
            if (dotColor) {
                return dotColor;
            }

            const isLikelyBlack = (value) => {
                const normalized = normalizeColor(value);
                if (!normalized) {
                    return false;
                }
                return normalized === '#000'
                    || normalized === '#000000'
                    || normalized === 'black'
                    || normalized === 'rgb(0, 0, 0)'
                    || normalized === 'rgba(0, 0, 0, 1)';
            };

            const attributeColor = normalizeColor(node.getAttribute('stroke'))
                || normalizeColor(node.getAttribute('fill'));
            if (attributeColor) {
                return attributeColor;
            }

            const computed = window.getComputedStyle(node);
            const computedStroke = normalizeColor(computed?.stroke);
            const computedFill = normalizeColor(computed?.fill);
            const color = computedStroke || computedFill;

            if (!color || isLikelyBlack(color)) {
                return fallbackColor;
            }

            return color;
        },
        hideGitGraphTooltip() {
            this.gitGraphTooltip.visible = false;
        },
        showGitGraphTooltip(commitHash, target, pointer = null) {
            const panel = document.querySelector('.git_graph_canvas_panel');
            const details = this.readGraphCommitDetails(commitHash);

            if (!panel || !target || !details) {
                this.hideGitGraphTooltip();
                return;
            }

            const panelRect = panel.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const sourceX = Number.isFinite(pointer?.x)
                ? Math.round(pointer.x - panelRect.left)
                : Math.round(targetRect.left - panelRect.left + (targetRect.width / 2));
            const sourceY = Number.isFinite(pointer?.y)
                ? Math.round(pointer.y - panelRect.top)
                : Math.round(targetRect.top - panelRect.top + (targetRect.height / 2));
            const targetX = Math.min(Math.max(sourceX + 10, 8), Math.max(panelRect.width - 280, 8));
            const targetY = Math.max(sourceY - 12, 10);
            const anchorX = sourceX - targetX;

            this.gitGraphTooltip = {
                visible: true,
                x: targetX,
                y: targetY,
                sourceX,
                sourceY,
                anchorX,
                shortSha: details.shortSha,
                dateLabel: details.dateLabel,
                subject: details.subject,
                author: details.author,
                authorAvatarUrl: details.authorAvatarUrl,
                authorInitials: details.authorInitials,
                mergeInfo: details.mergeInfo
            };
        },
        isVisibleGraphNode(element) {
            if (!element || typeof element.getBoundingClientRect !== 'function') {
                return false;
            }

            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        },
        getGraphCommitNode(commitHash) {
            const container = this.getGitGraphContainer();
            if (!container || !commitHash) {
                return null;
            }

            const escapedHash = window.CSS && typeof window.CSS.escape === 'function'
                ? window.CSS.escape(commitHash)
                : commitHash;

            const visibleUse = Array.from(container.querySelectorAll(`use[href="#${escapedHash}"], use[xlink\\:href="#${escapedHash}"]`))
                .find((node) => this.isVisibleGraphNode(node));
            if (visibleUse) {
                return visibleUse;
            }

            const visibleCircle = Array.from(container.querySelectorAll(`circle[id="${escapedHash}"]`))
                .find((node) => this.isVisibleGraphNode(node));
            return visibleCircle || null;
        },
        getGraphCommitElements() {
            const container = this.getGitGraphContainer();
            if (!container) {
                return [];
            }

            const validHashes = new Set(this.readGitGraphData().map((commit) => commit.hash));
            if (!validHashes.size) {
                return [];
            }

            const elementsByHash = new Map();
            const addElement = (hash, element, prefer = false) => {
                if (!hash || !element || !validHashes.has(hash)) {
                    return;
                }

                const rect = element.getBoundingClientRect();
                if (!rect.width || !rect.height) {
                    return;
                }

                if (elementsByHash.has(hash) && !prefer) {
                    return;
                }

                elementsByHash.set(hash, {
                    hash,
                    element,
                    cx: rect.left + (rect.width / 2),
                    cy: rect.top + (rect.height / 2)
                });
            };

            // Prefer visible <use> nodes because <circle id> can live in <defs>.
            validHashes.forEach((hash) => {
                const escapedHash = window.CSS && typeof window.CSS.escape === 'function'
                    ? window.CSS.escape(hash)
                    : hash;

                const useNode = Array.from(container.querySelectorAll(`use[href="#${escapedHash}"], use[xlink\\:href="#${escapedHash}"]`))
                    .find((node) => this.isVisibleGraphNode(node));
                if (useNode) {
                    addElement(hash, useNode, true);
                    return;
                }

                const circleNode = Array.from(container.querySelectorAll(`circle[id="${escapedHash}"]`))
                    .find((node) => this.isVisibleGraphNode(node));
                addElement(hash, circleNode);
            });

            return Array.from(elementsByHash.values());
        },
        resolveCommitFromPointer(event) {
            const container = this.getGitGraphContainer();
            if (!container || !event) {
                return null;
            }

            const validHashes = new Set(this.readGitGraphData().map((commit) => commit.hash));
            if (!validHashes.size) {
                return null;
            }

            const directTarget = event.target?.closest?.('circle[id], use[href], use[xlink\\:href]');
            if (directTarget) {
                const hash = directTarget.tagName?.toLowerCase() === 'circle'
                    ? directTarget.getAttribute('id')
                    : (directTarget.getAttribute('href') || directTarget.getAttribute('xlink:href') || '').replace(/^#/, '');

                if (hash && validHashes.has(hash)) {
                    const interactiveTarget = this.getGraphCommitNode(hash) || directTarget;
                    return { hash, target: interactiveTarget };
                }
            }

            const points = this.getGraphCommitElements();
            if (!points.length) {
                return null;
            }

            const pointerX = event.clientX;
            const pointerY = event.clientY;
            let best = null;
            let bestDistance = Number.POSITIVE_INFINITY;

            points.forEach((point) => {
                const dx = point.cx - pointerX;
                const dy = point.cy - pointerY;
                const distance = Math.hypot(dx, dy);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = point;
                }
            });

            if (!best || bestDistance > 24) {
                return null;
            }

            return { hash: best.hash, target: best.element };
        },
        scrollRecentCommitIntoView(commitHash) {
            const targetCard = this.getRecentCommitCards().find((card) => card.getAttribute('data-recent-commit-hash') === commitHash);
            if (!targetCard) {
                return;
            }

            targetCard.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        },
        scrollGraphCommitIntoView(commitHash) {
            const graphNode = this.getGraphCommitNode(commitHash);
            if (!graphNode) {
                return;
            }

            graphNode.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        },
        syncGraphCommitHighlight() {
            const container = this.getGitGraphContainer();
            if (!container) {
                return;
            }

            const activeHash = this.selectedGitCommitHash;
            const circles = container.querySelectorAll('circle[id]');
            const uses = container.querySelectorAll('use');

            circles.forEach((circle) => {
                const isActive = Boolean(activeHash) && circle.id === activeHash;
                circle.classList.toggle('git_graph_node--active', isActive);
            });

            uses.forEach((useElement) => {
                const href = useElement.getAttribute('href') || useElement.getAttribute('xlink:href') || '';
                const isActive = Boolean(activeHash) && href === `#${activeHash}`;
                useElement.classList.toggle('git_graph_node--active', isActive);
            });
        },
        clearGraphCommitHover() {
            const container = this.getGitGraphContainer();
            if (!container) {
                return;
            }

            this.hoveredGitCommitHash = '';
            container.querySelectorAll('.git_graph_node--hover').forEach((node) => {
                node.classList.remove('git_graph_node--hover');
            });
            this.hideGitGraphTooltip();
        },
        syncGraphCommitHover(commitHash, target, event = null) {
            const container = this.getGitGraphContainer();
            if (!container) {
                return;
            }

            if (this.hoveredGitCommitHash === commitHash && this.gitGraphTooltip.visible) {
                this.showGitGraphTooltip(
                    commitHash,
                    this.getGraphCommitNode(commitHash) || target,
                    event ? { x: event.clientX, y: event.clientY } : null
                );
                return;
            }

            this.clearGraphCommitHover();

            if (!commitHash) {
                return;
            }

            const targetCircle = this.getGraphCommitNode(commitHash);
            if (targetCircle) {
                targetCircle.classList.add('git_graph_node--hover');
            }

            container.querySelectorAll('use').forEach((useElement) => {
                const href = useElement.getAttribute('href') || useElement.getAttribute('xlink:href') || '';
                if (href === `#${commitHash}`) {
                    useElement.classList.add('git_graph_node--hover');
                }
            });

            this.hoveredGitCommitHash = commitHash;
            const anchor = targetCircle || target;
            this.showGitGraphTooltip(commitHash, anchor, event ? { x: event.clientX, y: event.clientY } : null);
        },
        bindGitGraphInteractions() {
            const container = this.getGitGraphContainer();
            if (!container || container.dataset.graphHoverBound === 'true') {
                return;
            }

            container.dataset.graphHoverBound = 'true';

            container.addEventListener('mousemove', (event) => {
                const hit = this.resolveCommitFromPointer(event);
                if (!hit) {
                    this.clearGraphCommitHover();
                    return;
                }

                this.syncGraphCommitHover(hit.hash, hit.target, event);
            });

            container.addEventListener('mouseleave', () => {
                this.clearGraphCommitHover();
            });

            container.addEventListener('click', (event) => {
                const hit = this.resolveCommitFromPointer(event);
                if (!hit?.hash) {
                    return;
                }

                this.openGitCommitModal(hit.hash, { scrollFeed: true });
            });
        },
        selectGitCommit(commitHash, options = {}) {
            if (!commitHash) {
                return;
            }

            const { scrollFeed = false, scrollGraph = false } = options;

            this.selectedGitCommitHash = commitHash;

            window.requestAnimationFrame(() => {
                this.syncGraphCommitHighlight();

                if (scrollFeed) {
                    this.scrollRecentCommitIntoView(commitHash);
                }

                if (scrollGraph) {
                    this.scrollGraphCommitIntoView(commitHash);
                }
            });
        },
        openGitCommitModal(commitHash, options = {}) {
            if (!commitHash) {
                return;
            }

            this.selectGitCommit(commitHash, options);
            this.activeGitCommitModalHash = commitHash;
            this.activeBoardCardKey = '';
            this.syncModalBodyLock();
        },
        selectGitCommitFromFeed(commitHash, event) {
            if (event?.target?.closest('a[href]')) {
                return;
            }

            this.openGitCommitModal(commitHash, { scrollGraph: true });
        },
        async renderGitGraph(force = false) {
            if (this.gitView !== 'graph') {
                return;
            }

            const container = this.getGitGraphContainer();

            try {
                await ensureGitgraphLibrary();
            } catch {
                return;
            }

            const GitgraphJS = window.GitgraphJS;

            if (!container || !GitgraphJS) {
                return;
            }

            const width = Math.round(container.getBoundingClientRect().width);
            if (width <= 0) {
                return;
            }

            const graphData = this.readGitGraphData();
            if (graphData.length === 0) {
                container.innerHTML = '';
                this.clearCustomGitBranchLabels();
                this.selectedGitCommitHash = '';
                this.activeGitCommitModalHash = '';
                this.syncModalBodyLock();
                return;
            }

            const graphHashes = new Set(graphData.map((commit) => commit.hash));
            if (this.selectedGitCommitHash && !graphHashes.has(this.selectedGitCommitHash)) {
                this.selectedGitCommitHash = '';
            }
            if (this.activeGitCommitModalHash && !graphHashes.has(this.activeGitCommitModalHash)) {
                this.activeGitCommitModalHash = '';
                this.syncModalBodyLock();
            }

            const signature = JSON.stringify([
                this.selectedBranch,
                ...graphData.map((commit) => [commit.hash, commit.subject, commit.refs, commit.parents])
            ]);

            if (!force && this.gitGraphSignature === signature && this.gitGraphWidth === width) {
                return;
            }

            const template = GitgraphJS.templateExtend(GitgraphJS.TemplateName.Metro, {
                colors: GIT_GRAPH_COLORS,
                branch: {
                    lineWidth: 3,
                    spacing: 44,
                    mergeStyle: GitgraphJS.MergeStyle.Bezier,
                    label: {
                        display: false,
                        font: '600 11pt Instrument Sans, sans-serif',
                        strokeColor: 'transparent',
                        bgColor: '#ffffff',
                        borderRadius: 18
                    }
                },
                commit: {
                    spacing: 44,
                    hasTooltipInCompactMode: false,
                    dot: {
                        size: 14,
                        strokeWidth: 4,
                        strokeColor: '#ffffff',
                        font: '600 10pt Instrument Sans, sans-serif'
                    },
                    message: {
                        display: false,
                        displayAuthor: false,
                        displayHash: false,
                        font: '500 11pt Instrument Sans, sans-serif'
                    }
                },
                tag: {
                    font: '600 10pt Instrument Sans, sans-serif',
                    color: '#111114',
                    bgColor: '#ffffff',
                    strokeColor: 'rgba(17, 17, 19, 0.12)',
                    borderRadius: 14,
                    pointerWidth: 10
                }
            });

            container.innerHTML = '';
            container.removeAttribute('style');

            const gitgraph = GitgraphJS.createGitgraph(container, {
                template,
                mode: GitgraphJS.Mode.Compact,
                branchLabelOnEveryCommit: false
            });

            const interactiveGraphData = graphData.map((commit) => ({
                ...commit,
                onClick: () => {
                    this.openGitCommitModal(commit.hash, { scrollFeed: true });
                }
            }));

            gitgraph.import(interactiveGraphData);
            this.bindGitGraphInteractions();
            this.bindGitGraphBranchLabelTracking();
            this.gitGraphSignature = signature;
            this.gitGraphWidth = width;

            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    this.syncGitGraphPanelHeight();
                    this.renderCustomGitBranchLabels();
                    this.syncGraphCommitHighlight();
                });
            });
        },
        syncSegmentPanels(property, activeValue) {
            document.querySelectorAll(`[data-segment-panel="${property}"]`).forEach((panel) => {
                const isActive = panel.getAttribute('data-segment-value') === activeValue;

                panel.hidden = !isActive;
                panel.style.display = isActive ? '' : 'none';
                panel.setAttribute('aria-hidden', String(!isActive));
            });
        },
        updateSegmentedIndicators() {
            const segmentedGroups = document.querySelectorAll('[data-segmented]');

            segmentedGroups.forEach((group) => {
                const property = group.getAttribute('data-segmented');
                const firstButton = group.querySelector('[data-segmented-value]');
                const fallbackValue = group.getAttribute('data-active')
                    || firstButton?.getAttribute('data-segmented-value')
                    || null;
                const activeValue = property ? (this[property] || fallbackValue) : fallbackValue;
                const activeButton = activeValue
                    ? group.querySelector(`[data-segmented-value="${activeValue}"]`)
                    : firstButton;
                const indicator = group.querySelector('.repository_segmented__indicator');
                const buttons = group.querySelectorAll('[data-segmented-value]');

                buttons.forEach((button) => {
                    const isActive = button.getAttribute('data-segmented-value') === activeValue;

                    button.classList.toggle('repository_segmented__button--active', isActive);
                    button.setAttribute('aria-pressed', String(isActive));
                });

                if (!indicator) {
                    if (property && activeValue) {
                        this.syncSegmentPanels(property, activeValue);
                    }

                    return;
                }

                if (!activeButton) {
                    indicator.style.opacity = '0';

                    if (property && activeValue) {
                        this.syncSegmentPanels(property, activeValue);
                    }

                    return;
                }

                const groupRect = group.getBoundingClientRect();
                const buttonRect = activeButton.getBoundingClientRect();
                group.style.setProperty('--segment-width', `${buttonRect.width}px`);
                group.style.setProperty('--segment-x', `${buttonRect.left - groupRect.left}px`);
                indicator.style.opacity = '1';

                if (property && activeValue) {
                    this.syncSegmentPanels(property, activeValue);
                }
            });
        },
        syncScrollState() {
            this.scrolled = window.scrollY > 20;
        },
        handleResize() {
            if (window.innerWidth >= 1024) {
                this.menuOpen = false;
            }

            this.closeAllDropdowns({ immediate: true });
            this.updateSegmentedIndicators();

            if (this.gitView === 'graph') {
                this.renderGitGraph(true);
            }
        }
    }
}).mount('#app-shell');

if (appRoot) {
    appRoot.removeAttribute('v-cloak');
}
