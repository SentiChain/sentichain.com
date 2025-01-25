/****************************************************************************
 * 1) BLACK HOLE ANIMATION (Index Page)
 ****************************************************************************/
const canvas = document.getElementById('animationCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Default intervals
    let explosionInterval = 5000; // desktop default

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        blackHole.x = canvas.width / 2;
        blackHole.y = canvas.height / 2;
    });

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    class Star {
        constructor() {
            this.reset();
        }
        reset() {
            const angle = random(0, Math.PI * 2);
            const distance = random(canvas.width * 2, canvas.width * 0.5);
            this.x = blackHole.x + Math.cos(angle) * distance;
            this.y = blackHole.y + Math.sin(angle) * distance;
            const dx = blackHole.x - this.x;
            const dy = blackHole.y - this.y;
            this.vx = dx * 0.001;
            this.vy = dy * 0.001;
            this.size = random(1, 3);
            this.brightness = random(0.7, 1);
            this.exploding = false;
            this.explodeTimer = 0;
        }
        update() {
            const dx = blackHole.x - this.x;
            const dy = blackHole.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = 1000 / (distance * distance + 100);
            this.vx += (dx / distance) * force;
            this.vy += (dy / distance) * force;
            this.x += this.vx;
            this.y += this.vy;
            if (distance < blackHole.currentRadius) {
                blackHole.growth += 0.5;
                this.reset();
            }
            if (this.exploding) {
                this.vx += this.explodeVx;
                this.vy += this.explodeVy;
                this.explodeTimer--;
                if (this.explodeTimer <= 0) {
                    this.exploding = false;
                }
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
            ctx.fill();
        }
        shockwave() {
            const dx = this.x - blackHole.x;
            const dy = this.y - blackHole.y;
            const angle = Math.atan2(dy, dx);
            const speed = 0.01 * random(2, 5);
            this.explodeVx = Math.cos(angle) * speed;
            this.explodeVy = Math.sin(angle) * speed;
            this.exploding = true;
            this.explodeTimer = 60;
        }
    }

    class BlackHole {
        constructor() {
            this.x = (2 * canvas.width) / 3;
            this.y = canvas.height / 2;
            this.baseRadius = 100;
            this.growth = 0;
            this._currentRadius = this.baseRadius;
            this.color = '#000000';
            this.shrinking = false;
            this.hasShrunk = false;
            this.targetRadius = this.baseRadius;
            this.ringHue = 180;
            this.ringRotation = 0;
        }
        get currentRadius() {
            return this._currentRadius;
        }
        set currentRadius(value) {
            this._currentRadius = value;
        }
        updateRadius() {
            if (!this.shrinking && !this.hasShrunk) {
                this.targetRadius = this.baseRadius + this.growth;
            }
            const lerpSpeed = 0.05;
            this._currentRadius += (this.targetRadius - this._currentRadius) * lerpSpeed;
            if (this.shrinking) {
                if (Math.abs(this._currentRadius - this.targetRadius) < 0.5) {
                    this.hasShrunk = true;
                    this.shrinking = false;
                }
            } else if (this.hasShrunk) {
                if (Math.abs(this._currentRadius - this.targetRadius) < 0.5) {
                    this.hasShrunk = false;
                }
            }
        }
        triggerExplosionShrink() {
            const maxAdditionalShrink = 0.4;
            const shrinkReduction = Math.min(this.growth / 200, maxAdditionalShrink);
            const shrinkRatio = 0.5 + shrinkReduction;
            this.targetRadius = (this.baseRadius + this.growth) * shrinkRatio;
            this.shrinking = true;
        }
        draw() {
            this.updateRadius();
            const r = this._currentRadius;
            const brightnessFactor = Math.min(0.2 + r / 1000, 0.8);
            const outerRingRadius = r * 1.3;
            ctx.save();
            ctx.translate(this.x, this.y);
            this.ringRotation += 0.002;
            ctx.rotate(this.ringRotation);
            ctx.scale(1.1, 1);
            const diskGradient = ctx.createRadialGradient(0, 0, r, 0, 0, outerRingRadius);
            diskGradient.addColorStop(0, `hsla(${this.ringHue}, 100%, 50%, ${brightnessFactor})`);
            diskGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.beginPath();
            ctx.arc(0, 0, outerRingRadius, 0, Math.PI * 2);
            ctx.fillStyle = diskGradient;
            ctx.fill();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 1.1, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${this.ringHue}, 100%, 50%, 0.01)`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    const blackHole = new BlackHole();
    const stars = [];
    const numStars = 200;
    for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
    }

    let lastExplosion = Date.now();
    let animationRunning = true;

    function animate() {
        if (!animationRunning) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        blackHole.draw();
        stars.forEach((star) => {
            star.update();
            star.draw();
        });
        const now = Date.now();
        if (now - lastExplosion > explosionInterval) {
            stars.forEach((star) => star.shockwave());
            blackHole.triggerExplosionShrink();
            lastExplosion = now;
        }
        if (blackHole.currentRadius > 500) {
            animationRunning = false;
            return;
        }
        requestAnimationFrame(animate);
    }
    animate();

    // Fetch block height
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

    // Fetch block timestamp
    const blockTimestampElement = document.getElementById('blockTimestamp');
    if (blockTimestampElement) {
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
                    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

                    blockTimestampElement.textContent =
                        `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (UTC)`;
                } else {
                    blockTimestampElement.textContent = 'N/A';
                }
            })
            .catch((err) => {
                blockTimestampElement.textContent = 'N/A';
                console.error(err);
            });
    }

    // Fetch txn count
    const txnCountElement = document.getElementById('txnCount');
    if (txnCountElement) {
        fetch('https://api.sentichain.com/blockchain/get_total_number_of_transactions?network=mainnet')
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

/****************************************************************************
 * 2) APP.HTML LOGIC (Block Explorer + Event Map)
 ****************************************************************************/
function openTab(evt, tabName) {
    const tablinks = document.querySelectorAll('.tablinks');
    tablinks.forEach((tab) => tab.classList.remove('active'));
    const tabcontents = document.querySelectorAll('.tabcontent');
    tabcontents.forEach((content) => (content.style.display = 'none'));
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');
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

// ---------------------------------------------------------------------------
// ADDED FOR REQUIREMENT: We'll refactor the block fetch logic into a function
// so we can call it programmatically (e.g., to fetch the last block).
// ---------------------------------------------------------------------------
function doBlockExplorerFetch(network, blockNumber) {
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

    // reset
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

    const GET_BLOCK_BY_NUMBER_URL = `https://api.sentichain.com/blockchain/get_block_by_number?network=${encodeURIComponent(
        network
    )}&block_number=${encodeURIComponent(parseInt(blockNumber))}`;

    fetch(GET_BLOCK_BY_NUMBER_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => {
            if (response.status === 404) {
                throw new Error('Block not found.');
            }
            if (!response.ok) {
                throw new Error(
                    `Server error: ${response.status} ${response.statusText}`
                );
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
                'transactions',
                'validator',
            ];
            for (let field of requiredFields) {
                if (!(field in block)) {
                    throw new Error(`Missing field in response: ${field}`);
                }
            }

            // Fill block info
            blockNumberInfoSpan.innerText = block.block_number;
            blockHashSpan.innerText = block.hash;
            blockPreviousHashSpan.innerText = block.previous_hash;
            blockConsensusRootSpan.innerText = block.consensus_root;
            blockTimestampSpan.innerText = formatTimestamp(block.timestamp);
            blockValidatorSpan.innerText = block.validator;

            // Transactions
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

                    // ID suffix
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

// Whenever the form is submitted
const blockExplorerForm = document.getElementById('blockExplorerForm');
if (blockExplorerForm) {
    blockExplorerForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const networkSelect = document.getElementById('network');
        const blockNumberInput = document.getElementById('blockNumber');
        const network = networkSelect.value;
        const blockNumber = blockNumberInput.value.trim();

        doBlockExplorerFetch(network, blockNumber);
    });
}

/* Event Map Logic */
const eventMapCanvas = document.getElementById('pointsCanvas');
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

    let minX, maxX, minY, maxY;
    const margin = 50;
    let autoSlideInterval = null;

    let isEventMapAnimating = false;
    let eventMapStartTime = performance.now();

    // userView is our "camera" in data coords
    let userView = { x: 0, y: 0, width: 1, height: 1 };

    // For panning
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let initViewX = 0;
    let initViewY = 0;

    // For pinch
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
                    (eventMapCanvas.height - margin - initialPinchCenter.y) *
                        scaleYdata;

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

            const url = `https://api.sentichain.com/mapper/get_points_by_block_range_no_embedding?start_block=${startBlock}&end_block=${endBlock}`;
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

    // Tooltips
    eventMapCanvas.addEventListener('mousemove', (event) => {
        if (isPanning || pinchMode) {
            tooltip.style.display = 'none';
            return;
        }
        const rect = eventMapCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        let hoveredObject = null;

        // Check centroids
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

        // Check points
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
}

// ---------------------------------------------------------------------------
// ADDED FOR REQUIREMENT: Open the correct tab if ?tab=..., and fetch last block if ?block=last
// ---------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const blockParam = params.get('block');

    // If tab=BlockExplorer or tab=EventMap, programmatically open that tab
    if (tab === 'BlockExplorer') {
        // Simulate a click on the Block Explorer tab link
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

    // If block=last => fetch chain length => doBlockExplorerFetch with chain_length - 1
    if (blockParam === 'last') {
        // Ensure Block Explorer tab is shown
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
});
