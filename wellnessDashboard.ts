import { query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { v } from "convex/values";

// Get comprehensive wellness dashboard data
export const getDashboardData = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Fetch all wellness data in parallel
    const [
      moodLogs,
      sleepLogs,
      habits,
      habitLogs,
      medications,
      medicationLogs,
      symptoms,
      goals,
      waterLogs,
      exercises,
      journalEntries,
    ] = await Promise.all([
      // Mood
      ctx.db
        .query("moodTracking")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), args.startDate),
            q.lte(q.field("date"), args.endDate)
          )
        )
        .collect(),
      // Sleep
      ctx.db
        .query("sleepTracking")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), args.startDate),
            q.lte(q.field("date"), args.endDate)
          )
        )
        .collect(),
      // Habits
      ctx.db
        .query("habits")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect(),
      // Habit Logs
      ctx.db
        .query("habitLogs")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), args.startDate),
            q.lte(q.field("date"), args.endDate)
          )
        )
        .collect(),
      // Medications
      ctx.db
        .query("medications")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect(),
      // Medication Logs
      ctx.db
        .query("medicationLogs")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), args.startDate),
            q.lte(q.field("date"), args.endDate)
          )
        )
        .collect(),
      // Symptoms
      ctx.db
        .query("symptoms")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), args.startDate),
            q.lte(q.field("date"), args.endDate)
          )
        )
        .collect(),
      // Goals
      ctx.db
        .query("wellnessGoals")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("isCompleted"), false))
        .collect(),
      // Water
      ctx.db
        .query("waterIntake")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), args.startDate),
            q.lte(q.field("date"), args.endDate)
          )
        )
        .collect(),
      // Exercise
      ctx.db
        .query("exercises")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), args.startDate),
            q.lte(q.field("date"), args.endDate),
            q.eq(q.field("isCompleted"), true)
          )
        )
        .collect(),
      // Journal
      ctx.db
        .query("journalEntries")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), args.startDate),
            q.lte(q.field("date"), args.endDate)
          )
        )
        .collect(),
    ]);

    // Calculate mood statistics
    const moodStats = calculateMoodStats(moodLogs);

    // Calculate sleep statistics
    const sleepStats = calculateSleepStats(sleepLogs);

    // Calculate habit statistics
    const habitStats = calculateHabitStats(habits, habitLogs);

    // Calculate medication adherence
    const medicationStats = calculateMedicationStats(medicationLogs);

    // Calculate symptom frequency
    const symptomStats = calculateSymptomStats(symptoms);

    // Calculate wellness score
    const wellnessScore = calculateWellnessScore({
      moodLogs,
      sleepLogs,
      habitLogs,
      medicationLogs,
      symptoms,
    });

    return {
      summary: {
        wellnessScore,
        activeDays: calculateActiveDays([
          ...moodLogs.map((l) => l.date),
          ...sleepLogs.map((l) => l.date),
          ...habitLogs.map((l) => l.date),
        ]),
        totalActivities:
          moodLogs.length +
          sleepLogs.length +
          habitLogs.filter((l) => l.completed).length +
          exercises.length +
          journalEntries.length,
      },
      mood: moodStats,
      sleep: sleepStats,
      habits: habitStats,
      medications: medicationStats,
      symptoms: symptomStats,
      goals: {
        activeGoals: goals.length,
        completedGoals: goals.filter((g) => g.isCompleted).length,
        averageProgress:
          goals.length > 0
            ? goals.reduce(
                (sum, g) => sum + (g.currentValue / g.targetValue) * 100,
                0
              ) / goals.length
            : 0,
      },
      insights: generateInsights({
        moodStats,
        sleepStats,
        habitStats,
        medicationStats,
        symptomStats,
        waterLogs,
        exercises,
      }),
    };
  },
});

