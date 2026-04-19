import { compile, createApp, nextTick } from '/assets/vendor/vue.esm-browser.prod.js';

let gitgraphLoader = null;
const DROPDOWN_SELECTOR = 'details.repo_menu, details.locale_menu, details.header_search_field';
const dropdownTimers = new WeakMap();
const dropdownFrames = new WeakMap();
const DROPDOWN_CLOSE_DELAY_MS = 90;
let dropdownIdSequence = 0;
const GIT_GRAPH_COLORS = ['#111114', '#2F5AA8', '#8A5A20', '#0F766E', '#8B3D60', '#5B6B2D'];
const GIT_GRAPH_FALLBACK_EDGE_GUTTER_PX = 84;
const GIT_GRAPH_LABEL_OFFSET_PX = 18;
const GIT_GRAPH_MIN_CONTENT_WIDTH_PX = 360;
const METRIC_ANIMATION_DURATION_MS = 2200;
const NOTIFICATION_LIMIT = 4;
const NOTIFICATION_LIFETIME_MS = 7000;
const HEADER_SCROLL_PROGRESS_DISTANCE_PX = 320;
const HEADER_SCROLL_SPRING_STIFFNESS = 155;
const HEADER_SCROLL_SPRING_DAMPING = 31;
const HEADER_SCROLL_MAX_STEP_SECONDS = 0.028;
const HEADER_COMPACT_ENTER_PROGRESS = 0.84;
const HEADER_COMPACT_EXIT_PROGRESS = 0.68;
const HEADER_SCROLL_SETTLE_VELOCITY = 0.0008;
const HEADER_SCROLL_SETTLE_DISTANCE = 0.0012;
const HEADER_SEARCH_CITY_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const HEADER_SEARCH_PET_ENDPOINTS = ['/api/pets/choices', '/api/pets/choices.json', '/assets/data/pet-choices.json'];
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
const headerScrollAnimationState = {
    progress: 0,
    target: 0,
    velocity: 0,
    lastFrameTime: 0,
    rafId: 0,
    appliedProgress: Number.NaN
};
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
        handleScroll: null,
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
    state.handleScroll = () => {
        scheduleRender(false);
    };
    state.handleLoad = () => {
        scheduleRender(true);
    };

    window.addEventListener('orientationchange', state.handleOrientationChange, { passive: true });
    window.addEventListener('scroll', state.handleScroll, { passive: true });
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
            if (state.handleScroll) {
                window.removeEventListener('scroll', state.handleScroll);
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

function buildDateCalendarDays({
    year,
    month,
    rangeStart = '',
    rangeEnd = '',
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

        const countryCode = normalizeCountryCode(source.country_code);
        const countryName = typeof source.country === 'string' && source.country.trim()
            ? source.country.trim()
            : resolveCountryName(countryCode, locale);
        const regionName = typeof source.admin1 === 'string' ? source.admin1.trim() : '';
        const fallbackFlagPath = countryCode
            ? `/assets/media/country-flag/${countryCodeToFlagFileName(countryCode)}`
            : '';
        const locationId = [
            cityName,
            regionName,
            countryCode,
            Number.isFinite(Number(source.latitude)) ? Number(source.latitude).toFixed(3) : '',
            Number.isFinite(Number(source.longitude)) ? Number(source.longitude).toFixed(3) : ''
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
            flagPath: fallbackFlagPath,
            label,
            searchName
        });
        seen.add(locationId);
    });

    return normalized.slice(0, 60);
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

