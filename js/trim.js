let xhr = new XMLHttpRequest();
xhr.open("GET", "/api/getcookies", true);
xhr.send();

let canvas = document.getElementById('audio-waveform');
const ctx = canvas.getContext('2d');

let body = document.getElementsByTagName('body')[0]

window.addEventListener('resize', resizeCanvas, false);
canvas.addEventListener('mousemove', mouseEvent, false);
canvas.addEventListener('mousedown', function (event) {
    mouse_x = event.offsetX / canvas.width;
    if (Math.round(mouse_x * 30) / 30 == Math.round(cursor1_pos * 30) / 30 || mouse_x < cursor1_pos) {
        isHoldCursor1 = true;
    } else if (Math.round(mouse_x * 10) / 10 == Math.round(cursor2_pos_absolute * 10) / 10 || mouse_x > cursor2_pos){
        isHoldCursor2 = true;
    } else if (mouse_x > cursor1_pos && mouse_x < cursor2_pos) {
        isHold = true;
    }
    mouseEvent(event);
})

document.addEventListener("keypress", (event) => {
    if (event.key == " ") {
        play();
    }
})

window.addEventListener('mouseup', function (event) {
    isHold = false;
    isHoldCursor1 = false;
    isHoldCursor2 = false;
})

canvas.width = document.querySelector('.content-box').offsetWidth;
canvas.height = 400;

const center = Math.ceil(300 / 2);
const active_rect = '#b80e0e';
const inactive_rect = '#531818';
const cursor_color = '#ffffff7f';
const main_cursor_color = '#ffffff';
const glyph_color = '#f0f0f0';
const inactive_glyph_color = '#7f7f7f';

let audio_file;

let cursor1_pos = 0;
let cursor2_pos = 1;
let cursor2_pos_absolute = (Math.ceil(cursor2_pos * canvas.width) + 3) / canvas.width;
let main_cursor_pos = 0;

let rect_pos = 0;
let isHold = false;
let isHoldCursor1 = false;
let isHoldCursor2 = false;
let mouse_x = 0;
let mouse_y = 0;

let rms_array = [];
let glyph_array = [];

let audio = null;
let play_button = document.getElementById('play-button');
let timer = document.getElementById('current-time');
let audio_duration = document.getElementById('duration');
let time_to = document.getElementById('time-to');
let time_ss = document.getElementById('time-ss');
let isPlaying = false;
let updateCursorID = null;

let debug = document.getElementById('debug');
let isDebug = false;
if (isDebug) debug.hidden = false; else debug.hidden = true;

let make_button = document.getElementById('make-button');

let error_color = "#f00000ff";
let default_text_color = "#ffffff7f";

let message = "Upload your ringtone above";
let color = default_text_color;
let isError = false;

draw();

function downloadURL(url, name) {
    let link = document.createElement("a");
    link.setAttribute('download', name);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function AudioUpload() {
    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        audio_file = e.target.files[0];
        let req = new XMLHttpRequest();
        let formData = new FormData();
        message = "Please, wait..."
        color = default_text_color;
        draw();
        req.onreadystatechange = function() {
            if (this.readyState != 4) return;
            let response = JSON.parse(req.responseText);
            if (response['error'] == true){
                message = response['message'];
                color = error_color;
                rms_array = [];
                draw();
            } else {
                document.getElementById('audio-filename').innerText = audio_file.name;
                document.getElementById('audio-filename-m').innerText = audio_file.name;
                audio = new Audio(response['url']);
                rms_array = response['peaks'];
                glyph_array = response['custom'];
                let m = Math.floor(response['duration'] / 60);
                let s = Math.floor(response['duration'] % 60);
                audio_duration.innerText = get_time(m, s);
                draw();
            }
        }
        formData.append('audio', audio_file);
        req.open('POST', '/api/trim/upload', true);
        req.send(formData);
    }
    input.click();
}

function Make() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (this.readyState != 4) return;
        let response = JSON.parse(req.responseText);
        if (response['error']) {
            message = response['message'];
            color = error_color;
            rms_array = [];
            draw();
        } else {
            if(this.readyState == 4 && this.status == 200) {
                downloadURL(response['file'], 'audio.ogg');
                make_button.onclick = "Make()";
                make_button.className = "confirm-button";
                make_button.innerText = "Make";
            }
        }
    }
    req.open('GET', `/api/trim?ss=${cursor1_pos * audio.duration}&to=${cursor2_pos * audio.duration}`);
    req.send();
    make_button.onclick = "";
    make_button.className = "confirm-button-inactive";
    make_button.innerText = "Please wait, while your ringtone will be converted";
}

function spawnRect(position, height, active) {
    let x = Math.ceil(canvas.width / 100 * position) + 3;

    ctx.beginPath();
    if (active == true) 
        ctx.fillStyle = active_rect;
    else 
        ctx.fillStyle = inactive_rect;
    ctx.roundRect(x, center - (Math.ceil(height / 2)), 3, height, 20);
    ctx.fill();
}

function spawnGlyph(position, glyph_id, active) {
    let x = Math.ceil(canvas.width * position);
    let y = 305 + (glyph_id * 20);
    ctx.beginPath();
    if (active)
        ctx.fillStyle = glyph_color;
    else
        ctx.fillStyle = inactive_glyph_color;
    ctx.arc(x, y, 7, 0, 2 * Math.PI);
    ctx.fill();
}

