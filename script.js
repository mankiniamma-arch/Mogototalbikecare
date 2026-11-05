const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyp9jl7Uu5thiilCriCwi8yE7Sc0Z2cY4OUkCdx3WDp1MmvWgNgMyszl77eWxrPIH4u-Q/exec";
const MY_WHATSAPP = "919954924948";
const TOTAL_PRICE = 89; 
const COMPANY_GSTIN = "18AASCM6250H1Z1"; 
const OFFICIAL_ADDRESS = "Building No./Flat No.: H/No.248, Dag No.332, K P Patta No 78, Pub Boragaon, Under Jalukbari Mouza, Guwahati Revenue Circle, Guwahati, Kamrup Metropolitan, Assam, 781035";
const RAZORPAY_KEY_ID = "rzp_live_TsqVswCcOu6NQS"; 
const _RZP_SYNC_TOKEN = "cnpwX2xpdmVfVHNxVnN3Q2NPdTZOUVM6UTY2NzkzeEQxSGFkYnRjbnFPWlk0UDVK";

// ==========================================================
// OFFICIAL META WHATSAPP CLOUD API CONFIGURATION
// ==========================================================
const WHATSAPP_API_KEY = "EAAdt66Ozx5UBS49ZCjckZBrZBfNa8j59l1uJC2NxZC4OvsZCskZC3hNPGXPqNzYZBhIBv6fv7oy1bD7xq54aSEF8IM7flMa0MTagHtWvxaBdUkc9ZAH33l1fUGYPZCIQRU5DnrQWT9ixN9LFUOq7pkEKO5jhLwXFSprObxEsugFpOxuVZAoO46UpsZCA6qPZAb0gqHaEWgZDZD"; 
const WHATSAPP_API_URL = "https://graph.facebook.com/v17.0/1358291930706909/messages"; 

let paymentType = "Pay Now", vehicleType = "Bike", selectedServiceKey = "wash", selectedServiceName = "Premium Foam Wash";
let globalBookingData = {}, customerCoords = null, fieldToFocus = null, alertCallback = null, vahanOtpStore = {};
let selectedInsurancePlan = { name: "1-Yr Third-Party Bike Policy (Partner Agency)", price: 714 };

// ==========================================================
// WHATSAPP API HELPER FUNCTIONS (WITH AUTO-FALLBACK SYSTEM)
// ==========================================================
function sendWhatsAppTemplate(toPhone, templateName, paramsArray) {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) return;
  
  let cleanPhone = "91" + toPhone.replace(/[^0-9]/g, '').slice(-10);
  let parameters = paramsArray.map(function(p) { return { type: "text", text: String(p) }; });
  
  // Basic payload for templates without buttons (like job_card, tax_invoice)
  let basePayload = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      components: [ { type: "body", parameters: parameters } ]
    }
  };

  let payloadsToTry = [ JSON.parse(JSON.stringify(basePayload)) ];
  
  // If sending OTP, try multiple button combinations to bypass Error 131008
  if (templateName === "auth_otp" || templateName === "vahan_otp") {
    let payloadBtnUrl = JSON.parse(JSON.stringify(basePayload));
    payloadBtnUrl.template.components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: String(paramsArray[0]) }] });
    
    let payloadNoBtn = JSON.parse(JSON.stringify(basePayload));
    
    let payloadBtnCopy = JSON.parse(JSON.stringify(basePayload));
    payloadBtnCopy.template.components.push({ type: "button", sub_type: "copy_code", index: "0", parameters: [{ type: "text", text: String(paramsArray[0]) }] });
    
    payloadsToTry = [payloadBtnUrl, payloadNoBtn, payloadBtnCopy];
  }

  function attemptFetch(index) {
    if (index >= payloadsToTry.length) return;
    fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + WHATSAPP_API_KEY },
      body: JSON.stringify(payloadsToTry[index])
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.error) {
         if (index < payloadsToTry.length - 1) {
           attemptFetch(index + 1); // Try the next format automatically
         } else {
           alert("🚨 META API ERROR: (" + data.error.code + ") " + data.error.message);
           console.error("Meta Error:", data.error);
         }
      }
    })
    .catch(function(e) { 
      if (index === payloadsToTry.length - 1) alert("🚨 NETWORK ERROR: " + e.message); 
    });
  }
  
  attemptFetch(0);
}

// ==========================================================
// SMART NUMBER PLATE FORMATTER (AS 01 AB 1234)
// ==========================================================
function formatVehicleNumber(input) {
  let val = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  let formatted = '';
  if (val.length > 0) formatted += val.substring(0, 2); 
  if (val.length > 2) formatted += ' ' + val.substring(2, 4); 
  if (val.length > 4) {
    let rest = val.substring(4);
    let letters = rest.match(/^[A-Z]+/);
    let nums = rest.replace(/^[A-Z]+/, '');
    if (letters) {
      formatted += ' ' + letters[0].substring(0, 3); 
      nums = rest.substring(letters[0].length);
      if (nums) formatted += ' ' + nums.substring(0, 4); 
    } else {
      if (nums) formatted += ' ' + nums.substring(0, 4);
    }
  }
  input.value = formatted;
  clearError(input.id);
}

// ==========================================================
// USER AUTHENTICATION SYSTEM (LOGIN OTP)
// ==========================================================
let loggedInUser = null;
let loginIntent = false; 

function initAuth() {
  try { let savedUser = localStorage.getItem('mogo_user'); if (savedUser) { loggedInUser = JSON.parse(savedUser); updateProfileUI(); } } catch (e) {}
}

function updateProfileUI() {
  const topBtn = document.getElementById('topLoginBtn');
  if (loggedInUser) {
    let shortName = loggedInUser.name ? loggedInUser.name.split(" ")[0] : "User";
    topBtn.innerText = "👤 " + shortName + " (Logout)";
    topBtn.classList.add('logged-in'); topBtn.onclick = logoutUser;
    if(loggedInUser.name) document.getElementById('cName').value = loggedInUser.name.toUpperCase();
    if(loggedInUser.phone) document.getElementById('cPhone').value = loggedInUser.phone;
    if(loggedInUser.email) document.getElementById('cEmail').value = loggedInUser.email;
  } else {
    topBtn.innerText = "👤 Login / Sign Up";
    topBtn.classList.remove('logged-in'); topBtn.onclick = function() { openAuthModal(false); };
  }
}

function logoutUser() {
  loggedInUser = null; localStorage.removeItem('mogo_user'); updateProfileUI(); 
  document.getElementById('cName').value = ""; document.getElementById('cPhone').value = ""; document.getElementById('cVehicleNo').value = "";
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

function parseJwt(token) { try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; } }
function handleGoogleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  if (payload) {
    loggedInUser = { name: payload.name, email: payload.email, phone: "", method: "Google" };
    localStorage.setItem('mogo_user', JSON.stringify(loggedInUser)); updateProfileUI(); closeAuthModal();
    showUiAlert("✅", "Login Successful", "Welcome back, " + payload.name + "!");
    if (loginIntent) { setTimeout(processFinalBooking, 1000); }
  }
}

let authGeneratedOtp = "";
function sendAuthOTP() {
  let phone = document.getElementById('authPhone').value.trim();
  if (!/^[0-9]{10}$/.test(phone)) {
    showUiAlert("📱", "Invalid Number", "Please enter a valid 10-digit mobile number.", "authPhone");
    return;
  }
  authGeneratedOtp = String(Math.floor(1000 + Math.random() * 9000));
  
  document.getElementById('authOtpSection').style.display = "block"; 
  document.getElementById('authOtp').value = ""; 
  document.getElementById('authOtp').focus();
  
  sendWhatsAppTemplate(phone, "auth_otp", [authGeneratedOtp]); 
}

function verifyAuthOTP() {
  let enteredOtp = document.getElementById('authOtp').value.trim();
  if (enteredOtp !== authGeneratedOtp || !enteredOtp) {
    showUiAlert("🔐", "Invalid OTP", "Please enter the correct 4-digit OTP.");
    return;
  }
  let phone = document.getElementById('authPhone').value.trim();
  loggedInUser = { name: "", email: "", phone: phone, method: "WhatsApp" };
  localStorage.setItem('mogo_user', JSON.stringify(loggedInUser)); updateProfileUI(); closeAuthModal();
  if (loginIntent) { processFinalBooking(); } else { showUiAlert("✅", "Login Successful", "You are now logged in with " + phone + "."); }
}

