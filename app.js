// =======================
// GLOBAL STATE
// =======================
let currentMode = "shake";
let currentData = {};

// =======================
// SCREEN SWITCH
// =======================
function show(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// =======================
// MODE SELECT (FIXED)
// =======================
function startMode(mode){
    currentMode = mode;

    document.getElementById("hugFields").style.display =
        (mode === "hug") ? "block" : "none";

    show("form");
}

// =======================
// GENERATE QR (FIXED)
// =======================
function generateQR(){

    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let code = document.getElementById("countryCode").value;
    let role = document.getElementById("role").value.trim();

    if(!name || !phone || !role){
        alert("Name, Phone and Role are required");
        return;
    }

    let fullPhone = code + phone;

    let data = {
        type: currentMode,
        name: name,
        phone: fullPhone,
        role: role
    };

    // ONLY FOR HUG
    if(currentMode === "hug"){
        data.status = document.getElementById("status").value;
        data.linkedin = document.getElementById("linkedin").value;
        data.about = document.getElementById("about").value;
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
// LOAD FROM QR
// =======================
window.onload = ()=>{
    let params = new URLSearchParams(window.location.search);
    let dataParam = params.get("data");

    if(dataParam){
        try{
            let parsed = JSON.parse(decodeURIComponent(dataParam));
            currentData = parsed;
            displayResult(parsed);
            show("profileScreen");
        }catch(e){
            console.log("Invalid QR");
        }
    }
};

// =======================
// DISPLAY RESULT (SAFE)
// =======================
function displayResult(p){

    document.getElementById("viewName").innerText = p.name || "";
    document.getElementById("viewRole").innerText = p.role || "";

    document.getElementById("whatsappBtn").href =
        "https://wa.me/" + p.phone.replace(/\D/g,'');

    if(p.linkedin){
        document.getElementById("linkedinBtn").classList.remove("hidden");
        document.getElementById("linkedinBtn").href = p.linkedin;
    }

    if(p.about){
        document.getElementById("viewAboutSection").classList.remove("hidden");
        document.getElementById("viewAbout").innerText = p.about;
    }

    if(p.status){
        document.getElementById("viewStatus").classList.remove("hidden");
        document.getElementById("viewStatus").innerText = p.status;
    }
}

// =======================
// SAVE CONTACT
// =======================
function saveContact(){
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
    window.location.href = window.location.pathname;
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function installApp(){
  if(deferredPrompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
    });
  } else {
    alert("Use 'Add to Home Screen' from your browser menu");
  }
}