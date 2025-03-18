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

/**********************************************************************
 *  OBSERVATION FETCH FUNCTION
 **********************************************************************/
function formatTimestampUtcString(isoString) {
    const dt = new Date(isoString);
    if (isNaN(dt.getTime())) {
        return isoString;
    }
    const year = dt.getUTCFullYear();
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dt.getUTCDate()).padStart(2, '0');
    const hours = String(dt.getUTCHours()).padStart(2, '0');
    const minutes = String(dt.getUTCMinutes()).padStart(2, '0');
    const seconds = String(dt.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (UTC)`;
}

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
            return data.reasoning;
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
            sentimentRows = deduplicateByTimestamp(sentimentRows);
            eventRows = deduplicateByTimestamp(eventRows);
            marketRows = deduplicateByTimestamp(marketRows);
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
                <h3 style="color:#00FFC8;">Event Observations</h3>
                <table id="eventAnalysisTable" style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                    <thead>
                        <tr style="background:#00FFC8; color:#121212;">
                            <th style="padding:10px; text-align:left; width:220px;">Timestamp</th>
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
                        <td style="padding:10px;">
                          ${(item.timestamp === "A valid API Key is required")
                            ? "A valid API Key is required"
                            : formatTimestampUtcString(item.timestamp)
                        }
                        </td>
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
                            <th style="padding:10px; text-align:left; width:220px;">Timestamp</th>
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
                        <td style="padding:10px;">
                          ${(item.timestamp === "A valid API Key is required")
                            ? "A valid API Key is required"
                            : formatTimestampUtcString(item.timestamp)
                        }
                        </td>
                        <td style="padding:10px;">${item.reasoning}</td>
                      </tr>
                    `;
                });
            }
            finalHTML += `</tbody></table>`;
            finalHTML += `
                <h3 style="color:#00FFC8;">Market Observations</h3>
                <table id="marketAnalysisTable" style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                    <thead>
                        <tr style="background:#00FFC8; color:#121212;">
                            <th style="padding:10px; text-align:left; width:220px;">Timestamp</th>
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
                        <td style="padding:10px;">
                          ${(item.timestamp === "A valid API Key is required")
                            ? "A valid API Key is required"
                            : formatTimestampUtcString(item.timestamp)
                        }
                        </td>
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
                            <th style="padding:10px; text-align:left; width:220px;">Timestamp</th>
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
                        <td style="padding:10px;">
                          ${(item.timestamp === "A valid API Key is required")
                            ? "A valid API Key is required"
                            : formatTimestampUtcString(item.timestamp)
                        }
                        </td>
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
    const observationSubmitBtn = document.getElementById('observationSubmitBtn');

    let isBlockMode = true;

    modeButton.classList.add('block-mode');
    observationInput.placeholder = 'Block Number: e.g. 100';
    observationSubmitBtn.textContent = "Get Observation";
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

    observationModeButton.addEventListener('click', async () => {
        isBlockMode = !isBlockMode;
        if (isBlockMode) {
            observationModeButton.classList.add('block-mode');
            observationModeButton.title = 'Switch to local Timestamp input';
            observationInput.placeholder = 'Block Number: e.g. 100';
            observationSubmitBtn.textContent = 'Get Observation';
            const maybeTimestamp = observationInput.value.trim();
            if (maybeTimestamp) {
                const isoString = parseUserLocalTimestamp(maybeTimestamp);
                if (isoString) {
                    try {
                        const resp = await fetch(
                            `https://api.sentichain.com/blockchain/get_block_number_from_timestamp?network=mainnet&timestamp=${encodeURIComponent(isoString)}`
                        );
                        if (!resp.ok) throw new Error(`Timestamp→Block fetch error (${resp.status})`);
                        const data = await resp.json();
                        if (!data.block_number) throw new Error('No block_number in response.');
                        observationInput.value = data.block_number;
                    } catch (err) {
                        console.error('Error auto-fetching block number:', err);
                    }
                }
            }
        } else {
            observationModeButton.classList.remove('block-mode');
            observationModeButton.title = 'Switch to Block Number input';
            observationInput.placeholder = 'Local Timestamp: e.g. 2025-01-01 13:00:00';
            observationSubmitBtn.textContent = 'Get Observation (≤ Timestamp)';
            const maybeBlockNumber = observationInput.value.trim();
            if (/^\d+$/.test(maybeBlockNumber)) {
                try {
                    const resp = await fetch(
                        `https://api.sentichain.com/blockchain/get_timestamp_from_block_number?network=mainnet&block_number=${encodeURIComponent(maybeBlockNumber)}`
                    );
                    if (!resp.ok) throw new Error(`Block→Timestamp fetch error (${resp.status})`);
                    const data = await resp.json();
                    if (!data.timestamp) throw new Error('No timestamp in response.');
                    observationInput.value = formatApiUtcToLocal(data.timestamp);
                } catch (err) {
                    console.error('Error auto-fetching timestamp:', err);
                }
            }
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
            const isoString = parseUserLocalTimestamp(userInput);
            if (!isoString) {
                alert('Please enter a valid local Timestamp: YYYY-MM-DD HH:MM:SS');
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
});

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
