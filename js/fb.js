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
    docs.forEach(function (d) { data.students[d.id] = Object.assign({ id: d.id }, d); });
  } else if (col === "teachers") {
    docs.forEach(function (d) { data.teachers[d.id] = Object.assign({ id: d.id }, d); });
  } else if (col === "assignments") {
    data.assignments = docs;
  } else if (col === "live_sessions") {
    data.live_sessions = docs;
  } else if (col === "lessons") {
    data.lessons = docs;
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

HassadFB.saveConfig = function (cfg) {
  localStorage.setItem("hassad-fb-config", JSON.stringify(cfg));
  if (window.HASSAD_FIREBASE) window.HASSAD_FIREBASE.config = Object.assign({}, window.HASSAD_FIREBASE.config, cfg);
};

HassadFB.init = function () {
  if (HassadFB.ready) return Promise.resolve(true);
  if (typeof firebase === "undefined") {
    HassadFB.status = "لم يُحمَّل Firebase SDK";
    return Promise.resolve(false);
  }
  if (!fbOk()) {
    HassadFB.status = "الصق مفتاح firebase من لوحة المعلم";
    return Promise.resolve(false);
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(fbCfg());
    HassadFB.db = firebase.firestore();
    HassadFB.auth = firebase.auth();
    HassadFB.ready = true;
    HassadFB.status = "متصل · onlineclass";
    return Promise.resolve(true);
  } catch (e) {
    HassadFB.status = "خطأ الاتصال: " + e.message;
    return Promise.resolve(false);
  }
};

HassadFB.put = function (col, id, data) {
  if (!HassadFB.ready || !HassadFB.db) return Promise.resolve();
  return HassadFB.db.collection(col).doc(String(id)).set(data, { merge: true });
};

HassadFB.del = function (col, id) {
  if (!HassadFB.ready || !HassadFB.db) return Promise.resolve();
  return HassadFB.db.collection(col).doc(String(id)).delete();
};

HassadFB.pull = function () {
  if (!HassadFB.ready || !HassadFB.db) return Promise.resolve(null);
  var cols = ["students", "teachers", "assignments", "live_sessions", "lessons", "submissions"];
  return Promise.all(cols.map(function (c) {
    return HassadFB.db.collection(c).get().then(function (snap) {
      mergeCloud(c, snapDocs(snap));
    });
  })).then(function () {
    return JSON.parse(localStorage.getItem("hassad-db") || "{}");
  });
};

HassadFB.listen = function (onChange) {
  if (!HassadFB.ready || !HassadFB.db) return;
  ["assignments", "live_sessions", "students", "lessons"].forEach(function (c) {
    HassadFB.db.collection(c).onSnapshot(function (snap) {
      mergeCloud(c, snapDocs(snap));
      if (onChange) onChange(c);
    });
  });
};

HassadFB.findStudent = function (email) {
  email = (email || "").toLowerCase();
  if (!HassadFB.ready || !HassadFB.db) {
    var data = JSON.parse(localStorage.getItem("hassad-db") || "{}");
    var hit = null;
    Object.keys(data.students || {}).forEach(function (id) {
      var s = data.students[id];
      if (s && s.email && s.email.toLowerCase() === email) hit = Object.assign({ id: id }, s);
    });
    return Promise.resolve(hit);
  }
  return HassadFB.db.collection("students").where("email", "==", email).limit(1).get().then(function (snap) {
    if (snap.empty) return null;
    var d = snap.docs[0];
    return Object.assign({ id: d.id }, d.data());
  });
};

HassadFB.login = function (email, password) {
  email = (email || "").trim().toLowerCase();
  return HassadFB.init().then(function () {
    if (email === "admin@hassad.om" && (password === "Admin#1" || password === "Teacher#1")) {
      return { email: email, name: "مدير حَصاد", role: "admin", uid: "uid_admin" };
    }
    if (email === "teacher@hassad.om" && password === "Teacher#1") {
      return { email: email, name: "إدارة حَصاد", role: "teacher", uid: "uid_teacher" };
    }
    var afterProfile = function (profile, role) {
      if (!profile) return null;
      if (profile.password && profile.password !== password) return "badpass";
      return {
        email: profile.email,
        name: profile.name,
        role: role || profile.role || "student",
        uid: profile.id || profile.uid,
        grade: profile.grade || "",
        subject_id: profile.subject_id || "",
        subscription_status: profile.subscription_status || "active"
      };
    };
    var tryAuth = function () {
      if (!HassadFB.auth) return Promise.resolve(null);
      return HassadFB.auth.signInWithEmailAndPassword(email, password).then(function (cred) {
        return HassadFB.findStudent(email).then(function (st) {
          if (st) return afterProfile(Object.assign({ id: cred.user.uid }, st), "student");
          return HassadFB.db.collection("teachers").where("email", "==", email).limit(1).get().then(function (snap) {
            if (!snap.empty) {
              var t = Object.assign({ id: snap.docs[0].id }, snap.docs[0].data());
              return afterProfile(t, "teacher");
            }
            return {
              email: email,
              name: cred.user.displayName || email.split("@")[0],
              role: "student",
              uid: cred.user.uid,
              grade: "",
              subscription_status: "active"
            };
          });
        });
      }).catch(function () { return null; });
    };
    return tryAuth().then(function (u) {
      if (u) return u;
      return HassadFB.findStudent(email).then(function (st) {
        if (st) return afterProfile(st, "student");
        if (!HassadFB.db) return null;
        return HassadFB.db.collection("teachers").where("email", "==", email).limit(1).get().then(function (snap) {
          if (snap.empty) return null;
          return afterProfile(Object.assign({ id: snap.docs[0].id }, snap.docs[0].data()), "teacher");
        });
      });
    });
  });
};

HassadFB.pushStudent = function (uid, st) {
  return HassadFB.init().then(function () {
    return HassadFB.put("students", uid, {
      name: st.name,
      email: (st.email || "").toLowerCase(),
      password: st.password || "",
      grade: st.grade || "",
      subscription_status: st.subscription_status || "active",
      points: st.points || 0,
      streak: st.streak || 0
    });
  });
};

HassadFB.pushLive = function (item) {
  return HassadFB.init().then(function () {
    return HassadFB.put("live_sessions", item.id, item);
  });
};

HassadFB.pushHw = function (item) {
  return HassadFB.init().then(function () {
    return HassadFB.put("assignments", item.id, item);
  });
};
