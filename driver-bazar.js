// ====================================================
// NETBAZCO DRIVER BAZAR APPLICATION - FINAL & COMPLETE
// ====================================================

(function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('driverBazarLoggedIn');
    if (isLoggedIn !== 'true') {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // Get user info if logged in
    const userInfo = JSON.parse(sessionStorage.getItem('driverBazarUser') || '{}');
    console.log('Logged in user:', userInfo);
})();

// Add logout functionality
function logout() {
    sessionStorage.removeItem('driverBazarLoggedIn');
    sessionStorage.removeItem('driverBazarUser');
    window.location.href = 'driver-bazar-login.html';
}

// Update the goHome function to maintain session
function goHome() {
    // Keep the session but go back to main page
    window.location.href = 'index.html';
}

const DriverBazarApp = {
    currentService: null,
    user: {
        role: 'owner', // 'driver' | 'owner' | 'fleetBusiness'
    },
    // Mock data for demonstration purposes
    sampleLocations: [
        { name: "Times Square", address: "Times Square, New York, NY 10036" },
        { name: "Central Park", address: "Central Park, New York, NY 10024" },
    ],
    // FIX: Added mock data for drivers and driver-vehicle combos
    mockData: {
        drivers: [
            { id: 'd1', name: 'John D.', rating: 4.8, experience: 5, specialties: 'City, Airport', hourlyRate: 25 },
            { id: 'd2', name: 'Mike R.', rating: 4.9, experience: 8, specialties: 'Long-distance', hourlyRate: 30 },
            { id: 'd3', name: 'Sarah K.', rating: 4.7, experience: 3, specialties: 'Events, VIP', hourlyRate: 28 }
        ],
        driverVehicles: [
            { id: 'dv1', driverName: 'Alex G.', vehicle: 'Toyota Camry (2023)', rating: 4.9, price: 45 },
            { id: 'dv2', driverName: 'Maria S.', vehicle: 'Ford Explorer (2022)', rating: 4.8, price: 60 },
            { id: 'dv3', driverName: 'Chen W.', vehicle: 'Mercedes-Benz S-Class', rating: 5.0, price: 120 }
        ]
    },
    fleetRideRequests: [
        { id: 'req1', serviceType: 'ride', vehicleType: 'SUV', pickupTime: '14:00', location: 'JFK Airport', rideType: 'Within City', estimatedFare: 65.00, status: 'pending' },
        { id: 'req2', serviceType: 'driver-only', vehicleType: 'N/A', pickupTime: '18:00', location: 'Times Square', rideType: 'Overnight (2 days)', estimatedFare: 320.00, status: 'pending' },
    ],
    myDrivers: [], // Will be loaded from localStorage
    myVehicles: [], // Will be loaded from localStorage
    state: {
        currentBookingStep: 1,
        assetsMode: null,
        booking: {},
        fleet: {
            activeAssignmentRequestId: null,
            selectedDriverId: null,
            selectedVehicleId: null,
            manageAssets: {
                currentMonth: new Date().getMonth(),
                currentYear: new Date().getFullYear(),
                selectedDate: null
            }
        },
        ownerAssets: {
            editingVehicleId: null,
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            selectedDate: null
        }
    }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeDriverBazar();
});

function initializeDriverBazar() {
    loadAssetsFromStorage();
    renderSampleLocations();
    hideBookingSection();
    updateRoleSections();
    renderFleetRequests(); // Render initial fleet requests
    console.log('Driver Bazar Application Ready!');
}

// ============================================
// LOCAL STORAGE PERSISTENCE
// ============================================
function saveAssetsToStorage() {
    try {
        localStorage.setItem('driverBazarMyDrivers', JSON.stringify(DriverBazarApp.myDrivers));
        localStorage.setItem('driverBazarMyVehicles', JSON.stringify(DriverBazarApp.myVehicles));
        console.log("Assets saved to storage.");
    } catch (e) {
        console.error("Could not save assets to local storage:", e);
    }
}

function loadAssetsFromStorage() {
    try {
        DriverBazarApp.myDrivers = JSON.parse(localStorage.getItem('driverBazarMyDrivers') || '[]');
        DriverBazarApp.myVehicles = JSON.parse(localStorage.getItem('driverBazarMyVehicles') || '[]');
        console.log("Assets loaded from storage.");
    } catch (e) {
        console.error("Could not load assets from local storage:", e);
        DriverBazarApp.myDrivers = [];
        DriverBazarApp.myVehicles = [];
    }
}

