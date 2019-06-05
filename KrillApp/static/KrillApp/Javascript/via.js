/*
  VGG Image Annotator (via)
  www.robots.ox.ac.uk/~vgg/software/via/

  Copyright (c) 2016-2018, Abhishek Dutta, Visual Geometry Group, Oxford University.
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
  Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.
  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.
*/

/*
  See Contributors.md file for a list of developers who have contributed code
  to VIA codebase.
  /*

  This source code (version 1.0.x) is organized in the following groups:

  - Data structure for annotations
  - Initialization routine
  - Handlers for top navigation bar
  - Local file uploaders
  - Data Importer
  - Data Exporter
  - Maintainers of user interface
  - Image click handlers
  - Canvas update routines
  - Region collision routines
  - Shortcut key handlers
  - Persistence of annotation data in browser cache (i.e. localStorage)
  - Handlers for attributes input panel (spreadsheet like user input panel)

  See [Source code documentation](https://gitlab.com/vgg/via/blob/develop/CodeDoc.md)
  and [Contributing Guidelines](https://gitlab.com/vgg/via/blob/develop/CONTRIBUTING.md)
  for more details.

*/

"use strict";

var VIA_VERSION      = '2.0.6';
var VIA_NAME         = 'VGG Image Annotator';
var VIA_SHORT_NAME   = 'VIA';
var VIA_REGION_SHAPE = { RECT:'rect',
                         CIRCLE:'circle',
                         ELLIPSE:'ellipse',
                         POLYGON:'polygon',
                         POINT:'point',
                         POLYLINE:'polyline'
                       };

var VIA_ATTRIBUTE_TYPE = { TEXT:'text',
                           CHECKBOX:'checkbox',
                           RADIO:'radio',
                           IMAGE:'image',
                           DROPDOWN:'dropdown'
                         };

var VIA_DISPLAY_AREA_CONTENT_NAME = {IMAGE:'image_panel',
                                     IMAGE_GRID:'image_grid_panel',
                                     SETTINGS:'settings_panel',
                                     PAGE_404:'page_404',
                                     PAGE_USER_GUIDE:'page_user_guide',
                                     PAGE_GETTING_STARTED:'page_getting_started',
                                     PAGE_ABOUT:'page_about',
                                     PAGE_START_INFO:'page_start_info',
                                     PAGE_LICENSE:'page_license'
                                    };

var VIA_ANNOTATION_EDITOR_MODE    = {SINGLE_REGION:'single_region',
                                     ALL_REGIONS:'all_regions'};
var VIA_ANNOTATION_EDITOR_PLACEMENT = {NEAR_REGION:'NEAR_REGION',
                                       IMAGE_BOTTOM:'IMAGE_BOTTOM',
                                       DISABLE:'DISABLE'};

var VIA_REGION_EDGE_TOL           = 5;   // pixel
var VIA_REGION_CONTROL_POINT_SIZE = 2;
var VIA_REGION_POINT_RADIUS       = 3;
var VIA_POLYGON_VERTEX_MATCH_TOL  = 5;
var VIA_REGION_MIN_DIM            = 3;
var VIA_MOUSE_CLICK_TOL           = 2;
var VIA_ELLIPSE_EDGE_TOL          = 0.2; // euclidean distance
var VIA_THETA_TOL                 = Math.PI/18; // 10 degrees
var VIA_POLYGON_RESIZE_VERTEX_OFFSET  = 100;
var VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX = 3;
var VIA_CANVAS_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4, 5];

var VIA_THEME_REGION_BOUNDARY_WIDTH = 4;
var VIA_THEME_BOUNDARY_LINE_COLOR   = "black";
var VIA_THEME_BOUNDARY_FILL_COLOR   = "yellow";
var VIA_THEME_SEL_REGION_FILL_COLOR = "#808080";
var VIA_THEME_SEL_REGION_FILL_BOUNDARY_COLOR = "yellow";
var VIA_THEME_SEL_REGION_OPACITY    = 0.5;
var VIA_THEME_MESSAGE_TIMEOUT_MS    = 6000;
var VIA_THEME_CONTROL_POINT_COLOR   = '#ff0000';

var VIA_CSV_SEP        = ',';
var VIA_CSV_QUOTE_CHAR = '"';
var VIA_CSV_KEYVAL_SEP = ':';

var _via_img_metadata = {};   // data structure to store loaded images metadata
var _via_img_src      = {};   // image content {abs. path, url, base64 data, etc}
var _via_img_fileref  = {};   // reference to local images selected by using browser file selector
var _via_img_count    = 0;    // count of the loaded images
var _via_canvas_regions = []; // image regions spec. in canvas space
var _via_canvas_scale   = 1.0;// current scale of canvas image

var _via_image_id       = ''; // id={filename+length} of current image
var _via_image_index    = -1; // index

