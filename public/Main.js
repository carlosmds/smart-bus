//map options
var myLatLng = { lat: -26.301435924915967, lng: -48.84450989183392 };

var mapOptions = {
    center: myLatLng,
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};

//create map
var map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);

//create a DirectionsService object to use the route method and get a result for our request
var directionsService = new google.maps.DirectionsService();

//input autocomplete
var options = {
    // types: ['(cities)']
    types: ['establishment']
}

var fromInput = document.getElementById("from");
var autocomplete1 = new google.maps.places.Autocomplete(fromInput, options);

var toInput = document.getElementById("to");
var autocomplete2 = new google.maps.places.Autocomplete(toInput, options);

infowindow = new google.maps.InfoWindow(); 

//define output element
const output = document.querySelector('#output');

//socket connection
var socket = io.connect(document.URL);

socket.on('refreshRoutes', function(refreshRoutesObject){
    refreshRoutes(parseObject(refreshRoutesObject));
});

var markersArray = []
var newMarkersArray = []
var directionsDisplayArray = []
var newDirectionsDisplayArray = []

function refreshRoutes(refreshRoutes) {

    markersArray = newMarkersArray
    directionsDisplayArray = newDirectionsDisplayArray

    newMarkersArray = []
    newDirectionsDisplayArray = []

    refreshRoutes.forEach(route => {

        if (route.status == "alive") {
            createMarker(route)
            createDirections(route)       
        }
    });    

    while (markersArray.length) { markersArray.pop().setMap(null); }
    while (directionsDisplayArray.length) { directionsDisplayArray.pop().setMap(null); }
}

function createMarker(route) {

    let svg = svgTemplate.replace('{{color}}', route.color)

    console.log(route);

    let newMarker = new google.maps.Marker({
        position: new google.maps.LatLng(route.current_location.lat, route.current_location.lng),
        icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new google.maps.Size(24, 24) },
        optimized: false,
        map: map,
    });

    newMarker.addListener("click", (marker) => {
        map.setZoom(18);
        map.setCenter(newMarker.getPosition());

        var contentString = `
            <div class="col-12">
                <br>
                <b>Origem</b>: `+ route.data.routes[0].legs[0].start_address +`.<br>
                <b>Destino</b>: `+ route.data.routes[0].legs[0].end_address +`.<br>
                <b>Distância</b> <i class='fas fa-road'></i>: `+ route.data.routes[0].legs[0].distance.text +`.<br>
                <b>Duração aproximada</b> <i class='fas fa-hourglass-start'></i> : `+ route.data.routes[0].legs[0].duration.text +`.
                <div style="margin-top: 15px;">
                    <div class="d-flex justify-content-center">
                        <button class="btn btn-light btn-lg " onclick="cancelRoute('`+route.id+`');">Cancelar Ônibus <i class="fas fa-times-circle"></i></button>
                    </div>
                </div>
            </div>
        `; 

        // Replace our Info Window's content and position 
        infowindow.setContent(contentString); 
        infowindow.setPosition(newMarker.getPosition()); 
        infowindow.open(map) 
    });

    newMarkersArray.push(newMarker);
}

function createDirections(route) {
    let newDirectionsDisplay = new google.maps.DirectionsRenderer({preserveViewport: true});
    newDirectionsDisplay.setMap(map);
    newDirectionsDisplay.setDirections(route.data);  

    newDirectionsDisplayArray.push(newDirectionsDisplay);
}

//define createBus function
function createBus() {

    var request = {
        origin: document.getElementById("from").value,
        destination: document.getElementById("to").value,
        travelMode: google.maps.TravelMode.DRIVING, //WALKING, BYCYCLING, TRANSIT
        unitSystem: google.maps.UnitSystem.METRIC
    }

    //pass the request to the route method
    directionsService.route(request, function (result, status) {

        if (status == google.maps.DirectionsStatus.OK) {
            
            var route = {
                data: result,
                current_location: result.routes[0].legs[0].start_location,
                current_step: 0,
                status: "alive",
                color: randomColor({
                    luminosity: 'bright',
                    hue: 'random'
                })
            };

            displayNewRouteAdded(route.data)
            registerRoute(route)
        } else {
            displayErrorAddingRoute()
        }
    });
}

function cancelRoute(route_id) {
    socket.emit('cancelRoute', route_id)
}

function registerRoute(route) {
    socket.emit('addRoute', route)
}

function displayNewRouteAdded(routeData) {
    output.innerHTML = `
        <div class='alert alert-info alert-dismissible fade show' role='alert'>
            <div class="col-12">
                <h2>Ônibus Adicionado!</h2>
                <b>Origem</b>: `+ document.getElementById("from").value +`.<br>
                <b>Destino</b>: `+ document.getElementById("to").value +`.<br>
                <b>Distância</b> <i class='fas fa-road'></i>: `+ routeData.routes[0].legs[0].distance.text +`.<br>
                <b>Duração aproximada</b> <i class='fas fa-hourglass-start'></i> : `+ routeData.routes[0].legs[0].duration.text +`.
            
            </div>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;
}

function displayDirectionsAndLocation(routeData) {
    directionsDisplay.setDirections(routeData);
}

function displayErrorAddingRoute() {

    //center map in London
    map.setCenter(myLatLng);

    //show error message
    output.innerHTML = `
        <div class='alert alert-warning alert-dismissible fade show' role='alert'>
            <i class='fas fa-exclamation-triangle'></i>
            Não foi possível adicionar a rota de ônibus. Confira os dados e tente novamente
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;
}

