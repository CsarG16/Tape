import welcomeHTML from './templates/welcome.html?raw';
import storyHTML from './templates/story.html?raw';
import playerHTML from './templates/player.html?raw';
import { playlist as rawPlaylist } from './playlistData.js';

// Resolve base paths for static assets on deployment platforms like GitHub Pages
const playlist = rawPlaylist.map(track => {
  const base = import.meta.env.BASE_URL; // e.g. '/Tape/' or '/'
  return {
    ...track,
    src: track.src.startsWith('/') ? `${base}${track.src.slice(1)}` : track.src,
    cover: track.cover.startsWith('/') ? `${base}${track.cover.slice(1)}` : track.cover,
  };
});

// SVGs de Heroicons para Play/Pause
const playIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6 ml-0.5"><path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" /></svg>`;
const pauseIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6"><path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" /></svg>`;

// Inyectar las vistas en los contenedores del index.html
document.getElementById('screen-welcome-container').innerHTML = welcomeHTML;
document.getElementById('screen-story-container').innerHTML = storyHTML;
document.getElementById('screen-player-container').innerHTML = playerHTML;

let currentIndex = 0;
let isPlaying = false;
let heartsInterval = null;
let lastActiveIndex = -1; // Rastreador de línea activa de karaoke
let animationFrameId = null; // ID para el loop de requestAnimationFrame
let currentLanguage = 'EN'; // Idioma actual de las letras ('EN' o 'ES')

// Detector de pantalla grande para layout responsivo
const isDesktop = () => window.matchMedia('(min-width: 1280px)').matches;
let currentDesktopTab = 'letter'; // 'letter' o 'lyrics'

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

// Custom Progress Bar DOM (Samsung One UI 8 Widget Style)
const progressBarContainer = document.getElementById('progress-bar-container');
const progressTrack = document.getElementById('progress-track');
const progressFill = document.getElementById('progress-fill');
const progressWaveContainer = document.getElementById('progress-wave-container');
const progressThumb = document.getElementById('progress-thumb');
const progressTooltip = document.getElementById('progress-tooltip');
const timeCurrent = document.getElementById('time-current');
const timeDuration = document.getElementById('time-duration');
let isScrubbing = false; // Estado de arrastre activo

// Card & scroll flow elements (Carta y letras flotantes)
const btnOpenLetter = document.getElementById('btn-open-letter');
const btnBackToControlsFromLetter = document.getElementById('btn-back-to-controls-from-letter');
const letterText = document.getElementById('letter-text');

const btnOpenLyrics = document.getElementById('btn-open-lyrics');
const btnBackToControls = document.getElementById('btn-back-to-controls');
const btnTranslateLyrics = document.getElementById('btn-translate-lyrics');
const lyricsText = document.getElementById('lyrics-text');
const lyricsContainerScroll = document.getElementById('lyrics-container-scroll');

const btnClosePlaylist = document.getElementById('btn-close-playlist');
const playlistOverlay = document.getElementById('playlist-overlay');
const playlistTracksContainer = document.getElementById('playlist-tracks-container');

const glow1 = document.getElementById('glow-1');
const glow2 = document.getElementById('glow-2');
const glow3 = document.getElementById('glow-3');

// Desktop panel elements
const playerRightPanel = document.getElementById('player-right-panel');
const btnDesktopTabLetter = document.getElementById('btn-desktop-tab-letter');
const btnDesktopTabLyrics = document.getElementById('btn-desktop-tab-lyrics');
const btnDesktopTranslate = document.getElementById('btn-desktop-translate');
const desktopLetterContent = document.getElementById('desktop-letter-content');
const desktopLyricsContent = document.getElementById('desktop-lyrics-content');
const desktopLetterText = document.getElementById('desktop-letter-text');
const desktopLyricsText = document.getElementById('desktop-lyrics-text');