var _via_current_image_filename;
var _via_current_image;
var _via_current_image_width;
var _via_current_image_height;

// image canvas
var _via_display_area = document.getElementById('display_area');
var _via_img_panel    = document.getElementById('image_panel');
var _via_reg_canvas   = document.getElementById('region_canvas');
var _via_reg_ctx; // initialized in _via_init()
var _via_canvas_width, _via_canvas_height;

// canvas zoom
var _via_canvas_zoom_level_index   = VIA_CANVAS_DEFAULT_ZOOM_LEVEL_INDEX; // 1.0
var _via_canvas_scale_without_zoom = 1.0;

// state of the application
var _via_is_user_drawing_region  = false;
var _via_current_image_loaded    = false;
var _via_is_window_resized       = false;
var _via_is_user_resizing_region = false;
var _via_is_user_moving_region   = false;
var _via_is_user_drawing_polygon = false;
var _via_is_region_selected      = false;
var _via_is_all_region_selected  = false;
var _via_is_user_updating_attribute_name  = false;
var _via_is_user_updating_attribute_value = false;
var _via_is_user_adding_attribute_name    = false;
var _via_is_loaded_img_list_visible  = false;
var _via_is_attributes_panel_visible = false;
var _via_is_reg_attr_panel_visible   = false;
var _via_is_file_attr_panel_visible  = false;
var _via_is_canvas_zoomed            = false;
var _via_is_loading_current_image    = false;
var _via_is_region_id_visible        = true;
var _via_is_region_boundary_visible  = true;
var _via_is_ctrl_pressed             = false;
var _via_is_debug_mode               = true;

// region
var _via_current_shape             = VIA_REGION_SHAPE.RECT;
var _via_current_polygon_region_id = -1;
var _via_user_sel_region_id        = -1;
var _via_click_x0 = 0; var _via_click_y0 = 0;
var _via_click_x1 = 0; var _via_click_y1 = 0;
var _via_region_click_x, _via_region_click_y;
var _via_region_edge          = [-1, -1];
var _via_current_x = 0; var _via_current_y = 0;

// region copy/paste
var _via_region_selected_flag = []; // region select flag for current image
var _via_copied_image_regions = [];
var _via_paste_to_multiple_images_input;

// message
var _via_message_clear_timer;

// attributes
var _via_attribute_being_updated       = 'region'; // {region, file}
var _via_attributes                    = { 'region':{}, 'file':{} };
var _via_current_attribute_id          = '';

// invoke a method after receiving user input
var _via_user_input_ok_handler     = null;
var _via_user_input_cancel_handler = null;
var _via_user_input_data           = {};

// annotation editor
var _via_annotaion_editor_panel     = document.getElementById('annotation_editor_panel');
var _via_metadata_being_updated     = 'region'; // {region, file}
var _via_annotation_editor_mode     = VIA_ANNOTATION_EDITOR_MODE.SINGLE_REGION;

// persistence to local storage
var _via_is_local_storage_available = false;
var _via_is_save_ongoing            = false;

// all the image_id and image_filename of images added by the user is
// stored in _via_image_id_list and _via_image_filename_list
//
// Image filename list (img_fn_list) contains a filtered list of images
// currently accessible by the user. The img_fn_list is visible in the
// left side toolbar. image_grid, next/prev, etc operations depend on
// the contents of _via_img_fn_list_img_index_list.
var _via_image_id_list                 = []; // array of all image id (in order they were added by user)
var _via_image_filename_list           = []; // array of all image filename
var _via_image_load_error              = []; // {true, false}
var _via_image_filepath_resolved       = []; // {true, false}
var _via_image_filepath_id_list        = []; // path for each file

var _via_reload_img_fn_list_table      = true;
var _via_img_fn_list_img_index_list    = []; // image index list of images show in img_fn_list
var _via_img_fn_list_html              = []; // html representation of image filename list

// image grid
var image_grid_panel                        = document.getElementById('image_grid_panel');
var _via_display_area_content_name          = ''; // describes what is currently shown in display area
var _via_display_area_content_name_prev     = '';
var _via_image_grid_requires_update         = false;
var _via_image_grid_content_overflow        = false;
var _via_image_grid_load_ongoing            = false;
var _via_image_grid_page_first_index        = 0; // array index in _via_img_fn_list_img_index_list[]
var _via_image_grid_page_last_index         = -1;
var _via_image_grid_selected_img_index_list = [];
var _via_image_grid_page_img_index_list     = []; // list of all image index in current page of image grid
var _via_image_grid_visible_img_index_list  = []; // list of images currently visible in grid
var _via_image_grid_mousedown_img_index     = -1;
var _via_image_grid_mouseup_img_index       = -1;
var _via_image_grid_img_index_list          = []; // list of all image index in the image grid
var _via_image_grid_region_index_list       = []; // list of all image index in the image grid
var _via_image_grid_group                   = {}; // {'value':[image_index_list]}
var _via_image_grid_group_var               = []; // {type, name, value}
var _via_image_grid_group_show_all          = false;
var _via_image_grid_stack_prev_page         = []; // stack of first img index of every page navigated so far

