(function () {
    this.util = {
        algorithmIterationsNumber: 50,
        kmeans: function (k, volumes, stations) {
            var self = this;

            var minX = self.findMin(volumes, 'x');
            var maxX = self.findMax(volumes, 'x');
            var minY = self.findMin(volumes, 'y');
            var maxY = self.findMax(volumes, 'y');

            var randomPoints = [];
            for (var i = 0; i < k; i++) {
                randomPoints.push(self.getRandomPosition(minX, maxX, minY, maxY));
            }

            var cnt = 0;

            var clusters = {};

            while (cnt < this.algorithmIterationsNumber) {
                cnt++;
                clusters = {};

                for (var i = 0; i < volumes.length; i++) {
                    var point = volumes[i];
                    var closestRandomPointIdx = self.findClosestRandomPointIdx(point, randomPoints);

                    if (!clusters[closestRandomPointIdx]) {
                        clusters[closestRandomPointIdx] = {};
                        clusters[closestRandomPointIdx].points = [];
                    }

                    clusters[closestRandomPointIdx].points.push(point);
                }

                var newRandomPoints = [];

                for (var prop in clusters) {
                    var component = clusters[prop].points;
                    var center = self.findComponentCenter(component);
                    newRandomPoints.push(center);
                }

                randomPoints = newRandomPoints;
            }

            var components = [];

            for (var prop in clusters) {
                var component = {};
                component.points = clusters[prop].points;
                component.center = self.findComponentCenter(component.points);

                if (stations.length > 0)
                    component.station = stations[self.findClosestStationIdx(component.center,stations)];

                components.push(component);
            }

            return {
                components: components,
                distance: self.getDistance(components),
                distanceWithWeight: self.getDistanceWithWeight(components),
                freeDistance: self.getFreeDistance(components)
            };
        },

        projection: function (k, volumes, stations) {
            var self = this;

            var stationsCopy = JSON.parse(JSON.stringify(stations));

            var randomStations = [];

            for (var i = 0; i < k; i++) {
                var randomIdx = Math.floor(Math.random() * stationsCopy.length);
                randomStations.push(stationsCopy[randomIdx]);
                stationsCopy.splice(randomIdx, 1);
            }

            var cnt = 0;
            var clusters = {};

            while (cnt < this.algorithmIterationsNumber) {
                cnt++;
                clusters = {};

                for (var i = 0; i < volumes.length; i++) {
                    var point = volumes[i];
                    var closestRandomStationIdx = self.findClosestRandomPointIdx(point, randomStations);

                    if (!clusters[closestRandomStationIdx]) {
                        clusters[closestRandomStationIdx] = {};
                        clusters[closestRandomStationIdx].points = [];
                    }

                    clusters[closestRandomStationIdx].points.push(point);
                }

                var newRandomStations = [];

                for (var prop in clusters) {
                    var component = {};
                    component.points = clusters[prop].points;
                    component.center = self.findComponentCenter(component.points);
                    var station = stations[self.findClosestStationIdx(component.center, stations)];
                    newRandomStations.push(station);
                }

                randomStations = newRandomStations;
            }

            var components = [];

            for (var prop in clusters) {
                var component = {};
                component.points = clusters[prop].points;
                component.center = self.findComponentCenter(component.points);
                component.station = stations[self.findClosestStationIdx(component.center, stations)];
                components.push(component);
            }

            return {
                components: components,
                distance: self.getDistance(components),
                distanceWithWeight: self.getDistanceWithWeight(components)
            };
        },

        findMin: function (arr, param) {
            var min = Number.MAX_VALUE;

            for (var i = 0; i < arr.length; i++) {
                if (min > arr[i][param]) {
                    min = arr[i][param];
                }
            }

            return min;
        },

        findMax: function (arr, param) {
            var max = Number.MIN_VALUE;

            for (var i = 0; i < arr.length; i++) {
                if (max < arr[i][param]) {
                    max = arr[i][param];
                }
            }

            return max;
        },

        getDistance: function (components) {
            var self = this;

            var distance = 0;

            components.forEach(function (component) {
                var station = component.station;
                var points = component.points;

                points.forEach(function (point) {
                    distance += self.getDistanceBetweenTwoPoints(station, point);
                });
            });

            return distance;
        },

        getDistanceWithWeight: function(components) {
            var self = this;

            var distance = 0;

            components.forEach(function (component) {
                var station = component.station;
                var points = component.points;

                points.forEach(function (point) {
                    distance += self.getDistanceBetweenTwoPoints(station, point) * ((point.size > 0) ? point.size : 1);
                });
            });

            return distance;
        },

        getFreeDistance: function (components) {
            var self = this;

            var distance = 0;

            components.forEach(function (component) {
                var center = component.center;
                var points = component.points;

                points.forEach(function (point) {
                    distance += self.getDistanceBetweenTwoPoints(center, point);
                });
            });

            return distance;
        },

        findComponentCenter: function (arr) {
            var xSum = 0,
                ySum = 0,
                massSum = 0;

            for (var i = 0; i < arr.length; i++) {
                var size = arr[i].size > 0 ? arr[i].size : 1;

                xSum += arr[i].x * size;
                ySum += arr[i].y * size;
                massSum += size;
            }

            return {
                x: Math.floor(xSum / massSum),
                y: Math.floor(ySum / massSum)
            }
        },

        findClosestRandomPointIdx: function (point, randomPoints) {
            var minDistance = Number.MAX_VALUE,
                idx = -1;

            for (var i = 0; i < randomPoints.length; i++) {
                var distance = this.getDistanceBetweenTwoPoints(point, randomPoints[i]);

                if (distance < minDistance) {
                    minDistance = distance;
                    idx = i;
                }
            }

            return idx;
        },

        findClosestStationIdx: function (point, stations) {
            var closestIdx = -1,
                minDistance = Number.MAX_VALUE;

            for (var i = 0; i < stations.length; i++) {
                var distance = this.getDistanceBetweenTwoPoints(point, stations[i]);

                if (distance < minDistance) {
                    closestIdx = i;
                    minDistance = distance;
                }
            }

            return closestIdx;
        },

        getDistanceBetweenTwoPoints: function (p1, p2) {
            return Math.floor(Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)));
        },

        getRandomPosition: function (xMin, xMax, yMin, yMax) {
            var x = Math.floor(Math.random() * (xMax - xMin) + xMin);
            var y = Math.floor(Math.random() * (yMax - yMin) + yMin);

            return {
                x: x,
                y: y
            }
        },

        scaleBetween: function (unscaledNum, minAllowed, maxAllowed, min, max) {
            return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
        },

        getNumber: function (str) {
            return str.indexOf(',') == -1 ? parseInt(str) : parseInt(str.substr(0, str.indexOf(',')));
        },

        setNumericProperties: function (points, properties) {
            var self = this;

            points.forEach(function(point) {
                properties.forEach(function(prop) {
                    point[prop] = self.getNumber(point[prop]);
                });
            });
        },

        scaleCoordinates: function (points, min, width, height) {
            var self = this;

            var minX = self.findMin(points, 'x');
            var maxX = self.findMax(points, 'x');
            var minY = self.findMin(points, 'y');
            var maxY = self.findMax(points, 'y');

            for (var i = 0; i < points.length; i++) {
                var point = points[i];
                point.x = Math.floor(self.scaleBetween(point.x, min, width, minX, maxX));
                point.y = height - Math.floor(self.scaleBetween(point.y, min, height, minY, maxY));
            }
        }
    }
})(this);