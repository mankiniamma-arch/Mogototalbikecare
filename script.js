const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyp9jl7Uu5thiilCriCwi8yE7Sc0Z2cY4OUkCdx3WDp1MmvWgNgMyszl77eWxrPIH4u-Q/exec";
const MY_WHATSAPP = "919954924948";
const TOTAL_PRICE = 89; 
const COMPANY_GSTIN = "18AASCM6250H1Z1"; 
const OFFICIAL_ADDRESS = "Building No./Flat No.: H/No.248, Dag No.332, K P Patta No 78, Pub Boragaon, Guwahati, Assam, 781035";

const RAZORPAY_KEY_ID = "rzp_live_TsqVswCcOu6NQS"; 
const _RZP_SYNC_TOKEN = "cnpwX2xpdmVfVHNxVnN3Q2NPdTZOUVM6UTY2NzkzeEQxSGFkYnRjbnFPWlk0UDVK";

const KYC_API_CONFIG = { environment: "TEST", clientId: "6d427278-4cb1-4460-8c2e-c09224552148", clientSecret: "KuPVrzLE8jta6TTemdR1F78MdRcD7EwJ", baseUrl: "https://sandbox.kyc-api.in/v1/vahan" };
const WHATSAPP_API_URL = ""; 
const WHATSAPP_API_KEY = "";

let paymentType = "Pay Now";
let vehicleType = "Bike";
let selectedServiceKey = "wash";
let selectedServiceName = "Premium Foam Wash";
let globalBookingData = {};
let customerCoords = null;

// ==========================================================
// USER AUTHENTICATION SYSTEM (GMAIL & WHATSAPP)
// ==========================================================
let loggedInUser = null;
let loginIntent = false; // To check if auth modal was opened from 'Confirm Booking'
let authGeneratedOtp = "";

// Check if user is already logged in on Page Load
function initAuth() {
  try {
    let savedUser = localStorage.getItem('mogo_user');
    if (savedUser) {
      loggedInUser = JSON.parse(savedUser);
      updateProfileUI();
    }
  } catch (e) {}
}

function updateProfileUI() {
  if (loggedInUser) {
    document.getElementById('userGreeting').innerText = "👋 Hello, " + (loggedInUser.name ? loggedInUser.name.split(" ")[0] : "User") + "!";
    document.getElementById('topLoginBtn').innerText = "Logout";
    document.getElementById('topLoginBtn').onclick = logoutUser;
    
    // Auto-fill forms
    if(loggedInUser.name) document.getElementById('cName').value = loggedInUser.name;
    if(loggedInUser.phone) document.getElementById('cPhone').value = loggedInUser.phone;
    if(loggedInUser.email) document.getElementById('cEmail').value = loggedInUser.email;
  } else {
    document.getElementById('userGreeting').innerText = "👋 Hello, Guest!";
    document.getElementById('topLoginBtn').innerText = "👤 Login / Sign Up";
    document.getElementById('topLoginBtn').onclick = function() { openAuthModal(false); };
    document.getElementById('cName').value = "";
    document.getElementById('cPhone').value = "";
  }
}

function logoutUser() {
  loggedInUser = null;
  localStorage.removeItem('mogo_user');
  updateProfileUI();
  showUiAlert("🔒", "Logged Out", "You have been securely logged out.");
}

function openAuthModal(fromBooking) {
  loginIntent = fromBooking;
  document.getElementById('guestCheckoutBtn').style.display = fromBooking ? "block" : "none";
  document.getElementById('authOtpSection').style.display = "none";
  document.getElementById('authPhone').value = "";
  document.getElementById('authOtp').value = "";
  document.getElementById('authModal').classList.add('show');
}
function closeAuthModal() { document.getElementById('authModal').classList.remove('show'); }

// 1. Google (Gmail) OAuth Login Flow
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) { return null; }
}

function handleGoogleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  if (payload) {
    loggedInUser = {
      name: payload.name,
      email: payload.email,
      phone: "", // Google usually doesn't provide phone, can ask later
      picture: payload.picture,
      method: "Google"
    };
    localStorage.setItem('mogo_user', JSON.stringify(loggedInUser));
    updateProfileUI();
    closeAuthModal();
    showUiAlert("✅", "Login Successful", "Welcome back, " + payload.name + "!");
    
    // If they were trying to book, continue booking
    if (loginIntent) {
      setTimeout(processFinalBooking, 1000);
    }
  }
}

// 2. WhatsApp OTP Login Flow
function sendAuthOTP() {
  let phone = document.getElementById('authPhone').value.trim();
  if (!/^[0-9]{10}$/.test(phone)) return showUiAlert("📱", "Invalid Number", "Please enter a valid 10-digit mobile number.", "authPhone");
  
  authGeneratedOtp = String(Math.floor(1000 + Math.random() * 9000));
  document.getElementById('authOtpSection').style.display = "block";
  document.getElementById('authOtp').value = authGeneratedOtp; // Auto fill for demo
  
  // Send via WA API...
  let msg = "🔐 *MoGo Login OTP*\nYour login OTP is *" + authGeneratedOtp + "*. Do not share this with anyone.";
  if (WHATSAPP_API_URL) {
    fetch(WHATSAPP_API_URL, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": WHATSAPP_API_KEY ? ("Bearer " + WHATSAPP_API_KEY) : "" },
      body: JSON.stringify({ to: "91"+phone, phone: "91"+phone, message: msg })
    }).catch(e=>{});
  }
}