// ============================================
// CORE UI & SERVICE SELECTION
// ============================================
function selectService(service) {
    DriverBazarApp.currentService = service;
    const bookingSection = document.querySelector('.booking__section');
    const profileSwitcher = document.getElementById('profile-switcher');
    const roleDashboards = document.getElementById('role-dashboards');

    document.querySelectorAll('.service__option').forEach(opt => opt.classList.remove('active'));
    document.querySelector(`[data-service="${service}"]`).classList.add('active');

    if (service === 'assets') {
        bookingSection.style.display = 'none';
        profileSwitcher.style.display = 'block';
        roleDashboards.style.display = 'block';
    } else {
        bookingSection.style.display = 'block';
        profileSwitcher.style.display = 'none';
        roleDashboards.style.display = 'none';
    }
    // FIX: Reset to step 1 when a new service is selected
    goToStep(1);
    DriverBazarApp.state.booking = {}; // Clear previous booking details
    document.getElementById('service-location').value = '';
    document.getElementById('service-duration').value = '';
    updateStep1Button();
}

function goHome() {
    window.location.reload();
}

function hideBookingSection() {
    document.querySelector('.booking__section').style.display = 'none';
}

function renderSampleLocations() {
    const locationsContainer = document.getElementById('location-buttons');
    if (!locationsContainer) return;
    locationsContainer.innerHTML = DriverBazarApp.sampleLocations.map(loc =>
        `<button class="btn btn-sm btn-secondary" onclick="setServiceLocation('${loc.address}')">${loc.name}</button>`
    ).join('');
}

function setServiceLocation(address) {
    const locationInput = document.getElementById('service-location');
    locationInput.value = address;
    updateServiceLocation(address); // Manually trigger update
}

// ============================================
// BOOKING FLOW NAVIGATION (STEP MANAGEMENT)
// ============================================
function nextStep() {
    const currentStep = DriverBazarApp.state.currentBookingStep;
    const service = DriverBazarApp.currentService;
    let nextStepNumber = currentStep + 1;

    // FIX: Logic to skip Step 2 and go directly to Step 3
    if (currentStep === 1 && (service === 'service' || service === 'hire-driver')) {
        nextStepNumber = 3; // Skip to Step 3 (Select Provider)
        
        // Show loading spinner while we "fetch" providers
        document.getElementById('drivers-loading').style.display = 'block';
        document.getElementById('drivers-only-section').style.display = 'none';
        document.getElementById('drivers-with-vehicle-section').style.display = 'none';

        setTimeout(() => {
            document.getElementById('drivers-loading').style.display = 'none';
            if (service === 'service') { // "Book a Service"
                document.getElementById('step3-title').textContent = 'Select Driver with Vehicle';
                document.getElementById('drivers-with-vehicle-section').style.display = 'block';
                renderDriverWithVehicleList();
            } else { // "Hire a Driver"
                document.getElementById('step3-title').textContent = 'Select a Driver';
                document.getElementById('drivers-only-section').style.display = 'block';
                renderDriverOnlyList();
            }
        }, 1500); // Simulate network delay
    }
    
    goToStep(nextStepNumber);
}

function previousStep() {
    const currentStep = DriverBazarApp.state.currentBookingStep;
    const service = DriverBazarApp.currentService;
    let prevStepNumber = currentStep - 1;

    // FIX: If we are on step 3, the previous step is 1
    if (currentStep === 3 && (service === 'service' || service === 'hire-driver')) {
        prevStepNumber = 1;
    }
    
    goToStep(prevStepNumber);
}

function goToStep(stepNumber) {
    DriverBazarApp.state.currentBookingStep = stepNumber;
    
    // Hide all panels
    document.querySelectorAll('.step__panel').forEach(panel => panel.classList.remove('active'));
    // Show the current panel
    document.getElementById(`step${stepNumber}-panel`).classList.add('active');

    // Update progress indicators
    document.querySelectorAll('.step__indicator').forEach(indicator => {
        const step = parseInt(indicator.id.replace('step', ''));
        if (step < stepNumber) {
            indicator.classList.add('completed');
            indicator.classList.remove('active');
        } else if (step === stepNumber) {
            indicator.classList.add('active');
            indicator.classList.remove('completed');
        } else {
            indicator.classList.remove('active', 'completed');
        }
    });
}

// ============================================
// PROVIDER RENDERING
// ============================================
function renderDriverOnlyList() {
    const container = document.getElementById('drivers-list');
    container.innerHTML = DriverBazarApp.mockData.drivers.map(driver => `
        <div class="driver__card" onclick="selectProvider('${driver.id}', 'driver-only')">
            <div class="driver__avatar"><i class="fas fa-user-circle"></i></div>
            <div class="driver__info">
                <h4>${driver.name}</h4>
                <p><i class="fas fa-star"></i> ${driver.rating} | ${driver.experience} yrs exp.</p>
                <p class="specialties">${driver.specialties}</p>
            </div>
            <div class="driver__rate">
                <span class="price">$${driver.hourlyRate}/hr</span>
                <button class="btn btn-sm btn-primary">Select</button>
            </div>
        </div>
    `).join('');
}