// fast annotation (quick update of annotation using keyboard shortcuts)
var _via_is_fast_annotation_ongoing     = false;
var _via_fast_annotation_stack          = [];
var _via_fast_annotation_keys           = ['0','1','2','3','4','5','6','7','8','9'];

// image buffer
var VIA_IMG_PRELOAD_INDICES         = [1, -1, 2, 3, -2, 4]; // for any image, preload previous 2 and next 4 images
var VIA_IMG_PRELOAD_COUNT           = 4;
var _via_buffer_preload_img_index   = -1;
var _via_buffer_img_index_list      = [];
var _via_buffer_img_shown_timestamp = [];
var _via_preload_img_promise_list   = [];

// via settings
var _via_settings = {};
_via_settings.ui  = {};
_via_settings.ui.annotation_editor_height   = 25; // in percent of the height of browser window
_via_settings.ui.annotation_editor_fontsize = 0.8;// in rem
_via_settings.ui.leftsidebar_width          = 18;  // in rem

_via_settings.ui.image_grid = {};
_via_settings.ui.image_grid.img_height          = 80;  // in pixel
_via_settings.ui.image_grid.rshape_fill         = 'none';
_via_settings.ui.image_grid.rshape_fill_opacity = 0.3;
_via_settings.ui.image_grid.rshape_stroke       = 'yellow';
_via_settings.ui.image_grid.rshape_stroke_width = 2;
_via_settings.ui.image_grid.show_region_shape   = true;
_via_settings.ui.image_grid.show_image_policy   = 'all';

_via_settings.ui.image = {};
_via_settings.ui.image.region_label      = '__via_region_id__'; // default: region_id
_via_settings.ui.image.region_label_font = '10px Sans';
_via_settings.ui.image.on_image_annotation_editor_placement = VIA_ANNOTATION_EDITOR_PLACEMENT.NEAR_REGION;

_via_settings.core                  = {};
_via_settings.core.buffer_size      = 4*VIA_IMG_PRELOAD_COUNT + 2;
_via_settings.core.filepath         = {};
_via_settings.core.default_filepath = '';

// UI html elements
var invisible_file_input = document.getElementById("invisible_file_input");
var display_area    = document.getElementById("display_area");
var ui_top_panel    = document.getElementById("ui_top_panel");
var image_panel     = document.getElementById("image_panel");
var img_buffer_now  = document.getElementById("img_buffer_now");

var annotation_list_snippet = document.getElementById("annotation_list_snippet");
var annotation_textarea     = document.getElementById("annotation_textarea");

var img_fn_list_panel     = document.getElementById('img_fn_list_panel');
var img_fn_list           = document.getElementById('img_fn_list');
var attributes_panel      = document.getElementById('attributes_panel');
var leftsidebar           = document.getElementById('leftsidebar');

var BBOX_LINE_WIDTH       = 4;
var BBOX_SELECTED_OPACITY = 0.3;
var BBOX_BOUNDARY_FILL_COLOR_ANNOTATED = "#f2f2f2";
var BBOX_BOUNDARY_FILL_COLOR_NEW       = "#aaeeff";
var BBOX_BOUNDARY_LINE_COLOR           = "#1a1a1a";
var BBOX_SELECTED_FILL_COLOR           = "#ffffff";

var VIA_ANNOTATION_EDITOR_HEIGHT_CHANGE   = 5;   // in percent
var VIA_ANNOTATION_EDITOR_FONTSIZE_CHANGE = 0.1; // in rem
var VIA_IMAGE_GRID_IMG_HEIGHT_CHANGE      = 20; // in percent
var VIA_LEFTSIDEBAR_WIDTH_CHANGE          = 1; // in rem

//
// Data structure to store metadata about file and regions
//
function file_metadata(filename, size) {
  this.filename = filename;
  this.size     = size;         // file size in bytes
  this.regions  = [];           // array of file_region()
  this.file_attributes = {};    // image attributes
}

// Annotation Object
function file_region() {
  this.shape_attributes  = {}; // region shape attributes
  this.region_attributes = {}; // region attributes
  this.region_id=0;
}

