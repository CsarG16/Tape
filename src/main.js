import welcomeHTML from './templates/welcome.html?raw';
import storyHTML from './templates/story.html?raw';
import playerHTML from './templates/player.html?raw';

// SVGs de Heroicons para Play/Pause
const playIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6 ml-0.5"><path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" /></svg>`;
const pauseIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6"><path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" /></svg>`;

// Inyectar las vistas en los contenedores del index.html
document.getElementById('screen-welcome-container').innerHTML = welcomeHTML;
document.getElementById('screen-story-container').innerHTML = storyHTML;
document.getElementById('screen-player-container').innerHTML = playerHTML;

// Playlist Data (Puedes cambiar las canciones y los mensajes aquí)
const playlist = [];

let currentIndex = 0;
let isPlaying = false;
let heartsInterval = null;

// DOM Elements
const screenWelcome = document.getElementById('screen-welcome');
const screenStory = document.getElementById('screen-story');
const screenPlayer = document.getElementById('screen-player');

const screenWelcomeContainer = document.getElementById('screen-welcome-container');
const screenStoryContainer = document.getElementById('screen-story-container');
const screenPlayerContainer = document.getElementById('screen-player-container');

const btnEnter = document.getElementById('btn-enter');
const btnGoToPlayer = document.getElementById('btn-go-to-player');
const btnBackWelcome = document.getElementById('btn-back-welcome');
const btnTogglePlaylist = document.getElementById('btn-toggle-playlist');

const audioPlayer = document.getElementById('audio-player');
const vinyl = document.getElementById('vinyl');
const albumCover = document.getElementById('album-cover');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');

const btnPlayPause = document.getElementById('btn-play-pause');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnLike = document.getElementById('btn-like');

const progressSlider = document.getElementById('progress-slider');
const timeCurrent = document.getElementById('time-current');
const timeDuration = document.getElementById('time-duration');

const btnOpenLetter = document.getElementById('btn-open-letter');
const btnCloseLetter = document.getElementById('btn-close-letter');
const letterOverlay = document.getElementById('letter-overlay');
const letterText = document.getElementById('letter-text');

const btnClosePlaylist = document.getElementById('btn-close-playlist');
const playlistOverlay = document.getElementById('playlist-overlay');
const playlistTracksContainer = document.getElementById('playlist-tracks-container');

const glow1 = document.getElementById('glow-1');
const glow2 = document.getElementById('glow-2');
const glow3 = document.getElementById('glow-3');

// Initialize Playlist Data & State
function loadTrack(index) {
  if (playlist.length === 0) {
    songTitle.textContent = "Sin canciones";
    songArtist.textContent = "Edita src/main.js para agregar música";
    letterText.textContent = "Tu playlist está vacía.\n\nPara empezar, abre el archivo src/main.js y añade tus canciones (título, artista, archivo mp3 y tu carta dedicada) dentro de la lista 'playlist'.";
    audioPlayer.src = "";
    return;
  }
  currentIndex = index;
  const track = playlist[index];
  
  // Update texts and assets
  songTitle.textContent = track.title;
  songArtist.textContent = track.artist;
  letterText.textContent = track.message;
  
  // Set audio source
  audioPlayer.src = track.src;
  
  // Update ambient glows smoothly
  if (track.glowColors) {
    glow1.style.backgroundColor = track.glowColors.glow1;
    glow2.style.backgroundColor = track.glowColors.glow2;
    glow3.style.backgroundColor = track.glowColors.glow3;
  }
  
  // Reset slider and times
  progressSlider.value = 0;
  timeCurrent.textContent = "0:00";
  timeDuration.textContent = "0:00";
  
  // Highlight active item in playlist bottom sheet
  updatePlaylistActiveState();
}

function updatePlaylistActiveState() {
  const items = playlistTracksContainer.querySelectorAll('.track-item');
  items.forEach((item, idx) => {
    if (idx === currentIndex) {
      item.classList.add('bg-palo-rosa-200/60');
      item.classList.remove('bg-palo-rosa-100/50');
      item.querySelector('.active-indicator').classList.remove('hidden');
    } else {
      item.classList.remove('bg-palo-rosa-200/60');
      item.classList.add('bg-palo-rosa-100/50');
      item.querySelector('.active-indicator').classList.add('hidden');
    }
  });
}

// Play / Pause Logic
function playTrack() {
  if (playlist.length === 0) return;
  audioPlayer.play().then(() => {
    isPlaying = true;
    btnPlayPause.innerHTML = pauseIconSVG;
  }).catch((e) => {
    console.error("Audio playback error:", e);
  });
}

function pauseTrack() {
  if (playlist.length === 0) return;
  audioPlayer.pause();
  isPlaying = false;
  btnPlayPause.innerHTML = playIconSVG;
}