function drawTrimCursor(pos1, pos2) {
    let x1 = Math.ceil(canvas.width * pos1);
    let x2 = Math.ceil((canvas.width * pos2) - 3);
    cursor2_pos_absolute = x2 / canvas.width;
    ctx.beginPath();
    ctx.fillStyle = cursor_color;
    ctx.rect(x1, 0, 3, 400);
    ctx.rect(x2, 0, 3, 400);
    ctx.fill();
}

function drawCursor(pos) {
    let x = Math.ceil(canvas.width * pos);
    ctx.beginPath();
    ctx.fillStyle = main_cursor_color;
    ctx.roundRect(x, 0, 3, 400, 20);
    ctx.fill();
}

function draw() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (rms_array.length != 100) {
        ctx.font = "20px Roboto";
        ctx.textAlign = "center";
        ctx.fillStyle = color;
        ctx.fillText(message, Math.ceil(canvas.width / 2), Math.ceil(canvas.height / 2));
        return;
    }
    for (let i = 0; i < 100; i++) {
        rect_pos = (canvas.width / 100 * i) / canvas.width;
        if (rect_pos > cursor2_pos || rect_pos < cursor1_pos) {
            spawnRect(i, Math.ceil(200 * rms_array[i]), false);
        } else {
            spawnRect(i, Math.ceil(200 * rms_array[i]), true);
        }
    }
    for (c of glyph_array.values()) {
        if (c[0] > cursor2_pos || c[0] < cursor1_pos) {
            spawnGlyph(c[0], c[1], false);
        } else {
            spawnGlyph(c[0], c[1], true);
        }
    } 
    drawTrimCursor(cursor1_pos, cursor2_pos);
    drawCursor(main_cursor_pos);
    time_to.innerText = get_trim_time(cursor1_pos);
    time_ss.innerText = get_trim_time(cursor2_pos);
    debug.innerHTML = `CanvasX: ${canvas.width}<br>CanvasY: ${canvas.height}<br>X: ${mouse_x * canvas.width} (${mouse_x})<br>Y: ${mouse_y * canvas.height} (${mouse_y})<br>C1: ${cursor1_pos * canvas.width} (${cursor1_pos})<br>C2: ${cursor2_pos * canvas.width} (${cursor2_pos})`;

}

function resizeCanvas() {
    canvas.width = document.querySelector('.content-box').offsetWidth;
    canvas.height = 400;
    draw();
}

function mouseEvent(event) {
    if (rms_array.length != 100) {
        return;
    }
    mouse_x = event.offsetX / (canvas.width - canvas.offsetLeft);
    if (mouse_x > 1) mouse_x = 1;
    mouse_y = event.offsetY / canvas.height;
    if (isHold && mouse_x > cursor1_pos && mouse_x < cursor2_pos) {
        main_cursor_pos = mouse_x;
        audio.currentTime = main_cursor_pos * audio.duration;
        updateTimer();
    } else if (isHoldCursor1 && mouse_x < cursor2_pos) {
        cursor1_pos = mouse_x;
    } else if (isHoldCursor2 && mouse_x > cursor1_pos) {
        cursor2_pos = mouse_x;
    }

    if ((isHoldCursor1 || isHoldCursor2) && (cursor1_pos > main_cursor_pos || cursor2_pos < main_cursor_pos)) {
        main_cursor_pos = cursor1_pos;
        isPlaying = true;
        play();
        audio.currentTime = main_cursor_pos * audio.duration;
        updateTimer();
    }
    draw();
}

function updateCursor() {
    main_cursor_pos = audio.currentTime / audio.duration;
    if (audio.currentTime == audio.duration || main_cursor_pos >= cursor2_pos) {
        stop_playing();
    }
    updateTimer();
    draw();
}

function get_time(m, s) {
    let m_str = "";
    let s_str = "";
    if (s < 10) s_str = `0${s}`; else s_str = s.toString();
    if (m < 10) m_str = `0${m}`; else m_str = m.toString();
    return `${m_str}:${s_str}`;
}

function get_trim_time(position) {
    let time_ = position * audio.duration;
    let m_str = "";
    let s_str = "";
    let ms_str = "";
    
    let m = Math.floor(time_ / 60);
    let s = Math.floor(time_ % 60);
    let ms = Math.floor((time_ - Math.floor(time_)) / 0.01);
    if (m < 10) m_str = `0${m}`; else m_str = m.toString();
    if (s < 10) s_str = `0${s}`; else s_str = s.toString();
    if (ms < 10) ms_str = `0${ms}`; else ms_str = ms.toString();
    return `${m_str}:${s_str}.${ms_str}`;
}

function updateTimer() {
    let m = Math.floor(audio.currentTime / 60);
    let s = Math.floor(audio.currentTime % 60);
    timer.innerHTML = get_time(m, s);
}

function play() {
    if (audio == null) {
        return;
    }

    if (isPlaying) {
        audio.pause();
        play_button.innerText = 'Play';
        isPlaying = false;
        clearInterval(updateCursorID);
    } else {
        audio.play();
        play_button.innerText = 'Pause';
        isPlaying = true;
        updateCursorID = setInterval(updateCursor, 100);
    }
}

function stop_playing() {
    audio.pause();
    audio.currentTime = cursor1_pos * audio.duration;
    main_cursor_pos = cursor1_pos;
    if (updateCursorID != null) {
        clearInterval(updateCursorID);
    }
    play_button.innerText = 'Play';
    isPlaying = false;
    updateTimer();
    draw();
}

function resetTrim() {
    cursor1_pos = 0;
    cursor2_pos = 1;
    draw();
}