// ==========================================================
// REST OF THE EXISTING LOGIC (VAHAN, MAPS, PDF, RAZORPAY)
// ==========================================================
const BOTTOM_LEGAL_DATA = {
  privacy: { title: "🛡️ Privacy Policy (Indian & International Law)", html: `<h4>1. Constitutional & Statutory Mandate</h4><ul><li><strong>Constitution of India (Article 21):</strong> Upholds the Fundamental Right to Privacy.</li><li><strong>DPDP Act, 2023 & IT Act, 2000:</strong> Customer data is collected strictly with lawful consent.</li></ul>` },
  terms: { title: "📜 Terms & Conditions & Service Logic", html: `<h4>1. Legal Contract (Indian Contract Act, 1872)</h4><ul><li>All bookings constitute a valid electronic contract.</li><li><strong>Promotional Pricing Logic:</strong> Premium Foam Wash is offered at a special price of ₹89.00 (inclusive of 18% GST).</li></ul>` },
  legal: { title: "⚖️ Legal, Constitutional & International Charter", html: `<h4>1. Indian Constitutional & Statutory Framework</h4><ul><li><strong>Article 19(1)(g):</strong> Legitimate trade operations.</li><li><strong>GST Act, 2017:</strong> Registered taxpayer under GSTIN 18AASCM6250H1Z1.</li></ul>` },
  refund: { title: "💳 Refund, Cancellation & Consumer Rights", html: `<h4>1. Consumer Protection Act, 2019</h4><ul><li><strong>Free Cancellation:</strong> Prior to mechanic dispatch.</li><li><strong>Automated Refund:</strong> Processed back to original payment method within 3 to 5 business days.</li></ul>` },
  contact: { title: "🏢 Contact Us & Grievance Redressal Officer", html: `<h4>Official Corporate Details</h4><ul><li><strong>Website:</strong> mogototalbikecare.in</li><li><strong>Email:</strong> help@mogototalbikecare.in</li><li><strong>Phone:</strong> +91 99549 24948</li><li><strong>Address:</strong> Pub Boragaon, Guwahati, Assam, 781035</li></ul>` }
};

function openBottomLegalModal(key) { let item = BOTTOM_LEGAL_DATA[key]; if (!item) return; document.getElementById('bottomLegalTitle').innerHTML = item.title; document.getElementById('bottomLegalBody').innerHTML = item.html; document.getElementById('bottomLegalModal').classList.add('show'); }
function closeBottomLegalModal() { document.getElementById('bottomLegalModal').classList.remove('show'); }

function sendVahanWhatsAppOTP(moduleType) {
  let regEl = document.getElementById('reg-' + moduleType); let regNo = regEl ? regEl.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : ""; if (regEl) regEl.value = regNo;
  if (regNo.length < 6) return showUiAlert("🏍️", "Vehicle Number Required", "Please enter a valid Registration Number.");
  let cPhone = document.getElementById('cPhone').value.trim(); if (!/^[0-9]{10}$/.test(cPhone)) return showUiAlert("📱", "Mobile Number Required", "Enter 10-digit mobile number above.");

  let generatedOtp = String(Math.floor(1000 + Math.random() * 9000)); vahanOtpStore[moduleType] = { otp: generatedOtp, regNo: regNo, phone: cPhone };
  let otpBox = document.getElementById('otp-box-' + moduleType); let otpInput = document.getElementById('otp-input-' + moduleType); if (otpBox) otpBox.style.display = "block";
  document.getElementById('otp-msg-' + moduleType).innerText = "✅ WhatsApp OTP Sent! Please check your phone."; 
  
  if (otpInput) { otpInput.value = ""; otpInput.focus(); }
  
  sendWhatsAppTemplate(cPhone, "vahan_otp", [regNo, generatedOtp]);
}

async function verifyVahanOTPAndFetch(moduleType) {
  let store = vahanOtpStore[moduleType]; let otpInput = document.getElementById('otp-input-' + moduleType); let enteredOtp = otpInput ? otpInput.value.trim() : "";
  if (!store || enteredOtp !== store.otp) return showUiAlert("🔐", "Invalid OTP", "Please enter correct 4-digit OTP.");
  let resBox = document.getElementById('res-box-' + moduleType); resBox.style.display = "block"; resBox.innerHTML = "⏳ Fetching Vahan Data..."; let regNo = store.regNo;
  if (moduleType === 'insurance') {
    resBox.innerHTML = `<div style="margin-bottom:12px;"><strong>Vehicle:</strong> ${regNo}<br><strong>Status:</strong> <span style="color:#DC2626;font-weight:bold;">Renewal Due</span></div><div class="vahan-plan-option selected" id="ins-plan-tp" onclick="selectInsPlan('tp', '1-Yr Third-Party Policy', 714)"><div><strong>Third-Party Policy</strong><br><span style="font-size:11px; color:#6B7280;">Govt. Compliant</span></div><strong style="color:var(--primary); font-size:14px;">₹714</strong></div><div class="vahan-plan-option" id="ins-plan-comp" onclick="selectInsPlan('comp', '1-Yr Comprehensive Zero-Dep', 1249)"><div><strong>Comprehensive Policy</strong><br><span style="font-size:11px; color:#6B7280;">Full Cover</span></div><strong style="color:var(--primary); font-size:14px;">₹1,249</strong></div><button type="button" class="btn-main" style="margin-top:12px; padding:12px;" onclick="proceedVahanPaymentOrBooking('insurance', '${regNo}')">💳 Pay & Renew Policy</button>`;
  } else if (moduleType === 'puc') {
    resBox.innerHTML = `<div style="margin-bottom:12px;"><strong>Vehicle:</strong> ${regNo}<br><strong>PUC Status:</strong> <span style="color:#DC2626;font-weight:bold;">Expired</span><br><strong>Fine/Charge:</strong> ₹250</div><button type="button" class="btn-main" style="padding:12px; background:#16A34A;" onclick="proceedVahanPaymentOrBooking('puc_pay', '${regNo}', 250)">💳 Pay PUC Charge Online (₹250)</button>`;
  } else if (moduleType === 'echallan') {
    resBox.innerHTML = `<div style="margin-bottom:12px;"><strong>Vehicle:</strong> ${regNo}<br><strong>Pending Challan:</strong> ₹500</div><button type="button" class="btn-main" style="padding:12px; background:#DC2626;" onclick="proceedVahanPaymentOrBooking('echallan', '${regNo}', 500)">💳 Pay e-Challan (₹500)</button>`;
  }
}

function selectInsPlan(planKey, planName, price) { selectedInsurancePlan = { name: planName, price: price }; document.getElementById('ins-plan-tp')?.classList.toggle('selected', planKey === 'tp'); document.getElementById('ins-plan-comp')?.classList.toggle('selected', planKey === 'comp'); }
function proceedVahanPaymentOrBooking(actionType, regNo, customAmount) {
  let name = document.getElementById('cName').value.trim() || "Customer"; let phone = document.getElementById('cPhone').value.trim(); let addr = document.getElementById('cAddr').value.trim() || "Guwahati";
  if (!/^[0-9]{10}$/.test(phone)) return showUiAlert("📱", "Mobile Number Required", "Enter valid 10-digit mobile number.");
  let finalAmount = customAmount || (actionType === 'insurance' ? selectedInsurancePlan.price : TOTAL_PRICE); let svcTitle = actionType === 'insurance' ? selectedInsurancePlan.name : (actionType === 'puc_pay' ? "PUC Clearance" : "e-Challan Settlement");
  globalBookingData = { id: "MOGO" + Math.floor(1000 + Math.random() * 9000), date: new Date().toLocaleDateString('en-IN'), name: name, phone: phone, vehicle: vehicleType + " (" + regNo + ")", serviceName: svcTitle + " [" + regNo + "]", grandTotal: finalAmount, address: addr, paymentType: "Pay Now", status: "BOOKED", forceType: "JOB_CARD" };
  insertRecord(globalBookingData); document.getElementById('bookingForm').style.display = "none"; document.getElementById('successScreen').style.display = "block"; document.getElementById('qrPriceTitle').innerText = "Scan & Pay ₹" + finalAmount + " Securely"; document.getElementById('instantPayBtn').innerText = "⚡ Pay ₹" + finalAmount + " Instant (Auto-Generate Invoice)"; document.getElementById('qrSection').style.display = "block";
}

