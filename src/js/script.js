const URLsongs = "http://informatica.iesalbarregas.com:7008/songs";
const URLsongsPost = "http://informatica.iesalbarregas.com:7008/upload";

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const addButton = document.querySelector(".bxs-add-to-queue");
  const closeModal = document.getElementById("closeModal");
  const form = document.getElementById("uploadForm");

  // Elementos del reproductor
  const audioPlayer = new Audio();
  const songNameElement = document.querySelector(".song-name");
  const authorNameElement = document.querySelector(".author-name");
  const coverImageElement = document.getElementById("song");
  const currentTimeElement = document.querySelector(".current-time-song");
  const totalTimeElement = document.querySelector(".total-time-song");
  const progressBar = document.getElementById("progress-bar");
  const soundBar = document.getElementById("soundBar"); // Barra de volumen
  const volumeIcon = document.querySelector(".bxs-volume-low"); // Icono del volumen
  const playButton = document.getElementById("play-pause-button"); // Botón play/pause
  const pausePlayButton = document.getElementById("pause-play"); // Botón verde de pause y play
  const nextButton = document.querySelector(".bx-skip-next"); //Botón de saltar a la siguiente canción
  const previousButton = document.querySelector(".bx-skip-previous"); //Botón de saltar a la anterior canción
  const allOption = document.querySelector(".todos"); // Párrafo que indica el filtro para mostrar todas las canciones
  const loopButton = document.querySelector(".bx-repeat"); // Botón de la opción de bucle
  const shuffleButton = document.querySelector(".bx-shuffle"); // Botón de la opción de canción aleatoria


  let isPlaying = false; // Variable para rastrear si la canción está reproduciéndose
  let currentSong = null; // Variable para guardar la canción actual
  let songsList = []; // Lista de canciones
  let favoritesSongsList = []; // Lista de canciones favoritas
  let currentSongIndex = -1; // Índice de la canción actual
  let isDragging = false; // Variable para detectar si el usuario está arrastrando la barra de progreso
  let isLoopEnabled = false; // Estado del bucle
  let isShuffleEnabled = false; // Estado del shuffle

  // Evento para controlar el volumen con la barra de sonido
  soundBar.addEventListener("input", function () {
    const value = ((this.value - this.min) / (this.max - this.min)) * 100;
    this.style.setProperty("--volumeBar", `${value}%`);

    // Cambiar el volumen del reproductor
    audioPlayer.volume = this.value / 100;

    // Cambiar el ícono de volumen según el nivel
    if (this.value == 0) {
      volumeIcon.classList.remove("bxs-volume-low", "bxs-volume-full");
      volumeIcon.classList.add("bxs-volume-mute");
    } else if (this.value >= 75) {
      volumeIcon.classList.remove("bxs-volume-low", "bxs-volume-mute");
      volumeIcon.classList.add("bxs-volume-full");
    } else {
      volumeIcon.classList.remove("bxs-volume-full", "bxs-volume-mute");
      volumeIcon.classList.add("bxs-volume-low");
    }
  });

  // Inicializar volumen por defecto
  audioPlayer.volume = soundBar.value / 100;

  // Abrir el modal
  addButton.addEventListener("click", () => {
    modal.classList.add("visible");
  });

  // Cerrar el modal
  closeModal.addEventListener("click", () => {
    modal.classList.remove("visible");
    form.reset();
  });

  // Cerrar el modal al hacer clic fuera de él
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("visible");
      form.reset();
    }
  });

  document
    .getElementById("uploadForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault(); // Evita que el formulario se envíe de forma tradicional.

      const form = event.target;
      const formData = new FormData(form); // Recoge todos los datos del formulario, incluidos los archivos.
      try {
        const response = await fetch(URLsongsPost, {
          method: "POST",
          body: formData, // Enviar el FormData con los datos.
        });
        if (response.ok) {
          const result = await response.json(); // Si el servidor devuelve JSON.
          fetchSongs();
          modal.classList.remove("visible");
          form.reset();
        } else {
          alert("Error al subir el archivo: " + response.statusText);
        }
      } catch (error) {
        alert("Error en la conexión: " + error.message);
      }
    });

  // Fetch de canciones y carga en la tabla
  async function fetchSongs() {
    try {
      const response = await fetch(URLsongs);
      songsList = await response.json(); // Guardamos la lista de canciones
      const tableBody = document.querySelector(".list-songs tbody");

      for (const song of songsList) {
        // Crear un elemento de audio temporal para obtener la duración
        const audioElement = new Audio(song.filepath);

        await new Promise((resolve) => {
          audioElement.addEventListener("loadedmetadata", () => {
            const duration = formatTime(audioElement.duration);

            // Crear una fila para la tabla
            const row = document.createElement("tr");
            row.classList.add("song-row"); // Clase para estilos

            // Verificar si la canción está en favoritos
            const isFavorite = favoritesSongsList.some(
              (favSong) => favSong.filepath === song.filepath
            );

            row.innerHTML = `
              <td>
                <div class="play-title">
                  <span class="play-container">
                    <i class="bx bx-play play-icon" data-filepath="${
                      song.filepath
                    }" 
                      data-title="${song.title}" data-artist="${song.artist}" 
                      data-cover="${song.cover}"></i>
                  </span>
                  ${song.title}
                </div>
              </td>
              <td>${song.artist}</td>
              <td>${duration}</td>
              <td><i class="bx bx-heart ${
                isFavorite ? "bxs-heart" : ""
              }"></i></td>
              `;

            // Agregar evento para reproducir canción
            row.addEventListener("click", () => {
              const playIcon = row.querySelector(".play-icon");
              playSong(
                playIcon.dataset.filepath,
                playIcon.dataset.title,
                playIcon.dataset.artist,
                playIcon.dataset.cover,
                duration
              );
            });

            // Evento para cambiar el corazón al hacer clic
            const heartIcon = row.querySelector(".bx-heart");
            heartIcon.addEventListener("click", (event) => {
              event.stopPropagation(); // Evitar que se reproduzca la canción al hacer clic en el corazón
              heartIcon.classList.toggle("bxs-heart"); // Cambia entre corazón vacío y lleno

              if (heartIcon.classList.contains("bxs-heart")) {
                // Añadir a favoritos
                favoritesSongsList.push(song);
              } else {
                // Eliminar de favoritos
                favoritesSongsList = favoritesSongsList.filter(
                  (favSong) => favSong.filepath !== song.filepath
                );
              }
            });

            tableBody.appendChild(row);
            resolve();
          });

          // Manejar errores de carga de audio
          audioElement.addEventListener("error", () => {
            console.error(
              "Error cargando la duración de la canción:",
              song.title
            );
            resolve();
          });
        });
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    }
  }

  // Reproducir/pausar canción seleccionada o la canción actual
  playButton.addEventListener("click", () => {
    if (isPlaying) {
      // Si está reproduciendo, pausamos
      audioPlayer.pause();
      isPlaying = false;
      playButton.classList.replace("bx-pause-circle", "bx-play-circle"); // Cambiar el ícono de pausa a play
      pausePlayButton.value = "Play";
    } else if (currentSong) {
      // Si hay una canción seleccionada previamente, reproducimos o reanudamos
      audioPlayer.play();
      isPlaying = true;
      playButton.classList.replace("bx-play-circle", "bx-pause-circle"); // Cambiar el ícono de play a pausa
      pausePlayButton.value = "Pause";
    }
  });

  // Reproducir/pausar canción seleccionada o la canción actual con el nuevo botón
  pausePlayButton.addEventListener("click", () => {
    if (isPlaying) {
      // Si está reproduciendo, pausamos
      audioPlayer.pause();
      isPlaying = false;

      // Actualizar ambos botones
      playButton.classList.replace("bx-pause-circle", "bx-play-circle");
      pausePlayButton.value = "Play";
    } else if (currentSong) {
      // Si hay una canción seleccionada previamente, reproducimos o reanudamos
      audioPlayer.play();
      isPlaying = true;

      // Actualizar ambos botones
      playButton.classList.replace("bx-play-circle", "bx-pause-circle");
      pausePlayButton.value = "Pause";
    }
  });

  // Sincronizar estados entre los botones
  audioPlayer.onplay = () => {
    isPlaying = true;
    playButton.classList.replace("bx-play-circle", "bx-pause-circle");
    pausePlayButton.value = "Pause";
  };

  audioPlayer.onpause = () => {
    isPlaying = false;
    playButton.classList.replace("bx-pause-circle", "bx-play-circle");
    pausePlayButton.value = "Play";
  };

  // Reproducir canción seleccionada
  function playSong(filepath, title, artist, cover, duration) {
    // Si es la misma canción, alternar entre play/pause
    if (currentSong === filepath) {
      if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        playButton.classList.replace("bx-pause-circle", "bx-play-circle");
        pausePlayButton.value = "Play";
      } else {
        audioPlayer.play();
        isPlaying = true;
        playButton.classList.replace("bx-play-circle", "bx-pause-circle");
        pausePlayButton.value = "Pause";
      }
      return;
    }

    // Pausar la canción anterior si es diferente
    if (currentSong && currentSong !== filepath) {
      audioPlayer.pause();
    }

    // Configurar la nueva canción
    currentSong = filepath;
    audioPlayer.src = filepath; // Asignar la fuente del archivo
    audioPlayer.load(); // Cargar el archivo de audio
    audioPlayer.play(); // Iniciar reproducción automáticamente

    // Actualizar estado
    isPlaying = true;
    currentSongIndex = songsList.findIndex(
      (song) => song.filepath === filepath
    );
    playButton.classList.replace("bx-play-circle", "bx-pause-circle");
    pausePlayButton.value = "Pause";

    // Actualizar la interfaz
    songNameElement.textContent = title || "Desconocido";
    authorNameElement.textContent = artist || "Artista desconocido";
    coverImageElement.src = cover || "default_cover_image.jpg"; // Imagen predeterminada
    totalTimeElement.textContent = duration || "00:00";

    // Resaltar la canción activa
    const rows = document.querySelectorAll(".list-songs .song-row");
    rows.forEach((row) => row.classList.remove("active-song")); // Quitar la clase de otras canciones
    const activeRow = [...rows].find(
      (row) => row.querySelector(".play-icon").dataset.filepath === filepath
    );
    if (activeRow) {
      activeRow.classList.add("active-song");
    }

    // Configurar eventos para la barra de progreso
    audioPlayer.addEventListener("timeupdate", updateProgressBar);
    progressBar.addEventListener("input", handleProgressBarInput);
  }

  function updateProgressBar() {
    if (audioPlayer.duration) {
      const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      progressBar.value = progress; // Actualizar el valor de la barra de progreso
      currentTimeElement.textContent = formatTime(audioPlayer.currentTime); // Actualizar el tiempo actual
    }
  }

  function handleProgressBarInput() {
    if (audioPlayer.duration) {
      const newTime = (progressBar.value / 100) * audioPlayer.duration;
      audioPlayer.currentTime = newTime; // Cambiar la posición de reproducción
    }
  }

  audioPlayer.addEventListener("timeupdate", updateProgressBar);
  progressBar.addEventListener("input", handleProgressBarInput);

  // Mover la barra de progreso al arrastrarla
  progressBar.addEventListener("mousedown", () => {
    isDragging = true;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const progressBarRect = progressBar.getBoundingClientRect();
      const clickPosition = e.clientX - progressBarRect.left;
      const progressPercentage = Math.min(
        Math.max(clickPosition / progressBarRect.width, 0),
        1
      );
      progressBar.value = progressPercentage * 100;
      const newTime = progressPercentage * audioPlayer.duration;
      audioPlayer.currentTime = newTime;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
    }
  });

  progressBar.addEventListener("click", (event) => {
    const rect = progressBar.getBoundingClientRect(); // Obtiene las dimensiones y posición de la barra
    const offsetX = event.clientX - rect.left; // Calcula la posición del clic relativa a la barra
    const newTime = (offsetX / rect.width) * audioPlayer.duration; // Calcula el tiempo correspondiente
    audioPlayer.currentTime = newTime; // Ajusta el tiempo del audio
  });

  audioPlayer.addEventListener("timeupdate", () => {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.setProperty("--progress", `${progress}%`);
  });

  // Función para formatear tiempo en minutos y segundos
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // Alternar el estado de shuffle
  shuffleButton.addEventListener("click", () => {
    // Si el bucle está activado, desactivarlo al activar el shuffle
    if (isLoopEnabled) {
      isLoopEnabled = false;
      loopButton.style.color = ""; // Cambiar el color del bucle a su estado normal
      audioPlayer.loop = false; // Desactivar el bucle
    }

    // Alternar el estado de shuffle
    isShuffleEnabled = !isShuffleEnabled;
    shuffleButton.style.color = isShuffleEnabled ? "#1db954" : ""; // Cambiar color si está activado
  });

  // Lógica del botón "Next"
  nextButton.addEventListener("click", () => {
    if (songsList.length > 0) {
      if (isShuffleEnabled) {
        // Si shuffle está activado, selecciona una canción aleatoria
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * songsList.length);
        } while (randomIndex === currentSongIndex); // Asegúrate de que no repita la misma canción
        currentSongIndex = randomIndex;
      } else {
        // Si shuffle no está activado, avanza a la siguiente canción
        currentSongIndex = (currentSongIndex + 1) % songsList.length; // Usa módulo para asegurar que vuelva al principio
      }
      const nextSong = songsList[currentSongIndex];
      playSong(
        nextSong.filepath,
        nextSong.title,
        nextSong.artist,
        nextSong.cover,
        formatTime(nextSong.duration)
      );
    }
  });

  previousButton.addEventListener("click", () => {
    if (songsList.length > 0) {
      if (isShuffleEnabled) {
        // Si shuffle está activado, selecciona una canción aleatoria
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * songsList.length);
        } while (randomIndex === currentSongIndex); // Asegúrate de que no repita la misma canción
        currentSongIndex = randomIndex;
      } else {
        // Si no está activado el shuffle, retrocedemos normalmente
        if (currentSongIndex === 0) {
          currentSongIndex = songsList.length - 1; // Al llegar al principio, saltamos a la última canción
        } else {
          currentSongIndex--; // Retrocedemos al índice anterior
        }
      }
      const previousSong = songsList[currentSongIndex];
      playSong(
        previousSong.filepath,
        previousSong.title,
        previousSong.artist,
        previousSong.cover,
        formatTime(previousSong.duration)
      );
    }
  });

  // Alternar el estado de bucle
  loopButton.addEventListener("click", () => {
    // Si el shuffle está activado, desactivarlo al activar el bucle
    if (isShuffleEnabled) {
      isShuffleEnabled = false;
      shuffleButton.style.color = ""; // Cambiar el color de shuffle a su estado normal
    }

    // Alternar el estado de bucle
    isLoopEnabled = !isLoopEnabled;
    loopButton.style.color = isLoopEnabled ? "#1db954" : ""; // Cambiar color si está activado
    audioPlayer.loop = isLoopEnabled; // Activar o desactivar el bucle
  });

  // Seleccionar el elemento de favoritos
  const favoritesOption = document.querySelector(".favoritos");
  favoritesOption.addEventListener("click", async () => {
    favoritesOption.style.background = "#1db954";
    allOption.style.background = "";
    try {
      // Fetch de nuevo para asegurar que tenemos todas las canciones
      const response = await fetch(URLsongs);
      const allSongs = await response.json();

      const tableBody = document.querySelector(".list-songs tbody");
      tableBody.innerHTML = ""; // Limpiar tabla actual

      // Filtrar solo canciones favoritas
      const favoriteSongsToShow = allSongs.filter((song) =>
        favoritesSongsList.some((favSong) => favSong.filepath === song.filepath)
      );

      // Mostrar canciones favoritas
      for (const song of favoriteSongsToShow) {
        const audioElement = new Audio(song.filepath);

        await new Promise((resolve) => {
          audioElement.addEventListener("loadedmetadata", () => {
            const duration = formatTime(audioElement.duration);
            const row = document.createElement("tr");
            row.classList.add("song-row");

            row.innerHTML = `
              <td>
                <div class="play-title">
                  <span class="play-container">
                    <i class="bx bx-play play-icon" data-filepath="${song.filepath}" 
                      data-title="${song.title}" data-artist="${song.artist}" 
                      data-cover="${song.cover}"></i>
                  </span>
                  ${song.title}
                </div>
              </td>
              <td>${song.artist}</td>
              <td>${duration}</td>
              <td><i class="bx bxs-heart"></i></td>
              `;

            // Añadir lógica de reproducción
            const playIcon = row.querySelector(".play-icon");
            row.addEventListener("click", () => {
              playSong(
                playIcon.dataset.filepath,
                playIcon.dataset.title,
                playIcon.dataset.artist,
                playIcon.dataset.cover,
                duration
              );
            });

            // Evento para quitar de favoritos
            const heartIcon = row.querySelector(".bxs-heart");
            heartIcon.addEventListener("click", (event) => {
              event.stopPropagation();
              heartIcon.classList.toggle("bx-heart");
              favoritesSongsList = favoritesSongsList.filter(
                (favSong) => favSong.filepath !== song.filepath
              );
              localStorage.setItem(
                "favoritesSongs",
                JSON.stringify(favoritesSongsList)
              );
              row.remove(); // Eliminar la fila de la vista de favoritos
            });

            tableBody.appendChild(row);
            resolve();
          });

          // Manejar errores de carga de audio
          audioElement.addEventListener("error", () => {
            console.error(
              "Error cargando la duración de la canción:",
              song.title
            );
            resolve();
          });
        });
      }
    } catch (error) {
      console.error("Error cargando canciones favoritas:", error);
    }
  });

  // Añadir evento para mostrar todas las canciones nuevamente
  allOption.style.background = "#1db954"; // Por defecto estará esta opción activada por lo que tendrá este background
  allOption.addEventListener("click", () => {
    allOption.style.background = "#1db954";
    favoritesOption.style.background = "";
    const tableBody = document.querySelector(".list-songs tbody");
    tableBody.innerHTML = ""; // Limpiar tabla actual
    fetchSongs(); // Volver a cargar todas las canciones
  });

  // Cargar las canciones al iniciar la página
  fetchSongs();
});