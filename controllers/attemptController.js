import Quiz from "../models/Quiz.js";
import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";

export const startAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.status !== "PUBLISHED") {
      return res.status(400).json({
        message: "This quiz is not available",
      });
    }

    const completedAttempts = await Attempt.countDocuments({
      user: userId,
      quiz: quizId,
      status: "COMPLETED",
    });

    if (completedAttempts >= quiz.maxAttempts) {
      return res.status(403).json({
        message: "Maximum attempts reached",
      });
    }

    const existingAttempt = await Attempt.findOne({
      user: userId,
      quiz: quizId,
      status: "IN_PROGRESS",
    });

    if (existingAttempt) {
      return res.status(200).json({
        message: "Existing attempt resumed",
        attempt: existingAttempt,
      });
    }

    const attempt = await Attempt.create({
      user: userId,
      quiz: quizId,
      totalMarks: quiz.totalMarks,
      status: "IN_PROGRESS",
      startedAt: new Date(),
    });

    res.status(201).json({
      message: "Attempt started successfully",
      attempt,
    });
  } catch (error) {
    console.error("Start attempt error:", error.message);

    res.status(500).json({
      message: "Failed to start attempt",
    });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers array is required",
      });
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      user: userId,
    });

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found",
      });
    }

    if (attempt.status === "COMPLETED") {
      return res.status(400).json({
        message: "Attempt has already been submitted",
      });
    }

 const quiz = await Quiz.findById(attempt.quiz);

if (!quiz) {
  return res.status(404).json({
    message: "Quiz not found",
  });
}

const deadline =
  new Date(attempt.startedAt).getTime() +
  quiz.duration * 60 * 1000;

    const questionSet = await Question.findOne({
      quiz: attempt.quiz,
    });

    if (!questionSet) {
      return res.status(404).json({
        message: "Questions not found for this quiz",
      });
    }

    // Calculate total marks from the actual questions
    const totalMarks = questionSet.questions.reduce(
      (total, question) => total + question.marks,
      0
    );

    let score = 0;

    for (const answer of answers) {
      const question = questionSet.questions[answer.questionIndex];

      if (!question) {
        continue;
      }

      if (answer.selectedAnswer === question.correctAnswer) {
        score += question.marks;
      } else {
        score -= question.negativeMarks || 0;
      }
    }

    // Score cannot go below zero
    score = Math.max(0, score);


    const percentage =
  (score / quiz.totalMarks) * 100;

const resultStatus =
  percentage >= quiz.passingPercentage
    ? "PASSED"
    : "FAILED";

    attempt.answers = answers;
    attempt.score = score;
    attempt.totalMarks = totalMarks;
    attempt.percentage = percentage;
    attempt.status = "COMPLETED";
    attempt.resultStatus = resultStatus;
    attempt.submittedAt = new Date();

    await attempt.save();

    res.status(200).json({
      message: "Attempt submitted successfully",
      result: {
        attemptId: attempt._id,
        score,
        totalMarks,
        percentage,
        status: attempt.status,
        resultStatus: attempt.resultStatus,
        submittedAt: attempt.submittedAt,
      },
    });
  } catch (error) {
    console.error("Submit attempt error:", error.message);

    res.status(500).json({
      message: "Failed to submit attempt",
    });
  }
};

export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({
      user: req.user.id,
    })
      .populate("quiz", "title category duration totalMarks")
      .sort({ createdAt: -1 });

    res.status(200).json({
      attempts,
    });
  } catch (error) {
    console.error("Get attempts error:", error.message);

    res.status(500).json({
      message: "Failed to fetch attempts",
    });
  }
};