function togglePlay() {
  if (playlist.length === 0) return;
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

function nextTrack() {
  if (playlist.length === 0) return;
  let nextIdx = currentIndex + 1;
  if (nextIdx >= playlist.length) nextIdx = 0;
  loadTrack(nextIdx);
  if (isPlaying) {
    playTrack();
  } else {
    // Si estaba en pausa, solo cargar la pista sin reproducir
    audioPlayer.load();
  }
}

function prevTrack() {
  if (playlist.length === 0) return;
  let prevIdx = currentIndex - 1;
  if (prevIdx < 0) prevIdx = playlist.length - 1;
  loadTrack(prevIdx);
  if (isPlaying) {
    playTrack();
  } else {
    audioPlayer.load();
  }
}

// Time Formatting helper (e.g. 125 -> 2:05)
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Audio events
audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressSlider.value = progress;
    timeCurrent.textContent = formatTime(audioPlayer.currentTime);
  }
});

audioPlayer.addEventListener('loadedmetadata', () => {
  timeDuration.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener('ended', () => {
  nextTrack();
  playTrack();
});

// Slider interaction (seek)
progressSlider.addEventListener('input', () => {
  if (audioPlayer.duration) {
    const time = (progressSlider.value / 100) * audioPlayer.duration;
    timeCurrent.textContent = formatTime(time);
  }
});

progressSlider.addEventListener('change', () => {
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (progressSlider.value / 100) * audioPlayer.duration;
  }
});

// Build Playlist Bottom Sheet
function buildPlaylistUI() {
  playlistTracksContainer.innerHTML = '';
  if (playlist.length === 0) {
    playlistTracksContainer.innerHTML = '<p class="text-xs text-neutral-soft-500 text-center py-8">No hay canciones añadidas aún</p>';
    return;
  }
  playlist.forEach((track, idx) => {
    const trackDiv = document.createElement('div');
    trackDiv.className = 'track-item flex items-center justify-between p-4 bg-palo-rosa-100/50 rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98]';
    trackDiv.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 overflow-hidden bg-black flex items-center justify-center">
          <img src="${track.cover}" class="w-full h-full object-cover" />
        </div>
        <div>
          <h4 class="text-sm font-semibold text-palo-rosa-800 truncate max-w-[180px]">${track.title}</h4>
          <p class="text-xs text-neutral-soft-500">${track.artist}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="active-indicator text-xs text-palo-rosa-500 hidden items-center gap-0.5">
          Sonando
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 inline align-text-bottom">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 0v11.25m0-11.25L9 9.75M9 9.75v11.25m0-11.25L21 6" />
          </svg>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-3.5 h-3.5 text-palo-rosa-400">
          <path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
        </svg>
      </div>
    `;
    
    trackDiv.addEventListener('click', () => {
      loadTrack(idx);
      playTrack();
      closePlaylistSheet();
    });
    
    playlistTracksContainer.appendChild(trackDiv);
  });
}

// Overlay Toggle Functions
function openLetterSheet() {
  closePlaylistSheet(); // Cerrar playlist si estuviera abierta
  letterOverlay.classList.remove('translate-y-full');
}

function closeLetterSheet() {
  letterOverlay.classList.add('translate-y-full');
}

function openPlaylistSheet() {
  closeLetterSheet(); // Cerrar carta de amor si estuviera abierta
  playlistOverlay.classList.remove('translate-y-full');
}

function closePlaylistSheet() {
  playlistOverlay.classList.add('translate-y-full');
}

// Floating Hearts Particle Engine
function createFloatingHeart() {
  const heart = document.createElement('div');
  heart.className = 'floating-heart text-palo-rosa-400';
  
  // Decide character randomly
  const symbols = ['🫀'];
  heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  
  // Random styling
  const size = Math.random() * 0.8 + 0.6; // 0.6rem to 1.4rem
  heart.style.fontSize = `${size}rem`;
  heart.style.left = `${Math.random() * 92 + 4}vw`; // 4vw to 96vw
  
  const drift = Math.random() * 40 - 20; // -20vw to 20vw drift
  const rotation = Math.random() * 360 - 180; // rotation
  heart.style.setProperty('--drift', `${drift}vw`);
  heart.style.setProperty('--rot', `${rotation}deg`);
  
  // Speed up hearts when music is playing!
  const duration = isPlaying ? (Math.random() * 2 + 2.5) : (Math.random() * 3 + 4); 
  heart.style.animationDuration = `${duration}s`;
  heart.style.opacity = Math.random() * 0.4 + 0.4;
  
  document.body.appendChild(heart);
  
  // Clean up
  setTimeout(() => {
    heart.remove();
  }, duration * 1000);
}

// Scroll Story Snapping intersection observer for scroll reveal (de ventana completa)
function initScrollAnimations() {
  const scrollItems = document.querySelectorAll('.scroll-item');
  
  const observerOptions = {
    root: null, // Usa el viewport de la ventana del navegador
    threshold: 0.45 // Se activa cuando casi la mitad de la carta es visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('opacity-40', 'scale-95', 'translate-y-10');
        entry.target.classList.add('opacity-100', 'scale-100', 'translate-y-0');
      } else {
        entry.target.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
        entry.target.classList.add('opacity-40', 'scale-95', 'translate-y-10');
      }
    });
  }, observerOptions);

  scrollItems.forEach(item => {
    observer.observe(item);
  });
}

// Transition 1: Welcome -> Scroll Story
function handleEnter() {
  // Unificar desbloqueo de Audio en iOS: Cargamos el archivo en segundo plano mediante interaccion inicial
  audioPlayer.load();
  audioPlayer.play().then(() => {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }).catch(e => console.log("Audio contextual unlock:", e));

  // Transition welcome screen out
  screenWelcome.classList.add('opacity-0', 'scale-95');
  
  setTimeout(() => {
    screenWelcomeContainer.style.display = 'none';
    
    // Activar scroll en el body
    document.body.style.overflowY = 'auto';
    
    // Transition story screen in
    screenStoryContainer.style.display = 'block';
    screenStory.style.display = 'flex';
    screenStory.offsetHeight; // Force reflow
    screenStory.classList.remove('opacity-0');
    screenStory.classList.add('opacity-100');
    
    // Iniciar lluvia lenta de corazones durante la lectura
    if (!heartsInterval) {
      heartsInterval = setInterval(createFloatingHeart, 900);
    }
  }, 600);
}

// Transition 2: Scroll Story -> Player
function handleGoToPlayer() {
  // Iniciar reproducción de música para real
  playTrack();

  // Aumentar la velocidad de los corazones flotantes
  if (heartsInterval) {
    clearInterval(heartsInterval);
    heartsInterval = setInterval(createFloatingHeart, 450); // Lluvia más intensa
  }

  // Desactivar scroll del body
  document.body.style.overflowY = 'hidden';
  window.scrollTo(0, 0);

  // Transition story screen out
  screenStory.classList.remove('opacity-100');
  screenStory.classList.add('opacity-0');

  setTimeout(() => {
    screenStoryContainer.style.display = 'none';

    // Transition player screen in
    screenPlayerContainer.style.display = 'block';
    screenPlayer.style.display = 'flex';
    screenPlayer.offsetHeight; // Force reflow
    screenPlayer.classList.remove('opacity-0');
    screenPlayer.classList.add('opacity-100');
  }, 600);
}

// Back to Welcome (Reset)
function handleBackToWelcome() {
  pauseTrack();
  screenPlayer.classList.remove('opacity-100');
  screenPlayer.classList.add('opacity-0');
  
  setTimeout(() => {
    screenPlayerContainer.style.display = 'none';
    screenWelcomeContainer.style.display = 'block';
    screenWelcome.style.display = 'flex';
    screenWelcome.offsetHeight;
    screenWelcome.classList.remove('opacity-0', 'scale-95');
    
    // Desactivar scroll
    document.body.style.overflowY = 'hidden';
    window.scrollTo(0, 0);
    
    // Stop hearts when returning
    if (heartsInterval) {
      clearInterval(heartsInterval);
      heartsInterval = null;
    }
  }, 600);
}

// Event Listeners
btnEnter.addEventListener('click', handleEnter);
btnGoToPlayer.addEventListener('click', handleGoToPlayer);
btnBackWelcome.addEventListener('click', handleBackToWelcome);
btnTogglePlaylist.addEventListener('click', openPlaylistSheet);
btnClosePlaylist.addEventListener('click', closePlaylistSheet);
btnOpenLetter.addEventListener('click', openLetterSheet);
btnCloseLetter.addEventListener('click', closeLetterSheet);

btnPlayPause.addEventListener('click', togglePlay);
btnNext.addEventListener('click', nextTrack);
btnPrev.addEventListener('click', prevTrack);

// Like button toggle visual effect
btnLike.addEventListener('click', () => {
  const svg = btnLike.querySelector('svg');
  const isLiked = svg.getAttribute('fill') === 'currentColor';
  if (isLiked) {
    svg.setAttribute('fill', 'none');
    btnLike.classList.remove('text-palo-rosa-500');
    btnLike.classList.add('text-palo-rosa-400');
  } else {
    svg.setAttribute('fill', 'currentColor');
    btnLike.classList.remove('text-palo-rosa-400');
    btnLike.classList.add('text-palo-rosa-500');
    // Trigger a mini heart particle
    createFloatingHeart();
  }
});

// Close sheets when clicking outside them
document.addEventListener('click', (e) => {
  if (!letterOverlay.contains(e.target) && !btnOpenLetter.contains(e.target) && !letterOverlay.classList.contains('translate-y-full')) {
    closeLetterSheet();
  }
  if (!playlistOverlay.contains(e.target) && !btnTogglePlaylist.contains(e.target) && !playlistOverlay.classList.contains('translate-y-full')) {
    closePlaylistSheet();
  }
});

// App Startup
document.addEventListener('DOMContentLoaded', () => {
  buildPlaylistUI();
  loadTrack(0);
  initScrollAnimations();
  
  // Ocultar contenedores de pantallas inactivas explícitamente al inicio
  screenStoryContainer.style.display = 'none';
  screenPlayerContainer.style.display = 'none';
});
