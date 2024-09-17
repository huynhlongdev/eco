jQuery(document).ready(function ($) {
  // Tooltip
  $('[data-toggle="tooltip"]').tooltip();

  // Header top
  $(".announcement-group").length > 0 &&
    $(".announcement-group").slick({
      arrows: false,
      autoplay: true,
    });
});
