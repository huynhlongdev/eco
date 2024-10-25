jQuery(document).ready(function ($) {
  const section_id = $(".product-container").data("id");

  // Initial setup
  const initialSearchParams = window.location.search;
  let previousSearchParams = initialSearchParams;
  let filterData = [];

  $(document).on("click", ".btn-loadmore", function () {
    const currentPage = $(this).data("current");
    const param3 = `page=${currentPage}`;
    const searchParams = `${combineSearchParams()}&${param3}`;

    renderPage(searchParams, true, true);
  });

  $(document).on("click", ".clear-all", function (e) {
    e.preventDefault();
    resetFilters();
  });

  $(document).on("click", ".facets__button", function (e) {
    e.preventDefault();
    const searchParams = $(this).attr("href");
    renderPage(searchParams, true);
  });

  // Get sections to update
  function getSections() {
    return [{ section: `${section_id}` }];
  }

  // Update the browser's URL without reloading the page
  function updateURL(searchParams) {
    const url = `${window.location.pathname}${
      searchParams ? `?${searchParams}` : ""
    }`;
    history.pushState({ searchParams }, "", url);
  }

  // Combine serialized form parameters
  function combineSearchParams() {
    const searchParamsForm1 = $("#FacetFiltersForm").serialize();
    const searchParamsForm2 = $("#FacetSortForm").serialize();
    return [searchParamsForm1, searchParamsForm2].filter(Boolean).join("&");
  }

  // Handle form submission
  function handleFormSubmit(event) {
    event.preventDefault();
    const combinedSearchParams = combineSearchParams();
    renderPage(combinedSearchParams, true);
  }

  // Render page sections and update content
  function renderPage(searchParams, updateURLHash = true, append = false) {
    previousSearchParams = searchParams;

    const sections = getSections();
    sections.forEach(function (section) {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const cachedSection = filterData.find((data) => data.url === url);
      $(".btn-loadmore").addClass("loading");
      if (cachedSection) {
        updatePageContent(cachedSection.html, append);
      } else {
        $.get(url, function (response) {
          filterData.push({ html: response, url });
          updatePageContent(response, append);
        });
      }
    });

    if (updateURLHash) {
      updateURL(searchParams);
    }
  }

  // Update page content with the new HTML
  function updatePageContent(html, append = false) {
    const $newHtml = $(html);
    if (append) {
      const sidebar = $newHtml.find(".shop-sidebar-inner").html();
      const products = $newHtml.find(".product-grid").html();
      const pagination = $newHtml.find(".pagination").html();

      $(".shop-sidebar-inner").html(sidebar);
      $(".pagination").html(pagination);
      $(".product-grid").append(products);
    } else {
      $(".product-container").html($newHtml.find(".product-container").html());
    }

    $(".btn-loadmore").removeClass("loading");

    // Re-bind the event after content update
    bindEvents();
  }

  // Function to reset filters
  function resetFilters() {
    $("#FacetFiltersForm")[0].reset();
    $("#FacetSortForm")[0].reset();

    $('input[type="checkbox"]').prop("checked", false);
    $('input[type="radio"]').prop("checked", false);
    $("select").prop("selectedIndex", 0);

    // Clear all inputs in the form
    const searchParamsForm1 = $("#FacetFiltersForm").serialize();
    const searchParamsForm2 = $("#FacetSortForm").serialize();

    // Combine query strings, ensuring both are present
    // Combine reset query strings (make sure to check if one is empty)
    let combinedSearchParams = "";
    if (searchParamsForm1 && searchParamsForm2) {
      combinedSearchParams = `${searchParamsForm1}&${searchParamsForm2}`;
    } else if (searchParamsForm1) {
      combinedSearchParams = searchParamsForm1;
    } else if (searchParamsForm2) {
      combinedSearchParams = searchParamsForm2;
    }

    // If both are empty, render with empty params (default state)
    if (!combinedSearchParams) {
      combinedSearchParams = ""; // You can adjust this to match your default state
    }

    // Re-render the page with default params (this will reset the data)
    renderPage(combinedSearchParams, true);
  }

  // Bind form input event with debounce
  const bindEvents = function () {
    $("#FacetFiltersForm, #FacetSortForm").on(
      "input",
      debounce(handleFormSubmit, 300)
    );

    asyncWishlist();
  };

  const productMedia = function () {
    var $html = window.$html || $("html");
    var $body = window.$body || $html.find("body");
    var initSlide = true;
    var initSwipe = true;
    var slideMain = $(".slider-fors").not(".slick-initialized");
    var slideNav = $(".slider-nav").not(".slick-initialized");

    responsive = [{ breakpoint: 991, settings: { dots: true, arrows: false } }];
    const mainObject = {
      arrows: true,
      dots: false,
      fade: true,
      infinite: true,
      appendArrows: ".main_appendArrows",
      responsive: responsive,
      slidesToShow: 1,
      focusOnSelect: false,
      focusOnChange: false,
      accessibility: false,
      // useTransform: false,
    };

    var responsive = [
      {
        breakpoint: 1025,
        settings: {
          vertical: false,
          slidesToShow: 4,
          slidesToScroll: 1,
          dots: false,
          arrows: true,
        },
      },
    ];
    const navObject = {
      vertical: true,
      slidesToShow: 7,
      arrows: true,
      dots: false,
      infinite: true,
      centerMode: false,
      verticalSwiping: true,
      slidesToShow: 7,
      responsive: responsive,
    };

    slideMain.on(
      "init afterChange",
      function (event, slick, currentSlide, nextSlide) {
        if (event.type == "init") {
          initSwipe = slick.options.swipe;
        }

        var slickCurrent = $(slick.$slides.get(currentSlide)),
          slickNext = $(slick.$slides.get(nextSlide)),
          imageId = slickCurrent.data("image-id"),
          mediaType = slickCurrent.data("media_type");

        if (!mediaType || mediaType == "image") {
          slick.options.swipe = initSwipe;
          // _.zoomCreate(slickCurrent);
        } else {
          // _.zoomDestroy();
          // if (mediaType == "model") {
          //   var modelViewer = $(event.target).find("model-viewer");
          //   if (!modelViewer.hasClass("shopify-model-viewer-ui__disabled")) {
          //     slick.options.swipe = false;
          //   }
          // } else {
          //   slick.options.swipe = initSwipe;
          // }
        }

        $html
          .removeClass(function (index, className) {
            return (className.match(/(^|\s)media_type-\S+/g) || []).join(" ");
          })
          .addClass("media_type-" + mediaType);
        if (!initSlide && slideNav.hasClass("slick-initialized")) {
          var idx = slickCurrent.data("slick-index"),
            slideCount = slideNav.slick("getSlick").slideCount;

          if (slideCount > slideNav.data("slidesToShow")) {
            if (idx < 0) {
              idx += slideCount;
            }
            slideNav.slick("slickGoTo", idx);
          } else {
            slideNav.find(".slick-slide").each(function () {
              if (idx == $(this).data("slick-index")) {
                $(this).addClass("slick-current");
              } else {
                $(this).removeClass("slick-current");
              }
            });
          }
        }

        initSlide = false;
      }
    );
    slideMain.slick(mainObject);

    // nav
    if (!slideNav.length) return;
    var responsive = [
      {
        breakpoint: 1025,
        settings: {
          vertical: false,
          slidesToShow: 4,
          slidesToScroll: 1,
          dots: false,
          arrows: true,
        },
      },
    ];
    slideNav.slick(navObject);
    slideNav.on("click", ".slick-slide", function () {
      if (!slideMain.length) return;
      slideMain.slick("slickGoTo", $(this).data("slick-index"));
      $(this).addClass("slick-current").siblings().removeClass("slick-current");
      initSlide = true;
    });
  };

  bindEvents();
  productMedia();
});
