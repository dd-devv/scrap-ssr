export interface UserCategorys {
  _id: string;
  user: string;
  categorys: [string];
}

export interface HasCategorys {
  hasCategorys: boolean;
}

export interface CategoryTreeRes {
  success: boolean;
  message: string;
  data:    Category[];
}

export interface Category {
  name:          string;
  subcategories: CategorySubcategory[];
}

export interface CategorySubcategory {
  name:          string;
  path:          string[];
  subcategories: SubcategorySubcategory[];
}

export interface SubcategorySubcategory {
  name: string;
  path: string[];
}
