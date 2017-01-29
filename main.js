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

    var k = 20, iterations = 100;

    var kmeansComponents = [];
    for (var i = 0; i < iterations; i++) {
        var c1;
        do {
            c1 = util.kmeans(k, copy(volumes), copy(stations));
        } while (c1.components.length != k);
        kmeansComponents.push(copy(c1));

        if (i % 10 == 0)
            console.log('kmeans: ', i);
    }

    var projectionComponents = [];
    for (var i = 0; i < iterations; i++) {
        var c2;
        do {
            c2 = util.projection(k, copy(volumes), copy(stations));
        } while (c2.components.length != k);
        projectionComponents.push(copy(c2));

        if (i % 10 == 0)
            console.log('projection: ', i);
    }

    console.log('k = ', k);
    console.log('Average free distance k-means: ', countAverage(kmeansComponents, 'freeDistance'));
    console.log('Average distance projection: ', countAverage(projectionComponents, 'distance'));
    console.log('Average distance k-means: ', countAverage(kmeansComponents, 'distance'));
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
    components.forEach(function(component) {
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
    });
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
