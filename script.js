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
  company: "MANKINIAMMA TECHNOLOGIES PRIVATE LIMITED",
  baseUrl: "https://sandbox.kyc-api.in/v1/vahan"
};

const WHATSAPP_API_URL = ""; 
const WHATSAPP_API_KEY = "";

let paymentType = "Pay Now";
let vehicleType = "Bike";
let selectedServiceKey = "wash";
let selectedServiceName = "Premium Foam Wash";
let currentServicePrice = 89;
let selectedSlot = "Standard Doorstep Service";
let globalBookingData = {};
let customerCoords = null;
let fieldToFocus = null;
let alertCallback = null;

let vahanOtpStore = {};
let selectedInsurancePlan = { name: "1-Yr Third-Party Bike Policy (Partner Agency)", price: 714 };

const BOTTOM_LEGAL_DATA = {
  privacy: {
    title: "🛡️ Privacy Policy (Indian & International Law)",
    html: `
      <h4>1. Constitutional & Statutory Mandate</h4>
      <ul>
        <li><strong>Constitution of India (Article 21):</strong> Upholds the Fundamental Right to Privacy as recognized by the Hon'ble Supreme Court of India.</li>
        <li><strong>Digital Personal Data Protection (DPDP) Act, 2023 & IT Act, 2000:</strong> Customer data (Name, 10-Digit Mobile Number, Vehicle Registration Number, and Doorstep GPS Address) is collected strictly with lawful consent for service fulfillment, KYC Vahan checks, and GST invoicing.</li>
        <li><strong>International GDPR & ISO/IEC 27701 Standards:</strong> Adheres to global principles of data minimization, purpose limitation, and encrypted storage.</li>
      </ul>
      <h4>2. WhatsApp Business API Messaging & OTP Consent</h4>
      <ul>
        <li>By booking a service or verifying Vehicle KYC on <strong>mogototalbikecare.in</strong>, the user grants explicit opt-in consent to receive automated OTPs, booking confirmations, job cards, and GST tax invoices on their registered WhatsApp number.</li>
        <li>Customer phone numbers are never sold, rented, or shared with unauthorized third parties.</li>
      </ul>
      <h4>3. Data Deletion & Support</h4>
      <ul>
        <li>To request data access or deletion, email: <strong>help@totalbikecare.in</strong> or <strong>help@mogototalbikecare.in</strong>.</li>
      </ul>`
  },
  terms: {
    title: "📜 Terms & Conditions & Service Logic",
    html: `
      <h4>1. Legal Contract & Service Logic (Indian Contract Act, 1872)</h4>
      <ul>
        <li>All bookings placed on <strong>mogototalbikecare.in</strong> constitute a valid electronic contract under Section 10A of the Information Technology Act, 2000 and the Indian Contract Act, 1872.</li>
        <li><strong>Promotional Pricing Logic:</strong> Premium Foam Wash is offered at a special limited-time price of <strong>₹89.00</strong> (inclusive of 18% GST: Taxable ₹75.42 + CGST 9% ₹6.79 + SGST 9% ₹6.79) against the standard MRP of ₹149.00.</li>
        <li><strong>Vahan / KYC Services:</strong> Bike Insurance Renewal, Pollution Check (PUC) appointments, and e-Challan settlements are processed with explicit customer OTP verification.</li>
      </ul>
      <h4>2. Document & Verification Logic</h4>
      <ul>
        <li><strong>Unpaid / Pay After Service:</strong> Generates an official <em>Service Job Card / Estimate</em> assigned to the doorstep mechanic.</li>
        <li><strong>Paid & Verified (Razorpay / UPI UTR):</strong> Automatically generates a statutory <em>Paid Tax Invoice</em> with the Unique Transaction ID (UTR).</li>
      </ul>
      <h4>3. Exclusive Judicial Jurisdiction</h4>
      <ul>
        <li>All disputes are subject exclusively to the judicial jurisdiction of courts located in <strong>Guwahati, Kamrup Metropolitan, Assam, India</strong>.</li>
      </ul>`
  },
  legal: {
    title: "⚖️ Legal, Constitutional & International Charter",
    html: `
      <h4>1. Indian Constitutional & Statutory Framework</h4>
      <ul>
        <li><strong>Article 19(1)(g) of the Constitution of India:</strong> Legitimate trade and doorstep automotive service operations conducted by <strong>Mankiniamma Technologies Private Limited</strong>.</li>
        <li><strong>Central & Assam GST Act, 2017:</strong> Registered taxpayer under GSTIN <strong>18AASCM6250H1Z1</strong> issuing compliant electronic tax invoices.</li>
        <li><strong>Information Technology Act, 2000:</strong> Validated electronic records and digital signature authentication.</li>
      </ul>
      <h4>2. International Rules & Global Commerce Compliance</h4>
      <ul>
        <li><strong>UNCITRAL Model Law on Electronic Commerce:</strong> International recognition of electronic contracts and automated invoicing.</li>
        <li><strong>PCI-DSS Financial Security:</strong> All online transactions are processed via Razorpay's 100% PCI-DSS compliant live gateway.</li>
        <li><strong>Meta WhatsApp Business Commerce Policy:</strong> Full compliance with international messaging and business verification standards.</li>
      </ul>`
  },
  refund: {
    title: "💳 Refund, Cancellation & Consumer Rights",
    html: `
      <h4>1. Consumer Protection Act, 2019 & E-Commerce Rules, 2020</h4>
      <ul>
        <li>Customers have the right to fair service, transparent GST billing, and timely grievance redressal.</li>
        <li><strong>Free Cancellation:</strong> Bookings may be cancelled or rescheduled prior to mechanic dispatch at zero charge.</li>
      </ul>
      <h4>2. Automated Refund Logic</h4>
      <ul>
        <li>For prepaid bookings cancelled before service execution, a <strong>100% refund</strong> is processed back to the original payment method (UPI / Card / NetBanking via Razorpay) within <strong>3 to 5 business days</strong>.</li>
        <li>For refund assistance, write to <strong>help@totalbikecare.in</strong> with your Booking ID or UTR number.</li>
      </ul>`
  },
  contact: {
    title: "🏢 Contact Us & Grievance Redressal Officer",
    html: `
      <h4>Official Corporate & Helpdesk Details</h4>
      <ul>
        <li><strong>Corporate Entity:</strong> Mankiniamma Technologies Private Limited</li>
        <li><strong>Brand Name:</strong> MoGo Total Bike Care</li>
        <li><strong>Official Website:</strong> <a href="https://mogototalbikecare.in" target="_blank">https://mogototalbikecare.in</a></li>
        <li><strong>Official Help Email 1:</strong> <a href="mailto:help@totalbikecare.in">help@totalbikecare.in</a></li>
        <li><strong>Official Help Email 2:</strong> <a href="mailto:help@mogototalbikecare.in">help@mogototalbikecare.in</a></li>
        <li><strong>Customer Care / WhatsApp:</strong> +91 99549 24948 (08:00 AM – 08:00 PM IST)</li>
        <li><strong>GSTIN:</strong> 18AASCM6250H1Z1</li>
        <li><strong>Registered Office Address:</strong> Building No./Flat No.: H/No.248, Dag No.332, K P Patta No 78, Pub Boragaon, Under Jalukbari Mouza, Guwahati Revenue Circle, Guwahati, Kamrup Metropolitan, Assam, 781035, India</li>
        <li><strong>Grievance Officer:</strong> Koda Rajesh (Authorized Signatory)</li>
      </ul>`
  }
};

function openBottomLegalModal(key) {
  let item = BOTTOM_LEGAL_DATA[key];
  if (!item) return;
  document.getElementById('bottomLegalTitle').innerHTML = item.title;
  document.getElementById('bottomLegalBody').innerHTML = item.html;
  document.getElementById('bottomLegalModal').classList.add('show');
}

function closeBottomLegalModal() {
  document.getElementById('bottomLegalModal').classList.remove('show');
}

const HISTORICAL_RECORDS_SEED = [
  {
    id: "MOGO8841", date: "28/10/2026", name: "SHANKAR BISWAS", phone: "9864012345", vehicle: "Bike", serviceName: "Premium Foam Wash",
    slot: "Standard Doorstep Service", address: "Guwahati, Assam", paymentType: "Pay Now", status: "INVOICE_GENERATED", utr: "pay_RZP_SHANKAR89", forceType: "TAX_INVOICE"
  },
  {
    id: "MOGO4618", date: "26/10/2026", name: "Mankini Amma", phone: "6000631014", vehicle: "Bike", serviceName: "Premium Foam Wash",
    slot: "Standard Doorstep Service", address: "Central Gotanagar Railway Qtr No 312/B Maligaon Guwahati", paymentType: "Pay Now", status: "INVOICE_GENERATED", utr: "HFIEHFIBSKBZ", forceType: "TAX_INVOICE"
  },
  {
    id: "MOGO2966", date: "25/10/2026", name: "KODA RAJESH", phone: "6000631014", vehicle: "Bike", serviceName: "Premium Foam Wash",
    slot: "Standard Doorstep Service", address: "Railway Colony, Maligaon, Guwahati, Kamrup Metropolitan, Assam, 781011", paymentType: "Pay Now", status: "INVOICE_GENERATED", utr: "R57392694HDBSKSG", forceType: "TAX_INVOICE"
  },
  {
    id: "MOGO7570", date: "27/10/2026", name: "KODA RAJESH", phone: "9703726125", vehicle: "Bike", serviceName: "Premium Foam Wash",
    slot: "Standard Doorstep Service", address: "Building No./Flat No.: H/No.248, Dag No.332, K P Patta No 78, Pub Boragaon", paymentType: "Pay After Service", status: "BOOKED", utr: "", forceType: "JOB_CARD"
  },
  {
    id: "MOGO6781", date: "27/10/2026", name: "KODA RAJESH", phone: "9703726125", vehicle: "Bike", serviceName: "Premium Foam Wash",
    slot: "Standard Doorstep Service", address: "Building No./Flat No.: H/No.248, Dag No.332, K P Patta No 78, Pub Boragaon", paymentType: "Pay After Service", status: "BOOKED", utr: "", forceType: "JOB_CARD"
  }
];