// Initialize Playlist Data & State
function loadTrack(index) {
  if (playlist.length === 0) {
    songTitle.textContent = "Sin canciones";
    songArtist.textContent = "Edita src/playlistData.js";
    letterText.textContent = "Tu playlist está vacía.";
    lyricsText.innerHTML = '<p class="text-sm text-neutral-soft-500 text-center py-12">Sin letras.</p>';
    audioPlayer.src = "";
    return;
  }
  currentIndex = index;
  const track = playlist[index];
  
  // Control de idioma y visibilidad del botón de traducción
  currentLanguage = 'EN';
  if (btnTranslateLyrics) {
    btnTranslateLyrics.querySelector('span').textContent = 'ES';
    const hasTranslation = track.lyrics && track.lyrics.some(line => line.translation && line.translation !== line.text);
    if (hasTranslation) {
      btnTranslateLyrics.classList.remove('hidden');
    } else {
      btnTranslateLyrics.classList.add('hidden');
    }
  }
  
  // Update texts and assets
  songTitle.textContent = track.title;
  songArtist.textContent = track.artist;
  letterText.textContent = track.message;
  if (albumCover) {
    const base = import.meta.env.BASE_URL;
    albumCover.src = track.cover || `${base}album_art.png`;
  }
  
  // Renderizar las letras de karaoke dinámicamente (mobile)
  buildLyricsUI(track.lyrics);
  lastActiveIndex = -1; // Resetear índice de karaoke
  if (lyricsContainerScroll) {
    lyricsContainerScroll.scrollTop = 0; // Regresar scroll de letras arriba
  }
  
  // Desktop: actualizar panel derecho
  if (desktopLetterText) {
    desktopLetterText.textContent = track.message;
  }
  if (desktopLyricsText) {
    buildDesktopLyricsUI(track.lyrics);
    if (desktopLyricsContent) {
      desktopLyricsContent.scrollTop = 0;
    }
  }
  
  // Desktop: actualizar visibilidad del botón de traducción
  updateDesktopTranslateButton(track);
  
  // Set audio source
  audioPlayer.src = track.src;
  
  // Update ambient glows smoothly
  if (track.glowColors) {
    glow1.style.backgroundColor = track.glowColors.glow1;
    glow2.style.backgroundColor = track.glowColors.glow2;
    glow3.style.backgroundColor = track.glowColors.glow3;
  }
  
  // Reset progress bar and times
  setProgressBar(0);
  timeCurrent.textContent = "0:00";
  timeDuration.textContent = "0:00";
  if (progressBarContainer) {
    progressBarContainer.classList.remove('is-playing');
  }
  
  // Highlight active item in playlist bottom sheet
  updatePlaylistActiveState();
}

// Generador de interfaz de letras sincronizadas
function buildLyricsUI(lyricsArray) {
  lyricsText.innerHTML = ''; // Limpiar letras previas
  if (!lyricsArray || lyricsArray.length === 0) {
    lyricsText.innerHTML = '<p class="text-sm text-neutral-soft-500 text-center py-12">Esta canción no tiene letra configurada.</p>';
    return;
  }
  
  lyricsArray.forEach((line, idx) => {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'lyric-line';
    lineDiv.setAttribute('data-time', line.time);
    
    // Si el idioma es español (ES) y la línea tiene traducción, usarla; si no, mantener el original (EN/ES)
    const displayText = (currentLanguage === 'ES' && line.translation) ? line.translation : line.text;
    lineDiv.textContent = displayText;
    
    // Salto interactivo a la línea al hacer clic (Estilo Spotify premium)
    lineDiv.addEventListener('click', () => {
      audioPlayer.currentTime = line.time;
      if (!isPlaying) {
        playTrack();
      }
    });
    
    lyricsText.appendChild(lineDiv);
  });
}

// Desktop: Generador de interfaz de letras para panel derecho
function buildDesktopLyricsUI(lyricsArray) {
  if (!desktopLyricsText) return;
  desktopLyricsText.innerHTML = '';
  if (!lyricsArray || lyricsArray.length === 0) {
    desktopLyricsText.innerHTML = '<p class="text-sm text-neutral-soft-500 text-center py-12">Esta canción no tiene letra configurada.</p>';
    return;
  }
  
  lyricsArray.forEach((line, idx) => {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'lyric-line';
    lineDiv.setAttribute('data-time', line.time);
    
    const displayText = (currentLanguage === 'ES' && line.translation) ? line.translation : line.text;
    lineDiv.textContent = displayText;
    
    lineDiv.addEventListener('click', () => {
      audioPlayer.currentTime = line.time;
      if (!isPlaying) {
        playTrack();
      }
    });
    
    desktopLyricsText.appendChild(lineDiv);
  });
}

