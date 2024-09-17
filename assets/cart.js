jQuery(document).ready(function ($) {
  // fix error
  function fixError(error) {
    window.open(`https://chatgpt.com/?q=${error}`);
  }

  // open drawwer cart
  function openOffcanvas() {
    var offcanvas = new bootstrap.Offcanvas($("#offcanvasDrawer")[0]);
    offcanvas.show();
  }

  // update cart content
  async function updateDrawerCart() {
    try {
      const response = await fetch(
        window.Shopify.routes.root + "?view=cart-drawer"
      );
      const html = await response.text();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const newBox = tempDiv.querySelector("#offcanvasDrawer").innerHTML;
      const count_cart = tempDiv.querySelector(".cart_count").innerText;

      document.querySelector(".cart-count").innerText = count_cart;

      const drawerCart = document.querySelector("#offcanvasDrawer");
      if (drawerCart) {
        drawerCart.innerHTML = newBox;
      }
    } catch (error) {
      fixError(error);
    }
  }

  // New remove & update card
  async function handleChangeCart(id, qty, stt = "add") {
    const quantity = stt === "remove" ? 0 : qty;

    const object = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ id, quantity }).toString(),
    };

    try {
      const response = await fetch(
        window.Shopify.routes.root + "cart/change.js",
        object
      );
      if (!response.ok) throw new Error("Failed to update cart");
      $("body").removeClass("loading");
      if (stt != "edit") {
        await updateDrawerCart();
      }
    } catch (error) {
      fixError(error);
    }
  }

  // Handle add to cart
  async function handleAddtoCart(id, quantity = 1) {
    id = Number(id);
    quantity = Number(quantity);
    $(this).addClass("loading");
    let formData = {
      items: [
        {
          id,
          quantity,
        },
      ],
    };

    try {
      const response = await fetch(window.Shopify.routes.root + "cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error adding to cart:", errorData);
        throw new Error(errorData.message || "Failed to add item to cart.");
      }

      await updateDrawerCart();
      $(".add_to_cart").removeClass("loading");
      openOffcanvas();
    } catch (error) {
      $(".add_to_cart").removeClass("loading");
      fixError(error);
    }
  }

  // Get product model
  async function ajaxEditCart(variant, url) {
    try {
      const response = await fetch(
        url + "?view=ajax-edit-cart&variant=" + variant
      );
      const html = await response.text();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const newBox = tempDiv.querySelector(
        "#product-quick-edit-cart"
      ).innerHTML;

      document.querySelector(".quick-editcart-modal").innerHTML = newBox;

      // open model
      $.fancybox.open({
        src: "#quick-editcart-modal",
        type: "inline",
      });
    } catch (error) {
      fixError(error);
    }
  }

  // Edit mini cart item
  $(document).on("click", "a.edit-cart", async function (e) {
    e.preventDefault();

    const id = $(this)
      .closest(".cart-item")
      .addClass("is-edit")
      .data("variant-id");

    const qty = 0;

    const url = element.closest(".cart-item").find(".cart-title").attr("href");

    await ajaxEditCart(id, url);
  });

  $(document).on("click", ".update-cart", async function (e) {
    e.preventDefault();

    const id = $(".js_sticky_sl").val();
    const qty = parseInt($(".js_qty").val());

    const id_old = $(".cart-item.is-edit").data("variant-id");

    const res = handleChangeCart(id_old, 0, "remove");

    await handleAddtoCart(Number(id), qty);
  });

  // handle add to cart
  $(document).on("click", "a.add_to_cart", async function (e) {
    e.preventDefault();
    $(this).addClass("loading");

    const id = $(this).data("variant-id");
    if (!id) {
      console.error("Invalid variant ID");
      $(this).removeClass("loading");
      return;
    }

    await handleAddtoCart(id, 1);
  });

  $(document).on("click", "a.add_quick_shop", async function (e) {
    e.preventDefault();
    $(this).addClass("loading");

    const id = $(this).data("variant-id");
    const url = $(this).attr("href");
    if (!id) {
      console.error("Invalid variant ID");
      $(this).removeClass("loading");
      return;
    }

    await ajaxEditCart(id, url);
  });

  // change quantity
  $(document).on("click", ".qtyBtn", function () {
    const item = $(this).closest(".cart-item"),
      qtyInput = item.find(".quantity__input"),
      qty =
        parseInt(qtyInput.val(), 10) +
        ($(this).hasClass("minus") && qtyInput.val() > 1 ? -1 : 1);

    qtyInput.attr("value", qty).trigger("change");
  });

  // onchange
  $(document).on("change", ".quantity__input", async function (e) {
    const $this = $(this);
    const id = $this.closest(".cart-item").data("variant-id");
    let qty = parseInt($this.val(), 10);
    $("body").addClass("loading");
    await handleChangeCart(id, qty, "update");
  });

  // Remove item cart click
  $(document).on("click", ".cart-remove", async function (e) {
    e.preventDefault();
    $("body").addClass("loading");
    await handleChangeCart($(this).data("id"), 0, "remove");
  });

  // open mini cart in header click
  $(document).on("click", ".cart-header a", function (e) {
    e.preventDefault();
    openOffcanvas();
  });
});
