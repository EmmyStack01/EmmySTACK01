const paymentForm = document.getElementById('paymentForm');
let currentType = 'coffee';

function setType(type) {
    currentType = type;
    const btns = document.querySelectorAll('.type-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const amountInput = document.getElementById('amount');
    if(type === 'coffee') {
        amountInput.value = 5000; // Default coffee price
        amountInput.placeholder = "Support with any amount";
    } else {
        amountInput.value = "";
        amountInput.placeholder = "Enter project fee";
    }
}

paymentForm.addEventListener("submit", function(e) {
    e.preventDefault();

    let handler = PaystackPop.setup({
        key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5', // REPLACE WITH YOUR PUBLIC KEY
        email: document.getElementById("email-address").value,
        amount: document.getElementById("amount").value * 100, // Paystack uses Kobo
        currency: "NGN",
        ref: 'ES' + Math.floor((Math.random() * 1000000000) + 1), 
        metadata: {
            custom_fields: [
                {
                    display_name: "Payment Type",
                    variable_name: "payment_type",
                    value: currentType
                }
            ]
        },
        callback: function(response) {
            alert('Payment successful! Reference: ' + response.reference);
            window.location.href = "success.html"; // Optional success page
        },
        onClose: function() {
            alert('Window closed.');
        }
    });

    handler.openIframe();
});
