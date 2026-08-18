import categoryRepository from './categoryRepository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors.js';

export const getCategories = async ({ activeOnly = false } = {}) => {
  return await categoryRepository.listCategories({ activeOnly });
};

export const getCategoryById = async (id) => {
  const category = await categoryRepository.findCategoryById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  return category;
};

export const createCategory = async ({ name, description }) => {
  if (!name) {
    throw new BadRequestError('Category name is required');
  }

  const cleanName = name.trim();
  const existing = await categoryRepository.findCategoryByName(cleanName);
  if (existing) {
    throw new ConflictError(`Category with name '${cleanName}' already exists`);
  }

  const id = await categoryRepository.createCategory({ name: cleanName, description: description?.trim() || '' });
  return await categoryRepository.findCategoryById(id);
};

export const updateCategory = async (id, { name, description, isActive }) => {
  const category = await categoryRepository.findCategoryById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  const cleanName = name?.trim() || category.name;
  if (cleanName !== category.name) {
    const existing = await categoryRepository.findCategoryByName(cleanName);
    if (existing && existing.id !== id) {
      throw new ConflictError(`Category name '${cleanName}' is already taken`);
    }
  }

  await categoryRepository.updateCategory(id, {
    name: cleanName,
    description: description !== undefined ? description.trim() : category.description,
    isActive: isActive !== undefined ? Boolean(isActive) : category.is_active,
  });

  return await categoryRepository.findCategoryById(id);
};

export const setCategoryActiveStatus = async (id, isActive) => {
  const category = await categoryRepository.findCategoryById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  await categoryRepository.updateCategoryActiveStatus(id, Boolean(isActive));
  return await categoryRepository.findCategoryById(id);
};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  setCategoryActiveStatus,
};
