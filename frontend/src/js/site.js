import { compile, createApp, nextTick } from '/assets/vendor/vue.esm-browser.prod.js';

let gitgraphLoader = null;
const DROPDOWN_SELECTOR = 'details.repo_menu, details.locale_menu, details.header_search_field, details.phone_country_menu';
const dropdownTimers = new WeakMap();
const dropdownFrames = new WeakMap();
const DROPDOWN_CLOSE_DELAY_MS = 90;
let dropdownIdSequence = 0;
const GIT_GRAPH_COLORS = ['#111114', '#2F5AA8', '#8A5A20', '#0F766E', '#8B3D60', '#5B6B2D'];
const GIT_GRAPH_FALLBACK_EDGE_GUTTER_PX = 84;
const GIT_GRAPH_LABEL_OFFSET_PX = 18;
const GIT_GRAPH_MIN_CONTENT_WIDTH_PX = 360;
const GIT_GRAPH_TOOLTIP_MARGIN_PX = 8;
const GIT_GRAPH_TOOLTIP_POINTER_OFFSET_X_PX = 10;
const GIT_GRAPH_TOOLTIP_POINTER_OFFSET_Y_PX = 12;
const GIT_GRAPH_TOOLTIP_MAX_WIDTH_REM = 21;
const METRIC_ANIMATION_DURATION_MS = 2200;
const NOTIFICATION_LIMIT = 4;
const NOTIFICATION_LIFETIME_MS = 7000;
const HEADER_SEARCH_CITY_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const HEADER_SEARCH_PET_ENDPOINTS = ['/api/pets/choices', '/api/pets/choices.json', '/assets/data/pet-choices.json'];
const PHONE_COUNTRY_PREFIX_ENDPOINTS = ['/assets/data/country-phone-prefixes.json'];
const HEADER_SEARCH_SESSION_STORAGE_KEY = 'pawsitters.header-search-state';
const REDIRECT_NOTIFICATION_STORAGE_KEY = 'pawsitters.redirect-notification';
const REDIRECT_REGISTER_EMAIL_STORAGE_KEY = 'pawsitters.redirect-register-email';
const PHONE_COUNTRY_DEFAULT_BY_LOCALE = {
    de: 'DE',
    en: 'US',
    ro: 'RO'
};
const BACKEND_STATUS_ENDPOINT = '/api/auth/session';
const BACKEND_STATUS_POLL_INTERVAL_MS = 30000;
const LOADING_INDICATOR_DELAY_MS = 320;
const REGISTER_STEPS = ['account', 'profile', 'pets'];
const MY_OFFERS_CREATE_STEPS = ['setup', 'species', 'details', 'review'];
const CALENDAR_MIN_YEAR = 1901;
const CALENDAR_GENERAL_FUTURE_YEAR_OFFSET = 10;
const CALENDAR_HEADER_SEARCH_FUTURE_YEAR_OFFSET = 100;
const ROUTE_GUARD_REGISTER_PATTERN = /^\/(?:(?:de|en|ro)\/)?register$/i;
const ROUTE_GUARD_PROFILE_BASE_PATTERN = /^\/(?:(?:de|en|ro)\/)?profile$/i;
const ROUTE_GUARD_MY_PETS_PATTERN = /^\/(?:(?:de|en|ro)\/)?profile\/my-pets$/i;
const ROUTE_GUARD_MY_OFFERS_PATTERN = /^\/(?:(?:de|en|ro)\/)?profile\/my-offers$/i;
const ROUTE_GUARD_SETTINGS_PATTERN = /^\/(?:(?:de|en|ro)\/)?profile\/settings$/i;
const DEFAULT_PROFILE_PICTURE_PATH = '/assets/media/pawsitters-scene.svg';
const LEGACY_DEFAULT_PROFILE_PICTURE_PATH = '/assets/media/favicon.png';
const HEADER_SEARCH_CITY_FEATURE_CODES = new Set([
    'PPL',
    'PPLA',
    'PPLA2',
    'PPLA3',
    'PPLA4',
    'PPLC',
    'PPLX',
    'PPLG',
    'PPLL'
]);
const DEFAULT_PET_CHOICES = [
    'DOG',
    'CAT',
    'RABBIT',
    'HAMSTER',
    'GUINEA_PIG',
    'PARROT',
    'BUDGIE',
    'CANARY',
    'TURTLE',
    'SNAKE',
    'LIZARD',
    'FERRET',
    'RAT',
    'MOUSE',
    'FISH',
    'HORSE',
    'DONKEY',
    'GOAT',
    'CHICKEN',
    'BIRD'
];
const PET_CHOICE_TRANSLATIONS = {
    de: {
        DOG: 'Hund',
        CAT: 'Katze',
        RABBIT: 'Kaninchen',
        HAMSTER: 'Hamster',
        GUINEA_PIG: 'Meerschweinchen',
        PARROT: 'Papagei',
        BUDGIE: 'Wellensittich',
        CANARY: 'Kanarienvogel',
        TURTLE: 'Schildkröte',
        SNAKE: 'Schlange',
        LIZARD: 'Eidechse',
        FERRET: 'Frettchen',
        RAT: 'Ratte',
        MOUSE: 'Maus',
        FISH: 'Fisch',
        HORSE: 'Pferd',
        DONKEY: 'Esel',
        GOAT: 'Ziege',
        CHICKEN: 'Huhn',
        BIRD: 'Vogel'
    },
    en: {
        DOG: 'Dog',
        CAT: 'Cat',
        RABBIT: 'Rabbit',
        HAMSTER: 'Hamster',
        GUINEA_PIG: 'Guinea pig',
        PARROT: 'Parrot',
        BUDGIE: 'Budgie',
        CANARY: 'Canary',
        TURTLE: 'Turtle',
        SNAKE: 'Snake',
        LIZARD: 'Lizard',
        FERRET: 'Ferret',
        RAT: 'Rat',
        MOUSE: 'Mouse',
        FISH: 'Fish',
        HORSE: 'Horse',
        DONKEY: 'Donkey',
        GOAT: 'Goat',
        CHICKEN: 'Chicken',
        BIRD: 'Bird'
    },
    ro: {
        DOG: 'Câine',
        CAT: 'Pisică',
        RABBIT: 'Iepure',
        HAMSTER: 'Hamster',
        GUINEA_PIG: 'Porcușor de Guineea',
        PARROT: 'Papagal',
        BUDGIE: 'Peruș',
        CANARY: 'Canar',
        TURTLE: 'Țestoasă',
        SNAKE: 'Șarpe',
        LIZARD: 'Șopârlă',
        FERRET: 'Dihor',
        RAT: 'Șobolan',
        MOUSE: 'Șoarece',
        FISH: 'Pește',
        HORSE: 'Cal',
        DONKEY: 'Măgar',
        GOAT: 'Capră',
        CHICKEN: 'Găină',
        BIRD: 'Pasăre'
    }
};
const PET_CHOICE_PLURAL_TRANSLATIONS = {
    de: {
        DOG: 'Hunde',
        CAT: 'Katzen',
        RABBIT: 'Kaninchen',
        HAMSTER: 'Hamster',
        GUINEA_PIG: 'Meerschweinchen',
        PARROT: 'Papageien',
        BUDGIE: 'Wellensittiche',
        CANARY: 'Kanarienvögel',
        TURTLE: 'Schildkröten',
        SNAKE: 'Schlangen',
        LIZARD: 'Eidechsen',
        FERRET: 'Frettchen',
        RAT: 'Ratten',
        MOUSE: 'Mäuse',
        FISH: 'Fische',
        HORSE: 'Pferde',
        DONKEY: 'Esel',
        GOAT: 'Ziegen',
        CHICKEN: 'Hühner',
        BIRD: 'Vögel'
    },
    en: {
        DOG: 'Dogs',
        CAT: 'Cats',
        RABBIT: 'Rabbits',
        HAMSTER: 'Hamsters',
        GUINEA_PIG: 'Guinea pigs',
        PARROT: 'Parrots',
        BUDGIE: 'Budgies',
        CANARY: 'Canaries',
        TURTLE: 'Turtles',
        SNAKE: 'Snakes',
        LIZARD: 'Lizards',
        FERRET: 'Ferrets',
        RAT: 'Rats',
        MOUSE: 'Mice',
        FISH: 'Fish',
        HORSE: 'Horses',
        DONKEY: 'Donkeys',
        GOAT: 'Goats',
        CHICKEN: 'Chickens',
        BIRD: 'Birds'
    },
    ro: {
        DOG: 'Câini',
        CAT: 'Pisici',
        RABBIT: 'Iepuri',
        HAMSTER: 'Hamsteri',
        GUINEA_PIG: 'Porcușori de Guineea',
        PARROT: 'Papagali',
        BUDGIE: 'Peruși',
        CANARY: 'Canari',
        TURTLE: 'Țestoase',
        SNAKE: 'Șerpi',
        LIZARD: 'Șopârle',
        FERRET: 'Dihori',
        RAT: 'Șobolani',
        MOUSE: 'Șoareci',
        FISH: 'Pești',
        HORSE: 'Cai',
        DONKEY: 'Măgari',
        GOAT: 'Capre',
        CHICKEN: 'Găini',
        BIRD: 'Păsări'
    }
};
const PET_CHOICE_EMOJI_ASSET_PATHS = {
    DOG: '/assets/media/animal-mammal/1F436.svg',
    CAT: '/assets/media/animal-mammal/1F431.svg',
    RABBIT: '/assets/media/animal-mammal/1F430.svg',
    HAMSTER: '/assets/media/animal-mammal/1F439.svg',
    GUINEA_PIG: '/assets/media/animal-mammal/1F42D.svg',
    PARROT: '/assets/media/animal-bird/1F99C.svg',
    BUDGIE: '/assets/media/animal-bird/1F426.svg',
    CANARY: '/assets/media/animal-bird/1F426.svg',
    TURTLE: '/assets/media/animal-reptile/1F422.svg',
    SNAKE: '/assets/media/animal-reptile/1F40D.svg',
    LIZARD: '/assets/media/animal-reptile/1F98E.svg',
    FERRET: '/assets/media/animal-mammal/1F9A1.svg',
    RAT: '/assets/media/animal-mammal/1F400.svg',
    MOUSE: '/assets/media/animal-mammal/1F401.svg',
    FISH: '/assets/media/animal-marine/1F41F.svg',
    HORSE: '/assets/media/animal-mammal/1F434.svg',
    DONKEY: '/assets/media/animal-mammal/1FACF.svg',
    GOAT: '/assets/media/animal-mammal/1F410.svg',
    CHICKEN: '/assets/media/animal-bird/1F414.svg',
    BIRD: '/assets/media/animal-bird/1F426.svg'
};
const PET_CHOICE_EMOJI_FALLBACK_ASSET_PATH = '/assets/media/animal-mammal/1F43E.svg';
const HEADER_SCROLL_PROGRESS_RANGE_PX = 84;
const HEADER_SCROLL_COMPACT_ENTER_PX = 22;
const HEADER_SCROLL_COMPACT_EXIT_PX = 8;
const HEADER_SCROLL_PROGRESS_EPSILON = 0.0015;
const HEADER_SCROLL_PROGRESS_PRECISION = 360;
const HEADER_SCROLL_PROGRESS_LOW_PERF_PRECISION = 90;
const HEADER_LOW_PERFORMANCE_MAX_CORES = 4;
const HEADER_LOW_PERFORMANCE_MAX_MEMORY_GB = 4;
const headerScrollAnimationState = {
    progress: 0,
    appliedProgress: Number.NaN
};

function quantizeHeaderProgress(value, precision = HEADER_SCROLL_PROGRESS_PRECISION) {
    const numericValue = Number(value);
    const clamped = Number.isFinite(numericValue)
        ? Math.min(1, Math.max(0, numericValue))
        : 0;
    const numericPrecision = Number(precision);
    const safePrecision = Number.isFinite(numericPrecision) && numericPrecision > 0
        ? numericPrecision
        : HEADER_SCROLL_PROGRESS_PRECISION;

    return Math.round(clamped * safePrecision) / safePrecision;
}
const METRIC_GROUP_FIELDS = {
    git: ['totalCommits', 'mergeCommits', 'contributorCount', 'branchCount'],
    board: ['openCount', 'assignedCount', 'ownerCount', 'criteriaCount'],
    playwright: ['total', 'passed', 'failed', 'pending']
};
const METRIC_GROUP_SELECTORS = {
    git: '.git_metrics',
    board: '.board_metrics',
    playwright: '.playwright_metrics'
};
const SVG_NS = 'http://www.w3.org/2000/svg';
const THREAD_BACKGROUND_VIEWBOX_WIDTH = 1600;
const THREAD_BACKGROUND_EDGE_BLEED = 220;
const THREAD_BACKGROUND_SEGMENT_HEIGHT = 760;
const THREAD_BACKGROUND_MIN_HEIGHT = 1080;
const THREAD_BACKGROUND_COVERAGE_BUFFER = 460;
const THREAD_BACKGROUND_LANE_POINT_MIN_STEP = 116;
const THREAD_BACKGROUND_LANE_POINT_MAX_STEP = 198;
const THREAD_BACKGROUND_SEED = 0x8f7f19ab;
const THREAD_BACKGROUND_LANES = [
    { anchorX: 72, spread: 286, waveLength: 540, pull: 0.33, phase: 0.28, glow: true },
    { anchorX: 308, spread: 312, waveLength: 505, pull: 0.34, phase: 1.06, glow: false },
    { anchorX: 546, spread: 272, waveLength: 624, pull: 0.3, phase: 1.9, glow: true },
    { anchorX: 884, spread: 296, waveLength: 584, pull: 0.33, phase: 2.44, glow: false },
    { anchorX: 1174, spread: 258, waveLength: 548, pull: 0.31, phase: 2.88, glow: true },
    { anchorX: 1448, spread: 236, waveLength: 506, pull: 0.29, phase: 3.42, glow: false }
];

function mixThreadUint32(value) {
    let hash = value >>> 0;
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^ (hash >>> 16)) >>> 0;
}

function threadNoise01(...parts) {
    let hash = THREAD_BACKGROUND_SEED;

    parts.forEach((part, index) => {
        const numeric = Number(part);
        const normalized = Number.isFinite(numeric) ? Math.round(numeric * 1000) : 0;
        const mixed = mixThreadUint32((normalized + 0x9e3779b9 + index * 97) >>> 0);
        hash = mixThreadUint32(hash ^ mixed);
    });

    return hash / 4294967295;
}

function threadNoiseRange(min, max, ...parts) {
    return min + (max - min) * threadNoise01(...parts);
}

function clampThreadValue(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function roundThreadValue(value) {
    return Math.round(value * 10) / 10;
}

function createThreadSvgElement(tagName, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tagName);

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, String(value));
    });

    return element;
}

function createThreadLaneState(laneIndex) {
    const lane = THREAD_BACKGROUND_LANES[laneIndex];
    const startPoint = {
        x: roundThreadValue(
            lane.anchorX + threadNoiseRange(-lane.spread * 0.22, lane.spread * 0.22, laneIndex, -1, 0)
        ),
        y: -THREAD_BACKGROUND_EDGE_BLEED
    };

    return {
        lane,
        laneIndex,
        points: [startPoint],
        linePathElement: createThreadSvgElement('path'),
        glowPathElement: lane.glow ? createThreadSvgElement('path') : null
    };
}

function appendThreadLanePointsToY(laneState, targetY) {
    const { lane, laneIndex, points } = laneState;

    while (points[points.length - 1].y < targetY) {
        const pointIndex = points.length;
        const previousPoint = points[pointIndex - 1];
        const rawStep = threadNoiseRange(
            THREAD_BACKGROUND_LANE_POINT_MIN_STEP,
            THREAD_BACKGROUND_LANE_POINT_MAX_STEP,
            laneIndex,
            pointIndex,
            10
        );
        const nextY = previousPoint.y + rawStep;
        const primaryWave = Math.sin((nextY / lane.waveLength) + lane.phase) * lane.spread * 0.34;
        const secondaryWave = Math.sin((nextY / (lane.waveLength * 0.47)) + lane.phase * 1.8) * lane.spread * 0.16;
        const pullTarget = lane.anchorX
            + primaryWave
            + secondaryWave
            + threadNoiseRange(-lane.spread * 0.4, lane.spread * 0.4, laneIndex, pointIndex, 11);
        const jitter = threadNoiseRange(-40, 40, laneIndex, pointIndex, 12);
        const nextX = clampThreadValue(
            previousPoint.x + ((pullTarget - previousPoint.x) * lane.pull) + jitter,
            -THREAD_BACKGROUND_EDGE_BLEED,
            THREAD_BACKGROUND_VIEWBOX_WIDTH + THREAD_BACKGROUND_EDGE_BLEED
        );

        points.push({
            x: roundThreadValue(nextX),
            y: roundThreadValue(nextY)
        });
    }
}

function buildThreadPath(points) {
    if (!Array.isArray(points) || points.length < 2) {
        return '';
    }

    let pathData = `M ${points[0].x} ${points[0].y}`;

    for (let index = 0; index < points.length - 1; index += 1) {
        const p0 = points[Math.max(0, index - 1)];
        const p1 = points[index];
        const p2 = points[index + 1];
        const p3 = points[Math.min(points.length - 1, index + 2)];
        const c1x = roundThreadValue(p1.x + (p2.x - p0.x) / 6);
        const c1y = roundThreadValue(p1.y + (p2.y - p0.y) / 6);
        const c2x = roundThreadValue(p2.x - (p3.x - p1.x) / 6);
        const c2y = roundThreadValue(p2.y - (p3.y - p1.y) / 6);

        pathData += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
    }

    return pathData;
}

function updateThreadLanePath(laneState) {
    const pathData = buildThreadPath(laneState.points);
    if (!pathData) {
        return;
    }

    laneState.linePathElement.setAttribute('d', pathData);
    laneState.glowPathElement?.setAttribute('d', pathData);
}

function sampleThreadPointAtY(points, targetY) {
    if (!Array.isArray(points) || points.length === 0) {
        return null;
    }

    if (targetY <= points[0].y) {
        return { ...points[0] };
    }

    for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];

        if (targetY > current.y) {
            continue;
        }

        const denominator = current.y - previous.y;
        if (Math.abs(denominator) < 0.0001) {
            return { ...current };
        }

        const ratio = clampThreadValue((targetY - previous.y) / denominator, 0, 1);
        return {
            x: roundThreadValue(previous.x + (current.x - previous.x) * ratio),
            y: roundThreadValue(previous.y + (current.y - previous.y) * ratio)
        };
    }

    return { ...points[points.length - 1] };
}

function buildThreadConnectorPath(fromPoint, toPoint, connectorSeedA, connectorSeedB) {
    const controlX = roundThreadValue(
        ((fromPoint.x + toPoint.x) / 2) + threadNoiseRange(-118, 118, connectorSeedA, connectorSeedB, 31)
    );
    const controlY = roundThreadValue(
        ((fromPoint.y + toPoint.y) / 2) + threadNoiseRange(-66, 66, connectorSeedA, connectorSeedB, 32)
    );

    return `M ${fromPoint.x} ${fromPoint.y} Q ${controlX} ${controlY} ${toPoint.x} ${toPoint.y}`;
}

function appendThreadSegment(state, segmentIndex) {
    const segmentStartY = segmentIndex * THREAD_BACKGROUND_SEGMENT_HEIGHT;
    const segmentEndY = segmentStartY + THREAD_BACKGROUND_SEGMENT_HEIGHT;
    const laneCount = state.laneStates.length;

    state.laneStates.forEach((laneState) => {
        appendThreadLanePointsToY(laneState, segmentEndY + THREAD_BACKGROUND_EDGE_BLEED);
        updateThreadLanePath(laneState);
    });

    const connectorCount = Math.max(2, Math.round(threadNoiseRange(2.1, 4.3, segmentIndex, 20)));
    for (let connectorIndex = 0; connectorIndex < connectorCount; connectorIndex += 1) {
        const laneA = Math.floor(threadNoiseRange(0, laneCount, segmentIndex, connectorIndex, 21));
        const direction = threadNoise01(segmentIndex, connectorIndex, 22) > 0.5 ? 1 : -1;
        const laneGap = 1 + Math.floor(threadNoiseRange(0, Math.min(2.99, laneCount - 1), segmentIndex, connectorIndex, 23));
        const laneB = (laneA + (direction * laneGap) + (laneCount * 4)) % laneCount;

        if (laneA === laneB) {
            continue;
        }

        const connectorY = segmentStartY + threadNoiseRange(88, THREAD_BACKGROUND_SEGMENT_HEIGHT - 88, segmentIndex, connectorIndex, 24);
        const fromPoint = sampleThreadPointAtY(
            state.laneStates[laneA].points,
            connectorY + threadNoiseRange(-34, 34, segmentIndex, connectorIndex, 25)
        );
        const toPoint = sampleThreadPointAtY(
            state.laneStates[laneB].points,
            connectorY + threadNoiseRange(-34, 34, segmentIndex, connectorIndex, 26)
        );

        if (!fromPoint || !toPoint) {
            continue;
        }

        const horizontalDistance = Math.abs(fromPoint.x - toPoint.x);
        if (horizontalDistance < 112 || horizontalDistance > 690) {
            continue;
        }

        const connectorPath = buildThreadConnectorPath(fromPoint, toPoint, segmentIndex, connectorIndex);
        state.lineGroup.append(createThreadSvgElement('path', { d: connectorPath }));

        if (threadNoise01(segmentIndex, connectorIndex, 27) > 0.83) {
            state.glowGroup.append(createThreadSvgElement('path', { d: connectorPath }));
        }
    }

    const nodeCount = Math.max(3, Math.round(threadNoiseRange(3.3, 6.6, segmentIndex, 40)));
    for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex += 1) {
        const laneIndex = Math.floor(threadNoiseRange(0, laneCount, segmentIndex, nodeIndex, 41));
        const nodeY = segmentStartY + threadNoiseRange(54, THREAD_BACKGROUND_SEGMENT_HEIGHT - 54, segmentIndex, nodeIndex, 42);
        const anchorPoint = sampleThreadPointAtY(
            state.laneStates[laneIndex].points,
            nodeY + threadNoiseRange(-22, 22, segmentIndex, nodeIndex, 43)
        );

        if (!anchorPoint) {
            continue;
        }

        if (threadNoise01(segmentIndex, nodeIndex, 44) < 0.34) {
            continue;
        }

        state.nodeGroup.append(createThreadSvgElement('circle', {
            cx: roundThreadValue(anchorPoint.x + threadNoiseRange(-11, 11, segmentIndex, nodeIndex, 45)),
            cy: roundThreadValue(anchorPoint.y + threadNoiseRange(-10, 10, segmentIndex, nodeIndex, 46)),
            r: roundThreadValue(threadNoiseRange(5.4, 9.6, segmentIndex, nodeIndex, 47))
        }));
    }
}

function readThreadBackgroundHostHeight(host) {
    const elementRectHeight = Math.ceil(host.getBoundingClientRect().height);
    const elementOffsetHeight = Math.ceil(host.offsetHeight || 0);
    const elementScrollHeight = Math.ceil(host.scrollHeight || 0);
    const documentHeight = Math.ceil(Math.max(
        document.documentElement?.scrollHeight || 0,
        document.body?.scrollHeight || 0,
        elementRectHeight,
        elementOffsetHeight,
        elementScrollHeight
    ));

    return Math.max(
        window.innerHeight,
        documentHeight,
        elementRectHeight,
        elementOffsetHeight,
        elementScrollHeight,
        THREAD_BACKGROUND_MIN_HEIGHT
    );
}

function createThreadBackgroundController() {
    const svg = document.querySelector('[data-thread-background]');
    const host = document.querySelector('.site_background');
    const glowGroup = svg?.querySelector('.site_background__glow');
    const lineGroup = svg?.querySelector('.site_background__lines');
    const nodeGroup = svg?.querySelector('.site_background__nodes');

    if (!svg || !host || !glowGroup || !lineGroup || !nodeGroup) {
        return null;
    }

    const laneStates = THREAD_BACKGROUND_LANES.map((_, laneIndex) => createThreadLaneState(laneIndex));
    lineGroup.textContent = '';
    glowGroup.textContent = '';
    nodeGroup.textContent = '';

    laneStates.forEach((laneState) => {
        lineGroup.append(laneState.linePathElement);
        if (laneState.glowPathElement) {
            glowGroup.append(laneState.glowPathElement);
        }
    });

    const state = {
        svg,
        host,
        glowGroup,
        lineGroup,
        nodeGroup,
        laneStates,
        resizeObserver: null,
        mutationObserver: null,
        fallbackPollHandle: 0,
        rafId: 0,
        pendingForceRender: true,
        generatedSegmentCount: 0,
        lastViewHeight: 0,
        lastCoverageTarget: 0,
        handleOrientationChange: null,
        handleLoad: null
    };

    const scheduleRender = (force = false) => {
        if (force) {
            state.pendingForceRender = true;
        }

        if (state.rafId > 0) {
            return;
        }

        state.rafId = window.requestAnimationFrame(() => {
            const forceRender = state.pendingForceRender;
            state.pendingForceRender = false;
            state.rafId = 0;
            const measuredHeight = readThreadBackgroundHostHeight(state.host);
            const viewHeight = Math.max(state.lastViewHeight, measuredHeight);
            const coverageTarget = viewHeight + THREAD_BACKGROUND_COVERAGE_BUFFER;
            const shouldGrowSegments = coverageTarget > state.lastCoverageTarget;
            const requiredSegmentCount = Math.max(
                1,
                Math.ceil((coverageTarget + THREAD_BACKGROUND_EDGE_BLEED) / THREAD_BACKGROUND_SEGMENT_HEIGHT)
            );

            if (shouldGrowSegments) {
                while (state.generatedSegmentCount < requiredSegmentCount) {
                    appendThreadSegment(state, state.generatedSegmentCount);
                    state.generatedSegmentCount += 1;
                }

                state.lastCoverageTarget = coverageTarget;
            }

            if (forceRender || viewHeight > state.lastViewHeight) {
                state.svg.setAttribute('viewBox', `0 0 ${THREAD_BACKGROUND_VIEWBOX_WIDTH} ${Math.round(viewHeight)}`);
                state.lastViewHeight = viewHeight;
            }
        });
    };

    if (typeof ResizeObserver === 'function') {
        const observedNodes = [
            document.querySelector('#app-shell'),
            document.querySelector('.site_main'),
            document.querySelector('.site_footer')
        ].filter(Boolean);

        state.resizeObserver = new ResizeObserver(() => {
            scheduleRender(false);
        });
        observedNodes.forEach((node) => state.resizeObserver.observe(node));
    }

    if (typeof MutationObserver === 'function') {
        const mutationRoot = document.querySelector('#app-shell');
        if (mutationRoot) {
            state.mutationObserver = new MutationObserver(() => {
                scheduleRender(false);
            });
            state.mutationObserver.observe(mutationRoot, {
                childList: true,
                subtree: true
            });
        }
    }

    state.handleOrientationChange = () => {
        scheduleRender(true);
    };
    state.handleLoad = () => {
        scheduleRender(true);
    };

    window.addEventListener('orientationchange', state.handleOrientationChange, { passive: true });
    window.addEventListener('load', state.handleLoad, { passive: true, once: true });

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            scheduleRender(true);
        }).catch(() => {
            scheduleRender(false);
        });
    }

    if (typeof ResizeObserver !== 'function' && typeof MutationObserver !== 'function') {
        state.fallbackPollHandle = window.setInterval(() => {
            scheduleRender(false);
        }, 900);
    }

    scheduleRender(true);

    return {
        refresh(force = false) {
            scheduleRender(force);
        },
        destroy() {
            if (state.rafId > 0) {
                window.cancelAnimationFrame(state.rafId);
                state.rafId = 0;
            }

            state.resizeObserver?.disconnect();
            state.mutationObserver?.disconnect();
            if (state.fallbackPollHandle) {
                window.clearInterval(state.fallbackPollHandle);
                state.fallbackPollHandle = 0;
            }
            if (state.handleOrientationChange) {
                window.removeEventListener('orientationchange', state.handleOrientationChange);
            }
            if (state.handleLoad) {
                window.removeEventListener('load', state.handleLoad);
            }
        }
    };
}

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

function createMetricAnimationState() {
    return Object.fromEntries(
        Object.entries(METRIC_GROUP_FIELDS).map(([group, fields]) => [
            group,
            Object.fromEntries(fields.map((field) => [field, 0]))
        ])
    );
}

function normalizeMetricNumber(value) {
    const normalized = Number(value);
    if (!Number.isFinite(normalized)) {
        return 0;
    }

    return Math.max(0, Math.round(normalized));
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
    return columns[0]?.id ?? '';
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
        /Repository\s+DE\s+Einloggen\s+Playwright(?:-Tests)?\s+Git\s+API(?:-Übersicht)?\s+Kanban Board/i,
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

function parseDateInputValue(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
        return null;
    }

    const date = new Date(year, month - 1, day);
    if (
        Number.isNaN(date.getTime())
        || date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function toDateInputValue(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return '';
    }

    return [
        String(date.getFullYear()).padStart(4, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
    ].join('-');
}

function normalizeDateInputValue(value) {
    const date = parseDateInputValue(value);
    if (!date) {
        return '';
    }

    return toDateInputValue(date);
}

function getHeaderSearchDateMinInputValue(referenceDate = new Date()) {
    const normalizedReference = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
        ? new Date(referenceDate)
        : new Date();
    normalizedReference.setHours(0, 0, 0, 0);
    return toDateInputValue(normalizedReference);
}

function getHeaderSearchDateMaxInputValue(referenceDate = new Date()) {
    const normalizedReference = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
        ? new Date(referenceDate)
        : new Date();
    const maxDate = new Date(
        normalizedReference.getFullYear() + CALENDAR_HEADER_SEARCH_FUTURE_YEAR_OFFSET,
        11,
        31
    );
    maxDate.setHours(0, 0, 0, 0);
    return toDateInputValue(maxDate);
}

function isHeaderSearchDateSelectable(value, referenceDate = new Date()) {
    const normalizedValue = normalizeDateInputValue(value);
    if (!normalizedValue) {
        return false;
    }

    const minSelectableDate = getHeaderSearchDateMinInputValue(referenceDate);
    const maxSelectableDate = getHeaderSearchDateMaxInputValue(referenceDate);
    return normalizedValue >= minSelectableDate && normalizedValue <= maxSelectableDate;
}

function normalizeHeaderSearchDateRange(startValue = '', endValue = '', referenceDate = new Date()) {
    const normalizedStart = normalizeDateInputValue(startValue);
    const normalizedEnd = normalizeDateInputValue(endValue);
    let nextStart = isHeaderSearchDateSelectable(normalizedStart, referenceDate) ? normalizedStart : '';
    let nextEnd = isHeaderSearchDateSelectable(normalizedEnd, referenceDate) ? normalizedEnd : '';

    if (!nextStart) {
        nextEnd = '';
    } else if (nextEnd && nextEnd < nextStart) {
        nextEnd = nextStart;
    }

    return {
        start: nextStart,
        end: nextEnd
    };
}

function getLocaleWeekStart(locale = document.documentElement.lang || 'de') {
    try {
        const localeInfo = new Intl.Locale(locale);
        const firstDay = Number(localeInfo?.weekInfo?.firstDay);
        if (Number.isInteger(firstDay) && firstDay >= 1 && firstDay <= 7) {
            return firstDay % 7;
        }
    } catch {
        // Use monday as stable fallback.
    }

    return 1;
}

function getCalendarWeekdayLabels(locale = document.documentElement.lang || 'de') {
    const weekStart = getLocaleWeekStart(locale);
    const formatter = new Intl.DateTimeFormat(locale, {
        weekday: 'short'
    });
    const referenceSunday = new Date(Date.UTC(2024, 0, 7));

    return Array.from({ length: 7 }, (_, index) => {
        const dayOffset = (weekStart + index) % 7;
        const weekdayDate = new Date(referenceSunday);
        weekdayDate.setUTCDate(referenceSunday.getUTCDate() + dayOffset);

        return formatter.format(weekdayDate).replace(/\.$/, '');
    });
}

function formatCalendarMonthLabel(year, month, locale = document.documentElement.lang || 'de') {
    const monthDate = new Date(year, month, 1);
    if (Number.isNaN(monthDate.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric'
    }).format(monthDate);
}

function buildCalendarMonthOptions(locale = document.documentElement.lang || 'de') {
    const formatter = new Intl.DateTimeFormat(locale, {
        month: 'long'
    });

    return Array.from({ length: 12 }, (_, month) => ({
        value: month,
        label: formatter.format(new Date(2024, month, 1))
    }));
}

function buildCalendarYearOptions(maxYear, minYear = CALENDAR_MIN_YEAR) {
    const normalizedMaxYear = Number.isInteger(maxYear)
        ? maxYear
        : new Date().getFullYear();
    const normalizedMinYear = Number.isInteger(minYear)
        ? minYear
        : CALENDAR_MIN_YEAR;
    const safeStartYear = Math.max(normalizedMaxYear, normalizedMinYear);

    return Array.from(
        { length: safeStartYear - normalizedMinYear + 1 },
        (_, index) => safeStartYear - index
    );
}

function buildDateCalendarDays({
    year,
    month,
    rangeStart = '',
    rangeEnd = '',
    minSelectableDate = '',
    maxSelectableDate = '',
    locale = document.documentElement.lang || 'de'
} = {}) {
    const firstDayOfMonth = new Date(year, month, 1);
    if (Number.isNaN(firstDayOfMonth.getTime())) {
        return [];
    }

    const weekStart = getLocaleWeekStart(locale);
    const leadingDays = (firstDayOfMonth.getDay() - weekStart + 7) % 7;
    const gridStartDate = new Date(year, month, 1 - leadingDays);
    const todayIso = toDateInputValue(new Date());
    const normalizedStart = normalizeDateInputValue(rangeStart);
    const normalizedEnd = normalizeDateInputValue(rangeEnd);
    const normalizedMinSelectableDate = normalizeDateInputValue(minSelectableDate);
    const normalizedMaxSelectableDate = normalizeDateInputValue(maxSelectableDate);
    const hasFullRange = Boolean(normalizedStart && normalizedEnd);
    const rangeMin = hasFullRange
        ? (normalizedStart <= normalizedEnd ? normalizedStart : normalizedEnd)
        : '';
    const rangeMax = hasFullRange
        ? (normalizedStart <= normalizedEnd ? normalizedEnd : normalizedStart)
        : '';
    const dayFormatter = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return Array.from({ length: 42 }, (_, index) => {
        const dayDate = new Date(
            gridStartDate.getFullYear(),
            gridStartDate.getMonth(),
            gridStartDate.getDate() + index
        );
        const dayValue = toDateInputValue(dayDate);
        const isSelectedStart = Boolean(normalizedStart && dayValue === normalizedStart);
        const isSelectedEnd = Boolean(normalizedEnd && dayValue === normalizedEnd);
        const isDisabled = Boolean(
            (normalizedMinSelectableDate && dayValue < normalizedMinSelectableDate)
            || (normalizedMaxSelectableDate && dayValue > normalizedMaxSelectableDate)
        );
        const isSingleDaySelection = Boolean(
            normalizedStart
            && normalizedEnd
            && normalizedStart === normalizedEnd
            && isSelectedStart
            && isSelectedEnd
        );

        return {
            iso: dayValue,
            dayNumber: dayDate.getDate(),
            isCurrentMonth: dayDate.getMonth() === month,
            isToday: dayValue === todayIso,
            isSelectedStart,
            isSelectedEnd,
            isDisabled,
            isSingleDaySelection,
            isInRange: Boolean(hasFullRange && dayValue > rangeMin && dayValue < rangeMax),
            ariaLabel: dayFormatter.format(dayDate)
        };
    });
}

function formatSearchDate(value, locale = document.documentElement.lang || 'de') {
    const date = parseDateInputValue(value);
    if (!date) {
        return '';
    }

    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short'
    }).format(date);
}

function normalizeCountryCode(value) {
    if (typeof value !== 'string') {
        return '';
    }

    const normalized = value.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) {
        return '';
    }

    return normalized;
}

function countryCodeToFlagFileName(countryCode) {
    const normalized = normalizeCountryCode(countryCode);
    if (!normalized) {
        return '';
    }

    const codepoints = normalized
        .split('')
        .map((letter) => letter.charCodeAt(0) - 65 + 0x1f1e6)
        .map((codepoint) => codepoint.toString(16).toUpperCase());

    if (codepoints.length !== 2) {
        return '';
    }

    return `${codepoints[0]}-${codepoints[1]}.svg`;
}

function normalizeDialCode(value) {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return '';
    }

    const digits = String(value).replace(/\D/g, '');
    if (!digits) {
        return '';
    }

    return `+${digits}`;
}

function normalizePhoneNumberDigits(value) {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return '';
    }

    return String(value).replace(/\D/g, '');
}

function resolveCountryName(countryCode, locale = document.documentElement.lang || 'de') {
    const normalized = normalizeCountryCode(countryCode);
    if (!normalized) {
        return '';
    }

    try {
        const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
        return displayNames.of(normalized) || normalized;
    } catch {
        return normalized;
    }
}

function normalizePhoneCountryPrefixOptions(payload = {}, locale = document.documentElement.lang || 'de') {
    const sourceCountries = Array.isArray(payload?.countries) ? payload.countries : [];
    const seenCodes = new Set();
    const normalized = [];

    sourceCountries.forEach((entry) => {
        const source = entry && typeof entry === 'object' ? entry : {};
        const code = normalizeCountryCode(source.code);
        const dialCode = normalizeDialCode(source.dialCode ?? source.phonecode);
        if (!code || !dialCode || seenCodes.has(code)) {
            return;
        }

        const fallbackName = typeof source.name === 'string' ? source.name.trim() : '';
        const localizedName = resolveCountryName(code, locale);
        const displayName = localizedName || fallbackName || code;
        const providedFlagPath = typeof source.flagPath === 'string' ? source.flagPath.trim() : '';
        const fallbackFlagPath = `/assets/media/country-flag/${countryCodeToFlagFileName(code)}`;
        const flagPath = providedFlagPath || fallbackFlagPath;
        const searchName = [displayName, fallbackName, code, dialCode]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        normalized.push({
            code,
            dialCode,
            displayName,
            flagPath,
            searchName
        });
        seenCodes.add(code);
    });

    return normalized.sort((left, right) => left.displayName.localeCompare(right.displayName, locale));
}

function isCityFeatureCode(featureCode) {
    if (typeof featureCode !== 'string') {
        return false;
    }

    const normalized = featureCode.trim().toUpperCase();
    if (!normalized) {
        return false;
    }

    return normalized.startsWith('PPL') || HEADER_SEARCH_CITY_FEATURE_CODES.has(normalized);
}

function normalizePostalCode(value) {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return '';
    }

    const digitsOnly = String(value).replace(/\D/g, '');
    if (!digitsOnly) {
        return '';
    }

    return digitsOnly.slice(0, 5);
}

function normalizeProfilePicturePath(value) {
    if (typeof value !== 'string') {
        return '';
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return '';
    }

    // Backend reset returns a fixed placeholder asset path.
    // For avatar UI we treat this as "no custom image" so the initials fallback is shown.
    if (trimmed === DEFAULT_PROFILE_PICTURE_PATH || trimmed === LEGACY_DEFAULT_PROFILE_PICTURE_PATH) {
        return '';
    }

    if (
        /^https?:\/\//i.test(trimmed)
        || trimmed.startsWith('/')
        || /^data:/i.test(trimmed)
    ) {
        return trimmed;
    }

    return `/uploads/profiles/${trimmed}`;
}

function isDefaultProfilePicturePath(value) {
    const normalizedPath = normalizeProfilePicturePath(value);
    return !normalizedPath
        || normalizedPath === DEFAULT_PROFILE_PICTURE_PATH
        || normalizedPath === LEGACY_DEFAULT_PROFILE_PICTURE_PATH;
}

function resolveCityPostalCodeFromSource(source) {
    const fromArray = Array.isArray(source?.postcodes)
        ? source.postcodes
            .map((postcode) => normalizePostalCode(postcode))
            .find((postcode) => /^\d{5}$/.test(postcode))
        : '';
    if (fromArray) {
        return fromArray;
    }

    const directPostalCode = normalizePostalCode(source?.postal_code ?? source?.postcode ?? '');
    if (/^\d{5}$/.test(directPostalCode)) {
        return directPostalCode;
    }

    return '';
}

function normalizeCitySearchResults(payload = {}, locale = document.documentElement.lang || 'de') {
    const sourceResults = Array.isArray(payload?.results) ? payload.results : [];
    if (!sourceResults.length) {
        return [];
    }

    const normalized = [];
    const seen = new Set();

    sourceResults.forEach((entry) => {
        const source = entry && typeof entry === 'object' ? entry : {};
        const cityName = typeof source.name === 'string' ? source.name.trim() : '';
        if (!cityName || !isCityFeatureCode(source.feature_code)) {
            return;
        }

        const latitude = Number(source.latitude);
        const longitude = Number(source.longitude);
        const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

        const countryCode = normalizeCountryCode(source.country_code);
        const countryName = typeof source.country === 'string' && source.country.trim()
            ? source.country.trim()
            : resolveCountryName(countryCode, locale);
        const regionName = typeof source.admin1 === 'string' ? source.admin1.trim() : '';
        const postalCode = resolveCityPostalCodeFromSource(source);
        const fallbackFlagPath = countryCode
            ? `/assets/media/country-flag/${countryCodeToFlagFileName(countryCode)}`
            : '';
        const locationId = [
            cityName,
            regionName,
            countryCode,
            hasCoordinates ? latitude.toFixed(3) : '',
            hasCoordinates ? longitude.toFixed(3) : ''
        ].join('|');

        if (!locationId || seen.has(locationId)) {
            return;
        }

        const labelParts = [cityName];
        if (countryName) {
            labelParts.push(countryName);
        } else if (countryCode) {
            labelParts.push(countryCode);
        }

        const label = labelParts.join(', ');
        const searchName = [cityName, regionName, countryName, countryCode]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        normalized.push({
            id: locationId,
            cityName,
            countryName: countryName || countryCode,
            regionName,
            countryCode,
            postalCode,
            flagPath: fallbackFlagPath,
            label,
            searchName,
            latitude: hasCoordinates ? latitude : null,
            longitude: hasCoordinates ? longitude : null
        });
        seen.add(locationId);
    });

    return normalized.slice(0, 60);
}

function normalizeCitySearchOption(value, locale = document.documentElement.lang || 'de') {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const source = value;
    const cityName = typeof source.cityName === 'string'
        ? source.cityName.trim()
        : (typeof source.name === 'string' ? source.name.trim() : '');
    if (!cityName) {
        return null;
    }

    const regionName = typeof source.regionName === 'string'
        ? source.regionName.trim()
        : (typeof source.admin1 === 'string' ? source.admin1.trim() : '');
    const countryCode = normalizeCountryCode(source.countryCode ?? source.country_code);
    const sourceCountryName = typeof source.countryName === 'string'
        ? source.countryName.trim()
        : (typeof source.country === 'string' ? source.country.trim() : '');
    const countryName = sourceCountryName || resolveCountryName(countryCode, locale);
    const postalCode = normalizePostalCode(source.postalCode ?? source.postcode ?? source.postal_code ?? '');
    const latitude = Number(source.latitude);
    const longitude = Number(source.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

    const providedFlagPath = typeof source.flagPath === 'string' ? source.flagPath.trim() : '';
    const fallbackFlagPath = countryCode
        ? `/assets/media/country-flag/${countryCodeToFlagFileName(countryCode)}`
        : '';
    const flagPath = providedFlagPath || fallbackFlagPath;

    const fallbackLabel = [cityName, countryName || countryCode].filter(Boolean).join(', ');
    const label = typeof source.label === 'string' && source.label.trim()
        ? source.label.trim()
        : fallbackLabel;
    if (!label) {
        return null;
    }

    const searchName = typeof source.searchName === 'string' && source.searchName.trim()
        ? source.searchName.trim().toLowerCase()
        : [cityName, regionName, countryName, countryCode].filter(Boolean).join(' ').toLowerCase();

    const fallbackId = [
        cityName,
        regionName,
        countryCode,
        hasCoordinates ? latitude.toFixed(3) : '',
        hasCoordinates ? longitude.toFixed(3) : ''
    ].join('|');
    const id = typeof source.id === 'string' && source.id.trim()
        ? source.id.trim()
        : fallbackId;
    if (!id) {
        return null;
    }

    return {
        id,
        cityName,
        countryName: countryName || countryCode,
        regionName,
        countryCode,
        postalCode,
        flagPath,
        label,
        searchName,
        latitude: hasCoordinates ? latitude : null,
        longitude: hasCoordinates ? longitude : null
    };
}

function normalizePetChoices(rawValues = []) {
    if (!Array.isArray(rawValues)) {
        return [];
    }

    const normalized = [];
    const seen = new Set();

    rawValues.forEach((rawValue) => {
        if (typeof rawValue !== 'string') {
            return;
        }

        const value = rawValue.trim().toUpperCase();
        if (!/^[A-Z][A-Z0-9_]*$/.test(value) || seen.has(value)) {
            return;
        }

        normalized.push(value);
        seen.add(value);
    });

    return normalized;
}

function normalizeHeaderSearchSelectedLocation(value) {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const cityName = typeof value.cityName === 'string' ? value.cityName.trim() : '';
    const regionName = typeof value.regionName === 'string' ? value.regionName.trim() : '';
    const countryCode = normalizeCountryCode(value.countryCode);
    const countryName = typeof value.countryName === 'string' ? value.countryName.trim() : '';
    const postalCode = normalizePostalCode(value.postalCode);
    const label = typeof value.label === 'string' ? value.label.trim() : '';
    const searchName = typeof value.searchName === 'string' ? value.searchName.trim().toLowerCase() : '';
    const flagPath = typeof value.flagPath === 'string' ? value.flagPath.trim() : '';
    const latitude = Number(value.latitude);
    const longitude = Number(value.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const fallbackLabel = [cityName, countryName || countryCode].filter(Boolean).join(', ');
    const nextLabel = label || fallbackLabel;
    const nextId = typeof value.id === 'string' && value.id.trim()
        ? value.id.trim()
        : [cityName, regionName, countryCode, nextLabel].filter(Boolean).join('|');
    const nextSearchName = searchName || [cityName, regionName, countryName, countryCode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    if (!nextId || !nextLabel) {
        return null;
    }

    return {
        id: nextId,
        cityName: cityName || nextLabel,
        countryName: countryName || countryCode,
        regionName,
        countryCode,
        postalCode,
        flagPath,
        label: nextLabel,
        searchName: nextSearchName,
        latitude: hasCoordinates ? latitude : null,
        longitude: hasCoordinates ? longitude : null
    };
}

function normalizeHeaderSearchPetCounts(value) {
    if (!value || typeof value !== 'object') {
        return {};
    }

    return Object.entries(value).reduce((accumulator, [rawKey, rawCount]) => {
        if (typeof rawKey !== 'string') {
            return accumulator;
        }

        const key = rawKey.trim().toUpperCase();
        if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
            return accumulator;
        }

        const count = Number(rawCount);
        if (!Number.isFinite(count) || count <= 0) {
            return accumulator;
        }

        accumulator[key] = Math.round(count);
        return accumulator;
    }, {});
}

function resolveSessionStorage() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return window.sessionStorage || null;
    } catch {
        return null;
    }
}

function readHeaderSearchSessionState() {
    const sessionStorage = resolveSessionStorage();
    if (!sessionStorage) {
        return {
            headerCenterTab: 'discover',
            locationQuery: '',
            selectedLocation: null,
            dateRangeStart: '',
            dateRangeEnd: '',
            petChoiceCounts: {}
        };
    }

    try {
        const rawState = sessionStorage.getItem(HEADER_SEARCH_SESSION_STORAGE_KEY);
        if (!rawState) {
            return {
                headerCenterTab: 'discover',
                locationQuery: '',
                selectedLocation: null,
                dateRangeStart: '',
                dateRangeEnd: '',
                petChoiceCounts: {}
            };
        }

        const parsedState = JSON.parse(rawState);
        const headerCenterTab = parsedState?.headerCenterTab === 'about' ? 'about' : 'discover';
        const locationQuery = typeof parsedState?.locationQuery === 'string'
            ? parsedState.locationQuery
            : '';
        const selectedLocation = normalizeHeaderSearchSelectedLocation(parsedState?.selectedLocation);
        const normalizedDateRange = normalizeHeaderSearchDateRange(
            parsedState?.dateRangeStart,
            parsedState?.dateRangeEnd
        );
        const petChoiceCounts = normalizeHeaderSearchPetCounts(parsedState?.petChoiceCounts);

        return {
            headerCenterTab,
            locationQuery,
            selectedLocation,
            dateRangeStart: normalizedDateRange.start,
            dateRangeEnd: normalizedDateRange.end,
            petChoiceCounts
        };
    } catch {
        return {
            headerCenterTab: 'discover',
            locationQuery: '',
            selectedLocation: null,
            dateRangeStart: '',
            dateRangeEnd: '',
            petChoiceCounts: {}
        };
    }
}

function writeHeaderSearchSessionState(state = {}) {
    const sessionStorage = resolveSessionStorage();
    if (!sessionStorage) {
        return;
    }

    const normalizedDateRange = normalizeHeaderSearchDateRange(
        state?.dateRangeStart,
        state?.dateRangeEnd
    );

    const payload = {
        headerCenterTab: state?.headerCenterTab === 'about' ? 'about' : 'discover',
        locationQuery: typeof state?.locationQuery === 'string' ? state.locationQuery : '',
        selectedLocation: normalizeHeaderSearchSelectedLocation(state?.selectedLocation),
        dateRangeStart: normalizedDateRange.start,
        dateRangeEnd: normalizedDateRange.end,
        petChoiceCounts: normalizeHeaderSearchPetCounts(state?.petChoiceCounts)
    };

    try {
        sessionStorage.setItem(HEADER_SEARCH_SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // Ignore storage quota or privacy mode errors.
    }
}

function normalizeUiLocaleCode(locale = document.documentElement.lang || 'de') {
    if (typeof locale !== 'string') {
        return 'de';
    }

    const normalized = locale.trim().slice(0, 2).toLowerCase();
    if (!normalized) {
        return 'de';
    }

    return normalized;
}

function formatTemplate(template, values = {}) {
    const safeTemplate = typeof template === 'string' ? template : '';
    if (!safeTemplate) {
        return '';
    }

    return safeTemplate.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
        const value = values[key];
        return value === null || value === undefined ? '' : String(value);
    });
}

function formatPetChoiceLabel(value, locale = document.documentElement.lang || 'de') {
    if (typeof value !== 'string') {
        return '';
    }

    const normalizedValue = value.trim().toUpperCase();
    if (!normalizedValue) {
        return '';
    }

    const localeCode = normalizeUiLocaleCode(locale);
    const byLocale = PET_CHOICE_TRANSLATIONS[localeCode] || PET_CHOICE_TRANSLATIONS.de;
    const translated = byLocale?.[normalizedValue];

    // Fallback for future backend enums: keep original backend constant unchanged.
    if (typeof translated === 'string' && translated.trim()) {
        return translated.trim();
    }

    return normalizedValue;
}

function formatPetChoiceCountLabel(value, count, locale = document.documentElement.lang || 'de') {
    const normalizedCount = Number.isFinite(Number(count))
        ? Math.max(0, Math.round(Number(count)))
        : 0;

    if (normalizedCount === 1) {
        return formatPetChoiceLabel(value, locale);
    }

    if (typeof value !== 'string') {
        return '';
    }

    const normalizedValue = value.trim().toUpperCase();
    if (!normalizedValue) {
        return '';
    }

    const localeCode = normalizeUiLocaleCode(locale);
    const byLocale = PET_CHOICE_PLURAL_TRANSLATIONS[localeCode] || PET_CHOICE_PLURAL_TRANSLATIONS.de;
    const pluralLabel = byLocale?.[normalizedValue];

    if (typeof pluralLabel === 'string' && pluralLabel.trim()) {
        return pluralLabel.trim();
    }

    // Fallback for future backend enums: keep original backend constant unchanged.
    return formatPetChoiceLabel(normalizedValue, locale);
}

function resolvePetChoiceEmojiPath(value) {
    if (typeof value !== 'string') {
        return PET_CHOICE_EMOJI_FALLBACK_ASSET_PATH;
    }

    const normalizedValue = value.trim().toUpperCase();
    if (!normalizedValue) {
        return PET_CHOICE_EMOJI_FALLBACK_ASSET_PATH;
    }

    return PET_CHOICE_EMOJI_ASSET_PATHS[normalizedValue] || PET_CHOICE_EMOJI_FALLBACK_ASSET_PATH;
}

function shouldSendApiCredentials(fetchInput) {
    let urlValue = '';
    if (typeof fetchInput === 'string') {
        urlValue = fetchInput;
    } else if (fetchInput instanceof URL) {
        urlValue = fetchInput.toString();
    } else if (typeof Request !== 'undefined' && fetchInput instanceof Request) {
        urlValue = fetchInput.url || '';
    }

    if (!urlValue) {
        return false;
    }

    if (urlValue.startsWith('/api/') || urlValue.startsWith('/actuator/')) {
        return true;
    }

    try {
        const parsedUrl = new URL(urlValue, window.location.origin);
        const isSameOrigin = parsedUrl.origin === window.location.origin;
        const isApiPath = parsedUrl.pathname.startsWith('/api/') || parsedUrl.pathname.startsWith('/actuator/');
        return isSameOrigin && isApiPath;
    } catch {
        return false;
    }
}

function apiFetch(fetchInput, options = {}) {
    if (!shouldSendApiCredentials(fetchInput) || options.credentials !== undefined) {
        return fetch(fetchInput, options);
    }

    return fetch(fetchInput, {
        ...options,
        credentials: 'include'
    });
}

async function fetchFirstJsonPayload(urls = []) {
    for (const url of urls) {
        try {
            const response = await apiFetch(url, {
                headers: {
                    Accept: 'application/json'
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                continue;
            }

            return await response.json();
        } catch {
            continue;
        }
    }

    return null;
}

async function fetchCitySearchResults(query, locale = document.documentElement.lang || 'de', signal = undefined) {
    const trimmedQuery = typeof query === 'string' ? query.trim() : '';
    if (trimmedQuery.length < 2) {
        return { results: [] };
    }

    const url = new URL(HEADER_SEARCH_CITY_ENDPOINT);
    url.searchParams.set('name', trimmedQuery);
    url.searchParams.set('count', '40');
    url.searchParams.set('language', String(locale || 'de').slice(0, 2).toLowerCase());
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
        headers: {
            Accept: 'application/json'
        },
        cache: 'no-store',
        signal
    });

    if (!response.ok) {
        throw new Error(`City search failed with status ${response.status}`);
    }

    return response.json();
}

const appShellTemplate = document.querySelector('#app-shell')?.innerHTML ?? '';
const appShellRender = appShellTemplate ? compile(appShellTemplate) : () => null;
const initialRepository = readRepositoryBootstrap();

const appRoot = document.querySelector('#app-shell');
const playwrightRunnerRoot = document.querySelector('[data-playwright-runner]');
const headerSearchRoot = document.querySelector('[data-header-search]');
const authModalFormRoot = document.querySelector('.auth_modal__form');
const userSearchModalFormRoot = document.querySelector('.user_search_modal__form');
const registerFormRoot = document.querySelector('.auth_form');
const homePageRoot = document.querySelector('[data-home-view]');
const profilePageRoot = document.querySelector('[data-profile-view]');
const myPetsPageRoot = document.querySelector('[data-my-pets-view]');
const myOffersPageRoot = document.querySelector('[data-my-offers-view]');
const settingsPageRoot = document.querySelector('[data-settings-view]');
let myOffersPendingUploadFile = null;
const LOCALE_NATIVE_LABELS = {
    de: appRoot?.dataset.localeLabelDe || '',
    en: appRoot?.dataset.localeLabelEn || '',
    ro: appRoot?.dataset.localeLabelRo || ''
};
const LOCALE_SWITCH_NOTIFICATION_COPY = {
    de: {
        title: appRoot?.dataset.localeSwitchTitleDe || '',
        message: appRoot?.dataset.localeSwitchMessageDe || ''
    },
    en: {
        title: appRoot?.dataset.localeSwitchTitleEn || '',
        message: appRoot?.dataset.localeSwitchMessageEn || ''
    },
    ro: {
        title: appRoot?.dataset.localeSwitchTitleRo || '',
        message: appRoot?.dataset.localeSwitchMessageRo || ''
    }
};
const defaultPlaywrightStatusLabels = {
    idle: 'IDLE',
    pending: 'PENDING',
    running: 'RUNNING',
    passed: 'PASSED',
    failed: 'FAILED',
    skipped: 'SKIPPED'
};

const localizedPlaywrightStatusLabels = {
    idle: playwrightRunnerRoot?.getAttribute('data-status-idle') || defaultPlaywrightStatusLabels.idle,
    pending: playwrightRunnerRoot?.getAttribute('data-status-pending') || defaultPlaywrightStatusLabels.pending,
    running: playwrightRunnerRoot?.getAttribute('data-status-running') || defaultPlaywrightStatusLabels.running,
    passed: playwrightRunnerRoot?.getAttribute('data-status-passed') || defaultPlaywrightStatusLabels.passed,
    failed: playwrightRunnerRoot?.getAttribute('data-status-failed') || defaultPlaywrightStatusLabels.failed,
    skipped: playwrightRunnerRoot?.getAttribute('data-status-skipped') || defaultPlaywrightStatusLabels.skipped
};

const localizedPlaywrightNeverLabel = playwrightRunnerRoot?.getAttribute('data-last-run-never') || '';
const localizedPlaywrightLoadingLabel = playwrightRunnerRoot?.getAttribute('data-loading-text') || '';
const localizedPlaywrightNotificationTitle = playwrightRunnerRoot?.getAttribute('data-notification-title') || '';
const localizedPlaywrightStatusRequestFailed = playwrightRunnerRoot?.getAttribute('data-status-request-failed') || '';
const localizedPlaywrightRunRequestFailed = playwrightRunnerRoot?.getAttribute('data-run-request-failed') || '';
const localizedPasswordCriteriaNonBlank = settingsPageRoot?.dataset.settingsPasswordCriteriaLowercase
    || registerFormRoot?.dataset.authRegisterPasswordCriteriaLowercase
    || '';
const localizedPasswordCriteriaNoEmail = settingsPageRoot?.dataset.settingsPasswordCriteriaUppercase
    || registerFormRoot?.dataset.authRegisterPasswordCriteriaUppercase
    || '';
const localizedPasswordCriteriaNoName = settingsPageRoot?.dataset.settingsPasswordCriteriaDigit
    || registerFormRoot?.dataset.authRegisterPasswordCriteriaDigit
    || '';
const localizedPasswordCriteriaNotWeak = settingsPageRoot?.dataset.settingsPasswordCriteriaSpecial
    || registerFormRoot?.dataset.authRegisterPasswordCriteriaSpecial
    || '';
const localizedPasswordCriteriaNoPawsittersContext = settingsPageRoot?.dataset.settingsPasswordCriteriaMatch
    || registerFormRoot?.dataset.authRegisterPasswordCriteriaMatch
    || '';
const localizedPasswordCriteriaStrings = {
    minLength: settingsPageRoot?.dataset.settingsPasswordCriteriaMinLength
        || registerFormRoot?.dataset.authRegisterPasswordCriteriaMinLength
        || '',
    maxBytes: settingsPageRoot?.dataset.settingsPasswordCriteriaMaxBytes
        || registerFormRoot?.dataset.authRegisterPasswordCriteriaMaxBytes
        || '',
    nonBlank: localizedPasswordCriteriaNonBlank,
    noEmail: localizedPasswordCriteriaNoEmail,
    noName: localizedPasswordCriteriaNoName,
    notWeak: localizedPasswordCriteriaNotWeak,
    noPawsittersContext: localizedPasswordCriteriaNoPawsittersContext,
    // Backward-compatible aliases for existing read paths.
    lowercase: localizedPasswordCriteriaNonBlank,
    uppercase: localizedPasswordCriteriaNoEmail,
    digit: localizedPasswordCriteriaNoName,
    special: localizedPasswordCriteriaNotWeak,
    match: localizedPasswordCriteriaNoPawsittersContext
};
const localizedAuthModalStrings = {
    identifierRequired: authModalFormRoot?.dataset.authIdentifierRequired || '',
    passwordRequired: authModalFormRoot?.dataset.authPasswordRequired || '',
    loginErrorTitle: authModalFormRoot?.dataset.authLoginErrorTitle || '',
    loginFailedMessage: authModalFormRoot?.dataset.authLoginFailedMessage || '',
    loginSuccessTitle: authModalFormRoot?.dataset.authLoginSuccessTitle || '',
    loginSuccessMessage: authModalFormRoot?.dataset.authLoginSuccessMessage || '',
    emailFoundTitle: authModalFormRoot?.dataset.authEmailFoundTitle || '',
    emailFoundMessage: authModalFormRoot?.dataset.authEmailFoundMessage || '',
    emailNotFoundTitle: authModalFormRoot?.dataset.authEmailNotFoundTitle || '',
    emailNotFoundMessage: authModalFormRoot?.dataset.authEmailNotFoundMessage || '',
    emailCheckFailedTitle: authModalFormRoot?.dataset.authEmailCheckFailedTitle || '',
    emailCheckFailedMessage: authModalFormRoot?.dataset.authEmailCheckFailedMessage || ''
};
const localizedUserSearchModalStrings = {
    invalidQuery: userSearchModalFormRoot?.dataset.userSearchInvalidQuery || '',
    loadFailed: userSearchModalFormRoot?.dataset.userSearchLoadFailed || '',
    notFound: userSearchModalFormRoot?.dataset.userSearchNotFound || '',
    noMatches: userSearchModalFormRoot?.dataset.userSearchNoMatches || '',
    loading: userSearchModalFormRoot?.dataset.userSearchLoading || '',
    empty: userSearchModalFormRoot?.dataset.userSearchEmpty || '',
    errorTitle: userSearchModalFormRoot?.dataset.userSearchErrorTitle || ''
};
const localizedRegisterStrings = {
    firstNameRequired: registerFormRoot?.dataset.authRegisterFirstNameRequired || '',
    lastNameRequired: registerFormRoot?.dataset.authRegisterLastNameRequired || '',
    emailRequired: registerFormRoot?.dataset.authRegisterEmailRequired || '',
    passwordRequired: registerFormRoot?.dataset.authRegisterPasswordRequired || '',
    passwordConfirmationRequired: registerFormRoot?.dataset.authRegisterPasswordConfirmationRequired || '',
    passwordsMismatch: registerFormRoot?.dataset.authRegisterPasswordsMismatch || '',
    passwordCriteriaRequired: registerFormRoot?.dataset.authRegisterPasswordCriteriaRequired || '',
    passwordMinLength: registerFormRoot?.dataset.authRegisterPasswordMinLength || '',
    passwordCriteriaMinLength: localizedPasswordCriteriaStrings.minLength,
    passwordCriteriaMaxBytes: localizedPasswordCriteriaStrings.maxBytes,
    passwordCriteriaLowercase: localizedPasswordCriteriaStrings.lowercase,
    passwordCriteriaUppercase: localizedPasswordCriteriaStrings.uppercase,
    passwordCriteriaDigit: localizedPasswordCriteriaStrings.digit,
    passwordCriteriaSpecial: localizedPasswordCriteriaStrings.special,
    passwordCriteriaMatch: localizedPasswordCriteriaStrings.match,
    phoneCountryLabel: registerFormRoot?.dataset.authRegisterPhoneCountryLabel || '',
    phoneCountryPlaceholder: registerFormRoot?.dataset.authRegisterPhoneCountryPlaceholder || '',
    phoneCountryRequired: registerFormRoot?.dataset.authRegisterPhoneCountryRequired || '',
    phoneCountryLoading: registerFormRoot?.dataset.authRegisterPhoneCountryLoading || '',
    phoneRequired: registerFormRoot?.dataset.authRegisterPhoneRequired || '',
    birthDateRequired: registerFormRoot?.dataset.authRegisterBirthDateRequired || '',
    birthDatePast: registerFormRoot?.dataset.authRegisterBirthDatePast || '',
    emergencyContactRequired: registerFormRoot?.dataset.authRegisterEmergencyContactRequired || '',
    profilePictureRequired: registerFormRoot?.dataset.authRegisterProfilePictureRequired || '',
    bioRequired: registerFormRoot?.dataset.authRegisterBioRequired || '',
    cityRequired: registerFormRoot?.dataset.authRegisterCityRequired || '',
    postalCodeInvalid: registerFormRoot?.dataset.authRegisterPostalCodeInvalid || '',
    roleRequired: registerFormRoot?.dataset.authRegisterRoleRequired || '',
    petSpeciesRequired: registerFormRoot?.dataset.authRegisterPetSpeciesRequired || '',
    registerErrorTitle: registerFormRoot?.dataset.authRegisterErrorTitle || '',
    registerFailedMessage: registerFormRoot?.dataset.authRegisterFailedMessage || '',
    registerSuccessTitle: registerFormRoot?.dataset.authRegisterSuccessTitle || '',
    registerSuccessMessage: registerFormRoot?.dataset.authRegisterSuccessMessage || '',
    countryFallback: registerFormRoot?.dataset.authRegisterCountryFallback || ''
};
const localizedHeaderSearchStrings = {
    destinationDescription: headerSearchRoot?.dataset.destinationDescription || '',
    destinationCompactEmpty: headerSearchRoot?.dataset.destinationCompactEmpty || '',
    dateDescription: headerSearchRoot?.dataset.dateDescription || '',
    dateCompactEmpty: headerSearchRoot?.dataset.dateCompactEmpty || '',
    petDescription: headerSearchRoot?.dataset.petDescription || '',
    petCompactEmpty: headerSearchRoot?.dataset.petCompactEmpty || '',
    destinationNoResults: headerSearchRoot?.dataset.destinationNoResults || '',
    destinationLoading: headerSearchRoot?.dataset.destinationLoading || '',
    petLoading: headerSearchRoot?.dataset.petLoading || '',
    petEmpty: headerSearchRoot?.dataset.petEmpty || '',
    backendStatusChecking: headerSearchRoot?.dataset.backendStatusChecking || '',
    backendStatusOnline: headerSearchRoot?.dataset.backendStatusOnline || '',
    backendStatusOffline: headerSearchRoot?.dataset.backendStatusOffline || '',
    backendStatusRetry: headerSearchRoot?.dataset.backendStatusRetry || ''
};
const localizedProfileStrings = {
    loading: profilePageRoot?.dataset.profileLoadingLabel || '',
    authRequired: profilePageRoot?.dataset.profileAuthRequired || '',
    notFound: profilePageRoot?.dataset.profileNotFound || '',
    loadFailed: profilePageRoot?.dataset.profileLoadFailed || '',
    routeMissing: profilePageRoot?.dataset.profileRouteMissing || '',
    rolePetOwner: profilePageRoot?.dataset.profileRolePetOwner || '',
    roleHost: profilePageRoot?.dataset.profileRoleHost || '',
    hostFromTemplate: profilePageRoot?.dataset.profileHostFromTemplate || '',
    petOwnerFromTemplate: profilePageRoot?.dataset.profilePetOwnerFromTemplate || '',
    hostCountryFlagPath: profilePageRoot?.dataset.profileHostCountryFlagPath || '/assets/media/country-flag/1F1E9-1F1EA.svg',
    hostCountryFlag: profilePageRoot?.dataset.profileHostCountryFlag || '🇩🇪',
    hostCityFallback: profilePageRoot?.dataset.profileHostCityFallback || '',
    ratingHeadingTemplate: profilePageRoot?.dataset.profileRatingHeadingTemplate || '',
    ratingAriaTemplate: profilePageRoot?.dataset.profileRatingAriaTemplate || '',
    ratingFirstNameFallback: profilePageRoot?.dataset.profileRatingFirstNameFallback || ''
};
const localizedMyPetsStrings = {
    loading: myPetsPageRoot?.dataset.myPetsLoadingLabel || '',
    authRequired: myPetsPageRoot?.dataset.myPetsAuthRequired || '',
    loadFailed: myPetsPageRoot?.dataset.myPetsLoadFailed || '',
    emptyTitle: myPetsPageRoot?.dataset.myPetsEmptyTitle || '',
    emptyText: myPetsPageRoot?.dataset.myPetsEmptyText || '',
    introDescription: myPetsPageRoot?.dataset.myPetsIntroDescription || '',
    countTemplateSingular: myPetsPageRoot?.dataset.myPetsCountTemplateSingular || '',
    countTemplatePlural: myPetsPageRoot?.dataset.myPetsCountTemplatePlural || '',
    saveSuccessTitle: myPetsPageRoot?.dataset.myPetsSaveSuccessTitle || '',
    saveSuccessTemplate: myPetsPageRoot?.dataset.myPetsSaveSuccessTemplate || '',
    deleteSuccessTitle: myPetsPageRoot?.dataset.myPetsDeleteSuccessTitle || '',
    deleteSuccessTemplate: myPetsPageRoot?.dataset.myPetsDeleteSuccessTemplate || '',
    uploadSuccessTitle: myPetsPageRoot?.dataset.myPetsUploadSuccessTitle || '',
    uploadSuccessTemplate: myPetsPageRoot?.dataset.myPetsUploadSuccessTemplate || '',
    actionErrorTitle: myPetsPageRoot?.dataset.myPetsActionErrorTitle || '',
    actionErrorMessage: myPetsPageRoot?.dataset.myPetsActionErrorMessage || '',
    validationRequiredTemplate: myPetsPageRoot?.dataset.myPetsValidationRequiredTemplate || '',
    validationAge: myPetsPageRoot?.dataset.myPetsValidationAge || '',
    confirmDeleteTemplate: myPetsPageRoot?.dataset.myPetsConfirmDeleteTemplate || '',
    formAddTitle: myPetsPageRoot?.dataset.myPetsFormAddTitle || '',
    formEditTitle: myPetsPageRoot?.dataset.myPetsFormEditTitle || '',
    quickUploadLabel: myPetsPageRoot?.dataset.myPetsQuickUploadLabel || '',
    editLabel: myPetsPageRoot?.dataset.myPetsEditLabel || '',
    deleteLabel: myPetsPageRoot?.dataset.myPetsDeleteLabel || '',
    addPetLink: myPetsPageRoot?.dataset.myPetsAddLinkLabel || '',
    openDetailsTemplate: myPetsPageRoot?.dataset.myPetsOpenDetailsTemplate || '',
    modalCloseAria: myPetsPageRoot?.dataset.myPetsModalCloseAria || '',
    detailsHint: myPetsPageRoot?.dataset.myPetsDetailsHint || '',
    imageSelectedTemplate: myPetsPageRoot?.dataset.myPetsImageSelectedTemplate || '',
    actions: {
        previous: myPetsPageRoot?.dataset.myPetsActionPrevious || '',
        next: myPetsPageRoot?.dataset.myPetsActionNext || '',
        save: myPetsPageRoot?.dataset.myPetsActionSave || '',
        cancel: myPetsPageRoot?.dataset.myPetsActionCancel || ''
    },
    labels: {
        name: myPetsPageRoot?.dataset.myPetsLabelName || '',
        species: myPetsPageRoot?.dataset.myPetsLabelSpecies || '',
        breed: myPetsPageRoot?.dataset.myPetsLabelBreed || '',
        age: myPetsPageRoot?.dataset.myPetsLabelAge || '',
        specialNeeds: myPetsPageRoot?.dataset.myPetsLabelSpecialNeeds || '',
        image: myPetsPageRoot?.dataset.myPetsLabelImage || ''
    },
    placeholders: {
        name: myPetsPageRoot?.dataset.myPetsPlaceholderName || '',
        breed: myPetsPageRoot?.dataset.myPetsPlaceholderBreed || '',
        age: myPetsPageRoot?.dataset.myPetsPlaceholderAge || '',
        specialNeeds: myPetsPageRoot?.dataset.myPetsPlaceholderSpecialNeeds || ''
    }
};
const localizedMyOffersStrings = {
    loading: myOffersPageRoot?.dataset.myOffersLoadingLabel || '',
    authRequired: myOffersPageRoot?.dataset.myOffersAuthRequired || '',
    loadFailed: myOffersPageRoot?.dataset.myOffersLoadFailed || '',
    emptyTitle: myOffersPageRoot?.dataset.myOffersEmptyTitle || '',
    emptyText: myOffersPageRoot?.dataset.myOffersEmptyText || '',
    introDescription: myOffersPageRoot?.dataset.myOffersIntroDescription || '',
    countTemplateSingular: myOffersPageRoot?.dataset.myOffersCountTemplateSingular || '',
    countTemplatePlural: myOffersPageRoot?.dataset.myOffersCountTemplatePlural || '',
    createLinkLabel: myOffersPageRoot?.dataset.myOffersCreateLinkLabel || '',
    createSuccessTitle: myOffersPageRoot?.dataset.myOffersCreateSuccessTitle || '',
    createSuccessTemplate: myOffersPageRoot?.dataset.myOffersCreateSuccessTemplate || '',
    updateSuccessTitle: myOffersPageRoot?.dataset.myOffersUpdateSuccessTitle || '',
    updateSuccessTemplate: myOffersPageRoot?.dataset.myOffersUpdateSuccessTemplate || '',
    publishSuccessTitle: myOffersPageRoot?.dataset.myOffersPublishSuccessTitle || '',
    publishSuccessTemplate: myOffersPageRoot?.dataset.myOffersPublishSuccessTemplate || '',
    withdrawSuccessTitle: myOffersPageRoot?.dataset.myOffersWithdrawSuccessTitle || '',
    withdrawSuccessTemplate: myOffersPageRoot?.dataset.myOffersWithdrawSuccessTemplate || '',
    actionErrorTitle: myOffersPageRoot?.dataset.myOffersActionErrorTitle || '',
    actionErrorMessage: myOffersPageRoot?.dataset.myOffersActionErrorMessage || '',
    validationRequiredTemplate: myOffersPageRoot?.dataset.myOffersValidationRequiredTemplate || '',
    validationPrice: myOffersPageRoot?.dataset.myOffersValidationPrice || '',
    validationSpecies: myOffersPageRoot?.dataset.myOffersValidationSpecies || '',
    validationServices: myOffersPageRoot?.dataset.myOffersValidationServices || '',
    validationCityRequired: myOffersPageRoot?.dataset.myOffersValidationCityRequired || localizedRegisterStrings.cityRequired,
    validationPeriod: myOffersPageRoot?.dataset.myOffersValidationPeriod || '',
    validationPeriodOrder: myOffersPageRoot?.dataset.myOffersValidationPeriodOrder || '',
    formAddTitle: myOffersPageRoot?.dataset.myOffersFormAddTitle || '',
    formEditTitle: myOffersPageRoot?.dataset.myOffersFormEditTitle || '',
    formAddHint: myOffersPageRoot?.dataset.myOffersFormAddHint || '',
    imageSelectedTemplate: myOffersPageRoot?.dataset.myOffersImageSelectedTemplate || '',
    imageNoneLabel: myOffersPageRoot?.dataset.myOffersImageNoneLabel || '',
    cityLoading: myOffersPageRoot?.dataset.myOffersCityLoading || localizedRegisterStrings.cityLoading,
    cityNoResults: myOffersPageRoot?.dataset.myOffersCityNoResults || localizedRegisterStrings.cityNoResults,
    cityResultsAria: myOffersPageRoot?.dataset.myOffersCityResultsAria || localizedRegisterStrings.cityResultsAria,
    stepAria: myOffersPageRoot?.dataset.myOffersStepAria || '',
    reviewTitle: myOffersPageRoot?.dataset.myOffersReviewTitle || '',
    reviewHint: myOffersPageRoot?.dataset.myOffersReviewHint || '',
    openDetailsTemplate: myOffersPageRoot?.dataset.myOffersOpenDetailsTemplate || '',
    modalCloseAria: myOffersPageRoot?.dataset.myOffersModalCloseAria || '',
    actions: {
        previous: myOffersPageRoot?.dataset.myOffersActionPrevious || '',
        next: myOffersPageRoot?.dataset.myOffersActionNext || '',
        save: myOffersPageRoot?.dataset.myOffersActionSave || '',
        confirm: myOffersPageRoot?.dataset.myOffersActionConfirm || '',
        stepBack: myOffersPageRoot?.dataset.myOffersActionStepBack || '',
        stepNext: myOffersPageRoot?.dataset.myOffersActionStepNext || '',
        edit: myOffersPageRoot?.dataset.myOffersActionEdit || '',
        cancel: myOffersPageRoot?.dataset.myOffersActionCancel || '',
        publish: myOffersPageRoot?.dataset.myOffersActionPublish || '',
        withdraw: myOffersPageRoot?.dataset.myOffersActionWithdraw || ''
    },
    steps: {
        setup: myOffersPageRoot?.dataset.myOffersStepSetup || '',
        species: myOffersPageRoot?.dataset.myOffersStepSpecies || '',
        details: myOffersPageRoot?.dataset.myOffersStepDetails || '',
        review: myOffersPageRoot?.dataset.myOffersStepReview || ''
    },
    labels: {
        title: myOffersPageRoot?.dataset.myOffersLabelTitle || '',
        availableFrom: myOffersPageRoot?.dataset.myOffersLabelAvailableFrom || '',
        availableTo: myOffersPageRoot?.dataset.myOffersLabelAvailableTo || '',
        availability: myOffersPageRoot?.dataset.myOffersLabelAvailability || '',
        image: myOffersPageRoot?.dataset.myOffersLabelImage || '',
        flow: myOffersPageRoot?.dataset.myOffersLabelFlow || '',
        dayStructure: myOffersPageRoot?.dataset.myOffersLabelDayStructure || '',
        description: myOffersPageRoot?.dataset.myOffersLabelDescription || '',
        price: myOffersPageRoot?.dataset.myOffersLabelPrice || '',
        city: myOffersPageRoot?.dataset.myOffersLabelCity || localizedRegisterStrings.city,
        species: myOffersPageRoot?.dataset.myOffersLabelSpecies || '',
        services: myOffersPageRoot?.dataset.myOffersLabelServices || '',
        status: myOffersPageRoot?.dataset.myOffersLabelStatus || '',
        statusDraft: myOffersPageRoot?.dataset.myOffersLabelStatusDraft || '',
        statusPublished: myOffersPageRoot?.dataset.myOffersLabelStatusPublished || ''
    },
    placeholders: {
        title: myOffersPageRoot?.dataset.myOffersPlaceholderTitle || '',
        flow: myOffersPageRoot?.dataset.myOffersPlaceholderFlow || '',
        dayStructure: myOffersPageRoot?.dataset.myOffersPlaceholderDayStructure || '',
        description: myOffersPageRoot?.dataset.myOffersPlaceholderDescription || '',
        price: myOffersPageRoot?.dataset.myOffersPlaceholderPrice || '',
        city: myOffersPageRoot?.dataset.myOffersPlaceholderCity || localizedRegisterStrings.cityPlaceholder,
        services: myOffersPageRoot?.dataset.myOffersPlaceholderServices || ''
    }
};
const localizedHomeStrings = {
    loading: homePageRoot?.dataset.homeLoadingLabel || '',
    loadFailed: homePageRoot?.dataset.homeLoadFailed || '',
    emptyTitle: homePageRoot?.dataset.homeEmptyTitle || '',
    emptyText: homePageRoot?.dataset.homeEmptyText || '',
    headingPrefix: homePageRoot?.dataset.homeHeadingPrefix || '',
    allSpeciesLabel: homePageRoot?.dataset.homeAllSpeciesLabel || '',
    speciesDropdownAria: homePageRoot?.dataset.homeSpeciesDropdownAria || '',
    carouselAria: homePageRoot?.dataset.homeCarouselAria || '',
    untitledOffer: homePageRoot?.dataset.homeUntitledOffer || '',
    openDetailsTemplate: homePageRoot?.dataset.homeOpenDetailsTemplate || '',
    modalCloseAria: homePageRoot?.dataset.homeModalCloseAria || '',
    modalDescriptionLabel: homePageRoot?.dataset.homeModalDescriptionLabel || '',
    modalServicesLabel: homePageRoot?.dataset.homeModalServicesLabel || '',
    modalSpeciesLabel: homePageRoot?.dataset.homeModalSpeciesLabel || '',
    modalHostLabel: homePageRoot?.dataset.homeModalHostLabel || '',
    labels: {
        date: homePageRoot?.dataset.homeLabelDate || '',
        price: homePageRoot?.dataset.homeLabelPrice || '',
        location: homePageRoot?.dataset.homeLabelLocation || '',
        locationFallback: homePageRoot?.dataset.homeLabelLocationFallback || ''
    },
    actions: {
        previous: homePageRoot?.dataset.homeActionPrevious || '',
        next: homePageRoot?.dataset.homeActionNext || ''
    },
    latest: {
        heading: homePageRoot?.dataset.homeLatestHeading || '',
        carouselAria: homePageRoot?.dataset.homeLatestCarouselAria || '',
        emptyTitle: homePageRoot?.dataset.homeLatestEmptyTitle || '',
        emptyText: homePageRoot?.dataset.homeLatestEmptyText || '',
        openDetailsTemplate: homePageRoot?.dataset.homeLatestOpenDetailsTemplate || ''
    }
};
const localizedSettingsStrings = {
    loading: settingsPageRoot?.dataset.settingsLoadingLabel || '',
    authRequired: settingsPageRoot?.dataset.settingsAuthRequired || '',
    loadFailed: settingsPageRoot?.dataset.settingsLoadFailed || '',
    emptyValue: settingsPageRoot?.dataset.settingsEmptyValue || '',
    editTitleTemplate: settingsPageRoot?.dataset.settingsEditTitleTemplate || '',
    editAriaTemplate: settingsPageRoot?.dataset.settingsEditAriaTemplate || '',
    modalSave: settingsPageRoot?.dataset.settingsModalSave || '',
    closeAria: settingsPageRoot?.dataset.settingsModalCloseAria || '',
    saveSuccessTitle: settingsPageRoot?.dataset.settingsSaveSuccessTitle || '',
    saveSuccessTemplate: settingsPageRoot?.dataset.settingsSaveSuccessTemplate || '',
    saveErrorTitle: settingsPageRoot?.dataset.settingsSaveErrorTitle || '',
    saveErrorMessage: settingsPageRoot?.dataset.settingsSaveErrorMessage || '',
    emailChangedTitle: settingsPageRoot?.dataset.settingsEmailChangedTitle || '',
    emailChangedMessage: settingsPageRoot?.dataset.settingsEmailChangedMessage || '',
    passwordChangedTitle: settingsPageRoot?.dataset.settingsPasswordChangedTitle || '',
    passwordChangedMessage: settingsPageRoot?.dataset.settingsPasswordChangedMessage || '',
    passwordMasked: settingsPageRoot?.dataset.settingsPasswordMasked || '************',
    validationRequired: settingsPageRoot?.dataset.settingsValidationRequired || '',
    validationEmail: settingsPageRoot?.dataset.settingsValidationEmail || '',
    validationEmailExists: settingsPageRoot?.dataset.settingsValidationEmailExists || '',
    validationBirthDate: settingsPageRoot?.dataset.settingsValidationBirthDate || '',
    validationPostalCode: settingsPageRoot?.dataset.settingsValidationPostalCode || '',
    validationCity: settingsPageRoot?.dataset.settingsValidationCity || localizedRegisterStrings.cityRequired,
    validationPhoneCountry: settingsPageRoot?.dataset.settingsValidationPhoneCountry || localizedRegisterStrings.phoneCountryRequired,
    validationCurrentPasswordRequired: settingsPageRoot?.dataset.settingsValidationCurrentPasswordRequired || '',
    validationCurrentPasswordInvalid: settingsPageRoot?.dataset.settingsValidationCurrentPasswordInvalid || '',
    validationNewPasswordRequired: settingsPageRoot?.dataset.settingsValidationNewPasswordRequired || '',
    validationPasswordConfirmationRequired: settingsPageRoot?.dataset.settingsValidationPasswordConfirmationRequired || '',
    validationPasswordsMismatch: settingsPageRoot?.dataset.settingsValidationPasswordsMismatch || '',
    validationPasswordCriteriaRequired: settingsPageRoot?.dataset.settingsValidationPasswordCriteriaRequired || '',
    validationSpecies: settingsPageRoot?.dataset.settingsValidationSpecies || '',
    validationProfileImage: settingsPageRoot?.dataset.settingsValidationProfileImage || '',
    petHint: settingsPageRoot?.dataset.settingsPetHint || '',
    imageUploadLabel: settingsPageRoot?.dataset.settingsImageUploadLabel || '',
    imageUploadHint: settingsPageRoot?.dataset.settingsImageUploadHint || '',
    imageResetLabel: settingsPageRoot?.dataset.settingsImageResetLabel || '',
    imageSelectedTemplate: settingsPageRoot?.dataset.settingsImageSelectedTemplate || '',
    cityLoading: settingsPageRoot?.dataset.settingsCityLoading || localizedRegisterStrings.cityLoading,
    cityNoResults: settingsPageRoot?.dataset.settingsCityNoResults || localizedRegisterStrings.cityNoResults,
    cityResultsAria: settingsPageRoot?.dataset.settingsCityResultsAria || localizedRegisterStrings.cityResultsAria,
    rolePetOwner: settingsPageRoot?.dataset.settingsRolePetOwner || '',
    roleHost: settingsPageRoot?.dataset.settingsRoleHost || '',
    labels: {
        firstName: settingsPageRoot?.dataset.settingsLabelFirstName || '',
        lastName: settingsPageRoot?.dataset.settingsLabelLastName || '',
        email: settingsPageRoot?.dataset.settingsLabelEmail || '',
        password: settingsPageRoot?.dataset.settingsLabelPassword || '',
        phone: settingsPageRoot?.dataset.settingsLabelPhone || '',
        birthDate: settingsPageRoot?.dataset.settingsLabelBirthDate || '',
        emergencyContact: settingsPageRoot?.dataset.settingsLabelEmergencyContact || '',
        profilePicture: settingsPageRoot?.dataset.settingsLabelProfilePicture || '',
        bio: settingsPageRoot?.dataset.settingsLabelBio || '',
        role: settingsPageRoot?.dataset.settingsLabelRole || '',
        phoneCountry: settingsPageRoot?.dataset.settingsLabelPhoneCountry || localizedRegisterStrings.phoneCountryLabel,
        city: settingsPageRoot?.dataset.settingsLabelCity || '',
        postalCode: settingsPageRoot?.dataset.settingsLabelPostalCode || '',
        acceptedPetSpecies: settingsPageRoot?.dataset.settingsLabelAcceptedPets || ''
    },
    placeholders: {
        firstName: settingsPageRoot?.dataset.settingsPlaceholderFirstName || '',
        lastName: settingsPageRoot?.dataset.settingsPlaceholderLastName || '',
        email: settingsPageRoot?.dataset.settingsPlaceholderEmail || '',
        password: settingsPageRoot?.dataset.settingsPlaceholderPassword || '',
        currentPassword: settingsPageRoot?.dataset.settingsPlaceholderCurrentPassword || '',
        newPassword: settingsPageRoot?.dataset.settingsPlaceholderNewPassword || '',
        confirmPassword: settingsPageRoot?.dataset.settingsPlaceholderConfirmPassword || '',
        phone: settingsPageRoot?.dataset.settingsPlaceholderPhone || '',
        phoneCountry: settingsPageRoot?.dataset.settingsPlaceholderPhoneCountry || localizedRegisterStrings.phoneCountryPlaceholder,
        birthDate: settingsPageRoot?.dataset.settingsPlaceholderBirthDate || '',
        emergencyContact: settingsPageRoot?.dataset.settingsPlaceholderEmergencyContact || '',
        profilePicture: settingsPageRoot?.dataset.settingsPlaceholderProfilePicture || '',
        bio: settingsPageRoot?.dataset.settingsPlaceholderBio || '',
        city: settingsPageRoot?.dataset.settingsPlaceholderCity || '',
        postalCode: settingsPageRoot?.dataset.settingsPlaceholderPostalCode || ''
    }
};
const localizedAppStrings = {
    genericUser: appRoot?.dataset.authGenericUser || '',
    sessionGreetingTemplate: appRoot?.dataset.authSessionGreetingTemplate || '',
    loginSuccessTemplate: appRoot?.dataset.authLoginSuccessTemplate || '',
    registerSuccessTemplate: appRoot?.dataset.authRegisterSuccessTemplate || '',
    logoutSuccessTitle: appRoot?.dataset.authLogoutSuccessTitle || '',
    logoutSuccessTemplate: appRoot?.dataset.authLogoutSuccessTemplate || '',
    profileDocumentTitleTemplate: appRoot?.dataset.profileDocumentTitleTemplate || '{brand}',
    notificationDismissAria: appRoot?.dataset.notificationDismissAria || ''
};

const PASSWORD_POLICY_MIN_LENGTH = 15;
const PASSWORD_POLICY_MAX_BCRYPT_BYTES = 72;
const PASSWORD_POLICY_WEAK_PASSWORD_PARTS = new Set([
    'password',
    'passwort',
    'password123',
    'passwort123',
    '123456',
    '123456789',
    '111111',
    '000000',
    'aaaaaa',
    'abcdef',
    'abc123',
    'qwertz',
    'qwerty',
    'qwertz123',
    'qwerty123',
    'asdf',
    'admin',
    'admin123',
    'welcome',
    'letmein',
    'iloveyou',
    'monkey',
    'dragon',
    'football',
    'baseball',
    'master',
    'login',
    'secret',
    'changeme',
    'default'
]);
const PASSWORD_POLICY_CONTEXT_PASSWORD_PARTS = new Set([
    'pawsitters',
    'pawsitter',
    'petsitter',
    'tier',
    'hund',
    'katze',
    'sommer',
    'winter'
]);

function normalizePasswordForPolicy(value = '') {
    const safeValue = typeof value === 'string' ? value : '';
    try {
        return safeValue.normalize('NFC');
    } catch {
        return safeValue;
    }
}

function normalizePasswordComparison(value = '') {
    return normalizePasswordForPolicy(value)
        .toLowerCase()
        .replace(/@/g, 'a')
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/[^a-z0-9]/g, '');
}

function normalizePasswordAlphanumeric(value = '') {
    return normalizePasswordForPolicy(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function passwordContainsEmailPart(password = '', email = '') {
    if (typeof email !== 'string' || !email.trim()) {
        return false;
    }

    const normalizedPassword = normalizePasswordComparison(password);
    const normalizedEmail = normalizePasswordComparison(email);
    const localPart = normalizePasswordComparison(email.split('@', 2)[0] || '');

    return normalizedPassword.includes(normalizedEmail)
        || (localPart.length >= 3 && normalizedPassword.includes(localPart));
}

function containsContextValue(normalizedPassword = '', value = '') {
    if (typeof value !== 'string' || !value.trim()) {
        return false;
    }

    const normalizedValue = normalizePasswordComparison(value);
    return normalizedValue.length >= 3 && normalizedPassword.includes(normalizedValue);
}

function passwordContainsNamePart(password = '', firstName = '', lastName = '') {
    const normalizedPassword = normalizePasswordComparison(password);
    return containsContextValue(normalizedPassword, firstName)
        || containsContextValue(normalizedPassword, lastName);
}

function isBlockedPasswordOrSimpleVariant(normalizedPassword = '', blockedPassword = '') {
    if (normalizedPassword === blockedPassword) {
        return true;
    }

    if (!normalizedPassword.startsWith(blockedPassword)) {
        return false;
    }

    const suffix = normalizedPassword.slice(blockedPassword.length);
    return /^\d{1,8}$/.test(suffix) || /^\d{1,8}[a-z]{1,2}$/.test(suffix);
}

function passwordContainsBlockedParts(password = '', blockedParts = new Set()) {
    const normalized = normalizePasswordAlphanumeric(password);
    const leetNormalized = normalizePasswordComparison(password);

    return Array.from(blockedParts).some((blockedPassword) => (
        isBlockedPasswordOrSimpleVariant(normalized, blockedPassword)
        || isBlockedPasswordOrSimpleVariant(leetNormalized, blockedPassword)
    ));
}

function buildPasswordCriteria(password = '', labels = localizedPasswordCriteriaStrings, context = {}) {
    const normalizedPassword = normalizePasswordForPolicy(password);
    const passwordBytes = new TextEncoder().encode(normalizedPassword).length;
    const characterLength = Array.from(normalizedPassword).length;
    const isNonBlank = normalizedPassword.trim().length > 0;
    const email = typeof context?.email === 'string' ? context.email : '';
    const firstName = typeof context?.firstName === 'string' ? context.firstName : '';
    const lastName = typeof context?.lastName === 'string' ? context.lastName : '';
    const containsEmail = passwordContainsEmailPart(normalizedPassword, email);
    const containsName = passwordContainsNamePart(normalizedPassword, firstName, lastName);
    const containsWeakPasswordPart = passwordContainsBlockedParts(
        normalizedPassword,
        PASSWORD_POLICY_WEAK_PASSWORD_PARTS
    );
    const containsPawsittersContextPart = passwordContainsBlockedParts(
        normalizedPassword,
        PASSWORD_POLICY_CONTEXT_PASSWORD_PARTS
    );

    return [
        {
            id: 'min-length',
            label: labels.minLength,
            met: characterLength >= PASSWORD_POLICY_MIN_LENGTH
        },
        {
            id: 'max-bytes',
            label: labels.maxBytes,
            met: passwordBytes <= PASSWORD_POLICY_MAX_BCRYPT_BYTES
        },
        {
            id: 'non-blank',
            label: labels.nonBlank,
            met: isNonBlank
        },
        {
            id: 'no-email',
            label: labels.noEmail,
            met: !containsEmail
        },
        {
            id: 'no-name',
            label: labels.noName,
            met: !containsName
        },
        {
            id: 'not-weak',
            label: labels.notWeak,
            met: !containsWeakPasswordPart
        },
        {
            id: 'no-pawsitters-context',
            label: labels.noPawsittersContext,
            met: !containsPawsittersContextPart
        }
    ];
}
const initialHeaderSearchState = readHeaderSearchSessionState();

createApp({
    render: appShellRender,
    data() {
        const repository = normalizeRepository(initialRepository);
        const todayDate = new Date();

        return {
            menuOpen: false,
            loginModalOpen: false,
            userSearchModalOpen: false,
            authSessionLoggedIn: false,
            authSessionEmail: '',
            authSessionUserId: null,
            authSessionFirstName: '',
            authSessionLastName: '',
            authSessionRequestId: 0,
            authSessionProfileRequestId: 0,
            profileViewLoading: false,
            showProfileViewLoadingDots: false,
            profileViewError: '',
            profileViewRequestedUserId: null,
            profileViewUser: null,
            profileStrings: localizedProfileStrings,
            profileViewBaseDocumentTitle: typeof document !== 'undefined'
                ? String(document.title || '').trim()
                : 'Pawsitters',
            profileViewTab: 'information',
            myPetsViewLoading: false,
            showMyPetsViewLoadingDots: false,
            myPetsViewError: '',
            myPetsViewUser: null,
            myPetsPets: [],
            myPetsStrings: localizedMyPetsStrings,
            myPetsCarouselIndex: 0,
            myPetsQuickUploadPetId: null,
            myPetsAddModalOpen: false,
            myPetsDetailModalOpen: false,
            myPetsDetailEditing: false,
            myPetsDetailPetId: null,
            myPetsDeleteModalOpen: false,
            myPetsDeletePetId: null,
            myPetsDeleteSubmitting: false,
            myPetsForm: {
                name: '',
                species: '',
                breed: '',
                age: '',
                specialNeeds: ''
            },
            myPetsFormEditingId: null,
            myPetsFormImageFile: null,
            myPetsFormImageFileName: '',
            myPetsFormSaving: false,
            myOffersViewLoading: false,
            showMyOffersViewLoadingDots: false,
            myOffersViewError: '',
            myOffersViewUser: null,
            myOffersOffers: [],
            myOffersStrings: localizedMyOffersStrings,
            myOffersCarouselIndex: 0,
            myOffersActionPendingId: null,
            myOffersCreateModalOpen: false,
            myOffersCreateStep: MY_OFFERS_CREATE_STEPS[0],
            myOffersFormEditingId: null,
            myOffersForm: {
                title: '',
                flow: '',
                dayStructure: '',
                pricePerDay: '',
                location: '',
                acceptedPetSpecies: [],
                services: '',
                availableFrom: '',
                availableTo: ''
            },
            myOffersFormImageFile: null,
            myOffersFormImageFileName: '',
            myOffersFormImagePreviewUrl: '',
            myOffersCityQuery: '',
            myOffersCitySelectionKey: '',
            myOffersCitySelectedOption: null,
            myOffersCityOptions: [],
            myOffersCityOptionsLoading: false,
            showMyOffersCityOptionsLoadingDots: false,
            myOffersCitySearchDebounceHandle: null,
            myOffersCitySearchAbortController: null,
            myOffersCitySearchRequestId: 0,
            myOffersLocalImageById: {},
            myOffersAvailabilityCalendarYear: todayDate.getFullYear(),
            myOffersAvailabilityCalendarMonth: todayDate.getMonth(),
            myOffersFormSaving: false,
            homeViewLoading: false,
            showHomeViewLoadingDots: false,
            homeViewError: '',
            homeOffersLoaded: false,
            homeOfferLoadRequestId: 0,
            homeOfferSpeciesFilter: 'ALL',
            homeOffers: [],
            homeOffersCarouselIndex: 0,
            homeLatestOffers: [],
            homeLatestOfferLoadRequestId: 0,
            homeLatestCarouselOffset: 0,
            homeLatestViewportWidth: typeof window !== 'undefined' && Number.isFinite(window.innerWidth)
                ? window.innerWidth
                : 1280,
            homeOfferDetailModalOpen: false,
            homeOfferDetailOfferId: null,
            homeOfferHostCityByHostId: {},
            homeOfferHostCityLoadingByHostId: {},
            homeStrings: localizedHomeStrings,
            settingsViewLoading: false,
            showSettingsViewLoadingDots: false,
            settingsViewError: '',
            settingsViewUser: null,
            settingsCityLocationOption: null,
            settingsCityLookupRequestId: 0,
            settingsCityLookupAbortController: null,
            settingsStrings: localizedSettingsStrings,
            settingsEditModalOpen: false,
            settingsEditField: '',
            settingsEditValue: '',
            settingsPhoneCountryCode: '',
            settingsCityQuery: '',
            settingsCitySelectionKey: '',
            settingsCitySelectedOption: null,
            settingsCityOptions: [],
            settingsCityOptionsLoading: false,
            showSettingsCityOptionsLoadingDots: false,
            settingsCitySearchDebounceHandle: null,
            settingsCitySearchAbortController: null,
            settingsCitySearchRequestId: 0,
            settingsEditCurrentPassword: '',
            settingsEditNewPassword: '',
            settingsEditPasswordConfirmation: '',
            settingsEditSpecies: [],
            settingsEditProfileFile: null,
            settingsEditProfileFileName: '',
            settingsEditSaving: false,
            backendStatusState: 'checking',
            backendStatusChecking: false,
            backendStatusRequestId: 0,
            backendStatusPollingHandle: null,
            loginIdentifier: '',
            loginPassword: '',
            loginPasswordVisible: false,
            loginLookupPending: false,
            loginLookupRequestId: 0,
            loginMailCheckedFor: '',
            userSearchQuery: '',
            userSearchLoading: false,
            showUserSearchLoadingDots: false,
            userSearchStatusMessage: '',
            userSearchStatusTone: 'info',
            userSearchResults: [],
            userSearchRequestId: 0,
            userSearchDirectoryRequestId: 0,
            userSearchDirectoryLoaded: false,
            userSearchDirectory: [],
            registerStep: REGISTER_STEPS[0],
            registerFirstName: '',
            registerLastName: '',
            registerEmail: '',
            registerPassword: '',
            registerPasswordConfirmation: '',
            registerPhoneCountryCode: '',
            registerPhone: '',
            registerBirthDate: '',
            registerEmergencyContact: '',
            registerProfilePicture: '/assets/media/favicon.png',
            registerBio: '',
            registerRole: 'PET_OWNER',
            registerCity: '',
            registerCityQuery: '',
            registerCountryName: '',
            registerCountryCode: '',
            registerCountryFlagPath: '',
            registerPostalCode: '',
            registerCitySelectionKey: '',
            registerCityOptions: [],
            registerCityOptionsLoading: false,
            showRegisterCityOptionsLoadingDots: false,
            registerCitySearchDebounceHandle: null,
            registerCitySearchAbortController: null,
            registerCitySearchRequestId: 0,
            registerPetChoices: [],
            registerPetChoicesLoading: false,
            showRegisterPetChoicesLoadingDots: false,
            registerAcceptedPetSpecies: [],
            phoneCountryOptions: [],
            phoneCountryOptionsLoading: false,
            phoneCountryOptionsPromise: null,
            registerSubmitPending: false,
            scrolled: false,
            headerScrollSyncFrame: 0,
            segmentedIndicatorRetryFrame: 0,
            headerScrollPendingY: 0,
            headerScrollProgress: 0,
            headerMotionLowPerformance: false,
            headerScrollProgressPrecision: HEADER_SCROLL_PROGRESS_PRECISION,
            headerSurfaceElement: null,
            headerSearchTabsResizeObserver: null,
            headerSearchInteractionExpanded: false,
            headerCenterTab: initialHeaderSearchState.headerCenterTab,
            headerSearchStrings: localizedHeaderSearchStrings,
            locationQuery: initialHeaderSearchState.locationQuery,
            selectedLocation: initialHeaderSearchState.selectedLocation,
            locationOptions: [],
            locationOptionsLoading: false,
            showLocationOptionsLoadingDots: false,
            locationSearchDebounceHandle: null,
            locationSearchAbortController: null,
            locationSearchRequestId: 0,
            dateRangeStart: initialHeaderSearchState.dateRangeStart,
            dateRangeEnd: initialHeaderSearchState.dateRangeEnd,
            dateCalendarYear: todayDate.getFullYear(),
            dateCalendarMonth: todayDate.getMonth(),
            settingsBirthDateCalendarYear: todayDate.getFullYear(),
            settingsBirthDateCalendarMonth: todayDate.getMonth(),
            registerBirthDateCalendarYear: todayDate.getFullYear(),
            registerBirthDateCalendarMonth: todayDate.getMonth(),
            petChoices: [],
            petChoicesLoading: false,
            showPetChoicesLoadingDots: false,
            petChoiceCounts: {
                ...initialHeaderSearchState.petChoiceCounts
            },
            threadBackgroundController: null,
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
            gitGraphRenderToken: 0,
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
            playwrightSessionStarted: false,
            playwrightNotifiedRunIds: [],
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
            animatedMetrics: createMetricAnimationState(),
            metricAnimationFrames: {
                git: 0,
                board: 0,
                playwright: 0
            },
            metricAnimationTargets: createMetricAnimationState(),
            metricAnimationHasPlayed: {
                git: false,
                board: false,
                playwright: false
            },
            playwrightTests: [],
            playwrightLogs: [],
            playwrightNextLogIndex: 0,
            playwrightStatusLabels: localizedPlaywrightStatusLabels,
            playwrightNeverLabel: localizedPlaywrightNeverLabel,
            playwrightLoadingLabel: localizedPlaywrightLoadingLabel,
            playwrightNotificationTitle: localizedPlaywrightNotificationTitle,
            notifications: [],
            notificationDismissAria: localizedAppStrings.notificationDismissAria,
            notificationCounter: 0,
            notificationTimers: {},
            loadingIndicatorTimers: {},
            dropdownQueueHandle: null,
            dropdownQueuedTargetId: ''
        };
    },
    computed: {
        registerBirthDateMax() {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return toDateInputValue(yesterday);
        },
        calendarMonthOptions() {
            const locale = document.documentElement.lang || 'de';
            return buildCalendarMonthOptions(locale);
        },
        searchCalendarYearOptions() {
            const currentYear = new Date().getFullYear();
            const maxYear = Math.max(
                currentYear + CALENDAR_HEADER_SEARCH_FUTURE_YEAR_OFFSET,
                this.dateCalendarYear
            );
            return buildCalendarYearOptions(maxYear, currentYear);
        },
        birthDateCalendarYearOptions() {
            const currentYear = new Date().getFullYear();
            const maxYear = Math.max(
                currentYear,
                this.settingsBirthDateCalendarYear,
                this.registerBirthDateCalendarYear
            );
            return buildCalendarYearOptions(maxYear);
        },
        registerPhoneCountryOption() {
            return this.findPhoneCountryOptionByCode(this.registerPhoneCountryCode);
        },
        settingsPhoneCountryOption() {
            return this.findPhoneCountryOptionByCode(this.settingsPhoneCountryCode);
        },
        registerPasswordCriteria() {
            const password = typeof this.registerPassword === 'string' ? this.registerPassword : '';
            return buildPasswordCriteria(password, localizedPasswordCriteriaStrings, {
                email: this.registerEmail,
                firstName: this.registerFirstName,
                lastName: this.registerLastName
            });
        },
        allRegisterPasswordCriteriaMet() {
            return this.registerPasswordCriteria.every((criterion) => criterion.met);
        },
        filteredRegisterCityOptions() {
            const query = typeof this.registerCityQuery === 'string' ? this.registerCityQuery.trim().toLowerCase() : '';
            const options = Array.isArray(this.registerCityOptions) ? this.registerCityOptions : [];

            if (!query) {
                return options.slice(0, 12);
            }

            return options
                .filter((option) => option.searchName.includes(query) || option.countryCode.toLowerCase().includes(query))
                .slice(0, 12);
        },
        showRegisterCityNoResults() {
            const query = typeof this.registerCityQuery === 'string' ? this.registerCityQuery.trim() : '';
            return !this.registerCityOptionsLoading && query.length >= 2 && this.filteredRegisterCityOptions.length === 0;
        },
        filteredSettingsCityOptions() {
            const query = typeof this.settingsCityQuery === 'string' ? this.settingsCityQuery.trim().toLowerCase() : '';
            const options = Array.isArray(this.settingsCityOptions) ? this.settingsCityOptions : [];

            if (!query) {
                return options.slice(0, 12);
            }

            return options
                .filter((option) => option.searchName.includes(query) || option.countryCode.toLowerCase().includes(query))
                .slice(0, 12);
        },
        showSettingsCityNoResults() {
            const query = typeof this.settingsCityQuery === 'string' ? this.settingsCityQuery.trim() : '';
            if (this.settingsCityOptionsLoading || query.length < 2) {
                return false;
            }

            if (this.filteredSettingsCityOptions.length > 0) {
                return false;
            }

            const selectedCity = typeof this.settingsCitySelectedOption?.cityName === 'string'
                ? this.settingsCitySelectedOption.cityName.trim().toLowerCase()
                : '';
            const hasMatchingSelection = Boolean(this.settingsCitySelectionKey)
                && selectedCity
                && selectedCity === query.toLowerCase();

            return !hasMatchingSelection;
        },
        filteredMyOffersCityOptions() {
            const query = typeof this.myOffersCityQuery === 'string' ? this.myOffersCityQuery.trim().toLowerCase() : '';
            const options = Array.isArray(this.myOffersCityOptions) ? this.myOffersCityOptions : [];

            if (!query) {
                return options.slice(0, 12);
            }

            return options
                .filter((option) => option.searchName.includes(query) || option.countryCode.toLowerCase().includes(query))
                .slice(0, 12);
        },
        showMyOffersCityNoResults() {
            const query = typeof this.myOffersCityQuery === 'string' ? this.myOffersCityQuery.trim() : '';
            if (this.myOffersCityOptionsLoading || query.length < 2) {
                return false;
            }

            if (this.filteredMyOffersCityOptions.length > 0) {
                return false;
            }

            const selectedCity = typeof this.myOffersCitySelectedOption?.cityName === 'string'
                ? this.myOffersCitySelectedOption.cityName.trim().toLowerCase()
                : '';
            const hasMatchingSelection = Boolean(this.myOffersCitySelectionKey)
                && selectedCity
                && selectedCity === query.toLowerCase();

            return !hasMatchingSelection;
        },
        registerCountryFallbackLabel() {
            return localizedRegisterStrings.countryFallback;
        },
        filteredLocationOptions() {
            const query = typeof this.locationQuery === 'string' ? this.locationQuery.trim().toLowerCase() : '';
            const options = Array.isArray(this.locationOptions) ? this.locationOptions : [];

            if (!query) {
                return options.slice(0, 70);
            }

            return options
                .filter((option) => option.searchName.includes(query) || option.countryCode.toLowerCase().includes(query))
                .slice(0, 70);
        },
        headerSearchCompactMode() {
            return this.headerCenterTab === 'discover'
                && this.headerScrollProgress >= 0.52
                && !this.headerSearchInteractionExpanded;
        },
        locationDisplayValue() {
            if (this.selectedLocation && this.selectedLocation.label) {
                return this.selectedLocation.label;
            }

            if (this.headerSearchCompactMode) {
                return this.headerSearchStrings.destinationCompactEmpty;
            }

            return this.headerSearchStrings.destinationDescription;
        },
        dateDisplayValue() {
            const locale = document.documentElement.lang || 'de';
            const startLabel = formatSearchDate(this.dateRangeStart, locale);
            const endLabel = formatSearchDate(this.dateRangeEnd, locale);

            if (startLabel && endLabel) {
                if (this.dateRangeStart === this.dateRangeEnd) {
                    return startLabel;
                }

                return `${startLabel} - ${endLabel}`;
            }

            if (startLabel) {
                return startLabel;
            }

            if (endLabel) {
                return endLabel;
            }

            if (this.headerSearchCompactMode) {
                return this.headerSearchStrings.dateCompactEmpty;
            }

            return this.headerSearchStrings.dateDescription;
        },
        dateCalendarMonthLabel() {
            const locale = document.documentElement.lang || 'de';
            return formatCalendarMonthLabel(this.dateCalendarYear, this.dateCalendarMonth, locale);
        },
        dateCalendarWeekdayLabels() {
            const locale = document.documentElement.lang || 'de';
            return getCalendarWeekdayLabels(locale);
        },
        dateCalendarDays() {
            const locale = document.documentElement.lang || 'de';
            const minSelectableDate = getHeaderSearchDateMinInputValue();
            const maxSelectableDate = getHeaderSearchDateMaxInputValue();
            return buildDateCalendarDays({
                year: this.dateCalendarYear,
                month: this.dateCalendarMonth,
                rangeStart: this.dateRangeStart,
                rangeEnd: this.dateRangeEnd,
                minSelectableDate,
                maxSelectableDate,
                locale
            });
        },
        dateSelectionStartLabel() {
            const locale = document.documentElement.lang || 'de';
            return formatSearchDate(this.dateRangeStart, locale) || '--';
        },
        dateSelectionEndLabel() {
            const locale = document.documentElement.lang || 'de';
            return formatSearchDate(this.dateRangeEnd, locale) || '--';
        },
        settingsBirthDateSelectionLabel() {
            const locale = document.documentElement.lang || 'de';
            return formatSearchDate(this.settingsEditValue, locale) || '--';
        },
        registerBirthDateSelectionLabel() {
            const locale = document.documentElement.lang || 'de';
            return formatSearchDate(this.registerBirthDate, locale) || '--';
        },
        settingsBirthDateCalendarMonthLabel() {
            const locale = document.documentElement.lang || 'de';
            return formatCalendarMonthLabel(
                this.settingsBirthDateCalendarYear,
                this.settingsBirthDateCalendarMonth,
                locale
            );
        },
        settingsBirthDateCalendarWeekdayLabels() {
            const locale = document.documentElement.lang || 'de';
            return getCalendarWeekdayLabels(locale);
        },
        registerBirthDateCalendarWeekdayLabels() {
            const locale = document.documentElement.lang || 'de';
            return getCalendarWeekdayLabels(locale);
        },
        settingsBirthDateCalendarDays() {
            const locale = document.documentElement.lang || 'de';
            const selectedDate = this.settingsEditField === 'birthDate'
                ? normalizeDateInputValue(this.settingsEditValue)
                : '';
            return buildDateCalendarDays({
                year: this.settingsBirthDateCalendarYear,
                month: this.settingsBirthDateCalendarMonth,
                rangeStart: selectedDate,
                rangeEnd: selectedDate,
                locale
            });
        },
        registerBirthDateCalendarDays() {
            const locale = document.documentElement.lang || 'de';
            const selectedDate = normalizeDateInputValue(this.registerBirthDate);
            return buildDateCalendarDays({
                year: this.registerBirthDateCalendarYear,
                month: this.registerBirthDateCalendarMonth,
                rangeStart: selectedDate,
                rangeEnd: selectedDate,
                locale
            });
        },
        totalPetCount() {
            return Object.values(this.petChoiceCounts).reduce((total, value) => {
                const count = Number(value);
                return total + (Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0);
            }, 0);
        },
        petDisplayValue() {
            if (this.totalPetCount <= 0) {
                if (this.headerSearchCompactMode) {
                    return this.headerSearchStrings.petCompactEmpty;
                }

                return this.headerSearchStrings.petDescription;
            }

            const selectedChoices = this.petChoices
                .map((choice) => ({
                    choice,
                    count: Number(this.petChoiceCounts[choice.value]) || 0
                }))
                .filter((entry) => entry.count > 0);
            const locale = document.documentElement.lang || 'de';

            const summary = selectedChoices
                .slice(0, 2)
                .map((entry) => `${entry.count} ${formatPetChoiceCountLabel(entry.choice.value, entry.count, locale)}`)
                .join(', ');

            if (selectedChoices.length <= 2) {
                return summary;
            }

            return `${summary} +${selectedChoices.length - 2}`;
        },
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
                message: cleanMessage || '—'
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
        },
        backendStatusLabel() {
            if (this.backendStatusState === 'online') {
                return this.headerSearchStrings.backendStatusOnline;
            }

            if (this.backendStatusState === 'offline') {
                return this.headerSearchStrings.backendStatusOffline;
            }

            return this.headerSearchStrings.backendStatusChecking;
        },
        profileOwnPagePath() {
            return this.buildProfilePath(this.authSessionUserId);
        },
        profileViewDisplayName() {
            if (!this.profileViewUser) {
                return '';
            }

            const firstName = typeof this.profileViewUser.firstName === 'string'
                ? this.profileViewUser.firstName.trim()
                : '';
            const lastName = typeof this.profileViewUser.lastName === 'string'
                ? this.profileViewUser.lastName.trim()
                : '';
            const fullName = [firstName, lastName].filter(Boolean).join(' ');
            return fullName || this.profileViewUser.email || '';
        },
        profileViewInitial() {
            const sourceText = this.profileViewDisplayName || String(this.profileViewRequestedUserId || '') || 'P';
            const firstCharacter = sourceText.trim().charAt(0) || 'P';
            return firstCharacter.toUpperCase();
        },
        profileViewRoleParts() {
            const role = typeof this.profileViewUser?.role === 'string'
                ? this.profileViewUser.role.trim().toUpperCase()
                : '';
            const city = typeof this.profileViewUser?.city === 'string'
                ? this.profileViewUser.city.trim()
                : '';
            const hostCity = city || this.profileStrings.hostCityFallback;
            const hostCountryFlagPath = typeof this.profileStrings.hostCountryFlagPath === 'string'
                ? this.profileStrings.hostCountryFlagPath.trim()
                : '';
            if (role !== 'HOST' && role !== 'PET_OWNER') {
                return {
                    label: role || '',
                    prefix: '',
                    city: '',
                    suffix: '',
                    flagPath: '',
                    showFlaggedCity: false
                };
            }

            return {
                label: hostCity,
                prefix: '',
                city: hostCity,
                suffix: '',
                flagPath: hostCountryFlagPath,
                showFlaggedCity: Boolean(hostCity && hostCountryFlagPath)
            };
        },
        profileViewBirthDateLabel() {
            return this.formatProfileDate(this.profileViewUser?.birthDate);
        },
        profileViewPhoneLabel() {
            const phone = typeof this.profileViewUser?.phone === 'string'
                ? this.profileViewUser.phone.trim()
                : '';
            return phone || '—';
        },
        profileViewLocationLabel() {
            const city = typeof this.profileViewUser?.city === 'string'
                ? this.profileViewUser.city.trim()
                : '';
            const postalCode = typeof this.profileViewUser?.postalCode === 'string'
                ? this.profileViewUser.postalCode.trim()
                : '';
            const parts = [postalCode, city].filter(Boolean);
            return parts.length ? parts.join(' ') : '—';
        },
        profileViewRatingValue() {
            const rating = Number(this.profileViewUser?.rating);
            if (!Number.isFinite(rating)) {
                return 0;
            }

            return Math.min(5, Math.max(0, rating));
        },
        profileViewRatingCount() {
            const ratingsCount = Number(this.profileViewUser?.numberOfRatings);
            if (!Number.isFinite(ratingsCount)) {
                return 0;
            }

            return Math.max(0, Math.round(ratingsCount));
        },
        profileViewRatingFirstName() {
            const firstName = typeof this.profileViewUser?.firstName === 'string'
                ? this.profileViewUser.firstName.trim()
                : '';
            if (firstName) {
                return firstName;
            }

            const displayName = typeof this.profileViewDisplayName === 'string'
                ? this.profileViewDisplayName.trim()
                : '';
            if (displayName) {
                return displayName.split(/\s+/)[0] || this.profileStrings.ratingFirstNameFallback;
            }

            return this.profileStrings.ratingFirstNameFallback;
        },
        profileViewRatingHeading() {
            return formatTemplate(this.profileStrings.ratingHeadingTemplate, {
                firstName: this.profileViewRatingFirstName,
                count: this.profileViewRatingCount
            });
        },
        profileViewRatingAriaLabel() {
            return formatTemplate(this.profileStrings.ratingAriaTemplate, {
                rating: this.profileViewRatingValue.toFixed(1),
                count: this.profileViewRatingCount
            });
        },
        profileViewRatingStarFills() {
            const rating = this.profileViewRatingValue;
            return Array.from({ length: 5 }, (_, index) => {
                const fill = Math.max(0, Math.min(1, rating - index)) * 100;
                return Number(fill.toFixed(2));
            });
        },
        profileViewAcceptedPetSpecies() {
            const acceptedPetSpecies = Array.isArray(this.profileViewUser?.acceptedPetSpecies)
                ? this.profileViewUser.acceptedPetSpecies
                : [];
            const locale = document.documentElement.lang || 'de';

            return acceptedPetSpecies
                .map((species) => {
                    if (typeof species !== 'string') {
                        return null;
                    }

                    const normalizedSpecies = species.trim().toUpperCase();
                    if (!normalizedSpecies) {
                        return null;
                    }

                    return {
                        value: normalizedSpecies,
                        label: formatPetChoiceLabel(normalizedSpecies, locale),
                        emojiPath: resolvePetChoiceEmojiPath(normalizedSpecies)
                    };
                })
                .filter((species) => Boolean(species?.label));
        },
        myPetsDisplayName() {
            if (this.myPetsViewUser) {
                const firstName = typeof this.myPetsViewUser.firstName === 'string'
                    ? this.myPetsViewUser.firstName.trim()
                    : '';
                const lastName = typeof this.myPetsViewUser.lastName === 'string'
                    ? this.myPetsViewUser.lastName.trim()
                    : '';
                const fullName = [firstName, lastName].filter(Boolean).join(' ');
                if (fullName) {
                    return fullName;
                }
                if (this.myPetsViewUser.email) {
                    return this.myPetsViewUser.email;
                }
            }

            const sessionName = [this.authSessionFirstName, this.authSessionLastName]
                .map((value) => typeof value === 'string' ? value.trim() : '')
                .filter(Boolean)
                .join(' ');
            if (sessionName) {
                return sessionName;
            }

            const normalizedEmail = this.normalizePotentiallyEncodedEmail(this.authSessionEmail);
            if (normalizedEmail) {
                return normalizedEmail;
            }

            return localizedAppStrings.genericUser;
        },
        myPetsViewInitial() {
            const sourceText = this.myPetsDisplayName || 'P';
            const firstCharacter = sourceText.trim().charAt(0) || 'P';
            return firstCharacter.toUpperCase();
        },
        myPetsCountLabel() {
            const petCount = Array.isArray(this.myPetsPets) ? this.myPetsPets.length : 0;
            const template = petCount === 1
                ? this.myPetsStrings.countTemplateSingular
                : this.myPetsStrings.countTemplatePlural;
            return formatTemplate(template, {
                count: petCount
            });
        },
        myPetsSpeciesChoices() {
            if (Array.isArray(this.registerPetChoices) && this.registerPetChoices.length) {
                return this.registerPetChoices;
            }

            const locale = document.documentElement.lang || 'de';
            return DEFAULT_PET_CHOICES.map((value) => ({
                value,
                label: formatPetChoiceLabel(value, locale),
                emojiPath: resolvePetChoiceEmojiPath(value)
            }));
        },
        myPetsFormEditing() {
            return Number.isInteger(this.myPetsFormEditingId) && this.myPetsFormEditingId > 0;
        },
        myPetsFormTitle() {
            return this.myPetsFormEditing ? this.myPetsStrings.formEditTitle : this.myPetsStrings.formAddTitle;
        },
        myPetsFormSubmitLabel() {
            return this.myPetsStrings.actions.save;
        },
        myPetsSelectedImageLabel() {
            const fileName = typeof this.myPetsFormImageFileName === 'string'
                ? this.myPetsFormImageFileName.trim()
                : '';
            if (!fileName) {
                return this.myPetsStrings.quickUploadLabel;
            }

            return this.myPetsStrings.imageSelectedTemplate.replace('{name}', fileName);
        },
        myPetsActivePet() {
            if (!Array.isArray(this.myPetsPets) || !this.myPetsPets.length) {
                return null;
            }

            const safeIndex = Math.min(
                Math.max(0, Number.isFinite(this.myPetsCarouselIndex) ? this.myPetsCarouselIndex : 0),
                this.myPetsPets.length - 1
            );
            return this.myPetsPets[safeIndex] || null;
        },
        myPetsActivePetSpeciesLabel() {
            if (!this.myPetsActivePet?.species) {
                return this.myPetsStrings.labels.species;
            }

            return formatPetChoiceLabel(this.myPetsActivePet.species, document.documentElement.lang || 'de');
        },
        myPetsActivePetSpeciesEmoji() {
            if (!this.myPetsActivePet?.species) {
                return PET_CHOICE_EMOJI_FALLBACK_ASSET_PATH;
            }

            return resolvePetChoiceEmojiPath(this.myPetsActivePet.species);
        },
        myPetsDetailPet() {
            const normalizedPetId = this.normalizeProfileUserId(this.myPetsDetailPetId);
            if (!Number.isInteger(normalizedPetId) || normalizedPetId <= 0) {
                return this.myPetsActivePet;
            }

            return this.myPetsPets.find((pet) => pet.id === normalizedPetId) || this.myPetsActivePet;
        },
        myPetsDeleteTargetPet() {
            const normalizedPetId = this.normalizeProfileUserId(this.myPetsDeletePetId);
            if (!Number.isInteger(normalizedPetId) || normalizedPetId <= 0) {
                return null;
            }

            return this.myPetsPets.find((pet) => pet.id === normalizedPetId) || null;
        },
        myPetsDeleteConfirmMessage() {
            const petName = this.myPetsDeleteTargetPet?.name || this.myPetsStrings.labels.name;
            return formatTemplate(this.myPetsStrings.confirmDeleteTemplate, {
                name: petName
            }) || this.myPetsStrings.confirmDeleteTemplate;
        },
        myPetsCarouselRenderItems() {
            const pets = Array.isArray(this.myPetsPets) ? this.myPetsPets : [];
            if (!pets.length) {
                return [];
            }

            const visibleItems = pets
                .map((pet, index) => {
                    const relativeOffset = this.getMyPetsCarouselRelativeOffset(index, pets.length);
                    const absoluteOffset = Math.abs(relativeOffset);
                    if (absoluteOffset > 2) {
                        return null;
                    }

                    let positionClass = 'my_pets_reel__card--center';
                    if (relativeOffset === -1) {
                        positionClass = 'my_pets_reel__card--left-1';
                    } else if (relativeOffset === -2) {
                        positionClass = 'my_pets_reel__card--left-2';
                    } else if (relativeOffset === 1) {
                        positionClass = 'my_pets_reel__card--right-1';
                    } else if (relativeOffset === 2) {
                        positionClass = 'my_pets_reel__card--right-2';
                    }

                    return {
                        pet,
                        index,
                        relativeOffset,
                        absoluteOffset,
                        isCenter: relativeOffset === 0,
                        positionClass
                    };
                })
                .filter(Boolean);

            return visibleItems.sort((left, right) => {
                if (left.absoluteOffset !== right.absoluteOffset) {
                    return right.absoluteOffset - left.absoluteOffset;
                }

                return left.relativeOffset - right.relativeOffset;
            });
        },
        myOffersDisplayName() {
            if (this.myOffersViewUser) {
                const firstName = typeof this.myOffersViewUser.firstName === 'string'
                    ? this.myOffersViewUser.firstName.trim()
                    : '';
                const lastName = typeof this.myOffersViewUser.lastName === 'string'
                    ? this.myOffersViewUser.lastName.trim()
                    : '';
                const fullName = [firstName, lastName].filter(Boolean).join(' ');
                if (fullName) {
                    return fullName;
                }
                if (this.myOffersViewUser.email) {
                    return this.myOffersViewUser.email;
                }
            }

            const sessionName = [this.authSessionFirstName, this.authSessionLastName]
                .map((value) => typeof value === 'string' ? value.trim() : '')
                .filter(Boolean)
                .join(' ');
            if (sessionName) {
                return sessionName;
            }

            const normalizedEmail = this.normalizePotentiallyEncodedEmail(this.authSessionEmail);
            if (normalizedEmail) {
                return normalizedEmail;
            }

            return localizedAppStrings.genericUser;
        },
        myOffersViewInitial() {
            const sourceText = this.myOffersDisplayName || 'O';
            const firstCharacter = sourceText.trim().charAt(0) || 'O';
            return firstCharacter.toUpperCase();
        },
        myOffersCountLabel() {
            const offerCount = Array.isArray(this.myOffersOffers) ? this.myOffersOffers.length : 0;
            const template = offerCount === 1
                ? this.myOffersStrings.countTemplateSingular
                : this.myOffersStrings.countTemplatePlural;
            return formatTemplate(template, {
                count: offerCount
            });
        },
        myOffersSpeciesChoices() {
            if (Array.isArray(this.registerPetChoices) && this.registerPetChoices.length) {
                return this.registerPetChoices;
            }

            const locale = document.documentElement.lang || 'de';
            return DEFAULT_PET_CHOICES.map((value) => ({
                value,
                label: formatPetChoiceLabel(value, locale),
                emojiPath: resolvePetChoiceEmojiPath(value)
            }));
        },
        myOffersCreateStepIndex() {
            const index = MY_OFFERS_CREATE_STEPS.indexOf(this.myOffersCreateStep);
            return index >= 0 ? index : 0;
        },
        myOffersCanGoToPreviousStep() {
            return this.myOffersCreateStepIndex > 0;
        },
        myOffersFormModalTitle() {
            const editingId = this.normalizeProfileUserId(this.myOffersFormEditingId);
            if (Number.isInteger(editingId) && editingId > 0) {
                return this.myOffersStrings.formEditTitle || this.myOffersStrings.formAddTitle;
            }

            return this.myOffersStrings.formAddTitle;
        },
        myOffersSelectedSpeciesPreview() {
            const selectedSpecies = Array.isArray(this.myOffersForm?.acceptedPetSpecies)
                ? this.myOffersForm.acceptedPetSpecies
                : [];
            return this.resolveMyOfferSpecies({
                acceptedPetSpecies: selectedSpecies
            });
        },
        myOffersServicesPreview() {
            return this.parseMyOfferServices(this.myOffersForm?.services || '');
        },
        myOffersImageSelectionLabel() {
            const fileName = typeof this.myOffersFormImageFileName === 'string'
                ? this.myOffersFormImageFileName.trim()
                : '';
            if (!fileName) {
                return this.myOffersStrings.imageNoneLabel || this.myOffersStrings.labels.image || '';
            }

            return formatTemplate(this.myOffersStrings.imageSelectedTemplate || '{name}', {
                name: fileName
            });
        },
        myOffersAvailabilityYearOptions() {
            const currentYear = new Date().getFullYear();
            const maxYear = Math.max(
                currentYear + CALENDAR_GENERAL_FUTURE_YEAR_OFFSET,
                this.myOffersAvailabilityCalendarYear
            );
            return buildCalendarYearOptions(maxYear);
        },
        myOffersAvailabilityCalendarWeekdayLabels() {
            const locale = document.documentElement.lang || 'de';
            return getCalendarWeekdayLabels(locale);
        },
        myOffersAvailabilityCalendarDays() {
            const locale = document.documentElement.lang || 'de';
            return buildDateCalendarDays({
                year: this.myOffersAvailabilityCalendarYear,
                month: this.myOffersAvailabilityCalendarMonth,
                rangeStart: this.myOffersForm?.availableFrom || '',
                rangeEnd: this.myOffersForm?.availableTo || '',
                locale
            });
        },
        myOffersAvailabilityStartLabel() {
            const locale = document.documentElement.lang || 'de';
            return formatSearchDate(this.myOffersForm?.availableFrom || '', locale) || '--';
        },
        myOffersAvailabilityEndLabel() {
            const locale = document.documentElement.lang || 'de';
            return formatSearchDate(this.myOffersForm?.availableTo || '', locale) || '--';
        },
        myOffersActiveOffer() {
            if (!Array.isArray(this.myOffersOffers) || !this.myOffersOffers.length) {
                return null;
            }

            const safeIndex = Math.min(
                Math.max(0, Number.isFinite(this.myOffersCarouselIndex) ? this.myOffersCarouselIndex : 0),
                this.myOffersOffers.length - 1
            );
            return this.myOffersOffers[safeIndex] || null;
        },
        myOffersCarouselRenderItems() {
            const offers = Array.isArray(this.myOffersOffers) ? this.myOffersOffers : [];
            if (!offers.length) {
                return [];
            }

            const visibleItems = offers
                .map((offer, index) => {
                    const relativeOffset = this.getMyOffersCarouselRelativeOffset(index, offers.length);
                    const absoluteOffset = Math.abs(relativeOffset);
                    if (absoluteOffset > 1) {
                        return null;
                    }

                    let positionClass = 'my_offers_carousel__card--center';
                    if (relativeOffset === -1) {
                        positionClass = 'my_offers_carousel__card--left';
                    } else if (relativeOffset === 1) {
                        positionClass = 'my_offers_carousel__card--right';
                    }

                    return {
                        offer,
                        index,
                        relativeOffset,
                        absoluteOffset,
                        isCenter: relativeOffset === 0,
                        positionClass
                    };
                })
                .filter(Boolean);

            return visibleItems.sort((left, right) => {
                if (left.absoluteOffset !== right.absoluteOffset) {
                    return right.absoluteOffset - left.absoluteOffset;
                }

                return left.relativeOffset - right.relativeOffset;
            });
        },
        homeOfferSpeciesChoices() {
            const locale = document.documentElement.lang || 'de';
            const choiceValues = Array.isArray(this.registerPetChoices) && this.registerPetChoices.length
                ? this.registerPetChoices
                    .map((choice) => (typeof choice?.value === 'string' ? choice.value.trim().toUpperCase() : ''))
                    .filter(Boolean)
                : [...DEFAULT_PET_CHOICES];
            const uniqueChoices = [...new Set(choiceValues)];
            const options = uniqueChoices.map((value) => ({
                value,
                label: formatPetChoiceCountLabel(value, 2, locale),
                emojiPath: resolvePetChoiceEmojiPath(value)
            }));

            return [
                {
                    value: 'ALL',
                    label: this.homeStrings.allSpeciesLabel,
                    emojiPath: PET_CHOICE_EMOJI_FALLBACK_ASSET_PATH
                },
                ...options
            ];
        },
        homeActiveSpeciesLabel() {
            const selectedValue = typeof this.homeOfferSpeciesFilter === 'string'
                ? this.homeOfferSpeciesFilter.trim().toUpperCase()
                : 'ALL';
            const activeOption = this.homeOfferSpeciesChoices
                .find((choice) => choice.value === selectedValue);

            return activeOption?.label || this.homeStrings.allSpeciesLabel;
        },
        homeActiveSpeciesEmojiPath() {
            const selectedValue = typeof this.homeOfferSpeciesFilter === 'string'
                ? this.homeOfferSpeciesFilter.trim().toUpperCase()
                : 'ALL';
            const activeOption = this.homeOfferSpeciesChoices
                .find((choice) => choice.value === selectedValue);

            return activeOption?.emojiPath || PET_CHOICE_EMOJI_FALLBACK_ASSET_PATH;
        },
        homeFilteredOffers() {
            const offers = Array.isArray(this.homeOffers) ? this.homeOffers : [];
            const selectedSpecies = typeof this.homeOfferSpeciesFilter === 'string'
                ? this.homeOfferSpeciesFilter.trim().toUpperCase()
                : 'ALL';
            const sessionUserId = this.normalizeProfileUserId(this.authSessionUserId);

            return offers.filter((offer) => {
                if (this.normalizeMyOfferStatus(offer?.status) !== 'PUBLISHED') {
                    return false;
                }

                if (
                    this.authSessionLoggedIn
                    && Number.isInteger(sessionUserId)
                    && sessionUserId > 0
                    && this.normalizeProfileUserId(offer?.hostId) === sessionUserId
                ) {
                    return false;
                }

                if (selectedSpecies === 'ALL') {
                    return true;
                }

                const speciesList = Array.isArray(offer?.acceptedPetSpecies)
                    ? offer.acceptedPetSpecies
                    : [];
                return speciesList.includes(selectedSpecies);
            });
        },
        homeActiveOffer() {
            const offers = Array.isArray(this.homeFilteredOffers) ? this.homeFilteredOffers : [];
            if (!offers.length) {
                return null;
            }

            const safeIndex = Math.min(
                Math.max(0, Number.isFinite(this.homeOffersCarouselIndex) ? this.homeOffersCarouselIndex : 0),
                offers.length - 1
            );
            return offers[safeIndex] || null;
        },
        homeCarouselRenderItems() {
            const offers = Array.isArray(this.homeFilteredOffers) ? this.homeFilteredOffers : [];
            if (!offers.length) {
                return [];
            }

            const visibleItems = offers
                .map((offer, index) => {
                    const relativeOffset = this.getHomeOffersCarouselRelativeOffset(index, offers.length);
                    const absoluteOffset = Math.abs(relativeOffset);
                    if (absoluteOffset > 3) {
                        return null;
                    }

                    let positionClass = 'home_offers_reel__card--center';
                    if (relativeOffset === -1) {
                        positionClass = 'home_offers_reel__card--left-1';
                    } else if (relativeOffset === -2) {
                        positionClass = 'home_offers_reel__card--left-2';
                    } else if (relativeOffset === -3) {
                        positionClass = 'home_offers_reel__card--left-3';
                    } else if (relativeOffset === 1) {
                        positionClass = 'home_offers_reel__card--right-1';
                    } else if (relativeOffset === 2) {
                        positionClass = 'home_offers_reel__card--right-2';
                    } else if (relativeOffset === 3) {
                        positionClass = 'home_offers_reel__card--right-3';
                    }

                    return {
                        offer,
                        index,
                        relativeOffset,
                        absoluteOffset,
                        isCenter: relativeOffset === 0,
                        positionClass
                    };
                })
                .filter(Boolean);

            return visibleItems.sort((left, right) => {
                if (left.absoluteOffset !== right.absoluteOffset) {
                    return right.absoluteOffset - left.absoluteOffset;
                }

                return left.relativeOffset - right.relativeOffset;
            });
        },
        homeLatestFilteredOffers() {
            const offers = Array.isArray(this.homeLatestOffers) ? this.homeLatestOffers : [];
            return offers
                .filter((offer) => this.normalizeMyOfferStatus(offer?.status) === 'PUBLISHED')
                .slice(0, 10);
        },
        homeLatestEdgeVisibleCount() {
            const offerCount = Array.isArray(this.homeLatestFilteredOffers)
                ? this.homeLatestFilteredOffers.length
                : 0;
            if (!offerCount) {
                return 0;
            }

            const viewportWidth = Number.isFinite(this.homeLatestViewportWidth)
                ? this.homeLatestViewportWidth
                : 1280;

            let preferredCount = 1;
            if (viewportWidth >= 1220) {
                preferredCount = 5;
            } else if (viewportWidth >= 980) {
                preferredCount = 4;
            } else if (viewportWidth >= 760) {
                preferredCount = 3;
            } else if (viewportWidth >= 560) {
                preferredCount = 2;
            }

            return Math.max(1, Math.min(preferredCount, offerCount));
        },
        homeLatestMaxOffset() {
            const offerCount = Array.isArray(this.homeLatestFilteredOffers)
                ? this.homeLatestFilteredOffers.length
                : 0;
            const edgeVisibleCount = this.homeLatestEdgeVisibleCount;

            if (!offerCount || !edgeVisibleCount) {
                return 0;
            }

            return Math.max(0, offerCount - edgeVisibleCount);
        },
        homeLatestSafeOffset() {
            const maxOffset = Number.isFinite(this.homeLatestMaxOffset)
                ? Math.max(0, Math.round(this.homeLatestMaxOffset))
                : 0;
            const offset = Number.isFinite(this.homeLatestCarouselOffset)
                ? Math.round(this.homeLatestCarouselOffset)
                : 0;
            return Math.min(maxOffset, Math.max(0, offset));
        },
        homeLatestHasLeftPeek() {
            return this.homeLatestSafeOffset > 0;
        },
        homeLatestHasRightPeek() {
            return this.homeLatestSafeOffset < this.homeLatestMaxOffset;
        },
        homeLatestCarouselRenderItems() {
            const offers = Array.isArray(this.homeLatestFilteredOffers) ? this.homeLatestFilteredOffers : [];
            if (!offers.length) {
                return [];
            }

            const edgeVisibleCount = this.homeLatestEdgeVisibleCount;
            if (!edgeVisibleCount) {
                return [];
            }

            const hasLeftPeek = this.homeLatestHasLeftPeek;
            const hasRightPeek = this.homeLatestHasRightPeek;
            const fullCardCount = hasLeftPeek && hasRightPeek
                ? Math.max(1, edgeVisibleCount - 1)
                : edgeVisibleCount;
            const offset = this.homeLatestSafeOffset;
            const maxOffset = this.homeLatestMaxOffset;
            let fullStart = offset;

            if (hasRightPeek) {
                const maxStartForRightPeek = Math.max(0, offers.length - (fullCardCount + 1));
                fullStart = Math.min(fullStart, Math.max(maxStartForRightPeek, 0));
            } else if (offset === maxOffset) {
                fullStart = Math.max(0, offers.length - fullCardCount);
            }

            const fullEnd = Math.min(offers.length, fullStart + fullCardCount);
            const renderItems = [];

            if (hasLeftPeek && fullStart - 1 >= 0) {
                renderItems.push({
                    offer: offers[fullStart - 1],
                    role: 'peek-left',
                    className: 'home_latest_offers__item--peek-left'
                });
            }

            for (let index = fullStart; index < fullEnd; index += 1) {
                renderItems.push({
                    offer: offers[index],
                    role: 'full',
                    className: 'home_latest_offers__item--full'
                });
            }

            if (hasRightPeek && fullEnd < offers.length) {
                renderItems.push({
                    offer: offers[fullEnd],
                    role: 'peek-right',
                    className: 'home_latest_offers__item--peek-right'
                });
            }

            return renderItems;
        },
        homeOfferDetailOffer() {
            if (!this.homeOfferDetailModalOpen) {
                return null;
            }

            const detailOfferId = this.normalizeProfileUserId(this.homeOfferDetailOfferId);
            if (!Number.isInteger(detailOfferId) || detailOfferId <= 0) {
                return this.homeActiveOffer || this.homeLatestFilteredOffers[0] || null;
            }

            return this.findHomeOfferById(detailOfferId)
                || this.homeActiveOffer
                || this.homeLatestFilteredOffers[0]
                || null;
        },
        homeOfferDetailPrimarySpecies() {
            const detailOffer = this.homeOfferDetailOffer;
            if (!detailOffer) {
                return null;
            }

            const speciesList = this.resolveMyOfferSpecies(detailOffer);
            return speciesList.length ? speciesList[0] : null;
        },
        settingsViewDisplayName() {
            if (!this.settingsViewUser) {
                return '';
            }

            const firstName = typeof this.settingsViewUser.firstName === 'string'
                ? this.settingsViewUser.firstName.trim()
                : '';
            const lastName = typeof this.settingsViewUser.lastName === 'string'
                ? this.settingsViewUser.lastName.trim()
                : '';
            const fullName = [firstName, lastName].filter(Boolean).join(' ');
            return fullName || this.settingsViewUser.email || '';
        },
        settingsViewInitial() {
            const sourceText = this.settingsViewDisplayName || this.settingsStrings.emptyValue || 'S';
            const firstCharacter = sourceText.trim().charAt(0) || 'S';
            return firstCharacter.toUpperCase();
        },
        settingsViewRoleLabel() {
            const role = typeof this.settingsViewUser?.role === 'string'
                ? this.settingsViewUser.role.trim().toUpperCase()
                : '';

            if (role === 'HOST') {
                return this.settingsStrings.roleHost;
            }

            if (role === 'PET_OWNER') {
                return this.settingsStrings.rolePetOwner;
            }

            return role || this.settingsStrings.emptyValue;
        },
        settingsViewAcceptedPetSpecies() {
            const acceptedPetSpecies = Array.isArray(this.settingsViewUser?.acceptedPetSpecies)
                ? this.settingsViewUser.acceptedPetSpecies
                : [];
            const locale = document.documentElement.lang || 'de';

            return acceptedPetSpecies
                .map((species) => {
                    if (typeof species !== 'string') {
                        return null;
                    }

                    const normalizedSpecies = species.trim().toUpperCase();
                    if (!normalizedSpecies) {
                        return null;
                    }

                    return {
                        value: normalizedSpecies,
                        label: formatPetChoiceLabel(normalizedSpecies, locale),
                        emojiPath: resolvePetChoiceEmojiPath(normalizedSpecies)
                    };
                })
                .filter((species) => Boolean(species?.label));
        },
        settingsFactCards() {
            if (!this.settingsViewUser) {
                return [];
            }

            const emptyValue = this.settingsStrings.emptyValue;
            const settingsPhoneDisplay = this.buildSettingsPhoneDisplayParts(this.settingsViewUser.phone || '');
            const settingsCityDisplay = this.buildSettingsCityDisplayParts(this.settingsViewUser.city || '');
            const acceptedSpeciesLabel = this.settingsViewAcceptedPetSpecies.length
                ? this.settingsViewAcceptedPetSpecies.map((species) => species.label).join(', ')
                : emptyValue;
            const locationParts = [
                typeof this.settingsViewUser.postalCode === 'string' ? this.settingsViewUser.postalCode.trim() : '',
                typeof this.settingsViewUser.city === 'string' ? this.settingsViewUser.city.trim() : ''
            ].filter(Boolean);

            return [
                {
                    key: 'firstName',
                    label: this.settingsStrings.labels.firstName,
                    displayValue: this.settingsViewUser.firstName || emptyValue
                },
                {
                    key: 'lastName',
                    label: this.settingsStrings.labels.lastName,
                    displayValue: this.settingsViewUser.lastName || emptyValue
                },
                {
                    key: 'email',
                    label: this.settingsStrings.labels.email,
                    displayValue: this.settingsViewUser.email || emptyValue
                },
                {
                    key: 'password',
                    label: this.settingsStrings.labels.password,
                    displayValue: this.settingsStrings.passwordMasked
                },
                {
                    key: 'phone',
                    label: this.settingsStrings.labels.phone,
                    displayValue: settingsPhoneDisplay.displayValue || emptyValue,
                    phoneFlagPath: settingsPhoneDisplay.flagPath,
                    phoneCountryName: settingsPhoneDisplay.countryName
                },
                {
                    key: 'birthDate',
                    label: this.settingsStrings.labels.birthDate,
                    displayValue: this.formatProfileDate(this.settingsViewUser.birthDate) || emptyValue
                },
                {
                    key: 'emergencyContact',
                    label: this.settingsStrings.labels.emergencyContact,
                    displayValue: this.settingsViewUser.emergencyContact || emptyValue
                },
                {
                    key: 'role',
                    label: this.settingsStrings.labels.role,
                    displayValue: this.settingsViewRoleLabel || emptyValue
                },
                {
                    key: 'city',
                    label: this.settingsStrings.labels.city,
                    displayValue: settingsCityDisplay.displayValue || emptyValue,
                    cityFlagPath: settingsCityDisplay.flagPath,
                    cityCountryName: settingsCityDisplay.countryName
                },
                {
                    key: 'postalCode',
                    label: this.settingsStrings.labels.postalCode,
                    displayValue: locationParts[0] || emptyValue
                },
                {
                    key: 'bio',
                    label: this.settingsStrings.labels.bio,
                    displayValue: this.settingsViewUser.bio || emptyValue,
                    wide: true
                },
                {
                    key: 'acceptedPetSpecies',
                    label: this.settingsStrings.labels.acceptedPetSpecies,
                    displayValue: acceptedSpeciesLabel,
                    wide: true
                }
            ];
        },
        settingsEditModalTitle() {
            const fieldLabel = this.getSettingsFieldLabel(this.settingsEditField);
            return this.settingsStrings.editTitleTemplate.replace('{field}', fieldLabel);
        },
        settingsEditPlaceholder() {
            const placeholder = this.settingsStrings.placeholders[this.settingsEditField];
            if (typeof placeholder === 'string' && placeholder.trim()) {
                return placeholder.trim();
            }

            return this.getSettingsFieldLabel(this.settingsEditField);
        },
        settingsEditInputType() {
            if (this.settingsEditField === 'email') {
                return 'email';
            }

            if (this.settingsEditField === 'password') {
                return 'password';
            }

            if (this.settingsEditField === 'birthDate') {
                return 'date';
            }

            if (this.settingsEditField === 'phone') {
                return 'tel';
            }

            return 'text';
        },
        settingsPasswordCriteria() {
            const password = typeof this.settingsEditNewPassword === 'string' ? this.settingsEditNewPassword : '';
            return buildPasswordCriteria(password, localizedPasswordCriteriaStrings, {
                email: this.settingsViewUser?.email,
                firstName: this.settingsViewUser?.firstName,
                lastName: this.settingsViewUser?.lastName
            });
        },
        allSettingsPasswordCriteriaMet() {
            return this.settingsPasswordCriteria.every((criterion) => criterion.met);
        },
        settingsPetChoiceOptions() {
            if (Array.isArray(this.registerPetChoices) && this.registerPetChoices.length) {
                return this.registerPetChoices;
            }

            const locale = document.documentElement.lang || 'de';
            return DEFAULT_PET_CHOICES.map((value) => ({
                value,
                label: formatPetChoiceLabel(value, locale),
                emojiPath: resolvePetChoiceEmojiPath(value)
            }));
        },
        settingsProfileImageSelectionLabel() {
            const fileName = typeof this.settingsEditProfileFileName === 'string'
                ? this.settingsEditProfileFileName.trim()
                : '';
            if (!fileName) {
                return this.settingsStrings.imageUploadHint;
            }

            return this.settingsStrings.imageSelectedTemplate.replace('{name}', fileName);
        },
        settingsCanResetProfileImage() {
            return !isDefaultProfilePicturePath(this.settingsViewUser?.profilePicture);
        },
        authSessionGreeting() {
            const sourceFirstName = this.normalizeAuthSessionFirstName(this.authSessionFirstName)
                || this.deriveFirstNameFromEmail(this.authSessionEmail)
                || localizedAppStrings.genericUser;
            const truncatedFirstName = this.truncateAuthSessionName(sourceFirstName, 8);
            return formatTemplate(localizedAppStrings.sessionGreetingTemplate, {
                firstName: truncatedFirstName || localizedAppStrings.genericUser
            });
        },
        authSessionInitial() {
            const sourceEmail = typeof this.authSessionEmail === 'string' ? this.authSessionEmail.trim() : '';
            const localPart = sourceEmail.includes('@') ? sourceEmail.split('@')[0] : sourceEmail;
            const compactLocalPart = localPart.replace(/[^a-zA-Z0-9]/g, '');
            const firstCharacter = compactLocalPart.charAt(0) || localPart.charAt(0) || 'U';
            return firstCharacter.toUpperCase();
        }
    },
    watch: {
        authSessionLoggedIn(nextValue, previousValue) {
            if (nextValue === previousValue) {
                return;
            }

            nextTick(() => {
                this.initializeDropdowns();
            });
        },
        profileViewTab(nextValue) {
            if (!profilePageRoot) {
                return;
            }

            if (nextValue !== 'information' && nextValue !== 'ownPets' && nextValue !== 'offers') {
                this.profileViewTab = 'information';
                return;
            }

            nextTick(() => {
                this.updateSegmentedIndicators();
            });
        },
        profileViewLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showProfileViewLoadingDots', 'profileViewLoading', nextValue);
        },
        homeViewLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showHomeViewLoadingDots', 'homeViewLoading', nextValue);
        },
        myPetsViewLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showMyPetsViewLoadingDots', 'myPetsViewLoading', nextValue);
        },
        myOffersViewLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showMyOffersViewLoadingDots', 'myOffersViewLoading', nextValue);
        },
        settingsViewLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showSettingsViewLoadingDots', 'settingsViewLoading', nextValue);
        },
        myPetsPets(nextValue) {
            if (!Array.isArray(nextValue) || !nextValue.length) {
                this.myPetsCarouselIndex = 0;
                if (this.myPetsFormEditing) {
                    this.resetMyPetForm();
                }
                this.myPetsDetailPetId = null;
                this.myPetsDetailEditing = false;
                this.myPetsDetailModalOpen = false;
                this.myPetsDeletePetId = null;
                this.myPetsDeleteModalOpen = false;
                this.myPetsDeleteSubmitting = false;
                return;
            }

            const maxIndex = nextValue.length - 1;
            if (!Number.isInteger(this.myPetsCarouselIndex) || this.myPetsCarouselIndex < 0) {
                this.myPetsCarouselIndex = 0;
                return;
            }

            if (this.myPetsCarouselIndex > maxIndex) {
                this.myPetsCarouselIndex = maxIndex;
            }

            if (this.myPetsDetailModalOpen) {
                const normalizedDetailPetId = this.normalizeProfileUserId(this.myPetsDetailPetId);
                if (!Number.isInteger(normalizedDetailPetId) || normalizedDetailPetId <= 0) {
                    const fallbackPet = nextValue[this.myPetsCarouselIndex] || nextValue[0];
                    this.myPetsDetailPetId = fallbackPet?.id || null;
                } else if (!nextValue.some((pet) => pet.id === normalizedDetailPetId)) {
                    this.closeMyPetsDetailModal();
                }
            }

            if (this.myPetsDeleteModalOpen) {
                const normalizedDeletePetId = this.normalizeProfileUserId(this.myPetsDeletePetId);
                if (!Number.isInteger(normalizedDeletePetId) || normalizedDeletePetId <= 0) {
                    this.closeMyPetsDeleteModal();
                } else if (!nextValue.some((pet) => pet.id === normalizedDeletePetId)) {
                    this.closeMyPetsDeleteModal();
                }
            }
        },
        myOffersOffers(nextValue) {
            if (!Array.isArray(nextValue) || !nextValue.length) {
                this.myOffersCarouselIndex = 0;
                this.myOffersActionPendingId = null;
                return;
            }

            const maxIndex = nextValue.length - 1;
            if (!Number.isInteger(this.myOffersCarouselIndex) || this.myOffersCarouselIndex < 0) {
                this.myOffersCarouselIndex = 0;
                return;
            }

            if (this.myOffersCarouselIndex > maxIndex) {
                this.myOffersCarouselIndex = maxIndex;
            }
        },
        homeFilteredOffers(nextValue) {
            if (!Array.isArray(nextValue) || !nextValue.length) {
                this.homeOffersCarouselIndex = 0;
                if (!this.homeLatestFilteredOffers.length) {
                    this.closeHomeOfferDetailModal();
                }
                return;
            }

            const maxIndex = nextValue.length - 1;
            if (!Number.isInteger(this.homeOffersCarouselIndex) || this.homeOffersCarouselIndex < 0) {
                this.homeOffersCarouselIndex = 0;
            } else if (this.homeOffersCarouselIndex > maxIndex) {
                this.homeOffersCarouselIndex = maxIndex;
            }

            if (this.homeOfferDetailModalOpen) {
                const detailOfferId = this.normalizeProfileUserId(this.homeOfferDetailOfferId);
                if (
                    !Number.isInteger(detailOfferId)
                    || detailOfferId <= 0
                    || !this.findHomeOfferById(detailOfferId)
                ) {
                    this.closeHomeOfferDetailModal();
                }
            }

            this.prefetchHomeOfferHostCity(this.homeActiveOffer);
        },
        homeLatestFilteredOffers(nextValue) {
            if (!Array.isArray(nextValue) || !nextValue.length) {
                this.homeLatestCarouselOffset = 0;
                if (!this.homeFilteredOffers.length) {
                    this.closeHomeOfferDetailModal();
                }
                return;
            }

            const maxOffset = this.homeLatestMaxOffset;
            if (!Number.isInteger(this.homeLatestCarouselOffset) || this.homeLatestCarouselOffset < 0) {
                this.homeLatestCarouselOffset = 0;
            } else if (this.homeLatestCarouselOffset > maxOffset) {
                this.homeLatestCarouselOffset = maxOffset;
            }

            if (this.homeOfferDetailModalOpen) {
                const detailOfferId = this.normalizeProfileUserId(this.homeOfferDetailOfferId);
                if (!Number.isInteger(detailOfferId) || detailOfferId <= 0 || !this.findHomeOfferById(detailOfferId)) {
                    this.closeHomeOfferDetailModal();
                }
            }

            this.prefetchHomeLatestVisibleHostCities();
        },
        settingsCityOptionsLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showSettingsCityOptionsLoadingDots', 'settingsCityOptionsLoading', nextValue);
        },
        userSearchLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showUserSearchLoadingDots', 'userSearchLoading', nextValue);
        },
        registerCityOptionsLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showRegisterCityOptionsLoadingDots', 'registerCityOptionsLoading', nextValue);
        },
        myOffersCityOptionsLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showMyOffersCityOptionsLoadingDots', 'myOffersCityOptionsLoading', nextValue);
        },
        registerPetChoicesLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showRegisterPetChoicesLoadingDots', 'registerPetChoicesLoading', nextValue);
        },
        locationOptionsLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showLocationOptionsLoadingDots', 'locationOptionsLoading', nextValue);
        },
        petChoicesLoading(nextValue) {
            this.updateDelayedLoadingIndicator('showPetChoicesLoadingDots', 'petChoicesLoading', nextValue);
        },
        locationQuery(nextValue) {
            this.scheduleLocationSearch(nextValue);
            this.persistHeaderSearchState();
        },
        selectedLocation: {
            deep: true,
            handler() {
                this.persistHeaderSearchState();
            }
        },
        dateRangeStart() {
            this.persistHeaderSearchState();
        },
        dateRangeEnd() {
            this.persistHeaderSearchState();
        },
        petChoiceCounts: {
            deep: true,
            handler() {
                this.persistHeaderSearchState();
            }
        },
        scrolled(nextValue, previousValue) {
            if (!nextValue && previousValue) {
                this.refreshBackendStatus();
            }
        },
        headerCenterTab() {
            this.persistHeaderSearchState();
        }
    },
    mounted() {
        this.headerSurfaceElement = document.querySelector('#site-shell-header .header_surface');
        this.headerMotionLowPerformance = this.shouldUseLowPerformanceHeaderMotion();
        this.headerScrollProgressPrecision = this.headerMotionLowPerformance
            ? HEADER_SCROLL_PROGRESS_LOW_PERF_PRECISION
            : HEADER_SCROLL_PROGRESS_PRECISION;
        if (this.headerSurfaceElement) {
            this.headerSurfaceElement.classList.toggle('header_surface--fast-scroll', this.headerMotionLowPerformance);
        }
        this.initializeHeaderSearch();
        this.initializeRepositoryViews();
        this.initializeDropdowns();
        this.initializeThreadBackground();
        this.ensureRepositoryState();
        this.syncScrollState();
        this.handleResize();
        this.animateVisibleMetricGroups({ fromZero: true });
        this.refreshRepositoryData();
        this.refreshAuthSession();
        this.refreshBackendStatus({ showCheckingState: true });
        this.startBackendStatusPolling();
        this.initializePlaywrightRunner();
        window.addEventListener('scroll', this.syncScrollState, { passive: true });
        window.addEventListener('resize', this.handleResize, { passive: true });
        document.addEventListener('scroll', this.repositionOpenPhoneCountryDropdownPanels, true);
        document.addEventListener('pointerdown', this.handleDocumentPointerDown);
        document.addEventListener('toggle', this.handleDocumentDropdownToggle, true);
        document.addEventListener('click', this.handleDocumentClick);
        document.addEventListener('keydown', this.handleDocumentKeydown);
        this.patchLegacyLoginLinks();
        this.consumeRedirectNotification();
        this.initializeRegisterFlow();
        this.initializeHomeView();
        this.initializeProfileView();
        this.initializeMyPetsView();
        this.initializeMyOffersView();
        this.initializeSettingsView();
        if (document.fonts?.ready) {
            document.fonts.ready
                .then(() => {
                    this.updateSegmentedIndicators();
                })
                .catch(() => {
                    // Ignore font-loading errors and keep current segmented geometry.
                });
        }
    },
    beforeUnmount() {
        window.removeEventListener('scroll', this.syncScrollState);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('scroll', this.repositionOpenPhoneCountryDropdownPanels, true);
        document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
        document.removeEventListener('toggle', this.handleDocumentDropdownToggle, true);
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('keydown', this.handleDocumentKeydown);
        if (this.headerSearchTabsResizeObserver) {
            this.headerSearchTabsResizeObserver.disconnect();
            this.headerSearchTabsResizeObserver = null;
        }
        this.clearDropdownQueue();
        this.closeAllDropdowns({ immediate: true });
        this.destroyThreadBackground();
        this.stopBackendStatusPolling();
        this.stopPlaywrightPolling();
        this.stopAllMetricAnimations();
        this.clearNotificationTimers();
        this.clearAllLoadingIndicatorTimers();
        this.clearLocationSearchRuntime();
        this.clearRegisterCitySearchRuntime();
        this.clearMyOffersCitySearchRuntime();
        this.clearSettingsCitySearchRuntime();
        this.clearSettingsCityLookupRuntime();
        this.closeHomeOfferDetailModal();
        this.clearMyOffersFormImageSelection();
        this.clearMyOffersLocalImageMap();
        if (this.segmentedIndicatorRetryFrame > 0) {
            window.cancelAnimationFrame(this.segmentedIndicatorRetryFrame);
            this.segmentedIndicatorRetryFrame = 0;
        }
        if (this.headerScrollSyncFrame > 0) {
            window.cancelAnimationFrame(this.headerScrollSyncFrame);
            this.headerScrollSyncFrame = 0;
        }
        headerScrollAnimationState.progress = 0;
        headerScrollAnimationState.appliedProgress = Number.NaN;
        this.headerSurfaceElement = null;
        document.body.classList.remove('body--modal-open');
    },
    methods: {
        clearLoadingIndicatorTimer(targetFlag = '') {
            if (!targetFlag) {
                return;
            }

            const activeTimer = this.loadingIndicatorTimers?.[targetFlag];
            if (typeof activeTimer === 'number') {
                window.clearTimeout(activeTimer);
            }
            this.loadingIndicatorTimers[targetFlag] = null;
        },
        updateDelayedLoadingIndicator(targetFlag = '', sourceFlag = '', isLoading = false, delayMs = LOADING_INDICATOR_DELAY_MS) {
            if (!targetFlag || !sourceFlag || typeof this[targetFlag] !== 'boolean' || typeof this[sourceFlag] !== 'boolean') {
                return;
            }

            this.clearLoadingIndicatorTimer(targetFlag);

            if (!isLoading) {
                this[targetFlag] = false;
                return;
            }

            const normalizedDelay = Number.isFinite(Number(delayMs)) ? Math.max(0, Number(delayMs)) : LOADING_INDICATOR_DELAY_MS;
            if (normalizedDelay === 0) {
                this[targetFlag] = true;
                return;
            }

            const timerHandle = window.setTimeout(() => {
                this.loadingIndicatorTimers[targetFlag] = null;
                if (this[sourceFlag]) {
                    this[targetFlag] = true;
                }
            }, normalizedDelay);
            this.loadingIndicatorTimers[targetFlag] = timerHandle;
        },
        clearAllLoadingIndicatorTimers() {
            Object.keys(this.loadingIndicatorTimers || {}).forEach((targetFlag) => {
                this.clearLoadingIndicatorTimer(targetFlag);
                if (typeof this[targetFlag] === 'boolean') {
                    this[targetFlag] = false;
                }
            });
        },
        persistHeaderSearchState() {
            writeHeaderSearchSessionState({
                headerCenterTab: this.headerCenterTab,
                locationQuery: this.locationQuery,
                selectedLocation: this.selectedLocation,
                dateRangeStart: this.dateRangeStart,
                dateRangeEnd: this.dateRangeEnd,
                petChoiceCounts: this.petChoiceCounts
            });
        },
        initializeHeaderSearch() {
            const headerSearchElement = document.querySelector('[data-header-search]');
            if (!headerSearchElement) {
                return;
            }

            this.locationOptions = [];
            this.locationOptionsLoading = false;
            this.syncDateCalendarView(this.dateRangeStart || this.dateRangeEnd);
            this.scheduleLocationSearch(this.locationQuery);
            this.loadPetChoices();
            this.syncHeaderSearchTabsGeometry();
            this.$nextTick(() => {
                this.syncHeaderSearchTabsGeometry();
            });

            if (typeof ResizeObserver === 'function') {
                const tabsElement = headerSearchElement.querySelector('.header_search_tabs');
                if (tabsElement) {
                    if (this.headerSearchTabsResizeObserver) {
                        this.headerSearchTabsResizeObserver.disconnect();
                    }

                    this.headerSearchTabsResizeObserver = new ResizeObserver(() => {
                        this.syncHeaderSearchTabsGeometry();
                    });
                    this.headerSearchTabsResizeObserver.observe(tabsElement);
                }
            }
        },
        syncHeaderSearchTabsGeometry() {
            const headerSearchElement = document.querySelector('[data-header-search]');
            if (!headerSearchElement) {
                return;
            }

            const tabsElement = headerSearchElement.querySelector('.header_search_tabs');
            if (!tabsElement) {
                return;
            }

            const width = tabsElement.getBoundingClientRect().width;
            if (!Number.isFinite(width) || width <= 0) {
                return;
            }

            headerSearchElement.style.setProperty('--header-search-tabs-bridge-width', `${width.toFixed(3)}px`);
        },
        startBackendStatusPolling() {
            if (typeof this.backendStatusPollingHandle === 'number') {
                return;
            }

            this.backendStatusPollingHandle = window.setInterval(() => {
                this.refreshBackendStatus();
            }, BACKEND_STATUS_POLL_INTERVAL_MS);
        },
        stopBackendStatusPolling() {
            if (typeof this.backendStatusPollingHandle === 'number') {
                window.clearInterval(this.backendStatusPollingHandle);
            }

            this.backendStatusPollingHandle = null;
        },
        async refreshBackendStatus(options = {}) {
            const showCheckingState = options?.showCheckingState === true;
            const requestId = this.backendStatusRequestId + 1;
            this.backendStatusRequestId = requestId;
            this.backendStatusChecking = true;

            if (showCheckingState) {
                this.backendStatusState = 'checking';
            }

            try {
                const response = await apiFetch(BACKEND_STATUS_ENDPOINT, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });

                if (requestId !== this.backendStatusRequestId) {
                    return;
                }

                if (!response.ok) {
                    this.backendStatusState = 'offline';
                    return;
                }

                const payload = await response.json().catch(() => null);
                const hasSessionShape = Boolean(payload)
                    && typeof payload === 'object'
                    && payload.success !== false
                    && payload.data
                    && typeof payload.data === 'object'
                    && typeof payload.data.loggedIn === 'boolean';

                this.backendStatusState = hasSessionShape ? 'online' : 'offline';
            } catch {
                if (requestId !== this.backendStatusRequestId) {
                    return;
                }

                this.backendStatusState = 'offline';
            } finally {
                if (requestId === this.backendStatusRequestId) {
                    this.backendStatusChecking = false;
                }
            }
        },
        clearLocationSearchRuntime() {
            if (typeof this.locationSearchDebounceHandle === 'number') {
                window.clearTimeout(this.locationSearchDebounceHandle);
            }
            this.locationSearchDebounceHandle = null;

            if (this.locationSearchAbortController) {
                this.locationSearchAbortController.abort();
                this.locationSearchAbortController = null;
            }
        },
        scheduleLocationSearch(query) {
            if (!headerSearchRoot) {
                return;
            }

            const trimmedQuery = typeof query === 'string' ? query.trim() : '';
            if (typeof this.locationSearchDebounceHandle === 'number') {
                window.clearTimeout(this.locationSearchDebounceHandle);
                this.locationSearchDebounceHandle = null;
            }

            if (trimmedQuery.length < 2) {
                if (this.locationSearchAbortController) {
                    this.locationSearchAbortController.abort();
                    this.locationSearchAbortController = null;
                }
                this.locationOptions = [];
                this.locationOptionsLoading = false;
                return;
            }

            this.locationSearchDebounceHandle = window.setTimeout(() => {
                this.fetchLocationOptions(trimmedQuery);
            }, 240);
        },
        async fetchLocationOptions(query) {
            const trimmedQuery = typeof query === 'string' ? query.trim() : '';
            if (trimmedQuery.length < 2) {
                this.locationOptions = [];
                this.locationOptionsLoading = false;
                return;
            }

            const requestId = this.locationSearchRequestId + 1;
            this.locationSearchRequestId = requestId;
            if (this.locationSearchAbortController) {
                this.locationSearchAbortController.abort();
            }

            const abortController = new AbortController();
            this.locationSearchAbortController = abortController;
            this.locationOptionsLoading = true;

            try {
                const locale = document.documentElement.lang || 'de';
                const payload = await fetchCitySearchResults(trimmedQuery, locale, abortController.signal);
                if (requestId !== this.locationSearchRequestId) {
                    return;
                }

                this.locationOptions = normalizeCitySearchResults(payload, locale);
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return;
                }

                if (requestId !== this.locationSearchRequestId) {
                    return;
                }

                this.locationOptions = [];
            } finally {
                if (requestId === this.locationSearchRequestId) {
                    this.locationOptionsLoading = false;
                }

                if (this.locationSearchAbortController === abortController) {
                    this.locationSearchAbortController = null;
                }
            }
        },
        async loadPetChoices() {
            this.petChoicesLoading = true;

            try {
                const locale = document.documentElement.lang || 'de';
                const payload = await fetchFirstJsonPayload(HEADER_SEARCH_PET_ENDPOINTS);
                const rawChoices = Array.isArray(payload)
                    ? payload
                    : (Array.isArray(payload?.choices) ? payload.choices : []);
                const normalizedValues = normalizePetChoices(rawChoices);
                const effectiveValues = normalizedValues.length ? normalizedValues : [...DEFAULT_PET_CHOICES];
                const nextCounts = {};

                effectiveValues.forEach((value) => {
                    const previousValue = Number(this.petChoiceCounts[value]);
                    const normalizedCount = Number.isFinite(previousValue) ? Math.max(0, Math.round(previousValue)) : 0;
                    nextCounts[value] = normalizedCount;
                });

                this.petChoices = effectiveValues.map((value) => ({
                    value,
                    label: formatPetChoiceLabel(value, locale),
                    emojiPath: resolvePetChoiceEmojiPath(value)
                }));
                this.petChoiceCounts = nextCounts;
            } finally {
                this.petChoicesLoading = false;
            }
        },
        selectLocation(option, event) {
            if (!option || typeof option !== 'object') {
                return;
            }

            this.selectedLocation = option;
            this.locationQuery = '';
            this.closeDetailsFromEvent(event);
        },
        getCalendarViewByContext(context = 'search') {
            if (context === 'settingsBirthDate') {
                return {
                    year: this.settingsBirthDateCalendarYear,
                    month: this.settingsBirthDateCalendarMonth
                };
            }

            if (context === 'registerBirthDate') {
                return {
                    year: this.registerBirthDateCalendarYear,
                    month: this.registerBirthDateCalendarMonth
                };
            }

            if (context === 'myOffersAvailability') {
                return {
                    year: this.myOffersAvailabilityCalendarYear,
                    month: this.myOffersAvailabilityCalendarMonth
                };
            }

            return {
                year: this.dateCalendarYear,
                month: this.dateCalendarMonth
            };
        },
        applyCalendarViewByContext(context = 'search', nextYear, nextMonth) {
            const normalizedDate = new Date(nextYear, nextMonth, 1);
            if (Number.isNaN(normalizedDate.getTime())) {
                return;
            }

            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            let minYear = CALENDAR_MIN_YEAR;
            let maxYear = currentYear;

            if (context === 'search') {
                minYear = currentYear;
                maxYear = currentYear + CALENDAR_HEADER_SEARCH_FUTURE_YEAR_OFFSET;
            } else if (context === 'myOffersAvailability') {
                maxYear = Math.max(currentYear + CALENDAR_GENERAL_FUTURE_YEAR_OFFSET, normalizedDate.getFullYear());
            }

            const clampedYear = Math.min(Math.max(normalizedDate.getFullYear(), minYear), maxYear);
            let clampedMonth = normalizedDate.getMonth();

            if (clampedYear !== normalizedDate.getFullYear()) {
                clampedMonth = normalizedDate.getFullYear() < minYear ? 0 : 11;
            }

            if (context === 'search' && clampedYear === currentYear) {
                clampedMonth = Math.max(clampedMonth, currentMonth);
            }

            clampedMonth = Math.min(Math.max(clampedMonth, 0), 11);

            if (context === 'settingsBirthDate') {
                this.settingsBirthDateCalendarYear = clampedYear;
                this.settingsBirthDateCalendarMonth = clampedMonth;
                return;
            }

            if (context === 'registerBirthDate') {
                this.registerBirthDateCalendarYear = clampedYear;
                this.registerBirthDateCalendarMonth = clampedMonth;
                return;
            }

            if (context === 'myOffersAvailability') {
                this.myOffersAvailabilityCalendarYear = clampedYear;
                this.myOffersAvailabilityCalendarMonth = clampedMonth;
                return;
            }

            this.dateCalendarYear = clampedYear;
            this.dateCalendarMonth = clampedMonth;
        },
        selectCalendarMonth(context = 'search', value = '') {
            const normalizedMonth = Number.parseInt(String(value), 10);
            if (!Number.isInteger(normalizedMonth) || normalizedMonth < 0 || normalizedMonth > 11) {
                return;
            }

            const currentView = this.getCalendarViewByContext(context);
            this.applyCalendarViewByContext(context, currentView.year, normalizedMonth);
        },
        selectCalendarYear(context = 'search', value = '') {
            const normalizedYear = Number.parseInt(String(value), 10);
            if (!Number.isInteger(normalizedYear) || normalizedYear < CALENDAR_MIN_YEAR) {
                return;
            }

            const currentView = this.getCalendarViewByContext(context);
            this.applyCalendarViewByContext(context, normalizedYear, currentView.month);
        },
        syncDateCalendarView(referenceValue = '') {
            const normalizedReference = normalizeDateInputValue(referenceValue);
            const fallbackDate = new Date();
            const viewDate = normalizedReference
                ? parseDateInputValue(normalizedReference)
                : fallbackDate;

            if (!viewDate) {
                return;
            }

            this.applyCalendarViewByContext('search', viewDate.getFullYear(), viewDate.getMonth());
        },
        moveDateCalendar(monthOffset) {
            const normalizedOffset = Number(monthOffset);
            if (!Number.isFinite(normalizedOffset) || normalizedOffset === 0) {
                return;
            }

            this.applyCalendarViewByContext(
                'search',
                this.dateCalendarYear,
                this.dateCalendarMonth + Math.trunc(normalizedOffset)
            );
        },
        selectDateCalendarDay(day) {
            const selectedDateValue = normalizeDateInputValue(day?.iso);
            if (!selectedDateValue || !isHeaderSearchDateSelectable(selectedDateValue)) {
                return;
            }

            if (this.dateRangeStart && selectedDateValue === this.dateRangeStart) {
                this.clearDateRange();
                return;
            }

            if (!this.dateRangeStart || this.dateRangeEnd) {
                this.dateRangeStart = selectedDateValue;
                this.dateRangeEnd = '';
                this.syncDateCalendarView(selectedDateValue);
                return;
            }

            if (selectedDateValue < this.dateRangeStart) {
                this.dateRangeEnd = this.dateRangeStart;
                this.dateRangeStart = selectedDateValue;
            } else {
                this.dateRangeEnd = selectedDateValue;
            }

            this.syncDateCalendarView(selectedDateValue);
        },
        setDateStart(value) {
            const normalizedCandidate = normalizeDateInputValue(value);
            const normalizedStart = isHeaderSearchDateSelectable(normalizedCandidate)
                ? normalizedCandidate
                : '';
            this.dateRangeStart = normalizedStart;

            if (!normalizedStart) {
                this.dateRangeEnd = '';
                this.syncDateCalendarView();
                return;
            }

            if (this.dateRangeEnd && this.dateRangeEnd < normalizedStart) {
                this.dateRangeEnd = normalizedStart;
            }

            this.syncDateCalendarView(normalizedStart);
        },
        setDateEnd(value) {
            const normalizedCandidate = normalizeDateInputValue(value);
            const normalizedEnd = isHeaderSearchDateSelectable(normalizedCandidate)
                ? normalizedCandidate
                : '';
            this.dateRangeEnd = normalizedEnd;

            if (!normalizedEnd) {
                return;
            }

            if (!this.dateRangeStart) {
                this.dateRangeStart = normalizedEnd;
            }

            if (this.dateRangeEnd < this.dateRangeStart) {
                const previousStart = this.dateRangeStart;
                this.dateRangeStart = this.dateRangeEnd;
                this.dateRangeEnd = previousStart;
            }

            this.syncDateCalendarView(this.dateRangeStart || this.dateRangeEnd);
        },
        clearDateRange() {
            this.dateRangeStart = '';
            this.dateRangeEnd = '';
            this.syncDateCalendarView();
        },
        syncSettingsBirthDateCalendarView(referenceValue = '') {
            const normalizedReference = normalizeDateInputValue(referenceValue);
            const fallbackDate = new Date();
            const viewDate = normalizedReference
                ? parseDateInputValue(normalizedReference)
                : fallbackDate;

            if (!viewDate) {
                return;
            }

            this.applyCalendarViewByContext('settingsBirthDate', viewDate.getFullYear(), viewDate.getMonth());
        },
        moveSettingsBirthDateCalendar(monthOffset) {
            const normalizedOffset = Number(monthOffset);
            if (!Number.isFinite(normalizedOffset) || normalizedOffset === 0) {
                return;
            }

            this.applyCalendarViewByContext(
                'settingsBirthDate',
                this.settingsBirthDateCalendarYear,
                this.settingsBirthDateCalendarMonth + Math.trunc(normalizedOffset)
            );
        },
        selectSettingsBirthDateCalendarDay(day) {
            const selectedDateValue = normalizeDateInputValue(day?.iso);
            if (!selectedDateValue) {
                return;
            }

            if (selectedDateValue === normalizeDateInputValue(this.settingsEditValue)) {
                this.settingsEditValue = '';
                return;
            }

            this.settingsEditValue = selectedDateValue;
            this.syncSettingsBirthDateCalendarView(selectedDateValue);
        },
        syncRegisterBirthDateCalendarView(referenceValue = '') {
            const normalizedReference = normalizeDateInputValue(referenceValue);
            const fallbackDate = new Date();
            const viewDate = normalizedReference
                ? parseDateInputValue(normalizedReference)
                : fallbackDate;

            if (!viewDate) {
                return;
            }

            this.applyCalendarViewByContext('registerBirthDate', viewDate.getFullYear(), viewDate.getMonth());
        },
        moveRegisterBirthDateCalendar(monthOffset) {
            const normalizedOffset = Number(monthOffset);
            if (!Number.isFinite(normalizedOffset) || normalizedOffset === 0) {
                return;
            }

            this.applyCalendarViewByContext(
                'registerBirthDate',
                this.registerBirthDateCalendarYear,
                this.registerBirthDateCalendarMonth + Math.trunc(normalizedOffset)
            );
        },
        selectRegisterBirthDateCalendarDay(day) {
            const selectedDateValue = normalizeDateInputValue(day?.iso);
            if (!selectedDateValue) {
                return;
            }

            if (selectedDateValue === normalizeDateInputValue(this.registerBirthDate)) {
                this.registerBirthDate = '';
                return;
            }

            this.registerBirthDate = selectedDateValue;
            this.syncRegisterBirthDateCalendarView(selectedDateValue);
        },
        syncMyOffersAvailabilityCalendarView(referenceValue = '') {
            const normalizedReference = normalizeDateInputValue(referenceValue);
            const fallbackDate = new Date();
            const viewDate = normalizedReference
                ? parseDateInputValue(normalizedReference)
                : fallbackDate;

            if (!viewDate) {
                return;
            }

            this.applyCalendarViewByContext('myOffersAvailability', viewDate.getFullYear(), viewDate.getMonth());
        },
        moveMyOffersAvailabilityCalendar(monthOffset) {
            const normalizedOffset = Number(monthOffset);
            if (!Number.isFinite(normalizedOffset) || normalizedOffset === 0) {
                return;
            }

            this.applyCalendarViewByContext(
                'myOffersAvailability',
                this.myOffersAvailabilityCalendarYear,
                this.myOffersAvailabilityCalendarMonth + Math.trunc(normalizedOffset)
            );
        },
        selectMyOffersAvailabilityCalendarDay(day) {
            const selectedDateValue = normalizeDateInputValue(day?.iso);
            if (!selectedDateValue) {
                return;
            }

            const currentStart = normalizeDateInputValue(this.myOffersForm?.availableFrom);
            const currentEnd = normalizeDateInputValue(this.myOffersForm?.availableTo);

            if (!currentStart) {
                this.myOffersForm = {
                    ...this.myOffersForm,
                    availableFrom: selectedDateValue,
                    availableTo: ''
                };
                this.syncMyOffersAvailabilityCalendarView(selectedDateValue);
                return;
            }

            if (!currentEnd) {
                if (selectedDateValue < currentStart) {
                    this.myOffersForm = {
                        ...this.myOffersForm,
                        availableFrom: selectedDateValue,
                        availableTo: currentStart
                    };
                } else {
                    this.myOffersForm = {
                        ...this.myOffersForm,
                        availableFrom: currentStart,
                        availableTo: selectedDateValue
                    };
                }
                this.syncMyOffersAvailabilityCalendarView(selectedDateValue);
                return;
            }

            this.myOffersForm = {
                ...this.myOffersForm,
                availableFrom: selectedDateValue,
                availableTo: ''
            };
            this.syncMyOffersAvailabilityCalendarView(selectedDateValue);
        },
        clearMyOffersAvailabilityRange() {
            this.myOffersForm = {
                ...this.myOffersForm,
                availableFrom: '',
                availableTo: ''
            };
            this.syncMyOffersAvailabilityCalendarView();
        },
        getPetCount(value) {
            const count = Number(this.petChoiceCounts[value]);
            if (!Number.isFinite(count) || count < 0) {
                return 0;
            }

            return Math.round(count);
        },
        incrementPetCount(value) {
            if (!value) {
                return;
            }

            const nextCount = this.getPetCount(value) + 1;
            this.petChoiceCounts = {
                ...this.petChoiceCounts,
                [value]: nextCount
            };
        },
        decrementPetCount(value) {
            if (!value) {
                return;
            }

            const nextCount = Math.max(0, this.getPetCount(value) - 1);
            this.petChoiceCounts = {
                ...this.petChoiceCounts,
                [value]: nextCount
            };
        },
        triggerHeaderSearch() {
            this.closeAllDropdowns();
        },
        normalizeNotificationTone(tone) {
            const normalizedTone = typeof tone === 'string' ? tone.trim().toLowerCase() : '';

            if (normalizedTone === 'success') {
                return 'success';
            }

            if (normalizedTone === 'error' || normalizedTone === 'warning') {
                return 'error';
            }

            if (normalizedTone === 'neutral' || normalizedTone === 'info') {
                return 'neutral';
            }

            return 'neutral';
        },
        pushNotification({ title = '', message = '', tone = 'neutral', lifetimeMs = NOTIFICATION_LIFETIME_MS } = {}) {
            const trimmedTitle = typeof title === 'string' ? title.trim() : '';
            const trimmedMessage = typeof message === 'string' ? message.trim() : '';
            const normalizedTone = this.normalizeNotificationTone(tone);

            if (!trimmedTitle && !trimmedMessage) {
                return;
            }

            this.notificationCounter += 1;
            const id = this.notificationCounter;
            const nextNotification = {
                id,
                title: trimmedTitle,
                message: trimmedMessage,
                tone: normalizedTone
            };

            this.notifications = [...this.notifications, nextNotification].slice(-NOTIFICATION_LIMIT);

            if (Number.isFinite(lifetimeMs) && lifetimeMs > 0) {
                const timerId = window.setTimeout(() => {
                    this.removeNotification(id);
                }, lifetimeMs);
                this.notificationTimers[id] = timerId;
            }
        },
        rememberRedirectNotification(notification = {}) {
            const title = typeof notification.title === 'string' ? notification.title.trim() : '';
            const message = typeof notification.message === 'string' ? notification.message.trim() : '';
            const tone = this.normalizeNotificationTone(notification?.tone);
            if (!title && !message) {
                return;
            }

            try {
                sessionStorage.setItem(REDIRECT_NOTIFICATION_STORAGE_KEY, JSON.stringify({
                    title,
                    message,
                    tone
                }));
            } catch {
                // Ignore storage errors.
            }
        },
        consumeRedirectNotification() {
            let rawPayload = '';
            try {
                rawPayload = sessionStorage.getItem(REDIRECT_NOTIFICATION_STORAGE_KEY) || '';
            } catch {
                rawPayload = '';
            }

            if (!rawPayload) {
                return;
            }

            try {
                sessionStorage.removeItem(REDIRECT_NOTIFICATION_STORAGE_KEY);
            } catch {
                // Ignore storage cleanup errors.
            }

            try {
                const payload = JSON.parse(rawPayload);
                const showNotification = () => {
                    this.pushNotification({
                        title: payload?.title,
                        message: payload?.message,
                        tone: payload?.tone
                    });
                };

                if (document.readyState === 'complete') {
                    showNotification();
                    return;
                }

                window.addEventListener('load', showNotification, { once: true });
            } catch {
                return;
            }
        },
        removeNotification(id) {
            const timerId = this.notificationTimers[id];
            if (typeof timerId === 'number') {
                window.clearTimeout(timerId);
            }
            delete this.notificationTimers[id];
            this.notifications = this.notifications.filter((notification) => notification.id !== id);
        },
        clearNotificationTimers() {
            Object.values(this.notificationTimers).forEach((timerId) => {
                if (typeof timerId === 'number') {
                    window.clearTimeout(timerId);
                }
            });
            this.notificationTimers = {};
        },
        prefersReducedMotion() {
            if (typeof window.matchMedia !== 'function') {
                return false;
            }

            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },
        shouldUseLowPerformanceHeaderMotion() {
            if (this.prefersReducedMotion()) {
                return true;
            }

            const navigatorObject = typeof window !== 'undefined' ? window.navigator : null;
            if (!navigatorObject) {
                return false;
            }

            const logicalCpuCores = Number(navigatorObject.hardwareConcurrency);
            if (Number.isFinite(logicalCpuCores)
                && logicalCpuCores > 0
                && logicalCpuCores <= HEADER_LOW_PERFORMANCE_MAX_CORES) {
                return true;
            }

            const deviceMemoryGb = Number(navigatorObject.deviceMemory);
            return Number.isFinite(deviceMemoryGb)
                && deviceMemoryGb > 0
                && deviceMemoryGb <= HEADER_LOW_PERFORMANCE_MAX_MEMORY_GB;
        },
        initializeThreadBackground() {
            this.threadBackgroundController = createThreadBackgroundController();
        },
        refreshThreadBackground(force = false) {
            this.threadBackgroundController?.refresh(force);
        },
        destroyThreadBackground() {
            this.threadBackgroundController?.destroy();
            this.threadBackgroundController = null;
        },
        hasMetricGroupContainer(group) {
            const selector = METRIC_GROUP_SELECTORS[group];
            if (!selector) {
                return false;
            }

            return Boolean(document.querySelector(selector));
        },
        normalizeMetricGroup(group, values = {}) {
            const fields = METRIC_GROUP_FIELDS[group] || [];
            return Object.fromEntries(fields.map((field) => [field, normalizeMetricNumber(values[field])]));
        },
        setAnimatedMetricGroup(group, values = {}) {
            const targetGroup = this.animatedMetrics[group];
            if (!targetGroup) {
                return;
            }

            const normalizedValues = this.normalizeMetricGroup(group, values);
            Object.entries(normalizedValues).forEach(([field, value]) => {
                targetGroup[field] = value;
            });
        },
        areMetricGroupsEqual(group, leftValues = {}, rightValues = {}) {
            const fields = METRIC_GROUP_FIELDS[group] || [];
            return fields.every((field) => normalizeMetricNumber(leftValues[field]) === normalizeMetricNumber(rightValues[field]));
        },
        stopMetricAnimation(group) {
            const frameId = this.metricAnimationFrames[group];
            if (typeof frameId === 'number' && frameId > 0) {
                window.cancelAnimationFrame(frameId);
            }
            this.metricAnimationFrames[group] = 0;
        },
        stopAllMetricAnimations() {
            Object.keys(METRIC_GROUP_FIELDS).forEach((group) => {
                this.stopMetricAnimation(group);
            });
        },
        getMetricGroupTargets(group) {
            if (group === 'git') {
                return {
                    totalCommits: this.repository.git.totalCommits,
                    mergeCommits: this.repository.git.mergeCommits,
                    contributorCount: this.repository.git.contributorCount,
                    branchCount: this.repository.git.branchCount
                };
            }

            if (group === 'board') {
                return {
                    openCount: this.repository.board.summary.openCount,
                    assignedCount: this.repository.board.summary.assignedCount,
                    ownerCount: this.repository.board.summary.ownerCount,
                    criteriaCount: this.repository.board.summary.criteriaCount
                };
            }

            if (group === 'playwright') {
                return {
                    total: this.playwrightSummary.total,
                    passed: this.playwrightSummary.passed,
                    failed: this.playwrightSummary.failed,
                    pending: this.playwrightSummary.pending
                };
            }

            return {};
        },
        animateMetricGroup(group, options = {}) {
            if (!this.hasMetricGroupContainer(group)) {
                return;
            }

            const nextTargets = this.normalizeMetricGroup(group, this.getMetricGroupTargets(group));
            const previousTargets = this.metricAnimationTargets[group] || {};
            const currentValues = this.normalizeMetricGroup(group, this.animatedMetrics[group] || {});
            const firstAnimation = !this.metricAnimationHasPlayed[group];
            const fromZero = options.fromZero === true || firstAnimation;
            const startValues = fromZero
                ? this.normalizeMetricGroup(group, {})
                : currentValues;

            this.metricAnimationTargets[group] = { ...nextTargets };

            if (options.immediate === true || this.prefersReducedMotion()) {
                this.stopMetricAnimation(group);
                this.setAnimatedMetricGroup(group, nextTargets);
                this.metricAnimationHasPlayed[group] = true;
                return;
            }

            if (!firstAnimation && this.areMetricGroupsEqual(group, previousTargets, nextTargets)) {
                return;
            }

            if (this.areMetricGroupsEqual(group, startValues, nextTargets)) {
                this.stopMetricAnimation(group);
                this.setAnimatedMetricGroup(group, nextTargets);
                this.metricAnimationHasPlayed[group] = true;
                return;
            }

            this.stopMetricAnimation(group);
            this.setAnimatedMetricGroup(group, startValues);

            const startedAt = performance.now();
            const tick = (timestamp) => {
                const elapsed = Math.max(0, timestamp - startedAt);
                const progress = Math.min(1, elapsed / METRIC_ANIMATION_DURATION_MS);
                const easedProgress = 1 - ((1 - progress) ** 3);
                const frameValues = {};

                (METRIC_GROUP_FIELDS[group] || []).forEach((field) => {
                    const fromValue = normalizeMetricNumber(startValues[field]);
                    const toValue = normalizeMetricNumber(nextTargets[field]);
                    frameValues[field] = Math.round(fromValue + ((toValue - fromValue) * easedProgress));
                });

                this.setAnimatedMetricGroup(group, frameValues);

                if (progress < 1) {
                    this.metricAnimationFrames[group] = window.requestAnimationFrame(tick);
                    return;
                }

                this.metricAnimationFrames[group] = 0;
                this.setAnimatedMetricGroup(group, nextTargets);
            };

            this.metricAnimationHasPlayed[group] = true;
            this.metricAnimationFrames[group] = window.requestAnimationFrame(tick);
        },
        animateVisibleMetricGroups(options = {}) {
            Object.keys(METRIC_GROUP_FIELDS).forEach((group) => {
                this.animateMetricGroup(group, options);
            });
        },
        initializePlaywrightRunner() {
            if (!this.playwrightRunnerEnabled) {
                return;
            }
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

            const previousRunId = this.playwrightRunId;
            const wasRunning = this.playwrightRunning;
            const normalized = this.normalizePlaywrightPayload(payload);
            const runChanged = normalized.runId !== previousRunId;
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
            this.animateMetricGroup('playwright');
            this.playwrightTests = normalized.tests;
            this.playwrightNextLogIndex = normalized.nextLogIndex;
            this.playwrightLogs = mergedLogs.slice(-1400);

            if (normalized.logs.length > 0 || resetLogs) {
                this.scrollPlaywrightLogsToEnd();
            }

            const runCompleted = normalized.runId > 0 && !normalized.running;
            const completionObserved = runCompleted && (wasRunning || runChanged);

            if (this.playwrightSessionStarted && completionObserved && !this.playwrightNotifiedRunIds.includes(normalized.runId)) {
                this.playwrightNotifiedRunIds.push(normalized.runId);
                this.pushNotification({
                    title: this.playwrightNotificationTitle,
                    message: `${normalizeMetricNumber(normalized.summary.passed)} ${this.playwrightLabelForStatus('passed')} · ${normalizeMetricNumber(normalized.summary.failed)} ${this.playwrightLabelForStatus('failed')}`,
                    tone: normalized.summary.failed > 0 ? 'warning' : 'success'
                });
            }
        },
        scrollPlaywrightLogsToEnd() {
            nextTick(() => {
                window.requestAnimationFrame(() => {
                    const consoleNode = document.querySelector('[data-playwright-log-console]');
                    if (!consoleNode) {
                        return;
                    }

                    consoleNode.scrollTop = consoleNode.scrollHeight;
                });
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
                const response = await apiFetch(`/api/tests/e2e/status.json?from=${from}`, {
                    headers: {
                        Accept: 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache'
                    },
                    cache: 'no-store'
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.message || `${localizedPlaywrightStatusRequestFailed} (${response.status})`);
                }

                this.playwrightStatusError = '';
                this.applyPlaywrightStatus(data, {
                    resetLogs: options.resetLogs === true
                });
            } catch (error) {
                this.playwrightStatusError = error?.message || localizedPlaywrightStatusRequestFailed;
            } finally {
                this.playwrightStatusLoading = false;
            }
        },
        async runPlaywrightTests() {
            if (!this.playwrightRunnerEnabled || this.playwrightRunPending || this.playwrightRunning) {
                return;
            }

            this.playwrightSessionStarted = true;
            this.playwrightStatusError = '';
            this.playwrightLogs = [];
            this.playwrightNextLogIndex = 0;
            this.playwrightRunPending = true;

            try {
                const response = await apiFetch('/api/tests/e2e/run', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok && response.status !== 409) {
                    throw new Error(data.message || `${localizedPlaywrightRunRequestFailed} (${response.status})`);
                }

                this.applyPlaywrightStatus(data, { resetLogs: true });
                this.startPlaywrightPolling();
                await this.fetchPlaywrightStatus({ force: true });
            } catch (error) {
                this.playwrightStatusError = error?.message || localizedPlaywrightRunRequestFailed;
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
        normalizeAuthSessionFirstName(value) {
            if (typeof value !== 'string') {
                return '';
            }

            return value.trim();
        },
        normalizeAuthSessionLastName(value) {
            if (typeof value !== 'string') {
                return '';
            }

            return value.trim();
        },
        normalizePotentiallyEncodedEmail(value) {
            const normalizedValue = this.normalizeLoginIdentifier(value);
            if (!normalizedValue) {
                return '';
            }

            try {
                return decodeURIComponent(normalizedValue).trim();
            } catch {
                return normalizedValue;
            }
        },
        deriveFirstNameFromEmail(email = '') {
            const sourceEmail = this.normalizePotentiallyEncodedEmail(email);
            if (!sourceEmail) {
                return '';
            }

            const localPart = sourceEmail.includes('@') ? sourceEmail.split('@')[0] : sourceEmail;
            const normalizedLocalPart = localPart
                .replace(/[._-]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (!normalizedLocalPart) {
                return '';
            }

            return normalizedLocalPart.split(' ')[0] || '';
        },
        truncateAuthSessionName(value, maxCharacters = 8) {
            const sourceValue = typeof value === 'string' ? value.trim() : '';
            if (!sourceValue) {
                return '';
            }

            const safeMax = Number.isInteger(maxCharacters) && maxCharacters > 0 ? maxCharacters : 8;
            const symbols = Array.from(sourceValue);
            if (symbols.length <= safeMax) {
                return sourceValue;
            }

            return `${symbols.slice(0, safeMax).join('')}...`;
        },
        buildAuthIdentity({ firstName = '', lastName = '', email = '' } = {}) {
            const normalizedFirstName = this.normalizeAuthSessionFirstName(firstName)
                || this.deriveFirstNameFromEmail(email);
            const normalizedLastName = this.normalizeAuthSessionLastName(lastName);
            const fullName = [normalizedFirstName, normalizedLastName]
                .filter(Boolean)
                .join(' ')
                .trim();

            return {
                firstName: normalizedFirstName,
                lastName: normalizedLastName,
                fullName
            };
        },
        buildAuthSuccessNotification(kind, identity = {}) {
            const normalizedIdentity = this.buildAuthIdentity(identity);
            const displayFullName = normalizedIdentity.fullName || normalizedIdentity.firstName || localizedAppStrings.genericUser;
            const displayFirstName = normalizedIdentity.firstName || localizedAppStrings.genericUser;

            if (kind === 'login') {
                return {
                    title: localizedAuthModalStrings.loginSuccessTitle,
                    message: formatTemplate(localizedAppStrings.loginSuccessTemplate, {
                        fullName: displayFullName
                    }),
                    tone: 'success'
                };
            }

            if (kind === 'register') {
                return {
                    title: localizedRegisterStrings.registerSuccessTitle,
                    message: formatTemplate(localizedAppStrings.registerSuccessTemplate, {
                        fullName: displayFullName
                    }),
                    tone: 'success'
                };
            }

            if (kind === 'logout') {
                return {
                    title: localizedAppStrings.logoutSuccessTitle,
                    message: formatTemplate(localizedAppStrings.logoutSuccessTemplate, {
                        firstName: displayFirstName
                    }),
                    tone: 'success'
                };
            }

            return null;
        },
        dispatchAuthSuccessNotification(kind, identity = {}, options = {}) {
            const { persistOnRedirect = false } = options;
            const notification = this.buildAuthSuccessNotification(kind, identity);
            if (!notification) {
                return;
            }

            if (persistOnRedirect) {
                this.rememberRedirectNotification(notification);
                return;
            }

            this.pushNotification(notification);
        },
        clearAuthSessionProfileData() {
            this.authSessionProfileRequestId += 1;
            this.authSessionUserId = null;
            this.authSessionFirstName = '';
            this.authSessionLastName = '';
        },
        clearAuthSessionIdentity() {
            this.authSessionLoggedIn = false;
            this.authSessionEmail = '';
            this.clearAuthSessionProfileData();
        },
        async refreshAuthSessionProfile(email, sessionRequestId = this.authSessionRequestId) {
            const normalizedEmail = this.normalizePotentiallyEncodedEmail(email);
            if (!this.isEmailIdentifier(normalizedEmail)) {
                this.clearAuthSessionProfileData();
                return;
            }

            const profileRequestId = this.authSessionProfileRequestId + 1;
            this.authSessionProfileRequestId = profileRequestId;
            const fallbackFirstName = this.deriveFirstNameFromEmail(normalizedEmail);

            try {
                const response = await apiFetch('/api/users/me', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));
                if (
                    sessionRequestId !== this.authSessionRequestId
                    || profileRequestId !== this.authSessionProfileRequestId
                ) {
                    return;
                }

                if (!response.ok || payload?.success === false) {
                    this.authSessionUserId = null;
                    this.authSessionFirstName = fallbackFirstName;
                    this.authSessionLastName = '';
                    return;
                }

                const profileUserId = this.normalizeProfileUserId(payload?.data?.id);
                const profileFirstName = this.normalizeAuthSessionFirstName(payload?.data?.firstName);
                const profileLastName = this.normalizeAuthSessionLastName(payload?.data?.lastName);
                this.authSessionUserId = profileUserId;
                this.authSessionFirstName = profileFirstName || fallbackFirstName;
                this.authSessionLastName = profileLastName;
            } catch {
                if (
                    sessionRequestId !== this.authSessionRequestId
                    || profileRequestId !== this.authSessionProfileRequestId
                ) {
                    return;
                }

                this.authSessionUserId = null;
                this.authSessionFirstName = fallbackFirstName;
                this.authSessionLastName = '';
            }
        },
        async refreshAuthSession(options = {}) {
            const {
                successNotificationKind = '',
                successNotificationIdentity = null
            } = options;
            const requestId = this.authSessionRequestId + 1;
            this.authSessionRequestId = requestId;

            try {
                const response = await apiFetch('/api/auth/session', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));
                if (requestId !== this.authSessionRequestId) {
                    return;
                }

                if (!response.ok || payload?.success === false) {
                    this.clearAuthSessionIdentity();
                    this.applyRouteAccessRules({
                        loggedIn: false,
                        email: ''
                    });
                    return;
                }

                const sessionLoggedIn = payload?.data?.loggedIn === true;
                const sessionEmail = this.normalizePotentiallyEncodedEmail(payload?.data?.email);
                const hasValidSessionEmail = sessionLoggedIn && this.isEmailIdentifier(sessionEmail);

                if (!hasValidSessionEmail) {
                    this.clearAuthSessionIdentity();
                    this.applyRouteAccessRules({
                        loggedIn: false,
                        email: ''
                    });
                    return;
                }

                this.authSessionLoggedIn = true;
                this.authSessionEmail = sessionEmail;
                await this.refreshAuthSessionProfile(sessionEmail, requestId);
                const redirected = this.applyRouteAccessRules({
                    loggedIn: true,
                    email: sessionEmail,
                    userId: this.authSessionUserId
                });
                if (successNotificationKind) {
                    const mergedIdentity = {
                        firstName: this.authSessionFirstName,
                        lastName: this.authSessionLastName,
                        email: sessionEmail,
                        ...(successNotificationIdentity && typeof successNotificationIdentity === 'object'
                            ? successNotificationIdentity
                            : {})
                    };
                    this.dispatchAuthSuccessNotification(
                        successNotificationKind,
                        mergedIdentity,
                        { persistOnRedirect: redirected }
                    );
                }
                if (redirected) {
                    return;
                }
            } catch {
                if (requestId !== this.authSessionRequestId) {
                    return;
                }
                this.clearAuthSessionIdentity();
                this.applyRouteAccessRules({
                    loggedIn: false,
                    email: ''
                });
            }
        },
        async openCurrentUserProfile() {
            if (!this.authSessionLoggedIn) {
                return;
            }

            if (!Number.isInteger(this.authSessionUserId) && this.authSessionEmail) {
                await this.refreshAuthSessionProfile(this.authSessionEmail, this.authSessionRequestId);
            }

            const profilePath = this.buildProfilePath(this.authSessionUserId);
            if (!profilePath) {
                return;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            window.location.assign(profilePath);
        },
        openCurrentUserPets() {
            if (!this.authSessionLoggedIn) {
                return;
            }

            const myPetsPath = this.buildMyPetsPath();
            if (!myPetsPath) {
                return;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            window.location.assign(myPetsPath);
        },
        openCurrentUserOffers() {
            if (!this.authSessionLoggedIn) {
                return;
            }

            const myOffersPath = this.buildMyOffersPath();
            if (!myOffersPath) {
                return;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            window.location.assign(myOffersPath);
        },
        openCurrentUserSettings() {
            if (!this.authSessionLoggedIn) {
                return;
            }

            const settingsPath = this.buildSettingsPath();
            if (!settingsPath) {
                return;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            window.location.assign(settingsPath);
        },
        async logoutCurrentUser() {
            if (!this.authSessionLoggedIn) {
                return;
            }

            try {
                const response = await apiFetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    return;
                }

                const logoutNotificationIdentity = {
                    firstName: this.authSessionFirstName,
                    lastName: this.authSessionLastName,
                    email: this.authSessionEmail
                };
                this.dispatchAuthSuccessNotification('logout', logoutNotificationIdentity, {
                    persistOnRedirect: true
                });
                this.clearAuthSessionIdentity();
                this.menuOpen = false;
                this.closeAllDropdowns({ immediate: true });
                window.location.assign('/');
            } catch {
                return;
            }
        },
        resetLoginModalState() {
            this.loginLookupRequestId += 1;
            this.loginIdentifier = '';
            this.loginPassword = '';
            this.loginPasswordVisible = false;
            this.loginLookupPending = false;
            this.loginMailCheckedFor = '';
        },
        focusLoginIdentifierField() {
            nextTick(() => {
                document.querySelector('[data-auth-login-identifier]')?.focus();
            });
        },
        focusLoginPasswordField() {
            nextTick(() => {
                document.querySelector('[data-auth-login-password]')?.focus();
            });
        },
        readLoginIdentifierFieldValue() {
            const fieldValue = document.querySelector('[data-auth-login-identifier]')?.value;
            return typeof fieldValue === 'string' ? fieldValue : '';
        },
        readLoginPasswordFieldValue() {
            const fieldValue = document.querySelector('[data-auth-login-password]')?.value;
            return typeof fieldValue === 'string' ? fieldValue : '';
        },
        normalizeLoginIdentifier(value) {
            return typeof value === 'string' ? value.trim() : '';
        },
        findPhoneCountryOptionByCode(countryCode = '') {
            const normalizedCountryCode = normalizeCountryCode(countryCode);
            if (!normalizedCountryCode) {
                return null;
            }

            const options = Array.isArray(this.phoneCountryOptions) ? this.phoneCountryOptions : [];
            return options.find((option) => option.code === normalizedCountryCode) || null;
        },
        selectPhoneCountryCode(targetField = 'register', countryCode = '', event = null) {
            const normalizedCountryCode = normalizeCountryCode(countryCode);
            if (!this.findPhoneCountryOptionByCode(normalizedCountryCode)) {
                return;
            }

            if (targetField === 'settings') {
                this.settingsPhoneCountryCode = normalizedCountryCode;
            } else {
                this.registerPhoneCountryCode = normalizedCountryCode;
            }

            const details = event?.currentTarget?.closest?.('details');
            if (details) {
                this.closeDropdown(details, { immediate: true });
            }
        },
        getPreferredPhoneCountryCode() {
            const localeCode = normalizeUiLocaleCode(document.documentElement.lang || 'de');
            const preferredCountryCode = PHONE_COUNTRY_DEFAULT_BY_LOCALE[localeCode] || '';
            if (preferredCountryCode && this.findPhoneCountryOptionByCode(preferredCountryCode)) {
                return preferredCountryCode;
            }

            const firstCountryCode = this.phoneCountryOptions[0]?.code || '';
            return normalizeCountryCode(firstCountryCode);
        },
        buildFallbackPhoneCountryOptions(locale = document.documentElement.lang || 'de') {
            const fallbackCountryCodes = ['DE', 'US', 'RO'];
            return fallbackCountryCodes.map((code) => {
                const dialCode = normalizeDialCode(
                    code === 'DE'
                        ? '49'
                        : (code === 'US' ? '1' : '40')
                );
                const displayName = resolveCountryName(code, locale) || code;
                return {
                    code,
                    dialCode,
                    displayName,
                    flagPath: `/assets/media/country-flag/${countryCodeToFlagFileName(code)}`,
                    searchName: `${displayName} ${code} ${dialCode}`.toLowerCase()
                };
            });
        },
        applyInitialPhoneCountrySelection() {
            const preferredCountryCode = this.getPreferredPhoneCountryCode();
            if (!preferredCountryCode) {
                return;
            }

            if (!this.findPhoneCountryOptionByCode(this.registerPhoneCountryCode)) {
                this.registerPhoneCountryCode = preferredCountryCode;
            }

            if (!this.findPhoneCountryOptionByCode(this.settingsPhoneCountryCode)) {
                this.settingsPhoneCountryCode = preferredCountryCode;
            }
        },
        async ensurePhoneCountryOptionsLoaded() {
            if (Array.isArray(this.phoneCountryOptions) && this.phoneCountryOptions.length) {
                this.applyInitialPhoneCountrySelection();
                return;
            }

            if (this.phoneCountryOptionsPromise) {
                await this.phoneCountryOptionsPromise;
                this.applyInitialPhoneCountrySelection();
                return;
            }

            this.phoneCountryOptionsLoading = true;
            this.phoneCountryOptionsPromise = (async () => {
                const locale = document.documentElement.lang || 'de';
                try {
                    const payload = await fetchFirstJsonPayload(PHONE_COUNTRY_PREFIX_ENDPOINTS);
                    const normalizedOptions = normalizePhoneCountryPrefixOptions(payload, locale);
                    this.phoneCountryOptions = normalizedOptions.length
                        ? normalizedOptions
                        : this.buildFallbackPhoneCountryOptions(locale);
                } catch {
                    this.phoneCountryOptions = this.buildFallbackPhoneCountryOptions(locale);
                } finally {
                    this.phoneCountryOptionsLoading = false;
                    this.phoneCountryOptionsPromise = null;
                }
            })();

            await this.phoneCountryOptionsPromise;
            this.applyInitialPhoneCountrySelection();
        },
        formatPhoneWithCountryCode(countryCode = '', localNumber = '') {
            const option = this.findPhoneCountryOptionByCode(countryCode);
            const dialCode = normalizeDialCode(option?.dialCode || '');
            const normalizedLocalNumber = normalizePhoneNumberDigits(localNumber);
            if (!dialCode) {
                return normalizedLocalNumber;
            }

            if (!normalizedLocalNumber) {
                return dialCode;
            }

            return `${dialCode} ${normalizedLocalNumber}`;
        },
        parsePhoneWithCountryCode(value = '') {
            const rawValue = typeof value === 'string' ? value.trim() : '';
            if (!rawValue) {
                return {
                    countryCode: this.getPreferredPhoneCountryCode(),
                    localNumber: ''
                };
            }

            const sanitized = rawValue.replace(/\s+/g, '');
            const normalizedInput = sanitized.startsWith('00')
                ? `+${sanitized.slice(2)}`
                : sanitized;
            const compactPhone = normalizedInput.replace(/(?!^\+)\D/g, '');
            const options = Array.isArray(this.phoneCountryOptions) ? this.phoneCountryOptions : [];
            const sortedOptions = [...options]
                .filter((option) => normalizeDialCode(option.dialCode))
                .sort((left, right) => {
                    const leftDial = normalizeDialCode(left.dialCode);
                    const rightDial = normalizeDialCode(right.dialCode);
                    return rightDial.length - leftDial.length;
                });

            if (compactPhone.startsWith('+')) {
                const matchedOption = sortedOptions.find((option) => compactPhone.startsWith(normalizeDialCode(option.dialCode)));
                if (matchedOption) {
                    const matchedDialCode = normalizeDialCode(matchedOption.dialCode);
                    const localNumber = normalizePhoneNumberDigits(compactPhone.slice(matchedDialCode.length));
                    return {
                        countryCode: matchedOption.code,
                        localNumber
                    };
                }
            }

            return {
                countryCode: this.getPreferredPhoneCountryCode(),
                localNumber: normalizePhoneNumberDigits(rawValue)
            };
        },
        buildSettingsPhoneDisplayParts(phoneValue = '') {
            const rawValue = typeof phoneValue === 'string' ? phoneValue.trim() : '';
            if (!rawValue) {
                return {
                    displayValue: '',
                    flagPath: '',
                    countryName: ''
                };
            }

            const parsed = this.parsePhoneWithCountryCode(rawValue);
            const option = this.findPhoneCountryOptionByCode(parsed.countryCode);
            const hasExplicitCountryCode = rawValue.startsWith('+') || rawValue.startsWith('00');
            if (!option || !hasExplicitCountryCode) {
                return {
                    displayValue: rawValue,
                    flagPath: '',
                    countryName: ''
                };
            }

            return {
                displayValue: this.formatPhoneWithCountryCode(option.code, parsed.localNumber) || rawValue,
                flagPath: option.flagPath || '',
                countryName: option.displayName || ''
            };
        },
        resolveCityOptionMatch(options = [], cityValue = '', postalCodeValue = '') {
            const normalizedCity = typeof cityValue === 'string' ? cityValue.trim().toLowerCase() : '';
            const normalizedPostalCode = normalizePostalCode(postalCodeValue);
            const normalizedOptions = Array.isArray(options)
                ? options.map((option) => normalizeCitySearchOption(option)).filter(Boolean)
                : [];
            if (!normalizedCity || !normalizedOptions.length) {
                return null;
            }

            const exactCityAndPostalMatch = normalizedOptions.find((option) => {
                const optionCity = typeof option.cityName === 'string' ? option.cityName.trim().toLowerCase() : '';
                const optionPostalCode = normalizePostalCode(option.postalCode);
                return optionCity === normalizedCity && normalizedPostalCode && optionPostalCode === normalizedPostalCode;
            });
            if (exactCityAndPostalMatch) {
                return exactCityAndPostalMatch;
            }

            const exactCityMatch = normalizedOptions.find((option) => {
                const optionCity = typeof option.cityName === 'string' ? option.cityName.trim().toLowerCase() : '';
                return optionCity === normalizedCity;
            });
            if (exactCityMatch) {
                return exactCityMatch;
            }

            return normalizedOptions[0] || null;
        },
        clearSettingsCityLookupRuntime() {
            if (this.settingsCityLookupAbortController) {
                this.settingsCityLookupAbortController.abort();
                this.settingsCityLookupAbortController = null;
            }
        },
        clearSettingsCitySearchRuntime() {
            if (typeof this.settingsCitySearchDebounceHandle === 'number') {
                window.clearTimeout(this.settingsCitySearchDebounceHandle);
            }
            this.settingsCitySearchDebounceHandle = null;

            if (this.settingsCitySearchAbortController) {
                this.settingsCitySearchAbortController.abort();
                this.settingsCitySearchAbortController = null;
            }
        },
        clearSettingsCitySelection({ clearQuery = false } = {}) {
            this.settingsCitySelectionKey = '';
            this.settingsCitySelectedOption = null;
            this.settingsCityOptions = [];

            if (clearQuery) {
                this.settingsCityQuery = '';
                this.settingsEditValue = '';
            }
        },
        async syncSettingsCityLocationOption({ preferredOption = null } = {}) {
            const currentCity = typeof this.settingsViewUser?.city === 'string'
                ? this.settingsViewUser.city.trim()
                : '';
            const currentPostalCode = normalizePostalCode(this.settingsViewUser?.postalCode || '');
            if (!currentCity) {
                this.settingsCityLocationOption = null;
                this.clearSettingsCityLookupRuntime();
                return;
            }

            const normalizedPreferredOption = normalizeCitySearchOption(preferredOption || {});
            if (normalizedPreferredOption) {
                const preferredCity = typeof normalizedPreferredOption.cityName === 'string'
                    ? normalizedPreferredOption.cityName.trim().toLowerCase()
                    : '';
                if (preferredCity && preferredCity === currentCity.toLowerCase()) {
                    this.settingsCityLocationOption = normalizedPreferredOption;
                    return;
                }
            }

            const requestId = this.settingsCityLookupRequestId + 1;
            this.settingsCityLookupRequestId = requestId;
            this.clearSettingsCityLookupRuntime();
            const abortController = new AbortController();
            this.settingsCityLookupAbortController = abortController;

            try {
                const locale = document.documentElement.lang || 'de';
                const payload = await fetchCitySearchResults(currentCity, locale, abortController.signal);
                if (requestId !== this.settingsCityLookupRequestId) {
                    return;
                }

                const options = normalizeCitySearchResults(payload, locale);
                const matchedOption = this.resolveCityOptionMatch(options, currentCity, currentPostalCode);
                this.settingsCityLocationOption = matchedOption;
            } catch (error) {
                if (error?.name !== 'AbortError' && requestId === this.settingsCityLookupRequestId) {
                    this.settingsCityLocationOption = null;
                }
            } finally {
                if (this.settingsCityLookupAbortController === abortController) {
                    this.settingsCityLookupAbortController = null;
                }
            }
        },
        buildSettingsCityDisplayParts(cityValue = '') {
            const normalizedCity = typeof cityValue === 'string' ? cityValue.trim() : '';
            if (!normalizedCity) {
                return {
                    displayValue: '',
                    flagPath: '',
                    countryName: ''
                };
            }

            const locationOption = normalizeCitySearchOption(this.settingsCityLocationOption || {});
            const optionCity = typeof locationOption?.cityName === 'string'
                ? locationOption.cityName.trim().toLowerCase()
                : '';
            if (!locationOption || optionCity !== normalizedCity.toLowerCase()) {
                return {
                    displayValue: normalizedCity,
                    flagPath: '',
                    countryName: ''
                };
            }

            return {
                displayValue: normalizedCity,
                flagPath: locationOption.flagPath || '',
                countryName: locationOption.countryName || locationOption.countryCode || ''
            };
        },
        handleSettingsCityInput() {
            const query = typeof this.settingsCityQuery === 'string' ? this.settingsCityQuery.trim() : '';
            this.settingsEditValue = query;

            if (!query) {
                this.clearSettingsCitySelection({ clearQuery: true });
                this.settingsCityOptionsLoading = false;
                this.clearSettingsCitySearchRuntime();
                return;
            }

            const selectedCity = typeof this.settingsCitySelectedOption?.cityName === 'string'
                ? this.settingsCitySelectedOption.cityName.trim()
                : '';
            if (!this.settingsCitySelectionKey || selectedCity !== query) {
                this.clearSettingsCitySelection();
            }

            this.scheduleSettingsCitySearch(query);
        },
        scheduleSettingsCitySearch(query) {
            const trimmedQuery = typeof query === 'string' ? query.trim() : '';
            if (typeof this.settingsCitySearchDebounceHandle === 'number') {
                window.clearTimeout(this.settingsCitySearchDebounceHandle);
                this.settingsCitySearchDebounceHandle = null;
            }

            if (trimmedQuery.length < 2) {
                if (this.settingsCitySearchAbortController) {
                    this.settingsCitySearchAbortController.abort();
                    this.settingsCitySearchAbortController = null;
                }
                this.settingsCityOptions = [];
                this.settingsCityOptionsLoading = false;
                return;
            }

            this.settingsCitySearchDebounceHandle = window.setTimeout(() => {
                this.fetchSettingsCityOptions(trimmedQuery);
            }, 240);
        },
        async fetchSettingsCityOptions(query) {
            const trimmedQuery = typeof query === 'string' ? query.trim() : '';
            if (trimmedQuery.length < 2) {
                this.settingsCityOptions = [];
                this.settingsCityOptionsLoading = false;
                return;
            }

            const requestId = this.settingsCitySearchRequestId + 1;
            this.settingsCitySearchRequestId = requestId;
            if (this.settingsCitySearchAbortController) {
                this.settingsCitySearchAbortController.abort();
            }

            const abortController = new AbortController();
            this.settingsCitySearchAbortController = abortController;
            this.settingsCityOptionsLoading = true;

            try {
                const locale = document.documentElement.lang || 'de';
                const payload = await fetchCitySearchResults(trimmedQuery, locale, abortController.signal);
                if (requestId !== this.settingsCitySearchRequestId) {
                    return;
                }

                this.settingsCityOptions = normalizeCitySearchResults(payload, locale);
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return;
                }

                if (requestId !== this.settingsCitySearchRequestId) {
                    return;
                }

                this.settingsCityOptions = [];
            } finally {
                if (requestId === this.settingsCitySearchRequestId) {
                    this.settingsCityOptionsLoading = false;
                }

                if (this.settingsCitySearchAbortController === abortController) {
                    this.settingsCitySearchAbortController = null;
                }
            }
        },
        selectSettingsCityOption(option) {
            const normalizedOption = normalizeCitySearchOption(option || {});
            if (!normalizedOption) {
                return;
            }

            const city = typeof normalizedOption.cityName === 'string'
                ? normalizedOption.cityName.trim()
                : '';
            this.settingsEditValue = city;
            this.settingsCityQuery = city;
            this.settingsCitySelectionKey = normalizedOption.id || city;
            this.settingsCitySelectedOption = normalizedOption;
            this.settingsCityOptions = [];
            this.settingsCityOptionsLoading = false;
            this.clearSettingsCitySearchRuntime();
        },
        initializeRegisterFlow() {
            if (!this.isRegisterPath(window.location.pathname)) {
                return;
            }

            this.consumeRegisterPrefillEmail();
            this.ensurePhoneCountryOptionsLoaded();
            this.loadRegisterPetChoices();
            this.syncRegisterBirthDateCalendarView(this.registerBirthDate);
            nextTick(() => {
                this.updateSegmentedIndicators();
            });
        },
        async initializeHomeView() {
            if (!homePageRoot) {
                return;
            }

            this.homeViewLoading = true;
            this.homeViewError = '';
            this.homeOffers = [];
            this.homeOfferSpeciesFilter = 'ALL';
            this.homeOffersCarouselIndex = 0;
            this.homeLatestOffers = [];
            this.homeLatestOfferLoadRequestId = 0;
            this.homeLatestCarouselOffset = 0;
            this.homeLatestViewportWidth = Number.isFinite(window.innerWidth) ? window.innerWidth : 1280;
            this.homeOfferHostCityByHostId = {};
            this.homeOfferHostCityLoadingByHostId = {};
            this.homeOfferDetailModalOpen = false;
            this.homeOfferDetailOfferId = null;
            this.syncModalBodyLock();

            if (!Array.isArray(this.registerPetChoices) || !this.registerPetChoices.length) {
                try {
                    await this.loadRegisterPetChoices();
                } catch {
                    // Home species list gracefully falls back to defaults.
                }
            }

            await Promise.allSettled([
                this.loadHomeOffers(),
                this.loadHomeLatestOffers()
            ]);
        },
        async loadHomeOffers() {
            if (!homePageRoot) {
                return;
            }

            const requestId = this.homeOfferLoadRequestId + 1;
            this.homeOfferLoadRequestId = requestId;
            this.homeViewLoading = true;
            this.homeViewError = '';

            try {
                const response = await apiFetch('/api/marketplace/offers', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));

                if (requestId !== this.homeOfferLoadRequestId) {
                    return;
                }

                if (!response.ok || payload?.success === false) {
                    this.homeOffers = [];
                    this.homeViewError = this.homeStrings.loadFailed;
                    return;
                }

                const normalizedOffers = Array.isArray(payload?.data)
                    ? payload.data
                        .map((offer) => this.normalizeMyOffer(offer))
                        .filter((offer) => Number.isInteger(offer.id) && offer.id > 0)
                    : [];

                this.homeOffers = normalizedOffers;
                this.homeOffersLoaded = true;
                this.homeOffersCarouselIndex = 0;
                this.prefetchHomeOfferHostCity(this.homeActiveOffer);
            } catch {
                if (requestId !== this.homeOfferLoadRequestId) {
                    return;
                }

                this.homeOffers = [];
                this.homeViewError = this.homeStrings.loadFailed;
            } finally {
                if (requestId === this.homeOfferLoadRequestId) {
                    this.homeViewLoading = false;
                }
            }
        },
        async loadHomeLatestOffers() {
            if (!homePageRoot) {
                return;
            }

            const requestId = this.homeLatestOfferLoadRequestId + 1;
            this.homeLatestOfferLoadRequestId = requestId;

            try {
                const response = await apiFetch('/api/marketplace/offers/latest?limit=10', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));

                if (requestId !== this.homeLatestOfferLoadRequestId) {
                    return;
                }

                if (!response.ok || payload?.success === false) {
                    this.homeLatestOffers = [];
                    this.homeLatestCarouselOffset = 0;
                    return;
                }

                const normalizedOffers = Array.isArray(payload?.data)
                    ? payload.data
                        .map((offer) => this.normalizeMyOffer(offer))
                        .filter((offer) => Number.isInteger(offer.id) && offer.id > 0)
                    : [];

                this.homeLatestOffers = normalizedOffers.slice(0, 10);
                this.homeLatestCarouselOffset = 0;
                this.prefetchHomeLatestVisibleHostCities();
            } catch {
                if (requestId !== this.homeLatestOfferLoadRequestId) {
                    return;
                }

                this.homeLatestOffers = [];
                this.homeLatestCarouselOffset = 0;
            }
        },
        selectHomeOfferSpecies(value = 'ALL', event = null) {
            const normalizedValue = typeof value === 'string'
                ? value.trim().toUpperCase()
                : 'ALL';
            const availableValues = new Set(this.homeOfferSpeciesChoices.map((choice) => choice.value));
            const nextValue = availableValues.has(normalizedValue) ? normalizedValue : 'ALL';

            this.homeOfferSpeciesFilter = nextValue;
            this.homeOffersCarouselIndex = 0;
            this.closeHomeOfferDetailModal();

            const dropdownElement = event?.currentTarget?.closest?.('details.repo_menu');
            if (dropdownElement) {
                this.closeDropdown(dropdownElement, { immediate: true });
            }
        },
        getHomeOffersCarouselRelativeOffset(index, totalCount = null) {
            const normalizedIndex = Number(index);
            const offers = Array.isArray(this.homeFilteredOffers) ? this.homeFilteredOffers : [];
            const normalizedCount = Number.isFinite(Number(totalCount))
                ? Math.max(0, Math.round(Number(totalCount)))
                : offers.length;

            if (!Number.isInteger(normalizedIndex) || normalizedCount <= 0) {
                return 0;
            }

            const safeActiveIndex = Number.isInteger(this.homeOffersCarouselIndex)
                ? Math.min(Math.max(0, this.homeOffersCarouselIndex), normalizedCount - 1)
                : 0;
            let offset = normalizedIndex - safeActiveIndex;
            const halfRange = normalizedCount / 2;

            if (offset > halfRange) {
                offset -= normalizedCount;
            } else if (offset < -halfRange) {
                offset += normalizedCount;
            }

            return Math.round(offset);
        },
        setHomeOffersCarouselIndex(index) {
            const normalizedIndex = Number(index);
            if (!Array.isArray(this.homeFilteredOffers) || !this.homeFilteredOffers.length || !Number.isFinite(normalizedIndex)) {
                this.homeOffersCarouselIndex = 0;
                return;
            }

            const maxIndex = this.homeFilteredOffers.length - 1;
            this.homeOffersCarouselIndex = Math.min(maxIndex, Math.max(0, Math.round(normalizedIndex)));
            this.prefetchHomeOfferHostCity(this.homeActiveOffer);
        },
        navigateHomeOffersCarousel(direction = 1) {
            if (!Array.isArray(this.homeFilteredOffers) || !this.homeFilteredOffers.length) {
                this.homeOffersCarouselIndex = 0;
                return;
            }

            const normalizedDirection = Number(direction) < 0 ? -1 : 1;
            const itemCount = this.homeFilteredOffers.length;
            const currentIndex = Number.isInteger(this.homeOffersCarouselIndex) ? this.homeOffersCarouselIndex : 0;
            const nextIndex = (currentIndex + normalizedDirection + itemCount) % itemCount;
            this.homeOffersCarouselIndex = nextIndex;
            this.prefetchHomeOfferHostCity(this.homeActiveOffer);
        },
        navigateHomeLatestOffersCarousel(direction = 1) {
            const maxOffset = this.homeLatestMaxOffset;
            if (!Array.isArray(this.homeLatestFilteredOffers) || !this.homeLatestFilteredOffers.length || maxOffset <= 0) {
                this.homeLatestCarouselOffset = 0;
                return;
            }

            const normalizedDirection = Number(direction) < 0 ? -1 : 1;
            const currentOffset = this.homeLatestSafeOffset;
            const nextOffset = Math.min(maxOffset, Math.max(0, currentOffset + normalizedDirection));
            this.homeLatestCarouselOffset = nextOffset;
            this.prefetchHomeLatestVisibleHostCities();
        },
        buildHomeLatestOfferOpenDetailsLabel(offer = null) {
            const offerName = typeof offer?.title === 'string' ? offer.title.trim() : '';
            const template = this.homeStrings.latest.openDetailsTemplate || this.homeStrings.openDetailsTemplate;
            return formatTemplate(template, {
                name: offerName || this.homeStrings.untitledOffer
            });
        },
        buildHomeOfferOpenDetailsLabel(offer = null) {
            const offerName = typeof offer?.title === 'string' ? offer.title.trim() : '';
            return formatTemplate(this.homeStrings.openDetailsTemplate, {
                name: offerName || this.homeStrings.untitledOffer
            });
        },
        openHomeOfferDetailModal(offer = null) {
            if (!homePageRoot) {
                return;
            }

            const normalizedOffer = this.normalizeMyOffer(offer || {});
            if (!Number.isInteger(normalizedOffer.id) || normalizedOffer.id <= 0) {
                return;
            }

            if (!this.homeActiveOffer || this.homeActiveOffer.id !== normalizedOffer.id) {
                return;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.homeOfferDetailModalOpen = true;
            this.homeOfferDetailOfferId = normalizedOffer.id;
            this.prefetchHomeOfferHostCity(normalizedOffer);
            this.syncModalBodyLock();
        },
        openHomeOfferDetailModalFromLatest(offer = null) {
            if (!homePageRoot) {
                return;
            }

            const normalizedOffer = this.normalizeMyOffer(offer || {});
            if (!Number.isInteger(normalizedOffer.id) || normalizedOffer.id <= 0) {
                return;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.homeOfferDetailModalOpen = true;
            this.homeOfferDetailOfferId = normalizedOffer.id;
            this.prefetchHomeOfferHostCity(normalizedOffer);
            this.syncModalBodyLock();
        },
        closeHomeOfferDetailModal() {
            if (!this.homeOfferDetailModalOpen && !this.homeOfferDetailOfferId) {
                return;
            }

            this.homeOfferDetailModalOpen = false;
            this.homeOfferDetailOfferId = null;
            this.syncModalBodyLock();
        },
        formatHomeOfferDateRange(offer = null) {
            const locale = document.documentElement.lang || 'de';
            const fromLabel = formatSearchDate(offer?.availableFrom || '', locale);
            const toLabel = formatSearchDate(offer?.availableTo || '', locale);

            if (fromLabel && toLabel) {
                if (fromLabel === toLabel) {
                    return fromLabel;
                }

                return `${fromLabel} - ${toLabel}`;
            }

            if (fromLabel) {
                return fromLabel;
            }

            if (toLabel) {
                return toLabel;
            }

            return '—';
        },
        resolveHomeOfferLocation(offer = null) {
            const inlineLocation = [
                offer?.city,
                offer?.location,
                offer?.hostCity
            ]
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .find(Boolean);
            if (inlineLocation) {
                return inlineLocation;
            }

            const hostId = this.normalizeProfileUserId(offer?.hostId);
            if (Number.isInteger(hostId) && hostId > 0) {
                const cachedLocation = typeof this.homeOfferHostCityByHostId?.[hostId] === 'string'
                    ? this.homeOfferHostCityByHostId[hostId].trim()
                    : '';
                if (cachedLocation) {
                    return cachedLocation;
                }
            }

            return this.homeStrings.labels.locationFallback;
        },
        homeOfferHostDisplayName(offer = null) {
            const firstName = typeof offer?.hostFirstName === 'string' ? offer.hostFirstName.trim() : '';
            const lastName = typeof offer?.hostLastName === 'string' ? offer.hostLastName.trim() : '';
            const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

            if (fullName) {
                return fullName;
            }

            return this.homeStrings.modalHostLabel;
        },
        findHomeOfferById(offerId) {
            const normalizedOfferId = this.normalizeProfileUserId(offerId);
            if (!Number.isInteger(normalizedOfferId) || normalizedOfferId <= 0) {
                return null;
            }

            const offers = [
                ...(Array.isArray(this.homeOffers) ? this.homeOffers : []),
                ...(Array.isArray(this.homeLatestOffers) ? this.homeLatestOffers : [])
            ];

            return offers.find((offer) => this.normalizeProfileUserId(offer?.id) === normalizedOfferId) || null;
        },
        prefetchHomeLatestVisibleHostCities() {
            const renderItems = Array.isArray(this.homeLatestCarouselRenderItems) ? this.homeLatestCarouselRenderItems : [];
            renderItems.forEach((item) => {
                this.prefetchHomeOfferHostCity(item?.offer);
            });
        },
        async prefetchHomeOfferHostCity(offer = null) {
            const hostId = this.normalizeProfileUserId(offer?.hostId);
            if (!Number.isInteger(hostId) || hostId <= 0) {
                return;
            }

            const cachedCity = typeof this.homeOfferHostCityByHostId?.[hostId] === 'string'
                ? this.homeOfferHostCityByHostId[hostId].trim()
                : '';
            if (cachedCity) {
                return;
            }

            if (this.homeOfferHostCityLoadingByHostId?.[hostId] === true) {
                return;
            }

            this.homeOfferHostCityLoadingByHostId = {
                ...(this.homeOfferHostCityLoadingByHostId || {}),
                [hostId]: true
            };

            try {
                const response = await apiFetch(`/api/users/${hostId}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));
                const city = response.ok && payload?.success !== false && typeof payload?.data?.city === 'string'
                    ? payload.data.city.trim()
                    : '';

                this.homeOfferHostCityByHostId = {
                    ...(this.homeOfferHostCityByHostId || {}),
                    [hostId]: city
                };
            } catch {
                this.homeOfferHostCityByHostId = {
                    ...(this.homeOfferHostCityByHostId || {}),
                    [hostId]: ''
                };
            } finally {
                const nextLoadingMap = {
                    ...(this.homeOfferHostCityLoadingByHostId || {})
                };
                delete nextLoadingMap[hostId];
                this.homeOfferHostCityLoadingByHostId = nextLoadingMap;
            }
        },
        async initializeProfileView() {
            if (!profilePageRoot) {
                return;
            }

            this.applyProfileDocumentTitle();
            this.profileViewTab = 'information';
            nextTick(() => {
                this.updateSegmentedIndicators();
            });
            const requestedUserId = this.extractProfileRouteUserId(window.location.pathname);
            this.profileViewRequestedUserId = requestedUserId;

            if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
                this.profileViewError = this.profileStrings.routeMissing;
                this.profileViewUser = null;
                this.myPetsPets = [];
                this.myPetsCarouselIndex = 0;
                this.myOffersOffers = [];
                this.myOffersCarouselIndex = 0;
                this.profileViewLoading = false;
                return;
            }

            await this.loadProfileById(requestedUserId);
        },
        async initializeMyPetsView() {
            if (!myPetsPageRoot) {
                return;
            }

            this.myPetsViewLoading = true;
            this.myPetsViewError = '';
            this.myPetsViewUser = null;
            this.myPetsPets = [];
            this.myPetsCarouselIndex = 0;
            this.myPetsQuickUploadPetId = null;
            this.myPetsAddModalOpen = false;
            this.myPetsDetailModalOpen = false;
            this.myPetsDetailEditing = false;
            this.myPetsDetailPetId = null;
            this.myPetsDeleteModalOpen = false;
            this.myPetsDeletePetId = null;
            this.myPetsDeleteSubmitting = false;
            this.resetMyPetForm({ keepSpecies: false });
            this.syncModalBodyLock();

            if (!Array.isArray(this.registerPetChoices) || !this.registerPetChoices.length) {
                try {
                    await this.loadRegisterPetChoices();
                } catch {
                    // Optional preload only.
                }
            }

            await this.loadMyPetsViewData();
        },
        async initializeMyOffersView() {
            if (!myOffersPageRoot) {
                return;
            }

            this.myOffersViewLoading = true;
            this.myOffersViewError = '';
            this.myOffersViewUser = null;
            this.myOffersOffers = [];
            this.myOffersCarouselIndex = 0;
            this.myOffersActionPendingId = null;
            this.myOffersCreateModalOpen = false;
            this.myOffersFormSaving = false;
            this.resetMyOffersForm();
            this.syncModalBodyLock();

            if (!Array.isArray(this.registerPetChoices) || !this.registerPetChoices.length) {
                try {
                    await this.loadRegisterPetChoices();
                } catch {
                    // Optional preload only.
                }
            }

            await this.loadMyOffersViewData();
        },
        normalizeMyOfferImagePath(value = '') {
            if (typeof value !== 'string') {
                return '';
            }

            const trimmed = value.trim();
            if (!trimmed) {
                return '';
            }

            if (
                /^https?:\/\//i.test(trimmed)
                || trimmed.startsWith('/')
                || /^data:/i.test(trimmed)
                || trimmed.startsWith('blob:')
            ) {
                return trimmed;
            }

            return `/uploads/offers/${trimmed}`;
        },
        resolveMyOfferInlineImagePath(offer = null) {
            if (typeof offer === 'string') {
                return this.normalizeMyOfferImagePath(offer);
            }

            return [
                this.normalizeMyOfferImagePath(offer?.imagePath || ''),
                this.normalizeMyOfferImagePath(offer?.offerImagePath || ''),
                this.normalizeMyOfferImagePath(offer?.imageUrl || ''),
                this.normalizeMyOfferImagePath(offer?.offerImageUrl || ''),
                this.normalizeMyOfferImagePath(offer?.image || ''),
                this.normalizeMyOfferImagePath(offer?.offerImage || '')
            ].find(Boolean) || '';
        },
        getMyOfferLocalImagePath(offerId = null) {
            const normalizedId = this.normalizeProfileUserId(offerId);
            if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
                return '';
            }

            return this.resolveMyOfferInlineImagePath(this.myOffersLocalImageById?.[normalizedId] || '');
        },
        rememberMyOfferLocalImagePath(offerId = null, imagePath = '') {
            const normalizedId = this.normalizeProfileUserId(offerId);
            if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
                return;
            }

            const previousValue = this.getMyOfferLocalImagePath(normalizedId);
            const nextValue = this.resolveMyOfferInlineImagePath(imagePath);

            if (previousValue === nextValue) {
                return;
            }

            if (
                previousValue
                && previousValue.startsWith('blob:')
                && typeof URL !== 'undefined'
                && typeof URL.revokeObjectURL === 'function'
            ) {
                URL.revokeObjectURL(previousValue);
            }

            const nextMap = {
                ...(this.myOffersLocalImageById || {})
            };

            if (nextValue) {
                nextMap[normalizedId] = nextValue;
            } else {
                delete nextMap[normalizedId];
            }

            this.myOffersLocalImageById = nextMap;
        },
        clearMyOffersLocalImageMap() {
            const existingEntries = this.myOffersLocalImageById || {};
            Object.values(existingEntries).forEach((value) => {
                const normalizedValue = this.resolveMyOfferInlineImagePath(value);
                if (
                    normalizedValue
                    && normalizedValue.startsWith('blob:')
                    && typeof URL !== 'undefined'
                    && typeof URL.revokeObjectURL === 'function'
                ) {
                    URL.revokeObjectURL(normalizedValue);
                }
            });
            this.myOffersLocalImageById = {};
        },
        normalizeMyOfferStatus(value = '') {
            const normalizedStatus = typeof value === 'string'
                ? value.trim().toUpperCase()
                : '';
            return normalizedStatus === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
        },
        normalizeMyOffer(value = {}) {
            const normalizedId = this.normalizeProfileUserId(value?.id);
            const normalizedHostId = this.normalizeProfileUserId(value?.hostId);
            const normalizedTitle = typeof value?.title === 'string' ? value.title.trim() : '';
            const normalizedDescription = typeof value?.description === 'string' ? value.description.trim() : '';
            const normalizedHostFirstName = typeof value?.hostFirstName === 'string' ? value.hostFirstName.trim() : '';
            const normalizedHostLastName = typeof value?.hostLastName === 'string' ? value.hostLastName.trim() : '';
            const normalizedCity = typeof value?.city === 'string' ? value.city.trim() : '';
            const normalizedHostCity = typeof value?.hostCity === 'string' ? value.hostCity.trim() : '';
            const normalizedLocation = typeof value?.location === 'string' ? value.location.trim() : '';
            const rawPrice = typeof value?.pricePerDay === 'string'
                ? value.pricePerDay.trim().replace(',', '.')
                : value?.pricePerDay;
            const normalizedPrice = Number.parseFloat(String(rawPrice ?? ''));
            const acceptedPetSpecies = Array.isArray(value?.acceptedPetSpecies)
                ? [...new Set(
                    value.acceptedPetSpecies
                        .map((species) => (typeof species === 'string' ? species.trim().toUpperCase() : ''))
                        .filter(Boolean)
                )]
                : [];
            const services = Array.isArray(value?.services)
                ? value.services
                    .map((service) => (typeof service === 'string' ? service.trim() : ''))
                    .filter(Boolean)
                : [];
            const availableFrom = normalizeDateInputValue(value?.availableFrom);
            const availableTo = normalizeDateInputValue(value?.availableTo);
            const normalizedStatus = this.normalizeMyOfferStatus(value?.status);
            const inlineImagePath = this.resolveMyOfferInlineImagePath(value);
            const localImagePath = this.getMyOfferLocalImagePath(normalizedId);
            const imagePath = inlineImagePath || localImagePath;

            if (Number.isInteger(normalizedId) && normalizedId > 0) {
                this.rememberMyOfferLocalImagePath(normalizedId, imagePath);
            }

            return {
                id: normalizedId,
                hostId: normalizedHostId,
                hostFirstName: normalizedHostFirstName,
                hostLastName: normalizedHostLastName,
                title: normalizedTitle,
                description: normalizedDescription,
                pricePerDay: Number.isFinite(normalizedPrice) ? normalizedPrice : 0,
                acceptedPetSpecies,
                services,
                availableFrom,
                availableTo,
                city: normalizedCity,
                hostCity: normalizedHostCity,
                location: normalizedLocation,
                imagePath,
                status: normalizedStatus,
                statusLower: normalizedStatus.toLowerCase()
            };
        },
        buildMyOffersActionErrorMessage(payload = {}) {
            const sanitizeMessage = (value) => {
                if (typeof value !== 'string') {
                    return '';
                }
                const normalized = value.trim();
                if (!normalized) {
                    return '';
                }
                const lowered = normalized.toLowerCase();
                if (lowered === 'null' || lowered === 'undefined') {
                    return '';
                }
                return normalized;
            };

            const backendMessage = sanitizeMessage(payload?.message);
            const detailMessage = Array.isArray(payload?.error?.details)
                ? payload.error.details
                    .map((detail) => sanitizeMessage(detail?.message))
                    .find(Boolean)
                : '';

            return detailMessage || backendMessage || this.myOffersStrings.actionErrorMessage;
        },
        async loadMyOffersViewData() {
            if (!myOffersPageRoot) {
                return;
            }

            this.myOffersViewLoading = true;
            this.myOffersViewError = '';

            try {
                const [profileResponse, offersResponse] = await Promise.all([
                    apiFetch('/api/users/me', {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json'
                        },
                        cache: 'no-store'
                    }),
                    apiFetch('/api/offers', {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json'
                        },
                        cache: 'no-store'
                    })
                ]);
                const profilePayload = await profileResponse.json().catch(() => ({}));
                const offersPayload = await offersResponse.json().catch(() => ({}));

                if (
                    profileResponse.status === 401
                    || profileResponse.status === 403
                    || offersResponse.status === 401
                    || offersResponse.status === 403
                ) {
                    this.myOffersViewError = this.myOffersStrings.authRequired;
                    window.location.assign(this.buildNotFoundPath());
                    return;
                }

                if (
                    !profileResponse.ok
                    || profilePayload?.success === false
                    || !offersResponse.ok
                    || offersPayload?.success === false
                ) {
                    this.myOffersViewError = this.myOffersStrings.loadFailed;
                    return;
                }

                this.myOffersViewUser = this.normalizeProfileUser(profilePayload?.data || {});
                const normalizedOffers = Array.isArray(offersPayload?.data)
                    ? offersPayload.data
                        .map((offer) => this.normalizeMyOffer(offer))
                        .filter((offer) => Number.isInteger(offer.id) && offer.id > 0)
                    : [];
                this.myOffersOffers = normalizedOffers;
                this.myOffersCarouselIndex = 0;
            } catch {
                this.myOffersViewError = this.myOffersStrings.loadFailed;
            } finally {
                this.myOffersViewLoading = false;
            }
        },
        getMyOffersCarouselRelativeOffset(index, totalCount = null) {
            const normalizedIndex = Number(index);
            const offers = Array.isArray(this.myOffersOffers) ? this.myOffersOffers : [];
            const normalizedCount = Number.isFinite(Number(totalCount))
                ? Math.max(0, Math.round(Number(totalCount)))
                : offers.length;

            if (!Number.isInteger(normalizedIndex) || normalizedCount <= 0) {
                return 0;
            }

            const safeActiveIndex = Number.isInteger(this.myOffersCarouselIndex)
                ? Math.min(Math.max(0, this.myOffersCarouselIndex), normalizedCount - 1)
                : 0;
            let offset = normalizedIndex - safeActiveIndex;
            const halfRange = normalizedCount / 2;

            if (offset > halfRange) {
                offset -= normalizedCount;
            } else if (offset < -halfRange) {
                offset += normalizedCount;
            }

            return Math.round(offset);
        },
        setMyOffersCarouselIndex(index) {
            const normalizedIndex = Number(index);
            if (!Array.isArray(this.myOffersOffers) || !this.myOffersOffers.length || !Number.isFinite(normalizedIndex)) {
                this.myOffersCarouselIndex = 0;
                return;
            }

            const maxIndex = this.myOffersOffers.length - 1;
            this.myOffersCarouselIndex = Math.min(maxIndex, Math.max(0, Math.round(normalizedIndex)));
        },
        navigateMyOffersCarousel(direction = 1) {
            if (!Array.isArray(this.myOffersOffers) || !this.myOffersOffers.length) {
                this.myOffersCarouselIndex = 0;
                return;
            }

            const normalizedDirection = Number(direction) < 0 ? -1 : 1;
            const itemCount = this.myOffersOffers.length;
            const currentIndex = Number.isInteger(this.myOffersCarouselIndex) ? this.myOffersCarouselIndex : 0;
            const nextIndex = (currentIndex + normalizedDirection + itemCount) % itemCount;
            this.myOffersCarouselIndex = nextIndex;
        },
        buildMyOfferOpenDetailsLabel(offer = null) {
            const offerName = typeof offer?.title === 'string' ? offer.title.trim() : '';
            return formatTemplate(this.myOffersStrings.openDetailsTemplate, {
                name: offerName || this.myOffersStrings.labels.title
            });
        },
        resolveMyOfferStatusLabel(offer = null) {
            const normalizedStatus = this.normalizeMyOfferStatus(offer?.status);
            return normalizedStatus === 'PUBLISHED'
                ? this.myOffersStrings.labels.statusPublished
                : this.myOffersStrings.labels.statusDraft;
        },
        resolveMyOfferSpecies(offer = null) {
            const sourceSpecies = Array.isArray(offer?.acceptedPetSpecies) ? offer.acceptedPetSpecies : [];
            const locale = document.documentElement.lang || 'de';

            return sourceSpecies
                .map((species) => {
                    if (typeof species !== 'string') {
                        return null;
                    }

                    const normalizedSpecies = species.trim().toUpperCase();
                    if (!normalizedSpecies) {
                        return null;
                    }

                    return {
                        value: normalizedSpecies,
                        label: formatPetChoiceLabel(normalizedSpecies, locale),
                        emojiPath: resolvePetChoiceEmojiPath(normalizedSpecies)
                    };
                })
                .filter(Boolean);
        },
        resolveMyOfferServiceList(offer = null) {
            const sourceServices = Array.isArray(offer?.services) ? offer.services : [];
            return sourceServices
                .map((service) => (typeof service === 'string' ? service.trim() : ''))
                .filter(Boolean)
                .slice(0, 5);
        },
        resolveMyOfferImagePath(offer = null) {
            const inlineImagePath = this.resolveMyOfferInlineImagePath(offer);
            if (inlineImagePath) {
                return inlineImagePath;
            }

            const offerId = this.normalizeProfileUserId(offer?.id);
            return this.getMyOfferLocalImagePath(offerId);
        },
        hasMyOfferCardImage(offer = null) {
            return Boolean(this.resolveMyOfferImagePath(offer));
        },
        buildMyOfferCardStyle(offer = null) {
            const imagePath = this.resolveMyOfferImagePath(offer);
            if (!imagePath) {
                return {};
            }

            const escapedPath = imagePath.replace(/"/g, '\\"');
            return {
                '--my-offer-card-image': `url("${escapedPath}")`
            };
        },
        formatMyOfferPrice(value = null) {
            const numericValue = Number.parseFloat(String(value ?? '').replace(',', '.'));
            if (!Number.isFinite(numericValue) || numericValue <= 0) {
                return '—';
            }

            try {
                const localeCode = normalizeUiLocaleCode(document.documentElement.lang || 'de');
                return new Intl.NumberFormat(localeCode, {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(numericValue);
            } catch {
                return `${numericValue.toFixed(2)} €`;
            }
        },
        isMyOfferSpeciesSelected(value = '') {
            const normalizedValue = typeof value === 'string' ? value.trim().toUpperCase() : '';
            if (!normalizedValue) {
                return false;
            }

            return Array.isArray(this.myOffersForm?.acceptedPetSpecies)
                ? this.myOffersForm.acceptedPetSpecies.includes(normalizedValue)
                : false;
        },
        toggleMyOfferSpeciesSelection(value = '') {
            const normalizedValue = typeof value === 'string' ? value.trim().toUpperCase() : '';
            if (!normalizedValue) {
                return;
            }

            const currentSelection = Array.isArray(this.myOffersForm?.acceptedPetSpecies)
                ? [...this.myOffersForm.acceptedPetSpecies]
                : [];

            if (currentSelection.includes(normalizedValue)) {
                this.myOffersForm.acceptedPetSpecies = currentSelection.filter((species) => species !== normalizedValue);
                return;
            }

            this.myOffersForm.acceptedPetSpecies = [...currentSelection, normalizedValue];
        },
        extractMyOfferImageFileName(path = '') {
            const normalizedPath = this.resolveMyOfferInlineImagePath(path);
            if (!normalizedPath || normalizedPath.startsWith('blob:') || /^data:/i.test(normalizedPath)) {
                return '';
            }

            const withoutQuery = normalizedPath.split(/[?#]/, 1)[0] || '';
            const segments = withoutQuery.split('/').filter(Boolean);
            return segments.length ? segments[segments.length - 1] : '';
        },
        clearMyOffersFormImageSelection(options = {}) {
            const nextPreviewUrl = typeof options?.previewUrl === 'string'
                ? options.previewUrl.trim()
                : '';
            const currentPreviewUrl = typeof this.myOffersFormImagePreviewUrl === 'string'
                ? this.myOffersFormImagePreviewUrl.trim()
                : '';
            const previewUrlStillUsedByOffer = currentPreviewUrl
                ? Object.values(this.myOffersLocalImageById || {}).some((value) => {
                    const normalizedValue = this.resolveMyOfferInlineImagePath(value);
                    return normalizedValue === currentPreviewUrl;
                })
                : false;

            if (
                currentPreviewUrl
                && currentPreviewUrl !== nextPreviewUrl
                && currentPreviewUrl.startsWith('blob:')
                && !previewUrlStillUsedByOffer
                && typeof URL !== 'undefined'
                && typeof URL.revokeObjectURL === 'function'
            ) {
                URL.revokeObjectURL(currentPreviewUrl);
            }

            this.myOffersFormImageFile = null;
            this.myOffersFormImageFileName = '';
            this.myOffersFormImagePreviewUrl = nextPreviewUrl;
            myOffersPendingUploadFile = null;
        },
        clearMyOffersCitySearchRuntime() {
            if (typeof this.myOffersCitySearchDebounceHandle === 'number') {
                window.clearTimeout(this.myOffersCitySearchDebounceHandle);
            }
            this.myOffersCitySearchDebounceHandle = null;

            if (this.myOffersCitySearchAbortController) {
                this.myOffersCitySearchAbortController.abort();
                this.myOffersCitySearchAbortController = null;
            }
        },
        clearMyOffersCitySelection({ clearQuery = false, clearLocation = false } = {}) {
            this.myOffersCitySelectionKey = '';
            this.myOffersCitySelectedOption = null;
            this.myOffersCityOptions = [];

            if (clearQuery) {
                this.myOffersCityQuery = '';
            }

            if (clearLocation) {
                this.myOffersForm.location = '';
            }
        },
        handleMyOffersCityInput() {
            const query = typeof this.myOffersCityQuery === 'string' ? this.myOffersCityQuery.trim() : '';
            this.myOffersCityQuery = query;

            if (!query) {
                this.clearMyOffersCitySelection({ clearQuery: true, clearLocation: true });
                this.myOffersCityOptionsLoading = false;
                this.clearMyOffersCitySearchRuntime();
                return;
            }

            const selectedCity = typeof this.myOffersCitySelectedOption?.cityName === 'string'
                ? this.myOffersCitySelectedOption.cityName.trim().toLowerCase()
                : '';
            if (
                !this.myOffersCitySelectionKey
                || !selectedCity
                || selectedCity !== query.toLowerCase()
            ) {
                this.clearMyOffersCitySelection({ clearLocation: true });
            }

            this.scheduleMyOffersCitySearch(query);
        },
        scheduleMyOffersCitySearch(query) {
            const trimmedQuery = typeof query === 'string' ? query.trim() : '';
            if (typeof this.myOffersCitySearchDebounceHandle === 'number') {
                window.clearTimeout(this.myOffersCitySearchDebounceHandle);
                this.myOffersCitySearchDebounceHandle = null;
            }

            if (trimmedQuery.length < 2) {
                if (this.myOffersCitySearchAbortController) {
                    this.myOffersCitySearchAbortController.abort();
                    this.myOffersCitySearchAbortController = null;
                }
                this.myOffersCityOptions = [];
                this.myOffersCityOptionsLoading = false;
                return;
            }

            this.myOffersCitySearchDebounceHandle = window.setTimeout(() => {
                this.fetchMyOffersCityOptions(trimmedQuery);
            }, 240);
        },
        async fetchMyOffersCityOptions(query) {
            const trimmedQuery = typeof query === 'string' ? query.trim() : '';
            if (trimmedQuery.length < 2) {
                this.myOffersCityOptions = [];
                this.myOffersCityOptionsLoading = false;
                return;
            }

            const requestId = this.myOffersCitySearchRequestId + 1;
            this.myOffersCitySearchRequestId = requestId;
            if (this.myOffersCitySearchAbortController) {
                this.myOffersCitySearchAbortController.abort();
            }

            const abortController = new AbortController();
            this.myOffersCitySearchAbortController = abortController;
            this.myOffersCityOptionsLoading = true;

            try {
                const locale = document.documentElement.lang || 'de';
                const payload = await fetchCitySearchResults(trimmedQuery, locale, abortController.signal);
                if (requestId !== this.myOffersCitySearchRequestId) {
                    return;
                }

                this.myOffersCityOptions = normalizeCitySearchResults(payload, locale);
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return;
                }

                if (requestId !== this.myOffersCitySearchRequestId) {
                    return;
                }

                this.myOffersCityOptions = [];
            } finally {
                if (requestId === this.myOffersCitySearchRequestId) {
                    this.myOffersCityOptionsLoading = false;
                }

                if (this.myOffersCitySearchAbortController === abortController) {
                    this.myOffersCitySearchAbortController = null;
                }
            }
        },
        selectMyOffersCityOption(option) {
            const normalizedOption = normalizeCitySearchOption(option || {});
            if (!normalizedOption) {
                return;
            }

            const city = typeof normalizedOption.cityName === 'string'
                ? normalizedOption.cityName.trim()
                : '';
            this.myOffersForm.location = city;
            this.myOffersCityQuery = city;
            this.myOffersCitySelectionKey = normalizedOption.id || city;
            this.myOffersCitySelectedOption = normalizedOption;
            this.myOffersCityOptions = [];
            this.myOffersCityOptionsLoading = false;
            this.clearMyOffersCitySearchRuntime();
        },
        handleMyOfferImageSelection(event) {
            const file = event?.target?.files?.[0];
            if (!(file instanceof File)) {
                if (!this.myOffersFormImagePreviewUrl) {
                    this.clearMyOffersFormImageSelection();
                }
                return;
            }

            const mimeType = typeof file.type === 'string' ? file.type.trim().toLowerCase() : '';
            if (mimeType && !mimeType.startsWith('image/')) {
                this.clearMyOffersFormImageSelection();
                if (event?.target) {
                    event.target.value = '';
                }
                this.pushNotification({
                    title: this.myOffersStrings.actionErrorTitle,
                    message: this.myOffersStrings.actionErrorMessage,
                    tone: 'warning'
                });
                return;
            }

            const previewUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
                ? URL.createObjectURL(file)
                : '';
            this.clearMyOffersFormImageSelection({ previewUrl });
            this.myOffersFormImageFile = file;
            this.myOffersFormImageFileName = file.name || '';
            myOffersPendingUploadFile = file;
        },
        resetMyOffersForm() {
            this.myOffersForm = {
                title: '',
                flow: '',
                dayStructure: '',
                pricePerDay: '',
                location: '',
                acceptedPetSpecies: [],
                services: '',
                availableFrom: '',
                availableTo: ''
            };
            this.clearMyOffersFormImageSelection();
            this.clearMyOffersCitySearchRuntime();
            this.clearMyOffersCitySelection({ clearQuery: true, clearLocation: true });
            this.myOffersCityOptionsLoading = false;
            this.myOffersCreateStep = MY_OFFERS_CREATE_STEPS[0];
            this.myOffersFormEditingId = null;
            this.syncMyOffersAvailabilityCalendarView();
        },
        sanitizeMyOfferPriceInput(event = null) {
            const rawValue = event?.target?.value ?? this.myOffersForm?.pricePerDay ?? '';
            const normalizedRawValue = String(rawValue)
                .replace(/[^\d.,]/g, '')
                .replace(/,/g, '.');
            const firstDotIndex = normalizedRawValue.indexOf('.');
            let normalizedPriceValue = normalizedRawValue;
            if (firstDotIndex >= 0) {
                const integerPart = normalizedRawValue.slice(0, firstDotIndex).replace(/\./g, '');
                const fractionalPart = normalizedRawValue.slice(firstDotIndex + 1).replace(/\./g, '').slice(0, 2);
                normalizedPriceValue = fractionalPart.length
                    ? `${integerPart}.${fractionalPart}`
                    : `${integerPart}.`;
            }

            this.myOffersForm.pricePerDay = normalizedPriceValue;
            if (event?.target && event.target.value !== normalizedPriceValue) {
                event.target.value = normalizedPriceValue;
            }
        },
        parseMyOfferDescriptionParts(rawDescription = '') {
            const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';
            if (!description) {
                return {
                    flow: '',
                    dayStructure: ''
                };
            }

            const lines = description
                .split(/\r?\n+/)
                .map((line) => line.trim())
                .filter(Boolean);
            if (!lines.length) {
                return {
                    flow: '',
                    dayStructure: ''
                };
            }

            const flowPrefix = `${String(this.myOffersStrings?.labels?.flow || '').trim()}:`.toLowerCase();
            const dayStructurePrefix = `${String(this.myOffersStrings?.labels?.dayStructure || '').trim()}:`.toLowerCase();
            let flow = '';
            let dayStructure = '';
            const remainder = [];

            lines.forEach((line) => {
                const lowered = line.toLowerCase();
                if (flowPrefix && lowered.startsWith(flowPrefix)) {
                    flow = line.slice(flowPrefix.length).trim();
                    return;
                }
                if (dayStructurePrefix && lowered.startsWith(dayStructurePrefix)) {
                    dayStructure = line.slice(dayStructurePrefix.length).trim();
                    return;
                }
                remainder.push(line);
            });

            if (!flow && !dayStructure) {
                const colonSeparatedValues = lines
                    .map((line) => {
                        const colonIndex = line.indexOf(':');
                        if (colonIndex < 0 || colonIndex >= line.length - 1) {
                            return '';
                        }
                        return line.slice(colonIndex + 1).trim();
                    })
                    .filter(Boolean);

                if (colonSeparatedValues.length) {
                    flow = colonSeparatedValues[0] || '';
                    dayStructure = colonSeparatedValues[1] || '';
                }
            }

            if (!flow && !dayStructure && remainder.length) {
                flow = remainder.join(' ');
            } else {
                if (!flow && remainder.length) {
                    flow = remainder.shift() || '';
                }
                if (!dayStructure && remainder.length) {
                    dayStructure = remainder.join(' ');
                }
            }

            return {
                flow,
                dayStructure
            };
        },
        openMyOffersEditModal(offer = null) {
            if (!myOffersPageRoot) {
                return;
            }

            const normalizedOffer = this.normalizeMyOffer(offer || {});
            if (!Number.isInteger(normalizedOffer.id) || normalizedOffer.id <= 0) {
                return;
            }

            const descriptionParts = this.parseMyOfferDescriptionParts(normalizedOffer.description);

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.myOffersForm = {
                title: normalizedOffer.title,
                flow: descriptionParts.flow,
                dayStructure: descriptionParts.dayStructure,
                pricePerDay: Number.isFinite(normalizedOffer.pricePerDay) && normalizedOffer.pricePerDay > 0
                    ? String(normalizedOffer.pricePerDay).replace(',', '.')
                    : '',
                location: normalizedOffer.location || normalizedOffer.city || normalizedOffer.hostCity || '',
                acceptedPetSpecies: Array.isArray(normalizedOffer.acceptedPetSpecies)
                    ? [...normalizedOffer.acceptedPetSpecies]
                    : [],
                services: Array.isArray(normalizedOffer.services)
                    ? normalizedOffer.services.join(', ')
                    : '',
                availableFrom: normalizedOffer.availableFrom || '',
                availableTo: normalizedOffer.availableTo || ''
            };
            this.myOffersFormEditingId = normalizedOffer.id;
            this.myOffersFormSaving = false;
            this.myOffersCreateModalOpen = true;
            this.myOffersCreateStep = 'setup';
            this.myOffersCityQuery = this.myOffersForm.location;
            this.myOffersCitySelectionKey = this.myOffersForm.location;
            this.myOffersCitySelectedOption = this.myOffersForm.location
                ? normalizeCitySearchOption({
                    cityName: this.myOffersForm.location,
                    label: this.myOffersForm.location,
                    id: this.myOffersForm.location
                })
                : null;
            this.myOffersCityOptions = [];
            this.myOffersCityOptionsLoading = false;
            this.clearMyOffersCitySearchRuntime();
            const existingImagePath = this.resolveMyOfferImagePath(normalizedOffer);
            this.clearMyOffersFormImageSelection({ previewUrl: existingImagePath });
            this.myOffersFormImageFileName = this.extractMyOfferImageFileName(existingImagePath);
            this.syncMyOffersAvailabilityCalendarView(normalizedOffer.availableFrom || normalizedOffer.availableTo);
            this.syncModalBodyLock();

            nextTick(() => {
                this.updateSegmentedIndicators();
                this.focusMyOffersCreateStepField();
            });
        },
        focusMyOffersCreateStepField() {
            if (!this.myOffersCreateModalOpen) {
                return;
            }

            if (this.myOffersCreateStep === 'setup') {
                document.querySelector('[data-my-offers-create-modal] [data-my-offers-form-title]')?.focus();
                return;
            }

            if (this.myOffersCreateStep === 'species') {
                document.querySelector('[data-my-offers-create-modal] .register_pet_chip')?.focus();
                return;
            }

            if (this.myOffersCreateStep === 'details') {
                document.querySelector('[data-my-offers-create-modal] [data-my-offers-form-city-input]')?.focus();
                return;
            }

            document.querySelector('[data-my-offers-create-modal] [data-my-offers-form-confirm]')?.focus();
        },
        setMyOffersCreateStep(step = MY_OFFERS_CREATE_STEPS[0]) {
            if (!MY_OFFERS_CREATE_STEPS.includes(step) || this.myOffersCreateStep === step) {
                return;
            }

            this.myOffersCreateStep = step;
            nextTick(() => {
                this.updateSegmentedIndicators();
                this.focusMyOffersCreateStepField();
            });
        },
        goToNextMyOffersCreateStep() {
            const currentStep = MY_OFFERS_CREATE_STEPS.includes(this.myOffersCreateStep)
                ? this.myOffersCreateStep
                : MY_OFFERS_CREATE_STEPS[0];
            const validation = this.validateMyOfferForm({
                step: currentStep,
                persist: true
            });
            if (!validation.valid) {
                this.pushNotification({
                    title: this.myOffersStrings.actionErrorTitle,
                    message: validation.message || this.myOffersStrings.actionErrorMessage,
                    tone: 'warning'
                });
                return false;
            }

            const currentIndex = MY_OFFERS_CREATE_STEPS.indexOf(currentStep);
            const nextStep = MY_OFFERS_CREATE_STEPS[currentIndex + 1];
            if (!nextStep) {
                return false;
            }

            this.setMyOffersCreateStep(nextStep);
            return true;
        },
        goToPreviousMyOffersCreateStep() {
            const currentIndex = MY_OFFERS_CREATE_STEPS.indexOf(this.myOffersCreateStep);
            if (currentIndex <= 0) {
                return;
            }

            this.setMyOffersCreateStep(MY_OFFERS_CREATE_STEPS[currentIndex - 1]);
        },
        buildMyOfferDescription(flow = '', dayStructure = '') {
            const rows = [];
            if (flow) {
                rows.push(`${this.myOffersStrings.labels.flow}: ${flow}`);
            }
            if (dayStructure) {
                rows.push(`${this.myOffersStrings.labels.dayStructure}: ${dayStructure}`);
            }
            return rows.join('\n');
        },
        openMyOffersCreateModal() {
            if (!myOffersPageRoot) {
                return;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.resetMyOffersForm();
            this.myOffersFormSaving = false;
            this.myOffersCreateModalOpen = true;
            this.syncModalBodyLock();

            nextTick(() => {
                this.updateSegmentedIndicators();
                this.focusMyOffersCreateStepField();
            });
        },
        closeMyOffersCreateModal() {
            if (!this.myOffersCreateModalOpen) {
                return;
            }

            this.myOffersCreateModalOpen = false;
            this.myOffersFormSaving = false;
            this.resetMyOffersForm();
            this.syncModalBodyLock();
        },
        parseMyOfferServices(rawValue = '') {
            if (typeof rawValue !== 'string') {
                return [];
            }

            return [...new Set(
                rawValue
                    .split(/[,\n;]+/)
                    .map((service) => service.trim())
                    .filter(Boolean)
            )];
        },
        getNormalizedMyOfferFormData() {
            const normalizedTitle = typeof this.myOffersForm?.title === 'string'
                ? this.myOffersForm.title.trim()
                : '';
            const normalizedFlow = typeof this.myOffersForm?.flow === 'string'
                ? this.myOffersForm.flow.trim()
                : '';
            const normalizedDayStructure = typeof this.myOffersForm?.dayStructure === 'string'
                ? this.myOffersForm.dayStructure.trim()
                : '';
            const normalizedLocation = typeof this.myOffersForm?.location === 'string'
                ? this.myOffersForm.location.trim()
                : '';
            const normalizedPriceInput = typeof this.myOffersForm?.pricePerDay === 'string' || typeof this.myOffersForm?.pricePerDay === 'number'
                ? String(this.myOffersForm.pricePerDay).trim().replace(',', '.')
                : '';
            const normalizedPrice = Number.parseFloat(normalizedPriceInput);
            const normalizedSpecies = Array.isArray(this.myOffersForm?.acceptedPetSpecies)
                ? [...new Set(
                    this.myOffersForm.acceptedPetSpecies
                        .map((species) => (typeof species === 'string' ? species.trim().toUpperCase() : ''))
                        .filter(Boolean)
                )]
                : [];
            const normalizedServices = this.parseMyOfferServices(this.myOffersForm?.services || '');
            const normalizedDescription = this.buildMyOfferDescription(normalizedFlow, normalizedDayStructure);
            const normalizedAvailableFromInput = normalizeDateInputValue(this.myOffersForm?.availableFrom);
            const normalizedAvailableToInput = normalizeDateInputValue(this.myOffersForm?.availableTo);
            const normalizedAvailableFrom = normalizedAvailableFromInput;
            const normalizedAvailableTo = normalizedAvailableToInput;

            return {
                normalizedTitle,
                normalizedFlow,
                normalizedDayStructure,
                normalizedLocation,
                normalizedDescription,
                normalizedPriceInput,
                normalizedPrice,
                normalizedSpecies,
                normalizedServices,
                normalizedAvailableFrom,
                normalizedAvailableTo
            };
        },
        validateMyOfferForm(options = {}) {
            const step = typeof options?.step === 'string' ? options.step : 'review';
            const persist = options?.persist !== false;
            const normalizedData = this.getNormalizedMyOfferFormData();
            const {
                normalizedTitle,
                normalizedFlow,
                normalizedDayStructure,
                normalizedLocation,
                normalizedDescription,
                normalizedPriceInput,
                normalizedPrice,
                normalizedSpecies,
                normalizedServices,
                normalizedAvailableFrom,
                normalizedAvailableTo
            } = normalizedData;

            const requiredMessageFor = (fieldLabel) => formatTemplate(this.myOffersStrings.validationRequiredTemplate, {
                field: fieldLabel
            });

            const needsSetupValidation = step === 'setup' || step === 'review';
            const needsSpeciesValidation = step === 'species' || step === 'review';
            const needsDetailsValidation = step === 'details' || step === 'review';

            if (needsSetupValidation && !normalizedTitle) {
                return {
                    valid: false,
                    message: requiredMessageFor(this.myOffersStrings.labels.title)
                };
            }

            if (needsSetupValidation && (!normalizedAvailableFrom || !normalizedAvailableTo)) {
                return {
                    valid: false,
                    message: this.myOffersStrings.validationPeriod
                };
            }

            if (
                needsSetupValidation
                && normalizedAvailableFrom
                && normalizedAvailableTo
                && normalizedAvailableTo < normalizedAvailableFrom
            ) {
                return {
                    valid: false,
                    message: this.myOffersStrings.validationPeriodOrder
                };
            }

            if (needsSpeciesValidation && !normalizedSpecies.length) {
                return {
                    valid: false,
                    message: this.myOffersStrings.validationSpecies
                };
            }

            if (needsDetailsValidation && !normalizedFlow) {
                return {
                    valid: false,
                    message: requiredMessageFor(this.myOffersStrings.labels.flow)
                };
            }

            if (needsDetailsValidation && !normalizedDayStructure) {
                return {
                    valid: false,
                    message: requiredMessageFor(this.myOffersStrings.labels.dayStructure)
                };
            }

            if (needsDetailsValidation && (!normalizedLocation || !this.myOffersCitySelectionKey)) {
                return {
                    valid: false,
                    message: this.myOffersStrings.validationCityRequired
                };
            }

            if (needsDetailsValidation && (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0)) {
                return {
                    valid: false,
                    message: this.myOffersStrings.validationPrice
                };
            }

            if (needsDetailsValidation && !normalizedServices.length) {
                return {
                    valid: false,
                    message: this.myOffersStrings.validationServices
                };
            }

            if (persist) {
                this.myOffersForm = {
                    ...this.myOffersForm,
                    title: normalizedTitle,
                    flow: normalizedFlow,
                    dayStructure: normalizedDayStructure,
                    location: normalizedLocation,
                    pricePerDay: normalizedPriceInput,
                    acceptedPetSpecies: normalizedSpecies,
                    services: normalizedServices.join(', '),
                    availableFrom: normalizedAvailableFrom,
                    availableTo: normalizedAvailableTo
                };
            }

            if (step !== 'review') {
                return {
                    valid: true
                };
            }

            return {
                valid: true,
                payload: {
                    title: normalizedTitle,
                    location: normalizedLocation,
                    description: normalizedDescription,
                    pricePerDay: Number(normalizedPrice.toFixed(2)),
                    acceptedPetSpecies: normalizedSpecies,
                    services: normalizedServices,
                    availableFrom: normalizedAvailableFrom,
                    availableTo: normalizedAvailableTo
                }
            };
        },
        upsertMyOfferInCollection(offer = null, options = {}) {
            const normalizedOffer = this.normalizeMyOffer(offer || {});
            if (!Number.isInteger(normalizedOffer.id) || normalizedOffer.id <= 0) {
                return null;
            }

            const selectInsertedOffer = options?.selectInsertedOffer !== false;
            const previousOffers = Array.isArray(this.myOffersOffers) ? [...this.myOffersOffers] : [];
            const existingIndex = previousOffers.findIndex((entry) => entry.id === normalizedOffer.id);

            if (existingIndex >= 0) {
                previousOffers.splice(existingIndex, 1, normalizedOffer);
            } else {
                previousOffers.unshift(normalizedOffer);
            }

            this.myOffersOffers = previousOffers;

            if (selectInsertedOffer) {
                const nextIndex = previousOffers.findIndex((entry) => entry.id === normalizedOffer.id);
                this.myOffersCarouselIndex = nextIndex >= 0 ? nextIndex : 0;
            }

            return normalizedOffer;
        },
        async uploadMyOfferImageById(offerId, file, options = {}) {
            const normalizedOfferId = this.normalizeProfileUserId(offerId);
            const imageFile = file && typeof file === 'object' && Number.isFinite(Number(file.size))
                ? file
                : null;
            if (!Number.isInteger(normalizedOfferId) || normalizedOfferId <= 0 || !imageFile) {
                return null;
            }

            const formData = new FormData();
            if (typeof imageFile.name === 'string' && imageFile.name.trim()) {
                formData.append('image', imageFile, imageFile.name);
            } else {
                formData.append('image', imageFile);
            }

            try {
                const response = await apiFetch(`/api/offers/${normalizedOfferId}/image`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store',
                    body: formData
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    this.pushNotification({
                        title: this.myOffersStrings.actionErrorTitle,
                        message: this.buildMyOffersActionErrorMessage(payload),
                        tone: 'warning'
                    });
                    return null;
                }

                const normalizedOffer = this.upsertMyOfferInCollection(payload?.data || {}, {
                    selectInsertedOffer: options?.selectInsertedOffer !== false
                });
                if (!normalizedOffer) {
                    return null;
                }

                return normalizedOffer;
            } catch {
                this.pushNotification({
                    title: this.myOffersStrings.actionErrorTitle,
                    message: this.myOffersStrings.actionErrorMessage,
                    tone: 'warning'
                });
                return null;
            }
        },
        async resolveMyOfferUploadFile() {
            const pendingUploadFile = myOffersPendingUploadFile;
            if (pendingUploadFile && typeof pendingUploadFile === 'object' && Number.isFinite(Number(pendingUploadFile.size))) {
                return pendingUploadFile;
            }

            const selectedFile = this.myOffersFormImageFile;
            if (selectedFile && typeof selectedFile === 'object' && Number.isFinite(Number(selectedFile.size))) {
                return selectedFile;
            }

            const previewUrl = typeof this.myOffersFormImagePreviewUrl === 'string'
                ? this.myOffersFormImagePreviewUrl.trim()
                : '';
            if (!previewUrl.startsWith('blob:')) {
                return null;
            }

            try {
                const response = await fetch(previewUrl);
                if (!response.ok) {
                    return null;
                }
                const blob = await response.blob();
                const fallbackName = typeof this.myOffersFormImageFileName === 'string' && this.myOffersFormImageFileName.trim()
                    ? this.myOffersFormImageFileName.trim()
                    : 'offer-image';
                const normalizedType = blob.type || 'application/octet-stream';

                try {
                    return new File([blob], fallbackName, { type: normalizedType });
                } catch {
                    return blob;
                }
            } catch {
                return null;
            }
        },
        async submitMyOfferForm() {
            if (this.myOffersFormSaving) {
                return;
            }

            const isFinalStep = this.myOffersCreateStep === MY_OFFERS_CREATE_STEPS[MY_OFFERS_CREATE_STEPS.length - 1];
            if (!isFinalStep) {
                this.goToNextMyOffersCreateStep();
                return;
            }

            const validation = this.validateMyOfferForm({
                step: 'review',
                persist: true
            });
            if (!validation.valid) {
                this.pushNotification({
                    title: this.myOffersStrings.actionErrorTitle,
                    message: validation.message || this.myOffersStrings.actionErrorMessage,
                    tone: 'warning'
                });
                return;
            }

            this.myOffersFormSaving = true;
            const editingOfferId = this.normalizeProfileUserId(this.myOffersFormEditingId);
            const isEditing = Number.isInteger(editingOfferId) && editingOfferId > 0;
            const endpoint = isEditing ? `/api/offers/${editingOfferId}` : '/api/offers';
            const requestMethod = isEditing ? 'PATCH' : 'POST';

            try {
                const response = await apiFetch(endpoint, {
                    method: requestMethod,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store',
                    body: JSON.stringify(validation.payload)
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    this.pushNotification({
                        title: this.myOffersStrings.actionErrorTitle,
                        message: this.buildMyOffersActionErrorMessage(payload),
                        tone: 'warning'
                    });
                    return;
                }

                let normalizedOffer = this.upsertMyOfferInCollection(payload?.data || {}, {
                    selectInsertedOffer: true
                });
                if (!normalizedOffer) {
                    this.pushNotification({
                        title: this.myOffersStrings.actionErrorTitle,
                        message: this.myOffersStrings.actionErrorMessage,
                        tone: 'warning'
                    });
                    return;
                }

                const imageUploadFile = await this.resolveMyOfferUploadFile();
                if (imageUploadFile) {
                    const uploadedOffer = await this.uploadMyOfferImageById(normalizedOffer.id, imageUploadFile, {
                        selectInsertedOffer: true
                    });
                    if (uploadedOffer) {
                        normalizedOffer = uploadedOffer;
                    } else {
                        return;
                    }
                }

                this.rememberMyOfferLocalImagePath(normalizedOffer.id, this.resolveMyOfferImagePath(normalizedOffer));
                this.closeMyOffersCreateModal();
                this.pushNotification({
                    title: isEditing
                        ? this.myOffersStrings.updateSuccessTitle
                        : this.myOffersStrings.createSuccessTitle,
                    message: formatTemplate(
                        isEditing ? this.myOffersStrings.updateSuccessTemplate : this.myOffersStrings.createSuccessTemplate,
                        {
                        name: normalizedOffer.title || this.myOffersStrings.labels.title
                        }
                    ),
                    tone: 'success'
                });
            } catch {
                this.pushNotification({
                    title: this.myOffersStrings.actionErrorTitle,
                    message: this.myOffersStrings.actionErrorMessage,
                    tone: 'warning'
                });
            } finally {
                this.myOffersFormSaving = false;
            }
        },
        async updateMyOfferStatus(offer = null, statusAction = 'publish') {
            const normalizedOffer = this.normalizeMyOffer(offer || {});
            if (!Number.isInteger(normalizedOffer.id) || normalizedOffer.id <= 0) {
                return;
            }

            const normalizedAction = statusAction === 'withdraw' ? 'withdraw' : 'publish';
            if (this.myOffersActionPendingId === normalizedOffer.id) {
                return;
            }

            this.myOffersActionPendingId = normalizedOffer.id;

            try {
                const response = await apiFetch(`/api/offers/${normalizedOffer.id}/${normalizedAction}`, {
                    method: 'PATCH',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    this.pushNotification({
                        title: this.myOffersStrings.actionErrorTitle,
                        message: this.buildMyOffersActionErrorMessage(payload),
                        tone: 'warning'
                    });
                    return;
                }

                const nextOffer = this.upsertMyOfferInCollection(payload?.data || {}, {
                    selectInsertedOffer: true
                });
                if (!nextOffer) {
                    return;
                }

                const successTitle = normalizedAction === 'publish'
                    ? this.myOffersStrings.publishSuccessTitle
                    : this.myOffersStrings.withdrawSuccessTitle;
                const successTemplate = normalizedAction === 'publish'
                    ? this.myOffersStrings.publishSuccessTemplate
                    : this.myOffersStrings.withdrawSuccessTemplate;

                this.pushNotification({
                    title: successTitle,
                    message: formatTemplate(successTemplate, {
                        name: nextOffer.title || this.myOffersStrings.labels.title
                    }),
                    tone: 'success'
                });
            } catch {
                this.pushNotification({
                    title: this.myOffersStrings.actionErrorTitle,
                    message: this.myOffersStrings.actionErrorMessage,
                    tone: 'warning'
                });
            } finally {
                if (this.myOffersActionPendingId === normalizedOffer.id) {
                    this.myOffersActionPendingId = null;
                }
            }
        },
        async publishMyOffer(offer = null) {
            await this.updateMyOfferStatus(offer, 'publish');
        },
        async withdrawMyOffer(offer = null) {
            await this.updateMyOfferStatus(offer, 'withdraw');
        },
        normalizeMyPetImagePath(value = '') {
            if (typeof value !== 'string') {
                return '';
            }

            const trimmed = value.trim();
            if (!trimmed) {
                return '';
            }

            if (
                /^https?:\/\//i.test(trimmed)
                || trimmed.startsWith('/')
                || /^data:/i.test(trimmed)
            ) {
                return trimmed;
            }

            return `/uploads/pets/${trimmed}`;
        },
        normalizeMyPet(value = {}) {
            const normalizedId = this.normalizeProfileUserId(value?.id);
            const normalizedName = typeof value?.name === 'string' ? value.name.trim() : '';
            const normalizedSpecies = typeof value?.species === 'string' ? value.species.trim().toUpperCase() : '';
            const normalizedBreed = typeof value?.breed === 'string' ? value.breed.trim() : '';
            const normalizedSpecialNeeds = typeof value?.specialNeeds === 'string'
                ? value.specialNeeds.trim()
                : '';
            const rawAge = Number(value?.age);
            const normalizedAge = Number.isFinite(rawAge) && rawAge >= 0 ? Math.round(rawAge) : 0;

            return {
                id: normalizedId,
                name: normalizedName,
                species: normalizedSpecies,
                breed: normalizedBreed,
                age: normalizedAge,
                specialNeeds: normalizedSpecialNeeds,
                imagePath: this.normalizeMyPetImagePath(value?.imagePath || ''),
                defaultImagePath: this.normalizeMyPetImagePath(value?.defaultImagePath || '')
            };
        },
        resolveMyPetImagePath(pet = {}) {
            const imagePath = this.normalizeMyPetImagePath(pet?.imagePath || '');
            if (imagePath) {
                return imagePath;
            }

            const defaultImagePath = this.normalizeMyPetImagePath(pet?.defaultImagePath || '');
            if (defaultImagePath) {
                return defaultImagePath;
            }

            const species = typeof pet?.species === 'string' ? pet.species.trim().toUpperCase() : '';
            return resolvePetChoiceEmojiPath(species);
        },
        resolveMyPetSpeciesLabel(pet = null) {
            const species = typeof pet?.species === 'string' ? pet.species.trim().toUpperCase() : '';
            if (!species) {
                return this.myPetsStrings.labels.species;
            }

            return formatPetChoiceLabel(species, document.documentElement.lang || 'de');
        },
        resolveMyPetSpeciesEmoji(pet = null) {
            const species = typeof pet?.species === 'string' ? pet.species.trim().toUpperCase() : '';
            if (!species) {
                return PET_CHOICE_EMOJI_FALLBACK_ASSET_PATH;
            }

            return resolvePetChoiceEmojiPath(species);
        },
        buildMyPetsOpenDetailsLabel(pet = null) {
            const petName = typeof pet?.name === 'string' ? pet.name.trim() : '';
            return formatTemplate(this.myPetsStrings.openDetailsTemplate, {
                name: petName || this.myPetsStrings.labels.name
            });
        },
        buildMyPetsActionErrorMessage(payload = {}) {
            const backendMessage = typeof payload?.message === 'string'
                ? payload.message.trim()
                : '';
            const detailMessage = Array.isArray(payload?.error?.details)
                ? payload.error.details
                    .map((detail) => (typeof detail?.message === 'string' ? detail.message.trim() : ''))
                    .find(Boolean)
                : '';

            return detailMessage || backendMessage || this.myPetsStrings.actionErrorMessage;
        },
        async loadMyPetsViewData() {
            if (!myPetsPageRoot) {
                return;
            }

            this.myPetsViewLoading = true;
            this.myPetsViewError = '';

            try {
                const [profileResponse, petsResponse] = await Promise.all([
                    apiFetch('/api/users/me', {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json'
                        },
                        cache: 'no-store'
                    }),
                    apiFetch('/api/pets', {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json'
                        },
                        cache: 'no-store'
                    })
                ]);
                const profilePayload = await profileResponse.json().catch(() => ({}));
                const petsPayload = await petsResponse.json().catch(() => ({}));

                if (
                    profileResponse.status === 401
                    || profileResponse.status === 403
                    || petsResponse.status === 401
                    || petsResponse.status === 403
                ) {
                    this.myPetsViewError = this.myPetsStrings.authRequired;
                    window.location.assign(this.buildNotFoundPath());
                    return;
                }

                if (
                    !profileResponse.ok
                    || profilePayload?.success === false
                    || !petsResponse.ok
                    || petsPayload?.success === false
                ) {
                    this.myPetsViewError = this.myPetsStrings.loadFailed;
                    return;
                }

                this.myPetsViewUser = this.normalizeProfileUser(profilePayload?.data || {});
                const normalizedPets = Array.isArray(petsPayload?.data)
                    ? petsPayload.data
                        .map((pet) => this.normalizeMyPet(pet))
                        .filter((pet) => Number.isInteger(pet.id) && pet.id > 0)
                    : [];
                this.myPetsPets = normalizedPets;
                this.myPetsCarouselIndex = 0;
                this.resetMyPetForm({ keepSpecies: false });
            } catch {
                this.myPetsViewError = this.myPetsStrings.loadFailed;
            } finally {
                this.myPetsViewLoading = false;
            }
        },
        getMyPetsCarouselRelativeOffset(index, totalCount = null) {
            const normalizedIndex = Number(index);
            const pets = Array.isArray(this.myPetsPets) ? this.myPetsPets : [];
            const normalizedCount = Number.isFinite(Number(totalCount))
                ? Math.max(0, Math.round(Number(totalCount)))
                : pets.length;

            if (!Number.isInteger(normalizedIndex) || normalizedCount <= 0) {
                return 0;
            }

            const safeActiveIndex = Number.isInteger(this.myPetsCarouselIndex)
                ? Math.min(Math.max(0, this.myPetsCarouselIndex), normalizedCount - 1)
                : 0;
            let offset = normalizedIndex - safeActiveIndex;
            const halfRange = normalizedCount / 2;

            if (offset > halfRange) {
                offset -= normalizedCount;
            } else if (offset < -halfRange) {
                offset += normalizedCount;
            }

            return Math.round(offset);
        },
        setMyPetsCarouselIndex(index) {
            const normalizedIndex = Number(index);
            if (!Array.isArray(this.myPetsPets) || !this.myPetsPets.length || !Number.isFinite(normalizedIndex)) {
                this.myPetsCarouselIndex = 0;
                return;
            }

            const maxIndex = this.myPetsPets.length - 1;
            this.myPetsCarouselIndex = Math.min(maxIndex, Math.max(0, Math.round(normalizedIndex)));
        },
        navigateMyPetsCarousel(direction = 1) {
            if (!Array.isArray(this.myPetsPets) || !this.myPetsPets.length) {
                this.myPetsCarouselIndex = 0;
                return;
            }

            const normalizedDirection = Number(direction) < 0 ? -1 : 1;
            const itemCount = this.myPetsPets.length;
            const currentIndex = Number.isInteger(this.myPetsCarouselIndex) ? this.myPetsCarouselIndex : 0;
            const nextIndex = (currentIndex + normalizedDirection + itemCount) % itemCount;
            this.myPetsCarouselIndex = nextIndex;
        },
        openMyPetsAddModal() {
            if (!myPetsPageRoot) {
                return;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.closeMyPetsDeleteModal();
            this.myPetsDetailModalOpen = false;
            this.myPetsDetailEditing = false;
            this.myPetsDetailPetId = null;
            this.resetMyPetForm({ keepSpecies: false });
            this.myPetsAddModalOpen = true;
            this.syncModalBodyLock();

            nextTick(() => {
                document.querySelector('[data-my-pets-add-modal] [data-my-pets-form-name]')?.focus();
            });
        },
        closeMyPetsAddModal() {
            if (!this.myPetsAddModalOpen) {
                return;
            }

            this.myPetsAddModalOpen = false;
            this.resetMyPetForm({ keepSpecies: false });
            this.syncModalBodyLock();
        },
        openMyPetsDetailModal(pet = null) {
            const sourcePet = pet && typeof pet === 'object' ? this.normalizeMyPet(pet) : this.myPetsActivePet;
            if (!sourcePet || !Number.isInteger(sourcePet.id) || sourcePet.id <= 0) {
                return;
            }

            const selectedIndex = this.myPetsPets.findIndex((entry) => entry.id === sourcePet.id);
            if (selectedIndex >= 0) {
                this.myPetsCarouselIndex = selectedIndex;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.closeMyPetsDeleteModal();
            this.myPetsAddModalOpen = false;
            this.myPetsDetailPetId = sourcePet.id;
            this.myPetsDetailEditing = false;
            this.resetMyPetForm({ keepSpecies: false });
            this.myPetsDetailModalOpen = true;
            this.syncModalBodyLock();
        },
        closeMyPetsDetailModal() {
            if (!this.myPetsDetailModalOpen) {
                return;
            }

            this.myPetsDetailModalOpen = false;
            this.myPetsDetailEditing = false;
            this.myPetsDetailPetId = null;
            this.resetMyPetForm({ keepSpecies: false });
            this.syncModalBodyLock();
        },
        startMyPetsDetailEditing() {
            if (!this.myPetsDetailModalOpen || !this.myPetsDetailPet) {
                return;
            }

            this.beginMyPetEdit(this.myPetsDetailPet);
            this.myPetsDetailPetId = this.myPetsDetailPet.id;
            this.myPetsDetailEditing = true;
            this.syncModalBodyLock();

            nextTick(() => {
                document.querySelector('[data-my-pets-detail-modal] [data-my-pets-form-name]')?.focus();
            });
        },
        cancelMyPetsDetailEditing() {
            this.myPetsDetailEditing = false;
            this.resetMyPetForm({ keepSpecies: true });
        },
        resetMyPetForm(options = {}) {
            const keepSpecies = options?.keepSpecies === true;
            const currentSpecies = keepSpecies && typeof this.myPetsForm?.species === 'string'
                ? this.myPetsForm.species.trim().toUpperCase()
                : '';
            const defaultSpecies = this.myPetsSpeciesChoices?.[0]?.value || '';

            this.myPetsForm = {
                name: '',
                species: currentSpecies || defaultSpecies,
                breed: '',
                age: '',
                specialNeeds: ''
            };
            this.myPetsFormEditingId = null;
            this.myPetsFormImageFile = null;
            this.myPetsFormImageFileName = '';
        },
        beginMyPetEdit(pet = null) {
            if (!pet || typeof pet !== 'object') {
                return;
            }

            const normalizedPet = this.normalizeMyPet(pet);
            if (!Number.isInteger(normalizedPet.id) || normalizedPet.id <= 0) {
                return;
            }

            this.myPetsForm = {
                name: normalizedPet.name,
                species: normalizedPet.species || this.myPetsSpeciesChoices?.[0]?.value || '',
                breed: normalizedPet.breed,
                age: String(normalizedPet.age),
                specialNeeds: normalizedPet.specialNeeds
            };
            this.myPetsFormEditingId = normalizedPet.id;
            this.myPetsFormImageFile = null;
            this.myPetsFormImageFileName = '';

            const selectedIndex = this.myPetsPets.findIndex((entry) => entry.id === normalizedPet.id);
            if (selectedIndex >= 0) {
                this.myPetsCarouselIndex = selectedIndex;
            }
        },
        handleMyPetFormImageSelection(event) {
            const file = event?.target?.files?.[0] ?? null;
            this.myPetsFormImageFile = file instanceof File ? file : null;
            this.myPetsFormImageFileName = this.myPetsFormImageFile?.name || '';
        },
        validateMyPetForm() {
            const normalizedName = typeof this.myPetsForm?.name === 'string'
                ? this.myPetsForm.name.trim()
                : '';
            const normalizedSpecies = typeof this.myPetsForm?.species === 'string'
                ? this.myPetsForm.species.trim().toUpperCase()
                : '';
            const normalizedBreed = typeof this.myPetsForm?.breed === 'string'
                ? this.myPetsForm.breed.trim()
                : '';
            const normalizedSpecialNeeds = typeof this.myPetsForm?.specialNeeds === 'string'
                ? this.myPetsForm.specialNeeds.trim()
                : '';
            const ageInput = typeof this.myPetsForm?.age === 'string' || typeof this.myPetsForm?.age === 'number'
                ? String(this.myPetsForm.age).trim()
                : '';
            const normalizedAge = Number.parseInt(ageInput, 10);

            const requiredMessageFor = (fieldLabel) => formatTemplate(this.myPetsStrings.validationRequiredTemplate, {
                field: fieldLabel
            });

            if (!normalizedName) {
                return {
                    valid: false,
                    message: requiredMessageFor(this.myPetsStrings.labels.name)
                };
            }

            if (!normalizedSpecies) {
                return {
                    valid: false,
                    message: requiredMessageFor(this.myPetsStrings.labels.species)
                };
            }

            if (!normalizedBreed) {
                return {
                    valid: false,
                    message: requiredMessageFor(this.myPetsStrings.labels.breed)
                };
            }

            if (!Number.isInteger(normalizedAge) || normalizedAge < 0) {
                return {
                    valid: false,
                    message: this.myPetsStrings.validationAge
                };
            }

            if (!normalizedSpecialNeeds) {
                return {
                    valid: false,
                    message: requiredMessageFor(this.myPetsStrings.labels.specialNeeds)
                };
            }

            this.myPetsForm = {
                ...this.myPetsForm,
                name: normalizedName,
                species: normalizedSpecies,
                breed: normalizedBreed,
                age: String(normalizedAge),
                specialNeeds: normalizedSpecialNeeds
            };

            return {
                valid: true,
                payload: {
                    name: normalizedName,
                    species: normalizedSpecies,
                    breed: normalizedBreed,
                    age: normalizedAge,
                    specialNeeds: normalizedSpecialNeeds
                }
            };
        },
        upsertMyPetInCollection(pet = null, options = {}) {
            const normalizedPet = this.normalizeMyPet(pet || {});
            if (!Number.isInteger(normalizedPet.id) || normalizedPet.id <= 0) {
                return null;
            }

            const selectInsertedPet = options?.selectInsertedPet !== false;
            const previousPets = Array.isArray(this.myPetsPets) ? [...this.myPetsPets] : [];
            const existingIndex = previousPets.findIndex((entry) => entry.id === normalizedPet.id);

            if (existingIndex >= 0) {
                previousPets.splice(existingIndex, 1, normalizedPet);
            } else {
                previousPets.unshift(normalizedPet);
            }

            this.myPetsPets = previousPets;

            if (selectInsertedPet) {
                const nextIndex = previousPets.findIndex((entry) => entry.id === normalizedPet.id);
                this.myPetsCarouselIndex = nextIndex >= 0 ? nextIndex : 0;
            }

            return normalizedPet;
        },
        async uploadMyPetImageById(petId, file, options = {}) {
            const normalizedPetId = this.normalizeProfileUserId(petId);
            const imageFile = file instanceof File ? file : null;
            if (!Number.isInteger(normalizedPetId) || normalizedPetId <= 0 || !imageFile) {
                return null;
            }

            const formData = new FormData();
            formData.append('image', imageFile);

            try {
                const response = await apiFetch(`/api/pets/${normalizedPetId}/image`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store',
                    body: formData
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    this.pushNotification({
                        title: this.myPetsStrings.actionErrorTitle,
                        message: this.buildMyPetsActionErrorMessage(payload),
                        tone: 'warning'
                    });
                    return null;
                }

                const normalizedPet = this.upsertMyPetInCollection(payload?.data || {}, {
                    selectInsertedPet: options?.selectInsertedPet !== false
                });
                if (!normalizedPet) {
                    return null;
                }

                if (options?.notifySuccess === true) {
                    const sourceName = options?.petName || normalizedPet.name || this.myPetsStrings.labels.name;
                    this.pushNotification({
                        title: this.myPetsStrings.uploadSuccessTitle,
                        message: formatTemplate(this.myPetsStrings.uploadSuccessTemplate, { name: sourceName }),
                        tone: 'success'
                    });
                }

                return normalizedPet;
            } catch {
                this.pushNotification({
                    title: this.myPetsStrings.actionErrorTitle,
                    message: this.myPetsStrings.actionErrorMessage,
                    tone: 'warning'
                });
                return null;
            }
        },
        async submitMyPetForm() {
            if (this.myPetsFormSaving) {
                return;
            }

            const submitFromAddModal = this.myPetsAddModalOpen;
            const submitFromDetailEdit = this.myPetsDetailModalOpen && this.myPetsDetailEditing;
            const validation = this.validateMyPetForm();
            if (!validation.valid) {
                this.pushNotification({
                    title: this.myPetsStrings.actionErrorTitle,
                    message: validation.message || this.myPetsStrings.actionErrorMessage,
                    tone: 'warning'
                });
                return;
            }

            const isEditing = Number.isInteger(this.myPetsFormEditingId) && this.myPetsFormEditingId > 0;
            const endpoint = isEditing ? `/api/pets/${this.myPetsFormEditingId}` : '/api/pets';
            const method = isEditing ? 'PUT' : 'POST';

            this.myPetsFormSaving = true;

            try {
                const response = await apiFetch(endpoint, {
                    method,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store',
                    body: JSON.stringify(validation.payload)
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    this.pushNotification({
                        title: this.myPetsStrings.actionErrorTitle,
                        message: this.buildMyPetsActionErrorMessage(payload),
                        tone: 'warning'
                    });
                    return;
                }

                let normalizedPet = this.upsertMyPetInCollection(payload?.data || {}, {
                    selectInsertedPet: true
                });
                if (!normalizedPet) {
                    this.pushNotification({
                        title: this.myPetsStrings.actionErrorTitle,
                        message: this.myPetsStrings.actionErrorMessage,
                        tone: 'warning'
                    });
                    return;
                }

                if (this.myPetsFormImageFile) {
                    const uploadedPet = await this.uploadMyPetImageById(normalizedPet.id, this.myPetsFormImageFile, {
                        notifySuccess: false,
                        petName: normalizedPet.name,
                        selectInsertedPet: true
                    });
                    if (uploadedPet) {
                        normalizedPet = uploadedPet;
                    } else {
                        return;
                    }
                }

                if (submitFromAddModal) {
                    this.closeMyPetsAddModal();
                } else if (submitFromDetailEdit) {
                    this.myPetsDetailPetId = normalizedPet.id;
                    this.myPetsDetailEditing = false;
                    this.resetMyPetForm({ keepSpecies: true });
                } else {
                    this.resetMyPetForm({ keepSpecies: true });
                }

                this.pushNotification({
                    title: this.myPetsStrings.saveSuccessTitle,
                    message: formatTemplate(this.myPetsStrings.saveSuccessTemplate, {
                        name: normalizedPet.name || this.myPetsStrings.labels.name
                    }),
                    tone: 'success'
                });
            } catch {
                this.pushNotification({
                    title: this.myPetsStrings.actionErrorTitle,
                    message: this.myPetsStrings.actionErrorMessage,
                    tone: 'warning'
                });
            } finally {
                this.myPetsFormSaving = false;
            }
        },
        async handleMyPetQuickImageUpload(event, pet = null) {
            const file = event?.target?.files?.[0] ?? null;
            if (event?.target) {
                event.target.value = '';
            }
            if (!(file instanceof File)) {
                return;
            }

            const normalizedPet = this.normalizeMyPet(pet || {});
            if (!Number.isInteger(normalizedPet.id) || normalizedPet.id <= 0) {
                return;
            }

            this.myPetsQuickUploadPetId = normalizedPet.id;
            try {
                await this.uploadMyPetImageById(normalizedPet.id, file, {
                    notifySuccess: true,
                    petName: normalizedPet.name,
                    selectInsertedPet: true
                });
            } finally {
                if (this.myPetsQuickUploadPetId === normalizedPet.id) {
                    this.myPetsQuickUploadPetId = null;
                }
            }
        },
        removeMyPetFromCollection(petId) {
            const normalizedPetId = this.normalizeProfileUserId(petId);
            if (!Number.isInteger(normalizedPetId) || normalizedPetId <= 0) {
                return;
            }

            const previousPets = Array.isArray(this.myPetsPets) ? [...this.myPetsPets] : [];
            const filteredPets = previousPets.filter((pet) => pet.id !== normalizedPetId);
            this.myPetsPets = filteredPets;

            if (
                Number.isInteger(this.myPetsFormEditingId)
                && this.myPetsFormEditingId === normalizedPetId
            ) {
                this.resetMyPetForm({ keepSpecies: true });
            }

            if (
                this.myPetsDetailModalOpen
                && this.normalizeProfileUserId(this.myPetsDetailPetId) === normalizedPetId
            ) {
                this.closeMyPetsDetailModal();
            }

            if (!filteredPets.length) {
                this.myPetsCarouselIndex = 0;
                return;
            }

            if (!Number.isInteger(this.myPetsCarouselIndex) || this.myPetsCarouselIndex < 0) {
                this.myPetsCarouselIndex = 0;
                return;
            }

            if (this.myPetsCarouselIndex >= filteredPets.length) {
                this.myPetsCarouselIndex = filteredPets.length - 1;
            }
        },
        requestMyPetDeletion(pet = null) {
            const normalizedPet = this.normalizeMyPet(pet || {});
            if (!Number.isInteger(normalizedPet.id) || normalizedPet.id <= 0) {
                return;
            }

            this.myPetsDeletePetId = normalizedPet.id;
            this.myPetsDeleteSubmitting = false;
            this.myPetsDeleteModalOpen = true;
            this.myPetsAddModalOpen = false;
            this.myPetsDetailModalOpen = false;
            this.myPetsDetailEditing = false;
            this.myPetsDetailPetId = normalizedPet.id;
            this.syncModalBodyLock();

            nextTick(() => {
                document.querySelector('[data-my-pets-delete-confirm]')?.focus();
            });
        },
        closeMyPetsDeleteModal() {
            if (!this.myPetsDeleteModalOpen && !this.myPetsDeletePetId) {
                return;
            }

            this.myPetsDeleteModalOpen = false;
            this.myPetsDeletePetId = null;
            this.myPetsDeleteSubmitting = false;
            this.syncModalBodyLock();
        },
        async confirmMyPetDeletion() {
            if (this.myPetsDeleteSubmitting) {
                return;
            }

            const targetPet = this.myPetsDeleteTargetPet;
            const normalizedPet = this.normalizeMyPet(targetPet || {});
            if (!Number.isInteger(normalizedPet.id) || normalizedPet.id <= 0) {
                this.closeMyPetsDeleteModal();
                return;
            }

            const petName = normalizedPet.name || this.myPetsStrings.labels.name;
            this.myPetsDeleteSubmitting = true;

            try {
                const response = await apiFetch(`/api/pets/${normalizedPet.id}`, {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    this.pushNotification({
                        title: this.myPetsStrings.actionErrorTitle,
                        message: this.buildMyPetsActionErrorMessage(payload),
                        tone: 'warning'
                    });
                    return;
                }

                this.removeMyPetFromCollection(normalizedPet.id);
                this.closeMyPetsDeleteModal();
                this.pushNotification({
                    title: this.myPetsStrings.deleteSuccessTitle,
                    message: formatTemplate(this.myPetsStrings.deleteSuccessTemplate, {
                        name: petName
                    }),
                    tone: 'success'
                });
            } catch {
                this.pushNotification({
                    title: this.myPetsStrings.actionErrorTitle,
                    message: this.myPetsStrings.actionErrorMessage,
                    tone: 'warning'
                });
            } finally {
                this.myPetsDeleteSubmitting = false;
            }
        },
        async initializeSettingsView() {
            if (!settingsPageRoot) {
                return;
            }

            this.settingsViewLoading = true;
            this.settingsViewError = '';
            this.settingsViewUser = null;

            if (!Array.isArray(this.registerPetChoices) || !this.registerPetChoices.length) {
                try {
                    await this.loadRegisterPetChoices();
                } catch {
                    // Optional preload only.
                }
            }

            await this.ensurePhoneCountryOptionsLoaded();
            await this.loadCurrentUserSettings();
        },
        async loadCurrentUserSettings() {
            if (!settingsPageRoot) {
                return;
            }

            this.settingsViewLoading = true;
            this.settingsViewError = '';

            try {
                const response = await apiFetch('/api/users/me', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    if (response.status === 401 || response.status === 403) {
                        this.settingsViewError = this.settingsStrings.authRequired;
                        window.location.assign(this.buildNotFoundPath());
                        return;
                    }

                    this.settingsViewError = this.settingsStrings.loadFailed;
                    return;
                }

                this.applyUpdatedSettingsUser(payload?.data || {});
            } catch {
                this.settingsViewError = this.settingsStrings.loadFailed;
            } finally {
                this.settingsViewLoading = false;
            }
        },
        getSettingsFieldLabel(fieldKey = '') {
            if (typeof fieldKey !== 'string' || !fieldKey.trim()) {
                return '';
            }

            const normalizedFieldKey = fieldKey.trim();
            return this.settingsStrings.labels[normalizedFieldKey] || normalizedFieldKey;
        },
        formatSettingsEditButtonAriaLabel(fieldLabel = '') {
            const normalizedLabel = typeof fieldLabel === 'string' ? fieldLabel.trim() : '';
            if (!normalizedLabel) {
                return this.settingsStrings.modalSave;
            }

            return this.settingsStrings.editAriaTemplate.replace('{field}', normalizedLabel);
        },
        readSettingsFieldValue(fieldKey = '') {
            if (!this.settingsViewUser || typeof fieldKey !== 'string') {
                return '';
            }

            if (fieldKey === 'acceptedPetSpecies') {
                return Array.isArray(this.settingsViewUser.acceptedPetSpecies)
                    ? [...this.settingsViewUser.acceptedPetSpecies]
                    : [];
            }

            if (fieldKey === 'role') {
                return this.settingsViewUser.role || 'PET_OWNER';
            }

            if (fieldKey === 'password') {
                return '';
            }

            if (fieldKey === 'birthDate') {
                return normalizeDateInputValue(this.settingsViewUser.birthDate);
            }

            if (fieldKey === 'postalCode') {
                return typeof this.settingsViewUser.postalCode === 'string'
                    ? this.settingsViewUser.postalCode
                    : '';
            }

            if (fieldKey === 'city') {
                return typeof this.settingsViewUser.city === 'string'
                    ? this.settingsViewUser.city
                    : '';
            }

            const directValue = this.settingsViewUser[fieldKey];
            return typeof directValue === 'string' ? directValue : '';
        },
        async openSettingsEditModal(fieldKey = '') {
            if (!settingsPageRoot || !this.settingsViewUser || typeof fieldKey !== 'string' || !fieldKey.trim()) {
                return;
            }

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.closeMyPetsAddModal();
            this.closeMyPetsDetailModal();
            this.closeMyPetsDeleteModal();
            this.settingsEditField = fieldKey.trim();
            this.settingsEditValue = '';
            this.settingsPhoneCountryCode = '';
            this.settingsCityQuery = '';
            this.settingsCitySelectionKey = '';
            this.settingsCitySelectedOption = null;
            this.settingsCityOptions = [];
            this.settingsCityOptionsLoading = false;
            this.settingsEditCurrentPassword = '';
            this.settingsEditNewPassword = '';
            this.settingsEditPasswordConfirmation = '';
            this.settingsEditSpecies = [];
            this.settingsEditProfileFile = null;
            this.settingsEditProfileFileName = '';
            this.settingsEditSaving = false;
            this.clearSettingsCitySearchRuntime();

            if (this.settingsEditField === 'phone') {
                await this.ensurePhoneCountryOptionsLoaded();
                const parsedPhone = this.parsePhoneWithCountryCode(this.readSettingsFieldValue('phone'));
                this.settingsPhoneCountryCode = parsedPhone.countryCode || this.getPreferredPhoneCountryCode();
                this.settingsEditValue = parsedPhone.localNumber;
            } else if (this.settingsEditField === 'city') {
                const cityValue = this.readSettingsFieldValue('city');
                const normalizedLocationOption = normalizeCitySearchOption(this.settingsCityLocationOption || {});
                this.settingsEditValue = cityValue;
                this.settingsCityQuery = cityValue;

                if (normalizedLocationOption) {
                    const optionCityName = typeof normalizedLocationOption.cityName === 'string'
                        ? normalizedLocationOption.cityName.trim().toLowerCase()
                        : '';
                    if (cityValue && optionCityName === cityValue.trim().toLowerCase()) {
                        this.settingsCitySelectionKey = normalizedLocationOption.id || cityValue;
                        this.settingsCitySelectedOption = normalizedLocationOption;
                    }
                }

                this.scheduleSettingsCitySearch(cityValue);
            } else if (this.settingsEditField === 'acceptedPetSpecies') {
                const species = this.readSettingsFieldValue('acceptedPetSpecies');
                this.settingsEditSpecies = Array.isArray(species) ? species : [];
            } else if (this.settingsEditField === 'profilePicture') {
                this.settingsEditValue = '';
            } else {
                this.settingsEditValue = this.readSettingsFieldValue(this.settingsEditField);
            }

            if (this.settingsEditField === 'birthDate') {
                this.syncSettingsBirthDateCalendarView(this.settingsEditValue);
            }

            this.settingsEditModalOpen = true;
            this.syncModalBodyLock();
            this.focusSettingsEditInput();
            nextTick(() => {
                this.initializeDropdowns();
            });
        },
        closeSettingsEditModal() {
            if (!this.settingsEditModalOpen) {
                return;
            }

            this.settingsEditModalOpen = false;
            this.settingsEditField = '';
            this.settingsEditValue = '';
            this.settingsPhoneCountryCode = '';
            this.settingsCityQuery = '';
            this.settingsCitySelectionKey = '';
            this.settingsCitySelectedOption = null;
            this.settingsCityOptions = [];
            this.settingsCityOptionsLoading = false;
            this.settingsEditCurrentPassword = '';
            this.settingsEditNewPassword = '';
            this.settingsEditPasswordConfirmation = '';
            this.settingsEditSpecies = [];
            this.settingsEditProfileFile = null;
            this.settingsEditProfileFileName = '';
            this.settingsEditSaving = false;
            this.clearSettingsCitySearchRuntime();
            this.syncSettingsBirthDateCalendarView();
            this.syncModalBodyLock();
        },
        focusSettingsEditInput() {
            nextTick(() => {
                if (this.settingsEditField === 'birthDate') {
                    const birthDateTarget = document.querySelector(
                        '.settings_edit_modal__date .header_search_date__day--single, .settings_edit_modal__date .header_search_date__day--today, .settings_edit_modal__date .header_search_date__day'
                    );
                    birthDateTarget?.focus();
                    return;
                }

                if (this.settingsEditField === 'phone') {
                    document.querySelector('[data-settings-edit-phone-number]')?.focus();
                    return;
                }

                if (this.settingsEditField === 'city') {
                    document.querySelector('[data-settings-edit-city-input]')?.focus();
                    return;
                }

                if (this.settingsEditField === 'profilePicture') {
                    document.querySelector('[data-settings-edit-profile-upload]')?.focus();
                    return;
                }

                document.querySelector('[data-settings-edit-input]')?.focus();
            });
        },
        handleSettingsProfileImageSelection(event) {
            const file = event?.target?.files?.[0] ?? null;
            this.settingsEditProfileFile = file instanceof File ? file : null;
            this.settingsEditProfileFileName = this.settingsEditProfileFile?.name || '';
        },
        isSettingsEditSpeciesSelected(value) {
            return this.settingsEditSpecies.includes(value);
        },
        toggleSettingsEditSpecies(value) {
            if (!value) {
                return;
            }

            if (this.isSettingsEditSpeciesSelected(value)) {
                this.settingsEditSpecies = this.settingsEditSpecies.filter((selectedValue) => selectedValue !== value);
                return;
            }

            this.settingsEditSpecies = [...this.settingsEditSpecies, value];
        },
        validateSettingsEditField(fieldKey = '') {
            if (!fieldKey) {
                return {
                    valid: false,
                    message: this.settingsStrings.validationRequired,
                    payloadValue: ''
                };
            }

            if (fieldKey === 'acceptedPetSpecies') {
                const normalizedSpecies = this.settingsEditSpecies
                    .map((species) => (typeof species === 'string' ? species.trim().toUpperCase() : ''))
                    .filter(Boolean);

                if (!normalizedSpecies.length) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationSpecies,
                        payloadValue: []
                    };
                }

                return {
                    valid: true,
                    message: '',
                    payloadValue: [...new Set(normalizedSpecies)]
                };
            }

            if (fieldKey === 'role') {
                const normalizedRole = typeof this.settingsEditValue === 'string'
                    ? this.settingsEditValue.trim().toUpperCase()
                    : '';
                if (!['PET_OWNER', 'HOST'].includes(normalizedRole)) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationRequired,
                        payloadValue: ''
                    };
                }

                return {
                    valid: true,
                    message: '',
                    payloadValue: normalizedRole
                };
            }

            if (fieldKey === 'birthDate') {
                const normalizedDate = normalizeDateInputValue(this.settingsEditValue);
                const parsedDate = parseDateInputValue(normalizedDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (!parsedDate || parsedDate >= today) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationBirthDate,
                        payloadValue: ''
                    };
                }

                return {
                    valid: true,
                    message: '',
                    payloadValue: normalizedDate
                };
            }

            if (fieldKey === 'postalCode') {
                const normalizedPostalCode = normalizePostalCode(this.settingsEditValue);
                if (!/^\d{5}$/.test(normalizedPostalCode)) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationPostalCode,
                        payloadValue: ''
                    };
                }

                return {
                    valid: true,
                    message: '',
                    payloadValue: normalizedPostalCode
                };
            }

            if (fieldKey === 'city') {
                const normalizedCity = typeof this.settingsCityQuery === 'string'
                    ? this.settingsCityQuery.trim()
                    : '';
                if (!normalizedCity) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationCity,
                        payloadValue: ''
                    };
                }

                const selectedCity = typeof this.settingsCitySelectedOption?.cityName === 'string'
                    ? this.settingsCitySelectedOption.cityName.trim()
                    : '';
                if (selectedCity && selectedCity.toLowerCase() === normalizedCity.toLowerCase()) {
                    this.settingsEditValue = selectedCity;
                } else {
                    this.settingsEditValue = normalizedCity;
                }

                return {
                    valid: true,
                    message: '',
                    payloadValue: this.settingsEditValue
                };
            }

            if (fieldKey === 'email') {
                const normalizedEmail = this.normalizeLoginIdentifier(this.settingsEditValue).toLowerCase();
                if (!this.isEmailIdentifier(normalizedEmail)) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationEmail,
                        payloadValue: ''
                    };
                }

                return {
                    valid: true,
                    message: '',
                    payloadValue: normalizedEmail
                };
            }

            if (fieldKey === 'phone') {
                const normalizedCountryCode = normalizeCountryCode(this.settingsPhoneCountryCode);
                const normalizedLocalNumber = normalizePhoneNumberDigits(this.settingsEditValue);

                if (!this.findPhoneCountryOptionByCode(normalizedCountryCode)) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationPhoneCountry,
                        payloadValue: ''
                    };
                }

                if (!normalizedLocalNumber) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationRequired,
                        payloadValue: ''
                    };
                }

                this.settingsPhoneCountryCode = normalizedCountryCode;
                this.settingsEditValue = normalizedLocalNumber;
                return {
                    valid: true,
                    message: '',
                    payloadValue: this.formatPhoneWithCountryCode(normalizedCountryCode, normalizedLocalNumber)
                };
            }

            if (fieldKey === 'password') {
                const currentPassword = typeof this.settingsEditCurrentPassword === 'string'
                    ? this.settingsEditCurrentPassword
                    : '';
                const newPassword = typeof this.settingsEditNewPassword === 'string'
                    ? this.settingsEditNewPassword
                    : '';
                const passwordConfirmation = typeof this.settingsEditPasswordConfirmation === 'string'
                    ? this.settingsEditPasswordConfirmation
                    : '';

                if (!currentPassword.trim()) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationCurrentPasswordRequired,
                        payloadValue: ''
                    };
                }

                if (!newPassword.trim()) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationNewPasswordRequired,
                        payloadValue: ''
                    };
                }

                if (!passwordConfirmation.trim()) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationPasswordConfirmationRequired,
                        payloadValue: ''
                    };
                }

                if (newPassword !== passwordConfirmation) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationPasswordsMismatch,
                        payloadValue: ''
                    };
                }

                if (!this.allSettingsPasswordCriteriaMet) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationPasswordCriteriaRequired,
                        payloadValue: ''
                    };
                }

                return {
                    valid: true,
                    message: '',
                    payloadValue: newPassword
                };
            }

            if (fieldKey === 'profilePicture') {
                if (!(this.settingsEditProfileFile instanceof File)) {
                    return {
                        valid: false,
                        message: this.settingsStrings.validationProfileImage,
                        payloadValue: ''
                    };
                }

                return {
                    valid: true,
                    message: '',
                    payloadValue: ''
                };
            }

            const normalizedValue = typeof this.settingsEditValue === 'string'
                ? this.settingsEditValue.trim()
                : '';

            if (!normalizedValue) {
                return {
                    valid: false,
                    message: this.settingsStrings.validationRequired,
                    payloadValue: ''
                };
            }

            return {
                valid: true,
                message: '',
                payloadValue: normalizedValue
            };
        },
        buildSettingsPatchPayload(fieldKey = '', payloadValue = '') {
            if (!fieldKey) {
                return {};
            }

            if (fieldKey === 'acceptedPetSpecies') {
                return { acceptedPetSpecies: payloadValue };
            }

            if (fieldKey === 'role') {
                return { role: payloadValue };
            }

            if (fieldKey === 'birthDate') {
                return { birthDate: payloadValue };
            }

            if (fieldKey === 'postalCode') {
                return { postalCode: payloadValue };
            }

            if (fieldKey === 'city') {
                const normalizedPostalCode = normalizePostalCode(this.settingsCitySelectedOption?.postalCode || '');
                const payload = { city: payloadValue };
                if (/^\d{5}$/.test(normalizedPostalCode)) {
                    payload.postalCode = normalizedPostalCode;
                }
                return payload;
            }

            if (fieldKey === 'email') {
                return { email: payloadValue };
            }

            if (fieldKey === 'password') {
                return { password: payloadValue };
            }

            return { [fieldKey]: payloadValue };
        },
        async checkSettingsEmailExists(email = '') {
            const normalizedEmail = this.normalizeLoginIdentifier(email).toLowerCase();
            if (!this.isEmailIdentifier(normalizedEmail)) {
                return null;
            }

            try {
                const response = await apiFetch(`/api/users/mailExists?mail=${encodeURIComponent(normalizedEmail)}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok || payload?.success === false) {
                    return null;
                }

                return payload?.data?.exists === true;
            } catch {
                return null;
            }
        },
        async verifySettingsCurrentPassword() {
            const normalizedEmail = this.normalizeLoginIdentifier(
                this.settingsViewUser?.email || this.authSessionEmail
            ).toLowerCase();
            const currentPassword = typeof this.settingsEditCurrentPassword === 'string'
                ? this.settingsEditCurrentPassword
                : '';

            if (!this.isEmailIdentifier(normalizedEmail) || !currentPassword.trim()) {
                return null;
            }

            try {
                const response = await apiFetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store',
                    body: JSON.stringify({
                        email: normalizedEmail,
                        password: currentPassword
                    })
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok || payload?.success === false) {
                    return false;
                }

                return true;
            } catch {
                return null;
            }
        },
        resolveSettingsApiErrorMessage(payload = {}) {
            const backendMessage = typeof payload?.message === 'string'
                ? payload.message.trim()
                : '';
            const detailMessage = Array.isArray(payload?.error?.details)
                ? payload.error.details
                    .map((detail) => (typeof detail?.message === 'string' ? detail.message.trim() : ''))
                    .find(Boolean)
                : '';
            return detailMessage || backendMessage || this.settingsStrings.saveErrorMessage;
        },
        applyUpdatedSettingsUser(userData = {}, options = {}) {
            const { preferredCityOption = null } = options;
            const normalizedUser = this.normalizeProfileUser(userData || {});
            this.settingsViewUser = normalizedUser;
            this.syncSettingsCityLocationOption({ preferredOption: preferredCityOption });
            this.authSessionEmail = normalizedUser.email || this.authSessionEmail;
            this.authSessionUserId = this.normalizeProfileUserId(normalizedUser.id) ?? this.authSessionUserId;
            this.authSessionFirstName = normalizedUser.firstName || this.authSessionFirstName;
            this.authSessionLastName = normalizedUser.lastName || this.authSessionLastName;
        },
        async forceLogoutAfterSettingsUpdate() {
            try {
                await apiFetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
            } catch {
                // Ignore logout request errors and continue client-side cleanup.
            }

            this.closeSettingsEditModal();
            this.clearAuthSessionIdentity();
            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            window.location.assign('/');
        },
        async submitSettingsProfileImageReset() {
            if (this.settingsEditSaving || !this.settingsViewUser) {
                return;
            }

            const normalizedUserId = this.normalizeProfileUserId(this.settingsViewUser.id);
            if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
                return;
            }

            const fieldLabel = this.getSettingsFieldLabel('profilePicture');
            this.settingsEditSaving = true;

            try {
                const response = await apiFetch(`/api/users/${normalizedUserId}/profile-image`, {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    this.pushNotification({
                        title: this.settingsStrings.saveErrorTitle,
                        message: this.resolveSettingsApiErrorMessage(payload),
                        tone: 'warning'
                    });
                    return;
                }

                this.applyUpdatedSettingsUser(payload?.data || {});
                this.closeSettingsEditModal();
                this.pushNotification({
                    title: this.settingsStrings.saveSuccessTitle,
                    message: this.settingsStrings.saveSuccessTemplate.replace('{field}', fieldLabel),
                    tone: 'success'
                });
            } catch {
                this.pushNotification({
                    title: this.settingsStrings.saveErrorTitle,
                    message: this.settingsStrings.saveErrorMessage,
                    tone: 'warning'
                });
            } finally {
                this.settingsEditSaving = false;
            }
        },
        async submitSettingsEditForm() {
            if (this.settingsEditSaving || !this.settingsViewUser) {
                return;
            }

            const normalizedUserId = this.normalizeProfileUserId(this.settingsViewUser.id);
            if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
                return;
            }

            const fieldKey = typeof this.settingsEditField === 'string'
                ? this.settingsEditField.trim()
                : '';
            if (!fieldKey) {
                return;
            }

            const fieldLabel = this.getSettingsFieldLabel(fieldKey);
            const previousEmail = this.settingsViewUser.email || '';
            const previousEmailNormalized = this.normalizeLoginIdentifier(previousEmail).toLowerCase();
            this.settingsEditSaving = true;

            try {
                if (fieldKey === 'profilePicture') {
                    const validation = this.validateSettingsEditField(fieldKey);
                    if (!validation.valid) {
                        this.pushNotification({
                            title: this.settingsStrings.saveErrorTitle,
                            message: validation.message || this.settingsStrings.saveErrorMessage,
                            tone: 'warning'
                        });
                        return;
                    }

                    const formData = new FormData();
                    formData.append('image', this.settingsEditProfileFile);

                    const response = await apiFetch(`/api/users/${normalizedUserId}/profile-image`, {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json'
                        },
                        cache: 'no-store',
                        body: formData
                    });
                    const payload = await response.json().catch(() => ({}));

                    if (!response.ok || payload?.success === false) {
                        this.pushNotification({
                            title: this.settingsStrings.saveErrorTitle,
                            message: this.resolveSettingsApiErrorMessage(payload),
                            tone: 'warning'
                        });
                        return;
                    }

                    this.applyUpdatedSettingsUser(payload?.data || {});
                    this.closeSettingsEditModal();
                    this.pushNotification({
                        title: this.settingsStrings.saveSuccessTitle,
                        message: this.settingsStrings.saveSuccessTemplate.replace('{field}', fieldLabel),
                        tone: 'success'
                    });
                    return;
                }

                const validation = this.validateSettingsEditField(fieldKey);
                if (!validation.valid) {
                    this.pushNotification({
                        title: this.settingsStrings.saveErrorTitle,
                        message: validation.message || this.settingsStrings.saveErrorMessage,
                        tone: 'warning'
                    });
                    return;
                }

                if (fieldKey === 'email' && validation.payloadValue !== previousEmailNormalized) {
                    const emailExists = await this.checkSettingsEmailExists(validation.payloadValue);
                    if (emailExists === true) {
                        this.pushNotification({
                            title: this.settingsStrings.saveErrorTitle,
                            message: this.settingsStrings.validationEmailExists,
                            tone: 'warning'
                        });
                        return;
                    }
                }

                if (fieldKey === 'password') {
                    const currentPasswordValid = await this.verifySettingsCurrentPassword();
                    if (currentPasswordValid !== true) {
                        this.pushNotification({
                            title: this.settingsStrings.saveErrorTitle,
                            message: currentPasswordValid === false
                                ? this.settingsStrings.validationCurrentPasswordInvalid
                                : this.settingsStrings.saveErrorMessage,
                            tone: 'warning'
                        });
                        return;
                    }
                }

                const patchPayload = this.buildSettingsPatchPayload(fieldKey, validation.payloadValue);
                const response = await apiFetch(`/api/users/${normalizedUserId}`, {
                    method: 'PATCH',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store',
                    body: JSON.stringify(patchPayload)
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    this.pushNotification({
                        title: this.settingsStrings.saveErrorTitle,
                        message: this.resolveSettingsApiErrorMessage(payload),
                        tone: 'warning'
                    });
                    return;
                }

                this.applyUpdatedSettingsUser(payload?.data || {}, {
                    preferredCityOption: fieldKey === 'city' ? this.settingsCitySelectedOption : null
                });
                this.closeSettingsEditModal();

                if (fieldKey === 'email' && validation.payloadValue !== previousEmailNormalized) {
                    this.rememberRedirectNotification({
                        title: this.settingsStrings.emailChangedTitle,
                        message: this.settingsStrings.emailChangedMessage,
                        tone: 'warning'
                    });
                    await this.forceLogoutAfterSettingsUpdate();
                    return;
                }

                if (fieldKey === 'password') {
                    this.rememberRedirectNotification({
                        title: this.settingsStrings.passwordChangedTitle,
                        message: this.settingsStrings.passwordChangedMessage,
                        tone: 'warning'
                    });
                    await this.forceLogoutAfterSettingsUpdate();
                    return;
                }

                this.pushNotification({
                    title: this.settingsStrings.saveSuccessTitle,
                    message: this.settingsStrings.saveSuccessTemplate.replace('{field}', fieldLabel),
                    tone: 'success'
                });
            } catch {
                this.pushNotification({
                    title: this.settingsStrings.saveErrorTitle,
                    message: this.settingsStrings.saveErrorMessage,
                    tone: 'warning'
                });
            } finally {
                this.settingsEditSaving = false;
            }
        },
        buildProfileDocumentTitle(user = null) {
            const sourceTitle = typeof this.profileViewBaseDocumentTitle === 'string'
                ? this.profileViewBaseDocumentTitle.trim()
                : '';
            const baseTitle = sourceTitle || (typeof document !== 'undefined'
                ? String(document.title || '').trim()
                : '');
            const brandLabel = (baseTitle.split('|')[0] || '').trim() || 'Pawsitters';
            const firstName = typeof user?.firstName === 'string' ? user.firstName.trim() : '';
            const lastName = typeof user?.lastName === 'string' ? user.lastName.trim() : '';
            const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
            const normalizeGeneratedTitle = (value) => String(value || '')
                .replace(/\s+/g, ' ')
                .replace(/\s+\|\s*$/g, '')
                .trim();
            const templateTitle = formatTemplate(localizedAppStrings.profileDocumentTitleTemplate, {
                brand: brandLabel,
                name: fullName
            });

            if (fullName && templateTitle) {
                const normalizedTemplateTitle = normalizeGeneratedTitle(templateTitle);
                if (normalizedTemplateTitle) {
                    return normalizedTemplateTitle;
                }
            }

            if (fullName) {
                return `${brandLabel} | ${fullName}`;
            }

            const fallbackTitle = formatTemplate(localizedAppStrings.profileDocumentTitleTemplate, {
                brand: brandLabel
            });
            const normalizedFallbackTitle = normalizeGeneratedTitle(fallbackTitle);
            return sourceTitle || normalizedFallbackTitle || `${brandLabel} | Profile`;
        },
        applyProfileDocumentTitle(user = null) {
            if (!profilePageRoot || typeof document === 'undefined') {
                return;
            }

            const nextTitle = this.buildProfileDocumentTitle(user);
            if (!nextTitle) {
                return;
            }

            document.title = nextTitle;
        },
        normalizeProfileUserId(value) {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue)) {
                return null;
            }

            const normalizedId = Math.trunc(numericValue);
            if (normalizedId <= 0 || String(normalizedId) !== String(value).trim()) {
                return null;
            }

            return normalizedId;
        },
        extractProfileRouteUserId(pathname) {
            if (typeof pathname !== 'string') {
                return null;
            }

            const normalizedPath = pathname.trim().replace(/\/+$/, '') || '/';
            const profileMatch = normalizedPath.match(/^\/profile\/([^/]+)$/i)
                || normalizedPath.match(/^\/(?:de|en|ro)\/profile\/([^/]+)$/i);
            const rawUserId = profileMatch?.[1] || '';

            try {
                return this.normalizeProfileUserId(decodeURIComponent(rawUserId).trim());
            } catch {
                return this.normalizeProfileUserId(rawUserId.trim());
            }
        },
        normalizeProfileUser(value = {}) {
            const acceptedPetSpeciesRaw = value?.acceptedPetSpecies;
            const petsRaw = Array.isArray(value?.pets) ? value.pets : [];
            const acceptedPetSpeciesArray = Array.isArray(acceptedPetSpeciesRaw)
                ? acceptedPetSpeciesRaw
                : (acceptedPetSpeciesRaw && typeof acceptedPetSpeciesRaw === 'object'
                    ? Object.values(acceptedPetSpeciesRaw)
                    : []);
            const acceptedPetSpecies = acceptedPetSpeciesArray
                .map((species) => typeof species === 'string' ? species.trim().toUpperCase() : '')
                .filter(Boolean);
            const pets = petsRaw
                .map((pet) => this.normalizeMyPet(pet))
                .filter((pet) => Number.isInteger(pet.id) && pet.id > 0);

            return {
                id: this.normalizeProfileUserId(value?.id),
                email: typeof value?.email === 'string' ? value.email.trim().toLowerCase() : '',
                firstName: typeof value?.firstName === 'string' ? value.firstName.trim() : '',
                lastName: typeof value?.lastName === 'string' ? value.lastName.trim() : '',
                phone: typeof value?.phone === 'string' ? value.phone.trim() : '',
                birthDate: normalizeDateInputValue(value?.birthDate),
                emergencyContact: typeof value?.emergencyContact === 'string' ? value.emergencyContact.trim() : '',
                profilePicture: normalizeProfilePicturePath(value?.profilePicture),
                bio: typeof value?.bio === 'string' ? value.bio.trim() : '',
                role: typeof value?.role === 'string' ? value.role.trim().toUpperCase() : '',
                postalCode: typeof value?.postalCode === 'string' ? value.postalCode.trim() : '',
                city: typeof value?.city === 'string' ? value.city.trim() : '',
                rating: Number(value?.rating),
                numberOfRatings: Number(value?.numberOfRatings),
                acceptedPetSpecies,
                pets
            };
        },
        handleProfileAvatarError() {
            if (!this.profileViewUser || typeof this.profileViewUser !== 'object') {
                return;
            }

            this.profileViewUser.profilePicture = '';
        },
        handleSettingsAvatarError() {
            if (!this.settingsViewUser || typeof this.settingsViewUser !== 'object') {
                return;
            }

            this.settingsViewUser.profilePicture = '';
        },
        formatProfileDate(value) {
            const normalizedDate = normalizeDateInputValue(value);
            const date = parseDateInputValue(normalizedDate);
            if (!date) {
                return '—';
            }

            return new Intl.DateTimeFormat(document.documentElement.lang || 'de', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }).format(date);
        },
        async loadProfileById(userId) {
            const normalizedUserId = this.normalizeProfileUserId(userId);
            if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
                this.profileViewError = this.profileStrings.routeMissing;
                this.profileViewLoading = false;
                this.profileViewUser = null;
                this.myOffersOffers = [];
                this.myOffersCarouselIndex = 0;
                return;
            }

            this.profileViewLoading = true;
            this.profileViewError = '';
            this.profileViewUser = null;
            this.profileViewTab = 'information';
            this.myPetsPets = [];
            this.myPetsCarouselIndex = 0;
            this.myOffersOffers = [];
            this.myOffersCarouselIndex = 0;
            this.applyProfileDocumentTitle();
            nextTick(() => {
                this.updateSegmentedIndicators();
            });

            try {
                const response = await apiFetch(`/api/users/${normalizedUserId}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    if (response.status === 401 || response.status === 403) {
                        this.profileViewError = this.profileStrings.authRequired;
                    } else if (response.status === 404) {
                        this.profileViewError = this.profileStrings.notFound;
                    } else {
                        this.profileViewError = this.profileStrings.loadFailed;
                    }
                    return;
                }

                this.profileViewUser = this.normalizeProfileUser(payload?.data || {});
                this.myPetsPets = Array.isArray(this.profileViewUser?.pets) ? [...this.profileViewUser.pets] : [];
                this.myPetsCarouselIndex = 0;
                await this.loadProfileOffersByUserId(normalizedUserId);
                this.applyProfileDocumentTitle(this.profileViewUser);
                nextTick(() => {
                    this.updateSegmentedIndicators();
                });
            } catch {
                this.profileViewError = this.profileStrings.loadFailed;
            } finally {
                this.profileViewLoading = false;
            }
        },
        async loadProfileOffersByUserId(userId) {
            const normalizedUserId = this.normalizeProfileUserId(userId);
            if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
                this.myOffersOffers = [];
                this.myOffersCarouselIndex = 0;
                return;
            }

            try {
                const response = await apiFetch(`/api/offers/host/${normalizedUserId}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    this.myOffersOffers = [];
                    this.myOffersCarouselIndex = 0;
                    return;
                }

                const normalizedOffers = Array.isArray(payload?.data)
                    ? payload.data
                        .map((offer) => this.normalizeMyOffer(offer))
                        .filter((offer) => (
                            Number.isInteger(offer.id)
                            && offer.id > 0
                            && offer.status === 'PUBLISHED'
                        ))
                    : [];
                this.myOffersOffers = normalizedOffers;
                this.myOffersCarouselIndex = 0;
            } catch {
                this.myOffersOffers = [];
                this.myOffersCarouselIndex = 0;
            }
        },
        rememberRegisterEmail(email) {
            const normalizedEmail = this.normalizeLoginIdentifier(email).toLowerCase();
            if (!this.isEmailIdentifier(normalizedEmail)) {
                return;
            }

            try {
                sessionStorage.setItem(REDIRECT_REGISTER_EMAIL_STORAGE_KEY, normalizedEmail);
            } catch {
                // Ignore storage errors.
            }
        },
        consumeRegisterPrefillEmail() {
            let prefillEmail = '';
            const currentUrl = new URL(window.location.href);
            const emailFromQuery = this.normalizeLoginIdentifier(currentUrl.searchParams.get('email') || '').toLowerCase();

            if (this.isEmailIdentifier(emailFromQuery)) {
                prefillEmail = emailFromQuery;
                currentUrl.searchParams.delete('email');
                const nextPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
                window.history.replaceState({}, '', nextPath);
            }

            if (!prefillEmail) {
                try {
                    const fromStorage = this.normalizeLoginIdentifier(
                        sessionStorage.getItem(REDIRECT_REGISTER_EMAIL_STORAGE_KEY) || ''
                    ).toLowerCase();
                    if (this.isEmailIdentifier(fromStorage)) {
                        prefillEmail = fromStorage;
                    }
                    sessionStorage.removeItem(REDIRECT_REGISTER_EMAIL_STORAGE_KEY);
                } catch {
                    // Ignore storage errors.
                }
            }

            if (prefillEmail && !this.registerEmail) {
                this.registerEmail = prefillEmail;
            }
        },
        getRegisterStepIndex(step = this.registerStep) {
            const index = REGISTER_STEPS.indexOf(step);
            return index >= 0 ? index : 0;
        },
        setRegisterStep(step) {
            if (!REGISTER_STEPS.includes(step) || this.registerStep === step) {
                return;
            }

            this.registerStep = step;
            nextTick(() => {
                this.updateSegmentedIndicators();
            });
        },
        goToNextRegisterStep() {
            const currentStep = this.registerStep;
            const currentIndex = this.getRegisterStepIndex(currentStep);
            if (!this.validateRegisterStep(currentStep)) {
                return;
            }

            const nextStep = REGISTER_STEPS[currentIndex + 1];
            if (!nextStep) {
                return;
            }

            this.setRegisterStep(nextStep);
        },
        goToPreviousRegisterStep() {
            const previousStep = REGISTER_STEPS[this.getRegisterStepIndex() - 1];
            if (!previousStep) {
                return;
            }

            this.setRegisterStep(previousStep);
        },
        validateRegisterStep(step) {
            if (step === 'profile') {
                return this.validateRegisterProfileStep();
            }

            if (step === 'pets') {
                return this.validateRegisterPetsStep();
            }

            return this.validateRegisterAccountStep();
        },
        validateRegisterAccountStep() {
            const firstName = typeof this.registerFirstName === 'string' ? this.registerFirstName.trim() : '';
            const lastName = typeof this.registerLastName === 'string' ? this.registerLastName.trim() : '';
            const email = this.normalizeLoginIdentifier(this.registerEmail).toLowerCase();
            const password = typeof this.registerPassword === 'string' ? this.registerPassword : '';
            const passwordConfirmation = typeof this.registerPasswordConfirmation === 'string'
                ? this.registerPasswordConfirmation
                : '';

            this.registerFirstName = firstName;
            this.registerLastName = lastName;
            this.registerEmail = email;
            this.registerPasswordConfirmation = passwordConfirmation;

            if (!firstName) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.firstNameRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!lastName) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.lastNameRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!this.isEmailIdentifier(email)) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.emailRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!password.trim()) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.passwordRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!passwordConfirmation.trim()) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.passwordConfirmationRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (password !== passwordConfirmation) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.passwordsMismatch,
                    tone: 'warning'
                });
                return false;
            }

            if (!this.allRegisterPasswordCriteriaMet) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.passwordCriteriaRequired,
                    tone: 'warning'
                });
                return false;
            }

            return true;
        },
        validateRegisterProfileStep() {
            let phoneCountryCode = normalizeCountryCode(this.registerPhoneCountryCode);
            const rawPhoneInput = typeof this.registerPhone === 'string'
                ? this.registerPhone.trim()
                : '';
            let phone = normalizePhoneNumberDigits(rawPhoneInput);
            const birthDate = normalizeDateInputValue(this.registerBirthDate);
            const emergencyContact = typeof this.registerEmergencyContact === 'string'
                ? this.registerEmergencyContact.trim()
                : '';
            const profilePicture = typeof this.registerProfilePicture === 'string'
                ? this.registerProfilePicture.trim()
                : '';
            const bio = typeof this.registerBio === 'string' ? this.registerBio.trim() : '';
            const role = typeof this.registerRole === 'string' ? this.registerRole.trim().toUpperCase() : '';
            const city = typeof this.registerCity === 'string' ? this.registerCity.trim() : '';
            const postalCode = normalizePostalCode(this.registerPostalCode);
            const birthDateObject = parseDateInputValue(birthDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (rawPhoneInput.startsWith('+') || rawPhoneInput.startsWith('00')) {
                const parsedPhone = this.parsePhoneWithCountryCode(rawPhoneInput);
                if (parsedPhone && this.findPhoneCountryOptionByCode(parsedPhone.countryCode)) {
                    phoneCountryCode = parsedPhone.countryCode;
                    phone = normalizePhoneNumberDigits(parsedPhone.localNumber);
                }
            }

            if (!this.findPhoneCountryOptionByCode(phoneCountryCode)) {
                phoneCountryCode = this.getPreferredPhoneCountryCode();
            }

            this.registerPhoneCountryCode = phoneCountryCode;
            this.registerPhone = phone;
            this.registerBirthDate = birthDate;
            this.syncRegisterBirthDateCalendarView(this.registerBirthDate);
            this.registerEmergencyContact = emergencyContact;
            this.registerProfilePicture = profilePicture;
            this.registerBio = bio;
            this.registerRole = role || 'PET_OWNER';
            this.registerCity = city;
            this.registerPostalCode = postalCode;

            if (!this.findPhoneCountryOptionByCode(phoneCountryCode)) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.phoneCountryRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!phone) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.phoneRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!birthDate) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.birthDateRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!birthDateObject || birthDateObject >= today) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.birthDatePast,
                    tone: 'warning'
                });
                return false;
            }

            if (!emergencyContact) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.emergencyContactRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!profilePicture) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.profilePictureRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!bio) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.bioRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!['PET_OWNER', 'HOST'].includes(this.registerRole)) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.roleRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (!city || !this.registerCitySelectionKey) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.cityRequired,
                    tone: 'warning'
                });
                return false;
            }

            if (postalCode && !/^\d{5}$/.test(postalCode)) {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.postalCodeInvalid,
                    tone: 'warning'
                });
                return false;
            }

            return true;
        },
        validateRegisterPetsStep() {
            if (this.registerAcceptedPetSpecies.length > 0) {
                return true;
            }

            this.pushNotification({
                title: localizedRegisterStrings.registerErrorTitle,
                message: localizedRegisterStrings.petSpeciesRequired,
                tone: 'warning'
            });
            return false;
        },
        sanitizeRegisterPostalCode() {
            this.registerPostalCode = normalizePostalCode(this.registerPostalCode);
        },
        clearRegisterCitySelection({ clearQuery = false } = {}) {
            this.registerCity = '';
            this.registerCitySelectionKey = '';
            this.registerCountryName = '';
            this.registerCountryCode = '';
            this.registerCountryFlagPath = '';
            this.registerPostalCode = '';

            if (clearQuery) {
                this.registerCityQuery = '';
            }
        },
        handleRegisterCityInput() {
            const query = typeof this.registerCityQuery === 'string' ? this.registerCityQuery.trim() : '';
            if (!query) {
                this.clearRegisterCitySelection({ clearQuery: true });
                this.registerCityOptions = [];
                this.registerCityOptionsLoading = false;
                this.clearRegisterCitySearchRuntime();
                return;
            }

            if (!this.registerCitySelectionKey || query !== this.registerCity) {
                this.clearRegisterCitySelection();
            }

            this.scheduleRegisterCitySearch(query);
        },
        clearRegisterCitySearchRuntime() {
            if (typeof this.registerCitySearchDebounceHandle === 'number') {
                window.clearTimeout(this.registerCitySearchDebounceHandle);
            }
            this.registerCitySearchDebounceHandle = null;

            if (this.registerCitySearchAbortController) {
                this.registerCitySearchAbortController.abort();
                this.registerCitySearchAbortController = null;
            }
        },
        scheduleRegisterCitySearch(query) {
            const trimmedQuery = typeof query === 'string' ? query.trim() : '';
            if (typeof this.registerCitySearchDebounceHandle === 'number') {
                window.clearTimeout(this.registerCitySearchDebounceHandle);
                this.registerCitySearchDebounceHandle = null;
            }

            if (trimmedQuery.length < 2) {
                if (this.registerCitySearchAbortController) {
                    this.registerCitySearchAbortController.abort();
                    this.registerCitySearchAbortController = null;
                }
                this.registerCityOptions = [];
                this.registerCityOptionsLoading = false;
                return;
            }

            this.registerCitySearchDebounceHandle = window.setTimeout(() => {
                this.fetchRegisterCityOptions(trimmedQuery);
            }, 240);
        },
        async fetchRegisterCityOptions(query) {
            const trimmedQuery = typeof query === 'string' ? query.trim() : '';
            if (trimmedQuery.length < 2) {
                this.registerCityOptions = [];
                this.registerCityOptionsLoading = false;
                return;
            }

            const requestId = this.registerCitySearchRequestId + 1;
            this.registerCitySearchRequestId = requestId;
            if (this.registerCitySearchAbortController) {
                this.registerCitySearchAbortController.abort();
            }

            const abortController = new AbortController();
            this.registerCitySearchAbortController = abortController;
            this.registerCityOptionsLoading = true;

            try {
                const locale = document.documentElement.lang || 'de';
                const payload = await fetchCitySearchResults(trimmedQuery, locale, abortController.signal);
                if (requestId !== this.registerCitySearchRequestId) {
                    return;
                }

                this.registerCityOptions = normalizeCitySearchResults(payload, locale);
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return;
                }

                if (requestId !== this.registerCitySearchRequestId) {
                    return;
                }

                this.registerCityOptions = [];
            } finally {
                if (requestId === this.registerCitySearchRequestId) {
                    this.registerCityOptionsLoading = false;
                }

                if (this.registerCitySearchAbortController === abortController) {
                    this.registerCitySearchAbortController = null;
                }
            }
        },
        selectRegisterCityOption(option) {
            if (!option || typeof option !== 'object') {
                return;
            }

            const city = typeof option.cityName === 'string' ? option.cityName.trim() : '';
            this.registerCity = city;
            this.registerCityQuery = city;
            this.registerCitySelectionKey = option.id || city;
            this.registerCountryName = option.countryName || '';
            this.registerCountryCode = option.countryCode || '';
            this.registerCountryFlagPath = option.flagPath || '';
            this.registerPostalCode = normalizePostalCode(option.postalCode);
            this.registerCityOptions = [];
            this.registerCityOptionsLoading = false;
            this.clearRegisterCitySearchRuntime();
        },
        async loadRegisterPetChoices() {
            this.registerPetChoicesLoading = true;

            try {
                const locale = document.documentElement.lang || 'de';
                const payload = await fetchFirstJsonPayload(HEADER_SEARCH_PET_ENDPOINTS);
                const rawChoices = Array.isArray(payload)
                    ? payload
                    : (Array.isArray(payload?.choices) ? payload.choices : []);
                const normalizedValues = normalizePetChoices(rawChoices);
                const effectiveValues = normalizedValues.length ? normalizedValues : [...DEFAULT_PET_CHOICES];
                this.registerPetChoices = effectiveValues.map((value) => ({
                    value,
                    label: formatPetChoiceLabel(value, locale),
                    emojiPath: resolvePetChoiceEmojiPath(value)
                }));
                const availableChoices = new Set(this.registerPetChoices.map((choice) => choice.value));
                this.registerAcceptedPetSpecies = this.registerAcceptedPetSpecies
                    .filter((value) => availableChoices.has(value));
            } finally {
                this.registerPetChoicesLoading = false;
            }
        },
        isRegisterPetSpeciesSelected(value) {
            return this.registerAcceptedPetSpecies.includes(value);
        },
        toggleRegisterPetSpecies(value) {
            if (!value) {
                return;
            }

            if (this.isRegisterPetSpeciesSelected(value)) {
                this.registerAcceptedPetSpecies = this.registerAcceptedPetSpecies
                    .filter((selectedValue) => selectedValue !== value);
                return;
            }

            this.registerAcceptedPetSpecies = [...this.registerAcceptedPetSpecies, value];
        },
        buildRegisterPayload() {
            const normalizedEmail = this.normalizeLoginIdentifier(this.registerEmail).toLowerCase();
            const normalizedPostalCode = normalizePostalCode(this.registerPostalCode);
            const selectedSpecies = this.registerAcceptedPetSpecies.filter((value) => typeof value === 'string');

            return {
                email: normalizedEmail,
                password: typeof this.registerPassword === 'string' ? this.registerPassword : '',
                firstName: typeof this.registerFirstName === 'string' ? this.registerFirstName.trim() : '',
                lastName: typeof this.registerLastName === 'string' ? this.registerLastName.trim() : '',
                phone: this.formatPhoneWithCountryCode(this.registerPhoneCountryCode, this.registerPhone),
                birthDate: normalizeDateInputValue(this.registerBirthDate),
                emergencyContact: typeof this.registerEmergencyContact === 'string'
                    ? this.registerEmergencyContact.trim()
                    : '',
                profilePicture: typeof this.registerProfilePicture === 'string'
                    ? this.registerProfilePicture.trim()
                    : '',
                bio: typeof this.registerBio === 'string' ? this.registerBio.trim() : '',
                role: this.registerRole === 'HOST' ? 'HOST' : 'PET_OWNER',
                postalCode: /^\d{5}$/.test(normalizedPostalCode) ? normalizedPostalCode : null,
                city: typeof this.registerCity === 'string' && this.registerCity.trim()
                    ? this.registerCity.trim()
                    : null,
                acceptedPetSpecies: selectedSpecies
            };
        },
        async handleRegisterSubmit() {
            if (this.registerSubmitPending) {
                return;
            }

            for (const step of REGISTER_STEPS) {
                if (this.validateRegisterStep(step)) {
                    continue;
                }

                this.setRegisterStep(step);
                return;
            }

            this.registerSubmitPending = true;

            try {
                const response = await apiFetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    cache: 'no-store',
                    body: JSON.stringify(this.buildRegisterPayload())
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok || payload?.success === false) {
                    const backendMessage = typeof payload?.message === 'string'
                        ? payload.message.trim()
                        : '';
                    const detailMessage = Array.isArray(payload?.error?.details)
                        ? payload.error.details
                            .map((detail) => (typeof detail?.message === 'string' ? detail.message.trim() : ''))
                            .find(Boolean)
                        : '';
                    this.pushNotification({
                        title: localizedRegisterStrings.registerErrorTitle,
                        message: detailMessage || backendMessage || localizedRegisterStrings.registerFailedMessage,
                        tone: 'warning'
                    });
                    return;
                }

                this.registerPassword = '';
                this.registerPasswordConfirmation = '';
                await this.refreshAuthSession({
                    successNotificationKind: 'register',
                    successNotificationIdentity: {
                        firstName: this.registerFirstName,
                        lastName: this.registerLastName,
                        email: this.registerEmail
                    }
                });
            } catch {
                this.pushNotification({
                    title: localizedRegisterStrings.registerErrorTitle,
                    message: localizedRegisterStrings.registerFailedMessage,
                    tone: 'warning'
                });
            } finally {
                this.registerSubmitPending = false;
            }
        },
        isEmailIdentifier(value) {
            if (typeof value !== 'string') {
                return false;
            }

            const trimmedValue = value.trim();
            if (!trimmedValue || trimmedValue.length > 254) {
                return false;
            }

            return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(trimmedValue);
        },
        normalizeRoutePath(pathname) {
            const normalizedPath = typeof pathname === 'string'
                ? pathname.trim().replace(/\/+$/, '')
                : '';
            return normalizedPath || '/';
        },
        isRegisterPath(pathname) {
            return ROUTE_GUARD_REGISTER_PATTERN.test(this.normalizeRoutePath(pathname));
        },
        isProfileBasePath(pathname) {
            return ROUTE_GUARD_PROFILE_BASE_PATTERN.test(this.normalizeRoutePath(pathname));
        },
        isMyPetsPath(pathname) {
            return ROUTE_GUARD_MY_PETS_PATTERN.test(this.normalizeRoutePath(pathname));
        },
        isMyOffersPath(pathname) {
            return ROUTE_GUARD_MY_OFFERS_PATTERN.test(this.normalizeRoutePath(pathname));
        },
        isSettingsPath(pathname) {
            return ROUTE_GUARD_SETTINGS_PATTERN.test(this.normalizeRoutePath(pathname));
        },
        getRouteAccessRules() {
            return [
                {
                    id: 'register-guest-only',
                    pathPattern: ROUTE_GUARD_REGISTER_PATTERN,
                    redirectWhen: 'authenticated',
                    target: 'home'
                },
                {
                    id: 'profile-base-own-profile',
                    pathPattern: ROUTE_GUARD_PROFILE_BASE_PATTERN,
                    redirectWhen: 'authenticated',
                    target: 'ownProfile'
                },
                {
                    id: 'my-pets-auth-only',
                    pathPattern: ROUTE_GUARD_MY_PETS_PATTERN,
                    redirectWhen: 'unauthenticated',
                    target: 'notFound'
                },
                {
                    id: 'my-offers-auth-only',
                    pathPattern: ROUTE_GUARD_MY_OFFERS_PATTERN,
                    redirectWhen: 'unauthenticated',
                    target: 'notFound'
                },
                {
                    id: 'settings-auth-only',
                    pathPattern: ROUTE_GUARD_SETTINGS_PATTERN,
                    redirectWhen: 'unauthenticated',
                    target: 'notFound'
                }
            ];
        },
        shouldApplyRouteAccessRule(rule = {}, session = {}) {
            const isLoggedIn = session?.loggedIn === true;
            if (rule.redirectWhen === 'authenticated') {
                return isLoggedIn;
            }

            if (rule.redirectWhen === 'unauthenticated') {
                return !isLoggedIn;
            }

            if (rule.redirectWhen === 'always') {
                return true;
            }

            return false;
        },
        resolveRouteAccessTarget(rule = {}, session = {}) {
            if (rule.target === 'home') {
                return this.buildHomeRedirectPath();
            }

            if (rule.target === 'ownProfile') {
                return this.buildProfilePath(session?.userId ?? this.authSessionUserId);
            }

            if (rule.target === 'notFound') {
                return this.buildNotFoundPath();
            }

            if (typeof rule.target === 'string' && rule.target.trim()) {
                return rule.target.trim();
            }

            return '';
        },
        buildComparableNavigationTarget(pathValue = '') {
            const target = typeof pathValue === 'string' ? pathValue.trim() : '';
            if (!target) {
                return '';
            }

            try {
                const parsedUrl = new URL(target, window.location.origin);
                const normalizedPath = this.normalizeRoutePath(parsedUrl.pathname);
                return `${normalizedPath}${parsedUrl.search}`;
            } catch {
                return '';
            }
        },
        applyRouteAccessRules(session = {}) {
            const normalizedPath = this.normalizeRoutePath(window.location.pathname);
            const routeRules = this.getRouteAccessRules();
            const currentTarget = this.buildComparableNavigationTarget(window.location.href);

            for (const rule of routeRules) {
                if (!rule?.pathPattern?.test(normalizedPath)) {
                    continue;
                }

                if (!this.shouldApplyRouteAccessRule(rule, session)) {
                    continue;
                }

                const redirectTarget = this.resolveRouteAccessTarget(rule, session);
                const comparableRedirectTarget = this.buildComparableNavigationTarget(redirectTarget);
                if (!comparableRedirectTarget || comparableRedirectTarget === currentTarget) {
                    continue;
                }

                window.location.assign(redirectTarget);
                return true;
            }

            return false;
        },
        extractLocalePrefix(pathname = window.location.pathname) {
            const localePrefixMatch = String(pathname || '').match(/^\/(de|en|ro)(?:\/|$)/i);
            return localePrefixMatch ? `/${localePrefixMatch[1].toLowerCase()}` : '';
        },
        resolveCurrentLocaleCode() {
            const localePrefix = this.extractLocalePrefix(window.location.pathname);
            if (localePrefix) {
                return normalizeUiLocaleCode(localePrefix.slice(1));
            }

            try {
                const localeFromQuery = new URL(window.location.href).searchParams.get('locale');
                if (localeFromQuery) {
                    return normalizeUiLocaleCode(localeFromQuery);
                }
            } catch {
                // Ignore URL parsing errors and continue with fallback.
            }

            return normalizeUiLocaleCode(document.documentElement.lang || 'de');
        },
        resolveCanonicalLocaleSwitchPath(pathname = window.location.pathname) {
            const normalizedPath = this.normalizeRoutePath(pathname);
            const localePrefix = this.extractLocalePrefix(normalizedPath);
            const pathWithoutLocale = localePrefix
                ? (normalizedPath.slice(localePrefix.length) || '/')
                : normalizedPath;

            const routeAliasMap = {
                '/git': '/repository/git',
                '/playwright': '/repository/playwright',
                '/kanban': '/repository/kanban'
            };

            return routeAliasMap[pathWithoutLocale] || pathWithoutLocale;
        },
        resolveLocaleCodeFromHref(href = '', fallbackLocaleCode = '') {
            if (typeof href !== 'string' || !href.trim()) {
                return '';
            }

            try {
                const parsed = new URL(href, window.location.origin);
                const localePrefix = this.extractLocalePrefix(parsed.pathname);
                if (localePrefix) {
                    return normalizeUiLocaleCode(localePrefix.slice(1));
                }

                const localeFromQuery = parsed.searchParams.get('locale');
                if (localeFromQuery) {
                    return normalizeUiLocaleCode(localeFromQuery);
                }

                const normalizedFallbackLocale = normalizeUiLocaleCode(fallbackLocaleCode);
                if (normalizedFallbackLocale) {
                    return normalizedFallbackLocale;
                }

                return '';
            } catch {
                return '';
            }
        },
        buildLocaleSwitchNavigationTarget(targetLocaleCode = '') {
            const normalizedTargetLocaleCode = normalizeUiLocaleCode(targetLocaleCode);
            if (!normalizedTargetLocaleCode) {
                return '';
            }

            let currentUrl;
            try {
                currentUrl = new URL(window.location.href);
            } catch {
                return '';
            }

            const canonicalPath = this.resolveCanonicalLocaleSwitchPath(currentUrl.pathname);
            const nextUrl = new URL(canonicalPath, window.location.origin);
            currentUrl.searchParams.forEach((value, key) => {
                if (String(key).toLowerCase() === 'locale') {
                    return;
                }
                nextUrl.searchParams.append(key, value);
            });

            if (normalizedTargetLocaleCode !== 'de') {
                nextUrl.searchParams.set('locale', normalizedTargetLocaleCode);
            }

            nextUrl.hash = currentUrl.hash;

            return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
        },
        resolveLocaleSwitchNavigationTarget(anchorElement) {
            if (!(anchorElement instanceof HTMLElement)) {
                return '';
            }

            const href = anchorElement.getAttribute('href') || '';
            const targetLocaleCodeFromData = normalizeUiLocaleCode(anchorElement.dataset.localeCode || '');
            const targetLocaleCode = targetLocaleCodeFromData || this.resolveLocaleCodeFromHref(
                href,
                this.resolveCurrentLocaleCode() || 'de'
            );
            if (!targetLocaleCode) {
                return '';
            }

            const currentLocaleCode = this.resolveCurrentLocaleCode();
            if (targetLocaleCode === currentLocaleCode) {
                return '';
            }

            this.rememberRedirectNotification(this.buildLocaleSwitchNotification(targetLocaleCode));
            return this.buildLocaleSwitchNavigationTarget(targetLocaleCode);
        },
        buildLocaleSwitchNotification(localeCode = '') {
            const normalizedLocaleCode = normalizeUiLocaleCode(localeCode);
            const copy = LOCALE_SWITCH_NOTIFICATION_COPY[normalizedLocaleCode] || LOCALE_SWITCH_NOTIFICATION_COPY.de;
            const languageLabel = LOCALE_NATIVE_LABELS[normalizedLocaleCode] || normalizedLocaleCode.toUpperCase();
            const title = copy?.title || languageLabel;
            const messageTemplate = copy?.message || '{language}';

            return {
                title,
                message: formatTemplate(messageTemplate, { language: languageLabel }),
                tone: 'success'
            };
        },
        buildHomeRedirectPath() {
            const localePrefix = this.extractLocalePrefix(window.location.pathname);
            const homePath = localePrefix || '/';
            const currentUrl = new URL(window.location.href);
            const homeUrl = new URL(homePath, window.location.origin);
            const localeParam = currentUrl.searchParams.get('locale');

            if (localeParam) {
                homeUrl.searchParams.set('locale', localeParam);
            }

            return `${homeUrl.pathname}${homeUrl.search}`;
        },
        buildRegisterRedirectPath(prefillEmail = '') {
            const localePrefix = this.extractLocalePrefix(window.location.pathname);
            const registerPath = localePrefix ? `${localePrefix}/register` : '/register';
            const currentUrl = new URL(window.location.href);
            const registerUrl = new URL(registerPath, window.location.origin);
            const localeParam = currentUrl.searchParams.get('locale');
            const normalizedPrefillEmail = this.normalizeLoginIdentifier(prefillEmail).toLowerCase();

            if (localeParam) {
                registerUrl.searchParams.set('locale', localeParam);
            }

            if (this.isEmailIdentifier(normalizedPrefillEmail)) {
                registerUrl.searchParams.set('email', normalizedPrefillEmail);
            }

            return `${registerUrl.pathname}${registerUrl.search}`;
        },
        buildNotFoundPath() {
            const localePrefix = this.extractLocalePrefix(window.location.pathname);
            const notFoundPath = localePrefix ? `${localePrefix}/404` : '/404';
            const currentUrl = new URL(window.location.href);
            const notFoundUrl = new URL(notFoundPath, window.location.origin);
            const localeParam = currentUrl.searchParams.get('locale');

            if (localeParam) {
                notFoundUrl.searchParams.set('locale', localeParam);
            }

            return `${notFoundUrl.pathname}${notFoundUrl.search}`;
        },
        buildSettingsPath() {
            const localePrefix = this.extractLocalePrefix(window.location.pathname);
            return localePrefix ? `${localePrefix}/profile/settings` : '/profile/settings';
        },
        buildMyPetsPath() {
            const localePrefix = this.extractLocalePrefix(window.location.pathname);
            return localePrefix ? `${localePrefix}/profile/my-pets` : '/profile/my-pets';
        },
        buildMyOffersPath() {
            const localePrefix = this.extractLocalePrefix(window.location.pathname);
            return localePrefix ? `${localePrefix}/profile/my-offers` : '/profile/my-offers';
        },
        buildProfilePath(userId = null) {
            const normalizedUserId = this.normalizeProfileUserId(userId);
            if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
                return '';
            }

            const localePrefix = this.extractLocalePrefix(window.location.pathname);
            const profileBasePath = localePrefix ? `${localePrefix}/profile` : '/profile';
            return `${profileBasePath}/${normalizedUserId}`;
        },
        handleLoginIdentifierInput() {
            if (!this.loginPasswordVisible) {
                return;
            }

            const normalizedIdentifier = this.normalizeLoginIdentifier(this.loginIdentifier).toLowerCase();
            if (normalizedIdentifier === this.loginMailCheckedFor) {
                return;
            }

            this.loginPasswordVisible = false;
            this.loginPassword = '';
            this.loginMailCheckedFor = '';
        },
        async handleLoginModalSubmit() {
            if (this.loginLookupPending) {
                return;
            }

            const normalizedIdentifier = this.normalizeLoginIdentifier(
                this.readLoginIdentifierFieldValue() || this.loginIdentifier
            );
            this.loginIdentifier = normalizedIdentifier;

            if (!this.isEmailIdentifier(normalizedIdentifier)) {
                this.pushNotification({
                    title: localizedAuthModalStrings.loginErrorTitle,
                    message: localizedAuthModalStrings.identifierRequired,
                    tone: 'warning'
                });
                this.focusLoginIdentifierField();
                return;
            }

            const normalizedPassword = (
                this.readLoginPasswordFieldValue()
                || (typeof this.loginPassword === 'string' ? this.loginPassword : '')
            );
            this.loginPassword = normalizedPassword;

            if (this.loginPasswordVisible || normalizedPassword.trim()) {
                if (!normalizedPassword.trim()) {
                    this.pushNotification({
                        title: localizedAuthModalStrings.loginErrorTitle,
                        message: localizedAuthModalStrings.passwordRequired,
                        tone: 'warning'
                    });
                    this.focusLoginPasswordField();
                    return;
                }

                const requestId = this.loginLookupRequestId + 1;
                this.loginLookupRequestId = requestId;
                this.loginLookupPending = true;

                try {
                    const response = await apiFetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        },
                        cache: 'no-store',
                        body: JSON.stringify({
                            email: normalizedIdentifier,
                            password: normalizedPassword
                        })
                    });

                    const payload = await response.json().catch(() => ({}));
                    if (requestId !== this.loginLookupRequestId) {
                        return;
                    }

                    if (!response.ok || payload?.success === false) {
                        const backendMessage = typeof payload?.message === 'string'
                            ? payload.message.trim()
                            : '';
                        this.pushNotification({
                            title: localizedAuthModalStrings.loginErrorTitle,
                            message: backendMessage || localizedAuthModalStrings.loginFailedMessage,
                            tone: 'warning'
                        });
                        this.loginPassword = '';
                        this.focusLoginPasswordField();
                        return;
                    }

                    this.closeLoginModal();
                    await this.refreshAuthSession({
                        successNotificationKind: 'login'
                    });
                } catch {
                    this.pushNotification({
                        title: localizedAuthModalStrings.loginErrorTitle,
                        message: localizedAuthModalStrings.loginFailedMessage,
                        tone: 'warning'
                    });
                } finally {
                    if (requestId === this.loginLookupRequestId) {
                        this.loginLookupPending = false;
                    }
                }

                return;
            }

            const requestId = this.loginLookupRequestId + 1;
            this.loginLookupRequestId = requestId;
            this.loginLookupPending = true;

            try {
                const response = await apiFetch(`/api/users/mailExists?mail=${encodeURIComponent(normalizedIdentifier)}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    },
                    cache: 'no-store'
                });

                const payload = await response.json().catch(() => ({}));
                if (requestId !== this.loginLookupRequestId) {
                    return;
                }

                if (!response.ok || payload?.success === false) {
                    const backendMessage = typeof payload?.message === 'string'
                        ? payload.message.trim()
                        : '';
                    this.pushNotification({
                        title: localizedAuthModalStrings.emailCheckFailedTitle,
                        message: backendMessage || localizedAuthModalStrings.emailCheckFailedMessage,
                        tone: 'warning'
                    });
                    return;
                }

                const emailExists = payload?.data?.exists === true;
                if (!emailExists) {
                    const redirectNotification = {
                        title: localizedAuthModalStrings.emailNotFoundTitle,
                        message: localizedAuthModalStrings.emailNotFoundMessage,
                        tone: 'warning'
                    };
                    this.pushNotification(redirectNotification);
                    this.rememberRedirectNotification(redirectNotification);
                    this.rememberRegisterEmail(normalizedIdentifier);
                    window.location.assign(this.buildRegisterRedirectPath(normalizedIdentifier));
                    return;
                }

                this.pushNotification({
                    title: localizedAuthModalStrings.emailFoundTitle,
                    message: localizedAuthModalStrings.emailFoundMessage,
                    tone: 'success'
                });
                this.loginPasswordVisible = true;
                this.loginMailCheckedFor = normalizedIdentifier.toLowerCase();
                this.focusLoginPasswordField();
            } catch {
                this.pushNotification({
                    title: localizedAuthModalStrings.emailCheckFailedTitle,
                    message: localizedAuthModalStrings.emailCheckFailedMessage,
                    tone: 'warning'
                });
            } finally {
                if (requestId === this.loginLookupRequestId) {
                    this.loginLookupPending = false;
                }
            }
        },
        openLoginModal() {
            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.activeGitCommitModalHash = '';
            this.activeBoardCardKey = '';
            this.closeMyPetsAddModal();
            this.closeMyPetsDetailModal();
            this.closeMyPetsDeleteModal();
            this.closeHomeOfferDetailModal();
            this.closeSettingsEditModal();
            this.closeUserSearchModal();
            this.resetLoginModalState();
            this.loginModalOpen = true;
            this.syncModalBodyLock();
            this.focusLoginIdentifierField();
        },
        openLoginModalFromMenu() {
            this.menuOpen = false;
            this.openLoginModal();
        },
        focusUserSearchField() {
            nextTick(() => {
                document.querySelector('[data-user-search-input]')?.focus();
            });
        },
        normalizeUserSearchQuery(value) {
            return typeof value === 'string' ? value.trim() : '';
        },
        normalizeUserSearchResult(user = {}) {
            const normalizedId = this.normalizeProfileUserId(user?.id);
            if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
                return null;
            }

            const firstName = typeof user?.firstName === 'string' ? user.firstName.trim() : '';
            const lastName = typeof user?.lastName === 'string' ? user.lastName.trim() : '';
            const email = typeof user?.email === 'string' ? user.email.trim().toLowerCase() : '';
            const city = typeof user?.city === 'string' ? user.city.trim() : '';
            const profilePicture = normalizeProfilePicturePath(user?.profilePicture);
            const role = typeof user?.role === 'string' ? user.role.trim().toUpperCase() : '';
            const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || email || `#${normalizedId}`;
            const initial = (displayName.charAt(0) || '#').toUpperCase();
            const searchableText = [normalizedId, firstName, lastName, email, city, role]
                .join(' ')
                .toLowerCase();

            return {
                id: normalizedId,
                firstName,
                lastName,
                email,
                city,
                profilePicture,
                role,
                displayName,
                initial,
                searchableText
            };
        },
        handleUserSearchAvatarError(user) {
            if (!user || typeof user !== 'object') {
                return;
            }

            user.profilePicture = '';
        },
        sortUserSearchResults(users = []) {
            return [...users].sort((left, right) => {
                if (left.id !== right.id) {
                    return left.id - right.id;
                }

                return left.displayName.localeCompare(right.displayName, document.documentElement.lang || 'de');
            });
        },
        async fetchUserSearchUserById(userId, options = {}) {
            const allowNotFound = options?.allowNotFound === true;
            const normalizedUserId = this.normalizeProfileUserId(userId);
            if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
                return null;
            }

            const response = await apiFetch(`/api/users/${normalizedUserId}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                cache: 'no-store'
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok || payload?.success === false) {
                if (allowNotFound && response.status === 404) {
                    return null;
                }

                const backendMessage = typeof payload?.message === 'string'
                    ? payload.message.trim()
                    : '';
                throw new Error(backendMessage || localizedUserSearchModalStrings.loadFailed);
            }

            return this.normalizeUserSearchResult(payload?.data || {});
        },
        async loadUserSearchDirectory() {
            if (this.userSearchDirectoryLoaded) {
                return this.sortUserSearchResults(this.userSearchDirectory);
            }

            const requestId = this.userSearchDirectoryRequestId + 1;
            this.userSearchDirectoryRequestId = requestId;
            const users = [];
            const knownIds = new Set();
            const maxScanId = 600;
            const maxConsecutiveMisses = 24;
            let consecutiveMisses = 0;
            let foundAnyUser = false;

            for (let currentId = 1; currentId <= maxScanId; currentId += 1) {
                if (requestId !== this.userSearchDirectoryRequestId) {
                    return [];
                }

                const user = await this.fetchUserSearchUserById(currentId, { allowNotFound: true });
                if (user) {
                    foundAnyUser = true;
                    consecutiveMisses = 0;
                    if (!knownIds.has(user.id)) {
                        knownIds.add(user.id);
                        users.push(user);
                    }
                    continue;
                }

                if (!foundAnyUser) {
                    continue;
                }

                consecutiveMisses += 1;
                if (consecutiveMisses >= maxConsecutiveMisses) {
                    break;
                }
            }

            if (requestId !== this.userSearchDirectoryRequestId) {
                return [];
            }

            this.userSearchDirectory = this.sortUserSearchResults(users);
            this.userSearchDirectoryLoaded = true;
            return this.userSearchDirectory;
        },
        async performUserSearch(options = {}) {
            const nextQuery = this.normalizeUserSearchQuery(options?.query ?? this.userSearchQuery);
            const loadDirectory = options?.loadDirectory !== false;
            const requestId = this.userSearchRequestId + 1;
            this.userSearchRequestId = requestId;
            this.userSearchQuery = nextQuery;
            this.userSearchLoading = true;
            this.userSearchResults = [];
            this.userSearchStatusTone = 'info';
            this.userSearchStatusMessage = localizedUserSearchModalStrings.loading;

            try {
                if (!nextQuery) {
                    const directory = loadDirectory
                        ? await this.loadUserSearchDirectory()
                        : this.sortUserSearchResults(this.userSearchDirectory);
                    if (requestId !== this.userSearchRequestId) {
                        return;
                    }

                    this.userSearchResults = directory;
                    this.userSearchStatusMessage = directory.length
                        ? ''
                        : localizedUserSearchModalStrings.empty;
                    return;
                }

                const isNumericIdQuery = /^\d+$/.test(nextQuery);
                if (isNumericIdQuery) {
                    const directUser = await this.fetchUserSearchUserById(nextQuery, { allowNotFound: true });
                    if (requestId !== this.userSearchRequestId) {
                        return;
                    }

                    if (!directUser) {
                        this.userSearchResults = [];
                        this.userSearchStatusTone = 'error';
                        this.userSearchStatusMessage = localizedUserSearchModalStrings.notFound;
                        return;
                    }

                    this.userSearchResults = [directUser];
                    this.userSearchStatusMessage = '';
                    return;
                }

                const directory = loadDirectory
                    ? await this.loadUserSearchDirectory()
                    : this.sortUserSearchResults(this.userSearchDirectory);
                if (requestId !== this.userSearchRequestId) {
                    return;
                }

                const normalizedNeedle = nextQuery.toLowerCase();
                const matches = directory.filter((user) => user.searchableText.includes(normalizedNeedle));
                this.userSearchResults = matches;
                this.userSearchStatusMessage = matches.length
                    ? ''
                    : localizedUserSearchModalStrings.noMatches;
            } catch (error) {
                if (requestId !== this.userSearchRequestId) {
                    return;
                }

                const statusMessage = error?.message || localizedUserSearchModalStrings.loadFailed;
                this.userSearchStatusTone = 'error';
                this.userSearchStatusMessage = statusMessage;
                this.pushNotification({
                    title: localizedUserSearchModalStrings.errorTitle,
                    message: statusMessage,
                    tone: 'warning'
                });
            } finally {
                if (requestId === this.userSearchRequestId) {
                    this.userSearchLoading = false;
                }
            }
        },
        async handleUserSearchSubmit() {
            const normalizedQuery = this.normalizeUserSearchQuery(this.userSearchQuery);
            if (!normalizedQuery && !this.userSearchDirectoryLoaded) {
                await this.performUserSearch({
                    query: '',
                    loadDirectory: true
                });
                return;
            }

            if (!normalizedQuery && this.userSearchDirectoryLoaded) {
                this.userSearchResults = this.sortUserSearchResults(this.userSearchDirectory);
                this.userSearchStatusTone = 'info';
                this.userSearchStatusMessage = this.userSearchResults.length
                    ? ''
                    : localizedUserSearchModalStrings.empty;
                return;
            }

            if (!normalizedQuery) {
                this.userSearchStatusTone = 'error';
                this.userSearchStatusMessage = localizedUserSearchModalStrings.invalidQuery;
                return;
            }

            await this.performUserSearch({
                query: normalizedQuery,
                loadDirectory: true
            });
        },
        openUserSearchModal() {
            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.activeGitCommitModalHash = '';
            this.activeBoardCardKey = '';
            this.closeMyPetsAddModal();
            this.closeMyPetsDetailModal();
            this.closeMyPetsDeleteModal();
            this.closeMyOffersCreateModal();
            this.closeHomeOfferDetailModal();
            this.closeSettingsEditModal();
            this.closeLoginModal();
            this.userSearchModalOpen = true;
            this.userSearchQuery = '';
            this.userSearchResults = [];
            this.userSearchStatusTone = 'info';
            this.userSearchStatusMessage = localizedUserSearchModalStrings.loading;
            this.syncModalBodyLock();
            this.focusUserSearchField();
            this.performUserSearch({
                query: '',
                loadDirectory: true
            });
        },
        openUserSearchModalFromMenu() {
            this.menuOpen = false;
            this.openUserSearchModal();
        },
        closeUserSearchModal() {
            if (!this.userSearchModalOpen) {
                return;
            }

            this.userSearchModalOpen = false;
            this.userSearchLoading = false;
            this.userSearchStatusMessage = '';
            this.userSearchStatusTone = 'info';
            this.userSearchRequestId += 1;
            this.userSearchDirectoryRequestId += 1;
            this.syncModalBodyLock();
        },
        setHeaderCenterTab(tab) {
            const nextTab = tab === 'about' ? 'about' : 'discover';

            if (this.headerCenterTab === nextTab) {
                return;
            }

            this.headerCenterTab = nextTab;

            if (nextTab === 'about') {
                this.closeHeaderSearchDropdowns({ immediate: true });
            }

            this.applyHeaderSurfaceScrollProgress();
            this.$nextTick(() => {
                this.syncHeaderSearchTabsGeometry();
            });
        },
        closeLoginModal() {
            if (!this.loginModalOpen) {
                return;
            }

            this.loginModalOpen = false;
            this.syncModalBodyLock();
            this.resetLoginModalState();
        },
        syncModalBodyLock() {
            document.body.classList.toggle(
                'body--modal-open',
                Boolean(
                    this.loginModalOpen
                    || this.userSearchModalOpen
                    || this.settingsEditModalOpen
                    || this.myPetsAddModalOpen
                    || this.myPetsDetailModalOpen
                    || this.myPetsDeleteModalOpen
                    || this.myOffersCreateModalOpen
                    || this.homeOfferDetailModalOpen
                    || this.activeGitCommitModalHash
                    || this.activeBoardCardKey
                )
            );
        },
        closeRepositoryModal() {
            this.activeGitCommitModalHash = '';
            this.activeBoardCardKey = '';
            this.syncModalBodyLock();
        },
        getDropdownId(details) {
            if (!details) {
                return '';
            }

            if (!details.dataset.dropdownId) {
                dropdownIdSequence += 1;
                details.dataset.dropdownId = `dropdown-${dropdownIdSequence}`;
            }

            return details.dataset.dropdownId;
        },
        findDropdownById(dropdownId) {
            if (!dropdownId) {
                return null;
            }

            return this.getDropdowns().find((details) => this.getDropdownId(details) === dropdownId) || null;
        },
        getOpenDropdowns(options = {}) {
            const { exclude = null } = options;

            return this.getDropdowns().filter((details) => {
                if (details === exclude) {
                    return false;
                }

                return details.open || details.classList.contains('is-open');
            });
        },
        isHeaderSearchDropdown(details) {
            return Boolean(details?.classList?.contains('header_search_field'));
        },
        setHeaderSearchInteractionExpanded(expanded) {
            const nextExpanded = Boolean(expanded);
            if (this.headerSearchInteractionExpanded === nextExpanded) {
                return;
            }

            this.headerSearchInteractionExpanded = nextExpanded;
            this.applyHeaderSurfaceScrollProgress();
        },
        syncHeaderSearchInteractionState() {
            const hasOpenHeaderSearchDropdown = this.getOpenDropdowns()
                .some((details) => this.isHeaderSearchDropdown(details));
            const queuedTarget = this.findDropdownById(this.dropdownQueuedTargetId);
            const hasQueuedHeaderSearchDropdown = this.isHeaderSearchDropdown(queuedTarget);
            this.setHeaderSearchInteractionExpanded(hasOpenHeaderSearchDropdown || hasQueuedHeaderSearchDropdown);
        },
        clearDropdownQueue() {
            if (typeof this.dropdownQueueHandle === 'number') {
                window.clearTimeout(this.dropdownQueueHandle);
            }

            this.dropdownQueueHandle = null;
            this.dropdownQueuedTargetId = '';
            this.syncHeaderSearchInteractionState();
        },
        scheduleDropdownOpen(details) {
            const targetId = this.getDropdownId(details);
            if (!targetId) {
                return;
            }

            this.clearDropdownQueue();
            this.dropdownQueuedTargetId = targetId;
            this.syncHeaderSearchInteractionState();
            this.dropdownQueueHandle = window.setTimeout(() => {
                this.dropdownQueueHandle = null;
                const queuedTargetId = this.dropdownQueuedTargetId;
                this.dropdownQueuedTargetId = '';
                this.syncHeaderSearchInteractionState();

                if (!queuedTargetId) {
                    return;
                }

                const target = this.findDropdownById(queuedTargetId);
                if (!target) {
                    return;
                }

                if (this.getOpenDropdowns({ exclude: target }).length) {
                    this.closeAllDropdowns({ exclude: target, preserveQueue: true });
                    this.scheduleDropdownOpen(target);
                    return;
                }

                this.performDropdownOpen(target);
            }, DROPDOWN_CLOSE_DELAY_MS + 24);
        },
        performDropdownOpen(details) {
            if (!details) {
                return;
            }

            this.clearDropdownAnimation(details);
            this.enforceSingleOpenDropdown(details, { immediate: true });
            details.open = true;
            this.setDropdownExpanded(details, true);
            if (this.isPhoneCountryDropdown(details)) {
                this.positionPhoneCountryDropdownPanel(details);
            }
            if (this.isHeaderSearchDropdown(details)) {
                this.setHeaderSearchInteractionExpanded(true);
            }

            const frameIds = [];
            const firstFrame = window.requestAnimationFrame(() => {
                const secondFrame = window.requestAnimationFrame(() => {
                    details.classList.add('is-open');
                    if (this.isPhoneCountryDropdown(details)) {
                        this.positionPhoneCountryDropdownPanel(details);
                    }
                    dropdownFrames.delete(details);
                    this.syncHeaderSearchInteractionState();
                });

                frameIds.push(secondFrame);
                dropdownFrames.set(details, frameIds);
            });

            frameIds.push(firstFrame);
            dropdownFrames.set(details, frameIds);
        },
        getDropdowns() {
            return Array.from(document.querySelectorAll(DROPDOWN_SELECTOR));
        },
        closeHeaderSearchDropdowns(options = {}) {
            const { immediate = false } = options;

            this.getDropdowns()
                .filter((details) => this.isHeaderSearchDropdown(details))
                .forEach((details) => this.closeDropdown(details, { immediate }));

            this.syncHeaderSearchInteractionState();
        },
        isPhoneCountryDropdown(details) {
            return Boolean(details?.classList?.contains('phone_country_menu'));
        },
        repositionOpenPhoneCountryDropdownPanels(event = null) {
            const scrollTarget = event?.target;
            if (scrollTarget instanceof Element && scrollTarget.closest('.phone_country_menu__panel')) {
                return;
            }

            this.getDropdowns()
                .filter((details) => this.isPhoneCountryDropdown(details) && details.open)
                .forEach((details) => this.positionPhoneCountryDropdownPanel(details));
        },
        positionPhoneCountryDropdownPanel(details) {
            if (!this.isPhoneCountryDropdown(details) || !details.open) {
                return;
            }

            const summary = details.querySelector('summary');
            const panel = details.querySelector('.phone_country_menu__panel');
            if (!summary || !panel) {
                return;
            }

            const viewportPadding = 12;
            const panelGap = 8;
            const minimumPanelHeight = 180;
            const minimumPanelWidth = 264;
            const summaryRect = summary.getBoundingClientRect();
            const maxPanelWidth = Math.max(minimumPanelWidth, window.innerWidth - (viewportPadding * 2));
            const panelWidth = Math.min(
                Math.max(summaryRect.width + 38, minimumPanelWidth),
                maxPanelWidth
            );
            const summaryCenter = summaryRect.left + (summaryRect.width / 2);
            const unclampedLeft = summaryCenter - (panelWidth / 2);
            const maxPanelLeft = window.innerWidth - panelWidth - viewportPadding;
            const clampedLeft = Math.min(
                Math.max(unclampedLeft, viewportPadding),
                Math.max(viewportPadding, maxPanelLeft)
            );
            const availableBelow = window.innerHeight - summaryRect.bottom - viewportPadding - panelGap;
            const availableAbove = summaryRect.top - viewportPadding - panelGap;
            const persistedDirection = details.dataset.phoneCountryDropdownDirection;
            const shouldOpenUpwards = persistedDirection
                ? persistedDirection === 'up'
                : (availableBelow < minimumPanelHeight && availableAbove > availableBelow);
            const availableHeight = shouldOpenUpwards ? availableAbove : availableBelow;
            const maxHeight = Math.floor(
                Math.max(
                    96,
                    Math.min(
                        availableHeight,
                        window.innerHeight - (viewportPadding * 2)
                    )
                )
            );
            const top = shouldOpenUpwards
                ? Math.round(summaryRect.top - panelGap)
                : Math.round(summaryRect.bottom + panelGap);

            details.dataset.phoneCountryDropdownDirection = shouldOpenUpwards ? 'up' : 'down';
            details.classList.add('phone_country_menu--overlay');
            panel.style.left = `${Math.round(clampedLeft)}px`;
            panel.style.right = 'auto';
            panel.style.top = `${top}px`;
            panel.style.width = `${Math.round(panelWidth)}px`;
            panel.style.maxHeight = `${maxHeight}px`;
            panel.style.zIndex = '5000';
            panel.style.transformOrigin = shouldOpenUpwards ? 'bottom center' : 'top center';
            panel.style.transform = shouldOpenUpwards ? 'translateY(-100%)' : 'translateY(0)';
        },
        resetPhoneCountryDropdownPanel(details) {
            if (!this.isPhoneCountryDropdown(details)) {
                return;
            }

            const panel = details.querySelector('.phone_country_menu__panel');
            details.classList.remove('phone_country_menu--overlay');
            if (!panel) {
                return;
            }

            panel.style.left = '';
            panel.style.right = '';
            panel.style.top = '';
            panel.style.width = '';
            panel.style.maxHeight = '';
            panel.style.zIndex = '';
            panel.style.transformOrigin = '';
            panel.style.transform = '';
            details.dataset.phoneCountryDropdownDirection = '';
        },
        initializeDropdowns() {
            this.getDropdowns().forEach((details) => {
                const summary = details.querySelector('summary');

                if (!summary || details.dataset.dropdownInitialized === 'true') {
                    return;
                }

                details.dataset.dropdownInitialized = 'true';
                this.getDropdownId(details);
                details.classList.remove('is-open');
                this.setDropdownExpanded(details, false);

                summary.addEventListener('click', (event) => {
                    event.preventDefault();
                    const isDateDropdown = details.classList.contains('header_search_field--date');
                    this.toggleDropdown(details, {
                        immediateSwitch: isDateDropdown
                    });
                });

                details.addEventListener('toggle', () => {
                    if (details.open) {
                        this.enforceSingleOpenDropdown(details, { immediate: true });
                        this.setDropdownExpanded(details, true);
                        this.positionPhoneCountryDropdownPanel(details);
                    } else {
                        this.setDropdownExpanded(details, false);
                        this.resetPhoneCountryDropdownPanel(details);
                    }

                    this.syncHeaderSearchInteractionState();
                });
            });
        },
        setDropdownExpanded(details, expanded) {
            const summary = details.querySelector('summary');

            if (summary) {
                summary.setAttribute('aria-expanded', String(expanded));
            }
        },
        enforceSingleOpenDropdown(activeDetails, options = {}) {
            const { immediate = true } = options;
            const openDropdowns = this.getOpenDropdowns({ exclude: activeDetails });
            if (!openDropdowns.length) {
                return;
            }

            openDropdowns.forEach((details) => {
                this.closeDropdown(details, { immediate });
            });
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
        toggleDropdown(details, options = {}) {
            if (!details) {
                return;
            }

            if (details.dataset.dropdownDisabled === 'true') {
                return;
            }

            if (details.classList.contains('is-open')) {
                this.closeDropdown(details);
                return;
            }

            this.openDropdown(details, options);
        },
        openDropdown(details, options = {}) {
            if (!details) {
                return;
            }

            const { immediateSwitch = false } = options;
            const hasOtherOpenDropdowns = this.getOpenDropdowns({ exclude: details }).length > 0;
            if (hasOtherOpenDropdowns) {
                this.closeAllDropdowns({ exclude: details, immediate: true });
            }

            this.clearDropdownQueue();
            if (immediateSwitch || hasOtherOpenDropdowns) {
                this.performDropdownOpen(details);
                return;
            }

            this.performDropdownOpen(details);
        },
        closeDropdown(details, options = {}) {
            if (!details) {
                return;
            }

            const { immediate = false } = options;

            this.clearDropdownAnimation(details);
            this.setDropdownExpanded(details, false);
            this.resetPhoneCountryDropdownPanel(details);

            if (immediate) {
                details.classList.remove('is-open');
                details.open = false;
                this.syncHeaderSearchInteractionState();
                return;
            }

            if (!details.open && !details.classList.contains('is-open')) {
                return;
            }

            details.classList.remove('is-open');
            this.syncHeaderSearchInteractionState();

            const timeoutId = window.setTimeout(() => {
                details.open = false;
                dropdownTimers.delete(details);
                this.syncHeaderSearchInteractionState();
            }, DROPDOWN_CLOSE_DELAY_MS);

            dropdownTimers.set(details, timeoutId);
        },
        closeAllDropdowns(options = {}) {
            const {
                exclude = null,
                immediate = false,
                preserveQueue = false
            } = options;

            if (!preserveQueue) {
                this.clearDropdownQueue();
            }

            this.getDropdowns().forEach((details) => {
                if (details === exclude) {
                    return;
                }

                this.closeDropdown(details, { immediate });
            });
            this.syncHeaderSearchInteractionState();
        },
        handleDocumentPointerDown(event) {
            if (event.target.closest(DROPDOWN_SELECTOR)) {
                return;
            }

            this.closeAllDropdowns();
        },
        handleDocumentDropdownToggle(event) {
            const details = event?.target;
            if (!(details instanceof Element) || details.tagName !== 'DETAILS' || !details.matches(DROPDOWN_SELECTOR)) {
                return;
            }

            if (details.open && details.dataset.dropdownDisabled === 'true') {
                details.open = false;
            }

            this.setDropdownExpanded(details, details.open);

            if (details.open) {
                this.clearDropdownQueue();
                this.enforceSingleOpenDropdown(details, { immediate: true });
            }

            if (this.isPhoneCountryDropdown(details)) {
                if (details.open) {
                    this.positionPhoneCountryDropdownPanel(details);
                } else {
                    this.resetPhoneCountryDropdownPanel(details);
                }
            }

            this.syncHeaderSearchInteractionState();
        },
        isLegacyLoginPath(pathname) {
            if (typeof pathname !== 'string') {
                return false;
            }

            const normalizedPath = pathname.trim().replace(/\/+$/, '') || '/';
            return normalizedPath === '/login' || /^\/(?:de|en|ro)\/login$/i.test(normalizedPath);
        },
        isLegacyLoginHref(href) {
            if (typeof href !== 'string' || !href.trim()) {
                return false;
            }

            try {
                const parsed = new URL(href, window.location.origin);
                return this.isLegacyLoginPath(parsed.pathname);
            } catch {
                return false;
            }
        },
        patchLegacyLoginLinks() {
            document.querySelectorAll('a[href]').forEach((linkElement) => {
                const href = linkElement.getAttribute('href') || '';
                if (!this.isLegacyLoginHref(href)) {
                    return;
                }

                linkElement.dataset.legacyLoginModal = 'true';
                linkElement.setAttribute('href', '#');
            });
        },
        handleDocumentClick(event) {
            const anchorElement = event.target?.closest?.('a[href]');
            if (!anchorElement) {
                return;
            }

            if (anchorElement.matches('.locale_menu__item')) {
                event.preventDefault();
                const localeSwitchTarget = this.resolveLocaleSwitchNavigationTarget(anchorElement);
                if (localeSwitchTarget) {
                    window.location.assign(localeSwitchTarget);
                }
                return;
            }

            const href = anchorElement.getAttribute('href') || '';
            if (!this.isLegacyLoginHref(href) && anchorElement.dataset.legacyLoginModal !== 'true') {
                return;
            }

            event.preventDefault();
            this.openLoginModal();
        },
        handleDocumentKeydown(event) {
            if (event.key !== 'Escape') {
                return;
            }

            if (this.loginModalOpen) {
                this.closeLoginModal();
                return;
            }

            if (this.userSearchModalOpen) {
                this.closeUserSearchModal();
                return;
            }

            if (this.settingsEditModalOpen) {
                this.closeSettingsEditModal();
                return;
            }

            if (this.myPetsDeleteModalOpen) {
                this.closeMyPetsDeleteModal();
                return;
            }

            if (this.myPetsAddModalOpen) {
                this.closeMyPetsAddModal();
                return;
            }

            if (this.myPetsDetailModalOpen) {
                if (this.myPetsDetailEditing) {
                    this.cancelMyPetsDetailEditing();
                    return;
                }

                this.closeMyPetsDetailModal();
                return;
            }

            if (this.myOffersCreateModalOpen) {
                this.closeMyOffersCreateModal();
                return;
            }

            if (this.homeOfferDetailModalOpen) {
                this.closeHomeOfferDetailModal();
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
                    this[property] = firstValue || configuredValue || currentValue;
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

                if (this.gitView === 'graph' && !this.repositoryLoading) {
                    nextTick(() => {
                        this.updateSegmentedIndicators();
                        this.renderGitGraph(true);
                    });
                }
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
            let shouldSyncRepositoryState = false;

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

                const response = await apiFetch(`/api/repository/live.json?${params.toString()}`, {
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
                shouldSyncRepositoryState = true;
                this.animateMetricGroup('git');
                this.animateMetricGroup('board');
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return;
                }
                if (requestId !== this.repositoryRefreshRequestId) {
                    return;
                }
                this.repositoryError = error.message;
                shouldSyncRepositoryState = true;
            } finally {
                if (requestId === this.repositoryRefreshRequestId) {
                    this.repositoryLoading = false;

                    if (shouldSyncRepositoryState) {
                        this.ensureRepositoryState();
                    }
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

            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.loginModalOpen = false;
            this.resetLoginModalState();
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
        getGitGraphPanel() {
            return document.querySelector('.git_graph_canvas_panel');
        },
        getGitGraphViewportWidth() {
            const panel = this.getGitGraphPanel();
            if (panel) {
                const panelWidth = Math.round(panel.clientWidth || panel.getBoundingClientRect().width || 0);
                if (panelWidth > 0) {
                    return panelWidth;
                }
            }

            const container = this.getGitGraphContainer();
            return Math.round(container?.getBoundingClientRect().width || 0);
        },
        calculateGitGraphMinContentWidth(viewportWidth = 0) {
            const safeViewportWidth = Math.max(0, Number(viewportWidth) || 0);
            return Math.max(safeViewportWidth, GIT_GRAPH_MIN_CONTENT_WIDTH_PX);
        },
        readMergeCommitHashes() {
            const graphData = this.readGitGraphData();
            const mergeHashes = graphData
                .filter((commit) => Array.isArray(commit?.refs) && commit.refs.some((ref) => typeof ref === 'string' && ref.toLowerCase().startsWith('merge:')))
                .map((commit) => commit.hash)
                .filter((hash) => typeof hash === 'string' && hash.trim());

            if (mergeHashes.length > 0) {
                return mergeHashes;
            }

            return graphData
                .map((commit) => commit?.hash)
                .filter((hash) => typeof hash === 'string' && hash.trim());
        },
        readGitGraphNodeCenterX(commitHash) {
            const panel = this.getGitGraphPanel();
            const labelLayer = document.querySelector('[data-git-branch-labels]');
            const node = this.getGraphCommitNode(commitHash);

            if (!panel || !node) {
                return null;
            }

            const nodeRect = node.getBoundingClientRect();
            const labelLayerRect = labelLayer?.getBoundingClientRect?.();
            if (labelLayerRect) {
                // Use the branch-label layer as shared coordinate space so scroll offsets are never double-counted.
                return Math.round(nodeRect.left - labelLayerRect.left + (nodeRect.width / 2));
            }

            const panelRect = panel.getBoundingClientRect();
            return Math.round(nodeRect.left - panelRect.left + panel.scrollLeft + (nodeRect.width / 2));
        },
        resolveGitGraphSymmetricEdgeGap() {
            const mergeHashes = this.readMergeCommitHashes();
            if (!mergeHashes.length) {
                return GIT_GRAPH_FALLBACK_EDGE_GUTTER_PX;
            }

            let leftMostMergeX = Number.POSITIVE_INFINITY;
            mergeHashes.forEach((hash) => {
                const x = this.readGitGraphNodeCenterX(hash);
                if (Number.isFinite(x)) {
                    leftMostMergeX = Math.min(leftMostMergeX, x);
                }
            });

            if (!Number.isFinite(leftMostMergeX)) {
                return GIT_GRAPH_FALLBACK_EDGE_GUTTER_PX;
            }

            return Math.max(0, Math.round(leftMostMergeX));
        },
        readRightMostGraphLabelRight(labelLayer = null) {
            const targetLayer = labelLayer || document.querySelector('[data-git-branch-labels]');
            if (!targetLayer) {
                return 0;
            }

            let maxLabelRight = 0;
            targetLayer.querySelectorAll('.git_graph_branch_label').forEach((label) => {
                maxLabelRight = Math.max(maxLabelRight, label.offsetLeft + label.offsetWidth);
            });

            return Math.round(maxLabelRight);
        },
        syncGitGraphHorizontalSpace(options = {}) {
            const container = this.getGitGraphContainer();
            const panel = this.getGitGraphPanel();
            const labelLayer = document.querySelector('[data-git-branch-labels]');

            if (!container || !panel) {
                return 0;
            }

            const requestedViewportWidth = Number.isFinite(options.viewportWidth)
                ? Math.round(options.viewportWidth)
                : 0;
            const viewportWidth = requestedViewportWidth > 0
                ? requestedViewportWidth
                : this.getGitGraphViewportWidth();
            if (viewportWidth <= 0) {
                return 0;
            }

            const edgeGap = this.resolveGitGraphSymmetricEdgeGap();
            let requiredWidth = this.calculateGitGraphMinContentWidth(viewportWidth);
            const svg = container.querySelector('svg');
            const svgBBox = typeof svg?.getBBox === 'function' ? svg.getBBox() : null;
            const maxLabelRight = this.readRightMostGraphLabelRight(labelLayer);
            const hasLabels = maxLabelRight > 0;

            if (hasLabels) {
                // Hard symmetry rule: right gap after the right-most branch label equals the left merge gap.
                requiredWidth = Math.max(requiredWidth, maxLabelRight + edgeGap);
            }

            if (svgBBox && Number.isFinite(svgBBox.width)) {
                const svgRight = Math.ceil(svgBBox.x + svgBBox.width);
                requiredWidth = Math.max(
                    requiredWidth,
                    hasLabels ? svgRight : svgRight + edgeGap
                );
            }

            const targetWidth = Math.max(viewportWidth, Math.ceil(requiredWidth));
            container.style.width = `${targetWidth}px`;
            container.style.minWidth = `${targetWidth}px`;

            if (labelLayer) {
                labelLayer.style.width = `${targetWidth}px`;
                labelLayer.style.minWidth = `${targetWidth}px`;
            }

            const maxScrollLeft = Math.max(0, targetWidth - viewportWidth);
            if (panel.scrollLeft > maxScrollLeft) {
                panel.scrollLeft = maxScrollLeft;
            }

            return targetWidth;
        },
        ensureGitGraphTopAnchorCanBeCentered(options = {}) {
            const container = this.getGitGraphContainer();
            const panel = this.getGitGraphPanel();
            const labelLayer = document.querySelector('[data-git-branch-labels]');
            if (!container || !panel || !labelLayer) {
                return false;
            }

            const requestedViewportWidth = Number.isFinite(options.viewportWidth)
                ? Math.round(options.viewportWidth)
                : 0;
            const viewportWidth = requestedViewportWidth > 0
                ? requestedViewportWidth
                : this.getGitGraphViewportWidth();
            if (viewportWidth <= 0) {
                return false;
            }

            const topAnchorX = this.resolveTopGraphAnchorX();
            if (!Number.isFinite(topAnchorX)) {
                return false;
            }

            const edgeGap = this.resolveGitGraphSymmetricEdgeGap();
            if (!Number.isFinite(edgeGap)) {
                return false;
            }

            const maxLabelRight = this.readRightMostGraphLabelRight(labelLayer);
            if (maxLabelRight <= 0) {
                return false;
            }

            const svg = container.querySelector('svg');
            const svgBBox = typeof svg?.getBBox === 'function' ? svg.getBBox() : null;
            const svgRight = svgBBox && Number.isFinite(svgBBox.width)
                ? Math.ceil(svgBBox.x + svgBBox.width)
                : 0;
            const maxContentRight = Math.max(maxLabelRight, svgRight);
            const requiredEdgeGap = Math.max(
                0,
                Math.ceil((viewportWidth / 2) - (maxContentRight - topAnchorX))
            );
            if (requiredEdgeGap <= edgeGap) {
                return false;
            }

            if (!container.dataset.basePaddingLeftPx) {
                const baselinePaddingLeft = Number.parseFloat(window.getComputedStyle(container).paddingLeft || '0');
                container.dataset.basePaddingLeftPx = Number.isFinite(baselinePaddingLeft)
                    ? String(baselinePaddingLeft)
                    : '0';
            }

            const currentPaddingLeft = Number.parseFloat(window.getComputedStyle(container).paddingLeft || '0');
            const safePaddingLeft = Number.isFinite(currentPaddingLeft) ? currentPaddingLeft : 0;
            const delta = requiredEdgeGap - edgeGap;
            container.style.paddingLeft = `${Math.ceil(safePaddingLeft + delta)}px`;
            return true;
        },
        resolveTopGraphAnchorX() {
            const labels = Array.from(document.querySelectorAll('.git_graph_branch_label'));
            if (!labels.length) {
                return null;
            }

            const topLabel = labels.reduce((currentTop, label) => {
                if (!currentTop) {
                    return label;
                }
                return label.offsetTop < currentTop.offsetTop ? label : currentTop;
            }, null);
            if (!topLabel) {
                return null;
            }

            const labelCenterX = topLabel.offsetLeft + (topLabel.offsetWidth / 2);
            const commitHash = topLabel.dataset.commitHash || '';
            const nodeCenterX = this.readGitGraphNodeCenterX(commitHash);

            if (Number.isFinite(nodeCenterX)) {
                return Math.round((labelCenterX + nodeCenterX) / 2);
            }

            return Math.round(labelCenterX);
        },
        centerGitGraphOnTopAnchor() {
            const panel = this.getGitGraphPanel();
            if (!panel) {
                return;
            }

            const viewportWidth = Math.round(panel.clientWidth || 0);
            if (viewportWidth <= 0) {
                return;
            }

            const anchorX = this.resolveTopGraphAnchorX();
            if (!Number.isFinite(anchorX)) {
                return;
            }

            const maxScrollLeft = Math.max(0, panel.scrollWidth - viewportWidth);
            const targetScrollLeft = Math.max(0, Math.min(Math.round(anchorX - (viewportWidth / 2)), maxScrollLeft));
            panel.scrollLeft = targetScrollLeft;
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

            const subject = sanitizePopupText(graphCommit?.subject || recentCommit?.message || '—');

            return {
                shortSha: recentCommit?.shortSha || commitHash.slice(0, 7),
                dateLabel: recentCommit?.dateLabel || '',
                subject: subject || '—',
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
                labelLayer.style.removeProperty('width');
                labelLayer.style.removeProperty('min-width');
            }
        },
        renderCustomGitBranchLabels() {
            const container = this.getGitGraphContainer();
            const panel = this.getGitGraphPanel();
            const labelLayer = document.querySelector('[data-git-branch-labels]');
            if (!container || !panel || !labelLayer) {
                return 0;
            }

            labelLayer.innerHTML = '';

            const branches = this.repository.git.branches
                .filter((branch) => typeof branch?.name === 'string' && branch.name.trim() && typeof branch?.hash === 'string' && branch.hash.trim());
            if (!branches.length) {
                return 0;
            }

            const labelLayerRect = labelLayer.getBoundingClientRect();
            const labelOffset = GIT_GRAPH_LABEL_OFFSET_PX;
            let renderedLabelCount = 0;

            branches.forEach((branch) => {
                const headNode = this.getGraphCommitNode(branch.hash);
                if (!headNode) {
                    return;
                }

                const nodeRect = headNode.getBoundingClientRect();
                const x = Math.round(nodeRect.right - labelLayerRect.left + labelOffset);
                const y = Math.round(nodeRect.top - labelLayerRect.top + (nodeRect.height / 2));

                const label = document.createElement('button');
                label.type = 'button';
                label.className = 'git_graph_branch_label';
                label.textContent = branch.name;
                label.title = branch.name;
                label.dataset.commitHash = branch.hash;
                const branchColor = this.getBranchLabelColor(branch, branches);
                label.style.color = branchColor;
                label.style.borderColor = branchColor;
                label.style.left = `${x}px`;
                label.style.top = `${y}px`;
                label.addEventListener('click', () => {
                    this.selectGitBranch(branch.name);
                });

                labelLayer.append(label);
                renderedLabelCount += 1;
            });

            this.syncGitGraphHorizontalSpace({
                viewportWidth: this.getGitGraphViewportWidth()
            });
            return renderedLabelCount;
        },
        bindGitGraphBranchLabelTracking() {
            const panel = this.getGitGraphPanel();
            if (!panel || panel.dataset.graphBranchLabelsBound === 'true') {
                return;
            }

            panel.dataset.graphBranchLabelsBound = 'true';
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
            const panel = this.getGitGraphPanel();
            const details = this.readGraphCommitDetails(commitHash);

            if (!panel || !target || !details) {
                this.hideGitGraphTooltip();
                return;
            }

            const panelRect = panel.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16') || 16;
            const maxTooltipWidth = Math.max(
                0,
                Math.min(
                    Math.round(GIT_GRAPH_TOOLTIP_MAX_WIDTH_REM * rootFontSize),
                    panel.clientWidth - (GIT_GRAPH_TOOLTIP_MARGIN_PX * 2)
                )
            );
            const maxTooltipHeight = Math.max(0, panel.clientHeight - (GIT_GRAPH_TOOLTIP_MARGIN_PX * 2));
            const sourceX = Number.isFinite(pointer?.x)
                ? Math.round(pointer.x - panelRect.left - panel.clientLeft + panel.scrollLeft)
                : Math.round(targetRect.left - panelRect.left - panel.clientLeft + panel.scrollLeft + (targetRect.width / 2));
            const sourceY = Number.isFinite(pointer?.y)
                ? Math.round(pointer.y - panelRect.top - panel.clientTop + panel.scrollTop)
                : Math.round(targetRect.top - panelRect.top - panel.clientTop + panel.scrollTop + (targetRect.height / 2));

            const clamp = (value, min, max) => {
                if (!Number.isFinite(value)) {
                    return min;
                }

                if (max < min) {
                    return min;
                }

                return Math.min(Math.max(value, min), max);
            };

            const resolvePlacement = (targetPanel, tooltipWidth, tooltipHeight) => {
                const viewportWidth = Math.max(0, targetPanel.clientWidth);
                const viewportHeight = Math.max(0, targetPanel.clientHeight);
                const safeWidth = Math.max(0, Math.min(tooltipWidth, maxTooltipWidth));
                const safeHeight = Math.max(0, Math.min(tooltipHeight, maxTooltipHeight));
                const minX = targetPanel.scrollLeft + GIT_GRAPH_TOOLTIP_MARGIN_PX;
                const maxX = targetPanel.scrollLeft + viewportWidth - safeWidth - GIT_GRAPH_TOOLTIP_MARGIN_PX;
                const minY = targetPanel.scrollTop + GIT_GRAPH_TOOLTIP_MARGIN_PX;
                const maxY = targetPanel.scrollTop + viewportHeight - safeHeight - GIT_GRAPH_TOOLTIP_MARGIN_PX;
                const preferredX = sourceX + GIT_GRAPH_TOOLTIP_POINTER_OFFSET_X_PX;
                const preferredAboveY = sourceY - safeHeight - GIT_GRAPH_TOOLTIP_POINTER_OFFSET_Y_PX;
                const preferredBelowY = sourceY + GIT_GRAPH_TOOLTIP_POINTER_OFFSET_Y_PX;
                const alignedY = preferredAboveY < minY ? preferredBelowY : preferredAboveY;
                const x = Math.round(clamp(preferredX, minX, maxX));
                const y = Math.round(clamp(alignedY, minY, maxY));

                return {
                    x,
                    y,
                    anchorX: Math.round(sourceX - x)
                };
            };

            const initialPlacement = resolvePlacement(panel, maxTooltipWidth, maxTooltipHeight);

            this.gitGraphTooltip = {
                visible: true,
                x: initialPlacement.x,
                y: initialPlacement.y,
                sourceX,
                sourceY,
                anchorX: initialPlacement.anchorX,
                shortSha: details.shortSha,
                dateLabel: details.dateLabel,
                subject: details.subject,
                author: details.author,
                authorAvatarUrl: details.authorAvatarUrl,
                authorInitials: details.authorInitials,
                mergeInfo: details.mergeInfo
            };

            nextTick(() => {
                if (!this.gitGraphTooltip.visible || this.hoveredGitCommitHash !== commitHash) {
                    return;
                }

                const currentPanel = this.getGitGraphPanel();
                if (!currentPanel) {
                    return;
                }

                const tooltipElement = currentPanel.querySelector('.git_graph_tooltip');
                if (!tooltipElement) {
                    return;
                }

                const measuredWidth = Math.max(0, Math.ceil(tooltipElement.offsetWidth || 0));
                const measuredHeight = Math.max(0, Math.ceil(tooltipElement.offsetHeight || 0));
                const refinedPlacement = resolvePlacement(
                    currentPanel,
                    measuredWidth || maxTooltipWidth,
                    measuredHeight || maxTooltipHeight
                );

                if (
                    refinedPlacement.x === this.gitGraphTooltip.x
                    && refinedPlacement.y === this.gitGraphTooltip.y
                    && refinedPlacement.anchorX === this.gitGraphTooltip.anchorX
                ) {
                    return;
                }

                this.gitGraphTooltip = {
                    ...this.gitGraphTooltip,
                    x: refinedPlacement.x,
                    y: refinedPlacement.y,
                    sourceX,
                    sourceY,
                    anchorX: refinedPlacement.anchorX
                };
            });
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
            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.loginModalOpen = false;
            this.resetLoginModalState();
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
            this.gitGraphRenderToken += 1;
            const renderToken = this.gitGraphRenderToken;

            if (this.gitView !== 'graph') {
                return;
            }

            const container = this.getGitGraphContainer();

            try {
                await ensureGitgraphLibrary();
            } catch {
                return;
            }

            if (renderToken !== this.gitGraphRenderToken) {
                return;
            }

            const GitgraphJS = window.GitgraphJS;

            if (!container || !GitgraphJS) {
                return;
            }

            const viewportWidth = this.getGitGraphViewportWidth();
            if (viewportWidth <= 0) {
                return;
            }

            const graphData = this.readGitGraphData();
            if (graphData.length === 0) {
                container.innerHTML = '';
                container.style.removeProperty('width');
                container.style.removeProperty('min-width');
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

            if (!force && this.gitGraphSignature === signature && this.gitGraphWidth === viewportWidth) {
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
            const estimatedWidth = this.calculateGitGraphMinContentWidth(viewportWidth);
            container.style.width = `${estimatedWidth}px`;
            container.style.minWidth = `${estimatedWidth}px`;
            if (!container.dataset.basePaddingLeftPx) {
                const baselinePaddingLeft = Number.parseFloat(window.getComputedStyle(container).paddingLeft || '0');
                container.dataset.basePaddingLeftPx = Number.isFinite(baselinePaddingLeft)
                    ? String(baselinePaddingLeft)
                    : '0';
            }
            const basePaddingLeft = Number.parseFloat(container.dataset.basePaddingLeftPx || '0');
            if (Number.isFinite(basePaddingLeft)) {
                container.style.paddingLeft = `${basePaddingLeft}px`;
            }
            const labelLayer = document.querySelector('[data-git-branch-labels]');
            if (labelLayer) {
                labelLayer.style.width = `${estimatedWidth}px`;
                labelLayer.style.minWidth = `${estimatedWidth}px`;
            }

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
            this.gitGraphWidth = viewportWidth;

            window.requestAnimationFrame(() => {
                if (renderToken !== this.gitGraphRenderToken) {
                    return;
                }

                window.requestAnimationFrame(() => {
                    if (renderToken !== this.gitGraphRenderToken) {
                        return;
                    }

                    const finalizeLayout = (attempt = 0) => {
                        if (renderToken !== this.gitGraphRenderToken) {
                            return;
                        }

                        this.syncGitGraphPanelHeight();
                        let labelCount = this.renderCustomGitBranchLabels();
                        this.syncGitGraphHorizontalSpace({
                            viewportWidth
                        });

                        for (let i = 0; i < 2; i += 1) {
                            const adjustedForCentering = this.ensureGitGraphTopAnchorCanBeCentered({
                                viewportWidth
                            });
                            if (!adjustedForCentering) {
                                break;
                            }

                            labelCount = this.renderCustomGitBranchLabels();
                            this.syncGitGraphHorizontalSpace({
                                viewportWidth
                            });
                        }

                        this.centerGitGraphOnTopAnchor();
                        this.syncGraphCommitHighlight();

                        if (labelCount === 0 && attempt < 6) {
                            window.requestAnimationFrame(() => {
                                finalizeLayout(attempt + 1);
                            });
                        }
                    };

                    finalizeLayout(0);
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
        updateSegmentedIndicators(options = {}) {
            const retryAttempt = Number.isFinite(Number(options?.retryAttempt))
                ? Math.max(0, Math.trunc(Number(options.retryAttempt)))
                : 0;
            const skipThreadBackgroundRefresh = options?.skipThreadBackgroundRefresh === true;
            const segmentedGroups = document.querySelectorAll('[data-segmented]');
            let needsMeasurementRetry = false;

            segmentedGroups.forEach((group) => {
                const property = group.getAttribute('data-segmented');
                const firstButton = group.querySelector('[data-segmented-value]');
                const fallbackValue = group.getAttribute('data-active')
                    || firstButton?.getAttribute('data-segmented-value')
                    || null;
                const activeValue = property ? (this[property] || fallbackValue) : fallbackValue;
                const buttons = Array.from(group.querySelectorAll('[data-segmented-value]'));
                const activeButton = buttons.find((button) => (
                    button.getAttribute('data-segmented-value') === activeValue
                )) || firstButton;
                const indicator = group.querySelector('.repository_segmented__indicator');

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
                    needsMeasurementRetry = true;

                    if (property && activeValue) {
                        this.syncSegmentPanels(property, activeValue);
                    }

                    return;
                }

                const fallbackGroupRect = group.getBoundingClientRect();
                const fallbackButtonRect = activeButton.getBoundingClientRect();
                const measuredWidth = Math.max(
                    0,
                    activeButton.offsetWidth || fallbackButtonRect.width || 0
                );
                const measuredX = Math.max(
                    0,
                    Number.isFinite(activeButton.offsetLeft)
                        ? activeButton.offsetLeft
                        : ((fallbackButtonRect.left - fallbackGroupRect.left) + group.scrollLeft)
                );

                if (measuredWidth <= 0 || fallbackGroupRect.width <= 0 || fallbackGroupRect.height <= 0) {
                    indicator.style.opacity = '0';
                    needsMeasurementRetry = true;

                    if (property && activeValue) {
                        this.syncSegmentPanels(property, activeValue);
                    }

                    return;
                }

                group.style.setProperty('--segment-width', `${measuredWidth}px`);
                group.style.setProperty('--segment-x', `${measuredX}px`);
                indicator.style.opacity = '1';

                if (property && activeValue) {
                    this.syncSegmentPanels(property, activeValue);
                }
            });

            if (needsMeasurementRetry && retryAttempt < 4) {
                if (this.segmentedIndicatorRetryFrame > 0) {
                    window.cancelAnimationFrame(this.segmentedIndicatorRetryFrame);
                }

                this.segmentedIndicatorRetryFrame = window.requestAnimationFrame(() => {
                    this.segmentedIndicatorRetryFrame = 0;
                    this.updateSegmentedIndicators({
                        retryAttempt: retryAttempt + 1,
                        skipThreadBackgroundRefresh: true
                    });
                });
            }

            if (!skipThreadBackgroundRefresh) {
                this.refreshThreadBackground();
            }
        },
        applyHeaderSurfaceScrollProgress(progressValue = headerScrollAnimationState.progress) {
            const numericValue = Number(progressValue);
            const clamped = Number.isFinite(numericValue)
                ? Math.min(1, Math.max(0, numericValue))
                : 0;
            const effectiveProgress = this.headerSearchInteractionExpanded ? 0 : clamped;
            this.headerScrollProgress = effectiveProgress;
            if (Math.abs(effectiveProgress - headerScrollAnimationState.appliedProgress) < HEADER_SCROLL_PROGRESS_EPSILON) {
                return;
            }
            const surfaceElement = this.headerSurfaceElement || document.querySelector('#site-shell-header .header_surface');
            if (!surfaceElement) {
                return;
            }

            this.headerSurfaceElement = surfaceElement;
            headerScrollAnimationState.appliedProgress = effectiveProgress;
            surfaceElement.style.setProperty('--header-scroll-progress', effectiveProgress.toFixed(3));
        },
        setHeaderScrollProgress(value, forcedScrolled = null) {
            const numericValue = Number(value);
            const clamped = Number.isFinite(numericValue)
                ? Math.min(1, Math.max(0, numericValue))
                : 0;
            const nextScrolled = typeof forcedScrolled === 'boolean'
                ? forcedScrolled
                : clamped > 0;
            const wasScrolled = this.scrolled;

            headerScrollAnimationState.progress = clamped;
            this.scrolled = nextScrolled;

            if (!wasScrolled && this.scrolled && this.headerCenterTab !== 'discover') {
                this.setHeaderCenterTab('discover');
            }

            this.applyHeaderSurfaceScrollProgress(clamped);
        },
        syncScrollState() {
            const scrollY = Math.max(0, window.scrollY || 0);
            this.headerScrollPendingY = scrollY;

            if (this.headerScrollSyncFrame > 0) {
                return;
            }

            this.headerScrollSyncFrame = window.requestAnimationFrame(() => {
                this.headerScrollSyncFrame = 0;
                const pendingY = Math.max(0, this.headerScrollPendingY || 0);
                const compactThreshold = this.scrolled
                    ? HEADER_SCROLL_COMPACT_EXIT_PX
                    : HEADER_SCROLL_COMPACT_ENTER_PX;
                const nextScrolled = pendingY > compactThreshold;
                const rawProgress = Math.min(1, pendingY / HEADER_SCROLL_PROGRESS_RANGE_PX);
                const nextProgress = this.headerMotionLowPerformance
                    ? (nextScrolled ? 1 : 0)
                    : quantizeHeaderProgress(rawProgress, this.headerScrollProgressPrecision);
                const progressUnchanged = Math.abs(nextProgress - headerScrollAnimationState.progress) < HEADER_SCROLL_PROGRESS_EPSILON;

                if (progressUnchanged && nextScrolled === this.scrolled) {
                    return;
                }

                this.setHeaderScrollProgress(nextProgress, nextScrolled);
            });
        },
        handleResize() {
            this.homeLatestViewportWidth = Number.isFinite(window.innerWidth)
                ? window.innerWidth
                : this.homeLatestViewportWidth;

            if (window.innerWidth >= 1024) {
                this.menuOpen = false;
            }

            if (this.homeLatestCarouselOffset > this.homeLatestMaxOffset) {
                this.homeLatestCarouselOffset = this.homeLatestMaxOffset;
            }
            this.prefetchHomeLatestVisibleHostCities();

            this.closeAllDropdowns({ immediate: true });
            this.updateSegmentedIndicators();
            this.refreshThreadBackground(true);

            if (this.gitView === 'graph') {
                this.renderGitGraph(true);
            }

            this.syncScrollState();
            this.syncHeaderSearchTabsGeometry();
        }
    }
}).mount('#app-shell');

if (appRoot) {
    appRoot.removeAttribute('v-cloak');
}
