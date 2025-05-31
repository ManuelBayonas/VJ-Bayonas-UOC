
//Declaración de variables
let sound;
let playButton, resetButton;
let volumeSlider, speedSlider, panSlider;
let filter, reverb;
let noise;
let noiseTypeSelect;
let filterFreqSlider, filterResSlider, reverbSlider, noiseAmpSlider;
let thresholdSlider, ratioSlider, attackSlider, releaseSlider;
let progressSlider;
let webcam;
let video;
let useWebcam = true;
let current, total;
let amplitude;
let level, scaleFactor;
let camWidth, camHeight;
const aspectRatioWebcam = 320 / 240;
const aspectRatioVideo = 480 / 854;//Relación de aspecto del vídeo
let videoWidth, videoHeight;

// Variables y constantes para controlar los efectos de imagen
let applyThreshold = false;
let applyInvert = false;
let applyErode = false;
let applyPosterize = false;
let applyRealce = false;

const matrizRealce = [
  [-1, -1, -1],
  [-1,  9, -1],
  [-1, -1, -1]
];

//Variables y constantes para controlar las transformaciones geométricas
let angle = 0;          // Ángulo de rotación
const speed = 0.02;     // Velocidad de rotación

/*Precarga de la pista de sonido ofreciendo alternativas para evitar errores en navegadores más restrictivos
y el vídeo generado con IA*/
function preload() {
    sound = loadSound([
      '../media/audio/afrohouse.mp3',
      '../media/audio/afrohouse.ogg',
      '../media/audio/afrohouse.wav'
    ]);
    video = createVideo('../media/video/Paris.mp4');
    video.size(160, 284);
    video.hide();
  }

/*Aquí defino una función para generar los controles que recibe tres parámetros
Esto permite generar varios controles siguiendo la misma estructura*/
function createControl(labelText, slider, parentDiv) {
  const wrapper = createDiv();//crea un div para agrupar el control y su etiqueta
  wrapper.class('control-wrapper');//crea una clase para ajustar mediante css
  wrapper.parent(parentDiv);//inserta el div en el parent para mantener todo organizado

  const label = createElement('label', labelText);//crea una etiqueta en html con los parámetros introducidos
  label.parent(wrapper);//meto la etiqueta y el slider dentro del div wrapper para mantenerlo organizado
  slider.parent(wrapper);
}