function verifyAuthOTP() {
  let enteredOtp = document.getElementById('authOtp').value.trim();
  if (enteredOtp !== authGeneratedOtp || !enteredOtp) return showUiAlert("🔐", "Invalid OTP", "Please enter the correct 4-digit OTP.");
  
  let phone = document.getElementById('authPhone').value.trim();
  loggedInUser = { name: "", email: "", phone: phone, method: "WhatsApp" };
  localStorage.setItem('mogo_user', JSON.stringify(loggedInUser));
  updateProfileUI();
  closeAuthModal();
  
  if (loginIntent) {
    processFinalBooking(); // Continue booking
  } else {
    showUiAlert("✅", "Login Successful", "You are now logged in with " + phone + ".");
  }
}

// 3. Guest Checkout Logic
function continueAsGuest() {
  closeAuthModal();
  processFinalBooking();
}

function submitBooking() {
  // Check fields first
  let name = document.getElementById('cName').value.trim(), phone = document.getElementById('cPhone').value.trim(), addr = document.getElementById('cAddr').value.trim();
  if (!name || !/^[0-9]{10}$/.test(phone) || !addr) return showUiAlert("⚠️", "Missing Details", "Please fill name, phone, and address.");
  if (!selectedServiceKey) return showUiAlert("🔒", "Service Required", "Please select a service.");

  // If user is not logged in, prompt Auth Modal (with Guest option)
  if (!loggedInUser) {
    openAuthModal(true); // true = opened from checkout
    return;
  }
  
  // If already logged in, proceed directly
  processFinalBooking();
}

function processFinalBooking() {
  let name = document.getElementById('cName').value.trim(), phone = document.getElementById('cPhone').value.trim(), addr = document.getElementById('cAddr').value.trim();
  let id = "MOGO" + Math.floor(1000 + Math.random() * 9000);
  let maps = customerCoords ? "https://www.google.com/maps?q=" + customerCoords.lat + "," + customerCoords.lon : "";
  let subtotal = TOTAL_PRICE / 1.18;

  globalBookingData = {
    id: id, date: new Date().toLocaleDateString('en-IN'), name: name, phone: phone, vehicle: vehicleType, serviceName: selectedServiceName,
    grandTotal: TOTAL_PRICE, address: addr, paymentType: paymentType, status: "BOOKED", forceType: "JOB_CARD"
  };
  insertRecord(globalBookingData);
  document.getElementById('bookingForm').style.display = "none";
  document.getElementById('successScreen').style.display = "block";
  document.getElementById('qrSection').style.display = paymentType === "Pay Now" ? "block" : "none";
  if (paymentType === "Pay Now") setTimeout(triggerRazorpayPayment, 400);
}

// ==========================================================
// REST OF THE EXISTING FUNCTIONS (Vahan, Maps, PDF, Razorpay)
// ==========================================================
// Note: Keep all other functions exactly as they were in your previous script.js
function getLocation() {
  let btn = document.getElementById('locBtn'); clearError('cAddr');
  btn.disabled = true; btn.innerHTML = "⏳ Locating...";
  navigator.geolocation.getCurrentPosition(
    pos => {
      customerCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      document.getElementById('cAddr').value = "GPS Location: " + pos.coords.latitude.toFixed(5) + ", " + pos.coords.longitude.toFixed(5);
      btn.innerHTML = "📍 Auto Locate"; btn.disabled = false;
    },
    err => { btn.disabled = false; btn.innerHTML = "📍 Auto Locate"; showUiAlert("📍", "Permission Denied", "Type address manually."); },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function selectVehicle(t) { vehicleType = t; document.getElementById('v-bike').classList.toggle('active', t === 'Bike'); document.getElementById('v-scooty').classList.toggle('active', t === 'Scooty'); }
function selectPayType(t) { paymentType = t; document.getElementById('opt-now').classList.toggle('active', t === 'Pay Now'); document.getElementById('opt-after').classList.toggle('active', t !== 'Pay Now'); }

function toggleService(key, name, price) {
  let ids = ['wash', 'general', 'insurance', 'puc', 'echallan', 'emergency', 'mmc'];
  let targetItem = document.getElementById('item-' + key);
  if (!targetItem) return;
  
  if (key === 'wash') {
    ids.forEach(k => document.getElementById('item-' + k)?.classList.remove('active'));
    targetItem.classList.add('active'); selectedServiceKey = 'wash'; selectedServiceName = 'Premium Foam Wash'; return;
  }
  let isOpen = targetItem.classList.contains('active');
  ids.forEach(k => document.getElementById('item-' + k)?.classList.remove('active'));
  if (!isOpen) {
    targetItem.classList.add('active');
    selectedServiceKey = key; selectedServiceName = name;
  } else {
    document.getElementById('item-wash').classList.add('active'); selectedServiceKey = 'wash';
  }
}

// Ensure initAuth runs on load
document.addEventListener('DOMContentLoaded', function() {
  initMoGoApp();
  initAuth();
});

// ... Include all other database, UI, PDF and Razorpay functions here from the previous script ...
