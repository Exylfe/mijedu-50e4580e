import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, icon')
        .order('name');
      if (data) setCategories(data as Category[]);
      setIsLoading(false);
    };
    fetch();
  }, []);

  return { categories, isLoading };
};

export const getProductCategories = async (productId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('product_categories')
    .select('category_id')
    .eq('product_id', productId);
  return data?.map(d => d.category_id) || [];
};

export const setProductCategories = async (productId: string, categoryIds: string[]) => {
  await supabase.from('product_categories').delete().eq('product_id', productId);
  if (categoryIds.length > 0) {
    await supabase.from('product_categories').insert(
      categoryIds.map(cid => ({ product_id: productId, category_id: cid }))
    );
  }
};