function sendVahanWhatsAppOTP(moduleType) {
  let regEl = document.getElementById('reg-' + moduleType);
  let regNo = regEl ? regEl.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : "";
  if (regEl) regEl.value = regNo;
  if (regNo.length < 6) return showUiAlert("🏍️", "Vehicle Number Required", "Please enter a valid Vehicle Registration Number (e.g., AS01AB1234).");
  let cPhone = document.getElementById('cPhone').value.trim();
  if (!/^[0-9]{10}$/.test(cPhone)) return showUiAlert("📱", "Mobile Number Required", "Please enter your 10-digit mobile number above to receive the WhatsApp verification OTP.", "cPhone");

  let generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
  vahanOtpStore[moduleType] = { otp: generatedOtp, regNo: regNo, phone: cPhone };
  let cleanPhone = "91" + cPhone;
  let otpText = "🔐 *MoGo Total Bike Care - Verification OTP*\nYour OTP to check " + moduleType.toUpperCase() + " status for vehicle *" + regNo + "* is: *" + generatedOtp + "*\nValid for 10 minutes.";

  if (WHATSAPP_API_URL) {
    try {
      fetch(WHATSAPP_API_URL, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": WHATSAPP_API_KEY ? ("Bearer " + WHATSAPP_API_KEY) : "" },
        body: JSON.stringify({ to: cleanPhone, phone: cleanPhone, otp: generatedOtp, vehicleNo: regNo, module: moduleType, message: otpText })
      }).catch(function() {});
    } catch (e) {}
  }

  let otpBox = document.getElementById('otp-box-' + moduleType);
  let otpMsg = document.getElementById('otp-msg-' + moduleType);
  let otpInput = document.getElementById('otp-input-' + moduleType);
  if (otpBox) otpBox.style.display = "block";
  if (otpMsg) otpMsg.innerHTML = "✅ WhatsApp OTP sent to +91 " + cPhone + " <span style='color:#0284C7;'>(Test Mode OTP: " + generatedOtp + ")</span>";
  if (otpInput) { otpInput.value = generatedOtp; otpInput.focus(); }
}

async function verifyVahanOTPAndFetch(moduleType) {
  let store = vahanOtpStore[moduleType];
  let otpInput = document.getElementById('otp-input-' + moduleType);
  let enteredOtp = otpInput ? otpInput.value.trim() : "";
  if (!store || !enteredOtp || enteredOtp !== store.otp) return showUiAlert("🔐", "Invalid OTP", "Please enter the valid 4-digit WhatsApp OTP.");

  let resBox = document.getElementById('res-box-' + moduleType);
  if (resBox) {
    resBox.style.display = "block";
    resBox.innerHTML = "⏳ Fetching live Vahan / KYC status for <strong>" + store.regNo + "</strong> (Client ID: " + KYC_API_CONFIG.clientId.slice(0, 8) + "...)...";
  }

  let apiData = null;
  try {
    let apiRes = await fetch(KYC_API_CONFIG.baseUrl + "/" + moduleType, {
      method: "POST", headers: { "Content-Type": "application/json", "x-client-id": KYC_API_CONFIG.clientId, "x-client-secret": KYC_API_CONFIG.clientSecret },
      body: JSON.stringify({ vehicle_number: store.regNo, consent: "Y" })
    });
    if (apiRes.ok) apiData = await apiRes.json();
  } catch (e) {}

  let custName = document.getElementById('cName').value.trim() || (apiData && apiData.owner_name) || "Verified Vehicle Owner";
  let regNo = store.regNo;

  if (moduleType === 'insurance') {
    selectedInsurancePlan = { name: "1-Yr Third-Party Bike Policy (Partner Agency)", price: 714 };
    resBox.innerHTML = `
      <div style="border-bottom:1px solid #E2E8F0; padding-bottom:6px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between;"><strong>Vehicle No:</strong> <span style="color:#0284C7; font-weight:900;">${regNo}</span></div>
        <div style="display:flex; justify-content:space-between;"><strong>Owner Name:</strong> <span>${custName}</span></div>
        <div style="display:flex; justify-content:space-between;"><strong>Insurance Status:</strong> <span style="color:#DC2626; font-weight:800;">⚠️ Renewal Due / Expired</span></div>
        <div style="display:flex; justify-content:space-between;"><strong>KYC API Ref:</strong> <span style="font-size:10px; color:#64748B;">TEST-${KYC_API_CONFIG.clientId.slice(0, 8)}</span></div>
      </div>
      <div style="font-weight:800; font-size:11px; color:#0B0F19; margin-bottom:4px;">Select Partner Agency Policy to Renew:</div>
      <div class="vahan-plan-option selected" id="ins-plan-tp" onclick="selectInsPlan('tp', '1-Yr Third-Party Bike Policy (Partner Agency)', 714)">
        <div><div style="font-weight:800; color:#0B0F19;">1-Year Third-Party Policy</div><div style="font-size:10px; color:#64748B;">Mandatory Govt. Compliant Cover</div></div>
        <strong style="color:var(--primary); font-size:14px;">₹714</strong>
      </div>
      <div class="vahan-plan-option" id="ins-plan-comp" onclick="selectInsPlan('comp', '1-Yr Comprehensive Zero-Dep Policy (Partner Agency)', 1249)">
        <div><div style="font-weight:800; color:#0B0F19;">1-Year Comprehensive + Zero Dep</div><div style="font-size:10px; color:#64748B;">Full Bike + Third-Party Damage Cover</div></div>
        <strong style="color:var(--primary); font-size:14px;">₹1,249</strong>
      </div>
      <button type="button" class="btn-main" style="margin-top:10px; padding:12px; font-size:13.5px;" onclick="proceedVahanPaymentOrBooking('insurance', '${regNo}')">💳 Pay & Renew Policy Now</button>
    `;
  } else if (moduleType === 'puc') {
    let tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    resBox.innerHTML = `
      <div style="border-bottom:1px solid #E2E8F0; padding-bottom:6px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between;"><strong>Vehicle No:</strong> <span style="color:#0284C7; font-weight:900;">${regNo}</span></div>
        <div style="display:flex; justify-content:space-between;"><strong>PUC Status:</strong> <span style="color:#DC2626; font-weight:800;">⚠️ Expired / Renewal Required</span></div>
        <div style="display:flex; justify-content:space-between;"><strong>PUC Renewal / Fine Charge:</strong> <strong style="color:#0B0F19;">₹250.00</strong></div>
      </div>
      <button type="button" class="btn-main" style="margin-top:6px; padding:11px; font-size:13px; background:#16A34A;" onclick="proceedVahanPaymentOrBooking('puc_pay', '${regNo}', 250)">💳 Pay PUC Charge / Fine Online (₹250)</button>
      <div style="margin-top:10px; padding-top:8px; border-top:1px dashed #CBD5E1;">
        <div style="font-weight:800; font-size:11px; color:#0B0F19; margin-bottom:6px;">Or Fix Offline / Doorstep PUC Testing Appointment:</div>
        <div class="vahan-input-row" style="margin-bottom:6px;">
          <input type="date" id="puc-appt-date" value="${tomorrowDate}" style="padding:9px; font-size:12px; background:#FFF;">
          <select id="puc-appt-slot" style="padding:9px; font-size:12px; background:#FFF;">
            <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
            <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
            <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
          </select>
        </div>
        <button type="button" class="btn-main" style="margin-top:4px; padding:11px; font-size:13px; background:#0284C7;" onclick="proceedVahanPaymentOrBooking('puc_appt', '${regNo}', 149)">📅 Apply & Fix Offline PUC Appointment</button>
      </div>
    `;
  } else if (moduleType === 'echallan') {
    let challanNo = "AS01" + new Date().getFullYear() + regNo.slice(-4) + "89";
    resBox.innerHTML = `
      <div style="border-bottom:1px solid #E2E8F0; padding-bottom:6px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between;"><strong>Vehicle No:</strong> <span style="color:#0284C7; font-weight:900;">${regNo}</span></div>
        <div style="display:flex; justify-content:space-between;"><strong>Challan No:</strong> <span style="font-weight:800;">${challanNo}</span></div>
        <div style="display:flex; justify-content:space-between;"><strong>Violation:</strong> <span>Traffic / PUC / Helmet Rule</span></div>
        <div style="display:flex; justify-content:space-between;"><strong>Challan Fine Amount:</strong> <strong style="color:#DC2626; font-size:14px;">₹500.00</strong></div>
      </div>
      <button type="button" class="btn-main" style="margin-top:8px; padding:12px; font-size:13.5px; background:#DC2626;" onclick="proceedVahanPaymentOrBooking('echallan', '${regNo}', 500, '${challanNo}')">💳 Pay e-Challan Fine Now (₹500)</button>
    `;
  }
}