function renderDriverWithVehicleList() {
    const container = document.getElementById('hire-drivers-list');
    // FIX: Changed to use the 'driver__card' structure for a consistent look.
    container.innerHTML = DriverBazarApp.mockData.driverVehicles.map(item => `
        <div class="driver__card" onclick="selectProvider('${item.id}', 'driver-with-vehicle')">
            <div class="driver__avatar"><i class="fas fa-user-circle"></i></div>
            <div class="driver__info">
                <h4>${item.driverName}</h4>
                <p><i class="fas fa-star"></i> ${item.rating} | <strong>Vehicle:</strong> ${item.vehicle}</p>
            </div>
            <div class="driver__rate">
                <span class="price">$${item.price}/hr</span>
                <button class="btn btn-sm btn-primary">Select</button>
            </div>
        </div>
    `).join('');
}

function selectProvider(providerId, type) {
    DriverBazarApp.state.booking.providerId = providerId;
    DriverBazarApp.state.booking.providerType = type;
    
    // Highlight the selected provider
    const selector = '.driver__card'; // Use the same selector for both
    document.querySelectorAll(selector).forEach(card => card.classList.remove('selected'));
    event.currentTarget.classList.add('selected');

    // Enable the next button
    document.getElementById('step3-next').disabled = false;
}


// ============================================
// ROLE & DASHBOARD MANAGEMENT
// ============================================
function switchRole(role) {
    DriverBazarApp.user.role = role;
    updateRoleSections();
}

function updateRoleSections() {
    const { role } = DriverBazarApp.user;
    const roles = ['owner', 'driver', 'fleetBusiness'];
    roles.forEach(r => {
        const button = document.getElementById(`${r}-btn`);
        const panel = document.getElementById(r === 'fleetBusiness' ? 'fleet-business-panel' : `${r}-panel`);
        if (button) button.className = role === r ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
        if (panel) panel.style.display = role === r ? 'block' : 'none';
    });
    document.getElementById('current-role').textContent = {
        owner: 'Owner Mode',
        driver: 'Driver Mode',
        fleetBusiness: 'Fleet Business'
    }[role];
}

function updateServiceLocation(location) {
    DriverBazarApp.state.booking.serviceLocation = location;
    updateStep1Button();
}

function updateServiceDuration(duration) {
    DriverBazarApp.state.booking.serviceDuration = duration;
    updateStep1Button();
}

function updateStep1Button() {
    const btn = document.getElementById('step1-next');
    const b = DriverBazarApp.state.booking;
    const s = DriverBazarApp.currentService;
    let ok = false;

    if (s === 'service' || s === 'hire-driver') {
        ok = b.serviceLocation && b.serviceDuration;
    } else if (s === 'assets') {
        ok = (DriverBazarApp.state.assetsMode === 'driver' && b.selectedMyDriver) ||
             (DriverBazarApp.state.assetsMode === 'vehicle' && b.selectedMyVehicle);
    }

    if (btn) btn.disabled = !ok;
}

// Make sure Step 1 content (service-section) shows for both 'service' and 'hire-driver'
function updateSectionVisibility() {
    const s = DriverBazarApp.currentService;
    document.getElementById('service-section').classList.toggle('active', s === 'service' || s === 'hire-driver');
    document.getElementById('assets-section').classList.toggle('active', s === 'assets');
}

