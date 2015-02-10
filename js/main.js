// NAMESPACE SECURITY
var bus_stops = bus_stops || {};

bus_stops = (function(){

              // PRIVATE VARIABLES
              var bus_stops_instance; 
              var init_map_options = {zoom: 18,center: new google.maps.LatLng(51.5174268,-0.11207)}
              var url_service = "http://digitaslbi-id-test.herokuapp.com/bus-stops";
              var icon_map = "img/3697006_28.png";  
              var markers = [];     
                
              var create_bus_stops = function(){
                    
                    //INIT APP     
                    public_initApp = function(){
                        create_map();
                    }

                    //CREATE INSTACE OF THE MAP STARTING JSON DATA
                    create_map_data = function(map_options){
                        var map_options = map_options ===undefined ? init_map_options : map_options;

                        var map = new google.maps.Map(document.getElementById('map-canvas'), map_options); 
                        

                        var is_active =  false;
                        google.maps.event.addListener(map, 'bounds_changed', function() {

                            if(!is_active){
                                is_active = true;
                                var timer_get_map_coor = setTimeout(function(){
                                    var get_north_east = map.getBounds().getNorthEast();
                                    var get_south_west = map.getBounds().getSouthWest();
                                    var lat_coord = {
                                        'north-east' : {
                                            coord: [get_north_east.lat(), get_north_east.lng()]
                                            
                                        },
                                        'south-west' : {
                                            coord : [get_south_west.lat(), get_south_west.lng()]
                                            
                                        }
                                    }
                                    data_maps(map, lat_coord);
                                    is_active = false;
                                }, 100);    

                            }  
                        });


                    }

                    // GET JSON DATA LOCATION FROM THE SERVICE
                    data_maps = function(map, lat_coord){

                        var jqxhr = $.ajax({url: url_service+"?callback=?&northEast="+lat_coord['north-east'].coord+"&southWest="+lat_coord['south-west'].coord+"", crossDomain: true, dataType: 'jsonp', contentType: 'application/json; charset=utf-8'})

                                .done(function(data) {
                                    insert_markers(map, data.markers);
                                })
                                .fail(function(error) {
                                    console.log(error);
                                    return null;
                                });
                    }

                    //GET JSON DATA ROUTES FROM THE SERVICE
                    data_routes = function(marker, map){
                        jqxhr_routes = $.ajax({url: url_service+"/"+marker.busid+"?callback=insert_tooltip", crossDomain: true, dataType: 'jsonp'});
                        jqxhr_routes.complete(function() {
                            insert_tooltip(marker, map);
                        }); 
                    }

                    // INSERT MARKERS IN THE MAP
                    insert_markers = function(map,markers_data){

                        for(var i=0; i<markers_data.length; i++){

                            var my_lat_lng = new google.maps.LatLng(markers_data[i].lat, markers_data[i].lng);
                            var exist_marker = false, markerId=0;
                            for(var j=0; j < markers.length; j++){
                                if(markers[j].marker.getPosition().equals(my_lat_lng)){
                                    exist_marker = true;
                                    return;
                                }
                            }
                            if(!exist_marker){
                                 
                                var marker = new google.maps.Marker({
                                    position : my_lat_lng,
                                    title : markers_data[i].name,
                                    icon : icon_map 
                                });
                                marker.setMap(map);
                                markerId = markers.length;


                                (function(marker, markerId) {

                                    // EVENT CLICK MARKER
                                        google.maps.event.addListener(marker, 'click', function() {
                                        data_routes(markers[markerId], map);
                                    });
                                })(marker, markerId);                                     
                               
                                var storeMarker = {'marker':marker, 'busid': markers_data[i].id, 'name': markers_data[i].name};
                                markers.push(storeMarker);    
                            }
                            
                        }
                    }

                    //INSERT HTML TO BUILD THE TOOLTIP
                    insert_tooltip = function(marker, map){

                        $.when( jqxhr_routes ).then(function( data, textStatus, jqXHR) {

                            var contentString='';

                            // THE BEST OPTION TO HANDLE THE HTML IS TO MAKE A TEMPLATE. 
                            //WE CAN SIMULATED A KIND OF TEMPLATE SYSTEM, SOMETHING LIKE THIS: htmlTemplate = htmlTemplate.replace("{{NAME}}", marker.name);
                            //WHERE htmTemplate IS THE HTML GOT FROM A CALL OF A TEMPLATE FILE, AND marker.name is the NAME IN JSON data.

                            if(textStatus==='success' && data.arrivals.length!==undefined){
                                contentString += '<div id="content">'+
                                          '<div id="siteNotice">'+
                                          '</div>'+
                                          '<h1 id="firstHeading" class="firstHeading">'+marker.name+'</h1>'+
                                          '<div id="bodyContent">'+
                                            '<ul class="container-routes">';
                                for(var i=0; i < data.arrivals.length; i++){

                                    contentString +=  '<li>'+
                                                        '<span class="icon-bus"></span><div class="route-name">'+data.arrivals[i].destination+'</div>'+
                                                        '<span class="scheduled-time">Remaining time:'+data.arrivals[i].estimatedWait+'</span>'
                                                      '</li>';   
                                }
                                contentString += '</ul></div></div>';
                                            

                            }
                            
                            //IF THE SERVICE IS NOT AVAILABLE
                            else{
                                contentString = '<div id="content">'+
                                          '<div id="siteNotice">'+
                                          '</div>'+
                                          '<h1 id="firstHeading" class="firstHeading">'+marker.name+'</h1>'+
                                          '<div id="bodyContent">'+
                                            '<ul class="container-routes">'+
                                                '<li>Information not available</li>'+
                                            '</ul>'+
                                          '</div>'+
                                          '</div>';
                            }

                                         
                            var infowindow = new google.maps.InfoWindow({
                                content: contentString
                            });

                            infowindow.open(map, marker.marker);
                        });
                                      
                    }

                    //INITIALIZE MAP FROM GOOGLE
                    create_map = function(){
                        google.maps.event.addDomListener(window, 'load', create_map_data());
                    }

                         // RETURN PUBLIC METHOD
                         return {
                                initApp : public_initApp
                         };
              };

              // RETURN INSTANCE OF THE OBJECT
              return {
                    getInstance: function(){
                          if(!bus_stops_instance){
                              bus_stops_instance = create_bus_stops();
                          }
                          return bus_stops_instance;
                    }
              };
})();


$(document).ready(function(){
    
    //INIT APP
    var new_app = bus_stops.getInstance();
    new_app.initApp(); 

});