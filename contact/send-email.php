<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Sanitize inputs
    $email = isset($_POST['email']) ? htmlspecialchars($_POST['email']) : 'No email provided';
    $message = isset($_POST['message']) ? htmlspecialchars($_POST['message']) : 'No message provided';

    // Email details
    $to = "info@sentichain.com";
    $subject = "New Message from Contact Form";
    $body = "Email: $email\n\nMessage:\n$message";
    $headers = "From: $email";

    // Attempt to send the email
    if (mail($to, $subject, $body, $headers)) {
        echo json_encode(['status' => 'success', 'message' => 'Message sent successfully!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to send the message.']);
    }
}
?>