// Desktop: Actualizar visibilidad del botón de traducción
function updateDesktopTranslateButton(track) {
  if (!btnDesktopTranslate) return;
  const hasTranslation = track && track.lyrics && track.lyrics.some(line => line.translation && line.translation !== line.text);
  if (hasTranslation && currentDesktopTab === 'lyrics') {
    btnDesktopTranslate.classList.remove('hidden');
    btnDesktopTranslate.classList.add('flex');
  } else {
    btnDesktopTranslate.classList.add('hidden');
    btnDesktopTranslate.classList.remove('flex');
  }
}

// Desktop: Cambiar entre tabs de Carta y Letra
function switchDesktopTab(tab) {
  currentDesktopTab = tab;
  const track = playlist[currentIndex];
  
  if (tab === 'letter') {
    // Mostrar carta, ocultar letras
    desktopLetterContent.classList.remove('hidden');
    desktopLetterContent.classList.add('flex');
    desktopLyricsContent.classList.add('hidden');
    
    // Estilo del tab activo
    btnDesktopTabLetter.classList.add('bg-palo-rosa-500', 'text-white', 'shadow-md', 'shadow-palo-rosa-300/30');
    btnDesktopTabLetter.classList.remove('bg-palo-rosa-100', 'text-palo-rosa-600');
    btnDesktopTabLyrics.classList.remove('bg-palo-rosa-500', 'text-white', 'shadow-md', 'shadow-palo-rosa-300/30');
    btnDesktopTabLyrics.classList.add('bg-palo-rosa-100', 'text-palo-rosa-600');
  } else {
    // Mostrar letras, ocultar carta
    desktopLetterContent.classList.add('hidden');
    desktopLetterContent.classList.remove('flex');
    desktopLyricsContent.classList.remove('hidden');
    
    // Estilo del tab activo
    btnDesktopTabLyrics.classList.add('bg-palo-rosa-500', 'text-white', 'shadow-md', 'shadow-palo-rosa-300/30');
    btnDesktopTabLyrics.classList.remove('bg-palo-rosa-100', 'text-palo-rosa-600');
    btnDesktopTabLetter.classList.remove('bg-palo-rosa-500', 'text-white', 'shadow-md', 'shadow-palo-rosa-300/30');
    btnDesktopTabLetter.classList.add('bg-palo-rosa-100', 'text-palo-rosa-600');
  }
  
  // Actualizar visibilidad del botón de traducción
  updateDesktopTranslateButton(track);
}

function updatePlaylistActiveState() {
  const items = playlistTracksContainer.querySelectorAll('.track-item');
  items.forEach((item, idx) => {
    if (idx === currentIndex) {
      item.classList.add('bg-palo-rosa-200/60');
      item.classList.remove('bg-palo-rosa-100/50');
      item.querySelector('.active-indicator').classList.remove('hidden');
      item.querySelector('.active-indicator').classList.add('flex');
    } else {
      item.classList.remove('bg-palo-rosa-200/60');
      item.classList.add('bg-palo-rosa-100/50');
      item.querySelector('.active-indicator').classList.remove('flex');
      item.querySelector('.active-indicator').classList.add('hidden');
    }
  });
}

// ========== Motor de Progreso a 60fps (Samsung One UI 8 Engine) ==========

// Actualiza visualmente la barra de progreso (fill + thumb)
function setProgressBar(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  progressFill.style.width = clamped + '%';
  progressThumb.style.left = clamped + '%';
  if (progressWaveContainer) {
    progressWaveContainer.style.width = clamped + '%';
  }
}

// Calcula el porcentaje de progreso a partir de la posición X del puntero
function getProgressFromPointer(e) {
  const rect = progressTrack.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const x = clientX - rect.left;
  return Math.max(0, Math.min(100, (x / rect.width) * 100));
}

