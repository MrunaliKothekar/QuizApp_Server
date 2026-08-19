import Category from "../models/Category.js";
import Quiz from "../models/Quiz.js";

export const createCategory = async (req, res) => {
    try{
        const {name ,description} =  req.body;
        
        if(!name){
            return res.status(400).json(
                {message: "Category name is required"}
            );
        }
         
        const existingCategory = await Category.findOne({name});
        if(existingCategory){
            return res.status(400).json(
                {message: "Category already exists"}
            );
        }

        const category = await Category.create({
            name,
            description
        });

        return res.status(201).json({
            message: "Category created successfully",
            category
        });

    } catch (error) {
        res.status(500).json({message: "Error creating category", error});
    }
};

export const getCategories = async (req, res) => {
    try{
        const categories = await Category.find().sort({name :1});

        return res.status(200).json(
            {
                message: "Categories fetched successfully",
                categories
            }
        );
    } catch (error) {
        res.status(500).json(
            {
                message: "Error fetching categories",
                error
            }
        )
    }
};


export const updateCategory =  async (req, res) => {
    try{
        const {name , description} = req.body;

        const category = await Category.findById(req.params.id);

        if(!category){
            return res.status(404).json(
                {message: "Category not found"
                }
            );
        }

        if(name){
            const existingCategory = await Category.findOne({
                name,
                _id: { $ne: req.params.id }
            });
            if(existingCategory){
                return res.status(400).json(
                    {message: "Category already exists"}
                );
            }
            category.name = name;
        }
        
        if(description !== undefined) {
        category.description = description;
        }
        await category.save();

        return res.status(200).json(
            {
                message: "Category updated successfully",
                category
            }
        );  
    }catch(error) {
        res.status(500).json(
            {
                message: "Error updating category",
                error
            }
        );
    }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const quizUsingCategory = await Quiz.findOne({
      category: req.params.id,
    });

    if (quizUsingCategory) {
      return res.status(400).json({
        message: "Category is being used by one or more quizzes",
      });
    }

    await category.deleteOne();

    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error.message);

    res.status(500).json({
      message: "Failed to delete category",
    });
  }
};