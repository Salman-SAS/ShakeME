// =======================
// GLOBAL STATE
// =======================
let currentMode = "shake";
let currentData = {};
let deferredPrompt;

// =======================
// SCREEN SWITCH
// =======================
function show(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// =======================
// MODE SELECT
// =======================
function startMode(mode){
    currentMode = mode;
    document.getElementById("hugFields").style.display =
        (mode === "hug") ? "block" : "none";
    show("form");
}

// =======================
// VALIDATION
// =======================
function validateFields(fields){
    let valid = true;
    fields.forEach(f => {
        let el = document.getElementById(f);
        if(!el.value.trim()){
            el.classList.add("error");
            valid = false;
        } else {
            el.classList.remove("error");
        }
    });
    return valid;
}

// =======================
// GENERATE QR
// =======================
function generateQR(){

    if(!validateFields(["name","phone","role"])) return;

    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let code = document.getElementById("countryCode").value;
    let role = document.getElementById("role").value.trim();

    let fullPhone = code + phone;

    let data = {
        type: currentMode,
        name: name,
        phone: fullPhone,
        role: role
    };

    if(currentMode === "hug"){
        data.status = document.getElementById("status").value;
        data.linkedin = document.getElementById("linkedin").value.trim();
        data.about = document.getElementById("about").value.trim();
    }

    currentData = data;
    localStorage.setItem("profile", JSON.stringify(data));

    // CREATE URL
    let encoded = encodeURIComponent(JSON.stringify(data));
    let url = window.location.origin + window.location.pathname + "?data=" + encoded;

    // GENERATE QR
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), {
        text: url,
        width: 220,
        height: 220,
        colorDark:"#000000",
        colorLight:"#ffffff"
    });

    // SHOW NAME + ROLE ON CARD
    document.getElementById("displayName").innerText = name;
    document.getElementById("displayRole").innerText = role;

    show("qrScreen");
}

// =======================
// COPY QR LINK
// =======================
function copyQRLink(){
    if(!currentData || !currentData.name) return;

    let encoded = encodeURIComponent(JSON.stringify(currentData));
    let url = window.location.origin + window.location.pathname + "?data=" + encoded;

    navigator.clipboard.writeText(url).then(()=>{
        alert("QR Link copied to clipboard!");
    });
}

// =======================
// DISPLAY PROFILE CARD
// =======================
function displayResult(p){
    document.getElementById("viewName").innerText = p.name || "";
    document.getElementById("viewRole").innerText = p.role || "";

    document.getElementById("whatsappBtn").href =
        "https://wa.me/" + p.phone.replace(/\D/g,'');

    if(p.linkedin){
        document.getElementById("linkedinBtn").classList.remove("hidden");
        document.getElementById("linkedinBtn").href = p.linkedin;
    } else {
        document.getElementById("linkedinBtn").classList.add("hidden");
    }

    if(p.about){
        document.getElementById("viewAboutSection").classList.remove("hidden");
        document.getElementById("viewAbout").innerText = p.about;
    } else {
        document.getElementById("viewAboutSection").classList.add("hidden");
    }

    if(p.status){
        document.getElementById("viewStatus").classList.remove("hidden");
        document.getElementById("viewStatus").innerText = p.status;
    } else {
        document.getElementById("viewStatus").classList.add("hidden");
    }
}

// =======================
// SAVE CONTACT
// =======================
function saveContact(){
    if(!currentData || !currentData.name) return;

    let vcf = `BEGIN:VCARD
VERSION:3.0
FN:${currentData.name}
TEL:${currentData.phone}
END:VCARD`;

    let blob = new Blob([vcf], { type: 'text/vcard' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentData.name}.vcf`;
    link.click();
}

// =======================
// NAVIGATION
// =======================
function goHome(){
    show("home");
}

// =======================
// PREFILL FORM FROM LOCALSTORAGE
// =======================
(function prefillForm(){
    let lastProfile = localStorage.getItem("profile");
    if(lastProfile){
        let p = JSON.parse(lastProfile);
        document.getElementById("name").value = p.name || "";
        document.getElementById("phone").value = p.phone ? p.phone.slice(-10) : "";
        document.getElementById("role").value = p.role || "";
        if(p.linkedin) document.getElementById("linkedin").value = p.linkedin;
        if(p.status) document.getElementById("status").value = p.status;
        if(p.about) document.getElementById("about").value = p.about;

        if(p.type === "hug"){
            currentMode = "hug";
            document.getElementById("hugFields").style.display = "block";
        }
    }
})();

// =======================
// LOAD QR DATA IF SCANNED
// =======================
window.onload = ()=>{
    let params = new URLSearchParams(window.location.search);
    let dataParam = params.get("data");

    if(dataParam){
        try{
            let parsed = JSON.parse(decodeURIComponent(dataParam));
            currentData = parsed;
            displayResult(parsed);
            show("profileScreen"); // scanned QR → show contact card
            return;
        }catch(e){
            console.log("Invalid QR data");
        }
    }

    show("home"); // otherwise start at home screen
};

// =======================
// TOAST MESSAGE
// =======================
function showConnectedToast(mode){
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = `Connected via ${mode === 'shake' ? 'Shake' : 'Hug'}!`;
    document.body.appendChild(toast);

    setTimeout(() => { toast.style.opacity = 1; toast.style.top = '40px'; }, 50);
    setTimeout(() => { toast.style.opacity = 0; toast.style.top = '0px'; }, 2000);
    setTimeout(() => { document.body.removeChild(toast); }, 2500);
}

// =======================
// PWA INSTALL PROMPT
// =======================
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

function installApp(){
    if(deferredPrompt){
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
    } else {
        alert("Use 'Add to Home Screen' from your browser menu");
    }
}
