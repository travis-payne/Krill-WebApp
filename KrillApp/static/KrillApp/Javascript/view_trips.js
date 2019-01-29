
$(function () {
    $("ul[id*=trip_list] li").click(function () {
        DJANGO_STATIC_URL = '{{MEDIA_URL}}';
        var trip_name = $(this).text(); // gets text contents of clicked li
        document.getElementById("Trip_Name").innerHTML = trip_name;
        var url = $("#trip_list").attr("ajax-url");
        $.ajax({
            type: "POST",
            url: url,
            data: {
                trip_to_get: trip_name,
                'csrfmiddlewaretoken': csrftoken
            },
            success: function (result) {
                // Clearing list
                document.getElementById("trip_image_list").innerHTML = "";

                // Retrieving the list from the django result.
                var list = document.getElementById("trip_image_list");

                // Converting list to array
                image_list = Array.from(result.trip_image_list);

                for (var i = 0; i < image_list.length; i++) {

                    // Create the list item and give it a class (bootstrap styling)
                    var item = document.createElement('li');
                    item.className = "list-group-item list-group-item-action";

                    // Set its contents:
                    item.appendChild(document.createTextNode(image_list[i]));
                    // Add it to the list:
                    list.appendChild(item);
                }

                document.getElementById("Trip_Name").scrollIntoView(true);
            }
        })

    });

});

$(function () {

    $("ul[id*=trip_image_list] li").live('click', function () {
        DJANGO_STATIC_URL = $("ul[id*=trip_image_list]").attr("media-url");
        var image_url = $(this).text(); // gets text contents of clicked li
        console.log(image_url);
        var url = $("ul[id*=trip_image_list]").attr("ajax-url"); // gets text contents of clicked li
        $.ajax({
            type: "POST",
            url: url,
            data: {
                image_url: DJANGO_STATIC_URL + image_url,
                stripped_url: image_url,
                'csrfmiddlewaretoken': csrftoken
            },
            success: function (result) {
                document.write(result);
                

  

            }
        })

    });

});


$(function () {
    $("#delete_trip").click(function () {
        if (confirm('Are you sure you want to delete the trip ' + $("#Trip_Name").text() + ' and it\'s images?')) {
            var trip_name = document.getElementById("Trip_Name").innerHTML;
                var url = $("#delete_trip").attr("ajax-url");
                $.ajax({
                    type: "POST",
                    url: url,
                    data: {
                        trip_to_delete: trip_name,
                        'csrfmiddlewaretoken': csrftoken
                    },
                    success: function (result) {
                        location.reload();
                        console.log("test");
                        

                    }
                })
            } else {
                    // Do nothing!
                }

    });

});



