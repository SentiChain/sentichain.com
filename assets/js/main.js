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

    let timeElapsedInterval = null;

    function fetchBlockHeight() {
        const blockHeightElement = document.getElementById('blockHeight');
        if (!blockHeightElement) return;

        fetch('https://api.sentichain.com/blockchain/get_chain_length?network=mainnet')
            .then((res) => res.json())
            .then((data) => {
                const targetCount = data.chain_length;
                let currentCount = Math.max(targetCount - 20, 0);

                blockHeightElement.textContent = currentCount;
                function increment() {
                    if (currentCount < targetCount) {
                        currentCount++;
                        blockHeightElement.textContent = currentCount;
                        requestAnimationFrame(increment);
                    } else {
                        blockHeightElement.textContent = targetCount;
                    }
                }
                increment();
            })
            .catch((err) => {
                console.error(err);
                blockHeightElement.textContent = '...';
            });
    }

    function fetchBlockTime() {
        const blockTimeElement = document.getElementById('blockTime');
        const timeElapsedElement = document.getElementById('timeElapsed');
        if (!blockTimeElement || !timeElapsedElement) return;

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

                    if (timeElapsedInterval) {
                        clearInterval(timeElapsedInterval);
                    }
                    timeElapsedInterval = setInterval(() => {
                        elapsed++;
                        timeElapsedElement.textContent = `${elapsed}s`;
                    }, 1000);
                } else {
                    blockTimeElement.textContent = '...';
                    timeElapsedElement.textContent = '...';
                }
            })
            .catch((err) => {
                console.error(err);
                blockTimeElement.textContent = '...';
                timeElapsedElement.textContent = '...';
            });
    }

    function fetchTxnCount() {
        const txnCountElement = document.getElementById('txnCount');
        if (!txnCountElement) return;

        fetch('https://api.sentichain.com/blockchain/get_total_number_of_transactions?network=mainnet')
            .then((res) => res.json())
            .then((data) => {
                const targetCount = data.total_tx_count;
                let currentCount = Math.max(targetCount - 20, 0);

                txnCountElement.textContent = currentCount;
                function increment() {
                    if (currentCount < targetCount) {
                        currentCount++;
                        txnCountElement.textContent = currentCount;
                        requestAnimationFrame(increment);
                    } else {
                        txnCountElement.textContent = targetCount;
                    }
                }
                increment();
            })
            .catch((err) => {
                console.error(err);
                txnCountElement.textContent = '...';
            });
    }

    function refreshNetworkStats() {
        fetchBlockHeight();
        fetchBlockTime();
        fetchTxnCount();
    }

    document.addEventListener('DOMContentLoaded', () => {
        refreshNetworkStats();
        setInterval(refreshNetworkStats, 10000);
    });

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

function safeValue(val) {
    return val === "A valid API Key is required" ? "A valid API Key is required" : val;
}

