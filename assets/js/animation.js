import { fetchJson } from './utils.js'

export function initBlackHoleAnimation() {
    const canvas = document.getElementById('animationCanvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        blackHole.x = canvas.width / 2
        blackHole.y = canvas.height / 2
    })
    function random(min, max) {
        return Math.random() * (max - min) + min
    }
    class Star {
        constructor() {
            this.reset()
        }
        reset() {
            const angle = random(0, Math.PI * 2)
            const distance = random(canvas.width * 2, canvas.width * 0.5)
            this.x = blackHole.x + Math.cos(angle) * distance
            this.y = blackHole.y + Math.sin(angle) * distance
            const dx = blackHole.x - this.x
            const dy = blackHole.y - this.y
            this.vx = dx * 0.001
            this.vy = dy * 0.001
            this.size = random(1, 3)
            this.brightness = random(0.7, 1)
            this.exploding = false
            this.explodeTimer = 0
        }
        update() {
            const dx = blackHole.x - this.x
            const dy = blackHole.y - this.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const force = 1000 / (distance * distance + 100)
            this.vx += (dx / distance) * force
            this.vy += (dy / distance) * force
            this.x += this.vx
            this.y += this.vy
            if (distance < blackHole.currentRadius) {
                blackHole.growth += 0.5
                this.reset()
            }
            if (this.exploding) {
                this.vx += this.explodeVx
                this.vy += this.explodeVy
                this.explodeTimer--
                if (this.explodeTimer <= 0) {
                    this.exploding = false
                }
            }
        }
        draw() {
            ctx.beginPath()
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`
            ctx.fill()
        }
        shockwave() {
            const dx = this.x - blackHole.x
            const dy = this.y - blackHole.y
            const angle = Math.atan2(dy, dx)
            const speed = 0.01 * random(2, 5)
            this.explodeVx = Math.cos(angle) * speed
            this.explodeVy = Math.sin(angle) * speed
            this.exploding = true
            this.explodeTimer = 60
        }
    }
    class BlackHole {
        constructor() {
            this.x = (2 * canvas.width) / 3
            this.y = canvas.height / 2
            this.baseRadius = 100
            this.growth = 0
            this._currentRadius = this.baseRadius
            this.color = '#000000'
            this.shrinking = false
            this.hasShrunk = false
            this.targetRadius = this.baseRadius
            this.ringHue = 180
            this.ringRotation = 0
        }
        get currentRadius() {
            return this._currentRadius
        }
        set currentRadius(value) {
            this._currentRadius = value
        }
        updateRadius() {
            if (!this.shrinking && !this.hasShrunk) {
                this.targetRadius = this.baseRadius + this.growth
            }
            const lerpSpeed = 0.05
            this._currentRadius += (this.targetRadius - this._currentRadius) * lerpSpeed
            if (this.shrinking) {
                if (Math.abs(this._currentRadius - this.targetRadius) < 0.5) {
                    this.hasShrunk = true
                    this.shrinking = false
                }
            } else if (this.hasShrunk) {
                if (Math.abs(this._currentRadius - this.targetRadius) < 0.5) {
                    this.hasShrunk = false
                }
            }
        }
        triggerExplosionShrink() {
            const maxAdditionalShrink = 0.4
            const shrinkReduction = Math.min(this.growth / 200, maxAdditionalShrink)
            const shrinkRatio = 0.5 + shrinkReduction
            this.targetRadius = (this.baseRadius + this.growth) * shrinkRatio
            this.shrinking = true
        }
        draw() {
            this.updateRadius()
            const r = this._currentRadius
            const brightnessFactor = Math.min(0.2 + r / 1000, 0.8)
            const outerRingRadius = r * 1.3
            ctx.save()
            ctx.translate(this.x, this.y)
            this.ringRotation += 0.002
            ctx.rotate(this.ringRotation)
            ctx.scale(1.1, 1)
            const diskGradient = ctx.createRadialGradient(0, 0, r, 0, 0, outerRingRadius)
            diskGradient.addColorStop(0, `hsla(${this.ringHue}, 100%, 50%, ${brightnessFactor})`)
            diskGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
            ctx.beginPath()
            ctx.arc(0, 0, outerRingRadius, 0, Math.PI * 2)
            ctx.fillStyle = diskGradient
            ctx.fill()
            ctx.restore()
            ctx.beginPath()
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2)
            ctx.fillStyle = this.color
            ctx.fill()
            ctx.beginPath()
            ctx.arc(this.x, this.y, r * 1.1, 0, Math.PI * 2)
            ctx.strokeStyle = `hsla(${this.ringHue}, 100%, 50%, 0.01)`
            ctx.lineWidth = 2
            ctx.stroke()
        }
    }
    const blackHole = new BlackHole()
    const stars = []
    const numStars = 200
    for (let i = 0; i < numStars; i++) {
        stars.push(new Star())
    }
    let lastExplosion = Date.now()
    let explosionInterval = 5000
    let animationRunning = true
    function animate() {
        if (!animationRunning) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        blackHole.draw()
        stars.forEach((star) => {
            star.update()
            star.draw()
        })
        const now = Date.now()
        if (now - lastExplosion > explosionInterval) {
            stars.forEach((star) => star.shockwave())
            blackHole.triggerExplosionShrink()
            lastExplosion = now
        }
        if (blackHole.currentRadius > 500) {
            animationRunning = false
            return
        }
        requestAnimationFrame(animate)
    }
    animate()
    const blockHeightElement = document.getElementById('blockHeight')
    if (blockHeightElement) {
        const url = 'https://api.sentichain.com/blockchain/get_chain_length?network=mainnet'
        fetchJson(url)
            .then((data) => {
                const targetCount = data.chain_length
                let currentCount = Math.max(targetCount - 20, 0)
                blockHeightElement.textContent = currentCount
                const increment = () => {
                    if (currentCount < targetCount) {
                        currentCount++
                        blockHeightElement.textContent = currentCount
                        requestAnimationFrame(increment)
                    } else {
                        blockHeightElement.textContent = targetCount
                    }
                }
                increment()
            })
            .catch((err) => {
                blockHeightElement.textContent = 'N/A'
                console.error(err)
            })
    }
}