export const getAttemptById = async (req, res) => {
  try {
    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      user: req.user.id,
    }).populate(
      "quiz",
      "title category duration totalMarks passingMarks"
    );

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found",
      });
    }

    const questionDoc = await Question.findOne({
      quiz: attempt.quiz._id,
    });

    if (!questionDoc) {
      return res.status(404).json({
        message: "Questions not found for this quiz",
      });
    }

    const review = attempt.answers.map((answer) => {
      const question = questionDoc.questions[answer.questionIndex];

      if (!question) {
        return {
          questionIndex: answer.questionIndex,
          selectedAnswer: answer.selectedAnswer,
          message: "Question not found",
        };
      }

      return {
        questionIndex: answer.questionIndex,
        questionText: question.questionText,
        options: question.options,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        marks: question.marks,
        negativeMarks: question.negativeMarks || 0,
        isCorrect:
          answer.selectedAnswer === question.correctAnswer,
      };
    });

    res.status(200).json({
      attempt: {
        id: attempt._id,
        quiz: attempt.quiz,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        status: attempt.status,
        resultStatus: attempt.resultStatus,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      },
      review,
    });
  } catch (error) {
    console.error("Get attempt error:", error.message);

    res.status(500).json({
      message: "Failed to fetch attempt",
    });
  }
};
export const getAllAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find()
      .populate("user", "name email")
      .populate("quiz", "title category totalMarks")
      .sort({ createdAt: -1 });

    res.status(200).json({
      attempts,
    });
  } catch (error) {
    console.error("Get all attempts error:", error.message);

    res.status(500).json({
      message: "Failed to fetch attempts",
    });
  }
};

export const getAdminAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findById(attemptId)
      .populate("user", "name email")
      .populate(
        "quiz",
        "title description category duration totalMarks passingPercentage"
      );

    if (!attempt) {
      return res.status(404).json({
        message: "Attempt not found",
      });
    }

    const questionDoc = await Question.findOne({
      quiz: attempt.quiz._id,
    });

    if (!questionDoc) {
      return res.status(404).json({
        message: "Questions not found for this quiz",
      });
    }

    const review = attempt.answers.map((answer) => {
      const question =
        questionDoc.questions[answer.questionIndex];

      if (!question) {
        return {
          questionIndex: answer.questionIndex,
          selectedAnswer: answer.selectedAnswer,
          message: "Question not found",
        };
      }

      const isCorrect =
        answer.selectedAnswer ===
        question.correctAnswer;

      return {
        questionIndex: answer.questionIndex,
        questionText: question.questionText,
        options: question.options,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        marks: question.marks,
        negativeMarks: question.negativeMarks || 0,
        isCorrect,
      };
    });

    res.status(200).json({
      attempt: {
        id: attempt._id,
        student: attempt.user,
        quiz: attempt.quiz,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        status: attempt.status,
        resultStatus: attempt.resultStatus,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      },
      review,
    });
  } catch (error) {
    console.error(
      "Get admin attempt error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch attempt details",
    });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Attempt.aggregate([
      {
        $match: {
          status: "COMPLETED",
          resultStatus: { $in: ["PASSED", "FAILED"] },
        },
      },

      {
        $group: {
          _id: "$user",

          quizzesTaken: {
            $sum: 1,
          },

          totalScore: {
            $sum: "$score",
          },

          totalMarks: {
            $sum: "$totalMarks",
          },

          averagePercentage: {
            $avg: "$percentage",
          },

          passedQuizzes: {
            $sum: {
              $cond: [
                { $eq: ["$resultStatus", "PASSED"] },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $unwind: "$user",
      },

      {
        $project: {
          _id: 0,

          userId: "$user._id",
          name: "$user.name",
          email: "$user.email",

          quizzesTaken: 1,
          totalScore: 1,
          totalMarks: 1,
          averagePercentage: {
            $round: ["$averagePercentage", 2],
          },

          passedQuizzes: 1,
        },
      },

      {
        $sort: {
          averagePercentage: -1,
          quizzesTaken: -1,
        },
      },
    ]);

    const rankedLeaderboard = leaderboard.map(
      (student, index) => ({
        rank: index + 1,
        ...student,
      })
    );

    res.status(200).json({
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error(
      "Get leaderboard error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch leaderboard",
    });
  }
};