// ============================================
// FLEET BUSINESS: RIDE ASSIGNMENT
// ============================================
function renderFleetRequests() {
    const container = document.getElementById('fleet-requests-list');
    if (!container) return;

    container.innerHTML = DriverBazarApp.fleetRideRequests.map(req => {
        const statusClass = req.status === 'assigned' ? 'status-assigned' : 'status-pending';
        return `
            <div class="card request-card ${statusClass}">
                <div class="request-card__header">
                    <span class="request-card__service">${req.serviceType === 'ride' ? 'Ride Request' : 'Driver Hire'} - ${req.location}</span>
                    <span class="request-card__fare">$${req.estimatedFare.toFixed(2)}</span>
                </div>
                <div class="request-card__body">
                    <p><i class="fas fa-clock"></i>Pickup: ${req.pickupTime}</p>
                    <p><i class="fas fa-info-circle"></i>Status: <span class="status-badge">${req.status}</span></p>
                </div>
                <div class="request-card__actions">
                    ${req.status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="openRideAssignmentModal('${req.id}')">Assign</button>` : ''}
                </div>
            </div>
        `;
    }).join('') || '<p>No incoming ride requests.</p>';
}

function openRideAssignmentModal(requestId) {
    const modal = document.getElementById('ride-assignment-modal');
    if (!modal) return;
    const request = DriverBazarApp.fleetRideRequests.find(r => r.id === requestId);
    if (!request) return;

    DriverBazarApp.state.fleet.activeAssignmentRequestId = requestId;
    DriverBazarApp.state.fleet.selectedDriverId = null;
    DriverBazarApp.state.fleet.selectedVehicleId = null;

    renderAssignmentDetails(request);
    renderAssignableDrivers(request);
    renderAssignableVehicles(request);
    
    document.getElementById('assign-ride-btn').disabled = true;
    modal.style.display = 'flex';
}

function closeRideAssignmentModal() {
    document.getElementById('ride-assignment-modal').style.display = 'none';
}

function renderAssignmentDetails(request) {
    document.getElementById('assignment-ride-details').innerHTML = `
        <p><strong>Location:</strong> ${request.location}</p>
        <p><strong>Time:</strong> ${request.pickupTime}</p>
        <p><strong>Service:</strong> ${request.serviceType}</p>
        <p><strong>Fare:</strong> $${request.estimatedFare.toFixed(2)}</p>
    `;
}

function renderAssignableDrivers() {
    const container = document.getElementById('assignment-driver-list');
    const fleetDrivers = DriverBazarApp.myDrivers.filter(d => d.ownerType === 'fleet');
    container.innerHTML = fleetDrivers.map(driver => `
        <div class="assignment__item ${DriverBazarApp.state.fleet.selectedDriverId === driver.id ? 'selected' : ''}" 
             onclick="selectAssignableAsset('driver', '${driver.id}')">
            <strong>${driver.name}</strong>
            <span>Rate: $${driver.hourlyRate}/hr</span>
        </div>
    `).join('') || '<p>No drivers in your fleet. Add one via "Add Driver".</p>';
}

function renderAssignableVehicles() {
    const container = document.getElementById('assignment-vehicle-list');
    const fleetVehicles = DriverBazarApp.myVehicles.filter(v => v.ownerType === 'fleet');
    container.innerHTML = fleetVehicles.map(vehicle => `
        <div class="assignment__item ${DriverBazarApp.state.fleet.selectedVehicleId === vehicle.id ? 'selected' : ''}"
             onclick="selectAssignableAsset('vehicle', '${vehicle.id}')">
            <strong>${vehicle.year} ${vehicle.make} ${vehicle.model}</strong>
            <span>${vehicle.licensePlate}</span>
        </div>
    `).join('') || '<p>No vehicles in your fleet. Add one via "Add Vehicle".</p>';
}

function selectAssignableAsset(type, id) {
    if (type === 'driver') {
        DriverBazarApp.state.fleet.selectedDriverId = id;
        renderAssignableDrivers(); 
    } else if (type === 'vehicle') {
        DriverBazarApp.state.fleet.selectedVehicleId = id;
        renderAssignableVehicles();
    }
    checkAssignmentCompletion();
}

function checkAssignmentCompletion() {
    const { selectedDriverId, selectedVehicleId, activeAssignmentRequestId } = DriverBazarApp.state.fleet;
    const request = DriverBazarApp.fleetRideRequests.find(r => r.id === activeAssignmentRequestId);
    if (!request) return;

    const driverSelected = !!selectedDriverId;
    const vehicleSelected = request.serviceType === 'ride' ? !!selectedVehicleId : true;

    document.getElementById('assign-ride-btn').disabled = !(driverSelected && vehicleSelected);
}

function confirmRideAssignment() {
    const { activeAssignmentRequestId } = DriverBazarApp.state.fleet;
    const request = DriverBazarApp.fleetRideRequests.find(r => r.id === activeAssignmentRequestId);
    if (request) {
        request.status = 'assigned';
        console.log(`Ride ${request.id} assigned with Driver ${DriverBazarApp.state.fleet.selectedDriverId} and Vehicle ${DriverBazarApp.state.fleet.selectedVehicleId}`);
        renderFleetRequests(); 
    }
    closeRideAssignmentModal();
}
// --------------------------------------------
// DRIVER APPLICATION MODAL
// --------------------------------------------
function setupDriverApplicationModal() {
    const form = document.getElementById('driver-application-form');
    if (form) {
        form.addEventListener('submit', handleDriverApplicationSubmit);
    }
}

function onApplyDriver() {
    showDriverApplicationModal();
}

function showDriverApplicationModal() {
    const modal = document.getElementById('driver-application-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeDriverApplicationModal() {
    const modal = document.getElementById('driver-application-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        resetDriverApplicationForm();
    }
}

function resetDriverApplicationForm() {
    const form = document.getElementById('driver-application-form');
    if (form) {
        form.reset();
        ['aadhar', 'license', 'insurance'].forEach(docType => {
            removeFile(docType);
        });
    }
}

function handleDriverApplicationSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const applicationData = {
        id: 'app_' + Date.now(),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dateOfBirth: formData.get('dateOfBirth'),
        sex: formData.get('sex'),
        address: formData.get('address'),
        experience: formData.get('experience'),
        languages: formData.get('languages'),
        vehicleTypes: formData.getAll('vehicleTypes'),
        workScope: formData.getAll('workScope'),
        otherSkills: formData.getAll('otherSkills'),
        documents: DriverBazarApp.uploadedDocuments,
        submittedAt: new Date().toISOString()
    };
    
    // Validate required fields
    if (!applicationData.firstName || !applicationData.lastName || !applicationData.dateOfBirth || 
        !applicationData.sex || !applicationData.address || !applicationData.experience || 
        !applicationData.languages || applicationData.vehicleTypes.length === 0 || 
        applicationData.workScope.length === 0) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }
    
    // Validate required documents
    if (!DriverBazarApp.uploadedDocuments.aadhar || !DriverBazarApp.uploadedDocuments.license || 
        !DriverBazarApp.uploadedDocuments.insurance) {
        alert('Please upload all required documents (Aadhar Card, Driver\'s License, and Insurance Copy)');
        return;
    }
    
    // Show loading
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
    
    // Simulate API call
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
        
        storeDriverApplication(applicationData);
        closeDriverApplicationModal();
        showNotification(`Application submitted successfully! Reference: ${applicationData.id}`);
        console.log('Driver Application Submitted:', applicationData);
    }, 2000);
}

function storeDriverApplication(applicationData) {
    try {
        let applications = JSON.parse(localStorage.getItem('driverApplications') || '[]');
        applications.push(applicationData);
        localStorage.setItem('driverApplications', JSON.stringify(applications));
    } catch (error) {
        console.error('Error storing driver application:', error);
    }
}

// --------------------------------------------
// VEHICLE UTILIZATION MODAL
// --------------------------------------------
function setupVehicleUtilizationModal() {
    const form = document.getElementById('vehicle-utilization-form');
    if (form) {
        form.addEventListener('submit', handleVehicleUtilizationSubmit);
    }
}

function onUtilizeVehicle() {
    showVehicleUtilizationModal();
}

function showVehicleUtilizationModal() {
    const modal = document.getElementById('vehicle-utilization-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeVehicleUtilizationModal() {
    const modal = document.getElementById('vehicle-utilization-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        resetVehicleUtilizationForm();
    }
}

function resetVehicleUtilizationForm() {
    const form = document.getElementById('vehicle-utilization-form');
    if (form) {
        form.reset();
        const driverSection = document.getElementById('driver-details-section');
        if (driverSection) {
            driverSection.style.display = 'none';
        }
    }
}

function onRegisterFleetBusiness() {
    showFleetBusinessModal();
}

function showFleetBusinessModal() {
    const modal = document.getElementById('fleet-business-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeFleetBusinessModal() {
    const modal = document.getElementById('fleet-business-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        resetFleetBusinessForm();
    }
}

function resetFleetBusinessForm() {
    const form = document.getElementById('fleet-business-form');
    if (form) {
        form.reset();
        // Clear uploaded files
        ['businessCert', 'businessInsurance', 'transportLicense', 'ownerIdProof'].forEach(docType => {
            removeFile(docType);
        });
    }
}

function setupFleetBusinessModal() {
    const form = document.getElementById('fleet-business-form');
    if (form) {
        form.addEventListener('submit', handleFleetBusinessSubmit);
    }
}

function handleFleetBusinessSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const fleetBusinessData = {
        id: 'fleet_' + Date.now(),
        businessInfo: {
            businessName: formData.get('businessName'),
            businessRegNumber: formData.get('businessRegNumber'),
            businessType: formData.get('businessType'),
            fleetSize: formData.get('fleetSize'),
            businessAddress: formData.get('businessAddress'),
            yearsInBusiness: formData.get('yearsInBusiness'),
            businessDescription: formData.get('businessDescription')
        },
        contactInfo: {
            contactPerson: formData.get('contactPerson'),
            designation: formData.get('designation'),
            businessPhone: formData.get('businessPhone'),
            businessEmail: formData.get('businessEmail'),
            alternatePhone: formData.get('alternatePhone'),
            website: formData.get('website')
        },
        services: {
            servicesOffered: formData.getAll('services'),
            operatingHours: formData.get('operatingHours'),
            operatingAreas: formData.get('operatingAreas'),
            specialFeatures: formData.get('specialFeatures'),
            expectedBookingsPerMonth: formData.get('expectedBookingsPerMonth')
        },
        fleetInfo: {
            vehicleTypes: formData.getAll('vehicleTypes'),
            averageVehicleAge: formData.get('averageVehicleAge'),
            driverCount: parseInt(formData.get('driverCount'))
        },
        documents: DriverBazarApp.uploadedDocuments,
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };

    // Validate required fields
    if (!fleetBusinessData.businessInfo.businessName || 
        !fleetBusinessData.businessInfo.businessRegNumber ||
        !fleetBusinessData.businessInfo.businessType ||
        !fleetBusinessData.businessInfo.fleetSize ||
        !fleetBusinessData.businessInfo.businessAddress ||
        !fleetBusinessData.contactInfo.contactPerson ||
        !fleetBusinessData.contactInfo.designation ||
        !fleetBusinessData.contactInfo.businessPhone ||
        !fleetBusinessData.contactInfo.businessEmail ||
        !fleetBusinessData.services.operatingHours ||
        !fleetBusinessData.services.operatingAreas ||
        !fleetBusinessData.fleetInfo.driverCount ||
        fleetBusinessData.services.servicesOffered.length === 0 ||
        fleetBusinessData.fleetInfo.vehicleTypes.length === 0) {
        alert('Please fill in all required fields');
        return;
    }

    // Validate required documents
    if (!DriverBazarApp.uploadedDocuments.businessCert || 
        !DriverBazarApp.uploadedDocuments.businessInsurance || 
        !DriverBazarApp.uploadedDocuments.transportLicense || 
        !DriverBazarApp.uploadedDocuments.ownerIdProof) {
        alert('Please upload all required documents (Business Certificate, Insurance, Transport License, and Owner ID Proof)');
        return;
    }

    // Check terms acceptance
    if (!formData.get('termsAccept')) {
        alert('Please accept the terms and conditions to proceed');
        return;
    }

    // Show loading
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }

    // Simulate API call
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
        
        storeFleetBusinessRegistration(fleetData);
        closeFleetBusinessModal();
        showNotification(`Fleet business registration submitted successfully! Reference: ${fleetData.id}`);
        console.log('Fleet Business Registration Submitted:', fleetBusinessData);
    }, 2500);
}

function storeFleetBusinessRegistration(fleetData) {
    try {
        let fleetBusinesses = JSON.parse(localStorage.getItem('fleetBusinessRegistrations') || '[]');
        fleetBusinesses.push(fleetData);
        localStorage.setItem('fleetBusinessRegistrations', JSON.stringify(fleetBusinesses));
    } catch (error) {
        console.error('Error storing fleet business registration:', error);
    }
}

// ============================================
// END FLEET BUSINESS REGISTRATION FUNCTIONALITY
// ============================================

// ============================================
// FLEET BUSINESS: ASSET CREATION
// ============================================
function openFleetAssetModal(assetType) {
    const modal = document.getElementById('fleet-asset-modal');
    document.getElementById('fleet-asset-modal-title').textContent = assetType === 'driver' ? 'Add Driver to Fleet' : 'Add Vehicle to Fleet';
    document.getElementById('fleet-driver-form-section').style.display = assetType === 'driver' ? 'block' : 'none';
    document.getElementById('fleet-vehicle-form-section').style.display = assetType === 'vehicle' ? 'block' : 'none';
    
    document.querySelector('#fleet-driver-form-section .btn').onclick = saveFleetDriver;
    document.querySelector('#fleet-vehicle-form-section .btn').onclick = saveFleetVehicle;

    modal.style.display = 'flex';
    renderFleetAssetsList();
}

function closeFleetAssetModal() {
    document.getElementById('fleet-asset-modal').style.display = 'none';
}

function saveFleetDriver() {
    const newDriver = {
        id: 'd' + Date.now(),
        name: document.getElementById('fleet-driver-name').value,
        phone: document.getElementById('fleet-driver-phone').value,
        experience: document.getElementById('fleet-driver-experience').value,
        hourlyRate: document.getElementById('fleet-driver-rate').value,
        ownerType: 'fleet'
    };
    if (!newDriver.name || !newDriver.hourlyRate || !newDriver.phone || !newDriver.experience) return alert('All driver fields are required.');
    DriverBazarApp.myDrivers.push(newDriver);
    saveAssetsToStorage();
    renderFleetAssetsList();
    document.getElementById('fleet-driver-form-section').querySelectorAll('input').forEach(i => i.value = '');
}

function saveFleetVehicle() {
    const newVehicle = {
        id: 'fv' + Date.now(),
        make: document.getElementById('fleet-vehicle-make').value,
        model: document.getElementById('fleet-vehicle-model').value,
        year: document.getElementById('fleet-vehicle-year').value,
        licensePlate: document.getElementById('fleet-vehicle-plate').value,
        ownerType: 'fleet',
        rentableToFleets: { available: false, schedule: {} }
    };
    if (!newVehicle.make || !newVehicle.model || !newVehicle.year || !newVehicle.licensePlate) return alert('All vehicle fields are required.');
    DriverBazarApp.myVehicles.push(newVehicle);
    saveAssetsToStorage();
    renderFleetAssetsList();
    document.getElementById('fleet-vehicle-form-section').querySelectorAll('input').forEach(i => i.value = '');
}

function renderFleetAssetsList() {
    const container = document.getElementById('fleet-assets-list');
    if (!container) return;
    const drivers = DriverBazarApp.myDrivers.filter(d => d.ownerType === 'fleet').map(d => `<div><i class="fas fa-user-tie"></i> ${d.name}</div>`).join('');
    const vehicles = DriverBazarApp.myVehicles.filter(v => v.ownerType === 'fleet').map(v => `<div><i class="fas fa-car"></i> ${v.year} ${v.make} ${v.model}</div>`).join('');
    container.innerHTML = drivers + vehicles || '<p>No assets in your fleet yet.</p>';
}

// ============================================
// FLEET & OWNER: ASSET RENTAL MANAGEMENT
// ============================================
function openFleetManageAssetsModal() {
    const modal = document.getElementById('fleet-manage-assets-modal');
    if (modal) {
        document.querySelector('#fleet-manage-assets-modal .modal-header h3').textContent = 'Manage Fleet Assets for Rent';
        renderManageableVehicles('fleet');
        modal.style.display = 'flex';
    }
}

function closeFleetManageAssetsModal() {
    document.getElementById('fleet-manage-assets-modal').style.display = 'none';
}

function renderManageableVehicles(ownerType) { // Combined function
    const container = document.getElementById('fleet-manageable-vehicles-list');
    if (!container) return;

    const vehicles = DriverBazarApp.myVehicles.filter(v => v.ownerType === ownerType);
    
    container.innerHTML = vehicles.map(vehicle => {
        if (!vehicle.rentableToFleets) vehicle.rentableToFleets = { available: false, schedule: {} };
        const isAvailable = vehicle.rentableToFleets.available;
        const scheduleDays = vehicle.rentableToFleets.schedule ? Object.keys(vehicle.rentableToFleets.schedule).length : 0;
        return `
            <div class="fleet-asset-card">
                <div class="fleet-asset-info">
                    <strong>${vehicle.year} ${vehicle.make} ${vehicle.model}</strong>
                    <span>${vehicle.licensePlate}</span>
                </div>
                <div class="fleet-asset-availability">
                    <label class="switch">
                        <input type="checkbox" onchange="toggleRentAvailability('${vehicle.id}', this.checked)" ${isAvailable ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <span class="switch__label">Available for Rent</span>
                </div>
                <div class="availability-scheduler" id="scheduler-${vehicle.id}" style="display: ${isAvailable ? 'block' : 'none'};">
                    <div class="availability-summary">
                        <i class="fas fa-calendar-check"></i> 
                        <span>${scheduleDays} day(s) with availability set.</span>
                    </div>
                    <div class="availability-setter">
                        <div class="calendar__wrapper">
                            <div class="calendar" id="asset-calendar-${vehicle.id}"></div>
                        </div>
                        <div class="time__wrapper">
                            <div class="time__slots" id="asset-timeslot-${vehicle.id}">
                                <p class="time-slot-placeholder">Select a date to set times.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('') || `<p>You have no vehicles. Use the "Add Vehicle" button to add one.</p>`;
    
    vehicles.forEach(vehicle => {
        if (vehicle.rentableToFleets.available) {
            renderAssetCalendar(vehicle.id);
        }
    });
}

function toggleRentAvailability(vehicleId, isChecked) { // Combined function
    const vehicle = DriverBazarApp.myVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    if (!vehicle.rentableToFleets) vehicle.rentableToFleets = { available: false, schedule: {} };
    vehicle.rentableToFleets.available = isChecked;
    document.getElementById(`scheduler-${vehicleId}`).style.display = isChecked ? 'block' : 'none';
    if (isChecked) {
        renderAssetCalendar(vehicleId);
    }
    saveAssetsToStorage();
}

function renderAssetCalendar(vehicleId) { // Combined function
    const vehicle = DriverBazarApp.myVehicles.find(v => v.id === vehicleId);
    const state = DriverBazarApp.state.ownerAssets; // Use one state object for simplicity
    if (!vehicle) return;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const container = document.getElementById(`asset-calendar-${vehicle.id}`);
    if (!container) return;
    
    let calendarHtml = `<div class="calendar__header"><button type="button" onclick="assetCalendarNav('prev', '${vehicleId}')"><i class="fas fa-chevron-left"></i></button><span>${monthNames[state.currentMonth]} ${state.currentYear}</span><button type="button" onclick="assetCalendarNav('next', '${vehicleId}')"><i class="fas fa-chevron-right"></i></button></div><div class="calendar__weekdays">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<div class="weekday">${day}</div>`).join('')}</div><div class="calendar__grid">`;

    const firstDay = new Date(state.currentYear, state.currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateString = date.toDateString();
        
        let classes = ['calendar__day'];
        if (date.getMonth() !== state.currentMonth) classes.push('other-month');
        if (state.selectedDate === dateString) classes.push('selected');
        if (vehicle.rentableToFleets.schedule && vehicle.rentableToFleets.schedule[dateString]?.length > 0) classes.push('available');

        calendarHtml += `<div class="${classes.join(' ')}" onclick="selectAssetDate('${vehicleId}', '${dateString}')">${date.getDate()}</div>`;
    }
    calendarHtml += `</div>`;
    container.innerHTML = calendarHtml;
}

function assetCalendarNav(direction, vehicleId) { // Combined function
    let { currentMonth, currentYear } = DriverBazarApp.state.ownerAssets;
    if (direction === 'prev') {
        currentMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        if (currentMonth === 11) currentYear--;
    } else {
        currentMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        if (currentMonth === 0) currentYear++;
    }
    DriverBazarApp.state.ownerAssets.currentMonth = currentMonth;
    DriverBazarApp.state.ownerAssets.currentYear = currentYear;
    renderAssetCalendar(vehicleId);
}

function selectAssetDate(vehicleId, dateString) { // Combined function
    DriverBazarApp.state.ownerAssets.selectedDate = dateString;
    renderAssetCalendar(vehicleId); 
    renderAssetTimeSlots(vehicleId, dateString);
}

function renderAssetTimeSlots(vehicleId, dateString) { // Combined function
    const container = document.getElementById(`asset-timeslot-${vehicleId}`);
    if (!container) return;
    const vehicle = DriverBazarApp.myVehicles.find(v => v.id === vehicleId);
    if (!dateString || !vehicle) {
        container.innerHTML = `<p class="time-slot-placeholder">Select a date to set times.</p>`;
        return;
    }
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    const availableTimes = (vehicle.rentableToFleets.schedule && vehicle.rentableToFleets.schedule[dateString]) || [];
    container.innerHTML = timeSlots.map(time => {
        const isSelected = availableTimes.includes(time);
        return `<div class="time__slot ${isSelected ? 'selected' : ''}" onclick="toggleAssetTimeSlot('${vehicleId}', '${dateString}', '${time}')">${time}</div>`;
    }).join('');
}

function toggleAssetTimeSlot(vehicleId, dateString, time) { // Combined function
    const vehicle = DriverBazarApp.myVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    if (!vehicle.rentableToFleets.schedule) vehicle.rentableToFleets.schedule = {};
    if (!vehicle.rentableToFleets.schedule[dateString]) vehicle.rentableToFleets.schedule[dateString] = [];
    
    const timeIndex = vehicle.rentableToFleets.schedule[dateString].indexOf(time);
    if (timeIndex > -1) {
        vehicle.rentableToFleets.schedule[dateString].splice(timeIndex, 1);
        if (vehicle.rentableToFleets.schedule[dateString].length === 0) delete vehicle.rentableToFleets.schedule[dateString];
    } else {
        vehicle.rentableToFleets.schedule[dateString].push(time);
        vehicle.rentableToFleets.schedule[dateString].sort();
    }
    saveAssetsToStorage();
    renderAssetTimeSlots(vehicleId, dateString);
    renderAssetCalendar(vehicleId); 
    const scheduleDays = Object.keys(vehicle.rentableToFleets.schedule).length;
    const summaryEl = document.querySelector(`#scheduler-${vehicleId} .availability-summary span`);
    if(summaryEl) summaryEl.textContent = `${scheduleDays} day(s) with availability set.`;
}

