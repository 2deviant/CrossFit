var WORKOUTS_FILE = 'workouts.json';
var DEMOGRAPHICS_FILE = 'demographics.json';

window.onload = function() {

    // load the drop-downs
    cors(BASE_URI + WORKOUTS_FILE, function(data, error) {
        set_dropdown('workout', data, error);
    });

    // load the demographics
    cors(BASE_URI + DEMOGRAPHICS_FILE, function(data, error) {
        set_dropdown('demographic', data, error);
    });
}

function $(id) {
    return document.getElementById(id);
}

function cors(uri, processor) {
    var req = new XMLHttpRequest();
    req.open('GET', uri, true);
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status >= 200 && req.status < 400) {
                var data = JSON.parse(req.responseText);
                processor(data, false);
            } else {
                processor({}, true);
            }
        }
    };
    req.send();
}

function set_dropdown(id, data, error) {
    if(!error) {
        var dropdown = $(id);
        for(var i = 0; i < data.length; i++) {
            var option = document.createElement('option');
            option.innerHTML = data[i]['name'];
            option.value = data[i]['file'];
            dropdown.appendChild(option);
        }
    } else {
        alert('Something went wrong.  Please reload the page.');
    }
}
