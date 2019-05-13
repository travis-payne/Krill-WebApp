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

function save_annotations_to_DB(){
    var csvline = [];
    var csvArray= [];

    for ( var image_id in _via_img_metadata ) {
        var r = _via_img_metadata[image_id].regions;
        if ( r.length !==0 ) {
          for ( var i = 0; i < r.length; ++i ) {
  
            // Shape attributes are HERE.
            var sattr = map_to_json( r[i].shape_attributes );
            csvline.push(sattr);
  
          }
        }
      }
      if(csvline.length != 0){
          csvArray = csvline;
      csvline = JSON.stringify(csvline);
      }
      else{
          csvline = "";
      }
      var url = $("#save_annotations").attr("ajax-url"); // gets text contents of clicked li
      var image = document.getElementById("current_image").innerHTML;
      image = image.replace($("#delete_photo").attr("media-url"),"");
      // Removes whitespace
      image = image.trim();
      console.log(image);
      $.ajax({
        type: "POST",
        url: url,
        data: {
            image_name: image,
            image_annotations: csvline,
            'csrfmiddlewaretoken': document.getElementById('trip_list').getAttribute("data-token")
        },
        success: function (result) {
            
           
        }
    })

    // Defunct??
    var url = $("#save_annotations").attr("ajax-url-2"); // gets text contents of clicked li

    for(var i = 0; i < csvArray.length; i++){

        $.ajax({
            type: "POST",
            url: url,
            data: {
                image_file: image,
                image_annotations: JSON.stringify(csvArray[i]),
                'csrfmiddlewaretoken': document.getElementById('trip_list').getAttribute("data-token")
            },
            success: function (result) {
                
               
            }
        })

    }
   




}

function toggleClicked(){

    var image_file = document.getElementById("current_image").innerHTML;
    image_file = image_file.trim();
    var url = $("#toggle_annotations").attr("ajax-url");

    $.ajax({type: "POST",
    url: url,
    data: {image_file: image_file,
            'csrfmiddlewaretoken': document.getElementById('trip_list').getAttribute("data-token")},
    success:function(result){


        var annotations = result['annotations'];        
        if(annotations!=""){
        var m = json_str_to_map( annotations );
        // Maps key (height, width, name) to value
        for ( var i = 0; i < m.length; i++ ) {
            var region_i = new file_region();
            var line = JSON.parse(m[i]);
            region_i.shape_attributes = line;
            for ( var image_id in _via_img_metadata ) {
            _via_img_metadata[image_id].regions.push(region_i);
            }

        }
        // Display annotations on image
        update_attributes_update_panel();
        annotation_editor_update_content();
        _via_load_canvas_regions(); // image to canvas space transform
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
        
        

    }
}

})

}

function user_click_image(path){
    _via_img_metadata={};
    var img_id    = project_file_add_url(path);
    var img_index = _via_image_id_list.indexOf(img_id);
    _via_show_img(img_index);
}

function delete_photo(){
    
    var image_to_delete = $("#image_panel img").attr("src");
    if (image_to_delete != null){
        var url = $("#delete_photo").attr("ajax-url");
    // Removes the django media URL from the URL.
    var media_url = image_to_delete.replace($("#delete_photo").attr("media-url"),"");
    // Removes whitespace
    media_url = media_url.trim();
    // Removes image from panel
    $("#image_panel img").remove();
    $("#current_image").empty();
    _via_update_ui_components();


 

    $.ajax({type: "POST",
    url: url,
    data: {image_url: media_url,
            'csrfmiddlewaretoken': document.getElementById('trip_list').getAttribute("data-token")},
    success:function(result){
        trip_change();
        //user_click_image(($("#delete_photo").attr("media-url"),"") + $("#gallery tbody").parent().siblings(":first").text());

    }})
        
    }
    

}