// ============================================
// OWNER: ASSET MANAGEMENT (DEFINITIVE FIX)
// ============================================

function openOwnerAssetModal() {
    const modal = document.getElementById('fleet-asset-modal');
    if (!modal) return;
    
    document.getElementById('fleet-asset-modal-title').textContent = 'Add My Vehicle';
    document.getElementById('fleet-driver-form-section').style.display = 'none';
    document.getElementById('fleet-vehicle-form-section').style.display = 'block';
    
    document.querySelector('#fleet-vehicle-form-section .btn').onclick = saveOwnerVehicle;

    modal.style.display = 'flex';
    renderOwnerAssetsList();
}

function renderOwnerAssetsList() {
    const container = document.getElementById('fleet-assets-list');
    if (!container) return;
    
    const vehicles = DriverBazarApp.myVehicles
        .filter(v => v.ownerType === 'owner')
        .map(v => `<div><i class="fas fa-car"></i> ${v.year} ${v.make} ${v.model}</div>`)
        .join('');
        
    container.innerHTML = vehicles || "<p>You haven't added any vehicles yet.</p>";
}

function saveOwnerVehicle() {
    const newVehicle = {
        id: 'ov' + Date.now(),
        make: document.getElementById('fleet-vehicle-make').value,
        model: document.getElementById('fleet-vehicle-model').value,
        year: document.getElementById('fleet-vehicle-year').value,
        licensePlate: document.getElementById('fleet-vehicle-plate').value,
        ownerType: 'owner',
        rentableToFleets: { available: false, schedule: {} }
    };
    
    if (!newVehicle.make || !newVehicle.model || !newVehicle.year || !newVehicle.licensePlate) {
        return alert('All vehicle fields are required.');
    }
    
    DriverBazarApp.myVehicles.push(newVehicle);
    saveAssetsToStorage();
    renderOwnerAssetsList();
    
    document.getElementById('fleet-vehicle-form-section').querySelectorAll('input').forEach(i => i.value = '');
}

function openOwnerManageAssetsModal() {
    const modal = document.getElementById('fleet-manage-assets-modal');
    if (!modal) return;
    
    document.querySelector('#fleet-manage-assets-modal .modal-header h3').textContent = 'Manage My Vehicles for Rent';
    
    renderManageableVehicles('owner');
    modal.style.display = 'flex';
}