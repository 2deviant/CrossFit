var WORKOUTS_FILE = 'workouts.json';
var DEMOGRAPHICS_FILE = 'demographics.json';

var labels = {};
var loading = 0;
var DONE_LOADING = 2;
var SCALING = {
    'rx': 'Rx',
    'scaled': 'Scaled'
};

window.onload = function() {

    cors(WORKOUTS_FILE, function(data, error) {
        // store workout specifics in a dictionary
        for(i in data)
            labels[data[i].file] = data[i];
        // populate the workout drop-down
        set_dropdown('workout', data, error);
        loading++;
    });

    // populate the demographics drop-down
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

function _(name) {
    return document.getElementsByName(name);
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
        for(var i in data) {
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
    _('scaling')[0].onchange = 
    _('scaling')[1].onchange = 
    $('demographic').onchange = function() {
        render();
    }
}

function render() {

    // what are we plotting?
    var workout = $('workout').value;
    var demographic = $('demographic').value;
    var scaling = document.querySelector('input[name="scaling"]:checked').value;

    // compose the file name
    var file_name = workout + '_' + demographic + '_' + scaling + '.json';

    // set the "loading..." message
    document.body.classList.add('loading');

    // load the data
    cors(file_name, function(data, error) {
        if(!error) {
            plot(data);
        } else {
            // turn off the "loading..." message
            document.body.classList.remove('loading');
            alert("Something didn't load right.  Please reload.");
        }

    });
}

function plot(data) {

    // what are we plotting?
    var workout = $('workout').value;
    var wod_name = $('workout').selectedOptions[0].innerHTML;
    var demographic = $('demographic').selectedOptions[0].innerHTML;
    var scaling = SCALING[document.querySelector('input[name="scaling"]:checked').value];

    var percentile = {
        x: data['percentile']['x'],
        y: data['percentile']['y'],
        showlegend: false,
        name: labels[workout]['percentile']['y-axis-label'],
        yaxis: 'y2',
        type: 'lines',
        line: {
            color: 'rgb(0, 0, 128)',
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
        marker: {
            color: 'rgb(128, 0, 0)'
        }
    };

    var plots = [percentile, histogram];

    var layout = {
        title: 'CrossFit Open ' + wod_name + ' ' + demographic + ' ' + scaling + ' (' + (function() {
            var sum = 0;
            for(var i in data['histogram']['y']) {
                sum += data['histogram']['y'][i];
            }
            return sum.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,');
        })() + ' athletes)',
        font: {
            family: 'Raleway,Palatino,Garamond',
            size: 20
        },
        xaxis: {
            title: labels[workout]['x-axis-label'],
            tickfont: {
                family: 'helvetica',
                size: 14
            },
            range: [
                data['histogram']['x'][0], 
                data['histogram']['x'][data['histogram']['x'].length - 1]
            ]
        },
        yaxis2: {
            title: labels[workout]['percentile']['y-axis-label'],
            tickfont: {
                family: 'helvetica',
                size: 14
            },
            showgrid: false,
            overlaying: 'y',
            color: 'rgb(0, 0, 128)',
            range: [.1, 105]
        },
        yaxis: {
            title: labels[workout]['histogram']['y-axis-label'],
            tickfont: {
                family: 'helvetica',
                bold: true,
                size: 14
            },
            side: 'right',
            color: 'rgb(128, 0, 0)',
            range: [0,]
        }
    };

    Plotly.newPlot('plot', plots, layout);

    // display miscellaneous data
    $('message').innerHTML = labels[workout]['message'];

    // turn off the "loading..." message
    document.body.classList.remove('loading');

}
