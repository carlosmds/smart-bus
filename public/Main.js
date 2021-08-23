//map options
var myLatLng = { lat: -26.301435924915967, lng: -48.84450989183392 };

var mapOptions = {
    center: myLatLng,
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};

//create map
var map = new google.maps.Map(document.getElementById('googleMap'), mapOptions);

//create a DirectionsService object to use the route method and get a result for our request
var directionsService = new google.maps.DirectionsService();

//create a DirectionsRenderer object which we will use to display the route
var directionsDisplay = new google.maps.DirectionsRenderer();

//bind the DirectionsRenderer to the map
directionsDisplay.setMap(map);

//input autocomplete
var options = {
    // types: ['(cities)']
    types: ['establishment']
}

var fromInput = document.getElementById("from");
var autocomplete1 = new google.maps.places.Autocomplete(fromInput, options);

var toInput = document.getElementById("to");
var autocomplete2 = new google.maps.places.Autocomplete(toInput, options);

//socket connection
var socket = io.connect(document.URL);

//define output element
const output = document.querySelector('#output');

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

        if (status == google.maps.DirectionsStatus.OK) {

            displayNewRouteAdded(route.data)
            registerRoute(route)
            
        } else {
            
            displayErrorAddingRoute()
        }
    });
}

function registerRoute(route) {
    
    console.log(route);
}

function displayNewRouteAdded(routeData) {
    //Get distance and time
    output.innerHTML = "<div class='alert-info'>From: " + document.getElementById("from").value + ".<br />To: " + document.getElementById("to").value + ".<br /> Driving distance <i class='fas fa-road'></i> : " + routeData.routes[0].legs[0].distance.text + ".<br />Duration <i class='fas fa-hourglass-start'></i> : " + routeData.routes[0].legs[0].duration.text + ".</div>";

    //display route
    directionsDisplay.setDirections(routeData);
}

function displayErrorAddingRoute() {
    //delete route from map
    // É possivel adicionar multiplas routes
    directionsDisplay.setDirections({ routes: [] });
    //center map in London
    map.setCenter(myLatLng);

    //show error message
    output.innerHTML = "<div class='alert-danger'><i class='fas fa-exclamation-triangle'></i> Could not retrieve driving distance.</div>";
}