import { fetchJson } from './utils.js'

let isEventMapAnimating = false
let blockPointsData = {}
let allRangePoints = []
let availableBlocks = []
let currentBlockNumber = 0
let minX, maxX, minY, maxY
let userView = { x: 0, y: 0, width: 1, height: 1 }
const margin = 50
let eventMapCanvas, ctxMap
let isPanning = false
let pinchMode = false
let panStartX = 0
let panStartY = 0
let initViewX = 0
let initViewY = 0
let initialPinchDist = 0
let initialPinchCenter = { x: 0, y: 0 }
let initViewOnPinch = { x: 0, y: 0, width: 1, height: 1 }
let clusterInfo = {}
let eventMapStartTime = performance.now()
let autoSlideInterval = null

export function initEventMap() {
    eventMapCanvas = document.getElementById('pointsCanvas')
    if (!eventMapCanvas) return
    ctxMap = eventMapCanvas.getContext('2d')
    const mapProcessingMessage = document.getElementById('mapProcessingMessage')
    const startBlockInput = document.getElementById('startBlockInput')
    const endBlockInput = document.getElementById('endBlockInput')
    const fetchRangeButton = document.getElementById('fetchRangeButton')
    const blockSlider = document.getElementById('blockSlider')
    const autoSlideCheckbox = document.getElementById('autoSlideCheckbox')
    const tooltip = document.getElementById('tooltip')
    if (fetchRangeButton) {
        fetchRangeButton.addEventListener('click', async () => {
            stopAutoSlide()
            mapProcessingMessage.style.display = 'block'
            const startBlock = parseInt(startBlockInput.value.trim(), 10)
            const endBlock = parseInt(endBlockInput.value.trim(), 10)
            const mapApiKey = document.getElementById('mapApiKey').value.trim()
            if (
                isNaN(startBlock) ||
                isNaN(endBlock) ||
                startBlock < 0 ||
                endBlock < 0 ||
                startBlock > endBlock
            ) {
                alert('Please enter valid start/end block numbers.')
                mapProcessingMessage.style.display = 'none'
                return
            }
            if (endBlock - startBlock > 100) {
                alert('Please choose a range of 100 blocks or fewer.')
                mapProcessingMessage.style.display = 'none'
                return
            }
            let url =
                'https://api.sentichain.com/mapper/get_points_by_block_range_no_embedding?start_block=' +
                startBlock +
                '&end_block=' +
                endBlock
            if (mapApiKey) {
                url += '&api_key=' + encodeURIComponent(mapApiKey)
            }
            try {
                const data = await fetchJson(url)
                if (!data.points || !Array.isArray(data.points)) {
                    throw new Error("Response does not contain a valid 'points' array.")
                }
                blockPointsData = {}
                allRangePoints = []
                availableBlocks = []
                data.points.forEach((item) => {
                    const bNum = item[0]
                    if (!blockPointsData[bNum]) {
                        blockPointsData[bNum] = []
                    }
                    blockPointsData[bNum].push({
                        blockNumber: item[0],
                        postLink: item[1],
                        postContent: item[2],
                        x: item[3],
                        y: item[4],
                        clusterNumber: item[5],
                        centroidX: item[6],
                        centroidY: item[7],
                        clusterSummaryShort: item[8],
                        clusterSummaryLong: item[9],
                        blinkOffset: Math.random() * Math.PI * 2,
                    })
                    allRangePoints.push(
                        blockPointsData[bNum][blockPointsData[bNum].length - 1]
                    )
                })
                availableBlocks = Object.keys(blockPointsData)
                    .map((str) => parseInt(str, 10))
                    .sort((a, b) => a - b)
                if (!availableBlocks.length) {
                    alert('No blocks found with points in that range!')
                    resetSlider(blockSlider)
                    mapProcessingMessage.style.display = 'none'
                    return
                }
                calculateBoundingBox(allRangePoints)
                blockSlider.min = 0
                blockSlider.max = availableBlocks.length - 1
                blockSlider.value = 0
                blockSlider.step = 1
                loadBlockPointsByIndex(0)
                resizeCanvasToDisplaySize(eventMapCanvas)
                initUserView()
                if (!isEventMapAnimating) {
                    isEventMapAnimating = true
                    animateEventMap()
                }
                startAutoSlide(blockSlider, autoSlideCheckbox)
            } catch (err) {
                alert('Error fetching range: ' + err.message)
                console.error(err)
            } finally {
                mapProcessingMessage.style.display = 'none'
            }
        })
    }
    if (blockSlider) {
        blockSlider.addEventListener('input', () => {
            stopAutoSlide()
            const idx = parseInt(blockSlider.value, 10)
            loadBlockPointsByIndex(idx)
        })
    }
    if (autoSlideCheckbox) {
        autoSlideCheckbox.addEventListener('change', () => {
            if (autoSlideCheckbox.checked) {
                stopAutoSlide()
            } else {
                startAutoSlide(blockSlider, autoSlideCheckbox)
            }
        })
    }
    window.addEventListener('load', () => {
        if (!startBlockInput.value.trim() || !endBlockInput.value.trim()) {
            fetchJson(
                'https://api.sentichain.com/blockchain/get_chain_length?network=mainnet'
            )
                .then((data) => {
                    const chainLength = data.chain_length
                    const defaultEnd = chainLength - 1
                    const defaultStart = Math.max(defaultEnd - 50, 0)
                    if (!endBlockInput.value.trim()) {
                        endBlockInput.value = defaultEnd
                    }
                    if (!startBlockInput.value.trim()) {
                        startBlockInput.value = defaultStart
                    }
                })
                .catch((err) => console.error('Error fetching chain length:', err))
                .finally(() => {
                    resizeCanvasToDisplaySize(eventMapCanvas)
                    drawAll()
                })
        } else {
            resizeCanvasToDisplaySize(eventMapCanvas)
            drawAll()
        }
    })
    setupCanvasInteraction(tooltip)
    window.addEventListener('resize', reflowEventMapCanvas)
}