async function fetchFirstJsonPayload(urls = []) {
    for (const url of urls) {
        try {
            const response = await fetch(url, {
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
const localizedPlaywrightLoadingLabel = playwrightRunnerRoot?.getAttribute('data-loading-text') || 'Playwright tests are running...';
const localizedPlaywrightNotificationTitle = playwrightRunnerRoot?.getAttribute('data-notification-title') || 'Playwright tests completed';
const localizedPlaywrightStatusRequestFailed = playwrightRunnerRoot?.getAttribute('data-status-request-failed') || 'Playwright status request failed.';
const localizedPlaywrightRunRequestFailed = playwrightRunnerRoot?.getAttribute('data-run-request-failed') || 'Playwright run request failed.';
const localizedHeaderSearchStrings = {
    destinationDescription: headerSearchRoot?.dataset.destinationDescription || 'Vermietungsorte suchen',
    destinationCompactEmpty: headerSearchRoot?.dataset.destinationCompactEmpty || 'Irgendwo',
    dateDescription: headerSearchRoot?.dataset.dateDescription || 'Datum hinzufügen',
    dateCompactEmpty: headerSearchRoot?.dataset.dateCompactEmpty || 'Jederzeit',
    petDescription: headerSearchRoot?.dataset.petDescription || 'Haustiere',
    petCompactEmpty: headerSearchRoot?.dataset.petCompactEmpty || 'Gäste hinzufügen',
    destinationNoResults: headerSearchRoot?.dataset.destinationNoResults || 'Keine Städte gefunden',
    destinationLoading: headerSearchRoot?.dataset.destinationLoading || 'Städte werden geladen',
    petLoading: headerSearchRoot?.dataset.petLoading || 'Haustiere werden geladen',
    petEmpty: headerSearchRoot?.dataset.petEmpty || 'Keine Haustiere verfügbar'
};

createApp({
    render: appShellRender,
    data() {
        const repository = normalizeRepository(initialRepository);
        const todayDate = new Date();

        return {
            menuOpen: false,
            loginModalOpen: false,
            scrolled: false,
            headerSurfaceElement: null,
            headerSearchInteractionExpanded: false,
            headerSearchStrings: localizedHeaderSearchStrings,
            locationQuery: '',
            selectedLocation: null,
            locationOptions: [],
            locationOptionsLoading: false,
            locationSearchDebounceHandle: null,
            locationSearchAbortController: null,
            locationSearchRequestId: 0,
            dateRangeStart: '',
            dateRangeEnd: '',
            dateCalendarYear: todayDate.getFullYear(),
            dateCalendarMonth: todayDate.getMonth(),
            petChoices: [],
            petChoicesLoading: false,
            petChoiceCounts: {},
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
            notificationCounter: 0,
            notificationTimers: {},
            dropdownQueueHandle: null,
            dropdownQueuedTargetId: ''
        };
    },
    computed: {
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
            return this.scrolled && !this.headerSearchInteractionExpanded;
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
            return buildDateCalendarDays({
                year: this.dateCalendarYear,
                month: this.dateCalendarMonth,
                rangeStart: this.dateRangeStart,
                rangeEnd: this.dateRangeEnd,
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
    watch: {
        locationQuery(nextValue) {
            this.scheduleLocationSearch(nextValue);
        }
    },
    mounted() {
        this.headerSurfaceElement = document.querySelector('#site-shell-header .header_surface');
        this.initializeHeaderSearch();
        this.initializeRepositoryViews();
        this.initializeDropdowns();
        this.initializeThreadBackground();
        this.ensureRepositoryState();
        this.syncScrollState();
        this.handleResize();
        this.animateVisibleMetricGroups({ fromZero: true });
        this.refreshRepositoryData();
        this.initializePlaywrightRunner();
        window.addEventListener('scroll', this.syncScrollState, { passive: true });
        window.addEventListener('resize', this.handleResize, { passive: true });
        document.addEventListener('pointerdown', this.handleDocumentPointerDown);
        document.addEventListener('click', this.handleDocumentClick);
        document.addEventListener('keydown', this.handleDocumentKeydown);
        this.patchLegacyLoginLinks();
    },
    beforeUnmount() {
        window.removeEventListener('scroll', this.syncScrollState);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('keydown', this.handleDocumentKeydown);
        this.clearDropdownQueue();
        this.closeAllDropdowns({ immediate: true });
        this.destroyThreadBackground();
        this.stopPlaywrightPolling();
        this.stopAllMetricAnimations();
        this.clearNotificationTimers();
        this.clearLocationSearchRuntime();
        if (typeof headerScrollAnimationState.rafId === 'number' && headerScrollAnimationState.rafId > 0) {
            window.cancelAnimationFrame(headerScrollAnimationState.rafId);
        }
        headerScrollAnimationState.rafId = 0;
        headerScrollAnimationState.velocity = 0;
        headerScrollAnimationState.lastFrameTime = 0;
        headerScrollAnimationState.target = 0;
        headerScrollAnimationState.progress = 0;
        headerScrollAnimationState.appliedProgress = Number.NaN;
        this.headerSurfaceElement = null;
        document.body.classList.remove('body--modal-open');
    },
    methods: {
        initializeHeaderSearch() {
            if (!headerSearchRoot) {
                return;
            }

            this.locationOptions = [];
            this.locationOptionsLoading = false;
            this.syncDateCalendarView(this.dateRangeStart || this.dateRangeEnd);
            this.loadPetChoices();
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
        syncDateCalendarView(referenceValue = '') {
            const normalizedReference = normalizeDateInputValue(referenceValue);
            const fallbackDate = new Date();
            const viewDate = normalizedReference
                ? parseDateInputValue(normalizedReference)
                : fallbackDate;

            if (!viewDate) {
                return;
            }

            this.dateCalendarYear = viewDate.getFullYear();
            this.dateCalendarMonth = viewDate.getMonth();
        },
        moveDateCalendar(monthOffset) {
            const normalizedOffset = Number(monthOffset);
            if (!Number.isFinite(normalizedOffset) || normalizedOffset === 0) {
                return;
            }

            const nextViewDate = new Date(
                this.dateCalendarYear,
                this.dateCalendarMonth + Math.trunc(normalizedOffset),
                1
            );
            this.dateCalendarYear = nextViewDate.getFullYear();
            this.dateCalendarMonth = nextViewDate.getMonth();
        },
        selectDateCalendarDay(day) {
            const selectedDateValue = normalizeDateInputValue(day?.iso);
            if (!selectedDateValue) {
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
            const normalizedStart = normalizeDateInputValue(value);
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
            const normalizedEnd = normalizeDateInputValue(value);
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
        pushNotification({ title = '', message = '', tone = 'info', lifetimeMs = NOTIFICATION_LIFETIME_MS } = {}) {
            const trimmedTitle = typeof title === 'string' ? title.trim() : '';
            const trimmedMessage = typeof message === 'string' ? message.trim() : '';

            if (!trimmedTitle && !trimmedMessage) {
                return;
            }

            this.notificationCounter += 1;
            const id = this.notificationCounter;
            const nextNotification = {
                id,
                title: trimmedTitle,
                message: trimmedMessage,
                tone
            };

            this.notifications = [...this.notifications, nextNotification].slice(-NOTIFICATION_LIMIT);

            if (Number.isFinite(lifetimeMs) && lifetimeMs > 0) {
                const timerId = window.setTimeout(() => {
                    this.removeNotification(id);
                }, lifetimeMs);
                this.notificationTimers[id] = timerId;
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
                const response = await fetch('/api/tests/e2e/run', {
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
        openLoginModal() {
            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.activeGitCommitModalHash = '';
            this.activeBoardCardKey = '';
            this.loginModalOpen = true;
            this.syncModalBodyLock();
        },
        openLoginModalFromMenu() {
            this.menuOpen = false;
            this.openLoginModal();
        },
        closeLoginModal() {
            if (!this.loginModalOpen) {
                return;
            }

            this.loginModalOpen = false;
            this.syncModalBodyLock();
        },
        syncModalBodyLock() {
            document.body.classList.toggle(
                'body--modal-open',
                Boolean(this.loginModalOpen || this.activeGitCommitModalHash || this.activeBoardCardKey)
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
            details.open = true;
            this.setDropdownExpanded(details, true);
            if (this.isHeaderSearchDropdown(details)) {
                this.setHeaderSearchInteractionExpanded(true);
            }

            const frameIds = [];
            const firstFrame = window.requestAnimationFrame(() => {
                const secondFrame = window.requestAnimationFrame(() => {
                    details.classList.add('is-open');
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
        toggleDropdown(details, options = {}) {
            if (!details) {
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
            if (this.getOpenDropdowns({ exclude: details }).length) {
                if (immediateSwitch) {
                    this.closeAllDropdowns({ exclude: details, immediate: true });
                    this.clearDropdownQueue();
                    this.performDropdownOpen(details);
                    return;
                }

                this.closeAllDropdowns({ exclude: details, preserveQueue: true });
                this.scheduleDropdownOpen(details);
                return;
            }

            this.clearDropdownQueue();
            this.performDropdownOpen(details);
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
                labelLayer.style.removeProperty('width');
                labelLayer.style.removeProperty('min-width');
            }
        },
        renderCustomGitBranchLabels() {
            const container = this.getGitGraphContainer();
            const panel = this.getGitGraphPanel();
            const labelLayer = document.querySelector('[data-git-branch-labels]');
            if (!container || !panel || !labelLayer) {
                return;
            }

            labelLayer.innerHTML = '';

            const branches = this.repository.git.branches
                .filter((branch) => typeof branch?.name === 'string' && branch.name.trim() && typeof branch?.hash === 'string' && branch.hash.trim());
            if (!branches.length) {
                return;
            }

            const labelLayerRect = labelLayer.getBoundingClientRect();
            const labelOffset = GIT_GRAPH_LABEL_OFFSET_PX;

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
            });

            this.syncGitGraphHorizontalSpace({
                viewportWidth: this.getGitGraphViewportWidth()
            });
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
            this.menuOpen = false;
            this.closeAllDropdowns({ immediate: true });
            this.loginModalOpen = false;
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

                    this.syncGitGraphPanelHeight();
                    this.renderCustomGitBranchLabels();
                    this.syncGitGraphHorizontalSpace({
                        viewportWidth
                    });
                    this.centerGitGraphOnTopAnchor();
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

            this.refreshThreadBackground();
        },
        applyHeaderSurfaceScrollProgress(progressValue = headerScrollAnimationState.progress) {
            const numericValue = Number(progressValue);
            const clamped = Number.isFinite(numericValue)
                ? Math.min(1, Math.max(0, numericValue))
                : 0;
            const effectiveProgress = this.headerSearchInteractionExpanded ? 0 : clamped;
            if (Math.abs(effectiveProgress - headerScrollAnimationState.appliedProgress) < 0.0005) {
                return;
            }
            const surfaceElement = this.headerSurfaceElement || document.querySelector('#site-shell-header .header_surface');
            if (!surfaceElement) {
                return;
            }

            this.headerSurfaceElement = surfaceElement;
            headerScrollAnimationState.appliedProgress = effectiveProgress;
            surfaceElement.style.setProperty('--header-scroll-progress', effectiveProgress.toFixed(4));
        },
        setHeaderScrollProgress(value) {
            const numericValue = Number(value);
            const clamped = Number.isFinite(numericValue)
                ? Math.min(1, Math.max(0, numericValue))
                : 0;

            headerScrollAnimationState.progress = clamped;
            if (this.scrolled) {
                if (clamped <= HEADER_COMPACT_EXIT_PROGRESS) {
                    this.scrolled = false;
                }
            } else if (clamped >= HEADER_COMPACT_ENTER_PROGRESS) {
                this.scrolled = true;
            }

            this.applyHeaderSurfaceScrollProgress(clamped);
        },
        animateHeaderScrollProgress() {
            if (typeof headerScrollAnimationState.rafId === 'number' && headerScrollAnimationState.rafId > 0) {
                return;
            }

            const step = (timestamp) => {
                const frameTime = Number(timestamp);
                const previousFrameTime = headerScrollAnimationState.lastFrameTime || frameTime;
                const elapsedSeconds = Math.max(
                    1 / 240,
                    Math.min(
                        HEADER_SCROLL_MAX_STEP_SECONDS,
                        (frameTime - previousFrameTime) / 1000
                    )
                );
                headerScrollAnimationState.lastFrameTime = frameTime;

                const displacement = headerScrollAnimationState.target - headerScrollAnimationState.progress;
                const acceleration = (displacement * HEADER_SCROLL_SPRING_STIFFNESS)
                    - (headerScrollAnimationState.velocity * HEADER_SCROLL_SPRING_DAMPING);
                headerScrollAnimationState.velocity += acceleration * elapsedSeconds;
                this.setHeaderScrollProgress(headerScrollAnimationState.progress + (headerScrollAnimationState.velocity * elapsedSeconds));

                const settled = Math.abs(headerScrollAnimationState.velocity) <= HEADER_SCROLL_SETTLE_VELOCITY
                    && Math.abs(headerScrollAnimationState.target - headerScrollAnimationState.progress) <= HEADER_SCROLL_SETTLE_DISTANCE;
                if (settled) {
                    this.setHeaderScrollProgress(headerScrollAnimationState.target);
                    headerScrollAnimationState.velocity = 0;
                    headerScrollAnimationState.lastFrameTime = 0;
                    headerScrollAnimationState.rafId = 0;
                    return;
                }

                headerScrollAnimationState.rafId = window.requestAnimationFrame(step);
            };

            headerScrollAnimationState.rafId = window.requestAnimationFrame(step);
        },
        syncScrollState() {
            const scrollY = Math.max(0, window.scrollY || 0);
            const rawProgress = Math.min(1, scrollY / HEADER_SCROLL_PROGRESS_DISTANCE_PX);
            const easedProgress = rawProgress * rawProgress * rawProgress
                * ((rawProgress * ((rawProgress * 6) - 15)) + 10);
            headerScrollAnimationState.target = easedProgress;
            this.animateHeaderScrollProgress();
        },
        handleResize() {
            if (window.innerWidth >= 1024) {
                this.menuOpen = false;
            }

            this.closeAllDropdowns({ immediate: true });
            this.updateSegmentedIndicators();
            this.refreshThreadBackground(true);

            if (this.gitView === 'graph') {
                this.renderGitGraph(true);
            }

            this.syncScrollState();
        }
    }
}).mount('#app-shell');

if (appRoot) {
    appRoot.removeAttribute('v-cloak');
}