async function fillAddressFromCoords(lat, lon) {
  const addrInput = document.getElementById('cAddr'); const locBtn = document.getElementById('locBtn'); customerCoords = { lat: lat, lon: lon }; locBtn.disabled = false; locBtn.innerHTML = "✅ GPS Locked"; locBtn.style.background = "#DCFCE7"; locBtn.style.color = "#15803D"; addrInput.value = "Fetching exact street address...";
  try { let res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`); if (res.ok) { let data = await res.json(); if (data && data.display_name) { addrInput.value = data.display_name.replace(/, India$/i, '') + ` [GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}]`; return; } } } catch (e) {}
  addrInput.value = `Guwahati, Assam [GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}]`;
}

function getLocation() {
  let btn = document.getElementById('locBtn'); clearError('cAddr'); if (customerCoords && customerCoords.lat) { fillAddressFromCoords(customerCoords.lat, customerCoords.lon); return; }
  btn.disabled = true; btn.innerHTML = "⏳ Locating..."; navigator.geolocation.getCurrentPosition(pos => fillAddressFromCoords(pos.coords.latitude, pos.coords.longitude), err => { btn.disabled = false; btn.innerHTML = "📍 Auto Locate"; showUiAlert("📍", "Permission Denied", "Please allow GPS permission or type your address manually."); }, { enableHighAccuracy: true, timeout: 8000 });
}

function selectVehicle(t) { vehicleType = t; document.getElementById('v-bike').classList.toggle('active', t === 'Bike'); document.getElementById('v-scooty').classList.toggle('active', t === 'Scooty'); }
function selectPayType(t) { paymentType = t; document.getElementById('opt-now').classList.toggle('active', t === 'Pay Now'); document.getElementById('opt-after').classList.toggle('active', t !== 'Pay Now'); }

function toggleService(key, name, price) {
  let ids = ['wash', 'general', 'insurance', 'puc', 'echallan', 'emergency', 'mmc']; if (key === 'wash') { ids.forEach(k => document.getElementById('item-' + k)?.classList.remove('active')); document.getElementById('item-wash').classList.add('active'); selectedServiceKey = 'wash'; return; }
  let isOpen = document.getElementById('item-' + key).classList.contains('active'); ids.forEach(k => document.getElementById('item-' + k)?.classList.remove('active'));
  if (!isOpen) { document.getElementById('item-' + key).classList.add('active'); if (['insurance', 'puc', 'echallan'].includes(key)) { selectedServiceKey = key; selectedServiceName = name; currentServicePrice = price || TOTAL_PRICE; setTimeout(() => document.getElementById('reg-' + key)?.focus(), 300); } else { selectedServiceKey = key; selectedServiceName = name; currentServicePrice = 0; } } else { document.getElementById('item-wash').classList.add('active'); selectedServiceKey = 'wash'; }
}

function submitBooking() {
  let name = document.getElementById('cName').value.trim(), phone = document.getElementById('cPhone').value.trim(), addr = document.getElementById('cAddr').value.trim();
  let vNo = document.getElementById('cVehicleNo').value.trim(); 

  if (!name || !/^[0-9]{10}$/.test(phone) || !vNo || !addr) return showUiAlert("⚠️", "Missing Details", "Please fill name, phone, vehicle number, and address.");
  if (selectedServiceKey !== 'wash') return showUiAlert("🔒", "Feature Locked", "Select Premium Foam Wash or use Vahan module.");

  if (!loggedInUser) {
    showUiAlert("🔒", "Authentication Required", "Please Login or Sign Up to confirm your booking.");
    setTimeout(function() { openAuthModal(true); }, 1500); 
    return; 
  }
  processFinalBooking();
}

function processFinalBooking() {
  let name = document.getElementById('cName').value.trim(), phone = document.getElementById('cPhone').value.trim(), addr = document.getElementById('cAddr').value.trim();
  let vNo = document.getElementById('cVehicleNo').value.trim().toUpperCase(); 
  
  let id = "MOGO" + Math.floor(1000 + Math.random() * 9000);
  let subtotal = TOTAL_PRICE / 1.18;
  let finalVehicleStr = vehicleType + (vNo ? " (" + vNo + ")" : "");
  
  globalBookingData = {
    id: id, date: new Date().toLocaleDateString('en-IN'), name: name, phone: phone, vehicle: finalVehicleStr, serviceName: "Premium Foam Wash",
    grandTotal: TOTAL_PRICE, address: addr, paymentType: paymentType, status: "BOOKED", forceType: "JOB_CARD", utr: ""
  };
  
  insertRecord(globalBookingData);
  document.getElementById('bookingForm').style.display = "none";
  document.getElementById('successScreen').style.display = "block";
  document.getElementById('qrSection').style.display = paymentType === "Pay Now" ? "block" : "none";
  
  if (paymentType !== "Pay Now") {
    // ट्रिगर WhatsApp Job Card
    setTimeout(() => {
        sendWhatsAppTemplate(phone, "job_card", [name]);
    }, 500);
  }
  
  if (paymentType === "Pay Now") setTimeout(triggerRazorpayPayment, 400);
}

function triggerRazorpayPayment() {
  if (!globalBookingData.id) return;
  let rzp = new window.Razorpay({
    key: RAZORPAY_KEY_ID, amount: globalBookingData.grandTotal * 100, currency: "INR",
    name: "Mankiniamma Technologies", description: globalBookingData.serviceName,
    handler: function (res) {
      globalBookingData.utr = res.razorpay_payment_id; globalBookingData.forceType = 'TAX_INVOICE'; globalBookingData.status = 'INVOICE_GENERATED';
      updateRecord(globalBookingData.id, { utr: res.razorpay_payment_id, forceType: 'TAX_INVOICE', status: 'INVOICE_GENERATED' });
      document.getElementById('successHeading').innerText = "Payment Verified! ✅";
      
      // ✅ FIX 1: स्क्रीन पर टैक्स इनवॉइस (A4 View) को तुरंत पॉप-अप (Modal) में दिखाना 
      viewJobCardModal(globalBookingData.id, false);
      
      // ✅ FIX 2: WhatsApp पर 'tax_invoice' तुरंत ट्रिगर करना
      setTimeout(() => {
          sendWhatsAppTemplate(globalBookingData.phone, "tax_invoice", [globalBookingData.name]);
      }, 500);
    },
    prefill: { contact: globalBookingData.phone }, theme: { color: "#FF5A00" }
  });
  rzp.open();
}

function handleCustomerUtrInput() {
  let utr = document.getElementById('customerUtr')?.value.trim();
  if (utr.length >= 4) {
    globalBookingData.utr = utr; globalBookingData.forceType = 'TAX_INVOICE'; globalBookingData.status = 'INVOICE_GENERATED';
    updateRecord(globalBookingData.id, { utr: utr, forceType: 'TAX_INVOICE', status: 'INVOICE_GENERATED' });
    
    let pdfBtn = document.getElementById('pdfDownloadBtn');
    if(pdfBtn) {
       pdfBtn.innerText = "👁️ View & Download Paid Tax Invoice (PDF)";
       pdfBtn.style.background = "#16A34A";
    }
    
    // ✅ FIX 1: स्क्रीन पर टैक्स इनवॉइस (A4 View) को तुरंत पॉप-अप (Modal) में दिखाना 
    viewJobCardModal(globalBookingData.id, false);
    
    // ✅ FIX 2: WhatsApp पर 'tax_invoice' तुरंत ट्रिगर करना
    setTimeout(() => {
        sendWhatsAppTemplate(globalBookingData.phone, "tax_invoice", [globalBookingData.name]);
    }, 500);
  } else {
    showUiAlert("⚠️", "Invalid UTR", "Please enter a valid UTR/Reference number.");
  }
}

// Database & UI Sync
const HISTORICAL_RECORDS_SEED = [ { id: "MOGO8841", date: "28/10/2026", name: "SHANKAR BISWAS", phone: "9864012345", vehicle: "Bike", serviceName: "Premium Foam Wash", slot: "Standard Doorstep Service", address: "Guwahati, Assam", paymentType: "Pay Now", status: "INVOICE_GENERATED", utr: "pay_RZP_SHANKAR89", forceType: "TAX_INVOICE" }, { id: "MOGO4618", date: "26/10/2026", name: "Mankini Amma", phone: "6000631014", vehicle: "Bike", serviceName: "Premium Foam Wash", slot: "Standard Doorstep Service", address: "Central Gotanagar Railway Qtr No 312/B Maligaon Guwahati", paymentType: "Pay Now", status: "INVOICE_GENERATED", utr: "HFIEHFIBSKBZ", forceType: "TAX_INVOICE" }, { id: "MOGO2966", date: "25/10/2026", name: "KODA RAJESH", phone: "6000631014", vehicle: "Bike", serviceName: "Premium Foam Wash", slot: "Standard Doorstep Service", address: "Railway Colony, Maligaon, Guwahati, Kamrup Metropolitan, Assam, 781011", paymentType: "Pay Now", status: "INVOICE_GENERATED", utr: "R57392694HDBSKSG", forceType: "TAX_INVOICE" } ];
function getDB() { try { let db = localStorage.getItem('mogo_local_db'); let parsed = db ? JSON.parse(db) : []; return Array.isArray(parsed) ? parsed : []; } catch(e) { return []; } }
function saveDB(db) { try { localStorage.setItem('mogo_local_db', JSON.stringify(db)); } catch(e) {} }
function getDeletedIds() { try { let raw = localStorage.getItem('mogo_deleted_ids'); return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []; } catch (e) { return []; } }
function markIdDeleted(id) { try { let arr = getDeletedIds(); if (arr.indexOf(id) === -1) arr.push(id); localStorage.setItem('mogo_deleted_ids', JSON.stringify(arr)); } catch (e) {} }
function insertRecord(data) { let db = getDB(); let existingIdx = db.findIndex(function(x) { return x.id === data.id; }); if (existingIdx !== -1) { db[existingIdx] = Object.assign({}, db[existingIdx], data); } else { db.unshift(data); } saveDB(db); renderAdminDB(); renderMechanicJobs(); }
function getRecord(id) { return getDB().find(function(x) { return x.id === id; }); }
function updateRecord(id, updates) { let db = getDB(); let found = false; for (let i = 0; i < db.length; i++) { if (db[i].id === id) { db[i] = Object.assign({}, db[i], updates); found = true; break; } } if (!found && globalBookingData && globalBookingData.id === id) { db.unshift(Object.assign({}, globalBookingData, updates)); } saveDB(db); renderAdminDB(); renderMechanicJobs(); }
function deleteRecord(id) { document.getElementById('alertActionButtons').style.display = 'none'; document.getElementById('alertOkBtn').style.display = 'block'; markIdDeleted(id); let db = getDB().filter(function(item) { return item.id !== id; }); saveDB(db); renderAdminDB(); renderMechanicJobs(); closeUiAlert(); }
function mergeIncomingRowsIntoDB(rows, ignoreDeleted) { if (!Array.isArray(rows) || rows.length === 0) return; let localDb = getDB(), deletedIds = ignoreDeleted ? [] : getDeletedIds(), mapById = {}; localDb.forEach(function(item) { if (item && item.id) mapById[item.id] = item; }); rows.forEach(function(r) { if (!r) return; let rId = String(r.id || r.bookingId || "").trim(); let rUtr = String(r.utr || "").trim(); if (!rId && rUtr) rId = "MOGO" + rUtr.slice(-4).toUpperCase(); if (!rId || deletedIds.indexOf(rId) !== -1) return; let rName = String(r.name || r.customerName || "Customer").trim(); if (/shankar\s*biswas/i.test(rName) && mapById["MOGO8841"] && rId !== "MOGO8841") delete mapById["MOGO8841"]; let rForce = (r.forceType === 'TAX_INVOICE' || r.status === 'INVOICE_GENERATED' || r.status === 'captured' || rUtr.length >= 4) ? 'TAX_INVOICE' : 'JOB_CARD'; let rAmt = (r.isVahanService && r.grandTotal) ? Number(r.grandTotal) : TOTAL_PRICE; let sub = rAmt / 1.18; let existing = mapById[rId]; if (!existing) { mapById[rId] = { id: rId, date: String(r.date || new Date().toLocaleDateString('en-IN')), name: rName, phone: String(r.phone || "").replace(/^\+91/, ''), vehicle: String(r.vehicle || "Bike"), serviceName: String(r.serviceName || "Premium Foam Wash"), slot: String(r.slot || "Standard Doorstep Service"), total: sub, cgst: sub * 0.09, sgst: sub * 0.09, grandTotal: rAmt, address: String(r.address || "Guwahati, Assam"), paymentType: String(r.paymentType || (rForce === 'TAX_INVOICE' ? "Pay Now" : "Pay After Service")), status: rForce === 'TAX_INVOICE' ? "INVOICE_GENERATED" : "BOOKED", utr: rUtr || (rForce === 'TAX_INVOICE' ? "VERIFIED" : ""), forceType: rForce, isVahanService: Boolean(r.isVahanService), gpsImage: null }; } else { if (rForce === 'TAX_INVOICE') { existing.forceType = 'TAX_INVOICE'; existing.status = 'INVOICE_GENERATED'; } if (rUtr && (!existing.utr || existing.utr === "VERIFIED" || existing.utr === "pay_RZP_SHANKAR89")) existing.utr = rUtr; } }); saveDB(Object.keys(mapById).map(function(k) { return mapById[k]; })); }
async function fetchLiveRazorpayPayments(ignoreDeleted) { const proxyUrls = [ "https://api.razorpay.com/v1/payments?count=50" ]; for (let i = 0; i < proxyUrls.length; i++) { try { let res = await fetch(proxyUrls[i], { method: "GET", headers: { "Authorization": "Basic " + _RZP_SYNC_TOKEN } }); if (res.ok) { let data = await res.json(); if (data && Array.isArray(data.items)) { let mapped = []; data.items.forEach(function(p) { if (p && (p.status === 'captured' || p.status === 'authorized')) { let notes = p.notes || {}; let bId = notes.booking_id || ""; if (!bId && p.description && p.description.indexOf("MOGO") !== -1) { let m = p.description.match(/MOGO\d+/); if (m) bId = m[0]; } if (!bId) bId = "MOGO" + String(p.id).slice(-4).toUpperCase(); mapped.push({ id: bId, date: p.created_at ? new Date(p.created_at * 1000).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'), name: notes.customer_name || "Paid Customer", phone: String(notes.customer_phone || "").replace(/[^0-9]/g, '').slice(-10), vehicle: notes.vehicle || "Bike", address: notes.service_address || "Guwahati, Assam", utr: p.id, status: "INVOICE_GENERATED", forceType: "TAX_INVOICE" }); } }); if (mapped.length > 0) { mergeIncomingRowsIntoDB(mapped, ignoreDeleted); return true; } } } } catch (e) {} } return false; }
async function syncCloudDatabase(showFeedback, ignoreDeleted) { let admStat = document.getElementById('adminSyncStatus'), mechStat = document.getElementById('mechSyncStatus'); if (showFeedback) { if (admStat) admStat.innerText = "⏳ Syncing Razorpay & Cloud DB..."; if (mechStat) mechStat.innerText = "⏳ Syncing Live Job Cards..."; } mergeIncomingRowsIntoDB(HISTORICAL_RECORDS_SEED, ignoreDeleted); await fetchLiveRazorpayPayments(ignoreDeleted); try { let res = await fetch(SCRIPT_URL + "?action=getBookings&t=" + Date.now()); if (res.ok) { let cloudData = await res.json(); let rows = Array.isArray(cloudData) ? cloudData : (cloudData && Array.isArray(cloudData.data) ? cloudData.data : []); if (rows.length > 0) mergeIncomingRowsIntoDB(rows, ignoreDeleted); } } catch (e) {} renderAdminDB(); renderMechanicJobs(); if (admStat) admStat.innerText = "🟢 All Paid Invoices & Job Cards Synced"; if (mechStat) mechStat.innerText = "🟢 All Assigned Job Cards Synced"; }
function restoreAndSyncAllData() { try { localStorage.removeItem('mogo_deleted_ids'); } catch (e) {} syncCloudDatabase(true, true); }

function clearError(id) { let el = document.getElementById(id); if (el) el.classList.remove('input-error'); }
function showUiAlert(icon, title, message, inputId) { document.getElementById('uiAlertIcon').innerHTML = icon || "⚠️"; document.getElementById('uiAlertTitle').innerText = title || "Notice"; document.getElementById('uiAlertMsg').innerText = message || ""; fieldToFocus = inputId || null; if (inputId) { let el = document.getElementById(inputId); if (el) el.classList.add('input-error'); } document.getElementById('alertActionButtons').style.display = 'none'; document.getElementById('alertOkBtn').style.display = 'block'; document.getElementById('uiAlertModal').classList.add('show'); }
function showConfirmAlert(icon, title, message, confirmCallback) { document.getElementById('uiAlertIcon').innerHTML = icon || "🗑️"; document.getElementById('uiAlertTitle').innerText = title || "Confirm"; document.getElementById('uiAlertMsg').innerText = message || ""; document.getElementById('alertOkBtn').style.display = 'none'; document.getElementById('alertActionButtons').style.display = 'flex'; document.getElementById('alertConfirmBtn').onclick = confirmCallback; document.getElementById('uiAlertModal').classList.add('show'); }
function closeUiAlert() { document.getElementById('uiAlertModal').classList.remove('show'); if (fieldToFocus) { let el = document.getElementById(fieldToFocus); if (el) setTimeout(function() { el.focus(); }, 150); fieldToFocus = null; } }
function showCustomAlert(title, message, isPrompt, callback) { document.getElementById('customAlertTitle').innerText = title; document.getElementById('customAlertMsg').innerText = message; alertCallback = callback || null; let inputContainer = document.getElementById('customAlertInputContainer'), inputField = document.getElementById('customAlertInput'), cancelBtn = document.getElementById('customAlertBtnCancel'); if (isPrompt) { inputContainer.style.display = 'block'; inputField.value = ''; cancelBtn.style.display = 'block'; } else { inputContainer.style.display = 'none'; cancelBtn.style.display = 'none'; } document.getElementById('customAlertModal').classList.add('show'); if (isPrompt) setTimeout(function() { inputField.focus(); }, 100); }
function closeCustomAlert(isOk) { document.getElementById('customAlertModal').classList.remove('show'); let inputField = document.getElementById('customAlertInput'); let val = inputField ? inputField.value.trim() : ""; if (alertCallback) { let cb = alertCallback; alertCallback = null; if (document.getElementById('customAlertInputContainer').style.display === 'block') { cb(isOk ? val : null); } else { cb(isOk); } } }
function openAdminPortal() { document.getElementById('adminModal').classList.add('show'); document.getElementById('adminPinSection').style.display = 'block'; document.getElementById('adminDashboard').style.display = 'none'; }
function closeAdminPortal() { document.getElementById('adminModal').classList.remove('show'); }
function verifyAdminPin() { if (document.getElementById('adminPinInput').value === "4882") { document.getElementById('adminPinSection').style.display = 'none'; document.getElementById('adminDashboard').style.display = 'block'; renderAdminDB(); switchAdminTab('jc'); } else showUiAlert("🔐", "Error", "Invalid Admin PIN"); }
function openMechanicPortal() { document.getElementById('mechanicModal').classList.add('show'); document.getElementById('mechPinSection').style.display = 'block'; document.getElementById('mechDashboard').style.display = 'none'; }
function closeMechanicPortal() { document.getElementById('mechanicModal').classList.remove('show'); }
function verifyMechPin() { if (document.getElementById('mechPinInput').value === "7788") { document.getElementById('mechPinSection').style.display = 'none'; document.getElementById('mechDashboard').style.display = 'block'; renderMechanicJobs(); } else showUiAlert("🔐", "Error", "Invalid Technician PIN"); }
function switchAdminTab(tab) { ['jc', 'inv', 'gen'].forEach(t => document.getElementById('tab-' + t).classList.toggle('active', t === tab)); document.getElementById('view-jc').style.display = tab === 'jc' ? 'flex' : 'none'; document.getElementById('view-inv').style.display = tab === 'inv' ? 'flex' : 'none'; document.getElementById('view-gen').style.display = tab === 'gen' ? 'block' : 'none'; }
function toggleAdminUtrRequirement() { let docType = document.getElementById('admDocType').value; let lbl = document.getElementById('admUtrLabel'); if (docType === 'TAX_INVOICE') { lbl.innerText = "UTR / Payment Proof (Mandatory for Tax Invoice):"; lbl.style.color = "#DC2626"; } else { lbl.innerText = "UTR / Payment Proof (Optional for Job Card):"; lbl.style.color = "#0B0F19"; } }
function renderMechanicJobs() { let db = getDB(), html = ""; db.forEach(function(item) { let amt = (item.isVahanService && item.grandTotal) ? item.grandTotal : TOTAL_PRICE; html += `<div class="db-item"><div class="db-header"><span class="db-id">${item.id}</span> <span class="badge b-booked">Job Sheet</span></div><div class="db-info"><strong>${item.name}</strong> (${item.phone})<br>Vehicle: ${item.vehicle} | ${item.serviceName} (₹${amt})<br>📍 ${item.address}</div><div class="db-action"><button class="btn-sm" type="button" style="background:#0284C7; color:#fff;" onclick="viewJobCardModal('${item.id}', true)">👁️ View Job Sheet (A4)</button><a href="tel:${item.phone}" class="btn-sm" style="background:#16A34A; color:#fff; text-decoration:none; display:flex; align-items:center; justify-content:center;">📞 Call Customer</a></div></div>`; }); document.getElementById('mechJobList').innerHTML = html || '<p style="text-align:center; font-size:12px; color:#94A3B8; padding:20px;">No assigned jobs yet.</p>'; }
function renderAdminDB() { let db = getDB(), jcHTML = "", invHTML = "", jcCount = 0, invCount = 0; db.forEach(function(item) { let hasValidUtr = item.utr && item.utr.trim().length >= 4, isInv = (item.forceType === 'TAX_INVOICE' || item.status === 'INVOICE_GENERATED' || hasValidUtr || Boolean(item.gpsImage)), jcBadge = isInv ? '<span class="badge b-ready">✅ Job Sheet (Paid)</span>' : '<span class="badge b-booked">⏳ Job Sheet (Unpaid)</span>', amt = (item.isVahanService && item.grandTotal) ? item.grandTotal : TOTAL_PRICE; jcCount++; let jcActions = `<button class="btn-sm" type="button" style="background:#0284C7; color:#fff;" onclick="viewJobCardModal('${item.id}', true)">👁️ View Job Sheet</button>${!isInv ? `<button class="btn-sm" type="button" style="background:#16A34A; color:#fff;" onclick="promptConvertToInvoice('${item.id}')">✅ Enter UTR & Make Invoice</button>` : `<button class="btn-sm" type="button" style="background:#16A34A; color:#fff;" onclick="viewJobCardModal('${item.id}', false)">🧾 View Invoice</button>`}`; jcHTML += `<div class="db-item"><div class="db-header"><span class="db-id">${item.id}</span> ${jcBadge}</div><div class="db-info"><strong>${item.name}</strong> | ${item.phone}<br>${item.serviceName} (₹${amt}) | ${item.date}<br>📍 ${item.address}</div><div class="db-action">${jcActions}<button class="btn-del" type="button" onclick="showConfirmAlert('🗑️', 'Delete Record?', 'Permanently delete ${item.id}?', function(){deleteRecord('${item.id}')})">✖</button></div></div>`; if (isInv) { invCount++; invHTML += `<div class="db-item"><div class="db-header"><span class="db-id">${item.id}</span> <span class="badge b-ready">🟢 Paid Tax Invoice</span></div><div class="db-info"><strong>${item.name}</strong> | ${item.phone}<br>${item.serviceName} (₹${amt}) | UTR: ${item.utr || 'VERIFIED'}<br>📍 ${item.address}</div><div class="db-action"><button class="btn-sm" type="button" style="background:#16A34A; color:#fff;" onclick="viewJobCardModal('${item.id}', false)">👁️ View Tax Invoice</button><button class="btn-sm" type="button" style="background:#0284C7; color:#fff;" onclick="viewJobCardModal('${item.id}', true)">📋 Job Sheet</button><button class="btn-del" type="button" onclick="showConfirmAlert('🗑️', 'Delete Record?', 'Permanently delete ${item.id}?', function(){deleteRecord('${item.id}')})">✖</button></div></div>`; } }); let cJcEl = document.getElementById('count-jc'), cInvEl = document.getElementById('count-inv'); if (cJcEl) cJcEl.innerText = "(" + jcCount + ")"; if (cInvEl) cInvEl.innerText = "(" + invCount + ")"; document.getElementById('view-jc').innerHTML = jcHTML || '<p style="text-align:center; font-size:12px; color:#94A3B8; padding:20px;">No Job Cards yet.</p>'; document.getElementById('view-inv').innerHTML = invHTML || '<p style="text-align:center; font-size:12px; color:#94A3B8; padding:20px;">No Paid Invoices yet. Enter UTR on a Job Card to generate Invoice.</p>'; }

function processAdminForm() { let name = document.getElementById('admName').value.trim(), phone = document.getElementById('admPhone').value.trim(), vehicle = document.getElementById('admVehicle').value || "Bike", addr = document.getElementById('admAddr').value.trim() || "Guwahati, Assam", docType = document.getElementById('admDocType').value, utr = document.getElementById('admUtr').value.trim(), fileInput = document.getElementById('admGpsImg'); if (!name) return showUiAlert("👤", "Name Required", "Please enter customer full name."); if (!/^[0-9]{10}$/.test(phone)) return showUiAlert("📱", "Invalid Phone", "Please enter a valid 10-digit mobile number."); if (docType === 'TAX_INVOICE' && utr.length < 4 && (!fileInput.files || fileInput.files.length === 0)) return showUiAlert("⚠️", "UTR Required for Invoice", "Paid Tax Invoice cannot be generated without entering a valid UTR number (min 4 chars) or uploading payment proof."); let recId = "MOGO" + Math.floor(1000 + Math.random() * 9000), subtotal = TOTAL_PRICE / 1.18, cgst = subtotal * 0.09, sgst = subtotal * 0.09; let newRec = { id: recId, date: new Date().toLocaleDateString('en-IN'), name: name, phone: phone, vehicle: vehicle, serviceName: "Premium Foam Wash", slot: "Standard Doorstep Service", total: subtotal, cgst: cgst, sgst: sgst, grandTotal: TOTAL_PRICE, address: addr, paymentType: docType === 'TAX_INVOICE' ? 'Pay Now' : 'Pay After Service', utr: docType === 'TAX_INVOICE' ? (utr || "PROOF-ATTACHED") : "", forceType: docType, gpsImage: null, status: docType === 'TAX_INVOICE' ? 'INVOICE_GENERATED' : 'BOOKED' }; if (fileInput.files && fileInput.files[0]) { let reader = new FileReader(); reader.onload = function(e) { let imgObj = new Image(); imgObj.onload = function() { let cvs = document.createElement('canvas'), scale = Math.min(800 / imgObj.width, 800 / imgObj.height, 1); cvs.width = imgObj.width * scale; cvs.height = imgObj.height * scale; let cCtx = cvs.getContext('2d'); cCtx.fillStyle = '#FFFFFF'; cCtx.fillRect(0, 0, cvs.width, cvs.height); cCtx.drawImage(imgObj, 0, 0, cvs.width, cvs.height); newRec.gpsImage = cvs.toDataURL('image/jpeg', 0.82); newRec.imgW = cvs.width; newRec.imgH = cvs.height; globalBookingData = newRec; insertRecord(newRec); renderAdminDB(); renderMechanicJobs(); switchAdminTab(docType === 'TAX_INVOICE' ? 'inv' : 'jc'); viewJobCardModal(newRec.id, docType !== 'TAX_INVOICE'); }; imgObj.src = e.target.result; }; reader.readAsDataURL(fileInput.files[0]); } else { globalBookingData = newRec; insertRecord(newRec); renderAdminDB(); renderMechanicJobs(); switchAdminTab(docType === 'TAX_INVOICE' ? 'inv' : 'jc'); viewJobCardModal(newRec.id, docType !== 'TAX_INVOICE'); } }
function promptConvertToInvoice(id) { showCustomAlert("Enter Payment UTR", "Tax Invoice requires a valid UPI UTR / Transaction ID (minimum 4 characters):", true, function(utr) { if (utr === null) return; if (!utr || utr.trim().length < 4) { showUiAlert("⚠️", "UTR Required", "Cannot generate Tax Invoice without a valid UTR / Transaction ID."); return; } convertToInvoice(id, utr.trim()); }); }
function convertToInvoice(id, utr) { updateRecord(id, { forceType: 'TAX_INVOICE', status: 'INVOICE_GENERATED', utr: utr }); renderAdminDB(); renderMechanicJobs(); switchAdminTab('inv'); viewJobCardModal(id, false); }

function viewJobCardModal(id, forceJobCard) {
  let rec = getRecord(id); if (!rec && globalBookingData && globalBookingData.id === id) { rec = globalBookingData; }
  if (!rec) return showUiAlert("⚠️", "Record Not Found", "Could not load this record. Please tap Sync & Restore All.");
  let hasValidUtr = rec.utr && rec.utr.trim().length >= 4; let isPaidInvoice = forceJobCard ? false : (rec.forceType === 'TAX_INVOICE' || hasValidUtr || Boolean(rec.gpsImage));
  let bgCol = isPaidInvoice ? '#FFFFFF' : '#FEFCE8'; let docHeading = isPaidInvoice ? 'TAX INVOICE' : 'SERVICE JOB CARD / ESTIMATE';
  document.getElementById('previewModalTitle').innerText = isPaidInvoice ? 'A4 Tax Invoice View' : 'A4 Service Job Card View';
  let logoDataUrl = createExactLogoImage(); let stampDataUrl = createRubberStampImage(isPaidInvoice); let sigObj = getSignatureImageForPDF();
  let contentBox = document.getElementById('viewCardContent'); contentBox.style.background = bgCol;
  let priceVal = (rec.isVahanService && rec.grandTotal) ? Number(rec.grandTotal) : TOTAL_PRICE; let subVal = priceVal / 1.18; let cgstVal = subVal * 0.09; let sgstVal = subVal * 0.09;
  let taxAndTermsHtml = isPaidInvoice ? `<div style="border-top:1px solid #CBD5E1; margin-top:10px; padding-top:8px; font-size:11.5px;"><div style="display:flex; justify-content:space-between;"><span>Taxable Amount (Subtotal):</span><strong>Rs. ${subVal.toFixed(2)}</strong></div><div style="display:flex; justify-content:space-between;"><span>CGST @ 9% (Central Tax):</span><strong>Rs. ${cgstVal.toFixed(2)}</strong></div><div style="display:flex; justify-content:space-between;"><span>SGST @ 9% (State Tax):</span><strong>Rs. ${sgstVal.toFixed(2)}</strong></div><div style="display:flex; justify-content:space-between; font-size:13.5px; color:#FF5A00; margin-top:5px; border-top:1px dashed #CBD5E1; padding-top:5px;"><strong>Grand Total (Incl. 18% GST):</strong><strong>Rs. ${priceVal.toFixed(2)}</strong></div></div><div style="margin-top:8px; font-size:10.5px; font-weight:700; color:#15803D;">Payment Status: Paid & Verified [UTR/Ref: ${rec.utr || 'VERIFIED'}]</div><div style="margin-top:8px; font-size:9.5px; color:#475569; line-height:1.35;"><strong>TERMS & CONDITIONS / JUDICIAL JURISDICTION:</strong><br>1. Goods and services rendered are subject to Mankiniamma Technologies Private Limited standard operating policies.<br>2. All disputes, claims, and legal proceedings are subject exclusively to the judicial jurisdiction of courts located in Guwahati, Assam.<br>3. This is an electronically generated tax invoice compliant with statutory laws.</div>` : `<div style="border-top:1px solid #CBD5E1; margin-top:10px; padding-top:8px; display:flex; justify-content:space-between; font-size:13.5px; color:#FF5A00;"><strong>Estimated Amount:</strong><strong>Rs. ${priceVal.toFixed(2)}</strong></div><div style="margin-top:8px; font-size:10.5px; font-weight:700; color:#B45309;">Payment Status: Payment Due (Pay Cash / QR After Service)</div>`;
  let html = `<div style="text-align:center; border-bottom:1px solid #E2E8F0; padding-bottom:8px; margin-bottom:10px;"><img src="${logoDataUrl}" style="width:170px; height:auto; display:block; margin:0 auto 4px;"><div style="font-weight:800; font-size:11px; color:#334155;">Mankiniamma Technologies Private Limited</div><div style="font-size:9px; color:#64748B; line-height:1.25; margin:2px 0;">${OFFICIAL_ADDRESS}</div><div style="font-size:10.5px; color:#0B0F19; font-weight:800; margin-top:2px;">GSTIN: ${COMPANY_GSTIN}</div><div style="font-weight:900; font-size:14px; color:#0B0F19; margin-top:6px; letter-spacing:0.5px;">${docHeading}</div></div><div style="font-size:11px; line-height:1.5;"><div style="display:flex; justify-content:space-between;"><span><strong>Booking ID:</strong> ${rec.id}</span><span><strong>Date:</strong> ${rec.date}</span></div><div><strong>Customer Name:</strong> ${rec.name}</div><div><strong>Contact Number:</strong> ${rec.phone}</div><div><strong>Vehicle Type:</strong> ${rec.vehicle}</div><div><strong>Service Address:</strong> ${rec.address || 'Guwahati, Assam'}</div></div><div style="border-top:1px solid #CBD5E1; margin-top:8px; padding-top:6px; font-size:11.5px;"><div style="display:flex; justify-content:space-between; font-weight:800; margin-bottom:4px;"><span>Service Description</span><span>Amount (INR)</span></div><div style="display:flex; justify-content:space-between;"><span>1. ${rec.serviceName || 'Premium Foam Wash'}</span><span>Rs. ${priceVal.toFixed(2)}</span></div></div>${taxAndTermsHtml}<div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:14px; padding-top:10px; border-top:1px solid #E2E8F0;"><div style="text-align:center;"><img src="${stampDataUrl}" style="width:86px; height:86px; object-fit:contain;"></div><div style="text-align:center;"><img src="${sigObj ? sigObj.data : ''}" style="width:115px; height:62px; object-fit:contain; display:block; margin:0 auto -6px;"><div style="border-top:1px solid #0B0F19; font-size:10px; font-weight:800; padding-top:2px; width:125px;">Authorized Signatory</div></div></div>`;
  contentBox.innerHTML = html; let dlBtn = document.getElementById('modalDownloadPdfBtn'); dlBtn.innerHTML = isPaidInvoice ? "📥 Download Paid Tax Invoice (PDF)" : "📥 Download Service Job Card (PDF)"; dlBtn.style.background = isPaidInvoice ? "#16A34A" : "#0F172A"; dlBtn.onclick = function() { generatePDFFromDB(id, isPaidInvoice, forceJobCard); }; document.getElementById('viewCardModal').classList.add('show');
}
function closeViewCard() { document.getElementById('viewCardModal').classList.remove('show'); }
function previewCurrentBookingDoc() { if (!globalBookingData || !globalBookingData.id) return; let isPaid = globalBookingData.forceType === 'TAX_INVOICE'; viewJobCardModal(globalBookingData.id, !isPaid); }

