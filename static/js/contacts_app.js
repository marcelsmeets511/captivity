// Contacts App JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Update the time in the status bar
    function updateTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        
        // Format the time as HH:MM
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        document.getElementById('status-time').textContent = hours + ':' + minutes;
    }
    
    // Update time immediately and then every minute
    updateTime();
    setInterval(updateTime, 60000);
    
    // Alphabet index scrolling (simplified)
    const indexItems = document.querySelectorAll('.index-item');
    indexItems.forEach(item => {
        item.addEventListener('click', () => {
            const letter = item.textContent;
            const letterElement = document.querySelector(`.index-letter:contains('${letter}')`);
            if (letterElement) {
                letterElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Search functionality (simplified)
    const searchInput = document.querySelector('.search-input');
    const contactItems = document.querySelectorAll('.contact-item');
    
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        
        contactItems.forEach(item => {
            const name = item.querySelector('.contact-name').textContent.toLowerCase();
            if (name.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Function to show contact details
function showContactDetails(name, phone) {
    const contactDetails = document.getElementById('contact-details');
    const contactNameDisplay = document.getElementById('contact-name-display');
    const contactInitial = document.getElementById('contact-initial');
    const contactPhone = document.getElementById('contact-phone');
    
    contactNameDisplay.textContent = name;
    contactInitial.textContent = name.charAt(0);
    contactPhone.textContent = phone;
    
    contactDetails.classList.remove('hidden');
}

// Function to hide contact details
function hideContactDetails() {
    const contactDetails = document.getElementById('contact-details');
    contactDetails.classList.add('hidden');
}
