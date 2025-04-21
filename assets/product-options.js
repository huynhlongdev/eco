if (!customElements.get("product-options")) {
  class ProductOptions extends HTMLElement {
    constructor() {
      super();
      this.settings = {
        optionSelector: ".product-options__value",
      };
    }
    connectedCallback() {
      this.load();
    }
    load() {
      var self = this,
        $body = $("body");
      /* Switch option event support click touchstart mouseenter */
      $(this).on(
        "click touchstart",
        self.settings.optionSelector,
        self.onProcess.bind(self)
      );
      $(this).on("change", "select", function (event) {
        var target = event.target,
          option = target.options[target.selectedIndex];
        $(option).trigger("click");
      });

      $("body").on(
        "change",
        '[data-js-product-variants="control"]',
        function () {
          var $this = $(this),
            $product = $this.parents("[data-js-product]"),
            id = $this.find("option:selected").attr("value"),
            dataJson = $product.find(".data-json-product"),
            json = dataJson.length
              ? JSON.parse(dataJson.html())
              : $product.data("json-product"),
            update_variant = null;
          self.loadJSON($product, json, function (json) {
            $.each(json.variants, function () {
              if (+this.id === +id) {
                update_variant = this;
                return false;
              }
            });
            self.switchVariant($product, {
              update_variant: update_variant,
              json: json,
              dontUpdateVariantsSelect: true,
            });
          });
        }
      );
      /*$(".swatch .swatch-element").first().trigger("click");*/
      var $product = $("#product-single");
      if ($product.length) {
        var dataJson = $product.find(".data-json-product"),
          json = dataJson.length
            ? JSON.parse(dataJson.html())
            : $product.data("json-product");
        var urlParams = new URLSearchParams(window.location.search),
          variantId = urlParams.get("variant");
        if (!variantId) {
          $("div[data-slide-nav] .thumb_img").first().trigger("click");
          variantId = $product.find("input[name=id]").val();
        } else {
          if (json) {
            var variant = self.getVariantById(json, variantId);
            document.body.dispatchEvent(
              new CustomEvent("afterVariantUpdated", { detail: variant })
            );
          }
        }
        if (json) {
          var quantity,
            $qty = $product.find("input.js_qty");
          $.each(json.variants_quantity, function () {
            if (this.id == variantId) {
              quantity = +this.quantity;
            }
          });
          $qty.data("max", quantity);
        }
      }
    }

    onProcess(event) {
      var self = this,
        $body = $("body");
      $body.trigger("beforeVariantUpdated");
      var target = event.target,
        option = target.closest(self.settings.optionSelector),
        optionValue = target.matches("option")
          ? target.value
          : target.matches("input")
          ? target.value
          : option.querySelector("input").value;
      if (option.matches("option")) option.selected = "selected";
      var $this = $(option),
        optionItem = option.closest(".cms-option-item"),
        labelSelected = optionItem.querySelector(".label-selected"),
        position = parseInt(optionItem.dataset.position) - 1;
      if ($this.hasClass("disabled")) return;
      var $product = $this.parents("[data-js-product]"),
        dataJson = $product.find(".data-json-product"),
        dataOptions = $product.find(".data-json-options"),
        json = dataJson.length
          ? JSON.parse(dataJson.html())
          : $product.data("json-product"),
        dataOptions = dataOptions.length ? JSON.parse(dataOptions.html()) : [],
        current_values = [],
        update_variant;
      $this.addClass("active").siblings().removeClass("active");
      if (labelSelected) {
        labelSelected.innerHTML = optionValue;
      }
      self.loadJSON($product, json, function (json) {
        var $active_values = self.querySelectorAll(
          self.settings.optionSelector + ".active"
        );
        $active_values.forEach(function(element){
          current_values.push(
            element.matches("option")
              ? element.value
              : element.querySelector("input").value
          );
        });
        json.variants.forEach(function(variant){
          if (!variant.available) return;
          if (
            current_values[position] == variant.options[position] &&
            current_values.toString() === variant.options.toString()
          ) {
            update_variant = variant;
            return false;
          }
        });
        self.updatePossibleVariants({
          update_variant: update_variant,
          json: json,
        });
        self.updateAddToCart($product, {
          update_variant: update_variant,
          json: json,
        });
        if (update_variant) {
          $product.find(".inventory_qty").show();
          self.switchVariant($product, {
            update_variant: update_variant,
            json: json,
            has_unselected_options: $product.find("[data-disable-auto-select]")
              .length
              ? true
              : false,
          });
          var variantId = update_variant.id;
          $product.find("[data-js-product-variants] option").each(function () {
            if ($(this).attr("value") == variantId) {
              $(this).attr("selected", true);
              $(this).addClass("selected");
            } else {
              $(this).attr("selected", false);
              $(this).removeClass("selected");
            }
          });
        } else {
          $product.find(".inventory_qty").hide();
        }
      });
      if (!$body.hasClass("initSwatch")) {
        $this.addClass("active").siblings().removeClass("active");
        if (option.closest(".sticky_variant_content")) {
          $body.addClass("initSwatch");
          $(
            '#product-single [data-position="' +
              optionItem.dataset.position +
              '"] [value="' +
              optionValue +
              '"]'
          ).trigger("click");
        } else if (option.closest("#product-single")) {
          $body.addClass("initSwatch");
          $(
            '.sticky_variant_content [data-position="' +
              optionItem.dataset.position +
              '"] [value="' +
              optionValue +
              '"]'
          ).trigger("click");
        }
      }
      $body.removeClass("initSwatch");
      if (update_variant) {
        document.body.dispatchEvent(
          new CustomEvent("afterVariantUpdated", { detail: update_variant })
        );
      }
    }

    loadJSON($product, json, callback) {
      if ($product[0].hasAttribute("data-js-process-ajax-loading-json")) {
        $product.one("json-loaded", function () {
          if (callback) {
            var dataJson = $product.find(".data-json-product"),
              json = dataJson.length
                ? JSON.parse(dataJson.html())
                : $product.data("json-product");
            callback(json);
          }
        });
        return;
      }
      if (json) {
        if (callback) {
          callback(typeof json == "object" ? json : JSON.parse(json));
        }
      }
    }
    switchByImage($product, get_image, id, callback) {
      var _ = this,
        $image = $product.find("[data-js-product-image] [data-image-lazy]"),
        dataJson = $product.find(".data-json-product"),
        json = dataJson.length
          ? JSON.parse(dataJson.html())
          : $product.data("json-product"),
        data = false;
      this.loadJSON($product, json, function (json) {
        console.log('loadJSON', json);
        var json_images = json.images,
          current_image_id =
            get_image === "by_id" ? +id : +$image.attr("data-image-id"),
          image_index,
          update_variant;
        $.each(json_images, function (i) {
          if (+this.id === current_image_id) {
            image_index = i;
            return false;
          }
        });
        if (image_index || image_index === 0) {
          if (get_image === "prev" && image_index !== 0) {
            image_index--;
          } else if (
            get_image === "next" &&
            image_index !== json_images.length - 1
          ) {
            image_index++;
          }
          $.each(json.variants, function () {
            if (
              this.featured_image &&
              +this.featured_image.id === +json_images[image_index].id
            ) {
              update_variant = this;
              return false;
            }
          });
          if (!update_variant) {
            update_variant = self.getDefaultVariant(json);
            update_variant.featured_image = json_images[image_index];
          }
          self.updateOptions({
            update_variant: update_variant,
            json: json,
          });
          self.switchVariant($product, {
            update_variant: update_variant,
            json: json,
          });
          data = {
            index: image_index,
            image: json_images[image_index],
            is_first: image_index === 0,
            is_last: image_index === json_images.length - 1,
          };
        }

        callback(data);
      });
    }
    updatePossibleVariants(data) {
      var self = this;

      console.log('self', self);
      console.log('data', data);
      const selectedOptionOneVariants = data.json.variants.filter((variant) => {
        return (
          self.querySelector(
            '.cms-option-item[data-position="1"] .product-options__value.active > input, .cms-option-item[data-position="1"] option.active'
          ).value === variant.option1
        );
      });

      console.log('selectedOptionOneVariants', selectedOptionOneVariants);
      function setInputAvailability(elementList, availableValuesList) {
        elementList.forEach((element) => {
          const value = element.matches('select,option,input') ? element.value: element.querySelector('input').value;
          const availableElement = availableValuesList.includes(value);
          element.classList.toggle("disabled", !availableElement);
          if (element.matches("option")) {
            if (availableElement) {
              element.removeAttribute("disabled");
            } else {
              element.setAttribute("disabled", !availableElement);
            }
          }
        });
      }
      const inputWrappers = [...self.querySelectorAll(".cms-option-item")];
      console.log('inputWrappers', inputWrappers);
      inputWrappers.forEach((option, index) => {
        if (index === 0) return;
        console.log('optionInputs',self.settings.optionSelector, option.querySelectorAll(self.settings.optionSelector));
        const optionInputs = [
          ...option.querySelectorAll(self.settings.optionSelector),
        ];
        const previousOptionSelected = inputWrappers[index - 1].querySelector(
          ".active > input, option.active"
        ).value;
        const availableOptionInputsValue = selectedOptionOneVariants
          .filter(
            (variant) =>
              variant.available &&
              variant[`option${index}`] === previousOptionSelected
          )
          .map((variantOption) => variantOption[`option${index + 1}`]);
        setInputAvailability(optionInputs, availableOptionInputsValue);
      });
    }
    switchVariant($product, data) {
      data.update_variant.metafields = Object.assign({}, data.json.metafields);
      data.json.variants_metafields.forEach(function(variant){
        if (+variant.variant_id === +data.update_variant.id) {
          data.update_variant.metafields = Object.assign(
            true,
            data.update_variant.metafields,
            variant.metafields
          );
        }
      });
      this.updateContent($product, data);
    }
    getDefaultVariant(json) {
      var default_variant = {};
      $.each(json.variants, function () {
        if (+this.id === +json.default_variant_id) {
          Object.assign(default_variant, this);
          return false;
        }
      });
      return default_variant;
    }
    getVariantById = function (jsonProduct, id) {
      var $variant = {};
      if (jsonProduct.hasOwnProperty("variants")) {
        $.each(jsonProduct.variants, function (index, variant) {
          if (variant.hasOwnProperty("id") && variant.id == id) {
            $variant = variant;
            return false;
          }
        });
      }
      return $variant;
    };
    updateContent($product, data) {
      $product.attr("data-product-variant-id", data.update_variant.id);
      this.updateFormVariantInput($product, data);
      this.updatePrice($product, data);
      this.updateLabelSale($product, data);
      this.updateLabelInStock($product, data);
      this.updateLabelOutStock($product, data);
      this.updateLabelHot($product, data);
      this.updateLabelNew($product, data);
      this.updateCountdown($product, data);
      this.updateDynamicCheckout($product, data);
      this.updateSKU($product, data);
      this.updateBarcode($product, data);
      this.updateAvailability($product, data);
      this.updateStockCountdown($product, data);
      this.updateGallery($product, data);
      this.updateLinks($product, data);
      this.updateHistory($product, data);
      theme.ProductImagesNavigation.switch($product, data);data 
      if (!data.dontUpdateVariantsSelect) {
        this.updateVariantsSelect($product, data);
      }
    }
    updateOptions(data) {
      var self = this,
        $this = $(this);
      console.log('updateOptions', updateOptions);
      $this.find(self.settings.optionSelector).removeClass("active");
      self.updatePossibleVariants($data);
      $.each(data.update_variant.options, function (i, k) {
        var $prop = $this.find(".product-options__section").eq(i);
        $prop
          .find(self.settings.optionSelector + '[value="' + k + '"]')
          .addClass("active");
        $prop.filter("select").val(k).trigger("change", [true]);
      });
    }
    updateFormVariantInput($product, data) {
      var $input = $product.find("[data-js-product-variant-input]");
      $input.val(data.update_variant.id).trigger("input");
    }
    updateVariantsSelect($product, data) {
      var $select = $product.find("[data-js-product-variants]");
      if ($select.length) {
        $select.val(data.update_variant.id).change();
      }
    }
    updateAddToCart($product, data) {
      var $buyitnow = $product.find("[data-buyitnow-button]"),
        $quantity = $product.find("[data-product-quantity]"),
        $buttonsoldout = $product.find("[data-js-product-button-sold-out]"),
        $buttonCart = $product.find(".add-to-cart, .js_edit_cart_button"),
        quantity,
        $qty = $product.find("input.js_qty");
      if (!data.update_variant) {
        $buttonCart.attr("disabled", "disabled");
        $buttonCart.find(".text, .txt_add_to_cart").text(window.products.out_of_stock);
        $qty.data("max", 0);
        return;
      }
      $.each(data.json.variants_quantity, function () {
        if (this.id == data.update_variant.id) {
          quantity = this.quantity;
        }
      });
      if (quantity) {
        if (parseInt($qty.val()) > parseInt(quantity)) $qty.val(quantity);
        $qty.data("max", quantity);
        $product.find(".add-to-cart .text, .txt_add_to_cart").text(window.products.add_to_cart);
      } else if (data.update_variant.available) {
        $product.find(".add-to-cart .text, .txt_add_to_cart").text(window.products.pre_order);
        $qty.data("max", "");
      } else {
        $product.find(".add-to-cart .text, .txt_add_to_cart").text(window.products.out_of_sockt);
        $qty.data("max", 0);
      }
      $buttonCart.data("pid", data.update_variant.id);
      if ($buttonCart.length && !data.has_unselected_options) {
        data.update_variant.available
          ? $buttonCart.removeAttr("disabled data-button-status")
          : $buttonCart
              .attr("disabled", "disabled")
              .attr("data-button-status", "sold-out");
        data.update_variant.available
          ? $buttonCart.removeClass("d-none")
          : $buttonCart.addClass("d-none");
        data.update_variant.available
          ? $buttonsoldout.addClass("d-none")
          : $buttonsoldout.removeClass("d-none");
        data.update_variant.available
          ? $buyitnow.removeClass("d-none")
          : $buyitnow.addClass("d-none");
        data.update_variant.available
          ? $quantity.removeClass("d-none")
          : $quantity.addClass("d-none");
      }
    }
    updateDynamicCheckout($product, data) {
      var $button = $product.find("[data-js-product-button-dynamic-checkout]");
      if ($button.length && !data.has_unselected_options) {
        data.update_variant.available
          ? $button.removeClass("d-none")
          : $button.addClass("d-none");
      }
    }
    updatePrice($product, data) {
      var $price = $product.find("[data-js-product-price]"),
        $details = $product.find("[data-js-product-price-sale-details]"),
        details;
      if ($price.length) {
        Alothemes.ProductCurrency.setPrice(
          $price,
          data.update_variant.price,
          data.update_variant.compare_at_price
        );
      }
      if ($details.length) {
        $.each(data.json.variants_price_sale_details, function () {
          if (+this.id === +data.update_variant.id) {
            details = this.details;
          }
        });

        $details
          .html(details ? details : "")
          [details ? "removeClass" : "addClass"]("d-none");
      }
      if ($price.length || $details.length) {
        Alothemes.ProductCurrency.update();
      }
    }
    updateLabelSale($product, data) {
      var $label = $product.find("[data-js-product-label-sale]");
      if ($label.length) {
        var html = "",
          sale =
            data.update_variant.compare_at_price &&
            data.update_variant.compare_at_price > data.update_variant.price;
        $label[!sale ? "addClass" : "removeClass"]("d-none-important");
        if (sale) {
          var percent = Math.ceil(
            100 -
              (data.update_variant.price * 100) /
                data.update_variant.compare_at_price
          );
          html += window.products.product.label.sale;
          html = Shopify.addValueToString(html, {
            percent: percent,
          });
        }
        $label.html(html);
      }
    }
    updateLabelInStock($product, data) {
      var $label = $product.find("#js-pr-available");
      if ($label.length) {
        $label[!data.update_variant.available ? "addClass" : "removeClass"](
          "d-none"
        );
      }
    }
    updateLabelOutStock($product, data) {
      var $label = $product.find("#js-pr-unavailable");
      if ($label.length) {
        $label[data.update_variant.available ? "addClass" : "removeClass"](
          "d-none"
        );
      }
    }
    updateLabelHot($product, data) {
      var $label = $product.find("[data-js-product-label-hot]");
      if ($label.length) {
        $label[
          data.update_variant.metafields.labels &&
          data.update_variant.metafields.labels.hot
            ? "removeClass"
            : "addClass"
        ]("d-none-important");
      }
    }
    updateLabelNew($product, data) {
      var $label = $product.find("[data-js-product-label-new]");
      if ($label.length) {
        $label[
          data.update_variant.metafields.labels &&
          data.update_variant.metafields.labels.new
            ? "removeClass"
            : "addClass"
        ]("d-none-important");
      }
    }
    updateCountdown($product, data) {
      var $countdown = $product.find("[data-js-product-countdown]"),
        date =
          data.update_variant.metafields.countdown &&
          data.update_variant.metafields.countdown.date
            ? data.update_variant.metafields.countdown.date
            : false,
        $countdown_init,
        need_coundown;
      if ($countdown.length) {
        $countdown_init = $countdown.find(".js-countdown");
        need_coundown =
          date &&
          data.update_variant.compare_at_price &&
          data.update_variant.compare_at_price > data.update_variant.price;
        if (need_coundown && $countdown_init.attr("data-date") !== date) {
          theme.ProductCountdown.reinit($countdown_init, date);
        }
        if (!need_coundown) {
          $countdown.addClass("d-none-important");
        }
      }
    }
    updateSKU($product, data) {
      var $sku = $product.find("[data-js-product-sku]");
      if ($sku.length) {
        $sku[data.update_variant.sku ? "removeClass" : "addClass"](
          "d-none-important"
        );
        $sku.find("span").html(data.update_variant.sku);
      }
    }
    updateBarcode($product, data) {
      var $barcode = $product.find("[data-js-product-barcode]");
      if ($barcode.length) {
        $barcode[data.update_variant.barcode ? "removeClass" : "addClass"](
          "d-none-important"
        );
        $barcode.find("span").html(data.update_variant.barcode);
      }
    }
    updateAvailability($product, data) {
      var quantity,
        $availability = $product.find("[data-js-product-availability]");
      $.each(data.json.variants_quantity, function () {
        if (this.id == data.update_variant.id) {
          quantity = this.quantity;
        }
      });
      if ($availability.length) {
        var html = "";
        if (data.update_variant.available) {
          html += Shopify.addValueToString(window.products.value_in_stock_html, { count: quantity });
        } else {
          html += window.product.out_of_sockt;
        }
        $availability
          .attr("data-availability", data.update_variant.available)
          .find("span")
          .html(html);
      }
    }
    updateStockCountdown($product, data) {
      var $stock_countdown = $product.find("[data-js-product-info-stock]"),
        $title = $stock_countdown.find("[data-js-product-info-stock-title]"),
        $progress = $stock_countdown.find(
          "[data-js-product-info-stock-progress]"
        ),
        min = +$stock_countdown.attr("data-min"),
        quantity = 0;
      $.each(data.json.variants_quantity, function () {
        if (+this.id === +data.update_variant.id) quantity = +this.quantity;
      });
      if ($title) {
        $title.html(
          Shopify.addValueToString(
            window.products.stock_countdown_html,
            {
              quantity: '<span class="qty">' + quantity + "</span>",
            }
          )
        );
      }
      if ($progress) {
        $progress.width(quantity / (min / 100) + "%");
      }
      if ($stock_countdown.length) {
        $stock_countdown[
          quantity > 0 && quantity < min ? "removeClass" : "addClass"
        ]("d-none-important");
      }
    }
    updateGallery($product, data) {
      var $gallery = $product.find("[data-js-product-gallery]"),
        $for_option = $gallery.find("[data-js-for-option]"),
        image;

      console.log('>>> updateGallery', data);
      if (data.update_variant.option1) {
        $for_option.each(function () {
          var $this = $(this);
          $this[
            $this.attr("data-js-for-option") ===
            Shopify.handleize(data.update_variant.option1)
              ? "removeClass"
              : "addClass"
          ]("d-none");
        });
        if (!$for_option.filter(":not(.d-none)").length) {
          $for_option.removeClass("d-none");
        }
      }
      if ($gallery.find(".fotorama").length) {
        if (data.update_variant.featured_media) {
          image = data.update_variant.featured_media;
        } else if (data.json.media[0]) {
          image = data.json.media[0];
        }
        $gallery.productGallery("switchImageById", image.id);
      }
      // var media = data.update_variant.featured_media;
      // if (media && media.hasOwnProperty("id")) {
      //   $("#thumb_img_" + media.id).trigger("click");
      // }
    }
    updateLinks($product, data) {
      var url =
        decodeURIComponent(window.location.origin) +
        "/products/" +
        data.json.handle +
        "?variant=" +
        data.update_variant.id;
      $product
        .find('a[href*="products/' + data.json.handle + '"]')
        .attr("href", url);
    }
    updateHistory($product, data) {
      if (!data.has_unselected_options) {
        var url =
          window.location.href.split("?")[0] +
          "?variant=" +
          data.update_variant.id;
        history.replaceState({ foo: "product" }, url, url);
      }
    }
  }

  customElements.define("product-options", ProductOptions);
}