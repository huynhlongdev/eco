function tooltip() {
  $('[data-bs-toggle="tooltip"]').tooltip();
}

function copyLink() {
  $(document).on("click", ".btn-copy", function (e) {
    const link = $(this).data("url");
    navigator.clipboard
      .writeText(link)
      .then(() => {
        console.log("Link copied:", link);
      })
      .catch((err) => {
        console.error("Error copying the link:", err);
      });
  });
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

jQuery(document).ready(function ($) {
  // Tooltip
  tooltip();
  // Copy link
  copyLink();

  // Header top
  $(".announcement-group").length > 0 &&
    $(".announcement-group").slick({
      arrows: false,
      autoplay: true,
    });
});