function serializeVector(vec) {
    if (!Array.isArray(vec)) {
        return "A valid API Key is required";
    }
    return `[${vec.map((n) => (Number.isInteger(n) ? n.toFixed(1) : n)).join(', ')}]`;
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
                        timestampCell.innerText = (tx.post_timestamp === "A valid API Key is required")
                            ? "A valid API Key is required"
                            : formatTimestamp(tx.post_timestamp);
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

                        let postLinkHtml = '';
                        if (tx.post_link === 'A valid privileged API Key is required') {
                            postLinkHtml = '<span>A valid privileged API Key is required</span>';
                        } else {
                            postLinkHtml = `<a href="https://x.com/${tx.post_link}" target="_blank">View Post</a>`;
                        }

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
                                    <td><strong>Post Link:</strong> ${postLinkHtml}</td>
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

document.addEventListener('DOMContentLoaded', () => {
    const blockExplorerForm = document.getElementById('blockExplorerForm');
    const blockExplorerInput = document.getElementById('blockExplorerInput');
    const blockExplorerModeButton = document.getElementById('blockExplorerModeButton');

    let isBlockMode = true;
    blockExplorerModeButton.classList.add('block-mode');
    blockExplorerInput.placeholder = 'Block Number: e.g. 100';

    if (blockExplorerInput && !blockExplorerInput.value.trim()) {
        fetch('https://api.sentichain.com/blockchain/get_chain_length?network=mainnet')
            .then((res) => res.json())
            .then((data) => {
                const chainLength = data.chain_length;
                if (!blockExplorerInput.value.trim()) {
                    blockExplorerInput.value = chainLength - 1;
                }
            })
            .catch((err) => {
                console.error('Error fetching chain length for Block Explorer:', err);
            });
    }

    if (blockExplorerModeButton) {
        blockExplorerModeButton.addEventListener('click', () => {
            isBlockMode = !isBlockMode;
            if (isBlockMode) {
                blockExplorerModeButton.classList.add('block-mode');
                blockExplorerInput.placeholder = 'Block Number: e.g. 100';
                blockExplorerModeButton.title = 'Switch to Timestamp input';
            } else {
                blockExplorerModeButton.classList.remove('block-mode');
                blockExplorerInput.placeholder = 'UTC Timestamp: e.g. 2025-01-01 13:00:00';
                blockExplorerModeButton.title = 'Switch to Block Number input';
            }
        });
    }

    if (blockExplorerForm) {
        blockExplorerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const networkSelect = document.getElementById('network');
            const apiKeyInput = document.getElementById('apiKey');

            const network = networkSelect.value;
            const userInput = blockExplorerInput.value.trim();
            const apiKey = apiKeyInput.value.trim();

            if (!userInput) {
                alert('Please enter a block number or timestamp.');
                return;
            }

            if (isBlockMode) {
                if (!/^\d+$/.test(userInput)) {
                    alert('Please enter a valid integer block number (e.g. 100).');
                    return;
                }
                const bn = parseInt(userInput, 10);
                if (bn < 0) {
                    alert('Please enter a non-negative block number (e.g. 100).');
                    return;
                }
                doBlockExplorerFetch(network, bn, apiKey);

            } else {
                const isoString = parseUserTimestamp(userInput);
                if (!isoString) {
                    alert('Please enter a valid UTC Timestamp: YYYY-MM-DD HH:MM:SS');
                    return;
                }
                try {
                    const resp = await fetch(
                        `https://api.sentichain.com/blockchain/get_block_number_from_timestamp?network=mainnet&timestamp=${encodeURIComponent(isoString)}`
                    );
                    if (!resp.ok) {
                        throw new Error(`Timestamp->block fetch failed: ${resp.status}`);
                    }
                    const data = await resp.json();
                    if (!data.block_number) {
                        throw new Error('Response missing block_number');
                    }
                    doBlockExplorerFetch(network, data.block_number, apiKey);
                } catch (err) {
                    console.error('Timestamp mode error in block explorer:', err);
                    alert('Error retrieving block number from timestamp:\n' + err.message);
                }
            }
        });
    }

    function parseUserTimestamp(input) {
        const re = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
        const match = input.match(re);
        if (!match) return null;
        const [_, yyyy, mm, dd, hh, min, ss] = match;
        return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    }
});


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
                    const blockNumberInput = document.getElementById('blockNumber');
                    if (blockNumberInput && !blockNumberInput.value.trim()) {
                        blockNumberInput.value = chainLength - 1;
                    }

                    const obsBlockNumInput = document.getElementById('observationBlockNumber');
                    if (obsBlockNumInput && !obsBlockNumInput.value.trim()) {
                        obsBlockNumInput.value = chainLength - 1;
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

/**********************************************************************
 *  OBSERVATION FETCH FUNCTION
 **********************************************************************/
function doObservationFetch(ticker, blockNumber, apiKey) {
    const resultDiv = document.getElementById('observationResult');
    const processingMessage = document.getElementById('observationProcessingMessage');
    const errorMessageDiv = document.getElementById('observationErrorMessage');
    const infoDiv = document.getElementById('observationInfo');
    const observationContentSpan = document.getElementById('observationContent');
    resultDiv.style.display = 'none';
    processingMessage.style.display = 'none';
    errorMessageDiv.style.display = 'none';
    infoDiv.style.display = 'none';
    observationContentSpan.innerHTML = '';
    if (!ticker) {
        errorMessageDiv.innerText = 'Please enter a valid Ticker.';
        errorMessageDiv.style.display = 'block';
        resultDiv.style.display = 'block';
        return;
    }
    const bn = parseInt(blockNumber, 10);
    if (!bn || bn < 0) {
        errorMessageDiv.innerText = 'Please enter a valid block number (e.g. 300).';
        errorMessageDiv.style.display = 'block';
        resultDiv.style.display = 'block';
        return;
    }
    resultDiv.style.display = 'block';
    processingMessage.style.display = 'block';
    let publicObservationUrl =
        `https://api.sentichain.com/agent/get_reasoning_match_chunk_end?` +
        `ticker=${encodeURIComponent(ticker)}` +
        `&summary_type=observation_public` +
        `&user_chunk_end=${encodeURIComponent(bn)}`;
    if (apiKey) {
        publicObservationUrl += `&api_key=${encodeURIComponent(apiKey)}`;
    }
    const publicObservationPromise = fetch(publicObservationUrl)
        .then((res) => {
            if (!res.ok) {
                throw new Error(
                    `observation_public fetch failed (${res.status}): ${res.statusText}`
                );
            }
            return res.json();
        })
        .then((data) => {
            if (!data.reasoning) {
                throw new Error(`"observation_public" missing 'reasoning' field.`);
            }
            return data.reasoning;
        });
    let publicConsiderationUrl =
        `https://api.sentichain.com/agent/get_reasoning_match_chunk_end?` +
        `ticker=${encodeURIComponent(ticker)}` +
        `&summary_type=consideration_public` +
        `&user_chunk_end=${encodeURIComponent(bn)}`;

    if (apiKey) {
        publicConsiderationUrl += `&api_key=${encodeURIComponent(apiKey)}`;
    }

    const publicConsiderationPromise = fetch(publicConsiderationUrl)
        .then((res) => {
            if (!res.ok) {
                throw new Error(
                    `consideration_public fetch failed (${res.status}): ${res.statusText}`
                );
            }
            return res.json();
        })
        .then((data) => {
            if (!data.reasoning) {
                throw new Error(`"consideration_public" missing 'reasoning' field.`);
            }
            return data.reasoning; // This is your consideration text
        });
    const chunkOffsets = [0, 50, 100, 150];
    const chunkEnds = chunkOffsets.map((off) => bn - off).filter((x) => x >= 0);
    const summaryTypes = ['initial_market_analysis', 'initial_sentiment_analysis', 'initial_event_analysis', 'initial_quant_analysis'];
    const fetchPromises = [];
    summaryTypes.forEach((summaryType) => {
        chunkEnds.forEach((endVal) => {
            let url =
                `https://api.sentichain.com/agent/get_reasoning_match_chunk_end?` +
                `ticker=${encodeURIComponent(ticker)}` +
                `&summary_type=${encodeURIComponent(summaryType)}` +
                `&user_chunk_end=${encodeURIComponent(endVal)}`;
            if (apiKey) {
                url += `&api_key=${encodeURIComponent(apiKey)}`;
            }
            fetchPromises.push(
                fetch(url)
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(
                                `Error (${response.status}): ${response.statusText}`
                            );
                        }
                        return response.json();
                    })
                    .then((data) => {
                        if (!data.reasoning) {
                            throw new Error(
                                `No "reasoning" field for ${summaryType} & block ${endVal}.`
                            );
                        }
                        return {
                            summaryType,
                            endVal,
                            reasoning: parseTripleBacktickJSON(data.reasoning),
                        };
                    })
            );
        });
    });
    Promise.all([publicObservationPromise, publicConsiderationPromise, ...fetchPromises])
        .then((responses) => {
            const publicObservation = responses[0];
            const publicConsideration = responses[1];
            const details = responses.slice(2);
            let marketRows = [];
            let sentimentRows = [];
            let eventRows = [];
            let quantRows = [];
            for (let obj of details) {
                if (obj.summaryType === 'initial_market_analysis') {
                    obj.reasoning.forEach((item) => {
                        marketRows.push({
                            timestamp: item.timestamp,
                            reasoning: item.summary,
                        });
                    });
                } else {
                    if (obj.summaryType === 'initial_sentiment_analysis') {
                        obj.reasoning.forEach((item) => {
                            sentimentRows.push({
                                timestamp: item.timestamp,
                                reasoning: item.summary,
                            });
                        });
                    } else {
                        if (obj.summaryType === 'initial_event_analysis') {
                            obj.reasoning.forEach((item) => {
                                eventRows.push({
                                    timestamp: item.timestamp,
                                    reasoning: item.summary,
                                });
                            });
                        } else {
                            obj.reasoning.forEach((item) => {
                                quantRows.push({
                                    timestamp: item.timestamp,
                                    reasoning: item.summary,
                                });
                            });
                        }
                    }

                }
            }
            marketRows.sort((a, b) => {
                const tA = parseDateSafe(a.timestamp);
                const tB = parseDateSafe(b.timestamp);
                if (tA === null && tB === null) return 0;
                if (tA === null) return 1;
                if (tB === null) return -1;
                return tA - tB;
            });
            sentimentRows.sort((a, b) => {
                const tA = parseDateSafe(a.timestamp);
                const tB = parseDateSafe(b.timestamp);
                if (tA === null && tB === null) return 0;
                if (tA === null) return 1;
                if (tB === null) return -1;
                return tA - tB;
            });
            eventRows.sort((a, b) => {
                const tA = parseDateSafe(a.timestamp);
                const tB = parseDateSafe(b.timestamp);
                if (tA === null && tB === null) return 0;
                if (tA === null) return 1;
                if (tB === null) return -1;
                return tA - tB;
            });
            quantRows.sort((a, b) => {
                const tA = parseDateSafe(a.timestamp);
                const tB = parseDateSafe(b.timestamp);
                if (tA === null && tB === null) return 0;
                if (tA === null) return 1;
                if (tB === null) return -1;
                return tA - tB;
            });
            marketRows = deduplicateByTimestamp(marketRows);
            sentimentRows = deduplicateByTimestamp(sentimentRows);
            eventRows = deduplicateByTimestamp(eventRows);
            quantRows = deduplicateByTimestamp(quantRows);
            let finalHTML = '';
            finalHTML += `
                <div style="margin-bottom:20px;">
                     <div style="white-space:pre-wrap; line-height: 1.5;">${publicObservation}</div>
                </div>
            `;
            const considerationHTML = formatBulletPoints(publicConsideration);
            finalHTML += `
                <div style="margin-bottom:20px;">
                     <p style="color:#00FFC8;"><strong>Consideration:</strong></p>
                     <div style="margin-bottom:20px;">
                         ${considerationHTML}
                     </div>
                </div>
            `;
            finalHTML += `
                <h3 style="color:#00FFC8;">Market Observations</h3>
                <table id="marketAnalysisTable" style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                    <thead>
                        <tr style="background:#00FFC8; color:#121212;">
                            <th style="padding:10px; text-align:left; width:180px;">Timestamp</th>
                            <th style="padding:10px; text-align:left;">Reasoning</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (marketRows.length === 0) {
                finalHTML += `
                    <tr>
                        <td colspan="2" style="padding:10px;">No market analysis data found. A valid API Key is required.</td>
                    </tr>
                `;
            } else {
                marketRows.forEach((item) => {
                    finalHTML += `
                        <tr style="border-bottom:1px solid #333;">
                            <td style="padding:10px;">${item.timestamp}</td>
                            <td style="padding:10px;">${item.reasoning}</td>
                        </tr>
                    `;
                });
            }
            finalHTML += `</tbody></table>`;
            finalHTML += `
                <h3 style="color:#00FFC8;">Sentiment Observations</h3>
                <table id="sentimentAnalysisTable" style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                    <thead>
                        <tr style="background:#00FFC8; color:#121212;">
                            <th style="padding:10px; text-align:left; width:180px;">Timestamp</th>
                            <th style="padding:10px; text-align:left;">Reasoning</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (sentimentRows.length === 0) {
                finalHTML += `
                    <tr>
                        <td colspan="2" style="padding:10px;">No sentiment analysis data found. A valid API Key is required.</td>
                    </tr>
                `;
            } else {
                sentimentRows.forEach((item) => {
                    finalHTML += `
                        <tr style="border-bottom:1px solid #333;">
                            <td style="padding:10px;">${item.timestamp}</td>
                            <td style="padding:10px;">${item.reasoning}</td>
                        </tr>
                    `;
                });
            }
            finalHTML += `</tbody></table>`;
            finalHTML += `
                <h3 style="color:#00FFC8;">Event Observations</h3>
                <table id="eventAnalysisTable" style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                    <thead>
                        <tr style="background:#00FFC8; color:#121212;">
                            <th style="padding:10px; text-align:left; width:180px;">Timestamp</th>
                            <th style="padding:10px; text-align:left;">Reasoning</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (eventRows.length === 0) {
                finalHTML += `
                    <tr>
                        <td colspan="2" style="padding:10px;">No event analysis data found. A valid API Key is required.</td>
                    </tr>
                `;
            } else {
                eventRows.forEach((item) => {
                    finalHTML += `
                        <tr style="border-bottom:1px solid #333;">
                            <td style="padding:10px;">${item.timestamp}</td>
                            <td style="padding:10px;">${item.reasoning}</td>
                        </tr>
                    `;
                });
            }
            finalHTML += `</tbody></table>`;
            finalHTML += `
                <h3 style="color:#00FFC8;">Quant Observations</h3>
                <table id="quantAnalysisTable" style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:#00FFC8; color:#121212;">
                            <th style="padding:10px; text-align:left; width:180px;">Timestamp</th>
                            <th style="padding:10px; text-align:left;">Reasoning</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            if (quantRows.length === 0) {
                finalHTML += `
                    <tr>
                        <td colspan="2" style="padding:10px;">No quant analysis data found. A valid API Key is required.</td>
                    </tr>
                `;
            } else {
                quantRows.forEach((item) => {
                    finalHTML += `
                        <tr style="border-bottom:1px solid #333;">
                            <td style="padding:10px;">${item.timestamp}</td>
                            <td style="padding:10px;">${item.reasoning}</td>
                        </tr>
                    `;
                });
            }
            finalHTML += `</tbody></table>`;

            observationContentSpan.innerHTML = finalHTML;
            processingMessage.style.display = 'none';
            infoDiv.style.display = 'block';
        })
        .catch((err) => {
            console.error('Detailed Observation Error:', err);
            errorMessageDiv.innerText = `Error: ${err.message}`;
            errorMessageDiv.style.display = 'block';
            processingMessage.style.display = 'none';
            infoDiv.style.display = 'none';
        });
}