//
// Initialization routine
//
function _via_init() {
  console.log(VIA_NAME);
  show_message(VIA_NAME + ' (' + VIA_SHORT_NAME + ') version ' + VIA_VERSION +
               '. Ready !', 2*VIA_THEME_MESSAGE_TIMEOUT_MS);

  if ( _via_is_debug_mode ) {
    document.getElementById('ui_top_panel').innerHTML += '<span>DEBUG MODE</span>';
  }

  document.getElementById('img_fn_list').style.display = 'block';
  document.getElementById('leftsidebar').style.display = 'table-cell';

  // initialize default project
  //project_init_default_project();

  // initialize region canvas 2D context
  _via_init_reg_canvas_context();

  // initialize user input handlers (for both window and via_reg_canvas)
  // handles drawing of regions by user over the image
  _via_init_keyboard_handlers();
  _via_init_mouse_handlers();

  // initialize image grid
  image_grid_init();

  show_single_image_view();
  init_leftsidebar_accordion();
  attribute_update_panel_set_active_button();
  annotation_editor_set_active_button();
  init_message_panel();

  // run attached sub-modules (if any)
  // e.g. demo modules
  if (typeof _via_load_submodules === 'function') {
    console.log('Loading VIA submodule');
    setTimeout( async function() {
      await _via_load_submodules();
    }, 100);
  }

}

function _via_init_reg_canvas_context() {
  _via_reg_ctx  = _via_reg_canvas.getContext('2d');
}

function _via_init_keyboard_handlers() {
  window.addEventListener('keydown', _via_window_keydown_handler, false);
  _via_reg_canvas.addEventListener('keydown', _via_reg_canvas_keydown_handler, false);
  _via_reg_canvas.addEventListener('keyup', _via_reg_canvas_keyup_handler, false);
}

// handles drawing of regions over image by the user
function _via_init_mouse_handlers() {
  _via_reg_canvas.addEventListener('dblclick', _via_reg_canvas_dblclick_handler, false);
  _via_reg_canvas.addEventListener('mousedown', _via_reg_canvas_mousedown_handler, false);
  _via_reg_canvas.addEventListener('mouseup', _via_reg_canvas_mouseup_handler, false);
  _via_reg_canvas.addEventListener('mouseover', _via_reg_canvas_mouseover_handler, false);
  _via_reg_canvas.addEventListener('mousemove', _via_reg_canvas_mousemove_handler, false);
  _via_reg_canvas.addEventListener('wheel', _via_reg_canvas_mouse_wheel_listener, false);
  // touch screen event handlers
  // @todo: adapt for mobile users
  _via_reg_canvas.addEventListener('touchstart', _via_reg_canvas_mousedown_handler, false);
  _via_reg_canvas.addEventListener('touchend', _via_reg_canvas_mouseup_handler, false);
  _via_reg_canvas.addEventListener('touchmove', _via_reg_canvas_mousemove_handler, false);
}

//
// Download image with annotations
//

function download_as_image() {
  if ( _via_display_area_content_name !== VIA_DISPLAY_AREA_CONTENT_NAME['IMAGE'] ) {
    show_message('This functionality is only available in single image view mode');
    return;
  } else {
    var c = document.createElement('canvas');

    // ensures that downloaded image is scaled at current zoom level
    c.width  = _via_reg_canvas.width;
    c.height = _via_reg_canvas.height;

    var ct = c.getContext('2d');
    // draw current image
    ct.drawImage(_via_current_image, 0, 0, _via_reg_canvas.width, _via_reg_canvas.height);
    // draw current regions
    ct.drawImage(_via_reg_canvas, 0, 0);

    var cur_img_mime = 'image/jpeg';
    if ( _via_current_image.src.startsWith('data:') )  {
      var c1 = _via_current_image.src.indexOf(':', 0);
      var c2 = _via_current_image.src.indexOf(';', c1);
      cur_img_mime = _via_current_image.src.substring(c1 + 1, c2);
    }

    // extract image data from canvas
    var saved_img = c.toDataURL(cur_img_mime);
    saved_img.replace(cur_img_mime, "image/octet-stream");

    // simulate user click to trigger download of image
    var a      = document.createElement('a');
    a.href     = saved_img;
    a.target   = '_blank';
    a.download = _via_current_image_filename.slice(0,-1);
    console.log("YEET");

    // simulate a mouse click event
    var event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });

    a.dispatchEvent(event);
  }
}

//
// Display area content
//
function clear_display_area() {
  var panels = document.getElementsByClassName('display_area_content');
  var i;
  for ( i = 0; i < panels.length; ++i ) {
    panels[i].classList.add('display_none');
  }
}

function is_content_name_valid(content_name) {
  var e;
  for ( e in VIA_DISPLAY_AREA_CONTENT_NAME ) {
    if ( VIA_DISPLAY_AREA_CONTENT_NAME[e] === content_name ) {
      return true;
    }
  }
  return false;
}

function show_home_panel() {
  show_single_image_view();
}

function set_display_area_content(content_name) {
  if ( is_content_name_valid(content_name) ) {
    _via_display_area_content_name_prev = _via_display_area_content_name;
    clear_display_area();
    var p = document.getElementById(content_name);
    p.classList.remove('display_none');
    _via_display_area_content_name = content_name;
  }
}