// Scrubbing: inicio (pointerdown / touchstart)
function onScrubStart(e) {
  e.preventDefault();
  isScrubbing = true;
  progressBarContainer.classList.add('active');
  
  const percent = getProgressFromPointer(e);
  setProgressBar(percent);
  updateTooltip(percent, e);
  
  if (audioPlayer.duration) {
    const time = (percent / 100) * audioPlayer.duration;
    timeCurrent.textContent = formatTime(time);
  }
}

// Scrubbing: movimiento (pointermove / touchmove)
function onScrubMove(e) {
  if (!isScrubbing) return;
  e.preventDefault();
  
  const percent = getProgressFromPointer(e);
  setProgressBar(percent);
  updateTooltip(percent, e);
  
  if (audioPlayer.duration) {
    const time = (percent / 100) * audioPlayer.duration;
    timeCurrent.textContent = formatTime(time);
  }
}

// Scrubbing: finalización (pointerup / touchend)
function onScrubEnd(e) {
  if (!isScrubbing) return;
  isScrubbing = false;
  progressBarContainer.classList.remove('active');
  
  // Calcular posición final y aplicar seek al audio
  const percent = progressFill.style.width ? parseFloat(progressFill.style.width) : 0;
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (percent / 100) * audioPlayer.duration;
  }
}

// Posicionar el tooltip flotante de tiempo
function updateTooltip(percent, e) {
  if (!audioPlayer.duration) return;
  const time = (percent / 100) * audioPlayer.duration;
  progressTooltip.textContent = formatTime(time);
  
  // Posicionar horizontalmente sobre el thumb, clampeando a los bordes
  const trackRect = progressTrack.getBoundingClientRect();
  const tooltipWidth = progressTooltip.offsetWidth;
  const thumbPx = (percent / 100) * trackRect.width;
  
  // Clampear para que no se salga del contenedor
  const minLeft = tooltipWidth / 2 + 4;
  const maxLeft = trackRect.width - tooltipWidth / 2 - 4;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, thumbPx));
  
  progressTooltip.style.left = clampedLeft + 'px';
}

// Registrar eventos de interacción (pointer + touch para máxima compatibilidad)
progressBarContainer.addEventListener('pointerdown', onScrubStart);
document.addEventListener('pointermove', onScrubMove);
document.addEventListener('pointerup', onScrubEnd);

// Touch events como respaldo para iOS Safari
progressBarContainer.addEventListener('touchstart', onScrubStart, { passive: false });
document.addEventListener('touchmove', onScrubMove, { passive: false });
document.addEventListener('touchend', onScrubEnd);

// Click directo en la pista (salto instantáneo sin arrastre)
progressBarContainer.addEventListener('click', (e) => {
  if (isScrubbing) return; // Ignorar si ya estamos arrastrando
  const percent = getProgressFromPointer(e);
  setProgressBar(percent);
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (percent / 100) * audioPlayer.duration;
    timeCurrent.textContent = formatTime(audioPlayer.currentTime);
  }
});

// Soporte de teclado (accesibilidad): flechas izquierda/derecha para avanzar/retroceder
progressBarContainer.addEventListener('keydown', (e) => {
  if (!audioPlayer.duration) return;
  const step = 5; // Segundos por keypress
  if (e.key === 'ArrowRight') {
    audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + step);
  } else if (e.key === 'ArrowLeft') {
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - step);
  }
});

// Loop de renderizado a 60fps
function updateProgressAndLyrics() {
  if (audioPlayer.duration && !isScrubbing) {
    const currentTime = audioPlayer.currentTime;
    const progress = (currentTime / audioPlayer.duration) * 100;
    setProgressBar(progress);
    timeCurrent.textContent = formatTime(currentTime);
    updateLyricsSync(currentTime);
  }
  if (isPlaying) {
    animationFrameId = requestAnimationFrame(updateProgressAndLyrics);
  }
}

// Play / Pause Logic
function playTrack() {
  if (playlist.length === 0) return;
  audioPlayer.play().then(() => {
    isPlaying = true;
    btnPlayPause.innerHTML = pauseIconSVG;
    vinyl.classList.add('playing');
    if (progressBarContainer) {
      progressBarContainer.classList.add('is-playing');
    }
    
    // Iniciar loop de renderizado a 60fps
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(updateProgressAndLyrics);
  }).catch((e) => {
    console.error("Audio playback error:", e);
  });
}