function loadBlockPointsByIndex(index) {
    currentBlockNumber = availableBlocks[index]
    const points = blockPointsData[currentBlockNumber] || []
    setupClusterInfo(points)
}

function resetSlider(blockSlider) {
    blockSlider.min = 0
    blockSlider.max = 0
    blockSlider.value = 0
}

function startAutoSlide(blockSlider, autoSlideCheckbox) {
    stopAutoSlide()
    if (availableBlocks.length <= 1) return
    autoSlideInterval = setInterval(() => {
        let idx = parseInt(blockSlider.value, 10)
        idx++
        if (idx > availableBlocks.length - 1) {
            idx = 0
        }
        blockSlider.value = idx
        loadBlockPointsByIndex(idx)
    }, 1000)
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval)
        autoSlideInterval = null
    }
}

function setupClusterInfo(pointsArray) {
    clusterInfo = {}
    const clusterMap = {}
    pointsArray.forEach((p) => {
        const cNum = p.clusterNumber
        if (!clusterMap[cNum]) {
            clusterMap[cNum] = []
        }
        clusterMap[cNum].push(p)
    })
    Object.keys(clusterMap).forEach((cNumStr) => {
        const cNum = parseInt(cNumStr, 10)
        const clusterPoints = clusterMap[cNum]
        const hue = (cNum * 50) % 360
        const lines = buildLinesForCluster(clusterPoints)
        clusterInfo[cNum] = {
            centroidX: clusterPoints[0].centroidX,
            centroidY: clusterPoints[0].centroidY,
            shortSummary: clusterPoints[0].clusterSummaryShort,
            longSummary: clusterPoints[0].clusterSummaryLong,
            color: 'hsl(' + hue + ', 100%, 50%)',
            hue,
            points: clusterPoints,
            lines,
        }
    })
    allRangePoints = pointsArray
}

function buildLinesForCluster(points) {
    if (points.length < 2) return []
    const lines = []
    const used = new Set()
    used.add(0)
    const n = points.length
    function dist(i, j) {
        const dx = points[i].x - points[j].x
        const dy = points[i].y - points[j].y
        return Math.sqrt(dx * dx + dy * dy)
    }
    while (used.size < n) {
        let bestEdge = null
        let minDistance = Infinity
        for (let i of used) {
            for (let j = 0; j < n; j++) {
                if (!used.has(j)) {
                    const d = dist(i, j)
                    if (d < minDistance) {
                        minDistance = d
                        bestEdge = [i, j]
                    }
                }
            }
        }
        if (!bestEdge) break
        lines.push({
            i: bestEdge[0],
            j: bestEdge[1],
            blinkOffset: Math.random() * Math.PI * 2,
        })
        used.add(bestEdge[1])
    }
    return lines
}