function setup() {
  let canvas = createCanvas(640, 480);//creo el canvas para mostrar el vídeo
  canvas.parent('canvas-container');//asigno el canvas al contenedor en html
  background(50, 0.2);
  //Uso la etiqueta controls creada en html para organizar el contenido y crear los sliders de forma dinámica
  const controlsDiv = select('#controls');

  // Botón Play/Pause
  playButton = createButton('Play');//crea el botón de Play
  playButton.class('buttons');//asigna una clase para modificar la apariencia con css
  playButton.attribute('title', 'Reproducir / Pausar el audio');//atributo html para mostrar la info del botón
  playButton.parent(controlsDiv);//asigna el botón al div de los controles
  playButton.mousePressed(togglePlay);

  // creamos los sliders
  volumeSlider = createSlider(0, 1, 0.5, 0.01);//slider de volumen
  speedSlider = createSlider(0.5, 2, 1, 0.01);//slider de velocidad
  panSlider = createSlider(-1, 1, 0, 0.01);//slide de paneo

  //Llamamos a la función createControl para crear los controles de los sliders
  createControl('Volumen', volumeSlider, controlsDiv);
  createControl('Velocidad', speedSlider, controlsDiv);
  createControl('Paneo', panSlider, controlsDiv);

  // Contenedor para los controles del filtro paso bajo
  const filterContainer = createDiv();//crea el contenedor
  filterContainer.class('filter-container');//asigna una clase para usar css
  filterContainer.parent(controlsDiv);//lo anida al contenedor de controles

  const filterLabel = createElement('h3', 'Filtro Paso Bajo');//Crea una etiqueta html para indicar los controles del filtro
  filterLabel.parent(filterContainer);//inserta la etiqueta en el contenedor del filtro

  filterFreqSlider = createSlider(10, 22050, 22050, 1);//crea el slider de frecuencia
  filterResSlider = createSlider(0.001, 100, 1, 0.001);//crea el slider de resonancia

  createControl('Frecuencia del filtro', filterFreqSlider, filterContainer);//crea los controles en el contenedor
  createControl('Resonancia del filtro', filterResSlider, filterContainer);

  //Contenedor para el filtro de Reverb 
  const reverbContainer = createDiv();//crea el contenedor
  reverbContainer.class('reverb-container');//asigna una clase para usar css
  reverbContainer.parent(controlsDiv);//lo anida al contenedor de controles

  const reverbLabel = createElement('h3', 'Efecto Reverb');//Crea una etiqueta html para indicar los controles del filtro
  reverbLabel.parent(reverbContainer);//inserta la etiqueta en el contenedor del filtro

  reverbSlider = createSlider(0, 1, 0, 0.01);//crea el slider de reverb
  createControl('Cantidad de Reverb', reverbSlider, reverbContainer);//crea el control en el contenedor

  // Menú desplegable para seleccionar tipo de ruido
  const noiseContainer = createDiv();//creea el contenedor
  noiseContainer.class('noise-container');//clase para usar css
  noiseContainer.parent(controlsDiv);//lo anida al contenedor de controles

  //Contenedor para el generador de ruido
  const noiseLabel = createElement('h3', 'Generador de Ruido');//Etiqueta para indicar el control
  noiseLabel.parent(noiseContainer);//Inserta la etiqueta en el contenedor de ruido

  // Slider para controlar la amplitud del ruido
  noiseAmpSlider = createSlider(0, 1, 0, 0.01);//crea el slider
  createControl('Cantidad de Ruido', noiseAmpSlider, noiseContainer);//crea el control

  //Menú desplegable para elegir el tipo de ruido
  noiseTypeSelect = createSelect();
  noiseTypeSelect.option('white');
  noiseTypeSelect.option('pink');
  noiseTypeSelect.option('brown');
  noiseTypeSelect.parent(noiseContainer);
  noiseTypeSelect.changed(() => {
    const tipo = noiseTypeSelect.value();
    noise.setType(tipo);
  });

  // Contenedor para el compresor
  const compressorContainer = createDiv();
  compressorContainer.class('compressor-container');
  compressorContainer.parent(controlsDiv);

  const compressorLabel = createElement('h3', 'Efecto Compresor');
  compressorLabel.parent(compressorContainer);

  // Slider del Threshold
  thresholdSlider = createSlider(-100, 0, -24, 1); // Rango típico: -100dB a 0dB
  createControl('Umbral (Threshold)', thresholdSlider, compressorContainer);

  // Slider del Ratio
  ratioSlider = createSlider(1, 20, 12, 0.1); // Rango típico: 1:1 a 20:1
  createControl('Relación (Ratio)', ratioSlider, compressorContainer);

  // Slider del Attack
  attackSlider = createSlider(0.001, 1, 0.003, 0.001); // en segundos
  createControl('Ataque (Attack)', attackSlider, compressorContainer);

  // Slider del Release
  releaseSlider = createSlider(0.01, 1, 0.25, 0.01); // en segundos
  createControl('Liberación (Release)', releaseSlider, compressorContainer);


  /* Slider de progreso. Ésto es un extra que me ha parecido interesante.
  Muestra el prograso de la reproducción, pero no permite interactuar*/
  progressSlider = createSlider(0, 1, 0, 0.001);//crea el slider
  progressSlider.attribute('disabled', '');//lo desactivamos para que no se pueda mover a mano
  createControl('Progreso', progressSlider, controlsDiv);//crea el control de progreso

  /* Botón de Reset - Ésto también es un extra. Resetea las modificaciones que se hayan aplicado
  devolviendo los filtros a su posición inicial*/
  resetButton = createButton('Restablecer');//crea el botón
  resetButton.parent(controlsDiv);//lo anida
  resetButton.class('buttons');//le asigna la clase para usar css
  resetButton.attribute('title', 'Restablecer todos los efectos aplicados');//crea la etiqueta en html para la info
  resetButton.mousePressed(resetSliders);//cuando se pulsa llama a la función de reseteo

  
  //Botón de reset de rotación - Extra-
  const instruccionesDiv = select('#instrucciones');//Busco el div del html para localizar la ubicación de las instrucciones
  const resetRotationButton = createButton('Restablecer Rotación');//Creo el botón para restablecer la rotación
  resetRotationButton.id('reset-rotacion');//Asigno un id para ajustarlo mediante css
  resetRotationButton.class('buttons');// Asigno la clase para ajustar  mediante css
  resetRotationButton.parent(instruccionesDiv);//Inserto el botón el el div correspondiente
  resetRotationButton.mousePressed(() => {angle = 0;});//Realiza el reseteo al hacer clic
  


  // Crear Filtro LP , Reverb y Distorsión en serie
  filter = new p5.LowPass();//filtro LP
  reverb = new p5.Reverb();// efecto reverb
  noise = new p5.Noise();//efecto ruido
  compressor = new p5.Compressor();//Compresor
  noise.start();
  noise.amp(0); // inicia en silencio
  sound.disconnect();//desconectamos el sonido del máster
  sound.connect(filter);//conectamos el sonido al filtro LP
  filter.disconnect();//desconecta el filtro para poder concatenar los efectos
  filter.connect(reverb, 3, 2);//conecta el filtro con el reverb y ajustamos el retardo y el decay
  reverb.disconnect();//desconecta para concatenar
  reverb.connect(compressor);//Conecta con el compresor

  // Creamos la captura de la webcam
  webcam = createCapture(VIDEO);
  webcam.size(240, 180); // Tamaño inicial más reducido para evitar el lag en la aplicación de múltiples transformaciones
  webcam.hide(); // La ocultamos porque la dibujaremos manualmente
  // Cremos el analizador de amplitud del sonido
  amplitude = new p5.Amplitude();

  // Botón Party Mode
const partyButton = select('#party-toggle');
partyButton.mousePressed(togglePartyMode);

}
  

