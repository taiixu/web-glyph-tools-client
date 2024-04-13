let xhr = new XMLHttpRequest();
let version = document.getElementById('ver');
let terminal = document.getElementById('terminal')
xhr.open("GET", "/api/getcookies", true);
xhr.send();

let beatmapset_file;

function downloadURL(url, name) 
{
    var link = document.createElement("a");
    link.setAttribute('download', name);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function BeatMapSetUpload() {
    let input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        beatmapset_file = e.target.files[0];
        document.getElementById('osu-filename').innerText = beatmapset_file.name;
        document.getElementById('osu-filename-m').innerText = beatmapset_file.name;
        let req = new XMLHttpRequest();
        let formData = new FormData();
        terminal.innerHTML = "Please wait until your file is uploaded"
        req.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {

                let response = JSON.parse(req.responseText);

                if (response['error'] == true) {
                    terminal.innerHTML = `<span class="c-red">${response['message']}</span>`;
                    return;
                }

                select = document.getElementById('maps');
                select.innerHTML = '';
                for (c in response['content']) {
                    let o = document.createElement('option');
                    let meta = response['content'][c];
                    o.value = c.toString();
                    o.innerHTML = `${meta['artist']} - ${meta['title']} [${meta['version']} | by ${meta['creator']}] (${meta['objects_count']} objects)`;
                    select.appendChild(o);   
                }
                terminal.innerHTML += '<br><span class="c-green">Ok</span>';
            }
        }

        formData.append('beatmap', beatmapset_file);
        req.open('POST', '/api/osu/upload', true);
        req.send(formData);
        }
    input.click();
}


function Make() {
    let req = new XMLHttpRequest();
    let ver = version.value;
    let map = document.getElementById('maps').value;
    let ns = document.getElementById('ns').value;
    let seed = document.getElementById('seed').value;
    let isNP2 = document.getElementById('np2').checked.toString();
    if (ns == '') ns = '24';
    if (seed == '') seed = '1234';
    req.onreadystatechange = function() {
        let response = JSON.parse(req.responseText);
        clearInterval(timerId);
        terminal.innerHTML = '';

        if (response['error'] == true) {
            terminal.innerHTML = "<span class=\"c-red\">" + JSON.parse(req.responseText)['message'] + "</span>";
            return;
        }

        if (ver == 'v1') {
            terminal.innerHTML = "GlyphV1.py<br>";
        } else if (ver == 'v2') {
            terminal.innerHTML = "GlyphV2.py<br>";
        }
        terminal.innerHTML += response['content']['msg'] + '<br>';
        terminal.innerHTML += "GlyphTranslator.py<br>" + response['content']['t_msg'] + '<br>';
        terminal.innerHTML += "GlyphModder.py<br>" + response['content']['m_msg'];
        
        let files = response['files'];

        let d_audio = document.getElementById('download-audio');
        let d_label = document.getElementById('download-label');
        let d_glypha = document.getElementById('download-glypha');
        let d_glyphc = document.getElementById('download-glyphc');

        d_audio.className = "c-button";
        d_label.className = "c-button";
        d_glypha.className = "c-button";
        d_glyphc.className = "c-button";

        d_audio.setAttribute('onclick', `downloadURL("${files['audio']}", "audio.ogg")`);
        d_label.setAttribute('onclick', `downloadURL("${files['label']}", "label.txt")`);
        d_glypha.setAttribute('onclick', `downloadURL("${files['glypha']}", "label.glypha")`);
        d_glyphc.setAttribute('onclick', `downloadURL("${files['glyphc1']}", "label.glyphc1")`);
    }
    req.open('GET', `/api/osu?ver=${ver}&n=${map}&seed=${seed}&ns=${ns}&np2=${isNP2}`, true);
    req.send();

    terminal.innerHTML = "Please wait for your file to be converted";
    let timerId = setInterval(() => terminal.innerHTML += '.', 750);
}

version.addEventListener("change", (event) => {
    if (event.target.value == "v1") {
        let v2 = document.querySelectorAll('.v2');
        for (let c of v2.keys()) {
            v2[c].style.display = 'none';
        }
    } else if (event.target.value == "v2") {
        let v2 = document.querySelectorAll('.v2');
        for (let c of v2.keys()) {
            v2[c].style.display = '';
        }
    }
})