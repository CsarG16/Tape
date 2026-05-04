document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('romantic-audio');
    const container = document.querySelector('.container');

    // Función para crear corazones flotantes (funciona en ambas páginas)
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
            console.log("Autoplay bloqueado, esperando interacción o ya manejado.");
        });
    }

    // Efecto parallax para el contenedor si existe
    if (container) {
        document.addEventListener('mousemove', (e) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 40;
            container.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        });
    }
});
