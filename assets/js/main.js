import { initBlackHoleAnimation } from './animation.js'
import { initBlockExplorer } from './blockExplorer.js'
import { initEventMap, reflowEventMapCanvas } from './eventMap.js'
import { initContactForm } from './contactForm.js'

document.addEventListener('DOMContentLoaded', () => {
    initBlackHoleAnimation()
    initBlockExplorer()
    initEventMap()
    initContactForm()
    setupTabSwitching()
    const clickableBoxes = [
        'blockHeightBox',
        'blockTimeBox',
        'timeElapsedBox',
        'txnCountBox',
    ]
    clickableBoxes.forEach((id) => {
        const box = document.getElementById(id)
        if (box) {
            box.style.cursor = 'pointer'
            box.addEventListener('click', () => {
                window.location.href = '/app?tab=BlockExplorer&block=last'
            })
        }
    })
})

function setupTabSwitching() {
    window.openTab = function (evt, tabName) {
        document.querySelectorAll('.tabcontent').forEach(
            (tc) => (tc.style.display = 'none')
        )
        document.querySelectorAll('.tablinks').forEach((link) =>
            link.classList.remove('active')
        )
        document.getElementById(tabName).style.display = 'block'
        evt.currentTarget.classList.add('active')
        if (tabName === 'EventMap') {
            reflowEventMapCanvas()
        }
    }
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    const blockParam = params.get('block')
    if (tab === 'BlockExplorer') {
        const blockExplorerLink = document.querySelector(
            'a.tablinks[onclick*="BlockExplorer"]'
        )
        if (blockExplorerLink) {
            blockExplorerLink.click()
        }
    } else if (tab === 'EventMap') {
        const eventMapLink = document.querySelector('a.tablinks[onclick*="EventMap"]')
        if (eventMapLink) {
            eventMapLink.click()
        }
    }
    if (blockParam === 'last') {
    }
}
