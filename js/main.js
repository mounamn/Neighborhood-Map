// The code will display a map with some interested places. Also, the user can filter the places throught an input text area
// This file has three parts, the model where I stored the data, and the view model, which represents the data and operates on a UI
// six interested places' information
var places = [{
    latitude: 44.832942,
    longtitude: -93.173802,
    placeTitle: 'Eagan, MN',
    contentString: '(Home) <br> 3410 Surrey Heights Dr.' + '<br>' + 'Eagan, MN, 55122'
}, {
    latitude: 44.854322,
    longtitude: -93.242650,
    placeTitle: 'Mall of America',
    contentString: '60 E Broadway' + '<br>' + ' Bloomington, MN 55425'
}, {
    latitude: 44.815103,
    longtitude: -93.215653,
    placeTitle: 'Twin Cities Premium Outlets',
    contentString: '3965 Eagan Outlets Pkwy' + '<br>' + 'Eagan, MN, 55122'
}, {
    latitude: 44.786071,
    longtitude: -93.127323,
    placeTitle: 'Lebanon Hills Regional Park',
    contentString: 'Lebanon Hills Regional Park' + '<br>' + 'Eagan, MN, 55123'
}, {
    latitude: 44.767434,
    longtitude: -93.195771,
    placeTitle: 'Minnesota Zoo',
    contentString: '13000 Zoo Blvd' + '<br>' + 'Apple Valley, MN 55124'
}, {
    latitude: 44.817037,
    longtitude: -93.163966,
    placeTitle: 'Cascade Bay',
    contentString: '1360 Civic Center Dr' + '<br>' + 'Eagan, MN 55122'
}, ];

var markers = []; // Array to store markers

function initialize() {

    var mapCanvas = document.getElementById('map'); //Get the div id where the map will be displayed
    var latLong = new google.maps.LatLng(44.813917, -93.180456); //A geographic point with the coordinates latitude and longitude
    var prev_infowindow = false; // Previous open infowindow
    var infowindow;
    var articleStr;

    var mapOptions = {
        center: latLong, // The initial Map center
        zoom: 13, // The zoom level which will be displayed on the map
        mapTypeId: google.maps.MapTypeId.ROADMAP // Display the default road map view
    };

    var map = new google.maps.Map(mapCanvas, mapOptions); // Create a new map

    function point(data) {
        var self = this; // Store this in a variable
        self.latitude = ko.observable(data.latitude); // Initialize with a value
        self.longtitude = ko.observable(data.longtitude);
        self.placeTitle = ko.observable(data.placeTitle);
        self.contentString = ko.observable(data.contentString);
        self.wikiElem = ko.observableArray([]);

        // Wikipedia AJAX request
        var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.placeTitle() + '&format=json&callback=wikiCallback';

        var wikiRequestTimeout = setTimeout(function() {
            self.wikiElem("failed to get wikipedia resources");
        }, 5000);

        $.ajax({

            url: wikiUrl,
            dataType: "jsonp",
            jsonp: "callback",
            success: function(response) {
                var articleList = response[1];

                if (articleList.length === 0)
                    self.wikiElem.push("The page does not exist");
                else {
                    for (var i = 0, len = articleList.length; i < len; i++) {
                        articleStr = articleList[i];
                        var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                        self.wikiElem.push('<a href="' + url + '">' + articleStr + '</a><br><br>');
                    }
                }

                clearTimeout(wikiRequestTimeout);
            }
        });

        // Make the information of a place depends to the place title
        this.info = ko.computed(function() {
            return "<b>" + self.placeTitle() + "</b><br>" + self.contentString() + "</b><br><br><u><i> Wikipedia resource:<i></u><br><br>" + this.wikiElem();
        }, this);

        // Create a marker with the options specified
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(self.latitude(), self.longtitude()), // Specify a LatLng identifying the initial location of the marker
            title: self.placeTitle(),
            map: map, // Specifie the Map on which to place the marker
            draggable: true, // Allow users to drag a marker to a different location on the map
            animation: google.maps.Animation.DROP, // The marker drops from the top of the map to its final location when first placed on the map
        });

        marker.addListener('click', function() {

            // Toggle the animation between a BOUNCE animation and no animation
            if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
            } else {
                marker.setAnimation(google.maps.Animation.BOUNCE); // The marker bounces in place
            }

            // Close the opened infowindow
            if (prev_infowindow) {
                infowindow.close();
            }

            // Create new infowindow
            infowindow = new google.maps.InfoWindow({
                content: self.info(),

            });

            infowindow.open(map, marker); // Open infowindow
            prev_infowindow = true; // Indicate that a windowinfo is open
            marker.setAnimation(null); // Stop the bouncing marker
        });

        markers.push(marker); // Stock all the markers in the array

    }

    var ViewModel = function() {

        var self = this; // Store this in a variable
        self.filter = ko.observable(""); // Initialize with no value
        self.placeList = ko.observableArray([]); // Initial an empty array
        self.currentItem = ko.observableArray([]); // Initial an empty array

        // Add values of the interested places
        places.forEach(function(p) {
            self.placeList.push(new point(p));
        });

        // open infowindow while clicking an item on the list
        this.setItem = function(clickedItem) {
            self.currentItem(clickedItem);
            google.maps.event.trigger(markers[self.placeList.indexOf(self.currentItem())], 'click'); // Trigger the onclick event of a marker on a Google Maps from the list
			list.classList.remove('open');
        };


        // Filter on the list
        this.listFiltered = ko.dependentObservable(function() {
            var filter = self.filter().toLowerCase();

            if (!filter) {
                for (var i = 0, len = markers.length; i < len; i++)
                    markers[i].setVisible(true);
                return self.placeList();
            } else {
                return ko.utils.arrayFilter(self.placeList(), function(item) {
                    var s = ko.utils.stringStartsWith(item.placeTitle().toLowerCase(), filter);
                    if (!s) {
                        self.currentItem(item);
                        markers[self.placeList.indexOf(item)].setVisible(false);
                        infowindow.close();
                    }
                    return s;
                });
            }
        }, this);
    };
    // Activate Knockout
    ko.applyBindings(new ViewModel());
}

ko.utils.stringStartsWith = function(string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length)
        return false;
    return string.substring(0, startsWith.length) === startsWith;
};