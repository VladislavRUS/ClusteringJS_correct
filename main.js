function getData(dataName) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', dataName, false);
    xhr.send();
    if (xhr.status != 200) {
        alert(xhr.status + ': ' + xhr.statusText);
        throw new Error(xhr.statusText);

    } else {
        return JSON.parse(xhr.responseText);
    }
}

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 50;
canvas.height = window.innerHeight - 50;

function process() {
    var volumes = getData('volumes.json');
    util.setNumericProperties(volumes, ['latitude', 'longitude', 'x', 'y', 'size']);
    util.scaleCoordinates(volumes, 0, canvas.width, canvas.height);

    var stations = getData('stations.json');
    util.setNumericProperties(stations, ['latitude', 'longitude', 'x', 'y']);
    util.scaleCoordinates(stations, 0, canvas.width, canvas.height);

    var iterations = 50;
    var minClusters = 1, maxClusters = 25;
    var kmeansResults = [];
    var projectionResults = [];

    var price = 30000;

    var km = true;

    for (var k = minClusters; k <= maxClusters; k++) {
        //if (km) {
            for (var i = 0; i < iterations; i++) {
                var c1;

                do {
                    c1 = util.kmeans(k, copy(volumes), copy(stations), price);
                } while (c1.components.length != k);

                kmeansResults.push(copy(c1));

                console.log('kmeans: ' + k);
            }
        //} else {
            for (var i = 0; i < iterations; i++) {
                var c2;
                do {
                    c2 = util.projection(k, copy(volumes), copy(stations), price);
                } while (c2.components.length != k);
                projectionResults.push(copy(c2));

                console.log('projection: ' + k);
            }
       // }
    }


    kmeansResults = setAverage(kmeansResults, iterations);
    projectionResults = setAverage(projectionResults, iterations);
    createChartWithPrice(kmeansResults, projectionResults, price);

    //createChartWithoutWeight(kmeansResults, projectionResults);
    //createChartWithWeight(kmeansResults, projectionResults);

    //forChart('K-MEANS', kmeansComponents);
    //forChart('PROJECTION', projectionComponents);
    /*
     if (km) {
     append('K-MEANS', true);
     logTheBest(kmeansResults);

     } else {
     append('PROJECTION', true);
     logTheBest(projectionResults);
     }*/
}

function logWithPrice() {

}

