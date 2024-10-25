// fix error
function fixError(error) {
  window.open(`https://chatgpt.com/?q=${error}`);
}

// open drawwer cart
function openOffcanvas() {
  var offcanvas = new bootstrap.Offcanvas($("#offcanvasDrawer")[0]);
  offcanvas.show();
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

    await updateDrawerCart("add");
    $(".add_to_cart").removeClass("loading");
  } catch (error) {
    $(".add_to_cart").removeClass("loading");
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

    if (stt != "edit") {
      await updateDrawerCart();
    }
  } catch (error) {
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

    const newBox = tempDiv.querySelector("#product-quick-edit-cart").innerHTML;

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

// update cart content
async function updateDrawerCart(status = "") {
  $.ajax({
    url: window.Shopify.routes.root + "?view=cart-drawer",
    method: "GET",
    success: function (html) {
      const tempDiv = $("<div>").html(html);
      const countCart = tempDiv.find(".cart_count").text();
      const totalPrice = tempDiv.find(".total-price").html();
      const shippingInfo = tempDiv.find(".shipping-info").html();
      const cartList = tempDiv.find(".cart-list").html();

      if ($("#offcanvasDrawer").length) {
        $(".cart-count").text(countCart);
        $(".cart_count").html(countCart);
        $(".shipping-info").html(shippingInfo);
        $(".cart-list").html(cartList);
        $(".total-price").html(totalPrice);
      }

      if (status == "add") {
        openOffcanvas();
      }
      $("body").removeClass("loading");
    },
    error: function (error) {
      fixError(error);
    },
  });
}

function handleChangeQty() {
  var qtyInputs = $(".product .qty-input");

  if (!qtyInputs.length) {
    return;
  }

  var inputs = qtyInputs.find(".product-qty");
  var countBtn = qtyInputs.find(".qty-count");
  var qtyMin = parseInt(inputs.attr("min"));
  var qtyMax = parseInt(inputs.attr("max"));

  inputs.change(function () {
    var $this = $(this);
    var minusBtn = $this.siblings(".qty-count--minus");
    var addBtn = $this.siblings(".qty-count--add");
    var qty = parseInt($this.val());

    if (isNaN(qty) || qty <= qtyMin) {
      $this.val(qtyMin);
      minusBtn.attr("disabled", true);
    } else {
      $minusBtn.attr("disabled", false);

      if (qty >= qtyMax) {
        $this.val(qtyMax);
        addBtn.attr("disabled", true);
      } else {
        $this.val(qty);
        addBtn.attr("disabled", false);
      }
    }
  });

  countBtn.click(function () {
    var operator = this.dataset.action;
    var $this = $(this);
    var input = $this.siblings(".product-qty");
    var qty = parseInt(input.val());

    if (operator == "add") {
      qty += 1;
      if (qty >= qtyMin + 1) {
        $this.siblings(".qty-count--minus").attr("disabled", false);
      }

      if (qty >= qtyMax) {
        $this.attr("disabled", true);
      }
    } else {
      qty = qty <= qtyMin ? qtyMin : (qty -= 1);

      if (qty == qtyMin) {
        $this.attr("disabled", true);
      }

      if (qty < qtyMax) {
        $this.siblings(".qty-count--add").attr("disabled", false);
      }
    }

    input.val(qty).attr("value", qty);
  });
}

jQuery(document).ready(function ($) {
  handleChangeQty();

  // Edit mini cart item
  $(document).on("click", "a.edit-cart", async function (e) {
    e.preventDefault();

    const id = $(this).closest(".cart-item").data("variant-id");
    const qty = 0;
    const url = $(this).closest(".cart-item").find(".cart-title").attr("href");

    await ajaxEditCart(id, url);
  });

  $(document).on("click", ".update-cart", async function (e) {
    e.preventDefault();

    const id = $("#quick-editcart-modal .js_sticky_sl").val();
    const qty = parseInt($("#quick-editcart-modal .quantity__input ").val());

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
  $(document).on("click", ".cart-list .qtyBtn", async function () {
    $("body").addClass("loading");
    const item = $(this).closest(".cart-item");
    (qtyInput = item.find(".quantity__input")),
      (qty =
        parseInt(qtyInput.val(), 10) +
        ($(this).hasClass("minus") && qtyInput.val() > 1 ? -1 : 1));
    const id = item.data("variant-id");

    // console.log(">>>", handleChangeQty($(this)));

    await handleChangeCart(id, qty, "update");
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
  $(document).on("click", ".is-cart-drawer a", function (e) {
    e.preventDefault();
    openOffcanvas();
  });
});
