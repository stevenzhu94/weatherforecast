// Initialize and add the map
let map;
async function initMap() {
  // The location of Uluru
  const position = { lat: 0, lng: 0 };
  // Request needed libraries.
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  await google.maps.importLibrary("places");

  // The map
  let map = new Map(document.getElementById("map"), {
    zoom: 3,
    center: position,
    mapId: "DEMO_MAP_ID",
  });

  // Create the search box and link it to the UI element.
  const input = document.getElementById("location-input");
  const searchBox = new google.maps.places.SearchBox(input);

  // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  // Bias the SearchBox results towards current map's viewport.
  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
  });

  let markers = [];
  let weatherData = {};

  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener("places_changed", () => {
    searchLocation(map, searchBox, markers);
  });
}

initMap();

// Draws the weather data on the map.
function searchLocation(map, searchBox, markers) {
  const places = searchBox.getPlaces();

  if (places.length == 0) {
    return;
  }

  // Clear out the old markers.
  markers.forEach((marker) => {
    marker.setMap(null);
  });
  markers = [];

  // For each place, get the icon, name and location.
  const bounds = new google.maps.LatLngBounds();

  let lat = null;
  let lon = null;

  places.forEach((place) => {
    if (!place.geometry || !place.geometry.location) {
      console.log("Returned place contains no geometry");
      return;
    }

    const icon = {
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(25, 25),
    };

    // Create a marker for each place.
    markers.push(
      new google.maps.Marker({
        map,
        icon,
        title: place.name,
        position: place.geometry.location,
      })
    );
    if (place.geometry.viewport) {
      // Only geocodes have viewport.
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }

    lat = place.geometry.location.lat();
    lon = place.geometry.location.lng();
  });

  map.fitBounds(bounds);
  map.panBy(0,300);


  console.log(lat, lon);
  
  getWeatherData(lat, lon).then((data) => drawWeatherData(data));
}

// Returns a string representation of the wind direction.
async function getWeatherData(lat, lon) {
  let endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(endpoint);
    const myJson = await response.json(); //extract JSON from the http response
    // do something with myJson

    return myJson;
}

// Draws the weather data on the map.
// @param {Object}
function drawWeatherData(weatherData) {
  let sunrise = stringFromUTC(weatherData.sys.sunrise);
  let sunset = stringFromUTC(weatherData.sys.sunset);
  let windDirection = getDirectionFromHeading(weatherData.wind.deg);

  let element = document.getElementById("weather-data");
  element.style.zIndex = 100;
  element.innerHTML = `Temperature: ${weatherData.main.temp}°F<br>
                        Feels like: ${weatherData.main.feels_like}°F<br>
                        Min: ${weatherData.main.temp_min}°F<br>
                        Max: ${weatherData.main.temp_max}°F<br>
                        Pressure: ${weatherData.main.pressure} hPa<br>
                        Humidity: ${weatherData.main.humidity}%<br>
                        Wind speed: ${weatherData.wind.speed} MPH<br>
                        Wind direction: ${windDirection}<br>
                        Cloudiness: ${weatherData.clouds.all}%<br>
                        Visibility: ${weatherData.visibility}<br>
                        Sunrise: ${sunrise}<br>
                        Sunset: ${sunset}<br>`;

}

// Converts UTC time to a Time string.
function stringFromUTC(time) {
  let date = new Date(time * 1000);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

// Converts a heading to a direction string.
function getDirectionFromHeading(heading) {
  let directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  let index = Math.floor(heading / 45);
  return directions[index];
}