function pauseTrack() {
  if (playlist.length === 0) return;
  audioPlayer.pause();
  isPlaying = false;
  btnPlayPause.innerHTML = playIconSVG;
  vinyl.classList.remove('playing');
  if (progressBarContainer) {
    progressBarContainer.classList.remove('is-playing');
  }
  
  // Detener loop
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// Alternar reproducción
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
    audioPlayer.load();
  }
}

// Anterior canción
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

// Formatear segundos en minutos (ej. 125 -> 2:05)
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Sincronización de Letras de Karaoke (Spotify Engine)
function updateLyricsSync(currentTime) {
  // Mobile lyrics sync
  const lines = lyricsText.querySelectorAll('.lyric-line');
  
  // Desktop lyrics sync
  const desktopLines = desktopLyricsText ? desktopLyricsText.querySelectorAll('.lyric-line') : [];
  
  const allLines = lines.length > 0 ? lines : desktopLines;
  if (allLines.length === 0) return;
  
  let activeIndex = -1;
  
  // Buscar la línea que debería estar activa actualmente
  for (let i = 0; i < allLines.length; i++) {
    const time = parseFloat(allLines[i].getAttribute('data-time'));
    if (currentTime >= time) {
      activeIndex = i;
    } else {
      break;
    }
  }
  
  // Si la línea activa cambia, resaltar y centrar
  if (activeIndex !== -1 && activeIndex !== lastActiveIndex) {
    lastActiveIndex = activeIndex;
    
    // Update mobile lyrics
    lines.forEach((line, idx) => {
      if (idx === activeIndex) {
        line.classList.add('active');
      } else {
        line.classList.remove('active');
      }
    });
    
    // Update desktop lyrics
    desktopLines.forEach((line, idx) => {
      if (idx === activeIndex) {
        line.classList.add('active');
      } else {
        line.classList.remove('active');
      }
    });
    
    // Scroll centrado automático robusto (inmune a problemas de offsetParent)
    // Mobile scroll
    if (lyricsContainerScroll && lines[activeIndex]) {
      const activeLine = lines[activeIndex];
      const containerRect = lyricsContainerScroll.getBoundingClientRect();
      const activeLineRect = activeLine.getBoundingClientRect();
      
      const absoluteLineTop = activeLineRect.top - containerRect.top + lyricsContainerScroll.scrollTop;
      const targetScroll = absoluteLineTop - (containerRect.height / 2) + (activeLineRect.height / 2);
      
      lyricsContainerScroll.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
    
    // Desktop scroll
    if (desktopLyricsContent && desktopLines[activeIndex] && isDesktop()) {
      const activeLine = desktopLines[activeIndex];
      const containerRect = desktopLyricsContent.getBoundingClientRect();
      const activeLineRect = activeLine.getBoundingClientRect();
      
      const absoluteLineTop = activeLineRect.top - containerRect.top + desktopLyricsContent.scrollTop;
      const targetScroll = absoluteLineTop - (containerRect.height / 2) + (activeLineRect.height / 2);
      
      desktopLyricsContent.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }
}

// Audio events (mantener eventos como respaldo y soporte al cambiar el audio)
audioPlayer.addEventListener('timeupdate', () => {
  // Si no está reproduciendo y no estamos arrastrando, actualizar de inmediato una vez
  if (!isPlaying && !isScrubbing && audioPlayer.duration) {
    const currentTime = audioPlayer.currentTime;
    const progress = (currentTime / audioPlayer.duration) * 100;
    setProgressBar(progress);
    timeCurrent.textContent = formatTime(currentTime);
    updateLyricsSync(currentTime);
  }
});

audioPlayer.addEventListener('loadedmetadata', () => {
  timeDuration.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener('ended', () => {
  nextTrack();
  playTrack();
});

// Reordenar elementos de la lista en memoria y actualizar interfaz
function reorderPlaylist(fromIndex, toIndex) {
  const currentTrack = playlist[currentIndex];
  
  // Mover el elemento en el array
  const [movedTrack] = playlist.splice(fromIndex, 1);
  playlist.splice(toIndex, 0, movedTrack);
  
  // Actualizar el índice actual para apuntar a la misma canción que está sonando
  currentIndex = playlist.indexOf(currentTrack);
  
  // Volver a renderizar la lista y actualizar resaltados
  buildPlaylistUI();
  updatePlaylistActiveState();
}

// Build Playlist Bottom Sheet con soporte para arrastrar y reordenar (Drag & Drop)
function buildPlaylistUI() {
  playlistTracksContainer.innerHTML = '';
  if (playlist.length === 0) {
    playlistTracksContainer.innerHTML = '<p class="text-xs text-neutral-soft-500 text-center py-8">No hay canciones añadidas aún</p>';
    return;
  }
  
  playlist.forEach((track, idx) => {
    const trackDiv = document.createElement('div');
    trackDiv.className = 'track-item flex items-center justify-between p-4 bg-palo-rosa-100/50 rounded-xl transition-all duration-300 min-w-0 w-full';
    trackDiv.setAttribute('data-index', idx);
    trackDiv.draggable = true;
    
    trackDiv.innerHTML = `
      <div class="flex items-center gap-2 min-w-0 flex-grow mr-2">
        <!-- Grip handle para arrastrar -->
        <svg class="w-4 h-4 text-palo-rosa-300 drag-handle cursor-grab flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.5 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-10 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
        </svg>
        <!-- Área clickeable para reproducir canción -->
        <div class="track-click-area flex items-center gap-3 min-w-0 flex-grow cursor-pointer active:scale-[0.98] transition-transform">
          <div class="w-10 h-10 overflow-hidden bg-black flex-shrink-0 flex items-center justify-center rounded-md">
            <img src="${track.cover}" class="w-full h-full object-cover" />
          </div>
          <div class="text-left min-w-0 flex-grow">
            <h4 class="text-sm font-semibold text-palo-rosa-800 truncate">${track.title}</h4>
            <p class="text-xs text-neutral-soft-500 truncate">${track.artist}</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="active-indicator text-xs text-palo-rosa-500 hidden items-center gap-0.5">
          Sonando
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 inline align-text-bottom">
            <path fill-rule="evenodd" d="M17.721 1.599a.75.75 0 0 1 .279.583v11.29a2.25 2.25 0 0 1-1.774 2.2l-2.041.44a2.216 2.216 0 0 1-.938-4.332l2.662-.577a.75.75 0 0 0 .591-.733V6.112l-8 1.73v7.684a2.25 2.25 0 0 1-1.774 2.2l-2.042.44a2.216 2.216 0 1 1-.935-4.331l2.659-.573A.75.75 0 0 0 7 12.529V4.236a.75.75 0 0 1 .591-.733l9.5-2.054a.75.75 0 0 1 .63.15Z" clip-rule="evenodd" />
          </svg>
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-3.5 h-3.5 text-palo-rosa-400">
          <path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
        </svg>
      </div>
    `;
    
    // Asignar evento click solo al área de reproducción
    trackDiv.querySelector('.track-click-area').addEventListener('click', () => {
      loadTrack(idx);
      playTrack();
      closePlaylistSheet();
    });
    
    // === EVENTOS DRAG & DROP (ESCRITORIO) ===
    trackDiv.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', idx);
      trackDiv.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    trackDiv.addEventListener('dragend', () => {
      trackDiv.classList.remove('dragging');
      const items = playlistTracksContainer.querySelectorAll('.track-item');
      items.forEach(item => item.classList.remove('drag-over'));
    });
    
    trackDiv.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const draggingItem = playlistTracksContainer.querySelector('.dragging');
      if (draggingItem && draggingItem !== trackDiv) {
        trackDiv.classList.add('drag-over');
      }
    });
    
    trackDiv.addEventListener('dragleave', () => {
      trackDiv.classList.remove('drag-over');
    });
    
    trackDiv.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIndex = idx;
      if (!isNaN(fromIndex) && fromIndex !== toIndex) {
        reorderPlaylist(fromIndex, toIndex);
      }
    });
    
    // === EVENTOS TÁCTILES (MÓVILES) ===
    const gripHandle = trackDiv.querySelector('.drag-handle');
    
    gripHandle.addEventListener('touchstart', () => {
      trackDiv.classList.add('dragging');
    }, { passive: true });
    
    gripHandle.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetItem = element ? element.closest('.track-item') : null;
      
      const items = playlistTracksContainer.querySelectorAll('.track-item');
      items.forEach(item => {
        if (item !== trackDiv) {
          item.classList.remove('drag-over');
        }
      });
      
      if (targetItem && targetItem !== trackDiv) {
        targetItem.classList.add('drag-over');
      }
    }, { passive: false });
    
    gripHandle.addEventListener('touchend', () => {
      trackDiv.classList.remove('dragging');
      const targetItem = playlistTracksContainer.querySelector('.drag-over');
      if (targetItem) {
        const toIndex = parseInt(targetItem.getAttribute('data-index'), 10);
        targetItem.classList.remove('drag-over');
        if (!isNaN(toIndex) && idx !== toIndex) {
          reorderPlaylist(idx, toIndex);
        }
      }
    });
    
    playlistTracksContainer.appendChild(trackDiv);
  });
}

