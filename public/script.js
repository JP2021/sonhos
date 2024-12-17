function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() === "") return;

    appendMessage(userInput, 'user');
    document.getElementById('user-input').value = '';

    // Envia a mensagem para o servidor
    fetch('/interpreta', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensagem: userInput }),
    })
    .then(response => response.json())
    .then(data => {
        appendMessage(data.resposta, 'assistant');
    })
    .catch(error => {
        console.error("Erro ao enviar a mensagem:", error);
    });
}

function appendMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender + '-message');
    messageElement.textContent = message;
    document.getElementById('chat-box').appendChild(messageElement);
    document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;
}