// Helper functions
function calculateMoodStats(
  logs: { mood: string; intensity: number; date: string }[]
) {
  if (logs.length === 0)
    return { averageIntensity: 0, mostCommonMood: null, totalLogs: 0 };

  const moodCounts: Record<string, number> = {};
  let totalIntensity = 0;

  logs.forEach((log) => {
    moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
    totalIntensity += log.intensity;
  });

  const mostCommonMood = Object.entries(moodCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  return {
    averageIntensity: totalIntensity / logs.length,
    mostCommonMood,
    totalLogs: logs.length,
    distribution: moodCounts,
  };
}

function calculateSleepStats(
  logs: { duration: number; quality: number; date: string }[]
) {
  if (logs.length === 0)
    return { averageDuration: 0, averageQuality: 0, totalLogs: 0 };

  const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
  const totalQuality = logs.reduce((sum, log) => sum + log.quality, 0);

  return {
    averageDuration: totalDuration / logs.length,
    averageQuality: totalQuality / logs.length,
    totalLogs: logs.length,
    totalHours: totalDuration / 60,
  };
}

function calculateHabitStats(
  habits: { _id: unknown; currentStreak: number; longestStreak: number }[],
  logs: { habitId: unknown; completed: boolean }[]
) {
  const completedCount = logs.filter((l) => l.completed).length;
  const totalLogs = logs.length;

  return {
    activeHabits: habits.length,
    completionRate: totalLogs > 0 ? (completedCount / totalLogs) * 100 : 0,
    totalStreak: habits.reduce((sum, h) => sum + h.currentStreak, 0),
    bestStreak: Math.max(...habits.map((h) => h.longestStreak), 0),
  };
}

function calculateMedicationStats(
  logs: { status: string }[]
) {
  const takenCount = logs.filter((l) => l.status === "taken").length;
  const totalScheduled = logs.length;

  return {
    adherenceRate: totalScheduled > 0 ? (takenCount / totalScheduled) * 100 : 0,
    takenCount,
    missedCount: logs.filter((l) => l.status === "missed").length,
    totalScheduled,
  };
}

function calculateSymptomStats(
  symptoms: { symptomName: string; severity: number }[]
) {
  if (symptoms.length === 0)
    return { totalSymptoms: 0, averageSeverity: 0, mostCommon: null };

  const symptomCounts: Record<string, number> = {};
  let totalSeverity = 0;

  symptoms.forEach((symptom) => {
    symptomCounts[symptom.symptomName] =
      (symptomCounts[symptom.symptomName] || 0) + 1;
    totalSeverity += symptom.severity;
  });

  const mostCommon = Object.entries(symptomCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  return {
    totalSymptoms: symptoms.length,
    averageSeverity: totalSeverity / symptoms.length,
    mostCommon,
  };
}

function calculateActiveDays(dates: string[]) {
  return new Set(dates).size;
}

function calculateWellnessScore(data: {
  moodLogs: { intensity: number }[];
  sleepLogs: { quality: number; duration: number }[];
  habitLogs: { completed: boolean }[];
  medicationLogs: { status: string }[];
  symptoms: { severity: number }[];
}) {
  let score = 50; // Base score

  // Mood contribution (0-20 points)
  if (data.moodLogs.length > 0) {
    const avgMoodIntensity =
      data.moodLogs.reduce((sum, l) => sum + l.intensity, 0) /
      data.moodLogs.length;
    score += (avgMoodIntensity / 10) * 20;
  }

  // Sleep contribution (0-20 points)
  if (data.sleepLogs.length > 0) {
    const avgSleepQuality =
      data.sleepLogs.reduce((sum, l) => sum + l.quality, 0) /
      data.sleepLogs.length;
    score += (avgSleepQuality / 5) * 20;
  }

  // Habits contribution (0-15 points)
  if (data.habitLogs.length > 0) {
    const completionRate =
      (data.habitLogs.filter((l) => l.completed).length /
        data.habitLogs.length) *
      100;
    score += (completionRate / 100) * 15;
  }

  // Medication adherence contribution (0-10 points)
  if (data.medicationLogs.length > 0) {
    const adherenceRate =
      (data.medicationLogs.filter((l) => l.status === "taken").length /
        data.medicationLogs.length) *
      100;
    score += (adherenceRate / 100) * 10;
  }

  // Symptoms penalty (0 to -15 points)
  if (data.symptoms.length > 0) {
    const avgSeverity =
      data.symptoms.reduce((sum, s) => sum + s.severity, 0) /
      data.symptoms.length;
    score -= (avgSeverity / 10) * 15;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateInsights(data: {
  moodStats: { averageIntensity: number; mostCommonMood: string | null };
  sleepStats: { averageDuration: number; averageQuality: number };
  habitStats: { completionRate: number; totalStreak: number };
  medicationStats: { adherenceRate: number };
  symptomStats: { totalSymptoms: number; averageSeverity: number };
  waterLogs: { amount: number }[];
  exercises: { duration: number }[];
}) {
  const insights: { type: string; message: string; priority: string }[] = [];

  // Sleep insights
  if (data.sleepStats.averageDuration < 420) {
    // Less than 7 hours
    insights.push({
      type: "sleep",
      message: "Uyku süreniz ideal seviyenin altında. Günde 7-9 saat uyumayı hedefleyin.",
      priority: "high",
    });
  } else if (data.sleepStats.averageQuality < 3) {
    insights.push({
      type: "sleep",
      message: "Uyku kalitenizi artırmak için uyku ortamınızı iyileştirmeyi deneyin.",
      priority: "medium",
    });
  }

  // Habit insights
  if (data.habitStats.completionRate < 70) {
    insights.push({
      type: "habit",
      message: "Alışkanlık tamamlama oranınız düşük. Daha küçük hedefler belirlemeyi deneyin.",
      priority: "medium",
    });
  } else if (data.habitStats.totalStreak > 20) {
    insights.push({
      type: "habit",
      message: "Harika! Alışkanlıklarınızı sürdürmede çok başarılısınız.",
      priority: "positive",
    });
  }

  // Medication insights
  if (data.medicationStats.adherenceRate < 80) {
    insights.push({
      type: "medication",
      message: "İlaç kullanım oranınız düşük. Hatırlatıcıları etkinleştirmeyi deneyin.",
      priority: "high",
    });
  }

  // Symptom insights
  if (data.symptomStats.totalSymptoms > 5) {
    insights.push({
      type: "symptom",
      message:
        "Bu dönemde birçok semptom kaydettiniz. Bir sağlık uzmanına danışmanız önerilir.",
      priority: "high",
    });
  }

  // Mood insights
  if (
    data.moodStats.mostCommonMood === "sad" ||
    data.moodStats.mostCommonMood === "very_sad"
  ) {
    insights.push({
      type: "mood",
      message:
        "Ruh haliniz düşük görünüyor. Sevdiklerinizle konuşmayı veya profesyonel destek almayı düşünün.",
      priority: "high",
    });
  } else if (
    data.moodStats.mostCommonMood === "happy" ||
    data.moodStats.mostCommonMood === "very_happy"
  ) {
    insights.push({
      type: "mood",
      message: "Ruh haliniz harika! Bu pozitif enerjiyi korumaya devam edin.",
      priority: "positive",
    });
  }

  // Water intake insights
  const avgWater = data.waterLogs.length > 0
    ? data.waterLogs.reduce((sum, l) => sum + l.amount, 0) / data.waterLogs.length
    : 0;
  if (avgWater < 2000) {
    insights.push({
      type: "hydration",
      message: "Su tüketiminiz yetersiz. Günde en az 2 litre su içmeyi hedefleyin.",
      priority: "medium",
    });
  }

  // Exercise insights
  const totalExerciseTime = data.exercises.reduce((sum, e) => sum + e.duration, 0);
  if (totalExerciseTime < 150) {
    // Less than 150 minutes per week
    insights.push({
      type: "exercise",
      message: "Haftada en az 150 dakika orta yoğunlukta egzersiz yapmayı hedefleyin.",
      priority: "medium",
    });
  }

  return insights;
}
