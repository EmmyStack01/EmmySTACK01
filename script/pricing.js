function downloadPricing() {
    const choice = confirm("Would you like the International (USD) pricing? \n\n(Cancel for Local NGN pricing)");
    
    if (choice) {
        window.open('assets/Emmy STACK01 Dollar Modular Pricing.png', '_blank');
    } else {
        window.open('assets/Emmy STACK01 Naira Modular Pricing.png', '_blank');
    }
}