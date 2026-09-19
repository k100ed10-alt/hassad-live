(function () {
  if (!window.Hassad) return;
  function latest(colArr) { return (colArr && colArr[0]) || null; }
  function hook(name, after) {
    var orig = Hassad[name];
    if (!orig) return;
    Hassad[name] = function () {
      var r = orig.apply(this, arguments);
      try { after.apply(this, arguments); } catch (e) {}
      return r;
    };
  }
  hook("saveLive", function () {
    var data = JSON.parse(localStorage.getItem("hassad-db") || "{}");
    var item = latest(data.live_sessions);
    if (item && window.HassadFB) HassadFB.pushLive(item);
  });
  hook("saveHw", function () {
    var data = JSON.parse(localStorage.getItem("hassad-db") || "{}");
    var item = latest(data.assignments);
    if (item && window.HassadFB) HassadFB.pushHw(item);
  });
  hook("createStudent", function () {
    var data = JSON.parse(localStorage.getItem("hassad-db") || "{}");
    var ids = Object.keys(data.students || {});
    var uid = ids.sort().reverse()[0];
    if (uid && window.HassadFB) HassadFB.pushStudent(uid, data.students[uid]);
  });
  hook("createTeacher", function () {
    var data = JSON.parse(localStorage.getItem("hassad-db") || "{}");
    var ids = Object.keys(data.teachers || {});
    var uid = ids[ids.length - 1];
    if (uid && window.HassadFB) HassadFB.put("teachers", uid, data.teachers[uid]);
  });
  Hassad.syncCloud = function () {
    if (!window.HassadFB) return;
    HassadFB.init().then(function (ok) {
      if (!ok) { Hassad.toast && Hassad.toast(HassadFB.status); return; }
      var data = JSON.parse(localStorage.getItem("hassad-db") || "{}");
      var jobs = [];
      Object.keys(data.students || {}).forEach(function (id) {
        jobs.push(HassadFB.pushStudent(id, data.students[id]));
      });
      (data.assignments || []).forEach(function (a) { jobs.push(HassadFB.pushHw(a)); });
      (data.live_sessions || []).forEach(function (s) { jobs.push(HassadFB.pushLive(s)); });
      (data.lessons || []).forEach(function (l, i) {
        jobs.push(HassadFB.put("lessons", l.id || ("les" + i), l));
      });
      Promise.all(jobs).then(function () {
        return HassadFB.pull();
      }).then(function () {
        Hassad.toast && Hassad.toast("تمت المزامنة مع onlineclass");
        Hassad.renderAdmin && Hassad.renderAdmin();
      }).catch(function (e) {
        Hassad.toast && Hassad.toast("فشلت المزامنة: " + (e.message || e));
      });
    });
  };
  Hassad.saveFbConfig = function (e) {
    if (e) e.preventDefault();
    var raw = (document.getElementById("fb-json") || {}).value || "";
    try {
      var cfg = JSON.parse(raw);
      if (!cfg.apiKey || !cfg.projectId) throw new Error("ناقص apiKey أو projectId");
      HassadFB.saveConfig(cfg);
      document.getElementById("fb-msg").textContent = "حُفظ. أعد تحميل الصفحة.";
    } catch (err) {
      document.getElementById("fb-msg").textContent = "JSON غير صحيح: " + err.message;
    }
  };
})();
