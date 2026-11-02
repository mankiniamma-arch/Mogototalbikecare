const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyp9jl7Uu5thiilCriCwi8yE7Sc0Z2cY4OUkCdx3WDp1MmvWgNgMyszl77eWxrPIH4u-Q/exec";
const MY_WHATSAPP = "919954924948";
const TOTAL_PRICE = 89; 
const COMPANY_GSTIN = "18AASCM6250H1Z1"; 
const OFFICIAL_ADDRESS = "Building No./Flat No.: H/No.248, Dag No.332, K P Patta No 78, Pub Boragaon, Under Jalukbari Mouza, Guwahati Revenue Circle, Guwahati, Kamrup Metropolitan, Assam, 781035";

// Live Razorpay Credentials
const RAZORPAY_KEY_ID = "rzp_live_TsqVswCcOu6NQS"; 
const _RZP_SYNC_TOKEN = "cnpwX2xpdmVfVHNxVnN3Q2NPdTZOUVM6UTY2NzkzeEQxSGFkYnRjbnFPWlk0UDVK";

// KYC & VAHAN PRODUCTS API CREDENTIALS
const KYC_API_CONFIG = {
  environment: "TEST",
  clientId: "6d427278-4cb1-4460-8c2e-c09224552148",
  clientSecret: "KuPVrzLE8jta6TTemdR1F78MdRcD7EwJ",
  baseUrl: "https://sandbox.kyc-api.in/v1/vahan"
};

const WHATSAPP_API_URL = ""; 
const WHATSAPP_API_KEY = "";

let paymentType = "Pay Now";
let vehicleType = "Bike";
let selectedServiceKey = "wash";
let selectedServiceName = "Premium Foam Wash";
let globalBookingData = {};
let customerCoords = null;
let fieldToFocus = null;
let alertCallback = null;

let vahanOtpStore = {};
let selectedInsurancePlan = { name: "1-Yr Third-Party Bike Policy (Partner Agency)", price: 714 };

// ==========================================================
// USER AUTHENTICATION SYSTEM (Strictly NO Guest Checkout)
// ==========================================================
let loggedInUser = null;
let loginIntent = false; // Checks if login modal was forced by clicking 'Confirm Booking'

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
  const topBtn = document.getElementById('topLoginBtn');
  if (loggedInUser) {
    let shortName = loggedInUser.name ? loggedInUser.name.split(" ")[0] : "User";
    topBtn.innerText = "👤 " + shortName + " (Logout)";
    topBtn.classList.add('logged-in');
    topBtn.onclick = logoutUser;
    
    if(loggedInUser.name) document.getElementById('cName').value = loggedInUser.name;
    if(loggedInUser.phone) document.getElementById('cPhone').value = loggedInUser.phone;
    if(loggedInUser.email) document.getElementById('cEmail').value = loggedInUser.email;
  } else {
    topBtn.innerText = "👤 Login / Sign Up";
    topBtn.classList.remove('logged-in');
    topBtn.onclick = function() { openAuthModal(false); };
  }
}

function logoutUser() {
  loggedInUser = null;
  localStorage.removeItem('mogo_user');
  updateProfileUI();
  document.getElementById('cName').value = "";
  document.getElementById('cPhone').value = "";
  showUiAlert("🔒", "Logged Out", "You have been securely logged out.");
}

function openAuthModal(fromBooking = false) {
  loginIntent = fromBooking;
  document.getElementById('authOtpSection').style.display = "none";
  document.getElementById('authPhone').value = "";
  document.getElementById('authOtp').value = "";
  document.getElementById('authModal').classList.add('show');
}
function closeAuthModal() { document.getElementById('authModal').classList.remove('show'); }

// Google (Gmail) One-Tap Login Flow
function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
}

function handleGoogleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  if (payload) {
    loggedInUser = { name: payload.name, email: payload.email, phone: "", method: "Google" };
    localStorage.setItem('mogo_user', JSON.stringify(loggedInUser));
    updateProfileUI();
    closeAuthModal();
    showUiAlert("✅", "Login Successful", "Welcome back, " + payload.name + "!");
    
    // Auto-proceed if they were trying to book
    if (loginIntent) { setTimeout(processFinalBooking, 1000); }
  }
}

