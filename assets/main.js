console.log("main js");

jQuery(document).ready(function ($) {
  $('[data-toggle="tooltip"]').tooltip();

  $(".announcement-group").length > 0 &&
    $(".announcement-group").slick({
      arrows: false,
      autoplay: true,
    });

  function asyncWishlist() {
    let wishlist = localStorage.getItem("wishlist");
    if (wishlist === null) {
      wishlist = "";
    } else {
      // Chuyển đổi wishlist thành mảng các ID
      let wishlistArray = wishlist.split(",").filter(Boolean);

      wishlistArray = wishlistArray.map((id) => {
        return id.replace("id:", "");
      });

      $(".wishlist_button").each(function () {
        const id = String($(this).data("id"));

        if (wishlistArray.includes(id)) {
          $(this).addClass("is--added");
        }

        $(this).attr("data-bs-original-title", "Available in Wishlist");
      });
    }
  }
  asyncWishlist();

  $(document).on("click", ".wishlist_button:not(.is--added)", function () {
    $(this).addClass("is--added");
    $(this).addClass("loading");
    let id = $(this).data("id");
    id = "id:" + id;

    // Retrieve existing wishlist from local storage
    let wishlist = localStorage.getItem("wishlist");

    // Initialize wishlist as an empty string if it doesn't exist
    if (wishlist === null) {
      wishlist = "";
    }

    // Convert wishlist to an array
    let wishlistArray = wishlist.split(",").filter(Boolean); // filter(Boolean) to remove empty strings

    // Check if the item is already in the wishlist
    if (!wishlistArray.includes(id)) {
      wishlistArray.push(id);

      $(".wishlist-count").text(wishlistArray.length);
      localStorage.setItem("wishlist", wishlistArray.join(","));

      $(this).attr("data-bs-original-title", "Available in Wishlist");
    } else {
    }

    setTimeout(function () {
      $(".wishlist_button").removeClass("loading");
    }, 1000);
  });

  $(document).on("click", ".wishlist_button.is--added", function () {
    window.location.href = location.origin + "/pages/wishlist";
  });
});
