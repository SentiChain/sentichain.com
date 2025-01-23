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

    function throttle(fn, wait) {
        let time = Date.now();
        return function () {
            if ((time + wait - Date.now()) < 0) {
                fn();
                time = Date.now();
            }
        }
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
            this.x = 2 * canvas.width / 3;
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
            const brightnessFactor = Math.min(0.2 + (r / 1000), 0.8);
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
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        const now = Date.now();
        if (now - lastExplosion > explosionInterval) {
            stars.forEach(star => star.shockwave());
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

    // Fetch block count (for the "Network Status" section)
    const blockCountElement = document.getElementById('blockCount');
    if (blockCountElement) {
        fetch("https://api.sentichain.com/blockchain/get_chain_length?network=mainnet")
            .then(res => res.json())
            .then(data => {
                const targetCount = data.chain_length;
                let currentCount = Math.max(targetCount - 20, 0);
                blockCountElement.textContent = currentCount;
                const increment = () => {
                    if (currentCount < targetCount) {
                        currentCount++;
                        blockCountElement.textContent = currentCount;
                        requestAnimationFrame(increment);
                    } else {
                        blockCountElement.textContent = targetCount;
                    }
                };
                increment();
            })
            .catch(err => {
                blockCountElement.textContent = "N/A";
                console.error(err);
            });
    }
}

/****************************************************************************
 * 2) APP.HTML LOGIC (Block Explorer + Event Map)
 ****************************************************************************/
function openTab(evt, tabName) {
    const tablinks = document.querySelectorAll(".tablinks");
    tablinks.forEach((tab) => tab.classList.remove("active"));
    const tabcontents = document.querySelectorAll(".tabcontent");
    tabcontents.forEach((content) => (content.style.display = "none"));
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

function copyToClipboard(elementId) {
    let text = "";
    const element = document.getElementById(elementId);
    if (element) text = element.innerText;
    navigator.clipboard
        .writeText(text)
        .then(() => {
            // figure out which feedback element to show
            let feedbackId;
            if (elementId.startsWith("block")) {
                const suffix = elementId.replace("block", "");
                feedbackId = "copyFeedback" + suffix.charAt(0).toUpperCase() + suffix.slice(1);
            } else if (elementId.startsWith("transaction")) {
                const suffix = elementId.replace(/transaction[A-Z][a-z]+_/, "");
                const prefix = elementId.match(/transaction([A-Za-z]+)/)[1];
                feedbackId = "copyFeedback" + prefix.charAt(0).toUpperCase() + prefix.slice(1) + "_" + suffix;
            } else {
                feedbackId = "copyFeedback" + elementId.replace("Output", "");
            }

            const feedback = document.getElementById(feedbackId);
            if (feedback) {
                feedback.classList.add("show");
                setTimeout(() => {
                    feedback.classList.remove("show");
                }, 2000);
            }

            if (element) {
                const originalColor = element.style.backgroundColor;
                element.style.backgroundColor = "#00FFC8";
                setTimeout(() => {
                    element.style.backgroundColor = originalColor;
                }, 500);
            }
        })
        .catch((err) => {
            console.error("Failed to copy: ", err);
            alert("Failed to copy the content. Please try manually.");
        });
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

/* Block Explorer */
const blockExplorerForm = document.getElementById("blockExplorerForm");
if (blockExplorerForm) {
    blockExplorerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const networkSelect = document.getElementById("network");
        const blockNumberInput = document.getElementById("blockNumber");
        const network = networkSelect.value;
        const blockNumber = blockNumberInput.value.trim();

        const resultDiv = document.getElementById("blockExplorerResult");
        const processingMessage = document.getElementById("blockProcessingMessage");
        const blockInfoDiv = document.getElementById("blockInfo");
        const blockHashSpan = document.getElementById("blockHash");
        const blockNumberInfoSpan = document.getElementById("blockNumberInfo");
        const blockTimestampSpan = document.getElementById("blockTimestamp");
        const blockTransactionsDiv = document.getElementById("blockTransactions");
        const blockConsensusRootSpan = document.getElementById("blockConsensusRoot");
        const blockPreviousHashSpan = document.getElementById("blockPreviousHash");
        const blockValidatorSpan = document.getElementById("blockValidator");
        const blockErrorMessageDiv = document.getElementById("blockErrorMessage");
        const transactionsTableBody = document.querySelector("#transactionsTable tbody");

        // reset
        resultDiv.classList.remove("error");
        processingMessage.style.display = "none";
        blockInfoDiv.style.display = "none";
        blockErrorMessageDiv.style.display = "none";
        blockHashSpan.innerText = "";
        blockNumberInfoSpan.innerText = "";
        blockTimestampSpan.innerText = "";
        blockConsensusRootSpan.innerText = "";
        blockPreviousHashSpan.innerText = "";
        blockValidatorSpan.innerText = "";
        transactionsTableBody.innerHTML = "";
        blockTransactionsDiv.style.display = "none";

        if (!network) {
            blockErrorMessageDiv.innerText = "Please select a network.";
            blockErrorMessageDiv.style.display = "block";
            resultDiv.style.display = "block";
            return;
        }
        if (blockNumber === "" || isNaN(blockNumber) || parseInt(blockNumber) < 0) {
            blockErrorMessageDiv.innerText = "Please enter a valid block number.";
            blockErrorMessageDiv.style.display = "block";
            resultDiv.style.display = "block";
            return;
        }

        processingMessage.style.display = "block";
        resultDiv.style.display = "block";

        const GET_BLOCK_BY_NUMBER_URL = `https://api.sentichain.com/blockchain/get_block_by_number_no_embedding?network=${encodeURIComponent(network)}&block_number=${encodeURIComponent(parseInt(blockNumber))}`;

        fetch(GET_BLOCK_BY_NUMBER_URL, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        })
            .then((response) => {
                if (response.status === 404) {
                    throw new Error("Block not found.");
                }
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                if (!("block" in data)) {
                    throw new Error('Missing "block" data in response.');
                }
                const block = data.block;
                const requiredFields = [
                    "block_number",
                    "consensus_root",
                    "hash",
                    "previous_hash",
                    "timestamp",
                    "transactions",
                    "validator",
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
                        const row = document.createElement("tr");

                        const txHashCell = document.createElement("td");
                        txHashCell.innerText = txHash;
                        row.appendChild(txHashCell);

                        const timestampCell = document.createElement("td");
                        timestampCell.innerText = formatTimestamp(tx.post_timestamp);
                        row.appendChild(timestampCell);

                        const actionsCell = document.createElement("td");
                        const toggleDetailsBtn = document.createElement("button");
                        toggleDetailsBtn.innerText = "View Details";
                        toggleDetailsBtn.classList.add("submit-btn");

                        const detailsRow = document.createElement("tr");
                        detailsRow.style.display = "none";
                        detailsRow.classList.add("details-row");
                        const detailsCell = document.createElement("td");
                        detailsCell.colSpan = 3;

                        function serializeVector(vec) {
                            return `[${vec.map((n) => (Number.isInteger(n) ? n.toFixed(1) : n)).join(", ")}]`;
                        }
                        const serializedVector = serializeVector(tx.vector);

                        // ID suffix
                        const sanitizedTxHash = txHash.replace(/[^a-zA-Z0-9]/g, "_");
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
                            if (detailsRow.style.display === "none") {
                                detailsRow.style.display = "table-row";
                                toggleDetailsBtn.innerText = "Hide Details";
                            } else {
                                detailsRow.style.display = "none";
                                toggleDetailsBtn.innerText = "View Details";
                            }
                        };

                        actionsCell.appendChild(toggleDetailsBtn);
                        row.appendChild(actionsCell);
                        transactionsTableBody.appendChild(row);
                        transactionsTableBody.appendChild(detailsRow);
                    }
                }
                if (Object.keys(transactions).length > 0) {
                    blockTransactionsDiv.style.display = "block";
                }
                processingMessage.style.display = "none";
                blockInfoDiv.style.display = "block";
            })
            .catch((error) => {
                console.error("Block Explorer Error:", error);
                resultDiv.classList.add("error");
                blockErrorMessageDiv.innerText = `Error: ${error.message}`;
                blockErrorMessageDiv.style.display = "block";
                processingMessage.style.display = "none";
                blockInfoDiv.style.display = "none";
            });
    });
}