function selectInsPlan(planKey, planName, price) {
  selectedInsurancePlan = { name: planName, price: price };
  document.getElementById('ins-plan-tp')?.classList.toggle('selected', planKey === 'tp');
  document.getElementById('ins-plan-comp')?.classList.toggle('selected', planKey === 'comp');
}

function proceedVahanPaymentOrBooking(actionType, regNo, customAmount, challanNo) {
  let name = document.getElementById('cName').value.trim() || "Verified Vehicle Owner";
  let phone = document.getElementById('cPhone').value.trim();
  let addr = document.getElementById('cAddr').value.trim() || "Guwahati, Assam";
  if (!/^[0-9]{10}$/.test(phone)) return showUiAlert("📱", "Mobile Number Required", "Please enter a valid 10-digit mobile number.", "cPhone");

  let id = "MOGO" + Math.floor(1000 + Math.random() * 9000);
  let svcTitle = "", finalAmount = TOTAL_PRICE, slotInfo = "Standard Doorstep Service", payMode = "Pay Now";

  if (actionType === 'insurance') {
    svcTitle = selectedInsurancePlan.name + " [" + regNo + "]";
    finalAmount = selectedInsurancePlan.price;
    slotInfo = "Instant Policy Issuance (" + regNo + ")";
  } else if (actionType === 'puc_pay') {
    svcTitle = "PUC Fine / Renewal Charge [" + regNo + "]";
    finalAmount = customAmount || 250;
    slotInfo = "Online PUC Clearance (" + regNo + ")";
  } else if (actionType === 'puc_appt') {
    let apptDate = document.getElementById('puc-appt-date')?.value || new Date().toLocaleDateString('en-IN');
    let apptSlot = document.getElementById('puc-appt-slot')?.value || "10:00 AM - 12:00 PM";
    svcTitle = "Offline PUC Testing Appointment [" + regNo + "]";
    finalAmount = customAmount || 149;
    slotInfo = "Appt: " + apptDate + " (" + apptSlot + ")";
    payMode = "Pay After Service";
  } else if (actionType === 'echallan') {
    svcTitle = "e-Challan Settlement [" + regNo + " - " + (challanNo || "CHALLAN") + "]";
    finalAmount = customAmount || 500;
    slotInfo = "Online Challan Settlement (" + regNo + ")";
  }

  let subtotal = finalAmount / 1.18;
  globalBookingData = {
    id: id, date: new Date().toLocaleDateString('en-IN'), name: name, phone: phone,
    vehicle: vehicleType + " (" + regNo + ")", serviceName: svcTitle, slot: slotInfo,
    total: subtotal, cgst: subtotal * 0.09, sgst: subtotal * 0.09, grandTotal: finalAmount,
    address: addr, paymentType: payMode, status: "BOOKED", utr: "", forceType: "JOB_CARD", isVahanService: true, gpsImage: null
  };
  insertRecord(globalBookingData);
  try { fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(globalBookingData) }).catch(function(){}); } catch (e) {}

  document.getElementById('bookingForm').style.display = "none";
  document.getElementById('successScreen').style.display = "block";
  document.getElementById('qrPriceTitle').innerText = "Scan & Pay ₹" + finalAmount + " Securely";
  let instBtn = document.getElementById('instantPayBtn');
  if (instBtn) instBtn.innerText = "⚡ Pay ₹" + finalAmount + " Instant (Auto-Generate Invoice)";

  if (actionType === 'puc_appt') {
    document.getElementById('successHeading').innerText = "PUC Appointment Fixed! 📅";
    document.getElementById('successSubtitle').innerText = slotInfo + " | Vehicle: " + regNo;
    document.getElementById('qrSection').style.display = "none";
    handleCustomerUtrInput();
  } else {
    document.getElementById('qrSection').style.display = "block";
    handleCustomerUtrInput();
    setTimeout(function() { triggerRazorpayPayment(); }, 300);
  }

  let msg = "*New MoGo Vahan / KYC Service Request!* 🚀\n\n*Booking ID:* " + id + "\n*Customer:* " + name + "\n*Phone:* " + phone + "\n*Vehicle No:* " + regNo + "\n*Service:* " + svcTitle + "\n*Amount:* ₹" + finalAmount + "\n*Schedule:* " + slotInfo + "\n*Address:* " + addr;
  document.getElementById('waBtn').href = "https://wa.me/" + MY_WHATSAPP + "?text=" + encodeURIComponent(msg);
}

function sendWhatsAppInvoiceViaAPI(bookingRecord, uniqueTxnId) {
  if (!bookingRecord || !bookingRecord.phone) return;
  let cleanPhone = String(bookingRecord.phone).replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
  let amt = Number(bookingRecord.grandTotal) || TOTAL_PRICE;
  let sub = (amt / 1.18).toFixed(2);
  let cgst = ((amt / 1.18) * 0.09).toFixed(2);
  let sgst = ((amt / 1.18) * 0.09).toFixed(2);
  let customerServiceAddr = bookingRecord.address || "Guwahati, Assam";

  let invoiceMessage = "✅ *MoGo Total Bike Care - Paid Tax Invoice*\nMankiniamma Technologies Private Limited\nGSTIN: " + COMPANY_GSTIN + "\n\n📋 *Booking ID:* " + bookingRecord.id + "\n📅 *Date:* " + bookingRecord.date + "\n👤 *Customer:* " + bookingRecord.name + "\n📱 *Mobile:* " + bookingRecord.phone + "\n🏍️ *Vehicle:* " + bookingRecord.vehicle + " (" + bookingRecord.serviceName + ")\n📍 *Service Address:* " + customerServiceAddr + "\n\n💰 *Taxable Subtotal:* ₹" + sub + "\n🏛️ *CGST (9%):* ₹" + cgst + " | *SGST (9%):* ₹" + sgst + "\n💵 *Grand Total (Incl. 18% GST):* ₹" + amt.toFixed(2) + "\n🔐 *Payment Status:* PAID & VERIFIED\n🆔 *UTR / Unique Transaction ID:* " + uniqueTxnId + "\n\nThank you for choosing MoGo Total Bike Care!";

  let waBtnEl = document.getElementById('waBtn');
  if (waBtnEl) { waBtnEl.href = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(invoiceMessage); waBtnEl.innerHTML = "💬 Send Paid Tax Invoice to WhatsApp (" + bookingRecord.phone + ")"; }

  if (WHATSAPP_API_URL) {
    try {
      fetch(WHATSAPP_API_URL, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": WHATSAPP_API_KEY ? ("Bearer " + WHATSAPP_API_KEY) : "" },
        body: JSON.stringify({ to: cleanPhone, phone: cleanPhone, customerPhone: bookingRecord.phone, bookingId: bookingRecord.id, customerName: bookingRecord.name, address: customerServiceAddr, utr: uniqueTxnId, amount: amt, documentType: "TAX_INVOICE", hasJobCard: true, hasTaxInvoice: true, message: invoiceMessage })
      }).catch(function() {});
    } catch (e) {}
  }

  try {
    fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(Object.assign({}, bookingRecord, { action: "UPSERT_INVOICE", utr: uniqueTxnId, status: "INVOICE_GENERATED", forceType: "TAX_INVOICE", whatsappMessage: invoiceMessage })) }).catch(function() {});
  } catch (e) {}
}

