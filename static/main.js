document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('romantic-audio');

    // Función para crear corazones flotantes
    function createHeart() {
        const heart = document.createElement('div');
        heart.classList.add('floating-heart');
        heart.innerHTML = '❤';
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.animationDuration = Math.random() * 3 + 3 + 's';
        heart.style.fontSize = Math.random() * 1 + 0.5 + 'rem';
        document.body.appendChild(heart);

        setTimeout(() => {
            heart.remove();
        }, 6000);
    }

    setInterval(createHeart, 400);

    // Si estamos en la página del mensaje, intentar reproducir audio
    if (audio) {
        audio.play().catch(error => {
            console.log("Autoplay bloqueado o ya manejado por interacción previa.");
        });
    }
});
