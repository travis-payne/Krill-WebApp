$(function () {
    'use strict';

    /* 1. OPEN THE FILE EXPLORER WINDOW */
    $(".js-upload-photos").click(function () {

      $("#fileupload").click();
    });
  
    $("#fileupload").fileupload({
        formData:[
            {name:"trip" ,value: "hi"},
            { name: "csrfmiddlewaretoken", value: "{{ csrf_token }}"}
        ],
        dataType: 'json',

    });

    /* 2. INITIALIZE THE FILE UPLOAD COMPONENT */
    // $("#fileupload").fileupload({
    //   formData:[
    //       {name:"trip" ,value: "hi"},
    //       { name: "csrfmiddlewaretoken", value: "{{ csrf_token }}"}
    //     ],
    //   dataType: 'json',
    //   done: function (e, data) {  /* 3. PROCESS THE RESPONSE FROM THE SERVER */
    //     if (data.result.is_valid) {
    //         console.log("Worked");
    //       $("#gallery tbody").prepend(
    //         "<tr><td><a href='" + data.result.url + "'>" + data.result.name + "</a></td></tr>"
    //       )
    //     }
    //   }
    // });
  
  });