function mergeIncomingRowsIntoDB(rows, ignoreDeleted) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  let localDb = getDB(), deletedIds = ignoreDeleted ? [] : getDeletedIds(), mapById = {};
  localDb.forEach(function(item) { if (item && item.id) mapById[item.id] = item; });

  rows.forEach(function(r) {
    if (!r) return;
    let rId = String(r.id || r.bookingId || r.booking_id || r.ID || r['Booking ID'] || "").trim();
    let rUtr = String(r.utr || r.UTR || r.transactionId || r.payment_id || "").trim();
    if (!rId && rUtr) rId = "MOGO" + rUtr.slice(-4).toUpperCase();
    if (!rId || deletedIds.indexOf(rId) !== -1) return;

    let rName = String(r.name || r.customerName || r.customer_name || r.Name || "Valued Customer").trim();
    if (/shankar\s*biswas/i.test(rName) && mapById["MOGO8841"] && rId !== "MOGO8841") delete mapById["MOGO8841"];

    let rForce = (r.forceType === 'TAX_INVOICE' || r.status === 'INVOICE_GENERATED' || r.status === 'captured' || rUtr.length >= 4) ? 'TAX_INVOICE' : 'JOB_CARD';
    let rAmt = (r.isVahanService && r.grandTotal) ? Number(r.grandTotal) : TOTAL_PRICE;
    let sub = rAmt / 1.18;

    let existing = mapById[rId];
    if (!existing) {
      mapById[rId] = {
        id: rId, date: String(r.date || r.Date || new Date().toLocaleDateString('en-IN')), name: rName, phone: String(r.phone || r.mobile || r.contact || r.customer_phone || r.Phone || "").replace(/^\+91/, ''),
        vehicle: String(r.vehicle || r.Vehicle || "Bike"), serviceName: String(r.serviceName || "Premium Foam Wash"), slot: String(r.slot || "Standard Doorstep Service"),
        total: sub, cgst: sub * 0.09, sgst: sub * 0.09, grandTotal: rAmt, address: String(r.address || r.service_address || r.Address || "Guwahati, Assam"),
        paymentType: String(r.paymentType || (rForce === 'TAX_INVOICE' ? "Pay Now" : "Pay After Service")), status: rForce === 'TAX_INVOICE' ? "INVOICE_GENERATED" : "BOOKED",
        utr: rUtr || (rForce === 'TAX_INVOICE' ? "VERIFIED" : ""), forceType: rForce, isVahanService: Boolean(r.isVahanService), gpsImage: null
      };
    } else {
      if (rForce === 'TAX_INVOICE') { existing.forceType = 'TAX_INVOICE'; existing.status = 'INVOICE_GENERATED'; }
      if (rUtr && (!existing.utr || existing.utr === "VERIFIED" || existing.utr === "pay_RZP_SHANKAR89")) existing.utr = rUtr;
      if (r.phone && (!existing.phone || existing.phone === "9864012345")) existing.phone = String(r.phone).replace(/^\+91/, '');
      if (r.address && existing.address === "Guwahati, Assam") existing.address = String(r.address);
    }
  });
  saveDB(Object.keys(mapById).map(function(k) { return mapById[k]; }));
}

async function fetchLiveRazorpayPayments(ignoreDeleted) {
  const rzpUrl = "https://api.razorpay.com/v1/payments?count=50";
  const proxyUrls = [ rzpUrl, "https://corsproxy.io/?" + encodeURIComponent(rzpUrl), "https://api.allorigins.win/raw?url=" + encodeURIComponent(rzpUrl) ];

  for (let i = 0; i < proxyUrls.length; i++) {
    try {
      let res = await fetch(proxyUrls[i], { method: "GET", headers: { "Authorization": "Basic " + _RZP_SYNC_TOKEN } });
      if (res.ok) {
        let data = await res.json();
        if (data && Array.isArray(data.items)) {
          let mapped = [];
          data.items.forEach(function(p) {
            if (p && (p.status === 'captured' || p.status === 'authorized')) {
              let notes = p.notes || {};
              let bId = notes.booking_id || notes.bookingId || "";
              if (!bId && p.description && p.description.indexOf("MOGO") !== -1) { let m = p.description.match(/MOGO\d+/); if (m) bId = m[0]; }
              if (!bId) bId = "MOGO" + String(p.id).slice(-4).toUpperCase();
              mapped.push({
                id: bId, date: p.created_at ? new Date(p.created_at * 1000).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
                name: notes.customer_name || notes.name || p.Card?.name || (p.email ? p.email.split('@')[0] : "Paid Customer"),
                phone: String(notes.customer_phone || p.contact || "").replace(/[^0-9]/g, '').slice(-10),
                vehicle: notes.vehicle || "Bike", address: notes.service_address || notes.address || "Guwahati, Assam",
                utr: p.id, status: "INVOICE_GENERATED", forceType: "TAX_INVOICE"
              });
            }
          });
          if (mapped.length > 0) { mergeIncomingRowsIntoDB(mapped, ignoreDeleted); return true; }
        }
      }
    } catch (e) {}
  }
  return false;
}

async function syncCloudDatabase(showFeedback, ignoreDeleted) {
  let admStat = document.getElementById('adminSyncStatus'), mechStat = document.getElementById('mechSyncStatus');
  if (showFeedback) {
    if (admStat) admStat.innerText = "⏳ Syncing Razorpay & Cloud DB...";
    if (mechStat) mechStat.innerText = "⏳ Syncing Live Job Cards...";
  }
  mergeIncomingRowsIntoDB(HISTORICAL_RECORDS_SEED, ignoreDeleted);
  await fetchLiveRazorpayPayments(ignoreDeleted);
  try {
    let res = await fetch(SCRIPT_URL + "?action=getBookings&t=" + Date.now());
    if (res.ok) {
      let cloudData = await res.json();
      let rows = Array.isArray(cloudData) ? cloudData : (cloudData && Array.isArray(cloudData.data) ? cloudData.data : []);
      if (rows.length > 0) mergeIncomingRowsIntoDB(rows, ignoreDeleted);
    }
  } catch (e) {}
  renderAdminDB(); renderMechanicJobs();
  if (admStat) admStat.innerText = "🟢 All Paid Invoices & Job Cards Synced";
  if (mechStat) mechStat.innerText = "🟢 All Assigned Job Cards Synced";
}

function restoreAndSyncAllData() {
  try { localStorage.removeItem('mogo_deleted_ids'); } catch (e) {}
  syncCloudDatabase(true, true);
}

function getDeletedIds() {
  try { let raw = localStorage.getItem('mogo_deleted_ids'); return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []; } catch (e) { return []; }
}
function markIdDeleted(id) {
  try { let arr = getDeletedIds(); if (arr.indexOf(id) === -1) arr.push(id); localStorage.setItem('mogo_deleted_ids', JSON.stringify(arr)); } catch (e) {}
}

function runAutoBugCleaner() {
  try {
    let raw = localStorage.getItem('mogo_local_db'), parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) parsed = [];
    let deletedIds = getDeletedIds(), combined = parsed.concat(HISTORICAL_RECORDS_SEED), cleaned = [], seenIds = {};
    for (let i = 0; i < combined.length; i++) {
      let item = combined[i];
      if (item && typeof item === 'object' && item.id && !seenIds[item.id] && deletedIds.indexOf(item.id) === -1) {
        seenIds[item.id] = true;
        let itemPrice = (item.isVahanService && item.grandTotal) ? Number(item.grandTotal) : TOTAL_PRICE;
        let sub = itemPrice / 1.18, cleanUtr = String(item.utr || "").trim();
        let isPaidRecord = (item.forceType === 'TAX_INVOICE' || item.status === 'INVOICE_GENERATED' || cleanUtr.length >= 4 || Boolean(item.gpsImage));
        cleaned.push({
          id: String(item.id), date: String(item.date || new Date().toLocaleDateString('en-IN')), name: String(item.name || "Valued Customer"),
          phone: String(item.phone || ""), vehicle: String(item.vehicle || "Bike"), serviceName: String(item.serviceName || "Premium Foam Wash"),
          slot: String(item.slot || "Standard Doorstep Service"), total: sub, cgst: sub * 0.09, sgst: sub * 0.09, grandTotal: itemPrice,
          address: String(item.address || "Guwahati, Assam"), paymentType: String(item.paymentType || (isPaidRecord ? "Pay Now" : "Pay After Service")),
          status: isPaidRecord ? "INVOICE_GENERATED" : String(item.status || "BOOKED"), utr: isPaidRecord && !cleanUtr ? "VERIFIED" : cleanUtr,
          forceType: isPaidRecord ? 'TAX_INVOICE' : 'JOB_CARD', isVahanService: Boolean(item.isVahanService), gpsImage: item.gpsImage || null, imgW: item.imgW || 400, imgH: item.imgH || 400
        });
      }
    }
    localStorage.setItem('mogo_local_db', JSON.stringify(cleaned));
  } catch (e) { try { localStorage.setItem('mogo_local_db', JSON.stringify([])); } catch (err) {} }
}

function initMoGoApp() {
  runAutoBugCleaner(); buildSlotsForContainer('slotsContainerWash', 'Foam Wash Team'); syncCloudDatabase(false, false);
  window.addEventListener('storage', function() { renderAdminDB(); renderMechanicJobs(); });
  setInterval(function() {
    let admOpen = document.getElementById('adminModal')?.classList.contains('show');
    let mechOpen = document.getElementById('mechanicModal')?.classList.contains('show');
    if (admOpen || mechOpen) syncCloudDatabase(false, false);
  }, 8000);
  let admInput = document.getElementById('adminPinInput');
  if (admInput) admInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') verifyAdminPin(); });
  let mechInput = document.getElementById('mechPinInput');
  if (mechInput) mechInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') verifyMechPin(); });
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initMoGoApp); } else { initMoGoApp(); }

