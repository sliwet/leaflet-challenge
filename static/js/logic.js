
let magToRadius = mag => mag * 20000;

let magToColor = magnitude => {
    let a = 1.0;
    if (magnitude < 1) {
        return `rgba(200,255,0,${a})`
    } else if (magnitude < 2) {
        return `rgba(211,204,0,${a})`
    } else if (magnitude < 3) {
        return `rgba(222,153,0,${a})`
    } else if (magnitude < 4) {
        return `rgba(233,102,0,${a})`
    } else if (magnitude < 5) {
        return `rgba(244,51,0,${a})`
    } else {
        return `rgba(255,0,0,${a})`
    }
}

// let link = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
let link = "static/data/earthquake.geojson";
let linktectonicplates = "static/data/PB2002_plates.json";

d3.json(link, data => {
    d3.json(linktectonicplates,tpdata =>{
        let layerList = {
            earthquakes: getEarthquakes(data),
            faultlines: getFaultlines(tpdata)
        };
        createMap(layerList);
    });
});

let getFaultlines = tpdata => {
    let plateLines = L.geoJSON(tpdata, {
        color: "yellow", 
        fillOpacity: 0
    })
    return plateLines;
}

let getEarthquakes = earthquakeData => {
    let cmarkers = [];
    earthquakeData.features.forEach(feature => {
        let crd = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
        let onemarker = L.circle(crd, {
            stroke: false,
            color: magToColor(feature.properties.mag),
            fillColor: magToColor(feature.properties.mag),
            fillOpacity: 1,
            radius: magToRadius(feature.properties.mag)
        });

        onemarker.bindPopup(
            "<h3>" + feature.properties.place + "<br>Magnitude: " + feature.properties.mag
            + "<br>Time: " + new Date(feature.properties.time)
        );
        cmarkers.push(onemarker);
    });

    return L.layerGroup(cmarkers);
}

let createMap = layerList => {
    let earthquakes = layerList.earthquakes;
    let faultlines = layerList.faultlines;
    let maxzoom = 18;
    
    let satellitemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: maxzoom,
        id: "mapbox.satellite",
        accessToken: API_KEY
    });

    let grayscalemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: maxzoom,
        id: "mapbox.light",
        accessToken: API_KEY
    });

    let outdoormap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: maxzoom,
        id: "mapbox.outdoors",
        accessToken: API_KEY
    });

    let baseMaps = {
        "Satellite": satellitemap,
        "Grayscale": grayscalemap,
        "Outdoors":outdoormap
    };

    let overlayMaps = {
        "Fault Lines": faultlines,
        Earthquakes: earthquakes
    };

    let myMap = L.map("map", {
        center: [40, -100],
        zoom: 5,
        layers: [satellitemap,faultlines, earthquakes]
    });

    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(myMap);

    let info = L.control({
        position: "bottomright"
    });

    info.onAdd = () => {
        let infodiv = L.DomUtil.create("div", "legend");
        let mags = [0, 1, 2, 3, 4, 5];

        mags.forEach(mag => {
            let magRange = `${mag}-${mag+1}`;
            if (mag >= 5) { magRange = `${mag}+`}
            let html = `<div class="legend-item">
                    <div style="height: 25px; width: 25px; background-color:${magToColor(mag)}"> </div>
                    <div class=legend-text>${magRange}</div>
                </div>`
            infodiv.innerHTML += html
        });
        return infodiv;
    };
    info.addTo(myMap);
}