function show_single_image_view() {
  if (_via_current_image_loaded) {
    img_fn_list_clear_all_style();
    _via_show_img(_via_image_index);
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE);
    annotation_editor_update_content();

    var p = document.getElementById('toolbar_image_grid_toggle');
    p.firstChild.setAttribute('xlink:href', '#icon_gridon');
    p.childNodes[1].innerHTML = 'Switch to Image Grid View';
  } else {
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.PAGE_START_INFO);
  }
}

function show_image_grid_view() {
  if (_via_current_image_loaded) {
    img_fn_list_clear_all_style();
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.IMAGE_GRID);
    image_grid_toolbar_update_group_by_select();

    if ( _via_image_grid_group_var.length === 0 ) {
      image_grid_show_all_project_images();
    }
    annotation_editor_update_content();

    var p = document.getElementById('toolbar_image_grid_toggle');
    p.firstChild.setAttribute('xlink:href', '#icon_gridoff');
    p.childNodes[1].innerHTML = 'Switch to Single Image View';

    //edit_file_metadata_in_annotation_editor();
  } else {
    set_display_area_content(VIA_DISPLAY_AREA_CONTENT_NAME.PAGE_START_INFO);
  }
}

//
// Handlers for top navigation bar
//
function sel_local_images() {
  // source: https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
  if (invisible_file_input) {
    invisible_file_input.setAttribute('multiple', 'multiple')
    invisible_file_input.accept   = '.jpg,.jpeg,.png,.bmp';
    invisible_file_input.onchange = project_file_add_local;
    invisible_file_input.click();
  }
}

function download_all_region_data(type) {
  // Javascript strings (DOMString) is automatically converted to utf-8
  // see: https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob
  var all_region_data = pack_via_metadata(type);
  var blob_attr = {type: 'text/'+type+';charset=utf-8'};
  var all_region_data_blob = new Blob(all_region_data, blob_attr);

  save_data_to_local_file(all_region_data_blob, 'via_region_data.'+type);
}

function sel_local_data_file(type) {
  if (invisible_file_input) {
    switch(type) {
    case 'annotations':
      invisible_file_input.accept='.csv,.json';
      invisible_file_input.onchange = import_annotations_from_file;
      break;

    case 'files_url':
      invisible_file_input.accept='';
      invisible_file_input.onchange = import_files_url_from_file;
      break;

    case 'attributes':
      invisible_file_input.accept='json';
      invisible_file_input.onchange = project_import_attributes_from_file;
      break;

    default:
      console.log('sel_local_data_file() : unknown type ' + type);
      return;
    }
    invisible_file_input.removeAttribute('multiple');
    invisible_file_input.click();
  }
}

//
// Data Importer
//
function import_files_url_from_file(event) {
  var selected_files = event.target.files;
  var i, file;
  for ( i = 0; i < selected_files.length; ++i ) {
    file = selected_files[i];
    load_text_file(file, import_files_url_from_csv);
  }
}

function import_annotations_from_file(event) {
  var selected_files = event.target.files;
  var i, file;
  for ( i = 0; i < selected_files.length; ++i ) {
    file = selected_files[i];
    switch ( file.type ) {
    case '': // Fall-through // Windows 10: Firefox and Chrome do not report filetype
      show_message('File type for ' + file.name + ' cannot be determined! Assuming text/plain.');
    case 'text/plain': // Fall-through
    case 'application/vnd.ms-excel': // Fall-through // @todo: filetype of VIA csv annotations in Windows 10 , fix this (reported by @Eli Walker)
    case 'text/csv':
      load_text_file(file, import_annotations_from_csv);
      break;

    case 'text/json': // Fall-through
    case 'application/json':
      load_text_file(file, import_annotations_from_json);
      break;

    default:
      show_message('Annotations cannot be imported from file of type ' + file.type);
      break;
    }
  }
}