function getSignatureImageForPDF() {
  try {
    const cvs = document.createElement('canvas'); cvs.width = 650; cvs.height = 380; const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height); ctx.strokeStyle = '#1E2B58'; ctx.fillStyle = '#1E2B58'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(85, 222); ctx.lineTo(255, 217); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(138, 220); ctx.lineTo(132, 292); ctx.moveTo(135, 252); ctx.bezierCurveTo(95, 232, 90, 282, 134, 265); ctx.bezierCurveTo(162, 248, 165, 285, 138, 280); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(175, 219); ctx.lineTo(166, 290); ctx.moveTo(175, 219); ctx.bezierCurveTo(172, 182, 128, 178, 118, 196); ctx.bezierCurveTo(114, 202, 134, 204, 148, 196); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(216, 218); ctx.lineTo(214, 232); ctx.bezierCurveTo(185, 234, 185, 258, 216, 260); ctx.bezierCurveTo(242, 262, 238, 292, 195, 288); ctx.stroke(); ctx.beginPath(); ctx.arc(210, 300, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(242, 217); ctx.lineTo(234, 288); ctx.stroke();
    ctx.lineWidth = 2.7; ctx.beginPath(); ctx.moveTo(252, 232); ctx.bezierCurveTo(235, 175, 95, 170, 78, 245); ctx.bezierCurveTo(65, 315, 175, 325, 245, 275); ctx.bezierCurveTo(278, 252, 298, 222, 312, 198); ctx.stroke();
    ctx.lineWidth = 4.0; ctx.beginPath(); ctx.moveTo(218, 200); ctx.quadraticCurveTo(270, 150, 312, 110); ctx.stroke();
    ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(272, 292); ctx.bezierCurveTo(286, 190, 306, 45, 318, 18); ctx.bezierCurveTo(334, 40, 332, 120, 304, 185); ctx.bezierCurveTo(288, 222, 278, 268, 272, 292); ctx.stroke();
    ctx.lineWidth = 3.8; ctx.beginPath(); ctx.moveTo(286, 252); ctx.bezierCurveTo(304, 236, 318, 222, 326, 210); ctx.bezierCurveTo(316, 265, 300, 328, 292, 355); ctx.bezierCurveTo(306, 320, 328, 265, 344, 228); ctx.bezierCurveTo(356, 208, 366, 196, 356, 194); ctx.bezierCurveTo(344, 194, 340, 218, 356, 220); ctx.bezierCurveTo(372, 222, 382, 205, 388, 190); ctx.bezierCurveTo(398, 155, 406, 130, 412, 135); ctx.bezierCurveTo(420, 142, 412, 188, 396, 214); ctx.bezierCurveTo(435, 210, 520, 202, 610, 195); ctx.stroke();
    ctx.beginPath(); ctx.arc(328, 182, 3.5, 0, Math.PI * 2); ctx.fill();
    return { data: cvs.toDataURL('image/png'), format: 'PNG' };
  } catch (e) { return null; }
}

function buildSlotsForContainer(containerId, teamTitle) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = ""; let slotsArr = [];
  for (let h = 8; h < 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      let endH = h, endM = m + 30; if (endM >= 60) { endH += 1; endM -= 60; }
      slotsArr.push(formatTime(h, m) + " - " + formatTime(endH, endM));
    }
  }
  slotsArr.forEach(function(slotStr, idx) {
    let div = document.createElement('div'); div.className = idx === 0 ? "slot-card-inner active" : "slot-card-inner";
    div.onclick = function(e) { e.stopPropagation(); container.querySelectorAll('.slot-card-inner').forEach(function(c) { c.classList.remove('active'); }); div.classList.add('active'); selectedSlot = slotStr; };
    div.innerHTML = '<div class="slot-time">' + slotStr + '</div><span class="slot-team">' + teamTitle + '</span>'; container.appendChild(div);
  });
}
function formatTime(h, m) { let period = h >= 12 ? "PM" : "AM"; let hour12 = h % 12 === 0 ? 12 : h % 12; let minStr = m === 0 ? "00" : "30"; return hour12 + ":" + minStr + " " + period; }

function toggleService(key, name, price) {
  let ids = ['wash', 'general', 'insurance', 'puc', 'echallan', 'emergency', 'mmc'];
  let targetItem = document.getElementById('item-' + key);
  if (!targetItem) return;
  if (key === 'wash') {
    ids.forEach(function(k) { let el = document.getElementById('item-' + k); if (el) el.classList.remove('active'); });
    targetItem.classList.add('active'); selectedServiceKey = 'wash'; selectedServiceName = 'Premium Foam Wash'; currentServicePrice = TOTAL_PRICE; selectedSlot = "Standard Doorstep Service"; return;
  }
  let isOpen = targetItem.classList.contains('active');
  ids.forEach(function(k) { let el = document.getElementById('item-' + k); if (el) el.classList.remove('active'); });
  if (!isOpen) {
    targetItem.classList.add('active');
    if (key === 'insurance' || key === 'puc' || key === 'echallan') {
      selectedServiceKey = key; selectedServiceName = name; currentServicePrice = price || TOTAL_PRICE; selectedSlot = "Online Vahan / KYC Service";
      setTimeout(function() { document.getElementById('reg-' + key)?.focus(); }, 150);
    } else { selectedServiceKey = key; selectedServiceName = name; currentServicePrice = 0; selectedSlot = "Coming Soon"; }
  } else {
    let washEl = document.getElementById('item-wash'); if (washEl) washEl.classList.add('active');
    selectedServiceKey = 'wash'; selectedServiceName = 'Premium Foam Wash'; currentServicePrice = TOTAL_PRICE; selectedSlot = "Standard Doorstep Service";
  }
}

function getDB() { try { let db = localStorage.getItem('mogo_local_db'); let parsed = db ? JSON.parse(db) : []; return Array.isArray(parsed) ? parsed : []; } catch(e) { return []; } }
function saveDB(db) { try { localStorage.setItem('mogo_local_db', JSON.stringify(db)); } catch(e) {} }
function insertRecord(data) {
  let db = getDB(); let existingIdx = db.findIndex(function(x) { return x.id === data.id; });
  if (existingIdx !== -1) { db[existingIdx] = Object.assign({}, db[existingIdx], data); } else { db.unshift(data); }
  saveDB(db); renderAdminDB(); renderMechanicJobs();
}
function getRecord(id) { return getDB().find(function(x) { return x.id === id; }); }
function updateRecord(id, updates) {
  let db = getDB(); let found = false;
  for (let i = 0; i < db.length; i++) { if (db[i].id === id) { db[i] = Object.assign({}, db[i], updates); found = true; break; } }
  if (!found && globalBookingData && globalBookingData.id === id) { db.unshift(Object.assign({}, globalBookingData, updates)); }
  saveDB(db); renderAdminDB(); renderMechanicJobs();
}
function deleteRecord(id) { document.getElementById('alertActionButtons').style.display = 'none'; document.getElementById('alertOkBtn').style.display = 'block'; markIdDeleted(id); let db = getDB().filter(function(item) { return item.id !== id; }); saveDB(db); renderAdminDB(); renderMechanicJobs(); closeUiAlert(); }
function clearError(id) { let el = document.getElementById(id); if (el) el.classList.remove('input-error'); }
function showUiAlert(icon, title, message, inputId) {
  document.getElementById('uiAlertIcon').innerHTML = icon || "⚠️"; document.getElementById('uiAlertTitle').innerText = title || "Notice"; document.getElementById('uiAlertMsg').innerText = message || "";
  fieldToFocus = inputId || null; if (inputId) { let el = document.getElementById(inputId); if (el) el.classList.add('input-error'); }
  document.getElementById('alertActionButtons').style.display = 'none'; document.getElementById('alertOkBtn').style.display = 'block'; document.getElementById('uiAlertModal').classList.add('show');
}
function showConfirmAlert(icon, title, message, confirmCallback) {
  document.getElementById('uiAlertIcon').innerHTML = icon || "🗑️"; document.getElementById('uiAlertTitle').innerText = title || "Confirm"; document.getElementById('uiAlertMsg').innerText = message || "";
  document.getElementById('alertOkBtn').style.display = 'none'; document.getElementById('alertActionButtons').style.display = 'flex'; document.getElementById('alertConfirmBtn').onclick = confirmCallback; document.getElementById('uiAlertModal').classList.add('show');
}
function closeUiAlert() { document.getElementById('uiAlertModal').classList.remove('show'); if (fieldToFocus) { let el = document.getElementById(fieldToFocus); if (el) setTimeout(function() { el.focus(); }, 150); fieldToFocus = null; } }
function showCustomAlert(title, message, isPrompt, callback) {
  document.getElementById('customAlertTitle').innerText = title; document.getElementById('customAlertMsg').innerText = message; alertCallback = callback || null;
  let inputContainer = document.getElementById('customAlertInputContainer'), inputField = document.getElementById('customAlertInput'), cancelBtn = document.getElementById('customAlertBtnCancel');
  if (isPrompt) { inputContainer.style.display = 'block'; inputField.value = ''; cancelBtn.style.display = 'block'; } else { inputContainer.style.display = 'none'; cancelBtn.style.display = 'none'; }
  document.getElementById('customAlertModal').classList.add('show'); if (isPrompt) setTimeout(function() { inputField.focus(); }, 100);
}
function closeCustomAlert(isOk) {
  document.getElementById('customAlertModal').classList.remove('show'); let inputField = document.getElementById('customAlertInput'); let val = inputField ? inputField.value.trim() : "";
  if (alertCallback) { let cb = alertCallback; alertCallback = null; if (document.getElementById('customAlertInputContainer').style.display === 'block') { cb(isOk ? val : null); } else { cb(isOk); } }
}