/* Event Map Logic */
const eventMapCanvas = document.getElementById("pointsCanvas");
if (eventMapCanvas) {
    const mapProcessingMessage = document.getElementById("mapProcessingMessage");
    const startBlockInput = document.getElementById("startBlockInput");
    const endBlockInput = document.getElementById("endBlockInput");
    const fetchRangeButton = document.getElementById("fetchRangeButton");
    const blockSlider = document.getElementById("blockSlider");
    const autoSlideCheckbox = document.getElementById("autoSlideCheckbox");
    const tooltip = document.getElementById("tooltip");

    const ctxMap = eventMapCanvas.getContext("2d");

    let blockPointsData = {};
    let allPoints = [];
    let clusterInfo = {};
    let allRangePoints = [];
    let availableBlocks = [];

    let minX, maxX, minY, maxY;
    const margin = 50;
    let autoSlideInterval = null;

    function resizeCanvasToDisplaySize(canvasElem) {
        const width = canvasElem.clientWidth;
        const height = canvasElem.clientHeight;
        if (canvasElem.width !== width || canvasElem.height !== height) {
            canvasElem.width = width;
            canvasElem.height = height || 400; // fallback if height is 0
        }
    }

    function drawAll() {
        ctxMap.clearRect(0, 0, eventMapCanvas.width, eventMapCanvas.height);
        // draw centroids first
        Object.keys(clusterInfo).forEach((cNum) => {
            drawCentroid(cNum);
        });
        // draw points
        allPoints.forEach(drawPoint);
        // summary text near centroids
        Object.keys(clusterInfo).forEach((cNum) => {
            drawShortSummaryText(cNum);
        });
    }

    function scaleX(xVal) {
        const scale = (eventMapCanvas.width - 2 * margin) / (maxX - minX || 1);
        return margin + (xVal - minX) * scale;
    }

    function scaleY(yVal) {
        const scale = (eventMapCanvas.height - 2 * margin) / (maxY - minY || 1);
        return eventMapCanvas.height - margin - (yVal - minY) * scale;
    }

    function drawPoint(point) {
        const cInfo = clusterInfo[point.clusterNumber];
        ctxMap.fillStyle = cInfo ? cInfo.color : "#fff";
        const rX = scaleX(point.x);
        const rY = scaleY(point.y);
        ctxMap.beginPath();
        ctxMap.arc(rX, rY, 4, 0, 2 * Math.PI);
        ctxMap.fill();
    }

    function drawCentroid(clusterNumber) {
        const info = clusterInfo[clusterNumber];
        if (!info) return;
        ctxMap.save();
        ctxMap.fillStyle = info.color;
        const cX = scaleX(info.centroidX);
        const cY = scaleY(info.centroidY);
        // Diamond shape
        ctxMap.beginPath();
        ctxMap.moveTo(cX, cY - 8);
        ctxMap.lineTo(cX + 8, cY);
        ctxMap.lineTo(cX, cY + 8);
        ctxMap.lineTo(cX - 8, cY);
        ctxMap.closePath();
        ctxMap.fill();
        ctxMap.restore();
    }

    function drawShortSummaryText(clusterNumber) {
        const info = clusterInfo[clusterNumber];
        if (!info) return;
        ctxMap.save();
        ctxMap.fillStyle = "#E0E0E0";
        ctxMap.font = "14px 'Roboto', sans-serif";
        const cX = scaleX(info.centroidX);
        const cY = scaleY(info.centroidY);
        ctxMap.fillText(info.shortSummary, cX + 10, cY - 10);
        ctxMap.restore();
    }

    function calculateBoundingBox(pointsArray) {
        if (pointsArray.length === 0) {
            minX = -1; maxX = 1;
            minY = -1; maxY = 1;
            return;
        }
        minX = Math.min(...pointsArray.map((p) => Math.min(p.x, p.centroidX)));
        maxX = Math.max(...pointsArray.map((p) => Math.max(p.x, p.centroidX)));
        minY = Math.min(...pointsArray.map((p) => Math.min(p.y, p.centroidY)));
        maxY = Math.max(...pointsArray.map((p) => Math.max(p.y, p.centroidY)));
    }

    function setupClusterInfo(pointsArray) {
        clusterInfo = {};
        pointsArray.forEach((p) => {
            const cNum = p.clusterNumber;
            if (!clusterInfo[cNum]) {
                clusterInfo[cNum] = {
                    centroidX: p.centroidX,
                    centroidY: p.centroidY,
                    shortSummary: p.clusterSummaryShort,
                    longSummary: p.clusterSummaryLong,
                    color: `hsl(${(cNum * 50) % 360}, 100%, 50%)`,
                };
            }
        });
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
        // speed => 1 second
        autoSlideInterval = setInterval(() => {
            let idx = parseInt(blockSlider.value, 10);
            idx++;
            if (idx > availableBlocks.length - 1) {
                idx = 0;
            }
            blockSlider.value = idx;
            loadBlockPointsByIndex(idx);
            drawAll();
        }, 1000);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    // Add event listeners if present
    if (fetchRangeButton) {
        fetchRangeButton.addEventListener("click", async () => {
            stopAutoSlide();
            mapProcessingMessage.style.display = "block";

            const startBlock = parseInt(startBlockInput.value.trim(), 10);
            const endBlock = parseInt(endBlockInput.value.trim(), 10);

            if (
                isNaN(startBlock) ||
                isNaN(endBlock) ||
                startBlock < 0 ||
                endBlock < 0 ||
                startBlock > endBlock
            ) {
                alert("Please enter valid start/end block numbers.");
                mapProcessingMessage.style.display = "none";
                return;
            }

            if (endBlock - startBlock > 100) {
                alert("Please choose a range of 100 blocks or fewer.");
                mapProcessingMessage.style.display = "none";
                return;
            }

            const url = `https://api.sentichain.com/mapper/get_points_by_block_range?start_block=${startBlock}&end_block=${endBlock}`;
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
                    };
                    blockPointsData[bNum].push(pointObj);
                    allRangePoints.push(pointObj);
                });

                availableBlocks = Object.keys(blockPointsData)
                    .map((b) => parseInt(b, 10))
                    .sort((a, b) => a - b);

                if (availableBlocks.length === 0) {
                    alert("No blocks found with points in that range!");
                    resetSlider();
                    mapProcessingMessage.style.display = "none";
                    return;
                }

                calculateBoundingBox(allRangePoints);
                blockSlider.min = 0;
                blockSlider.max = availableBlocks.length - 1;
                blockSlider.value = 0;
                blockSlider.step = 1;

                loadBlockPointsByIndex(0);
                resizeCanvasToDisplaySize(eventMapCanvas);
                drawAll();
            } catch (err) {
                alert("Error fetching range: " + err.message);
                console.error(err);
            } finally {
                mapProcessingMessage.style.display = "none";
            }
        });
    }

    if (blockSlider) {
        blockSlider.addEventListener("input", () => {
            stopAutoSlide();
            const idx = parseInt(blockSlider.value, 10);
            loadBlockPointsByIndex(idx);
            drawAll();
        });
    }

    if (autoSlideCheckbox) {
        autoSlideCheckbox.addEventListener("change", () => {
            if (autoSlideCheckbox.checked) {
                startAutoSlide();
            } else {
                stopAutoSlide();
            }
        });
    }

    window.addEventListener("resize", () => {
        resizeCanvasToDisplaySize(eventMapCanvas);
        drawAll();
    });

    eventMapCanvas.addEventListener("mousemove", (event) => {
        const rect = eventMapCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        let hoveredObject = null;

        // check centroids
        for (let cNum in clusterInfo) {
            const info = clusterInfo[cNum];
            const cX = scaleX(info.centroidX);
            const cY = scaleY(info.centroidY);
            const dist = Math.hypot(mouseX - cX, mouseY - cY);
            if (dist < 10) {
                hoveredObject = { type: "centroid", data: info };
                break;
            }
        }

        // check points if not centroid
        if (!hoveredObject) {
            for (let p of allPoints) {
                const pX = scaleX(p.x);
                const pY = scaleY(p.y);
                const dist = Math.hypot(mouseX - pX, mouseY - pY);
                if (dist < 6) {
                    hoveredObject = { type: "point", data: p };
                    break;
                }
            }
        }

        if (!hoveredObject) {
            tooltip.style.display = "none";
            return;
        }

        if (hoveredObject.type === "centroid") {
            showTooltip(hoveredObject.data.longSummary, event.clientX, event.clientY);
        } else if (hoveredObject.type === "point") {
            showTooltip(hoveredObject.data.postContent, event.clientX, event.clientY);
        }
    });

    function showTooltip(text, clientX, clientY) {
        tooltip.innerText = text;
        tooltip.style.display = "block";
        tooltip.style.left = clientX + 10 + "px";
        tooltip.style.top = clientY + 10 + "px";
    }

    eventMapCanvas.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
    });

    window.addEventListener("load", () => {
        resizeCanvasToDisplaySize(eventMapCanvas);
        drawAll();
    });
}