// WhatsApp OTP Login Flow
let authGeneratedOtp = "";
function sendAuthOTP() {
  let phone = document.getElementById('authPhone').value.trim();
  if (!/^[0-9]{10}$/.test(phone)) return showUiAlert("📱", "Invalid Number", "Please enter a valid 10-digit mobile number.", "authPhone");
  
  authGeneratedOtp = String(Math.floor(1000 + Math.random() * 9000));
  document.getElementById('authOtpSection').style.display = "block";
  document.getElementById('authOtp').value = authGeneratedOtp; // Auto fill for demo
  
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
    processFinalBooking();
  } else {
    showUiAlert("✅", "Login Successful", "You are now logged in with " + phone + ".");
  }
}

// ==========================================================
// AI NUMBER PLATE SCANNER (FAST COMPRESSED OCR)
// ==========================================================
async function processNumberPlateScan(event, moduleType) {
  const file = event.target.files[0];
  if (!file) return;

  const regInput = document.getElementById('reg-' + moduleType);
  const originalPlaceholder = regInput.placeholder;
  
  regInput.value = "";
  regInput.placeholder = "📷 Scanning Plate...";
  showUiAlert("⏳", "Scanning Photo", "AI is reading the number plate...");
  
  // Compress image so it doesn't freeze the browser
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const MAX_WIDTH = 800;
    let width = img.width; let height = img.height;
    
    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
    canvas.width = width; canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    
    try {
      const result = await Tesseract.recognize(canvas, 'eng');
      let text = result.data.text;
      let cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
      let match = cleanText.match(/[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}/);
      
      closeUiAlert();
      if (match && match[0]) {
        regInput.value = match[0];
        showUiAlert("✅", "Scan Successful", "Vehicle number " + match[0] + " detected! Tap 'Send WA OTP' to continue.");
      } else {
        regInput.placeholder = originalPlaceholder;
        showUiAlert("⚠️", "Scan Failed", "Could not perfectly read the vehicle number from the photo. Please type it manually.");
      }
    } catch (err) {
      closeUiAlert();
      regInput.placeholder = originalPlaceholder;
      showUiAlert("❌", "Scanner Error", "Please type manually.");
    }
  };
  event.target.value = "";
}

// ==========================================================
// REST OF THE EXISTING LOGIC (VAHAN, MAPS, PDF, RAZORPAY)
// ==========================================================
const BOTTOM_LEGAL_DATA = {
  privacy: {
    title: "🛡️ Privacy Policy (Indian & International Law)",
    html: `<h4>1. Constitutional & Statutory Mandate</h4><ul><li><strong>Constitution of India (Article 21):</strong> Upholds the Fundamental Right to Privacy.</li><li><strong>DPDP Act, 2023 & IT Act, 2000:</strong> Customer data is collected strictly with lawful consent.</li></ul>`
  },
  terms: {
    title: "📜 Terms & Conditions & Service Logic",
    html: `<h4>1. Legal Contract (Indian Contract Act, 1872)</h4><ul><li>All bookings constitute a valid electronic contract.</li><li><strong>Promotional Pricing Logic:</strong> Premium Foam Wash is offered at a special price of ₹89.00 (inclusive of 18% GST).</li></ul>`
  },
  legal: {
    title: "⚖️ Legal, Constitutional & International Charter",
    html: `<h4>1. Indian Constitutional & Statutory Framework</h4><ul><li><strong>Article 19(1)(g):</strong> Legitimate trade operations.</li><li><strong>GST Act, 2017:</strong> Registered taxpayer under GSTIN 18AASCM6250H1Z1.</li></ul>`
  },
  refund: {
    title: "💳 Refund, Cancellation & Consumer Rights",
    html: `<h4>1. Consumer Protection Act, 2019</h4><ul><li><strong>Free Cancellation:</strong> Prior to mechanic dispatch.</li><li><strong>Automated Refund:</strong> Processed back to original payment method within 3 to 5 business days.</li></ul>`
  },
  contact: {
    title: "🏢 Contact Us & Grievance Redressal Officer",
    html: `<h4>Official Corporate Details</h4><ul><li><strong>Website:</strong> mogototalbikecare.in</li><li><strong>Email:</strong> help@mogototalbikecare.in</li><li><strong>Phone:</strong> +91 99549 24948</li><li><strong>Address:</strong> Pub Boragaon, Guwahati, Assam, 781035</li></ul>`
  }
};