function setAverage(results, iterations) {
    var arr = [];

    while (results.length > 0) {
        var chunk = results.splice(0, iterations);

        var averageDistance = countAverage(chunk, 'distance'),
            averagePrice = countAverage(chunk, 'price'),
            averageDistanceWithWeight = countAverage(chunk, 'distanceWithWeight'),
            averageFreeDistance = countAverage(chunk, 'freeDistance');

        arr.push({
            price: averagePrice,
            distance: averageDistance,
            distanceWithWeight: averageDistanceWithWeight,
            freeDistance: averageFreeDistance,
            numberOfClusters: chunk[0].numberOfClusters
        });
    }

    return arr;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


function countChunkAverage(chunk, prop) {
    var sum = 0;
    for (var i = 0; i < chunk.length; i++) {
        sum += chunk[i][prop];
    }

    return Math.floor(sum / chunk.length);
}

function forChart(algo, components) {
    append(algo, true);
    append('Number of clusters', true);
    components.forEach(function (collection) {
        append(collection.components.length + ' ', false);
    });
    append('Distance', true);
    components.forEach(function (collection) {
        append(collection.distance + ' ', false);
    });
}

function createChartWithPrice(kmeansResults, projectionResults, price) {
    var trace0 = {
        x: kmeansResults.map(function (result) {
            return result.numberOfClusters;
        }),
        y: kmeansResults.map(function (result) {
            return result.freeDistance;
        }),
        name: 'Free, average: ' + countAverage(kmeansResults, 'freeDistance'),
        type: 'scatter'
    };

    var trace1 = {
        x: kmeansResults.map(function (result) {
            return result.numberOfClusters;
        }),
        y: kmeansResults.map(function (result) {
            return result.distance;
        }),
        name: 'K-Means, average cost ' + countAverage(kmeansResults, 'distance'),
        type: 'scatter'
    };

    var trace2 = {
        x: projectionResults.map(function (result) {
            return result.numberOfClusters;
        }),
        y: projectionResults.map(function (result) {
            return result.distance;
        }),
        name: 'Projection, average cost ' + countAverage(projectionResults, 'distance'),
        type: 'scatter'
    };

    var layout = {
        title: 'Total cost, price: ' + price,
        xaxis: {
            title: 'Number of clusters'
        },
        yaxis: {
            title: 'Cost'
        }
    };

    logTraces([trace0, trace1, trace2]);
    Plotly.newPlot('chartWithoutWeight', [trace0, trace1, trace2], layout);
}

function logTraces(traces) {
    traces.forEach(function(trace, idx) {
        append('trace: ' + idx, true);

        append('X: ', true);
        trace.x.forEach(function(xCoord) {
            append(xCoord + ', ', false);
        });

        append('Y: ', true);
        trace.y.forEach(function(yCoord) {
            append(yCoord + ', ', false);
        });
    });
}

function createChartWithoutWeight(kmeansResults, projectionResults) {
    var trace0 = {
        x: kmeansResults.map(function (result) {
            return result.numberOfClusters;
        }),
        y: kmeansResults.map(function (result) {
            return result.freeDistance;
        }),
        name: 'Free, average: ' + countAverage(kmeansResults, 'freeDistance'),
        type: 'scatter'
    };

    var trace1 = {
        x: kmeansResults.map(function (result) {
            return result.numberOfClusters;
        }),
        y: kmeansResults.map(function (result) {
            return result.distance;
        }),
        name: 'K-Means, average: ' + countAverage(kmeansResults, 'distance'),
        type: 'scatter'
    };

    var trace2 = {
        x: projectionResults.map(function (result) {
            return result.numberOfClusters;
        }),
        y: projectionResults.map(function (result) {
            return result.distance;
        }),
        name: 'Projection, average: ' + countAverage(projectionResults, 'distance'),
        type: 'scatter'
    };

    var layout = {
        title: 'Distance without weight',
        xaxis: {
            title: 'Number of clusters'
        },
        yaxis: {
            title: 'Distance'
        }
    };

    logTraces([trace0, trace1, trace2]);

    Plotly.newPlot('chartWithoutWeight', [trace0, trace1, trace2], layout);
}

function createChartWithWeight(kmeansResults, projectionResults) {
    var trace0 = {
        x: kmeansResults.map(function (result) {
            return result.numberOfClusters;
        }),
        y: kmeansResults.map(function (result) {
            return result.freeDistance;
        }),
        name: 'Free, average: ' + countAverage(kmeansResults, 'freeDistance'),
        type: 'scatter'
    };

    var trace1 = {
        x: kmeansResults.map(function (result) {
            return result.numberOfClusters;
        }),
        y: kmeansResults.map(function (result) {
            return result.distanceWithWeight;
        }),
        name: 'K-Means, average: ' + countAverage(kmeansResults, 'distanceWithWeight'),
        type: 'scatter'
    };

    var trace2 = {
        x: projectionResults.map(function (result) {
            return result.numberOfClusters;
        }),
        y: projectionResults.map(function (result) {
            return result.distanceWithWeight;
        }),
        name: 'Projection, average: ' + countAverage(projectionResults, 'distanceWithWeight'),
        type: 'scatter'
    };

    var layout = {
        title: 'Distance with weight',
        xaxis: {
            title: 'Number of clusters'
        },
        yaxis: {
            title: 'Distance'
        }
    };

    logTraces([trace0, trace1, trace2]);

    Plotly.newPlot('chartWithWeight', [trace0, trace1, trace2], layout);
}

function logTheBest(divisions) {
    var bestIdx = 0, minDistance = divisions[0].distance;

    for (var i = 1; i < divisions.length; i++) {
        if (divisions[i].distance < minDistance) {
            bestIdx = i;
            minDistance = divisions[i].distance;
        }
    }

    var bestComponents = divisions[bestIdx];


    append('Number of clusters: ' + bestComponents.components.length, true);
    append('Distance: ' + bestComponents.distance, true);
    append('Distance with weight: ' + bestComponents.distanceWithWeight, true);

    for (var i = 0; i < bestComponents.components.length; i++) {
        var component = bestComponents.components[i];

        append('Number: ' + i, true);

        for (var prop in component.station) {
            append(prop + ' ' + component.station[prop], false);
            append(', ', false);
        }

        append('', true);
        /*for (var j = 0; j < component.points.length; j++) {
         append(JSON.stringify(component.points[j]), true);
         }*/
    }

    drawComponents(bestComponents.components);

}

function replace(text) {
    document.getElementById('info').innerHTML = text;
}

function append(text, block) {
    var elem = block ? document.createElement('div') : document.createElement('span');
    elem.innerHTML = text;
    document.getElementById('info').appendChild(elem);
}

function countAverage(componentsArr, prop) {
    var averageDistance = 0;

    for (var i = 0; i < componentsArr.length; i++) {
        averageDistance += componentsArr[i][prop];
    }

    return averageDistance / componentsArr.length;
}

function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function drawComponents(components) {
    for (var i = 0; i < components.length; i++) {
        var component = components[i];

        var points = component.points;

        drawCircle(ctx, component.station, {
            color: 'red',
            radius: 8
        });

        var color = getRandomColor();

        points.forEach(function (point) {
            drawLine(ctx, component.station, point);
            drawCircle(ctx, point, {
                radius: 4,
                color: color
            });
        });

        drawText(ctx, component.station, component.station.name);
    }
}

function drawCircle(ctx, pos, params) {
    var color = params && params.color || getRandomColor();
    var radius = params && params.radius || 3;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

function drawText(ctx, pos, text) {
    ctx.font = '24px Verdana';
    ctx.fillStyle = 'black';
    ctx.fillText(text, pos.x - text.length * 10, pos.y - 20);
}

function drawLine(ctx, from, to, params) {
    var color = params && params.color || 'black';
    var lineWidth = params && params.width || 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([5, 50]);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.closePath();
    ctx.stroke();
}

process();
