jQuery(document).ready(function ($) {
  const overflow = "overflow-hidden";
  // Hàm mở ngăn kéo giỏ hàng
  function openDrawerCart() {
    $("#draw-cart").addClass("active");
    $("html").addClass(overflow);
  }

  function closeDrawerCart() {
    $("#draw-cart").removeClass("active");
    $("html").removeClass(overflow);
  }

  // Hàm cập nhật nội dung ngăn kéo giỏ hàng
  async function updateDrawerCart() {
    try {
      const response = await fetch(
        window.Shopify.routes.root + "?view=cart-drawer"
      );
      const html = await response.text();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const newBox = tempDiv.querySelector(".lp-drawer__wrap").innerHTML;
      const count_cart = tempDiv.querySelector(".cart_count").innerText;

      document.querySelector(".cart-count").innerText = count_cart;

      const drawerCart = document.querySelector(".lp-drawer__wrap");
      if (drawerCart) {
        drawerCart.innerHTML = newBox;
      }
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  }

  async function removeDrawerCart(id) {
    try {
      const response = await fetch(
        window.Shopify.routes.root + "cart/change.js",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: id,
            quantity: 0,
          }),
        }
      );

      const data = await response.json();
      await updateDrawerCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  }

  async function addToCart(obj) {
    const variant_id = obj.id;
    const qty = obj.qty;
    let formData = {
      items: [
        {
          id: variant_id,
          quantity: qty,
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
      await updateDrawerCart();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function changeCart(id, qty) {
    // document.getElementById("loading-indicator").classList.remove("hidden");

    try {
      const response = await fetch(
        window.Shopify.routes.root + "cart/change.js",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            id: id,
            quantity: qty,
          }).toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const cart = await response.json();
      await updateDrawerCart();
    } catch (error) {
      console.error("Error updating cart:", error);

      window.open(`https://chatgpt.com/?q=${error}`);
    } finally {
      // Hide loading indicator
      // document.getElementById("loading-indicator").classList.add("hidden");
    }
  }

  // Xử lý sự kiện click vào nút "Add to Cart"
  $(document).on("click", "a.add_to_cart", async function (e) {
    e.preventDefault();
    const variant_id = $(this).data("variant-id");
    let formData = {
      items: [
        {
          id: variant_id,
          quantity: 1,
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
      await updateDrawerCart();
      openDrawerCart();
    } catch (error) {
      console.error("Error:", error);
    }
  });

  $(document).on("click", ".qtyBtn", function () {
    const btn = $(this);
    const qtyInput = btn.closest(".cart-quantity").find(".qty");
    const id = btn.closest(".cart-quantity").data("variant-id");
    let qty = parseInt(qtyInput.val());

    if (btn.hasClass("minus")) {
      if (qty > 1) {
        qty = qty - 1;
      }
    } else {
      qty = qty + 1;
    }

    qtyInput.val(qty);
    changeCart(id, qty);
  });

  $(document).on("click", ".cart-remove", async function (e) {
    e.preventDefault();
    await removeDrawerCart($(this).data("id"));
  });

  $(document).on("click", ".close_drawer", function (e) {
    e.preventDefault();
    closeDrawerCart();
  });

  $(document).on("click", ".cart-header a", function (e) {
    e.preventDefault();
    openDrawerCart();
  });

  console.log(">>>cart.js");
});