// Desplazamiento a Carta (Letter Flow)
function scrollToLetter() {
  // En desktop, cambiar al tab de carta en el panel derecho
  if (isDesktop()) {
    switchDesktopTab('letter');
    return;
  }
  
  closePlaylistSheet();
  const letterSection = document.getElementById('letter-section');
  letterSection.classList.remove('hidden');
  
  setTimeout(() => {
    const targetScroll = letterSection.getBoundingClientRect().top - screenPlayer.getBoundingClientRect().top + screenPlayer.scrollTop;
    screenPlayer.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, 30);
}

// Desplazamiento a Letras (Lyrics Flow)
function scrollToLyrics() {
  // En desktop, cambiar al tab de letras en el panel derecho
  if (isDesktop()) {
    switchDesktopTab('lyrics');
    return;
  }
  
  closePlaylistSheet();
  const lyricsSection = document.getElementById('lyrics-section');
  lyricsSection.classList.remove('hidden');
  
  setTimeout(() => {
    const targetScroll = lyricsSection.getBoundingClientRect().top - screenPlayer.getBoundingClientRect().top + screenPlayer.scrollTop;
    screenPlayer.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, 30);
}

// Regresar suavemente al panel superior
function scrollToControls() {
  screenPlayer.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Resetear cualquier scroll accidental de la ventana
  
  setTimeout(() => {
    const letterSection = document.getElementById('letter-section');
    const lyricsSection = document.getElementById('lyrics-section');
    letterSection.classList.add('hidden');
    lyricsSection.classList.add('hidden');
  }, 650);
}

// Overlay Toggle Functions (Lista de Reproducción)
function openPlaylistSheet() {
  screenPlayer.scrollTo({ top: 0, behavior: 'auto' });
  playlistOverlay.classList.remove('translate-y-full');
}

function closePlaylistSheet() {
  playlistOverlay.classList.add('translate-y-full');
}

// Floating Hearts Particle Engine (Únicamente corazones anatómicos)
function createFloatingHeart() {
  const heart = document.createElement('div');
  heart.className = 'floating-heart text-palo-rosa-400';
  
  const symbols = ['🫀'];
  heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  
  const size = Math.random() * 0.8 + 0.6; // 0.6rem to 1.4rem
  heart.style.fontSize = `${size}rem`;
  heart.style.left = `${Math.random() * 92 + 4}vw`;
  
  const drift = Math.random() * 40 - 20;
  const rotation = Math.random() * 360 - 180;
  heart.style.setProperty('--drift', `${drift}vw`);
  heart.style.setProperty('--rot', `${rotation}deg`);
  
  const duration = isPlaying ? (Math.random() * 2 + 2.5) : (Math.random() * 3 + 4); 
  heart.style.animationDuration = `${duration}s`;
  heart.style.opacity = Math.random() * 0.4 + 0.4;
  
  const heartsContainer = document.getElementById('hearts-container');
  if (heartsContainer) {
    heartsContainer.appendChild(heart);
  } else {
    document.body.appendChild(heart);
  }
  
  setTimeout(() => {
    heart.remove();
  }, duration * 1000);
}

// Scroll reveal observer
function initScrollAnimations() {
  const scrollItems = document.querySelectorAll('.scroll-item');
  
  const observerOptions = {
    root: null,
    threshold: 0.45
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
  audioPlayer.load();
  audioPlayer.play().then(() => {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }).catch(e => console.log("Audio contextual unlock:", e));

  screenWelcome.classList.add('opacity-0', 'scale-95');
  
  setTimeout(() => {
    screenWelcomeContainer.style.display = 'none';
    screenStoryContainer.style.display = 'block';
    screenStory.style.display = 'flex';
    screenStory.offsetHeight;
    screenStory.classList.remove('opacity-0');
    screenStory.classList.add('opacity-100');
    
    if (!heartsInterval) {
      heartsInterval = setInterval(createFloatingHeart, 900);
    }
  }, 600);
}

// Transition 2: Scroll Story -> Player
function handleGoToPlayer() {
  if (heartsInterval) {
    clearInterval(heartsInterval);
    heartsInterval = setInterval(createFloatingHeart, 450);
  }

  screenStory.classList.remove('opacity-100');
  screenStory.classList.add('opacity-0');

  setTimeout(() => {
    screenStoryContainer.style.display = 'none';
    screenPlayerContainer.style.display = 'block';
    screenPlayer.style.display = 'flex';
    screenPlayer.offsetHeight;
    screenPlayer.classList.remove('opacity-0');
    screenPlayer.classList.add('opacity-100');
  }, 600);
}

// Back to Welcome
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
    
    // Resetear posición de scroll del reproductor
    screenPlayer.scrollTo({ top: 0, behavior: 'auto' });
    
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

// Carta scroll triggers
btnOpenLetter.addEventListener('click', scrollToLetter);
btnBackToControlsFromLetter.addEventListener('click', scrollToControls);

// Letras scroll triggers
btnOpenLyrics.addEventListener('click', scrollToLyrics);
btnBackToControls.addEventListener('click', scrollToControls);

if (btnTranslateLyrics) {
  btnTranslateLyrics.addEventListener('click', () => {
    if (currentLanguage === 'EN') {
      currentLanguage = 'ES';
      btnTranslateLyrics.querySelector('span').textContent = 'EN';
    } else {
      currentLanguage = 'EN';
      btnTranslateLyrics.querySelector('span').textContent = 'ES';
    }
    
    const track = playlist[currentIndex];
    buildLyricsUI(track.lyrics);
    
    // Forzar actualización visual inmediata de la línea activa tras cambiar idioma
    lastActiveIndex = -1;
    updateLyricsSync(audioPlayer.currentTime);
  });
}

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
    createFloatingHeart();
  }
});