function calculateBoundingBox(pointsArray) {
    if (!pointsArray.length) {
        minX = -1
        maxX = 1
        minY = -1
        maxY = 1
        return
    }
    minX = Math.min(...pointsArray.map((p) => Math.min(p.x, p.centroidX)))
    maxX = Math.max(...pointsArray.map((p) => Math.max(p.x, p.centroidX)))
    minY = Math.min(...pointsArray.map((p) => Math.min(p.y, p.centroidY)))
    maxY = Math.max(...pointsArray.map((p) => Math.max(p.y, p.centroidY)))
}

function initUserView() {
    const dataWidth = maxX - minX
    const dataHeight = maxY - minY
    const factor = 1.1
    userView.width = dataWidth * factor
    userView.height = dataHeight * factor
    const dataCenterX = (minX + maxX) / 2
    const dataCenterY = (minY + maxY) / 2
    userView.x = dataCenterX - userView.width / 2
    userView.y = dataCenterY - userView.height / 2
    clampUserView()
}

function animateEventMap() {
    if (!isEventMapAnimating) return
    drawAll()
    requestAnimationFrame(animateEventMap)
}

function drawAll() {
    ctxMap.clearRect(0, 0, eventMapCanvas.width, eventMapCanvas.height)
    Object.keys(clusterInfo).forEach((cNum) => {
        drawZodiacLines(clusterInfo[cNum])
    })
    allRangePoints.forEach(drawPoint)
    Object.keys(clusterInfo).forEach((cNum) => {
        drawCentroid(clusterInfo[cNum])
        drawShortSummaryText(clusterInfo[cNum])
    })
    drawWatermark()
}

function drawWatermark() {
    ctxMap.save()
    ctxMap.font = "16px 'Roboto', sans-serif"
    ctxMap.fillStyle = 'rgba(255, 255, 255, 0.5)'
    const text = 'Block Height: ' + currentBlockNumber
    const textWidth = ctxMap.measureText(text).width
    ctxMap.fillText(text, eventMapCanvas.width - textWidth - 10, 30)
    ctxMap.restore()
}

function drawZodiacLines(cluster) {
    if (!cluster.lines.length) return
    const currentTime = (performance.now() - eventMapStartTime) / 1000
    cluster.lines.forEach((lineObj) => {
        const flicker = 0.5 + 0.5 * Math.sin(currentTime * 2 + lineObj.blinkOffset)
        const alpha = 0.2 + 0.7 * flicker
        const strokeColor = 'hsla(' + cluster.hue + ', 100%, 25%, ' + alpha + ')'
        ctxMap.save()
        ctxMap.strokeStyle = strokeColor
        ctxMap.lineWidth = 1.5
        ctxMap.beginPath()
        const p1 = cluster.points[lineObj.i]
        const p2 = cluster.points[lineObj.j]
        ctxMap.moveTo(scaleX(p1.x), scaleY(p1.y))
        ctxMap.lineTo(scaleX(p2.x), scaleY(p2.y))
        ctxMap.stroke()
        ctxMap.restore()
    })
}

function drawPoint(point) {
    const currentTime = (performance.now() - eventMapStartTime) / 1000
    const flicker = 0.5 + 0.5 * Math.sin(currentTime * 2 + point.blinkOffset)
    const alpha = 0.3 + 0.7 * flicker
    const cInfo = clusterInfo[point.clusterNumber]
    let fillColor = 'hsla(0,0%,100%,1)'
    if (cInfo) {
        fillColor = 'hsla(' + cInfo.hue + ',100%,50%,' + alpha + ')'
    }
    ctxMap.beginPath()
    ctxMap.arc(scaleX(point.x), scaleY(point.y), 4, 0, Math.PI * 2)
    ctxMap.fillStyle = fillColor
    ctxMap.fill()
}