function parseDateSafe(tsString) {
    const parsed = Date.parse(tsString);
    return isNaN(parsed) ? null : parsed;
}

function deduplicateByTimestamp(rows) {
    const unique = [];
    const seen = new Set();
    for (const r of rows) {
        if (!seen.has(r.timestamp)) {
            seen.add(r.timestamp);
            unique.push(r);
        }
    }
    return unique;
}

function parseTripleBacktickJSON(str) {
    let cleaned = str;
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/```$/, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (err) {
        console.error('Error parsing triple-backtick JSON:', err, 'Original string:', str);
        return [];
    }
}

/**********************************************************************
 *  API BALANCE CHECK FUNCTION
 **********************************************************************/
function doApiBalanceCheck(userId, apiKey) {
    const resultDiv = document.getElementById('apiBalanceResult');
    const errorDiv = document.getElementById('apiBalanceErrorMessage');
    const infoDiv = document.getElementById('apiBalanceInfo');

    resultDiv.classList.remove('error');
    errorDiv.style.display = 'none';
    infoDiv.style.display = 'none';
    errorDiv.innerText = '';

    if (!userId || !apiKey) {
        resultDiv.style.display = 'block';
        errorDiv.innerText = 'Please enter both User ID and API Key.';
        errorDiv.style.display = 'block';
        return;
    }

    resultDiv.style.display = 'block';

    const url = `https://api.sentichain.com/api/get_user_info?user_id=${encodeURIComponent(userId)}&api_key=${encodeURIComponent(apiKey)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('User not found (404).');
                }
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.user || typeof data.user !== 'object') {
                throw new Error('Invalid response format: missing "user" object.');
            }

            const userObj = data.user;

            document.getElementById('apiBalanceUserName').innerText = userObj.name || '[No Name]';
            document.getElementById('apiBalanceUserEmail').innerText = userObj.email || '[No Email]';
            document.getElementById('apiBalanceUserId').innerText = userObj.user_id || '[No ID]';
            document.getElementById('apiBalanceUserPoints').innerText = userObj.points !== undefined
                ? userObj.points
                : '[No Points]';

            infoDiv.style.display = 'block';
        })
        .catch(error => {
            console.error('API Balance Error:', error);
            resultDiv.classList.add('error');
            errorDiv.innerText = `Error: ${error.message}`;
            errorDiv.style.display = 'block';
        });
}

