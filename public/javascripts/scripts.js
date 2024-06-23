

function addtoCart(proId) {
  $.ajax({
    url: '/add-to-cart/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        let count = $('#cartcount').html();
        count = parseInt(count) + 1;
        $('#cartcount').html(count);

        // Show modal with animation
        $('#addToCartModal').modal('show');

        // Optional: You can add a delay and hide the modal after a few seconds
        setTimeout(() => {
          $('#addToCartModal').modal('hide');
        }, 3000); // Adjust timing as per your preference
      }
    }
  });
}



function changeQuantity(cartId, proId, userId, count) {
  let itemQuantity = $(`#itemQuantity-${proId}`);
  let newQuantity = parseInt(itemQuantity.text()) + count;

  if (newQuantity <= 0) {
    $('#removeCartItemModal').modal('show');

    // Event listener for the modal's confirm button
    $('#confirmRemoveCartItem').on('click', function () {
      updateQuantityOnServer(cartId, proId, userId, count);
      itemQuantity.closest('tr').remove();
      location.reload();
    });
  } else {
    updateQuantityOnServer(cartId, proId, userId, count);
    itemQuantity.text(newQuantity);
  }

  checkCartEmpty();
}

function updateQuantityOnServer(cartId, proId, userId, count) {
  $.ajax({
    url: '/change-product-quantity',
    method: 'POST',
    data: {
      user: userId,
      cart: cartId,
      product: proId,
      count: count
    },
    success: function (response) {
      if (response.status) {
        document.getElementById('total').innerHTML = response.total;
        location.reload()
      } else {
        alert('Failed to update quantity');
      }
    },
    error: function (xhr, status, error) {
      alert('Error: ' + error);
    }
  });
}






function removeFromCart(cartId, proId) {
  $('#removeCartItemModal').modal('show');

  $('#confirmRemoveCartItem').on('click', function () {
    $.ajax({
      url: '/remove-from-cart',
      method: 'POST',
      data: {
        cart: cartId,
        product: proId
      },
      success: function (response) {
        if (response.status) {
          $(`#itemQuantity-${proId}`).closest('tr').remove(); // Remove the row from the table
          location.reload(); // Optional: Reload the page after successful removal
          checkCartEmpty(); // Check if the cart is empty after removal
        } else {
          alert('Failed to remove product from cart');
        }
      },
      error: function (xhr, status, error) {
        alert('Error: ' + error);
      }
    });
  });
}


function checkCartEmpty() {
  // Check if all cart rows are removed
  if ($('.table tbody tr').length === 0) {
    // Display a message or handle UI to show cart is empty
    $('.table').replaceWith('');
    $('.container').replaceWith('');

    $('.Empty').replaceWith('<div style="margin-top: 100px;display:flex; align-items: center;flex-direction: column;" class ="row"><h1 style="font-size: xx-large;font-weight: bold;" class="text-center">Cart is empty</h1> <br> <a style="max-width: 140px;" href="/" class="btn btn-primary text-center">Back To Home </a></div>');
  }
}
