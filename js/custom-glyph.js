let xhr = new XMLHttpRequest();
let terminal = document.getElementById('terminal')
xhr.open("GET", "/api/getcookies", true);
xhr.send();

let audio_file;
let label_file;

function downloadURL(url, name) 
{
    var link = document.createElement("a");
    link.setAttribute('download', name);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function AudioUpload() {
    let input = document.createElement('input');
    input.type = 'file'
    input.onchange = e => {
        audio_file = e.target.files[0];
        document.getElementById('audio-filename').innerText = audio_file.name;
        document.getElementById('audio-filename-m').innerText = audio_file.name;
    }
    input.click()
}

function LabelUpload() {
    let input = document.createElement('input');
    input.type = 'file'
    input.onchange = e => {
        label_file = e.target.files[0];
        document.getElementById('label-filename').innerText = label_file.name;
        document.getElementById('label-filename-m').innerText = label_file.name;
    }
    input.click()
}

function Make() {
    let req = new XMLHttpRequest();
    let formData = new FormData();

    req.onreadystatechange = function() {
        if (req.readyState == XMLHttpRequest.DONE) {
            clearInterval(timerId);
            terminal.innerHTML = '';
            if (JSON.parse(req.responseText)['error'] == true) {
                terminal.innerHTML = "<span class=\"c-red\">" + JSON.parse(req.responseText)['message'] + "</span>";
            } else {
                terminal.innerHTML = "GlyphTranslator.py<br>" + JSON.parse(req.responseText)['content']['t_msg'] + "<br>";
                terminal.innerHTML += "GlyphModder.py<br>" + JSON.parse(req.responseText)['content']['m_msg'];
                let d_audio = document.getElementById('download-audio');
                let d_glyphc = document.getElementById('download-glyphc');
                let d_glypha = document.getElementById('download-glypha');
            
                d_audio.className = "c-button";
                d_glyphc.className = "c-button";
                d_glypha.className = "c-button";

                let files = JSON.parse(req.responseText)['files']

                d_audio.setAttribute('onclick', `downloadURL("${files['audio']}", "audio.ogg")`);
                d_glyphc.setAttribute('onclick', `downloadURL("${files['glyphc1']}", "label.glyphc1")`);
                d_glypha.setAttribute('onclick', `downloadURL("${files['glypha']}", "label.glypha")`);
            }

        }
    }

    formData.append("audio", audio_file);
    formData.append("label", label_file);
    req.open("POST", "/api/glyph", true);
    //req.withCredential = true;
    req.send(formData);
    terminal.innerHTML = "Please wait for your file to be converted";
    let timerId = setInterval(() => terminal.innerHTML += '.', 750);
}