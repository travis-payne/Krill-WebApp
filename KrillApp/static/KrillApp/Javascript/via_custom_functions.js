"use strict";

function trip_change() {
    $("#gallery tbody").empty();
    var url = $("#trip_list").attr("ajax-url"); // gets text contents of clicked li
    $.ajax({
        type: "POST",
        url: url,
        data: {
            trip_to_get: $('#trip_list').val(),
            'csrfmiddlewaretoken': document.getElementById('trip_list').getAttribute("data-token")
        },
        success: function (result) {
            var image_list = result['trip_image_list'];
            for(var i = 0; i < image_list.length; i++){
                
                $("#gallery tbody").prepend(
                    "<tr><td>"+ image_list[i]+" </td></tr>"
                  )
            }
           
        }
    })


};

function user_click_image(path){


    _via_img_metadata={};
    var img_id    = project_file_add_url(path);
    var img_index = _via_image_id_list.indexOf(img_id);
    _via_show_img(img_index);
}

function delete_photo(){
    var image_to_delete = $("#image_panel img:visible").attr("src");

    var url = $("#delete_photo").attr("ajax-url");
 

    $.ajax({type: "POST",
    url: url,
    data: {image_url: image_to_delete,
            'csrfmiddlewaretoken': document.getElementById('trip_list').getAttribute("data-token")},
    success:function(result){
        location.reload();
    }})

}


