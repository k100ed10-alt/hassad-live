window.HassadFB = {
  ready: false,
  db: null,
  auth: null,
  status: "غير متصل"
};

function fbCfg() {
  var base = (window.HASSAD_FIREBASE && window.HASSAD_FIREBASE.config) || {};
  try {
    var saved = JSON.parse(localStorage.getItem("hassad-fb-config") || "null");
    if (saved && saved.apiKey) base = Object.assign({}, base, saved);
  } catch (e) {}
  return base;
}

function fbOk() {
  var c = fbCfg();
  return !!(c.apiKey && c.projectId && c.apiKey.indexOf("PASTE") === -1 && c.apiKey.length > 10);
}

function mergeCloud(col, docs) {
  var data;
  try { data = JSON.parse(localStorage.getItem("hassad-db") || "{}"); } catch (e) { data = {}; }
  if (!data.students) data.students = {};
  if (!data.teachers) data.teachers = {};
  if (!data.assignments) data.assignments = [];
  if (!data.live_sessions) data.live_sessions = [];
  if (!data.lessons) data.lessons = [];
  if (!data.submissions) data.submissions = {};
  if (col === "students") {
    docs.forEach(function (d) { if(d.id!=="_init") data.students[d.id] = Object.assign({ id: d.id }, d); });
  } else if (col === "teachers") {
    docs.forEach(function (d) { if(d.id!=="_init") data.teachers[d.id] = Object.assign({ id: d.id }, d); });
  } else if (col === "assignments") {
    data.assignments = docs.filter(function(d){return d.id!=="_init";});
  } else if (col === "live_sessions") {
    data.live_sessions = docs.filter(function(d){return d.id!=="_init";});
  } else if (col === "lessons") {
    data.lessons = docs.filter(function(d){return d.id!=="_init";});
  } else if (col === "submissions") {
    docs.forEach(function (d) { data.submissions[d.id] = d; });
  }
  localStorage.setItem("hassad-db", JSON.stringify(data));
  return data;
}

function snapDocs(snap) {
  var out = [];
  snap.forEach(function (doc) {
    var x = doc.data() || {};
    x.id = doc.id;
    out.push(x);
  });
  return out;
}

HassadFB.init = function () {
  if (HassadFB.ready && HassadFB.user) return Promise.resolve(true);
  if (typeof firebase === "undefined") {
    HassadFB.status = "لم يُحمَّل Firebase SDK";
    return Promise.resolve(false);
  }
  if (!fbOk()) {
    HassadFB.status = "لا يوجد مفتاح Firebase";
    return Promise.resolve(false);
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(fbCfg());
    HassadFB.db = firebase.firestore();
    if (firebase.auth) HassadFB.auth = firebase.auth();
  } catch (e) {
    HassadFB.status = "خطأ الاتصال: " + e.message;
    return Promise.resolve(false);
  }
  var done = function () {
    HassadFB.ready = true;
    HassadFB.status = "متصل · onlineclass";
    return true;
  };
  if (HassadFB.auth && !HassadFB.auth.currentUser) {
    return HassadFB.auth.signInAnonymously().then(function (cred) {
      HassadFB.user = cred && cred.user;
      return done();
    }).catch(function (e) {
      HassadFB.status = "و1 دخول الضيف Anonymous في Authentication. " + (e && e.message || "");
      HassadFB.ready = true;
      return true;
    });
  }
  HassadFB.user = HassadFB.auth && HassadFB.auth.currentUser;
  return Promise.resolve(done());
};

HassadFB.put = function (col, id, data) {
  return HassadFB.init().then(function () {
    if (!HassadFB.db) return;
    return HassadFB.db.collection(col).doc(String(id)).set(data, { merge: true });
  });
};

HassadFB.del = function (col, id) {
  return HassadFB.init().then(function () {
    if (!HassadFB.db) return;
    return HassadFB.db.collection(col).doc(String(id)).delete();
  });
};

HassadFB.pull = function () {
  return HassadFB.init().then(function () {
    if (!HassadFB.db) return null;
    var cols = ["students", "teachers", "assignments", "live_sessions", "lessons", "submissions"];
    return Promise.all(cols.map(function (c) {
      return HassadFB.db.collection(c).get().then(function (snap) {
        mergeCloud(c, snapDocs(snap));
      }).catch(function(){});
    })).then(function () {
      return JSON.parse(localStorage.getItem("hassad-db") || "{}");
    });
  });
};
