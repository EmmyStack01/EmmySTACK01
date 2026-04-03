let currentType = 'coffee'; // Default type
const paymentForm = document.getElementById('paymentForm');
const paystackPop = new PaystackPop(); 


/**
 * 1. UI Selection Logic
 * Handles switching between "Buy Coffee" and "Project Pay"
 */
function setType(type, event) {
    currentType = type;
    
    // Update active button styles
    const btns = document.querySelectorAll('.type-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    // Safety check for the clicked element
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

/**
 * 2. Integrated Payment Logic
 * This single function initializes Apple Pay visibility 
 * AND handles the manual Paystack button click.
 */
async function processPayment(e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    const email = document.getElementById("email-address").value;
    const amountValue = document.getElementById("amount").value;

    if (!email || !amountValue) {
        alert("Please fill in your email and amount.");
        return;
    }

    // Trigger the integrated request
    await paystackPop.paymentRequest({
        key: 'pk_live_aeec89eec2bf1d7aa2d009951872e81e9e5329e5', 
        email: email,
        amount: amountValue * 100, // Conversion to Kobo
        currency: "NGN",
        ref: 'ES' + Math.floor((Math.random() * 1000000000) + 1),
        
        // UI Container Hooks
        container: 'paystack-apple-pay', 
        loadPaystackCheckoutButton: 'paystack-other-channels', 

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
            console.log('Transaction Successful:', response);
            window.location.href = "success.html";
        },
        onCancel() {
            console.log('User closed the payment window.');
        },
        onError(error) {
            console.error('Paystack Error:', error);
            alert("Something went wrong with the payment initialization.");
        }
    });
}

// 3. Attach the form listener
paymentForm.addEventListener("submit", processPayment);
    