function import_annotations_from_csv(data) {
  return new Promise( function(ok_callback, err_callback) {
    if ( data === '' || typeof(data) === 'undefined') {
      err_callback();
    }

    var region_import_count = 0;
    var malformed_csv_lines_count = 0;
    var file_added_count = 0;

    var line_split_regex = new RegExp('\n|\r|\r\n', 'g');
    var csvdata = data.split(line_split_regex);

    var parsed_header = parse_csv_header_line(csvdata[0]);
    if ( ! parsed_header.is_header ) {
      show_message('Header line missing in CSV file');
      err_callback();
    }

    var percent_completed = 0;
    var n = csvdata.length;
    var i;
    var first_img_id = '';
    for ( i = 1; i < n; ++i ) {
      // ignore blank lines
      if (csvdata[i].charAt(0) === '\n' || csvdata[i].charAt(0) === '') {
        continue;
      }

      var d = parse_csv_line(csvdata[i]);

      // check if csv line was malformed
      if ( d.length !== parsed_header.csv_column_count ) {
        malformed_csv_lines_count += 1;
        continue;
      }

      var filename = d[parsed_header.filename_index];
      var size     = d[parsed_header.size_index];
      var img_id   = _via_get_image_id(filename, size);

      // check if file is already present in this project
      if ( ! _via_img_metadata.hasOwnProperty(img_id) ) {
        img_id = project_add_new_file(filename, size);
        if ( _via_settings.core.default_filepath === '' ) {
          _via_img_src[img_id] = filename;
        } else {
          _via_file_resolve_file_to_default_filepath(img_id);
        }
        file_added_count += 1;

        if ( first_img_id === '' ) {
          first_img_id = img_id;
        }
      }

      // copy file attributes
      if ( d[parsed_header.file_attr_index] !== '"{}"') {
        var fattr = d[parsed_header.file_attr_index];
        fattr     = remove_prefix_suffix_quotes( fattr );
        fattr     = unescape_from_csv( fattr );

        var m = json_str_to_map( fattr );
        for( var key in m ) {
          _via_img_metadata[img_id].file_attributes[key] = m[key];

          // add this file attribute to _via_attributes
          if ( ! _via_attributes['file'].hasOwnProperty(key) ) {
            _via_attributes['file'][key] = { 'type':'text' };
          }
        }
      }

      // THIS IS WHERE REGIONS ARE PULLED FROM CSV FILE
      var region_i = new file_region();
      // copy regions shape attributes
      if ( d[parsed_header.region_shape_attr_index] !== '"{}"' ) {
        var sattr = d[parsed_header.region_shape_attr_index];
        sattr     = remove_prefix_suffix_quotes( sattr );
        sattr     = unescape_from_csv( sattr );
        

        

        var m = json_str_to_map( sattr );
        console.log(typeof sattr);
        // Maps key (height, width, name) to value
        for ( var key in m ) {
          region_i.shape_attributes[key] = m[key];
        }
      }

      // copy region attributes
      if ( d[parsed_header.region_attr_index] !== '"{}"' ) {
        var rattr = d[parsed_header.region_attr_index];
        rattr     = remove_prefix_suffix_quotes( rattr );
        rattr     = unescape_from_csv( rattr );

        var m = json_str_to_map( rattr );
        for ( var key in m ) {
          region_i.region_attributes[key] = m[key];

          // add this region attribute to _via_attributes
          if ( ! _via_attributes['region'].hasOwnProperty(key) ) {
            _via_attributes['region'][key] = { 'type':'text' };
          }
        }
      }

      // add regions only if they are present
      if (Object.keys(region_i.shape_attributes).length > 0 ||
          Object.keys(region_i.region_attributes).length > 0 ) {
            //console.log(region_i.shape_attributes);
        _via_img_metadata[img_id].regions.push(region_i);
        region_import_count += 1;
      }
    }
    show_message('Import Summary : [' + file_added_count + '] new files, ' +
                 '[' + region_import_count + '] regions, ' +
                 '[' + malformed_csv_lines_count  + '] malformed csv lines.');

    if ( file_added_count ) {
      update_img_fn_list();
    }

    if ( _via_current_image_loaded ) {
      if ( region_import_count ) {
        update_attributes_update_panel();
        annotation_editor_update_content();
        _via_load_canvas_regions(); // image to canvas space transform
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
      }
    } else {
      if ( file_added_count ) {
        var first_img_index = _via_image_id_list.indexOf(first_img_id);
        _via_show_img( first_img_index );
      }
    }
    ok_callback([file_added_count, region_import_count, malformed_csv_lines_count]);
  });
}

function parse_csv_header_line(line) {
  var header_via_10x = '#filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes'; // VIA versions 1.0.x
  var header_via_11x = 'filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes'; // VIA version 1.1.x

  if ( line === header_via_10x || line === header_via_11x ) {
    return { 'is_header':true,
             'filename_index': 0,
             'size_index': 1,
             'file_attr_index': 2,
             'region_shape_attr_index': 5,
             'region_attr_index': 6,
             'csv_column_count': 7
           }
  } else {
    return { 'is_header':false };
  }
}

