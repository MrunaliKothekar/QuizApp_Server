import Quiz from "../models/Quiz.js";
import Question from "../models/Question.js";

/*
=========================================================
CREATE QUIZ
=========================================================
*/

export const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      totalMarks,
      passingPercentage,
      maxAttempts,
      thumbnail,
      status,
    } = req.body;

    if (
      !title ||
      !category ||
      !difficulty ||
      !duration ||
      !totalMarks ||
      passingPercentage === undefined ||
      !maxAttempts
    ) {
      return res.status(400).json({
        message: "Required quiz fields are missing",
      });
    }

    if (
      passingPercentage < 0 ||
      passingPercentage > 100
    ) {
      return res.status(400).json({
        message: "Passing percentage must be between 0 and 100",
      });
    }

    const quiz = await Quiz.create({
      title,
      description,
      category,
      difficulty,
      duration,
      totalMarks,
      passingPercentage,
      maxAttempts,
      thumbnail: thumbnail || "",
      status: status || "DRAFT",
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: "Quiz created successfully",
      quiz,
    });
  } catch (error) {
    console.error("Create quiz error:", error.message);

    return res.status(500).json({
      message: "Failed to create quiz",
    });
  }
};

/*
=========================================================
GET ALL QUIZZES
=========================================================
*/

export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate("createdBy", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      quizzes,
    });
  } catch (error) {
    console.error(
      "Get quizzes error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch quizzes",
    });
  }
};

/*
=========================================================
GET SINGLE QUIZ
=========================================================
*/

export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("category", "name");

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      quiz,
    });
  } catch (error) {
    console.error(
      "Get quiz error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch quiz",
    });
  }
};



export const getPublishedQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      status: "PUBLISHED",
    })
      .populate("category", "name description")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      quizzes,
    });
  } catch (error) {
    console.error("Get published quizzes error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch published quizzes",
    });
  }
};
/*
=========================================================
UPDATE QUIZ
=========================================================
*/

export const updateQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      totalMarks,
      passingPercentage,
      maxAttempts,
      thumbnail,
      status,
    } = req.body;

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (
      passingPercentage !== undefined &&
      (passingPercentage < 0 || passingPercentage > 100)
    ) {
      return res.status(400).json({
        message: "Passing percentage must be between 0 and 100",
      });
    }

    quiz.title = title ?? quiz.title;
    quiz.description = description ?? quiz.description;
    quiz.category = category ?? quiz.category;
    quiz.difficulty = difficulty ?? quiz.difficulty;
    quiz.duration = duration ?? quiz.duration;
    quiz.totalMarks = totalMarks ?? quiz.totalMarks;
    quiz.passingPercentage =
      passingPercentage ?? quiz.passingPercentage;
    quiz.maxAttempts = maxAttempts ?? quiz.maxAttempts;
    quiz.thumbnail = thumbnail ?? quiz.thumbnail;
    quiz.status = status ?? quiz.status;

    await quiz.save();

    return res.status(200).json({
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (error) {
    console.error("Update quiz error:", error.message);

    return res.status(500).json({
      message: "Failed to update quiz",
    });
  }
};

/*
=========================================================
DELETE QUIZ
=========================================================
*/

export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    // Delete associated question set
    await Question.findOneAndDelete({
      quiz: req.params.id,
    });

    await Quiz.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete quiz error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to delete quiz",
    });
  }
};

/*
=========================================================
TOGGLE PUBLISH / UNPUBLISH
=========================================================
*/

export const toggleQuizPublish = async (
  req,
  res
) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.status === "PUBLISHED") {
      quiz.status = "DRAFT";
    } else {
      quiz.status = "PUBLISHED";
    }

    await quiz.save();

    res.status(200).json({
      message:
        quiz.status === "PUBLISHED"
          ? "Quiz published successfully"
          : "Quiz unpublished successfully",
      quiz,
    });
  } catch (error) {
    console.error(
      "Toggle quiz publish error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to update quiz status",
    });
  }
};

/*
=========================================================
ADD QUESTIONS
=========================================================
*/

export const addQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (
      !questions ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        message:
          "Questions array is required",
      });
    }

    const quiz = await Quiz.findById(
      req.params.quizId
    );

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    let questionSet =
      await Question.findOne({
        quiz: req.params.quizId,
      });

    if (!questionSet) {
      questionSet = await Question.create({
        quiz: req.params.quizId,
        questions: [],
      });
    }

    questionSet.questions.push(
      ...questions
    );

    await questionSet.save();

    res.status(201).json({
      message:
        "Questions added successfully",
      questionSet,
    });
  } catch (error) {
    console.error(
      "Add questions error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to add questions",
    });
  }
};

/*
=========================================================
GET QUESTIONS
=========================================================
*/

export const getQuestions = async (req, res) => {
  try {
    const questionSet = await Question.findOne({
      quiz: req.params.quizId,
    });

    return res.status(200).json({
      questionSet: questionSet || {
        quiz: req.params.quizId,
        questions: [],
      },
    });
  } catch (error) {
    console.error(
      "Get questions error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch questions",
    });
  }
};

/*
=========================================================
UPDATE QUESTION
=========================================================
*/

export const updateQuestion = async (
  req,
  res
) => {
  try {
    const { questionIndex } = req.params;

    const {
      questionText,
      options,
      correctAnswer,
      marks,
      negativeMarks,
    } = req.body;

    const questionSet =
      await Question.findOne({
        quiz: req.params.quizId,
      });

    if (!questionSet) {
      return res.status(404).json({
        message:
          "Questions not found for this quiz",
      });
    }

    const index = Number(questionIndex);

    if (
      Number.isNaN(index) ||
      index < 0 ||
      index >= questionSet.questions.length
    ) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    const question =
      questionSet.questions[index];

    question.questionText =
      questionText ??
      question.questionText;

    question.options =
      options ?? question.options;

    question.correctAnswer =
      correctAnswer ??
      question.correctAnswer;

    question.marks =
      marks ?? question.marks;

    question.negativeMarks =
    negativeMarks ?? question.negativeMarks;

    await questionSet.save();

    res.status(200).json({
      message:
        "Question updated successfully",
      question:
        questionSet.questions[index],
    });
  } catch (error) {
    console.error(
      "Update question error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to update question",
    });
  }
};

/*
=========================================================
DELETE QUESTION
=========================================================
*/

export const deleteQuestion = async (
  req,
  res
) => {
  try {
    const { questionIndex } = req.params;

    const questionSet =
      await Question.findOne({
        quiz: req.params.quizId,
      });

    if (!questionSet) {
      return res.status(404).json({
        message:
          "Questions not found for this quiz",
      });
    }

    const index = Number(questionIndex);

    if (
      Number.isNaN(index) ||
      index < 0 ||
      index >= questionSet.questions.length
    ) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    questionSet.questions.splice(
      index,
      1
    );

    await questionSet.save();

    res.status(200).json({
      message:
        "Question deleted successfully",
      questionSet,
    });
  } catch (error) {
    console.error(
      "Delete question error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to delete question",
    });
  }
};