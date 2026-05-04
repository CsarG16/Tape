document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('dynamic-btn');
    const container = document.querySelector('.container');

    btn.addEventListener('click', () => {
        // Simple micro-animation
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 100);

        // Interaction effect
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        btn.style.background = randomColor;
        document.querySelector('h1').style.backgroundImage = `linear-gradient(to right, ${randomColor}, #fff)`;
        
        console.log("¡Ximenita está viva!");
    });

    // Subtle parallax mouse move effect
    document.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        container.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
});