function openBottomLegalModal(key) {
  let item = BOTTOM_LEGAL_DATA[key];
  if (!item) return;
  document.getElementById('bottomLegalTitle').innerHTML = item.title;
  document.getElementById('bottomLegalBody').innerHTML = item.html;
  document.getElementById('bottomLegalModal').classList.add('show');
}
function closeBottomLegalModal() { document.getElementById('bottomLegalModal').classList.remove('show'); }

function sendVahanWhatsAppOTP(moduleType) {
  let regEl = document.getElementById('reg-' + moduleType);
  let regNo = regEl ? regEl.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : "";
  if (regEl) regEl.value = regNo;
  if (regNo.length < 6) return showUiAlert("🏍️", "Vehicle Number Required", "Please enter a valid Registration Number.");
  let cPhone = document.getElementById('cPhone').value.trim();
  if (!/^[0-9]{10}$/.test(cPhone)) return showUiAlert("📱", "Mobile Number Required", "Enter 10-digit mobile number above.");

  let generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
  vahanOtpStore[moduleType] = { otp: generatedOtp, regNo: regNo, phone: cPhone };
  
  let otpBox = document.getElementById('otp-box-' + moduleType);
  let otpInput = document.getElementById('otp-input-' + moduleType);
  if (otpBox) otpBox.style.display = "block";
  document.getElementById('otp-msg-' + moduleType).innerText = "✅ WhatsApp OTP Sent! (Demo: " + generatedOtp + ")";
  if (otpInput) { otpInput.value = generatedOtp; otpInput.focus(); }
}

async function verifyVahanOTPAndFetch(moduleType) {
  let store = vahanOtpStore[moduleType];
  let otpInput = document.getElementById('otp-input-' + moduleType);
  let enteredOtp = otpInput ? otpInput.value.trim() : "";
  if (!store || enteredOtp !== store.otp) return showUiAlert("🔐", "Invalid OTP", "Please enter correct 4-digit OTP.");

  let resBox = document.getElementById('res-box-' + moduleType);
  resBox.style.display = "block"; resBox.innerHTML = "⏳ Fetching Vahan Data...";

  let regNo = store.regNo;
  
  if (moduleType === 'insurance') {
    resBox.innerHTML = `
      <div style="margin-bottom:12px;"><strong>Vehicle:</strong> ${regNo}<br><strong>Status:</strong> <span style="color:#DC2626;font-weight:bold;">Renewal Due</span></div>
      <div class="vahan-plan-option selected" id="ins-plan-tp" onclick="selectInsPlan('tp', '1-Yr Third-Party Policy', 714)">
        <div><strong>Third-Party Policy</strong><br><span style="font-size:11px; color:#6B7280;">Govt. Compliant</span></div><strong style="color:var(--primary); font-size:14px;">₹714</strong>
      </div>
      <div class="vahan-plan-option" id="ins-plan-comp" onclick="selectInsPlan('comp', '1-Yr Comprehensive Zero-Dep', 1249)">
        <div><strong>Comprehensive Policy</strong><br><span style="font-size:11px; color:#6B7280;">Full Cover</span></div><strong style="color:var(--primary); font-size:14px;">₹1,249</strong>
      </div>
      <button type="button" class="btn-main" style="margin-top:12px; padding:12px;" onclick="proceedVahanPaymentOrBooking('insurance', '${regNo}')">💳 Pay & Renew Policy</button>`;
  } else if (moduleType === 'puc') {
    resBox.innerHTML = `
      <div style="margin-bottom:12px;"><strong>Vehicle:</strong> ${regNo}<br><strong>PUC Status:</strong> <span style="color:#DC2626;font-weight:bold;">Expired</span><br><strong>Fine/Charge:</strong> ₹250</div>
      <button type="button" class="btn-main" style="padding:12px; background:#16A34A;" onclick="proceedVahanPaymentOrBooking('puc_pay', '${regNo}', 250)">💳 Pay PUC Charge Online (₹250)</button>`;
  } else if (moduleType === 'echallan') {
    resBox.innerHTML = `
      <div style="margin-bottom:12px;"><strong>Vehicle:</strong> ${regNo}<br><strong>Pending Challan:</strong> ₹500</div>
      <button type="button" class="btn-main" style="padding:12px; background:#DC2626;" onclick="proceedVahanPaymentOrBooking('echallan', '${regNo}', 500)">💳 Pay e-Challan (₹500)</button>`;
  }
}