function import_annotations_from_json(data) {
  return new Promise( function(ok_callback, err_callback) {
    if (data === '' || typeof(data) === 'undefined') {
      return;
    }

    var d = JSON.parse(data);

    var region_import_count = 0;
    var file_added_count    = 0;
    var malformed_entries_count    = 0;
    for (var img_id in d) {
      var filename = d[img_id].filename;
      var size     = d[img_id].size;
      var comp_img_id = _via_get_image_id(filename, size);
      if ( comp_img_id !== img_id ) {
        // discard malformed entry
        malformed_entries_count += 1;
        continue;
      }

      if ( ! _via_img_metadata.hasOwnProperty(img_id) ) {
        img_id = project_add_new_file(filename, size);
        if ( _via_settings.core.default_filepath === '' ) {
          _via_img_src[img_id] = filename;
        } else {
          _via_file_resolve_file_to_default_filepath(img_id);
        }
        file_added_count += 1;
      }

      // copy file attributes
      var key;
      for ( key in d[img_id].file_attributes ) {
        if ( key === '' ) {
          continue;
        }

        _via_img_metadata[img_id].file_attributes[key] = d[img_id].file_attributes[key];

        // add this file attribute to _via_attributes
        if ( ! _via_attributes['file'].hasOwnProperty(key) ) {
          _via_attributes['file'][key] = { 'type':'text' };
        }
      }

      // copy regions
      var regions = d[img_id].regions;
      var key, i;
      for ( i in regions ) {
        var region_i = new file_region();
        for ( key in regions[i].shape_attributes ) {
          region_i.shape_attributes[key] = regions[i].shape_attributes[key];
        }
        for ( var key in regions[i].region_attributes ) {
          if ( key === '' ) {
            continue;
          }

          region_i.region_attributes[key] = regions[i].region_attributes[key];

          // add this region attribute to _via_attributes
          if ( ! _via_attributes['region'].hasOwnProperty(key) ) {
            _via_attributes['region'][key] = { 'type':'text' };
          }
        }

        // add regions only if they are present
        if ( Object.keys(region_i.shape_attributes).length > 0 ||
             Object.keys(region_i.region_attributes).length > 0 ) {
          _via_img_metadata[img_id].regions.push(region_i);
          region_import_count += 1;
        }
      }
    }
    show_message('Import Summary : [' + file_added_count + '] new files, ' +
                 '[' + region_import_count + '] regions, ' +
                 '[' + malformed_entries_count + '] malformed entries.');

    if ( file_added_count ) {
      update_img_fn_list();
    }

    if ( _via_current_image_loaded ) {
      if ( region_import_count ) {
        update_attributes_update_panel();
        annotation_editor_update_content();
        _via_load_canvas_regions(); // image to canvas space transform
        _via_redraw_reg_canvas();
        _via_reg_canvas.focus();
      }
    } else {
      if ( file_added_count ) {
        _via_show_img(0);
      }
    }

    ok_callback([file_added_count, region_import_count, malformed_entries_count]);
  });
}

// assumes that csv line follows the RFC 4180 standard
// see: https://en.wikipedia.org/wiki/Comma-separated_values
function parse_csv_line(s, field_separator) {
  if (typeof(s) === 'undefined' || s.length === 0 ) {
    return [];
  }

  if (typeof(field_separator) === 'undefined') {
    field_separator = ',';
  }
  var double_quote_seen = false;
  var start = 0;
  var d = [];

  var i = 0;
  while ( i < s.length) {
    if (s.charAt(i) === field_separator) {
      if (double_quote_seen) {
        // field separator inside double quote is ignored
        i = i + 1;
      } else {
        //var part = s.substr(start, i - start);
        d.push( s.substr(start, i - start) );
        start = i + 1;
        i = i + 1;
      }
    } else {
      if (s.charAt(i) === '"') {
        if (double_quote_seen) {
          if (s.charAt(i+1) === '"') {
            // ignore escaped double quotes
            i = i + 2;
          } else {
            // closing of double quote
            double_quote_seen = false;
            i = i + 1;
          }
        } else {
          double_quote_seen = true;
          start = i;
          i = i + 1;
        }
      } else {
        i = i + 1;
      }
    }

  }
  // extract the last field (csv rows have no trailing comma)
  d.push( s.substr(start) );
  return d;
}

// s = '{"name":"rect","x":188,"y":90,"width":243,"height":233}'
function json_str_to_map(s) {
  if (typeof(s) === 'undefined' || s.length === 0 ) {
    return {};
  }

  return JSON.parse(s);
}

// ensure the exported json string conforms to RFC 4180
// see: https://en.wikipedia.org/wiki/Comma-separated_values
function map_to_json(m) {
  var s = [];
  for ( var key in m ) {
    var v   = m[key];
    var si  = JSON.stringify(key);
    si += VIA_CSV_KEYVAL_SEP;
    si += JSON.stringify(v);
    s.push( si );
  }
  return '{' + s.join(VIA_CSV_SEP) + '}';
}

