import asyncHandler from '../../middleware/asyncHandler.js';
import categoryService from './categoryService.js';

export const getCategories = asyncHandler(async (req, res) => {
  const activeOnly = req.query.activeOnly === 'true' || req.user?.role !== 'admin';
  const categories = await categoryService.getCategories({ activeOnly });
  res.status(200).json({
    status: 'success',
    data: { categories },
  });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(parseInt(req.params.id, 10));
  res.status(200).json({
    status: 'success',
    data: { category },
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await categoryService.createCategory({ name, description });
  res.status(201).json({
    status: 'success',
    data: { category },
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;
  const category = await categoryService.updateCategory(parseInt(req.params.id, 10), { name, description, isActive });
  res.status(200).json({
    status: 'success',
    data: { category },
  });
});

export const updateCategoryActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const category = await categoryService.setCategoryActiveStatus(parseInt(req.params.id, 10), Boolean(isActive));
  res.status(200).json({
    status: 'success',
    data: { category },
  });
});

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryActive,
};
