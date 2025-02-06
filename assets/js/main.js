const canvas = document.getElementById('animationCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function isDesktop() {
        return window.innerWidth > 768;
    }

    let centerX = canvas.width / 2;
    let centerY = isDesktop() ? canvas.height / 2 : canvas.height * 2 / 5;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        centerX = canvas.width / 2;
        centerY = canvas.height / 2;
    });

    const numStars = isDesktop() ? 200 : 100;
    const stars = [];

    const CONSTELLATION_DURATION = 4000;
    const CONSTELLATION_FADE_TIME = 2000;
    const MIN_STARS_IN_CONSTELLATION = 3;
    const MAX_STARS_IN_CONSTELLATION = 5;

    const NEARBY_DISTANCE = isDesktop() ? 0.025 : 0.05;

    const MIN_ORBIT_FACTOR = isDesktop() ? 0.1 : 0.4;
    const MAX_ORBIT_FACTOR = isDesktop() ? 0.5 : 0.8;

    const MARGIN = 50;

    const possibleSentiments = [
        "Bullish momentum amid\ncautious optimism",
        "Volatility sparks strategic\ntrading decisions",
        "Market recovery fuels\noptimistic investor sentiment",
        "Steady trends encourage\ntactical investment moves",
        "Mixed signals challenge\ntrading strategies",
        "Positive indicators boost\nmarket confidence",
        "Balanced risk management\ndrives market activity",
        "Resilient sentiment in\nfluctuating markets",
        "Cautious buying amid\neconomic recovery hints",
        "Steady growth inspires\nstrategic positioning",
        "Dynamic markets demand\nagile decision-making",
        "Investor optimism clashes\nwith market uncertainty",
        "Evolving trends influence\ninvestment approaches",
        "Tactical adjustments reflect\nmarket sentiment",
        "Technical analysis guides\nmarket movements",
        "Quiet confidence shapes\ntrading behavior",
        "Risk and reward balance\nmarket activity",
        "Positive outlook amid\nongoing market fluctuations",
        "Intraday trends spark\ntactical responses",
        "Strategic shifts reflect\nchanging market dynamics"
    ];

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    class Star {
        constructor() {
            this.orbitRadius = random(
                canvas.width * MIN_ORBIT_FACTOR,
                canvas.width * MAX_ORBIT_FACTOR
            );
            this.angle = random(0, Math.PI * 2);
            this.speed = random(0.0001, 0.0002);

            // Individual blinking for each star
            this.blinkOffset = random(0, 2 * Math.PI);
            this.blinkSpeed = random(1, 3);

            this.x = 0;
            this.y = 0;
            this.updatePosition();
        }
        updatePosition() {
            this.x = centerX + this.orbitRadius * Math.cos(this.angle);
            this.y = centerY + this.orbitRadius * Math.sin(this.angle);
        }
        update() {
            this.angle += this.speed;
            this.updatePosition();
        }
        draw() {
            const currentTime = performance.now() / 1000;
            const flicker = 0.5 + 0.5 * Math.sin(currentTime * this.blinkSpeed + this.blinkOffset);
            const alpha = 0.3 + 0.7 * flicker;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = `hsla(${random(0, 360)}, 100%, 80%, ${alpha})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
    }

    let activeConstellation = null;

    function createNewConstellation() {
        const thresholdX = canvas.width / 2;

        let validStars = stars
            .map((star, idx) => ({ star, idx }))
            .filter(({ star }) =>
                star.x > MARGIN &&
                star.x < canvas.width - MARGIN &&
                star.y > MARGIN &&
                star.y < canvas.height - MARGIN
            );

        if (isDesktop()) {
            validStars = validStars.filter(({ star }) => star.x > thresholdX);
        }

        if (validStars.length === 0) {
            validStars = stars.map((star, idx) => ({ star, idx }));
        }

        const MAX_TRIES = 10;
        for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
            const { star: centerStar, idx: centerIndex } =
                validStars[Math.floor(Math.random() * validStars.length)];

            const maxDist = canvas.width * NEARBY_DISTANCE;
            const closeStars = [];
            for (let i = 0; i < stars.length; i++) {
                if (i === centerIndex) continue;
                const dx = stars[i].x - centerStar.x;
                const dy = stars[i].y - centerStar.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= maxDist) {
                    closeStars.push(stars[i]);
                }
            }

            shuffleArray(closeStars);

            const needed = MIN_STARS_IN_CONSTELLATION - 1;
            if (closeStars.length < needed) {
                continue;
            }

            const maxPick = Math.min(closeStars.length, MAX_STARS_IN_CONSTELLATION - 1);
            const numberToPick = randomInt(needed, maxPick);
            const chosenStars = closeStars.slice(0, numberToPick);

            const constellationStars = [centerStar, ...chosenStars];

            const lines = [];
            for (let i = 0; i < constellationStars.length; i++) {
                const j = (i + 1) % constellationStars.length;
                lines.push({
                    s1: constellationStars[i],
                    s2: constellationStars[j],
                    blinkOffset: random(0, 2 * Math.PI),
                });
            }

            const sentimentText = possibleSentiments[
                randomInt(0, possibleSentiments.length - 1)
            ];

            const sentimentBlinkOffset = random(0, 2 * Math.PI);
            const sentimentBlinkSpeed = random(1, 3);

            if (isConstellationOnScreen(constellationStars)) {
                return {
                    lines,
                    createdAt: performance.now(),
                    sentimentText,
                    sentimentBlinkOffset,
                    sentimentBlinkSpeed,
                    stars: constellationStars
                };
            }
        }
        return null;
    }

    function isConstellationOnScreen(starArray) {
        for (let s of starArray) {
            if (
                s.x < 0 + MARGIN ||
                s.x > canvas.width - MARGIN ||
                s.y < 0 + MARGIN ||
                s.y > canvas.height - MARGIN
            ) {
                return false;
            }
        }
        return true;
    }

    function animateGalaxy() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let star of stars) {
            star.update();
            star.draw();
        }

        const now = performance.now();
        if (activeConstellation) {
            const t = now - activeConstellation.createdAt;
            const alpha = getConstellationAlpha(t);
            if (alpha > 0) {
                drawConstellation(activeConstellation, alpha);
            } else {
                activeConstellation = createNewConstellation();
            }
        } else {
            activeConstellation = createNewConstellation();
        }

        requestAnimationFrame(animateGalaxy);
    }

    function getConstellationAlpha(t) {
        if (t >= CONSTELLATION_DURATION) {
            return 0;
        }
        const fadeStart = CONSTELLATION_DURATION - CONSTELLATION_FADE_TIME;
        if (t <= fadeStart) {
            return 1;
        }
        const fadeProgress = (t - fadeStart) / CONSTELLATION_FADE_TIME;
        return 1 - fadeProgress;
    }

    function drawConstellation(constellation, alpha) {
        const currentTime = performance.now() / 1000;

        for (let lineObj of constellation.lines) {
            const flicker = 0.5 + 0.5 * Math.sin(currentTime * 2.0 + lineObj.blinkOffset);
            const dynamicAlpha = alpha * (0.2 + 0.7 * flicker);

            ctx.save();
            ctx.strokeStyle = `hsla(180, 100%, 80%, ${dynamicAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(lineObj.s1.x, lineObj.s1.y);
            ctx.lineTo(lineObj.s2.x, lineObj.s2.y);
            ctx.stroke();
            ctx.restore();
        }

        let xSum = 0, ySum = 0;
        for (let star of constellation.stars) {
            xSum += star.x;
            ySum += star.y;
        }
        const nStars = constellation.stars.length;
        const centroidX = xSum / nStars;
        const centroidY = ySum / nStars;

        const textBlink = 0.75 + 0.25 * Math.sin(
            currentTime * constellation.sentimentBlinkSpeed +
            constellation.sentimentBlinkOffset
        );

        ctx.save();
        ctx.globalAlpha = alpha * textBlink * 0.9;

        function drawMultilineText(ctx, text, x, y, lineHeight) {
            const lines = text.split('\n');
            lines.forEach((line, index) => {
                ctx.fillText(line, x, y + index * lineHeight);
            });
        }

        ctx.font = isDesktop() ? "14px 'Roboto', sans-serif" : "10px 'Roboto', sans-serif";
        ctx.fillStyle = "#00FFC8";
        ctx.shadowColor = '#00FFC8';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        drawMultilineText(ctx, constellation.sentimentText, centroidX, centroidY - 50, 18);

        ctx.shadowBlur = 20;
        drawMultilineText(ctx, constellation.sentimentText, centroidX, centroidY - 50, 18);
        ctx.shadowBlur = 0;
        drawMultilineText(ctx, constellation.sentimentText, centroidX, centroidY - 50, 18);

        ctx.restore();
    }

    animateGalaxy();

    const blockHeightElement = document.getElementById('blockHeight');
    if (blockHeightElement) {
        fetch('https://api.sentichain.com/blockchain/get_chain_length?network=mainnet')
            .then((res) => res.json())
            .then((data) => {
                const targetCount = data.chain_length;
                let currentCount = Math.max(targetCount - 20, 0);
                blockHeightElement.textContent = currentCount;
                const increment = () => {
                    if (currentCount < targetCount) {
                        currentCount++;
                        blockHeightElement.textContent = currentCount;
                        requestAnimationFrame(increment);
                    } else {
                        blockHeightElement.textContent = targetCount;
                    }
                };
                increment();
            })
            .catch((err) => {
                blockHeightElement.textContent = 'N/A';
                console.error(err);
            });
    }

    const blockTimeElement = document.getElementById('blockTime');
    const timeElapsedElement = document.getElementById('timeElapsed');
    if (blockTimeElement && timeElapsedElement) {
        fetch('https://api.sentichain.com/blockchain/get_last_block_time?network=mainnet')
            .then((res) => res.json())
            .then((data) => {
                const timestamp = data.last_block_time;
                if (timestamp && !isNaN(timestamp)) {
                    const date = new Date(timestamp * 1000);
                    const year = date.getUTCFullYear();
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    const hours = String(date.getUTCHours()).padStart(2, '0');
                    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                    const secs = String(date.getUTCSeconds()).padStart(2, '0');

                    blockTimeElement.textContent = `${year}-${month}-${day} ${hours}:${minutes}:${secs} (UTC)`;

                    let nowSec = Date.now() / 1000;
                    let elapsed = Math.round(nowSec - timestamp);
                    if (elapsed < 0) elapsed = 0;

                    timeElapsedElement.textContent = `${elapsed}s`;

                    setInterval(() => {
                        elapsed++;
                        timeElapsedElement.textContent = `${elapsed}s`;
                    }, 1000);
                } else {
                    blockTimeElement.textContent = 'N/A';
                    timeElapsedElement.textContent = 'N/A';
                }
            })
            .catch((err) => {
                blockTimeElement.textContent = 'N/A';
                timeElapsedElement.textContent = 'N/A';
                console.error(err);
            });
    }

    const txnCountElement = document.getElementById('txnCount');
    if (txnCountElement) {
        fetch(
            'https://api.sentichain.com/blockchain/get_total_number_of_transactions?network=mainnet'
        )
            .then((res) => res.json())
            .then((data) => {
                const targetCount = data.total_tx_count;
                let currentCount = Math.max(targetCount - 20, 0);
                txnCountElement.textContent = currentCount;
                const increment = () => {
                    if (currentCount < targetCount) {
                        currentCount++;
                        txnCountElement.textContent = currentCount;
                        requestAnimationFrame(increment);
                    } else {
                        txnCountElement.textContent = targetCount;
                    }
                };
                increment();
            })
            .catch((err) => {
                txnCountElement.textContent = 'N/A';
                console.error(err);
            });
    }
}

function openTab(evt, tabName) {
    const tablinks = document.querySelectorAll('.tablinks');
    tablinks.forEach((tab) => tab.classList.remove('active'));
    const tabcontents = document.querySelectorAll('.tabcontent');
    tabcontents.forEach((content) => (content.style.display = 'none'));
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');

    if (tabName === 'EventMap') {
        reflowEventMapCanvas();
    }
}

function copyToClipboard(elementId) {
    let text = '';
    const element = document.getElementById(elementId);
    if (element) text = element.innerText;
    navigator.clipboard
        .writeText(text)
        .then(() => {
            let feedbackId;
            if (elementId.startsWith('block')) {
                const suffix = elementId.replace('block', '');
                feedbackId =
                    'copyFeedback' + suffix.charAt(0).toUpperCase() + suffix.slice(1);
            } else if (elementId.startsWith('transaction')) {
                const suffix = elementId.replace(/transaction[A-Z][a-z]+_/, '');
                const prefix = elementId.match(/transaction([A-Za-z]+)/)[1];
                feedbackId =
                    'copyFeedback' +
                    prefix.charAt(0).toUpperCase() +
                    prefix.slice(1) +
                    '_' +
                    suffix;
            } else {
                feedbackId = 'copyFeedback' + elementId.replace('Output', '');
            }

            const feedback = document.getElementById(feedbackId);
            if (feedback) {
                feedback.classList.add('show');
                setTimeout(() => {
                    feedback.classList.remove('show');
                }, 2000);
            }

            if (element) {
                const originalColor = element.style.backgroundColor;
                element.style.backgroundColor = '#00FFC8';
                setTimeout(() => {
                    element.style.backgroundColor = originalColor;
                }, 500);
            }
        })
        .catch((err) => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy the content. Please try manually.');
        });
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

function doBlockExplorerFetch(network, blockNumber, apiKey) {
    const resultDiv = document.getElementById('blockExplorerResult');
    const processingMessage = document.getElementById('blockProcessingMessage');
    const blockInfoDiv = document.getElementById('blockInfo');
    const blockHashSpan = document.getElementById('blockHash');
    const blockNumberInfoSpan = document.getElementById('blockNumberInfo');
    const blockTimestampSpan = document.getElementById('blockTimestamp');
    const blockTransactionsDiv = document.getElementById('blockTransactions');
    const blockConsensusRootSpan = document.getElementById('blockConsensusRoot');
    const blockPreviousHashSpan = document.getElementById('blockPreviousHash');
    const blockValidatorSpan = document.getElementById('blockValidator');
    const blockErrorMessageDiv = document.getElementById('blockErrorMessage');
    const transactionsTableBody = document.querySelector('#transactionsTable tbody');

    resultDiv.classList.remove('error');
    processingMessage.style.display = 'none';
    blockInfoDiv.style.display = 'none';
    blockErrorMessageDiv.style.display = 'none';
    blockHashSpan.innerText = '';
    blockNumberInfoSpan.innerText = '';
    blockTimestampSpan.innerText = '';
    blockConsensusRootSpan.innerText = '';
    blockPreviousHashSpan.innerText = '';
    blockValidatorSpan.innerText = '';
    transactionsTableBody.innerHTML = '';
    blockTransactionsDiv.style.display = 'none';

    if (!network) {
        blockErrorMessageDiv.innerText = 'Please select a network.';
        blockErrorMessageDiv.style.display = 'block';
        resultDiv.style.display = 'block';
        return;
    }
    if (blockNumber === '' || isNaN(blockNumber) || parseInt(blockNumber) < 0) {
        blockErrorMessageDiv.innerText = 'Please enter a valid block number.';
        blockErrorMessageDiv.style.display = 'block';
        resultDiv.style.display = 'block';
        return;
    }

    processingMessage.style.display = 'block';
    resultDiv.style.display = 'block';

    let GET_BLOCK_BY_NUMBER_URL = `https://api.sentichain.com/blockchain/get_block_by_number?network=${encodeURIComponent(
        network
    )}&block_number=${encodeURIComponent(parseInt(blockNumber))}`;

    if (apiKey) {
        GET_BLOCK_BY_NUMBER_URL += `&api_key=${encodeURIComponent(apiKey)}`;
    }
    fetch(GET_BLOCK_BY_NUMBER_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => {
            if (response.status === 404) {
                throw new Error('Block not found.');
            }
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            if (!('block' in data)) {
                throw new Error('Missing "block" data in response.');
            }
            const block = data.block;
            const requiredFields = [
                'block_number',
                'consensus_root',
                'hash',
                'previous_hash',
                'timestamp',
                'validator',
            ];
            for (let field of requiredFields) {
                if (!(field in block)) {
                    throw new Error(`Missing field in response: ${field}`);
                }
            }

            blockNumberInfoSpan.innerText = block.block_number;
            blockHashSpan.innerText = block.hash;
            blockPreviousHashSpan.innerText = block.previous_hash;
            blockConsensusRootSpan.innerText = block.consensus_root;
            blockTimestampSpan.innerText = formatTimestamp(block.timestamp);
            blockValidatorSpan.innerText = block.validator;

            if ('transactions' in block) {
                const transactions = block.transactions;
                for (let txHash in transactions) {
                    if (transactions.hasOwnProperty(txHash)) {
                        const tx = transactions[txHash];
                        const row = document.createElement('tr');

                        const txHashCell = document.createElement('td');
                        txHashCell.innerText = txHash;
                        row.appendChild(txHashCell);

                        const timestampCell = document.createElement('td');
                        timestampCell.innerText = formatTimestamp(tx.post_timestamp);
                        row.appendChild(timestampCell);

                        const actionsCell = document.createElement('td');
                        const toggleDetailsBtn = document.createElement('button');
                        toggleDetailsBtn.innerText = 'View Details';
                        toggleDetailsBtn.classList.add('submit-btn');

                        const detailsRow = document.createElement('tr');
                        detailsRow.style.display = 'none';
                        detailsRow.classList.add('details-row');
                        const detailsCell = document.createElement('td');
                        detailsCell.colSpan = 3;

                        function serializeVector(vec) {
                            return `[${vec
                                .map((n) => (Number.isInteger(n) ? n.toFixed(1) : n))
                                .join(', ')}]`;
                        }
                        const serializedVector = serializeVector(tx.vector);

                        const sanitizedTxHash = txHash.replace(/[^a-zA-Z0-9]/g, '_');
                        const vectorId = `transactionVector_${sanitizedTxHash}`;
                        const signatureId = `transactionSignature_${sanitizedTxHash}`;
                        const postContentId = `transactionPostContent_${sanitizedTxHash}`;
                        const publicKeyId = `transactionPublicKey_${sanitizedTxHash}`;
                        const vectorSignatureId = `transactionVectorSignature_${sanitizedTxHash}`;

                        const copyFeedbackVectorId = `copyFeedbackVector_${sanitizedTxHash}`;
                        const copyFeedbackSignatureId = `copyFeedbackSignature_${sanitizedTxHash}`;
                        const copyFeedbackPostContentId = `copyFeedbackPostContent_${sanitizedTxHash}`;
                        const copyFeedbackPublicKeyId = `copyFeedbackPublicKey_${sanitizedTxHash}`;
                        const copyFeedbackVectorSignatureId = `copyFeedbackVectorSignature_${sanitizedTxHash}`;

                        detailsCell.innerHTML = `
                            <table class="details-table">
                                <tr>
                                    <td><strong>Nonce:</strong> ${tx.nonce}</td>
                                </tr>
                                <tr>
                                    <td><strong>Post Content:</strong>
                                        <div
                                            class="copyable-output"
                                            id="${postContentId}"
                                            onclick="copyToClipboard('${postContentId}')"
                                            title="Click to copy"
                                        >
                                            ${tx.post_content}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Post Link:</strong>
                                        <a href="https://x.com/${tx.post_link}" target="_blank">
                                            View Post
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Sender:</strong> ${tx.sender}</td>
                                </tr>
                                <tr>
                                    <td><strong>Signature:</strong>
                                        <div
                                            class="signature-output"
                                            id="${signatureId}"
                                            onclick="copyToClipboard('${signatureId}')"
                                            title="Click to copy"
                                        >
                                            ${tx.signature}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Vector:</strong>
                                        <div
                                            class="copyable-output"
                                            id="${vectorId}"
                                            onclick="copyToClipboard('${vectorId}')"
                                            title="Click to copy"
                                        >
                                            ${serializedVector}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Public Key:</strong>
                                        <div
                                            class="copyable-output"
                                            id="${publicKeyId}"
                                            onclick="copyToClipboard('${publicKeyId}')"
                                            title="Click to copy"
                                        >
                                            ${tx.public_key}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Vector Signature:</strong>
                                        <div
                                            class="copyable-output"
                                            id="${vectorSignatureId}"
                                            onclick="copyToClipboard('${vectorSignatureId}')"
                                            title="Click to copy"
                                        >
                                            ${tx.vector_signature}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <div class="copy-feedback" id="${copyFeedbackVectorId}">Copied!</div>
                            <div class="copy-feedback" id="${copyFeedbackSignatureId}">Copied!</div>
                            <div class="copy-feedback" id="${copyFeedbackPostContentId}">Copied!</div>
                            <div class="copy-feedback" id="${copyFeedbackPublicKeyId}">Copied!</div>
                            <div class="copy-feedback" id="${copyFeedbackVectorSignatureId}">Copied!</div>
                        `;
                        detailsRow.appendChild(detailsCell);

                        toggleDetailsBtn.onclick = () => {
                            if (detailsRow.style.display === 'none') {
                                detailsRow.style.display = 'table-row';
                                toggleDetailsBtn.innerText = 'Hide Details';
                            } else {
                                detailsRow.style.display = 'none';
                                toggleDetailsBtn.innerText = 'View Details';
                            }
                        };

                        actionsCell.appendChild(toggleDetailsBtn);
                        row.appendChild(actionsCell);
                        transactionsTableBody.appendChild(row);
                        transactionsTableBody.appendChild(detailsRow);
                    }
                }
                if (Object.keys(transactions).length > 0) {
                    blockTransactionsDiv.style.display = 'block';
                }
            } else {
                console.info(
                    'No "transactions" field returned. Possibly invalid or no API key used.'
                );
            }

            processingMessage.style.display = 'none';
            blockInfoDiv.style.display = 'block';
        })
        .catch((error) => {
            console.error('Block Explorer Error:', error);
            resultDiv.classList.add('error');
            blockErrorMessageDiv.innerText = `Error: ${error.message}`;
            blockErrorMessageDiv.style.display = 'block';
            processingMessage.style.display = 'none';
            blockInfoDiv.style.display = 'none';
        });
}

const blockExplorerForm = document.getElementById('blockExplorerForm');
if (blockExplorerForm) {
    blockExplorerForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const networkSelect = document.getElementById('network');
        const blockNumberInput = document.getElementById('blockNumber');
        const apiKeyInput = document.getElementById('apiKey');
        const network = networkSelect.value;
        const blockNumber = blockNumberInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        doBlockExplorerFetch(network, blockNumber, apiKey);
    });
}