// Close sheets when clicking outside them
document.addEventListener('click', (e) => {
  if (!playlistOverlay.contains(e.target) && !btnTogglePlaylist.contains(e.target) && !playlistOverlay.classList.contains('translate-y-full')) {
    closePlaylistSheet();
  }
});

// Desktop Tab Event Listeners
if (btnDesktopTabLetter) {
  btnDesktopTabLetter.addEventListener('click', () => switchDesktopTab('letter'));
}
if (btnDesktopTabLyrics) {
  btnDesktopTabLyrics.addEventListener('click', () => switchDesktopTab('lyrics'));
}
if (btnDesktopTranslate) {
  btnDesktopTranslate.addEventListener('click', () => {
    if (currentLanguage === 'EN') {
      currentLanguage = 'ES';
      btnDesktopTranslate.querySelector('span').textContent = 'EN';
      if (btnTranslateLyrics) btnTranslateLyrics.querySelector('span').textContent = 'EN';
    } else {
      currentLanguage = 'EN';
      btnDesktopTranslate.querySelector('span').textContent = 'ES';
      if (btnTranslateLyrics) btnTranslateLyrics.querySelector('span').textContent = 'ES';
    }
    
    const track = playlist[currentIndex];
    buildLyricsUI(track.lyrics);
    buildDesktopLyricsUI(track.lyrics);
    
    lastActiveIndex = -1;
    updateLyricsSync(audioPlayer.currentTime);
  });
}

// App Startup
document.addEventListener('DOMContentLoaded', () => {
  buildPlaylistUI();
  loadTrack(0);
  initScrollAnimations();
  
  screenStoryContainer.style.display = 'none';
  screenPlayerContainer.style.display = 'none';
});