function escape_for_csv(s) {
  return s.replace(/["]/g, '""');
}

function unescape_from_csv(s) {
  return s.replace(/""/g, '"');
}

function remove_prefix_suffix_quotes(s) {
  if ( s.charAt(0) === '"' && s.charAt(s.length-1) === '"' ) {
    return s.substr(1, s.length-2);
  } else {
    return s;
  }
}

function clone_image_region(r0) {
  var r1 = new file_region();

  // copy shape attributes
  for ( var key in r0.shape_attributes ) {
    r1.shape_attributes[key] = clone_value(r0.shape_attributes[key]);
  }

  // copy region attributes
  for ( var key in r0.region_attributes ) {
    r1.region_attributes[key] = clone_value(r0.region_attributes[key]);
  }
  return r1;
}

function clone_value(value) {
  if ( typeof(value) === 'object' ) {
    if ( Array.isArray(value) ) {
      return value.slice(0);
    } else {
      var copy = {};
      for ( var p in value ) {
        if ( value.hasOwnProperty(p) ) {
          copy[p] = clone_value(value[p]);
        }
      }
      return copy;
    }
  }
  return value;
}

function _via_get_image_id(filename, size) {
  if ( typeof(size) === 'undefined' ) {
    return filename;
  } else {
    
    return filename + size;
  }
}

function load_text_file(text_file, callback_function) {
  if (text_file) {
    var text_reader = new FileReader();
    text_reader.addEventListener( 'progress', function(e) {
      show_message('Loading data from file : ' + text_file.name + ' ... ');
    }, false);

    text_reader.addEventListener( 'error', function() {
      show_message('Error loading data text file :  ' + text_file.name + ' !');
      callback_function('');
    }, false);

    text_reader.addEventListener( 'load', function() {
      callback_function(text_reader.result);
    }, false);
    text_reader.readAsText(text_file, 'utf-8');
  }
}

function import_files_url_from_csv(data) {
  return new Promise( function(ok_callback, err_callback) {
    if ( data === '' || typeof(data) === 'undefined') {
      err_callback();
    }

    var malformed_url_count = 0;
    var url_added_count = 0;

    var line_split_regex = new RegExp('\n|\r|\r\n', 'g');
    var csvdata = data.split(line_split_regex);

    var percent_completed = 0;
    var n = csvdata.length;
    var i;
    var img_id;
    var first_img_id = '';
    for ( i=0; i < n; ++i ) {
      // ignore blank lines
      if (csvdata[i].charAt(0) === '\n' || csvdata[i].charAt(0) === '') {
        malformed_url_count += 1;
        continue;
      } else {
        img_id = project_file_add_url(csvdata[i]);
        if ( first_img_id === '' ) {
          first_img_id = img_id;
        }
        url_added_count += 1;
      }
    }
    show_message('Added ' + url_added_count + ' files to project');
    if ( url_added_count ) {
      var first_img_index = _via_image_id_list.indexOf(first_img_id);
      _via_show_img(first_img_index);
      update_img_fn_list();
    }
  });
}

//
// Data Exporter
//
function pack_via_metadata(return_type) {
  if( return_type === 'csv' ) {
    var csvdata = [];
    var csvheader = 'filename,file_size,file_attributes,region_count,region_id,region_shape_attributes,region_attributes';
    csvdata.push(csvheader);

    for ( var image_id in _via_img_metadata ) {
      var fattr = map_to_json( _via_img_metadata[image_id].file_attributes );
      fattr = escape_for_csv( fattr );

      var prefix = '\n' + _via_img_metadata[image_id].filename;
      prefix += ',' + _via_img_metadata[image_id].size;
      prefix += ',"' + fattr + '"';

      var r = _via_img_metadata[image_id].regions;

      if ( r.length !==0 ) {
        for ( var i = 0; i < r.length; ++i ) {
          var csvline = [];
          csvline.push(prefix);
          csvline.push(r.length);
          csvline.push(i);

          // Shape attributes are HERE.
          var sattr = map_to_json( r[i].shape_attributes );
          sattr = '"' +  escape_for_csv( sattr ) + '"';
          csvline.push(sattr);
          console.log(sattr);

          // Regions attributs are HERE.
          var rattr = map_to_json( r[i].region_attributes );
          rattr = '"' +  escape_for_csv( rattr ) + '"';
          csvline.push(rattr);
          csvdata.push( csvline.join(VIA_CSV_SEP) );
        }
      } else {
        // @todo: reconsider this practice of adding an empty entry
        csvdata.push(prefix + ',0,0,"{}","{}"');
      }
    }
    return csvdata;
  } else {
    return [ JSON.stringify(_via_img_metadata) ];
  }
}

function save_data_to_local_file(data, filename) {
  var a      = document.createElement('a');
  a.href     = URL.createObjectURL(data);
  a.download = filename;

  // simulate a mouse click event
  var event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  a.dispatchEvent(event);

  // @todo: replace a.dispatchEvent() with a.click()
  // a.click() based trigger is supported in Chrome 70 and Safari 11/12 but **not** in Firefox 63
  //a.click();

}