function drawCentroid(cluster) {
    const cX = scaleX(cluster.centroidX)
    const cY = scaleY(cluster.centroidY)
    ctxMap.save()
    ctxMap.fillStyle = cluster.color
    ctxMap.beginPath()
    ctxMap.moveTo(cX, cY - 8)
    ctxMap.lineTo(cX + 8, cY)
    ctxMap.lineTo(cX, cY + 8)
    ctxMap.lineTo(cX - 8, cY)
    ctxMap.closePath()
    ctxMap.fill()
    ctxMap.restore()
}

function drawShortSummaryText(cluster) {
    ctxMap.save()
    ctxMap.fillStyle = '#E0E0E0'
    ctxMap.font = "14px 'Roboto', sans-serif"
    const cX = scaleX(cluster.centroidX)
    const cY = scaleY(cluster.centroidY)
    const maxWidth = 150
    const lineHeight = 16
    wrapText(ctxMap, cluster.shortSummary, cX + 10, cY - 10, maxWidth, lineHeight)
    ctxMap.restore()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ')
    let line = ''
    let currentY = y
    for (let w of words) {
        const testLine = line + w + ' '
        const testWidth = ctx.measureText(testLine).width
        if (testWidth > maxWidth && line.length > 0) {
            ctx.fillText(line, x, currentY)
            line = w + ' '
            currentY += lineHeight
        } else {
            line = testLine
        }
    }
    if (line) ctx.fillText(line, x, currentY)
}

function scaleX(xVal) {
    const scale = (eventMapCanvas.width - 2 * margin) / (userView.width || 1)
    return margin + (xVal - userView.x) * scale
}

function scaleY(yVal) {
    const scale = (eventMapCanvas.height - 2 * margin) / (userView.height || 1)
    return eventMapCanvas.height - margin - (yVal - userView.y) * scale
}

function clampUserView() {
    if (userView.width > maxX - minX) {
        userView.width = maxX - minX
    }
    if (userView.height > maxY - minY) {
        userView.height = maxY - minY
    }
    if (userView.x < minX) userView.x = minX
    if (userView.x + userView.width > maxX) {
        userView.x = maxX - userView.width
    }
    if (userView.y < minY) userView.y = minY
    if (userView.y + userView.height > maxY) {
        userView.y = maxY - userView.height
    }
}

function resizeCanvasToDisplaySize(canvasElem) {
    const width = canvasElem.clientWidth
    const height = canvasElem.clientHeight
    if (canvasElem.width !== width || canvasElem.height !== height) {
        canvasElem.width = width
        canvasElem.height = height || 400
    }
}