function parseObject(object){
    return (typeof object === 'string') ? JSON.parse(object) : object;
}

var svgTemplate = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   version="1.1"
   x="0px"
   y="0px"
   viewBox="0 0 100 113.22874999999999"
   enable-background="new 0 0 100 90.583"
   xml:space="preserve"
   id="svg2"
   inkscape:version="0.91 r13725"
   sodipodi:docname="Q953806_noun_2246_ccMarcSerre_bus-stop.svg"><metadata
     id="metadata16"><rdf:RDF><cc:Work
         rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type
           rdf:resource="http://purl.org/dc/dcmitype/StillImage" /><dc:title></dc:title></cc:Work></rdf:RDF></metadata><defs
     id="defs14" /><sodipodi:namedview
     pagecolor="#ffffff"
     bordercolor="#666666"
     borderopacity="1"
     objecttolerance="10"
     gridtolerance="10"
     guidetolerance="10"
     inkscape:pageopacity="0"
     inkscape:pageshadow="2"
     inkscape:window-width="1680"
     inkscape:window-height="988"
     id="namedview12"
     showgrid="false"
     inkscape:zoom="4.1685525"
     inkscape:cx="54.79056"
     inkscape:cy="39.659556"
     inkscape:window-x="-8"
     inkscape:window-y="-8"
     inkscape:window-maximized="1"
     inkscape:current-layer="svg2" /><path
     d="m 11.843782,18.2 -2.3839992,0 c -4.938,0 -8.97999996,4.043 -8.97999996,8.95 l 0,2.398 c 0,4.807 3.83699996,8.733 8.59499996,8.942 l 0,46.687 -1.266,0 c -2.722,0 -4.936,2.212 -4.936,4.938 l 15.2769992,0 c 0,-2.727 -2.223,-4.938 -4.954,-4.938 l -0.971,0 0,-46.686 c 4.761,-0.205 8.571,-4.135 8.571,-8.943 l 0,-2.398 c -10e-4,-4.907 -4.013,-8.95 -8.952,-8.95 z"
     id="path4"
     inkscape:connector-curvature="0" /><path
     d="m 90.192,17.145 -16.133,0 C 74.059,13.194 70.866,10 66.907,10 l -7.787,0 c -3.953,0 -7.151,3.194 -7.151,7.145 l -15.903,0 c -5.432,0 -10.057,4.428 -10.057,9.852 l 0,56.947 c 0,3.658 2.815,6.625 6.448,6.625 l 1.765,0 0,3.402 c 0,3.657 2.94,6.612 6.626,6.612 3.636,0 6.599,-2.952 6.599,-6.612 l 0,-3.402 30.899,0 0,3.402 c 0,3.657 2.955,6.612 6.612,6.612 3.658,0 6.628,-2.952 6.628,-6.612 l 0,-3.402 1.765,0 c 3.637,0 6.649,-2.967 6.649,-6.625 l 0,-56.947 c 0.003,-5.424 -4.382,-9.852 -9.808,-9.852 z m -59.293,9.858 c 0,-2.839 2.316,-5.153 5.178,-5.153 l 54.11,0 c 2.836,0 5.151,2.312 5.151,5.153 l 0,0.732 c 0,2.778 -2.367,5.125 -5.151,5.125 l -54.11,0 c -2.86,0 -5.178,-2.294 -5.178,-5.125 l 0,-0.732 z m 5.295,55.79 c -3.249,0 -5.888,-2.623 -5.888,-5.888 0,-3.247 2.64,-5.886 5.888,-5.886 3.248,0 5.9,2.639 5.9,5.886 0,3.265 -2.652,5.888 -5.9,5.888 z M 36.077,61.067 c -2.86,0 -5.178,-2.295 -5.178,-5.129 l 0,-14.268 c 0,-2.824 2.316,-5.137 5.178,-5.137 l 54.11,0 c 2.836,0 5.151,2.313 5.151,5.137 l 0,14.268 c 0,2.776 -2.367,5.129 -5.151,5.129 l -54.11,0 z m 53.744,21.726 c -3.269,0 -5.91,-2.623 -5.91,-5.888 0,-3.247 2.642,-5.886 5.91,-5.886 3.247,0 5.891,2.639 5.891,5.886 0,3.265 -2.644,5.888 -5.891,5.888 z"
     id="path6"
     style="fill:{{color}}"
     inkscape:connector-curvature="0" /></svg>
`;