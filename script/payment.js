<script src="https://js.paystack.co/v1/inline.js"></script>
<script>
const paymentForm = document.getElementById('paymentForm');
const paystackPop = new PaystackPop(); // Create one instance
let currentType = 'coffee';

// 1. Handle UI Selection (Coffee vs Project)
function setType(type) {
    currentType = type;
    const btns = document.querySelectorAll('.type-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    // Ensure we find the button even if a span inside it was clicked
    const clickedBtn = event.currentTarget || event.target.closest('.type-btn');
    if(clickedBtn) clickedBtn.classList.add('active');
    
    const amountInput = document.getElementById('amount');
    if(type === 'coffee') {
        amountInput.value = 5000; 
        amountInput.placeholder = "Support with any amount";
    } else {
        amountInput.value = "";
        amountInput.placeholder = "Enter project fee";
    }
}

// 2. The Combined Payment Logic
async function processPayment(e) {
    if (e) e.preventDefault();

    const email = document.getElementById("email-address").value;
    const amountValue = document.getElementById("amount").value;

    if (!email || !amountValue) {
        alert("Please fill in all fields.");
        return;
    }

    // Trigger the combined request (Apple Pay + Standard Checkout)
    await paystackPop.paymentRequest({
        key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5', 
        email: email,
        amount: amountValue * 100, 
        currency: "NGN",
        ref: 'ES' + Math.floor((Math.random() * 1000000000) + 1),
        container: 'paystack-apple-pay', // Where the Apple Pay button appears
        loadPaystackCheckoutButton: 'paystack-other-channels', // Your existing green button ID
        metadata: {
            custom_fields: [
                {
                    display_name: "Payment Type",
                    variable_name: "payment_type",
                    value: currentType
                }
            ]
        },
        style: {
            theme: 'dark',
            applePay: {
                width: '100%',
                height: '50px',
                borderRadius: '8px',
                type: 'pay'
            }
        },
        onSuccess(response) {
            console.log('Success!', response);
            window.location.href = "success.html";
        },
        onCancel() {
            console.log('Payment window closed.');
        },
        onError(error) {
            console.error('Payment Error:', error);
        }
    });
}

// 3. Attach event listeners
paymentForm.addEventListener("submit", processPayment);

// Optional: Call processPayment() on page load to initialize the Apple Pay button visibility
// though Paystack usually handles this via the container ID.
</script>
        
