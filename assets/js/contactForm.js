export function initContactForm() {
    const contactForm = document.getElementById('contactForm')
    if (!contactForm) return
    contactForm.addEventListener('submit', function (event) {
        const subject =
            'CONTACT-US@SENTICHAIN.COM: ' + document.getElementById('subject').value
        const emailField = document.querySelector('[name="email"]').value
        const messageField = document.querySelector('[name="message"]').value
        const mailtoLink =
            'mailto:info@sentichain.com?subject=' +
            encodeURIComponent(subject) +
            '&body=' +
            encodeURIComponent('REPLY-TO: ' + emailField + '\n\nMESSAGE: ' + messageField)
        this.action = mailtoLink
    })
}