function createExactLogoImage() {
  const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 290; const ctx = canvas.getContext('2d'); ctx.textBaseline = 'middle'; const cy = 105; ctx.font = 'bold 130px Arial'; ctx.fillStyle = '#0B0F19'; ctx.fillText('M', 75, cy + 5); ctx.font = 'bold 85px Arial'; ctx.fillStyle = '#FF5A00'; ctx.fillText('+', 215, cy);
  function drawWheel(wx, wy, radius) { ctx.save(); ctx.shadowColor = 'rgba(255, 90, 0, 0.25)'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(wx, wy, radius, 0, Math.PI * 2); ctx.strokeStyle = '#FF5A00'; ctx.lineWidth = 22; ctx.stroke(); ctx.restore(); ctx.beginPath(); ctx.arc(wx, wy, radius - 13, 0, Math.PI * 2); ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = '#0B0F19'; ctx.lineWidth = 6.5; for (let i = 0; i < 4; i++) { let angle = (i * Math.PI) / 4; ctx.beginPath(); ctx.moveTo(wx - Math.cos(angle) * (radius - 8), wy - Math.sin(angle) * (radius - 8)); ctx.lineTo(wx + Math.cos(angle) * (radius - 8), wy + Math.sin(angle) * (radius - 8)); ctx.stroke(); } ctx.beginPath(); ctx.arc(wx, wy, 15, 0, Math.PI * 2); ctx.fillStyle = '#FF5A00'; ctx.fill(); ctx.beginPath(); ctx.arc(wx, wy, 6, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill(); }
  drawWheel(350, cy, 56); ctx.font = 'bold 85px Arial'; ctx.fillStyle = '#FF5A00'; ctx.fillText('+', 435, cy); ctx.font = 'bold 130px Arial'; ctx.fillStyle = '#0B0F19'; ctx.fillText('G', 510, cy + 5); ctx.font = 'bold 85px Arial'; ctx.fillStyle = '#FF5A00'; ctx.fillText('+', 635, cy); drawWheel(770, cy, 56); ctx.font = 'bold 85px Arial'; ctx.fillStyle = '#FF5A00'; ctx.fillText('=', 850, cy); ctx.font = 'bold 32px Arial'; ctx.fillStyle = '#FF5A00'; ctx.textAlign = 'center'; ctx.fillText('T O T A L   B I K E   C A R E', canvas.width / 2 + 15, 235); return canvas.toDataURL('image/png');
}
function createRubberStampImage(isGreen) {
  const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600; const ctx = canvas.getContext('2d'); const col = isGreen ? '#16A34A' : '#DC2626'; const bgFill = isGreen ? '#FFFFFF' : '#FEFCE8'; ctx.save(); ctx.translate(300, 300); ctx.rotate(-15 * Math.PI / 180); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(0, 0, 230, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 4;  ctx.beginPath(); ctx.arc(0, 0, 208, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 6;  ctx.beginPath(); ctx.arc(0, 0, 136, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 2.5;ctx.beginPath(); ctx.arc(0, 0, 124, 0, Math.PI * 2); ctx.stroke(); ctx.font = 'bold 48px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let topText = "MTPL", topAngle = 0.9, startT = -Math.PI / 2 - topAngle / 2; for (let i = 0; i < topText.length; i++) { let theta = startT + (i / (topText.length - 1)) * topAngle; ctx.save(); ctx.translate(172 * Math.cos(theta), 172 * Math.sin(theta)); ctx.rotate(theta + Math.PI / 2); ctx.fillText(topText[i], 0, 0); ctx.restore(); } ctx.font = 'bold 26px Arial'; let botText = "MOGO BIKES CARE", botAngle = 1.95, startB = Math.PI / 2 + botAngle / 2; for (let i = 0; i < botText.length; i++) { let theta = startB - (i / (botText.length - 1)) * botAngle; ctx.save(); ctx.translate(172 * Math.cos(theta), 172 * Math.sin(theta)); ctx.rotate(theta - Math.PI / 2); ctx.fillText(botText[i], 0, 0); ctx.restore(); } ctx.font = 'bold 24px Arial'; ctx.fillText('★', -54, -80); ctx.fillText('★', 54, -80); ctx.font = 'bold 36px Arial'; ctx.fillText('★', 0, -84); ctx.font = 'bold 24px Arial'; ctx.fillText('★', -54, 80); ctx.fillText('★', 54, 80); ctx.font = 'bold 36px Arial'; ctx.fillText('★', 0, 84); const bw = 540, bh = 106; ctx.fillStyle = bgFill; ctx.fillRect(-bw / 2, -bh / 2, bw, bh); ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.strokeRect(-bw / 2, -bh / 2, bw, bh); ctx.lineWidth = 3; ctx.strokeRect(-bw / 2 + 10, -bh / 2 + 10, bw - 20, bh - 20); ctx.fillStyle = col; ctx.font = isGreen ? 'bold 78px Arial' : 'bold 70px Arial'; ctx.fillText(isGreen ? "PAID" : "UNPAID", 0, 4); ctx.restore(); ctx.save(); ctx.globalCompositeOperation = 'destination-out'; let seed = isGreen ? 101 : 202; function pseudoRand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; } for (let i = 0; i < 340; i++) { ctx.beginPath(); ctx.arc(pseudoRand() * 600, pseudoRand() * 600, pseudoRand() * 2.8 + 0.5, 0, Math.PI * 2); ctx.fill(); } ctx.lineWidth = 1.5; for (let i = 0; i < 25; i++) { let rx = pseudoRand() * 600, ry = pseudoRand() * 600, a = pseudoRand() * Math.PI * 2, l = pseudoRand() * 20 + 6; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(a) * l, ry + Math.sin(a) * l); ctx.stroke(); } ctx.restore(); return canvas.toDataURL('image/png');
}
function getSignatureImageForPDF() {
  try { const cvs = document.createElement('canvas'); cvs.width = 650; cvs.height = 380; const ctx = cvs.getContext('2d'); ctx.clearRect(0, 0, cvs.width, cvs.height); ctx.strokeStyle = '#1E2B58'; ctx.fillStyle = '#1E2B58'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(85, 222); ctx.lineTo(255, 217); ctx.stroke(); ctx.beginPath(); ctx.moveTo(138, 220); ctx.lineTo(132, 292); ctx.moveTo(135, 252); ctx.bezierCurveTo(95, 232, 90, 282, 134, 265); ctx.bezierCurveTo(162, 248, 165, 285, 138, 280); ctx.stroke(); ctx.beginPath(); ctx.moveTo(175, 219); ctx.lineTo(166, 290); ctx.moveTo(175, 219); ctx.bezierCurveTo(172, 182, 128, 178, 118, 196); ctx.bezierCurveTo(114, 202, 134, 204, 148, 196); ctx.stroke(); ctx.beginPath(); ctx.moveTo(216, 218); ctx.lineTo(214, 232); ctx.bezierCurveTo(185, 234, 185, 258, 216, 260); ctx.bezierCurveTo(242, 262, 238, 292, 195, 288); ctx.stroke(); ctx.beginPath(); ctx.arc(210, 300, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(242, 217); ctx.lineTo(234, 288); ctx.stroke(); ctx.lineWidth = 2.7; ctx.beginPath(); ctx.moveTo(252, 232); ctx.bezierCurveTo(235, 175, 95, 170, 78, 245); ctx.bezierCurveTo(65, 315, 175, 325, 245, 275); ctx.bezierCurveTo(278, 252, 298, 222, 312, 198); ctx.stroke(); ctx.lineWidth = 4.0; ctx.beginPath(); ctx.moveTo(218, 200); ctx.quadraticCurveTo(270, 150, 312, 110); ctx.stroke(); ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(272, 292); ctx.bezierCurveTo(286, 190, 306, 45, 318, 18); ctx.bezierCurveTo(334, 40, 332, 120, 304, 185); ctx.bezierCurveTo(288, 222, 278, 268, 272, 292); ctx.stroke(); ctx.lineWidth = 3.8; ctx.beginPath(); ctx.moveTo(286, 252); ctx.bezierCurveTo(304, 236, 318, 222, 326, 210); ctx.bezierCurveTo(316, 265, 300, 328, 292, 355); ctx.bezierCurveTo(306, 320, 328, 265, 344, 228); ctx.bezierCurveTo(356, 208, 366, 196, 356, 194); ctx.bezierCurveTo(344, 194, 340, 218, 356, 220); ctx.bezierCurveTo(372, 222, 382, 205, 388, 190); ctx.bezierCurveTo(398, 155, 406, 130, 412, 135); ctx.bezierCurveTo(420, 142, 412, 188, 396, 214); ctx.bezierCurveTo(435, 210, 520, 202, 610, 195); ctx.stroke(); ctx.beginPath(); ctx.arc(328, 182, 3.5, 0, Math.PI * 2); ctx.fill(); return { data: cvs.toDataURL('image/png'), format: 'PNG' }; } catch (e) { return null; }
}

function generatePDFFromDB(id, forcePaid, forceJobCard) {
  let rec = getRecord(id) || globalBookingData; if (!rec) return; const doc = new window.jspdf.jsPDF();
  let userUtr = (document.getElementById('customerUtr') ? document.getElementById('customerUtr').value.trim() : "") || rec.utr || ""; let isPaidVerified = forceJobCard ? false : (forcePaid || (rec.forceType === 'TAX_INVOICE' && (userUtr.length >= 4 || rec.gpsImage)));
  if (isPaidVerified) { doc.setFillColor(255, 255, 255); doc.rect(0, 0, 210, 297, "F"); } else { doc.setFillColor(254, 252, 232); doc.rect(0, 0, 210, 297, "F"); }
  try { doc.addImage(createExactLogoImage(), 'PNG', 45, 10, 120, 38); } catch (e) {}
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(51, 65, 85); doc.text("Mankiniamma Technologies Private Limited", 105, 51, { align: "center" }); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139); let splitOfficialAddr = doc.splitTextToSize(OFFICIAL_ADDRESS, 170); doc.text(splitOfficialAddr, 105, 55.5, { align: "center" }); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(15, 23, 42); doc.text("GSTIN: " + COMPANY_GSTIN, 105, 64, { align: "center" });
  let docTitle = isPaidVerified ? "TAX INVOICE" : "SERVICE JOB CARD / ESTIMATE"; doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(docTitle, 105, 72, { align: "center" }); doc.setLineWidth(0.4); doc.setDrawColor(226, 232, 240); doc.line(20, 77, 190, 77);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50); doc.text("Booking ID: " + (rec.id || "MOGO1001"), 20, 85); doc.text("Date: " + (rec.date || new Date().toLocaleDateString('en-IN')), 145, 85); doc.text("Customer Name: " + (rec.name || "Valued Customer"), 20, 93); doc.text("Contact Number: " + (rec.phone || ""), 20, 101); doc.text("Vehicle Type: " + (rec.vehicle || "Bike"), 20, 109); let custAddrLines = doc.splitTextToSize("Service Address: " + (rec.address || "Guwahati, Assam"), 170); doc.text(custAddrLines, 20, 117);
  doc.line(20, 127, 190, 127); doc.setFont("helvetica", "bold"); doc.text("Service Description", 20, 136); doc.text("Amount (INR)", 155, 136);
  let grandTotal = (rec.isVahanService && rec.grandTotal) ? Number(rec.grandTotal) : TOTAL_PRICE; let subtotal = grandTotal / 1.18; let cgst = subtotal * 0.09; let sgst = subtotal * 0.09; let currentY = 146; doc.setFont("helvetica", "normal"); doc.text("1. " + (rec.serviceName || "Premium Foam Wash"), 20, currentY); doc.text("Rs. " + grandTotal.toFixed(2), 155, currentY); currentY += 8; doc.line(20, currentY, 190, currentY); currentY += 8;
  if (isPaidVerified) {
    doc.setFontSize(9.5); doc.text("Taxable Amount (Subtotal):", 110, currentY); doc.text("Rs. " + subtotal.toFixed(2), 155, currentY); currentY += 7; doc.text("CGST @ 9% (Central Tax):", 110, currentY); doc.text("Rs. " + cgst.toFixed(2), 155, currentY); currentY += 7; doc.text("SGST @ 9% (State Tax):", 110, currentY); doc.text("Rs. " + sgst.toFixed(2), 155, currentY); currentY += 7; doc.line(20, currentY, 190, currentY); currentY += 8; doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Grand Total (Incl. 18% GST):", 45, currentY); doc.setTextColor(255, 90, 0); doc.text("Rs. " + grandTotal.toFixed(2), 155, currentY); let layoutY = currentY + 10; try { doc.addImage(createRubberStampImage(true), 'PNG', 142, layoutY, 44, 44); } catch (e) {} try { let customSig = getSignatureImageForPDF(); if (customSig) doc.addImage(customSig.data, customSig.format, 141, layoutY + 43, 48, 28); } catch (e) {} doc.setLineWidth(0.3); doc.setDrawColor(15, 23, 42); doc.line(142, layoutY + 71, 190, layoutY + 71); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.text("Authorized Signatory", 166, layoutY + 76, { align: "center" }); doc.setFontSize(9.5); doc.setTextColor(15, 23, 42); let refText = userUtr ? userUtr : "Verified"; doc.text("Payment Status: Paid & Verified", 20, layoutY + 15); doc.text("[UTR / Ref: " + refText + "]", 20, layoutY + 21); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(100, 100, 100); doc.text("TERMS & CONDITIONS / JUDICIAL JURISDICTION:", 20, layoutY + 38); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); let terms = ["1. Goods and services rendered are subject to Mankiniamma Technologies", "   Private Limited standard operating policies.", "2. All disputes, claims, and legal proceedings are subject exclusively", "   to the judicial jurisdiction of courts located in Guwahati, Assam.", "3. This is an electronically generated tax invoice compliant with statutory laws."]; let termY = layoutY + 43.5; terms.forEach(function(t) { doc.text(t, 20, termY); termY += 4.5; });
  } else {
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Estimated Amount:", 65, currentY); doc.setTextColor(255, 90, 0); doc.text("Rs. " + grandTotal.toFixed(2), 155, currentY); let layoutY = currentY + 14; try { doc.addImage(createRubberStampImage(false), 'PNG', 142, layoutY, 44, 44); } catch (e) {} try { let customSig = getSignatureImageForPDF(); if (customSig) doc.addImage(customSig.data, customSig.format, 141, layoutY + 43, 48, 28); } catch (e) {} doc.setLineWidth(0.3); doc.setDrawColor(15, 23, 42); doc.line(142, layoutY + 71, 190, layoutY + 71); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.text("Authorized Signatory", 166, layoutY + 76, { align: "center" }); doc.setFontSize(9.5); doc.setTextColor(15, 23, 42); doc.text("Payment Status: Payment Due (Pay Cash / QR After Service)", 20, layoutY + 15);
  }
  doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.text(isPaidVerified ? "This is a system generated valid tax invoice." : "This is a service estimate / job card. Not a tax invoice.", 105, 282, { align: "center" }); doc.text("Thank you for choosing MoGo Total Bike Care!", 105, 288, { align: "center" });
  if (rec.gpsImage) { doc.addPage(); doc.setFillColor(255, 255, 255); doc.rect(0, 0, 210, 297, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(15, 23, 42); doc.text("ATTACHED PAYMENT PROOF / SCREENSHOT", 105, 25, { align: "center" }); doc.setLineWidth(0.4); doc.setDrawColor(226, 232, 240); doc.line(20, 32, 190, 32); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("Verified Date & Time: " + new Date().toLocaleString('en-IN'), 20, 42); doc.text("Booking ID: " + rec.id + " | Customer: " + rec.name, 20, 49); let maxW = 165, maxH = 200, imgW = rec.imgW || maxW, imgH = rec.imgH || maxH, ratio = Math.min(maxW / imgW, maxH / imgH); doc.addImage(rec.gpsImage, "JPEG", (210 - imgW * ratio) / 2, 58, imgW * ratio, imgH * ratio); }
  doc.save(isPaidVerified ? "MoGo_Tax_Invoice_" + rec.id + ".pdf" : "MoGo_Job_Card_" + rec.id + ".pdf");
}

function runAutoBugCleaner() {
  try { let raw = localStorage.getItem('mogo_local_db'), parsed = raw ? JSON.parse(raw) : []; if (!Array.isArray(parsed)) parsed = []; let deletedIds = getDeletedIds(), combined = parsed.concat(HISTORICAL_RECORDS_SEED), cleaned = [], seenIds = {}; for (let i = 0; i < combined.length; i++) { let item = combined[i]; if (item && typeof item === 'object' && item.id && !seenIds[item.id] && deletedIds.indexOf(item.id) === -1) { seenIds[item.id] = true; let itemPrice = (item.isVahanService && item.grandTotal) ? Number(item.grandTotal) : TOTAL_PRICE; let sub = itemPrice / 1.18, cleanUtr = String(item.utr || "").trim(); let isPaidRecord = (item.forceType === 'TAX_INVOICE' || item.status === 'INVOICE_GENERATED' || cleanUtr.length >= 4 || Boolean(item.gpsImage)); cleaned.push({ id: String(item.id), date: String(item.date || new Date().toLocaleDateString('en-IN')), name: String(item.name || "Valued Customer"), phone: String(item.phone || ""), vehicle: String(item.vehicle || "Bike"), serviceName: String(item.serviceName || "Premium Foam Wash"), slot: String(item.slot || "Standard Doorstep Service"), total: sub, cgst: sub * 0.09, sgst: sub * 0.09, grandTotal: itemPrice, address: String(item.address || "Guwahati, Assam"), paymentType: String(item.paymentType || (isPaidRecord ? "Pay Now" : "Pay After Service")), status: isPaidRecord ? "INVOICE_GENERATED" : String(item.status || "BOOKED"), utr: isPaidRecord && !cleanUtr ? "VERIFIED" : cleanUtr, forceType: isPaidRecord ? 'TAX_INVOICE' : 'JOB_CARD', isVahanService: Boolean(item.isVahanService), gpsImage: item.gpsImage || null, imgW: item.imgW || 400, imgH: item.imgH || 400 }); } } localStorage.setItem('mogo_local_db', JSON.stringify(cleaned)); } catch (e) { try { localStorage.setItem('mogo_local_db', JSON.stringify([])); } catch (err) {} }
}

function initMoGoApp() { runAutoBugCleaner(); initAuth(); syncCloudDatabase(false, false); window.addEventListener('storage', function() { renderAdminDB(); renderMechanicJobs(); }); setInterval(function() { let admOpen = document.getElementById('adminModal')?.classList.contains('show'); let mechOpen = document.getElementById('mechanicModal')?.classList.contains('show'); if (admOpen || mechOpen) syncCloudDatabase(false, false); }, 8000); let admInput = document.getElementById('adminPinInput'); if (admInput) admInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') verifyAdminPin(); }); let mechInput = document.getElementById('mechPinInput'); if (mechInput) mechInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') verifyMechPin(); }); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initMoGoApp); } else { initMoGoApp(); }
