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
        // increment the loading progress
        loading++;
    });

    // populate the demographics drop-down
    cors(DEMOGRAPHICS_FILE, function(data, error) {
        // populate the demographic drop-down
        set_dropdown('demographic', data, error);
        // increment the loading progress
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
            color: '#81b29a',
            width: 5
        }
    };

    // prepare and display the plots
    var histogram = {
        x: data['histogram']['x'],
        y: data['histogram']['y'],
        showlegend: false,
        name: labels[workout]['histogram']['y-axis-label'],
        type: 'bar',
        marker: {
            color: '#e07a5f'
        }
    };

    var plots = [percentile, histogram];

    x_axis = {
        title: labels[workout]['x-axis-label'],
        separatethousands: true,
        tickfont: {
            family: 'courier',
            size: 14
        },
        range: [
            data['histogram']['x'][0], 
            data['histogram']['x'][data['histogram']['x'].length - 1]
        ]
    };

    if('x-axis-ticks' in labels[workout]) {
        x_axis['tickvals'] = labels[workout]['x-axis-ticks']['values'];
        x_axis['ticktext'] = labels[workout]['x-axis-ticks']['ticks'];
    }

    var flipped_axes = {
        true: 'left',
        false: 'right'
    };

    var layout = {
        plot_bgcolor: '#f4f1de',
        paper_bgcolor: '#f4f1de',

        title: wod_name + ' ' + demographic + ' ' + scaling + ' (' + (function() {
            var sum = 0;
            for(var i in data['histogram']['y']) {
                sum += data['histogram']['y'][i];
            }
            return sum.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,');
        })() + ' athletes)',
        font: {
            family: 'Courier',
            size: 20
        },
        xaxis: x_axis,
        yaxis2: {
            title: labels[workout]['percentile']['y-axis-label'],
            tickfont: {
                family: 'courier',
                size: 14
            },
            showgrid: false,
            side: flipped_axes[!labels[workout]['axes-flip']],
            overlaying: 'y',
            color: '#81b29a',
            range: [.1, 105]
        },
        yaxis: {
            title: labels[workout]['histogram']['y-axis-label'],
            tickfont: {
                family: 'courier',
                size: 14
            },
            side: flipped_axes[labels[workout]['axes-flip']],
            color: '#e07a5f',
            range: [2, Math.max.apply(null, data['histogram']['y'])]
        }
    };

    Plotly.newPlot('plot', plots, layout);

    // display miscellaneous data
    $('message').innerHTML = labels[workout]['message'];

    // turn off the "loading..." message
    document.body.classList.remove('loading');

}
