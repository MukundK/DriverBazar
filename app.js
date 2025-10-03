// =============================================
// NETBAZCO MAIN HOMEPAGE APPLICATION  
// =============================================

// Application Data
const NetBazCoApp = {
    // Service definitions with all 16 services
    services: [
        {
            id: "A",
            name: "Mobility Related Services",
            description: "Transportation and movement services",
            "services": [
                {"name": "Driverbazar", "description": "Professional driving services", "url": "driver-bazar.html"},
                //{"name": "Walkerbazar", "description": "Walking assistance and mobility support"},
                {"name": "Moverbazar", "description": "Moving and relocation services"},
                {"name": "Truckerbazar", "description": "Commercial trucking and freight services"}
                
            ]
        },
        {
            id: "B", 
            name: "Daily Living Services",
            description: "Household and maintenance services",
            "services": [
                {"name": "Carerbazar", "description": "Personal care and assistance services"},
                {"name": "Waiterbazar", "description": "Food service and hospitality support"},
                {"name": "Cleanerbazar", "description": "Cleaning and maintenance services"}
                //{"name": "Painterbazar", "description": "Painting and home improvement services"}
            ]
        },
        {
            id: "C",
            name: "Personal Needs Services", 
            description: "Individual development services",
            "services": [
                {"name": "Prayerbazar", "description": "Spiritual and religious services"},
                {"name": "Trainerbazar", "description": "Fitness and personal training services"},
                {"name": "Teacherbazar", "description": "Educational and tutoring services"}
                //{"name": "Realtorbazar", "description": "Real estate and property services"}
            ]
        },
        {
            id: "D",
            name: "Professional Services",
            description: "Specialized professional services", 
            "services": [
                {"name": "Actorbazar", "description": "Entertainment and performance services"},
                {"name": "Painterbazar", "description": "Paiting and other artistic services"},
                {"name": "Realtorbazar", "description": "Real Estate related services"}
                //{"name": "Adviserbazar", "description": "Professional consulting and advisory services"}
            ]
        }
    ]
};

// =============================================
// APPLICATION INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('NetBazCo Main Application Starting...');
    
    // Render main homepage services
    renderServices();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('NetBazCo Main Application Ready!');
}

// =============================================
// SERVICES RENDERING
// =============================================
function renderServices() {
    const servicesGrid = document.getElementById('services-grid');
    if (!servicesGrid) return;

    servicesGrid.innerHTML = NetBazCoApp.services.map(service => `
        <div class="service-card" data-service-id="${service.id}">
            <div class="service__icon"><div class="icon-car">
                <i class="${getServiceIcon(service.id)}"></i>
            </div></div>
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            <button class="service-btn" data-service-id="${service.id}">
                View Services
            </button>
        </div>
    `).join('');
}

function getServiceIcon(serviceId) {
    const icons = {
        'A': 'fas fa-car',
        'B': 'fas fa-home', 
        'C': 'fas fa-user',
        'D': 'fas fa-briefcase'
    };
    return icons[serviceId] || 'fas fa-circle';
}

function renderSubServices(serviceId) {
    const subServicesContainer = document.getElementById('sub-services');
    if (!subServicesContainer) return;

    const service = NetBazCoApp.services.find(s => s.id === serviceId);
    if (!service) return;

    subServicesContainer.innerHTML = `
        <div class="sub-services-section">
            <h2>${service.name}</h2>
            <div class="sub-services-grid">
                ${service.services.map(subService => `
                    <div class="sub-service-card">
                        <div class="sub-service-icon">
                            <i class="${getSubServiceIcon(subService.name)}"></i>
                        </div>
                        <h4>${subService.name}</h4>
                        <p>${subService.description}</p>
                        ${subService.url ? 
                            `<button class="sub-service-link-btn" data-url="${subService.url}">
                                <i class="fas fa-external-link-alt"></i> Visit ${subService.name}
                            </button>` :
                            `<button class="sub-service-btn" data-service-name="${subService.name}">
                                Book Now
                            </button>`
                        }
                    </div>
                `).join('')}
            </div>
            <button class="back-btn" onclick="hideSubServices()">
                <i class="fas fa-arrow-left"></i> Back to Main Services
            </button>
        </div>
    `;

    subServicesContainer.style.display = 'block';
    subServicesContainer.scrollIntoView({ behavior: 'smooth' });
}

function getSubServiceIcon(serviceName) {
    const icons = {
        'Driverbazar': 'fas fa-car',
        'Walkerbazar': 'fas fa-walking',
        'Truckerbazar': 'fas fa-truck', 
        'Moverbazar': 'fas fa-boxes',
        'Carerbazar': 'fas fa-heart',
        'Waiterbazar': 'fas fa-utensils',
        'Cleanerbazar': 'fas fa-broom',
        'Painterbazar': 'fas fa-paint-brush',
        'Prayerbazar': 'fas fa-pray',
        'Trainerbazar': 'fas fa-dumbbell',
        'Teacherbazar': 'fas fa-chalkboard-teacher',
        'Realtorbazar': 'fas fa-building',
        'Actorbazar': 'fas fa-theater-masks',
        'Doctorbazar': 'fas fa-stethoscope', 
        'Lawyerbazar': 'fas fa-gavel',
        'Adviserbazar': 'fas fa-handshake'
    };
    return icons[serviceName] || 'fas fa-circle';
}

function hideSubServices() {
    const subServicesContainer = document.getElementById('sub-services');
    if (subServicesContainer) {
        subServicesContainer.style.display = 'none';
        subServicesContainer.innerHTML = '';
    }
    
    // Scroll back to main services
    document.getElementById('services-grid').scrollIntoView({ behavior: 'smooth' });
}

// =============================================
// EVENT LISTENERS  
// =============================================
function setupEventListeners() {
    // Service card click handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('service-btn')) {
            const serviceId = e.target.getAttribute('data-service-id');
            renderSubServices(serviceId);
        }
        
        if (e.target.classList.contains('sub-service-btn')) {
            const serviceName = e.target.getAttribute('data-service-name');
            handleSubServiceClick(serviceName);
        }
        
        // Handle external links (like DriverBazar)
        if (e.target.classList.contains('sub-service-link-btn')) {
            const url = e.target.getAttribute('data-url');
            handleExternalLink(url);
        }
    });
}

function handleSubServiceClick(serviceName) {
    if (serviceName === 'Driverbazar') {
        // Redirect to login page
        window.location.href = 'driver-bazar-login.html';
    } else {
        // Placeholder for other services
        alert(`Booking ${serviceName}... This feature is coming soon!`);
        console.log(`User clicked on ${serviceName}`);
    }
}

function handleExternalLink(url) {
    // Special handling for driver-bazar - redirect to login first
    if (url === 'driver-bazar.html') {
        // Check if user is already logged in
        const isLoggedIn = sessionStorage.getItem('driverBazarLoggedIn');
        if (isLoggedIn === 'true') {
            window.open(url, '_blank');
        } else {
            // Redirect to login page
            window.location.href = 'driver-bazar-login.html';
        }
    } else {
        window.open(url, '_blank');
    }
    console.log(`Opening link: ${url}`);
}
