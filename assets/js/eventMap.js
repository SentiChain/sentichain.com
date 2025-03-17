const eventMapCanvas = document.getElementById('pointsCanvas');

let isEventMapBlockMode = true;

const startBlockInput = document.getElementById('startBlockInput');
const startMapToggleButton = document.getElementById('startMapToggleButton');

const endBlockInput = document.getElementById('endBlockInput');
const endMapToggleButton = document.getElementById('endMapToggleButton');

const fetchRangeButton = document.getElementById('fetchRangeButton');

function updateEventMapToggleUI() {
    const startMapToggleButton = document.getElementById('startMapToggleButton');
    const endMapToggleButton = document.getElementById('endMapToggleButton');
    const startBlockInput = document.getElementById('startBlockInput');
    const endBlockInput = document.getElementById('endBlockInput');
    const fetchRangeButton = document.getElementById('fetchRangeButton');

    if (
        !startMapToggleButton ||
        !endMapToggleButton ||
        !startBlockInput ||
        !endBlockInput ||
        !fetchRangeButton
    ) {
        return;
    }

    if (isEventMapBlockMode) {
        startMapToggleButton.classList.add('block-mode');
        startMapToggleButton.title = 'Switch to Timestamp input';
        startBlockInput.placeholder = 'Start Block: e.g. 150';

        endMapToggleButton.classList.add('block-mode');
        endMapToggleButton.title = 'Switch to Timestamp input';
        endBlockInput.placeholder = 'End Block: e.g. 200';

        fetchRangeButton.textContent = 'View Event Map';
    } else {
        startMapToggleButton.classList.remove('block-mode');
        startMapToggleButton.title = 'Switch to Block Number input';
        startBlockInput.placeholder = 'Start Timestamp: e.g. 2025-01-01 13:00:00';

        endMapToggleButton.classList.remove('block-mode');
        endMapToggleButton.title = 'Switch to Block Number input';
        endBlockInput.placeholder = 'End Timestamp: e.g. 2025-01-01 14:00:00';

        fetchRangeButton.textContent = 'View Event Map (≤ Timestamp)';
    }
}

async function tryConvertBlockToTimestamp(inputElem) {
    const blockStr = inputElem.value.trim();
    if (!/^\d+$/.test(blockStr)) return;
    const blockNum = parseInt(blockStr, 10);
    if (blockNum < 0) return;
    try {
        const resp = await fetch(
            `https://api.sentichain.com/blockchain/get_timestamp_from_block_number?network=mainnet&block_number=${encodeURIComponent(blockNum)}`
        );
        if (!resp.ok) throw new Error(`Block→Timestamp fetch error (${resp.status})`);
        const data = await resp.json();
        if (!data.timestamp) throw new Error('No timestamp in response.');
        inputElem.value = formatApiUtcToLocal(data.timestamp);
    } catch (err) {
        console.error('Error auto-fetching timestamp:', err);
    }
}

async function tryConvertTimestampToBlock(inputElem) {
    const localTimeStr = inputElem.value.trim();
    const isoString = parseUserLocalTimestamp(localTimeStr);
    if (!isoString) return;
    try {
        const resp = await fetch(
            `https://api.sentichain.com/blockchain/get_block_number_from_timestamp?network=mainnet&timestamp=${encodeURIComponent(isoString)}`
        );
        if (!resp.ok) throw new Error(`Timestamp→Block fetch error (${resp.status})`);
        const data = await resp.json();
        if (!data.block_number) throw new Error('No block_number in response.');
        inputElem.value = data.block_number;
    } catch (err) {
        console.error('Error auto-fetching block number:', err);
    }
}

function handleEventMapToggle() {
    isEventMapBlockMode = !isEventMapBlockMode;
    if (isEventMapBlockMode) {
        tryConvertTimestampToBlock(startBlockInput);
        tryConvertTimestampToBlock(endBlockInput);
    }
    else {
        tryConvertBlockToTimestamp(startBlockInput);
        tryConvertBlockToTimestamp(endBlockInput);
    }
    updateEventMapToggleUI();
}

if (startMapToggleButton && endMapToggleButton) {
    startMapToggleButton.addEventListener('click', handleEventMapToggle);
    endMapToggleButton.addEventListener('click', handleEventMapToggle);
}

updateEventMapToggleUI();

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

            const startValRaw = startBlockInput.value.trim();
            const endValRaw = endBlockInput.value.trim();
            const mapApiKey = document.getElementById('mapApiKey').value.trim();

            let startBlock, endBlock;

            if (isEventMapBlockMode) {
                // Must be integer block # ≥ 0
                if (!/^\d+$/.test(startValRaw) || !/^\d+$/.test(endValRaw)) {
                    alert('Please enter valid integers for Start/End block.');
                    return;
                }
                startBlock = parseInt(startValRaw, 10);
                endBlock = parseInt(endValRaw, 10);

                if (isNaN(startBlock) || isNaN(endBlock) || startBlock < 0 || endBlock < 0) {
                    alert('Please enter valid non-negative block numbers for Start/End.');
                    mapProcessingMessage.style.display = 'none';
                    return;
                }
            } else {
                const isoStart = parseUserLocalTimestamp(startValRaw);
                const isoEnd = parseUserLocalTimestamp(endValRaw);

                if (!isoStart || !isoEnd) {
                    alert('Please enter valid timestamps in "YYYY-MM-DD HH:MM:SS" format.');
                    return;
                }
                try {
                    const [startResp, endResp] = await Promise.all([
                        fetch(
                            `https://api.sentichain.com/blockchain/get_block_number_from_timestamp?network=mainnet&timestamp=${encodeURIComponent(isoStart)}`
                        ),
                        fetch(
                            `https://api.sentichain.com/blockchain/get_block_number_from_timestamp?network=mainnet&timestamp=${encodeURIComponent(isoEnd)}`
                        ),
                    ]);

                    if (!startResp.ok || !endResp.ok) {
                        throw new Error('Failed to convert timestamps to block numbers.');
                    }

                    const startData = await startResp.json();
                    const endData = await endResp.json();

                    if (!startData.block_number || !endData.block_number) {
                        throw new Error('No block_number found in one or both responses.');
                    }

                    startBlock = parseInt(startData.block_number, 10);
                    endBlock = parseInt(endData.block_number, 10);
                } catch (err) {
                    console.error('Timestamp => block number error:', err);
                    alert('Error converting timestamps to block numbers:\n' + err.message);
                    mapProcessingMessage.style.display = 'none';
                    return;
                }
            }

            if (startBlock > endBlock) {
                alert('Start block cannot be greater than End block.');
                mapProcessingMessage.style.display = 'none';
                return;
            }
            if (endBlock - startBlock > 100) {
                alert('Please choose a range of 100 blocks or fewer.');
                mapProcessingMessage.style.display = 'none';
                return;
            }

            mapProcessingMessage.style.display = 'block';

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
