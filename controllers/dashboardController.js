import User from "../models/User.js";
import Quiz from "../models/Quiz.js";
import Attempt from "../models/Attempt.js";

export const getAdminDashboard = async (req, res) => {
  try {
    // Get real database counts
    const totalUsers = await User.countDocuments();

    const totalQuizzes = await Quiz.countDocuments();

    const totalAttempts = await Attempt.countDocuments({
      status: "COMPLETED",
    });

    // Average score is calculated only from completed attempts
    const scoreData = await Attempt.aggregate([
      {
        $match: {
          status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: null,
          averageScore: {
            $avg: "$percentage",
          },
        },
      },
    ]);

    const averageScore =
      scoreData.length > 0
        ? Number(scoreData[0].averageScore.toFixed(2))
        : 0;

    /*
     * Recent activity
     *
     * Everything here comes from MongoDB.
     * Nothing is hardcoded.
     */

    const [recentUsers, recentQuizzes, recentAttempts] =
      await Promise.all([
        User.find()
          .select("name email role createdAt")
          .sort({ createdAt: -1 })
          .limit(10),

        Quiz.find()
          .select("title status createdAt")
          .sort({ createdAt: -1 })
          .limit(10),

        Attempt.find({
          status: "COMPLETED",
        })
          .populate("user", "name email")
          .populate("quiz", "title")
          .select(
            "user quiz score percentage resultStatus submittedAt createdAt"
          )
          .sort({ submittedAt: -1 })
          .limit(10),
      ]);

    const activities = [];

    // User registrations
    recentUsers.forEach((user) => {
      activities.push({
        type: "USER_REGISTERED",
        title: "New user registered",
        description: `${user.name} joined QuizHub`,
        date: user.createdAt,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });

    // Quiz creation
    recentQuizzes.forEach((quiz) => {
      activities.push({
        type: "QUIZ_CREATED",
        title: "Quiz created",
        description: `${quiz.title} was created`,
        date: quiz.createdAt,
        quiz: {
          id: quiz._id,
          title: quiz.title,
          status: quiz.status,
        },
      });
    });

    // Completed attempts
    recentAttempts.forEach((attempt) => {
      activities.push({
        type: "QUIZ_COMPLETED",
        title: "Quiz completed",
        description: `${
          attempt.user?.name || "A student"
        } completed ${
          attempt.quiz?.title || "a quiz"
        }`,
        date:
          attempt.submittedAt ||
          attempt.createdAt,

        attempt: {
          id: attempt._id,
          score: attempt.score,
          percentage: attempt.percentage,
          resultStatus: attempt.resultStatus,
        },
      });
    });

    // Sort all activity together by date
    activities.sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );

    // Only show latest 10
    const recentActivity = activities.slice(0, 10);

    res.status(200).json({
      stats: {
        totalUsers,
        totalQuizzes,
        totalAttempts,
        averageScore,
      },
      recentActivity,
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    res.status(500).json({
      message: "Failed to load admin dashboard",
    });
  }
};