/***************************************************************
 * 1) USER REGISTRATION FORM (Register)
 ***************************************************************/
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // Grab input values
        const userId = document.getElementById('registerUserId').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const name = document.getElementById('registerName').value.trim();

        // References to result/error output
        const registerResultDiv = document.getElementById('registerResult');
        const registerErrorDiv = document.getElementById('registerErrorMessage');
        const registerOutputDiv = document.getElementById('registerOutput');
        const registerMessageSpan = document.getElementById('registerMessageOutput');
        const registerUserIdSpan = document.getElementById('registerUserIdOutput');
        const registerApiKeySpan = document.getElementById('registerApiKeyOutput');

        // Reset display
        registerResultDiv.style.display = 'block';
        registerErrorDiv.style.display = 'none';
        registerOutputDiv.style.display = 'none';
        registerErrorDiv.innerText = '';
        registerMessageSpan.innerText = '';
        registerUserIdSpan.innerText = '';
        registerApiKeySpan.innerText = '';

        if (!userId || !email || !name) {
            registerErrorDiv.style.display = 'block';
            registerErrorDiv.innerText = 'Please fill in user_id, email, and name.';
            return;
        }

        if (!isValidEmail(email)) {
            registerErrorDiv.style.display = 'block';
            registerErrorDiv.innerText = 'Invalid email format. Please enter a valid email address.';
            return;
        }

        // Perform the registration POST
        fetch('https://api.sentichain.com/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, email: email, name: name })
        })
            .then(response => {
                if (!response.ok) {
                    // Non-200 => throw a specific error message
                    throw new Error('Your User ID or Email may be taken or may have an invalid format. Please retry.');
                }
                return response.json();
            })
            .then(data => {
                // We expect { "api_key", "message", "user_id" }
                if (!data.api_key || !data.message || !data.user_id) {
                    throw new Error('Invalid response from server. Missing api_key, message, or user_id.');
                }

                // Show success
                registerOutputDiv.style.display = 'block';
                registerMessageSpan.innerText = data.message;
                registerUserIdSpan.innerText = data.user_id;
                registerApiKeySpan.innerText = data.api_key;
            })
            .catch(error => {
                // Show error
                registerErrorDiv.style.display = 'block';
                registerErrorDiv.innerText = error.message;
            });
    });
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/***************************************************************
 * 2) CHECK BALANCE FORM
 ***************************************************************/
