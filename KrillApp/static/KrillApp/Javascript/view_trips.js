
$(function () {
    $("ul[id*=trip_list] li").click(function () {
        $("#trip_list").find("li").each(function() { 
            $( this ).css("backgroundColor",'');
         });
        DJANGO_STATIC_URL = '{{MEDIA_URL}}';
        var trip_name = $(this).text(); // gets text contents of clicked li
        $( this ).css("backgroundColor","lightgray");


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

            }
        })

    });

});

$(function () {

    $("#trip_image_list").on('click','li', function () {
        DJANGO_STATIC_URL = $("ul[id*=trip_image_list]").attr("media-url");
        var image_url = $(this).text(); // gets text contents of clicked li
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
        $.confirm({
            title: 'Confirm Trip Deletion',
            content: 'Are you sure you want to delete the trip "' + $("#Trip_Name").text() + '" and it\'s images?',
            buttons: {
                confirm: function () {
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
                            $.alert({
                                title: 'Success!',
                                content: 'Trip Deleted!',
                                buttons:{
                                    ok: function () {
                                        location.reload();
                                    }
                                }
                            });
                            

                            
    
                        }
                    })
                },
                cancel: function () {
                    $.alert('Canceled!');
                },
            }
        });


    });

});



function export_trip_to_csv(){

    $.confirm({
        title: 'Enter valid email address to receive processed CSV file.',
        content: '' +
        '<form action="" class="formName">' +
        '<div class="form-group">' +
        '<label>Enter something here</label>' +
        '<input type="text" placeholder="Your email" class="name form-control" required />' +
        '</div>' +
        '</form>',
        buttons: {
            formSubmit: {
                text: 'Submit',
                btnClass: 'btn-blue',
                action: function () {
                    var email = this.$content.find('.name').val();
                    if(!validateEmail(email)){
                        $.alert('Invalid Email. Please try again!');
                        return false;
                    }
                    $.alert('Your file is being prepared and will be sent to:  ' + email);

                    var trip_to_export = document.getElementById("Trip_Name").innerHTML;
                    if(trip_to_export !=""){

                        var a = document.createElement('a');

                        $.ajax({
                            type: "POST",
                            url: "/export_to_csv/",
                            data: {
                                trip: trip_to_export,
                                'csrfmiddlewaretoken': csrftoken
                            },
                            success: function (result) {
                            }
                        })


    }



                }
            },
            cancel: function () {
                //close
            },
        },
        onContentReady: function () {
            // bind to events
            var jc = this;
            this.$content.find('form').on('submit', function (e) {
                // if the user submits the form by pressing enter in the field.
                e.preventDefault();
                jc.$$formSubmit.trigger('click'); // reference the button and click it
            });
        }
    });



  








    

}

function validateEmail(email) 
{
  var re = /^(?:[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&amp;'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
  return re.test(email);
}