const eventMapCanvas = document.getElementById('pointsCanvas');
let isEventMapAnimating = false;

if (eventMapCanvas) {
    const mapProcessingMessage = document.getElementById('mapProcessingMessage');
    const startBlockInput = document.getElementById('startBlockInput');
    const endBlockInput = document.getElementById('endBlockInput');
    const fetchRangeButton = document.getElementById('fetchRangeButton');
    const blockSlider = document.getElementById('blockSlider');
    const autoSlideCheckbox = document.getElementById('autoSlideCheckbox');
    const tooltip = document.getElementById('tooltip');
    const ctxMap = eventMapCanvas.getContext('2d');

    let blockPointsData = {};
    let allPoints = [];
    let clusterInfo = {};
    let allRangePoints = [];
    let availableBlocks = [];

    let currentBlockNumber = 0;

    let minX, maxX, minY, maxY;
    const margin = 50;
    let autoSlideInterval = null;
    let eventMapStartTime = performance.now();

    let userView = { x: 0, y: 0, width: 1, height: 1 };

    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let initViewX = 0;
    let initViewY = 0;

    let pinchMode = false;
    let initialPinchDist = 0;
    let initialPinchCenter = { x: 0, y: 0 };
    let initViewOnPinch = { x: 0, y: 0, width: 1, height: 1 };

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function resizeCanvasToDisplaySize(canvasElem) {
        const width = canvasElem.clientWidth;
        const height = canvasElem.clientHeight;
        if (canvasElem.width !== width || canvasElem.height !== height) {
            canvasElem.width = width;
            canvasElem.height = height || 400;
        }
    }

    function scaleX(xVal) {
        const scale = (eventMapCanvas.width - 2 * margin) / (userView.width || 1);
        return margin + (xVal - userView.x) * scale;
    }

    function scaleY(yVal) {
        const scale = (eventMapCanvas.height - 2 * margin) / (userView.height || 1);
        return eventMapCanvas.height - margin - (yVal - userView.y) * scale;
    }

    function clampUserView() {
        if (userView.width > maxX - minX) {
            userView.width = maxX - minX;
        }
        if (userView.height > maxY - minY) {
            userView.height = maxY - minY;
        }
        if (userView.x < minX) userView.x = minX;
        if (userView.x + userView.width > maxX) {
            userView.x = maxX - userView.width;
        }
        if (userView.y < minY) userView.y = minY;
        if (userView.y + userView.height > maxY) {
            userView.y = maxY - userView.height;
        }
    }

    function buildLinesForCluster(points) {
        if (points.length < 2) return [];
        const lines = [];
        const used = new Set();
        used.add(0);
        const n = points.length;

        const dist = (i, j) => {
            const dx = points[i].x - points[j].x;
            const dy = points[i].y - points[j].y;
            return Math.sqrt(dx * dx + dy * dy);
        };

        while (used.size < n) {
            let bestEdge = null;
            let minDistance = Infinity;
            for (let i of used) {
                for (let j = 0; j < n; j++) {
                    if (!used.has(j)) {
                        const d = dist(i, j);
                        if (d < minDistance) {
                            minDistance = d;
                            bestEdge = [i, j];
                        }
                    }
                }
            }
            if (!bestEdge) break;
            lines.push({
                i: bestEdge[0],
                j: bestEdge[1],
                blinkOffset: randomRange(0, 2 * Math.PI),
            });
            used.add(bestEdge[1]);
        }
        return lines;
    }

    function setupClusterInfo(pointsArray) {
        clusterInfo = {};
        const clusterMap = {};
        pointsArray.forEach((p) => {
            const cNum = p.clusterNumber;
            if (!clusterMap[cNum]) {
                clusterMap[cNum] = [];
            }
            clusterMap[cNum].push(p);
        });

        Object.keys(clusterMap).forEach((cNumStr) => {
            const cNum = parseInt(cNumStr, 10);
            const clusterPoints = clusterMap[cNum];
            const hue = (cNum * 50) % 360;
            const lines = buildLinesForCluster(clusterPoints);

            clusterInfo[cNum] = {
                centroidX: clusterPoints[0].centroidX,
                centroidY: clusterPoints[0].centroidY,
                shortSummary: clusterPoints[0].clusterSummaryShort,
                longSummary: clusterPoints[0].clusterSummaryLong,
                color: `hsl(${hue}, 100%, 50%)`,
                hue,
                points: clusterPoints,
                lines,
            };
        });
    }

    function drawAll() {
        ctxMap.clearRect(0, 0, eventMapCanvas.width, eventMapCanvas.height);
        Object.keys(clusterInfo).forEach((cNum) => {
            drawZodiacLines(clusterInfo[cNum]);
        });
        allPoints.forEach(drawPoint);
        Object.keys(clusterInfo).forEach((cNum) => {
            drawCentroid(clusterInfo[cNum]);
            drawShortSummaryText(clusterInfo[cNum]);
        });
        drawWatermark();
    }

    function drawWatermark() {
        ctxMap.save();
        ctxMap.font = "16px 'Roboto', sans-serif";
        ctxMap.fillStyle = "rgba(255, 255, 255, 0.5)";

        const text = `Block Height: ${currentBlockNumber}`;
        const textWidth = ctxMap.measureText(text).width;

        ctxMap.fillText(text, eventMapCanvas.width - textWidth - 10, 30);
        ctxMap.restore();
    }

    function drawZodiacLines(cluster) {
        if (!cluster.lines || cluster.lines.length === 0) return;
        const currentTime = (performance.now() - eventMapStartTime) / 1000;
        cluster.lines.forEach((lineObj) => {
            const flicker = 0.5 + 0.5 * Math.sin(currentTime * 2.0 + lineObj.blinkOffset);
            const alpha = 0.2 + 0.7 * flicker;
            const strokeColor = `hsla(${cluster.hue}, 100%, 25%, ${alpha})`;

            ctxMap.save();
            ctxMap.strokeStyle = strokeColor;
            ctxMap.lineWidth = 1.5;
            ctxMap.beginPath();

            const p1 = cluster.points[lineObj.i];
            const p2 = cluster.points[lineObj.j];
            const x1 = scaleX(p1.x);
            const y1 = scaleY(p1.y);
            const x2 = scaleX(p2.x);
            const y2 = scaleY(p2.y);

            ctxMap.moveTo(x1, y1);
            ctxMap.lineTo(x2, y2);
            ctxMap.stroke();
            ctxMap.restore();
        });
    }

    function drawPoint(point) {
        const currentTime = (performance.now() - eventMapStartTime) / 1000;
        const flicker = 0.5 + 0.5 * Math.sin(currentTime * 2.0 + point.blinkOffset);
        const alpha = 0.3 + 0.7 * flicker;

        const cInfo = clusterInfo[point.clusterNumber];
        let fillColor = 'hsla(0,0%,100%,1)';
        if (cInfo) {
            fillColor = `hsla(${cInfo.hue}, 100%, 50%, ${alpha})`;
        }

        const rX = scaleX(point.x);
        const rY = scaleY(point.y);

        ctxMap.beginPath();
        ctxMap.arc(rX, rY, 4, 0, 2 * Math.PI);
        ctxMap.fillStyle = fillColor;
        ctxMap.fill();
    }

    function drawCentroid(cluster) {
        const cX = scaleX(cluster.centroidX);
        const cY = scaleY(cluster.centroidY);

        ctxMap.save();
        ctxMap.fillStyle = cluster.color;
        ctxMap.beginPath();
        ctxMap.moveTo(cX, cY - 8);
        ctxMap.lineTo(cX + 8, cY);
        ctxMap.lineTo(cX, cY + 8);
        ctxMap.lineTo(cX - 8, cY);
        ctxMap.closePath();
        ctxMap.fill();
        ctxMap.restore();
    }

    function drawShortSummaryText(cluster) {
        ctxMap.save();
        ctxMap.fillStyle = '#E0E0E0';
        ctxMap.font = "14px 'Roboto', sans-serif";
        const cX = scaleX(cluster.centroidX);
        const cY = scaleY(cluster.centroidY);

        const maxWidth = 150;
        const lineHeight = 16;
        const textX = cX + 10;
        const textY = cY - 10;

        wrapText(ctxMap, cluster.shortSummary, textX, textY, maxWidth, lineHeight);
        ctxMap.restore();
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (line) {
            ctx.fillText(line, x, currentY);
        }
    }

    function calculateBoundingBox(pointsArray) {
        if (pointsArray.length === 0) {
            minX = -1;
            maxX = 1;
            minY = -1;
            maxY = 1;
            return;
        }
        minX = Math.min(...pointsArray.map((p) => Math.min(p.x, p.centroidX)));
        maxX = Math.max(...pointsArray.map((p) => Math.max(p.x, p.centroidX)));
        minY = Math.min(...pointsArray.map((p) => Math.min(p.y, p.centroidY)));
        maxY = Math.max(...pointsArray.map((p) => Math.max(p.y, p.centroidY)));
    }

    function loadBlockPointsByIndex(index) {
        const blockNum = availableBlocks[index];
        currentBlockNumber = blockNum;
        allPoints = blockPointsData[blockNum] || [];
        setupClusterInfo(allPoints);
    }

    function resetSlider() {
        blockSlider.min = 0;
        blockSlider.max = 0;
        blockSlider.value = 0;
    }

    function startAutoSlide() {
        if (availableBlocks.length <= 1) return;
        stopAutoSlide();
        autoSlideInterval = setInterval(() => {
            let idx = parseInt(blockSlider.value, 10);
            idx++;
            if (idx > availableBlocks.length - 1) {
                idx = 0;
            }
            blockSlider.value = idx;
            loadBlockPointsByIndex(idx);
        }, 1000);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    function animateEventMap() {
        if (!isEventMapAnimating) return;
        drawAll();
        requestAnimationFrame(animateEventMap);
    }

    function initUserView() {
        const dataWidth = maxX - minX;
        const dataHeight = maxY - minY;
        const factor = 1.1;
        userView.width = dataWidth * factor;
        userView.height = dataHeight * factor;

        const dataCenterX = (minX + maxX) / 2;
        const dataCenterY = (minY + maxY) / 2;

        userView.x = dataCenterX - userView.width / 2;
        userView.y = dataCenterY - userView.height / 2;

        clampUserView();
    }

    function reflowEventMapCanvas() {
        if (eventMapCanvas && document.getElementById('EventMap').style.display === 'block') {
            resizeCanvasToDisplaySize(eventMapCanvas);
            drawAll();
        }
    }

    eventMapCanvas.addEventListener(
        'wheel',
        (e) => {
            e.preventDefault();
            if (!allPoints.length) return;

            const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
            const rect = eventMapCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const scaleXdata = userView.width / (eventMapCanvas.width - 2 * margin);
            const scaleYdata = userView.height / (eventMapCanvas.height - 2 * margin);

            const dataX = userView.x + (mouseX - margin) * scaleXdata;
            const dataY =
                userView.y +
                (eventMapCanvas.height - margin - mouseY) * scaleYdata;

            userView.width *= zoomFactor;
            userView.height *= zoomFactor;

            userView.x = dataX - (dataX - userView.x) * zoomFactor;
            userView.y = dataY - (dataY - userView.y) * zoomFactor;

            clampUserView();
        },
        { passive: false }
    );

    eventMapCanvas.addEventListener(
        'touchstart',
        (e) => {
            if (e.touches.length === 1) {
                isPanning = true;
                pinchMode = false;
                panStartX = e.touches[0].clientX;
                panStartY = e.touches[0].clientY;
                initViewX = userView.x;
                initViewY = userView.y;
            } else if (e.touches.length === 2) {
                pinchMode = true;
                isPanning = false;
                initialPinchDist = getTouchDistance(e);
                initialPinchCenter = getTouchCenter(e);
                initViewOnPinch = {
                    x: userView.x,
                    y: userView.y,
                    width: userView.width,
                    height: userView.height,
                };
            }
        },
        { passive: false }
    );

    eventMapCanvas.addEventListener(
        'touchmove',
        (e) => {
            if (pinchMode && e.touches.length === 2) {
                e.preventDefault();
                const newDist = getTouchDistance(e);
                const ratio = newDist / initialPinchDist;

                userView.width = initViewOnPinch.width / ratio;
                userView.height = initViewOnPinch.height / ratio;

                const scaleXdata =
                    initViewOnPinch.width / (eventMapCanvas.width - 2 * margin);
                const scaleYdata =
                    initViewOnPinch.height / (eventMapCanvas.height - 2 * margin);

                const dataX =
                    initViewOnPinch.x + (initialPinchCenter.x - margin) * scaleXdata;
                const dataY =
                    initViewOnPinch.y +
                    (eventMapCanvas.height - margin - initialPinchCenter.y) * scaleYdata;

                userView.x = dataX - (dataX - initViewOnPinch.x) / ratio;
                userView.y = dataY - (dataY - initViewOnPinch.y) / ratio;
                clampUserView();
            } else if (isPanning && e.touches.length === 1) {
                e.preventDefault();
                const dx = e.touches[0].clientX - panStartX;
                const dy = e.touches[0].clientY - panStartY;
                const scaleXdata =
                    userView.width / (eventMapCanvas.width - 2 * margin);
                const scaleYdata =
                    userView.height / (eventMapCanvas.height - 2 * margin);

                userView.x = initViewX - dx * scaleXdata;
                userView.y = initViewY + dy * scaleYdata;
                clampUserView();
            }
        },
        { passive: false }
    );

    eventMapCanvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            pinchMode = false;
        }
        if (e.touches.length === 0) {
            isPanning = false;
        }
    });

    function getTouchDistance(e) {
        if (e.touches.length < 2) return 1;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    function getTouchCenter(e) {
        if (e.touches.length < 2) {
            return { x: 0, y: 0 };
        }
        return {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
    }

    eventMapCanvas.addEventListener('mousedown', (e) => {
        isPanning = true;
        pinchMode = false;
        panStartX = e.clientX;
        panStartY = e.clientY;
        initViewX = userView.x;
        initViewY = userView.y;
    });

    eventMapCanvas.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        const scaleXdata = userView.width / (eventMapCanvas.width - 2 * margin);
        const scaleYdata = userView.height / (eventMapCanvas.height - 2 * margin);

        userView.x = initViewX - dx * scaleXdata;
        userView.y = initViewY + dy * scaleYdata;
        clampUserView();
    });

    window.addEventListener('mouseup', () => {
        isPanning = false;
    });

    if (fetchRangeButton) {
        fetchRangeButton.addEventListener('click', async () => {
            stopAutoSlide();
            mapProcessingMessage.style.display = 'block';

            const startBlock = parseInt(startBlockInput.value.trim(), 10);
            const endBlock = parseInt(endBlockInput.value.trim(), 10);
            const mapApiKey = document.getElementById('mapApiKey').value.trim();
            if (
                isNaN(startBlock) ||
                isNaN(endBlock) ||
                startBlock < 0 ||
                endBlock < 0 ||
                startBlock > endBlock
            ) {
                alert('Please enter valid start/end block numbers.');
                mapProcessingMessage.style.display = 'none';
                return;
            }

            if (endBlock - startBlock > 100) {
                alert('Please choose a range of 100 blocks or fewer.');
                mapProcessingMessage.style.display = 'none';
                return;
            }

            let url = `https://api.sentichain.com/mapper/get_points_by_block_range_no_embedding?start_block=${startBlock}&end_block=${endBlock}`;
            if (mapApiKey) {
                url += `&api_key=${encodeURIComponent(mapApiKey)}`;
            }

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`API returned status ${response.status}`);
                }
                const data = await response.json();
                if (!data.points || !Array.isArray(data.points)) {
                    throw new Error("Response does not contain a valid 'points' array.");
                }

                blockPointsData = {};
                allRangePoints = [];
                availableBlocks = [];

                data.points.forEach((item) => {
                    const bNum = item[0];
                    if (!blockPointsData[bNum]) {
                        blockPointsData[bNum] = [];
                    }
                    const pointObj = {
                        blockNumber: bNum,
                        postLink: item[1],
                        postContent: item[2],
                        x: item[3],
                        y: item[4],
                        clusterNumber: item[5],
                        centroidX: item[6],
                        centroidY: item[7],
                        clusterSummaryShort: item[8],
                        clusterSummaryLong: item[9],
                        blinkOffset: randomRange(0, 2 * Math.PI),
                    };
                    blockPointsData[bNum].push(pointObj);
                    allRangePoints.push(pointObj);
                });

                availableBlocks = Object.keys(blockPointsData)
                    .map((b) => parseInt(b, 10))
                    .sort((a, b) => a - b);

                if (availableBlocks.length === 0) {
                    alert('No blocks found with points in that range!');
                    resetSlider();
                    mapProcessingMessage.style.display = 'none';
                    return;
                }

                calculateBoundingBox(allRangePoints);
                blockSlider.min = 0;
                blockSlider.max = availableBlocks.length - 1;
                blockSlider.value = 0;
                blockSlider.step = 1;

                loadBlockPointsByIndex(0);
                resizeCanvasToDisplaySize(eventMapCanvas);

                initUserView();

                if (!isEventMapAnimating) {
                    isEventMapAnimating = true;
                    animateEventMap();
                }

                startAutoSlide();
            } catch (err) {
                alert('Error fetching range: ' + err.message);
                console.error(err);
            } finally {
                mapProcessingMessage.style.display = 'none';
            }
        });
    }

    if (blockSlider) {
        blockSlider.addEventListener('input', () => {
            stopAutoSlide();
            const idx = parseInt(blockSlider.value, 10);
            loadBlockPointsByIndex(idx);
        });
    }

    if (autoSlideCheckbox) {
        autoSlideCheckbox.addEventListener('change', () => {
            if (autoSlideCheckbox.checked) {
                stopAutoSlide();
            } else {
                startAutoSlide();
            }
        });
    }

    window.addEventListener('load', () => {
        if (!startBlockInput.value.trim() || !endBlockInput.value.trim()) {
            fetch('https://api.sentichain.com/blockchain/get_chain_length?network=mainnet')
                .then((res) => res.json())
                .then((data) => {
                    const chainLength = data.chain_length;
                    const defaultEnd = chainLength - 1;
                    const defaultStart = Math.max(defaultEnd - 50, 0);

                    if (!endBlockInput.value.trim()) {
                        endBlockInput.value = defaultEnd;
                    }
                    if (!startBlockInput.value.trim()) {
                        startBlockInput.value = defaultStart;
                    }
                })
                .catch((err) => {
                    console.error('Error fetching chain length:', err);
                })
                .finally(() => {
                    resizeCanvasToDisplaySize(eventMapCanvas);
                    drawAll();
                });
        } else {
            resizeCanvasToDisplaySize(eventMapCanvas);
            drawAll();
        }
    });

    eventMapCanvas.addEventListener('mousemove', (event) => {
        if (isPanning || pinchMode) {
            tooltip.style.display = 'none';
            return;
        }
        const rect = eventMapCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        let hoveredObject = null;

        for (let cNum in clusterInfo) {
            const info = clusterInfo[cNum];
            const cX = scaleX(info.centroidX);
            const cY = scaleY(info.centroidY);
            const dist = Math.hypot(mouseX - cX, mouseY - cY);
            if (dist < 10) {
                hoveredObject = { type: 'centroid', data: info };
                break;
            }
        }

        if (!hoveredObject) {
            for (let p of allPoints) {
                const pX = scaleX(p.x);
                const pY = scaleY(p.y);
                const dist = Math.hypot(mouseX - pX, mouseY - pY);
                if (dist < 6) {
                    hoveredObject = { type: 'point', data: p };
                    break;
                }
            }
        }

        if (!hoveredObject) {
            tooltip.style.display = 'none';
            return;
        }

        if (hoveredObject.type === 'centroid') {
            showTooltip(hoveredObject.data.longSummary, event.clientX, event.clientY);
        } else if (hoveredObject.type === 'point') {
            showTooltip(hoveredObject.data.postContent, event.clientX, event.clientY);
        }
    });

    function showTooltip(text, clientX, clientY) {
        tooltip.innerText = text;
        tooltip.style.display = 'block';
        tooltip.style.left = clientX + 10 + 'px';
        tooltip.style.top = clientY + 10 + 'px';
    }

    eventMapCanvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });

    window.addEventListener('resize', reflowEventMapCanvas);
}