const apiBalanceForm = document.getElementById('apiBalanceForm');
if (apiBalanceForm) {
    apiBalanceForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const userIdInput = document.getElementById('userId');
        const userId = userIdInput.value.trim();

        const apiKeyInput = document.getElementById('balanceApiKey');
        const apiKey = apiKeyInput.value.trim();

        const resultDiv = document.getElementById('apiBalanceResult');
        const errorDiv = document.getElementById('apiBalanceErrorMessage');
        const infoDiv = document.getElementById('apiBalanceInfo');

        // Reset UI
        resultDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        infoDiv.style.display = 'none';
        errorDiv.innerText = '';

        // Basic validation
        if (!userId || !apiKey) {
            errorDiv.style.display = 'block';
            errorDiv.innerText = 'Please enter both User ID and API Key.';
            return;
        }

        // Endpoint example:
        // GET /api/get_user_info?user_id=xxx&api_key=yyy
        const url = `https://api.sentichain.com/api/get_user_info?user_id=${encodeURIComponent(userId)}&api_key=${encodeURIComponent(apiKey)}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    // Non-200 => show a custom message
                    throw new Error('Your User ID and API Key may be invalid. Please retry.');
                }
                return response.json();
            })
            .then(data => {
                // Expecting { user: { name, email, user_id, points } }
                if (!data.user) {
                    throw new Error('Invalid response format: missing "user" object.');
                }

                const userObj = data.user;
                document.getElementById('apiBalanceUserName').innerText = userObj.name || '[No Name]';
                document.getElementById('apiBalanceUserEmail').innerText = userObj.email || '[No Email]';
                document.getElementById('apiBalanceUserId').innerText = userObj.user_id || '[No ID]';
                document.getElementById('apiBalanceUserPoints').innerText =
                    userObj.points !== undefined ? userObj.points : '[No Points]';

                infoDiv.style.display = 'block';
            })
            .catch(error => {
                errorDiv.style.display = 'block';
                errorDiv.innerText = error.message;
            });
    });
}

// ----------------------------------------------------------------------
// TAB PARAMS LOADER
// ----------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const blockParam = params.get('block');

    if (tab === 'BlockExplorer') {
        const blockExplorerLink = document.querySelector("a.tablinks[onclick*='BlockExplorer']");
        if (blockExplorerLink) {
            blockExplorerLink.click();
        }
    } else if (tab === 'EventMap') {
        const eventMapLink = document.querySelector("a.tablinks[onclick*='EventMap']");
        if (eventMapLink) {
            eventMapLink.click();
        }
    } else if (tab === 'Observation') {
        const observationLink = document.querySelector("a.tablinks[onclick*='Observation']");
        if (observationLink) {
            observationLink.click();
        }
    } else if (tab === 'APIManagement') {
        const apiManagementLink = document.querySelector("a.tablinks[onclick*='APIManagement']");
        if (apiManagementLink) {
            apiManagementLink.click();
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

// Observation form
document.addEventListener('DOMContentLoaded', () => {
    const observationForm = document.getElementById('observationForm');
    const observationInput = document.getElementById('observationInput');
    const modeButton = document.getElementById('observationModeButton');
    let isBlockMode = true;
    modeButton.classList.add('block-mode');
    observationInput.placeholder = 'Block Number: e.g. 100';
    if (isBlockMode && !observationInput.value.trim()) {
        fetch('https://api.sentichain.com/blockchain/get_chain_length?network=mainnet')
            .then((res) => res.json())
            .then((data) => {
                const chainLength = data.chain_length;
                if (!observationInput.value.trim()) {
                    observationInput.value = chainLength - 1;
                }
            })
            .catch((err) => {
                console.error('Error fetching chain length for observation:', err);
            });
    }

    modeButton.addEventListener('click', () => {
        isBlockMode = !isBlockMode;

        if (isBlockMode) {
            // Switch to Block Number
            modeButton.classList.add('block-mode');
            observationInput.placeholder = 'Block Number: e.g. 100';
            modeButton.title = 'Switch to Timestamp input';
        } else {
            // Switch to Timestamp
            modeButton.classList.remove('block-mode');
            observationInput.placeholder = 'UTC Timestamp: e.g. 2025-01-01 13:00:00';
            modeButton.title = 'Switch to Block Number input';
        }
    });

    observationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const ticker = document.getElementById('observationTicker').value.trim();
        const userInput = observationInput.value.trim();
        const apiKey = document.getElementById('observationApiKey').value.trim();

        if (!userInput) {
            alert('Please enter a block number or timestamp.');
            return;
        }

        if (isBlockMode) {
            if (!/^\d+$/.test(userInput)) {
                alert("Please enter a valid integer block number (e.g. 100).");
                return;
            }
            const bn = parseInt(userInput, 10);
            if (bn < 0) {
                alert("Please enter a non-negative block number (e.g. 100).");
                return;
            }
            doObservationFetch(ticker, bn, apiKey);

        } else {
            const isoString = parseUserTimestamp(userInput);
            if (!isoString) {
                alert('Please enter a valid UTC Timestamp: YYYY-MM-DD HH:MM:SS');
                return;
            }
            try {
                const resp = await fetch(
                    `https://api.sentichain.com/blockchain/get_block_number_from_timestamp?network=mainnet&timestamp=${encodeURIComponent(isoString)}`
                );
                if (!resp.ok) {
                    throw new Error(`Error from timestamp->block API: ${resp.status}`);
                }
                const data = await resp.json();
                if (!data.block_number) {
                    throw new Error('Response missing block_number.');
                }
                doObservationFetch(ticker, data.block_number, apiKey);
            } catch (err) {
                console.error('Timestamp => block fetch error:', err);
                alert('Error retrieving block number from timestamp:\n' + err.message);
            }
        }
    });

    function parseUserTimestamp(input) {
        // Ex: "2025-01-01 13:00:00"
        const re = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
        const match = input.match(re);
        if (!match) return null;
        const [_, yyyy, mm, dd, hh, min, ss] = match;
        return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    }
});

function parseUserTimestamp(input) {
    const re = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
    const match = input.match(re);
    if (!match) return null;
    const [_, yyyy, mm, dd, hh, min, ss] = match;
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}

function formatBulletPoints(originalText) {
    const lines = originalText.split('\n');
    let bulletLines = [];
    let nonBulletLines = [];
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const content = trimmed.replace(/^[-•]\s*/, '');
            bulletLines.push(content);
        } else if (trimmed.length > 0) {
            nonBulletLines.push(trimmed);
        }
    });
    let html = '';
    if (bulletLines.length > 0) {
        html += '<ul class="consideration-bullet-list">\n';
        bulletLines.forEach((item) => {
            html += `  <li style="margin-bottom: 5px;">${item}</li>\n`;
        });
        html += '</ul>\n';
    }
    if (nonBulletLines.length > 0) {
        if (bulletLines.length > 0) {
            html += '<div style="height: 10px;"></div>';
        }
        nonBulletLines.forEach((line) => {
            html += `<p>${line}</p>\n`;
        });
    }
    if (bulletLines.length === 0 && nonBulletLines.length === 0) {
        return `<p>${originalText}</p>`;
    }
    return html;
}