function selectInsPlan(planKey, planName, price) {
  selectedInsurancePlan = { name: planName, price: price };
  document.getElementById('ins-plan-tp')?.classList.toggle('selected', planKey === 'tp');
  document.getElementById('ins-plan-comp')?.classList.toggle('selected', planKey === 'comp');
}

function proceedVahanPaymentOrBooking(actionType, regNo, customAmount) {
  let name = document.getElementById('cName').value.trim() || "Customer";
  let phone = document.getElementById('cPhone').value.trim();
  let addr = document.getElementById('cAddr').value.trim() || "Guwahati, Assam";
  if (!/^[0-9]{10}$/.test(phone)) return showUiAlert("📱", "Mobile Number Required", "Enter valid 10-digit mobile number.");

  let finalAmount = customAmount || (actionType === 'insurance' ? selectedInsurancePlan.price : TOTAL_PRICE);
  let svcTitle = actionType === 'insurance' ? selectedInsurancePlan.name : (actionType === 'puc_pay' ? "PUC Clearance" : "e-Challan Settlement");
  
  globalBookingData = {
    id: "MOGO" + Math.floor(1000 + Math.random() * 9000), date: new Date().toLocaleDateString('en-IN'),
    name: name, phone: phone, vehicle: vehicleType + " (" + regNo + ")", serviceName: svcTitle + " [" + regNo + "]",
    grandTotal: finalAmount, address: addr, paymentType: "Pay Now", status: "BOOKED", forceType: "JOB_CARD"
  };
  
  insertRecord(globalBookingData);
  document.getElementById('bookingForm').style.display = "none";
  document.getElementById('successScreen').style.display = "block";
  document.getElementById('qrPriceTitle').innerText = "Scan & Pay ₹" + finalAmount + " Securely";
  document.getElementById('instantPayBtn').innerText = "⚡ Pay ₹" + finalAmount + " Instant (Auto-Generate Invoice)";
  document.getElementById('qrSection').style.display = "block";
}

// 3-LAYER GPS LOCATOR (Address Fetching)
async function fillAddressFromCoords(lat, lon) {
  const addrInput = document.getElementById('cAddr');
  const locBtn = document.getElementById('locBtn');
  customerCoords = { lat: lat, lon: lon };
  locBtn.disabled = false; locBtn.innerHTML = "✅ GPS Locked"; locBtn.style.background = "#DCFCE7"; locBtn.style.color = "#15803D";
  
  addrInput.value = "Fetching exact street address...";
  
  try {
    let res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
    if (res.ok) {
      let data = await res.json();
      if (data && data.display_name) {
        addrInput.value = data.display_name.replace(/, India$/i, '') + ` [GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}]`;
        return;
      }
    }
  } catch (e) {}
  addrInput.value = `Guwahati, Assam [GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}]`;
}

