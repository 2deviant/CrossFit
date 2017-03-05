var LABELS_FILE = 'labels.json';
var WORKOUTS_FILE = 'workouts.json';
var DEMOGRAPHICS_FILE = 'demographics.json';

var labels = {};
var loading = 0;
var DONE_LOADING = 3;

window.onload = function() {

    // populate the plot label dictionary
    cors(LABELS_FILE, function(data, error) {
        labels = data;
        loading++;
    });

    // populate the plot selectors
    cors(WORKOUTS_FILE, function(data, error) {
        loading++;
        set_dropdown('workout', data, error);
    });

    cors(DEMOGRAPHICS_FILE, function(data, error) {
        set_dropdown('demographic', data, error);
        loading++;
    });

    // activate them
    activate_dropdowns();

    // trigger the first plot to be drawn when everything is loaded
    function first_render() {
        if(loading != DONE_LOADING)
            window.setTimeout(first_render, 100);
        else
            render();

    }
    first_render();

}

function $(id) {
    return document.getElementById(id);
}

function cors(uri, processor) {
    var req = new XMLHttpRequest();
    req.open('GET', BASE_URI + uri, true);
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

function activate_dropdowns() {
    $('workout').onchange =
    $('scaling').onchange = 
    $('demographic').onchange = function() {
        render();
    }
}

function render() {

    // what are we plotting?
    var workout = $('workout').value;
    var demographic = $('demographic').value;
    var scaling = $('scaling').value;

    // compose the file name
    var file_name = workout + '_' + demographic + '_' + scaling + '.json';

    // set the "loading..." message
    $('plot').classList.add('loading');

    // load the data
    cors(file_name, function(data, error) {
        if(!error) {
            plot(data);
        } else {
            // turn off the "loading..." message
            $('plot').classList.remove('loading');
            alert("Something didn't load right.  Please reload.");
        }

    });
}

function plot(data) {

    // what are we plotting?
    var workout = $('workout').value;
    var wod_name = $('workout').selectedOptions[0].innerHTML;
    var demographic = $('demographic').selectedOptions[0].innerHTML;
    var scaling = $('scaling').selectedOptions[0].innerHTML;

    var percentile = {
        x: data['percentile']['x'],
        y: data['percentile']['y'],
        showlegend: false,
        name: labels[workout]['percentile']['y-axis-label'],
        yaxis: 'y2',
        mode: 'lines',
        line: {
            width: 5
        }
    };

    // align the histograms
    data['histogram']['x'].shift();

    // prepare and display the plots
    var histogram = {
        x: data['histogram']['x'],
        y: data['histogram']['y'],
        showlegend: false,
        name: labels[workout]['histogram']['y-axis-label'],
        type: 'bar',
    };

    var plots = [percentile, histogram];

    var layout = {
        title: wod_name + ' ' + demographic + ' ' + scaling,
        xaxis: {
            title: labels[workout]['x-axis-label'],
            range: [
                data['histogram']['x'][0], 
                data['histogram']['x'][data['histogram']['x'].length - 1]
            ],
        },
        yaxis2: {
            title: labels[workout]['percentile']['y-axis-label'],
            showgrid: false,
            overlaying: 'y',
            range: [0, 105]
        },
        yaxis: {
            title: labels[workout]['histogram']['y-axis-label'],
            side: 'right',
            range: [0,]
        }
    };

    Plotly.newPlot('plot', plots, layout);

    // display miscellaneous data
    $('total_athlete_count').innerHTML = (function() {
        var sum = 0;
        for(i in data['histogram']['y']) {
            sum += data['histogram']['y'][i];
        }
        return sum.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    })();

    $('message').innerHTML = labels[workout]['message'];

}