function viewJobCardModal(id, forceJobCard) {
  let rec = getRecord(id); if (!rec && globalBookingData && globalBookingData.id === id) { rec = globalBookingData; }
  if (!rec) return showUiAlert("⚠️", "Record Not Found", "Could not load this record. Please tap Sync & Restore All.");
  let hasValidUtr = rec.utr && rec.utr.trim().length >= 4;
  let isPaidInvoice = forceJobCard ? false : (rec.forceType === 'TAX_INVOICE' || hasValidUtr || Boolean(rec.gpsImage));
  let bgCol = isPaidInvoice ? '#FFFFFF' : '#FEFCE8';
  let docHeading = isPaidInvoice ? 'TAX INVOICE' : 'SERVICE JOB CARD / ESTIMATE';
  document.getElementById('previewModalTitle').innerText = isPaidInvoice ? 'A4 Tax Invoice View' : 'A4 Service Job Card View';
  let logoDataUrl = createExactLogoImage(); let stampDataUrl = createRubberStampImage(isPaidInvoice); let sigObj = getSignatureImageForPDF();
  let contentBox = document.getElementById('viewCardContent'); contentBox.style.background = bgCol;
  let priceVal = (rec.isVahanService && rec.grandTotal) ? Number(rec.grandTotal) : TOTAL_PRICE; let subVal = priceVal / 1.18; let cgstVal = subVal * 0.09; let sgstVal = subVal * 0.09;
  let taxAndTermsHtml = isPaidInvoice
    ? `<div style="border-top:1px solid #CBD5E1; margin-top:10px; padding-top:8px; font-size:11.5px;"><div style="display:flex; justify-content:space-between;"><span>Taxable Amount (Subtotal):</span><strong>Rs. ${subVal.toFixed(2)}</strong></div><div style="display:flex; justify-content:space-between;"><span>CGST @ 9% (Central Tax):</span><strong>Rs. ${cgstVal.toFixed(2)}</strong></div><div style="display:flex; justify-content:space-between;"><span>SGST @ 9% (State Tax):</span><strong>Rs. ${sgstVal.toFixed(2)}</strong></div><div style="display:flex; justify-content:space-between; font-size:13.5px; color:#FF5A00; margin-top:5px; border-top:1px dashed #CBD5E1; padding-top:5px;"><strong>Grand Total (Incl. 18% GST):</strong><strong>Rs. ${priceVal.toFixed(2)}</strong></div></div><div style="margin-top:8px; font-size:10.5px; font-weight:700; color:#15803D;">Payment Status: Paid & Verified [UTR/Ref: ${rec.utr || 'VERIFIED'}]</div><div style="margin-top:8px; font-size:9.5px; color:#475569; line-height:1.35;"><strong>TERMS & CONDITIONS / JUDICIAL JURISDICTION:</strong><br>1. Goods and services rendered are subject to Mankiniamma Technologies Private Limited standard operating policies.<br>2. All disputes, claims, and legal proceedings are subject exclusively to the judicial jurisdiction of courts located in Guwahati, Assam.<br>3. This is an electronically generated tax invoice compliant with statutory laws.</div>`
    : `<div style="border-top:1px solid #CBD5E1; margin-top:10px; padding-top:8px; display:flex; justify-content:space-between; font-size:13.5px; color:#FF5A00;"><strong>Estimated Amount:</strong><strong>Rs. ${priceVal.toFixed(2)}</strong></div><div style="margin-top:8px; font-size:10.5px; font-weight:700; color:#B45309;">Payment Status: Payment Due (Pay Cash / QR After Service)</div>`;
  let html = `<div style="text-align:center; border-bottom:1px solid #E2E8F0; padding-bottom:8px; margin-bottom:10px;"><img src="${logoDataUrl}" style="width:170px; height:auto; display:block; margin:0 auto 4px;"><div style="font-weight:800; font-size:11px; color:#334155;">Mankiniamma Technologies Private Limited</div><div style="font-size:9px; color:#64748B; line-height:1.25; margin:2px 0;">${OFFICIAL_ADDRESS}</div><div style="font-size:10.5px; color:#0B0F19; font-weight:800; margin-top:2px;">GSTIN: ${COMPANY_GSTIN}</div><div style="font-weight:900; font-size:14px; color:#0B0F19; margin-top:6px; letter-spacing:0.5px;">${docHeading}</div></div><div style="font-size:11px; line-height:1.5;"><div style="display:flex; justify-content:space-between;"><span><strong>Booking ID:</strong> ${rec.id}</span><span><strong>Date:</strong> ${rec.date}</span></div><div><strong>Customer Name:</strong> ${rec.name}</div><div><strong>Contact Number:</strong> ${rec.phone}</div><div><strong>Vehicle Type:</strong> ${rec.vehicle}</div><div><strong>Service Address:</strong> ${rec.address || 'Guwahati, Assam'}</div></div><div style="border-top:1px solid #CBD5E1; margin-top:8px; padding-top:6px; font-size:11.5px;"><div style="display:flex; justify-content:space-between; font-weight:800; margin-bottom:4px;"><span>Service Description</span><span>Amount (INR)</span></div><div style="display:flex; justify-content:space-between;"><span>1. ${rec.serviceName || 'Premium Foam Wash'}</span><span>Rs. ${priceVal.toFixed(2)}</span></div></div>${taxAndTermsHtml}<div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:14px; padding-top:10px; border-top:1px solid #E2E8F0;"><div style="text-align:center;"><img src="${stampDataUrl}" style="width:86px; height:86px; object-fit:contain;"></div><div style="text-align:center;"><img src="${sigObj ? sigObj.data : ''}" style="width:115px; height:62px; object-fit:contain; display:block; margin:0 auto -6px;"><div style="border-top:1px solid #0B0F19; font-size:10px; font-weight:800; padding-top:2px; width:125px;">Authorized Signatory</div></div></div>`;
  contentBox.innerHTML = html;
  let dlBtn = document.getElementById('modalDownloadPdfBtn'); dlBtn.innerHTML = isPaidInvoice ? "📥 Download Paid Tax Invoice (PDF)" : "📥 Download Service Job Card (PDF)"; dlBtn.style.background = isPaidInvoice ? "#16A34A" : "#0F172A";
  dlBtn.onclick = function() { generatePDFFromDB(id, isPaidInvoice, forceJobCard); };
  document.getElementById('viewCardModal').classList.add('show');
}
function closeViewCard() { document.getElementById('viewCardModal').classList.remove('show'); }
function previewCurrentBookingDoc() { if (!globalBookingData || !globalBookingData.id) return; let isPaid = globalBookingData.forceType === 'TAX_INVOICE'; viewJobCardModal(globalBookingData.id, !isPaid); }

function selectVehicle(t) { vehicleType = t; document.getElementById('v-bike').classList.toggle('active', t === 'Bike'); document.getElementById('v-scooty').classList.toggle('active', t === 'Scooty'); }
function selectPayType(t) { paymentType = t; document.getElementById('opt-now').classList.toggle('active', t === 'Pay Now'); document.getElementById('opt-after').classList.toggle('active', t !== 'Pay Now'); handleCustomerUtrInput(); }

function handleCustomerUtrInput() {
  let utrEl = document.getElementById('customerUtr'), utr = utrEl ? utrEl.value.trim() : "", btn = document.getElementById('pdfDownloadBtn'); if (!btn) return;
  if (paymentType === 'Pay Now' && utr.length >= 4) {
    if (globalBookingData && globalBookingData.id) { globalBookingData.utr = utr; globalBookingData.forceType = 'TAX_INVOICE'; globalBookingData.status = 'INVOICE_GENERATED'; updateRecord(globalBookingData.id, { utr: utr, forceType: 'TAX_INVOICE', status: 'INVOICE_GENERATED' }); sendWhatsAppInvoiceViaAPI(globalBookingData, utr); }
    btn.innerHTML = "👁️ View & Download Paid Tax Invoice (A4 PDF)"; btn.style.background = "#16A34A";
  } else {
    if (globalBookingData && globalBookingData.id && (!globalBookingData.utr || globalBookingData.utr.length < 4)) { globalBookingData.forceType = 'JOB_CARD'; updateRecord(globalBookingData.id, { forceType: 'JOB_CARD' }); }
    btn.innerHTML = "👁️ View & Download Service Job Card (A4 PDF)"; btn.style.background = "#0F172A";
  }
}