function getLocation() {
  let btn = document.getElementById('locBtn');
  clearError('cAddr');
  if (customerCoords && customerCoords.lat) { fillAddressFromCoords(customerCoords.lat, customerCoords.lon); return; }
  
  btn.disabled = true; btn.innerHTML = "⏳ Locating...";
  navigator.geolocation.getCurrentPosition(
    pos => fillAddressFromCoords(pos.coords.latitude, pos.coords.longitude),
    err => { btn.disabled = false; btn.innerHTML = "📍 Auto Locate"; showUiAlert("📍", "Permission Denied", "Please allow GPS permission or type your address manually."); },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function selectVehicle(t) { vehicleType = t; document.getElementById('v-bike').classList.toggle('active', t === 'Bike'); document.getElementById('v-scooty').classList.toggle('active', t === 'Scooty'); }
function selectPayType(t) { paymentType = t; document.getElementById('opt-now').classList.toggle('active', t === 'Pay Now'); document.getElementById('opt-after').classList.toggle('active', t !== 'Pay Now'); }

function toggleService(key, name, price) {
  let ids = ['wash', 'general', 'insurance', 'puc', 'echallan', 'emergency', 'mmc'];
  if (key === 'wash') {
    ids.forEach(k => document.getElementById('item-' + k)?.classList.remove('active'));
    document.getElementById('item-wash').classList.add('active');
    selectedServiceKey = 'wash'; return;
  }
  let isOpen = document.getElementById('item-' + key).classList.contains('active');
  ids.forEach(k => document.getElementById('item-' + k)?.classList.remove('active'));
  if (!isOpen) {
    document.getElementById('item-' + key).classList.add('active');
    if (['insurance', 'puc', 'echallan'].includes(key)) {
      selectedServiceKey = key; selectedServiceName = name; currentServicePrice = price || TOTAL_PRICE;
      setTimeout(() => document.getElementById('reg-' + key)?.focus(), 300);
    } else { selectedServiceKey = key; selectedServiceName = name; currentServicePrice = 0; }
  } else {
    document.getElementById('item-wash').classList.add('active'); selectedServiceKey = 'wash';
  }
}

// MAIN BOOKING FUNCTION WITH STRICT AUTH CHECK
function submitBooking() {
  let name = document.getElementById('cName').value.trim(), phone = document.getElementById('cPhone').value.trim(), addr = document.getElementById('cAddr').value.trim();
  
  if (!name || !/^[0-9]{10}$/.test(phone) || !addr) return showUiAlert("⚠️", "Missing Details", "Please fill name, phone, and address.");
  if (selectedServiceKey !== 'wash') return showUiAlert("🔒", "Feature Locked", "Select Premium Foam Wash or use Vahan module.");

  // FORCE LOGIN IF NOT LOGGED IN
  if (!loggedInUser) {
    showUiAlert("🔒", "Authentication Required", "Please Login or Sign Up to confirm your booking.");
    setTimeout(function() { openAuthModal(true); }, 1500); // true indicates it was opened from checkout
    return; 
  }

  // If logged in, proceed
  processFinalBooking();
}

function processFinalBooking() {
  let name = document.getElementById('cName').value.trim(), phone = document.getElementById('cPhone').value.trim(), addr = document.getElementById('cAddr').value.trim();
  let id = "MOGO" + Math.floor(1000 + Math.random() * 9000);
  let maps = customerCoords ? "https://www.google.com/maps?q=" + customerCoords.lat + "," + customerCoords.lon : "";
  let subtotal = TOTAL_PRICE / 1.18;

  globalBookingData = {
    id: id, date: new Date().toLocaleDateString('en-IN'), name: name, phone: phone, vehicle: vehicleType, serviceName: "Premium Foam Wash",
    grandTotal: TOTAL_PRICE, address: addr, paymentType: paymentType, status: "BOOKED", forceType: "JOB_CARD"
  };
  
  insertRecord(globalBookingData);
  document.getElementById('bookingForm').style.display = "none";
  document.getElementById('successScreen').style.display = "block";
  document.getElementById('qrSection').style.display = paymentType === "Pay Now" ? "block" : "none";
  
  if (paymentType === "Pay Now") setTimeout(triggerRazorpayPayment, 400);
}

function triggerRazorpayPayment() {
  if (!globalBookingData.id) return;
  let rzp = new window.Razorpay({
    key: RAZORPAY_KEY_ID, amount: globalBookingData.grandTotal * 100, currency: "INR",
    name: "Mankiniamma Technologies", description: globalBookingData.serviceName,
    handler: function (res) {
      globalBookingData.utr = res.razorpay_payment_id; globalBookingData.forceType = 'TAX_INVOICE';
      updateRecord(globalBookingData.id, { utr: res.razorpay_payment_id, forceType: 'TAX_INVOICE' });
      document.getElementById('successHeading').innerText = "Payment Verified! ✅";
      generatePDFFromDB(globalBookingData.id, true);
    },
    prefill: { contact: globalBookingData.phone }, theme: { color: "#FF5A00" }
  });
  rzp.open();
}

function handleCustomerUtrInput() {
  let utr = document.getElementById('customerUtr')?.value.trim();
  if (utr.length >= 4) {
    globalBookingData.utr = utr; globalBookingData.forceType = 'TAX_INVOICE';
    updateRecord(globalBookingData.id, { utr: utr, forceType: 'TAX_INVOICE' });
    document.getElementById('pdfDownloadBtn').innerText = "👁️ View & Download Paid Tax Invoice (PDF)";
    document.getElementById('pdfDownloadBtn').style.background = "#16A34A";
  }
}

// Local DB & Admin/Mechanic Logic
function getDB() { try { return JSON.parse(localStorage.getItem('mogo_db')) || []; } catch(e) { return []; } }
function saveDB(db) { localStorage.setItem('mogo_db', JSON.stringify(db)); }
function insertRecord(data) { let db = getDB(); db.unshift(data); saveDB(db); }
function getRecord(id) { return getDB().find(x => x.id === id); }
function updateRecord(id, updates) { let db = getDB(); let item = db.find(x => x.id === id); if (item) Object.assign(item, updates); saveDB(db); }
function deleteRecord(id) { let db = getDB().filter(x => x.id !== id); saveDB(db); renderAdminDB(); renderMechanicJobs(); closeUiAlert(); }

function showUiAlert(icon, title, msg) {
  document.getElementById('uiAlertIcon').innerText = icon;
  document.getElementById('uiAlertTitle').innerText = title;
  document.getElementById('uiAlertMsg').innerText = msg;
  document.getElementById('alertActionButtons').style.display = 'none';
  document.getElementById('alertOkBtn').style.display = 'block';
  document.getElementById('uiAlertModal').classList.add('show');
}
function closeUiAlert() { document.getElementById('uiAlertModal').classList.remove('show'); }

function openAdminPortal() { document.getElementById('adminModal').classList.add('show'); document.getElementById('adminPinSection').style.display = 'block'; document.getElementById('adminDashboard').style.display = 'none'; }
function closeAdminPortal() { document.getElementById('adminModal').classList.remove('show'); }
function verifyAdminPin() {
  if (document.getElementById('adminPinInput').value === "4882") {
    document.getElementById('adminPinSection').style.display = 'none'; document.getElementById('adminDashboard').style.display = 'block'; renderAdminDB(); switchAdminTab('jc');
  } else showUiAlert("🔐", "Error", "Invalid Admin PIN");
}

function openMechanicPortal() { document.getElementById('mechanicModal').classList.add('show'); document.getElementById('mechPinSection').style.display = 'block'; document.getElementById('mechDashboard').style.display = 'none'; }
function closeMechanicPortal() { document.getElementById('mechanicModal').classList.remove('show'); }
function verifyMechPin() {
  if (document.getElementById('mechPinInput').value === "7788") {
    document.getElementById('mechPinSection').style.display = 'none'; document.getElementById('mechDashboard').style.display = 'block'; renderMechanicJobs();
  } else showUiAlert("🔐", "Error", "Invalid Technician PIN");
}

function switchAdminTab(tab) {
  ['jc', 'inv', 'gen'].forEach(t => document.getElementById('tab-' + t).classList.toggle('active', t === tab));
  document.getElementById('view-jc').style.display = tab === 'jc' ? 'flex' : 'none';
  document.getElementById('view-inv').style.display = tab === 'inv' ? 'flex' : 'none';
  document.getElementById('view-gen').style.display = tab === 'gen' ? 'block' : 'none';
}

function renderMechanicJobs() {
  let html = "";
  getDB().forEach(item => {
    html += `<div class="db-item"><div class="db-header"><span>${item.id}</span></div><div class="db-info">${item.name} (${item.phone})<br>${item.serviceName}<br>${item.address}</div><div class="db-action"><button class="btn-sm" onclick="generatePDFFromDB('${item.id}', false)">View Job Sheet</button></div></div>`;
  });
  document.getElementById('mechJobList').innerHTML = html || "<p style='text-align:center;font-size:12px;'>No assigned jobs yet.</p>";
}

function renderAdminDB() {
  let jcHtml = "", invHtml = "";
  getDB().forEach(item => {
    let isInv = item.forceType === 'TAX_INVOICE';
    let card = `<div class="db-item"><div class="db-header"><span>${item.id}</span></div><div class="db-info">${item.name} | ${item.phone}<br>${item.serviceName}<br>UTR: ${item.utr || 'N/A'}</div><div class="db-action"><button class="btn-sm" onclick="generatePDFFromDB('${item.id}', ${isInv})">View PDF</button><button class="btn-del" onclick="deleteRecord('${item.id}')">✖</button></div></div>`;
    if (isInv) invHtml += card; else jcHtml += card;
  });
  document.getElementById('view-jc').innerHTML = jcHtml || "<p style='text-align:center;font-size:12px;'>No Job Cards.</p>";
  document.getElementById('view-inv').innerHTML = invHtml || "<p style='text-align:center;font-size:12px;'>No Invoices.</p>";
}

// PDF Generator using jsPDF
function createExactLogoImage() {
  const cvs = document.createElement('canvas'); cvs.width = 400; cvs.height = 100; const ctx = cvs.getContext('2d');
  ctx.font = 'bold 60px Arial'; ctx.fillStyle = '#0B0F19'; ctx.fillText('MoGo', 10, 70);
  ctx.font = 'bold 20px Arial'; ctx.fillStyle = '#FF5A00'; ctx.fillText('TOTAL BIKE CARE', 180, 70);
  return cvs.toDataURL('image/png');
}

function getSignatureImageForPDF() {
  try {
    const cvs = document.createElement('canvas'); cvs.width = 650; cvs.height = 380; const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height); ctx.strokeStyle = '#1E2B58'; ctx.fillStyle = '#1E2B58'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(85, 222); ctx.lineTo(255, 217); ctx.stroke();
    // Simplified Sig loop (same as before)
    return { data: cvs.toDataURL('image/png'), format: 'PNG' };
  } catch (e) { return null; }
}

function generatePDFFromDB(id, isPaid) {
  let rec = getRecord(id) || globalBookingData; if (!rec) return;
  const doc = new window.jspdf.jsPDF();
  doc.addImage(createExactLogoImage(), 'PNG', 20, 10, 80, 20);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("Mankiniamma Technologies Pvt. Ltd. | GSTIN: " + COMPANY_GSTIN, 20, 45);
  doc.text(isPaid ? "TAX INVOICE" : "SERVICE ESTIMATE", 150, 45);
  doc.line(20, 50, 190, 50);
  doc.setFont("helvetica", "normal");
  doc.text("ID: " + rec.id + " | Date: " + rec.date, 20, 60);
  doc.text("Customer: " + rec.name + " (" + rec.phone + ")", 20, 70);
  doc.text("Service: " + rec.serviceName + " - Rs. " + rec.grandTotal, 20, 80);
  
  if (isPaid) {
    let sub = rec.grandTotal / 1.18;
    doc.text("Subtotal: Rs. " + sub.toFixed(2) + " | CGST: Rs. " + (sub*0.09).toFixed(2) + " | SGST: Rs. " + (sub*0.09).toFixed(2), 20, 95);
    doc.text("Status: PAID (UTR: " + rec.utr + ")", 20, 105);
  } else {
    doc.text("Status: PAYMENT DUE", 20, 95);
  }
  doc.save("MoGo_" + rec.id + ".pdf");
}

document.addEventListener('DOMContentLoaded', function() {
  initAuth();
});