function draw() {

  level = amplitude.getLevel(); // Obtiene el nivel de amplitud del sonido
  scaleFactor = map(level, 0, .3, 1, 2); //transforma el nivel de amplitud al rango entre 1 y 2
  scaleFactor = constrain(scaleFactor, 1, 2); // Limita la escala para que el vídeo no se haga demasiado grande
  /*Los valores de amplitud van de 0 a 1. Para que el efecto sea más visible establezco el límite superior en 0,3
  De esta manera consigo que los cambios de tamaño sean más evidentes incluso con el volumen a la mitad.
  Por otro lado, limito el escalado del vídeo al doble del tamaño original para que el vídeo no se haga demasiado grande
  lo que puede restar interés al efecto*/
  imageMode(CENTER); // Dibujo las imágenes desde su centro

  // Decidir la fuente actual: webcam o vídeo de IA
  let source = useWebcam ? webcam : video;
  //Aplicar el factor de escala dependiendo de la fuente de vídeo
  if (useWebcam) {
    camWidth = 240 * scaleFactor;
    camHeight = 180 * scaleFactor;
  } else {
    videoWidth = 240 * scaleFactor; 
    videoHeight = 427 * scaleFactor;
  }
  let frame = source.get();//Capturamos el frame

  //Aplicamos el escalado en función de la fuente de vídeo
  if (useWebcam) {
    frame.resize(camWidth, camHeight);
  } else {
    frame.resize(videoWidth, videoHeight);
  }

  //Aplicamos filtros básicos si están activos
  if (applyThreshold) frame.filter(THRESHOLD, 0.6);
  if (applyInvert) frame.filter(INVERT);
  if (applyPosterize) frame.filter(POSTERIZE, 3);
  if (applyErode) frame.filter(ERODE);
  if (applyRealce) frame = filtroConvolutivo(frame, matrizRealce);

  //Control de rotación de la imagen
  /*Por algún motivo que no he conseguido averiguar, al usar las teclas que indica el enunciado
  algunas combinaciones de filtros y/o rotación no funcionan correctamamente.
  Por ello, he creado un pequeño script adicional que muestra en pantalla las teclas presionadas.
  Haciendo pruebas he confirmado que ciertas combinaciones no son detectadas.
  He descartado que el problema sea del navegador probando la web en varios navegadores y siempre falla 
  Finalmente, la combinación de teclas elegida y que no da fallo es '1', '2', '3' y '4' para los filtros principales
  'b' para la máscara de realce y 'n' y 'm' para la rotación*/

  //Controles nuevos que aparecen listados en el menú
  if (keyIsDown(77)) { // tecla 'm'
    angle += speed;
  }
  if (keyIsDown(78)) { // tecla 'n'
    angle -= speed;
  }

  //Dibujar el frame final
  push();
  translate(width / 2, height / 2);
  rotate(angle);
  image(frame, 0, 0);
  pop();


  if (sound.isPlaying()) {
    //Actualizo los valores en base a los sliders
    sound.setVolume(volumeSlider.value());//Actualiza el volumen
    sound.rate(speedSlider.value());//Actualiza la velocidad
    sound.pan(panSlider.value());//Paneo
    filter.freq(filterFreqSlider.value());//Frecuencia de corte
    filter.res(filterResSlider.value());//Resonancia
    reverb.drywet(reverbSlider.value());//Reverb
    noise.amp(noiseAmpSlider.value());//Ruido
    //Controles de compressor
    compressor.threshold(thresholdSlider.value());//Threshold
    compressor.ratio(ratioSlider.value());//Ratio
    compressor.attack(attackSlider.value());//Attack
    compressor.release(releaseSlider.value());//Release

    //Actualizo el progreso para el slider
    current = sound.currentTime();//Obtengo el tiempo transcurrido
    total = sound.duration();//Obtengo la duración de la pista
    if (total > 0) {
      progressSlider.value(current / total);//Calculo el progreso
    }
  }
}