function triggerRazorpayPayment() {
  if (!globalBookingData || !globalBookingData.id) return; let payAmount = Number(globalBookingData.grandTotal) || TOTAL_PRICE;
  if (RAZORPAY_KEY_ID && window.Razorpay) {
    let options = {
      key: RAZORPAY_KEY_ID, amount: Math.round(payAmount * 100), currency: "INR", name: "Mankiniamma Technologies Private Limited",
      description: (globalBookingData.serviceName || "MoGo Service") + " - " + globalBookingData.id,
      notes: { booking_id: globalBookingData.id, customer_name: globalBookingData.name, customer_phone: globalBookingData.phone, service_address: globalBookingData.address, vehicle: globalBookingData.vehicle },
      handler: function (response) { let uniqueTxnId = response.razorpay_payment_id || ("RZP" + Date.now()); handleRazorpayPaymentSuccess(uniqueTxnId); },
      prefill: { name: globalBookingData.name, contact: globalBookingData.phone }, theme: { color: "#FF5A00" }
    };
    let rzp = new window.Razorpay(options); rzp.open();
  } else {
    showCustomAlert("Instant Payment / UTR Verification", "Enter your UPI UTR or Razorpay Payment ID to automatically generate your Paid Tax Invoice:", true, function(payId) {
      if (payId && payId.trim().length >= 4) { handleRazorpayPaymentSuccess(payId.trim()); } else if (payId !== null) { showUiAlert("⚠️", "UTR Required", "Please enter a valid minimum 4-digit UTR / Payment ID to generate a Tax Invoice."); }
    });
  }
}

function handleRazorpayPaymentSuccess(paymentId) {
  let utrInput = document.getElementById('customerUtr'); if (utrInput) utrInput.value = paymentId;
  if (globalBookingData && globalBookingData.id) { globalBookingData.utr = paymentId; globalBookingData.forceType = 'TAX_INVOICE'; globalBookingData.status = 'INVOICE_GENERATED'; insertRecord(globalBookingData); }
  handleCustomerUtrInput(); document.getElementById('successHeading').innerText = "Payment Verified! Invoice Ready ✅"; document.getElementById('successSubtitle').innerText = "Unique Transaction ID: " + paymentId;
  viewJobCardModal(globalBookingData.id, false); generatePDFFromDB(globalBookingData.id, true, false); sendWhatsAppInvoiceViaAPI(globalBookingData, paymentId);
}

function submitBooking() {
  let name = document.getElementById('cName').value.trim(), phone = document.getElementById('cPhone').value.trim(), addr = document.getElementById('cAddr').value.trim();
  if (!name) return showUiAlert("👤", "Full Name Required", "Please enter your full name.", "cName");
  if (!/^[0-9]{10}$/.test(phone)) return showUiAlert("📱", "Invalid Mobile Number", "Please enter a valid 10-digit mobile number.", "cPhone");
  if (!addr) return showUiAlert("📍", "Address Missing", "Please tap 'Auto Locate' or type your doorstep address.", "cAddr");
  if (!selectedServiceKey) return showUiAlert("📋", "Service Required", "Please select Premium Foam Wash.");
  if (selectedServiceKey === 'insurance' || selectedServiceKey === 'puc' || selectedServiceKey === 'echallan') return showUiAlert("🏍️", "Verify Vehicle Number", "Please enter your Vehicle Number inside the selected " + selectedServiceName + " box and tap 'Send WA OTP'.", "reg-" + selectedServiceKey);
  if (selectedServiceKey !== 'wash') return showUiAlert("🔒", "Coming Soon", "This feature is currently locked. Please select Premium Foam Wash.");

  document.getElementById('bookingForm').style.display = "none"; document.getElementById('loadingScreen').style.display = "block";
  let id = "MOGO" + Math.floor(1000 + Math.random() * 9000); let maps = customerCoords ? "https://www.google.com/maps?q=" + customerCoords.lat + "," + customerCoords.lon : "";
  let grandTotal = TOTAL_PRICE; let subtotal = grandTotal / 1.18; let cgst = subtotal * 0.09; let sgst = subtotal * 0.09;

  globalBookingData = {
    id: id, date: new Date().toLocaleDateString('en-IN'), name: name, phone: phone, vehicle: vehicleType, serviceName: "Premium Foam Wash",
    slot: "Standard Doorstep Service", total: subtotal, cgst: cgst, sgst: sgst, grandTotal: grandTotal, address: addr, paymentType: paymentType, mapsLink: maps, status: "BOOKED", utr: "", forceType: "JOB_CARD", gpsImage: null
  };
  insertRecord(globalBookingData);
  try { fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(globalBookingData) }).catch(function() {}); } catch (e) {}

  setTimeout(function() {
    document.getElementById('loadingScreen').style.display = "none"; document.getElementById('successScreen').style.display = "block"; document.getElementById('qrPriceTitle').innerText = "Scan & Pay ₹89 Securely";
    let instBtn = document.getElementById('instantPayBtn'); if (instBtn) instBtn.innerText = "⚡ Pay ₹89 Instant (Auto-Generate Invoice)";
    document.getElementById('qrSection').style.display = paymentType === "Pay Now" ? "block" : "none"; handleCustomerUtrInput();
    let msg = "*New MoGo Service Booking!* 🚀\n\n*Booking ID:* " + id + "\n*Customer Name:* " + name + "\n*Phone:* " + phone + "\n*Vehicle:* " + vehicleType + "\n*Service:* Premium Foam Wash (₹89)\n*Address:* " + addr + "\n";
    if (maps) msg += "🗺️ *Google Maps Pin:* " + maps + "\n"; msg += "*Payment Mode:* " + paymentType;
    document.getElementById('waBtn').href = "https://wa.me/" + MY_WHATSAPP + "?text=" + encodeURIComponent(msg);
    if (paymentType === "Pay Now") setTimeout(function() { triggerRazorpayPayment(); }, 400);
  }, 250);
}

function openAdminPortal() { document.getElementById('adminPinInput').value = ""; document.getElementById('adminPinSection').style.display = "block"; document.getElementById('adminDashboard').style.display = "none"; document.getElementById('adminModal').classList.add('show'); setTimeout(function() { document.getElementById('adminPinInput').focus(); }, 100); }
function closeAdminPortal() { document.getElementById('adminModal').classList.remove('show'); }
function verifyAdminPin() {
  if (document.getElementById('adminPinInput').value.trim() === "4882") { document.getElementById('adminPinSection').style.display = "none"; document.getElementById('adminDashboard').style.display = "block"; renderAdminDB(); switchAdminTab('jc'); syncCloudDatabase(true, false); } else { showUiAlert("🔐", "Incorrect PIN", "Please enter the valid 4-digit Admin PIN."); }
}

function openMechanicPortal() { document.getElementById('mechPinInput').value = ""; document.getElementById('mechPinSection').style.display = "block"; document.getElementById('mechDashboard').style.display = "none"; document.getElementById('mechanicModal').classList.add('show'); setTimeout(function() { document.getElementById('mechPinInput').focus(); }, 100); }
function closeMechanicPortal() { document.getElementById('mechanicModal').classList.remove('show'); }
function verifyMechPin() {
  if (document.getElementById('mechPinInput').value.trim() === "7788") { document.getElementById('mechPinSection').style.display = "none"; document.getElementById('mechDashboard').style.display = "block"; renderMechanicJobs(); syncCloudDatabase(true, false); } else { showUiAlert("🔐", "Incorrect PIN", "Please enter the valid 4-digit Mechanic PIN."); }
}

function renderMechanicJobs() {
  runAutoBugCleaner(); let db = getDB(), html = "";
  db.forEach(function(item) {
    let amt = (item.isVahanService && item.grandTotal) ? item.grandTotal : TOTAL_PRICE;
    html += `<div class="db-item"><div class="db-header"><span class="db-id">${item.id}</span> <span class="badge b-booked">Job Sheet</span></div><div class="db-info"><strong>${item.name}</strong> (${item.phone})<br>Vehicle: ${item.vehicle} | ${item.serviceName} (₹${amt})<br>📍 ${item.address}</div><div class="db-action"><button class="btn-sm" type="button" style="background:#0284C7; color:#fff;" onclick="viewJobCardModal('${item.id}', true)">👁️ View Job Sheet (A4)</button><a href="tel:${item.phone}" class="btn-sm" style="background:#16A34A; color:#fff; text-decoration:none; display:flex; align-items:center; justify-content:center;">📞 Call Customer</a></div></div>`;
  });
  document.getElementById('mechJobList').innerHTML = html || '<p style="text-align:center; font-size:12px; color:#94A3B8; padding:20px;">No assigned jobs yet.</p>';
}

function switchAdminTab(tab) {
  ['jc', 'inv', 'gen'].forEach(function(t) { let el = document.getElementById('tab-' + t); if (el) el.classList.toggle('active', t === tab); });
  document.getElementById('view-jc').style.display = tab === 'jc' ? 'flex' : 'none'; document.getElementById('view-inv').style.display = tab === 'inv' ? 'flex' : 'none'; document.getElementById('view-gen').style.display = tab === 'gen' ? 'block' : 'none';
}
function toggleAdminUtrRequirement() {
  let docType = document.getElementById('admDocType').value; let lbl = document.getElementById('admUtrLabel');
  if (docType === 'TAX_INVOICE') { lbl.innerText = "UTR / Payment Proof (Mandatory for Tax Invoice):"; lbl.style.color = "#DC2626"; } else { lbl.innerText = "UTR / Payment Proof (Optional for Job Card):"; lbl.style.color = "#0B0F19"; }
}

