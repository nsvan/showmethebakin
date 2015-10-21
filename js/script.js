//----- GLOBAL var
//----------------------//

var map;
var infoWindow;
var geocoder;
var startMarker = []; //marker arrays
var markers = []; 
var openMarkers = [];
var greenDot = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
var orangeDot = 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'
var blueDot = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
var redDot = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'

//----- INTIALIZE
//----------------------//

function initialize() { // Load map
  
  geocoder = new google.maps.Geocoder();
  var start = new google.maps.LatLng(43.648358, -79.397966);

  map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: start,
    zoom: 13
  });
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push( // Legend positioning
  document.getElementById('legend'));
}


//----- GLOBAL functions
//----------------------//

function clearClosedBakery() {
  setClosedBakery(null);
}

function clearBakery() {
  setClosedBakery(null);
  setOpenBakery(null);
}

function clearMarkers() { // Turn off markers on map
  setClosedBakery(null);
  setStart(null);
  setOpenBakery(null);
}

function deleteMarkers() { // Turn off markers and then delete from array
  clearMarkers();
  markers = [];
  start = [];
  openMarkers = [];
}


//----- MARK map
//----------------------//

function setStart(map) { // place markers on map
  for (var i = 0; i < startMarker.length; i++) {
    startMarker[i].setMap(map);
  }
}

function setClosedBakery(map) { // place markers on map
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

function setOpenBakery(map) { // place markers on map
  for (var i = 0; i < openMarkers.length; i++) {
    openMarkers[i].setMap(map);
  }
}


function findBakery() { // find bakeries in radius of mapCenter of viewport

  var request = { 
    location: map.center,
    rankBy: google.maps.places.RankBy.DISTANCE,
    types: ['bakery']
  };

  infoWindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);

  google.maps.event.addListenerOnce(map, 'dragend', function(){ // load more results in new viewport drag position; show hidden markers of closed bakeries
    // clearBakery();
    findBakery();
    showClosed();
  }); 
  google.maps.event.addListener(map, 'zoom_changed', function(){ // load more results in new viewport zoom position; show hidden markers of closed bakeries
    // clearBakery();
    findBakery();
    showClosed();
  }); 
  service.nearbySearch(request, callBack);
}

function callBack(results, status) { // callback results for findBakery
  
  if (status == google.maps.places.PlacesServiceStatus.OK) {
     for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);
    }
  }
}
 
function createMarker(place) { // create markers for findBakery
  
  var placeLoc = place.geometry.location;
  
  try {  // testing for undefineds values in property
      if (place.opening_hours.open_now === true) {
        var marker = new google.maps.Marker({
          map: map,
          position: placeLoc,
          animation: google.maps.Animation.DROP,
          icon: greenDot
        });
        openMarkers.push(marker);
      }
      else if (place.opening_hours.open_now === false) {
        var marker = new google.maps.Marker({
          map: map,
          position: placeLoc,
          icon: redDot
        });
        markers.push(marker);
      };
  }
  catch(e){ // produce marker for undefined values
    var marker = new google.maps.Marker({
      map: map,
      position: placeLoc,
      icon: orangeDot
    });
    markers.push(marker);
  };


  var request = { placeId: place.place_id}; // provide getDetails with Place ID
  var service = new google.maps.places.PlacesService(map);
  service.getDetails(request, callBack)

  google.maps.event.addListener(marker, 'click', function() { // pop-up infoWindow on-click on Marker
    service.getDetails(place, function(result, status) {
      if (status != google.maps.places.PlacesServiceStatus.OK) {
        alert(status);
        return;
      }
      var d = new Date(); // obtain local current day
      var day = d.getDay();

      try { // catch and handle undefined
        opentime = result.opening_hours.periods[day].open.time;
        closetime = result.opening_hours.periods[day].close.time;
      }
      catch(e){
        opentime = ''
        closetime = ''
      }
      
      infoWindow.setContent( //content of infoWindow
        '<strong class="bakery-name">' + result.name + '</strong><br><br>' 
        + result.formatted_address + '<br>'
        + result.formatted_phone_number + '<br><br>'
        + '<strong>Today\'s hours: </strong>' + opentime + ' - ' + closetime
      );
      infoWindow.open(map, marker);
    });
  });
}


//----- START location search
//-----------------------------//

function codeAddress() { // find address with keyword search, add marker and center map, run findBakery

  var address = document.getElementById('address').value;
  geocoder.geocode( { 'address' : address}, function(results, status) {

    if (status == google.maps.GeocoderStatus.OK) {
      var pos = results[0].geometry.location

      map.setCenter(pos);
      map.setZoom(17);

      var marker = new google.maps.Marker({
          map: map,
          icon: blueDot,
          position: pos
      });
      startMarker.push(marker);
      setTimeout(findBakery,50); // delay searching for bakeries until after start location is found and screen is centred

      infoWindow = new google.maps.InfoWindow();
      infoWindow.setContent( // content of infoWindow
        '<strong class="wifi-name"> YOU ARE HERE </strong><br><br>'
      );
      infoWindow.open(map, marker);

    } else {
      alert('Unable find location because: ' + status);
    }
  });
}

function codeCurrentPosition() { // add marker on the centre of current viewport position, load bakeries

  var marker = new google.maps.Marker({
      map: map,
      icon: blueDot,
      position: map.center
  });
  startMarker.push(marker);
  setTimeout(findBakery,50);

  map.setZoom(17);

  infoWindow = new google.maps.InfoWindow();
  infoWindow.setContent( // content of infoWindow
    '<strong class="wifi-name"> CENTRE OF MAP </strong><br><br>'
  );
  infoWindow.open(map, marker);

}

function geoLocation() {
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      var marker = new google.maps.Marker({
          map: map,
          icon: blueDot,
          position: pos
      });
      startMarker.push(marker);
      setTimeout(findBakery,50);

      map.setCenter(pos);
      map.setZoom(17);

      infoWindow.setPosition(pos);
      infoWindow.setContent('Your Location found.');

    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }

  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
}

}

//----- BUTTON clicks
//----------------------//

function searchArea() { // clear previous markers and run address search and bakery search on click of Search button
  deleteMarkers();
  codeAddress();
}

function clearForm() { // clear form values and map markers
  deleteMarkers();
  document.getElementById("find-a-bakery").reset();
}

function searchCurrentPosition() {
  clearForm();
  codeCurrentPosition();
}

function findGeoLocation() {
  clearForm();
  geoLocation();
}

$(function(){
    $('#toggleClosed').click(function() { // change the value and function of the #toggleClosed button
       $(this).val() == "Hide Closed Shops" ? hideClosed() : showClosed();
    });
});

function hideClosed() {
    $('#toggleClosed').val("Show Closed Shops");
    clearClosedBakery();
}

function showClosed() {
    $('#toggleClosed').val("Hide Closed Shops");
    setClosedBakery(map);
}

$('#address').keypress(function (e) { // pressing Enter on Address textbox triggers click on search button
  if (e.which == 13) {
    $('#searchByKeyword').click();
    return false;
  }
});

//----- SMOOTH scroll
//----------------------//

$(function() {
  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
});



//----- LOAD script
//----------------------//
google.maps.event.addDomListener(window, 'load', initialize);




