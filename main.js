function getData(dataName) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', dataName, false);
    xhr.send();
    if (xhr.status != 200) {
        alert( xhr.status + ': ' + xhr.statusText );
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

    var iterations = 20;
    var minClusters = 10, maxClusters = 15;
    var kmeansComponents = [];
    var projectionComponents = [];

    for (var k = minClusters; k < maxClusters; k++) {

        for (var i = 0; i < iterations; i++) {
            var c1;

            do {
                c1 = util.kmeans(k, copy(volumes), copy(stations));
            } while (c1.components.length != k);

            kmeansComponents.push(copy(c1));

            if (i % 10 == 0)
                console.log('kmeans: ', k);
        }

        for (var i = 0; i < iterations; i++) {
            var c2;
            do {
                c2 = util.projection(k, copy(volumes), copy(stations));
            } while (c2.components.length != k);
            projectionComponents.push(copy(c2));

            if (i % 10 == 0)
                console.log('projection: ', k);
        }
    }

    console.log('K-MEANS');
    logTheBest(kmeansComponents);

    console.log();

    console.log('PROJECTION');
    logTheBest(projectionComponents);
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

    console.log('Number of clusters: ' + bestComponents.components.length);
    console.log('Distance: ' + bestComponents.distance);
    console.log('Distance with weight: ' + bestComponents.distanceWithWeight);

    for (var i = 0; i < bestComponents.components.length; i++) {
        var component = bestComponents.components[i];

        console.log('Number: ' + i);
        console.log('Station: ', component.station);
        //console.log('Точки: ');
        /*for (var j = 0; j < component.points.length; j++) {
            console.log(component.points[j]);
        }*/
    }

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

function drawComponents(components){
    for (var i = 0; i < components.length; i++) {
        var component = components[i];

        var points = component.points;

        drawCircle(ctx, component.station, {
            color: 'green',
            radius: 4
        });

        points.forEach(function(point) {
            drawLine(ctx, component.station, point);
            drawCircle(ctx, point, {
                color: 'red',
                radius: 2
            });
        });

        drawText(ctx, component.station, component.station.name);
    }
}

function drawCircle(ctx, pos, params) {
    var color = params && params.color || 'black';
    var radius = params && params.radius || 3;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

function drawText(ctx, pos, text) {
    ctx.font = '20px Verdana';
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
