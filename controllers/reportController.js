import Attempt from "../models/Attempt.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";


// =========================================================
// REPORT OVERVIEW
// =========================================================

export const getReportOverview = async (req, res) => {
  try {
    const [
      totalStudents,
      totalQuizzes,
      totalAttempts,
      completedAttempts,
      passedAttempts,
      failedAttempts,
    ] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),

      Quiz.countDocuments(),

      Attempt.countDocuments(),

      Attempt.countDocuments({
        status: "COMPLETED",
      }),

      Attempt.countDocuments({
        status: "COMPLETED",
        resultStatus: "PASSED",
      }),

      Attempt.countDocuments({
        status: "COMPLETED",
        resultStatus: "FAILED",
      }),
    ]);

    const completed = await Attempt.find({
      status: "COMPLETED",
    }).select("score totalMarks percentage");

    let averageScore = 0;
    let averagePercentage = 0;

    if (completed.length > 0) {
      const totalScore = completed.reduce(
        (sum, attempt) => sum + (attempt.score || 0),
        0
      );

      const totalPercentage = completed.reduce(
        (sum, attempt) =>
          sum + (attempt.percentage || 0),
        0
      );

      averageScore = totalScore / completed.length;
      averagePercentage =
        totalPercentage / completed.length;
    }

    const passRate =
      completedAttempts > 0
        ? (passedAttempts / completedAttempts) * 100
        : 0;

    const failRate =
      completedAttempts > 0
        ? (failedAttempts / completedAttempts) * 100
        : 0;

    res.status(200).json({
      overview: {
        totalStudents,
        totalQuizzes,
        totalAttempts,
        completedAttempts,
        passedAttempts,
        failedAttempts,

        averageScore: Number(
          averageScore.toFixed(2)
        ),

        averagePercentage: Number(
          averagePercentage.toFixed(2)
        ),

        passRate: Number(
          passRate.toFixed(2)
        ),

        failRate: Number(
          failRate.toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get report overview error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch report overview",
    });
  }
};


// =========================================================
// QUIZ PERFORMANCE
// =========================================================

export const getQuizPerformance = async (req, res) => {
  try {
    const performance = await Attempt.aggregate([
      {
        $match: {
          status: "COMPLETED",
        },
      },

      {
        $group: {
          _id: "$quiz",

          totalAttempts: {
            $sum: 1,
          },

          averageScore: {
            $avg: "$score",
          },

          averagePercentage: {
            $avg: "$percentage",
          },

          passedAttempts: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$resultStatus",
                    "PASSED",
                  ],
                },
                1,
                0,
              ],
            },
          },

          failedAttempts: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$resultStatus",
                    "FAILED",
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "_id",
          as: "quiz",
        },
      },

      {
        $unwind: "$quiz",
      },

      {
        $project: {
          _id: 1,

          title: "$quiz.title",

          totalMarks: "$quiz.totalMarks",

          totalAttempts: 1,

          averageScore: {
            $round: [
              "$averageScore",
              2,
            ],
          },

          averagePercentage: {
            $round: [
              "$averagePercentage",
              2,
            ],
          },

          passedAttempts: 1,

          failedAttempts: 1,

          passRate: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      "$passedAttempts",
                      "$totalAttempts",
                    ],
                  },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },

      {
        $sort: {
          totalAttempts: -1,
        },
      },
    ]);

    res.status(200).json({
      performance,
    });
  } catch (error) {
    console.error(
      "Get quiz performance error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch quiz performance",
    });
  }
};


// =========================================================
// RECENT ATTEMPTS REPORT
// =========================================================

export const getRecentAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({
      status: "COMPLETED",
    })
      .populate("user", "name email")
      .populate(
        "quiz",
        "title totalMarks category"
      )
      .sort({
        submittedAt: -1,
      })
      .limit(10);

    res.status(200).json({
      attempts,
    });
  } catch (error) {
    console.error(
      "Get recent attempts error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch recent attempts",
    });
  }
};