//
//
//
//
//
var express = require('express');
var bodyParser = require('body-parser');
var axios = require('axios');

var app = express();
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    console.log(JSON.stringify(req.body, undefined, 2));

    var location = req.body.result.parameters.location.city;
    console.log(location);

    // url encode the location
    var encodedAddress = encodeURIComponent(location);
    var geocodeURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}`;

    // first do a reverse geolocation from the location given
    return axios.get(geocodeURL).then((response) => {
        if (response.data.status === 'ZERO_RESULTS') {
            throw new Error('Unable to find that address');
        }
        var lat = response.data.results[0].geometry.location.lat;
        var lng = response.data.results[0].geometry.location.lng;

        // then do a weather forecast search to forecast.io
        var weatherURL = `https://api.darksky.net/forecast/39b78cd34c557b7ac589472a5c6a9c6b/${lat},${lng}?units=si`;
        return axios.get(weatherURL);
    }).then((response) => {
        // if the chained Promise succeeds then set the temperature to the context object
        var temperature = response.data.currently.temperature;
        var apparentTemperature = response.data.currently.apparentTemperature;

        // Generate context and content in natural language
        res.send({
            "speech": `The weather in ${location} would be ${temperature} degrees.`,
            "displayText": `The weather in ${location} would be ${temperature} degrees.`,
            "source": "SimpleWeatherService"
        });
    }).catch((e) => {
        // Error check for both google reverse code and forecast.io
        if (e.code === 'ENOTFOUND') {
            console.log('Unable to connect to API server');
        } else {
            console.log(e.message);
        }
        res.status(404).send(e);
    });
});

app.listen(9000, () => {
    console.log(`Started on Port 3000.`);
});

module.exports = { app };