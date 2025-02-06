export async function fetchJson(url) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Error ${response.status} - ${response.statusText}`)
    }
    return response.json()
}

export function formatTimestamp(timestampSeconds) {
    if (!timestampSeconds) return 'N/A'
    const date = new Date(timestampSeconds * 1000)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const secs = String(date.getUTCSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${secs} (UTC)`
}

export function copyToClipboard(elementId) {
    const element = document.getElementById(elementId)
    if (!element) return
    const text = element.innerText || element.value || ''
    navigator.clipboard
        .writeText(text)
        .then(() => {
            const feedbackId = `copyFeedback${elementId}`
            const feedback = document.getElementById(feedbackId)
            if (feedback) {
                feedback.classList.add('show')
                setTimeout(() => feedback.classList.remove('show'), 2000)
            }
            const originalColor = element.style.backgroundColor
            element.style.backgroundColor = 'var(--primary-color)'
            setTimeout(() => {
                element.style.backgroundColor = originalColor
            }, 500)
        })
        .catch((err) => {
            console.error('Failed to copy:', err)
            alert('Failed to copy the content. Please try manually.')
        })
}