function setupCanvasInteraction(tooltip) {
    eventMapCanvas.addEventListener(
        'wheel',
        (e) => {
            e.preventDefault()
            if (!allRangePoints.length) return
            const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1
            const rect = eventMapCanvas.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top
            const scaleXdata = userView.width / (eventMapCanvas.width - 2 * margin)
            const scaleYdata = userView.height / (eventMapCanvas.height - 2 * margin)
            const dataX = userView.x + (mouseX - margin) * scaleXdata
            const dataY =
                userView.y + (eventMapCanvas.height - margin - mouseY) * scaleYdata
            userView.width *= zoomFactor
            userView.height *= zoomFactor
            userView.x = dataX - (dataX - userView.x) * zoomFactor
            userView.y = dataY - (dataY - userView.y) * zoomFactor
            clampUserView()
        },
        { passive: false }
    )
    eventMapCanvas.addEventListener('mousedown', (e) => {
        isPanning = true
        pinchMode = false
        panStartX = e.clientX
        panStartY = e.clientY
        initViewX = userView.x
        initViewY = userView.y
    })
    eventMapCanvas.addEventListener('mousemove', (e) => {
        if (!isPanning) {
            handleHoverTooltip(e, tooltip)
            return
        }
        const dx = e.clientX - panStartX
        const dy = e.clientY - panStartY
        const scaleXdata = userView.width / (eventMapCanvas.width - 2 * margin)
        const scaleYdata = userView.height / (eventMapCanvas.height - 2 * margin)
        userView.x = initViewX - dx * scaleXdata
        userView.y = initViewY + dy * scaleYdata
        clampUserView()
    })
    window.addEventListener('mouseup', () => {
        isPanning = false
    })
    eventMapCanvas.addEventListener(
        'touchstart',
        (e) => {
            if (e.touches.length === 1) {
                isPanning = true
                pinchMode = false
                panStartX = e.touches[0].clientX
                panStartY = e.touches[0].clientY
                initViewX = userView.x
                initViewY = userView.y
            } else if (e.touches.length === 2) {
                pinchMode = true
                isPanning = false
                initialPinchDist = getTouchDistance(e)
                initialPinchCenter = getTouchCenter(e)
                initViewOnPinch = { ...userView }
            }
        },
        { passive: false }
    )
    eventMapCanvas.addEventListener(
        'touchmove',
        (e) => {
            if (pinchMode && e.touches.length === 2) {
                e.preventDefault()
                const newDist = getTouchDistance(e)
                const ratio = newDist / initialPinchDist
                userView.width = initViewOnPinch.width / ratio
                userView.height = initViewOnPinch.height / ratio
                const scaleXdata =
                    initViewOnPinch.width / (eventMapCanvas.width - 2 * margin)
                const scaleYdata =
                    initViewOnPinch.height / (eventMapCanvas.height - 2 * margin)
                const dataX =
                    initViewOnPinch.x + (initialPinchCenter.x - margin) * scaleXdata
                const dataY =
                    initViewOnPinch.y +
                    (eventMapCanvas.height - margin - initialPinchCenter.y) * scaleYdata
                userView.x = dataX - (dataX - initViewOnPinch.x) / ratio
                userView.y = dataY - (dataY - initViewOnPinch.y) / ratio
                clampUserView()
            } else if (isPanning && e.touches.length === 1) {
                e.preventDefault()
                const dx = e.touches[0].clientX - panStartX
                const dy = e.touches[0].clientY - panStartY
                const scaleXdata =
                    userView.width / (eventMapCanvas.width - 2 * margin)
                const scaleYdata =
                    userView.height / (eventMapCanvas.height - 2 * margin)
                userView.x = initViewX - dx * scaleXdata
                userView.y = initViewY + dy * scaleYdata
                clampUserView()
            }
        },
        { passive: false }
    )
    eventMapCanvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) pinchMode = false
        if (e.touches.length === 0) isPanning = false
    })
    eventMapCanvas.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.style.display = 'none'
    })
}

function handleHoverTooltip(e, tooltip) {
    if (!tooltip) return
    if (isPanning || pinchMode) {
        tooltip.style.display = 'none'
        return
    }
    const rect = eventMapCanvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    let hoveredObject = null
    for (let cNum in clusterInfo) {
        const info = clusterInfo[cNum]
        const cX = scaleX(info.centroidX)
        const cY = scaleY(info.centroidY)
        const dist = Math.hypot(mouseX - cX, mouseY - cY)
        if (dist < 10) {
            hoveredObject = { type: 'centroid', data: info }
            break
        }
    }
    if (!hoveredObject) {
        for (let p of allRangePoints) {
            const pX = scaleX(p.x)
            const pY = scaleY(p.y)
            const dist = Math.hypot(mouseX - pX, mouseY - pY)
            if (dist < 6) {
                hoveredObject = { type: 'point', data: p }
                break
            }
        }
    }
    if (!hoveredObject) {
        tooltip.style.display = 'none'
        return
    }
    if (hoveredObject.type === 'centroid') {
        tooltip.innerText = hoveredObject.data.longSummary
    } else {
        tooltip.innerText = hoveredObject.data.postContent
    }
    tooltip.style.display = 'block'
    tooltip.style.left = e.clientX + 10 + 'px'
    tooltip.style.top = e.clientY + 10 + 'px'
}

function getTouchDistance(e) {
    if (e.touches.length < 2) return 1
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
}

function getTouchCenter(e) {
    if (e.touches.length < 2) {
        return { x: 0, y: 0 }
    }
    return {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    }
}

export function reflowEventMapCanvas() {
    if (!eventMapCanvas) return
    if (document.getElementById('EventMap')?.style.display === 'block') {
        resizeCanvasToDisplaySize(eventMapCanvas)
        drawAll()
    }
}