//Funcion para controlar la reproducción/pausa de la pista de sonido
function togglePlay() {
  if (!sound.isPlaying()) {
    sound.play();//si no está sonando lo reproduce
    playButton.html('Pause');//cambia la etiqueta del botón a Pause
  } else {
    sound.pause();//si está sonando lo pone en pausa
    playButton.html('Play');//cambia la etiqueta del botón a Play
  }
}

//Función llamada por el botón de reset para restablecer los valores iniciales de los sliders
function resetSliders() {
  volumeSlider.value(0.5);//Volumen a la mitad
  speedSlider.value(1);//Velocidad de reproducción normal
  panSlider.value(0);//Paneo centrado
  filterFreqSlider.value(22050);//Frecuencia de filtrado alta - efectivamente no filtra
  filterResSlider.value(1);//reseteo de la resonancia
  reverbSlider.value(0); // Pone la mezcla de reverb a 0 para desactivarlo
  noiseAmpSlider.value(0); //Valor de ruido a 0
  thresholdSlider.value(-24);//Reset de los controles de compressor
  ratioSlider.value(12);
  attackSlider.value(0.003);
  releaseSlider.value(0.25);

}

function keyPressed() {

  const k = key.toLowerCase();//Detectamos la tecla pulsada
  const elem = select('#instruccion-' + k);/*Genero un id dinámico uniendo #instruccion+tecla pulsada
  y selecciono el elemento html correspondiente del menú*/
  if (elem) elem.addClass('active');//Si el elemento es válido le aplico la clase active
  //esto lo uso para hacer un cambio dinámico a negrita en el menú de teclas de efectos usando css
  //Comprueba las teclas que se han pulsado para cambiar a true y aplicar el efecto en el draw
  if (key === '1') applyThreshold = true;
  if (key === '2') applyInvert = true;
  if (key === '3') applyErode = true;
  if (key === '4') applyPosterize = true;
  if (key === 'b' || key === 'B') applyRealce = true;
}

function keyReleased() {
  //Aquí hago lo mismo que en keyPressed a diferencia de que aquí elimino la clase active y cambia el estado de los efectos a false
  const k = key.toLowerCase();
  const elem = select('#instruccion-' + k);
  if (elem) elem.removeClass('active');

  if (key === '1') applyThreshold = false;
  if (key === '2') applyInvert = false;
  if (key === '3') applyErode = false;
  if (key === '4') applyPosterize = false;
  if (key === 'b' || key === 'B') applyRealce = false;
}

//Detección de cambio de fuente de vídeo
function keyTyped() {
  if (key === '0') {//Cuando se pulsa la tecla 0 se cambia de fuente
    useWebcam = !useWebcam;
    if (!useWebcam) {
      video.loop();
    } else {
      video.pause();
    }
  }
}
//Aplicar un filtro de convolución al vídeo
function filtroConvolutivo(img, matriz) {
  img.loadPixels();//Cargo los píxeles de la imagen
  let result = createImage(img.width, img.height);//Creo una imagen en blanco del mismo tamaño
  result.loadPixels();//Cargo los píxeles para poder usarlos
  const copiaPixeles = [...img.pixels]; // copia para referencia para no sobreescribir los originales

  //Valores de tamaño de la imagen
  const w = img.width;
  const h = img.height;
  //El bucle recorre los píxeles de la imagen, excluyendo los bordes
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      //Variables para la suma 
      let sumaR = 0, sumaG = 0, sumaB = 0;
      //Bucle que aplica la máscara de realce usando la matriz
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = (x + kx + (y + ky) * w) * 4;//Calculo el indice del array
          const factor = matriz[ky + 1][kx + 1];//Tomo el valor correspondiente de la matriz
          sumaR += copiaPixeles[px] * factor;//Multiplica el valor del pixel por el factor y lo acumula
          sumaG += copiaPixeles[px + 1] * factor;
          sumaB += copiaPixeles[px + 2] * factor;
        }
      }
      
      const idx = (x + y * w) * 4;//Calcula la posición del pixel actual
      result.pixels[idx] = constrain(sumaR, 0, 255);//Comprueba que el resultado es un valor válido y actualiza el resultado
      result.pixels[idx + 1] = constrain(sumaG, 0, 255);
      result.pixels[idx + 2] = constrain(sumaB, 0, 255);
      result.pixels[idx + 3] = 255;
    }
  }
  result.updatePixels();//Actualizamos los cambios en los píxeles
  return result;//Devuelve la imagen filtrada
}

function togglePartyMode() {
  const body = select('body');
  const button = select('#party-toggle');
  const canvas = select('canvas');

  if (body.hasClass('party-mode')) {
    body.removeClass('party-mode');
    button.html('Party Mode OFF');
    canvas.elt.style.backdropFilter = '';
  } else {
    body.addClass('party-mode');
    button.html('Party Mode ON');
    canvas.elt.style.backdropFilter = 'blur(4px)';
  }
}