// ----------------------------------------------------------------------
// TAB PARAMS LOADER
// ----------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const blockParam = params.get('block');

    if (tab === 'BlockExplorer') {
        const blockExplorerLink = document.querySelector(
            "a.tablinks[onclick*='BlockExplorer']"
        );
        if (blockExplorerLink) {
            blockExplorerLink.click();
        }
    } else if (tab === 'EventMap') {
        const eventMapLink = document.querySelector("a.tablinks[onclick*='EventMap']");
        if (eventMapLink) {
            eventMapLink.click();
        }
    }

    if (blockParam === 'last') {
        const blockExplorerLink = document.querySelector(
            "a.tablinks[onclick*='BlockExplorer']"
        );
        if (blockExplorerLink) {
            blockExplorerLink.click();
        }

        fetch('https://api.sentichain.com/blockchain/get_chain_length?network=mainnet')
            .then((res) => res.json())
            .then((data) => {
                const chainLength = data.chain_length;
                const lastBlockNumber = chainLength - 1;
                doBlockExplorerFetch('mainnet', lastBlockNumber);
            })
            .catch((err) => {
                console.error('Error fetching chain length: ', err);
            });
    }

    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.getElementById('toggleSidebarButton');

    if (window.innerWidth <= 768) {
        if (sidebar) {
            sidebar.classList.remove('collapsed');
        }
        if (toggleButton) {
            toggleButton.style.display = 'none';
        }
        return;
    }

    if (sidebar && toggleButton) {
        if (sidebar.classList.contains('collapsed')) {
            toggleButton.style.display = 'block';
        } else {
            toggleButton.style.display = 'none';
        }

        toggleButton.addEventListener('click', () => {
            sidebar.classList.remove('collapsed');
            toggleButton.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
            if (!sidebar.classList.contains('collapsed')) {
                if (!sidebar.contains(e.target) && !toggleButton.contains(e.target)) {
                    sidebar.classList.add('collapsed');
                    toggleButton.style.display = 'block';
                }
            }
        });

        sidebar.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'width') {
                if (document.getElementById('EventMap')?.style.display === 'block') {
                    if (typeof reflowEventMapCanvas === 'function') {
                        reflowEventMapCanvas();
                    }
                }
            }
        });
    }
});

document.getElementById('contactForm').addEventListener('submit', function (event) {
    var subject = "CONTACT-US@SENTICHAIN.COM: " + document.getElementById('subject').value;
    var emailField = document.querySelector('[name="email"]').value;
    var messageField = document.querySelector('[name="message"]').value;
    var mailtoLink = 'mailto:info@sentichain.com?subject=' + encodeURIComponent(subject) + '&body=' +
        encodeURIComponent('REPLY-TO: ' + emailField + '\n\nMESSAGE: ' + messageField);
    this.action = mailtoLink;
});
