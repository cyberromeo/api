const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const SERVICE_ACCOUNT_FILE = process.env.FIREBASE_SERVICE_ACCOUNT || '../epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json';

if (!getApps().length) {
  const serviceAccountPath = path.resolve(__dirname, SERVICE_ACCOUNT_FILE);
  const serviceAccount = require(serviceAccountPath);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function testDashEndpoint() {
  console.log("📡 Testing /api/dash output locally...");

  const defaultMuscles = {
    abductors: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    abs: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    adductors: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    biceps: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    calves: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    chest: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    forearms: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    glutes: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    hamstrings: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    hipFlexors: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    lats: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    lowerBack: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    obliques: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    quads: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    shoulders: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    tibialisAnterior: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    traps: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    triceps: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null }
  };

  const todayIsoDate = new Date().toISOString().split('T')[0];

  const acSnap = await db.collection('api_feeds').doc('ac_power_metrics').get();
  const aiSnap = await db.collection('api_feeds').doc('ai_usage_metrics').get();
  const todoistSnap = await db.collection('api_feeds').doc('todoist_metrics').get();
  const medxTrackerSnap = await db.collection('api_feeds').doc('medx_tracker').get();
  const medxStudySnap = await db.collection('api_feeds').doc('medx_studytime').get();
  const motraSnap = await db.collection('api_feeds').doc('motra_metrics').get();
  const classSnap = await db.collection('api_feeds').doc('class_schedule').get();
  const examsSnap = await db.collection('api_feeds').doc('exams_schedule').get();

  const classPayload = classSnap.exists ? classSnap.data().payload : {};
  const allClasses = classPayload.classes || [];
  const todayClasses = allClasses.filter(c => c.date && c.date.includes(todayIsoDate));

  const classWidget = todayClasses.length > 0 ? {
    status: `${todayClasses.length} class(es) scheduled`,
    date: todayIsoDate,
    classes: todayClasses
  } : {
    status: "no class today",
    date: todayIsoDate,
    classes: []
  };

  const examsPayload = examsSnap.exists ? examsSnap.data().payload : {};
  const allExams = examsPayload.exams || [];
  const formattedExams = allExams.map(ex => ({
    subject: ex.subject,
    date: (ex.date && ex.date.includes(todayIsoDate)) ? "Today" : ex.date
  }));

  const acSummary = acSnap.exists ? acSnap.data().payload?.summary || {} : {};
  const aiSummary = aiSnap.exists ? aiSnap.data().payload?.summary || {} : {};

  const todoistPayload = todoistSnap.exists ? todoistSnap.data().payload || {} : {};
  const rawTasks = todoistPayload.tasks || [];
  const tasksArr = [];
  const shoppingArr = [];

  rawTasks.forEach(t => {
    const contentLower = (t.content || "").toLowerCase();
    const isShopping = contentLower.includes('shopping') || contentLower.includes('buy') || contentLower.includes('protein') || contentLower.includes('whey');
    const formattedItem = {
      content: t.content,
      due: t.due,
      priority: t.priority || 1,
      is_overdue: Boolean(t.isOverdue),
      completed: false
    };
    if (isShopping) shoppingArr.push(formattedItem);
    else tasksArr.push(formattedItem);
  });

  const trackerSummary = medxTrackerSnap.exists ? medxTrackerSnap.data().payload?.summary || {} : {};
  const studySummary = medxStudySnap.exists ? medxStudySnap.data().payload?.summary || {} : {};

  const motraData = motraSnap.exists ? motraSnap.data().payload || {} : {};
  const motraSummary = motraData.summary || {};
  const rawMusclesMap = motraData.musclesMap || {};

  const fullMusclesMap = { ...defaultMuscles };
  Object.keys(rawMusclesMap).forEach(key => {
    if (rawMusclesMap[key]) {
      fullMusclesMap[key] = {
        recovery: rawMusclesMap[key].recovery ?? 100,
        daysToRecovery: rawMusclesMap[key].daysToRecovery ?? 0,
        daysSinceLastUsed: rawMusclesMap[key].daysSinceLastUsed ?? null
      };
    }
  });

  const dashResult = {
    timestamp: new Date().toISOString(),
    class_schedule: classWidget,
    exams: {
      total_upcoming: formattedExams.length,
      upcoming_exams: formattedExams
    },
    ac_power: {
      today_kwh: String(acSummary.todayKwh || "6.84"),
      week_kwh: String(acSummary.thisWeekKwh || "6.84"),
      month_kwh: String(acSummary.thisMonthKwh || "82.52"),
      unit: "kWh"
    },
    ai_usage: {
      rolling_5h: `${aiSummary.rolling?.percentage || 0}%`,
      rolling_reset: aiSummary.rolling?.resetIn || "N/A",
      weekly_usage: `${aiSummary.weekly?.percentage || 0}%`,
      weekly_reset: aiSummary.weekly?.resetIn || "N/A",
      monthly_usage: `${aiSummary.monthly?.percentage || 0}%`,
      monthly_reset: aiSummary.monthly?.resetIn || "N/A"
    },
    todoist: {
      total_pending: rawTasks.length,
      tasks: tasksArr,
      shopping_list: shoppingArr
    },
    medx_tracker: {
      completion_percentage: trackerSummary.completionPercentage || "0.0%",
      items_progress: `${trackerSummary.completedItems || 0}/121`,
      completed_items: trackerSummary.completedItems || 0,
      total_items: 121
    },
    medx_studytime: {
      study_hours: studySummary.todayStudyHours || "0.00",
      study_goal: "11 hrs",
      study_progress: `${studySummary.todayStudyHours || "0.00"}/11 hrs`,
      pyq_hours: studySummary.todayPyqHours || "0.00",
      pyq_goal: "2 hrs",
      pyq_progress: `${studySummary.todayPyqHours || "0.00"}/2 hrs`,
      streak_days: studySummary.streakDays || 0
    },
    motra: {
      overall_recovery: motraSummary.overallRecoveryPct || "100%",
      recovered_muscles: motraSummary.recoveredMuscles || "18/18",
      recovering_muscles: motraSummary.recoveringMuscles || 0,
      days_since_workout: motraSummary.daysSinceLastWorkout || 245,
      muscles: fullMusclesMap
    }
  };

  console.log("✅ LIVE /api/dash OUTPUT WITH ALL 18 MUSCLES:\n", JSON.stringify(dashResult, null, 2));
  process.exit(0);
}

testDashEndpoint();
