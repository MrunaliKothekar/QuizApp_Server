import User from "../models/User.js";
import Attempt from "../models/Attempt.js";


// =====================================================
// GET ALL STUDENTS
// GET /api/admin/users
// =====================================================

export const getAllStudents = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const searchFilter = {
      role: "STUDENT",
    };

    if (search.trim()) {
      searchFilter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    const students = await User.find(searchFilter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map((student) => student._id);

    // Get completed attempts for all students in one query
    const attempts = await Attempt.find({
      user: { $in: studentIds },
      status: "COMPLETED",
    })
      .select("user percentage score totalMarks")
      .lean();

    // Group attempts by student
    const attemptsByStudent = {};

    for (const attempt of attempts) {
      const userId = attempt.user.toString();

      if (!attemptsByStudent[userId]) {
        attemptsByStudent[userId] = [];
      }

      attemptsByStudent[userId].push(attempt);
    }

    const formattedStudents = students.map((student) => {
      const userAttempts =
        attemptsByStudent[student._id.toString()] || [];

      const percentages = userAttempts.map(
        (attempt) => Number(attempt.percentage) || 0
      );

      const averageScore =
        percentages.length > 0
          ? percentages.reduce((sum, value) => sum + value, 0) /
            percentages.length
          : 0;

      const highestScore =
        percentages.length > 0
          ? Math.max(...percentages)
          : 0;

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        status: student.status,
        createdAt: student.createdAt,

        stats: {
          quizzesAttempted: userAttempts.length,
          averageScore: Number(averageScore.toFixed(2)),
          highestScore: highestScore,
        },
      };
    });

    res.status(200).json({
      totalStudents: formattedStudents.length,
      students: formattedStudents,
    });
  } catch (error) {
    console.error("Get all students error:", error);

    res.status(500).json({
      message: "Failed to fetch students",
      error: error.message,
    });
  }
};


// =====================================================
// GET STUDENT PROFILE
// GET /api/admin/users/:id
// =====================================================

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findOne({
      _id: id,
      role: "STUDENT",
    })
      .select("-password")
      .lean();

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const attempts = await Attempt.find({
      user: student._id,
      status: "COMPLETED",
    })
      .populate("quiz", "title description totalMarks passingMarks")
      .sort({ submittedAt: -1 })
      .lean();

    const percentages = attempts.map(
      (attempt) => Number(attempt.percentage) || 0
    );

    const averageScore =
      percentages.length > 0
        ? percentages.reduce((sum, value) => sum + value, 0) /
          percentages.length
        : 0;

    const highestScore =
      percentages.length > 0
        ? Math.max(...percentages)
        : 0;

    const passedAttempts = attempts.filter(
      (attempt) => attempt.resultStatus === "PASSED"
    ).length;

    const failedAttempts = attempts.filter(
      (attempt) => attempt.resultStatus === "FAILED"
    ).length;

    res.status(200).json({
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        status: student.status,
        createdAt: student.createdAt,
      },

      stats: {
        quizzesAttempted: attempts.length,
        averageScore: Number(averageScore.toFixed(2)),
        highestScore,
        passedAttempts,
        failedAttempts,
      },

      quizHistory: attempts.map((attempt) => ({
        _id: attempt._id,

        quiz: attempt.quiz
          ? {
              _id: attempt.quiz._id,
              title: attempt.quiz.title,
              description: attempt.quiz.description,
              totalMarks: attempt.quiz.totalMarks,
              passingMarks: attempt.quiz.passingMarks,
            }
          : null,

        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        resultStatus: attempt.resultStatus,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      })),
    });
  } catch (error) {
    console.error("Get student error:", error);

    res.status(500).json({
      message: "Failed to fetch student",
      error: error.message,
    });
  }
};


// =====================================================
// ACTIVATE / DEACTIVATE STUDENT
// PATCH /api/admin/users/:id/status
// =====================================================

export const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        message: "Status must be ACTIVE or INACTIVE",
      });
    }

    const student = await User.findOneAndUpdate(
      {
        _id: id,
        role: "STUDENT",
      },
      {
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.status(200).json({
      message:
        status === "ACTIVE"
          ? "Student account activated"
          : "Student account deactivated",

      student,
    });
  } catch (error) {
    console.error("Update student status error:", error);

    res.status(500).json({
      message: "Failed to update student status",
      error: error.message,
    });
  }
};


// =====================================================
// DELETE STUDENT
// DELETE /api/admin/users/:id
// =====================================================

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findOne({
      _id: id,
      role: "STUDENT",
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // Delete the student's quiz attempts first
    await Attempt.deleteMany({
      user: student._id,
    });

    // Delete the student
    await User.deleteOne({
      _id: student._id,
    });

    res.status(200).json({
      message: "Student account deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);

    res.status(500).json({
      message: "Failed to delete student",
      error: error.message,
    });
  }
};