function renderAdminDB() {
  runAutoBugCleaner(); let db = getDB(), jcHTML = "", invHTML = "", jcCount = 0, invCount = 0;
  db.forEach(function(item) {
    let hasValidUtr = item.utr && item.utr.trim().length >= 4, isInv = (item.forceType === 'TAX_INVOICE' || item.status === 'INVOICE_GENERATED' || hasValidUtr || Boolean(item.gpsImage)), jcBadge = isInv ? '<span class="badge b-ready">✅ Job Sheet (Paid)</span>' : '<span class="badge b-booked">⏳ Job Sheet (Unpaid)</span>', amt = (item.isVahanService && item.grandTotal) ? item.grandTotal : TOTAL_PRICE;
    jcCount++;
    let jcActions = `<button class="btn-sm" type="button" style="background:#0284C7; color:#fff;" onclick="viewJobCardModal('${item.id}', true)">👁️ View Job Sheet</button><button class="btn-sm" type="button" style="background:#25D366; color:#fff;" onclick="shareDirectWA('${item.id}', false)">💬 WA</button>${!isInv ? `<button class="btn-sm" type="button" style="background:#16A34A; color:#fff;" onclick="promptConvertToInvoice('${item.id}')">✅ Enter UTR & Make Invoice</button>` : `<button class="btn-sm" type="button" style="background:#16A34A; color:#fff;" onclick="viewJobCardModal('${item.id}', false)">🧾 View Invoice</button>`}`;
    jcHTML += `<div class="db-item"><div class="db-header"><span class="db-id">${item.id}</span> ${jcBadge}</div><div class="db-info"><strong>${item.name}</strong> | ${item.phone}<br>${item.serviceName} (₹${amt}) | ${item.date}<br>📍 ${item.address}</div><div class="db-action">${jcActions}<button class="btn-del" type="button" onclick="showConfirmAlert('🗑️', 'Delete Record?', 'Permanently delete ${item.id}?', function(){deleteRecord('${item.id}')})">✖</button></div></div>`;
    if (isInv) {
      invCount++;
      invHTML += `<div class="db-item"><div class="db-header"><span class="db-id">${item.id}</span> <span class="badge b-ready">🟢 Paid Tax Invoice</span></div><div class="db-info"><strong>${item.name}</strong> | ${item.phone}<br>${item.serviceName} (₹${amt}) | UTR: ${item.utr || 'VERIFIED'}<br>📍 ${item.address}</div><div class="db-action"><button class="btn-sm" type="button" style="background:#16A34A; color:#fff;" onclick="viewJobCardModal('${item.id}', false)">👁️ View Tax Invoice</button><button class="btn-sm" type="button" style="background:#0284C7; color:#fff;" onclick="viewJobCardModal('${item.id}', true)">📋 Job Sheet</button><button class="btn-sm" type="button" style="background:#25D366; color:#fff;" onclick="shareDirectWA('${item.id}', true)">💬 WA</button><button class="btn-del" type="button" onclick="showConfirmAlert('🗑️', 'Delete Record?', 'Permanently delete ${item.id}?', function(){deleteRecord('${item.id}')})">✖</button></div></div>`;
    }
  });
  let cJcEl = document.getElementById('count-jc'), cInvEl = document.getElementById('count-inv');
  if (cJcEl) cJcEl.innerText = "(" + jcCount + ")"; if (cInvEl) cInvEl.innerText = "(" + invCount + ")";
  document.getElementById('view-jc').innerHTML = jcHTML || '<p style="text-align:center; font-size:12px; color:#94A3B8; padding:20px;">No Job Cards yet.</p>';
  document.getElementById('view-inv').innerHTML = invHTML || '<p style="text-align:center; font-size:12px; color:#94A3B8; padding:20px;">No Paid Invoices yet. Enter UTR on a Job Card to generate Invoice.</p>';
}

function promptConvertToInvoice(id) { showCustomAlert("Enter Payment UTR", "Tax Invoice requires a valid UPI UTR / Transaction ID (minimum 4 characters):", true, function(utr) { if (utr === null) return; if (!utr || utr.trim().length < 4) { showUiAlert("⚠️", "UTR Required", "Cannot generate Tax Invoice without a valid UTR / Transaction ID."); return; } convertToInvoice(id, utr.trim()); }); }
function convertToInvoice(id, utr) { updateRecord(id, { forceType: 'TAX_INVOICE', status: 'INVOICE_GENERATED', utr: utr }); let rec = getRecord(id); if (rec) sendWhatsAppInvoiceViaAPI(rec, utr); renderAdminDB(); renderMechanicJobs(); switchAdminTab('inv'); viewJobCardModal(id, false); }

function shareDirectWA(id, isInvoice) {
  let rec = getRecord(id); if (!rec) return; let cleanPhone = String(rec.phone).replace(/[^0-9]/g, ''); if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
  let amt = (rec.isVahanService && rec.grandTotal) ? rec.grandTotal : TOTAL_PRICE;
  let msg = isInvoice ? "Hello " + rec.name + ",\n\nYour MoGo Total Bike Care *Paid Tax Invoice* (Booking ID: " + rec.id + ", Service: " + rec.serviceName + ", Amount: ₹" + amt + ", UTR: " + (rec.utr || 'VERIFIED') + ") has been generated.\nService Address: " + rec.address + "\n\nThank you for choosing MoGo!" : "Hello " + rec.name + ",\n\nYour MoGo Total Bike Care *Service Job Card* (Booking ID: " + rec.id + ", Service: " + rec.serviceName + ", Estimate: ₹" + amt + ") has been created.\nService Address: " + rec.address + "\n\nOur expert will arrive shortly!";
  window.open("https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(msg), '_blank');
}

function processAdminForm() {
  let name = document.getElementById('admName').value.trim(), phone = document.getElementById('admPhone').value.trim(), vehicle = document.getElementById('admVehicle').value || "Bike", addr = document.getElementById('admAddr').value.trim() || "Guwahati, Assam", docType = document.getElementById('admDocType').value, utr = document.getElementById('admUtr').value.trim(), fileInput = document.getElementById('admGpsImg');
  if (!name) return showUiAlert("👤", "Name Required", "Please enter customer full name."); if (!/^[0-9]{10}$/.test(phone)) return showUiAlert("📱", "Invalid Phone", "Please enter a valid 10-digit mobile number.");
  if (docType === 'TAX_INVOICE' && utr.length < 4 && (!fileInput.files || fileInput.files.length === 0)) return showUiAlert("⚠️", "UTR Required for Invoice", "Paid Tax Invoice cannot be generated without entering a valid UTR number (min 4 chars) or uploading payment proof.");
  
  let recId = "MOGO" + Math.floor(1000 + Math.random() * 9000), subtotal = TOTAL_PRICE / 1.18, cgst = subtotal * 0.09, sgst = subtotal * 0.09;
  let newRec = { id: recId, date: new Date().toLocaleDateString('en-IN'), name: name, phone: phone, vehicle: vehicle, serviceName: "Premium Foam Wash", slot: "Standard Doorstep Service", total: subtotal, cgst: cgst, sgst: sgst, grandTotal: TOTAL_PRICE, address: addr, paymentType: docType === 'TAX_INVOICE' ? 'Pay Now' : 'Pay After Service', utr: docType === 'TAX_INVOICE' ? (utr || "PROOF-ATTACHED") : "", forceType: docType, gpsImage: null, status: docType === 'TAX_INVOICE' ? 'INVOICE_GENERATED' : 'BOOKED' };
  if (fileInput.files && fileInput.files[0]) {
    let reader = new FileReader(); reader.onload = function(e) { let imgObj = new Image(); imgObj.onload = function() {
      let cvs = document.createElement('canvas'), scale = Math.min(800 / imgObj.width, 800 / imgObj.height, 1); cvs.width = imgObj.width * scale; cvs.height = imgObj.height * scale;
      let cCtx = cvs.getContext('2d'); cCtx.fillStyle = '#FFFFFF'; cCtx.fillRect(0, 0, cvs.width, cvs.height); cCtx.drawImage(imgObj, 0, 0, cvs.width, cvs.height);
      newRec.gpsImage = cvs.toDataURL('image/jpeg', 0.82); newRec.imgW = cvs.width; newRec.imgH = cvs.height;
      globalBookingData = newRec; insertRecord(newRec); if (docType === 'TAX_INVOICE') sendWhatsAppInvoiceViaAPI(newRec, newRec.utr);
      renderAdminDB(); renderMechanicJobs(); switchAdminTab(docType === 'TAX_INVOICE' ? 'inv' : 'jc'); viewJobCardModal(newRec.id, docType !== 'TAX_INVOICE');
    }; imgObj.src = e.target.result; }; reader.readAsDataURL(fileInput.files[0]);
  } else { globalBookingData = newRec; insertRecord(newRec); if (docType === 'TAX_INVOICE') sendWhatsAppInvoiceViaAPI(newRec, newRec.utr); renderAdminDB(); renderMechanicJobs(); switchAdminTab(docType === 'TAX_INVOICE' ? 'inv' : 'jc'); viewJobCardModal(newRec.id, docType !== 'TAX_INVOICE'); }
}
