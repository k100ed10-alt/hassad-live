window.HASSAD_FIREBASE = {
  enabled: true,
  projectName: "onlineclass",
  config: {
    apiKey: "",
    authDomain: "onlineclass.firebaseapp.com",
    projectId: "onlineclass",
    storageBucket: "onlineclass.appspot.com",
    messagingSenderId: "",
    appId: ""
  }
};
try {
  var saved = localStorage.getItem("hassad-fb-config");
  if (saved) {
    var parsed = JSON.parse(saved);
    if (parsed && parsed.apiKey) {
      window.HASSAD_FIREBASE.config = Object.assign(window.HASSAD_FIREBASE.config, parsed);
    }
  }
} catch (e) {}
