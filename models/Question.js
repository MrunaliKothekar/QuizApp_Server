import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      unique: true,
    },

    questions: [
      {
        questionText: {
          type: String,
          required: true,
          trim: true,
        },

        options: {
          type: [String],
          required: true,
          validate: {
            validator: (options) => options.length >= 2,
            message: "A question must have at least 2 options",
          },
        },

        correctAnswer: {
          type: String,
          required: true,
        },

        marks: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
        },

        negativeMarks: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;